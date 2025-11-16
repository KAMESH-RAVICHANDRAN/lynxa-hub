import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedConsole } from '@/components/AdvancedConsole';
import { GroqConsole } from '@/components/GroqConsole';
import { EnhancedApiKeyManager } from '@/components/EnhancedApiKeyManager';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { APIPlayground } from '@/components/APIPlayground';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleAuth } from '@/contexts/GoogleAuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  Key, 
  BarChart3, 
  Code2,
  Brain,
  Zap,
  LogIn,
  Sparkles,
  Gauge
} from 'lucide-react';

const Console = () => {
  const [activeTab, setActiveTab] = useState('groq');
  const { user: legacyUser } = useAuth();
  const { user: googleUser } = useGoogleAuth();
  const user = googleUser || legacyUser;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="w-96 shadow-xl border-0">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Access Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access the Console and experience advanced AI capabilities.
            </p>
            <Button 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              onClick={() => window.location.href = '/'}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <TabsList className="grid w-full grid-cols-5 bg-secondary/50">
            <TabsTrigger 
              value="groq" 
              className="flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
            >
              <Gauge className="w-4 h-4" />
              Groq Console
            </TabsTrigger>
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
            <TabsContent value="groq" className="space-y-0 -m-6">
              <GroqConsole />
            </TabsContent>

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
