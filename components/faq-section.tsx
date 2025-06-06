"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Minus } from "lucide-react"

interface FaqItemProps {
  question: string
  answer: React.ReactNode
  index: number
}

function FaqItem({ question, answer, index }: FaqItemProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="border-b border-[#1E1E24] py-6"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left"
      >
        <h3 className="text-xl font-medium">{question}</h3>
        <div className="ml-4 flex-shrink-0 h-8 w-8 rounded-full bg-[#1A1A1E] flex items-center justify-center">
          {isOpen ? (
            <Minus className="h-4 w-4 text-[#A0527C]" />
          ) : (
            <Plus className="h-4 w-4 text-[#A0527C]" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 text-[#EAEAEA]/80 space-y-2">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FaqSection() {
  const faqs = [
    {
      question: "What frameworks does ZapDev support?",
      answer: (
        <>
          <p>
            ZapDev currently generates code for multiple modern frameworks, including:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Svelte and SvelteKit</li>
            <li>Astro</li>
            <li>React and Next.js</li>
            <li>Vue and Nuxt</li>
            <li>Solid.js</li>
            <li>Vanilla HTML/CSS/JavaScript</li>
          </ul>
          <p className="mt-2">
            We're constantly expanding our framework support based on user feedback and industry trends.
          </p>
        </>
      ),
    },
    {
      question: "Is ZapDev better than other AI website builders?",
      answer: (
        <>
          <p>
            ZapDev differentiates itself from other AI website builders through several key advantages:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Our unique "vibe-based" design approach captures the emotional and aesthetic qualities you want</li>
            <li>We generate clean, well-structured code that professional developers can easily work with</li>
            <li>Multiple framework support gives you flexibility other platforms don't offer</li>
            <li>Direct export options let you own your code completely</li>
            <li>Our AI is specifically trained on modern, responsive web design patterns</li>
          </ul>
        </>
      ),
    },
    {
      question: "Can I export the code ZapDev generates?",
      answer: (
        <p>
          Yes! Unlike some platforms that lock you into their ecosystem, ZapDev allows you to export clean, well-documented code in your chosen framework. You maintain complete ownership of all generated code and can host it anywhere you prefer or continue development in your own environment.
        </p>
      ),
    },
    {
      question: "How does ZapDev handle responsive design?",
      answer: (
        <p>
          ZapDev automatically generates fully responsive websites that look great on all devices - from mobile phones to large desktop displays. Our AI implements modern responsive design techniques including fluid layouts, flexible images, and appropriate breakpoints. You can also specify any particular responsive behavior you want during the creation process.
        </p>
      ),
    },
    {
      question: "Do I need technical knowledge to use ZapDev?",
      answer: (
        <p>
          Not at all! ZapDev was designed to be accessible to users of all technical levels. You can describe what you want in plain conversational language, and our AI will handle all the technical details. That said, if you are technical, you'll appreciate the clean code structure and ability to customize everything to your exact specifications.
        </p>
      ),
    },
    {
      question: "How much does ZapDev cost?",
      answer: (
        <>
          <p>
            ZapDev offers several flexible pricing tiers to accommodate different needs:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Free tier:</strong> Try basic features with limited generations</li>
            <li><strong>Pro tier:</strong> Unlimited generations, priority processing, and more customization options</li>
            <li><strong>Team tier:</strong> Collaboration features, shared projects, and advanced integrations</li>
            <li><strong>Enterprise tier:</strong> Custom solutions, dedicated support, and SLA guarantees</li>
          </ul>
          <p className="mt-2">
            Visit our pricing page for current rates and detailed feature comparisons.
          </p>
        </>
      ),
    },
    {
      question: "Can ZapDev integrate with my existing tech stack?",
      answer: (
        <p>
          Yes, ZapDev is designed for integration flexibility. You can connect your generated websites with popular services like Stripe for payments, Supabase or Firebase for backend functionality, Sanity or Contentful for CMS capabilities, and many more. Our code follows best practices for making these integrations straightforward.
        </p>
      ),
    },
  ]

  return (
    <section id="faq" className="py-24 px-4 bg-[#0D0D10]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            <span className="text-gradient">Frequently Asked Questions</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-[#EAEAEA]/70 max-w-3xl mx-auto"
          >
            Everything you need to know about ZapDev
          </motion.p>
        </div>

        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <FaqItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="mb-6 text-[#EAEAEA]/70">
            Still have questions? We're here to help!
          </p>
          <a
            href="/chat"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  )
} 