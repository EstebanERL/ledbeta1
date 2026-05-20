import { defineConfig } from "vite";
export default defineConfig({
  root: ".",
  server: { host: "::", port: 8080 },
  preview: { host: "::", port: 8080 },
});
