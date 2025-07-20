const Stripe = require('stripe');
const { ConvexHttpClient } = require('convex/browser');
const { api } = require('../convex/_generated/api');

require('dotenv').config();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
});

// Initialize Convex
const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

// Configure your products with metadata for display
const PRODUCT_CONFIG = {
  // Replace these with your actual Stripe product IDs
  'prod_starter': {
    tier: 'starter',
    features: JSON.stringify([
      '5 AI-generated websites',
      'Basic templates library',
      'Standard hosting',
      'Email support'
    ]),
    popular: 'false',
    order: '1'
  },
  'prod_professional': {
    tier: 'professional',
    features: JSON.stringify([
      'Unlimited websites',
      'Premium templates',
      'Custom domain support',
      'Priority support',
      'Advanced AI prompts',
      'Analytics dashboard'
    ]),
    popular: 'true',
    order: '2'
  },
  'prod_enterprise': {
    tier: 'enterprise',
    features: JSON.stringify([
      'White-label solution',
      'Custom integrations',
      'Dedicated support team',
      'Advanced security',
      'Custom AI training',
      'SLA guarantee'
    ]),
    popular: 'false',
    order: '3'
  }
};

async function syncStripePricing() {
  try {
    console.log('🔄 Starting Stripe pricing sync...');

    // 1. Fetch all products from Stripe
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`📦 Found ${products.data.length} active products in Stripe`);

    // 2. Sync products to Convex
    for (const product of products.data) {
      const config = PRODUCT_CONFIG[product.id] || {};
      
      const productData = {
        stripeProductId: product.id,
        name: product.name,
        description: product.description,
        active: product.active,
        metadata: {
          tier: config.tier || product.metadata.tier || product.name.toLowerCase(),
          features: config.features || product.metadata.features || JSON.stringify([]),
          popular: config.popular || product.metadata.popular || 'false',
          order: config.order || product.metadata.order || '0',
        }
      };

      await convex.mutation(api.stripe.syncStripeProduct, productData);
      console.log(`✅ Synced product: ${product.name} (${product.id})`);

      // 3. Fetch and sync prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      console.log(`💰 Found ${prices.data.length} prices for ${product.name}`);

      for (const price of prices.data) {
        const priceData = {
          stripePriceId: price.id,
          stripeProductId: product.id,
          active: price.active,
          currency: price.currency,
          recurring: price.recurring ? {
            interval: price.recurring.interval,
            intervalCount: price.recurring.interval_count,
          } : undefined,
          type: price.type,
          unitAmount: price.unit_amount,
          metadata: {
            tier: config.tier || price.metadata.tier,
          }
        };

        await convex.mutation(api.stripe.syncStripePrice, priceData);
        console.log(`   💸 Synced price: ${price.id} (${price.unit_amount ? '$' + (price.unit_amount / 100) : 'Custom'})`);
      }
    }

    console.log('🎉 Stripe pricing sync completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run "bun convex dev" to regenerate types');
    console.log('2. Your pricing components will now use real Stripe data');
    console.log('3. Update PRODUCT_CONFIG in this script with your actual Stripe product IDs');

  } catch (error) {
    console.error('❌ Error syncing Stripe pricing:', error);
    process.exit(1);
  }
}

// Helper function to show current Stripe products
async function listStripeProducts() {
  try {
    console.log('📋 Your current Stripe products:');
    console.log('=====================================');
    
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    for (const product of products.data) {
      console.log(`\nProduct: ${product.name}`);
      console.log(`ID: ${product.id}`);
      console.log(`Description: ${product.description || 'No description'}`);
      
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      console.log(`Prices:`);
      for (const price of prices.data) {
        const amount = price.unit_amount ? `$${price.unit_amount / 100}` : 'Custom';
        const interval = price.recurring ? `/${price.recurring.interval}` : ' (one-time)';
        console.log(`  - ${price.id}: ${amount}${interval}`);
      }
    }

    console.log('\n🔧 To configure these products for your website:');
    console.log('1. Update PRODUCT_CONFIG in this script with the correct product IDs');
    console.log('2. Set tier, features, popular, and order metadata');
    console.log('3. Run "bun run sync-pricing" to sync the data');

  } catch (error) {
    console.error('❌ Error listing Stripe products:', error);
  }
}

// Run the sync or list based on command line argument
const command = process.argv[2];

if (command === 'list') {
  listStripeProducts();
} else {
  syncStripePricing();
} 