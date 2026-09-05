export interface GeneratedProject {
  id: string;
  title?: string;
  files?: Array<{ path: string; content: string }>;
  previewUrl?: string;
  previewHtml?: string;
  version?: number;
}
