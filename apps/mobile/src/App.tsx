import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Browser } from "@capacitor/browser";
import AdminPanelV5 from "./AdminPanelV5";
import ChatStudio, {
  type ChatAssistantReply,
  type LiveBuildActivity,
} from "./ChatStudio";

import CmsStudio from "./CmsStudio";
import type { FullStackReport } from "./FullStackReportCard";
import TokenWalletPanel from "./TokenWalletPanel";
import ThinkMaxControl from "./ThinkMaxControl";
import BackendWizard from "./BackendWizard";
import LiveWebsites from "./LiveWebsites";
import { WebsiteBriefWizard } from "./features/WebsiteBriefWizard";
import { SyntropixLeadCRM } from "./features/SyntropixLeadCRM";
import { SeoMonitoringDashboard } from "./features/SeoMonitoringDashboard";
import { InnovationHub } from "./features/InnovationHub";
import { GrowthToolsHub } from "./features/GrowthToolsHub";
import { SpatialStudio } from "./features/SpatialStudio";
import { BrowserStudio } from "./features/BrowserStudio";
import { WebToAppPackager } from "./features/WebToAppPackager";
import MakingAnimation from "./components/MakingAnimation";
import {
  accentPresets,
  applyAppearance,
  contrastForAccent,
  loadAppearance,
  resolveAccent,
  saveAppearance,
  websitePalettes,
  type AppearanceSettings,
  type WebsitePalette,
} from "./appearance";
import { ApiRequestError, requestJson } from "./api-errors";
import {
  sendEmailOtp,
  verifyEmailOtp,
  type UsernameSession,
} from "./auth-routing";
import {
  cleanRuntimeConfig,
  resolveRuntimeConfig,
  type RuntimeConfig,
  validApiConfig,
} from "./runtime-config";
import {
  activeGenerationJobKey,
  loadGenerationLaunch,
  normalizeGenerationStatus,
  removeGenerationLaunch,
  saveGenerationLaunch,
  waitForGenerationPoll,
  type GenerationLaunchPayload,
} from "./generation-job";
type WebsitePlan = {
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
  appSpec?: { backend?: { required?: boolean } };
};
type GenerateResponse = {
  projectId: string;
  jobId?: string;
  versionNumber?: number;
  plan: WebsitePlan;
  previewHtml: string;
  framework: "vite-react";
  fileCount: number;
  mode: "ai" | "built-in";
  thinkMaxCompleted?: boolean;
};
type GenerationStatusResponse = {
  job: {
    id: string;
    project_id?: string | null;
    status: string;
    current_step?: string | null;
    current_agent?: string | null;
    progress?: number | null;
    error_message?: string | null;
    failed_stage?: string | null;
    retryable?: boolean | null;
    attempt_count?: number | null;
    updated_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    duration_ms?: number | null;
  };
  events: LiveBuildActivity["events"];
};
type AccessResponse = {
  approved: true;
  role: "admin" | "subscriber";
  maxDevices: number;
  activeDevices: number;
  subscriptionExpiresAt?: string | null;
};
type ProjectSourceFile = {
  path: string;
  content: string;
};

type ProjectSourceResponse = {
  projectId: string;
  projectName: string;
  versionNumber: number;
  files: ProjectSourceFile[];
};

type CapabilityPack = {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  instruction: string;
};

type WebsiteTemplate = {
  id: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  features: string[];
  prompt: string;
};

type ProjectSummary = {
  id: string;
  name: string;
  website_type: string;
  status: string;
  framework: string;
  github_repository?: string | null;
  production_url?: string | null;
  deployment_state?: string | null;
  created_at: string;
};

type UsageData = {
  used: number;
  limit: number;
  unlimited: boolean;
  remaining: number | null;
  percentage: number;
  resetAt: string;
};

type AnalyticsData = {
  totalWebsites: number;
  liveWebsites: number;
  draftWebsites: number;
  totalBuilds: number;
  completedBuilds: number;
  failedBuilds: number;
  successRate: number;
  buildsToday: number;
  enquiries: number;
  dailyBuilds: Array<{
    date: string;
    label: string;
    count: number;
  }>;
  topWebsiteTypes: Array<{
    name: string;
    count: number;
  }>;
  recentProjects: ProjectSummary[];
};

type IntegrationStatus = {
  github: { external_account_name?: string | null } | null;
  vercel: { external_account_name?: string | null } | null;
};

const capabilityPacks: CapabilityPack[] = [
  {
    id: "premium-motion",
    name: "Premium Motion",
    icon: "✦",
    description:
      "Smooth entrances, hover interactions and cinematic scrolling.",
    features: [
      "Scroll reveals",
      "Hover effects",
      "Micro animations",
      "Smooth transitions",
    ],
    instruction: [
      "Add tasteful premium motion effects.",
      "Use smooth section reveals, interactive hover states,",
      "animated buttons and subtle background movement.",
      "Keep animations lightweight, accessible and mobile friendly.",
    ].join(" "),
  },
  {
    id: "three-dimensional",
    name: "3D Visual Experience",
    icon: "⬡",
    description:
      "Depth, perspective, layered cards and interactive 3D-style visuals.",
    features: ["3D cards", "Depth effects", "Perspective", "Layered hero"],
    instruction: [
      "Create a strong three-dimensional visual experience.",
      "Use CSS perspective, layered cards, depth, lighting, shadows,",
      "glass surfaces and interactive tilt-style presentation.",
      "Do not require large external 3D libraries unless essential.",
      "Maintain excellent performance on Android phones.",
    ].join(" "),
  },
  {
    id: "ecommerce-pro",
    name: "Ecommerce Pro",
    icon: "▣",
    description:
      "Product categories, offers, conversion sections and shopping UI.",
    features: ["Product cards", "Categories", "Offers", "Conversion UI"],
    instruction: [
      "Add a complete ecommerce-style experience.",
      "Include category navigation, product cards, price display,",
      "offers, trust badges, testimonials, product filters,",
      "strong calls to action and mobile shopping navigation.",
      "Do not create fake payment processing.",
    ].join(" "),
  },
  {
    id: "lead-generation",
    name: "Lead Generation",
    icon: "◎",
    description:
      "High-converting enquiry sections, WhatsApp and trust signals.",
    features: ["Lead forms", "WhatsApp", "Trust badges", "Sticky CTA"],
    instruction: [
      "Optimise the website for lead generation.",
      "Add clear calls to action, an enquiry form, WhatsApp contact,",
      "social proof, trust indicators, FAQs and mobile sticky actions.",
      "Keep forms simple, accessible and conversion focused.",
    ].join(" "),
  },
  {
    id: "accessibility-plus",
    name: "Accessibility Plus",
    icon: "◉",
    description:
      "Better contrast, keyboard support, labels and reduced-motion support.",
    features: [
      "Keyboard access",
      "ARIA labels",
      "High contrast",
      "Reduced motion",
    ],
    instruction: [
      "Apply strong accessibility standards.",
      "Use semantic HTML, visible focus states, proper form labels,",
      "keyboard navigation, descriptive alt text, sufficient contrast",
      "and prefers-reduced-motion support.",
    ].join(" "),
  },
  {
    id: "performance-max",
    name: "Performance Max",
    icon: "⚡",
    description:
      "Fast loading, lightweight effects and mobile-first optimisation.",
    features: [
      "Fast loading",
      "Mobile first",
      "Lazy media",
      "Lightweight code",
    ],
    instruction: [
      "Prioritise maximum website performance.",
      "Use lightweight components, minimal dependencies, optimised CSS,",
      "lazy-loaded media, responsive images and efficient animations.",
      "Avoid unnecessary libraries and expensive rendering effects.",
    ].join(" "),
  },
];

const websiteTemplates: WebsiteTemplate[] = [
  {
    id: "premium-jewellery",
    name: "Luxury Jewellery",
    category: "Retail",
    icon: "◆",
    description:
      "Premium jewellery showroom with products, collections, WhatsApp and enquiries.",
    features: ["Product gallery", "WhatsApp", "Contact form", "Luxury UI"],
    prompt: [
      "Create a premium luxury jewellery website.",
      "Use an elegant black, ivory and gold visual theme.",
      "Include a cinematic hero section, featured jewellery",
      "collections, product cards, bridal collection, trust",
      "section, testimonials, store information, WhatsApp",
      "button, enquiry form, SEO and a mobile-first layout.",
      "Use smooth premium animations and professional typography.",
    ].join(" "),
  },
  {
    id: "modern-ecommerce",
    name: "Modern Ecommerce",
    category: "Commerce",
    icon: "▣",
    description:
      "Conversion-focused online store with categories, offers and product showcases.",
    features: ["Categories", "Products", "Offers", "Mobile shop"],
    prompt: [
      "Create a modern high-converting ecommerce website.",
      "Include an announcement bar, searchable navigation,",
      "category cards, featured products, sale section, product",
      "benefits, customer reviews, newsletter, contact form,",
      "WhatsApp and SEO. Use a clean premium mobile-first design",
      "with subtle animations and strong call-to-action buttons.",
    ].join(" "),
  },
  {
    id: "restaurant-cafe",
    name: "Restaurant & Cafe",
    category: "Food",
    icon: "◉",
    description:
      "Restaurant website with menu, reservations, gallery and location.",
    features: ["Food menu", "Reservations", "Gallery", "Location"],
    prompt: [
      "Create a cinematic restaurant and cafe website.",
      "Include a full-screen food hero, menu categories, signature",
      "dishes, chef story, restaurant gallery, opening hours,",
      "reservation form, Google Maps location, WhatsApp ordering,",
      "testimonials and SEO. Use warm premium colours and smooth",
      "scroll animations while keeping the website mobile friendly.",
    ].join(" "),
  },
  {
    id: "smart-tuition",
    name: "Tuition Academy",
    category: "Education",
    icon: "✦",
    description:
      "Professional tuition-class website for courses, teachers and admissions.",
    features: ["Courses", "Faculty", "Results", "Admissions"],
    prompt: [
      "Create a professional tuition academy website for students",
      "and parents. Include courses by standard and board, faculty",
      "profiles, academic results, student testimonials, class",
      "timings, notes and resources section, admission enquiry form,",
      "WhatsApp contact, FAQs and SEO. Use a trustworthy modern",
      "education theme with a clean responsive mobile layout.",
    ].join(" "),
  },
  {
    id: "creative-portfolio",
    name: "Creative Portfolio",
    category: "Personal",
    icon: "◇",
    description:
      "Personal portfolio for developers, designers and creative professionals.",
    features: ["Projects", "Skills", "Experience", "Contact"],
    prompt: [
      "Create a highly polished personal portfolio website.",
      "Include a strong introduction, skills, selected projects,",
      "experience timeline, achievements, services, testimonials,",
      "download resume button, social links and contact form.",
      "Use a unique modern visual identity, smooth interactions,",
      "excellent typography and a responsive mobile-first layout.",
    ].join(" "),
  },
  {
    id: "saas-startup",
    name: "AI SaaS Startup",
    category: "Technology",
    icon: "⬡",
    description:
      "Modern software startup landing page with pricing and product sections.",
    features: ["Product demo", "Pricing", "Features", "FAQs"],
    prompt: [
      "Create a premium AI SaaS startup landing page.",
      "Include an impressive product hero, dashboard mockup area,",
      "feature grid, workflow explanation, integrations, use cases,",
      "pricing plans, customer logos, testimonials, FAQ, waitlist",
      "form and SEO. Use a modern glassmorphism-inspired design",
      "with tasteful animations and excellent mobile responsiveness.",
    ].join(" "),
  },
  {
    id: "real-estate",
    name: "Real Estate Agency",
    category: "Property",
    icon: "⌂",
    description:
      "Property agency website with listings, agents and enquiry features.",
    features: ["Listings", "Property search", "Agents", "Enquiries"],
    prompt: [
      "Create a premium real estate agency website.",
      "Include property search filters, featured listings, property",
      "cards with pricing and location, agent profiles, neighbourhood",
      "guides, buying and selling services, testimonials, WhatsApp,",
      "property enquiry form and SEO. Use a sophisticated spacious",
      "design that works perfectly on mobile and desktop.",
    ].join(" "),
  },
  {
    id: "global-export",
    name: "Global Export Business",
    category: "Business",
    icon: "◎",
    description:
      "International export company website with products and global reach.",
    features: ["Products", "Countries", "Certifications", "Trade enquiries"],
    prompt: [
      "Create a professional international export business website.",
      "Include company introduction, export product categories,",
      "countries served, global supply network, quality assurance,",
      "certifications, packaging process, logistics, trade enquiry",
      "form, WhatsApp contact and SEO. Use a trustworthy premium",
      "corporate design with strong international-business branding.",
    ].join(" "),
  },
];

const ownerEmail = "poojakpdoshi@gmail.com";
const configKey = "wmai-runtime-config";
const userSessionKey = "nexora-user-session";
const adminLoginPath = "/admin/auth/login";
const userLoginPath = "/login";

function initialAppMode(): "user" | "admin-login" {
  return window.location.pathname.replace(/\/+$/, "") === adminLoginPath
    ? "admin-login"
    : "user";
}

function replaceAppPath(pathname: string): void {
  if (window.location.pathname === pathname) return;
  window.history.replaceState(null, "", `${pathname}${window.location.search}`);
}

function formatQuotaReset(resetAt: string, now: number): string {
  const remaining = new Date(resetAt).getTime() - now;

  if (!Number.isFinite(remaining) || remaining <= 0) {
    return "Resetting now";
  }

  const totalMinutes = Math.ceil(remaining / 60000);

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`;
  }

  return `Resets in ${minutes}m`;
}

function zipCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;

  for (const byte of data) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function zipDosTime(date: Date): {
  time: number;
  day: number;
} {
  const year = Math.max(1980, date.getFullYear());

  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      Math.floor(date.getSeconds() / 2),

    day: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function zipHeader(size: number): {
  bytes: Uint8Array;
  view: DataView;
} {
  const bytes = new Uint8Array(size);

  return {
    bytes,
    view: new DataView(bytes.buffer),
  };
}

function createSourceZip(files: ProjectSourceFile[]): Blob {
  const encoder = new TextEncoder();
  const now = zipDosTime(new Date());

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];

  let localOffset = 0;

  for (const file of files) {
    const name = encoder.encode(file.path);
    const content = encoder.encode(file.content);
    const crc = zipCrc32(content);

    const local = zipHeader(30 + name.length);

    local.view.setUint32(0, 0x04034b50, true);
    local.view.setUint16(4, 20, true);
    local.view.setUint16(6, 0x0800, true);
    local.view.setUint16(8, 0, true);
    local.view.setUint16(10, now.time, true);
    local.view.setUint16(12, now.day, true);
    local.view.setUint32(14, crc, true);
    local.view.setUint32(18, content.length, true);
    local.view.setUint32(22, content.length, true);
    local.view.setUint16(26, name.length, true);
    local.view.setUint16(28, 0, true);
    local.bytes.set(name, 30);

    localParts.push(local.bytes, content);

    const central = zipHeader(46 + name.length);

    central.view.setUint32(0, 0x02014b50, true);
    central.view.setUint16(4, 20, true);
    central.view.setUint16(6, 20, true);
    central.view.setUint16(8, 0x0800, true);
    central.view.setUint16(10, 0, true);
    central.view.setUint16(12, now.time, true);
    central.view.setUint16(14, now.day, true);
    central.view.setUint32(16, crc, true);
    central.view.setUint32(20, content.length, true);
    central.view.setUint32(24, content.length, true);
    central.view.setUint16(28, name.length, true);
    central.view.setUint16(30, 0, true);
    central.view.setUint16(32, 0, true);
    central.view.setUint16(34, 0, true);
    central.view.setUint16(36, 0, true);
    central.view.setUint32(38, 0, true);
    central.view.setUint32(42, localOffset, true);
    central.bytes.set(name, 46);

    centralParts.push(central.bytes);

    localOffset += local.bytes.length + content.length;
  }

  const centralSize = centralParts.reduce(
    (total, part) => total + part.length,
    0
  );

  const end = zipHeader(22);

  end.view.setUint32(0, 0x06054b50, true);
  end.view.setUint16(4, 0, true);
  end.view.setUint16(6, 0, true);
  end.view.setUint16(8, files.length, true);
  end.view.setUint16(10, files.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, localOffset, true);
  end.view.setUint16(20, 0, true);

  const parts = [...localParts, ...centralParts, end.bytes];

  const totalSize = parts.reduce((total, part) => total + part.length, 0);

  const output = new Uint8Array(totalSize);
  let offset = 0;

  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }

  return new Blob([output.buffer], { type: "application/zip" });
}

function safeDownloadName(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "nexora-project"
  );
}

const DEFAULT_PUBLIC_API_BASE = "https://website-maker-ai-api.poojakpdoshi.workers.dev";

function defaultConfig(): RuntimeConfig {
  return {
    apiBase: (import.meta.env.VITE_API_BASE_URL || DEFAULT_PUBLIC_API_BASE).replace(/\/$/, ""),
  };
}

function loadConfig(): RuntimeConfig {
  const bundled = defaultConfig();
  const allowStoredOverride =
    import.meta.env.DEV || !validApiConfig(bundled);

  return resolveRuntimeConfig(
    bundled,
    localStorage.getItem(configKey),
    allowStoredOverride
  );
}

function createInstallationId(): string {
  const stored = localStorage.getItem("wmai-installation-id");
  if (stored) return stored;
  const value =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
          const random = Math.floor(Math.random() * 16);
          return (character === "x" ? random : (random & 0x3) | 0x8).toString(
            16
          );
        });
  localStorage.setItem("wmai-installation-id", value);
  return value;
}

const installationId = createInstallationId();

const runtimeConfigOverrideAllowed =
  import.meta.env.DEV || !validApiConfig(defaultConfig());

export default function App() {
  const [config, setConfig] = useState<RuntimeConfig>(loadConfig);
  const [showSetup, setShowSetup] = useState(() => !validApiConfig(loadConfig()));
  const [mode, setMode] = useState<"user" | "admin-login" | "admin-dashboard">(
    initialAppMode
  );
  const [forceUserLogin, setForceUserLogin] = useState(false);
  const [email, setEmail] = useState(ownerEmail);
  const [userSession, setUserSession] = useState<UsernameSession | null>(() => {
    try {
      const stored = localStorage.getItem(userSessionKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    loadAppearance()
  );
  const [appearanceDraft, setAppearanceDraft] = useState<AppearanceSettings>(
    () => loadAppearance()
  );
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [websitePalette, setWebsitePalette] = useState<WebsitePalette>(() => {
    const id = localStorage.getItem("nexora-website-palette") || "auto";
    return (
      websitePalettes.find((palette) => palette.id === id) || websitePalettes[0]
    );
  });

  const [resendCooldown, setResendCooldown] = useState(0);

  const [approved, setApproved] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [access, setAccess] = useState<AccessResponse | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);
  const [prompt, setPrompt] = useState(
    "Create a premium modern website for a jewellery shop named Raj Jewels with products, WhatsApp number +919876543210, gallery, enquiry form and SEO."
  );
  const [thinkMaxEnabled, setThinkMaxEnabled] = useState(false);
  const generationInFlightRef = useRef(false);
  const launchedGenerationJobsRef = useRef(new Set<string>());

  const [templateSearch, setTemplateSearch] = useState("");

  const [selectedCapabilityIds, setSelectedCapabilityIds] = useState<string[]>(
    () => {
      try {
        const stored = localStorage.getItem("nexora-capability-packs");

        return stored ? (JSON.parse(stored) as string[]) : [];
      } catch {
        return [];
      }
    }
  );

  const [editInstruction, setEditInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<LiveBuildActivity | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [downloadingProjectId, setDownloadingProjectId] = useState<
    string | null
  >(null);

  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewOrientation, setPreviewOrientation] = useState<"portrait" | "landscape">("portrait");
  const [showBriefWizard, setShowBriefWizard] = useState(false);
  const [showVersionDrawer, setShowVersionDrawer] = useState(false);
  const [versionHistory, setVersionHistory] = useState<Array<{ id: string; timestamp: string; label: string; result: GenerateResponse }>>([]);

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [backendVerified, setBackendVerified] = useState(false);

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [usage, setUsage] = useState<UsageData | null>(null);

  const [usageLoading, setUsageLoading] = useState(false);

  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [connections, setConnections] = useState<IntegrationStatus>({
    github: null,
    vercel: null,
  });
  const [githubToken, setGithubToken] = useState("");
  const [vercelToken, setVercelToken] = useState("");
  const [connectingProvider, setConnectingProvider] = useState<
    "github" | "vercel" | null
  >(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<
    | "chat"
    | "create"
    | "templates"
    | "packs"
    | "preview"
    | "projects"
    | "live-sites"
    | "leads"
    | "seo"
    | "innovation"
    | "growth"
    | "spatial"
    | "analytics"
    | "connect"
    | "account"
    | "cms"
    | "browser"
    | "apk"
  >("chat");

  const token = userSession?.token || "";
  useEffect(() => {
    if (mode !== "user") return;

    if (!approved || forceUserLogin) {
      replaceAppPath(userLoginPath);
    } else if (window.location.pathname.replace(/\/+$/, "") === userLoginPath) {
      replaceAppPath("/");
    }
  }, [approved, forceUserLogin, mode]);

  useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      applyAppearance(
        appearance,
        document.documentElement,
        systemTheme.matches
      );
      saveAppearance(appearance);
    };

    applyTheme();

    systemTheme.addEventListener("change", applyTheme);

    return () => {
      systemTheme.removeEventListener("change", applyTheme);
    };
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem("nexora-website-palette", websitePalette.id);
  }, [websitePalette]);

  useEffect(() => {
    setBackendVerified(false);
  }, [result?.projectId]);

  useEffect(() => {
    localStorage.setItem(
      "nexora-capability-packs",
      JSON.stringify(selectedCapabilityIds)
    );
  }, [selectedCapabilityIds]);

  const filteredTemplates = useMemo(() => {
    const search = templateSearch.trim().toLowerCase();

    if (!search) {
      return websiteTemplates;
    }

    return websiteTemplates.filter((template) =>
      [
        template.name,
        template.category,
        template.description,
        ...template.features,
      ].some((value) => value.toLowerCase().includes(search))
    );
  }, [templateSearch]);

  const status = useMemo(
    () =>
      result
        ? `${result.plan.businessName} • ${result.framework} • ${
            result.fileCount
          } files • ${
            result.mode === "ai" ? "Gemini-assisted brain" : "Built-in brain"
          }`
        : "No website generated yet",
    [result]
  );

  async function readResponse(response: Response) {
    const data = await response.json().catch(() => ({
      error: "The server returned an invalid response.",
    }));

    if (!response.ok) {
      const securityErrors = Array.isArray(data?.securityAudit?.errors)
        ? data.securityAudit.errors.filter(
            (item: unknown) => typeof item === "string"
          )
        : [];

      const securityDetails =
        securityErrors.length > 0
          ? `\n\nSecurity issues:\n• ${securityErrors.join("\n• ")}`
          : "";

      throw new Error(
        `${
          data.error || `Request failed (${response.status})`
        }${securityDetails}`
      );
    }

    return data;
  }

  function authHeaders(activeToken = token) {
    return {
      Authorization: `Bearer ${activeToken}`,
      "X-Device-Id": installationId,
    };
  }

  async function loadAppearancePreference(activeToken = token): Promise<void> {
    if (!activeToken) return;
    const response = await fetch(`${config.apiBase}/preferences/appearance`, {
      headers: authHeaders(activeToken),
    });
    const data = (await readResponse(response)) as {
      appearance: AppearanceSettings;
    };
    const restored = saveAppearance(data.appearance);
    setAppearance(restored);
    setAppearanceDraft(restored);
  }

  async function applyAppearancePreference(): Promise<void> {
    const accent = resolveAccent(appearanceDraft);
    const contrast = contrastForAccent(accent);
    if (!contrast.accessible) {
      setError("Choose an accent with WCAG AA contrast before applying.");
      return;
    }
    setAppearanceSaving(true);
    setError("");
    const applied = saveAppearance(appearanceDraft);
    setAppearance(applied);
    try {
      const response = await fetch(`${config.apiBase}/preferences/appearance`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(applied),
      });
      const data = (await readResponse(response)) as {
        appearance: AppearanceSettings;
      };
      const saved = saveAppearance(data.appearance);
      setAppearance(saved);
      setAppearanceDraft(saved);
      setMessage("Appearance saved locally and to your Nexora account.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `${saveError.message} The theme is still saved on this device.`
          : "The theme is saved locally, but account sync failed."
      );
    } finally {
      setAppearanceSaving(false);
    }
  }

  async function clearGenerationState(
    jobId: string,
    removeLaunch = true,
    removeActive = true
  ): Promise<void> {
    if (
      removeActive &&
      localStorage.getItem(activeGenerationJobKey) === jobId
    ) {
      localStorage.removeItem(activeGenerationJobKey);
    }

    if (removeLaunch) {
      await removeGenerationLaunch(jobId).catch(() => undefined);
    }
  }

  async function launchGenerationJob(
    jobId: string,
    payload: GenerationLaunchPayload,
    activeToken: string
  ): Promise<void> {
    const response = await fetch(`${config.apiBase}/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...authHeaders(activeToken),
      },
      body: JSON.stringify({ ...payload, jobId }),
    });

    if (response.status === 409) return;
    await readResponse(response);
  }

  async function ensureGenerationLaunched(
    jobId: string,
    activeToken: string,
    fallbackPayload?: GenerationLaunchPayload
  ): Promise<boolean> {
    if (launchedGenerationJobsRef.current.has(jobId)) return true;

    const payload =
      fallbackPayload || (await loadGenerationLaunch(jobId).catch(() => null));
    if (!payload) return false;

    launchedGenerationJobsRef.current.add(jobId);
    void launchGenerationJob(jobId, payload, activeToken)
      .catch(() => {
        setMessage(
          "The generation connection was interrupted. Quantora is reconnecting to the saved task."
        );
      })
      .finally(() => {
        launchedGenerationJobsRef.current.delete(jobId);
      });

    return true;
  }

  async function fetchGenerationStatus(
    jobId: string,
    activeEmail: string,
    activeToken: string
  ): Promise<GenerationStatusResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      let response: Response;
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      try {
        response = await fetch(
          `${config.apiBase}/generation-jobs/${jobId}` +
            `?email=${encodeURIComponent(activeEmail)}`,
          {
            headers: authHeaders(activeToken),
            signal: controller.signal,
          }
        );
      } catch (statusError) {
        lastError = controller.signal.aborted
          ? new Error("The generation status request timed out.")
          : statusError instanceof Error
          ? statusError
          : new Error("Could not reach the generation service.");
        await waitForGenerationPoll(Math.min(8000, 750 * 2 ** attempt));
        continue;
      } finally {
        window.clearTimeout(timeout);
      }

      const retryable =
        response.status === 408 ||
        response.status === 425 ||
        response.status === 429 ||
        response.status >= 500;

      if (!retryable) {
        return (await readResponse(response)) as GenerationStatusResponse;
      }

      lastError = new Error(
        `Generation status request failed (${response.status}).`
      );
      await waitForGenerationPoll(Math.min(8000, 750 * 2 ** attempt));
    }

    const error =
      lastError || new Error("Could not reconnect to the generation service.");
    Object.assign(error, { retryable: true });
    throw error;
  }

  async function loadCompletedGeneration(
    jobId: string,
    projectId: string,
    events: LiveBuildActivity["events"],
    activeEmail: string,
    activeToken: string
  ): Promise<GenerateResponse> {
    const projectResponse = await fetch(
      `${config.apiBase}/projects/${projectId}` +
        `?email=${encodeURIComponent(activeEmail)}`,
      { headers: authHeaders(activeToken) }
    );
    const projectData = (await readResponse(projectResponse)) as {
      project: { id: string; name: string; framework: string };
      version: {
        version_number: number;
        plan: WebsitePlan;
        preview_html: string;
      };
    };
    const eventsWithMetadata = events as Array<
      LiveBuildActivity["events"][number] & {
        metadata?: { fileCount?: number };
      }
    >;
    const fileEvent = [...eventsWithMetadata]
      .reverse()
      .find((event) => event.title === "Project files created");

    if (!projectData.version.preview_html) {
      throw new Error(
        "Generation completed, but the website preview is unavailable."
      );
    }

    return {
      projectId: projectData.project.id,
      jobId,
      versionNumber: projectData.version.version_number,
      plan: projectData.version.plan,
      previewHtml: projectData.version.preview_html,
      framework: "vite-react",
      fileCount: Number(fileEvent?.metadata?.fileCount || 0),
      mode: "ai",
    };
  }

  async function pollGenerationJob(options: {
    jobId: string;
    activeEmail: string;
    activeToken: string;
    publishActivity: (activity: LiveBuildActivity) => void;
    shouldStop?: () => boolean;
  }): Promise<GenerateResponse | null> {
    let reconnectFailures = 0;

    while (!options.shouldStop?.()) {
      let data: GenerationStatusResponse;

      try {
        data = await fetchGenerationStatus(
          options.jobId,
          options.activeEmail,
          options.activeToken
        );
        reconnectFailures = 0;
      } catch (pollError) {
        if (!(pollError as Error & { retryable?: boolean }).retryable) {
          throw pollError;
        }

        reconnectFailures += 1;
        setMessage(
          `Connection interrupted. Reconnecting to the saved task${
            reconnectFailures > 1 ? ` (attempt ${reconnectFailures})` : ""
          }â€¦`
        );
        await waitForGenerationPoll(
          Math.min(15000, 1200 * 2 ** Math.min(reconnectFailures, 4))
        );
        continue;
      }

      if (options.shouldStop?.()) return null;

      const state = normalizeGenerationStatus(data.job.status);
      const backendProgress = Number(data.job.progress ?? 0);
      options.publishActivity({
        jobId: options.jobId,
        status: state,
        progress: Number.isFinite(backendProgress)
          ? Math.min(100, Math.max(0, backendProgress))
          : 0,
        currentAgent: data.job.current_agent,
        currentStep: data.job.current_step,
        errorMessage: data.job.error_message,
        failedStage: data.job.failed_stage,
        retryable: Boolean(data.job.retryable),
        startedAt: data.job.started_at,
        completedAt: data.job.completed_at,
        durationMs:
          typeof data.job.duration_ms === "number"
            ? data.job.duration_ms
            : null,
        events: data.events || [],
      });

      if (state === "queued") {
        const launched = await ensureGenerationLaunched(
          options.jobId,
          options.activeToken
        );
        setMessage(
          launched
            ? "Quantora is connecting the saved task to the generation workerâ€¦"
            : "The generation task is queued and waiting for its worker."
        );
      } else if (state === "failed") {
        await clearGenerationState(options.jobId, false, false);
        throw new Error(data.job.error_message || "Website generation failed.");
      } else if (state === "cancelled") {
        await clearGenerationState(options.jobId, false);
        throw new Error(
          data.job.error_message || "Website generation was cancelled."
        );
      } else if (state === "unknown") {
        await clearGenerationState(options.jobId);
        throw new Error(
          `The backend returned an unknown generation status: ${
            data.job.status || "empty status"
          }.`
        );
      } else if (state === "completed") {
        if (!data.job.project_id) {
          await clearGenerationState(options.jobId);
          throw new Error("Generation completed without a project identifier.");
        }

        const generated = await loadCompletedGeneration(
          options.jobId,
          data.job.project_id,
          data.events || [],
          options.activeEmail,
          options.activeToken
        );
        await clearGenerationState(options.jobId);
        return generated;
      }

      await waitForGenerationPoll(1500);
    }

    return null;
  }

  async function cancelGeneration(): Promise<void> {
    if (!activity || !["queued", "running"].includes(activity.status)) return;
    setError("");
    try {
      const response = await fetch(
        `${config.apiBase}/generation-jobs/${activity.jobId}/cancel`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );
      const data = (await readResponse(response)) as { status: string };
      setMessage(
        data.status === "cancelled"
          ? "Generation cancelled and its unused token reservation was refunded."
          : "Cancellation requested. The bounded remote stage will stop at its next safe checkpoint."
      );
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Could not cancel generation."
      );
    }
  }

  async function retryGeneration(): Promise<void> {
    if (!activity || activity.status !== "failed" || !activity.retryable)
      return;
    setError("");
    setLoading(true);
    generationInFlightRef.current = true;
    try {
      const response = await fetch(
        `${config.apiBase}/generation-jobs/${activity.jobId}/retry`,
        {
          method: "POST",
          headers: authHeaders(),
        }
      );
      const data = (await readResponse(response)) as {
        jobId: string;
        status: string;
        progress: number;
        resumeFromStage: string;
      };
      localStorage.setItem(activeGenerationJobKey, data.jobId);
      setActivity({
        ...activity,
        status: data.status,
        progress: data.progress,
        currentAgent: "Orchestrator",
        currentStep: "retry_queued",
        errorMessage: null,
        failedStage: null,
        retryable: false,
      });
      setMessage(
        `Retrying from ${data.resumeFromStage} without another token charge…`
      );
      const payload = await loadGenerationLaunch(data.jobId);
      if (!payload) {
        throw new Error(
          "The saved generation request is unavailable on this device. Start a new generation."
        );
      }
      await ensureGenerationLaunched(data.jobId, token, payload);
      const generated = await pollGenerationJob({
        jobId: data.jobId,
        activeEmail: email,
        activeToken: token,
        publishActivity: setActivity,
      });
      if (generated) {
        setResult(generated);
        setMessage(`${generated.plan.businessName} is ready.`);
        await loadProjects();
        setTab("preview");
      }
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Could not retry generation."
      );
    } finally {
      generationInFlightRef.current = false;
      setLoading(false);
    }
  }

  async function checkAccess(activeEmail: string, activeToken: string) {
    const response = await fetch(`${config.apiBase}/auth/check-access`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${activeToken}`,
      },
      body: JSON.stringify({
        email: activeEmail,
        installationId,
        deviceName: navigator.platform || "Android device",
        androidVersion: navigator.userAgent.slice(0, 150),
      }),
    });
    const data = (await readResponse(response)) as AccessResponse;
    setAccess(data);
    setApproved(true);
    return data;
  }

  async function loadUsage() {
    if (!email || !token) return;

    setUsageLoading(true);

    try {
      const response = await fetch(
        `${config.apiBase}/usage?email=${encodeURIComponent(email)}`,
        {
          headers: authHeaders(token),
        }
      );

      const data = (await readResponse(response)) as UsageData;

      setUsage(data);
    } catch (usageError) {
      setError(
        usageError instanceof Error
          ? usageError.message
          : "Could not load daily usage."
      );
    } finally {
      setUsageLoading(false);
    }
  }

  async function loadAnalytics() {
    if (!email || !token) return;

    setAnalyticsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${config.apiBase}/analytics?email=${encodeURIComponent(email)}`,
        {
          headers: authHeaders(token),
        }
      );

      const data = (await readResponse(response)) as AnalyticsData;

      setAnalytics(data);
    } catch (analyticsError) {
      setError(
        analyticsError instanceof Error
          ? analyticsError.message
          : "Could not load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadProjects(activeEmail = email, activeToken = token) {
    if (!activeEmail || !activeToken) return;
    const response = await fetch(
      `${config.apiBase}/projects?email=${encodeURIComponent(activeEmail)}`,
      { headers: authHeaders(activeToken) }
    );
    const data = (await readResponse(response)) as {
      projects: ProjectSummary[];
    };
    setProjects(data.projects || []);
  }

  async function loadConnections(activeEmail = email, activeToken = token) {
    if (!activeEmail || !activeToken) return;
    const response = await fetch(
      `${config.apiBase}/integrations/status?email=${encodeURIComponent(
        activeEmail
      )}`,
      { headers: authHeaders(activeToken) }
    );
    const data = (await readResponse(response)) as IntegrationStatus;
    setConnections(data);
  }

  // RESTORE_USERNAME_SESSION
  useEffect(() => {
    const stored = localStorage.getItem(userSessionKey);
    if (!stored || !validApiConfig(config)) return;

    let saved: UsernameSession;

    try {
      saved = JSON.parse(stored) as UsernameSession;
    } catch {
      localStorage.removeItem(userSessionKey);
      return;
    }

    void requestJson<UsernameSession>(`${config.apiBase}/auth/me`, {
      headers: {
        Authorization: `Bearer ${saved.token}`,
        "X-Device-Id": installationId,
      },
    })
      .then(async (data) => {
        const refreshed: UsernameSession = {
          ...saved,
          ...data,
          token: saved.token,
        };

        localStorage.setItem(userSessionKey, JSON.stringify(refreshed));

        setUserSession(refreshed);
        setEmail(refreshed.internalEmail);

        setAccess({
          approved: true,
          role: refreshed.role,
          maxDevices: refreshed.maxDevices,
          activeDevices: refreshed.activeDevices,
        });

        setApproved(true);

        const guideKey = `nexora-token-guide-seen:${refreshed.username.toLowerCase()}`;

        if (!localStorage.getItem(guideKey)) {
          setShowSetupGuide(true);
          setTab("connect");
        }

        await Promise.all([
          loadProjects(refreshed.internalEmail, refreshed.token),
          loadConnections(refreshed.internalEmail, refreshed.token),
          loadAppearancePreference(refreshed.token),
        ]);
      })
      .catch((startupError: unknown) => {
        if (
          startupError instanceof ApiRequestError &&
          startupError.kind === "unauthorized"
        ) {
          localStorage.removeItem(userSessionKey);
          setUserSession(null);
            setApproved(false);
          return;
        }

        setUserSession(saved);
        setEmail(saved.internalEmail);
        setApproved(false);
        setError(
          startupError instanceof Error
            ? startupError.message
            : "Cannot verify the saved session. Check your connection and try again."
        );
      });
  }, [config.apiBase]);

  // RESUME_ACTIVE_GENERATION_JOB
  useEffect(() => {
    const jobId = localStorage.getItem(activeGenerationJobKey);
    const activeToken = userSession?.token || "";

    if (!jobId || !approved || !activeToken || !email || !config.apiBase) {
      return;
    }

    const activeJobId = jobId;
    let cancelled = false;

    async function resumeGeneration(): Promise<void> {
      generationInFlightRef.current = true;
      setLoading(true);
      setMessage("Restoring your active Nexora task…");
      setError("");

      try {
        const generated = await pollGenerationJob({
          jobId: activeJobId,
          activeEmail: email,
          activeToken,
          publishActivity: setActivity,
          shouldStop: () => cancelled,
        });

        if (!generated || cancelled) return;

        setResult(generated);
        setMessage(`${generated.plan.businessName} is ready.`);
        await loadProjects(email, activeToken);
        setTab("preview");
      } finally {
        if (!cancelled) {
          generationInFlightRef.current = false;
          setLoading(false);
        }
      }
    }

    void resumeGeneration().catch((resumeError) => {
      if (cancelled) return;

      const errorMessage =
        resumeError instanceof Error
          ? resumeError.message
          : "Could not restore the active task.";

      setError(errorMessage);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      generationInFlightRef.current = false;
    };
  }, [
    approved,
    config.apiBase,
    email,
    userSession?.token,
  ]);

  function saveRuntimeConfig(next: RuntimeConfig) {
    if (!runtimeConfigOverrideAllowed) {
      setShowSetup(false);
      setError(
        "This release uses its verified build-time backend configuration."
      );
      return;
    }

    const clean = cleanRuntimeConfig(next);
    if (!validApiConfig(clean)) {
      setError(
        "Enter a valid public backend API URL. Gmail OTP credentials are configured only on the server."
      );
      return;
    }
    localStorage.setItem(configKey, JSON.stringify(clean));
    setConfig(clean);
    setShowSetup(false);
    setError("");
    setMessage("Configuration saved inside the APK.");
  }

  async function handleSendOtp(event?: FormEvent) {
    if (event) event.preventDefault();
    setError("");
    setMessage("");

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoginLoading(true);
    try {
      const data = await sendEmailOtp(config.apiBase, {
        email: targetEmail,
        installationId,
      });

      setOtpSent(true);
      setResendCooldown(60);
      setMessage(data.message || `A 6-digit verification code was sent to ${targetEmail} from Quantora by Quantacy AI <quantoraby.quantacy@gmail.com>.`);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send the verification code. Please check configuration."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const targetEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanOtp || !/^\d{6}$/.test(cleanOtp)) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setLoginLoading(true);
    try {
      const data = await verifyEmailOtp(config.apiBase, {
        email: targetEmail,
        otp: cleanOtp,
        installationId,
        deviceName: navigator.platform || "Android device",
        androidVersion: navigator.userAgent.slice(0, 150),
      });

      localStorage.setItem(userSessionKey, JSON.stringify(data));
      localStorage.removeItem("wmai-admin-session");

      setUserSession(data);
      setEmail(data.internalEmail);
      setAccess({
        approved: true,
        role: data.role,
        maxDevices: data.maxDevices,
        activeDevices: data.activeDevices,
      });
      setApproved(true);
      setForceUserLogin(false);
      setOtp("");
      setOtpSent(false);
      setTab("chat");
      replaceAppPath("/");

      await Promise.all([
        loadProjects(data.internalEmail, data.token),
        loadConnections(data.internalEmail, data.token),
      ]);
    } catch (verifyError) {
      setError(
        verifyError instanceof Error
          ? verifyError.message
          : "Verification failed. Please check the code."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function handleAdminMode(
    nextMode: "user" | "admin-login" | "admin-dashboard"
  ) {
    setError("");
    setMessage("");
    setForceUserLogin(nextMode === "user");
    setMode(nextMode);
    replaceAppPath(nextMode === "user" ? userLoginPath : adminLoginPath);
  }

  async function generateWebsite(
    customPrompt?: string,
    returnResult = false,
    image?: {
      name: string;
      dataUrl: string;
    } | null,
    activityListener?: (activity: LiveBuildActivity) => void
  ): Promise<GenerateResponse | null> {
    const basePrompt = (customPrompt || prompt).trim();

    const capabilityInstruction = capabilityPacks
      .filter((pack) => selectedCapabilityIds.includes(pack.id))
      .map((pack) => `[${pack.name}] ${pack.instruction}`)
      .join("\n");

    const activePrompt = [
      basePrompt,
      capabilityInstruction
        ? `\nEnabled capability packs:\n${capabilityInstruction}`
        : "",
    ]
      .join("")
      .slice(0, 6000);

    const imageMatch = image?.dataUrl.match(/^data:([^;]+);base64,(.+)$/s);

    const visionImage = imageMatch
      ? {
          mimeType: imageMatch[1],
          data: imageMatch[2],
          name: image?.name || "reference-image",
        }
      : undefined;

    if (!approved || activePrompt.length < 20) {
      setError("Please enter a detailed website request.");
      return null;
    }

    if (generationInFlightRef.current) {
      setError("A website build is already running.");
      return null;
    }

    generationInFlightRef.current = true;
    setLoading(true);
    setError("");
    setMessage("Nexora Council is starting…");

    const publishActivity = (next: LiveBuildActivity): void => {
      setActivity(next);
      activityListener?.(next);
    };
    const launchPayload: GenerationLaunchPayload = {
      email,
      installationId,
      prompt: activePrompt,
      image: visionImage,
      ...(thinkMaxEnabled ? { thinkMax: true } : {}),
      ...(websitePalette.id !== "auto"
        ? {
            websitePalette: {
              id: websitePalette.id,
              label: websitePalette.label,
              primary: websitePalette.primary,
              secondary: websitePalette.secondary,
              background: websitePalette.background,
              text: websitePalette.text,
            },
          }
        : {}),
    };

    try {
      const startResponse = await fetch(
        `${config.apiBase}/generation-jobs/start`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify(launchPayload),
        }
      );

      const started = (await readResponse(startResponse)) as {
        jobId: string;
        status: string;
        progress: number;
      };

      localStorage.setItem(activeGenerationJobKey, started.jobId);

      await saveGenerationLaunch(started.jobId, launchPayload).catch(
        () => undefined
      );

      publishActivity({
        jobId: started.jobId,
        status: started.status,
        progress: started.progress,
        currentAgent: "Orchestrator",
        currentStep: "request_received",
        events: [],
      });

      await ensureGenerationLaunched(started.jobId, token, launchPayload);
      const generated = await pollGenerationJob({
        jobId: started.jobId,
        activeEmail: email,
        activeToken: token,
        publishActivity,
      });

      if (!generated) {
        throw new Error("Generation tracking ended before completion.");
      }

      setResult(generated);
      setMessage(`${generated.plan.businessName} is ready.`);
      await loadProjects();

      if (!returnResult) setTab("preview");
      return generated;
    } catch (generationError) {
      const generationMessage =
        generationError instanceof Error
          ? generationError.message
          : "Website generation failed.";

      setError(generationMessage);

      if (returnResult) {
        throw new Error(generationMessage);
      }

      return null;
    } finally {
      generationInFlightRef.current = false;
      setLoading(false);
    }
  }

  async function editWebsite() {
    if (!result || !editInstruction.trim()) return;
    setLoading(true);
    setError("");
    setMessage("The AI editor is applying your changes…");
    try {
      const response = await fetch(
        `${config.apiBase}/projects/${result.projectId}/edit`,
        {
          method: "POST",
          headers: { "content-type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            email,
            installationId,
            instruction: editInstruction,
          }),
        }
      );
      const data = (await readResponse(response)) as GenerateResponse;
      setResult(data);
      setEditInstruction("");
      setMessage(`Version ${data.versionNumber || "new"} created.`);
      await loadProjects();
    } catch (editError) {
      setError(
        editError instanceof Error ? editError.message : "Editing failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function downloadProjectSource(projectId: string) {
    if (!email || !token) return;

    setDownloadingProjectId(projectId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${config.apiBase}/projects/${encodeURIComponent(
          projectId
        )}/source?email=${encodeURIComponent(email)}`,
        {
          headers: authHeaders(token),
        }
      );

      const source = (await readResponse(response)) as ProjectSourceResponse;

      const zip = createSourceZip(source.files);

      const filename = `${safeDownloadName(source.projectName)}-v${
        source.versionNumber
      }.zip`;

      const file = new File([zip], filename, {
        type: "application/zip",
      });

      const sharingNavigator = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (
        typeof navigator.share === "function" &&
        sharingNavigator.canShare?.({
          files: [file],
        })
      ) {
        await navigator.share({
          title: `${source.projectName} source code`,
          text: "Quantora React project source",
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(zip);
        const anchor = document.createElement("a");

        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = "none";

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      }

      setMessage(`${source.projectName} source ZIP is ready.`);
    } catch (downloadError) {
      if (
        downloadError instanceof DOMException &&
        downloadError.name === "AbortError"
      ) {
        return;
      }

      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download project source."
      );
    } finally {
      setDownloadingProjectId(null);
    }
  }

  async function openProject(projectId: string) {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${config.apiBase}/projects/${projectId}?email=${encodeURIComponent(
          email
        )}`,
        { headers: authHeaders() }
      );
      const data = (await readResponse(response)) as {
        version: {
          version_number: number;
          plan: WebsitePlan;
          preview_html: string;
          full_stack_report?: FullStackReport | null;
        };
      };
      setResult({
        projectId,
        versionNumber: data.version.version_number,
        plan: data.version.plan,
        previewHtml: data.version.preview_html,
        framework: "vite-react",
        fileCount: 9,
        mode: "built-in",
      });
      setTab("preview");
    } catch (projectError) {
      setError(
        projectError instanceof Error
          ? projectError.message
          : "Could not open project."
      );
    } finally {
      setLoading(false);
    }
  }

  async function connectWithToken(
    provider: "github" | "vercel",
    rawToken: string
  ) {
    const cleanToken = rawToken.trim();

    if (cleanToken.length < 10) {
      setError(
        `Paste a valid ${
          provider === "github" ? "GitHub" : "Vercel"
        } access token.`
      );
      return;
    }

    setConnectingProvider(provider);
    setError("");
    setMessage(`Checking ${provider} token…`);

    try {
      const response = await fetch(
        `${config.apiBase}/integrations/${provider}/token`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            email,
            installationId,
            token: cleanToken,
          }),
        }
      );

      const data = (await readResponse(response)) as {
        accountName?: string;
      };

      if (provider === "github") {
        setGithubToken("");
      } else {
        setVercelToken("");
      }

      await loadConnections();

      setMessage(
        `${provider === "github" ? "GitHub" : "Vercel"} connected${
          data.accountName ? ` as ${data.accountName}` : ""
        }.`
      );
    } catch (connectionError) {
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : `Could not connect ${provider}.`
      );
    } finally {
      setConnectingProvider(null);
    }
  }

  async function refreshConnections() {
    setError("");
    try {
      await loadConnections();
      setMessage("Connection status refreshed.");
    } catch (connectionError) {
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : "Could not refresh connections."
      );
    }
  }

  async function publishWebsite() {
    if (!result) return;
    setPublishing(true);
    setError("");
    setMessage("Running final checks, GitHub push, and Vercel preview…");
    try {
      const response = await fetch(
        `${config.apiBase}/projects/${result.projectId}/publish`,
        {
          method: "POST",
          headers: { "content-type": "application/json", ...authHeaders() },
          body: JSON.stringify({ email, installationId }),
        }
      );
      const data = (await readResponse(response)) as {
        productionUrl: string;
        state: string;
      };
      setMessage(`Published. Vercel state: ${data.state}`);
      await loadProjects();
      if (data.productionUrl) await Browser.open({ url: data.productionUrl });
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Publishing failed."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    if (userSession?.token) {
      await fetch(`${config.apiBase}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userSession.token}`,
        },
      }).catch(() => undefined);
    }

    localStorage.removeItem(userSessionKey);
    localStorage.removeItem(activeGenerationJobKey);

    setUserSession(null);
    setForceUserLogin(false);
    setApproved(false);
    setAccess(null);
    setEmail(ownerEmail);
    setOtp("");
    setOtpSent(false);
    setResult(null);
    setProjects([]);
    setConnections({
      github: null,
      vercel: null,
    });
    setTab("chat");
    setError("");
    setMessage("");
  }

  if (showSetup && !validApiConfig(config))
    return (
      <SetupScreen
        config={config}
        onSave={saveRuntimeConfig}
        onCancel={validApiConfig(config) ? () => setShowSetup(false) : undefined}
        error={error}
      />
    );
  if (mode === "admin-login" || mode === "admin-dashboard")
    return (
      <AdminPanelV5
        apiBase={config.apiBase}
        initialMode={mode}
        onMode={handleAdminMode}
        onSetup={
          runtimeConfigOverrideAllowed ? () => setShowSetup(true) : undefined
        }
      />
    );

  if (!approved || forceUserLogin) {
    return (
      <main className="login-shell">
        <section className="login-card universal-login-card">
          <div className="brand-mark logo-shell">
            <img src="/quantora-logo.png" alt="Quantora" />
          </div>

          <p className="eyebrow">MADE BY POOJAK DOSHI</p>
          <h1>Quantora</h1>
          <p className="muted">Secure access to your workspace</p>

          {!otpSent ? (
            <form onSubmit={handleSendOtp}>
              <label>
                Gmail address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  disabled={loginLoading}
                  required
                />
              </label>

              <p className="tiny muted" style={{ marginTop: "4px", marginBottom: "16px" }}>
                Quantora sends a one-time 6-digit code only from <strong>Quantora by Quantacy AI &lt;quantoraby.quantacy@gmail.com&gt;</strong>. No Supabase link or Supabase email is used.
              </p>

              <button
                type="submit"
                className="nx-button nx-button--primary"
                aria-busy={loginLoading}
                disabled={loginLoading}
              >
                {loginLoading ? "Sending code…" : "Send 6-Digit Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: "12px" }}>
                <p style={{ fontSize: "14px", margin: "0 0 6px" }}>
                  Code sent to <strong>{email}</strong> from the official Quantora Gmail account.
                </p>
                <button
                  type="button"
                  className="small-button"
                  style={{ background: "none", border: "none", color: "#0284c7", cursor: "pointer", padding: 0, textDecoration: "underline", fontSize: "13px" }}
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                    setMessage("");
                  }}
                >
                  Change email
                </button>
              </div>

              <label>
                6-Digit Verification Code
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={loginLoading}
                  required
                  style={{ letterSpacing: "6px", fontSize: "20px", textAlign: "center", fontWeight: "700" }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "8px 0 16px" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : ""}
                </span>
                <button
                  type="button"
                  disabled={resendCooldown > 0 || loginLoading}
                  style={{ background: "none", border: "none", color: resendCooldown > 0 ? "#94a3b8" : "#0284c7", cursor: resendCooldown > 0 ? "default" : "pointer", fontSize: "13px" }}
                  onClick={() => void handleSendOtp()}
                >
                  Resend code
                </button>
              </div>

              <button
                type="submit"
                className="nx-button nx-button--primary"
                aria-busy={loginLoading}
                disabled={loginLoading || otp.trim().length !== 6}
              >
                {loginLoading ? "Verifying…" : "Verify & Enter Workspace"}
              </button>
            </form>
          )}

          {message && <p className="success">{message}</p>}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <p className="login-security-note">Protected workspace access</p>
        </section>
      </main>
    );
  }

  return (
    <main
      className={tab === "chat" ? "app-shell chat-page-active" : "app-shell"}
    >
      <header>
        <div>
          <p className="eyebrow">Quantora</p>
          <h1>Build and publish without coding</h1>
        </div>
      </header>
      <nav className="nexora-app-nav">
        <button
          className={tab === "chat" ? "active" : ""}
          onClick={() => setTab("chat")}
        >
          Chat
        </button>

        <button
          className={tab === "create" ? "active" : ""}
          onClick={() => setTab("create")}
        >
          Create
        </button>

        <button
          className={tab === "packs" ? "active" : ""}
          onClick={() => setTab("packs")}
        >
          Packs
          {selectedCapabilityIds.length > 0 && (
            <small className="pack-nav-count">
              {selectedCapabilityIds.length}
            </small>
          )}
        </button>

        <button
          className={tab === "templates" ? "active" : ""}
          onClick={() => setTab("templates")}
        >
          Templates
        </button>

        <button
          className={tab === "preview" ? "active" : ""}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>

        <button
          className={tab === "projects" ? "active my-webs-tab" : "my-webs-tab"}
          onClick={() => {
            setTab("projects");
            void loadProjects();
          }}
        >
          <span>Projects</span>
          {projects.length > 0 && (
            <small className="my-webs-count">{projects.length}</small>
          )}
        </button>

        <button
          className={tab === "live-sites" ? "active" : ""}
          onClick={() => setTab("live-sites")}
        >
          My Live Websites
        </button>

        <button
          className={tab === "analytics" ? "active" : ""}
          onClick={() => {
            setTab("analytics");
            void loadAnalytics();
          }}
        >
          Analytics
        </button>

        <button
          className={tab === "connect" ? "active" : ""}
          onClick={() => setTab("connect")}
        >
          Connect
        </button>

        <button
          type="button"
          className={tab === "cms" ? "active" : ""}
          onClick={() => setTab("cms")}
        >
          CMS
        </button>

        <button
          type="button"
          className={tab === "browser" ? "active" : ""}
          onClick={() => setTab("browser")}
        >
          Browser
        </button>

        <button
          type="button"
          className={tab === "apk" ? "active" : ""}
          onClick={() => setTab("apk")}
        >
          APK Builder
        </button>

        <button
          type="button"
          className={tab === "leads" ? "active" : ""}
          onClick={() => setTab("leads")}
        >
          Leads CRM
        </button>

        <button
          type="button"
          className={tab === "seo" ? "active" : ""}
          onClick={() => setTab("seo")}
        >
          SEO Center
        </button>

        <button
          type="button"
          className={tab === "innovation" ? "active" : ""}
          onClick={() => setTab("innovation")}
        >
          Innovation Hub
        </button>

        <button
          type="button"
          className={tab === "growth" ? "active" : ""}
          onClick={() => setTab("growth")}
        >
          Growth Tools
        </button>

        <button
          type="button"
          className={tab === "spatial" ? "active" : ""}
          onClick={() => setTab("spatial")}
        >
          3D / 4D / 5D Studio
        </button>

      <button
        className={tab === "account" ? "active" : ""}
        onClick={() => setTab("account")}
      >
        Settings
      </button>
      </nav>
      {message && <p className="success notice-wide">{message}</p>}
      {error && (
        <p className="error notice-wide" role="alert">
          {error}
        </p>
      )}
      {activity &&
        ["queued", "running", "failed"].includes(activity.status) && (
          <section
            className="generation-control-bar"
            aria-label="Generation controls"
          >
            {['queued', 'running'].includes(activity.status) && (
              <MakingAnimation
                status={activity.status as 'queued' | 'running'}
                progress={activity.progress}
                currentStep={activity.currentStep}
                currentAgent={activity.currentAgent}
              />
            )}
            <div>
              <strong>
                {activity.status === "failed"
                  ? `Generation failed${
                      activity.failedStage ? ` at ${activity.failedStage}` : ""
                    }`
                  : `Generation ${activity.status} · ${Math.round(
                      activity.progress
                    )}%`}
              </strong>
              {activity.errorMessage && <small>{activity.errorMessage}</small>}
            </div>
            {["queued", "running"].includes(activity.status) && (
              <button type="button" onClick={() => void cancelGeneration()}>
                Cancel generation
              </button>
            )}
            {activity.status === "failed" && activity.retryable && (
              <button
                type="button"
                onClick={() => void retryGeneration()}
                disabled={loading}
              >
                Retry failed stage
              </button>
            )}
          </section>
        )}
      <div
        className={
          tab === "chat"
            ? "nexora-main-content chat-content"
            : "nexora-main-content"
        }
      >
        {tab === "chat" && (
          <ChatStudio
            busy={loading}
            userKey={
              userSession?.internalEmail || email
            }
            apiBase={config.apiBase}
            token={token}
            installationId={installationId}
            activity={activity}
            thinkMaxEnabled={thinkMaxEnabled}
            onThinkMaxChange={setThinkMaxEnabled}
            onOpenPreview={() => setTab("preview")}
            onNavigate={(nextTab) => {
              setTab(nextTab);

              if (nextTab === "projects") {
                void loadProjects();
              }
            }}
            onChat={async (
              chatPrompt,
              chatHistory,
              attachment,
              messageIdentity
            ) => {
              if (!token) throw new Error("Please log in again.");
              const requestBody = JSON.stringify({
                message: chatPrompt,
                history: chatHistory.map((item) => ({
                  role: item.role,
                  text: item.text,
                })),
                installationId,
                ...messageIdentity,
                attachment: attachment
                  ? { name: attachment.name, dataUrl: attachment.dataUrl }
                  : null,
              });
              let response: Response | null = null;
              let networkError: unknown;
              for (let attempt = 0; attempt < 2; attempt += 1) {
                try {
                  response = await fetch(`${config.apiBase}/assistant/chat`, {
                    method: "POST",
                    headers: {
                      "content-type": "application/json",
                      Authorization: `Bearer ${token}`,
                      "X-Device-Id": installationId,
                    },
                    body: requestBody,
                  });
                  break;
                } catch (requestError) {
                  networkError = requestError;
                }
              }
              if (!response) {
                throw networkError instanceof Error
                  ? networkError
                  : new Error("Assistant request failed.");
              }
              const data = (await response.json()) as {
                reply?: string;
                error?: string;
                providerErrors?: string[];
                processingDurationMs?: number;
                usage?: ChatAssistantReply["tokenUsage"];
                provider?: string | null;
                model?: string | null;
              };
              if (!response.ok || !data.reply)
                throw new Error(
                  data.error ||
                    data.providerErrors?.join(" | ") ||
                    "Assistant request failed."
                );
              return {
                text: data.reply,
                processingDurationMs:
                  typeof data.processingDurationMs === "number"
                    ? data.processingDurationMs
                    : null,
                tokenUsage: data.usage || null,
                provider: data.provider || null,
                model: data.model || null,
              };
            }}
            onGenerate={async (chatPrompt, chatImage, activityListener) => {
              const generated = await generateWebsite(
                chatPrompt,
                true,
                chatImage,
                activityListener
              );

              return generated
                ? {
                    projectName: generated.plan.businessName,
                    jobId: generated.jobId
                  }
                : null;
            }}
          />
        )}

        {tab === "packs" && (
          <section className="panel capability-panel">
            <div className="capability-heading">
              <div>
                <p className="eyebrow">WEBSITE POWER-UPS</p>

                <h2>Capability packs</h2>

                <p className="muted">
                  Select extra capabilities that the AI council must include in
                  every generated website.
                </p>
              </div>

              {selectedCapabilityIds.length > 0 && (
                <button
                  type="button"
                  className="refresh"
                  onClick={() => setSelectedCapabilityIds([])}
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="capability-summary">
              <strong>{selectedCapabilityIds.length}</strong>

              <span>
                active capability
                {selectedCapabilityIds.length === 1 ? "" : " packs"}
              </span>
            </div>

            <div className="capability-grid">
              {capabilityPacks.map((pack) => {
                const selected = selectedCapabilityIds.includes(pack.id);

                return (
                  <article
                    className={
                      selected ? "capability-card selected" : "capability-card"
                    }
                    key={pack.id}
                  >
                    <div className="capability-card-top">
                      <span>{pack.icon}</span>

                      <button
                        type="button"
                        className="capability-toggle"
                        aria-pressed={selected}
                        onClick={() => {
                          setSelectedCapabilityIds((current) =>
                            current.includes(pack.id)
                              ? current.filter((id) => id !== pack.id)
                              : [...current, pack.id]
                          );
                        }}
                      >
                        {selected ? "Enabled" : "Enable"}
                      </button>
                    </div>

                    <div>
                      <h3>{pack.name}</h3>
                      <p>{pack.description}</p>
                    </div>

                    <div className="capability-features">
                      {pack.features.map((feature) => (
                        <span key={feature}>{feature}</span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="primary capability-continue"
              onClick={() => setTab("create")}
            >
              Continue to website builder
            </button>
          </section>
        )}

        {tab === "templates" && (
          <section className="panel templates-panel">
            <div className="templates-heading">
              <div>
                <p className="eyebrow">READY-TO-BUILD DESIGNS</p>

                <h2>Template library</h2>

                <p className="muted">
                  Choose a professional starting point, customise the prompt and
                  generate your website.
                </p>
              </div>

              <label className="template-search">
                <span>Search templates</span>

                <input
                  value={templateSearch}
                  onChange={(event) => setTemplateSearch(event.target.value)}
                  placeholder="Jewellery, ecommerce, tuition…"
                  type="search"
                />
              </label>
            </div>

            <div className="template-results">
              <span>
                {filteredTemplates.length} template
                {filteredTemplates.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="template-grid">
              {filteredTemplates.map((template) => (
                <article className="template-card" key={template.id}>
                  <div className="template-card-top">
                    <span className="template-icon">{template.icon}</span>

                    <small>{template.category}</small>
                  </div>

                  <div>
                    <h3>{template.name}</h3>

                    <p>{template.description}</p>
                  </div>

                  <div className="template-features">
                    {template.features.map((feature) => (
                      <span key={feature}>{feature}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPrompt(template.prompt);
                      setTab("create");

                      setMessage(`${template.name} template selected.`);

                      setError("");
                    }}
                  >
                    Use this template
                  </button>
                </article>
              ))}
            </div>

            {!filteredTemplates.length && (
              <div className="empty compact">No matching templates found.</div>
            )}
          </section>
        )}

        {tab === "create" && (
          <section className="panel">
            <p className="eyebrow">ORCHESTRATED AI BRAIN</p>
            <h2>Describe the complete website</h2>
            <p className="muted">
              Gemini assists with planning and content. The orchestrator,
              templates, validators, and build system remain in control.
            </p>
            <div className="chips">
              <span>React source</span>
              <span>Auto logo</span>
              <span>SEO</span>
              <span>Database form</span>
              <span>Double validation</span>
              <span>Vercel publish</span>
            </div>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={10}
              maxLength={6000}
            />
            <p className="prompt-count">{prompt.length}/6000</p>
            <section
              className="website-palette-picker"
              aria-labelledby="website-palette-title"
            >
              <div>
                <h3 id="website-palette-title">Website colour palette</h3>
                <p className="muted">
                  Optional. This controls the generated website and is separate
                  from the Nexora app appearance.
                </p>
              </div>
              <div className="website-palette-options">
                {websitePalettes.map((palette) => (
                  <button
                    type="button"
                    key={palette.id}
                    className={
                      websitePalette.id === palette.id ? "selected" : ""
                    }
                    onClick={() => setWebsitePalette(palette)}
                    aria-pressed={websitePalette.id === palette.id}
                  >
                    {palette.id !== "auto" && (
                      <span
                        className="palette-swatch"
                        style={{
                          background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`,
                        }}
                      />
                    )}
                    <span>{palette.label}</span>
                  </button>
                ))}
              </div>
            </section>
            <ThinkMaxControl
              enabled={thinkMaxEnabled}
              onChange={setThinkMaxEnabled}
              disabled={loading}
              description="Deeper planning and architecture review. Builds may take longer."
              descriptionId="advanced-thinkmax-description"
            />
            <button
              type="button"
              className="secondary"
              onClick={() => setShowBriefWizard(true)}
              style={{
                marginBottom: "12px",
                width: "100%",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))",
                border: "1px solid rgba(99, 102, 241, 0.4)",
                color: "#a5b4fc",
                fontWeight: 700,
                padding: "12px",
                borderRadius: "10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              ✨ Open Guided Website Brief Wizard
            </button>
            <button
              className="primary"
              onClick={() => void generateWebsite()}
              disabled={loading || prompt.trim().length < 20}
            >
              {loading ? "Building project…" : "Generate website"}
            </button>
          </section>
        )}
        {tab === "preview" && (
          <section className="panel preview-panel">
            {result ? (
              <>
                <div className="preview-top">
                  <div>
                    <p className="eyebrow">PROJECT STUDIO</p>
                    <h2>{status}</h2>
                  </div>
                  <div className="preview-actions">
                    <button
                      onClick={() =>
                        void downloadProjectSource(result.projectId)
                      }
                      disabled={downloadingProjectId === result.projectId}
                    >
                      {downloadingProjectId === result.projectId
                        ? "Preparing ZIP…"
                        : "Download Source ZIP"}
                    </button>
                    <button
                      onClick={publishWebsite}
                      disabled={
                        publishing ||
                        !connections.github ||
                        !connections.vercel ||
                        !backendVerified
                      }
                    >
                      {publishing ? "Publishing…" : "Publish Live"}
                    </button>
                  </div>
                </div>
                {(!connections.github || !connections.vercel) && (
                  <p className="notice">
                    Connect GitHub and Vercel before publishing.
                  </p>
                )}
                {!backendVerified && (
                  <p className="notice">
                    Review and verify Backend &amp; Database before publishing.
                  </p>
                )}

                {/* Multi-Device Live Preview Toolbar */}
                <div
                  className="preview-device-toolbar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(30, 41, 59, 0.7)",
                    borderRadius: "12px",
                    marginBottom: "14px",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      style={{
                        background: previewDevice === "desktop" ? "#6366f1" : "#1e293b",
                        border: "none",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: previewDevice === "desktop" ? 700 : 500
                      }}
                    >
                      🖥️ Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("tablet")}
                      style={{
                        background: previewDevice === "tablet" ? "#6366f1" : "#1e293b",
                        border: "none",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: previewDevice === "tablet" ? 700 : 500
                      }}
                    >
                      📱 Tablet (768px)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      style={{
                        background: previewDevice === "mobile" ? "#6366f1" : "#1e293b",
                        border: "none",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: previewDevice === "mobile" ? 700 : 500
                      }}
                    >
                      📱 Mobile (375px)
                    </button>
                    {(previewDevice === "tablet" || previewDevice === "mobile") && (
                      <button
                        type="button"
                        onClick={() => setPreviewOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"))}
                        style={{
                          background: "#334155",
                          border: "none",
                          color: "#fff",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                        title="Rotate Orientation"
                      >
                        🔄 {previewOrientation === "portrait" ? "Portrait" : "Landscape"}
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {versionHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const prevSnapshot = versionHistory[1];
                          if (prevSnapshot) {
                            setResult(prevSnapshot.result);
                            setVersionHistory((prev) => prev.slice(1));
                            setMessage(`Reverted to previous version from ${prevSnapshot.timestamp}`);
                          }
                        }}
                        style={{
                          background: "#475569",
                          border: "none",
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                        title="Undo last edit and restore previous version"
                      >
                        ↩️ Undo AI Change
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowVersionDrawer(true)}
                      style={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                    >
                      🕒 Version History ({Math.max(1, versionHistory.length)})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const blob = new Blob([result.previewHtml], { type: "text/html" });
                        const url = URL.createObjectURL(blob);
                        window.open(url, "_blank");
                      }}
                      style={{
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.15)",
                        color: "#fff",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "12px"
                      }}
                      title="Open in new window"
                    >
                      ↗ Popout
                    </button>
                  </div>
                </div>

                {/* Responsive Viewport Frame */}
                <div
                  className="preview-viewport-container"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#0b1120",
                    padding: previewDevice === "desktop" ? "0" : "24px 12px",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    overflowX: "auto",
                    marginBottom: "20px"
                  }}
                >
                  <div
                    style={{
                      width:
                        previewDevice === "desktop"
                          ? "100%"
                          : previewDevice === "tablet"
                          ? previewOrientation === "portrait"
                            ? "768px"
                            : "1024px"
                          : previewOrientation === "portrait"
                          ? "375px"
                          : "667px",
                      maxWidth: "100%",
                      height:
                        previewDevice === "desktop"
                          ? "720px"
                          : previewDevice === "tablet"
                          ? previewOrientation === "portrait"
                            ? "1024px"
                            : "768px"
                          : previewOrientation === "portrait"
                          ? "720px"
                          : "375px",
                      boxShadow:
                        previewDevice !== "desktop"
                          ? "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 12px #1e293b, 0 0 0 14px rgba(255,255,255,0.1)"
                          : "none",
                      borderRadius: previewDevice !== "desktop" ? "32px" : "12px",
                      overflow: "hidden",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      background: "#fff"
                    }}
                  >
                    <iframe
                      title="Generated website preview"
                      sandbox="allow-forms allow-scripts allow-popups"
                      srcDoc={result.previewHtml}
                      style={{ width: "100%", height: "100%", border: 0 }}
                    />
                  </div>
                </div>

                <div className="editor-box">
                  <h3>AI website editor</h3>
                  <textarea
                    value={editInstruction}
                    onChange={(event) => setEditInstruction(event.target.value)}
                    rows={4}
                    placeholder="Change the theme, add pricing, remove a section…"
                  />
                  <button
                    onClick={editWebsite}
                    disabled={loading || !editInstruction.trim()}
                  >
                    {loading ? "Applying changes…" : "Apply edit"}
                  </button>
                </div>
                <BackendWizard
                  apiBase={config.apiBase}
                  projectId={result.projectId}
                  token={token}
                  backendRequired={Boolean(
                    result.plan.appSpec?.backend?.required,
                  )}
                  onStateChange={(backend) =>
                    setBackendVerified(backend?.status === "verified")
                  }
                />
              </>
            ) : (
              <div className="empty">Generate or open a project first.</div>
            )}
          </section>
        )}
        {tab === "leads" && (
          <SyntropixLeadCRM
            apiBase={config.apiBase}
            email={email}
            token={token}
            installationId={installationId}
            projects={projects as any}
          />
        )}
        {tab === "seo" && (
          <SeoMonitoringDashboard
            apiBase={config.apiBase}
            projectId={result?.projectId || projects[0]?.id}
            projectTitle={result?.plan?.businessName || projects[0]?.name || "Website"}
            productionUrl={projects[0]?.production_url || ""}
            email={email}
            token={token}
            installationId={installationId}
          />
        )}
        {tab === "cms" && (
          <CmsStudio
            apiBase={config.apiBase}
            email={email}
            token={token}
            installationId={installationId}
            projects={projects}
          />
        )}
        {tab === "browser" && <BrowserStudio />}
        {tab === "apk" && (
          <WebToAppPackager
            apiBase={config.apiBase}
            email={email}
            token={token}
            installationId={installationId}
            activeProject={result ? { id: result.projectId, title: result.plan.businessName, previewHtml: result.previewHtml } : projects[0] ? { id: projects[0].id, title: projects[0].name } : null}
          />
        )}

        {tab === "innovation" && (
          <InnovationHub
            apiBase={config.apiBase}
            projectId={result?.projectId || projects[0]?.id}
            projectTitle={result?.plan.businessName || projects[0]?.name || "Current project"}
            email={email}
            token={token}
            installationId={installationId}
            onApplyPrompt={(nextPrompt) => {
              setPrompt(nextPrompt);
              setTab("create");
              setMessage("Review the generated proposal in the website builder before starting generation.");
              setError("");
            }}
          />
        )}

        {tab === "growth" && (
          <GrowthToolsHub
            apiBase={config.apiBase}
            projectId={result?.projectId || projects[0]?.id}
            email={email}
            token={token}
            installationId={installationId}
          />
        )}

        {tab === "spatial" && (
          <SpatialStudio
            apiBase={config.apiBase}
            projectId={result?.projectId || projects[0]?.id}
            projectTitle={result?.plan.businessName || projects[0]?.name || "Current project"}
            email={email}
            token={token}
            installationId={installationId}
            onUseBlueprint={(nextPrompt) => {
              setPrompt(nextPrompt);
              setTab("create");
              setMessage("Approved spatial blueprint loaded into the builder. Review the prompt before starting generation.");
              setError("");
            }}
          />
        )}

        {tab === "analytics" && (
          <section className="panel analytics-panel">
            <div className="analytics-heading">
              <div>
                <p className="eyebrow">PERFORMANCE DASHBOARD</p>

                <h2>Website analytics</h2>

                <p className="muted">
                  Track builds, published websites, enquiries and AI generation
                  success.
                </p>
              </div>

              <button
                className="refresh"
                onClick={() => void loadAnalytics()}
                disabled={analyticsLoading}
              >
                {analyticsLoading ? "Refreshing…" : "Refresh analytics"}
              </button>
            </div>

            {analytics ? (
              <>
                <div className="analytics-grid">
                  <article>
                    <span>Total websites</span>
                    <strong>{analytics.totalWebsites}</strong>
                    <small>All generated projects</small>
                  </article>

                  <article>
                    <span>Live websites</span>
                    <strong>{analytics.liveWebsites}</strong>
                    <small>Successfully published</small>
                  </article>

                  <article>
                    <span>AI builds</span>
                    <strong>{analytics.totalBuilds}</strong>
                    <small>{analytics.buildsToday} today</small>
                  </article>

                  <article>
                    <span>Success rate</span>
                    <strong>{analytics.successRate}%</strong>
                    <small>{analytics.completedBuilds} completed</small>
                  </article>

                  <article>
                    <span>Failed builds</span>
                    <strong>{analytics.failedBuilds}</strong>
                    <small>Validation or provider failures</small>
                  </article>

                  <article>
                    <span>Enquiries</span>
                    <strong>{analytics.enquiries}</strong>
                    <small>Website form submissions</small>
                  </article>
                </div>

                <div className="analytics-layout">
                  <article className="analytics-chart-card">
                    <div>
                      <span>LAST 7 DAYS</span>
                      <h3>Generation activity</h3>
                    </div>

                    <div className="analytics-bars">
                      {analytics.dailyBuilds.map((item) => {
                        const peak = Math.max(
                          1,
                          ...analytics.dailyBuilds.map((point) => point.count)
                        );

                        const height = Math.max(
                          8,
                          Math.round((item.count / peak) * 100)
                        );

                        return (
                          <div className="analytics-bar-item" key={item.date}>
                            <strong>{item.count}</strong>

                            <div className="analytics-bar-track">
                              <span
                                style={{
                                  height: `${height}%`,
                                }}
                              />
                            </div>

                            <small>{item.label}</small>
                          </div>
                        );
                      })}
                    </div>
                  </article>

                  <article className="analytics-types-card">
                    <div>
                      <span>POPULAR CATEGORIES</span>
                      <h3>Website types</h3>
                    </div>

                    <div className="analytics-type-list">
                      {analytics.topWebsiteTypes.length ? (
                        analytics.topWebsiteTypes.map((item) => (
                          <div key={item.name}>
                            <span>{item.name}</span>
                            <strong>{item.count}</strong>
                          </div>
                        ))
                      ) : (
                        <p className="muted">No category data yet.</p>
                      )}
                    </div>
                  </article>
                </div>
              </>
            ) : (
              <div className="empty compact">
                {analyticsLoading
                  ? "Loading analytics…"
                  : "Tap refresh to load analytics."}
              </div>
            )}
          </section>
        )}

        {tab === "projects" && (
          <section className="panel my-webs-panel">
            <div className="my-webs-heading">
              <div>
                <p className="eyebrow">MY WEBS</p>
                <h2>All your websites</h2>
                <p className="muted">
                  Open, edit or visit every website created from this account.
                </p>
              </div>

              <button
                className="my-webs-refresh"
                onClick={() => void loadProjects()}
                disabled={loading}
              >
                {loading ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div className="my-webs-summary">
              <span>Total websites</span>
              <strong>{projects.length}</strong>
            </div>

            <div className="project-list my-webs-list">
              {projects.length ? (
                projects.map((project) => (
                  <article key={project.id}>
                    <div className="my-web-details">
                      <strong>{project.name}</strong>

                      <span>
                        {project.website_type}
                        {" • "}
                        {project.framework}
                        {" • "}
                        {project.status}
                      </span>

                      {project.production_url && (
                        <small>Live website available</small>
                      )}
                    </div>

                    <div className="project-actions">
                      <button onClick={() => void openProject(project.id)}>
                        Open
                      </button>

                      <button
                        onClick={() => void downloadProjectSource(project.id)}
                        disabled={downloadingProjectId === project.id}
                      >
                        {downloadingProjectId === project.id
                          ? "Preparing…"
                          : "Download ZIP"}
                      </button>

                      {project.production_url && (
                        <a
                          href={project.production_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Live
                        </a>
                      )}

                      {project.github_repository && (
                        <a
                          href={project.github_repository}
                          target="_blank"
                          rel="noreferrer"
                        >
                          GitHub
                        </a>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty compact my-webs-empty">
                  <strong>No websites yet</strong>
                  <span>
                    Create your first website and it will appear here.
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "live-sites" && (
          <LiveWebsites
            apiBase={config.apiBase}
            token={token}
            email={email}
            installationId={installationId}
            onOpenProject={async (projectId) => {
              await openProject(projectId);
              setTab("preview");
            }}
          />
        )}

        {tab === "connect" && (
          <section className="panel">
            <p className="eyebrow">PUBLISHING ACCOUNTS</p>
            <h2>Paste access tokens</h2>
            <p className="muted">
              Tokens are sent to the backend, verified, encrypted and stored for
              this Nexora account.
            </p>

            <button
              type="button"
              className="refresh"
              onClick={() => setShowSetupGuide((current) => !current)}
            >
              {showSetupGuide ? "Hide setup guide" : "Open setup guide"}
            </button>

            {showSetupGuide && (
              <section className="panel token-setup-guide">
                <p className="eyebrow">NEW USER SETUP</p>
                <h2>GitHub and Vercel token setup</h2>

                <p className="muted">
                  Use personal access tokens. Do not paste account passwords,
                  OAuth Client IDs or OAuth Client Secrets.
                </p>

                <article>
                  <h3>1. Create your GitHub token</h3>

                  <ol>
                    <li>Tap the direct GitHub button below and sign in.</li>
                    <li>Keep the description as Quantora.</li>
                    <li>Select an expiration date.</li>
                    <li>Enable the public_repo permission.</li>
                    <li>Generate and copy the token immediately.</li>
                    <li>
                      Return to Quantora and paste it in the GitHub field.
                    </li>
                  </ol>

                  <button
                    type="button"
                    onClick={() =>
                      void Browser.open({
                        url: "https://github.com/settings/tokens/new?scopes=public_repo&description=Quantora",
                      })
                    }
                  >
                    Open GitHub Token Page
                  </button>
                </article>

                <article>
                  <h3>2. Create your Vercel token</h3>

                  <ol>
                    <li>Tap the direct Vercel button below and sign in.</li>
                    <li>Tap Create Token.</li>
                    <li>Name the token Quantora.</li>
                    <li>Select the account where websites should deploy.</li>
                    <li>Select an expiration date and create the token.</li>
                    <li>
                      Copy it, return here and paste it in the Vercel field.
                    </li>
                  </ol>

                  <button
                    type="button"
                    onClick={() =>
                      void Browser.open({
                        url: "https://vercel.com/account/settings/tokens",
                      })
                    }
                  >
                    Open Vercel Token Page
                  </button>
                </article>

                <article>
                  <h3>3. Connect both accounts</h3>

                  <ol>
                    <li>Paste and connect the GitHub token.</li>
                    <li>Paste and connect the Vercel token.</li>
                    <li>Both cards must show Connected before publishing.</li>
                    <li>Never share either token with another person.</li>
                  </ol>

                  <button
                    type="button"
                    onClick={() => {
                      const accountName = (
                        userSession?.username || email
                      ).toLowerCase();

                      localStorage.setItem(
                        `nexora-token-guide-seen:${accountName}`,
                        "1"
                      );

                      setShowSetupGuide(false);
                    }}
                  >
                    Got it - Continue
                  </button>
                </article>
              </section>
            )}

            <div className="connection-grid">
              <article className={connections.github ? "connected" : ""}>
                <h3>GitHub</h3>
                <p>
                  {connections.github
                    ? `Connected as ${
                        connections.github.external_account_name ||
                        "GitHub user"
                      }`
                    : "Paste a GitHub personal access token with repository access."}
                </p>

                <input
                  type="password"
                  value={githubToken}
                  onChange={(event) => setGithubToken(event.target.value)}
                  placeholder="Paste GitHub access token"
                  autoComplete="off"
                  spellCheck={false}
                />

                <button
                  onClick={() => void connectWithToken("github", githubToken)}
                  disabled={
                    connectingProvider !== null ||
                    githubToken.trim().length < 10
                  }
                >
                  {connectingProvider === "github"
                    ? "Checking GitHub…"
                    : connections.github
                    ? "Replace GitHub Token"
                    : "Connect GitHub Token"}
                </button>
              </article>

              <article className={connections.vercel ? "connected" : ""}>
                <h3>Vercel</h3>
                <p>
                  {connections.vercel
                    ? `Connected to ${
                        connections.vercel.external_account_name || "Vercel"
                      }`
                    : "Paste a Vercel access token for live deployment."}
                </p>

                <input
                  type="password"
                  value={vercelToken}
                  onChange={(event) => setVercelToken(event.target.value)}
                  placeholder="Paste Vercel access token"
                  autoComplete="off"
                  spellCheck={false}
                />

                <button
                  onClick={() => void connectWithToken("vercel", vercelToken)}
                  disabled={
                    connectingProvider !== null ||
                    vercelToken.trim().length < 10
                  }
                >
                  {connectingProvider === "vercel"
                    ? "Checking Vercel…"
                    : connections.vercel
                    ? "Replace Vercel Token"
                    : "Connect Vercel Token"}
                </button>
              </article>
            </div>

            <button
              className="refresh"
              onClick={refreshConnections}
              disabled={connectingProvider !== null}
            >
              Refresh connections
            </button>
          </section>
        )}
        {tab === "account" && (
          <section className="panel">
            <p className="eyebrow">ACCOUNT</p>
            <h2>{userSession?.username || email}</h2>

            <div className="account-grid">
              <article>
                <span>Role</span>
                <strong>{access?.role}</strong>
              </article>
              <article>
                <span>Devices</span>
                <strong>
                  {access?.activeDevices}/{access?.maxDevices}
                </strong>
              </article>
              <article>
                <span>Token entitlement</span>
                <strong>Non-expiring</strong>
              </article>
              <article>
                <span>GitHub</span>
                <strong>
                  {connections.github ? "Connected" : "Not connected"}
                </strong>
              </article>
              <article>
                <span>Vercel</span>
                <strong>
                  {connections.vercel ? "Connected" : "Not connected"}
                </strong>
              </article>
            </div>

            <TokenWalletPanel
              apiBase={config.apiBase}
              email={
                userSession?.internalEmail || email
              }
              token={token}
              installationId={installationId}
            />

            {userSession && (
              <section className="account-password-card" aria-labelledby="account-security-title">
                <span>Security</span>
                <h3 id="account-security-title">Gmail OTP protection</h3>
                <small>
                  Subscriber access is verified with a fresh 6-digit code sent by
                  Quantora by Quantacy AI from quantoraby.quantacy@gmail.com.
                  Password login, Supabase Auth email, and magic links are not
                  used.
                </small>
              </section>
            )}

            <section className="theme-setting">
              <div className="appearance-heading">
                <div>
                  <span>Settings → Appearance</span>
                  <small>
                    Preview first, then apply locally and sync to your account.
                  </small>
                </div>
                <span className="appearance-sync-state">
                  {appearanceSaving ? "Saving…" : "Account synced"}
                </span>
              </div>
              <div className="theme-choice">
                {(["system", "light", "dark"] as const).map((modeOption) => (
                  <button
                    type="button"
                    key={modeOption}
                    className={
                      appearanceDraft.appearanceMode === modeOption
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setAppearanceDraft((current) => ({
                        ...current,
                        appearanceMode: modeOption,
                      }))
                    }
                  >
                    {modeOption.slice(0, 1).toUpperCase() +
                      modeOption.slice(1)}
                  </button>
                ))}
              </div>

              <div className="accent-choice" aria-label="Accent themes">
                {accentPresets.map((preset) => (
                  <button
                    type="button"
                    key={preset.id}
                    className={
                      appearanceDraft.accentPreset === preset.id
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setAppearanceDraft((current) => ({
                        ...current,
                        accentPreset: preset.id,
                      }))
                    }
                  >
                    <span style={{ backgroundColor: preset.colour }} />
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={
                    appearanceDraft.accentPreset === "custom" ? "selected" : ""
                  }
                  onClick={() =>
                    setAppearanceDraft((current) => ({
                      ...current,
                      accentPreset: "custom",
                      customAccent: current.customAccent || "#06b6d4",
                    }))
                  }
                >
                  <span
                    style={{
                      backgroundColor:
                        appearanceDraft.customAccent || "#06b6d4",
                    }}
                  />
                  Custom colour
                </button>
              </div>

              {appearanceDraft.accentPreset === "custom" && (
                <label>
                  Custom accent
                  <input
                    type="color"
                    value={appearanceDraft.customAccent || "#06b6d4"}
                    onChange={(event) =>
                      setAppearanceDraft((current) => ({
                        ...current,
                        customAccent: event.target.value,
                      }))
                    }
                  />
                </label>
              )}

              <div
                className="appearance-live-preview"
                style={{
                  background:
                    appearanceDraft.appearanceMode === "light"
                      ? "#f8fafc"
                      : "#07101f",
                  color:
                    appearanceDraft.appearanceMode === "light"
                      ? "#0f172a"
                      : "#f8fafc",
                  borderColor: resolveAccent(appearanceDraft),
                }}
              >
                <span>LIVE PREVIEW</span>
                <h3>Nexora project card</h3>
                <p>Buttons, focus states and navigation use this accent.</p>
                <button
                  type="button"
                  style={{
                    background: resolveAccent(appearanceDraft),
                    color: contrastForAccent(resolveAccent(appearanceDraft))
                      .text,
                  }}
                >
                  Primary action
                </button>
              </div>

              <p
                className={
                  contrastForAccent(resolveAccent(appearanceDraft)).accessible
                    ? "success"
                    : "error"
                }
              >
                Contrast{" "}
                {contrastForAccent(
                  resolveAccent(appearanceDraft),
                ).ratio.toFixed(2)}
                :1 ·{" "}
                {contrastForAccent(resolveAccent(appearanceDraft)).accessible
                  ? "WCAG AA"
                  : "Does not meet WCAG AA"}
              </p>

              <button
                type="button"
                onClick={() => void applyAppearancePreference()}
                disabled={
                  appearanceSaving ||
                  !contrastForAccent(resolveAccent(appearanceDraft)).accessible
                }
              >
                {appearanceSaving ? "Applying…" : "Apply appearance"}
              </button>
            </section>

            <button className="logout" onClick={() => void logout()}>
              Log out
            </button>
          </section>
        )}
        <footer>Quantora · Made by Poojak Doshi</footer>

        <WebsiteBriefWizard
          isOpen={showBriefWizard}
          onClose={() => setShowBriefWizard(false)}
          onGenerate={(compiledPrompt) => {
            setPrompt(compiledPrompt);
            setTab("create");
            setTimeout(() => {
              void generateWebsite();
            }, 100);
          }}
        />

        {showVersionDrawer && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(10, 15, 29, 0.75)",
              backdropFilter: "blur(8px)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "flex-end"
            }}
            onClick={() => setShowVersionDrawer(false)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "420px",
                background: "#0f172a",
                height: "100%",
                borderLeft: "1px solid rgba(255,255,255,0.12)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "-10px 0 30px rgba(0,0,0,0.5)",
                color: "#fff"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>Project Version History</h3>
                <button
                  type="button"
                  onClick={() => setShowVersionDrawer(false)}
                  style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "20px", cursor: "pointer" }}
                >
                  ✕
                </button>
              </div>

              <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: 0 }}>
                Rollback to any previous snapshot safely without losing edits.
              </p>

              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
                {versionHistory.length === 0 ? (
                  <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                    Current version is the initial build. Subsequent edits will create rollback points here.
                  </div>
                ) : (
                  versionHistory.map((snap, idx) => (
                    <div
                      key={snap.id}
                      style={{
                        background: idx === 0 ? "rgba(99, 102, 241, 0.12)" : "#1e293b",
                        border: `1px solid ${idx === 0 ? "#6366f1" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "12px",
                        padding: "14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14px" }}>
                          {idx === 0 ? "🌟 Current Version" : `Revision #${versionHistory.length - idx}`}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{snap.timestamp}</span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#cbd5e1" }}>{snap.label}</span>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setResult(snap.result);
                            setMessage(`Restored project version from ${snap.timestamp}`);
                            setShowVersionDrawer(false);
                          }}
                          style={{
                            marginTop: "6px",
                            background: "#6366f1",
                            border: "none",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: 600
                          }}
                        >
                          ↩️ Rollback to this version
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SetupScreen({
  config,
  onSave,
  onCancel,
  error,
}: {
  config: RuntimeConfig;
  onSave: (config: RuntimeConfig) => void;
  onCancel?: () => void;
  error: string;
}) {
  const [draft, setDraft] = useState(config);
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark logo-shell">
          <img src="/quantora-logo.png" alt="Quantora" />
        </div>
        <p className="eyebrow">ONE-TIME APP SETUP</p>
        <h1>Backend connection</h1>
        <p className="muted">
          Quantora uses the public backend API for Gmail-only 6-digit OTP login.
          Gmail OAuth secrets are configured on the server and must never be
          pasted into the APK.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
          }}
        >
          <label>
            Backend API URL
            <input
              value={draft.apiBase}
              onChange={(event) =>
                setDraft({ ...draft, apiBase: event.target.value })
              }
              placeholder="https://your-api.workers.dev"
            />
          </label>
          <button className="nx-button nx-button--primary">
            Save and continue
          </button>
        </form>
        {onCancel && (
          <button
            className="nx-button nx-button--compact small-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
        {error && <p className="error">{error}</p>}
        <p className="tiny">
          Only the public Worker URL belongs here. Database and Gmail credentials
          remain server-side.
        </p>
      </section>
    </main>
  );
}
