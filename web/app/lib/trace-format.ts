export function durationMs(from: string, to: string): number {
  return new Date(to).getTime() - new Date(from).getTime();
}

export function formatDurationMs(ms: number): string {
  if (ms < 0) return "";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

export function formatTraceDuration(startedAt: string, endedAt: string): string {
  return formatDurationMs(durationMs(startedAt, endedAt));
}

export function formatTraceRange(startedAt: string, endedAt: string): string {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  return `${start.toLocaleString()} → ${end.toLocaleString()}`;
}
