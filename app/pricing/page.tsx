import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStripeClient } from "@/lib/stripe";
import { Navbar } from "@/components/navbar";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceId: string;
  features: string[];
  popularPlan?: boolean;
}

export const dynamic = 'force-dynamic';

async function getStripePrices() {
  try {
    const stripe = getStripeClient();
    
    // Fetch all active prices with their products
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      limit: 100,
    });
    
    // Map prices to our plan structure
    const plans: Plan[] = [];
    
    // Find basic plan
    const basicPrice = prices.data.find(p => {
      const product = p.product as any;
      return product.name === "Basic Plan" && p.active;
    });
    
    if (basicPrice) {
      plans.push({
        id: "basic",
        name: "Basic",
        description: "Essential features for individuals",
        price: `$${(basicPrice.unit_amount! / 100).toFixed(2)}`,
        priceId: "price_basic",
        features: [
          "Generate AI content",
          "Basic access to all models",
          "3 projects",
          "24-hour support response time"
        ]
      });
    }
    
    // Find pro plan
    const proPrice = prices.data.find(p => {
      const product = p.product as any;
      return product.name === "Pro Plan" && p.active;
    });
    
    if (proPrice) {
      plans.push({
        id: "pro",
        name: "Pro",
        description: "Perfect for professionals and small teams",
        price: `$${(proPrice.unit_amount! / 100).toFixed(2)}`,
        priceId: "price_pro",
        features: [
          "Everything in Basic",
          "Unlimited AI content generation",
          "Priority access to all models",
          "10 projects",
          "12-hour support response time",
          "Advanced analytics"
        ],
        popularPlan: true
      });
    }
    
    // Find enterprise plan
    const enterprisePrice = prices.data.find(p => {
      const product = p.product as any;
      return product.name === "Enterprise Plan" && p.active;
    });
    
    if (enterprisePrice) {
      plans.push({
        id: "enterprise",
        name: "Enterprise",
        description: "For organizations with advanced needs",
        price: `$${(enterprisePrice.unit_amount! / 100).toFixed(2)}`,
        priceId: "price_enterprise",
        features: [
          "Everything in Pro",
          "Unlimited projects",
          "Custom AI model training",
          "Dedicated account manager",
          "1-hour support response time",
          "SSO and advanced security",
          "API access"
        ]
      });
    }
    
    // If no plans were found in Stripe, use fallback values
    if (plans.length === 0) {
      return [
        {
          id: "basic",
          name: "Basic",
          description: "Essential features for individuals",
          price: "$5",
          priceId: "price_basic",
          features: [
            "Generate AI content",
            "Basic access to all models",
            "3 projects",
            "24-hour support response time"
          ]
        },
        {
          id: "pro",
          name: "Pro",
          description: "Perfect for professionals and small teams",
          price: "$10",
          priceId: "price_pro",
          features: [
            "Everything in Basic",
            "Unlimited AI content generation",
            "Priority access to all models",
            "10 projects",
            "12-hour support response time",
            "Advanced analytics"
          ],
          popularPlan: true
        },
        {
          id: "enterprise",
          name: "Enterprise",
          description: "For organizations with advanced needs",
          price: "$25",
          priceId: "price_enterprise",
          features: [
            "Everything in Pro",
            "Unlimited projects",
            "Custom AI model training",
            "Dedicated account manager",
            "1-hour support response time",
            "SSO and advanced security",
            "API access"
          ]
        }
      ];
    }
    
    return plans;
  } catch (error) {
    console.error("Error fetching Stripe prices:", error);
    // Return fallback values in case of error
    return [
      {
        id: "basic",
        name: "Basic",
        description: "Essential features for individuals",
        price: "$5",
        priceId: "price_basic",
        features: [
          "Generate AI content",
          "Basic access to all models",
          "3 projects",
          "24-hour support response time"
        ]
      },
      {
        id: "pro",
        name: "Pro",
        description: "Perfect for professionals and small teams",
        price: "$10",
        priceId: "price_pro",
        features: [
          "Everything in Basic",
          "Unlimited AI content generation",
          "Priority access to all models",
          "10 projects",
          "12-hour support response time",
          "Advanced analytics"
        ],
        popularPlan: true
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For organizations with advanced needs",
        price: "$25",
        priceId: "price_enterprise",
        features: [
          "Everything in Pro",
          "Unlimited projects",
          "Custom AI model training",
          "Dedicated account manager",
          "1-hour support response time",
          "SSO and advanced security",
          "API access"
        ]
      }
    ];
  }
}

export default async function PricingPage() {
  const plans = await getStripePrices();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Choose the plan that's right for you and start creating with AI today.
          </p>
        </div>

        <Tabs defaultValue="monthly" className="w-full max-w-5xl mx-auto">
          <TabsList className="grid w-[300px] grid-cols-2 mx-auto mb-8">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" disabled>Yearly (Coming Soon)</TabsTrigger>
          </TabsList>
          <TabsContent value="monthly" className="space-y-4">
            <div className="grid gap-8 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={`relative flex flex-col border-zinc-800 bg-zinc-950/50 text-white ${plan.popularPlan ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : ''}`}>
                  {plan.popularPlan && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium px-4 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader className={`${plan.popularPlan ? 'pt-8' : 'pt-6'}`}>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="text-zinc-400">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-zinc-400 ml-2">/month</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-zinc-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${plan.popularPlan 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' 
                        : 'bg-zinc-800 hover:bg-zinc-700'}`}
                      asChild
                    >
                      <a href={`/api/generate-stripe-checkout?priceId=${plan.priceId}`}>
                        Subscribe to {plan.name}
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 