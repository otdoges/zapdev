"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "./ui/button";
import { useRouter } from 'next/navigation';
import useIsMobile from '@/hooks/useIsMobile';

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isLoaded, setIsLoaded] = useState(false)
  const particlesRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    setIsLoaded(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      if (particlesRef.current) {
        const particles = particlesRef.current.children
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i] as HTMLElement
          const rect = particle.getBoundingClientRect()
          const particleX = rect.left + rect.width / 2
          const particleY = rect.top + rect.height / 2
          
          const distX = e.clientX - particleX
          const distY = e.clientY - particleY
          const distance = Math.sqrt(distX * distX + distY * distY)
          const maxDistance = 300
          
          if (distance < maxDistance) {
            const intensity = 1 - distance / maxDistance
            const moveX = distX * intensity * 0.03
            const moveY = distY * intensity * 0.03
            
            particle.style.transform = `translate(${moveX}px, ${moveY}px)`
          } else {
            particle.style.transform = 'translate(0, 0)'
          }
        }
      }
    }
    
    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
    }
  }, [])

  const goToPricingPage = () => {
    router.push('/pricing');
  };
  
  return (
    <section className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-4 py-20 md:py-32">
      {/* Background particles */}
      <div ref={particlesRef} className="absolute inset-0 z-0">
        {Array.from({ length: isMobile ? 15 : 50 }).map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 md:w-2 md:h-2 rounded-full bg-deep-violet opacity-20"
            style={isLoaded ? {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                transition: 'transform 0.3s ease-out'
              } : {
                left: '0%',
                top: '0%',
                opacity: 0,
                transition: 'transform 0.3s ease-out'
              }}
          />
        ))}
      </div>
      
      {/* Mouse glow effect */}
      {!isMobile && (
        <div
          className="mouse-glow"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        />
      )}
      
      {/* Content */}
      <motion.div 
        className="relative z-10 max-w-5xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <span className="text-gradient">ZapDev:</span> Design with Feeling.
          <br /> Build with <span className="shimmer-effect">Speed.</span>
        </motion.h1>
        
        <motion.p 
          className="text-lg md:text-xl text-[#EAEAEA]/80 max-w-3xl mx-auto mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          Describe your desired vibe, and let ZapDev's AI instantly craft stunning, 
          responsive websites in Svelte, Astro, and more. No-code simplicity, pro-dev power.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button 
            className="text-lg py-6 px-8 bg-gradient-to-r from-[#6C52A0] to-[#A0527C] hover:from-[#7C62B0] hover:to-[#B0627C] rounded-full"
            onClick={() => router.push('/chat')}
          >
            Start Weaving Your Web
          </Button>
          <Button 
            variant="outline" 
            className="text-lg py-6 px-8 rounded-full border-[#4F3A75] hover:border-[#7A3F6D] hover:bg-[#0D0D10]/50"
            onClick={() => router.push('/#examples')}
          >
            Explore Examples
          </Button>
        </motion.div>

        {/* Subscribe Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-8"
        >
          <Button 
            className="text-lg py-6 px-10 bg-gradient-to-r from-[#A0527C] to-[#6C52A0] hover:from-[#B0627C] hover:to-[#7C62B0] rounded-full shadow-lg shadow-[#6C52A0]/20 flex items-center gap-2 relative overflow-hidden group"
            onClick={goToPricingPage}
          >
            <span className="relative z-10 font-medium">Subscribe Now</span>
            <svg className="w-5 h-5 relative z-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
            <span className="absolute inset-0 bg-gradient-to-r from-[#B0627C] to-[#7C62B0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute -top-12 -right-12 w-24 h-24 bg-white/10 rounded-full blur-xl transform scale-0 group-hover:scale-100 transition-transform duration-500"></span>
          </Button>
          <div className="mt-2 text-sm text-[#EAEAEA]/50">Unlock full features and support</div>
        </motion.div>
      </motion.div>
      
      {/* Interface Preview */}
      <motion.div 
        className="relative z-10 w-full max-w-4xl mx-auto mt-16"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 40 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        <div className="relative w-full bg-[#121215] rounded-xl overflow-hidden shadow-2xl border border-[#1E1E24]">
          <div className="bg-[#161619] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
            </div>
            <div className="text-xs text-[#EAEAEA]/50">ZapDev Interface</div>
          </div>
          <div className="px-6 py-8">
            <div className="flex items-center mb-6">
              <div className="flex-1 h-8 bg-[#1A1A1E] rounded-xl"></div>
              <div className="w-20 h-8 bg-[#4F3A75]/20 rounded-xl ml-4"></div>
            </div>
            <div className="flex gap-4">
              <div className="w-1/3 space-y-4">
                <div className="h-40 bg-[#1A1A1E] rounded-lg"></div>
                <div className="h-6 w-3/4 bg-[#1A1A1E] rounded-md"></div>
                <div className="h-20 bg-[#1A1A1E] rounded-lg"></div>
              </div>
              <div className="w-2/3 h-80 bg-[#1A1A1E] rounded-lg flex items-center justify-center overflow-hidden">
                <div className="text-sm text-[#EAEAEA]/40 bg-[#161619] px-5 py-2 rounded-full border border-[#1E1E24]">
                  Ask zap a question...
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-[#4F3A75]/20 rounded-full blur-3xl"></div>
      </motion.div>
    </section>
  )
} 