import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Send, User, Bot, Play, Copy, Check } from 'lucide-react';
import { streamAIResponse } from '@/lib/ai';
import { executeCode } from '@/lib/sandbox';
// @ts-expect-error: If type declarations are missing, ignore for now
import CodeExecutionDisplay from './CodeExecutionDisplay';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

interface CodeBlock {
  id: string;
  language: 'python' | 'javascript';
  code: string;
  executed?: boolean;
  output?: {
    stdout: string;
    stderr: string;
    results: any[];
    error?: any;
  };
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const codeBlockRegex = /```(python|javascript|js)\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] === 'js' ? 'javascript' : match[1] as 'python' | 'javascript';
      blocks.push({
        id: `code-${Date.now()}-${Math.random()}`,
        language,
        code: match[2].trim(),
        executed: false,
      });
    }

    return blocks;
  };

  const executeCodeBlock = async (messageId: string, codeBlockId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.codeBlocks) return;

    const codeBlock = message.codeBlocks.find(cb => cb.id === codeBlockId);
    if (!codeBlock) return;

    try {
      const output = await executeCode(codeBlock.code, codeBlock.language);
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              codeBlocks: msg.codeBlocks?.map(cb => 
                cb.id === codeBlockId 
                  ? { ...cb, executed: true, output }
                  : cb
              )
            }
          : msg
      ));
    } catch (error) {
      console.error('Code execution failed:', error);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? {
              ...msg,
              codeBlocks: msg.codeBlocks?.map(cb => 
                cb.id === codeBlockId 
                  ? { 
                      ...cb, 
                      executed: true, 
                      output: { 
                        stdout: '', 
                        stderr: `Execution Error: ${error}`, 
                        results: [],
                        error: error 
                      }
                    }
                  : cb
              )
            }
          : msg
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const streamResult = await streamAIResponse(input.trim());
      let assistantContent = '';

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      for await (const delta of streamResult.textStream) {
        assistantContent += delta;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: assistantContent }
            : msg
        ));
      }

      // Extract code blocks after streaming is complete
      const codeBlocks = extractCodeBlocks(assistantContent);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, codeBlocks }
          : msg
      ));

    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="p-4 border-b">
        <h2 className="text-2xl font-semibold">AI Assistant</h2>
        <p className="text-muted-foreground">Ask questions and execute code with AI assistance</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground">Ask me anything or request code examples!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className="flex-shrink-0">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Card className={message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {message.codeBlocks && message.codeBlocks.map((codeBlock) => (
                      <div key={codeBlock.id} className="space-y-2">
                        <Card className="bg-card border">
                          <CardContent className="p-0">
                            <div className="flex items-center justify-between p-3 border-b">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{codeBlock.language}</Badge>
                                <span className="text-sm text-muted-foreground">Code Block</span>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => copyToClipboard(codeBlock.code)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => executeCodeBlock(message.id, codeBlock.id)}
                                  disabled={codeBlock.executed}
                                >
                                  {codeBlock.executed ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  {codeBlock.executed ? 'Executed' : 'Run'}
                                </Button>
                              </div>
                            </div>
                            <div className="p-3">
                              <pre className="text-sm overflow-x-auto">
                                <code>{codeBlock.code}</code>
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {codeBlock.executed && codeBlock.output && (
                          <CodeExecutionDisplay output={codeBlock.output} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <Card className="bg-muted">
                <CardContent className="p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <Separator />

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything or request code..."
            className="flex-1 min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} className="self-end">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface; 