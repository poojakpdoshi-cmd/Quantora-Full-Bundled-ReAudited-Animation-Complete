import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import AdmZip from 'adm-zip';

const rootDir = path.resolve(process.cwd());
const outputZip = path.resolve(process.env.OUTPUT_ZIP || path.join(rootDir, 'Quantora-Full-Bundled.zip'));
const ignored = [
  '**/.git/**', '**/.wrangler/**', '**/.gradle/**', '**/.staging-clean/**', '**/.staging-full/**',
  '**/node_modules/.cache/**', '**/.cxx/**', '**/intermediates/**', '**/.DS_Store',
  '**/.env', '**/.env.production', '**/.env.local', '**/.env.development', '**/.dev.vars', '**/Quantora.zip', '**/Quantora-Full-Bundled.zip',
  '**/local.properties', '**/.apk-builds/**', '**/*.apk', '**/*.aab', '**/*.log', '**/*.pem', '**/*.key', '**/*.p12', '**/*.keystore', '**/*.jks'
];

function forbidden(entryName) {
  const normalized = entryName.replaceAll('\\', '/');
  const parts = normalized.split('/');
  return parts.some(part => part === '.env' || (part.startsWith('.env.') && part !== '.env.example') || part === '.dev.vars' || part === '.git' || part === '.wrangler' || part === '.gradle' || part === 'local.properties' || part === '.apk-builds') || /(^|\/)(?:[^/]+\.(?:apk|aab|log|pem|key|p12|keystore|jks))$/.test(normalized);
}

function createArchive() {
  return new Promise((resolve, reject) => {
    fs.rmSync(outputZip, { force: true });
    const output = fs.createWriteStream(outputZip);
    const archive = archiver('zip', { zlib: { level: 6 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);
    archive.glob('**/*', { cwd: rootDir, dot: true, ignore: ignored });
    void archive.finalize();
  });
}

await createArchive();
const zip = new AdmZip(outputZip);
const files = zip.getEntries().filter(entry => !entry.isDirectory).map(entry => entry.entryName.replaceAll('\\', '/'));
const forbiddenFiles = files.filter(forbidden);
const required = [
  'apps/api/src/index.ts',
  'apps/api/src/lead-routes.ts',
  'apps/api/migrations/0002_leads_and_form_config.sql',
  'apps/mobile/android/app/src/main/assets/public/index.html',
  'node_modules/typescript/bin/tsc',
  'REPAIR_CHANGELOG.md',
  'DEPLOYMENT_INSTRUCTIONS.md'
];
const missing = required.filter(item => !files.includes(item));
if (forbiddenFiles.length || missing.length || files.length < 1000) {
  throw new Error(`Full archive verification failed. files=${files.length}; missing=${missing.join(', ') || 'none'}; forbidden=${forbiddenFiles.slice(0, 10).join(', ') || 'none'}`);
}
console.log(`Full bundled archive created: ${outputZip}`);
console.log(`Files verified: ${files.length}`);
console.log(`Size: ${(fs.statSync(outputZip).size / (1024 * 1024)).toFixed(2)} MB`);
