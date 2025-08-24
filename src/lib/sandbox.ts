import { Sandbox } from '@e2b/code-interpreter'

let sandboxInstance: Sandbox | null = null

/**
 * Initialize E2B Sandbox for code execution
 * E2B provides secure isolated VMs that start in ~150ms
 * Documentation: https://e2b.dev/docs
 */
export async function initializeSandbox(): Promise<Sandbox> {
  try {
    if (sandboxInstance) {
      console.log('🔄 Using existing E2B sandbox instance')
      return sandboxInstance
    }
    
    const apiKey = import.meta.env.VITE_E2B_API_KEY
    if (!apiKey || apiKey === 'e2b_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' || apiKey.includes('xxxxx')) {
      throw new Error(
        '🔑 No E2B API key configured!\n\n' +
        '📋 Quick setup (2 minutes):\n' +
        '1. Visit https://e2b.dev/dashboard\n' +
        '2. Sign up (free 100 hours/month)\n' +
        '3. Create API key\n' +
        '4. Add to .env.local: VITE_E2B_API_KEY=your_key\n' +
        '5. Restart server\n\n' +
        '💡 Check QUICK_SETUP.md for detailed instructions!\n' +
        '🔄 Code will use WebContainer failsafe until configured.'
      )
    }
    
    if (!apiKey.startsWith('e2b_')) {
      throw new Error(
        '🔑 Invalid E2B API key format.\n' +
        '📝 E2B API keys should start with "e2b_"\n' +
        '🔧 Check your API key at: https://e2b.dev/dashboard'
      )
    }
    
    console.log('🚀 Creating E2B sandbox...')
    
    sandboxInstance = await Sandbox.create({
      apiKey,
      timeoutMs: 5 * 60 * 1000, // hard upper bound for sandbox lifetime
    })
    
    console.log('✅ E2B sandbox created successfully')
    console.log(`📦 Sandbox ID: ${sandboxInstance.sandboxId}`)
    
    return sandboxInstance
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Failed to initialize E2B sandbox:', err.message)
    throw err
  }
}

/**
 * Execute code in the E2B sandbox
 * Supports both Python and JavaScript execution
 */
export async function executeCode(
  code: string, 
  language: 'javascript' | 'python' = 'javascript'
): Promise<{
  stdout: string;
  stderr: string;
  results: unknown[];
  error?: unknown;
  success: boolean;
}> {
  const maxCodeLength = 50_000
  const timeoutPerExecMs = 30_000
  try {
    console.log(`🔄 Executing ${language} code in E2B sandbox...`)
    console.log(`📝 Code length: ${code.length} characters`)

    const clamped = String(code).slice(0, maxCodeLength)
    const sandbox = await initializeSandbox()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutPerExecMs)

    let execution: Awaited<ReturnType<Sandbox['runCode']>>
    try {
      execution = await sandbox.runCode(clamped, { signal: controller.signal as unknown as AbortSignal })
    } finally {
      clearTimeout(timeout)
    }

    const result = {
      stdout: (execution.logs?.stdout || []).join('\n'),
      stderr: (execution.logs?.stderr || []).join('\n'),
      results: execution.results || [],
      error: execution.error,
      success: !execution.error,
    }
    
    if (result.success) {
      console.log('✅ Code execution completed successfully')
      if (result.stdout) {
        console.log('📄 Output:', result.stdout.substring(0, 200))
      }
    } else {
      console.warn('⚠️ Code execution completed with errors')
      if (result.stderr) {
        console.warn('❌ Errors:', result.stderr.substring(0, 200))
      }
    }
    
    return result
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Code execution failed:', err.message)
    
    if (err.name === 'AbortError') {
      return {
        stdout: '',
        stderr: 'Execution timed out',
        results: [],
        error: 'timeout',
        success: false,
      }
    }

    if (err.message.includes('sandbox')) {
      console.error('🔧 Sandbox communication issue - try reinitializing')
    } else if (err.message.includes('timeout')) {
      console.error('⏰ Code execution timed out - try simpler code or increase timeout')
    } else if (err.message.includes('memory')) {
      console.error('💾 Sandbox ran out of memory - try optimizing your code')
    } else if (err.message.includes('killed') || err.message.includes('terminated')) {
      console.error('🛑 Sandbox was terminated - reinitializing...')
      sandboxInstance = null
    }
    
    return {
      stdout: '',
      stderr: err.message,
      results: [],
      error: err.message,
      success: false,
    }
  }
}

/**
 * Execute Python code specifically
 */
export async function executePython(code: string) {
  return executeCode(code, 'python')
}

/**
 * Execute JavaScript code specifically  
 */
export async function executeJavaScript(code: string) {
  return executeCode(code, 'javascript')
}

/**
 * Get sandbox information
 */
export async function getSandboxInfo(): Promise<{
  sandboxId?: string;
  isAlive: boolean;
}> {
  if (!sandboxInstance) {
    return { isAlive: false }
  }
  
  try {
    // Use the new health check function for better accuracy
    const isAlive = await isSandboxRunning()

    return {
      sandboxId: sandboxInstance.sandboxId,
      isAlive,
    }
  } catch (error: unknown) {
    // Log the error for debugging purposes
    console.warn('Failed to get sandbox info:', error);
    return { isAlive: false }
  }
}

/**
 * Start sandbox proactively (useful for warming up)
 */
export async function startSandbox(): Promise<Sandbox> {
  console.log('🎬 Starting E2B sandbox proactively...')
  return initializeSandbox()
}

/**
 * Check if sandbox is running
 * Performs actual health check instead of just null checking
 */
export async function isSandboxRunning(): Promise<boolean> {
  if (!sandboxInstance) {
    return false
  }
  
  try {
    // Perform a lightweight health check by executing a simple, fast command
    // This verifies the sandbox is actually responsive and not just a stale reference
    const healthCheck = await sandboxInstance.runCode('1+1')
    return healthCheck && !healthCheck.error
  } catch (error) {
    // If the health check fails, the sandbox is not running properly
    console.warn('🔍 Sandbox health check failed:', error)
    // Reset the instance since it's not responsive
    sandboxInstance = null
    return false
  }
}

/**
 * Get sandbox status and information without exposing mutable instance
 * Returns a read-only snapshot of sandbox state
 */
export async function getSandboxStatus(): Promise<{
  isRunning: boolean;
  sandboxId?: string;
  lastHealthCheck?: Date;
} | null> {
  const isRunning = await isSandboxRunning()
  
  if (!isRunning || !sandboxInstance) {
    return {
      isRunning: false,
      lastHealthCheck: new Date()
    }
  }
  
  // Return read-only snapshot of sandbox information
  return {
    isRunning: true,
    sandboxId: sandboxInstance.sandboxId,
    lastHealthCheck: new Date()
  }
}

/**
 * @deprecated Use getSandboxStatus() instead for safer access to sandbox information
 * Get current sandbox instance (if any)
 * Note: This exposes the mutable instance - prefer using controlled access methods
 */
export function getCurrentSandbox(): Sandbox | null {
  console.warn('⚠️ getCurrentSandbox() exposes mutable sandbox instance. Consider using getSandboxStatus() for read-only access.')
  return sandboxInstance
}

/**
 * Cleanup sandbox resources
 * Important: Always call this when done to avoid unnecessary costs
 */
export async function closeSandbox(): Promise<void> {
  if (sandboxInstance) {
    try {
      console.log('🧹 Cleaning up E2B sandbox...')
      
      // Kill the sandbox to stop billing
      await sandboxInstance.kill()
      sandboxInstance = null
      
      console.log('✅ E2B sandbox cleanup completed')
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('⚠️ E2B sandbox cleanup error (not critical):', err.message)
      // Reset instance anyway to avoid stale references
      sandboxInstance = null
    }
  } else {
    console.log('ℹ️ No active E2B sandbox to cleanup')
  }
}

/**
 * Restart sandbox (useful if it becomes unresponsive)
 */
export async function restartSandbox(): Promise<Sandbox> {
  console.log('🔄 Restarting E2B sandbox...')
  await closeSandbox()
  return initializeSandbox()
}