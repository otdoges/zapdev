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
    desc: "Build complete web applications with modern frameworks."
  },
  {
    icon: Bot,
    title: "AI-Powered Assistance", 
    desc: "Get intelligent code suggestions and recommendations."
  },
  {
    icon: Zap,
    title: "Rapid Prototyping",
    desc: "Transform ideas into working prototypes quickly."
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
    <div className="flex-1 flex flex-col justify-center items-center p-8">
      <div className="text-center max-w-3xl mx-auto">
        {/* Optimized header with subtle animations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-3 text-gradient-static">
            Welcome to ZapDev
          </h1>
          
          <p className="text-xl text-muted-foreground/80 mb-6">
            Your AI-powered development companion. Build full-stack applications and solve complex coding challenges.
          </p>
        </motion.div>

        {/* Optimized features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass-elevated p-4 rounded-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <feature.icon className="w-6 h-6 text-primary mb-2 mx-auto" />
              <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
              <p className="text-muted-foreground text-xs">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Optimized call-to-action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/20 to-blue-700/10 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-200 text-sm">Start by describing what you want to build</span>
          </div>
        </motion.div>
      </div>
      
      {/* Message Input Bar */}
      <div className="w-full max-w-2xl">
        <ChatInput
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleSubmit={handleSubmit}
          isTyping={isTyping}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
        />
      </div>
    </div>
  );
};