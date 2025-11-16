import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Bot,
  Play,
  Square,
  ChevronDown,
  Clock,
  TrendingUp,
  Gauge
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
  responseTime?: number;
}

interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  contextLength: number;
  costPer1k: number;
  speed: 'ultra-fast' | 'fast' | 'medium';
  capabilities: string[];
}

const availableModels: ModelConfig[] = [
  {
    id: 'lynxa-pro',
    name: 'Lynxa Pro',
    provider: 'Nexariq',
    description: 'Advanced AI assistant powered by Llama 3.3 70B',
    contextLength: 32768,
    costPer1k: 0.59,
    speed: 'ultra-fast',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative', 'enterprise']
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'Groq',
    description: 'Latest Llama model for complex reasoning',
    contextLength: 32768,
    costPer1k: 0.59,
    speed: 'ultra-fast',
    capabilities: ['reasoning', 'coding', 'analysis', 'creative']
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'Groq',
    description: 'Lightning fast responses for simple tasks',
    contextLength: 8192,
    costPer1k: 0.05,
    speed: 'ultra-fast',
    capabilities: ['chat', 'simple-tasks', 'qa']
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'Groq',
    description: 'Excellent for multilingual and analytical tasks',
    contextLength: 32768,
    costPer1k: 0.27,
    speed: 'fast',
    capabilities: ['multilingual', 'analysis', 'reasoning']
  }
];

export const GroqConsole: React.FC = () => {
  const { user: legacyUser, apiKey } = useAuth();
  const { user: googleUser } = useGoogleAuth();
  const user = googleUser || legacyUser;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState('lynxa-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [showSettings, setShowSettings] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    
    // Initialize conversation ID
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [conversationId]);

  // Load conversation history on mount
  useEffect(() => {
    if (user && apiKey && conversationId) {
      loadConversationHistory();
    }
  }, [user, apiKey, conversationId]);

  const loadConversationHistory = async () => {
    try {
      // This would load from your backend if you have conversation storage
      // For now, we'll use localStorage as a fallback
      const savedMessages = localStorage.getItem(`conversation_${conversationId}`);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const saveMessageToStorage = async (newMessages: Message[]) => {
    try {
      // Save to localStorage (you can replace this with API call to your backend)
      localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(newMessages));
      
      // Also save to backend if API is available
      if (apiKey && conversationId) {
        await apiClient.post('/api/conversations/save', {
          conversation_id: conversationId,
          messages: newMessages,
          user_id: user?.id || user?.email
        }).catch(err => console.warn('Failed to save to backend:', err));
      }
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  const getModelConfig = (modelId: string) => {
    return availableModels.find(m => m.id === modelId) || availableModels[0];
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming || !apiKey) {
      if (!apiKey) {
        toast({
          title: 'API Key Required',
          description: 'Please set your Lynxa API key to use the chat feature.',
          variant: 'destructive'
        });
      }
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsStreaming(true);
    
    // Save user message to storage
    await saveMessageToStorage(updatedMessages);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      model: selectedModel
    };

    setMessages(prev => [...prev, assistantMessage]);

    const startTime = Date.now();
    abortControllerRef.current = new AbortController();

    try {
      // Prepare conversation history for API
      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use Lynxa Pro API or direct Groq API
      const apiUrl = selectedModel === 'lynxa-pro' 
        ? 'https://lynxa-pro-backend.vercel.app/api/lynxa'
        : 'https://api.groq.com/openai/v1/chat/completions';
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      const body = JSON.stringify({
        model: selectedModel,
        messages: conversationMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let inputTokens = 0;
      let outputTokens = 0;

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
              const responseTime = Date.now() - startTime;
              setIsStreaming(false);
              setMessages(prev => {
                const finalMessages = prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { 
                        ...msg, 
                        isStreaming: false, 
                        responseTime,
                        tokens: { input: inputTokens, output: outputTokens }
                      }
                    : msg
                );
                // Save completed conversation to storage
                saveMessageToStorage(finalMessages);
                return finalMessages;
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens || 0;
                outputTokens = parsed.usage.completion_tokens || 0;
              }

              if (content) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + content }
                    : msg
                ));
              }

              // Track usage analytics in real-time
              if (parsed.usage) {
                try {
                  await apiClient.post('/api/analytics/track', {
                    conversation_id: conversationId,
                    model: selectedModel,
                    tokens_used: parsed.usage.total_tokens,
                    user_id: user?.id || user?.email,
                    timestamp: new Date().toISOString()
                  }).catch(err => console.warn('Analytics tracking failed:', err));
                } catch (error) {
                  console.warn('Failed to track usage:', error);
                }
              }
            } catch (e) {
              // Ignore malformed JSON chunks
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        const responseTime = Date.now() - startTime;
        const errorMessage = error.message || 'An error occurred while sending your message.';
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { 
                ...msg, 
                content: `❌ Error: ${errorMessage}`, 
                isStreaming: false,
                responseTime
              }
            : msg
        ));

        toast({
          title: 'Chat Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
      
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
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
    // Generate new conversation ID
    const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setConversationId(newConversationId);
    // Clear localStorage for current conversation
    if (conversationId) {
      localStorage.removeItem(`conversation_${conversationId}`);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied!',
      description: 'Message copied to clipboard.',
    });
  };

  const exportConversation = async () => {
    try {
      const exportData = {
        conversation_id: conversationId,
        messages: messages,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        user: user?.name || user?.email
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lynxa-conversation-${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Conversation Exported',
        description: 'Your conversation has been downloaded as JSON.',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export conversation.',
        variant: 'destructive'
      });
    }
  };

  const shareConversation = async () => {
    try {
      if (conversationId && messages.length > 0) {
        // Create shareable link (you can implement this in your backend)
        const shareUrl = `${window.location.origin}/shared/${conversationId}`;
        await navigator.clipboard.writeText(shareUrl);
        
        toast({
          title: 'Link Copied!',
          description: 'Shareable conversation link copied to clipboard.',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to create shareable link.',
        variant: 'destructive'
      });
    }
  };

  const currentModel = getModelConfig(selectedModel);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Lynxa Console
                </h1>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <Gauge className="w-3 h-3 mr-1" />
                    {currentModel.speed}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Bot className="w-3 h-3 mr-1" />
                    {currentModel.name}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    ${currentModel.costPer1k}/1K tokens
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* API Key Status */}
              <Badge variant={apiKey ? "default" : "destructive"} className="text-xs">
                {apiKey ? "🔑 API Connected" : "🔒 No API Key"}
              </Badge>
              
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent text-sm font-medium focus:outline-none"
                  disabled={!apiKey}
                >
                  {availableModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportConversation}
                className="border-gray-200 hover:bg-gray-50"
                disabled={messages.length === 0}
              >
                📥 Export
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={shareConversation}
                className="border-gray-200 hover:bg-gray-50"
                disabled={messages.length === 0}
              >
                🔗 Share
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearChat}
                className="border-gray-200 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className="border-gray-200 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Welcome to Lynxa Console
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Experience advanced AI powered by Lynxa Pro and Groq's LPU technology. 
                    Get lightning-fast responses with real-time analytics and conversation history.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {currentModel.capabilities.map((capability, index) => (
                      <Badge key={index} variant="outline" className="text-xs py-1">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`flex gap-4 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        {message.role === 'user' ? (
                          <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                        ) : null}
                        <AvatarFallback className={message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}>
                          {message.role === 'user' ? (user?.name?.[0] || 'U') : 'G'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`rounded-2xl px-4 py-3 ${message.role === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-white border border-gray-200 shadow-sm'
                      }`}>
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          {message.content}
                          {message.isStreaming && (
                            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                          )}
                        </div>
                        
                        {message.role === 'assistant' && !message.isStreaming && (
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {message.responseTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {message.responseTime}ms
                                </span>
                              )}
                              {message.tokens && (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {message.tokens.input + message.tokens.output} tokens
                                </span>
                              )}
                              {message.model && (
                                <Badge variant="secondary" className="text-xs">
                                  {getModelConfig(message.model).name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => copyMessage(message.content)}>
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <ThumbsUp className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <ThumbsDown className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200/50 bg-white/50 backdrop-blur-sm px-6 py-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything... (Press Enter to send)"
                  className="pr-32 border-gray-200 bg-white shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
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
                    className={isListening ? 'text-red-500' : ''}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isStreaming}
                className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Sidebar */}
        {showSettings && (
          <div className="w-80 border-l border-gray-200 bg-gray-50/50 p-6">
            <h3 className="font-semibold mb-4">Console Settings</h3>
            
            <div className="space-y-6">
              {/* Model Configuration */}
              <div>
                <h4 className="font-medium mb-3">Model Configuration</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Temperature</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">Current: {temperature}</div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Tokens</label>
                    <input 
                      type="range" 
                      min="100" 
                      max="32768" 
                      step="100" 
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">Current: {maxTokens.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Current Session Stats */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Session Statistics</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Messages:</strong> {messages.length}</p>
                  <p><strong>Conversation ID:</strong> {conversationId?.slice(-8)}...</p>
                  <p><strong>Total Tokens:</strong> {messages.reduce((sum, msg) => 
                    sum + (msg.tokens ? msg.tokens.input + msg.tokens.output : 0), 0
                  ).toLocaleString()}</p>
                </div>
              </div>
              
              {/* Current Model Info */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Current Model</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Name:</strong> {currentModel.name}</p>
                  <p><strong>Provider:</strong> {currentModel.provider}</p>
                  <p><strong>Context:</strong> {currentModel.contextLength.toLocaleString()} tokens</p>
                  <p><strong>Speed:</strong> {currentModel.speed}</p>
                  <p><strong>Cost:</strong> ${currentModel.costPer1k}/1K tokens</p>
                </div>
              </div>

              {/* API Status */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">API Status</h4>
                <div className="text-sm space-y-2">
                  <div className={`flex items-center gap-2 ${apiKey ? 'text-green-600' : 'text-red-600'}`}>
                    <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    {apiKey ? 'Connected' : 'Not Connected'}
                  </div>
                  {!apiKey && (
                    <p className="text-xs text-gray-500">
                      Set your API key in the API Keys tab to enable chat functionality.
                    </p>
                  )}
                </div>
              </div>

              {/* Conversation Actions */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={exportConversation}
                    disabled={messages.length === 0}
                  >
                    Export Conversation
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={shareConversation}
                    disabled={messages.length === 0}
                  >
                    Share Conversation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};