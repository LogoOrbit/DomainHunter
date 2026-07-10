const REQUEST_TIMEOUT_MS = positiveInt(process.env.CONNECTOR_TIMEOUT_MS, 12_000);

export class RateLimiter {
  private nextAt = 0;
  constructor(private readonly intervalMs: number) {}
  async wait(signal: AbortSignal): Promise<void> {
    const delay = Math.max(0, this.nextAt - Date.now());
    this.nextAt = Math.max(Date.now(), this.nextAt) + this.intervalMs;
    if (delay === 0) return;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      signal.addEventListener("abort", () => { clearTimeout(timer); reject(signal.reason); }, { once: true });
    });
  }
}

export async function fetchPublicJson<T>(url: URL, allowedHosts: readonly string[], signal: AbortSignal, headers: HeadersInit = {}): Promise<{ data: T; headers: Headers }> {
  if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname)) throw new Error("Connector attempted an unapproved public endpoint");
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = AbortSignal.any([signal, timeout]);
  const response = await fetch(url, { signal: combined, redirect: "error", headers: { accept: "application/json", "user-agent": "DomainHunterAI/1.0 public-research", ...headers } });
  if (!response.ok) throw new Error(`Public source returned HTTP ${response.status}`);
  return { data: await response.json() as T, headers: response.headers };
}

export function sanitizeText(value: unknown, maximum = 2_000): string | null {
  if (typeof value !== "string") return null;
  const clean = value.replace(/<[^>]*>/g, " ").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, maximum) : null;
}

export function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
