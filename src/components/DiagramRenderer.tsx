import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiagramRendererProps {
  diagramText: string;
  type: 'mermaid' | 'flowchart' | 'sequence' | 'gantt';
  className?: string;
  isLoading?: boolean;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  diagramText,
  type,
  className = '',
  isLoading = false,
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagramId] = useState(() => `mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    // Configure Mermaid with dark theme matching ZapDev
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#3E6FF3',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#3E6FF3',
        lineColor: '#6b7280',
        sectionBkgColor: '#1f2937',
        altSectionBkgColor: '#111827',
        secondaryColor: '#1e40af',
        tertiaryColor: '#1f2937',
        background: '#0F0F0F',
        mainBkg: '#1A1A1A',
        secondBkg: '#111827',
        tertiaryBkg: '#0F0F0F',
        // Flowchart specific
        cScale0: '#3E6FF3',
        cScale1: '#1d4ed8',
        cScale2: '#1e40af',
        // Sequence diagram specific
        actorBkg: '#1f2937',
        actorBorder: '#3E6FF3',
        actorTextColor: '#ffffff',
        actorLineColor: '#6b7280',
        signalColor: '#ffffff',
        signalTextColor: '#ffffff',
        labelBoxBkgColor: '#1f2937',
        labelBoxBorderColor: '#3E6FF3',
        labelTextColor: '#ffffff',
        loopTextColor: '#ffffff',
        noteBorderColor: '#3E6FF3',
        noteBkgColor: '#1f2937',
        noteTextColor: '#ffffff',
        // Gantt specific
        todayLineColor: '#3E6FF3',
        taskBkgColor: '#1f2937',
        taskTextColor: '#ffffff',
        activeTaskBkgColor: '#3E6FF3',
        activeTaskBorderColor: '#1d4ed8',
        gridColor: '#374151',
        section0: '#1f2937',
        section1: '#111827',
        section2: '#0f172a',
        section3: '#1e293b',
      },
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      darkMode: true,
    });
  }, []);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!diagramRef.current || !diagramText.trim() || isLoading) return;

      setIsRendering(true);
      setError(null);

      try {
        // Clear previous content
        diagramRef.current.innerHTML = '';

        // Validate the diagram syntax - mermaid.parse throws on failure, resolves to void on success
        await mermaid.parse(diagramText);

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagramText);
        
        if (diagramRef.current) {
          diagramRef.current.innerHTML = svg;
          
          // Apply additional styling to the SVG
          const svgElement = diagramRef.current.querySelector('svg');
          if (svgElement) {
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';
            svgElement.style.backgroundColor = 'transparent';
          }
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        // Include original error message for context
        const originalMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Invalid diagram syntax: ${originalMessage}`);
      } finally {
        setIsRendering(false);
      }
    };

    renderDiagram();
  }, [diagramText, diagramId, isLoading]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'flowchart':
        return 'Flowchart';
      case 'sequence':
        return 'Sequence Diagram';
      case 'gantt':
        return 'Gantt Chart';
      default:
        return 'Diagram';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'flowchart':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'sequence':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'gantt':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`w-full ${className}`}
    >
      <Card className="bg-[#1A1A1A]/90 backdrop-blur-xl border border-gray-800/50 shadow-xl">
        <CardContent className="p-6">
          {/* Header with type badge */}
          <div className="flex items-center justify-between mb-4">
            <Badge 
              variant="outline" 
              className={`${getTypeColor(type)} px-3 py-1 text-sm font-medium`}
            >
              {getTypeLabel(type)}
            </Badge>
            
            {(isLoading || isRendering) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rendering diagram...</span>
              </div>
            )}
          </div>

          {/* Diagram content */}
          <div className="relative">
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300"
              >
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Failed to render diagram</p>
                  <p className="text-sm text-red-300/80 mt-1">{error}</p>
                </div>
              </motion.div>
            ) : (
              <div className="relative">
                {/* Loading overlay */}
                {(isLoading || isRendering) && (
                  <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Generating diagram...</span>
                    </div>
                  </div>
                )}

                {/* Diagram container */}
                <div 
                  ref={diagramRef}
                  className="mermaid-diagram overflow-x-auto rounded-lg bg-[#0F0F0F]/50 p-4 min-h-[200px] flex items-center justify-center"
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                />
              </div>
            )}
          </div>

          {/* Raw diagram text for debugging (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                View diagram source
              </summary>
              <pre className="mt-2 p-3 bg-[#0F0F0F] rounded-lg text-xs text-gray-400 overflow-x-auto border border-gray-800">
                {diagramText}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DiagramRenderer;