#!/usr/bin/env node

/**
 * AI Setup Helper Script
 * Guides users through setting up their AI implementation environment
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('🚀 ZapDev AI Implementation Setup');
  console.log('=====================================\n');
  
  console.log('This script will help you configure your AI environment.\n');
  
  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ .env.example file not found!');
    console.log('Make sure you are running this from the project root.\n');
    process.exit(1);
  }
  
  let envContent = '';
  
  if (fs.existsSync(envLocalPath)) {
    console.log('✅ Found existing .env.local file');
    const overwrite = await prompt('Do you want to update it? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled. Your existing .env.local was not modified.');
      rl.close();
      return;
    }
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  } else {
    console.log('📄 Creating .env.local from .env.example...');
    envContent = fs.readFileSync(envExamplePath, 'utf8');
  }
  
  console.log('\n🔑 API Key Setup');
  console.log('================\n');
  
  // Groq API Key
  console.log('1. GROQ API KEY (Required for AI responses)');
  console.log('   • Visit: https://console.groq.com/keys');
  console.log('   • Create an account and generate an API key');
  console.log('   • The key should start with "gsk_"\n');
  
  const groqKey = await prompt('Enter your Groq API key (or press Enter to skip): ');
  if (groqKey.trim()) {
    envContent = updateEnvVar(envContent, 'VITE_GROQ_API_KEY', groqKey.trim());
    console.log('✅ Groq API key saved\n');
  } else {
    console.log('⚠️  Groq API key skipped - AI tests will fail\n');
  }
  
  // E2B API Key
  console.log('2. E2B API KEY (Required for code execution)');
  console.log('   • Visit: https://e2b.dev/docs/api-key');
  console.log('   • Create an account and generate an API key');
  console.log('   • The key should start with "e2b_"\n');
  
  const e2bKey = await prompt('Enter your E2B API key (or press Enter to skip): ');
  if (e2bKey.trim()) {
    envContent = updateEnvVar(envContent, 'VITE_E2B_API_KEY', e2bKey.trim());
    console.log('✅ E2B API key saved\n');
  } else {
    console.log('⚠️  E2B API key skipped - code execution tests will fail\n');
  }
  
  // Save the file
  try {
    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Configuration saved to .env.local\n');
  } catch (error) {
    console.log('❌ Error saving .env.local:', error.message);
    process.exit(1);
  }
  
  // Final instructions
  console.log('🎉 Setup Complete!');
  console.log('==================\n');
  
  console.log('Next steps:');
  console.log('1. Restart your development server: bun dev');
  console.log('2. Run the AI tests: cd src && bun test-ai-implementation.ts');
  console.log('3. Check the SETUP_GUIDE.md for troubleshooting\n');
  
  if (!groqKey.trim() || !e2bKey.trim()) {
    console.log('⚠️  Some API keys were not provided:');
    if (!groqKey.trim()) console.log('   • Groq API key missing - get it from: https://console.groq.com/keys');
    if (!e2bKey.trim()) console.log('   • E2B API key missing - get it from: https://e2b.dev/docs/api-key');
    console.log('   Add these keys to .env.local when ready.\n');
  }
  
  rl.close();
}

function updateEnvVar(content, key, value) {
  // Escape special regex characters in the key to prevent regex injection
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedKey}=.*$`, 'm');
  const replacement = `${key}=${value}`;
  
  if (regex.test(content)) {
    return content.replace(regex, replacement);
  } else {
    return content + `\n${replacement}`;
  }
}

// Error handling
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup interrupted. Run the script again when ready.');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Setup failed:', error.message);
    rl.close();
    process.exit(1);
  });
} 