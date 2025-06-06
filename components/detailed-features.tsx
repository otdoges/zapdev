"use client"

import { motion } from "framer-motion"
import { 
  Sparkles, 
  Zap, 
  Palette, 
  Code, 
  Layers, 
  Bot, 
  Rocket,
  Globe,
  PenTool,
  Sliders,
  CheckCircle,
  Smartphone
} from "lucide-react"

export default function DetailedFeatures() {
  return (
    <section id="detailed-features" className="relative py-20 px-4 bg-[#0D0D10]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            <span className="text-gradient">Powerful Features</span> for Everyone
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-[#EAEAEA]/70 max-w-3xl mx-auto"
          >
            ZapDev combines intuitive design with powerful AI to revolutionize how you build websites.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Design with Feeling Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#6C52A0]/20 to-[#A0527C]/20 mb-4">
                <Palette size={28} className="text-[#A0527C]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Design with Feeling</h3>
              <p className="text-[#EAEAEA]/70">
                Express the vibe you want and watch ZapDev turn your words into stunning designs.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#A0527C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">AI-Powered Design Language</h4>
                  <p className="text-[#EAEAEA]/70">
                    Describe your desired aesthetic in natural language, and our AI translates your words into cohesive design elements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#A0527C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Emotion-Based Color Palettes</h4>
                  <p className="text-[#EAEAEA]/70">
                    Generate harmonious color schemes that evoke specific emotions and match your brand identity.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#A0527C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Responsive Design Patterns</h4>
                  <p className="text-[#EAEAEA]/70">
                    Automatically create layouts that look beautiful on all devices, from mobile to desktop.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#A0527C]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Intelligent Typography</h4>
                  <p className="text-[#EAEAEA]/70">
                    Select font pairings that complement your design and enhance readability across all content.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Build with Speed Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-10"
          >
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#6C52A0]/20 to-[#A0527C]/20 mb-4">
                <Zap size={28} className="text-[#6C52A0]" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Build with Speed</h3>
              <p className="text-[#EAEAEA]/70">
                Go from concept to fully functional website in minutes, not days or weeks.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#6C52A0]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">One-Click Deployment</h4>
                  <p className="text-[#EAEAEA]/70">
                    Instantly deploy your website to the cloud with zero configuration or setup required.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#6C52A0]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Multiple Framework Support</h4>
                  <p className="text-[#EAEAEA]/70">
                    Generate code in Svelte, Astro, React, Vue, and other modern frameworks based on your preference.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#6C52A0]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">AI Component Library</h4>
                  <p className="text-[#EAEAEA]/70">
                    Access a vast library of pre-built components that can be customized to match your design.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                  <CheckCircle size={20} className="text-[#6C52A0]" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">Clean Code Generation</h4>
                  <p className="text-[#EAEAEA]/70">
                    Export production-ready, well-structured code that developers can easily understand and modify.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20 text-center"
        >
          <a 
            href="/chat"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full text-white font-medium transition-all duration-300 hover:scale-105"
          >
            Start Creating Now
          </a>
        </motion.div>
      </div>
    </section>
  )
} 