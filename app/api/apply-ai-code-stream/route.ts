import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';
import type { SandboxState } from '@/types/sandbox';
import type { ConversationState } from '@/types/conversation';

declare global {
  var conversationState: ConversationState | null;
  var activeSandbox: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: '',
    template: ''
  };
  
  // Function to extract packages from import statements
  function extractPackagesFromCode(content: string): string[] {
    const packages: string[] = [];
    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"]([^'"]+)['"]/g;
    let importMatch;
    
    while ((importMatch = importRegex.exec(content)) !== null) {
      const importPath = importMatch[1];
      // Skip relative imports and built-in React
      if (!importPath.startsWith('.') && !importPath.startsWith('/') && 
          importPath !== 'react' && importPath !== 'react-dom' &&
          !importPath.startsWith('@/')) {
        // Extract package name (handle scoped packages like @heroicons/react)
        const packageName = importPath.startsWith('@') 
          ? importPath.split('/').slice(0, 2).join('/')
          : importPath.split('/')[0];
        
        if (!packages.includes(packageName)) {
          packages.push(packageName);
          
          // Log important packages for debugging
          if (packageName === 'react-router-dom' || packageName.includes('router') || packageName.includes('icon')) {
            console.log(`[apply-ai-code-stream] Detected package from imports: ${packageName}`);
          }
        }
      }
    }
    
    return packages;
  }

  // Parse file sections - handle duplicates and prefer complete versions
  const fileMap = new Map<string, { content: string; isComplete: boolean }>();
  
  // First pass: Find all file declarations
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const fileRegex = /<file path="([^"]+)">([^<]*)(?:<\/file>|$)/g;
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    const hasClosingTag = response.substring(match.index, match.index + match[0].length).includes('</file>');
    
    // Check if this file already exists in our map
    const existing = fileMap.get(filePath);
    
    // Decide whether to keep this version
    let shouldReplace = false;
    if (!existing) {
      shouldReplace = true; // First occurrence
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true; // Replace incomplete with complete
      console.log(`[apply-ai-code-stream] Replacing incomplete ${filePath} with complete version`);
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Replace with longer complete version
      console.log(`[apply-ai-code-stream] Replacing ${filePath} with longer complete version`);
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Both incomplete, keep longer one
    }
    
    if (shouldReplace) {
      // Additional validation: reject obviously broken content
      if (content.includes('...') && !content.includes('...props') && !content.includes('...rest')) {
        console.warn(`[apply-ai-code-stream] Warning: ${filePath} contains ellipsis, may be truncated`);
        // Still use it if it's the only version we have
        if (!existing) {
          fileMap.set(filePath, { content, isComplete: hasClosingTag });
        }
      } else {
        fileMap.set(filePath, { content, isComplete: hasClosingTag });
      }
    }
  }
  
  // Convert map to array for sections.files
  for (const [path, { content, isComplete }] of fileMap.entries()) {
    if (!isComplete) {
      console.log(`[apply-ai-code-stream] Warning: File ${path} appears to be truncated (no closing tag)`);
    }
    
    sections.files.push({
      path,
      content
    });
    
    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(`[apply-ai-code-stream] 📦 Package detected from imports: ${pkg}`);
      }
    }
  }
  
  // Also parse markdown code blocks with file paths
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const markdownFileRegex = /```(?:file )?path="([^"]+)"\n([^`]*)```/g;
  while ((match = markdownFileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    sections.files.push({
      path: filePath,
      content: content
    });
    
    // Extract packages from file content
    const filePackages = extractPackagesFromCode(content);
    for (const pkg of filePackages) {
      if (!sections.packages.includes(pkg)) {
        sections.packages.push(pkg);
        console.log(`[apply-ai-code-stream] 📦 Package detected from imports: ${pkg}`);
      }
    }
  }
  
  // Parse plain text format like "Generated Files: Header.jsx, index.css"
  const generatedFilesMatch = response.match(/Generated Files?:\s*([^\n]+)/i);
  if (generatedFilesMatch) {
    // Split by comma first, then trim whitespace, to preserve filenames with dots
    const filesList = generatedFilesMatch[1]
      .split(',')
      .map(f => f.trim())
      .filter(f => f.endsWith('.jsx') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.css') || f.endsWith('.json') || f.endsWith('.html'));
    console.log(`[apply-ai-code-stream] Detected generated files from plain text: ${filesList.join(', ')}`);
    
    // Try to extract the actual file content if it follows
    for (const fileName of filesList) {
      // Look for the file content after the file name
      // Fixed externally-controlled format string vulnerability by sanitizing fileName
      const sanitizedFileName = fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const fileContentRegex = new RegExp(`${sanitizedFileName}[^\\n]*\\n([\\s\\S]{1,10000}?)(?=Generated Files:|Applying code|$)`, 'i');
      const fileContentMatch = response.match(fileContentRegex);
      if (fileContentMatch) {
        // Extract just the code part (starting from import statements)
        // Fixed ReDoS vulnerability by limiting content size and avoiding backtracking
        const codeMatch = fileContentMatch[0].match(/^(import[^;]{1,1000};[\\s\\S]{1,5000})$/m);
        if (codeMatch) {
          const filePath = fileName.includes('/') ? fileName : `src/components/${fileName}`;
          sections.files.push({
            path: filePath,
            content: codeMatch[1].trim()
          });
          console.log(`[apply-ai-code-stream] Extracted content for ${filePath}`);
          
          // Extract packages from this file
          const filePackages = extractPackagesFromCode(codeMatch[1]);
          for (const pkg of filePackages) {
            if (!sections.packages.includes(pkg)) {
              sections.packages.push(pkg);
              console.log(`[apply-ai-code-stream] Package detected from imports: ${pkg}`);
            }
          }
        }
      }
    }
  }
  
  // Also try to parse if the response contains raw JSX/JS code blocks
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const codeBlockRegex = /```(?:jsx?|tsx?|javascript|typescript)?\n([^`]*)```/g;
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const content = match[1].trim();
    // Try to detect the file name from comments or context
    const fileNameMatch = content.match(/\/\/\s*(?:File:|Component:)\s*([^\n]+)/);
    if (fileNameMatch) {
      const fileName = fileNameMatch[1].trim();
      const filePath = fileName.includes('/') ? fileName : `src/components/${fileName}`;
      
      // Don't add duplicate files
      if (!sections.files.some(f => f.path === filePath)) {
        sections.files.push({
          path: filePath,
          content: content
        });
        
        // Extract packages
        const filePackages = extractPackagesFromCode(content);
        for (const pkg of filePackages) {
          if (!sections.packages.includes(pkg)) {
            sections.packages.push(pkg);
          }
        }
      }
    }
  }

  // Parse commands
  const cmdRegex = /<command>(.*?)<\/command>/g;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  // Parse packages - support both <package> and <packages> tags
  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }
  
  // Also parse <packages> tag with multiple packages
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const packagesRegex = /<packages>([^<]{1,5000})<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    // Split by newlines or commas
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  // Parse structure
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const structureMatch = /<structure>([^<]{1,10000})<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  // Parse explanation
  // Fixed ReDoS vulnerability by avoiding catastrophic backtracking
  const explanationMatch = /<explanation>([^<]{1,10000})<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  // Parse template
  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

export async function POST(request: NextRequest) {
  try {
    const { response, isEdit = false, packages = [], sandboxId } = await request.json();
    
    if (!response) {
      return NextResponse.json({
        error: 'response is required'
      }, { status: 400 });
    }
    
    // Enhanced debug logging for better debugging
    console.log('[apply-ai-code-stream] ===== APPLY AI CODE STREAM REQUEST =====');
    console.log('[apply-ai-code-stream] Timestamp:', new Date().toISOString());
    console.log('[apply-ai-code-stream] Sandbox ID:', sandboxId || 'none provided');
    console.log('[apply-ai-code-stream] Is Edit Mode:', isEdit);
    console.log('[apply-ai-code-stream] Packages received:', packages?.length || 0, packages);
    console.log('[apply-ai-code-stream] Response length:', response.length);
    console.log('[apply-ai-code-stream] Response preview:', response.substring(0, 500));
    console.log('[apply-ai-code-stream] Global state check:');
    console.log('[apply-ai-code-stream] - activeSandbox exists:', !!global.activeSandbox);
    console.log('[apply-ai-code-stream] - sandboxData exists:', !!global.sandboxData);
    console.log('[apply-ai-code-stream] - existingFiles count:', global.existingFiles?.size || 0);
    console.log('[apply-ai-code-stream] - conversationState exists:', !!global.conversationState);
    console.log('[apply-ai-code-stream] ============================================');
    
    // Parse the AI response
    const parsed = parseAIResponse(response);
    
    // Log what was parsed
    console.log('[apply-ai-code-stream] Parsed result:');
    console.log('[apply-ai-code-stream] Files found:', parsed.files.length);
    if (parsed.files.length > 0) {
      parsed.files.forEach(f => {
        console.log(`[apply-ai-code-stream] - ${f.path} (${f.content.length} chars)`);
      });
    }
    console.log('[apply-ai-code-stream] Packages found:', parsed.packages);
    
    // Initialize existingFiles if not already
    if (!global.existingFiles) {
      global.existingFiles = new Set<string>();
    }
    
    // Enhanced sandbox connection management with better error handling
    let sandbox = global.activeSandbox;
    
    // If we don't have a sandbox in this instance but we have a sandboxId,
    // reconnect to the existing sandbox with enhanced error handling
    if (!sandbox && sandboxId) {
      console.log(`[apply-ai-code-stream] Sandbox ${sandboxId} not in this instance, attempting reconnect...`);
      
      // Validate E2B API key first
      if (!process.env.E2B_API_KEY) {
        console.error('[apply-ai-code-stream] E2B_API_KEY environment variable is not set');
        return NextResponse.json({
          success: false,
          error: 'E2B API key not configured. Please check environment variables.',
          results: {
            filesCreated: [],
            packagesInstalled: [],
            commandsExecuted: [],
            errors: ['E2B API key not configured']
          },
          explanation: parsed.explanation,
          structure: parsed.structure,
          parsedFiles: parsed.files,
          message: `Parsed ${parsed.files.length} files but couldn't apply them - E2B API key missing.`
        });
      }
      
      try {
        // Reconnect to the existing sandbox using E2B's connect method with timeout
        console.log(`[apply-ai-code-stream] Attempting to connect to sandbox with API key: ${process.env.E2B_API_KEY?.slice(0, 10)}...`);
        
        const connectOptions = { 
          apiKey: process.env.E2B_API_KEY,
          timeout: 30000 // 30 second timeout
        };
        
        sandbox = await Sandbox.connect(sandboxId, connectOptions);
        console.log(`[apply-ai-code-stream] Successfully reconnected to sandbox ${sandboxId}`);
        
        // Validate the sandbox connection by checking if it's alive
        try {
          const isAlive = await sandbox.isAlive();
          if (!isAlive) {
            throw new Error('Sandbox is not alive after connection');
          }
          console.log(`[apply-ai-code-stream] Sandbox ${sandboxId} is alive and ready`);
        } catch (aliveCheckError) {
          console.error(`[apply-ai-code-stream] Sandbox alive check failed:`, aliveCheckError);
          throw new Error(`Sandbox connection unstable: ${(aliveCheckError as Error).message}`);
        }
        
        // Store the reconnected sandbox globally for this instance
        global.activeSandbox = sandbox;
        
        // Update sandbox data if needed
        if (!global.sandboxData) {
          try {
            const host = (sandbox as any).getHost(5173);
            global.sandboxData = {
              sandboxId,
              url: `https://${host}`
            };
            console.log(`[apply-ai-code-stream] Updated sandbox data with URL: https://${host}`);
          } catch (hostError) {
            console.warn(`[apply-ai-code-stream] Could not get sandbox host:`, hostError);
            // Continue without host URL - not critical for file operations
            global.sandboxData = { sandboxId, url: '' };
          }
        }
        
        // Initialize existingFiles if not already
        if (!global.existingFiles) {
          global.existingFiles = new Set<string>();
        }
        
      } catch (reconnectError) {
        const errorMessage = (reconnectError as Error).message;
        console.error(`[apply-ai-code-stream] Failed to reconnect to sandbox ${sandboxId}:`, reconnectError);
        
        // Enhanced error categorization
        let userFriendlyError = '';
        if (errorMessage.includes('not found') || errorMessage.includes('404')) {
          userFriendlyError = 'Sandbox not found. It may have expired or been deleted.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
          userFriendlyError = 'Connection timeout. The sandbox may be overloaded or unreachable.';
        } else if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
          userFriendlyError = 'Authentication failed. Please check your E2B API key.';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          userFriendlyError = 'Rate limit exceeded. Please try again in a moment.';
        } else {
          userFriendlyError = `Sandbox connection failed: ${errorMessage}`;
        }
        
        // If reconnection fails, we'll still try to return a meaningful response
        return NextResponse.json({
          success: false,
          error: userFriendlyError,
          results: {
            filesCreated: [],
            packagesInstalled: [],
            commandsExecuted: [],
            errors: [`Sandbox reconnection failed: ${errorMessage}`]
          },
          explanation: parsed.explanation,
          structure: parsed.structure,
          parsedFiles: parsed.files,
          message: `Parsed ${parsed.files.length} files but couldn't apply them - ${userFriendlyError}`
        });
      }
    }
    
    // Create a response stream for real-time updates FIRST to ensure we always have a stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Function to send progress updates
    const sendProgress = async (data: any) => {
      try {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        await writer.write(encoder.encode(message));
      } catch (error) {
        console.error('[apply-ai-code-stream] Failed to send progress:', error);
      }
    };

    // If no sandbox at all and no sandboxId provided, send error through stream
    if (!sandbox && !sandboxId) {
      console.log('[apply-ai-code-stream] No sandbox available and no sandboxId provided');
      
      await sendProgress({
        type: 'error',
        error: 'No active sandbox found. Please create a sandbox first.',
        message: `Parsed ${parsed.files.length} files but no sandbox available to apply them.`,
        details: {
          filesFound: parsed.files.length,
          packagesFound: parsed.packages?.length || 0
        }
      });
      
      await writer.close();
      
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Start processing in background (pass sandbox and request to the async function)
    (async (sandboxInstance, req) => {
      const results = {
        filesCreated: [] as string[],
        filesUpdated: [] as string[],
        packagesInstalled: [] as string[],
        packagesAlreadyInstalled: [] as string[],
        packagesFailed: [] as string[],
        commandsExecuted: [] as string[],
        errors: [] as string[]
      };
      
      try {
        await sendProgress({ 
          type: 'start', 
          message: 'Starting code application...',
          totalSteps: 3
        });
        
        // Step 1: Install packages
        const packagesArray = Array.isArray(packages) ? packages : [];
        const parsedPackages = Array.isArray(parsed.packages) ? parsed.packages : [];
        
        // Combine and deduplicate packages
        const allPackages = [...packagesArray.filter(pkg => pkg && typeof pkg === 'string'), ...parsedPackages];
        
        // Use Set to remove duplicates, then filter out pre-installed packages
        const uniquePackages = [...new Set(allPackages)]
          .filter(pkg => pkg && typeof pkg === 'string' && pkg.trim() !== '') // Remove empty strings
          .filter(pkg => pkg !== 'react' && pkg !== 'react-dom'); // Filter pre-installed
        
        // Log if we found duplicates
        if (allPackages.length !== uniquePackages.length) {
          console.log(`[apply-ai-code-stream] Removed ${allPackages.length - uniquePackages.length} duplicate packages`);
          console.log(`[apply-ai-code-stream] Original packages:`, allPackages);
          console.log(`[apply-ai-code-stream] Deduplicated packages:`, uniquePackages);
        }
        
        if (uniquePackages.length > 0) {
          await sendProgress({ 
            type: 'step', 
            step: 1,
            message: `Installing ${uniquePackages.length} packages...`,
            packages: uniquePackages
          });
          
          // Use streaming package installation
          try {
            // Construct the API URL properly for both dev and production
            const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
            const host = req.headers.get('host') || 'localhost:3000';
            const apiUrl = `${protocol}://${host}/api/install-packages`;
            
            const installResponse = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                packages: uniquePackages,
                sandboxId: sandboxId || (sandboxInstance as any).sandboxId
              })
            });
            
            if (installResponse.ok && installResponse.body) {
              const reader = installResponse.body.getReader();
              const decoder = new TextDecoder();
              
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                if (!chunk) continue;
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    try {
                      const data = JSON.parse(line.slice(6));
                      
                      // Forward package installation progress
                      await sendProgress({
                        type: 'package-progress',
                        ...data
                      });
                      
                      // Track results
                      if (data.type === 'success' && data.installedPackages) {
                        results.packagesInstalled = data.installedPackages;
                      }
                    } catch {
                      // Ignore parse errors
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('[apply-ai-code-stream] Error installing packages:', error);
            await sendProgress({
              type: 'warning',
              message: `Package installation skipped (${(error as Error).message}). Continuing with file creation...`
            });
            results.errors.push(`Package installation failed: ${(error as Error).message}`);
          }
        } else {
          await sendProgress({ 
            type: 'step', 
            step: 1,
            message: 'No additional packages to install, skipping...'
          });
        }
        
        // Step 2: Create/update files
        const filesArray = Array.isArray(parsed.files) ? parsed.files : [];
        await sendProgress({ 
          type: 'step', 
          step: 2,
          message: `Creating ${filesArray.length} files...`
        });
        
        // Filter out config files that shouldn't be created
        const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
        const filteredFiles = filesArray.filter(file => {
          if (!file || typeof file !== 'object') return false;
          const fileName = (file.path || '').split('/').pop() || '';
          return !configFiles.includes(fileName);
        });
        
        for (const [index, file] of filteredFiles.entries()) {
          try {
            // Send progress for each file
            await sendProgress({
              type: 'file-progress',
              current: index + 1,
              total: filteredFiles.length,
              fileName: file.path,
              action: 'creating'
            });
            
            // Normalize the file path
            let normalizedPath = file.path;
            if (normalizedPath.startsWith('/')) {
              normalizedPath = normalizedPath.substring(1);
            }
            if (!normalizedPath.startsWith('src/') && 
                !normalizedPath.startsWith('public/') && 
                normalizedPath !== 'index.html' && 
                !configFiles.includes(normalizedPath.split('/').pop() || '')) {
              normalizedPath = 'src/' + normalizedPath;
            }
            
            const fullPath = `/home/user/app/${normalizedPath}`;
            const isUpdate = global.existingFiles.has(normalizedPath);
            
            // Remove any CSS imports from JSX/JS files (we're using Tailwind)
            let fileContent = file.content;
            if (file.path.endsWith('.jsx') || file.path.endsWith('.js') || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
              fileContent = fileContent.replace(/import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g, '');
            }
            
            console.log(`[apply-ai-code-stream] Writing file using E2B files API: ${fullPath}`);
            console.log(`[apply-ai-code-stream] File content preview: ${fileContent.substring(0, 100)}${fileContent.length > 100 ? '...' : ''}`);
            
            // Enhanced file write with retry logic and better error handling
            const maxRetries = 3;
            let writeSuccess = false;
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
              try {
                console.log(`[apply-ai-code-stream] File write attempt ${attempt}/${maxRetries} for: ${fullPath}`);
                
                // Validate sandbox instance before writing
                if (!sandboxInstance || typeof sandboxInstance.files?.write !== 'function') {
                  throw new Error('Sandbox instance is invalid or files API not available');
                }
                
                // Validate file path format
                if (!fullPath || typeof fullPath !== 'string' || fullPath.trim() === '') {
                  throw new Error(`Invalid file path: ${fullPath}`);
                }
                
                // Validate file content
                if (fileContent === null || fileContent === undefined) {
                  console.warn(`[apply-ai-code-stream] Empty content for file: ${fullPath}, using empty string`);
                  fileContent = '';
                }
                
                // Create directory structure if needed
                const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
                if (dirPath && dirPath !== '/home/user/app') {
                  try {
                    console.log(`[apply-ai-code-stream] Ensuring directory exists: ${dirPath}`);
                    await sandboxInstance.commands.run(`mkdir -p "${dirPath}"`, { 
                      cwd: '/home/user/app',
                      timeout: 10000 
                    });
                  } catch (mkdirError) {
                    console.warn(`[apply-ai-code-stream] Could not create directory ${dirPath}:`, mkdirError);
                    // Continue anyway - directory might already exist
                  }
                }
                
                // Use the correct E2B API - sandbox.files.write()
                await sandboxInstance.files.write(fullPath, fileContent);
                console.log(`[apply-ai-code-stream] Successfully wrote file: ${fullPath} (${fileContent.length} chars)`);
                
                // Verify the file was written by attempting to read it back
                try {
                  const verifyContent = await sandboxInstance.files.read(fullPath);
                  if (verifyContent !== fileContent) {
                    console.warn(`[apply-ai-code-stream] File content verification failed for: ${fullPath}`);
                    console.warn(`[apply-ai-code-stream] Expected length: ${fileContent.length}, actual: ${verifyContent.length}`);
                  } else {
                    console.log(`[apply-ai-code-stream] File content verified successfully for: ${fullPath}`);
                  }
                } catch (verifyError) {
                  console.warn(`[apply-ai-code-stream] Could not verify file content:`, verifyError);
                  // Continue anyway - write may have succeeded
                }
                
                // Update file cache
                if (global.sandboxState?.fileCache) {
                  global.sandboxState.fileCache.files[normalizedPath] = {
                    content: fileContent,
                    lastModified: Date.now()
                  };
                  console.log(`[apply-ai-code-stream] Updated file cache for: ${normalizedPath}`);
                }
                
                writeSuccess = true;
                break; // Success, exit retry loop
                
              } catch (writeError) {
                lastError = writeError as Error;
                const errorMessage = lastError.message;
                console.error(`[apply-ai-code-stream] E2B file write error (attempt ${attempt}/${maxRetries}):`, writeError);
                
                // Categorize errors for better handling
                if (errorMessage.includes('Permission denied') || errorMessage.includes('EACCES')) {
                  console.error(`[apply-ai-code-stream] Permission error - this is likely unrecoverable`);
                  break; // Don't retry permission errors
                } else if (errorMessage.includes('No space left') || errorMessage.includes('ENOSPC')) {
                  console.error(`[apply-ai-code-stream] Storage space error - this is likely unrecoverable`);
                  break; // Don't retry storage errors
                } else if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
                  console.warn(`[apply-ai-code-stream] Timeout error - will retry if attempts remaining`);
                } else if (errorMessage.includes('Connection') || errorMessage.includes('network')) {
                  console.warn(`[apply-ai-code-stream] Network error - will retry if attempts remaining`);
                } else {
                  console.warn(`[apply-ai-code-stream] Unknown error - will retry if attempts remaining`);
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                  const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
                  console.log(`[apply-ai-code-stream] Waiting ${delay}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            }
            
            if (!writeSuccess && lastError) {
              console.error(`[apply-ai-code-stream] Failed to write file after ${maxRetries} attempts: ${fullPath}`);
              throw new Error(`File write failed after ${maxRetries} attempts: ${lastError.message}`);
            }
            
            if (isUpdate) {
              if (results.filesUpdated) results.filesUpdated.push(normalizedPath);
            } else {
              if (results.filesCreated) results.filesCreated.push(normalizedPath);
              if (global.existingFiles) global.existingFiles.add(normalizedPath);
            }
            
            await sendProgress({
              type: 'file-complete',
              fileName: normalizedPath,
              action: isUpdate ? 'updated' : 'created'
            });
          } catch (error) {
            if (results.errors) {
              results.errors.push(`Failed to create ${file.path}: ${(error as Error).message}`);
            }
            await sendProgress({
              type: 'file-error',
              fileName: file.path,
              error: (error as Error).message
            });
          }
        }
        
        // Step 3: Execute commands
        const commandsArray = Array.isArray(parsed.commands) ? parsed.commands : [];
        if (commandsArray.length > 0) {
          await sendProgress({ 
            type: 'step', 
            step: 3,
            message: `Executing ${commandsArray.length} commands...`
          });
          
          for (const [index, cmd] of commandsArray.entries()) {
            try {
              await sendProgress({
                type: 'command-progress',
                current: index + 1,
                total: parsed.commands.length,
                command: cmd,
                action: 'executing'
              });
              
              // Use E2B commands.run() for cleaner execution
              const result = await sandboxInstance.commands.run(cmd, {
                cwd: '/home/user/app',
                timeout: 60,
                on_stdout: async (data: string) => {
                  await sendProgress({
                    type: 'command-output',
                    command: cmd,
                    output: data,
                    stream: 'stdout'
                  });
                },
                on_stderr: async (data: string) => {
                  await sendProgress({
                    type: 'command-output',
                    command: cmd,
                    output: data,
                    stream: 'stderr'
                  });
                }
              });
              
              if (results.commandsExecuted) {
                results.commandsExecuted.push(cmd);
              }
              
              await sendProgress({
                type: 'command-complete',
                command: cmd,
                exitCode: result.exitCode,
                success: result.exitCode === 0
              });
            } catch (error) {
              if (results.errors) {
                results.errors.push(`Failed to execute ${cmd}: ${(error as Error).message}`);
              }
              await sendProgress({
                type: 'command-error',
                command: cmd,
                error: (error as Error).message
              });
            }
          }
        }
        
        // Send final results
        const totalFilesApplied = (results.filesCreated?.length || 0) + (results.filesUpdated?.length || 0);
        await sendProgress({
          type: 'complete',
          results,
          explanation: parsed.explanation,
          structure: parsed.structure,
          message: `Successfully applied ${totalFilesApplied} files`
        });
        
        // Track applied files in conversation state
        const allAffectedFiles = [...(results.filesCreated || []), ...(results.filesUpdated || [])];
        if (global.conversationState && allAffectedFiles.length > 0) {
          const messages = global.conversationState.context.messages;
          if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
              lastMessage.metadata = {
                ...lastMessage.metadata,
                editedFiles: allAffectedFiles
              };
            }
          }
          
          // Track applied code in project evolution
          if (global.conversationState.context.projectEvolution) {
            global.conversationState.context.projectEvolution.majorChanges.push({
              timestamp: Date.now(),
              description: parsed.explanation || 'Code applied',
              filesAffected: allAffectedFiles
            });
          }
          
          global.conversationState.lastUpdated = Date.now();
        }
        
      } catch (error) {
        console.error('[apply-ai-code-stream] Background process error:', error);
        try {
          await sendProgress({
            type: 'error',
            error: (error as Error).message,
            details: {
              stack: (error as Error).stack,
              name: (error as Error).name
            }
          });
        } catch (sendError) {
          console.error('[apply-ai-code-stream] Failed to send error progress:', sendError);
        }
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error('[apply-ai-code-stream] Failed to close writer:', closeError);
        }
      }
    })(sandbox, request);
    
    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse AI code';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[apply-ai-code-stream] Main route error:', error);
    console.error('[apply-ai-code-stream] Error stack:', errorStack);
    
    // Enhanced error response with more details
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      details: {
        type: 'route_error',
        parsedFiles: parsed?.files?.length || 0,
        sandboxId: sandboxId || 'none',
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}