/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { protobufCommonJs } from "./vite-plugin-protobuf-cjs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), protobufCommonJs()],
  build: {
    sourcemap: true,
  },
  server: {
    port: 3000,
    // In development the gRPC-web requests are handled by envoy (see
    // ../proxy/envoy.yaml), which the Go server sits behind.
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test-setup.ts",
    css: true,
  },
});
