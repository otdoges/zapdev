import { NextResponse } from 'next/server';
import { SandboxFactory } from '@/lib/sandbox/factory';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import type { SandboxState } from '@/types/sandbox';

declare global {
  var activeSandboxProvider: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

export async function POST(request: Request) {
  try {
    const { originalSandboxId } = await request.json();

    if (!originalSandboxId) {
      return NextResponse.json({
        error: 'originalSandboxId is required'
      }, { status: 400 });
    }

    console.log('[restore-sandbox] Restoring sandbox from:', originalSandboxId);

    // Clean up all existing sandboxes
    console.log('[restore-sandbox] Cleaning up existing sandboxes...');
    await sandboxManager.terminateAll();

    // Also clean up legacy global state
    if (global.activeSandboxProvider) {
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to terminate legacy global sandbox:', e);
      }
      global.activeSandboxProvider = null;
    }

    // Clear existing files tracking
    if (global.existingFiles) {
      global.existingFiles.clear();
    } else {
      global.existingFiles = new Set<string>();
    }

    // Try to get the original sandbox provider
    let originalProvider = null;
    try {
      originalProvider = await sandboxManager.getOrCreateProvider(originalSandboxId);
      console.log('[restore-sandbox] Connected to original sandbox');
    } catch (error) {
      console.error('[restore-sandbox] Could not connect to original sandbox:', error);
      return NextResponse.json({
        error: 'Could not access original sandbox. It may have expired or been terminated.'
      }, { status: 400 });
    }

    // Create new sandbox
    console.log('[restore-sandbox] Creating new sandbox...');
    const newProvider = SandboxFactory.create();
    const newSandboxInfo = await newProvider.createSandbox();

    console.log('[restore-sandbox] Setting up Vite React app in new sandbox...');
    await newProvider.setupViteApp();

    // Register the new sandbox with sandbox manager
    sandboxManager.registerSandbox(newSandboxInfo.sandboxId, newProvider);

    // Also store in legacy global state for backward compatibility
    global.activeSandboxProvider = newProvider;
    global.sandboxData = {
      sandboxId: newSandboxInfo.sandboxId,
      url: newSandboxInfo.url
    };

    // Get files from the original sandbox
    console.log('[restore-sandbox] Getting files from original sandbox...');

    // List all relevant files from the original sandbox
    const findResult = await originalProvider.runCommand(
      'find . -name node_modules -prune -o -name .git -prune -o -name dist -prune -o -name build -prune -o -type f \\( -name "*.jsx" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.css" -o -name "*.json" -o -name "*.html" -o -name "*.md" \\) -print'
    );

    if (findResult.exitCode !== 0) {
      console.error('[restore-sandbox] Failed to list files from original sandbox');
      // Continue with empty sandbox if file listing fails
    } else {
      const fileList = findResult.stdout.split('\n').filter((f: string) => f.trim());
      console.log(`[restore-sandbox] Found ${fileList.length} files to copy`);

      // Copy files from original to new sandbox
      for (const filePath of fileList) {
        try {
          // Check file size first (skip files larger than 1MB)
          const statResult = await originalProvider.runCommand(`stat -f %z "${filePath}"`);

          if (statResult.exitCode === 0) {
            const fileSize = parseInt(statResult.stdout);
            if (fileSize > 1000000) { // 1MB limit
              console.log(`[restore-sandbox] Skipping large file: ${filePath} (${fileSize} bytes)`);
              continue;
            }
          }

          // Read file content from original sandbox
          const catResult = await originalProvider.runCommand(`cat "${filePath}"`);

          if (catResult.exitCode === 0) {
            const content = catResult.stdout;

            // Write to new sandbox
            // First ensure the directory exists
            const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
            if (dirPath) {
              await newProvider.runCommand(`mkdir -p "${dirPath}"`);
            }

            // Write the file using a heredoc to handle special characters properly
            const escapedContent = content.replace(/'/g, "'\\''"); // Escape single quotes
            await newProvider.runCommand(`cat > "${filePath}" << 'EOF'\n${escapedContent}\nEOF`);

            console.log(`[restore-sandbox] Copied: ${filePath}`);
          }
        } catch (error) {
          console.error(`[restore-sandbox] Error copying ${filePath}:`, error);
          // Continue with other files
        }
      }
    }

    // Initialize sandbox state
    global.sandboxState = {
      fileCache: {
        files: {},
        lastSync: Date.now(),
        sandboxId: newSandboxInfo.sandboxId
      },
      sandbox: newProvider,
      sandboxData: {
        sandboxId: newSandboxInfo.sandboxId,
        url: newSandboxInfo.url
      }
    };

    console.log('[restore-sandbox] Sandbox restoration complete');

    // Clean up the original sandbox provider
    try {
      if (originalProvider && originalProvider !== newProvider) {
        await originalProvider.terminate();
      }
    } catch (error) {
      console.error('[restore-sandbox] Error cleaning up original sandbox:', error);
    }

    return NextResponse.json({
      success: true,
      sandboxId: newSandboxInfo.sandboxId,
      url: newSandboxInfo.url,
      provider: newSandboxInfo.provider,
      message: 'Sandbox restored successfully from previous session'
    });

  } catch (error) {
    console.error('[restore-sandbox] Error:', error);

    // Clean up on error
    await sandboxManager.terminateAll();
    if (global.activeSandboxProvider) {
      try {
        await global.activeSandboxProvider.terminate();
      } catch (e) {
        console.error('Failed to terminate sandbox on error:', e);
      }
      global.activeSandboxProvider = null;
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to restore sandbox',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
