import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { ApiKeyGenerator } from '@/components/ApiKeyGenerator';
import { UserProfile } from '@/components/UserProfile';
import { BillingDashboard } from '@/components/BillingDashboard';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { APIPlayground } from '@/components/APIPlayground';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Zap, 
  Home, 
  Settings, 
  BarChart3, 
  Key, 
  MessageSquare, 
  FileText, 
  Activity,
  Code2,
  Globe,
  Shield,
  Rocket,
  Clock,
  Star,
  Plus,
  ArrowRight,
  Bot,
  Sparkles,
  Layers,
  Database,
  Monitor,
  Headphones
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const quickActions = [
    {
      title: 'API Playground',
      description: 'Test API in real-time',
      icon: MessageSquare,
      action: () => document.querySelector('[data-state="inactive"][value="playground"]')?.click(),
      color: 'bg-blue-500',
      featured: true
    },
    {
      title: 'Generate API Key',
      description: 'Create new API key',
      icon: Key,
      action: () => setIsApiKeyModalOpen(true),
      color: 'bg-purple-500'
    },
    {
      title: 'View Analytics',
      description: 'Usage insights & metrics',
      icon: BarChart3,
      action: () => document.querySelector('[data-state="inactive"][value="analytics"]')?.click(),
      color: 'bg-green-500'
    },
    {
      title: 'Manage Billing',
      description: 'Plans & subscriptions',
      icon: TrendingUp,
      action: () => document.querySelector('[data-state="inactive"][value="billing"]')?.click(),
      color: 'bg-orange-500'
    }
  ];

  const features = [
    {
      title: 'Grok-Level Intelligence',
      description: 'Experience AI that thinks and responds like xAI\'s Grok',
      icon: Brain,
      status: 'Available',
      statusColor: 'bg-green-500'
    },
    {
      title: 'Lightning Fast API',
      description: 'Powered by Groq\'s ultra-fast inference infrastructure',
      icon: Zap,
      status: 'Active',
      statusColor: 'bg-blue-500'
    },
    {
      title: 'Real-time Chat',
      description: 'Interactive conversations with streaming responses',
      icon: MessageSquare,
      status: 'Live',
      statusColor: 'bg-purple-500'
    },
    {
      title: 'Advanced Analytics',
      description: 'Detailed usage metrics and performance insights',
      icon: BarChart3,
      status: 'Beta',
      statusColor: 'bg-yellow-500'
    },
    {
      title: 'Enterprise Security',
      description: 'Bank-grade security with comprehensive monitoring',
      icon: Shield,
      status: 'Active',
      statusColor: 'bg-green-500'
    },
    {
      title: 'Global Infrastructure',
      description: 'Worldwide edge deployment for minimal latency',
      icon: Globe,
      status: 'Available',
      statusColor: 'bg-blue-500'
    }
  ];

  const stats = [
    { label: 'Total Requests', value: '2.4M+', icon: Activity, change: '+12%' },
    { label: 'Active Users', value: '15.2K', icon: Users, change: '+8%' },
    { label: 'Uptime', value: '99.9%', icon: Clock, change: '0%' },
    { label: 'Avg Response', value: '145ms', icon: Zap, change: '-5%' }
  ];

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
                <h1 className="text-xl font-bold grok-text-gradient">Nexariq Platform</h1>
                <p className="text-sm text-muted-foreground">Complete AI Platform for Developers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="grok-border">
                <Bot className="w-3 h-3 mr-1" />
                Groq Powered
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/')} className="grok-border">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button variant="ghost" size="sm" onClick={logout}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 aurora-bg rounded-2xl p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Welcome to <span className="grok-text-gradient">Nexariq AI Platform</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Your comprehensive platform for Grok-level AI intelligence. Generate API keys, 
            monitor usage, and integrate advanced AI into your applications.
          </p>
          
          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Card 
                  key={index}
                  className={`grok-border bg-card/50 backdrop-blur-sm cursor-pointer transition-all duration-300 hover:scale-105 ${
                    action.featured ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={action.action}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    {action.featured && (
                      <Badge className="mt-3 bg-primary/20 text-primary border-primary/30">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="grok-border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold grok-text-gradient">{stat.value}</p>
                      <p className={`text-xs ${
                        stat.change.startsWith('+') ? 'text-green-400' : 
                        stat.change.startsWith('-') ? 'text-red-400' : 'text-muted-foreground'
                      }`}>
                        {stat.change} this month
                      </p>
                    </div>
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-secondary/50 grok-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="playground">Playground</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Platform Features */}
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="p-4 border grok-border rounded-lg bg-secondary/30">
                        <div className="flex items-start gap-3">
                          <Icon className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{feature.title}</h4>
                              <Badge 
                                variant="secondary" 
                                className={`${feature.statusColor} text-white border-0 text-xs`}
                              >
                                {feature.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-medium">Generate API Key</p>
                      <p className="text-sm text-muted-foreground">Create your first API key to start building</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-medium">Try the Console</p>
                      <p className="text-sm text-muted-foreground">Test Nexariq AI in our interactive chat interface</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div>
                      <p className="font-medium">Integrate API</p>
                      <p className="text-sm text-muted-foreground">Use our documentation to integrate into your apps</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Support & Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start grok-border">
                    <FileText className="w-4 h-4 mr-2" />
                    API Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start grok-border">
                    <Code2 className="w-4 h-4 mr-2" />
                    Code Examples
                  </Button>
                  <Button variant="outline" className="w-full justify-start grok-border">
                    <Headphones className="w-4 h-4 mr-2" />
                    Developer Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start grok-border">
                    <Users className="w-4 h-4 mr-2" />
                    Community Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api-keys">
            <ApiKeyManager />
          </TabsContent>

          <TabsContent value="playground">
            <APIPlayground />
          </TabsContent>

          <TabsContent value="billing">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="settings">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </div>

      {/* API Key Generator Modal */}
      <ApiKeyGenerator 
        isOpen={isApiKeyModalOpen} 
        onOpenChange={setIsApiKeyModalOpen} 
      />
    </div>
  );
};

export default Dashboard;