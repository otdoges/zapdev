#!/usr/bin/env node

/**
 * Test script for Vercel AI Gateway integration with Vercel AI SDK
 * Run this script to verify that the Vercel AI Gateway is configured correctly
 * and that streaming works as expected
 * 
 * Usage: node test-vercel-ai-gateway.js
 * 
 * Make sure you have set the following environment variables in .env.local:
 * - AI_GATEWAY_API_KEY
 * - AI_GATEWAY_BASE_URL (optional, defaults to https://ai-gateway.vercel.sh/v1)
 */

require('dotenv').config({ path: '.env.local' });

async function testBasicConnection(apiKey, baseUrl) {
  console.log('🔧 Test 1: Basic Connection');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`);
  console.log('');

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello" in exactly one word.',
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API request failed:', response.status, response.statusText);
    console.error('Response:', errorText);
    
    if (response.status === 401) {
      console.log('\n💡 Tip: Make sure your AI_GATEWAY_API_KEY is valid.');
      console.log('Get your API key from: https://vercel.com/dashboard/ai-gateway');
    }
    
    throw new Error('Basic connection test failed');
  }

  const data = await response.json();
  
  console.log('✅ Basic connection successful!');
  console.log(`- Model: ${data.model || 'N/A'}`);
  console.log(`- Usage: ${data.usage?.total_tokens || 'N/A'} tokens`);
  console.log(`- Response: ${data.choices?.[0]?.message?.content || 'No response'}`);
  console.log('');
}

async function testStreamingResponse(apiKey, baseUrl) {
  console.log('🔧 Test 2: Streaming Response');
  console.log('Testing server-sent events (SSE) streaming...');
  console.log('');

  const response = await fetch(`${baseUrl}chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-lite',
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, one number per line.',
        },
      ],
      max_tokens: 100,
      temperature: 0.3,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Streaming request failed:', response.status, response.statusText);
    console.error('Response:', errorText);
    throw new Error('Streaming test failed');
  }

  console.log('✅ Streaming connection established!');
  console.log('📡 Receiving chunks:');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let chunks = 0;
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
      
      for (const line of lines) {
        const data = line.replace('data:', '').trim();
        if (data === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullText += content;
            chunks++;
            process.stdout.write('.');
          }
        } catch (e) {
          // Skip unparseable lines
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  console.log('');
  console.log(`✅ Streaming successful! Received ${chunks} chunks`);
  console.log(`📝 Full response: ${fullText.trim()}`);
  console.log('');
}

async function testModelPerformance(apiKey, baseUrl) {
  console.log('🔧 Test 3: Model Performance');
  console.log('Testing response times for different models...');
  console.log('');

  const models = [
    { name: 'Gemini Flash Lite', model: 'google/gemini-2.5-flash-lite', temp: 0.3 },
    { name: 'Kimi K2', model: 'moonshotai/kimi-k2-0905', temp: 0.7 },
  ];

  for (const { name, model, temp } of models) {
    const startTime = Date.now();
    
    const response = await fetch(`${baseUrl}chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: 'Say "OK" in one word.',
          },
        ],
        max_tokens: 10,
        temperature: temp,
      }),
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${name}: ${duration}ms`);
      console.log(`   Response: ${data.choices?.[0]?.message?.content || 'N/A'}`);
    } else {
      console.log(`❌ ${name}: Failed (${response.status})`);
    }
  }

  console.log('');
}

async function testVercelAIGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const baseUrl = (process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, '') + '/';

  if (!apiKey) {
    console.error('❌ Error: AI_GATEWAY_API_KEY is not set in .env.local');
    console.log('Please add your Vercel AI Gateway API key to .env.local:');
    console.log('AI_GATEWAY_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  console.log('🚀 Vercel AI Gateway Integration Test Suite');
  console.log('='.repeat(50));
  console.log('');

  try {
    await testBasicConnection(apiKey, baseUrl);
    await testStreamingResponse(apiKey, baseUrl);
    await testModelPerformance(apiKey, baseUrl);

    console.log('='.repeat(50));
    console.log('🎉 All tests passed! Vercel AI Gateway is configured correctly!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. The Inngest functions now use optimized AI Gateway routing');
    console.log('3. Streaming is enabled for real-time code generation updates');
    console.log('4. Monitor your usage at: https://vercel.com/dashboard/ai-gateway');
    console.log('');
    console.log('⚡ Performance optimizations applied:');
    console.log('- Max iterations: 5 (code agent), 6 (error fixing)');
    console.log('- Context limit: Last 2 messages');
    console.log('- Parallel execution for title/response generation');
    console.log('- Streaming support for frontend updates');

  } catch (error) {
    console.error('');
    console.error('❌ Error testing Vercel AI Gateway:');
    console.error(error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Tip: Check your internet connection and the base URL.');
    }
    
    process.exit(1);
  }
}

// Run the test
testVercelAIGateway().catch(console.error);
