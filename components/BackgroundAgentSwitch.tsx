'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Bot, 
  Sparkles, 
  Users,
  Settings
} from 'lucide-react';

interface BackgroundAgentSwitchProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  agentCount?: number;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface ParticleEffect {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export default function BackgroundAgentSwitch({
  isActive,
  onToggle,
  agentCount = 0,
  className = '',
  disabled = false,
  size = 'md'
}: BackgroundAgentSwitchProps) {
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-16 h-8',
      slider: 'w-6 h-6',
      iconSize: 'w-4 h-4',
      fontSize: 'text-xs'
    },
    md: {
      container: 'w-20 h-10',
      slider: 'w-8 h-8',
      iconSize: 'w-5 h-5',
      fontSize: 'text-sm'
    },
    lg: {
      container: 'w-24 h-12',
      slider: 'w-10 h-10',
      iconSize: 'w-6 h-6',
      fontSize: 'text-base'
    }
  };

  const config = sizeConfig[size];

  // Generate particle effects when active
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const generateParticles = () => {
      const newParticles: ParticleEffect[] = [];
      for (let i = 0; i < 8; i++) {
        newParticles.push({
          id: Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 100,
          maxLife: 100
        });
      }
      return newParticles;
    };

    setParticles(generateParticles());

    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: (p.x + p.vx + 100) % 100,
            y: (p.y + p.vy + 100) % 100,
            life: p.life - 2
          }))
          .filter(p => p.life > 0);

        // Add new particles occasionally
        if (Math.random() < 0.3 && updated.length < 12) {
          updated.push({
            id: Math.random(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 100,
            maxLife: 100
          });
        }

        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleToggle = () => {
    if (disabled) return;
    onToggle(!isActive);
  };

  return (
    <div className={cn('relative group', className)}>
      {/* Main Switch Container */}
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        disabled={disabled}
        className={cn(
          'relative overflow-hidden rounded-full border-2 transition-all duration-300',
          'focus:outline-none focus:ring-4 focus:ring-primary/20',
          config.container,
          disabled && 'opacity-50 cursor-not-allowed',
          isActive
            ? 'bg-gradient-to-r from-primary to-orange-500 border-primary/50 shadow-lg shadow-primary/25'
            : 'bg-gray-100 border-gray-300 hover:bg-gray-200',
          isHovered && !disabled && 'scale-105',
          isPressed && !disabled && 'scale-95'
        )}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        animate={{
          boxShadow: isActive 
            ? [
                '0 4px 20px rgba(251, 146, 60, 0.25)',
                '0 8px 40px rgba(251, 146, 60, 0.4)',
                '0 4px 20px rgba(251, 146, 60, 0.25)'
              ]
            : '0 2px 4px rgba(0,0,0,0.1)'
        }}
        transition={{ 
          duration: 2,
          repeat: isActive ? Infinity : 0,
          repeatType: 'reverse'
        }}
      >
        {/* Particle Effects */}
        <AnimatePresence>
          {isActive && particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-white rounded-full pointer-events-none"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: particle.life / particle.maxLife
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            />
          ))}
        </AnimatePresence>

        {/* Gradient Overlay */}
        {isActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}

        {/* Slider */}
        <motion.div
          className={cn(
            'absolute top-1 flex items-center justify-center rounded-full bg-white shadow-lg',
            config.slider,
            isActive ? 'text-primary' : 'text-gray-500'
          )}
          animate={{
            x: isActive ? 'calc(100% + 0.25rem)' : '0.25rem'
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        >
          <AnimatePresence mode="wait">
            {isActive ? (
              <motion.div
                key="active"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className={config.iconSize} />
              </motion.div>
            ) : (
              <motion.div
                key="inactive"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Bot className={config.iconSize} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pulse Ring */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
      </motion.button>

      {/* Status Indicator */}
      <AnimatePresence>
        {(isHovered || isActive) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-10"
          >
            <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs font-medium whitespace-nowrap">
              <div className="flex items-center gap-2">
                {isActive ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Background Agents Active</span>
                    </div>
                    {agentCount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span>{agentCount} agents running</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span>Click to activate background agents</span>
                  </>
                )}
              </div>
              
              {/* Tooltip Arrow */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extended Info Panel */}
      <AnimatePresence>
        {isActive && isHovered && agentCount > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="absolute left-full top-0 ml-4 z-20"
          >
            <div className="bg-white border-2 border-primary/20 rounded-xl shadow-xl p-4 min-w-64">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Active Agents</h4>
                  <p className="text-xs text-gray-600">Background processing</p>
                </div>
              </div>
              
              <div className="space-y-2">
                {Array.from({ length: Math.min(agentCount, 3) }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Settings className="w-3 h-3 text-primary" />
                    </motion.div>
                    <span className="text-gray-700">Agent {i + 1} processing...</span>
                  </motion.div>
                ))}
                
                {agentCount > 3 && (
                  <div className="text-xs text-gray-500 ml-5">
                    +{agentCount - 3} more agents
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">System load</span>
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-green-400 to-primary"
                        animate={{ width: `${Math.min(agentCount * 25, 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">
                      {Math.min(agentCount * 25, 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}