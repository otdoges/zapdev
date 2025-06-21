"use client";

import { Button } from "./ui/button";
import { CheckIcon, StarIcon, ZapIcon, ShieldIcon, HeadphonesIcon, BarChart3Icon, TrendingUpIcon, UsersIcon, ArrowRightIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

interface PricingContentProps {
  plans: Plan[];
}

export function PricingContent({ plans }: PricingContentProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6 hover:bg-purple-500/20 transition-all duration-300 cursor-default">
            <TrendingUpIcon className="h-4 w-4 text-purple-400 mr-2" />
            <span className="text-sm text-purple-300">Trusted by 10,000+ developers</span>
            <div className="ml-2 flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
          
          {/* Limited Time Offer Banner */}
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6 animate-bounce">
            <span className="text-red-300 font-semibold text-sm">🔥 Limited Time: Up to 41% OFF - Ends Soon!</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent animate-in slide-in-from-bottom-8 duration-1000 delay-300">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-in slide-in-from-bottom-8 duration-1000 delay-500">
            Choose the perfect plan for your AI development journey. All plans include our core features with no hidden fees.
          </p>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 mt-8 animate-in fade-in duration-1000 delay-700">
            <div className="flex items-center space-x-2">
              <UsersIcon className="h-5 w-5 text-green-400" />
              <span className="text-sm text-gray-300">10,000+ Happy Users</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-gray-300">99.9% Uptime</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldIcon className="h-5 w-5 text-purple-400" />
              <span className="text-sm text-gray-300">SOC 2 Certified</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="monthly" className="w-full max-w-7xl mx-auto">
          <TabsList className="grid w-[350px] grid-cols-2 mx-auto mb-12 h-12 bg-slate-800/50 border border-slate-700 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
            <TabsTrigger value="monthly" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white transition-all duration-300">
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" disabled className="opacity-50">
              Yearly (Coming Soon)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly" className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 max-w-7xl mx-auto">
              {plans.map((plan, index) => (
                <Card 
                  key={plan.id} 
                  className={`relative flex flex-col border-2 bg-slate-900/50 backdrop-blur-sm text-white transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:-translate-y-2 group ${
                    plan.popularPlan 
                      ? 'border-purple-500 shadow-lg shadow-purple-500/25 bg-gradient-to-b from-purple-900/20 to-slate-900/50' 
                      : 'border-slate-700 hover:border-slate-600'
                  } animate-in slide-in-from-bottom-8 duration-1000`}
                  style={{
                    animationDelay: `${(index + 1) * 200}ms`
                  }}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className={`${
                        plan.popularPlan 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white animate-pulse' 
                          : 'bg-gradient-to-r from-emerald-600 to-blue-600 text-white'
                      } text-sm font-medium px-4 py-1 shadow-lg`}>
                        {plan.highlight}
                      </Badge>
                    </div>
                  )}
                  
                  {plan.savings && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                      {plan.savings}
                    </div>
                  )}
                  
                  <CardHeader className={`${plan.highlight ? 'pt-8' : 'pt-6'} pb-4`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 group-hover:scale-110 transition-transform duration-300">
                        {plan.icon}
                        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                      </div>
                    </div>
                    <CardDescription className="text-gray-300 text-lg leading-relaxed">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <div className="mb-8">
                      <div className="flex items-baseline space-x-2">
                        <span className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                          {plan.price}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-xl text-gray-500 line-through">{plan.originalPrice}</span>
                        )}
                        <span className="text-gray-400 ml-2 text-lg">/month</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">Billed monthly, cancel anytime</p>
                    </div>
                    
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li 
                          key={feature} 
                          className="flex items-start space-x-3 group/item animate-in slide-in-from-left-4 duration-500"
                          style={{animationDelay: `${(index + 1) * 200 + featureIndex * 100}ms`}}
                        >
                          <CheckIcon className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0 group-hover/item:scale-125 group-hover/item:rotate-12 transition-all duration-300" />
                          <span className="text-gray-200 leading-relaxed group-hover/item:text-white transition-colors duration-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-6">
                    <Button
                      className={`w-full h-12 text-lg font-semibold transition-all duration-500 group/button ${
                        plan.popularPlan 
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl hover:shadow-purple-500/25' 
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500'
                      } hover:scale-105 active:scale-95`}
                      asChild
                    >
                      <a href={`/api/polar/checkout?productId=${plan.productId}`} className="group/link flex items-center justify-center">
                        <span className="group-hover/button:translate-x-1 transition-transform duration-300">Get Started with {plan.name}</span>
                        <ArrowRightIcon className="ml-2 h-4 w-4 group-hover/button:translate-x-2 transition-transform duration-300" />
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Features Comparison */}
            <div className="mt-20 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-1000">
              <h3 className="text-2xl font-bold text-white mb-8">All plans include</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: HeadphonesIcon, title: "Expert Support", desc: "Get help from our AI experts whenever you need it", color: "blue" },
                  { icon: ShieldIcon, title: "Enterprise Security", desc: "Bank-level security for all your AI projects", color: "green" },
                  { icon: BarChart3Icon, title: "Advanced Analytics", desc: "Track your AI usage and optimize performance", color: "purple" }
                ].map((feature, index) => (
                  <div 
                    key={feature.title}
                    className={`flex flex-col items-center p-6 rounded-lg bg-slate-800/30 border border-slate-700 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105 animate-in slide-in-from-bottom-4 duration-1000`}
                    style={{animationDelay: `${1200 + index * 200}ms`}}
                  >
                    <feature.icon className={`h-8 w-8 text-${feature.color}-400 mb-3 hover:scale-110 transition-transform duration-300`} />
                    <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-400 text-sm text-center">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Customer Portal Link */}
            <div className="text-center mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-800/50 to-purple-800/20 border border-slate-700 hover:border-purple-500/50 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-1400">
              <h3 className="text-xl font-semibold text-white mb-4">
                Already have a subscription?
              </h3>
              <p className="text-gray-300 mb-6">
                Manage your account, view usage, and update billing information.
              </p>
              <Button
                variant="outline"
                className="border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white transition-all duration-300 px-8 py-3 hover:scale-105 active:scale-95"
                asChild
              >
                <a href="/api/polar/portal" className="flex items-center">
                  <ShieldIcon className="mr-2 h-4 w-4" />
                  Manage Subscription
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* FAQ Section */}
        <div className="mt-20 text-center animate-in fade-in duration-1000 delay-1600">
          <p className="text-gray-400">
            Questions? Contact our team at{" "}
            <a href="mailto:support@zapdev.com" className="text-purple-400 hover:text-purple-300 transition-colors hover:underline">
              support@zapdev.com
            </a>
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation: animate-in 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
} 