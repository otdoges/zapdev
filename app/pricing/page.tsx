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
      productId: process.env.POLAR_BASIC_PRODUCT_ID || "polar_basic_product_id",
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
      productId: process.env.POLAR_PRO_PRODUCT_ID || "polar_pro_product_id",
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
      productId: process.env.POLAR_ENTERPRISE_PRODUCT_ID || "polar_enterprise_product_id",
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