// Example Express server setup for React/Vite Stripe integration
// This should be run as a separate backend service

const express = require('express');
const cors = require('cors');
const { json, raw } = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for your React app
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parse JSON for most routes
app.use('/api', express.json());

// Import your API functions (you'll need to transpile TypeScript)
// const { generateStripeCheckout } = require('../dist/api/generate-stripe-checkout');
// const { syncAfterSuccess } = require('../dist/api/sync-after-success');
// const { handleStripeWebhook } = require('../dist/api/stripe-webhook');

// For the webhook, we need raw body
app.use('/api/stripe', raw({ type: 'application/json' }));

// Generate Stripe checkout session
app.post('/api/generate-stripe-checkout', async (req, res) => {
  try {
    const { priceId } = req.body;
    const headers = req.headers;
    
    // Call your TypeScript function
    // const result = await generateStripeCheckout(headers, priceId);
    
    // For now, mock response
    const result = { url: 'https://checkout.stripe.com/mock-session' };
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync after successful checkout
app.post('/api/sync-after-success', async (req, res) => {
  try {
    const headers = req.headers;
    
    // Call your TypeScript function
    // const result = await syncAfterSuccess(headers);
    
    // For now, mock response
    const result = {
      status: 'active',
      subscriptionId: 'sub_mock123',
      currentPeriodEnd: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
app.post('/api/stripe', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const rawBody = req.body.toString();
    
    // Call your TypeScript function
    // const result = await handleStripeWebhook(rawBody, signature);
    
    // For now, mock response
    const result = { received: true };
    
    res.json(result);
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/stripe`);
});

module.exports = app; 