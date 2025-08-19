import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Zap, Code, Globe, Sparkles } from 'lucide-react';

export type PromptMode = 'advanced' | 'simple' | 'code' | 'website';

interface PromptModeSelectorProps {
  currentMode: PromptMode;
  onModeChange: (mode: PromptMode) => void;
}

const promptModes = {
  advanced: {
    name: 'Advanced AI',
    icon: Sparkles,
    description: 'Full zapdev AI capabilities with comprehensive system prompt',
    color: 'bg-gradient-to-r from-blue-500 to-blue-600',
    badge: 'Recommended'
  },
  simple: {
    name: 'Simple Assistant',
    icon: Settings,
    description: 'Basic AI assistant for general web development help',
    color: 'bg-gray-600',
    badge: 'Basic'
  },
  code: {
    name: 'Code Generator',
    icon: Code,
    description: 'Specialized for generating clean, production-ready code',
    color: 'bg-green-600',
    badge: 'Specialized'
  },
  website: {
    name: 'Website Builder',
    icon: Globe,
    description: 'Optimized for creating complete websites and applications',
    color: 'bg-orange-600',
    badge: 'Full-Stack'
  }
};

const PromptModeSelector = ({ currentMode, onModeChange }: PromptModeSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="border-gray-600 text-gray-300 hover:bg-gray-700"
      >
        <Settings className="w-4 h-4 mr-2" />
        {Object.prototype.hasOwnProperty.call(promptModes, currentMode) ? promptModes[currentMode as keyof typeof promptModes].name : 'Unknown Mode'}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 z-50 w-80">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">AI Assistant Mode</CardTitle>
              <CardDescription className="text-gray-400 text-xs">
                Choose how the AI should respond to your requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(promptModes).map(([mode, config]) => {
                const Icon = config.icon;
                const isSelected = currentMode === mode;
                
                return (
                  <Button
                    key={mode}
                    variant={isSelected ? "default" : "ghost"}
                    className={`w-full justify-start p-3 h-auto ${
                      isSelected 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'hover:bg-gray-700 text-gray-300'
                    }`}
                    onClick={() => {
                      onModeChange(mode as PromptMode);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{config.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {config.badge}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PromptModeSelector;