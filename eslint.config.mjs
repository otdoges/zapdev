import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  // Global ignores - must be first
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/build/**",
      "**/dist/**",
      "**/generated/*",
      "**/.convex/_generated/**",
      "**/convex/_generated/**",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/postcss.config.mjs",
      "**/loaders/**",
    ]
  },
  
  // Base JavaScript recommended rules
  js.configs.recommended,
  
  // Main configuration for TypeScript and React files
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "writable",
        JSX: "writable",
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "writable",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        URL: "readonly", // Browser and Node.js global
        URLSearchParams: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        Headers: "readonly",
        Request: "readonly",
        Response: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      "react": react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      
      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // Using TypeScript
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // General rules
      "no-console": "off", // Allow console in this project
      "no-unused-vars": "off", // Using TypeScript version
      "prefer-const": "error",
      "no-var": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  
  // Test files configuration
  {
    files: ["**/*.test.{js,ts,tsx}", "**/__tests__/**/*", "**/**/tests/**/*", "**/test/**/*"],
    languageOptions: {
      globals: {
        // Jest globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        global: "readonly",
        // Node.js test environment
        Buffer: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
      },
    },
  },
];
