/**
 * Stripe Pricing Integration Tests
 * Tests the Stripe pricing functionality and payment flow
 */

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
};

// Mock Stripe test data
const TEST_PAYMENT_DATA = {
  validCard: '4242424242424242',
  declinedCard: '4000000000000002',
  insufficientFundsCard: '4000000000009995',
  expiry: '12/34',
  cvc: '123',
  zip: '12345',
};

// Test price configurations
const TEST_PRICES = [
  { amount: 100, currency: 'usd', name: 'Minimum Payment' },
  { amount: 999, currency: 'usd', name: 'Standard Subscription' },
  { amount: 4999, currency: 'usd', name: 'Premium Payment' },
  { amount: 2000, currency: 'eur', name: 'EUR Test' },
];

/**
 * Test Stripe API key configuration
 */
async function testStripeConfiguration() {
  console.log('🔑 Testing Stripe configuration...');

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customAmount: {
          amount: 100,
          currency: 'usd',
          name: 'Configuration Test',
          description: 'Testing Stripe configuration'
        },
        mode: 'payment'
      })
    });

    if (response.status === 401) {
      throw new Error('❌ Authentication required - Check Clerk integration');
    }

    const data = await response.json();

    if (response.ok && data.sessionId) {
      console.log('✅ Stripe configuration is valid');
      console.log(`📋 Session ID format: ${data.sessionId.substring(0, 10)}...`);
      return true;
    } else {
      console.log('❌ Stripe configuration error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Stripe configuration test failed:', error.message);
    return false;
  }
}

/**
 * Test pricing page accessibility
 */
async function testPricingPageAccess() {
  console.log('🌐 Testing pricing page accessibility...');

  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/test-pricing`);

    if (response.ok) {
      const html = await response.text();

      // Check for key elements
      const hasTitle = html.includes('Stripe Pricing Test');
      const hasPlans = html.includes('Test Subscription Plans');
      const hasCustomForm = html.includes('Custom Amount Test');
      const hasTestInfo = html.includes('Testing Information');

      if (hasTitle && hasPlans && hasCustomForm && hasTestInfo) {
        console.log('✅ Pricing page loads correctly with all components');
        return true;
      } else {
        console.log('⚠️ Pricing page missing some components');
        console.log(`Title: ${hasTitle}, Plans: ${hasPlans}, Form: ${hasCustomForm}, Info: ${hasTestInfo}`);
        return false;
      }
    } else {
      console.log(`❌ Pricing page not accessible: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Pricing page access test failed:', error.message);
    return false;
  }
}

/**
 * Test checkout session creation for different price points
 */
async function testCheckoutSessionCreation() {
  console.log('💳 Testing checkout session creation...');

  const results = [];

  for (const price of TEST_PRICES) {
    try {
      console.log(`  Testing ${price.name}: ${price.amount / 100} ${price.currency.toUpperCase()}`);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customAmount: {
            amount: price.amount,
            currency: price.currency,
            name: price.name,
            description: `Test for ${price.name}`
          },
          mode: 'payment'
        })
      });

      const data = await response.json();

      if (response.ok && data.sessionId) {
        console.log(`  ✅ ${price.name}: Session created successfully`);
        results.push({ ...price, success: true, sessionId: data.sessionId });
      } else {
        console.log(`  ❌ ${price.name}: ${data.error || 'Unknown error'}`);
        results.push({ ...price, success: false, error: data.error });
      }
    } catch (error) {
      console.log(`  ❌ ${price.name}: ${error.message}`);
      results.push({ ...price, success: false, error: error.message });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`📊 Checkout session creation: ${successCount}/${TEST_PRICES.length} successful`);

  return results;
}

/**
 * Test subscription vs one-time payment modes
 */
async function testPaymentModes() {
  console.log('🔄 Testing payment modes...');

  const modes = ['payment', 'subscription'];
  const results = [];

  for (const mode of modes) {
    try {
      console.log(`  Testing ${mode} mode...`);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customAmount: {
            amount: 1000, // $10.00
            currency: 'usd',
            name: `Test ${mode}`,
            description: `Testing ${mode} mode`
          },
          mode: mode
        })
      });

      const data = await response.json();

      if (response.ok && data.sessionId) {
        console.log(`  ✅ ${mode} mode: Working correctly`);
        results.push({ mode, success: true });
      } else {
        console.log(`  ❌ ${mode} mode: ${data.error || 'Unknown error'}`);
        results.push({ mode, success: false, error: data.error });
      }
    } catch (error) {
      console.log(`  ❌ ${mode} mode: ${error.message}`);
      results.push({ mode, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Test error handling for invalid requests
 */
async function testErrorHandling() {
  console.log('⚠️ Testing error handling...');

  const errorTests = [
    {
      name: 'Missing amount and priceId',
      payload: { mode: 'payment' },
      expectedError: 'Either priceId or customAmount is required'
    },
    {
      name: 'Invalid currency',
      payload: {
        customAmount: { amount: 1000, currency: 'invalid', name: 'Test' },
        mode: 'payment'
      }
    },
    {
      name: 'Negative amount',
      payload: {
        customAmount: { amount: -100, currency: 'usd', name: 'Test' },
        mode: 'payment'
      }
    }
  ];

  const results = [];

  for (const test of errorTests) {
    try {
      console.log(`  Testing: ${test.name}`);

      const response = await fetch(`${TEST_CONFIG.baseUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`  ✅ ${test.name}: Correctly rejected`);
        results.push({ ...test, success: true, error: data.error });
      } else {
        console.log(`  ⚠️ ${test.name}: Should have been rejected but succeeded`);
        results.push({ ...test, success: false });
      }
    } catch (error) {
      console.log(`  ❌ ${test.name}: Test failed - ${error.message}`);
      results.push({ ...test, success: false, error: error.message });
    }
  }

  return results;
}

/**
 * Generate test report
 */
function generateReport(results) {
  console.log('\n📋 STRIPE PRICING TEST REPORT');
  console.log('=' .repeat(50));

  const allTests = Object.values(results).flat();
  const successCount = allTests.filter(test =>
    typeof test === 'boolean' ? test : test.success !== false
  ).length;

  console.log(`✅ Successful tests: ${successCount}`);
  console.log(`❌ Failed tests: ${allTests.length - successCount}`);

  // Configuration status
  console.log('\n🔧 Configuration Status:');
  console.log(`Stripe API: ${results.config ? '✅ Working' : '❌ Failed'}`);
  console.log(`Test Page: ${results.pageAccess ? '✅ Accessible' : '❌ Not accessible'}`);

  // Payment processing status
  console.log('\n💳 Payment Processing:');
  if (results.checkout && results.checkout.length > 0) {
    const checkoutSuccess = results.checkout.filter(r => r.success).length;
    console.log(`Checkout Sessions: ${checkoutSuccess}/${results.checkout.length} working`);
  }

  if (results.modes && results.modes.length > 0) {
    const modeSuccess = results.modes.filter(r => r.success).length;
    console.log(`Payment Modes: ${modeSuccess}/${results.modes.length} working`);
  }

  // Error handling status
  console.log('\n⚠️ Error Handling:');
  if (results.errors && results.errors.length > 0) {
    const errorSuccess = results.errors.filter(r => r.success).length;
    console.log(`Error Cases: ${errorSuccess}/${results.errors.length} handled correctly`);
  }

  console.log('\n🎯 Overall Status:', successCount >= allTests.length * 0.8 ? '✅ PASS' : '❌ NEEDS ATTENTION');
}

/**
 * Main test runner
 */
async function runStripeTests() {
  console.log('🚀 Starting Stripe Pricing Integration Tests...');
  console.log(`📍 Target URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`⏱️ Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log();

  const results = {};

  try {
    // Test 1: Configuration
    results.config = await testStripeConfiguration();

    // Test 2: Page access
    results.pageAccess = await testPricingPageAccess();

    // Test 3: Checkout session creation
    results.checkout = await testCheckoutSessionCreation();

    // Test 4: Payment modes
    results.modes = await testPaymentModes();

    // Test 5: Error handling
    results.errors = await testErrorHandling();

    // Generate report
    generateReport(results);

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runStripeTests()
    .then(() => {
      console.log('\n✅ Test suite completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runStripeTests,
  testStripeConfiguration,
  testPricingPageAccess,
  testCheckoutSessionCreation,
  testPaymentModes,
  testErrorHandling,
  TEST_CONFIG,
  TEST_PAYMENT_DATA,
  TEST_PRICES
};
