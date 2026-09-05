export type ProjectKind =
  | 'marketing_website'
  | 'portfolio'
  | 'dashboard'
  | 'calculator'
  | 'crud_application'
  | 'admin_panel'
  | 'ecommerce_application'
  | 'booking_system'
  | 'management_system'
  | 'functional_application';

export type PrimitiveFieldType =
  | 'text'
  | 'long_text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'email'
  | 'phone'
  | 'url'
  | 'select'
  | 'reference';

export type AppSpecField = {
  key: string;
  label: string;
  type: PrimitiveFieldType;
  required: boolean;
  options?: string[];
  validation?: string[];
  referenceEntity?: string;
  defaultValue?: string | number | boolean | null;
};

export type AppSpecEntity = {
  key: string;
  label: string;
  fields: AppSpecField[];
  relationships: Array<{
    type: 'one_to_one' | 'one_to_many' | 'many_to_many';
    targetEntity: string;
    sourceField?: string;
    targetField?: string;
  }>;
  persistence: 'none' | 'local' | 'firebase' | 'managed';
};

export type AppSpecScreen = {
  key: string;
  title: string;
  purpose: string;
  kind:
    | 'landing'
    | 'portfolio'
    | 'dashboard'
    | 'table'
    | 'form'
    | 'detail'
    | 'calculator'
    | 'settings'
    | 'login'
    | 'other';
  entity?: string;
  tableColumns?: string[];
  formFields?: string[];
  actions: string[];
  filters: string[];
  search: boolean;
  sorting: string[];
  modalActions: string[];
  exportActions: string[];
};

export type AppSpecCalculation = {
  key: string;
  label: string;
  expression: string;
  inputFields: string[];
  outputField: string;
  precision?: number;
  dependencies: string[];
};

export type AppSpecBackendPlan = {
  required: boolean;
  authentication: string[];
  collections: Array<{
    key: string;
    fields: AppSpecField[];
    ownerScoped: boolean;
  }>;
  indexes: Array<{
    collection: string;
    fields: string[];
    order?: 'asc' | 'desc';
  }>;
  storage: string[];
  functions: string[];
  environmentVariables: string[];
};

export type ApplicationSpec = {
  schemaVersion: 1;
  projectKind: ProjectKind;
  title: string;
  summary: string;
  screens: AppSpecScreen[];
  entities: AppSpecEntity[];
  calculations: AppSpecCalculation[];
  globalActions: string[];
  dataDependencies: string[];
  acceptanceCriteria: string[];
  persistenceRequired: boolean;
  realTimeRequired: boolean;
  responsiveRequirements: string[];
  backend: AppSpecBackendPlan;
  forbiddenMarketingSections: string[];
};

export type WebsiteSection = {
  title: string;
  body: string;
  badge?: string;
  [key: string]: any;
};

export type DesignGenome = {
  archetype?: string;
  typography?: {
    headingFont?: string;
    bodyFont?: string;
  };
  palette?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
  };
  decorations?: string[];
  [key: string]: any;
};

export type DesignStudioElementType =
  | 'badge'
  | 'heading'
  | 'subheading'
  | 'button'
  | 'card'
  | 'feature'
  | 'image'
  | 'container'
  | 'stat'
  | 'form_input'
  | 'text'
  | 'icon';

export type DesignStudioElementStyles = {
  background?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number | string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  letterSpacing?: string;
  opacity?: number;
  boxShadow?: string;
  padding?: number | string;
  [key: string]: any;
};

export type DesignStudioElement = {
  id: string;
  type: DesignStudioElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  styles: DesignStudioElementStyles;
  locked?: boolean;
};

export type LiveCreationStageId =
  | 'initializing'
  | 'analyzing'
  | 'planning'
  | 'designing'
  | 'content'
  | 'coding'
  | 'building'
  | 'validating'
  | 'finalizing'
  | 'reviewing'
  | 'testing'
  | 'deploying'
  | 'completed';

export type LiveCreationStage = {
  id: LiveCreationStageId;
  name: string;
  title: string;
  subtitle: string;
  minProgress: number;
  icon: string;
};

/**
 * WebsitePlan remains the persisted planning envelope for backward
 * compatibility. appSpec is the binding implementation contract.
 */
export type WebsitePlan = {
  businessName: string;
  websiteType: string;
  tagline: string;
  pages: string[];
  features: string[];
  theme: {
    style: string;
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  sections: WebsiteSection[];
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  designGenome?: DesignGenome | null;
  appSpec: ApplicationSpec;
};

export type GeneratedProjectFile = {
  path: string;
  content: string;
};

export type GeneratedProject = {
  files: GeneratedProjectFile[];
  previewHtml: string;
  framework: 'vite-react';
};

export type DnsRecord = {
  type: 'A' | 'AAAA' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  value: string;
  ttl?: number;
  purpose?: string;
  status?: 'pending' | 'verified' | 'failed';
};

export type CustomDomainConfig = {
  domain: string;
  status: 'pending_verification' | 'verified' | 'failed' | 'active';
  verificationToken?: string;
  sslStatus?: 'pending' | 'active' | 'failed';
  dnsRecords?: DnsRecord[];
  verifiedAt?: string | null;
  createdAt?: string;
  [key: string]: any;
};

export type SeoIssue = {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'technical' | 'content' | 'performance' | 'accessibility';
  title: string;
  description: string;
  autoFixable: boolean;
  remediation: string;
};

export type SeoScoreBreakdown = {
  overall?: number;
  technical: number;
  content: number;
  performance: number;
  accessibility: number;
  [key: string]: any;
};

export type SeoMetadata = {
  title: string;
  description: string;
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    url?: string;
    type?: string;
    image?: string;
    [key: string]: any;
  };
  twitterCard?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    [key: string]: any;
  } | string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  twitterTitle?: string;
  schemaJsonLd?: Record<string, unknown> | string;
  jsonLd?: Record<string, unknown> | string;
  robotsTxt?: string;
  sitemapXml?: string;
  keywords?: string[];
  viewport?: string;
  language?: string;
  [key: string]: any;
};

export type SeoAuditReport = {
  projectId?: string;
  score?: SeoScoreBreakdown;
  overallScore?: number;
  scoreBreakdown?: SeoScoreBreakdown;
  issues: SeoIssue[];
  metadata: SeoMetadata;
  auditedAt: string;
  passedCount?: number;
  warningCount?: number;
  criticalCount?: number;
  complianceNotice?: string;
  domain?: string;
  [key: string]: any;
};




