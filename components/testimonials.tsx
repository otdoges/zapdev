"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const testimonials = [
  {
    quote: "ZapDev completely transformed how I approach web design. I described the dreamy, ethereal feel I wanted, and within minutes I had a stunning site that perfectly matched my vision.",
    name: "Alex Chen",
    role: "Digital Artist & Entrepreneur",
    avatarGradient: "from-purple-500 to-pink-500"
  },
  {
    quote: "As a developer, I was skeptical at first, but the code ZapDev generates is clean, well-structured, and exactly what I would have written myself—just way faster.",
    name: "Morgan Wilson",
    role: "Lead Frontend Developer",
    avatarGradient: "from-blue-500 to-cyan-500"
  },
  {
    quote: "Our agency has cut design-to-development time by 70% using ZapDev. The ability to quickly iterate on vibe-based concepts has been game-changing for client presentations.",
    name: "Jamie Rodriguez",
    role: "Creative Director",
    avatarGradient: "from-amber-500 to-orange-500"
  }
]

export default function Testimonials() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: false, margin: "-100px 0px" })

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 md:py-32 px-4 overflow-hidden bg-[#0A0A0E]"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#4F3A75] to-transparent opacity-30" />
      
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Loved by Innovators
          </h2>
          <p className="text-lg text-[#EAEAEA]/70 max-w-2xl mx-auto">
            Join thousands of creators and developers who are building the future with ZapDev.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.2 * index }}
              className="bg-[#121215] rounded-2xl p-8 border border-[#1E1E24] relative"
            >
              {/* Quote mark */}
              <div className="absolute -top-5 -left-2 text-[80px] leading-none text-[#4F3A75]/20 font-serif">
                "
              </div>
              
              <div className="relative">
                <p className="text-[#EAEAEA] mb-8 relative z-10">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center">
                  {/* Avatar with gradient */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatarGradient} flex items-center justify-center text-white font-medium text-lg`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  
                  <div className="ml-3">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-[#EAEAEA]/70">{testimonial.role}</div>
                  </div>
                </div>
              </div>
              
              {/* Subtle glow behind the card */}
              <div className="absolute inset-0 -z-10 bg-[#4F3A75]/5 rounded-2xl blur-lg transform translate-y-2 scale-[0.97]"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 