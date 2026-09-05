import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 8899);
const BUILD_TOKEN = process.env.APK_BUILD_SERVICE_TOKEN?.trim() || '';
const TEMPLATE_DIR = path.resolve(process.env.APK_TEMPLATE_DIR || path.join(process.cwd(), 'apps/mobile/android'));
const NODE_MODULES_DIR = path.resolve(process.env.APK_NODE_MODULES_DIR || path.join(process.cwd(), 'node_modules'));
const BUILD_ROOT = path.resolve(process.env.APK_BUILD_ROOT || path.join(process.cwd(), '.apk-builds'));
const MAX_HTML_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 300;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_LOG_BYTES = 1_000_000;
const MAX_ACTIVE_BUILDS = Number(process.env.APK_MAX_ACTIVE_BUILDS || 2);
const JOB_TTL_MS = Number(process.env.APK_JOB_TTL_MS || 24 * 60 * 60 * 1000);

const jobs = new Map<string, BuildJob>();

 type BuildStatus = 'queued' | 'building' | 'ready' | 'failed';

type BuildJob = {
  id: string;
  status: BuildStatus;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  logs: string[];
  artifactPath?: string;
  artifactName?: string;
  sha256?: string;
  sizeBytes?: number;
  error?: string;
};

type BuildRequest = {
  projectId: string;
  appName: string;
  packageName: string;
  versionName: string;
  versionCode: number;
  previewHtml: string;
  files?: Array<{ path: string; content: string }>;
};

function now(): string {
  return new Date().toISOString();
}

function json(response: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', Buffer.byteLength(body));
  response.end(body);
}

function text(response: ServerResponse, status: number, body: string, contentType = 'text/plain; charset=utf-8'): void {
  response.statusCode = status;
  response.setHeader('Content-Type', contentType);
  response.setHeader('Content-Length', Buffer.byteLength(body));
  response.end(body);
}

function getBearer(request: IncomingMessage): string {
  const value = request.headers.authorization || '';
  return value.match(/^Bearer\s+(.+)$/i)?.[1] || '';
}

function requireServiceAuth(request: IncomingMessage, response: ServerResponse): boolean {
  if (!BUILD_TOKEN || getBearer(request) !== BUILD_TOKEN) {
    json(response, 401, { error: 'APK build service is not authorized.' });
    return false;
  }
  return true;
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > 12 * 1024 * 1024) throw new Error('Request body is too large.');
    chunks.push(buffer);
  }
  if (chunks.length === 0) return null;
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

function isSafePackageName(value: string): boolean {
  return /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){1,5}$/.test(value);
}

function isSafeRelativeFile(value: string): boolean {
  return value.length > 0 && value.length <= 180 && !value.startsWith('/') && !value.includes('\\') && !value.split('/').includes('..') && /^[a-zA-Z0-9._/-]+$/.test(value);
}

function xmlEscape(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function validateBuildRequest(input: unknown): BuildRequest {
  if (!input || typeof input !== 'object') throw new Error('Invalid build request.');
  const value = input as Record<string, unknown>;
  const projectId = typeof value.projectId === 'string' && /^[a-zA-Z0-9_-]{1,120}$/.test(value.projectId) ? value.projectId : '';
  const appName = typeof value.appName === 'string' ? value.appName.trim() : '';
  const packageName = typeof value.packageName === 'string' ? value.packageName.trim() : '';
  const versionName = typeof value.versionName === 'string' ? value.versionName.trim() : '';
  const versionCode = Number(value.versionCode);
  const previewHtml = typeof value.previewHtml === 'string' ? value.previewHtml : '';
  const files = Array.isArray(value.files) ? value.files : undefined;
  if (!projectId || !appName || appName.length > 48) throw new Error('A valid projectId and appName are required.');
  if (!isSafePackageName(packageName)) throw new Error('Package name must use a valid Android applicationId format.');
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][a-zA-Z0-9.-]+)?$/.test(versionName)) throw new Error('versionName must use semantic version format.');
  if (!Number.isInteger(versionCode) || versionCode < 1 || versionCode > 2_100_000_000) throw new Error('versionCode must be a positive integer.');
  if (!previewHtml || Buffer.byteLength(previewHtml, 'utf8') > MAX_HTML_BYTES) throw new Error('previewHtml is missing or too large.');
  if (files && files.length > MAX_FILES) throw new Error('Too many website files.');
  for (const file of files || []) {
    if (!file || typeof file !== 'object' || typeof file.path !== 'string' || typeof file.content !== 'string' || !isSafeRelativeFile(file.path) || !isAllowedWebsiteFile(file.path)) throw new Error('Website file paths must be safe web assets only.');
    if (Buffer.byteLength(file.content, 'utf8') > MAX_FILE_BYTES) throw new Error('A website file is too large.');
  }
  return { projectId, appName, packageName, versionName, versionCode, previewHtml, files: files as BuildRequest['files'] };
}

function activeBuildCount(): number {
  return [...jobs.values()].filter((job) => job.status === 'queued' || job.status === 'building').length;
}

async function cleanupExpiredJobs(): Promise<void> {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if ((job.status === 'queued' || job.status === 'building') || Date.parse(job.updatedAt) >= cutoff) continue;
    if (job.artifactPath) await rm(job.artifactPath, { force: true }).catch(() => undefined);
    jobs.delete(id);
  }
}

function addLog(job: BuildJob, line: string): void {
  job.logs.push(line.slice(0, 20_000));
  while (Buffer.byteLength(job.logs.join('\n'), 'utf8') > MAX_LOG_BYTES && job.logs.length > 1) job.logs.shift();
  job.updatedAt = now();
}

function isAllowedWebsiteFile(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return !lower.split('/').some((segment) => ['android', 'gradle', 'capacitor', 'manifest', 'local.properties'].includes(segment)) && !lower.endsWith('.keystore') && !lower.endsWith('.jks');
}

async function sha256File(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash('sha256').update(data).digest('hex');
}

async function prepareTemplate(job: BuildJob, input: BuildRequest, workDir: string): Promise<string> {
  const androidDir = path.join(workDir, 'android');
  await cp(TEMPLATE_DIR, androidDir, { recursive: true, force: true });
  await rm(path.join(androidDir, 'local.properties'), { force: true });
  await rm(path.join(androidDir, 'app', 'build'), { recursive: true, force: true });
  const capacitorSettingsPath = path.join(androidDir, 'capacitor.settings.gradle');
  const capacitorSettings = await readFile(capacitorSettingsPath, 'utf8');
  const portableNodeModules = NODE_MODULES_DIR.replaceAll('\\\\', '/');
  await writeFile(capacitorSettingsPath, capacitorSettings.replaceAll("new File('../../../node_modules/", `new File('${portableNodeModules}/`), 'utf8');
  const sdkRoot = process.env.APK_ANDROID_SDK || process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (!sdkRoot || !existsSync(sdkRoot)) throw new Error('Android SDK is not configured for the build worker.');
  await writeFile(path.join(androidDir, 'local.properties'), `sdk.dir=${sdkRoot}\n`, 'utf8');

  const gradlePath = path.join(androidDir, 'app', 'build.gradle');
  const gradle = await readFile(gradlePath, 'utf8');
  await writeFile(gradlePath, gradle
    .replace(/applicationId\s+"[^"]+"/, `applicationId "${input.packageName}"`)
    .replace(/versionCode\s+\d+/, `versionCode ${input.versionCode}`)
    .replace(/versionName\s+"[^"]+"/, `versionName "${input.versionName}"`), 'utf8');

  const stringsPath = path.join(androidDir, 'app', 'src', 'main', 'res', 'values', 'strings.xml');
  const strings = await readFile(stringsPath, 'utf8');
  await writeFile(stringsPath, strings
    .replace(/(<string name="app_name">)[^<]*(<\/string>)/, `$1${xmlEscape(input.appName)}$2`)
    .replace(/(<string name="title_activity_main">)[^<]*(<\/string>)/, `$1${xmlEscape(input.appName)}$2`)
    .replace(/(<string name="package_name">)[^<]*(<\/string>)/, `$1${input.packageName}$2`)
    .replace(/(<string name="custom_url_scheme">)[^<]*(<\/string>)/, `$1${input.packageName}$2`), 'utf8');

  const publicDir = path.join(androidDir, 'app', 'src', 'main', 'assets', 'public');
  await rm(publicDir, { recursive: true, force: true });
  await mkdir(publicDir, { recursive: true });
  const publicRoot = path.resolve(publicDir);
  await writeFile(path.join(publicRoot, 'index.html'), input.previewHtml, 'utf8');
  for (const file of input.files || []) {
    const destination = path.resolve(publicRoot, file.path);
    if (!destination.startsWith(`${publicRoot}${path.sep}`)) throw new Error('Website file path escaped the public asset directory.');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, file.content, 'utf8');
  }
  await writeFile(path.join(androidDir, 'app', 'src', 'main', 'assets', 'capacitor.config.json'), JSON.stringify({ appId: input.packageName, appName: input.appName, webDir: 'public' }, null, 2), 'utf8');
  addLog(job, `[INFO] Prepared isolated Android template for ${input.packageName}.`);
  return androidDir;
}

async function runBuild(job: BuildJob, input: BuildRequest): Promise<void> {
  const workDir = path.join(BUILD_ROOT, job.id);
  const artifactDir = path.join(BUILD_ROOT, 'artifacts');
  try {
    job.status = 'building';
    job.updatedAt = now();
    await mkdir(workDir, { recursive: true });
    await mkdir(artifactDir, { recursive: true });
    const androidDir = await prepareTemplate(job, input, workDir);
    addLog(job, '[INFO] Running Gradle assembleDebug in an isolated workspace.');
    const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    const result = await execFileAsync(gradle, ['assembleDebug', '--no-daemon', '--stacktrace'], { cwd: androidDir, timeout: 12 * 60 * 1000, maxBuffer: 12 * 1024 * 1024 });
    addLog(job, result.stdout || 'Gradle completed.');
    if (result.stderr) addLog(job, result.stderr);
    const sourceApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    const artifactName = `${input.packageName.replaceAll('.', '_')}-v${input.versionName}-debug.apk`;
    const artifactPath = path.join(artifactDir, `${job.id}-${artifactName}`);
    await cp(sourceApk, artifactPath, { force: true });
    const artifactStat = await stat(artifactPath);
    job.artifactPath = artifactPath;
    job.artifactName = artifactName;
    job.sizeBytes = artifactStat.size;
    job.sha256 = await sha256File(artifactPath);
    job.status = 'ready';
    addLog(job, `[SUCCESS] Real APK ready: ${artifactName} (${artifactStat.size} bytes).`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gradle build failed.';
    job.error = message;
    job.status = 'failed';
    addLog(job, `[ERROR] ${message}`);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function publicJob(job: BuildJob): Record<string, unknown> {
  return { id: job.id, status: job.status, createdAt: job.createdAt, updatedAt: job.updatedAt, projectId: job.projectId, appName: job.appName, packageName: job.packageName, versionName: job.versionName, versionCode: job.versionCode, logs: job.logs, artifactName: job.artifactName, sha256: job.sha256, sizeBytes: job.sizeBytes, error: job.error };
}

async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
  await cleanupExpiredJobs();
  if (request.method === 'GET' && request.url === '/health') return json(response, 200, { ok: true, service: 'quantora-gradle-build-worker', templateReady: existsSync(TEMPLATE_DIR), androidSdkConfigured: Boolean(process.env.APK_ANDROID_SDK || process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT), activeBuilds: activeBuildCount() });
  if (!requireServiceAuth(request, response)) return;
  const parsedUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'POST' && parsedUrl.pathname === '/v1/apk-builds') {
    if (activeBuildCount() >= MAX_ACTIVE_BUILDS) return json(response, 429, { error: 'Build queue is full. Try again shortly.' });
    try {
      const input = validateBuildRequest(await readBody(request));
      const id = randomUUID();
      const job: BuildJob = { id, status: 'queued', createdAt: now(), updatedAt: now(), projectId: input.projectId, appName: input.appName, packageName: input.packageName, versionName: input.versionName, versionCode: input.versionCode, logs: [] };
      jobs.set(id, job);
      void runBuild(job, input);
      return json(response, 202, publicJob(job));
    } catch (error) {
      return json(response, 400, { error: error instanceof Error ? error.message : 'Invalid build request.' });
    }
  }
  const match = parsedUrl.pathname.match(/^\/v1\/apk-builds\/([a-f0-9-]+)(\/download)?$/i);
  if (match) {
    const job = jobs.get(match[1]);
    if (!job) return json(response, 404, { error: 'Build job not found.' });
    if (match[2] === '/download') {
      if (job.status !== 'ready' || !job.artifactPath || !job.artifactName) return json(response, 409, { error: 'APK is not ready.', status: job.status });
      const artifact = await readFile(job.artifactPath);
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/vnd.android.package-archive');
      response.setHeader('Content-Disposition', `attachment; filename="${job.artifactName}"`);
      response.setHeader('Content-Length', artifact.byteLength);
      response.end(artifact);
      return;
    }
    return json(response, 200, publicJob(job));
  }
  return json(response, 404, { error: 'Not found.' });
}

if (!BUILD_TOKEN) console.warn('APK_BUILD_SERVICE_TOKEN is not configured; all build endpoints will return 401.');

const server = createServer((request, response) => {
  void handle(request, response).catch((error) => {
    console.error(error);
    json(response, 500, { error: 'Build worker internal error.' });
  });
});

server.listen(PORT, () => console.log(`Quantora Gradle build worker listening on :${PORT}`));
