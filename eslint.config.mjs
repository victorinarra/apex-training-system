import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import quality from "./eslint-rules/index.cjs";

export default defineConfig([
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        clearInterval: "readonly",
        console: "readonly",
        document: "readonly",
        navigator: "readonly",
        setInterval: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    plugins: { quality },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-unused-vars": ["error", { caughtErrors: "none" }],
      "no-var": "error",
      "prefer-const": "error",
      // Baseline: 1 existing production file exceeds the 350-line budget.
      "quality/max-lines": ["warn", { max: 350 }],
      "quality/no-direct-console": ["error", { logger: "the project's logging adapter" }],
    },
  },
  {
    files: ["eslint-rules/**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
  },
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "verify.mjs",
    "package-lock.json",
  ]),
]);
