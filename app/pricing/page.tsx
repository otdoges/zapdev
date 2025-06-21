import { ZapIcon, StarIcon, ShieldIcon } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { PricingContent } from "@/components/pricing";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  productId: string;
  features: string[];
  popularPlan?: boolean;
  icon: React.ReactNode;
  highlight?: string;
  savings?: string;
}

export const dynamic = 'force-dynamic';

// Using Polar.sh for payment processing
async function getPolarPlans(): Promise<Plan[]> {
  // In a real application, you would fetch these from Polar API
  // For now, we'll use static data that corresponds to your Polar products
  return [
    {
      id: "basic",
      name: "Basic",
      description: "Perfect for getting started with AI development",
      price: "$9",
      originalPrice: "$15",
      productId: process.env.POLAR_BASIC_PRODUCT_ID || "8c36fbf5-ad68-44d2-ba2c-682d88727c47",
      icon: <ZapIcon className="h-8 w-8 text-blue-500" />,
      savings: "Save 40%",
      features: [
        "Generate AI content",
        "Basic access to all models",
        "Up to 5 projects",
        "24-hour support response",
        "Community access",
        "Basic templates"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      description: "Ideal for professionals and growing teams",
      price: "$29",
      originalPrice: "$49",
      productId: process.env.POLAR_PRO_PRODUCT_ID || "5b611f41-9eb8-413b-bf6c-0e1385b61a0",
      icon: <StarIcon className="h-8 w-8 text-purple-500" />,
      highlight: "Most Popular",
      savings: "Save 41%",
      features: [
        "Everything in Basic",
        "Unlimited AI content generation",
        "Priority access to all models",
        "Unlimited projects",
        "12-hour priority support",
        "Advanced analytics & insights",
        "Custom AI model training",
        "Team collaboration tools",
        "API access"
      ],
      popularPlan: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For organizations with advanced requirements",
      price: "$99",
      originalPrice: "$149",
      productId: process.env.POLAR_ENTERPRISE_PRODUCT_ID || "e6970713-d3bd-4646-a1ed-e47dd8805b3d",
      icon: <ShieldIcon className="h-8 w-8 text-emerald-500" />,
      highlight: "Best Value",
      savings: "Save 34%",
      features: [
        "Everything in Pro",
        "Unlimited everything",
        "Dedicated AI model instances",
        "24/7 dedicated support",
        "1-hour response time SLA",
        "SSO & advanced security",
        "Custom integrations",
        "Dedicated account manager",
        "On-premise deployment",
        "Advanced compliance features"
      ]
    }
  ];
}

export default async function PricingPage() {
  const plans = await getPolarPlans();
  
  return (
    <>
      <Navbar />
      <PricingContent plans={plans} />
    </>
  );
} 