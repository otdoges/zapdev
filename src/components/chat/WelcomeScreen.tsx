import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Code, Palette, Layers, Bot } from 'lucide-react';
import { ChatInput } from './ChatInput';

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: Code,
    title: "Full-Stack Development",
    desc: "Build complete web applications with modern frameworks and best practices."
  },
  {
    icon: Bot,
    title: "AI-Powered Assistance",
    desc: "Get intelligent code suggestions and architecture recommendations."
  },
  {
    icon: Zap,
    title: "Rapid Prototyping", 
    desc: "Transform ideas into working prototypes in minutes, not hours."
  },
  {
    icon: Palette,
    title: "Modern UI Design",
    desc: "Create beautiful, responsive interfaces with premium design systems."
  },
  {
    icon: Layers,
    title: "Component Libraries",
    desc: "Access pre-built components and design patterns for faster development."
  },
  {
    icon: Sparkles,
    title: "Smart Optimization",
    desc: "Automatic performance optimization and best practice enforcement."
  }
];

interface WelcomeScreenProps {
  onStartNewChat: () => void;
  input: string;
  setInput: (input: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  handleSubmit: (e: React.FormEvent) => void;
  isTyping: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartNewChat,
  input,
  setInput,
  textareaRef,
  handleSubmit,
  isTyping,
  isSearchOpen,
  setIsSearchOpen
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-8">
      <div className="text-center max-w-4xl mx-auto">
        {/* Enhanced welcome header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl border border-blue-500/20">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="text-5xl font-bold mb-4 text-gradient-static"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Welcome to ZapDev
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground/80 mb-8 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Your AI-powered development companion. Build full-stack applications, create stunning UIs, 
            and solve complex coding challenges with intelligent assistance.
          </motion.p>
        </motion.div>

        {/* Enhanced features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-elevated p-6 rounded-xl glass-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <feature.icon className="w-8 h-8 text-primary mb-3 mx-auto" />
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm text-pretty">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Enhanced call-to-action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-700/10 border border-blue-500/30 backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span className="text-blue-200 font-medium">Start by describing what you want to build</span>
          </div>
        </motion.div>

        {/* Example prompts */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto"
        >
          {[
            "Create a todo app with drag and drop functionality",
            "Build a dashboard with charts and data visualization", 
            "Design a landing page for a SaaS product",
            "Develop a chat application with real-time messaging"
          ].map((prompt, index) => (
            <motion.div
              key={prompt}
              className="text-sm text-muted-foreground/60 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer hover:bg-white/10"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.8 + index * 0.1 }}
            >
              "{prompt}"
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Message Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 2.0 }}
        className="mt-8"
      >
        <ChatInput
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleSubmit={handleSubmit}
          isTyping={isTyping}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
        />
      </motion.div>
    </div>
  );
};