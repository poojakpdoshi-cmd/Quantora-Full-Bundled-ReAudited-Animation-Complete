import path from 'node:path';

process.env.OUTPUT_ZIP ||= path.resolve(process.cwd(), 'Quantora-Full-Bundled.zip');
await import('./package-full-bundle.full.js');
