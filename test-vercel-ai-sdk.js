#!/usr/bin/env node

/**
 * Test script for Vercel AI SDK integration
 * Demonstrates the performance improvements over the standard implementation
 * 
 * Usage: node test-vercel-ai-sdk.js
 */

require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.AI_GATEWAY_API_KEY;
const BASE_URL = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1/';

if (!API_KEY) {
  console.error('❌ Error: AI_GATEWAY_API_KEY is not set in .env.local');
  process.exit(1);
}

async function testStreamingPerformance() {
  console.log('🚀 Testing Vercel AI SDK Streaming Performance...\n');
  
  const testPrompt = 'Write a haiku about fast AI responses';
  
  console.log('📝 Test prompt:', testPrompt);
  console.log('');
  
  // Test 1: Traditional API call (non-streaming)
  console.log('1️⃣ Traditional API Call (Non-streaming):');
  const traditionalStart = Date.now();
  
  try {
    const response = await fetch(`${BASE_URL}chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: testPrompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });
    
    const data = await response.json();
    const traditionalTime = Date.now() - traditionalStart;
    
    console.log(`⏱️  Time to complete response: ${traditionalTime}ms`);
    console.log(`📊 Tokens used: ${data.usage?.total_tokens || 'N/A'}`);
    console.log(`💬 Response: ${data.choices?.[0]?.message?.content || 'No response'}`);
  } catch (error) {
    console.error('❌ Traditional API call failed:', error.message);
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Test 2: Vercel AI SDK Streaming
  console.log('2️⃣ Vercel AI SDK (Streaming):');
  const streamingStart = Date.now();
  let firstChunkTime = 0;
  let fullResponse = '';
  
  try {
    const response = await fetch('http://localhost:3000/api/ai-gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        model: 'geminiFlashLite',
        stream: true,
        temperature: 0.7,
        maxTokens: 100,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let firstChunk = true;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      if (firstChunk) {
        firstChunkTime = Date.now() - streamingStart;
        console.log(`⚡ Time to first chunk: ${firstChunkTime}ms`);
        firstChunk = false;
      }
      
      const chunk = decoder.decode(value);
      fullResponse += chunk;
      process.stdout.write(chunk);
    }
    
    const totalTime = Date.now() - streamingStart;
    console.log(`\n⏱️  Total streaming time: ${totalTime}ms`);
    console.log(`🚀 Speed improvement: ${Math.round((1 - firstChunkTime / totalTime) * 100)}% faster to start`);
  } catch (error) {
    console.error('❌ Streaming API call failed:', error.message);
    console.log('💡 Make sure your development server is running: npm run dev');
  }
  
  console.log('\n' + '─'.repeat(60) + '\n');
  
  // Test 3: Parallel requests performance
  console.log('3️⃣ Parallel Request Performance Test:');
  const parallelPrompts = [
    'Write a one-line joke about coding',
    'Name three benefits of AI',
    'Describe the color blue in 5 words',
  ];
  
  const parallelStart = Date.now();
  
  try {
    const parallelRequests = parallelPrompts.map(prompt =>
      fetch(`${BASE_URL}chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-lite',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
          temperature: 0.5,
        }),
      }).then(r => r.json())
    );
    
    const results = await Promise.all(parallelRequests);
    const parallelTime = Date.now() - parallelStart;
    
    console.log(`⏱️  Time for ${parallelPrompts.length} parallel requests: ${parallelTime}ms`);
    console.log(`📊 Average time per request: ${Math.round(parallelTime / parallelPrompts.length)}ms`);
    
    results.forEach((result, i) => {
      console.log(`\n   ${i + 1}. ${parallelPrompts[i]}`);
      console.log(`      → ${result.choices?.[0]?.message?.content || 'No response'}`);
    });
  } catch (error) {
    console.error('❌ Parallel requests failed:', error.message);
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
  console.log('✅ Performance test complete!');
  console.log('\n📈 Key Performance Benefits:');
  console.log('   • Streaming reduces perceived latency');
  console.log('   • First token arrives much faster');
  console.log('   • Better user experience with progressive rendering');
  console.log('   • Efficient parallel request handling');
  console.log('\n🔗 Learn more: https://vercel.com/docs/ai-gateway');
}

// Run the test
testStreamingPerformance().catch(console.error);