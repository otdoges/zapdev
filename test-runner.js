/**
 * Simple test runner for AI implementation
 * Run with: node test-runner.js
 */

// Import the test file
import { AITester } from './dist/test-ai-implementation.js';

async function runTests() {
  console.log('🚀 Starting AI Implementation Tests...\n');
  
  try {
    const tester = new AITester();
    await tester.runAllTests();
    
    console.log('\n✅ Test suite completed successfully!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Check if required environment variables are set
function checkEnvironment() {
  const requiredEnvVars = [
    'VITE_GROQ_API_KEY',
    'VITE_E2B_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:', missing.join(', '));
    console.warn('Some tests may be skipped or fail.');
  }
  
  return missing.length === 0;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('='.repeat(50));
  console.log('AI IMPLEMENTATION TEST SUITE');
  console.log('='.repeat(50));
  
  checkEnvironment();
  await runTests();
}
