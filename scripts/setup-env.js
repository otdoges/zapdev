#!/usr/bin/env node

/**
 * ZapDev Environment Setup Script
 * 
 * This script helps set up and validate your environment variables for AI functionality.
 * Run with: bun scripts/setup-env.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'blue');
  log(`${title}`, 'bold');
  log('='.repeat(60), 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function checkEnvironmentFiles() {
  logSection('CHECKING ENVIRONMENT FILES');
  
  const files = ['.env', '.env.local', '.env.example'];
  const existingFiles = [];
  
  for (const file of files) {
    if (existsSync(file)) {
      logSuccess(`Found ${file}`);
      existingFiles.push(file);
    } else {
      logWarning(`Missing ${file}`);
    }
  }
  
  return existingFiles;
}

function parseEnvFile(filepath) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    logError(`Failed to read ${filepath}: ${error.message}`);
    return {};
  }
}

async function validateApiKey(keyName, keyValue, validator) {
  if (!keyValue || keyValue === 'your_api_key_here' || keyValue === '') {
    logError(`${keyName} is not set or is placeholder`);
    return false;
  }
  
  logInfo(`Testing ${keyName}...`);
  
  try {
    const isValid = await validator(keyValue);
    if (isValid) {
      logSuccess(`${keyName} is valid and working`);
      return true;
    } else {
      logError(`${keyName} is invalid or not working`);
      return false;
    }
  } catch (error) {
    logError(`${keyName} validation failed: ${error.message}`);
    return false;
  }
}

async function testGroqKey(apiKey) {
  try {
    // Simple test request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2-instruct',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    });
    
    if (response.status === 401) {
      return false; // Invalid API key
    }
    
    if (response.status === 429) {
      logWarning('Rate limited, but key appears valid');
      return true;
    }
    
    return response.ok || response.status === 429;
  } catch (error) {
    if (error.message.includes('fetch')) {
      logWarning('Network error - check your internet connection');
    }
    return false;
  }
}

async function testE2BKey(apiKey) {
  try {
    logInfo('Testing E2B Code Interpreter SDK...');
    
    // Validate API key format first
    if (!apiKey.startsWith('e2b_')) {
      logError('E2B API key should start with "e2b_"');
      logInfo('🔑 Check your API key format at: https://e2b.dev/dashboard');
      return false;
    }
    
    // Import the E2B SDK to test it properly
    const { Sandbox } = await import('@e2b/code-interpreter');
    
    logInfo('Creating E2B sandbox...');
    const sandbox = await Sandbox.create({
      apiKey: apiKey,
      timeoutMs: 30000, // 30 second timeout for testing
    });
    
    logSuccess('E2B sandbox created successfully!');
    logInfo(`Sandbox ID: ${sandbox.sandboxId}`);
    
    // Test a simple Python code execution
    logInfo('Testing Python code execution...');
    const pythonExecution = await sandbox.runCode('print("Hello from E2B Python!")');
    
    if (pythonExecution && pythonExecution.logs.stdout.length > 0) {
      logSuccess('Python code execution test passed!');
      logInfo(`Output: ${pythonExecution.logs.stdout.join('')}`);
    } else {
      logWarning('Python code execution returned no output (might be normal)');
    }
    
    // Test a simple JavaScript code execution
    logInfo('Testing JavaScript code execution...');
    const jsExecution = await sandbox.runCode('console.log("Hello from E2B JavaScript!")');
    
    if (jsExecution) {
      logSuccess('JavaScript code execution test passed!');
      if (jsExecution.logs.stdout.length > 0) {
        logInfo(`Output: ${jsExecution.logs.stdout.join('')}`);
      }
    }
    
    // Clean up the test sandbox
    await sandbox.kill();
    logInfo('Test sandbox cleaned up successfully');
    
    return true;
    
  } catch (error) {
    logError(`E2B SDK test failed: ${error.message}`);
    
    // Provide specific error guidance based on E2B documentation
    if (error.message.includes('Invalid API key') || error.message.includes('401')) {
      logError('E2B API key is invalid or expired');
      logInfo('🔑 Get a new API key: https://e2b.dev/dashboard');
      logInfo('📝 Make sure to copy the full key including "e2b_" prefix');
    } else if (error.message.includes('authorization header is missing')) {
      logError('E2B API key is not being passed correctly');
      logInfo('🔧 Check your .env.local file has: VITE_E2B_API_KEY=e2b_your_key_here');
    } else if (error.message.includes('insufficient funds') || error.message.includes('402')) {
      logError('E2B account has insufficient credits');
      logInfo('💳 Add credits at: https://e2b.dev/dashboard');
      logInfo('📊 Free tier includes 100 hours/month');
    } else if (error.message.includes('rate limit') || error.message.includes('429')) {
      logWarning('E2B rate limited, but key appears valid');
      logInfo('⏰ Wait a moment and try again');
      return true; // Rate limit means the key is valid
    } else if (error.message.includes('timeout')) {
      logWarning('E2B sandbox creation timed out');
      logInfo('🌐 This might be a temporary service issue');
      logInfo('📝 Check E2B status: https://status.e2b.dev');
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      logWarning('Network error - check your internet connection');
      logWarning('If behind a firewall, E2B API might be blocked');
    } else {
      logError('E2B service error (check service status)');
      logInfo('🌐 E2B status: https://status.e2b.dev');
      logInfo('📚 E2B docs: https://e2b.dev/docs');
    }
    
    return false;
  }
}

function createEnvFile() {
  logSection('CREATING ENVIRONMENT FILE');
  
  const envContent = `# ZapDev Environment Configuration
# Copy this file to .env.local and fill in your actual values

# AI Configuration - Required for tests to pass
# Get your API key from: https://console.groq.com/keys
VITE_GROQ_API_KEY=

# Sandbox Configuration - Required for code execution tests
# Get your API key from: https://e2b.dev/docs/api-key  
VITE_E2B_API_KEY=

# Other configurations (optional for basic AI tests)
VITE_CONVEX_URL=
VITE_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTH=
STRIPE_PRICE_PRO_YEAR=
STRIPE_PRICE_ENTERPRISE_MONTH=
STRIPE_PRICE_ENTERPRISE_YEAR=
VITE_APP_URL=http://localhost:5173
`;

  try {
    if (!existsSync('.env.local')) {
      writeFileSync('.env.local', envContent);
      logSuccess('Created .env.local file');
    } else {
      logInfo('.env.local already exists');
    }
    
    logInfo('Next steps:');
    logInfo('1. Edit .env.local and add your API keys');
    logInfo('2. Get Groq key: https://console.groq.com/keys');
    logInfo('3. Get E2B key: https://e2b.dev/docs/api-key');
    logInfo('4. Restart your dev server');
    logInfo('5. Run tests again');
  } catch (error) {
    logError(`Failed to create .env.local: ${error.message}`);
  }
}

async function checkEnvironmentVariables() {
  logSection('CHECKING ENVIRONMENT VARIABLES');
  
  // Check process.env directly
  const groqKey = process.env.VITE_GROQ_API_KEY;
  const e2bKey = process.env.VITE_E2B_API_KEY;
  
  logInfo(`Runtime check:`);
  logInfo(`VITE_GROQ_API_KEY: ${groqKey ? 'Set' : 'Not set'}`);
  logInfo(`VITE_E2B_API_KEY: ${e2bKey ? 'Set' : 'Not set'}`);
  
  // Check all existing env files
  const envFiles = ['.env.local', '.env'];
  
  for (const file of envFiles) {
    if (existsSync(file)) {
      logInfo(`\nChecking ${file}:`);
      const env = parseEnvFile(file);
      
      const fileGroqKey = env.VITE_GROQ_API_KEY;
      const fileE2bKey = env.VITE_E2B_API_KEY;
      
      logInfo(`  VITE_GROQ_API_KEY: ${fileGroqKey ? 'Set' : 'Not set'}`);
      logInfo(`  VITE_E2B_API_KEY: ${fileE2bKey ? 'Set' : 'Not set'}`);
    }
  }
  
  return { groqKey, e2bKey };
}

async function validateKeys() {
  logSection('VALIDATING API KEYS');
  
  const { groqKey, e2bKey } = await checkEnvironmentVariables();
  
  let allValid = true;
  
  if (groqKey) {
    const groqValid = await validateApiKey('VITE_GROQ_API_KEY', groqKey, testGroqKey);
    allValid = allValid && groqValid;
  } else {
    logError('VITE_GROQ_API_KEY is not set');
    allValid = false;
  }
  
  if (e2bKey) {
    const e2bValid = await validateApiKey('VITE_E2B_API_KEY', e2bKey, testE2BKey);
    allValid = allValid && e2bValid;
  } else {
    logError('VITE_E2B_API_KEY is not set');
    allValid = false;
  }
  
  return allValid;
}

function checkViteConfig() {
  logSection('CHECKING VITE CONFIGURATION');
  
  try {
    if (existsSync('vite.config.ts')) {
      const viteConfig = readFileSync('vite.config.ts', 'utf8');
      
      // Check if environment variables are properly configured
      if (viteConfig.includes('loadEnv') || viteConfig.includes('process.env')) {
        logSuccess('Vite config appears to handle environment variables');
      } else {
        logWarning('Vite config might not be properly loading environment variables');
        logInfo('Consider adding environment variable loading to vite.config.ts');
      }
    } else {
      logWarning('vite.config.ts not found');
    }
  } catch (error) {
    logError(`Failed to read vite config: ${error.message}`);
  }
}

function printTroubleshootingGuide() {
  logSection('TROUBLESHOOTING GUIDE');
  
  log('If your tests are still failing, try these steps:', 'bold');
  logInfo('');
  logInfo('1. RESTART YOUR DEV SERVER:');
  logInfo('   - Stop your current dev server (Ctrl+C)');
  logInfo('   - Run: bun dev');
  logInfo('');
  logInfo('2. CHECK API KEY FORMAT:');
  logInfo('   - Groq keys start with "gsk_"');
  logInfo('   - E2B keys start with "e2b_"');
  logInfo('   - No extra spaces or quotes around keys');
  logInfo('');
  logInfo('3. VERIFY API KEY PERMISSIONS:');
  logInfo('   - Login to Groq console and check key status');
  logInfo('   - Login to E2B dashboard and check credits');
  logInfo('');
  logInfo('4. CHECK ENVIRONMENT FILE LOCATION:');
  logInfo('   - File should be named .env.local (not .env.local.txt)');
  logInfo('   - File should be in project root directory');
  logInfo('');
  logInfo('5. TEST KEYS MANUALLY:');
  logInfo('   - Run: bun scripts/setup-env.js');
  logInfo('   - This script validates your keys');
  logInfo('');
  logInfo('6. CLEAR NODE MODULES (if desperate):');
  logInfo('   - rm -rf node_modules');
  logInfo('   - bun install');
  logInfo('');
}

async function main() {
  log('\n🚀 ZapDev Environment Setup Script', 'bold');
  log('This script will help you configure your environment for AI functionality\n', 'cyan');
  
  try {
    // Check if we have the required files
    const existingFiles = await checkEnvironmentFiles();
    
    // If no .env.local exists, create one
    if (!existingFiles.includes('.env.local')) {
      createEnvFile();
    }
    
    // Check Vite configuration
    checkViteConfig();
    
    // Validate the API keys
    const keysValid = await validateKeys();
    
    if (keysValid) {
      logSection('✅ SUCCESS');
      logSuccess('All API keys are configured and working!');
      logSuccess('Your AI implementation should be working now.');
      logInfo('Run the tests: cd src && bun test-ai-implementation.ts');
    } else {
      logSection('❌ ISSUES DETECTED');
      logError('Some API keys are missing or invalid.');
      printTroubleshootingGuide();
    }
    
  } catch (error) {
    logError(`Setup script failed: ${error.message}`);
    console.error(error);
  }
}

// Run the script
main().catch(console.error); 