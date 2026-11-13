import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": `${root}src`,
      // "server-only" tira un error si se importa fuera del servidor de Next; en los tests no aplica.
      "server-only": `${root}tests/stubs/server-only.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Una clave fija y conocida solo para los tests: nunca se usa la real.
    env: { ADMIN_TOKEN: "token-de-prueba-solo-para-tests-0123456789" },
    testTimeout: 30_000,
  },
});
