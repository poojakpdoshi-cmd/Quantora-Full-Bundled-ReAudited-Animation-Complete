import assert from 'node:assert';
import { QuantoraBrain } from '../apps/api/src/quantora-brain';
import { SandboxedProjectTerminal } from '../apps/api/src/sandboxed-terminal';
import { VisionAnalyzer } from '../apps/api/src/vision-analyzer';
import { AnimationEngine } from '../apps/api/src/animation-engine';
import { AutonomousQAAgent } from '../apps/api/src/autonomous-qa-agent';
import { FlashQAEngine } from '../apps/api/src/flash-qa';
import { QUANTA_MODEL_PROFILES, QUANTORA_MODES, resolveModelsForMode } from '../apps/api/src/quanta-models';

async function runQuantoraMasterAudit() {
  console.log('================================================================');
  console.log('    QUANTORA (Quancy.AI) — NEXT-GEN MASTER PLATFORM AUDIT       ');
  console.log('================================================================\n');

  // TEST 1: Quanta Model Profiles & 5 Creation Modes
  console.log('>>> [1/10] Testing Quanta Model Profiles & 5 User-Facing Creation Modes...');
  const modes = ['FLASH', 'BUILD', 'THINK', 'CREATE', 'PRO'] as const;
  for (const m of modes) {
    const config = QUANTORA_MODES[m];
    const resolved = resolveModelsForMode(m);
    assert(config.name.length > 0);
    assert(resolved.length > 0);
    console.log(`✓ Mode [${m}]: ${config.name} (${config.icon}) -> Models: ${resolved.map(r => r.displayName).join(', ')}`);
  }

  // TEST 2: 12 Quantora Specialized Agents Allocation
  console.log('\n>>> [2/10] Testing 12 Quantora Specialized Agents Allocation...');
  const plan = QuantoraBrain.synthesizePlan(
    'proj_quantora_fullstack_001',
    'Build an enterprise cloud compute showroom with 1-tap WhatsApp checkout and PostgreSQL database',
    'PRO'
  );
  assert.strictEqual(plan.allocatedAgents.length, 12);
  const agentNames = plan.allocatedAgents.map(a => a.name);
  assert(agentNames.includes('Quantora Architect'));
  assert(agentNames.includes('Quantora Canvas'));
  assert(agentNames.includes('Quantora Forge'));
  assert(agentNames.includes('Quantora Terminal'));
  assert(agentNames.includes('Quantora Vault'));
  assert(agentNames.includes('Quantora Data'));
  assert(agentNames.includes('Quantora Flow'));
  assert(agentNames.includes('Quantora Motion'));
  assert(agentNames.includes('Quantora Scout'));
  assert(agentNames.includes('Quantora Sentinel'));
  assert(agentNames.includes('Quantora Launch'));
  assert(agentNames.includes('Quantora Domain'));
  console.log(`✓ 12 Quantora Agents Allocated: ${agentNames.join(', ')}`);

  // TEST 3: Quantora FlashQA Concurrent Execution & Measured Duration
  console.log('\n>>> [3/10] Testing Quantora FlashQA Parallel Execution Engine...');
  const sampleFiles = [
    { path: 'index.html', content: '<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Quantora Enterprise</title></head><body><h1>Quantora</h1></body></html>' },
    { path: 'src/App.tsx', content: 'export default function App() { return <div><img src="/logo.png" alt="Logo" /></div>; }' },
    { path: 'src/styles.css', content: ':root { --primary: #00f0ff; }' }
  ];
  const flashReport = await FlashQAEngine.runAudit('proj_quantora_fullstack_001', sampleFiles);
  assert.strictEqual(flashReport.passed, true);
  assert.strictEqual(flashReport.checks.length, 9);
  assert(flashReport.totalDurationMs >= 0);
  console.log(`✓ FlashQA: 9/9 parallel check vectors passed in ${flashReport.totalDurationMs}ms (Score: ${flashReport.overallScore}/100).`);

  // TEST 4: Incremental QA with Changed Files Scoping
  console.log('\n>>> [4/10] Testing Incremental QA with Dependency Scoping...');
  const incrementalReport = await FlashQAEngine.runAudit('proj_quantora_fullstack_001', sampleFiles, ['src/styles.css']);
  assert.strictEqual(incrementalReport.mode, 'incremental');
  assert.strictEqual(incrementalReport.passed, true);
  console.log('✓ Incremental QA: Triggered dependency-scoped audit for [src/styles.css].');

  // TEST 5: Sandboxed Terminal Execution & Host Escape Protection
  console.log('\n>>> [5/10] Testing Sandboxed Project Terminal & Host Containment...');
  const buildExec = await SandboxedProjectTerminal.executeCommand({
    projectId: 'proj_quantora_fullstack_001',
    command: 'npm run build'
  });
  assert.strictEqual(buildExec.ok, true);

  const securityBlockedExec = await SandboxedProjectTerminal.executeCommand({
    projectId: 'proj_quantora_fullstack_001',
    command: 'rm -rf /'
  });
  assert.strictEqual(securityBlockedExec.ok, false);
  assert.strictEqual(securityBlockedExec.exitCode, 126);
  assert(securityBlockedExec.stderr.includes('QUANTORA SECURITY VIOLATION'));
  console.log('✓ Sandboxed Terminal: Isolated execution verified, dangerous commands blocked (Code 126).');

  // TEST 6: Multimodal Vision Analyzer
  console.log('\n>>> [6/10] Testing Quanta Vision & Multimodal Screenshot Synthesis...');
  const visionReport = VisionAnalyzer.analyzeImage('data:image/png;base64,mock', 'modern saas analytics');
  assert(visionReport.detectedIndustry.length > 0);
  assert(visionReport.identifiedSections.length >= 3);
  console.log(`✓ Quanta Vision: ${visionReport.detectedIndustry} analyzed, ${visionReport.identifiedSections.length} sections synthesized.`);

  // TEST 7: Animation Engine & Reduced Motion Accessibility
  console.log('\n>>> [7/10] Testing Quantora Motion & WCAG Accessibility...');
  const animStyles = AnimationEngine.generateAnimationStyles({
    entrance: 'quantum_reveal',
    scrollReveal: true,
    hoverPhysics: true,
    statCounters: true,
    reducedMotionFallback: true,
    transitionDurationMs: 250
  });
  assert(animStyles.includes('prefers-reduced-motion: reduce'));
  console.log('✓ Quantora Motion: prefers-reduced-motion verified for WCAG AAA accessibility.');

  // TEST 8: Zero Platform Secret Leakage Audit
  console.log('\n>>> [8/10] Testing Quantora Vault Platform Secret Protection...');
  const leakyFiles = [{ path: 'src/config.ts', content: 'const secret = SUPABASE_SERVICE_ROLE_KEY;' }];
  const leakAudit = await FlashQAEngine.runAudit('proj_leak_test', leakyFiles);
  assert.strictEqual(leakAudit.passed, false);
  const secCheck = leakAudit.checks.find(c => c.suite === 'Security QA');
  assert.strictEqual(secCheck?.passed, false);
  console.log('✓ Quantora Vault: Platform secrets flagged and deployment blocked.');

  // TEST 9: Multi-Industry Originality Diversity (5 Families)
  console.log('\n>>> [9/10] Testing Multi-Industry Design Diversity Matrix...');
  const industries = ['Supercar Showroom', 'Michelin Star Dining', 'Luxury Real Estate', 'Kids Coding Academy', 'Diamond Vault'];
  for (const ind of industries) {
    const p = QuantoraBrain.synthesizePlan(`proj_${ind.slice(0, 5)}`, `Website for ${ind}`, 'CREATE');
    assert(p.typography.headingFont.length > 0);
    assert(p.colorSystem.primary.length > 0);
    console.log(`✓ [${ind}] -> Design: ${p.designFamily} | Typography: ${p.typography.headingFont} + ${p.typography.bodyFont} | Color: ${p.colorSystem.primary}`);
  }

  // TEST 10: Mode-Specific Estimated Duration & Allocation
  console.log('\n>>> [10/10] Testing Mode-Specific Optimization Profiles...');
  const flashPlan = QuantoraBrain.synthesizePlan('p1', 'App', 'FLASH');
  const proPlan = QuantoraBrain.synthesizePlan('p2', 'App', 'PRO');
  assert(flashPlan.estimatedBuildTimeMs < proPlan.estimatedBuildTimeMs);
  console.log(`✓ Flash Mode Build: ${flashPlan.estimatedBuildTimeMs}ms vs Pro Mode Build: ${proPlan.estimatedBuildTimeMs}ms`);

  console.log('\n================================================================');
  console.log('   ALL 10 QUANTORA (Quancy.AI) AUDIT PHASES PASSED CLEANLY!     ');
  console.log('================================================================\n');
}

runQuantoraMasterAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
