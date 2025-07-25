"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card } from "./ui/card";

const testimonials = [
  {
    name: "Michael Chen",
    role: "Full Stack Developer",
    image: "https://avatars.githubusercontent.com/u/1234567?v=4",
    content: "The development tools and real-time collaboration features have significantly improved our team's productivity. The platform's security measures and code protection give me peace of mind."
  },
  {
    name: "Sarah Johnson",
    role: "Engineering Manager",
    image: "https://avatars.githubusercontent.com/u/2345678?v=4",
    content: "DevPlatform's enterprise-grade tools have transformed our development workflow. The API integration and automated deployment features have saved us countless hours."
  },
  {
    name: "David Wilson",
    role: "Frontend Developer",
    image: "https://avatars.githubusercontent.com/u/3456789?v=4",
    content: "The customer support is exceptional, and the platform's intuitive design made getting started with modern development seamless. A game-changer for both beginners and experienced developers."
  },
  {
    name: "Emily Zhang",
    role: "DevOps Engineer",
    image: "https://avatars.githubusercontent.com/u/4567890?v=4",
    content: "We've seen remarkable improvements in our deployment efficiency since switching to DevPlatform. The smart build optimization and container orchestration are particularly impressive."
  },
  {
    name: "James Rodriguez",
    role: "Security Engineer",
    image: "https://avatars.githubusercontent.com/u/5678901?v=4",
    content: "The security features are robust and the regular updates keep us ahead of emerging threats. It's exactly what the development industry needed for secure coding practices."
  },
  {
    name: "Lisa Thompson",
    role: "Product Manager",
    image: "https://avatars.githubusercontent.com/u/6789012?v=4",
    content: "The platform's ability to handle complex development workflows while maintaining simplicity in its interface is remarkable. It's been invaluable for our product development lifecycle."
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 overflow-hidden bg-black">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-normal mb-4">Trusted by Developers</h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of satisfied developers on DevPlatform
          </p>
        </motion.div>

        <div className="relative flex flex-col antialiased">
          <div className="relative flex overflow-hidden py-4">
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-1`} className="w-[400px] max-w-[90vw] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
            <div className="animate-marquee flex min-w-full shrink-0 items-stretch gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={`${index}-2`} className="w-[400px] max-w-[90vw] shrink-0 bg-black/40 backdrop-blur-xl border-white/5 hover:border-white/10 transition-all duration-300 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonial.image} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-white/90">{testimonial.name}</h4>
                      <p className="text-sm text-white/60">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-white/70 leading-relaxed">
                    {testimonial.content}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;