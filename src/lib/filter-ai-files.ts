/**
 * Filters out E2B sandbox system files and configuration boilerplate,
 * returning only AI-generated source code files.
 * 
 * Strategy: EXCLUDE-BY-DEFAULT (whitelist approach)
 * This prevents accidentally filtering out legitimate AI-generated code.
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

  // Patterns for files to EXCLUDE (E2B sandbox system files and build artifacts)
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
  ];

  for (const [path, content] of Object.entries(files)) {
    // Skip null/undefined content
    if (content === null || content === undefined) {
      console.warn(`[filterAIGeneratedFiles] Skipping file with null/undefined content: ${path}`);
      continue;
    }

    // Skip if matches any exclude pattern
    const shouldExclude = excludePatterns.some(pattern => pattern.test(path));
    if (shouldExclude) {
      continue;
    }

    // INCLUDE BY DEFAULT - only exclude known system files
    // This is the key change: we trust that files in the sandbox are AI-generated
    // unless they match the explicit exclude patterns above
    filtered[path] = content;
  }

  // Logging for debugging
  const totalFiles = Object.keys(files).length;
  const filteredFiles = Object.keys(filtered).length;
  const removedFiles = totalFiles - filteredFiles;
  
  console.log(`[filterAIGeneratedFiles] Processed ${totalFiles} files → kept ${filteredFiles} files (excluded ${removedFiles})`);
  
  if (removedFiles > 0) {
    // Log first few filtered out files for debugging
    const filteredOutPaths = Object.keys(files).filter((path) => !(path in filtered));
    if (filteredOutPaths.length > 0) {
      console.debug(`[filterAIGeneratedFiles] Excluded files:`, filteredOutPaths.slice(0, 10));
    }
  }

  if (filteredFiles === 0 && totalFiles > 0) {
    console.error('[filterAIGeneratedFiles] WARNING: All files were filtered out! This is likely a bug.');
    console.error('[filterAIGeneratedFiles] Sample file paths:', Object.keys(files).slice(0, 10));
  }

  return filtered;
}
