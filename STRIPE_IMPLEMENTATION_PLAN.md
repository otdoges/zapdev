# ZapDev Stripe Implementation Plan

## Overview
Complete implementation plan for Stripe integration with competitive pricing strategy, featuring white and orange design system matching the home page aesthetic.

## 🎯 Pricing Strategy

### Competitive Analysis
- **Cursor**: $20/month
- **Lovable**: $20/month  
- **Bolt.new**: $20/month
- **Replit**: Various tiers
- **V0 by Vercel**: Subscription-based

### Our Positioning
- **Free Tier**: More generous than competitors (unlimited chats vs 5-10 limit)
- **Premium Tier**: $19/month (undercuts competition by $1)
- **Key Differentiator**: AI model upgrade (Claude 3.5 Sonnet vs Kimi K2)

## 📊 Feature Matrix

### Free Tier
- ✅ **Unlimited chats** (beat competitors' 5-10 limit)
- ✅ Kimi K2 AI model
- ✅ 3 active sandboxes
- ✅ GitHub export
- ✅ Basic templates
- ✅ Community support

### Premium Tier ($19/month)
- ✅ **Everything in Free**
- ✅ **Claude 3.5 Sonnet AI model** (50% better performance)
- ✅ Unlimited sandboxes
- ✅ Priority support
- ✅ Premium templates
- ✅ Team collaboration
- ✅ Custom domains
- ✅ Private deployments
- ✅ Advanced debugging tools
- ✅ Usage analytics

## 🎨 Design System

### Color Palette (White & Orange Theme)
```css
:root {
  --primary-orange: hsl(25, 100%, 50%);     /* Main orange */
  --orange-light: hsl(25, 100%, 65%);      /* Light orange */
  --orange-dark: hsl(25, 100%, 40%);       /* Dark orange */
  --background: hsl(0, 0%, 100%);          /* Pure white */
  --card: hsl(0, 0%, 98%);                 /* Off-white cards */
  --text-primary: hsl(0, 0%, 9%);          /* Almost black */
  --text-secondary: hsl(0, 0%, 45%);       /* Gray text */
  --border: hsl(0, 0%, 90%);               /* Light gray borders */
  --success: hsl(142, 76%, 36%);           /* Green for checkmarks */
  --shadow: hsla(0, 0%, 0%, 0.1);          /* Subtle shadows */
}
```

### Typography
- **Hero Numbers**: 3.5rem, bold, orange primary
- **Plan Names**: 1.5rem, bold, text primary
- **Features**: 1rem, regular, text secondary
- **Captions**: 0.875rem, medium, text secondary

## 🏗️ Technical Architecture

### Database Schema (Convex Extensions)
```typescript
subscriptions: {
  userId: string,              // Clerk user ID
  planId: 'free' | 'premium',
  status: 'active' | 'canceled' | 'past_due',
  stripeCustomerId: string,
  stripeSubscriptionId?: string,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  cancelAtPeriodEnd: boolean,
  metadata?: object
}

usage: {
  userId: string,
  month: string,               // YYYY-MM format
  chatsUsed: number,
  sandboxesActive: number,
  aiTokensConsumed: number,
  modelUsage: {
    claude: number,
    kimi: number
  }
}
```

### API Routes Structure
```
app/api/
├── stripe/
│   ├── webhook/route.ts          ✅ Already implemented
│   ├── create-checkout-session/  ✅ Already implemented
│   └── customer-portal/route.ts  ✅ Already implemented
├── subscription/
│   ├── status/route.ts           📝 New - Get user subscription
│   ├── upgrade/route.ts          📝 New - Handle upgrades
│   └── usage/route.ts            📝 New - Track usage
└── ai/
    └── model-select/route.ts     📝 New - AI model routing
```

### Component Architecture
```
components/
├── pricing/
│   ├── PricingSection.tsx        📝 New - Main pricing component
│   ├── PricingCard.tsx           📝 New - Individual plan cards
│   ├── BillingToggle.tsx         📝 New - Monthly/Annual toggle
│   ├── FeatureComparison.tsx     📝 New - Feature comparison
│   └── UpgradePrompts.tsx        📝 New - Conversion prompts
├── ai/
│   ├── ModelComparison.tsx       📝 New - AI model comparison
│   ├── ModelUpgradePrompt.tsx    📝 New - Upgrade prompts
│   └── UsageIndicator.tsx        📝 New - Usage tracking UI
└── subscription/
    ├── SubscriptionStatus.tsx    📝 New - Current plan status
    └── BillingPortal.tsx         📝 New - Manage billing
```

## 🤖 AI Model Differentiation

### Model Selection Logic
```typescript
Free Tier → Kimi K2:
- Fast responses
- Good for basic tasks
- 128k context window
- Cost-effective

Premium Tier → Claude 3.5 Sonnet:
- Superior reasoning
- Better code generation
- 200k context window
- Advanced problem-solving
```

### Implementation Strategy
1. **Provider Factory Pattern** - Clean model switching
2. **Usage Tracking** - Monitor model performance
3. **Graceful Fallbacks** - Handle API limits
4. **Real-time Routing** - Dynamic model selection

## 📱 UI/UX Features

### Pricing Table Design
- **Clean White Background** with subtle shadows
- **Orange Accent Colors** for primary actions
- **Feature Comparison Grid** with animated checkmarks
- **Social Proof Elements** (user count, testimonials)
- **Mobile-First Responsive** design

### Interactive Elements
- Smooth hover effects (scale: 1.02)
- Animated number counting
- Billing toggle transitions
- Loading state animations
- Tooltip feature previews

### Conversion Optimization
- **Strategic Upgrade Prompts** at usage limits
- **Model Comparison Tooltips** showing benefits
- **One-Click Upgrades** from app interface
- **Social Proof** with user testimonials

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- [ ] Extend Convex schema for subscriptions
- [ ] Create subscription middleware
- [ ] Build usage tracking system
- [ ] Test Stripe webhook integration

### Phase 2: AI Model System (Week 1-2)
- [ ] Implement AI provider factory
- [ ] Create model selection logic
- [ ] Add usage-based routing
- [ ] Build fallback mechanisms

### Phase 3: Pricing UI (Week 2)
- [ ] Design pricing section components
- [ ] Implement white/orange design system
- [ ] Add interactive animations
- [ ] Mobile responsiveness

### Phase 4: Integration & Testing (Week 3)
- [ ] Connect pricing to Stripe checkout
- [ ] Implement upgrade flows
- [ ] Add billing management
- [ ] Comprehensive testing

### Phase 5: Analytics & Optimization (Week 4)
- [ ] Usage analytics dashboard
- [ ] Conversion tracking
- [ ] A/B testing setup
- [ ] Performance monitoring

## 📈 Success Metrics

### Revenue Targets
- **Conversion Rate**: 8-12% (free to premium)
- **Monthly Churn**: <5%
- **Average Revenue Per User**: $19-25/month
- **Customer Lifetime Value**: $300+

### User Experience Metrics
- **User Satisfaction**: >4.5/5 stars
- **Feature Adoption**: >70% for premium features
- **Support Tickets**: <2% of active users
- **Upgrade Time**: <30 seconds average

## 🔧 Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_...

# AI Provider Keys
ANTHROPIC_API_KEY=sk-ant-...
MOONSHOT_API_KEY=sk-...
```

## 🛡️ Security Considerations

- **Webhook Signature Verification** ✅ Already implemented
- **User Authentication** via Clerk ✅ Already implemented
- **Rate Limiting** on AI model usage
- **PCI Compliance** through Stripe
- **Data Encryption** in transit and at rest

## 📋 Testing Strategy

### Unit Tests
- Subscription logic
- Usage tracking
- AI model selection
- Price calculations

### Integration Tests
- Stripe webhook handling
- Checkout flow
- Upgrade/downgrade flows
- AI model switching

### E2E Tests
- Complete signup → upgrade flow
- Billing management
- Feature access control
- Mobile user experience

## 🚀 Deployment Checklist

- [ ] Stripe products and prices configured
- [ ] Webhook endpoints registered
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] AI provider keys configured
- [ ] Monitoring dashboards setup
- [ ] Error tracking enabled
- [ ] Performance monitoring active

## 📞 Support & Documentation

### User-Facing Documentation
- Billing FAQ
- Feature comparison guide
- Upgrade instructions
- Cancellation policy

### Developer Documentation
- API endpoint documentation
- Webhook event handling
- Error code reference
- Troubleshooting guide

---

**Next Steps**: Begin Phase 1 implementation with database schema updates and subscription middleware.