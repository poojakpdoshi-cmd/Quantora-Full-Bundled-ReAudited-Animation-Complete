export type RuntimeConfig = {
  apiBase: string;
};

export function cleanRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  return {
    apiBase: config.apiBase.trim().replace(/\/$/, '')
  };
}

export function validApiConfig(config: RuntimeConfig): boolean {
  return /^https?:\/\//.test(config.apiBase);
}

export function validRuntimeConfig(config: RuntimeConfig): boolean {
  return validApiConfig(config);
}

export function resolveRuntimeConfig(
  bundled: RuntimeConfig,
  storedValue: string | null,
  allowStoredOverride: boolean
): RuntimeConfig {
  const cleanBundled = cleanRuntimeConfig(bundled);
  if (!allowStoredOverride || !storedValue) return cleanBundled;
  try {
    const stored = cleanRuntimeConfig(JSON.parse(storedValue) as RuntimeConfig);
    return validApiConfig(stored) ? stored : cleanBundled;
  } catch {
    return cleanBundled;
  }
}
