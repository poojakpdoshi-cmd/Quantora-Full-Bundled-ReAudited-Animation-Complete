import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

const rootDir = path.resolve(process.cwd());
const tempDir = path.join(rootDir, '.staging-clean');
const outputZip = path.resolve(process.env.OUTPUT_ZIP || path.join(rootDir, 'Quantora.zip'));

const excludeNames = new Set([
  'node_modules', 'dist', '.wrangler', '.env', '.env.production', '.dev.vars', '.git', '.gradle', 'build', '.apk-builds', 'local.properties', '.DS_Store', '.staging-clean', 'quantora-release.zip', 'Quantora.zip', 'quantora-demo-real-gradle.apk'
]);

function shouldExclude(relPath) {
  const parts = relPath.split(path.sep);
  return parts.some((part) => excludeNames.has(part) || part.endsWith('.dev.vars') || part.endsWith('.apk') || part.endsWith('.log') || part.endsWith('.pem') || part.endsWith('.key') || part.endsWith('.keystore') || part.endsWith('.jks') || (part.startsWith('.env') && !part.endsWith('.example')));
}

function copyClean(source, target) {
  const relative = path.relative(rootDir, source);
  if (relative && shouldExclude(relative)) return;
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const child of fs.readdirSync(source)) copyClean(path.join(source, child), path.join(target, child));
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function listFiles(directory, prefix = '') {
  const entries = [];
  for (const name of fs.readdirSync(directory)) {
    const absolute = path.join(directory, name);
    const relative = path.join(prefix, name);
    if (fs.statSync(absolute).isDirectory()) entries.push(...listFiles(absolute, relative));
    else entries.push(relative.replaceAll(path.sep, '/'));
  }
  return entries;
}

function createArchive(sourceDir, destination) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(destination);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    void archive.finalize();
  });
}

try {
  console.log('1. Preparing staging directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(outputZip, { force: true });
  fs.mkdirSync(tempDir, { recursive: true });
  copyClean(rootDir, tempDir);

  console.log('2. Creating clean ZIP archive...');
  await createArchive(tempDir, outputZip);

  console.log('3. Verifying archive contents...');
  const expectedFiles = listFiles(tempDir);
  const zip = new AdmZip(outputZip);
  const actualFiles = zip.getEntries().filter((entry) => !entry.isDirectory).map((entry) => entry.entryName.replaceAll('\\', '/'));
  const missingFiles = expectedFiles.filter((file) => !actualFiles.includes(file));
  const forbiddenFiles = actualFiles.filter((file) => shouldExclude(file.replaceAll('/', path.sep)));
  if (missingFiles.length || forbiddenFiles.length || !actualFiles.length) {
    throw new Error(`Archive verification failed. Missing: ${missingFiles.slice(0, 5).join(', ') || 'none'}; forbidden: ${forbiddenFiles.slice(0, 5).join(', ') || 'none'}.`);
  }

  fs.rmSync(tempDir, { recursive: true, force: true });
  const sizeMb = (fs.statSync(outputZip).size / (1024 * 1024)).toFixed(2);
  console.log(`DONE: ${outputZip}`);
  console.log(`Files verified: ${actualFiles.length}`);
  console.log(`Size: ${sizeMb} MB`);
} catch (error) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
