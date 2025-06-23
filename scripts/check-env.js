#!/usr/bin/env node

console.log('🔍 Checking ZapDev Environment Configuration...\n');

// Check Node.js version
console.log('📦 Node.js version:', process.version);

// Check environment variables
const requiredEnvVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const optionalEnvVars = {
  'NEXT_PUBLIC_APP_URL': process.env.NEXT_PUBLIC_APP_URL,
  'NODE_ENV': process.env.NODE_ENV,
};

console.log('🔧 Required Environment Variables:');
let hasAllRequired = true;

for (const [key, value] of Object.entries(requiredEnvVars)) {
  const status = value 
    ? (value.includes('placeholder') ? '⚠️  PLACEHOLDER' : '✅ SET')
    : '❌ MISSING';
  
  console.log(`  ${key}: ${status}`);
  
  if (!value || value.includes('placeholder')) {
    hasAllRequired = false;
  }
}

console.log('\n🔧 Optional Environment Variables:');
for (const [key, value] of Object.entries(optionalEnvVars)) {
  const status = value ? '✅ SET' : '⚪ NOT SET';
  console.log(`  ${key}: ${status}`);
}

console.log('\n📋 Configuration Status:');

if (hasAllRequired) {
  console.log('✅ All required environment variables are properly configured!');
  console.log('✅ Supabase authentication should work correctly.');
} else {
  console.log('❌ Missing or placeholder environment variables detected.');
  console.log('');
  console.log('📝 To fix this:');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add your Supabase project credentials:');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('');
  console.log('📖 Follow the setup guide in SUPABASE-SETUP.md for detailed instructions.');
}

console.log('\n🔗 Useful Commands:');
console.log('  bun dev          - Start development server');
console.log('  bun build        - Build for production');
console.log('  bun start        - Start production server');

console.log('\n🎯 Next Steps:');
console.log('1. Configure Supabase environment variables (if not done)');
console.log('2. Set up authentication providers in Supabase dashboard');
console.log('3. Test authentication at http://localhost:3000/auth');
console.log('4. Start building with ZapDev at http://localhost:3000/chat');

console.log('\n✨ Happy coding with ZapDev!'); 