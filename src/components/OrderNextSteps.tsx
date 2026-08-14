type Kind = "stock" | "transfer" | "custom";

const STEPS: Record<Kind, string[]> = {
  stock: [
    "Te confirmamos por email cuando se acredite el pago.",
    "Te avisamos por email cuando despachemos tu pedido, con el código de seguimiento.",
    'Podés revisar el estado cuando quieras desde "Seguir mi pedido".',
  ],
  transfer: [
    "Hacé la transferencia y subí el comprobante (o mandalo por WhatsApp).",
    "Confirmamos el pago y te avisamos por email.",
    "Te avisamos por email cuando despachemos tu pedido, con el código de seguimiento.",
    'Podés revisar el estado cuando quieras desde "Seguir mi pedido".',
  ],
  custom: [
    "Te contactamos por WhatsApp para coordinar precio final, tela, tiempos y forma de pago.",
    "Una vez acordado, confirmamos el pedido y lo ponemos en producción.",
    "Te avisamos por email cuando despachemos tu pedido, con el código de seguimiento.",
    'Podés revisar el estado cuando quieras desde "Seguir mi pedido".',
  ],
};

export function OrderNextSteps({ kind }: { kind: Kind }) {
  return (
    <div className="mt-6 rounded-2xl border border-thor-line bg-thor-cream-2 p-5 text-left">
      <p className="font-mono text-xs font-bold uppercase tracking-wide text-thor-ink">Qué sigue ahora</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        {STEPS[kind].map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-thor-ink-soft">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-thor-gold/20 font-mono text-[11px] font-bold text-thor-gold">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
