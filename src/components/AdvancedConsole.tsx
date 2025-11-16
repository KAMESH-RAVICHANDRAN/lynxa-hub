import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Paperclip, 
  RotateCcw, 
  Settings, 
  Sparkles, 
  Brain, 
  Zap,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share,
  BookOpen,
  Code2,
  Lightbulb,
  Search,
  Globe,
  Calendar,
  Calculator,
  FileText,
  Bot
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  tokens?: {
    prompt: number;
    completion: number;
  };
}

interface Suggestion {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  prompt: string;
  category: string;
}

const suggestions: Suggestion[] = [
  {
    icon: Code2,
    title: 'Code Generation',
    description: 'Write and debug code in any language',
    prompt: 'Write a Python function that calculates the Fibonacci sequence up to n numbers',
    category: 'Development'
  },
  {
    icon: Lightbulb,
    title: 'Creative Writing',
    description: 'Stories, poems, and creative content',
    prompt: 'Write a short science fiction story about AI and humans working together',
    category: 'Creative'
  },
  {
    icon: Search,
    title: 'Research Assistant',
    description: 'Deep analysis and research',
    prompt: 'Explain the latest developments in quantum computing and their potential applications',
    category: 'Research'
  },
  {
    icon: Calculator,
    title: 'Problem Solving',
    description: 'Math, logic, and analytical thinking',
    prompt: 'Solve this step by step: If a train travels 120 km in 2 hours, how long will it take to travel 300 km at the same speed?',
    category: 'Analysis'
  },
  {
    icon: Globe,
    title: 'Language Learning',
    description: 'Translation and language practice',
    prompt: 'Help me practice Spanish by having a conversation about daily activities',
    category: 'Language'
  },
  {
    icon: FileText,
    title: 'Content Creation',
    description: 'Marketing copy, emails, and documents',
    prompt: 'Write a professional email announcing a new product launch to our customers',
    category: 'Business'
  }
];

export const AdvancedConsole: React.FC = () => {
  const { user, apiKey } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState('lynxa-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsStreaming(true);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          max_tokens: maxTokens,
          temperature: temperature,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Nexariq AI');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsStreaming(false);
              setMessages(prev => prev.map(msg => 
                msg.id === assistantMessage.id 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + content }
                    : msg
                ));
              }
            } catch (e) {
              // Ignore malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Chat Error',
        description: 'Failed to get response from Nexariq AI. Please try again.',
        variant: 'destructive'
      });
      
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard.',
    });
  };

  const useSuggestion = (prompt: string) => {
    setInputMessage(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold grok-text-gradient">Nexariq Console</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    {selectedModel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    Groq Powered
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tabs value={selectedModel} onValueChange={setSelectedModel} className="w-auto">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="lynxa-pro" className="text-xs">Lynxa Pro</TabsTrigger>
                  <TabsTrigger value="lynxa-creative" className="text-xs">Creative</TabsTrigger>
                  <TabsTrigger value="lynxa-code" className="text-xs">Code</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button variant="outline" size="sm" onClick={clearChat} className="grok-border">
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button variant="outline" size="sm" className="grok-border">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 grok-border bg-card/50 backdrop-blur-sm flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-3 grok-text-gradient">
                        Welcome to Nexariq Console
                      </h2>
                      <p className="text-muted-foreground mb-6">
                        Experience Grok-level AI intelligence powered by Groq's lightning-fast infrastructure.
                        Start a conversation or try one of the suggestions below.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'}>
                            {message.role === 'user' ? 'U' : 'N'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-4 ${
                          message.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-auto' 
                            : 'bg-secondary/50 grok-border'
                        }`}>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {message.content}
                            {message.isStreaming && (
                              <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                            )}
                          </div>
                          
                          {message.role === 'assistant' && !message.isStreaming && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                              <Button size="sm" variant="ghost" onClick={() => copyMessage(message.content)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Share className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-6">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask Nexariq anything... (Press Enter to send)"
                      className="pr-32 grok-border bg-secondary/50"
                      disabled={isStreaming}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button size="sm" variant="ghost" disabled>
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" disabled>
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setIsListening(!isListening)}
                        className={isListening ? 'text-red-400' : ''}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isStreaming}
                    className="grok-hover"
                  >
                    {isStreaming ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Quick Actions */}
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start grok-border">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Docs
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start grok-border">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start grok-border">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm">Try These</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.slice(0, 4).map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div 
                      key={index}
                      onClick={() => useSuggestion(suggestion.prompt)}
                      className="p-3 rounded-lg border grok-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                            {suggestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Model Stats */}
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-sm">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Messages:</span>
                  <span>{messages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <span>{selectedModel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Temp:</span>
                  <span>{temperature}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tokens:</span>
                  <span>{maxTokens}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};