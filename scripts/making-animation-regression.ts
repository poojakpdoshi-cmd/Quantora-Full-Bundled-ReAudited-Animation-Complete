import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

async function main(): Promise<void> {
  const root = process.cwd();
  const component = await readFile(path.join(root, 'apps/mobile/src/components/MakingAnimation.tsx'), 'utf8');
  const app = await readFile(path.join(root, 'apps/mobile/src/App.tsx'), 'utf8');
  const css = await readFile(path.join(root, 'apps/mobile/src/quantora-indigo-lavender.css'), 'utf8');

  assert.match(component, /aria-live="polite"/);
  assert.match(component, /role="progressbar"/);
  assert.match(component, /Math\.max\(0, Math\.min\(100/);
  assert.match(component, /live build progress from Quantora/);
  assert.match(app, /<MakingAnimation/);
  assert.match(app, /\['queued', 'running'\]\.includes\(activity\.status\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(css, /quantora-making-rotate/);
  assert.doesNotMatch(component, /100% complete/);

  console.log('making-animation-regression: passed');
}

void main();
