'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { appConfig } from '@/config/app.config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
// Import icons from centralized module to avoid Turbopack chunk issues
import { 
  FiFile, 
  FiChevronRight, 
  FiChevronDown,
  BsFolderFill, 
  BsFolder2Open,
  SiJavascript, 
  SiReact, 
  SiCss3, 
  SiJson 
} from '@/lib/icons';
import { motion } from 'framer-motion';
import CodeApplicationProgress, { type CodeApplicationState } from '@/components/CodeApplicationProgress';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import ConvexChat from '@/components/ConvexChat';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { usePolledQuery, useNavigationCleanup } from '@/hooks/usePolledQuery';

import EnhancedSettingsModal from '@/components/EnhancedSettingsModal';
import DatabaseExplorer from '@/components/DatabaseExplorer';
import DiagramButton from '@/components/DiagramButton';
import MermaidDiagram from '@/components/MermaidDiagram';
import { generateDiagramFromDescription, createDiagramPrompt, extractMermaidCode } from '@/lib/diagram-utils';
import { DesignTeamInterface } from '@/components/DesignTeamInterface';
import ReactScanDashboard from '@/components/ReactScanDashboard';
import UsageLimitModal from '@/components/UsageLimitModal';

interface SandboxData {
  sandboxId: string;
  url: string;
  [key: string]: any;
}

interface ChatMessage {
  content: string;
  type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error';
  timestamp: Date;
  metadata?: {
    scrapedUrl?: string;
    scrapedContent?: any;
    generatedCode?: string;
    appliedFiles?: string[];
    commandType?: 'input' | 'output' | 'error' | 'success';
  };
}

function AISandboxPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [sandboxData, setSandboxData] = useState<SandboxData | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [isGeneratingName, setIsGeneratingName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ text: 'Not connected', active: false });
  const [structureContent, setStructureContent] = useState('No sandbox created yet');
  const [promptInput, setPromptInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      content: 'Welcome! I can help you generate code with full context of your sandbox files and structure. Just start chatting - I\'ll automatically create a sandbox for you if needed!\n\nTip: If you see package errors like "react-router-dom not found", just type "npm install" or "check packages" to automatically install missing packages.',
      type: 'system',
      timestamp: new Date()
    }
  ]);
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiEnabled] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [aiModel, setAiModel] = useState(() => {
    const modelParam = searchParams.get('model');
    return appConfig.ai.availableModels.includes(modelParam || '') ? modelParam! : appConfig.ai.defaultModel;
  });
  // PROFESSIONAL DESIGNER FEATURE: Add designer mode state
  const [designerMode, setDesignerMode] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showHomeScreen, setShowHomeScreen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['app', 'src', 'src/components']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [homeScreenFading, setHomeScreenFading] = useState(false);
  const [homeUrlInput, setHomeUrlInput] = useState('');
  const [homeContextInput, setHomeContextInput] = useState('');
  const [activeTab, setActiveTab] = useState<'generation' | 'preview' | 'chats' | 'diagrams' | 'database'>('preview');
  const [urlScreenshot, setUrlScreenshot] = useState<string | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [isPreparingDesign, setIsPreparingDesign] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<'gathering' | 'planning' | 'generating' | null>(null);
  const [fileStructure, setFileStructure] = useState<string>('');
  const [aiMode, setAiMode] = useState<'fast' | 'deep'>('fast');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReactScanModal, setShowReactScanModal] = useState(false);
  const [urlOverlayVisible, setUrlOverlayVisible] = useState(false);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);

  // Convex state and hooks with optimized polling
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const chats = usePolledQuery(api.chats.getUserChats, isSignedIn ? { limit: 10 } : 'skip');
  const createChat = useMutation(api.chats.createChat);
  const createMessage = useMutation(api.messages.createMessage);
  const updateChatScreenshot = useMutation(api.chats.updateChatScreenshot);

  // Navigation cleanup to save Convex costs
  useNavigationCleanup(() => {
    console.log('[HomePage] Navigation cleanup triggered, saving final state');
    // Force any pending operations to complete
    if (generationProgress.isGenerating) {
      console.log('[HomePage] Canceling ongoing generation');
    }
  });
  
  const [conversationContext, setConversationContext] = useState<{
    scrapedWebsites: Array<{ url: string; content: any; timestamp: Date }>;
    generatedComponents: Array<{ name: string; path: string; content: string }>;
    appliedCode: Array<{ files: string[]; timestamp: Date }>;
    currentProject: string;
    programmingLanguage?: string;
    lastGeneratedCode?: string;
  }>({
    scrapedWebsites: [],
    generatedComponents: [],
    appliedCode: [],
    currentProject: '',
    lastGeneratedCode: undefined
  });
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const codeDisplayRef = useRef<HTMLDivElement>(null);
  
  const [codeApplicationState, setCodeApplicationState] = useState<CodeApplicationState>({
    stage: null
  });
  
  const [generationProgress, setGenerationProgress] = useState<{
    isGenerating: boolean;
    status: string;
    components: Array<{ name: string; path: string; completed: boolean }>;
    currentComponent: number;
    streamedCode: string;
    isStreaming: boolean;
    isThinking: boolean;
    thinkingText?: string;
    thinkingDuration?: number;
    currentFile?: { path: string; content: string; type: string };
    files: Array<{ path: string; content: string; type: string; completed: boolean }>;
    lastProcessedPosition: number;
    isEdit?: boolean;
    // Enhanced reasoning for Groq
    isReasoning?: boolean;
    reasoningSteps?: Array<{ step: number; content: string; completed: boolean }>;
    currentReasoningStep?: number;
    searchSources?: Array<{ title: string; domain: string }>;
  }>({
    isGenerating: false,
    status: '',
    components: [],
    currentComponent: 0,
    streamedCode: '',
    isStreaming: false,
    isThinking: false,
    files: [],
    lastProcessedPosition: 0,
    // Initialize reasoning state
    isReasoning: false,
    reasoningSteps: [],
    currentReasoningStep: 0,
    searchSources: []
  });

  // Clear old conversation data on component mount and create/restore sandbox
  useEffect(() => {
    let isMounted = true;

    const initializePage = async () => {
      // Clear old conversation
      try {
        await fetch('/api/conversation-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear-old' })
        });
        console.log('[home] Cleared old conversation data on mount');
      } catch (error) {
        console.error('[ai-sandbox] Failed to clear old conversation:', error);
        if (isMounted) {
          addChatMessage('Failed to clear old conversation data.', 'error');
        }
      }
      
      if (!isMounted) return;

      // Check if sandbox ID is in URL
      const sandboxIdParam = searchParams.get('sandbox');
      
      setLoading(true);
      try {
        if (sandboxIdParam) {
          console.log('[home] Attempting to restore sandbox:', sandboxIdParam);
          // For now, just create a new sandbox - you could enhance this to actually restore
          // the specific sandbox if your backend supports it
          await createSandbox(true);
        } else {
          console.log('[home] No sandbox in URL, creating new sandbox automatically...');
          await createSandbox(true);
        }
      } catch (error) {
        console.error('[ai-sandbox] Failed to create or restore sandbox:', error);
        if (isMounted) {
          addChatMessage('Failed to create or restore sandbox.', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initializePage();

    return () => {
      isMounted = false;
    };
  }, []); // Run only on mount
  
  useEffect(() => {
    // Handle Escape key for home screen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showHomeScreen) {
        setHomeScreenFading(true);
        setTimeout(() => {
          setShowHomeScreen(false);
          setHomeScreenFading(false);
        }, 500);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHomeScreen]);
  
  // Start capturing screenshot if URL is provided on mount (from home screen)
  useEffect(() => {
    if (!showHomeScreen && homeUrlInput && !urlScreenshot && !isCapturingScreenshot) {
      let screenshotUrl = homeUrlInput.trim();
      // Only proceed if we have a non-empty URL after trimming
      if (screenshotUrl) {
        if (!screenshotUrl.match(/^https?:\/\//i)) {
          screenshotUrl = 'https://' + screenshotUrl;
        }
        captureUrlScreenshot(screenshotUrl);
      }
    }
  }, [showHomeScreen, homeUrlInput]); // eslint-disable-line react-hooks/exhaustive-deps


  useEffect(() => {
    // Only check sandbox status on mount and when user navigates to the page
    checkSandboxStatus();
    
    // Optional: Check status when window regains focus
    const handleFocus = () => {
      checkSandboxStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);


  const updateStatus = (text: string, active: boolean) => {
    setStatus({ text, active });
  };

  const log = (message: string, type: 'info' | 'error' | 'command' = 'info') => {
    console.log(`[${type}] ${message}`);
  };

  const addChatMessage = (content: string, type: ChatMessage['type'], metadata?: ChatMessage['metadata']) => {
    setChatMessages(prev => {
      // Skip duplicate consecutive system messages
      if (type === 'system' && prev.length > 0) {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.type === 'system' && lastMessage.content === content) {
          return prev; // Skip duplicate
        }
      }
      return [...prev, { content, type, timestamp: new Date(), metadata }];
    });
  };
  
  const checkAndInstallPackages = async () => {
    if (!sandboxData) {
      addChatMessage('No active sandbox. Create a sandbox first!', 'system');
      return;
    }
    
    // Vite error checking removed - handled by template setup
    addChatMessage('Sandbox is ready. Vite configuration is handled by the template.', 'system');
  };
  
  const handleSurfaceError = (errors: any[]) => {
    // Function kept for compatibility but Vite errors are now handled by template
    
    // Focus the input
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      textarea.focus();
    }
  };
  
  const installPackages = async (packages: string[]) => {
    if (!sandboxData) {
      addChatMessage('No active sandbox. Create a sandbox first!', 'system');
      return;
    }
    
    try {
      const response = await fetch('/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to install packages: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'command':
                  // Don't show npm install commands - they're handled by info messages
                  if (!data.command.includes('npm install')) {
                    addChatMessage(data.command, 'command', { commandType: 'input' });
                  }
                  break;
                case 'output':
                  addChatMessage(data.message, 'command', { commandType: 'output' });
                  break;
                case 'error':
                  if (data.message && data.message !== 'undefined') {
                    addChatMessage(data.message, 'command', { commandType: 'error' });
                  }
                  break;
                case 'warning':
                  addChatMessage(data.message, 'command', { commandType: 'output' });
                  break;
                case 'success':
                  addChatMessage(`${data.message}`, 'system');
                  break;
                case 'status':
                  addChatMessage(data.message, 'system');
                  break;
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error: any) {
      addChatMessage(`Failed to install packages: ${error.message}`, 'system');
    }
  };

  const checkSandboxStatus = async () => {
    try {
      const response = await fetch('/api/sandbox-status');
      const data = await response.json();
      
      if (data.active && data.healthy && data.sandboxData) {
        setSandboxData(data.sandboxData);
        updateStatus('Sandbox active', true);
      } else if (data.active && !data.healthy) {
        // Sandbox exists but not responding
        updateStatus('Sandbox not responding', false);
        // Optionally try to create a new one
      } else {
        setSandboxData(null);
        updateStatus('No sandbox', false);
      }
    } catch (error) {
      console.error('Failed to check sandbox status:', error);
      setSandboxData(null);
      updateStatus('Error', false);
    }
  };

  const createSandbox = async (fromHomeScreen = false) => {
    console.log('[createSandbox] Starting sandbox creation...');
    setLoading(true);
    // showLoadingBackground set to true
    updateStatus('Creating sandbox...', false);
    // responseArea cleared
    setScreenshotError(null);
    
    try {
      const response = await fetch('/api/create-ai-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('[createSandbox] Response data:', data);
      
      if (data.success) {
        setSandboxData(data);
        updateStatus('Sandbox active', true);
        log('Sandbox created successfully!');
        log(`Sandbox ID: ${data.sandboxId}`);
        log(`URL: ${data.url}`);
        
        // Update URL with sandbox ID
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('sandbox', data.sandboxId);
        newParams.set('model', aiModel);
        router.push(`/?${newParams.toString()}`, { scroll: false });
        
        // Fade out loading background after sandbox loads
        setTimeout(() => {
          // setShowLoadingBackground(false);
        }, 3000);
        
        if (data.structure) {
          displayStructure(data.structure);
        }
        
        // Fetch sandbox files after creation
        setTimeout(fetchSandboxFiles, 1000);
        
        // Restart Vite server to ensure it's running
        setTimeout(async () => {
          try {
            console.log('[createSandbox] Ensuring Vite server is running...');
            const restartResponse = await fetch('/api/restart-vite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (restartResponse.ok) {
              const restartData = await restartResponse.json();
              if (restartData.success) {
                console.log('[createSandbox] Vite server started successfully');
              }
            }
          } catch (error) {
            console.error('[createSandbox] Error starting Vite server:', error);
          }
        }, 2000);
        
        // Only add welcome message if not coming from home screen
        if (!fromHomeScreen) {
          addChatMessage(`Sandbox created! ID: ${data.sandboxId}. I now have context of your sandbox and can help you build your app. Just ask me to create components and I'll automatically apply them!

Tip: I automatically detect and install npm packages from your code imports (like react-router-dom, axios, etc.)`, 'system');
        }
        
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = data.url;
          }
        }, 100);
        
        // Capture screenshot for chat preview after sandbox is ready and update Convex
        if (currentChatId && isSignedIn) {
          setTimeout(async () => {
            try {
              console.log('[createSandbox] Capturing screenshot for chat preview...');
              const screenshotResponse = await fetch('/api/scrape-screenshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: data.url })
              });
              
              const screenshotData = await screenshotResponse.json();
              if (screenshotData.success && screenshotData.screenshot) {
                console.log('[createSandbox] Screenshot captured, updating chat...');
                await updateChatScreenshot({
                  chatId: currentChatId,
                  screenshot: screenshotData.screenshot,
                  sandboxId: data.sandboxId,
                  sandboxUrl: data.url
                });
                console.log('[createSandbox] Chat updated with screenshot');
              } else {
                console.warn('[createSandbox] Failed to capture screenshot:', screenshotData.error);
              }
            } catch (error) {
              console.error('[createSandbox] Error capturing screenshot:', error);
            }
          }, 3000); // Wait 3 seconds for the sandbox to fully load
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('[createSandbox] Error:', error);
      updateStatus('Error', false);
      log(`Failed to create sandbox: ${error.message}`, 'error');
      addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
    } finally {
      setLoading(false);
    }
  };

  const displayStructure = (structure: any) => {
    if (typeof structure === 'object') {
      setStructureContent(JSON.stringify(structure, null, 2));
    } else {
      setStructureContent(structure || 'No structure available');
    }
  };

  const applyGeneratedCode = async (code: string, isEdit: boolean = false) => {
    setLoading(true);
    console.log('[applyGeneratedCode] ===== STARTING CODE APPLICATION =====');
    console.log('[applyGeneratedCode] Timestamp:', new Date().toISOString());
    console.log('[applyGeneratedCode] IsEdit mode:', isEdit);
    console.log('[applyGeneratedCode] Code length:', code.length);
    console.log('[applyGeneratedCode] Code preview:', code.substring(0, 200));
    console.log('[applyGeneratedCode] SandboxData:', sandboxData);
    console.log('[applyGeneratedCode] Current conversation context files:', conversationContext.appliedCode.length);
    console.log('[applyGeneratedCode] =======================================');
    
    log('Applying AI-generated code...');
    
    try {
      // Show progress component instead of individual messages
      setCodeApplicationState({ stage: 'analyzing' });
      
      // Get pending packages from tool calls
      const pendingPackages = ((window as any).pendingPackages || []).filter((pkg: any) => pkg && typeof pkg === 'string');
      if (pendingPackages.length > 0) {
        console.log('[applyGeneratedCode] Sending packages from tool calls:', pendingPackages);
        // Clear pending packages after use
        (window as any).pendingPackages = [];
      }
      
      // Use streaming endpoint for real-time feedback
      const response = await fetch('/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response: code,
          isEdit: isEdit,
          packages: pendingPackages,
          sandboxId: sandboxData?.sandboxId // Pass the sandbox ID to ensure proper connection
        })
      });
      
      if (!response.ok) {
        // Enhanced error handling for different response types
        let errorMessage = `Failed to apply code: ${response.status} ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            console.error('[applyGeneratedCode] Error details:', errorData.details);
          }
        } catch (jsonError) {
          // If response isn't JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `Server error: ${errorText}`;
            }
          } catch (textError) {
            console.error('[applyGeneratedCode] Could not parse error response:', textError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle streaming response with better error handling and timeout
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      
      const decoder = new TextDecoder();
      let finalData: any = null;
      let hasReceivedData = false;
      let lastDataTime = Date.now();
      const TIMEOUT_MS = 30000; // 30 second timeout
      
      // Set up timeout monitoring
      const timeoutCheck = setInterval(() => {
        if (Date.now() - lastDataTime > TIMEOUT_MS) {
          clearInterval(timeoutCheck);
          reader.cancel();
          throw new Error('Stream timeout - no data received for 30 seconds');
        }
      }, 5000);
      
      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;
          
          lastDataTime = Date.now(); // Update last data time
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                hasReceivedData = true;
                
                // Enhanced logging for debugging
                console.log('[applyGeneratedCode] Received streaming data:', data.type, data);
                
                switch (data.type) {
                  case 'start':
                    // Don't add as chat message, just update state
                    setCodeApplicationState({ stage: 'analyzing' });
                    break;
                    
                  case 'step':
                    // Update progress state based on step
                    if (data.message.includes('Installing') && data.packages) {
                      setCodeApplicationState({ 
                        stage: 'installing', 
                        packages: data.packages 
                      });
                    } else if (data.message.includes('Creating files') || data.message.includes('Applying')) {
                      setCodeApplicationState({ 
                        stage: 'applying',
                        filesGenerated: data.filesCreated || [] 
                      });
                    }
                    break;
                  
                case 'package-progress':
                  // Handle package installation progress
                  if (data.installedPackages) {
                    setCodeApplicationState(prev => ({ 
                      ...prev,
                      installedPackages: data.installedPackages 
                    }));
                  }
                  break;
                  
                case 'command':
                  // Don't show npm install commands - they're handled by info messages
                  if (data.command && !data.command.includes('npm install')) {
                    addChatMessage(data.command, 'command', { commandType: 'input' });
                  }
                  break;
                  
                case 'success':
                  if (data.installedPackages) {
                    setCodeApplicationState(prev => ({ 
                      ...prev,
                      installedPackages: data.installedPackages 
                    }));
                  }
                  break;
                  
                case 'file-progress':
                  // Skip file progress messages, they're noisy
                  break;
                  
                case 'file-complete':
                  // Could add individual file completion messages if desired
                  break;
                  
                case 'command-progress':
                  addChatMessage(`${data.action} command: ${data.command}`, 'command', { commandType: 'input' });
                  break;
                  
                case 'command-output':
                  addChatMessage(data.output, 'command', { 
                    commandType: data.stream === 'stderr' ? 'error' : 'output' 
                  });
                  break;
                  
                case 'command-complete':
                  if (data.success) {
                    addChatMessage(`Command completed successfully`, 'system');
                  } else {
                    addChatMessage(`Command failed with exit code ${data.exitCode}`, 'system');
                  }
                  break;
                  
                case 'complete':
                  finalData = data;
                  setCodeApplicationState({ stage: 'complete' });
                  // Clear the state after a delay
                  setTimeout(() => {
                    setCodeApplicationState({ stage: null });
                  }, 3000);
                  break;
                  
                case 'error':
                  addChatMessage(`Error: ${data.message || data.error || 'Unknown error'}`, 'system');
                  break;
                  
                case 'warning':
                  addChatMessage(`${data.message}`, 'system');
                  break;
                  
                case 'info':
                  // Show info messages, especially for package installation
                  if (data.message) {
                    addChatMessage(data.message, 'system');
                  }
                  break;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
      } catch (streamError) {
        console.error('[applyGeneratedCode] Stream reading error:', streamError);
        clearInterval(timeoutCheck);
        throw streamError;
      } finally {
        // Clean up timeout check
        clearInterval(timeoutCheck);
      }
      
      // Check if we received any data at all
      if (!hasReceivedData) {
        console.error('[applyGeneratedCode] No streaming data received');
        throw new Error('No response data received from server. The connection may have been interrupted.');
      }
      
      // Process final data
      if (finalData && finalData.type === 'complete') {
        const data = {
          success: true,
          results: finalData.results,
          explanation: finalData.explanation,
          structure: finalData.structure,
          message: finalData.message
        };
        
        if (data.success) {
          const { results } = data;
          const appliedFiles = [...(results.filesCreated || []), ...(results.filesUpdated || [])];
        
        // Log package installation results without duplicate messages
        if (results.packagesInstalled?.length > 0) {
          log(`Packages installed: ${results.packagesInstalled.join(', ')}`);
        }
        
        if (appliedFiles.length > 0) {
          log('Files processed:');
          appliedFiles.forEach((file: string) => {
            log(`  ${file}`, 'command');
          });
          
          // Verify files were actually created by refreshing the sandbox if needed
          if (sandboxData?.sandboxId && appliedFiles.length > 0) {
            // Small delay to ensure files are written
            setTimeout(() => {
              // Force refresh the iframe to show new files
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
              }
            }, 1000);
          }
        }
        
        if (results.filesUpdated?.length > 0) {
          log('Files updated:');
          results.filesUpdated.forEach((file: string) => {
            log(`  ${file}`, 'command');
          });
        }
        
        // Update conversation context with applied code
        setConversationContext(prev => ({
          ...prev,
          appliedCode: [...prev.appliedCode, {
            files: [...(results.filesCreated || []), ...(results.filesUpdated || [])],
            timestamp: new Date()
          }]
        }));
        
        if (results.commandsExecuted?.length > 0) {
          log('Commands executed:');
          results.commandsExecuted.forEach((cmd: string) => {
            log(`  $ ${cmd}`, 'command');
          });
        }
        
        if (results.errors?.length > 0) {
          results.errors.forEach((err: string) => {
            log(err, 'error');
          });
        }
        
        if (data.structure) {
          displayStructure(data.structure);
        }
        
        if (data.explanation) {
          log(data.explanation);
        }
        
        if ((data as any).autoCompleted) {
          log('Auto-generating missing components...', 'command');
          
          if ((data as any).autoCompletedComponents) {
            setTimeout(() => {
              log('Auto-generated missing components:', 'info');
              (data as any).autoCompletedComponents.forEach((comp: string) => {
                log(`  ${comp}`, 'command');
              });
            }, 1000);
          }
        } else if ((data as any).warning) {
          log((data as any).warning, 'error');
          
          if ((data as any).missingImports && (data as any).missingImports.length > 0) {
            const missingList = (data as any).missingImports.join(', ');
            addChatMessage(
              `Ask me to "create the missing components: ${missingList}" to fix these import errors.`,
              'system'
            );
          }
        }
        
        log('Code applied successfully!');
        console.log('[applyGeneratedCode] Response data:', data);
        console.log('[applyGeneratedCode] Debug info:', (data as any).debug);
        console.log('[applyGeneratedCode] Current sandboxData:', sandboxData);
        console.log('[applyGeneratedCode] Current iframe element:', iframeRef.current);
        console.log('[applyGeneratedCode] Current iframe src:', iframeRef.current?.src);
        
        if (appliedFiles.length > 0) {
          setConversationContext(prev => ({
            ...prev,
            appliedCode: [...prev.appliedCode, {
              files: appliedFiles,
              timestamp: new Date()
            }]
          }));
          
          // Update the chat message to show success
          // Only show file list if not in edit mode
          if (isEdit) {
            addChatMessage(`Edit applied successfully!`, 'system');
          } else {
            // Check if this is part of a generation flow (has recent AI recreation message)
            const recentMessages = chatMessages.slice(-5);
            const isPartOfGeneration = recentMessages.some(m => 
              m.content.includes('AI recreation generated') || 
              m.content.includes('Code generated')
            );
            
            // Don't show files if part of generation flow to avoid duplication
            if (isPartOfGeneration) {
              addChatMessage(`Applied ${results.filesCreated.length} files successfully!`, 'system');
            } else {
              addChatMessage(`Applied ${results.filesCreated.length} files successfully!`, 'system', {
                appliedFiles: results.filesCreated
              });
            }
          }
          
          // If there are failed packages, add a message about checking for errors
          if (results.packagesFailed?.length > 0) {
            addChatMessage(`⚠️ Some packages failed to install. Check the error banner above for details.`, 'system');
          }
          
          // Fetch updated file structure
          await fetchSandboxFiles();
          
          // Automatically check and install any missing packages
          await checkAndInstallPackages();
          
          // Test build to ensure everything compiles correctly
          // Skip build test for now - it's causing errors with undefined activeSandbox
          // The build test was trying to access global.activeSandbox from the frontend,
          // but that's only available in the backend API routes
          console.log('[build-test] Skipping build test - would need API endpoint');
          
          // Force iframe refresh after applying code
          const refreshDelay = appConfig.codeApplication.defaultRefreshDelay; // Allow Vite to process changes
          
          setTimeout(() => {
            if (iframeRef.current && sandboxData?.url) {
              console.log('[home] Refreshing iframe after code application...');
              
              // Method 1: Change src with timestamp
              const urlWithTimestamp = `${sandboxData.url}?t=${Date.now()}&applied=true`;
              iframeRef.current.src = urlWithTimestamp;
              
              // Method 2: Force reload after a short delay
              setTimeout(() => {
                try {
                  if (iframeRef.current?.contentWindow) {
                    iframeRef.current.contentWindow.location.reload();
                    console.log('[home] Force reloaded iframe content');
                  }
                } catch (e) {
                  console.log('[home] Could not reload iframe (cross-origin):', e);
                }
              }, 1000);
            }
          }, refreshDelay);
          
          // Vite error checking removed - handled by template setup
        }
        
          // Give Vite HMR a moment to detect changes, then ensure refresh
          if (iframeRef.current && sandboxData?.url) {
            // Wait for Vite to process the file changes
            // If packages were installed, wait longer for Vite to restart
            const packagesInstalled = results?.packagesInstalled?.length > 0 || data.results?.packagesInstalled?.length > 0;
            const refreshDelay = packagesInstalled ? appConfig.codeApplication.packageInstallRefreshDelay : appConfig.codeApplication.defaultRefreshDelay;
            console.log(`[applyGeneratedCode] Packages installed: ${packagesInstalled}, refresh delay: ${refreshDelay}ms`);
            
            setTimeout(async () => {
            if (iframeRef.current && sandboxData?.url) {
              console.log('[applyGeneratedCode] Starting iframe refresh sequence...');
              console.log('[applyGeneratedCode] Current iframe src:', iframeRef.current.src);
              console.log('[applyGeneratedCode] Sandbox URL:', sandboxData.url);
              
              // Method 1: Try direct navigation first
              try {
                const urlWithTimestamp = `${sandboxData.url}?t=${Date.now()}&force=true`;
                console.log('[applyGeneratedCode] Attempting direct navigation to:', urlWithTimestamp);
                
                // Remove any existing onload handler
                iframeRef.current.onload = null;
                
                // Navigate directly
                iframeRef.current.src = urlWithTimestamp;
                
                // Wait a bit and check if it loaded
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Try to access the iframe content to verify it loaded
                try {
                  const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
                  if (iframeDoc && iframeDoc.readyState === 'complete') {
                    console.log('[applyGeneratedCode] Iframe loaded successfully');
                    return;
                  }
                } catch (e) {
                  console.log('[applyGeneratedCode] Cannot access iframe content (CORS), assuming loaded');
                  return;
                }
              } catch (e) {
                console.error('[applyGeneratedCode] Direct navigation failed:', e);
              }
              
              // Method 2: Force complete iframe recreation if direct navigation failed
              console.log('[applyGeneratedCode] Falling back to iframe recreation...');
              const parent = iframeRef.current.parentElement;
              const newIframe = document.createElement('iframe');
              
              // Copy attributes
              newIframe.className = iframeRef.current.className;
              newIframe.title = iframeRef.current.title;
              newIframe.allow = iframeRef.current.allow;
              // Copy sandbox attributes
              const sandboxValue = iframeRef.current.getAttribute('sandbox');
              if (sandboxValue) {
                newIframe.setAttribute('sandbox', sandboxValue);
              }
              
              // Remove old iframe
              iframeRef.current.remove();
              
              // Add new iframe
              newIframe.src = `${sandboxData.url}?t=${Date.now()}&recreated=true`;
              parent?.appendChild(newIframe);
              
              // Update ref
              (iframeRef as any).current = newIframe;
              
              console.log('[applyGeneratedCode] Iframe recreated with new content');
            } else {
              console.error('[applyGeneratedCode] No iframe or sandbox URL available for refresh');
            }
          }, refreshDelay); // Dynamic delay based on whether packages were installed
        }
        
        } else {
          throw new Error(finalData?.error || 'Failed to apply code');
        }
      } else {
        // If no final data was received, provide more detailed feedback
        console.warn('[applyGeneratedCode] No final completion data received from stream');
        
        if (hasReceivedData) {
          // We got some data but no completion - this suggests partial success or interruption
          addChatMessage('⚠️ Code application was interrupted or partially completed. Please check the preview and try again if needed.', 'system');
          // Still set some state to indicate partial completion
          setCodeApplicationState({ stage: 'complete', hasError: true });
        } else {
          // No data at all - complete failure
          throw new Error('No response received from server. The apply operation failed completely.');
        }
      }
    } catch (error: any) {
      console.error('[applyGeneratedCode] Error occurred:', error);
      
      // Enhanced error logging and user feedback
      const errorMessage = error.message || 'Unknown error occurred';
      log(`Failed to apply code: ${errorMessage}`, 'error');
      
      // Set error state for UI feedback
      setCodeApplicationState({ 
        stage: null,
        error: errorMessage,
        hasError: true 
      });
      
      // Add detailed error message to chat based on error type
      if (errorMessage.includes('sandbox')) {
        addChatMessage('🔥 Sandbox connection issue. The sandbox may have expired or been disconnected. Try creating a new sandbox.', 'system');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        addChatMessage('🌐 Network error occurred. Please check your connection and try again.', 'system');
      } else if (errorMessage.includes('timeout')) {
        addChatMessage('⏱️ Operation timed out. The server may be overloaded. Please try again.', 'system');
      } else {
        addChatMessage(`❌ Application failed: ${errorMessage}`, 'system');
      }
    } finally {
      setLoading(false);
      // Clear isEdit flag after applying code
      setGenerationProgress(prev => ({
        ...prev,
        isEdit: false
      }));
    }
  };

  const fetchSandboxFiles = async () => {
    if (!sandboxData) return;
    
    try {
      const response = await fetch('/api/get-sandbox-files', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // setSandboxFiles(data.files || {});
          // setFileStructure(data.structure || '');
          console.log('[fetchSandboxFiles] Updated file list:', Object.keys(data.files || {}).length, 'files');
        }
      }
    } catch (error) {
      console.error('[fetchSandboxFiles] Error fetching files:', error);
    }
  };
  
  const restartViteServer = async () => {
    try {
      addChatMessage('Restarting Vite dev server...', 'system');
      
      const response = await fetch('/api/restart-vite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          addChatMessage('✓ Vite dev server restarted successfully!', 'system');
          
          // Refresh the iframe after a short delay
          setTimeout(() => {
            if (iframeRef.current && sandboxData?.url) {
              iframeRef.current.src = `${sandboxData.url}?t=${Date.now()}`;
            }
          }, 2000);
        } else {
          addChatMessage(`Failed to restart Vite: ${data.error}`, 'error');
        }
      } else {
        addChatMessage('Failed to restart Vite server', 'error');
      }
    } catch (error) {
      console.error('[restartViteServer] Error:', error);
      addChatMessage(`Error restarting Vite: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const applyCode = async () => {
    const code = promptInput.trim();
    if (!code) {
      log('Please enter some code first', 'error');
      addChatMessage('No code to apply. Please generate code first.', 'system');
      return;
    }
    
    // Prevent double clicks
    if (loading) {
      console.log('[applyCode] Already loading, skipping...');
      return;
    }
    
    // Determine if this is an edit based on whether we have applied code before
    const isEdit = conversationContext.appliedCode.length > 0;
    await applyGeneratedCode(code, isEdit);
  };

  const renderMainContent = () => {
    if (activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0)) {
      return (
        /* Generation Tab Content */
        <div className="absolute inset-0 flex overflow-hidden">
          {/* File Explorer - Hide during edits */}
          {!generationProgress.isEdit && (
            <div className="w-[250px] border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
            <div className="p-3 bg-gray-100 text-gray-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BsFolderFill className="w-4 h-4" />
                <span className="text-sm font-medium">Explorer</span>
              </div>
            </div>
            
            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
              <div className="text-sm">
                {/* Root app folder */}
                <div 
                  className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
                  onClick={() => toggleFolder('app')}
                >
                  {expandedFolders.has('app') ? (
                    <FiChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FiChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                  {expandedFolders.has('app') ? (
                    <BsFolder2Open className="w-4 h-4 text-blue-500" />
                  ) : (
                    <BsFolderFill className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="font-medium text-gray-800">app</span>
                </div>
                
                {expandedFolders.has('app') && (
                  <div className="ml-4">
                    {/* Group files by directory */}
                    {(() => {
                      const fileTree: { [key: string]: Array<{ name: string; edited?: boolean }> } = {};
                      
                      // Create a map of edited files
                      const editedFiles = new Set(
                        generationProgress.files
                          .filter(f => (f as any).edited)
                          .map(f => f.path)
                      );
                      
                      // Process all files from generation progress
                      generationProgress.files.forEach(file => {
                        const parts = file.path.split('/');
                        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                        const fileName = parts[parts.length - 1];
                        
                        if (!fileTree[dir]) fileTree[dir] = [];
                        fileTree[dir].push({
                          name: fileName,
                          edited: (file as any).edited || false
                        });
                      });
                      
                      return Object.entries(fileTree).map(([dir, files]) => (
                        <div key={dir} className="mb-1">
                          {dir && (
                            <div 
                              className="flex items-center gap-1 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer text-gray-700"
                              onClick={() => toggleFolder(dir)}
                            >
                              {expandedFolders.has(dir) ? (
                                <FiChevronDown className="w-4 h-4 text-gray-600" />
                              ) : (
                                <FiChevronRight className="w-4 h-4 text-gray-600" />
                              )}
                              {expandedFolders.has(dir) ? (
                                <BsFolder2Open className="w-4 h-4 text-yellow-600" />
                              ) : (
                                <BsFolderFill className="w-4 h-4 text-yellow-600" />
                              )}
                              <span className="text-gray-700">{dir.split('/').pop()}</span>
                            </div>
                          )}
                          {(!dir || expandedFolders.has(dir)) && (
                            <div className={dir ? 'ml-6' : ''}>
                              {files.sort((a, b) => a.name.localeCompare(b.name)).map(fileInfo => {
                                const fullPath = dir ? `${dir}/${fileInfo.name}` : fileInfo.name;
                                const isSelected = selectedFile === fullPath;
                                
                                return (
                                  <div 
                                    key={fullPath} 
                                    className={`flex items-center gap-2 py-1 px-2 rounded cursor-pointer transition-all ${
                                      isSelected 
                                        ? 'bg-blue-500 text-white' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                    onClick={() => handleFileClick(fullPath)}
                                  >
                                    {getFileIcon(fileInfo.name)}
                                    <span className={`text-xs flex items-center gap-1 ${isSelected ? 'font-medium' : ''}`}>
                                      {fileInfo.name}
                                      {fileInfo.edited && (
                                        <span className={`text-[10px] px-1 rounded ${
                                          isSelected ? 'bg-blue-400' : 'bg-orange-500 text-white'
                                        }`}>✓</span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
          
          {/* Code Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Enhanced Reasoning Display - Show thinking and sequential reasoning */}
            {generationProgress.isGenerating && (
              generationProgress.isThinking || 
              generationProgress.thinkingText || 
              generationProgress.isReasoning || 
              (generationProgress.reasoningSteps && generationProgress.reasoningSteps.length > 0)
            ) && (
              <div className="px-6 pb-6">
                {/* Basic thinking display */}
                {(generationProgress.isThinking || generationProgress.thinkingText) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="text-purple-600 font-medium flex items-center gap-2">
                        {generationProgress.isThinking ? (
                          <>
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
                            AI is thinking...
                          </>
                        ) : (
                          <>
                            <span className="text-purple-600">✓</span>
                            Thought for {generationProgress.thinkingDuration || 0} seconds
                          </>
                        )}
                      </div>
                    </div>
                    {generationProgress.thinkingText && (
                      <div className="bg-purple-950 border border-purple-700 rounded-lg p-4 max-h-48 overflow-y-auto scrollbar-hide">
                        <pre className="text-xs font-mono text-purple-300 whitespace-pre-wrap">
                          {generationProgress.thinkingText}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced reasoning display for Groq */}
                {(generationProgress.isReasoning || (generationProgress.reasoningSteps && generationProgress.reasoningSteps.length > 0)) && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-blue-600 font-medium flex items-center gap-2">
                        {generationProgress.isReasoning ? (
                          <>
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            Sequential reasoning active...
                          </>
                        ) : (
                          <>
                            <span className="text-blue-600">🧠</span>
                            Reasoning complete ({generationProgress.reasoningSteps?.length || 0} steps)
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Reasoning steps */}
                    <div className="space-y-2">
                      {generationProgress.reasoningSteps?.map((step, index) => (
                        <div 
                          key={`reasoning-${step.step}`}
                          className={`border rounded-lg p-3 ${
                            step.completed 
                              ? 'bg-blue-950 border-blue-700' 
                              : 'bg-blue-900/20 border-blue-600/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-blue-400">
                              Step {step.step}
                            </span>
                            {step.completed ? (
                              <span className="text-blue-400 text-xs">✓</span>
                            ) : (
                              <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
                            )}
                          </div>
                          {step.content && (
                            <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap">
                              {step.content}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Search sources if available */}
                    {generationProgress.searchSources && generationProgress.searchSources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-700/30">
                        <div className="text-xs text-blue-400 mb-2">Enhanced with search results:</div>
                        <div className="flex flex-wrap gap-2">
                          {generationProgress.searchSources.map((source, idx) => (
                            <span 
                              key={idx}
                              className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded"
                            >
                              {source.title} ({source.domain})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Live Code Display */}
            <div className="flex-1 rounded-lg p-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide" ref={codeDisplayRef}>
                {/* Show selected file if one is selected */}
                {selectedFile ? (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-black border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getFileIcon(selectedFile)}
                          <span className="font-mono text-sm">{selectedFile}</span>
                        </div>
                        <button
                          onClick={() => setSelectedFile(null)}
                          className="hover:bg-black/20 p-1 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="bg-gray-900 border border-gray-700 rounded">
                        <SyntaxHighlighter
                          language={(() => {
                            const ext = selectedFile.split('.').pop()?.toLowerCase();
                            if (ext === 'css') return 'css';
                            if (ext === 'json') return 'json';
                            if (ext === 'html') return 'html';
                            return 'jsx';
                          })()}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            background: 'transparent',
                          }}
                          showLineNumbers={true}
                        >
                          {(() => {
                            // Find the file content from generated files
                            const file = generationProgress.files.find(f => f.path === selectedFile);
                            return file?.content || '// File content will appear here';
                          })()}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  </div>
                ) : /* If no files parsed yet, show loading or raw stream */
                generationProgress.files.length === 0 && !generationProgress.currentFile ? (
                  generationProgress.isThinking ? (
                    // Beautiful loading state while thinking
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="mb-8 relative">
                          <div className="w-24 h-24 mx-auto">
                            <div className="absolute inset-0 border-4 border-gray-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-spin border-t-transparent"></div>
                          </div>
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">AI is analyzing your request</h3>
                        <p className="text-gray-400 text-sm">{generationProgress.status || 'Preparing to generate code...'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-100 text-gray-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          <span className="font-mono text-sm">Streaming code...</span>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-900 rounded">
                        <SyntaxHighlighter
                          language="jsx"
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            background: 'transparent',
                          }}
                          showLineNumbers={true}
                        >
                          {generationProgress.streamedCode || 'Starting code generation...'}
                        </SyntaxHighlighter>
                        <span className="inline-block w-2 h-4 bg-orange-400 ml-1 animate-pulse" />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {/* Show current file being generated */}
                    {generationProgress.currentFile && (
                      <div className="bg-black border-2 border-gray-400 rounded-lg overflow-hidden shadow-sm">
                        <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-sm">{generationProgress.currentFile.path}</span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              generationProgress.currentFile.type === 'css' ? 'bg-blue-600 text-white' :
                              generationProgress.currentFile.type === 'javascript' ? 'bg-yellow-600 text-white' :
                              generationProgress.currentFile.type === 'json' ? 'bg-green-600 text-white' :
                              'bg-gray-200 text-gray-700'
                            }`}>
                              {generationProgress.currentFile.type === 'javascript' ? 'JSX' : generationProgress.currentFile.type.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-900 border border-gray-700 rounded">
                          <SyntaxHighlighter
                            language={
                              generationProgress.currentFile.type === 'css' ? 'css' :
                              generationProgress.currentFile.type === 'json' ? 'json' :
                              generationProgress.currentFile.type === 'html' ? 'html' :
                              'jsx'
                            }
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.75rem',
                              background: 'transparent',
                            }}
                            showLineNumbers={true}
                          >
                            {generationProgress.currentFile.content}
                          </SyntaxHighlighter>
                          <span className="inline-block w-2 h-3 bg-orange-400 ml-4 mb-4 animate-pulse" />
                        </div>
                      </div>
                    )}
                    
                    {/* Show completed files */}
                    {generationProgress.files.map((file, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span className="font-mono text-sm">{file.path}</span>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            file.type === 'css' ? 'bg-blue-600 text-white' :
                            file.type === 'javascript' ? 'bg-yellow-600 text-white' :
                            file.type === 'json' ? 'bg-green-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {file.type === 'javascript' ? 'JSX' : file.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="bg-gray-900 border border-gray-700  max-h-48 overflow-y-auto scrollbar-hide">
                          <SyntaxHighlighter
                            language={
                              file.type === 'css' ? 'css' :
                              file.type === 'json' ? 'json' :
                              file.type === 'html' ? 'html' :
                              'jsx'
                            }
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.75rem',
                              background: 'transparent',
                            }}
                            showLineNumbers={true}
                            wrapLongLines={true}
                          >
                            {file.content}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show remaining raw stream if there's content after the last file */}
                    {!generationProgress.currentFile && generationProgress.streamedCode.length > 0 && (
                      <div className="bg-black border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-4 py-2 bg-[#36322F] text-white flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span className="font-mono text-sm">Processing...</span>
                          </div>
                        </div>
                        <div className="bg-gray-900 border border-gray-700 rounded">
                          <SyntaxHighlighter
                            language="jsx"
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '1rem',
                              fontSize: '0.75rem',
                              background: 'transparent',
                            }}
                            showLineNumbers={false}
                          >
                            {(() => {
                              // Show only the tail of the stream after the last file
                              const lastFileEnd = generationProgress.files.length > 0 
                                ? generationProgress.streamedCode.lastIndexOf('</file>') + 7
                                : 0;
                              let remainingContent = generationProgress.streamedCode.slice(lastFileEnd).trim();
                              
                              // Remove explanation tags and content
                              remainingContent = remainingContent.replace(/<explanation>[\s\S]*?<\/explanation>/g, '').trim();
                              
                              // If only whitespace or nothing left, show waiting message
                              return remainingContent || 'Waiting for next file...';
                            })()}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress indicator */}
            {generationProgress.components.length > 0 && (
              <div className="mx-6 mb-6">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
                    style={{
                      width: `${(generationProgress.currentComponent / Math.max(generationProgress.components.length, 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    } else if (activeTab === 'preview') {
      // Show screenshot when we have one and (loading OR generating OR no sandbox yet)
      if (urlScreenshot && (loading || generationProgress.isGenerating || !sandboxData?.url || isPreparingDesign)) {
        return (
          <div className="relative w-full h-full bg-gray-100">
            <img 
              src={urlScreenshot} 
              alt="Website preview" 
              className="w-full h-full object-contain"
            />
            {(generationProgress.isGenerating || isPreparingDesign) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center bg-black/70 rounded-lg p-6 backdrop-blur-sm">
                  <div className="w-12 h-12 border-3 border-gray-300 border-t-white rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-white text-sm font-medium">
                    {generationProgress.isGenerating ? 'Generating code...' : `Preparing your design for ${targetUrl}...`}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }
      
      // Check loading stage FIRST to prevent showing old sandbox
      // Don't show loading overlay for edits
      if (loadingStage || (generationProgress.isGenerating && !generationProgress.isEdit)) {
        return (
          <div className="relative w-full h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {loadingStage === 'gathering' && 'Gathering website information...'}
                {loadingStage === 'planning' && 'Planning your design...'}
                {(loadingStage === 'generating' || generationProgress.isGenerating) && 'Generating your application...'}
              </h3>
              <p className="text-gray-600 text-sm">
                {loadingStage === 'gathering' && 'Analyzing the website structure and content'}
                {loadingStage === 'planning' && 'Creating the optimal React component architecture'}
                {(loadingStage === 'generating' || generationProgress.isGenerating) && 'Writing clean, modern code for your app'}
              </p>
            </div>
          </div>
        );
      }
      
      // Show sandbox iframe only when not in any loading state
      if (sandboxData?.url && !loading) {
        return (
          <div className="relative w-full h-full">
            <iframe
              ref={iframeRef}
              src={sandboxData.url}
              className="w-full h-full border-none"
              title="Open Lovable Sandbox"
              allow="clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
            {/* Refresh button */}
            <button
              onClick={() => {
                if (iframeRef.current && sandboxData?.url) {
                  console.log('[Manual Refresh] Forcing iframe reload...');
                  const newSrc = `${sandboxData.url}?t=${Date.now()}&manual=true`;
                  iframeRef.current.src = newSrc;
                }
              }}
              className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 p-2 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              title="Refresh sandbox"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        );
      }
      
      // Show loading animation when capturing screenshot
      if (isCapturingScreenshot) {
        return (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center">
              <div className="w-12 h-12 border-3 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">Gathering website information</h3>
            </div>
          </div>
        );
      }
      
      // Default state when no sandbox and no screenshot
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 text-gray-600 text-lg">
          {screenshotError ? (
            <div className="text-center">
              <p className="mb-2">Failed to capture screenshot</p>
              <p className="text-sm text-gray-500">{screenshotError}</p>
            </div>
          ) : sandboxData ? (
            <div className="text-gray-500">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading preview...</p>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <p className="text-sm">Start chatting to create your first app</p>
            </div>
          )}
        </div>
      );
    } else if (activeTab === 'chats') {
      return (
        <div className="h-full flex">
          {/* PROFESSIONAL DESIGNER FEATURE: Show both ConvexChat and DesignTeamInterface when designer mode is active */}
          <div className={designerMode ? "w-1/2 border-r border-gray-700" : "w-full"}>
            <ConvexChat
              onChatSelect={(chatId) => {
                // Handle chat selection - could load chat context
                console.log('Selected chat:', chatId);
                // TODO: Load chat messages into current conversation context
              }}
              onMessageAdd={(message, type) => {
                // Sync with local chat if needed
                addChatMessage(message, type);
              
              // If this is a user message, trigger AI response
              if (type === 'user') {
                processAIMessage(message);
              }
            }}
          />
          </div>
          {designerMode && (
            <div className="w-1/2">
              <DesignTeamInterface />
            </div>
          )}
        </div>
      );
    } else if (activeTab === 'diagrams') {
      return (
        <MermaidDiagram
          diagram={generationProgress.files.find(file => file.type === 'mermaid')?.content}
          onDiagramGenerated={(files) => {
            // Add generated diagram files to the current generation progress
            setGenerationProgress(prev => ({
              ...prev,
              files: [
                ...prev.files,
                ...files.map(file => ({
                  path: file.path,
                  content: file.content,
                  type: file.type,
                  completed: true
                }))
              ]
            }));
            // Switch to generation tab to show the generated files
            setActiveTab('generation');
          }}
        />
      );
    } else if (activeTab === 'database') {
      return (
        <DatabaseExplorer className="w-full h-full" />
      );
    }
    return null;
  };

  // Core AI message processing logic (shared between chat and home screen)
  const processAIMessage = async (message: string) => {
    if (!message.trim()) return;
    
    // Check if user is signed in
    if (!isSignedIn) {
      addChatMessage('Please sign in to start chatting with AI.', 'system');
      return;
    }
    
    if (!aiEnabled) {
      addChatMessage('AI is disabled. Please enable it first.', 'system');
      return;
    }
    
    // Create sandbox automatically on first message if none exists
    if (!sandboxData) {
      console.log('[processAIMessage] No sandbox exists, creating one for user message...');
      addChatMessage('🚀 Setting up your development sandbox...', 'system');
      await createSandbox(true); // Pass true to indicate this is from message, not home screen
    }
    
    // Create or get current chat for this conversation
    let chatId = currentChatId;
    if (!chatId && isSignedIn) {
      try {
        // Generate chat title from first message (truncated to 50 chars)
        const chatTitle = message.length > 50 ? message.substring(0, 47) + '...' : message;
        console.log('[processAIMessage] Attempting to create chat with title:', chatTitle);
        chatId = await createChat({ title: chatTitle });
        setCurrentChatId(chatId);
        console.log('[processAIMessage] Successfully created new chat:', chatId);
        // Notify user that chat has been created and will be saved
        addChatMessage('💾 Chat created! Your conversation will be saved to history.', 'system');
      } catch (error: any) {
        console.error('[processAIMessage] Failed to create chat:', error);
        // Show user-friendly error message but continue without chat persistence
        addChatMessage('⚠️ Unable to save chat history - continuing in temporary mode. Check your connection or try signing out and back in.', 'system');
      }
    }
    
    // Save user message to Convex if we have a chat
    if (chatId && isSignedIn) {
      try {
        await createMessage({
          chatId: chatId,
          content: message.trim(),
          role: 'user'
        });
        console.log('[processAIMessage] Saved user message to Convex');
      } catch (error) {
        console.error('[processAIMessage] Failed to save message to Convex:', error);
      }
    }
    
    // Generate project name if this is a new project (no existing name and no sandbox yet)
    if (!projectName && !sandboxData) {
      addChatMessage('🎯 Analyzing your request and generating a perfect project name...', 'system');
      await generateProjectName(message);
    }
    
    // Check if message contains URLs and offer to scrape them
    // Only match explicit HTTP/HTTPS URLs to avoid false positives
    const urlRegex = /https?:\/\/[^\s<>{}[\]"'`]+\.[^\s<>{}[\]"'`]{2,}(?:\/[^\s<>{}[\]"'`]*)?/gi;
    const urls = message.match(urlRegex);
    
    if (urls && urls.length > 0) {
      addChatMessage(`I found a URL in your message: ${urls[0]}. Let me scrape it and incorporate the content into your request.`, 'system');
      
      try {
        let url = urls[0]?.trim();
        if (!url) {
          addChatMessage('Invalid URL found in message', 'system');
          // Continue processing the message without URL scraping
        } else {
        
        if (!url.match(/^https?:\/\//i)) {
          url = 'https://' + url;
        }
        
        const scrapeResponse = await fetch('/api/scrape-url-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          if (scrapeData.success) {
            // Store scraped data in conversation context
            setConversationContext(prev => ({
              ...prev,
              scrapedWebsites: [...prev.scrapedWebsites, {
                url: url,
                content: scrapeData,
                timestamp: new Date()
              }]
            }));
            
            addChatMessage(`Successfully scraped content from ${url}. Now I'll use this context for your request.`, 'system');
            
            // Update the message to include scraped context
            message = `${message}\n\nSCRAPED CONTENT FROM ${url}:\n${JSON.stringify(scrapeData, null, 2)}`;
          }
        }
        }
      } catch (error) {
        addChatMessage('Failed to scrape URL, but I\'ll process your request without the scraped content.', 'system');
      }
    }
    
    // Check for special commands
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'check packages' || lowerMessage === 'install packages' || lowerMessage === 'npm install') {
      if (!sandboxData) {
        addChatMessage('No active sandbox. Create a sandbox first!', 'system');
        return;
      }
      await checkAndInstallPackages();
      return;
    }

    // Check for diagram generation requests
    const diagramKeywords = ['diagram', 'flowchart', 'architecture', 'schema', 'flow', 'sequence', 'chart', 'visual', 'visualize', 'draw', 'show me how'];
    const isDiagramRequest = diagramKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isDiagramRequest) {
      addChatMessage('Creating diagram for you...', 'system');
      
      try {
        // Generate diagram based on the request
        let diagramCode = generateDiagramFromDescription(message);
        
        // If it's a more complex request, try to generate a custom diagram
        if (lowerMessage.includes('architecture') || lowerMessage.includes('system') || lowerMessage.includes('design')) {
          diagramCode = `graph TB
    User[👤 User] --> Frontend[⚛️ Frontend App]
    Frontend --> API[🔗 API Gateway]
    API --> Auth[🔐 Authentication]
    API --> Business[⚙️ Business Logic]
    Business --> DB[(🗄️ Database)]
    Business --> Cache[⚡ Cache]
    Business --> Queue[📮 Message Queue]
    
    style User fill:#3b82f6,color:#fff
    style Frontend fill:#10b981,color:#fff
    style API fill:#f59e0b,color:#fff
    style DB fill:#ef4444,color:#fff`;
        } else if (lowerMessage.includes('database') || lowerMessage.includes('schema')) {
          diagramCode = `erDiagram
    USERS {
        int id PK
        string name
        string email UK
        datetime created_at
    }
    
    POSTS {
        int id PK
        string title
        text content
        int user_id FK
        datetime created_at
    }
    
    COMMENTS {
        int id PK
        text content
        int user_id FK
        int post_id FK
        datetime created_at
    }
    
    USERS ||--o{ POSTS : creates
    USERS ||--o{ COMMENTS : writes
    POSTS ||--o{ COMMENTS : has`;
        } else if (lowerMessage.includes('flow') || lowerMessage.includes('process')) {
          diagramCode = `graph TD
    Start([Start]) --> Input[Get User Input]
    Input --> Validate{Valid Input?}
    Validate -->|No| Error[Show Error]
    Error --> Input
    Validate -->|Yes| Process[Process Data]
    Process --> Success{Success?}
    Success -->|No| ErrorHandle[Handle Error]
    Success -->|Yes| Output[Display Result]
    ErrorHandle --> Input
    Output --> End([End])
    
    style Start fill:#e1f5fe
    style Process fill:#e8f5e8
    style Output fill:#f3e5f5
    style End fill:#e8f5e8`;
        }
        
        // Add the diagram to generation progress
        setGenerationProgress(prev => ({
          ...prev,
          files: [
            ...prev.files,
            {
              path: 'docs/diagram.mmd',
              content: diagramCode,
              type: 'mermaid',
              completed: true
            }
          ]
        }));
        
        // Switch to diagrams tab to show the result
        setActiveTab('diagrams');
        
        addChatMessage('Diagram created! Check the Diagrams tab to view it.', 'system');
        return;
        
      } catch (error) {
        console.error('Error generating diagram:', error);
        addChatMessage('Sorry, I had trouble creating the diagram. Please try again with more specific details.', 'system');
        return;
      }
    }
    
    // Start sandbox creation in parallel if needed
    let sandboxPromise: Promise<void> | null = null;
    let sandboxCreating = false;
    
    if (!sandboxData) {
      sandboxCreating = true;
      addChatMessage('Creating sandbox while I plan your app...', 'system');
      sandboxPromise = createSandbox(true).catch((error: any) => {
        addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
        throw error;
      });
    }
    
    // Determine if this is an edit
    const isEdit = conversationContext.appliedCode.length > 0;
    
    try {
      // CRITICAL FIX: Always reset thinking state at the start of each message
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: true,
        status: 'Thinking...',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: true,
        isThinking: true,
        thinkingText: undefined,
        thinkingDuration: undefined,
        files: prev.files || [],
        currentFile: undefined,
        lastProcessedPosition: 0,
        isEdit
      }));

      // CRITICAL FIX: Add timeout to auto-clear thinking state after 30 seconds
      const thinkingTimeout = setTimeout(() => {
        console.warn('[Thinking Timeout] Auto-clearing thinking state after 30 seconds');
        setGenerationProgress(prev => ({
          ...prev,
          isThinking: false,
          status: 'Processing...',
          thinkingText: undefined
        }));
      }, 30000);
      
      const aiResponse = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: message,
          model: aiModel,
          context: {
            sandboxId: sandboxData?.sandboxId,
            structure: structureContent,
            conversationContext: conversationContext
          }
        })
      });
      
      if (!aiResponse.ok || !aiResponse.body) {
        throw new Error('Failed to generate AI response');
      }
      
      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      let explanation = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'thinking') {
                setGenerationProgress(prev => ({
                  ...prev,
                  isThinking: true,
                  thinkingText: data.content,
                  thinkingDuration: data.duration
                }));
              } else if (data.type === 'thinking_complete') {
                // IMPROVEMENT: Properly handle thinking_complete messages
                setGenerationProgress(prev => ({
                  ...prev,
                  isThinking: false,
                  thinkingDuration: data.duration
                }));
              } else if (data.type === 'reasoning_start') {
                // Handle Groq sequential reasoning start
                setGenerationProgress(prev => ({
                  ...prev,
                  isReasoning: true,
                  currentReasoningStep: data.step || (prev.currentReasoningStep || 0) + 1,
                  reasoningSteps: [
                    ...(prev.reasoningSteps || []),
                    { 
                      step: data.step || (prev.currentReasoningStep || 0) + 1, 
                      content: '', 
                      completed: false 
                    }
                  ]
                }));
              } else if (data.type === 'reasoning_complete') {
                // Handle Groq sequential reasoning completion
                setGenerationProgress(prev => ({
                  ...prev,
                  isReasoning: false,
                  reasoningSteps: prev.reasoningSteps?.map(step => 
                    step.step === data.step 
                      ? { ...step, content: data.content, completed: true }
                      : step
                  ) || []
                }));
              } else if (data.type === 'code') {
                generatedCode += data.content;
                setGenerationProgress(prev => ({
                  ...prev,
                  isThinking: false,
                  streamedCode: prev.streamedCode + data.content,
                  isStreaming: true
                }));
              } else if (data.type === 'explanation') {
                explanation += data.content;
              } else if (data.type === 'complete') {
                // IMPROVEMENT: Handle completion messages by clearing thinking state
                clearTimeout(thinkingTimeout);
                setGenerationProgress(prev => ({
                  ...prev,
                  isThinking: false,
                  status: 'Generation complete'
                }));
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e, 'Line:', line);
              // IMPROVEMENT: Don't let parsing errors affect the thinking state
            }
          }
        }
      }
      
      if (generatedCode) {
        // Wait for sandbox to be ready if it was being created
        if (sandboxCreating && sandboxPromise) {
          try {
            await sandboxPromise;
          } catch {
            addChatMessage('Sandbox creation failed. Cannot apply code.', 'system');
            return;
          }
        }
        
        if (sandboxData && generatedCode) {
          await applyGeneratedCode(generatedCode, isEdit);
        }
      }
      
      if (explanation) {
        addChatMessage(explanation, 'ai');
      }
      
      // CRITICAL FIX: Clear thinking state and timeout on successful completion
      clearTimeout(thinkingTimeout);
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined,
        status: ''
      }));
      
    } catch (error: any) {
      // CRITICAL FIX: Clear thinking timeout on error
      clearTimeout(thinkingTimeout);
      setChatMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
      addChatMessage(`Error: ${error.message}`, 'system');
      setGenerationProgress({
        isGenerating: false,
        status: '',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: false,
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined,
        files: [],
        currentFile: undefined,
        lastProcessedPosition: 0
      });
    }
  };

  const sendChatMessage = async () => {
    const message = aiChatInput.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    setAiChatInput('');
    
    await processAIMessage(message);
  };
  // OLD FUNCTION REMOVED - FUNCTIONALITY MOVED TO processAIMessage
  const sendChatMessageOld_REMOVED = async () => {
    const message = aiChatInput.trim();
    if (!message) return;
    
    // Check if user is signed in before allowing messages
    if (!isSignedIn) {
      addChatMessage('Please sign in to start chatting with AI.', 'system');
      return;
    }
    
    if (!aiEnabled) {
      addChatMessage('AI is disabled. Please enable it first.', 'system');
      return;
    }
    
    addChatMessage(message, 'user');
    setAiChatInput('');
    
    // Check for special commands
    const lowerMessage = message.toLowerCase().trim();
    if (lowerMessage === 'check packages' || lowerMessage === 'install packages' || lowerMessage === 'npm install') {
      if (!sandboxData) {
        addChatMessage('No active sandbox. Create a sandbox first!', 'system');
        return;
      }
      await checkAndInstallPackages();
      return;
    }
    
    // Start sandbox creation in parallel if needed
    let sandboxPromise: Promise<void> | null = null;
    let sandboxCreating = false;
    
    if (!sandboxData) {
      sandboxCreating = true;
      addChatMessage('Creating sandbox while I plan your app...', 'system');
      sandboxPromise = createSandbox(true).catch((error: any) => {
        addChatMessage(`Failed to create sandbox: ${error.message}`, 'system');
        throw error;
      });
    }
    
    // Determine if this is an edit
    const isEdit = conversationContext.appliedCode.length > 0;
    
    try {
      // Generation tab is already active from scraping phase
      setGenerationProgress(prev => ({
        ...prev,  // Preserve all existing state
        isGenerating: true,
        status: 'Starting AI generation...',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: false,
        isThinking: true,
        thinkingText: 'Analyzing your request...',
        thinkingDuration: undefined,
        currentFile: undefined,
        lastProcessedPosition: 0,
        // Add isEdit flag to generation progress
        isEdit: isEdit,
        // Keep existing files for edits - we'll mark edited ones differently
        files: prev.files
      }));
      
      // Backend now manages file state - no need to fetch from frontend
      console.log('[chat] Using backend file cache for context');
      
      const fullContext = {
        sandboxId: sandboxData?.sandboxId || (sandboxCreating ? 'pending' : null),
        structure: structureContent,
        recentMessages: chatMessages.slice(-20),
        conversationContext: conversationContext,
        currentCode: promptInput,
        sandboxUrl: sandboxData?.url,
        sandboxCreating: sandboxCreating
      };
      
      // Debug what we're sending
      console.log('[chat] Sending context to AI:');
      console.log('[chat] - sandboxId:', fullContext.sandboxId);
      console.log('[chat] - isEdit:', conversationContext.appliedCode.length > 0);
      
      const response = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          model: aiModel,
          context: fullContext,
          isEdit: conversationContext.appliedCode.length > 0
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      let explanation = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status') {
                  setGenerationProgress(prev => ({ ...prev, status: data.message }));
                } else if (data.type === 'thinking') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: true,
                    thinkingText: (prev.thinkingText || '') + data.text
                  }));
                } else if (data.type === 'thinking_complete') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: false,
                    thinkingDuration: data.duration
                  }));
                } else if (data.type === 'conversation') {
                  // Add conversational text to chat only if it's not code
                  let text = data.text || '';
                  
                  // Remove package tags from the text
                  text = text.replace(/<package>[^<]*<\/package>/g, '');
                  text = text.replace(/<packages>[^<]*<\/packages>/g, '');
                  
                  // Filter out any XML tags and file content that slipped through
                  if (!text.includes('<file') && !text.includes('import React') && 
                      !text.includes('export default') && !text.includes('className=') &&
                      text.trim().length > 0) {
                    addChatMessage(text.trim(), 'ai');
                  }
                } else if (data.type === 'stream' && data.raw) {
                  setGenerationProgress(prev => {
                    const newStreamedCode = prev.streamedCode + data.text;
                    
                    // Tab is already switched after scraping
                    
                    const updatedState = { 
                      ...prev, 
                      streamedCode: newStreamedCode,
                      isStreaming: true,
                      isThinking: false,
                      status: 'Generating code...'
                    };
                    
                    // Process complete files from the accumulated stream
                    const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
                    let match;
                    const processedFiles = new Set(prev.files.map(f => f.path));
                    
                    while ((match = fileRegex.exec(newStreamedCode)) !== null) {
                      const filePath = match[1];
                      const fileContent = match[2];
                      
                      // Only add if we haven't processed this file yet
                      if (!processedFiles.has(filePath)) {
                        const fileExt = filePath.split('.').pop() || '';
                        const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                        fileExt === 'css' ? 'css' :
                                        fileExt === 'json' ? 'json' :
                                        fileExt === 'html' ? 'html' : 'text';
                        
                        // Check if file already exists
                        const existingFileIndex = updatedState.files.findIndex(f => f.path === filePath);
                        
                        if (existingFileIndex >= 0) {
                          // Update existing file and mark as edited
                          updatedState.files = [
                            ...updatedState.files.slice(0, existingFileIndex),
                            {
                              ...updatedState.files[existingFileIndex],
                              content: fileContent.trim(),
                              type: fileType,
                              completed: true,
                              // edited: true
                            },
                            ...updatedState.files.slice(existingFileIndex + 1)
                          ];
                        } else {
                          // Add new file
                          updatedState.files = [...updatedState.files, {
                            path: filePath,
                            content: fileContent.trim(),
                            type: fileType,
                            completed: true,
                            // edited: false
                          }];
                        }
                        
                        // Only show file status if not in edit mode
                        if (!prev.isEdit) {
                          updatedState.status = `Completed ${filePath}`;
                        }
                        processedFiles.add(filePath);
                      }
                    }
                    
                    // Check for current file being generated (incomplete file at the end)
                    const lastFileMatch = newStreamedCode.match(/<file path="([^"]+)">([^]*?)$/);
                    if (lastFileMatch && !lastFileMatch[0].includes('</file>')) {
                      const filePath = lastFileMatch[1];
                      const partialContent = lastFileMatch[2];
                      
                      if (!processedFiles.has(filePath)) {
                        const fileExt = filePath.split('.').pop() || '';
                        const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                        fileExt === 'css' ? 'css' :
                                        fileExt === 'json' ? 'json' :
                                        fileExt === 'html' ? 'html' : 'text';
                        
                        updatedState.currentFile = { 
                          path: filePath, 
                          content: partialContent, 
                          type: fileType 
                        };
                        // Only show file status if not in edit mode
                        if (!prev.isEdit) {
                          updatedState.status = `Generating ${filePath}`;
                        }
                      }
                    } else {
                      updatedState.currentFile = undefined;
                    }
                    
                    return updatedState;
                  });
                } else if (data.type === 'app') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    status: 'Generated App.jsx structure'
                  }));
                } else if (data.type === 'component') {
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: `Generated ${data.name}`,
                    components: [...prev.components, { 
                      name: data.name, 
                      path: data.path, 
                      completed: true 
                    }],
                    currentComponent: data.index
                  }));
                } else if (data.type === 'package') {
                  // Handle package installation from tool calls
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: data.message || `Installing ${data.name}`
                  }));
                } else if (data.type === 'complete') {
                  generatedCode = data.generatedCode;
                  explanation = data.explanation;
                  
                  // Save the last generated code
                  setConversationContext(prev => ({
                    ...prev,
                    lastGeneratedCode: generatedCode
                  }));
                  
                  // Clear thinking state when generation completes
                  setGenerationProgress(prev => ({
                    ...prev,
                    isThinking: false,
                    thinkingText: undefined,
                    thinkingDuration: undefined
                  }));
                  
                  // Store packages to install from tool calls
                  if (data.packagesToInstall && data.packagesToInstall.length > 0) {
                    console.log('[generate-code] Packages to install from tools:', data.packagesToInstall);
                    // Store packages globally for later installation
                    (window as any).pendingPackages = data.packagesToInstall;
                  }
                  
                  // Parse all files from the completed code if not already done
                  const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
                  const parsedFiles: Array<{path: string; content: string; type: string; completed: boolean}> = [];
                  let fileMatch;
                  
                  while ((fileMatch = fileRegex.exec(data.generatedCode)) !== null) {
                    const filePath = fileMatch[1];
                    const fileContent = fileMatch[2];
                    const fileExt = filePath.split('.').pop() || '';
                    const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                    fileExt === 'css' ? 'css' :
                                    fileExt === 'json' ? 'json' :
                                    fileExt === 'html' ? 'html' : 'text';
                    
                    parsedFiles.push({
                      path: filePath,
                      content: fileContent.trim(),
                      type: fileType,
                      completed: true
                    });
                  }
                  
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: `Generated ${parsedFiles.length > 0 ? parsedFiles.length : prev.files.length} file${(parsedFiles.length > 0 ? parsedFiles.length : prev.files.length) !== 1 ? 's' : ''}!`,
                    isGenerating: false,
                    isStreaming: false,
                    isEdit: prev.isEdit,
                    // Keep the files that were already parsed during streaming
                    files: prev.files.length > 0 ? prev.files : parsedFiles
                  }));
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
      }
      
      if (generatedCode) {
        // Parse files from generated code for metadata
        const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
        const generatedFiles = [];
        let match;
        while ((match = fileRegex.exec(generatedCode)) !== null) {
          generatedFiles.push(match[1]);
        }
        
        // Show appropriate message based on edit mode
        if (isEdit && generatedFiles.length > 0) {
          // For edits, show which file(s) were edited
          const editedFileNames = generatedFiles.map(f => f.split('/').pop()).join(', ');
          addChatMessage(
            explanation || `Updated ${editedFileNames}`,
            'ai',
            {
              appliedFiles: [generatedFiles[0]] // Only show the first edited file
            }
          );
        } else {
          // For new generation, show all files
          addChatMessage(explanation || 'Code generated!', 'ai', {
            appliedFiles: generatedFiles
          });
        }
        
        setPromptInput(generatedCode);
        // Don't show the Generated Code panel by default
        // setLeftPanelVisible(true);
        
        // Wait for sandbox creation if it's still in progress
        if (sandboxPromise) {
          addChatMessage('Waiting for sandbox to be ready...', 'system');
          try {
            await sandboxPromise;
            // Remove the waiting message
            setChatMessages(prev => prev.filter(msg => msg.content !== 'Waiting for sandbox to be ready...'));
          } catch {
            addChatMessage('Sandbox creation failed. Cannot apply code.', 'system');
            return;
          }
        }
        
        if (sandboxData && generatedCode) {
          // Use isEdit flag that was determined at the start
          await applyGeneratedCode(generatedCode, isEdit);
        }
      }
      
      // Show completion status briefly then switch to preview
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        status: 'Generation complete!',
        isEdit: prev.isEdit,
        // Clear thinking state on completion
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined
      }));
      
      setTimeout(() => {
        // Switch to preview but keep files for display
        setActiveTab('preview');
      }, 1000); // Reduced from 3000ms to 1000ms
    } catch (error: any) {
      setChatMessages(prev => prev.filter(msg => msg.content !== 'Thinking...'));
      addChatMessage(`Error: ${error.message}`, 'system');
      // Reset generation progress and switch back to preview on error
      setGenerationProgress({
        isGenerating: false,
        status: '',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: false,
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined,
        files: [],
        currentFile: undefined,
        lastProcessedPosition: 0
      });
      setActiveTab('preview');
    }
  };


  const downloadZip = async () => {
    if (!sandboxData) {
      addChatMessage('No active sandbox to download. Create a sandbox first!', 'system');
      return;
    }
    
    setLoading(true);
    log('Creating zip file...');
    addChatMessage('Creating ZIP file of your Vite app...', 'system');
    
    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        log('Zip file created!');
        addChatMessage('ZIP file created! Download starting...', 'system');
        
        const link = document.createElement('a');
        link.href = data.dataUrl;
        link.download = data.fileName || 'e2b-project.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addChatMessage(
          'Your Vite app has been downloaded! To run it locally:\n' +
          '1. Unzip the file\n' +
          '2. Run: npm install\n' +
          '3. Run: npm run dev\n' +
          '4. Open http://localhost:5173',
          'system'
        );
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      log(`Failed to create zip: ${error.message}`, 'error');
      addChatMessage(`Failed to create ZIP: ${error.message}`, 'system');
    } finally {
      setLoading(false);
    }
  };

  const reapplyLastGeneration = async () => {
    if (!conversationContext.lastGeneratedCode) {
      addChatMessage('No previous generation to re-apply', 'system');
      return;
    }
    
    if (!sandboxData) {
      addChatMessage('Please create a sandbox first', 'system');
      return;
    }
    
    addChatMessage('Re-applying last generation...', 'system');
    const isEdit = conversationContext.appliedCode.length > 0;
    await applyGeneratedCode(conversationContext.lastGeneratedCode, isEdit);
  };

  // Auto-scroll code display to bottom when streaming
  useEffect(() => {
    if (codeDisplayRef.current && generationProgress.isStreaming) {
      codeDisplayRef.current.scrollTop = codeDisplayRef.current.scrollHeight;
    }
  }, [generationProgress.streamedCode, generationProgress.isStreaming]);

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = async (filePath: string) => {
    setSelectedFile(filePath);
    // TODO: Add file content fetching logic here
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (ext === 'jsx' || ext === 'js') {
      return <SiJavascript className="w-4 h-4 text-yellow-500" />;
    } else if (ext === 'tsx' || ext === 'ts') {
      return <SiReact className="w-4 h-4 text-blue-500" />;
    } else if (ext === 'css') {
      return <SiCss3 className="w-4 h-4 text-blue-500" />;
    } else if (ext === 'json') {
      return <SiJson className="w-4 h-4 text-gray-600" />;
    } else {
      return <FiFile className="w-4 h-4 text-gray-600" />;
    }
  };

  const clearChatHistory = () => {
    setChatMessages([{
      content: 'Chat history cleared. How can I help you?',
      type: 'system',
      timestamp: new Date()
    }]);
  };


  const cloneWebsite = async () => {
    let url = urlInput.trim();
    if (!url) {
      // setUrlStatus(prev => [...prev, 'Please enter a URL']);
      return;
    }
    
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    // setUrlStatus([`Using: ${url}`, 'Starting to scrape...']);
    
    setUrlOverlayVisible(false);
    
    // Remove protocol for cleaner display
    const cleanUrl = url.replace(/^https?:\/\//i, '');
    addChatMessage(`Starting to clone ${cleanUrl}...`, 'system');
    
    // Capture screenshot immediately and switch to preview tab
    captureUrlScreenshot(url);
    
    try {
      addChatMessage('Scraping website content...', 'system');
      const scrapeResponse = await fetch('/api/scrape-url-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!scrapeResponse.ok) {
        throw new Error(`Scraping failed: ${scrapeResponse.status}`);
      }
      
      const scrapeData = await scrapeResponse.json();
      
      if (!scrapeData.success) {
        throw new Error(scrapeData.error || 'Failed to scrape website');
      }
      
      addChatMessage(`Scraped ${scrapeData.content.length} characters from ${url}`, 'system');
      
      // Clear preparing design state and switch to generation tab
      setIsPreparingDesign(false);
      setActiveTab('generation');
      
      setConversationContext(prev => ({
        ...prev,
        scrapedWebsites: [...prev.scrapedWebsites, {
          url,
          content: scrapeData,
          timestamp: new Date()
        }],
        currentProject: `Clone of ${url}`
      }));
      
      // Start sandbox creation in parallel with code generation
      let sandboxPromise: Promise<void> | null = null;
      if (!sandboxData) {
        addChatMessage('Creating sandbox while generating your React app...', 'system');
        sandboxPromise = createSandbox(true);
      }
      
      addChatMessage('Analyzing and generating React recreation...', 'system');
      
      const recreatePrompt = `I scraped this website and want you to recreate it as a modern React application.

URL: ${url}

SCRAPED CONTENT:
${scrapeData.content}

${homeContextInput ? `ADDITIONAL CONTEXT/REQUIREMENTS FROM USER:
${homeContextInput}

Please incorporate these requirements into the design and implementation.` : ''}

REQUIREMENTS:
1. Create a COMPLETE React application with App.jsx as the main component
2. App.jsx MUST import and render all other components
3. Recreate the main sections and layout from the scraped content
4. ${homeContextInput ? `Apply the user's context/theme: "${homeContextInput}"` : `Use a modern dark theme with excellent contrast:
   - Background: #0a0a0a
   - Text: #ffffff
   - Links: #60a5fa
   - Accent: #3b82f6`}
5. Make it fully responsive
6. Include hover effects and smooth transitions
7. Create separate components for major sections (Header, Hero, Features, etc.)
8. Use semantic HTML5 elements

IMPORTANT CONSTRAINTS:
- DO NOT use React Router or any routing libraries
- Use regular <a> tags with href="#section" for navigation, NOT Link or NavLink components
- This is a single-page application, no routing needed
- ALWAYS create src/App.jsx that imports ALL components
- Each component should be in src/components/
- Use Tailwind CSS for ALL styling (no custom CSS files)
- Make sure the app actually renders visible content
- Create ALL components that you reference in imports

IMAGE HANDLING RULES:
- When the scraped content includes images, USE THE ORIGINAL IMAGE URLS whenever appropriate
- Keep existing images from the scraped site (logos, product images, hero images, icons, etc.)
- Use the actual image URLs provided in the scraped content, not placeholders
- Only use placeholder images or generic services when no real images are available
- For company logos and brand images, ALWAYS use the original URLs to maintain brand identity
- If scraped data contains image URLs, include them in your img tags
- Example: If you see "https://example.com/logo.png" in the scraped content, use that exact URL

Focus on the key sections and content, making it clean and modern while preserving visual assets.`;
      
      setGenerationProgress(prev => ({
        isGenerating: true,
        status: 'Initializing AI...',
        components: [],
        currentComponent: 0,
        streamedCode: '',
        isStreaming: true,
        isThinking: false,
        thinkingText: undefined,
        thinkingDuration: undefined,
        // Keep previous files until new ones are generated
        files: prev.files || [],
        currentFile: undefined,
        lastProcessedPosition: 0
      }));
      
      // Switch to generation tab when starting
      setActiveTab('generation');
      
      const aiResponse = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: recreatePrompt,
          model: aiModel,
          context: {
            sandboxId: sandboxData?.id,
            structure: structureContent,
            conversationContext: conversationContext
          }
        })
      });
      
      if (!aiResponse.ok) {
        throw new Error(`AI generation failed: ${aiResponse.status}`);
      }
      
      const reader = aiResponse.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';
      let explanation = '';
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status') {
                  setGenerationProgress(prev => ({ ...prev, status: data.message }));
                } else if (data.type === 'thinking') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: true,
                    thinkingText: (prev.thinkingText || '') + data.text
                  }));
                } else if (data.type === 'thinking_complete') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: false,
                    thinkingDuration: data.duration
                  }));
                } else if (data.type === 'conversation') {
                  // Add conversational text to chat only if it's not code
                  let text = data.text || '';
                  
                  // Remove package tags from the text
                  text = text.replace(/<package>[^<]*<\/package>/g, '');
                  text = text.replace(/<packages>[^<]*<\/packages>/g, '');
                  
                  // Filter out any XML tags and file content that slipped through
                  if (!text.includes('<file') && !text.includes('import React') && 
                      !text.includes('export default') && !text.includes('className=') &&
                      text.trim().length > 0) {
                    addChatMessage(text.trim(), 'ai');
                  }
                } else if (data.type === 'stream' && data.raw) {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    streamedCode: prev.streamedCode + data.text,
                    lastProcessedPosition: prev.lastProcessedPosition || 0
                  }));
                } else if (data.type === 'component') {
                  setGenerationProgress(prev => ({
                    ...prev,
                    status: `Generated ${data.name}`,
                    components: [...prev.components, { 
                      name: data.name,
                      path: data.path,
                      completed: true
                    }],
                    currentComponent: prev.currentComponent + 1
                  }));
                } else if (data.type === 'complete') {
                  generatedCode = data.generatedCode;
                  explanation = data.explanation;
                  
                  // Save the last generated code
                  setConversationContext(prev => ({
                    ...prev,
                    lastGeneratedCode: generatedCode
                  }));
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
      
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        status: 'Generation complete!',
        isEdit: prev.isEdit
      }));
      
      if (generatedCode) {
        addChatMessage('AI recreation generated!', 'system');
        
        // Add the explanation to chat if available
        if (explanation && explanation.trim()) {
          addChatMessage(explanation, 'ai');
        }
        
        setPromptInput(generatedCode);
        // Don't show the Generated Code panel by default
        // setLeftPanelVisible(true);
        
        // Wait for sandbox creation if it's still in progress
        if (sandboxPromise) {
          addChatMessage('Waiting for sandbox to be ready...', 'system');
          try {
            await sandboxPromise;
            // Remove the waiting message
            setChatMessages(prev => prev.filter(msg => msg.content !== 'Waiting for sandbox to be ready...'));
          } catch (error: any) {
            addChatMessage('Sandbox creation failed. Cannot apply code.', 'system');
            throw error;
          }
        }
        
        // First application for cloned site should not be in edit mode
        await applyGeneratedCode(generatedCode, false);
        
        addChatMessage(
          `Successfully recreated ${url} as a modern React app${homeContextInput ? ` with your requested context: "${homeContextInput}"` : ''}! The scraped content is now in my context, so you can ask me to modify specific sections or add features based on the original site.`, 
          'ai',
          {
            scrapedUrl: url,
            scrapedContent: scrapeData,
            generatedCode: generatedCode
          }
        );
        
        setUrlInput('');
        // setUrlStatus([]);
        setHomeContextInput('');
        
        // Clear generation progress and all screenshot/design states
        setGenerationProgress(prev => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          status: 'Generation complete!'
        }));
        
        // Clear screenshot and preparing design states to prevent them from showing on next run
        setUrlScreenshot(null);
        setIsPreparingDesign(false);
        setTargetUrl('');
        setScreenshotError(null);
        setLoadingStage(null); // Clear loading stage
        
        setTimeout(() => {
          // Switch back to preview tab but keep files
          setActiveTab('preview');
        }, 1000); // Show completion briefly then switch
      } else {
        throw new Error('Failed to generate recreation');
      }
      
    } catch (error: any) {
      addChatMessage(`Failed to clone website: ${error.message}`, 'system');
      // setUrlStatus([]);
      setIsPreparingDesign(false);
      // Clear all states on error
      setUrlScreenshot(null);
      setTargetUrl('');
      setScreenshotError(null);
      setLoadingStage(null);
      setGenerationProgress(prev => ({
        ...prev,
        isGenerating: false,
        isStreaming: false,
        status: '',
        // Keep files to display in sidebar
        files: prev.files
      }));
      setActiveTab('preview');
    }
  };

  const captureUrlScreenshot = async (url: string) => {
    // Validate URL before proceeding
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
      setScreenshotError('URL is required');
      return;
    }
    
    setIsCapturingScreenshot(true);
    setScreenshotError(null);
    try {
      const response = await fetch('/api/scrape-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl })
      });
      
      const data = await response.json();
      if (data.success && data.screenshot) {
        setUrlScreenshot(data.screenshot);
        // Set preparing design state
        setIsPreparingDesign(true);
        // Store the clean URL for display
        const cleanUrl = url.replace(/^https?:\/\//i, '');
        setTargetUrl(cleanUrl);
        // Switch to preview tab to show the screenshot
        if (activeTab !== 'preview') {
          setActiveTab('preview');
        }
      } else {
        setScreenshotError(data.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      setScreenshotError('Network error while capturing screenshot');
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const generateProjectName = async (userInput?: string, url?: string, fileContents?: any[], existingNames?: string[]) => {
    setIsGeneratingName(true);
    try {
      const response = await fetch('/api/generate-project-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput,
          url,
          fileContents,
          existingNames
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setProjectName(data.projectName);
        return data.projectName;
      } else {
        // Use fallback name if AI generation fails
        const fallbackName = data.fallbackName || 'Untitled Project';
        setProjectName(fallbackName);
        return fallbackName;
      }
    } catch (error) {
      console.error('Failed to generate project name:', error);
      const fallbackName = 'Untitled Project';
      setProjectName(fallbackName);
      return fallbackName;
    } finally {
      setIsGeneratingName(false);
    }
  };

  const handleHomeScreenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeUrlInput.trim()) return;
    
    // Check if user is signed in before allowing URL submission
    if (!isSignedIn) {
      addChatMessage('Please sign in to start building.', 'system');
      return;
    }
    
    setHomeScreenFading(true);
    
    // Clear messages
    setChatMessages([]);
    const userInput = homeUrlInput.trim();
    
    // Check if input contains a URL - be more lenient here since home screen is more likely to have URLs
    const urlRegex = /https?:\/\/[^\s<>{}[\]"'`]+\.[^\s<>{}[\]"'`]{2,}(?:\/[^\s<>{}[\]"'`]*)?|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>{}[\]"'`]*)?/gi;
    const urls = userInput.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Handle URL-based generation
      let displayUrl = urls[0];
      if (!displayUrl.match(/^https?:\/\//i)) {
        displayUrl = 'https://' + displayUrl;
      }
      const cleanUrl = displayUrl.replace(/^https?:\/\//i, '');
      addChatMessage(`Starting to clone ${cleanUrl}...`, 'system');
      
      // Start creating sandbox and capturing screenshot immediately in parallel
      const sandboxPromise = !sandboxData ? createSandbox(true) : Promise.resolve();
      
      // Only capture screenshot if we don't already have a sandbox (first generation)
      if (!sandboxData) {
        captureUrlScreenshot(displayUrl);
      }
      
      // Set loading stage immediately before hiding home screen
      setLoadingStage('gathering');
      // Also ensure we're on preview tab to show the loading overlay
      setActiveTab('preview');
      
      setTimeout(async () => {
        setShowHomeScreen(false);
        setHomeScreenFading(false);
        
        // Wait for sandbox to be ready (if it's still creating)
        await sandboxPromise;
      
        // Now start the clone process which will stream the generation
        setUrlOverlayVisible(false); // Make sure overlay is closed
        // setUrlStatus(['Scraping website content...']);
        
        try {
          // Scrape the website
          const url = displayUrl?.trim();
          if (!url) {
            throw new Error('No URL provided for scraping');
          }
        
        // Screenshot is already being captured in parallel above
        
        const scrapeResponse = await fetch('/api/scrape-url-enhanced', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        if (!scrapeResponse.ok) {
          throw new Error('Failed to scrape website');
        }
        
        const scrapeData = await scrapeResponse.json();
        
        if (!scrapeData.success) {
          throw new Error(scrapeData.error || 'Failed to scrape website');
        }
        
        // setUrlStatus(['Website scraped successfully!', 'Generating React app...']);
        
        // Clear preparing design state and switch to generation tab
        setIsPreparingDesign(false);
        setUrlScreenshot(null); // Clear screenshot when starting generation
        setTargetUrl(''); // Clear target URL
        
        // Update loading stage to planning
        setLoadingStage('planning');
        
        // Brief pause before switching to generation tab
        setTimeout(() => {
          setLoadingStage('generating');
          setActiveTab('generation');
        }, 1500);
        
        // Generate AI project name for URL clone
        addChatMessage('🎯 Generating a perfect name for this cloned project...', 'system');
        await generateProjectName(undefined, url);
        
        // Store scraped data in conversation context
        setConversationContext(prev => ({
          ...prev,
          scrapedWebsites: [...prev.scrapedWebsites, {
            url: url,
            content: scrapeData,
            timestamp: new Date()
          }],
          currentProject: projectName || `${url} Clone`
        }));
        
        const prompt = `I want to recreate the ${url} website as a complete React application based on the scraped content below.

${JSON.stringify(scrapeData, null, 2)}

${homeContextInput ? `ADDITIONAL CONTEXT/REQUIREMENTS FROM USER:
${homeContextInput}

Please incorporate these requirements into the design and implementation.` : ''}

IMPORTANT INSTRUCTIONS:
- Create a COMPLETE, working React application
- Implement ALL sections and features from the original site
- Use Tailwind CSS for all styling (no custom CSS files)
- Make it responsive and modern
- Ensure all text content matches the original
- Create proper component structure
- Make sure the app actually renders visible content
- Create ALL components that you reference in imports
${homeContextInput ? '- Apply the user\'s context/theme requirements throughout the application' : ''}

Focus on the key sections and content, making it clean and modern.`;
        
        setGenerationProgress(prev => ({
          isGenerating: true,
          status: 'Initializing AI...',
          components: [],
          currentComponent: 0,
          streamedCode: '',
          isStreaming: true,
          isThinking: false,
          thinkingText: undefined,
          thinkingDuration: undefined,
          // Keep previous files until new ones are generated
          files: prev.files || [],
          currentFile: undefined,
          lastProcessedPosition: 0
        }));
        
        const aiResponse = await fetch('/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt,
            model: aiModel,
            context: {
              sandboxId: sandboxData?.sandboxId,
              structure: structureContent,
              conversationContext: conversationContext
            }
          })
        });
        
        if (!aiResponse.ok || !aiResponse.body) {
          throw new Error('Failed to generate code');
        }
        
        const reader = aiResponse.body.getReader();
        const decoder = new TextDecoder();
        let generatedCode = '';
        let explanation = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'status') {
                  setGenerationProgress(prev => ({ ...prev, status: data.message }));
                } else if (data.type === 'thinking') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: true,
                    thinkingText: (prev.thinkingText || '') + data.text
                  }));
                } else if (data.type === 'thinking_complete') {
                  setGenerationProgress(prev => ({ 
                    ...prev, 
                    isThinking: false,
                    thinkingDuration: data.duration
                  }));
                } else if (data.type === 'conversation') {
                  // Add conversational text to chat only if it's not code
                  let text = data.text || '';
                  
                  // Remove package tags from the text
                  text = text.replace(/<package>[^<]*<\/package>/g, '');
                  text = text.replace(/<packages>[^<]*<\/packages>/g, '');
                  
                  // Filter out any XML tags and file content that slipped through
                  if (!text.includes('<file') && !text.includes('import React') && 
                      !text.includes('export default') && !text.includes('className=') &&
                      text.trim().length > 0) {
                    addChatMessage(text.trim(), 'ai');
                  }
                } else if (data.type === 'stream' && data.raw) {
                  setGenerationProgress(prev => {
                    const newStreamedCode = prev.streamedCode + data.text;
                    
                    // Tab is already switched after scraping
                    
                    const updatedState = { 
                      ...prev, 
                      streamedCode: newStreamedCode,
                      isStreaming: true,
                      isThinking: false,
                      status: 'Generating code...'
                    };
                    
                    // Process complete files from the accumulated stream
                    const fileRegex = /<file path="([^"]+)">([^]*?)<\/file>/g;
                    let match;
                    const processedFiles = new Set(prev.files.map(f => f.path));
                    
                    while ((match = fileRegex.exec(newStreamedCode)) !== null) {
                      const filePath = match[1];
                      const fileContent = match[2];
                      
                      // Only add if we haven't processed this file yet
                      if (!processedFiles.has(filePath)) {
                        const fileExt = filePath.split('.').pop() || '';
                        const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                        fileExt === 'css' ? 'css' :
                                        fileExt === 'json' ? 'json' :
                                        fileExt === 'html' ? 'html' : 'text';
                        
                        // Check if file already exists
                        const existingFileIndex = updatedState.files.findIndex(f => f.path === filePath);
                        
                        if (existingFileIndex >= 0) {
                          // Update existing file and mark as edited
                          updatedState.files = [
                            ...updatedState.files.slice(0, existingFileIndex),
                            {
                              ...updatedState.files[existingFileIndex],
                              content: fileContent.trim(),
                              type: fileType,
                              completed: true,
                              // edited: true
                            },
                            ...updatedState.files.slice(existingFileIndex + 1)
                          ];
                        } else {
                          // Add new file
                          updatedState.files = [...updatedState.files, {
                            path: filePath,
                            content: fileContent.trim(),
                            type: fileType,
                            completed: true,
                            // edited: false
                          }];
                        }
                        
                        // Only show file status if not in edit mode
                        if (!prev.isEdit) {
                          updatedState.status = `Completed ${filePath}`;
                        }
                        processedFiles.add(filePath);
                      }
                    }
                    
                    // Check for current file being generated (incomplete file at the end)
                    const lastFileMatch = newStreamedCode.match(/<file path="([^"]+)">([^]*?)$/);
                    if (lastFileMatch && !lastFileMatch[0].includes('</file>')) {
                      const filePath = lastFileMatch[1];
                      const partialContent = lastFileMatch[2];
                      
                      if (!processedFiles.has(filePath)) {
                        const fileExt = filePath.split('.').pop() || '';
                        const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                        fileExt === 'css' ? 'css' :
                                        fileExt === 'json' ? 'json' :
                                        fileExt === 'html' ? 'html' : 'text';
                        
                        updatedState.currentFile = { 
                          path: filePath, 
                          content: partialContent, 
                          type: fileType 
                        };
                        // Only show file status if not in edit mode
                        if (!prev.isEdit) {
                          updatedState.status = `Generating ${filePath}`;
                        }
                      }
                    } else {
                      updatedState.currentFile = undefined;
                    }
                    
                    return updatedState;
                  });
                } else if (data.type === 'complete') {
                  generatedCode = data.generatedCode;
                  explanation = data.explanation;
                  
                  // Save the last generated code
                  setConversationContext(prev => ({
                    ...prev,
                    lastGeneratedCode: generatedCode
                  }));
                }
              } catch (e) {
                console.error('Failed to parse SSE data:', e);
              }
            }
          }
        }
        
        setGenerationProgress(prev => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          status: 'Generation complete!'
        }));
        
        if (generatedCode) {
          addChatMessage('AI recreation generated!', 'system');
          
          // Add the explanation to chat if available
          if (explanation && explanation.trim()) {
            addChatMessage(explanation, 'ai');
          }
          
          setPromptInput(generatedCode);
          
          // First application for cloned site should not be in edit mode
          await applyGeneratedCode(generatedCode, false);
          
          addChatMessage(
            `Successfully recreated ${url} as a modern React app${homeContextInput ? ` with your requested context: "${homeContextInput}"` : ''}! The scraped content is now in my context, so you can ask me to modify specific sections or add features based on the original site.`, 
            'ai',
            {
              scrapedUrl: url,
              scrapedContent: scrapeData,
              generatedCode: generatedCode
            }
          );
          
          setConversationContext(prev => ({
            ...prev,
            generatedComponents: [],
            appliedCode: [...prev.appliedCode, {
              files: [],
              timestamp: new Date()
            }]
          }));
        } else {
          throw new Error('Failed to generate recreation');
        }
        
        setUrlInput('');
        // setUrlStatus([]);
        setHomeContextInput('');
        
        // Clear generation progress and all screenshot/design states
        setGenerationProgress(prev => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          status: 'Generation complete!'
        }));
        
        // Clear screenshot and preparing design states to prevent them from showing on next run
        setUrlScreenshot(null);
        setIsPreparingDesign(false);
        setTargetUrl('');
        setScreenshotError(null);
        setLoadingStage(null); // Clear loading stage
        
        setTimeout(() => {
          // Switch back to preview tab but keep files
          setActiveTab('preview');
        }, 1000); // Show completion briefly then switch
      } catch (error: any) {
        addChatMessage(`Failed to clone website: ${error.message}`, 'system');
        // setUrlStatus([]);
        setIsPreparingDesign(false);
        // Also clear generation progress on error
        setGenerationProgress(prev => ({
          ...prev,
          isGenerating: false,
          isStreaming: false,
          status: '',
          // Keep files to display in sidebar
          files: prev.files
        }));
      }
    }, 500);
    } else {
      // Handle non-URL input (regular chat message)
      addChatMessage(`Let's build: ${userInput}`, 'system');
      
      setTimeout(async () => {
        setShowHomeScreen(false);
        setHomeScreenFading(false);
        
        // Start creating sandbox if needed
        const sandboxPromise = !sandboxData ? createSandbox(true) : Promise.resolve();
        
        // Wait for sandbox to be ready
        await sandboxPromise;
        
        // Add user's message to chat and trigger AI response
        addChatMessage(userInput, 'user');
        setActiveTab('generation');
        
        // Trigger AI response directly by mimicking sendChatMessage logic
        setTimeout(async () => {
          await processAIMessage(userInput);
        }, 100);
        
      }, 300);
    }
  };

  return (
    <div className="font-sans bg-background text-foreground h-screen flex flex-col">
      {/* Home Screen Overlay */}
      {showHomeScreen && (
        <div className={`fixed inset-0 z-50 transition-opacity duration-500 ${homeScreenFading ? 'opacity-0' : 'opacity-100'}`}>
          {/* Simple Sun Gradient Background */}
          <div className="absolute inset-0 bg-white overflow-hidden">
            {/* Main Sun - Pulsing */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-orange-400/50 via-orange-300/30 to-transparent rounded-full blur-[80px] animate-[sunPulse_4s_ease-in-out_infinite]" />
            
            {/* Inner Sun Core - Brighter */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-yellow-300/40 via-orange-400/30 to-transparent rounded-full blur-[40px] animate-[sunPulse_4s_ease-in-out_infinite_0.5s]" />
            
            {/* Outer Glow - Subtle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-radial from-orange-200/20 to-transparent rounded-full blur-[120px]" />
            
            {/* Giant Glowing Orb - Center Bottom */}
            <div className="absolute bottom-0 left-1/2 w-[800px] h-[800px] animate-[orbShrink_3s_ease-out_forwards]" style={{ transform: 'translateX(-50%) translateY(45%)' }}>
              <div className="relative w-full h-full">
                <div className="absolute inset-0 bg-orange-600 rounded-full blur-[100px] opacity-30 animate-pulse"></div>
                <div className="absolute inset-16 bg-orange-500 rounded-full blur-[80px] opacity-40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                <div className="absolute inset-32 bg-orange-400 rounded-full blur-[60px] opacity-50 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                <div className="absolute inset-48 bg-yellow-300 rounded-full blur-[40px] opacity-60"></div>
              </div>
            </div>
          </div>
          
          
          {/* Close button on hover */}
          <button
            onClick={() => {
              setHomeScreenFading(true);
              setTimeout(() => {
                setShowHomeScreen(false);
                setHomeScreenFading(false);
              }, 500);
            }}
            className="absolute top-8 right-8 text-gray-500 hover:text-gray-700 transition-all duration-300 opacity-0 hover:opacity-100 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-sm"
            style={{ opacity: 0 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between animate-[fadeIn_0.8s_ease-out]">
            <div className="flex items-center gap-2">
              <div className="text-yellow-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">zapdev</span>
            </div>
            <div className="flex items-center gap-3">
              {isLoaded && !isSignedIn ? (
                <SignInButton mode="modal">
                  <button className="inline-flex items-center gap-2 bg-[#36322F] text-white px-3 py-2 rounded-[10px] text-sm font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] transition-all duration-200">
                    Sign In
                  </button>
                </SignInButton>
              ) : isSignedIn ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}</span>
                  <div className="flex items-center gap-2">
                    {process.env.NODE_ENV === 'development' && (
                      <button
                        onClick={() => setShowReactScanModal(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="React Performance Monitor"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </button>
                    )}
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-8 h-8",
                          userButtonPopoverCard: "shadow-lg",
                          userButtonPopoverActions: "space-y-1"
                        }
                      }}
                      userProfileProps={{
                        additionalOAuthScopes: {
                          github: ['repo', 'user:email']
                        }
                      }}
                    >
                      <UserButton.MenuItems>
                        <UserButton.Action
                          label="Settings"
                          labelIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                          onClick={() => setShowSettingsModal(true)}
                        />
                      </UserButton.MenuItems>
                    </UserButton>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          
          {/* Main content */}
          <div className="relative z-10 h-full flex items-center justify-center px-4">
            <div className="text-center max-w-4xl min-w-[600px] mx-auto">
              {/* Firecrawl-style Header */}
              <div className="text-center">
                <h1 className="text-[2.5rem] lg:text-[3.8rem] text-center text-[#36322F] font-semibold tracking-tight leading-[0.9] animate-[fadeIn_0.8s_ease-out]">
                  <span className="hidden md:inline">Zapdev</span>
                  <span className="md:hidden">Zapdev</span>
                </h1>
                <motion.p 
                  className="text-base lg:text-lg max-w-lg mx-auto mt-2.5 text-zinc-500 text-center text-balance"
                  animate={{
                    opacity: 1
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  Tell me what to build, or paste a URL to clone. I'll handle the rest with AI.
                </motion.p>
              </div>
              
              <form onSubmit={handleHomeScreenSubmit} className="mt-5 max-w-3xl mx-auto">
                <div className="w-full relative group">
                  <input
                    type="text"
                    value={homeUrlInput}
                    onChange={(e) => {
                      setHomeUrlInput(e.target.value);
                    }}
                    placeholder=" "
                    aria-placeholder="Build me a landing page, or https://example.com to clone"
                    className="h-[3.25rem] w-full resize-none focus-visible:outline-none focus-visible:ring-orange-500 focus-visible:ring-2 rounded-[18px] text-sm text-[#36322F] px-4 pr-12 border-[.75px] border-border bg-white"
                    style={{
                      boxShadow: '0 0 0 1px #e3e1de66, 0 1px 2px #5f4a2e14, 0 4px 6px #5f4a2e0a, 0 40px 40px -24px #684b2514',
                      filter: 'drop-shadow(rgba(249, 224, 184, 0.3) -0.731317px -0.731317px 35.6517px)'
                    }}
                    autoFocus
                  />
                  <div 
                    aria-hidden="true" 
                    className={`absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none text-sm text-opacity-50 text-start transition-opacity ${
                      homeUrlInput ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <span className="text-[#605A57]/50" style={{ fontFamily: 'monospace' }}>
                      Build me a landing page, or https://example.com to clone
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={!homeUrlInput.trim()}
                    className="absolute top-1/2 transform -translate-y-1/2 right-2 flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium text-zinc-500 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Start Building"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <polyline points="9 10 4 15 9 20"></polyline>
                      <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                    </svg>
                  </button>
                </div>
                  
                  {/* Style Selector - REMOVED FOR SIMPLICITY */}
                  {false && (
                    <div className="overflow-hidden mt-4">
                      <div className={`transition-all duration-500 ease-out transform ${
                        false ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                      }`}>
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-sm">
                      <p className="text-sm text-gray-600 mb-3 font-medium">How do you want your site to look?</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { name: 'Neobrutalist', description: 'Bold colors, thick borders' },
                          { name: 'Glassmorphism', description: 'Frosted glass effects' },
                          { name: 'Minimalist', description: 'Clean and simple' },
                          { name: 'Dark Mode', description: 'Dark theme' },
                          { name: 'Gradient', description: 'Colorful gradients' },
                          { name: 'Retro', description: '80s/90s aesthetic' },
                          { name: 'Modern', description: 'Contemporary design' },
                          { name: 'Monochrome', description: 'Black and white' }
                        ].map((style) => (
                          <button
                            key={style.name}
                            type="button"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                // Submit the form
                                const form = e.currentTarget.closest('form');
                                if (form) {
                                  form.requestSubmit();
                                }
                              }
                            }}
                            onClick={() => {
                              if (null === style.name) {
                                // Deselect if clicking the same style
                                // setSelectedStyle(null);
                                // Keep only additional context, remove the style theme part
                                const currentAdditional = homeContextInput.replace(/^[^,]+theme\s*,?\s*/, '').trim();
                                setHomeContextInput(currentAdditional);
                              } else {
                                // Select new style
                                // setSelectedStyle(style.name);
                                // Extract any additional context (everything after the style theme)
                                const currentAdditional = homeContextInput.replace(/^[^,]+theme\s*,?\s*/, '').trim();
                                setHomeContextInput(style.name.toLowerCase() + ' theme' + (currentAdditional ? ', ' + currentAdditional : ''));
                              }
                            }}
                            className={`p-3 rounded-lg border transition-all ${
                              null === style.name
                                ? 'border-orange-400 bg-orange-50 text-gray-900 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/50 text-gray-700'
                            }`}
                          >
                            <div className="text-sm font-medium">{style.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                          </button>
                        ))}
                      </div>
                      
                      {/* Additional context input - part of the style selector */}
                      <div className="mt-4 mb-2">
                        <input
                          type="text"
                          value={(() => {
                            if (true) return homeContextInput;
                            // Extract additional context by removing the style theme part
                            const additional = homeContextInput.replace(new RegExp('^' + ''.toLowerCase() + ' theme\\s*,?\\s*', 'i'), '');
                            return additional;
                          })()}
                          onChange={(e) => {
                            const additionalContext = e.target.value;
                            if (false) {
                              // setHomeContextInput((null || '').toLowerCase() + ' theme' + (additionalContext.trim() ? ', ' + additionalContext : ''));
                            } else {
                              setHomeContextInput(additionalContext);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const form = e.currentTarget.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }
                          }}
                          placeholder="Add more details: specific features, color preferences..."
                          className="w-full px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all duration-200"
                        />
                      </div>
                    </div>
                      </div>
                    </div>
                  )}
              </form>
              
              {/* PROFESSIONAL DESIGNER FEATURE: Designer Mode Toggle */}
              <div className="mt-6 flex flex-col items-center justify-center space-y-4 animate-[fadeIn_1s_ease-out]">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="designer-mode"
                      checked={designerMode}
                      onChange={(e) => setDesignerMode(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="designer-mode" className="ml-2 text-sm font-medium text-gray-700">
                      🎨 Professional Designer Mode
                    </label>
                  </div>
                </div>
                {designerMode && (
                  <div className="text-xs text-gray-600 text-center max-w-xs">
                    Get expert design guidance from our AI design team using the same powerful models
                  </div>
                )}
              </div>
              
              {/* Chat History Section - Only show when signed in */}
              {isSignedIn && (
                <div className="mt-16 animate-[fadeIn_1.2s_ease-out]">
                  <h2 className="text-2xl font-semibold text-[#36322F] mb-8 text-center">Your Recent Chats</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {/* Current Project */}
                    {sandboxData?.url && (
                      <div className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="aspect-video bg-gradient-to-br from-orange-50 to-yellow-50 relative overflow-hidden">
                          <iframe 
                            src={sandboxData.url}
                            className="w-full h-full"
                            frameBorder="0"
                            sandbox="allow-scripts allow-same-origin"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {isGeneratingName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                  <span>Generating name...</span>
                                </div>
                              ) : (
                                projectName || 'Current Project'
                              )}
                            </h3>
                            {projectName && (
                              <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">AI Named</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mb-3">Active sandbox • {sandboxData.sandboxId}</p>
                          <button 
                            onClick={() => {
                              setShowHomeScreen(false);
                              setActiveTab('preview');
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                          >
                            Continue Building
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Recent Chats from Convex */}
                    {chats === undefined ? (
                      // Loading state
                      Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
                          <div className="aspect-video bg-gray-200"></div>
                          <div className="p-4">
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      ))
                    ) : chats?.chats && chats.chats.length > 0 ? (
                      // Display actual chats
                      chats.chats.slice(0, 6).map((chat) => (
                        <div key={chat._id} className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                            {chat.screenshot ? (
                              // Display actual screenshot
                              <img 
                                src={chat.screenshot}
                                alt={`Preview of ${chat.title}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback if screenshot fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : (
                              // Placeholder when no screenshot
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  <span className="text-sm">Chat Preview</span>
                                </div>
                              </div>
                            )}
                            {/* Fallback placeholder (initially hidden) */}
                            <div className="hidden w-full h-full flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm">Preview unavailable</span>
                              </div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {/* Live sandbox indicator */}
                            {chat.sandboxUrl && (
                              <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                Live
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-medium text-gray-900 mb-1 truncate">{chat.title}</h3>
                            <p className="text-sm text-gray-500 mb-3">
                              {new Date(chat.updatedAt).toLocaleDateString()} • 
                              {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <button 
                              onClick={() => {
                                setCurrentChatId(chat._id);
                                // If this chat has an associated sandbox, load it
                                if (chat.sandboxId && chat.sandboxUrl) {
                                  setSandboxData({
                                    sandboxId: chat.sandboxId,
                                    url: chat.sandboxUrl
                                  });
                                  updateStatus('Sandbox loaded', true);
                                }
                                setShowHomeScreen(false);
                                setActiveTab(chat.sandboxUrl ? 'preview' : 'chats');
                              }}
                              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                            >
                              {chat.sandboxUrl ? 'Continue Project' : 'Continue Chat'}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      // No chats state
                      <div className="col-span-full text-center py-12">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
                        <p className="text-gray-500 mb-4">Start building your first AI project!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-card px-4 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-yellow-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">zapdev</span>
              {projectName && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-gray-700">{projectName}</span>
                    <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">AI</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          
          <Button 
            variant="code"
            onClick={() => createSandbox()}
            size="sm"
            title="Create new sandbox"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>
          <Button 
            variant="code"
            onClick={reapplyLastGeneration}
            size="sm"
            title="Re-apply last generation"
            disabled={!conversationContext.lastGeneratedCode || !sandboxData}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
          <Button 
            variant="code"
            onClick={downloadZip}
            disabled={!sandboxData}
            size="sm"
            title="Download your Vite app as ZIP"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </Button>
          <div className="inline-flex items-center gap-2 bg-[#36322F] text-white px-3 py-1.5 rounded-[10px] text-sm font-medium [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)]">
            <span id="status-text">{status.text}</span>
            <div className={`w-2 h-2 rounded-full ${status.active ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">        
        {/* Center Panel - AI Chat (1/3 of remaining width) */}
        <div className="flex-1 max-w-[400px] flex flex-col border-r border-border bg-background">
          {conversationContext.scrapedWebsites.length > 0 && (
            <div className="p-4 bg-card">
              <div className="flex flex-col gap-2">
                {conversationContext.scrapedWebsites.map((site, idx) => {
                  // Extract favicon and site info from the scraped data
                  const metadata = site.content?.metadata || {};
                  const sourceURL = metadata.sourceURL || site.url;
                  const favicon = metadata.favicon || `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=32`;
                  const siteName = metadata.ogSiteName || metadata.title || new URL(sourceURL).hostname;
                  
                  return (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <img 
                        src={favicon} 
                        alt={siteName}
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${new URL(sourceURL).hostname}&sz=32`;
                        }}
                      />
                      <a 
                        href={sourceURL} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-black hover:text-gray-700 truncate max-w-[250px]"
                        title={sourceURL}
                      >
                        {siteName}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 scrollbar-hide" ref={chatMessagesRef}>
            {chatMessages.map((msg, idx) => {
              // Check if this message is from a successful generation
              const isGenerationComplete = msg.content.includes('Successfully recreated') || 
                                         msg.content.includes('AI recreation generated!') ||
                                         msg.content.includes('Code generated!');
              
              // Get the files from metadata if this is a completion message
              const completedFiles = msg.metadata?.appliedFiles || [];
              
              return (
                <div key={idx} className="block">
                  <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-1`}>
                    <div className="block">
                      <div className={`block rounded-[10px] px-4 py-2 ${
                        msg.type === 'user' ? 'bg-[#36322F] text-white ml-auto max-w-[80%]' :
                        msg.type === 'ai' ? 'bg-gray-100 text-gray-900 mr-auto max-w-[80%]' :
                        msg.type === 'system' ? 'bg-[#36322F] text-white text-sm' :
                        msg.type === 'command' ? 'bg-[#36322F] text-white font-mono text-sm' :
                        msg.type === 'error' ? 'bg-red-900 text-red-100 text-sm border border-red-700' :
                        'bg-[#36322F] text-white text-sm'
                      }`}>
                    {msg.type === 'command' ? (
                      <div className="flex items-start gap-2">
                        <span className={`text-xs ${
                          msg.metadata?.commandType === 'input' ? 'text-blue-400' :
                          msg.metadata?.commandType === 'error' ? 'text-red-400' :
                          msg.metadata?.commandType === 'success' ? 'text-green-400' :
                          'text-gray-400'
                        }`}>
                          {msg.metadata?.commandType === 'input' ? '$' : '>'}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap text-white">{msg.content}</span>
                      </div>
                    ) : msg.type === 'error' ? (
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-800 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold mb-1">Build Errors Detected</div>
                          <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                          <div className="mt-2 text-xs opacity-70">Press 'F' or click the Fix button above to resolve</div>
                        </div>
                      </div>
                    ) : (
                      msg.content
                    )}
                      </div>
                  
                      {/* Show applied files if this is an apply success message */}
                      {msg.metadata?.appliedFiles && msg.metadata.appliedFiles.length > 0 && (
                    <div className="mt-2 inline-block bg-gray-100 rounded-[10px] p-3">
                      <div className="text-xs font-medium mb-1 text-gray-700">
                        {msg.content.includes('Applied') ? 'Files Updated:' : 'Generated Files:'}
                      </div>
                      <div className="flex flex-wrap items-start gap-1">
                        {msg.metadata.appliedFiles.map((filePath, fileIdx) => {
                          const fileName = filePath.split('/').pop() || filePath;
                          const fileExt = fileName.split('.').pop() || '';
                          const fileType = fileExt === 'jsx' || fileExt === 'js' ? 'javascript' :
                                          fileExt === 'css' ? 'css' :
                                          fileExt === 'json' ? 'json' : 'text';
                          
                          return (
                            <div
                              key={`applied-${fileIdx}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                              style={{ animationDelay: `${fileIdx * 30}ms` }}
                            >
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                                fileType === 'css' ? 'bg-blue-400' :
                                fileType === 'javascript' ? 'bg-yellow-400' :
                                fileType === 'json' ? 'bg-green-400' :
                                'bg-gray-400'
                              }`} />
                              {fileName}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                      {/* Show generated files for completion messages - but only if no appliedFiles already shown */}
                      {isGenerationComplete && generationProgress.files.length > 0 && idx === chatMessages.length - 1 && !msg.metadata?.appliedFiles && !chatMessages.some(m => m.metadata?.appliedFiles) && (
                    <div className="mt-2 inline-block bg-gray-100 rounded-[10px] p-3">
                      <div className="text-xs font-medium mb-1 text-gray-700">Generated Files:</div>
                      <div className="flex flex-wrap items-start gap-1">
                        {generationProgress.files.map((file, fileIdx) => (
                          <div
                            key={`complete-${fileIdx}`}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                            style={{ animationDelay: `${fileIdx * 30}ms` }}
                          >
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                              file.type === 'css' ? 'bg-blue-400' :
                              file.type === 'javascript' ? 'bg-yellow-400' :
                              file.type === 'json' ? 'bg-green-400' :
                              'bg-gray-400'
                            }`} />
                            {file.path.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                    </div>
                    </div>
                  </div>
              );
            })}
            
            {/* Code application progress */}
            {codeApplicationState.stage && (
              <CodeApplicationProgress state={codeApplicationState} />
            )}
            
            {/* File generation progress - inline display (during generation) */}
            {generationProgress.isGenerating && (
              <div className="inline-block bg-gray-100 rounded-lg p-3">
                <div className="text-sm font-medium mb-2 text-gray-700">
                  {generationProgress.status}
                </div>
                <div className="flex flex-wrap items-start gap-1">
                  {/* Show completed files */}
                  {generationProgress.files.map((file, idx) => (
                    <div
                      key={`file-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#36322F] text-white rounded-[10px] text-xs animate-fade-in-up"
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      {file.path.split('/').pop()}
                    </div>
                  ))}
                  
                  {/* Show current file being generated */}
                  {generationProgress.currentFile && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#36322F]/70 text-white rounded-[10px] text-xs animate-pulse"
                      style={{ animationDelay: `${generationProgress.files.length * 30}ms` }}>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {generationProgress.currentFile.path.split('/').pop()}
                    </div>
                  )}
                </div>
                
                {/* Live streaming response display */}
                {generationProgress.streamedCode && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-3 border-t border-gray-300 pt-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-gray-600">AI Response Stream</span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent" />
                    </div>
                    <div className="bg-gray-900 border border-gray-700 rounded max-h-32 overflow-y-auto scrollbar-hide">
                      <SyntaxHighlighter
                        language="jsx"
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: '0.75rem',
                          fontSize: '11px',
                          lineHeight: '1.5',
                          background: 'transparent',
                          maxHeight: '8rem',
                          overflow: 'hidden'
                        }}
                      >
                        {(() => {
                          const lastContent = generationProgress.streamedCode.slice(-1000);
                          // Show the last part of the stream, starting from a complete tag if possible
                          const startIndex = lastContent.indexOf('<');
                          return startIndex !== -1 ? lastContent.slice(startIndex) : lastContent;
                        })()}
                      </SyntaxHighlighter>
                      <span className="inline-block w-2 h-3 bg-orange-400 ml-3 mb-3 animate-pulse" />
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-card">
            <div className="relative">
              <Textarea
                className="min-h-[60px] pr-12 resize-y border-2 border-black focus:outline-none"
                placeholder=""
                value={aiChatInput}
                onChange={(e) => setAiChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                rows={3}
              />
              <button
                onClick={sendChatMessage}
                className="absolute right-2 bottom-2 p-2 bg-[#36322F] text-white rounded-[10px] hover:bg-[#4a4542] [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] transition-all duration-200"
                title="Send message (Enter)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview or Generation (2/3 of remaining width) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-card border-b border-border flex justify-between items-center">
            {/* Tab navigation removed - AI can still control tabs programmatically via setActiveTab */}
            <div className="flex items-center gap-4">
              {/* Code and Preview buttons */}
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'generation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('generation')}
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Code
                </Button>
                <Button
                  variant={activeTab === 'preview' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('preview')}
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </Button>
                <Button
                  variant={activeTab === 'diagrams' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('diagrams')}
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Diagrams
                </Button>
                <Button
                  variant={activeTab === 'database' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('database')}
                  className="text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16" />
                  </svg>
                  Database
                </Button>
                <DiagramButton 
                  onDiagramGenerated={(files) => {
                    // Add generated diagram files to the current generation progress
                    setGenerationProgress(prev => ({
                      ...prev,
                      files: [
                        ...prev.files,
                        ...files.map(file => ({
                          path: file.path,
                          content: file.content,
                          type: file.type,
                          completed: true
                        }))
                      ]
                    }));
                    // Switch to diagrams tab to show the generated diagram
                    setActiveTab('diagrams');
                  }}
                />
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Live Code Generation Status - Moved to far right */}
              {activeTab === 'generation' && (generationProgress.isGenerating || generationProgress.files.length > 0) && (
                <div className="flex items-center gap-3">
                  {!generationProgress.isEdit && (
                    <div className="text-gray-600 text-sm">
                      {generationProgress.files.length} files generated
                    </div>
                  )}
                  <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-[10px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#36322F] text-white hover:bg-[#36322F] [box-shadow:inset_0px_-2px_0px_0px_#171310,_0px_1px_6px_0px_rgba(58,_33,_8,_58%)] hover:translate-y-[1px] hover:scale-[0.98] hover:[box-shadow:inset_0px_-1px_0px_0px_#171310,_0px_1px_3px_0px_rgba(58,_33,_8,_40%)] active:translate-y-[2px] active:scale-[0.97] active:[box-shadow:inset_0px_1px_1px_0px_#171310,_0px_1px_2px_0px_rgba(58,_33,_8,_30%)] disabled:shadow-none disabled:hover:translate-y-0 disabled:hover:scale-100 h-8 px-3 py-1 text-sm gap-2`}>
                    {generationProgress.isGenerating ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                        {generationProgress.isEdit ? 'Editing code' : 'Live code generation'}
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                        COMPLETE
                      </>
                    )}
                  </div>
                </div>
              )}
              {sandboxData && !generationProgress.isGenerating && (
                <>
                  <Button
                    variant="code"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={sandboxData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Open in new tab"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {renderMainContent()}
          </div>
        </div>
      </div>

      {/* Usage Limit Modal */}
      <UsageLimitModal
        isOpen={showUsageLimitModal}
        onClose={() => setShowUsageLimitModal(false)}
        currentUsage={3}
        limit={5}
      />

      {/* Enhanced Settings Modal */}
      <EnhancedSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}

export default function WrappedAISandboxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <AISandboxPage />
    </Suspense>
  );
}