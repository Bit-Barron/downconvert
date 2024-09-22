/* eslint-disable @typescript-eslint/ban-ts-comment */
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import manifest from "./extensions/manifest.json";

export default defineConfig({
  //@ts-expect-error
  plugins: [react(), crx({ manifest })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
