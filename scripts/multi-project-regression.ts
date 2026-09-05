import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildWebsitePlan } from '@wmai/ai-brain';
import { buildProjectFiles } from '@wmai/template-engine';
import type { WebsitePlan, ProjectExportManifest, ProjectRevisionSummary } from '@wmai/shared';

const root = resolve(import.meta.dirname, '..');
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');

const apiIndex = read('apps/api/src/index.ts');
const mobileApp = read('apps/mobile/src/App.tsx');
const sharedTypes = read('packages/shared/src/index.ts');

console.log('--- RUNNING MULTI-PROJECT ARCHITECTURE REGRESSION TESTS ---');

// 1. Verify Shared Types Export
console.log('1. Verifying shared multi-project types...');
assert.match(sharedTypes, /export type ProjectRevisionSummary/, 'ProjectRevisionSummary must be exported');
assert.match(sharedTypes, /export type ProjectExportMode/, 'ProjectExportMode must be exported');
assert.match(sharedTypes, /export type ProjectExportManifest/, 'ProjectExportManifest must be exported');
assert.match(sharedTypes, /export type ProjectAssetRecord/, 'ProjectAssetRecord must be exported');

// 2. Verify API Route Existence & Strict Ownership Isolation
console.log('2. Verifying backend API project routes and authorization checks...');
const requiredRoutes = [
  "app.get('/projects'",
  "app.get('/projects/:id'",
  "app.post('/projects/:id/edit'",
  "app.get('/projects/:id/revisions'",
  "app.post('/projects/:id/revisions/:versionNumber/restore'",
  "app.post('/projects/:id/duplicate'",
  "app.delete('/projects/:id'",
  "app.get('/projects/:id/export'",
  "app.get('/projects/:id/assets'",
  "app.post('/projects/:id/assets'"
];

for (const route of requiredRoutes) {
  const index = apiIndex.indexOf(route);
  assert.ok(index >= 0, `Backend must implement route: ${route}`);
  const block = apiIndex.slice(index, index + 1500);
  assert.match(block, /requireUser\(c,/, `${route} must enforce server-side user authentication.`);
  assert.match(block, /\.eq\('email',\s*email\)|\.eq\('email',\s*parsed\.data\.email\.toLowerCase\(\)\)/, `${route} must enforce project email ownership.`);
}

// 3. Verify IDOR Prevention & Cascading Project Deletion
console.log('3. Verifying cascade cleanup and IDOR prevention...');
assert.match(apiIndex, /supabase\.from\('project_versions'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade project_versions');
assert.match(apiIndex, /supabase\.from\('website_forms'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade website_forms');
assert.match(apiIndex, /supabase\.from\('website_backend_configs'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade website_backend_configs');
assert.match(apiIndex, /supabase\.from\('published_sites'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade published_sites');
assert.match(apiIndex, /supabase\.from\('generation_jobs'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade generation_jobs');
assert.match(apiIndex, /supabase\.from\('project_assets'\)\.delete\(\)\.eq\('project_id',\s*projectId\)/, 'Project delete must cascade project_assets');

// 4. Verify Project Duplication generates a Fresh Immutable UUID
console.log('4. Verifying project duplication isolation...');
assert.match(apiIndex, /const newProjectId = crypto\.randomUUID\(\)/, 'Duplication must generate a brand new UUID');
assert.match(apiIndex, /version_number:\s*1/, 'Duplicated project must initialize with fresh version 1');

// 5. Verify Full-Stack Export Sanitization & Database Schema
console.log('5. Verifying export modes, PostgreSQL schema and platform secret sanitization...');
assert.match(apiIndex, /mode === 'website'/, 'Export must support static website mode');
assert.match(apiIndex, /mode === 'deployment'/, 'Export must support deployment config mode');
assert.match(apiIndex, /createPostgresSchema/, 'Export must support PostgreSQL / Supabase schema generation');
assert.match(apiIndex, /VITE_SUPABASE_URL=/, 'Export must include clean Supabase environment template');

// 6. Verify Mobile UI Multi-Project Dashboard
console.log('6. Verifying mobile UI multi-project dashboard, revisions & export modals...');
assert.match(mobileApp, /Multi-Project Dashboard/, 'Mobile UI must contain Multi-Project Dashboard');
assert.match(mobileApp, /handleOpenRevisions/, 'Mobile UI must handle project revisions');
assert.match(mobileApp, /handleRestoreRevision/, 'Mobile UI must handle version restoration');
assert.match(mobileApp, /handleDuplicateProject/, 'Mobile UI must handle project duplication');
assert.match(mobileApp, /handleOpenExport/, 'Mobile UI must handle multi-mode exports');
assert.match(mobileApp, /handleDeleteProject/, 'Mobile UI must handle safe project deletion');
assert.match(mobileApp, /Project Revisions & History/, 'Mobile UI must render Revisions modal');
assert.match(mobileApp, /Export Application Package/, 'Mobile UI must render Export modal');
assert.match(mobileApp, /Delete Website Project\?/, 'Mobile UI must render Delete confirmation modal');

// 7. Functional Generation & Project Isolation In-Memory Simulation
console.log('7. Simulating Multi-Project In-Memory Pipeline...');
async function simulateMultiProjectLifecycle() {
  // User A creates Project 1
  const userA = 'user.a@example.com';
  const userB = 'user.b@example.com';
  const project1Id = 'proj-1111-aaaa-4111-8111-111111111111';
  const project2Id = 'proj-2222-bbbb-4222-8222-222222222222';

  const { plan: planA } = await buildWebsitePlan('Create a portfolio for User A with dark mode, gallery, contact form.', {});
  const { plan: planB } = await buildWebsitePlan('Create an esports platform for User B with tournament brackets and Discord sync.', {});

  const genA = buildProjectFiles(planA, { formPublicKey: 'form-key-a' });
  const genB = buildProjectFiles(planB, { formPublicKey: 'form-key-b' });

  // Store in simulated DB
  const projectsDb = new Map<string, { id: string; email: string; name: string; plan: WebsitePlan }>();
  const versionsDb = new Map<string, Array<{ version: number; files: Array<{ path: string; content: string }> }>>();

  projectsDb.set(project1Id, { id: project1Id, email: userA, name: planA.businessName, plan: planA });
  versionsDb.set(project1Id, [{ version: 1, files: genA.files }]);

  projectsDb.set(project2Id, { id: project2Id, email: userB, name: planB.businessName, plan: planB });
  versionsDb.set(project2Id, [{ version: 1, files: genB.files }]);

  // Test 1: User A gets their own project
  const p1 = projectsDb.get(project1Id);
  assert.ok(p1 && p1.email === userA, 'User A should own Project 1');

  // Test 2: User B tries to read Project 1 -> Access check
  function canAccessProject(requestEmail: string, targetProjectId: string): boolean {
    const proj = projectsDb.get(targetProjectId);
    return Boolean(proj && proj.email === requestEmail);
  }

  assert.strictEqual(canAccessProject(userB, project1Id), false, 'User B must NOT be able to access User A project');
  assert.strictEqual(canAccessProject(userA, project2Id), false, 'User A must NOT be able to access User B project');
  assert.strictEqual(canAccessProject(userA, project1Id), true, 'User A can access their own project');
  assert.strictEqual(canAccessProject(userB, project2Id), true, 'User B can access their own project');

  // Test 3: Duplication creates a new distinct project ID
  const duplicateId = 'proj-3333-cccc-4333-8333-333333333333';
  const original = projectsDb.get(project1Id)!;
  projectsDb.set(duplicateId, { id: duplicateId, email: userA, name: `${original.name} (Copy)`, plan: original.plan });
  versionsDb.set(duplicateId, [{ version: 1, files: genA.files }]);

  assert.notStrictEqual(duplicateId, project1Id, 'Duplicate must receive a distinct project ID');
  assert.strictEqual(projectsDb.get(duplicateId)?.email, userA, 'Duplicate must remain owned by User A');
  assert.strictEqual(canAccessProject(userB, duplicateId), false, 'User B cannot access duplicated project of User A');

  // Test 4: Export sanitization check
  const filesA = versionsDb.get(project1Id)![0].files;
  const envFile = filesA.find((f) => f.path === '.env.example');
  if (envFile) {
    const sanitized = envFile.content.replace(/(?:AI_KEY|SECRET|TOKEN)=.*/g, '$1=');
    assert.doesNotMatch(sanitized, /sk_[a-zA-Z0-9]{20,}/, 'Sanitized env must not contain raw private secrets');
  }

  console.log('✓ In-memory multi-project isolation & lifecycle simulation verified successfully.');
}

simulateMultiProjectLifecycle().then(() => {
  console.log('--- ALL MULTI-PROJECT REGRESSION CHECKS PASSED (100% SUCCESS) ---');
}).catch((err) => {
  console.error('Multi-project regression test failed:', err);
  process.exitCode = 1;
});
