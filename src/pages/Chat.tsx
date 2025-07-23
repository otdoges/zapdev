import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Send, 
  Code, 
  Play, 
  Download, 
  Share2, 
  Settings, 
  Zap, 
  Sparkles,
  FileText,
  Eye,
  Terminal,
  Bot,
  User,
  LogOut,
  Lightbulb,
  Rocket,
  Menu,
  Plus,
  Sidebar,
  X,
  AlertTriangle
} from "lucide-react";
import WebContainerComponent from "@/components/WebContainer";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import { type ChatMessage } from "@/lib/ai";
import { multiModelAI } from "@/lib/multiModelAI";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { trackAIUsage, trackMessageSent, trackChatCreation } = useUsageTracking();
  const navigate = useNavigate();

  // Check if we're in test mode (no API key)
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      setIsTestMode(true);
      console.log("🔧 Chat: Running in test mode - no API key configured");
    }
  }, []);

  // Simple test mode streaming function
  const createTestStream = async (userInput: string): Promise<AsyncIterable<string>> => {
    console.log("🔧 Chat Debug: Creating test stream for:", userInput);
    
    const responses = [
      "Hello! I'm running in test mode. ",
      "This means the AI service isn't configured locally, but the chat interface is working perfectly! ",
      "Here are some things I can tell you:\n\n",
      "✅ The chat interface is functional\n",
      "✅ Message streaming is working\n", 
      "✅ State management is working\n",
      "✅ Error handling is in place\n",
      "✅ Console logging is active\n\n",
      "To enable full AI functionality:\n",
      "1. Set up VITE_GROQ_API_KEY in your .env.local\n",
      "2. Or deploy to Vercel where it's already configured\n\n",
      "Your message was: \"" + userInput + "\"\n\n",
      "The system is ready to handle real AI responses once the API key is configured!"
    ];
    
    async function* generator() {
      for (const response of responses) {
        await new Promise(resolve => setTimeout(resolve, 100));
        yield response;
      }
    }
    
    return generator();
  };

  const showSplitLayout = messages.length > 0 && hasStartedChat;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) {
      console.log("📝 Chat Debug: Empty input, returning");
      return;
    }

    console.log("🚀 Chat Debug: Starting message send process");
    console.log("💬 User input:", inputValue);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    try {
      console.log("📊 Chat Debug: Attempting to track message sent");
      await trackMessageSent({
        chatId: 'current-chat',
        messageLength: inputValue.length,
        role: 'user'
      });
      console.log("✅ Chat Debug: Message tracking successful");
    } catch (trackingError) {
      console.warn("⚠️ Chat Debug: Message tracking failed:", trackingError);
      // Continue anyway, tracking failure shouldn't stop the chat
    }

    setInputValue("");
    setIsLoading(true);
    setHasStartedChat(true);
    setShowPreview(true);

    // Create assistant message placeholder
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant", 
      content: "",
      timestamp: new Date(),
      model: "pending",
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      console.log("🤖 Chat Debug: Checking multiModelAI availability");
      
      // Check if environment variables are properly set
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey || apiKey === 'your_groq_api_key_here') {
        console.error("❌ Chat Debug: Groq API key not configured");
        throw new Error("API_KEY_MISSING");
      }
      
      console.log("🔧 Chat Debug: Getting system info");
      const systemInfo = multiModelAI.getSystemInfo();
      console.log("🔧 System info:", systemInfo);
      
      const primaryModel = systemInfo.models[0] || "llama-3.3-70b-versatile";
      console.log("🎯 Chat Debug: Using primary model:", primaryModel);
      
      // Update assistant message with model info
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, model: primaryModel }
          : msg
      ));

      console.log("🌊 Chat Debug: Starting stream with messages:", [...messages, userMessage].length);
      
      let stream: AsyncIterable<string>;
      
      if (isTestMode) {
        console.log("🔧 Chat Debug: Using test mode stream");
        stream = await createTestStream(inputValue);
      } else {
        console.log("🤖 Chat Debug: Using real AI stream");
        // Use the multi-model streaming with error handling
        stream = await multiModelAI.streamMultiModelResponse(
          [...messages, userMessage],
          {
            temperature: 0.7,
            maxTokens: 4000,
            useOptimization: true
          }
        );
      }

      console.log("✅ Chat Debug: Stream created successfully");
      
      let accumulatedText = "";
      let chunkCount = 0;
      
      try {
        for await (const chunk of stream) {
          chunkCount++;
          accumulatedText += chunk;
          
          if (chunkCount % 5 === 0) {
            console.log(`📦 Chat Debug: Received chunk ${chunkCount}, total length: ${accumulatedText.length}`);
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: accumulatedText }
              : msg
          ));
        }
        
        console.log(`✅ Chat Debug: Stream completed with ${chunkCount} chunks, final length: ${accumulatedText.length}`);
        
        if (accumulatedText.length === 0) {
          console.warn("⚠️ Chat Debug: Stream completed but no content received");
          throw new Error("EMPTY_RESPONSE");
        }
        
      } catch (streamError) {
        console.error("❌ Chat Debug: Error during streaming:", streamError);
        throw streamError;
      }

      // Estimate token usage
      try {
        const allMessagesText = [...messages, userMessage].map(m => m.content).join(' ');
        const estimatedRequestTokens = Math.ceil(allMessagesText.length / 4);
        const estimatedResponseTokens = Math.ceil(accumulatedText.length / 4);
        const totalTokens = estimatedRequestTokens + estimatedResponseTokens;

        console.log("📊 Chat Debug: Token usage - Request:", estimatedRequestTokens, "Response:", estimatedResponseTokens);

        // Track AI usage
        await trackAIUsage({
          model: primaryModel,
          requestTokens: estimatedRequestTokens,
          responseTokens: estimatedResponseTokens,
          totalTokens: totalTokens,
          conversationId: 'current-chat'
        });

        // Track assistant message
        await trackMessageSent({
          chatId: 'current-chat',
          messageLength: accumulatedText.length,
          role: 'assistant'
        });
        
        console.log("✅ Chat Debug: Usage tracking completed");
      } catch (trackingError) {
        console.warn("⚠️ Chat Debug: Usage tracking failed:", trackingError);
        // Continue anyway
      }

      // Check if response contains code
      if (accumulatedText.includes('```')) {
        setGeneratedCode(accumulatedText);
        console.log("📝 Chat Debug: Code detected and stored");
      }
      
      console.log("🎉 Chat Debug: Message send process completed successfully");
      
    } catch (error: any) {
      console.error("❌ Chat Debug: Major error in handleSendMessage:", error);
      
      let errorMessage = "Sorry, I encountered an error. Please try again.";
      let shouldShowToast = false;
      
      if (error?.message === "API_KEY_MISSING") {
        errorMessage = "⚠️ AI service not configured for local development. This works on the deployed version.";
        shouldShowToast = true;
        console.error("❌ Chat Debug: API key configuration issue");
      } else if (error?.message === "EMPTY_RESPONSE") {
        errorMessage = "The AI service returned an empty response. Please try rephrasing your message.";
        shouldShowToast = true;
        console.error("❌ Chat Debug: Empty response from AI");
      } else if (error?.message?.includes("fetch")) {
        errorMessage = "Network error: Unable to connect to AI service. Please check your connection.";
        shouldShowToast = true;
        console.error("❌ Chat Debug: Network error");
      } else if (error?.message?.includes("rate")) {
        errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
        shouldShowToast = true;
        console.error("❌ Chat Debug: Rate limit error");
      } else {
        // Generic error
        shouldShowToast = true;
        console.error("❌ Chat Debug: Unknown error type");
      }
      
      // Show toast for major errors
      if (shouldShowToast) {
        toast({
          title: "Chat Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Update the assistant message with error
      const errorResponse: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: errorMessage,
        timestamp: new Date(),
        model: "error",
      };
      
      setMessages(prev => {
        // Remove the placeholder assistant message and add error message
        const filtered = prev.filter(msg => msg.id !== assistantMessage.id);
        return [...filtered, errorResponse];
      });
      
    } finally {
      setIsLoading(false);
      console.log("🏁 Chat Debug: handleSendMessage finally block executed");
    }
  };

  const handleSignOut = async () => {
    if (isSignedIn) {
      await signOut();
    }
    navigate('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Welcome screen (no messages yet)
  if (!hasStartedChat && messages.length === 0) {
    return (
      <div className="min-h-screen bg-black text-foreground">
        {/* Navigation matching home page */}
        <div className="fixed top-3.5 left-1/2 -translate-x-1/2 z-50 h-14 bg-[#1B1B1B] w-[95%] max-w-3xl rounded-full">
          <div className="mx-auto h-full px-6">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold text-base">zapdev</span>
              </div>
              <div className="flex items-center space-x-2">
                {isSignedIn && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Chat
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-400 hover:text-white"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section matching home page */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative container px-4 pt-40 pb-20"
        >
          {/* Background */}
          <div className="absolute inset-0 -z-10 bg-[#0A0A0A]" />
          
          {/* Gradient blur element */}
          <div 
            className="absolute left-0 top-0 w-full h-full rounded-full"
            style={{
              background: '#377AFB',
              opacity: 0.1,
              boxShadow: '300px 300px 300px',
              filter: 'blur(150px)',
              zIndex: 1
            }}
          />
          
          <div className="flex flex-col items-center text-center relative z-10">
            {/* Badge Section */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
              className="inline-block mb-4 px-4 py-1.5 rounded-full glass"
            >
              <span className="text-sm font-medium">
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ delay: 0.8, duration: 2, ease: "easeInOut" }}
                  className="inline-block"
                >
                  <Sparkles className="w-4 h-4 inline-block mr-2" />
                </motion.div>
                AI-powered website builder for developers
              </span>
            </motion.div>
            
            <div className="max-w-4xl relative z-10">
              {/* Heading and Description */}
              <motion.h1 
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 80 }}
                className="text-5xl md:text-7xl font-normal mb-4 tracking-tight"
              >
                <motion.span 
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="text-white font-medium block"
                >
                  Build with AI.
                </motion.span>
                <motion.span 
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="text-gradient font-medium block"
                >
                  Ship faster.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.7, type: "spring", stiffness: 90 }}
                className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
              >
                Generate full-stack web applications with AI.{" "}
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3, duration: 0.5 }}
                  className="text-white"
                >
                  From idea to deployment in minutes, not hours.
                </motion.span>
              </motion.p>
              
              {/* Input Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="relative mb-8"
              >
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your project..."
                  className="w-full bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 resize-none min-h-[120px] pr-16 text-lg p-6 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  rows={4}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="absolute right-3 bottom-3 bg-white hover:bg-gray-100 text-black p-3 h-12 w-12 rounded-lg"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Quick Examples */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.7 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {[
                  "Build a modern landing page for a SaaS product",
                  "Create a responsive portfolio website",
                  "Design a dashboard with charts and metrics",
                  "Build a blog layout with dark mode"
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600 rounded-full px-4 py-2"
                    onClick={() => setInputValue(example)}
                  >
                    {example}
                  </Button>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>
    );
  }

  // Chat interface
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black text-foreground flex"
    >
      {/* Main Chat Panel */}
      <div className={`flex flex-col transition-all duration-300 ${showSplitLayout ? 'w-1/2' : 'w-full'}`}>
        {/* Header matching home page style */}
        <div className="border-b border-gray-800/30 p-4 flex items-center justify-between bg-black/50">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-white">zapdev</h1>
              <p className="text-sm text-gray-400">
                AI Website Builder
                {isTestMode && (
                  <span className="ml-2 px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs rounded border border-yellow-600/30">
                    TEST MODE
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showSplitLayout && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-gray-700 ${showCode ? 'bg-blue-600/20 text-blue-400 border-blue-500/50' : 'text-gray-300'}`}
                  onClick={() => setShowCode(!showCode)}
                >
                  <Code className="w-4 h-4 mr-2" />
                  Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-400 hover:text-white"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start space-x-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-gray-400" />
                    ) : message.model === "error" ? (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-300">
                        {message.role === "user" ? "You" : "zapdev"}
                      </span>
                      {message.model && message.model !== "error" && message.model !== "pending" && (
                        <Badge variant="outline" className="text-xs text-gray-500 border-gray-600">
                          {isTestMode ? "test-mode" : message.model}
                        </Badge>
                      )}
                      {message.model === "pending" && isLoading && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-500">thinking...</span>
                        </div>
                      )}
                    </div>
                    <div className="prose prose-invert max-w-none">
                      <div className={`whitespace-pre-wrap leading-relaxed ${
                        message.model === "error" ? "text-red-400" : "text-gray-100"
                      }`}>
                        {message.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-300">zapdev</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    <span className="text-sm text-gray-400 ml-2">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-6 border-t border-gray-800/50">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message zapdev..."
                className="w-full bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 resize-none min-h-[60px] pr-12 rounded-xl"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 bg-white hover:bg-gray-100 text-black p-2 h-8 w-8 rounded-lg"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Powered by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel - Only shown after first message */}
      {showSplitLayout && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-1/2 flex flex-col bg-[#0A0A0A] border-l border-gray-800/30"
        >
          {/* Preview Header */}
          <div className="border-b border-gray-800/30 p-4 flex items-center justify-between bg-black/50">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">
                {showCode ? 'Code' : 'Preview'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Play className="w-4 h-4 mr-2" />
                Run
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            {showCode ? (
              <ScrollArea className="h-full p-4">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {generatedCode || "// Code will appear here when generated"}
                </pre>
              </ScrollArea>
            ) : (
              <div className="h-full">
                {generatedCode ? (
                  <WebContainerComponent 
                    code={generatedCode} 
                    language="nextjs" 
                    isRunning={false}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Preview will appear here</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Generated content will be displayed in this panel
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Chat;