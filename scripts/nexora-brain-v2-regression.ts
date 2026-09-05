import assert from 'node:assert/strict';
import {
  builtInPlan,
  extractDesignDirective,
  synthesizeDesignGenome,
  evaluateOriginality,
  recomposeAntiTemplate,
  computeDesignFingerprint,
  runVisualQaChecks
} from '../packages/ai-brain/src/index';
import { buildProjectFiles, isFunctionalProject } from '../packages/template-engine/src/index';
import type { DesignFingerprint, WebsitePlan } from '../packages/shared/src/index';

console.log('=== RUNNING NEXORA BRAIN 2.0 & ORIGINALITY ENGINE REGRESSION TESTS ===');

// 1. Verify 12 Distinct Industries with Dedicated Archetypes, Layouts, & Hero Strategies
console.log('1. Testing 12 distinct industries across diverse creative directives...');

const testCases = [
  {
    name: 'Luxury Automotive',
    prompt: 'Create a cinematic supercar showroom for Apex Motors with aerodynamic track records and private VIP viewings.',
    expectedFamily: 'luxury_automotive',
    expectedHero: 'cinematic_fullscreen',
    expectedMotion: 'cinematic'
  },
  {
    name: 'Education & Kids',
    prompt: 'Build a vibrant STEM academy website for Little Innovators with parent enrollment and syllabus overview.',
    expectedFamily: 'education_kids',
    expectedHero: 'split_screen',
    expectedMotion: 'playful'
  },
  {
    name: 'Fine Dining Restaurant',
    prompt: 'Design an intimate fine dining culinary bistro for Le Miroir with chef tasting menu and sensorial atmosphere.',
    expectedFamily: 'fine_dining',
    expectedHero: 'split_screen',
    expectedMotion: 'subtle'
  },
  {
    name: 'Esports & Cyberpunk Gaming',
    prompt: 'Create a cyberpunk tournament hub for Neon Syndicate with live brackets and roster showcase.',
    expectedFamily: 'cyberpunk_gaming',
    expectedHero: 'interactive_stager',
    expectedMotion: 'energetic'
  },
  {
    name: 'Developer Portfolio',
    prompt: 'Build a minimalist case study portfolio for Elena Vance featuring technical architecture and keynote speeches.',
    expectedFamily: 'portfolio_personal',
    expectedHero: 'typography_only',
    expectedMotion: 'minimal'
  },
  {
    name: 'Modern SaaS Platform',
    prompt: 'Create a developer-first cloud automation SaaS for CloudPulse with interactive API metrics and pricing tiers.',
    expectedFamily: 'modern_saas',
    expectedHero: 'product_showcase',
    expectedMotion: 'futuristic'
  },
  {
    name: 'Luxury Real Estate',
    prompt: 'Design an architectural luxury villa portal for Vanguard Estates with private viewings and listings.',
    expectedFamily: 'real_estate',
    expectedHero: 'image_led',
    expectedMotion: 'premium'
  },
  {
    name: 'Boutique Fashion Atelier',
    prompt: 'Create an haute couture lookbook for Aurelia Atelier featuring bespoke royal bridal fitting.',
    expectedFamily: 'boutique_fashion',
    expectedHero: 'split_screen',
    expectedMotion: 'editorial'
  },
  {
    name: 'Healthcare Clinic',
    prompt: 'Build a modern pediatric wellness clinic website for BrightCare Health with accredited doctors and patient care.',
    expectedFamily: 'healthcare_clinic',
    expectedHero: 'split_screen',
    expectedMotion: 'subtle'
  },
  {
    name: 'Travel & Hospitality',
    prompt: 'Design an exotic island resort retreat for Solaria Haven with luxury villa packages and island safari.',
    expectedFamily: 'travel_hospitality',
    expectedHero: 'image_led',
    expectedMotion: 'premium'
  },
  {
    name: 'Fine Art & Creative Studio',
    prompt: 'Create a visionary brand redesign agency website for Lumina Design Studio with case study showcases.',
    expectedFamily: 'creative_studio',
    expectedHero: 'image_led',
    expectedMotion: 'editorial'
  },
  {
    name: 'Non-Profit / Corporate Advisory',
    prompt: 'Build a global strategic advisory website for Atlas Advisory Group with corporate governance insights.',
    expectedFamily: 'corporate_general',
    expectedHero: 'cinematic_fullscreen',
    expectedMotion: 'subtle'
  }
];

const historicalFingerprints: DesignFingerprint[] = [];
const seenHeroes = new Set<string>();
const seenLayouts = new Set<string>();
const seenTypo = new Set<string>();

for (const tc of testCases) {
  const plan = builtInPlan(tc.prompt);
  const directive = plan.designDirective;
  assert.ok(directive, `${tc.name}: Must produce structured Design Directive`);
  assert.equal(plan.designGenome?.family, tc.expectedFamily, `${tc.name}: Family mismatch`);
  assert.equal(directive.heroStrategy, tc.expectedHero, `${tc.name}: Hero strategy mismatch`);
  assert.equal(directive.motionStrategy, tc.expectedMotion, `${tc.name}: Motion strategy mismatch`);

  assert.ok(plan.sections.length >= 4, `${tc.name}: Must have at least 4 sections`);
  assert.ok(plan.visualQaReport?.passed, `${tc.name}: Visual QA must pass with WCAG AA compliance`);
  assert.ok(plan.originalityReport?.isOriginal, `${tc.name}: Originality check must pass (score >= 80)`);
  assert.ok(plan.fingerprint?.fingerprintId, `${tc.name}: Must generate design fingerprint`);

  seenHeroes.add(directive.heroStrategy);
  seenLayouts.add(directive.layoutArchitecture);
  seenTypo.add(directive.typographyStrategy.pairingName);
  historicalFingerprints.push(plan.fingerprint);

  // Verify template engine compilation
  const project = buildProjectFiles(plan);
  assert.ok(project.files.length >= 8, `${tc.name}: Project files must be generated`);
  const appJsx = project.files.find((f) => f.path === 'src/App.jsx')?.content || '';
  if (!isFunctionalProject(plan)) {
    assert.match(appJsx, /heroStyle/, `${tc.name}: App.jsx must bind heroStyle`);
    assert.match(appJsx, /navStyle/, `${tc.name}: App.jsx must bind navStyle`);
    assert.ok(appJsx.includes(`"heroStrategy": "${directive.heroStrategy}"`), `${tc.name}: App.jsx must serialize heroStrategy in plan`);
  }

  console.log(`✓ [${tc.name}] -> Family: ${tc.expectedFamily} | Hero: ${directive.heroStrategy} | Arch: ${directive.layoutArchitecture} | Originality: ${plan.originalityReport.originalityScore}%`);
}

// 2. Diversity Assertions
console.log('2. Verifying diversity metrics across test suite...');
assert.ok(seenHeroes.size >= 5, `Hero diversity must produce at least 5 distinct heroes across suite, got ${seenHeroes.size}`);
assert.ok(seenLayouts.size >= 5, `Layout diversity must produce at least 5 distinct architectures across suite, got ${seenLayouts.size}`);
assert.ok(seenTypo.size >= 6, `Typography diversity must produce at least 6 distinct font pairings across suite, got ${seenTypo.size}`);
console.log(`✓ Hero strategies variety: ${seenHeroes.size} unique layouts`);
console.log(`✓ Layout architecture variety: ${seenLayouts.size} unique architectures`);
console.log(`✓ Typography pairings variety: ${seenTypo.size} unique font pairings`);

// 3. Originality & Template Similarity Engine Testing
console.log('3. Testing Originality Engine & Similarity Evaluation...');

// Deliberately create a generic plan to test weak section detection
const genericPlan: WebsitePlan = {
  businessName: 'Generic Co',
  websiteType: 'general',
  tagline: 'We do things for people.',
  pages: ['home', 'about', 'contact'],
  features: ['responsive', 'fast'],
  theme: { style: 'plain', primary: '#112233', secondary: '#445566', background: '#090b10', text: '#ffffff' },
  sections: [
    { title: 'About Us', body: 'We are a company.', layoutVariant: 'cards' },
    { title: 'Our Services', body: 'We provide generic services.', layoutVariant: 'cards' },
    { title: 'Section 3', body: 'Another section here.', layoutVariant: 'cards' }
  ],
  appSpec: {
    schemaVersion: 1,
    projectKind: 'landing',
    title: 'Generic Co',
    summary: 'Generic test',
    screens: [],
    entities: [],
    calculations: [],
    globalActions: [],
    dataDependencies: [],
    acceptanceCriteria: [],
    persistenceRequired: false,
    realTimeRequired: false,
    responsiveRequirements: [],
    backend: { required: false, authentication: [], collections: [], indexes: [], storage: [], functions: [], environmentVariables: [] }
  }
};

const initialEval = evaluateOriginality(genericPlan);
assert.equal(initialEval.isOriginal, false, 'Generic boilerplate plan must be flagged as NOT original');
assert.ok(initialEval.weakSections.length >= 2, 'Must flag at least 2 weak generic sections');
console.log(`✓ Weak generic plan correctly flagged with low originality score (${initialEval.originalityScore}%) and ${initialEval.weakSections.length} weak sections.`);

// Test Anti-Template Recomposition
console.log('4. Testing Anti-Template Recomposition Engine...');
const recomposed = recomposeAntiTemplate(genericPlan, initialEval);
assert.ok(recomposed.sections[0].layoutVariant !== recomposed.sections[1].layoutVariant, 'Recomposition must vary section layouts');
assert.ok(recomposed.sections[0].highlights && recomposed.sections[0].highlights.length > 0, 'Recomposition must inject highlight pills');
console.log('✓ Anti-Template Recomposition successfully elevated weak sections and restored diversity.');

// 5. "Surprise Me" Exploratory Mode Testing
console.log('5. Testing "Surprise Me" Mode...');
const surprisePlan = builtInPlan('Surprise me! Make it unique and radical for an indie game studio named VoidWarp.');
assert.ok(surprisePlan.designDirective?.brandPersonality.includes('Experimental'), 'Surprise me mode must inject exploratory personality');
assert.ok(surprisePlan.visualQaReport?.passed, 'Surprise me plan must still satisfy Visual QA and WCAG AA');
assert.ok(surprisePlan.originalityReport?.isOriginal, 'Surprise me plan must score high on originality');
console.log(`✓ "Surprise Me" mode verified: Personality="${surprisePlan.designDirective?.brandPersonality.slice(0, 40)}...", Hero=${surprisePlan.designDirective?.heroStrategy}`);

console.log('=== ALL NEXORA BRAIN 2.0 & ORIGINALITY ENGINE REGRESSION TESTS PASSED (100% SUCCESS) ===');
