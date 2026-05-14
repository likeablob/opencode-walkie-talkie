import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    ignores: [
      "build/**",
      "node_modules/**",
      ".react-router/**",
      "**/*.d.ts",
      "app/components/ui/**",
      "poc-tests/**",
    ],
  },
);
