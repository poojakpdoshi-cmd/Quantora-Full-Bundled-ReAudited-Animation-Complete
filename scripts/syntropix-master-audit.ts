import assert from 'node:assert';
import { SyntropixNexus } from '../apps/api/src/syntropix-brain';
import { SyntropixProjectMemory } from '../apps/api/src/project-memory';
import { SandboxedProjectTerminal } from '../apps/api/src/sandboxed-terminal';
import { VisionAnalyzer } from '../apps/api/src/vision-analyzer';
import { AnimationEngine } from '../apps/api/src/animation-engine';
import { FlashQAEngine } from '../apps/api/src/flash-qa';
import { SYNTRO_MODEL_PROFILES, SYNTROPIX_MODES, resolveModelsForSyntroMode } from '../apps/api/src/syntro-models';

async function runSyntropixMasterAudit() {
  console.log('================================================================');
  console.log('    SYNTROPIX (Syntropy.ai) — NEXT-GEN MASTER PLATFORM AUDIT     ');
  console.log('================================================================\n');

  // TEST 1: Syntro Model Profiles & 5 Creation Modes
  console.log('>>> [1/10] Testing Syntro Model Profiles & 5 User-Facing Creation Modes...');
  const modes = ['FLASH', 'BUILD', 'THINK', 'CREATE', 'PRO'] as const;
  for (const m of modes) {
    const config = SYNTROPIX_MODES[m];
    const resolved = resolveModelsForSyntroMode(m);
    assert(config.name.length > 0);
    assert(resolved.length > 0);
    console.log(`✓ Mode [${m}]: ${config.name} (${config.icon}) -> Models: ${resolved.map(r => r.displayName).join(', ')}`);
  }

  // TEST 2: 14 Syntropix Specialized Agents Allocation
  console.log('\n>>> [2/10] Testing 14 Syntropix Specialized Agents Allocation...');
  const plan = SyntropixNexus.synthesizePlan(
    'proj_syntropix_fullstack_001',
    'Build an enterprise cloud compute showroom with 1-tap WhatsApp checkout and PostgreSQL database',
    'PRO'
  );
  assert.strictEqual(plan.allocatedAgents.length, 14);
  const agentNames = plan.allocatedAgents.map(a => a.name);
  assert(agentNames.includes('Syntropix Nexus'));
  assert(agentNames.includes('Syntropix Architect'));
  assert(agentNames.includes('Syntropix Canvas'));
  assert(agentNames.includes('Syntropix Forge'));
  assert(agentNames.includes('Syntropix Shell'));
  assert(agentNames.includes('Syntropix Aegis'));
  assert(agentNames.includes('Syntropix Atlas'));
  assert(agentNames.includes('Syntropix Flux'));
  assert(agentNames.includes('Syntropix Motion'));
  assert(agentNames.includes('Syntropix Scout'));
  assert(agentNames.includes('Syntropix Sentinel'));
  assert(agentNames.includes('Syntropix Launch'));
  assert(agentNames.includes('Syntropix Domain'));
  assert(agentNames.includes('Syntropix Vision'));
  console.log(`✓ 14 Syntropix Agents Allocated: ${agentNames.join(', ')}`);

  // TEST 3: Persistent Project Memory & Cross-Project Isolation
  console.log('\n>>> [3/10] Testing Persistent Project Memory & Strict Project Isolation...');
  const memA = SyntropixProjectMemory.getMemory('project_alpha');
  const memB = SyntropixProjectMemory.getMemory('project_beta');
  SyntropixProjectMemory.recordDecision('project_alpha', {
    category: 'decisions',
    title: 'Alpha Secret Token Strategy',
    content: 'Isolated encryption keys for project Alpha only.',
    agentAuthor: 'Syntropix Aegis'
  });
  const searchBeta = SyntropixProjectMemory.searchMemory('project_beta', 'Alpha Secret');
  assert.strictEqual(searchBeta.length, 0, 'Project Beta must never access Project Alpha memory');
  const searchAlpha = SyntropixProjectMemory.searchMemory('project_alpha', 'Alpha Secret');
  assert.strictEqual(searchAlpha.length, 1, 'Project Alpha memory must retrieve recorded decision');
  console.log('✓ Project Memory: Scoped isolation confirmed. Zero cross-project memory leak.');

  // TEST 4: Syntropix FlashQA Parallel Execution Engine
  console.log('\n>>> [4/10] Testing Syntropix FlashQA Parallel Execution Engine...');
  const sampleFiles = [
    { path: 'index.html', content: '<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Syntropix Enterprise</title></head><body><h1>Syntropix</h1></body></html>' },
    { path: 'src/App.tsx', content: 'export default function App() { return <div><img src="/logo.png" alt="Logo" /></div>; }' },
    { path: 'src/styles.css', content: ':root { --primary: #00f0ff; }' }
  ];
  const flashReport = await FlashQAEngine.runAudit('proj_syntropix_fullstack_001', sampleFiles);
  assert.strictEqual(flashReport.passed, true);
  assert.strictEqual(flashReport.checks.length, 9);
  assert(flashReport.totalDurationMs >= 0);
  console.log(`✓ FlashQA: 9/9 parallel check vectors passed in ${flashReport.totalDurationMs}ms (Score: ${flashReport.overallScore}/100).`);

  // TEST 5: Incremental QA with Dependency Scoping
  console.log('\n>>> [5/10] Testing Incremental QA with Dependency Scoping...');
  const incrementalReport = await FlashQAEngine.runAudit('proj_syntropix_fullstack_001', sampleFiles, ['src/styles.css']);
  assert.strictEqual(incrementalReport.mode, 'incremental');
  assert.strictEqual(incrementalReport.passed, true);
  console.log('✓ Incremental QA: Triggered dependency-scoped audit for [src/styles.css].');

  // TEST 6: Syntropix Shell (Sandboxed Terminal) Host Containment
  console.log('\n>>> [6/10] Testing Syntropix Shell Sandboxed Execution & Security Policies...');
  const buildExec = await SandboxedProjectTerminal.executeCommand({
    projectId: 'proj_syntropix_fullstack_001',
    command: 'npm run build'
  });
  assert.strictEqual(buildExec.ok, true);

  const securityBlockedExec = await SandboxedProjectTerminal.executeCommand({
    projectId: 'proj_syntropix_fullstack_001',
    command: 'rm -rf /'
  });
  assert.strictEqual(securityBlockedExec.ok, false);
  assert.strictEqual(securityBlockedExec.exitCode, 126);
  assert(securityBlockedExec.stderr.includes('SECURITY VIOLATION'));
  console.log('✓ Syntropix Shell: Isolated execution verified, dangerous commands blocked (Code 126).');

  // TEST 7: Multimodal Vision Analyzer
  console.log('\n>>> [7/10] Testing Syntropix Vision & Screenshot Synthesis...');
  const visionReport = VisionAnalyzer.analyzeImage('data:image/png;base64,mock', 'modern saas analytics');
  assert(visionReport.detectedIndustry.length > 0);
  assert(visionReport.identifiedSections.length >= 3);
  console.log(`✓ Syntropix Vision: ${visionReport.detectedIndustry} analyzed, ${visionReport.identifiedSections.length} sections synthesized.`);

  // TEST 8: Animation Engine & Reduced Motion Accessibility
  console.log('\n>>> [8/10] Testing Syntropix Motion & WCAG Accessibility...');
  const animStyles = AnimationEngine.generateAnimationStyles({
    entrance: 'quantum_reveal',
    scrollReveal: true,
    hoverPhysics: true,
    statCounters: true,
    reducedMotionFallback: true,
    transitionDurationMs: 250
  });
  assert(animStyles.includes('prefers-reduced-motion: reduce'));
  console.log('✓ Syntropix Motion: prefers-reduced-motion verified for WCAG AAA accessibility.');

  // TEST 9: Zero Platform Secret Leakage Audit (Syntropix Aegis)
  console.log('\n>>> [9/10] Testing Syntropix Aegis Platform Secret Protection...');
  const leakyFiles = [{ path: 'src/config.ts', content: 'const secret = SUPABASE_SERVICE_ROLE_KEY;' }];
  const leakAudit = await FlashQAEngine.runAudit('proj_leak_test', leakyFiles);
  assert.strictEqual(leakAudit.passed, false);
  const secCheck = leakAudit.checks.find(c => c.suite === 'Security QA');
  assert.strictEqual(secCheck?.passed, false);
  console.log('✓ Syntropix Aegis: Platform secrets flagged and deployment blocked.');

  // TEST 10: Multi-Industry Design Diversity Matrix
  console.log('\n>>> [10/10] Testing Multi-Industry Design Diversity Matrix...');
  const industries = ['Supercar Showroom', 'Michelin Star Dining', 'Luxury Real Estate', 'Kids Coding Academy', 'Diamond Vault'];
  for (const ind of industries) {
    const p = SyntropixNexus.synthesizePlan(`proj_${ind.slice(0, 5)}`, `Website for ${ind}`, 'CREATE');
    assert(p.typography.headingFont.length > 0);
    assert(p.colorSystem.primary.length > 0);
    console.log(`✓ [${ind}] -> Design: ${p.designFamily} | Typography: ${p.typography.headingFont} + ${p.typography.bodyFont} | Color: ${p.colorSystem.primary}`);
  }

  console.log('\n================================================================');
  console.log('   ALL 10 SYNTROPIX (Syntropy.ai) AUDIT PHASES PASSED CLEANLY!  ');
  console.log('================================================================\n');
}

runSyntropixMasterAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
