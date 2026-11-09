// vite.config.ts: configuração do Vite (gerado com auxílio do Claude).
// base "./" para o build em dist/ funcionar em qualquer subpasta.
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
  },
});
