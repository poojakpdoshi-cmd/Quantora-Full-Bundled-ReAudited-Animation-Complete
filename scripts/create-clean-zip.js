import path from 'node:path';

process.env.OUTPUT_ZIP ||= path.resolve(process.env.HOME || process.cwd(), 'Quantora-Official-Gmail-OTP-Clean.zip');
await import('./package-clean-distribution.js');
