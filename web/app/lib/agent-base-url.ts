function normalizeBaseURL(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function getAgentBaseURL(): string {
  const fromEnv = import.meta.env.VITE_AGENT_API_BASE_URL;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") {
    return normalizeBaseURL(fromEnv.trim());
  }
  return import.meta.env.DEV ? "http://localhost:4100/agent" : "/agent";
}
