import assert from 'node:assert/strict';
import { buildProjectFiles } from '../packages/template-engine/src/index';
import type { WebsitePlan } from '../packages/shared/src/index';

const plan: WebsitePlan = {
  businessName: 'Aurora Jewels',
  websiteType: '5D luxury boutique',
  tagline: 'A spatial jewellery experience with procedural glass and scroll scenes.',
  pages: ['home', 'collections', 'contact'],
  features: ['5d', 'immersive', 'contact-form', 'whatsapp'],
  theme: { style: 'liquid glass', primary: '#38bdf8', secondary: '#a78bfa', background: '#050b14', text: '#f8fafc' },
  sections: [{ title: 'Spatial collection', body: 'Explore the collection through depth, time, and optional sensory response.' }],
  contact: { phone: '+919876543210', email: 'hello@example.com' },
  appSpec: {
    schemaVersion: 1,
    projectKind: 'marketing_website',
    title: 'Aurora Jewels',
    summary: 'Spatial luxury website',
    screens: [],
    entities: [],
    calculations: [],
    globalActions: [],
    dataDependencies: [],
    acceptanceCriteria: [],
    persistenceRequired: false,
    realTimeRequired: false,
    responsiveRequirements: ['mobile'],
    backend: { required: false, authentication: [], collections: [], indexes: [], storage: [], functions: [], environmentVariables: [] },
    forbiddenMarketingSections: []
  }
};

const generated = buildProjectFiles(plan);
const source = generated.files.find(file => file.path === 'src/App.jsx')?.content || '';
const styles = generated.files.find(file => file.path === 'src/styles.css')?.content || '';
assert.match(source, /SpatialRuntime/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /deviceorientation/);
assert.match(source, /IntersectionObserver/);
assert.match(styles, /spatial-runtime/);
assert.match(generated.previewHtml, /spatial-runtime/);
assert.match(generated.previewHtml, /Procedural/);
console.log(JSON.stringify({ ok: true, spatialSourceBytes: source.length, previewBytes: generated.previewHtml.length, fileCount: generated.files.length }));
