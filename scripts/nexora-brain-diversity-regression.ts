import assert from 'node:assert/strict';
import { buildWebsitePlan, detectDesignFamily, synthesizeDesignGenome, runVisualQaChecks, DESIGN_FAMILIES } from '../packages/ai-brain/src/index';
import { buildProjectFiles } from '../packages/template-engine/src/index';

async function testDesignBrainDiversity() {
  console.log('Testing Nexora Brain Design Diversity across 8 distinct archetypes...');

  const archetypes = [
    {
      prompt: 'Create a luxury supercar showroom for Apex Motors with high-speed performance stats, circuit booking and VIP concierge.',
      expectedFamily: 'luxury_automotive',
      expectedFont: 'Cinzel',
      expectedThemePrimary: '#d4af37'
    },
    {
      prompt: 'Build a cheerful and modern STEM academy for kids named Little Innovators with courses, robotics workshops and parent reviews.',
      expectedFamily: 'education_kids',
      expectedFont: 'Fredoka',
      expectedThemePrimary: '#f43f5e'
    },
    {
      prompt: 'Design an exquisite fine dining restaurant named Le Miroir with chef tasting menu, candlelight ambiance and online reservation table.',
      expectedFamily: 'fine_dining',
      expectedFont: 'Cormorant Garamond',
      expectedThemePrimary: '#c5a880'
    },
    {
      prompt: 'Create an esports clan and cyberpunk gaming hub for Neon Syndicate with tournament brackets, Twitch squad stream and discord bot.',
      expectedFamily: 'cyberpunk_gaming',
      expectedFont: 'Space Grotesk',
      expectedThemePrimary: '#00f0ff'
    },
    {
      prompt: 'Build a next-gen cloud analytics SaaS platform called CloudPulse with real-time telemetry, API docs and team seat pricing.',
      expectedFamily: 'modern_saas',
      expectedFont: 'Bricolage Grotesque',
      expectedThemePrimary: '#4f46e5'
    },
    {
      prompt: 'Create an ultra-luxury real estate agency named Vanguard Estates with penthouse listings, architectural tours and private broker booking.',
      expectedFamily: 'real_estate',
      expectedFont: 'Playfair Display',
      expectedThemePrimary: '#0f766e'
    },
    {
      prompt: 'Create a personal portfolio for Elena Vance with selected work, case studies, award timeline and collaboration contact.',
      expectedFamily: 'portfolio_personal',
      expectedFont: 'Outfit',
      expectedThemePrimary: '#7c3aed'
    },
    {
      prompt: 'Design a bespoke bridal and couture boutique named Aurelia Atelier with gold jewelry, silk sarees, lookbook and appointments.',
      expectedFamily: 'boutique_fashion',
      expectedFont: 'Bodoni Moda',
      expectedThemePrimary: '#db2777'
    }
  ];

  for (const item of archetypes) {
    const family = detectDesignFamily(item.prompt);
    assert.equal(family, item.expectedFamily, `Failed family detection for: ${item.prompt}`);

    const genome = synthesizeDesignGenome(item.prompt, family);
    assert.ok(genome.typography.headingFont.includes(item.expectedFont), `Typography pairing mismatch for ${family}: expected ${item.expectedFont}, got ${genome.typography.headingFont}`);
    assert.equal(genome.colorSystem.primary, item.expectedThemePrimary, `Theme color mismatch for ${family}`);

    const { plan } = await buildWebsitePlan(item.prompt, {});
    assert.ok(plan.sections.length >= 4, `Plan for ${family} must have at least 4 curated sections`);
    assert.ok(plan.designGenome, `Plan for ${family} must contain a synthesized Design Genome`);

    // Verify Visual QA Engine
    const qa = runVisualQaChecks(plan);
    assert.ok(qa.passed, `Visual QA failed for ${family}`);
    assert.ok(qa.contrastRatio >= 4.5, `Contrast ratio failed for ${family}: ${qa.contrastRatio}`);

    // Build project files and verify unique preview HTML
    const project = buildProjectFiles(plan);
    assert.ok(project.previewHtml.includes(plan.businessName), `Preview HTML missing business name for ${family}`);
    assert.ok(project.previewHtml.includes('fonts.googleapis.com'), `Preview HTML missing Google Fonts link for ${family}`);
    assert.doesNotMatch(project.previewHtml, /NaN|undefined|null/, `Preview HTML contains invalid tokens for ${family}`);

    console.log(`✓ Archetype verified: [${family}] -> ${plan.businessName} (${genome.brandPersonality})`);
  }

  console.log('All 8 Design Brain Archetypes verified successfully!');
}

async function main() {
  await testDesignBrainDiversity();
  console.log('Nexora Brain Diversity & Live Creation Regression Passed with 100% success.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
