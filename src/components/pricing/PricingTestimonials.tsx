import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  plan: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Founder",
    company: "TechStart Labs",
    content: "ZapDev saved us months of development time. The AI-powered code generation is incredible - it's like having a senior developer on the team 24/7.",
    rating: 5,
    plan: "Professional"
  },
  {
    name: "Marcus Rodriguez",
    role: "CTO",
    company: "GrowthCorp",
    content: "We've built 12 customer-facing apps using ZapDev this quarter. The quality and speed are unmatched. Best investment we've made this year.",
    rating: 5,
    plan: "Enterprise"
  },
  {
    name: "Emily Watson",
    role: "Solo Developer",
    company: "FreelanceForce",
    content: "Started with the free plan and quickly upgraded to Professional. The templates and AI assistance helped me launch 3 client projects faster than ever.",
    rating: 5,
    plan: "Professional"
  }
];

const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay: index * 0.2 }}
    className="h-full"
  >
    <Card className="bg-gray-900 border-gray-800 h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex items-center gap-1 mb-4">
          {[...Array(testimonial.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
          ))}
        </div>
        
        <Quote className="w-8 h-8 text-purple-400 mb-4" />
        
        <p className="text-gray-300 mb-6 flex-grow leading-relaxed">
          "{testimonial.content}"
        </p>
        
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white">{testimonial.name}</h4>
            <p className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</p>
          </div>
          <Badge variant="outline" className="border-purple-500/50 text-purple-300">
            {testimonial.plan}
          </Badge>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const PricingTestimonials = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="py-20 bg-gray-900/30"
    >
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">
            Trusted by Developers Worldwide
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            See what our customers are saying about their experience with ZapDev
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard 
              key={`${testimonial.name}-${index}`} 
              testimonial={testimonial} 
              index={index} 
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}; 