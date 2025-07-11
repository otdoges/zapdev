'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Code2,
  MessageSquare,
  Play,
  Settings,
  Share,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ChatInterfaceEnhanced } from '@/components/chat-interface-enhanced';
import WebContainerEnhanced from '@/components/web-container-enhanced';
import { useSupabase } from '@/components/SupabaseProvider';

export default function EnhancedChatPage() {
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  
  const router = useRouter();
  const { user, loading } = useSupabase();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  const handleCodeGenerated = (code: string) => {
    setGeneratedCode(code);
    setHasGenerated(true);
    
    // Auto-expand preview when code is generated
    if (!isPreviewExpanded) {
      setTimeout(() => {
        setIsPreviewExpanded(true);
        setIsChatExpanded(false);
      }, 1000);
    }
  };

  const handleProjectCreated = (project: any) => {
    setCurrentProject(project);
    setHasGenerated(true);
  };

  const toggleLayout = () => {
    if (isPreviewExpanded) {
      setIsPreviewExpanded(false);
      setIsChatExpanded(true);
    } else {
      setIsPreviewExpanded(true);
      setIsChatExpanded(false);
    }
  };

  const showSplitView = () => {
    setIsChatExpanded(true);
    setIsPreviewExpanded(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/chat')}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Back to Chats
            </Button>
            
            {hasGenerated && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center gap-2">
                  <Button
                    variant={isChatExpanded && !isPreviewExpanded ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsChatExpanded(true);
                      setIsPreviewExpanded(false);
                    }}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat
                  </Button>
                  
                  <Button
                    variant={!isChatExpanded && !isPreviewExpanded ? "default" : "outline"}
                    size="sm"
                    onClick={showSplitView}
                  >
                    <Code2 className="mr-2 h-4 w-4" />
                    Split
                  </Button>
                  
                  <Button
                    variant={isPreviewExpanded ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsPreviewExpanded(true);
                      setIsChatExpanded(false);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasGenerated && (
              <>
                <Button variant="outline" size="sm">
                  <Share className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </>
            )}
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 pt-[73px]">
        {/* Chat Panel */}
        <motion.div
          className={cn(
            'border-r bg-background',
            !hasGenerated ? 'w-full' : 'flex'
          )}
          animate={{
            width: !hasGenerated 
              ? '100%' 
              : isChatExpanded && !isPreviewExpanded 
                ? '100%'
                : !isChatExpanded && isPreviewExpanded
                  ? '0%'
                  : '50%'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="flex flex-col h-full w-full">
            {!hasGenerated && (
              <div className="p-6 border-b">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Build anything with AI
                    </h1>
                    <p className="text-lg text-muted-foreground">
                      Describe your project and watch it come to life with real-time preview
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">Vue</Badge>
                    <Badge variant="secondary">HTML/CSS</Badge>
                    <Badge variant="secondary">Node.js</Badge>
                    <Badge variant="secondary">APIs</Badge>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 min-h-0">
              <ChatInterfaceEnhanced
                onCodeGenerated={handleCodeGenerated}
                onProjectCreated={handleProjectCreated}
                className="h-full"
                chatId="enhanced"
              />
            </div>
          </div>
        </motion.div>

        {/* Preview Panel */}
        {hasGenerated && (
          <motion.div
            className="flex flex-col bg-muted/20"
            animate={{
              width: isPreviewExpanded 
                ? '100%' 
                : isChatExpanded 
                  ? '0%'
                  : '50%'
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {(isPreviewExpanded || (!isChatExpanded && !isPreviewExpanded)) && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium">Live Preview</span>
                      </div>
                      
                      {currentProject && (
                        <Badge variant="outline">{currentProject.name}</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleLayout}
                      >
                        {isPreviewExpanded ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 min-h-0">
                  <WebContainerEnhanced
                    code={generatedCode}
                    onCodeChange={setGeneratedCode}
                    aiTeamInstructions={currentProject?.instructions}
                    className="h-full"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Floating Action Button for toggling panels when both are visible */}
      {hasGenerated && !isPreviewExpanded && isChatExpanded && (
        <motion.div
          className="fixed bottom-6 right-6 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            className="rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => {
              setIsPreviewExpanded(true);
              setIsChatExpanded(false);
            }}
          >
            <Play className="mr-2 h-5 w-5" />
            View Preview
          </Button>
        </motion.div>
      )}
    </div>
  );
}