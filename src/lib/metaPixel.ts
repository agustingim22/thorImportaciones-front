declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Dispara un evento estándar del Meta Pixel. No hace nada si el pixel no está activo. */
export function trackPixelEvent(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {});
}
