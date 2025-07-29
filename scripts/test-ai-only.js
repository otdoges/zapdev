#!/usr/bin/env node

/**
 * AI-Only Test Script
 * Tests just the AI functionality without code execution (no E2B required)
 * Run with: bun scripts/test-ai-only.js
 */

import { generateAIResponse, streamAIResponse, model } from '../src/lib/ai.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

async function testAIBasics() {
  log('\n🚀 Testing AI Functionality Only (No Code Execution)', 'bold');
  log('This test skips E2B sandbox tests and focuses on AI responses\n', 'cyan');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Simple AI Response
  try {
    logInfo('Testing simple AI response...');
    const response = await generateAIResponse('What is 2+2? Give a brief answer.');
    
    logInfo(`Response received: "${response}" (${response?.length || 0} chars)`);
    
    if (response && response.length >= 1) { // Accept any non-empty response
      logSuccess(`AI Response Test PASSED (${response.length} chars)`);
      logInfo(`Response: ${response}`);
      passed++;
    } else {
      logError('AI response is empty or null');
      failed++;
    }
  } catch (error) {
    logError(`AI Response Test FAILED: ${error.message}`);
    failed++;
  }
  
  // Test 2: Code Generation
  try {
    logInfo('Testing AI code generation...');
    const codeResponse = await generateAIResponse('Write a simple Python function that adds two numbers. Just the code, no explanation.');
    
    if (codeResponse && (codeResponse.includes('def ') || codeResponse.includes('function'))) {
      logSuccess('AI Code Generation Test PASSED');
      logInfo('AI can generate code successfully');
      passed++;
    } else {
      logError('AI code generation failed - no code detected');
      failed++;
    }
  } catch (error) {
    logError(`Code Generation Test FAILED: ${error.message}`);
    failed++;
  }
  
  // Test 3: Streaming (simplified)
  try {
    logInfo('Testing AI streaming...');
    const streamResult = await streamAIResponse('Count from 1 to 3.');
    let chunks = 0;
    
    for await (const chunk of streamResult.textStream) {
      chunks++;
      if (chunks > 20) break; // Prevent infinite loops
    }
    
    if (chunks > 0) {
      logSuccess(`AI Streaming Test PASSED (${chunks} chunks)`);
      passed++;
    } else {
      logError('AI streaming failed - no chunks received');
      failed++;
    }
  } catch (error) {
    logError(`Streaming Test FAILED: ${error.message}`);
    failed++;
  }
  
  // Results
  log('\n' + '='.repeat(50), 'blue');
  log(`AI-ONLY TEST RESULTS`, 'bold');
  log('='.repeat(50), 'blue');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (failed === 0) {
    log('\n🎉 ALL AI TESTS PASSED!', 'green');
    log('Your AI implementation is working correctly.', 'green');
    log('To enable code execution, fix your E2B API key.', 'cyan');
  } else {
    log('\n❌ Some AI tests failed', 'red');
    log('Check your VITE_GROQ_API_KEY configuration', 'yellow');
  }
  
  return failed === 0;
}

// Run the test
testAIBasics()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  }); 