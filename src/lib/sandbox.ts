import { Sandbox } from '@e2b/code-interpreter'

let sandboxInstance: Sandbox | null = null

export async function initializeSandbox() {
  try {
    if (sandboxInstance) {
      return sandboxInstance
    }
    
    sandboxInstance = await Sandbox.create({
      apiKey: process.env.VITE_E2B_API_KEY || '',
    })
    
    return sandboxInstance
  } catch (error) {
    console.error('Sandbox initialization error:', error)
    throw error
  }
}

export async function executeCode(code: string, language: 'python' | 'javascript' = 'python') {
  try {
    const sandbox = await initializeSandbox()
    
    // For both Python and JavaScript, use runCode method
    const execution = await sandbox.runCode(code)
    return {
      stdout: execution.logs.stdout.join('\n'),
      stderr: execution.logs.stderr.join('\n'),
      results: execution.results || [],
      error: execution.error,
    }
  } catch (error) {
    console.error('Code execution error:', error)
    throw error
  }
}

export async function closeSandbox() {
  if (sandboxInstance) {
    await sandboxInstance.kill()
    sandboxInstance = null
  }
}