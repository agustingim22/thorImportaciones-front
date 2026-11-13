import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Regla nueva de eslint-plugin-react-hooks que marca como error patrones válidos y muy comunes en este
      // código: leer localStorage al montar (para no romper la hidratación del servidor), o pedir datos al abrir
      // una pantalla. Hay unos 20 casos y reescribirlos todos es riesgoso; se deja como aviso para que se vean
      // sin frenar el chequeo. Los demás errores de lint siguen siendo errores.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
