import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  pluginJs.configs.recommended,
  {
    ignores: ["dist/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        tf: "readonly",
        workbox: "readonly",
        lucide: "readonly",
        importScripts: "readonly",
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error",
      "no-console": "off",
      "preserve-caught-error": "off"
    },
  }
];
