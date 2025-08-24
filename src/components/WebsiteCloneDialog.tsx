import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Loader2, 
  Eye, 
  Code, 
  Palette, 
  Layout, 
  Zap,
  Download,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { crawlWebsite, type WebsiteAnalysis } from '@/lib/firecrawl';
import { logger } from '@/lib/error-handler';

interface WebsiteCloneDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCloneRequest: (analysis: WebsiteAnalysis, clonePrompt: string) => void;
}

interface CloneStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  data?: {
    pageCount?: number;
    title?: string;
    technologies?: string[];
    components?: string[];
    colorScheme?: string[];
    layout?: string;
    navigationStructure?: unknown[];
  };
}

export const WebsiteCloneDialog: React.FC<WebsiteCloneDialogProps> = ({
  isOpen,
  onOpenChange,
  onCloneRequest
}) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    includeScreenshots: true,
    analyzeTechnologies: true,
    extractComponents: true,
    preserveDesign: true,
    responsiveDesign: true,
    includeInteractions: false,
    seoOptimized: true,
    accessibilityFriendly: true
  });
  const [steps, setSteps] = useState<CloneStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const resetState = useCallback(() => {
    setUrl('');
    setAnalysis(null);
    setIsAnalyzing(false);
    setSteps([]);
    setCurrentStep(0);
  }, []);

  const initializeSteps = useCallback(() => {
    const analysisSteps: CloneStep[] = [
      {
        id: 'validate',
        title: 'Validating URL',
        description: 'Checking URL accessibility and format',
        status: 'pending'
      },
      {
        id: 'scrape',
        title: 'Scraping Website',
        description: 'Using Firecrawl to extract content and structure',
        status: 'pending'
      },
      {
        id: 'analyze_tech',
        title: 'Analyzing Technologies',
        description: 'Detecting frameworks, libraries, and tools',
        status: 'pending'
      },
      {
        id: 'extract_design',
        title: 'Extracting Design System',
        description: 'Analyzing colors, typography, and layout patterns',
        status: 'pending'
      },
      {
        id: 'identify_components',
        title: 'Identifying Components',
        description: 'Cataloging UI components and interactions',
        status: 'pending'
      },
      {
        id: 'structure_nav',
        title: 'Mapping Navigation',
        description: 'Understanding site structure and navigation flow',
        status: 'pending'
      }
    ];
    setSteps(analysisSteps);
    setCurrentStep(0);
  }, []);

  const updateStepStatus = useCallback((stepId: string, status: CloneStep['status'], data?: CloneStep['data']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, data } : step
    ));
  }, []);

  const analyzeWebsite = useCallback(async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsAnalyzing(true);
    initializeSteps();

    try {
      // Step 1: Validate URL
      updateStepStatus('validate', 'in_progress');
      setCurrentStep(0);
      
      try {
        new URL(url);
        await new Promise(resolve => setTimeout(resolve, 500)); // Visual feedback
        updateStepStatus('validate', 'completed');
        setCurrentStep(1);
      } catch {
        updateStepStatus('validate', 'error');
        throw new Error('Invalid URL format');
      }

      // Step 2: Scrape Website
      updateStepStatus('scrape', 'in_progress');
      logger.info('Starting website analysis with Firecrawl', { url });
      
      const websiteAnalysis = await crawlWebsite(url, {
        maxPages: 5,
        includeSitemap: true,
        includeSubdomains: false
      });

      updateStepStatus('scrape', 'completed', {
        pageCount: websiteAnalysis.pages.length,
        title: websiteAnalysis.title
      });
      setCurrentStep(2);

      // Step 3: Analyze Technologies
      updateStepStatus('analyze_tech', 'in_progress');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('analyze_tech', 'completed', {
        technologies: websiteAnalysis.technologies
      });
      setCurrentStep(3);

      // Step 4: Extract Design System
      updateStepStatus('extract_design', 'in_progress');
      await new Promise(resolve => setTimeout(resolve, 600));
      updateStepStatus('extract_design', 'completed', {
        colorScheme: websiteAnalysis.colorScheme,
        layout: websiteAnalysis.layout
      });
      setCurrentStep(4);

      // Step 5: Identify Components
      updateStepStatus('identify_components', 'in_progress');
      await new Promise(resolve => setTimeout(resolve, 700));
      updateStepStatus('identify_components', 'completed', {
        components: websiteAnalysis.components
      });
      setCurrentStep(5);

      // Step 6: Structure Navigation
      updateStepStatus('structure_nav', 'in_progress');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStepStatus('structure_nav', 'completed', {
        navigationStructure: websiteAnalysis.navigationStructure
      });

      setAnalysis(websiteAnalysis);
      toast.success('Website analysis completed successfully!');
      
    } catch (error) {
      logger.error('Website analysis failed', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Analysis failed: ${errorMessage}`);
      
      // Mark current step as error
      const currentStepData = Array.isArray(steps) && steps.length > currentStep && currentStep >= 0 ? steps[currentStep] : null;
      if (currentStepData) {
        updateStepStatus(currentStepData.id, 'error');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [url, initializeSteps, updateStepStatus, currentStep, steps]);

  const generateClonePrompt = useCallback(() => {
    if (!analysis) return '';

    const options = selectedOptions as Record<string, boolean>;
    let prompt = `Please clone this website: ${analysis.url}\n\n`;
    
    prompt += `**Website Analysis:**\n`;
    prompt += `- Title: ${analysis.title}\n`;
    prompt += `- Description: ${analysis.description}\n`;
    prompt += `- Pages analyzed: ${analysis.pages.length}\n\n`;

    if (analysis.technologies && analysis.technologies.length > 0) {
      prompt += `**Technologies Detected:**\n`;
      prompt += analysis.technologies.map(tech => `- ${tech}`).join('\n') + '\n\n';
    }

    if (analysis.components && analysis.components.length > 0) {
      prompt += `**UI Components Found:**\n`;
      prompt += analysis.components.map(comp => `- ${comp}`).join('\n') + '\n\n';
    }

    if (analysis.designPatterns && analysis.designPatterns.length > 0) {
      prompt += `**Design Patterns:**\n`;
      prompt += analysis.designPatterns.map(pattern => `- ${pattern}`).join('\n') + '\n\n';
    }

    if (analysis.colorScheme && analysis.colorScheme.length > 0) {
      prompt += `**Color Scheme:**\n`;
      prompt += analysis.colorScheme.slice(0, 10).map(color => `- ${color}`).join('\n') + '\n\n';
    }

    prompt += `**Clone Requirements:**\n`;
    if (options.preserveDesign) prompt += `- Preserve the original design and visual aesthetics\n`;
    if (options.responsiveDesign) prompt += `- Make it fully responsive for all device sizes\n`;
    if (options.analyzeTechnologies) prompt += `- Use modern web technologies (React, TypeScript, Tailwind CSS)\n`;
    if (options.extractComponents) prompt += `- Create reusable components based on the original structure\n`;
    if (options.includeInteractions) prompt += `- Include interactive elements and animations\n`;
    if (options.seoOptimized) prompt += `- Optimize for SEO with proper meta tags and structure\n`;
    if (options.accessibilityFriendly) prompt += `- Ensure accessibility compliance (WCAG guidelines)\n`;

    prompt += `\n**Additional Context:**\n`;
    prompt += `- Layout Style: ${analysis.layout}\n`;
    if (analysis.assets) {
      prompt += `- Images: ${analysis.assets.images.length} found\n`;
      prompt += `- External Stylesheets: ${analysis.assets.stylesheets.length}\n`;
    }

    prompt += `\nPlease create a high-quality clone that maintains the essence of the original while using modern, clean code practices.`;

    return prompt;
  }, [analysis, selectedOptions]);

  const handleClone = useCallback(() => {
    if (!analysis) return;
    
    const clonePrompt = generateClonePrompt();
    onCloneRequest(analysis, clonePrompt);
    onOpenChange(false);
    resetState();
    toast.success('Clone request sent to AI assistant!');
  }, [analysis, generateClonePrompt, onCloneRequest, onOpenChange, resetState]);

  const copyAnalysisToClipboard = useCallback(async () => {
    if (!analysis) return;
    
    const analysisText = JSON.stringify(analysis, null, 2);
    try {
      await navigator.clipboard.writeText(analysisText);
      toast.success('Analysis copied to clipboard!');
    } catch {
      toast.error('Failed to copy analysis');
    }
  }, [analysis]);



  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-elevated border-white/20 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-gradient-static flex items-center gap-3 text-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            Advanced Website Cloning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Input Section */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter website URL (e.g., https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 glass-input text-lg"
                disabled={isAnalyzing}
                onKeyDown={(e) => e.key === 'Enter' && !isAnalyzing && analyzeWebsite()}
              />
              <Button
                onClick={analyzeWebsite}
                disabled={!url.trim() || isAnalyzing}
                className="button-gradient px-8 py-2.5 text-base"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Analyze Site
                  </>
                )}
              </Button>
            </div>

            {/* Analysis Progress */}
            <AnimatePresence>
              {isAnalyzing && steps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="glass-elevated rounded-xl p-4 border border-white/10"
                >
                  <div className="space-y-3">
                    {steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {step.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : step.status === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          ) : step.status === 'in_progress' ? (
                            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${
                              step.status === 'completed' ? 'text-green-300' :
                              step.status === 'error' ? 'text-red-300' :
                              step.status === 'in_progress' ? 'text-blue-300' :
                              'text-gray-400'
                            }`}>
                              {step.title}
                            </span>
                            {step.data && (
                              <Badge variant="secondary" className="text-xs">
                                {step.data.pageCount && `${step.data.pageCount} pages`}
                                {step.data.technologies && `${step.data.technologies.length} techs`}
                                {step.data.components && `${step.data.components.length} components`}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analysis Results */}
          <AnimatePresence>
            {analysis && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Website Overview */}
                <div className="glass-elevated rounded-xl p-6 border border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gradient-static mb-2">
                        {analysis.title || 'Website Analysis'}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3">
                        {analysis.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        <span>{analysis.url}</span>
                        <ExternalLink className="w-3 h-3 ml-2 cursor-pointer hover:text-blue-400" 
                                     onClick={() => window.open(analysis.url, '_blank')} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAnalysisToClipboard}
                      className="glass-hover"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="text-xl font-bold text-blue-400">
                        {analysis.pages.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Pages</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-xl font-bold text-green-400">
                        {analysis.technologies?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Technologies</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <div className="text-xl font-bold text-purple-400">
                        {analysis.components?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Components</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="text-xl font-bold text-orange-400">
                        {analysis.colorScheme?.length || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Colors</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technologies */}
                  {analysis.technologies && analysis.technologies.length > 0 && (
                    <div className="glass-elevated rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="w-4 h-4 text-blue-400" />
                        <h4 className="font-semibold">Technologies</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* UI Components */}
                  {analysis.components && analysis.components.length > 0 && (
                    <div className="glass-elevated rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Layout className="w-4 h-4 text-green-400" />
                        <h4 className="font-semibold">UI Components</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.components.map((component, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Design Patterns */}
                  {analysis.designPatterns && analysis.designPatterns.length > 0 && (
                    <div className="glass-elevated rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-purple-400" />
                        <h4 className="font-semibold">Design Patterns</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.designPatterns.map((pattern, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {pattern}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Scheme */}
                  {analysis.colorScheme && analysis.colorScheme.length > 0 && (
                    <div className="glass-elevated rounded-xl p-4 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <h4 className="font-semibold">Color Palette</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.colorScheme.slice(0, 12).map((color, index) => (
                          <div key={index} className="flex items-center gap-1">
                            <div 
                              className="w-6 h-6 rounded border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs text-muted-foreground font-mono">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clone Options */}
                <div className="glass-elevated rounded-xl p-6 border border-white/10">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Clone Configuration
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {Object.entries(selectedOptions).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setSelectedOptions(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="w-4 h-4 rounded border border-white/20 bg-transparent"
                        />
                        <span className="text-sm">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleClone}
                      className="button-gradient flex-1 py-3 text-base"
                      size="lg"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Start Cloning Website
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WebsiteCloneDialog;