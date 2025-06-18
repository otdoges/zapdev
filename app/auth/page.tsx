"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Github, Chrome, Sparkles, Zap, ArrowRight, Code, Palette, Rocket } from "lucide-react"
import { signIn } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: <Code className="w-5 h-5" />,
    title: "AI Code Generation",
    description: "Generate beautiful, functional code with advanced AI models"
  },
  {
    icon: <Palette className="w-5 h-5" />,
    title: "Live Preview",
    description: "See your creations come to life with real-time WebContainer execution"
  },
  {
    icon: <Rocket className="w-5 h-5" />,
    title: "Instant Deployment",
    description: "Deploy and share your projects with lightning speed"
  }
]

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAuth = async (provider: 'github' | 'google') => {
    setIsLoading(provider)
    
    try {
      await signIn.social({
        provider,
        callbackURL: "/chat",
      })
    } catch (error) {
      console.error(`${provider} auth failed:`, error)
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Branding */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-white space-y-6"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-violet-600 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
              ZapDev
            </h1>
          </div>

          <h2 className="text-5xl font-bold leading-tight">
            Build Amazing
            <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Apps with AI
            </span>
          </h2>

          <p className="text-xl text-gray-300 leading-relaxed">
            The most powerful AI-driven development platform. Generate, preview, and deploy 
            beautiful applications in seconds with cutting-edge AI models.
          </p>

          <div className="space-y-4 pt-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <div className="p-2 bg-violet-500/20 rounded-lg text-violet-400">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Auth Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4"
              >
                <Sparkles className="w-4 h-4" />
                Join thousands of developers
              </motion.div>
              
              <h3 className="text-3xl font-bold text-white mb-2">Welcome to the Future</h3>
              <p className="text-gray-300">Sign in to start building amazing things</p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAuth('github')}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 border border-gray-700 hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'github' ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Github className="w-5 h-5" />
                )}
                Continue with GitHub
                <ArrowRight className="w-4 h-4 ml-auto" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAuth('google')}
                disabled={isLoading !== null}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading === 'google' ? (
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <Chrome className="w-5 h-5" />
                )}
                Continue with Google
                <ArrowRight className="w-4 h-4 ml-auto" />
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                By signing in, you agree to our{" "}
                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Floating Elements */}
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-8 -right-8 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-sm"
          />
          
          <motion.div
            animate={{ 
              y: [0, 10, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full opacity-20 blur-sm"
          />
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}