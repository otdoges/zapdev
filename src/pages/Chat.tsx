import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MessageSquare,
  Lightbulb,
  Rocket
} from "lucide-react";
import WebContainerComponent from "@/components/WebContainer";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { streamResponse, generateCode, generateWebsite, type ChatMessage } from "@/lib/ai";
import { getAllModels, getReasoningModels, type GroqModelId } from "@/lib/groq";
import PromptModeSelector, { type PromptMode } from "@/components/PromptModeSelector";

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [selectedModel, setSelectedModel] = useState<GroqModelId>('llama-3.3-70b-versatile');
  const [generatedCode, setGeneratedCode] = useState('');
  const [promptMode, setPromptMode] = useState<PromptMode>('advanced');
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const models = getAllModels();
  const reasoningModels = getReasoningModels();

  const isWelcomeScreen = messages.length === 0 && !hasStartedChat;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setHasStartedChat(true);

    try {
      // Create assistant message placeholder
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Choose the appropriate response method based on prompt mode
      let result;
      if (promptMode === 'code') {
        result = await generateCode(inputValue, 'typescript', { model: selectedModel });
        // For code generation, we get a single response, not a stream
        if (result.content) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: result.content }
              : msg
          ));
          if (result.content.includes('```')) {
            setGeneratedCode(result.content);
          }
        }
      } else if (promptMode === 'website') {
        result = await generateWebsite(inputValue, { model: selectedModel });
        // For website generation, we get a single response, not a stream
        if (result.content) {
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessage.id 
              ? { ...msg, content: result.content }
              : msg
          ));
          if (result.content.includes('```')) {
            setGeneratedCode(result.content);
          }
        }
      } else {
        // Stream the response for advanced and simple modes
        result = await streamResponse(
          [...messages, userMessage],
          { 
            model: selectedModel,
            useAdvancedPrompt: promptMode === 'advanced'
          }
        );

        if (result.error) {
          throw new Error(result.error);
        }

        if (result.textStream) {
          let accumulatedText = "";
          
          for await (const chunk of result.textStream) {
            accumulatedText += chunk;
            
            setMessages(prev => prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: accumulatedText }
                : msg
            ));
          }

          // Check if response contains code
          if (accumulatedText.includes('```')) {
            setGeneratedCode(accumulatedText);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isWelcomeScreen) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">zapdev</h1>
              <p className="text-sm text-gray-400">AI Website Builder</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Welcome Screen */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="max-w-4xl w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome to zapdev
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Your AI-powered website builder. Create stunning websites, web apps, and components with the power of advanced AI models.
              </p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
            >
              <Card className="bg-gray-900/50 border-gray-700 p-6 text-center hover:bg-gray-900/70 transition-colors">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Code Generation</h3>
                <p className="text-gray-400 text-sm">Generate clean, efficient code for any web project</p>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700 p-6 text-center hover:bg-gray-900/70 transition-colors">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
                <p className="text-gray-400 text-sm">See your creations come to life in real-time</p>
              </Card>
              <Card className="bg-gray-900/50 border-gray-700 p-6 text-center hover:bg-gray-900/70 transition-colors">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Deploy Ready</h3>
                <p className="text-gray-400 text-sm">Export production-ready code instantly</p>
              </Card>
            </motion.div>

            {/* Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center space-x-4 mb-8"
            >
              <PromptModeSelector
                currentMode={promptMode}
                onModeChange={setPromptMode}
              />
              <Select value={selectedModel} onValueChange={(value: GroqModelId) => setSelectedModel(value)}>
                <SelectTrigger className="w-56 bg-gray-800 border-gray-700 text-gray-300">
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <div className="px-2 py-1 text-xs text-gray-400 font-medium">Production Models</div>
                  {models.filter(m => m.type === 'production').map(model => (
                    <SelectItem key={model.id} value={model.id} className="text-gray-300">
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {model.contextWindow.toLocaleString()} tokens
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-gray-400 font-medium mt-2">Preview Models</div>
                  {models.filter(m => m.type === 'preview').map(model => (
                    <SelectItem key={model.id} value={model.id} className="text-gray-300">
                      <div className="flex items-center justify-between w-full">
                        <span>{model.name}</span>
                        <div className="flex items-center space-x-1">
                          {model.reasoning && (
                            <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                              Reasoning
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {model.contextWindow.toLocaleString()} tokens
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Input Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="bg-gray-900/30 border-gray-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <span className="text-lg font-semibold">What would you like to build?</span>
                </div>
                <div className="relative">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your website, app, or component idea..."
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none min-h-[80px] pr-12 text-lg"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white p-2 h-10 w-10"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <div className="flex items-center space-x-1">
                    <Sparkles className="w-4 h-4" />
                    <span>AI-powered</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Quick Start Examples */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-8 text-center"
            >
              <p className="text-gray-400 mb-4">Try these examples:</p>
              <div className="flex flex-wrap justify-center gap-3">
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
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    onClick={() => setInputValue(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black text-white flex"
    >
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col border-r border-gray-800">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">zapdev</h1>
              <p className="text-sm text-gray-400">AI Website Builder</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <PromptModeSelector
              currentMode={promptMode}
              onModeChange={setPromptMode}
            />
            <Select value={selectedModel} onValueChange={(value: GroqModelId) => setSelectedModel(value)}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <div className="px-2 py-1 text-xs text-gray-400 font-medium">Production Models</div>
                {models.filter(m => m.type === 'production').map(model => (
                  <SelectItem key={model.id} value={model.id} className="text-gray-300">
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {model.contextWindow.toLocaleString()} tokens
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-xs text-gray-400 font-medium mt-2">Preview Models</div>
                {models.filter(m => m.type === 'preview').map(model => (
                  <SelectItem key={model.id} value={model.id} className="text-gray-300">
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <div className="flex items-center space-x-1">
                        {model.reasoning && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                            Reasoning
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {model.contextWindow.toLocaleString()} tokens
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {message.role === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                      <span className="text-xs text-gray-400">
                        {message.role === "user" ? "You" : "AI Assistant"}
                      </span>
                      {message.model && (
                        <Badge variant="outline" className="text-xs">
                          {message.model}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    {message.content.includes('```') && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Code className="w-3 h-3" />
                          <span>Generated code</span>
                          <Badge variant="secondary" className="bg-green-600/20 text-green-400">
                            Ready
                          </Badge>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-800 text-gray-100 rounded-lg p-4 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                    <span className="text-sm text-gray-400 ml-2">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe what you want to build..."
                className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 resize-none min-h-[60px] pr-12"
                rows={1}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-700 text-white p-2 h-8 w-8"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>AI-powered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-1/2 flex flex-col bg-gray-950"
      >
        {/* Preview Header */}
        <div className="border-b border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-sm rounded-md flex items-center space-x-2 ${
                  activeTab === "preview" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1 text-sm rounded-md flex items-center space-x-2 ${
                  activeTab === "code" 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button variant="outline" size="sm" className="border-gray-700 text-gray-300">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1">
          {activeTab === "preview" ? (
            <WebContainerComponent 
              code={generatedCode} 
              language="html" 
              isRunning={false}
            />
          ) : (
            <Card className="h-full bg-gray-900 border-gray-700 p-4">
              {generatedCode ? (
                <ScrollArea className="h-full">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                    {generatedCode}
                  </pre>
                </ScrollArea>
              ) : (
                <div className="text-center text-gray-400 mt-20">
                  <Terminal className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">Code will appear here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Generated code will be displayed in this panel
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Chat;