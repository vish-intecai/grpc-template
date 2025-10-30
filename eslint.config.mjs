import js from "@eslint/js";
import * as tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "eslint.config.js",
      "**/build/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    // Common rules for all JavaScript/TypeScript files
    files: ["**/*.{js,ts}"],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Core JS rules

      "no-console": "off",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: "error",
      "dot-notation": "error",
      "no-multi-spaces": "error",
      "no-throw-literal": "error",
      "no-return-await": "error",
      "no-else-return": "error",
      "no-unneeded-ternary": "error",
      "no-param-reassign": "error",
      "prefer-template": "error",
      "prefer-arrow-callback": "error",

      // Security/error prevention
      "no-alert": "error",
      "no-iterator": "error",
      "no-proto": "error",
      "no-promise-executor-return": "error",
      "require-atomic-updates": "error",
      "no-restricted-globals": [
        "error",
        { name: "isNaN", message: "Use Number.isNaN instead" },
        { name: "isFinite", message: "Use Number.isFinite instead" },
      ],

      "object-shorthand": ["error", "always"],
    },
  },
  {
    // TypeScript-specific enhancements
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",

      "@typescript-eslint/consistent-type-imports": "error",

      "@typescript-eslint/array-type": ["error", { default: "array-simple" }],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.test.{js,ts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
];
