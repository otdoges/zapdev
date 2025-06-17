"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView } from "framer-motion"
import { Button } from "./ui/button"

interface FinalCtaProps {
  onGetStarted?: () => void
}

export default function FinalCta({ onGetStarted }: FinalCtaProps) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: false, margin: "-100px 0px" })
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const sectionElement = sectionRef.current as HTMLElement | null
      if (sectionElement) {
        const rect = sectionElement.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-40 px-4 overflow-hidden bg-gradient-to-b from-[#0D0D10] to-[#0A0A0E]"
    >
      {/* Interactive gradient background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(122, 63, 109, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Fixed position decorative elements */}
      <div className="absolute top-20 -right-40 w-80 h-80 rounded-full bg-[#4F3A75] opacity-10 blur-[100px]"></div>
      <div className="absolute -bottom-20 -left-40 w-80 h-80 rounded-full bg-[#7A3F6D] opacity-10 blur-[100px]"></div>
      
      <div className="max-w-5xl mx-auto relative">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 30 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-6xl font-bold mb-6 md:leading-tight">
            Your Next Masterpiece <span className="text-gradient">Awaits</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#EAEAEA]/80 max-w-3xl mx-auto mb-10 md:mb-14">
            Join the revolution in web creation. Sign up for ZapDev today and start building websites that truly resonate.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 mb-12"
          >
            <Button 
              className="text-lg py-7 px-10 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full text-white"
              onClick={onGetStarted}
            >
              Get Started with ZapDev Free
            </Button>
            <Button variant="outline" className="text-lg py-7 px-10 rounded-full border-[#4F3A75] hover:border-[#7A3F6D] hover:bg-[#0D0D10]/50">
              Schedule a Demo
            </Button>
          </motion.div>
          
          {/* Secondary links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isInView ? 1 : 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex justify-center gap-6 md:gap-10 text-sm md:text-base"
          >
            <a href="#" className="text-[#EAEAEA]/70 hover:text-[#EAEAEA] transition-colors">
              View Demo
            </a>
            <span className="text-[#EAEAEA]/30">|</span>
            <a href="#" className="text-[#EAEAEA]/70 hover:text-[#EAEAEA] transition-colors">
              Read Documentation
            </a>
            <span className="text-[#EAEAEA]/30">|</span>
            <a href="#" className="text-[#EAEAEA]/70 hover:text-[#EAEAEA] transition-colors">
              Join Community
            </a>
          </motion.div>
        </motion.div>
        
        {/* Bottom glow */}
        <div className="absolute left-1/2 -bottom-40 w-[600px] h-20 bg-[#4F3A75] opacity-20 blur-[100px] -translate-x-1/2"></div>
      </div>
    </section>
  )
} 