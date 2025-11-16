import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedConsole } from '@/components/AdvancedConsole';
import { EnhancedApiKeyManager } from '@/components/EnhancedApiKeyManager';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { APIPlayground } from '@/components/APIPlayground';
import { 
  Bot, 
  Key, 
  BarChart3, 
  Code2,
  Brain,
  Zap
} from 'lucide-react';

const Console = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold grok-text-gradient">Lynxa Console</h1>
                <p className="text-sm text-muted-foreground">
                  Complete AI workspace with chat, API management, and analytics
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                <span>Powered by Stack Auth & Neon</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/50">
            <TabsTrigger 
              value="chat" 
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Bot className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger 
              value="api-keys"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger 
              value="playground"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Code2 className="w-4 h-4" />
              API Playground
            </TabsTrigger>
            <TabsTrigger 
              value="analytics"
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="chat" className="space-y-6">
              <AdvancedConsole />
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <EnhancedApiKeyManager />
            </TabsContent>

            <TabsContent value="playground" className="space-y-6">
              <APIPlayground />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <AdvancedAnalytics />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Console;
