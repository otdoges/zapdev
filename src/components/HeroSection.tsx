import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Code, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInButton } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative container mx-auto px-4 py-24 min-h-[calc(100svh-80px)] flex items-center justify-center"
    >
      {/* Sophisticated background layers inspired by open-lovable */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 35%, rgba(55, 122, 251, 0.25) 0%, rgba(55, 122, 251, 0) 70%)'
          }}
        />
        
        {/* Secondary accent gradient */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(40% 40% at 80% 20%, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 60%)'
          }}
        />

        {/* Animated floating elements */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full blur-sm"
        />
        
        <motion.div
          animate={{
            y: [0, 15, 0],
            x: [0, 10, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full blur-sm"
        />
        
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, -8, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-400 rounded-full blur-sm"
        />
      </div>
      
      <div className="flex flex-col items-center text-center relative z-10 max-w-5xl mx-auto">
        {/* Enhanced badge with open-lovable styling */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass border border-white/10"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
          </motion.div>
          <span className="text-sm font-medium text-gray-200">
            AI-Powered Development Platform
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        </motion.div>
        
        {/* Enhanced heading with better typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4 mb-8"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              Clone and recreate
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              any website
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-300 bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed"
          >
            Transform any website into a modern React app with AI assistance. 
            Real-time chat, safe code execution, and seamless deployment.
          </motion.p>
        </motion.div>

        {/* Enhanced action buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate('/chat')}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Open Chat
              <motion.div
                className="ml-2"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-5 h-5" />
              </motion.div>
            </Button>
          ) : (
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Free
                <motion.div
                  className="ml-2"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Button>
            </SignInButton>
          )}
          
          <Button
            size="lg"
            variant="outline"
            className="border-white/20 text-gray-300 hover:bg-white/5 hover:text-white px-8 py-3 text-lg font-semibold rounded-xl backdrop-blur-sm transition-all duration-300"
          >
            View Examples
          </Button>
        </motion.div>

        {/* Feature showcase grid inspired by open-lovable */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl"
        >
          {[
            {
              icon: Code,
              title: "AI Code Generation",
              description: "Generate clean, modern code with AI",
              gradient: "from-blue-500/20 to-cyan-500/20",
              iconColor: "text-blue-400"
            },
            {
              icon: Zap,
              title: "Real-time Execution", 
              description: "Test in secure sandboxed environments",
              gradient: "from-purple-500/20 to-pink-500/20",
              iconColor: "text-purple-400"
            },
            {
              icon: Globe,
              title: "One-Click Deploy",
              description: "Deploy instantly to modern platforms",
              gradient: "from-green-500/20 to-teal-500/20",
              iconColor: "text-green-400"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
              className={`p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm hover:border-white/20 transition-all duration-300 group`}
            >
              <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
