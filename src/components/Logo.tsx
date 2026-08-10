import { SITE } from "@/lib/site";

/**
 * Marca provisoria (placeholder). Motivo globo + órbita, alineado al logo real
 * (perro + avión + mundo), pero sin el ⚡ genérico.
 * Cuando tengas el logo en alta, reemplazá <LogoMark/> por:
 *   <Image src="/logo.png" alt="Thor Importaciones" width={40} height={40} priority />
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" className={className} role="img" aria-label="Thor Importaciones">
      {/* globo */}
      <circle cx="22" cy="23" r="14" fill="var(--color-thor-sky)" stroke="var(--color-thor-ink)" strokeWidth="2" />
      {/* meridianos */}
      <path d="M22 9 C 14 16, 14 30, 22 37" fill="none" stroke="var(--color-thor-ink)" strokeWidth="1.4" opacity="0.55" />
      <path d="M22 9 C 30 16, 30 30, 22 37" fill="none" stroke="var(--color-thor-ink)" strokeWidth="1.4" opacity="0.55" />
      <line x1="8" y1="23" x2="36" y2="23" stroke="var(--color-thor-ink)" strokeWidth="1.4" opacity="0.55" />
      {/* órbita dorada */}
      <ellipse cx="22" cy="24" rx="21" ry="6.5" fill="none" stroke="var(--color-thor-gold)" strokeWidth="2.5" transform="rotate(-22 22 24)" />
      {/* avioncito sobre la órbita */}
      <path d="M35 13 l3.2 1.3 -1 1.6 -3-.7 -1.6 2.2 -1.1-.5 .6-2.2 -1.9-1 .7-1.2 2.4 .3 1.6-1.6 1.6 .8z" fill="var(--color-thor-gold)" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="h-9 w-9 shrink-0" />
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg tracking-wide text-thor-ink">
            THOR<span className="text-thor-gold"> IMPORTACIONES</span>
          </span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-thor-muted">
            {SITE.tagline}
          </span>
        </span>
      )}
    </span>
  );
}
