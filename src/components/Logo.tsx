import Image from "next/image";
import { SITE } from "@/lib/site";

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Thor Importaciones"
      width={475}
      height={375}
      priority
      className={`${className} object-contain`}
    />
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
