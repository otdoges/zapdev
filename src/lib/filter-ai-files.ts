/**
 * Filters out E2B sandbox system files and configuration boilerplate,
 * returning only AI-generated source code files.
 * 
 * Strategy: DUAL-MODE (whitelist + blacklist)
 * 1. Whitelist common source code extensions
 * 2. Blacklist known system/build files
 * 3. Include everything else by default (trust the sandbox)
 */
export function filterAIGeneratedFiles(
  files: Record<string, string>
): Record<string, string> {
  // Handle invalid input
  if (!files || typeof files !== 'object') {
    console.warn('[filterAIGeneratedFiles] Invalid input, returning empty object');
    return {};
  }

  const filtered: Record<string, string> = {};

  // Whitelist: Common source code file extensions that should ALWAYS be included
  const sourceCodeExtensions = [
    /\.(tsx|ts|jsx|js)$/i,           // TypeScript/JavaScript
    /\.(css|scss|sass|less)$/i,      // Stylesheets
    /\.(html|htm)$/i,                // HTML
    /\.(json)$/i,                    // JSON (but will exclude lock files below)
    /\.(md|mdx)$/i,                  // Markdown
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/i, // Images
    /\.(vue|svelte)$/i,              // Framework-specific
    /\.(xml|yaml|yml)$/i,            // Config files
  ];

  // Blacklist: Files to EXCLUDE (E2B sandbox system files and build artifacts)
  const excludePatterns = [
    // Lock files
    /^package-lock\.json$/,
    /^bun\.lockb$/,
    /^yarn\.lock$/,
    /^pnpm-lock\.yaml$/,
    
    // Build artifacts and cache
    /^\.next\//,
    /^dist\//,
    /^build\//,
    /^out\//,
    /^\.cache\//,
    /^node_modules\//,
    /\.cache$/,
    
    // System files
    /^\.git\//,
    /^\.DS_Store$/,
    /^Thumbs\.db$/,
    
    // Environment files with secrets
    /^\.env\.local$/,
    /^\.env\.production$/,
    
    // Editor/IDE files
    /^\.vscode\//,
    /^\.idea\//,
    /\.swp$/,
    /\.swo$/,
    
    // Angular-specific build artifacts
    /^\.angular\//,
    
    // Svelte-specific build artifacts
    /^\.svelte-kit\//,
  ];

  const excludedFiles: string[] = [];
  const includedByWhitelist: string[] = [];
  const includedByDefault: string[] = [];

  for (const [path, content] of Object.entries(files)) {
    // Skip null/undefined content
    if (content === null || content === undefined) {
      console.warn(`[filterAIGeneratedFiles] Skipping file with null/undefined content: ${path}`);
      excludedFiles.push(path);
      continue;
    }

    // Skip if matches any exclude pattern (highest priority)
    const shouldExclude = excludePatterns.some(pattern => pattern.test(path));
    if (shouldExclude) {
      excludedFiles.push(path);
      continue;
    }

    // Include if matches source code extension whitelist
    const isSourceCode = sourceCodeExtensions.some(pattern => pattern.test(path));
    if (isSourceCode) {
      filtered[path] = content;
      includedByWhitelist.push(path);
      continue;
    }

    // INCLUDE BY DEFAULT - trust the sandbox for unknown file types
    // This catches config files like package.json, tsconfig.json, etc.
    filtered[path] = content;
    includedByDefault.push(path);
  }

  // Enhanced logging for debugging
  const totalFiles = Object.keys(files).length;
  const filteredFiles = Object.keys(filtered).length;
  const removedFiles = totalFiles - filteredFiles;
  
  console.log(`[filterAIGeneratedFiles] Processed ${totalFiles} files → kept ${filteredFiles} files (excluded ${removedFiles})`);
  console.debug(`[filterAIGeneratedFiles] Breakdown: ${includedByWhitelist.length} by whitelist, ${includedByDefault.length} by default, ${excludedFiles.length} excluded`);
  
  if (removedFiles > 0) {
    console.debug(`[filterAIGeneratedFiles] Excluded files:`, excludedFiles.slice(0, 10));
  }

  // Log included files for transparency
  if (filteredFiles > 0 && filteredFiles <= 20) {
    console.debug(`[filterAIGeneratedFiles] Included files:`, Object.keys(filtered));
  }

  if (filteredFiles === 0 && totalFiles > 0) {
    console.error('[filterAIGeneratedFiles] CRITICAL: All files were filtered out! This is a bug.');
    console.error('[filterAIGeneratedFiles] All file paths:', Object.keys(files));
    console.error('[filterAIGeneratedFiles] Excluded breakdown:', excludedFiles);
    // Return all files as fallback to prevent data loss
    console.warn('[filterAIGeneratedFiles] FALLBACK: Returning all files to prevent data loss');
    return files;
  }

  return filtered;
}
