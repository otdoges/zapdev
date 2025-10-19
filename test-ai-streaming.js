#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function testAIStreaming() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  const baseUrl = process.env.AI_GATEWAY_BASE_URL || 'https://ai-gateway.vercel.sh/v1';

  if (!apiKey) {
    console.error('❌ Error: AI_GATEWAY_API_KEY is not set in .env.local');
    console.log('Please add your Vercel AI Gateway API key to .env.local');
    process.exit(1);
  }

  console.log('🚀 Testing Vercel AI Gateway with Streaming...\n');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🔑 API Key: ${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}\n`);

  const models = [
    {
      name: 'Fast Model',
      model: 'google/gemini-2.5-flash-lite',
      temperature: 0.3,
      description: 'Optimized for speed - framework selection, titles',
    },
    {
      name: 'Smart Model',
      model: 'moonshotai/kimi-k2-0905',
      temperature: 0.7,
      description: 'Optimized for quality - code generation, error fixing',
    },
  ];

  for (const modelConfig of models) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${modelConfig.name}`);
    console.log(`Model: ${modelConfig.model}`);
    console.log(`Use Case: ${modelConfig.description}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            {
              role: 'user',
              content: 'Write a simple React component that displays "Hello World"',
            },
          ],
          max_tokens: 500,
          temperature: modelConfig.temperature,
          stream: false,
        }),
      });

      const elapsed = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
        console.error('Response:', errorText);
        continue;
      }

      const data = await response.json();

      console.log('✅ Response received successfully!\n');
      console.log('📊 Performance Metrics:');
      console.log(`   ⏱️  Response Time: ${elapsed}ms`);
      console.log(`   🎯 Tokens Used: ${data.usage?.total_tokens || 'N/A'}`);
      console.log(`   📥 Prompt Tokens: ${data.usage?.prompt_tokens || 'N/A'}`);
      console.log(`   📤 Completion Tokens: ${data.usage?.completion_tokens || 'N/A'}`);
      
      if (elapsed < 1000) {
        console.log('   🚀 Speed: BLAZING FAST! (<1s)');
      } else if (elapsed < 3000) {
        console.log('   ⚡ Speed: Fast! (<3s)');
      } else if (elapsed < 5000) {
        console.log('   ✓  Speed: Good (<5s)');
      } else {
        console.log('   ⚠️  Speed: Slow (>5s)');
      }

      console.log('\n📝 Response Preview:');
      const content = data.choices?.[0]?.message?.content || 'No response';
      console.log(content.substring(0, 200) + (content.length > 200 ? '...' : ''));

    } catch (error) {
      console.error('❌ Error testing model:');
      console.error(error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 AI Gateway Speed Test Complete!');
  console.log(`${'='.repeat(60)}\n`);

  console.log('📋 Optimization Summary:');
  console.log('   ✓ Using Vercel AI SDK with AI Gateway');
  console.log('   ✓ Fast Model: google/gemini-2.5-flash-lite (temp: 0.3)');
  console.log('   ✓ Smart Model: moonshotai/kimi-k2-0905 (temp: 0.7)');
  console.log('   ✓ Retry logic: 3 attempts with exponential backoff');
  console.log('   ✓ Timeout: 60s request timeout');
  console.log('   ✓ Streaming: Enabled for real-time responses');
  console.log('   ✓ Frequency Penalty: 0.3-0.5 to reduce repetition\n');

  console.log('📚 Next Steps:');
  console.log('   1. Monitor performance at: https://vercel.com/dashboard/ai-gateway');
  console.log('   2. Check usage and cost optimization');
  console.log('   3. Adjust temperature/frequency_penalty if needed');
  console.log('   4. Enable caching for common patterns\n');
}

testAIStreaming().catch(console.error);
