"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    // global-error reemplaza el layout raíz: no tiene los estilos globales del sitio.
    <html lang="es">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "system-ui, sans-serif",
          background: "#faf4e7",
          color: "#14323f",
          textAlign: "center",
          padding: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Algo salió mal</h1>
        <p style={{ margin: 0, color: "#5c6b6f" }}>
          Ya nos enteramos del problema. Probá de nuevo en un momento.
        </p>
        <button
          onClick={() => retry()}
          style={{
            border: "none",
            borderRadius: "0.75rem",
            background: "#de9a26",
            color: "#14323f",
            fontWeight: 700,
            padding: "0.75rem 1.5rem",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
