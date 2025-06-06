"use client"

import { motion } from "framer-motion"
import { MessageSquare, Code, Globe } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: <MessageSquare className="w-8 h-8 text-[#A0527C]" />,
      title: "Describe Your Vision",
      description: "Tell ZapDev what you want to build using simple, conversational language. Specify the vibe, functionality, and any specific requirements you have in mind."
    },
    {
      icon: <Code className="w-8 h-8 text-[#7C62B0]" />,
      title: "AI Generates Your Site",
      description: "Our AI analyzes your description and instantly creates a beautiful, responsive website using modern frameworks like Svelte, Astro, or React based on your preferences."
    },
    {
      icon: <Globe className="w-8 h-8 text-[#6C52A0]" />,
      title: "Launch & Customize",
      description: "Deploy your site instantly with one click, then customize and refine as needed. Export the clean, production-ready code for further development."
    }
  ]

  return (
    <section id="how-it-works" className="py-24 px-4 bg-[#0D0D10]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            <span className="text-gradient">How It Works</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-[#EAEAEA]/70 max-w-3xl mx-auto"
          >
            Transform your ideas into stunning websites in just three simple steps
          </motion.p>
        </div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-12 bottom-0 w-0.5 bg-gradient-to-b from-[#6C52A0] to-[#A0527C] opacity-20 hidden md:block" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative z-10"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-[#0F0F12] flex items-center justify-center border border-[#1E1E24] shadow-lg mb-6 relative">
                    <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#6C52A0]/10 to-[#A0527C]/10" />
                    <div className="relative">{step.icon}</div>
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-r from-[#6C52A0] to-[#A0527C] flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-[#EAEAEA]/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="inline-block p-6 rounded-xl bg-[#0F0F12] border border-[#1E1E24]">
            <p className="text-lg mb-4">Ready to start creating?</p>
            <a
              href="/chat"
              className="inline-block px-8 py-4 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
            >
              Try ZapDev Now
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
} 