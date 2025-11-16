import React, { useState, useEffect } from "react";
import { Brain, TrendingUp, Zap, Users, Clock, Activity, Copy, Check, Home, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { ApiClient } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface AnalyticsData {
  total_requests: number;
  total_tokens: number;
  avg_response_time: number;
  error_rate: number;
  cost_estimate: number;
  daily_usage: Array<{
    date: string;
    requests: number;
    tokens: number;
  }>;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, apiKey, logout } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!apiKey) {
      navigate('/console');
      return;
    }
    
    fetchAnalytics();
  }, [apiKey]);

  const fetchAnalytics = async () => {
    try {
      const apiClient = new ApiClient(apiKey);
      const data = await apiClient.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Analytics Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = async () => {
    if (!apiKey) return;
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  if (!user || !apiKey) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please connect your API key</h2>
          <Button onClick={() => navigate('/console')}>Go to Console</Button>
        </div>
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
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold grok-text-gradient">Nexariq AI Dashboard</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    Live Analytics
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/')}
                className="grok-border"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/console')}
                className="grok-border"
              >
                Console
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold grok-text-gradient">
                {isLoading ? '...' : analytics?.total_requests?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Tokens Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold grok-text-gradient">
                {isLoading ? '...' : analytics?.total_tokens?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 30 days
              </p>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold grok-text-gradient">
                {isLoading ? '...' : `${Math.round(analytics?.avg_response_time || 0)}ms`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                -5ms improvement
              </p>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Error Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold grok-text-gradient">
                {isLoading ? '...' : `${((analytics?.error_rate || 0) * 100).toFixed(2)}%`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Within SLA targets
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50 border grok-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Your API Key</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyApiKey}
                      className="h-8 px-3"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground">
                    {apiKey ? `${apiKey.substring(0, 12)}...${apiKey.substring(apiKey.length - 8)}` : 'Not connected'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border grok-border">
                  <div className="text-sm font-medium mb-2">Endpoint</div>
                  <div className="font-mono text-sm text-muted-foreground">
                    https://lynxa-pro-backend.vercel.app/api/lynxa
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50 border grok-border">
                  <div className="text-sm font-medium mb-2">Model</div>
                  <div className="font-mono text-sm text-muted-foreground">
                    lynxa-pro (Grok-level Intelligence)
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">API connection established</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">Analytics data refreshed</p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm">Console session started</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start grok-border"
                  onClick={() => navigate('/console')}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Open Console
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start grok-border"
                  onClick={() => navigate('/docs')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start grok-border"
                  onClick={fetchAnalytics}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Refresh Analytics
                </Button>
              </CardContent>
            </Card>

            <Card className="grok-border grok-gradient text-white">
              <CardHeader>
                <CardTitle className="text-white">Grok-level Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-100 mb-4">
                  Experience the most advanced AI reasoning capabilities with real-time knowledge and deep understanding.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => navigate('/console')}
                >
                  Try Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
