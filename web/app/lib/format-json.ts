export function formatJson(value: unknown): string {
  if (value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return String(value);
  }
}

export function formatJsonSource(source: string): string {
  try {
    return formatJson(JSON.parse(source));
  } catch {
    return source;
  }
}

export function formatJsonEvents(rawEvents: string[]): string {
  return rawEvents.map(formatJsonSource).join("\n\n");
}
