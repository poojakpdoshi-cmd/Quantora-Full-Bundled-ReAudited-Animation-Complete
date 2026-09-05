import { buildWebsitePlan } from '../packages/ai-brain/src/index';

const prompts = [
  { name: '1. Luxury Car Showroom', prompt: 'Create a luxury supercar showroom for Apex Motors with high-speed performance stats, circuit booking and VIP concierge.' },
  { name: "2. Children's Education Platform", prompt: 'Build a cheerful and modern STEM academy for kids named Little Innovators with courses, robotics workshops and parent reviews.' },
  { name: '3. Restaurant', prompt: 'Design an exquisite fine dining restaurant named Le Miroir with chef tasting menu, candlelight ambiance and online reservation table.' },
  { name: '4. Gaming / Esports Platform', prompt: 'Create an esports clan and cyberpunk gaming hub for Neon Syndicate with tournament brackets, Twitch squad stream and discord bot.' },
  { name: '5. Developer Portfolio', prompt: 'Create a personal developer portfolio for Maya Rao with selected work, case studies, tech stack and contact.' },
  { name: '6. SaaS Startup', prompt: 'Build a next-gen cloud analytics SaaS platform called CloudPulse with real-time telemetry, API docs and team seat pricing.' },
  { name: '7. Real Estate Company', prompt: 'Create an ultra-luxury real estate agency named Vanguard Estates with penthouse listings, architectural tours and private broker booking.' },
  { name: '8. Fashion Brand', prompt: 'Design a bespoke bridal and couture boutique named Aurelia Atelier with gold jewelry, silk sarees, lookbook and appointments.' }
];

async function run() {
  for (const item of prompts) {
    const { plan } = await buildWebsitePlan(item.prompt, {});
    console.log(`=======================================================`);
    console.log(`ARCHETYPE: ${item.name}`);
    console.log(`BUSINESS NAME: ${plan.businessName}`);
    console.log(`DESIGN FAMILY: ${plan.designGenome?.family}`);
    console.log(`VISUAL STYLE: ${plan.designGenome?.visualStyle}`);
    console.log(`BRAND PERSONALITY: ${plan.designGenome?.brandPersonality}`);
    console.log(`TYPOGRAPHY: ${plan.designGenome?.typography.fontPairingName} (Heading: ${plan.designGenome?.typography.headingFont})`);
    console.log(`SPACING SCALE: ${plan.designGenome?.spacingScale}`);
    console.log(`LAYOUT ARCHITECTURE: ${plan.designGenome?.layoutArchitecture}`);
    console.log(`COMPONENT STYLE: ${plan.designGenome?.componentStyle}`);
    console.log(`PRIMARY COLOR: ${plan.designGenome?.colorSystem.primary} | SECONDARY: ${plan.designGenome?.colorSystem.secondary} | BG: ${plan.designGenome?.colorSystem.background}`);
    console.log(`SECTIONS (${plan.sections.length}):`);
    plan.sections.forEach((sec, idx) => {
      console.log(`  [${idx + 1}] (${sec.layoutVariant}) "${sec.title}" — Badge: "${sec.badge}" | Highlights: ${sec.highlights?.join(', ')}`);
    });
    console.log(`FEATURES: ${plan.features.join(', ')}`);
    console.log(`VISUAL QA RESULT: ${plan.visualQaReport?.passed ? 'PASSED' : 'FAILED'} (Contrast Ratio: ${plan.visualQaReport?.contrastRatio}, Standard: ${plan.visualQaReport?.contrastStandard})`);
    console.log(``);
  }
}

run().catch(console.error);
