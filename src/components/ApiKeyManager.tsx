import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  Calendar, 
  Activity,
  TrendingUp,
  Users,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  api_key: string;
  name: string;
  created_at: string;
  last_used: string | null;
  usage_count: number;
  is_active: boolean;
}

interface UsageStats {
  total_requests: number;
  requests_today: number;
  requests_this_month: number;
  success_rate: number;
  avg_response_time: number;
}

export const ApiKeyManager: React.FC = () => {
  const { apiKey, user, userApiKeys, generateApiKey, revokeApiKey: revokeKey, getUserApiKeys } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    getUserApiKeys();
    loadUsageStats();
  }, []);

  useEffect(() => {
    setIsLoading(false);
  }, [userApiKeys]);



  const loadUsageStats = async () => {
    try {
      const response = await fetch('https://lynxa-pro-backend.vercel.app/api/analytics', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const generateNewKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your API key',
        variant: 'destructive'
      });
      return;
    }

    if (!user?.email) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to generate API keys',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const newKey = await generateApiKey(newKeyName.trim(), user.email);

      if (newKey) {
        setNewKeyName('');
        setShowNewKeyDialog(false);
      }
    } catch (error) {
      console.error('API key generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(keyId)) {
      newVisibleKeys.delete(keyId);
    } else {
      newVisibleKeys.add(keyId);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const handleRevokeKey = async (keyId: string) => {
    await revokeKey(keyId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskKey = (key: string) => {
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                  <p className="text-2xl font-bold grok-text-gradient">{stats.total_requests.toLocaleString()}</p>
                </div>
                <Activity className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold grok-text-gradient">{stats.requests_today}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold grok-text-gradient">{stats.success_rate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold grok-text-gradient">{stats.avg_response_time}ms</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* API Keys Management */}
      <Card className="grok-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
              <DialogTrigger asChild>
                <Button className="grok-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Key
                </Button>
              </DialogTrigger>
              <DialogContent className="grok-border bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Key Name</label>
                    <Input
                      placeholder="e.g., Production App, Testing, Mobile App..."
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="grok-border"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewKeyDialog(false)}
                      className="grok-border"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={generateNewKey}
                      disabled={isGenerating}
                      className="grok-hover"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        'Generate Key'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {userApiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
              <p className="text-muted-foreground mb-4">
                Generate your first API key to start using Lynxa Pro
              </p>
              <Button onClick={() => setShowNewKeyDialog(true)} className="grok-hover">
                <Plus className="w-4 h-4 mr-2" />
                Generate Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userApiKeys.map((key) => (
                <div 
                  key={key.id}
                  className="flex items-center justify-between p-4 border grok-border rounded-lg bg-secondary/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{key.name}</h4>
                      <Badge 
                        variant={key.is_active ? "default" : "secondary"}
                        className={key.is_active ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}
                      >
                        {key.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-background px-2 py-1 rounded border">
                        {visibleKeys.has(key.id) ? key.api_key : maskKey(key.api_key)}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys.has(key.id) ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyKey(key.api_key)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Created {formatDate(key.created_at)}
                      </span>
                      {key.last_used && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last used {formatDate(key.last_used)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {key.usage_count} requests
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRevokeKey(key.id)}
                      className="text-red-400 hover:text-red-300 hover:border-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start grok-border">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Usage Stats
            </Button>
            <Button variant="outline" className="w-full justify-start grok-border">
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </Button>
            <Button variant="outline" className="w-full justify-start grok-border">
              <Users className="w-4 h-4 mr-2" />
              Team Management
            </Button>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Security Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Keep Keys Secure</p>
                <p className="text-xs text-muted-foreground">Never share your API keys publicly or commit them to version control</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Rotate Regularly</p>
                <p className="text-xs text-muted-foreground">Generate new keys periodically and revoke unused ones</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Monitor Usage</p>
                <p className="text-xs text-muted-foreground">Keep track of your API usage and set up alerts for unusual activity</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};