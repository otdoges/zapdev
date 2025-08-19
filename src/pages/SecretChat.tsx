import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Send, Settings, Key, MessageCircle, Plus, Trash2 } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    model?: string;
    tokens?: number;
    cost?: number;
  };
}

export default function SecretChat() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [currentChatId, setCurrentChatId] = useState<Id<"secretChats"> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check secret access status
  const secretAccess = useQuery(api.secretAccess.hasSecretAccess);
  const isSetupComplete = useQuery(api.secretAccess.isSecretSetupComplete);
  const userApiKeys = useQuery(api.secretApiKeys.getUserApiKeys);
  const geminiApiKeyFromDb = useQuery(api.secretApiKeys.getDecryptedApiKey, { provider: "gemini" });
  const secretChats = useQuery(api.secretChats.getSecretChats);
  const currentChat = useQuery(
    api.secretChats.getSecretChat,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  // Mutations
  const setupSecretAccess = useMutation(api.secretAccess.setupSecretAccess);
  const verifyPassword = useMutation(api.secretAccess.verifySecretPassword);
  const setApiKey = useMutation(api.secretApiKeys.setApiKey);
  const createChat = useMutation(api.secretChats.createSecretChat);
  const addMessage = useMutation(api.secretChats.addSecretMessage);
  const deleteChat = useMutation(api.secretChats.deleteSecretChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (currentChat) {
      setMessages(currentChat.messages || []);
    }
  }, [currentChat]);

  useEffect(() => {
    if (isSetupComplete === false) {
      setIsSetupMode(true);
      setShowPasswordInput(true);
    } else if (secretAccess?.hasAccess === false) {
      setShowPasswordInput(true);
    }
  }, [isSetupComplete, secretAccess]);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast({
        title: "Error",
        description: "Please enter a password",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSetupMode) {
        await setupSecretAccess({ password });
        toast({
          title: "Success",
          description: "Secret access has been set up successfully!",
        });
      } else {
        await verifyPassword({ password });
        toast({
          title: "Access Granted",
          description: "Welcome to the secret chat!",
        });
      }
      setShowPasswordInput(false);
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid password",
        variant: "destructive",
      });
    }
  };

  const handleApiKeySubmit = async () => {
    if (!geminiApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      });
      return;
    }

    try {
      await setApiKey({ provider: "gemini", apiKey: geminiApiKey });
      toast({
        title: "Success",
        description: "API key saved successfully!",
      });
      setGeminiApiKey("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const chatId = await createChat({
        title: `Chat ${new Date().toLocaleString()}`,
        provider: "gemini",
        model: selectedModel,
      });
      setCurrentChatId(chatId);
      setMessages([]);
      toast({
        title: "Success",
        description: "New chat created!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async (chatId: Id<"secretChats">) => {
    try {
      await deleteChat({ chatId });
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      toast({
        title: "Success",
        description: "Chat deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chat",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;
    if (!currentChatId) {
      await handleCreateNewChat();
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: currentMessage,
    };

    // Add user message to local state immediately
    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    setIsLoading(true);

    try {
      // Save user message to database
      await addMessage({
        chatId: currentChatId,
        content: messageToSend,
        role: "user",
      });

      // Check if user has a Gemini API key
      if (!geminiApiKeyFromDb) {
        throw new Error("No Gemini API key found. Please add your API key in the settings tab.");
      }

      // Make API call to secret chat endpoint
      const response = await fetch("/api/secret-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          apiKey: geminiApiKeyFromDb,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get AI response");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.message.content,
        metadata: data.usage,
      };

      // Add assistant message to local state
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await addMessage({
        chatId: currentChatId,
        content: assistantMessage.content,
        role: "assistant",
        metadata: assistantMessage.metadata,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show password input if user doesn't have access
  if (showPasswordInput) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">
              {isSetupMode ? "Set Up Secret Access" : "Enter Secret Password"}
            </CardTitle>
            <p className="text-muted-foreground">
              {isSetupMode 
                ? "Set a password to protect the secret chat feature"
                : "Enter the password to access the secret chat"
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
            />
            <Button onClick={handlePasswordSubmit} className="w-full">
              {isSetupMode ? "Set Password" : "Access Secret Chat"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main secret chat interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto p-4 h-screen flex flex-col">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5" />
            <h1 className="text-2xl font-bold">Secret Chat</h1>
            <Badge variant="secondary">Gemini AI</Badge>
          </div>
          <p className="text-muted-foreground">
            Private AI chat using your personal Gemini API key
          </p>
        </div>

        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col">
            <div className="flex gap-4 mb-4">
              <Button onClick={handleCreateNewChat} size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
              
              {secretChats && secretChats.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {secretChats.slice(0, 5).map((chat) => (
                    <div key={chat._id} className="flex items-center gap-1">
                      <Button
                        variant={currentChatId === chat._id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentChatId(chat._id)}
                        className="whitespace-nowrap"
                      >
                        {chat.title.length > 20 ? `${chat.title.slice(0, 20)}...` : chat.title}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteChat(chat._id)}
                        className="p-1 h-8 w-8"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Card className="flex-1 flex flex-col bg-slate-800 border-slate-700">
              <CardContent className="flex-1 flex flex-col p-4">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with Gemini AI</p>
                      <p className="text-sm">Your messages are private and use your own API key</p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.metadata && (
                            <div className="text-xs opacity-70 mt-2">
                              {message.metadata.tokens && `${message.metadata.tokens} tokens`}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-700 rounded-lg p-3 text-white">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-slate-700 border-slate-600 text-white resize-none"
                    rows={2}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !currentMessage.trim()}
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="grid gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Gemini API Key
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your personal Gemini API key. Get one from{" "}
                    <a 
                      href="https://ai.google.dev/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </p>
                  
                  {userApiKeys?.some(key => key.provider === "gemini") ? (
                    <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-md">
                      <Key className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Gemini API key is configured</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Enter your Gemini API key (AIza...)"
                        value={geminiApiKey}
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Button onClick={handleApiKeySubmit} className="w-full">
                        Save API Key
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle>Model Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gemini Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                    >
                      <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}