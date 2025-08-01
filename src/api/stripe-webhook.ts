/**
 * Stripe Webhook Handler
 * 
 * This file provides a webhook handler that can be used with various frameworks.
 * For Vite/React apps, you'll need to set up a backend service to handle webhooks.
 * This is a reference implementation that can be adapted for your backend.
 */

import { safeWebhookHandler } from '../lib/stripe-webhook';

/**
 * Generic webhook handler that can be adapted for different frameworks
 */
export const stripeWebhookHandler = async (request: Request): Promise<Response> => {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get the raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 });
    }

    // Use the safe webhook handler
    return await safeWebhookHandler(body, signature);
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return new Response('Internal server error', { status: 500 });
  }
};

/**
 * Next.js API Route Handler (App Router)
 * Place this in: app/api/stripe/webhook/route.ts
 */
export async function POST(request: Request) {
  return await stripeWebhookHandler(request);
}

/**
 * Next.js API Route Handler (Pages Router)
 * Place this in: pages/api/stripe/webhook.ts
 * 
 * import { NextApiRequest, NextApiResponse } from 'next';
 * import { stripeWebhookHandler } from '../../../../src/api/stripe-webhook';
 * 
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (req.method !== 'POST') {
 *     return res.status(405).json({ error: 'Method not allowed' });
 *   }
 * 
 *   try {
 *     const body = JSON.stringify(req.body);
 *     const signature = req.headers['stripe-signature'] as string;
 * 
 *     if (!signature) {
 *       return res.status(400).json({ error: 'Missing stripe-signature header' });
 *     }
 * 
 *     const result = await safeWebhookHandler(body, signature);
 *     const data = await result.json();
 *     
 *     return res.status(result.status).json(data);
 *   } catch (error) {
 *     console.error('Error in webhook handler:', error);
 *     return res.status(500).json({ error: 'Internal server error' });
 *   }
 * }
 * 
 * // Important: Disable body parsing for Stripe webhooks
 * export const config = {
 *   api: {
 *     bodyParser: false,
 *   },
 * };
 */

/**
 * Express.js Handler
 * 
 * import express from 'express';
 * import { stripeWebhookHandler } from './src/api/stripe-webhook';
 * 
 * const app = express();
 * 
 * // Use raw body parser for Stripe webhooks
 * app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
 * 
 * app.post('/api/stripe/webhook', async (req, res) => {
 *   try {
 *     const body = req.body.toString();
 *     const signature = req.headers['stripe-signature'] as string;
 * 
 *     if (!signature) {
 *       return res.status(400).json({ error: 'Missing stripe-signature header' });
 *     }
 * 
 *     const request = new Request('http://localhost/webhook', {
 *       method: 'POST',
 *       headers: {
 *         'stripe-signature': signature,
 *         'content-type': 'application/json',
 *       },
 *       body: body,
 *     });
 * 
 *     const response = await stripeWebhookHandler(request);
 *     const data = await response.json();
 *     
 *     return res.status(response.status).json(data);
 *   } catch (error) {
 *     console.error('Error in webhook handler:', error);
 *     return res.status(500).json({ error: 'Internal server error' });
 *   }
 * });
 */

/**
 * Fastify Handler
 * 
 * import fastify from 'fastify';
 * import { stripeWebhookHandler } from './src/api/stripe-webhook';
 * 
 * const server = fastify();
 * 
 * server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
 *   done(null, body);
 * });
 * 
 * server.post('/api/stripe/webhook', async (request, reply) => {
 *   try {
 *     const body = request.body.toString();
 *     const signature = request.headers['stripe-signature'] as string;
 * 
 *     if (!signature) {
 *       return reply.status(400).send({ error: 'Missing stripe-signature header' });
 *     }
 * 
 *     const webRequest = new Request('http://localhost/webhook', {
 *       method: 'POST',
 *       headers: {
 *         'stripe-signature': signature,
 *         'content-type': 'application/json',
 *       },
 *       body: body,
 *     });
 * 
 *     const response = await stripeWebhookHandler(webRequest);
 *     const data = await response.json();
 *     
 *     return reply.status(response.status).send(data);
 *   } catch (error) {
 *     console.error('Error in webhook handler:', error);
 *     return reply.status(500).send({ error: 'Internal server error' });
 *   }
 * });
 */

/**
 * Convex Action for handling webhooks
 * Place this in: convex/stripe.ts
 * 
 * import { action } from "./_generated/server";
 * import { v } from "convex/values";
 * import { safeWebhookHandler } from "../src/lib/stripe-webhook";
 * 
 * export const handleWebhook = action({
 *   args: {
 *     body: v.string(),
 *     signature: v.string(),
 *   },
 *   handler: async (ctx, args) => {
 *     try {
 *       const response = await safeWebhookHandler(args.body, args.signature);
 *       const data = await response.json();
 *       
 *       return {
 *         success: response.ok,
 *         status: response.status,
 *         data,
 *       };
 *     } catch (error) {
 *       console.error('Error in Convex webhook handler:', error);
 *       return {
 *         success: false,
 *         status: 500,
 *         error: 'Internal server error',
 *       };
 *     }
 *   },
 * });
 */
