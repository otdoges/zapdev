/**
 * Filters out E2B sandbox system files and configuration boilerplate,
 * returning only AI-generated source code files.
 */
export function filterAIGeneratedFiles(
  files: Record<string, string>
): Record<string, string> {
  const filtered: Record<string, string> = {};

  // Patterns for files to EXCLUDE (E2B sandbox system files)
  const excludePatterns = [
    // Configuration files
    /^package\.json$/,
    /^package-lock\.json$/,
    /^bun\.lockb$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    /^tsconfig.*\.json$/,
    /^jsconfig.*\.json$/,
    /\.config\.(js|ts|mjs|cjs)$/,
    /^next-env\.d\.ts$/,

    // Build and tooling configs
    /^\.eslintrc/,
    /^\.prettierrc/,
    /^\.gitignore$/,
    /^\.dockerignore$/,
    /^Dockerfile$/,
    /^docker-compose/,

    // Documentation and meta files
    /^README\.md$/,
    /^LICENSE$/,
    /^CHANGELOG\.md$/,

    // Environment files (typically not AI-generated)
    /^\.env/,

    // Lock and cache files
    /\.lock$/,
    /\.cache$/,

    // Test config files (unless in test directories)
    /^jest\.config/,
    /^vitest\.config/,
    /^playwright\.config/,
  ];

  // Patterns for files to INCLUDE (AI-generated source code)
  const includePatterns = [
    /^app\//,           // Next.js app directory
    /^pages\//,         // Next.js pages directory
    /^src\//,           // Source code directory
    /^components\//,    // Components directory
    /^lib\//,           // Library/utility code
    /^utils\//,         // Utilities
    /^hooks\//,         // React hooks
    /^styles\//,        // Styles
    /^public\//,        // Public assets (if AI-generated)
    /^api\//,           // API routes
    /^server\//,        // Server code
    /^client\//,        // Client code
    /^views\//,         // Views (Angular/Vue)
    /^controllers\//,   // Controllers
    /^models\//,        // Models
    /^services\//,      // Services
    /^store\//,         // State management
    /^routes\//,        // Routes
    /^middleware\//,    // Middleware
  ];

  for (const [path, content] of Object.entries(files)) {
    // Skip if matches any exclude pattern
    const shouldExclude = excludePatterns.some(pattern => pattern.test(path));
    if (shouldExclude) {
      continue;
    }

    // Include if matches any include pattern
    const shouldInclude = includePatterns.some(pattern => pattern.test(path));
    if (shouldInclude) {
      filtered[path] = content;
      continue;
    }

    // For files not matching include patterns, apply additional logic:
    // Include if it's a source code file in the root (e.g., page.tsx, layout.tsx)
    if (
      /\.(tsx?|jsx?|vue|svelte|css|scss|sass|less)$/.test(path) &&
      !path.includes('/') // Root level source files only
    ) {
      filtered[path] = content;
    }
  }

  return filtered;
}
