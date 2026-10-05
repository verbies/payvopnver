import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**", "layouts/index.ts", "next-env.d.ts", "test-results/**", "playwright-report/**"] },
  {
    // The conversion engine runs in the customer's browser and must stay pure: no network, no
    // storage, no server code. These rules make an accidental upload a lint error.
    files: ["src/engine/**/*.ts"],
    rules: {
      "no-restricted-globals": ["error", "fetch", "XMLHttpRequest", "WebSocket", "localStorage", "sessionStorage", "indexedDB", "navigator", "document", "window"],
      "no-restricted-imports": ["error", { patterns: ["@/server/*", "@/lib/track", "next/*", "react", "react-dom"] }],
    },
  },
  {
    // The converter UI may only report analytics through track(), whose type cannot carry file contents.
    files: ["src/components/converter/**/*.{ts,tsx}"],
    rules: { "no-restricted-globals": ["error", "fetch", "XMLHttpRequest", "WebSocket", "sessionStorage", "indexedDB"] },
  },
];

export default config;
