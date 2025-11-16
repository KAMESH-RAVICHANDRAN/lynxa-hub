import React, { useState, useEffect } from 'react';
import { useSafeUser } from '@/lib/stack-auth-config';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  EyeOff, 
  Copy, 
  Trash2, 
  Plus, 
  Key, 
  Calendar,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  lastUsed?: Date;
  usageCount: number;
  rateLimit: number;
  rateLimitUsed: number;
  status: 'active' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt?: Date;
  permissions: string[];
  ipWhitelist?: string[];
}

export function EnhancedApiKeyManager() {
  const stackUser = useSafeUser();
  const { user: legacyUser, isAuthenticated, apiKey } = useAuth();
  
  // Use either Stack Auth or legacy auth user
  const user = stackUser || legacyUser;
  const currentApiKey = apiKey;
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  
  // Form state for new API key
  const [newKeyForm, setNewKeyForm] = useState({
    name: '',
    permissions: [] as string[],
    rateLimit: 1000,
    expiresIn: 365, // days
    ipWhitelist: '',
  });

  // Available permissions
  const availablePermissions = [
    'api:read',
    'api:write', 
    'analytics:read',
    'billing:read',
    'admin:read',
    'admin:write'
  ];

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      
      // Get token from either auth system
      let token = currentApiKey; // Legacy API key
      if (stackUser) {
        try {
          token = await stackUser.getIdToken();
        } catch (err) {
          console.warn('Stack Auth token failed, using legacy');
        }
      }
      
      const response = await fetch('/api/keys', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user?.id || user?.email || 'anonymous',
        },
      });

      if (!response.ok) {
        // For now, use mock data for user-specific keys
        const mockKeys = [
          {
            id: '1',
            name: 'Production API Key',
            key: 'lynxa_prod_' + Math.random().toString(36).substring(2, 15),
            usageCount: 1247,
            rateLimit: 1000,
            rateLimitUsed: 342,
            status: 'active' as const,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
            permissions: ['api:read', 'api:write'],
            ipWhitelist: ['192.168.1.100']
          },
          {
            id: '2', 
            name: 'Development Key',
            key: 'lynxa_dev_' + Math.random().toString(36).substring(2, 15),
            usageCount: 89,
            rateLimit: 500,
            rateLimitUsed: 23,
            status: 'active' as const,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            lastUsed: new Date(Date.now() - 30 * 60 * 1000),
            permissions: ['api:read'],
            ipWhitelist: []
          }
        ];
        setApiKeys(mockKeys);
        return;
      }

      const data = await response.json();
      setApiKeys(data.data.keys || []);
    } catch (error) {
      console.error('Load API keys error:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    try {
      setCreating(true);
      const token = await user?.getIdToken();

      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyForm.name,
          permissions: newKeyForm.permissions,
          rateLimit: newKeyForm.rateLimit,
          expiresIn: newKeyForm.expiresIn,
          ipWhitelist: newKeyForm.ipWhitelist.split(',').map(ip => ip.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create API key');
      }

      const data = await response.json();
      
      // Add new key to list
      setApiKeys(prev => [data.data.key, ...prev]);
      
      // Reset form
      setNewKeyForm({
        name: '',
        permissions: [],
        rateLimit: 1000,
        expiresIn: 365,
        ipWhitelist: '',
      });
      setShowCreateForm(false);
      
      toast({
        title: "Success",
        description: `API key "${newKeyForm.name}" created successfully`,
      });

      // Auto-copy the new key
      await navigator.clipboard.writeText(data.data.key.key);
      toast({
        title: "Copied",
        description: "New API key copied to clipboard",
      });

    } catch (error) {
      console.error('Create API key error:', error);
      toast({
        title: "Error",
        description: "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    try {
      const token = await user?.getIdToken();

      const response = await fetch(`/api/keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      
      toast({
        title: "Success",
        description: "API key revoked successfully",
      });
    } catch (error) {
      console.error('Revoke API key error:', error);
      toast({
        title: "Error",
        description: "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const copyApiKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy API key",
        variant: "destructive",
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const maskApiKey = (key: string) => {
    return key.substring(0, 8) + '•'.repeat(20) + key.substring(key.length - 4);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">Please sign in to manage API keys</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-gray-600">
            Manage your personal API keys for accessing Lynxa AI services
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </Button>
      </div>

      {/* Create API Key Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
            <CardDescription>
              Generate a new API key with custom permissions and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="My API Key"
                value={newKeyForm.name}
                onChange={(e) => setNewKeyForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availablePermissions.map(permission => (
                  <label key={permission} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newKeyForm.permissions.includes(permission)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewKeyForm(prev => ({
                            ...prev,
                            permissions: [...prev.permissions, permission]
                          }));
                        } else {
                          setNewKeyForm(prev => ({
                            ...prev,
                            permissions: prev.permissions.filter(p => p !== permission)
                          }));
                        }
                      }}
                    />
                    <span className="text-sm">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests/hour)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={newKeyForm.rateLimit}
                  onChange={(e) => setNewKeyForm(prev => ({ 
                    ...prev, 
                    rateLimit: parseInt(e.target.value) || 1000 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="expiresIn">Expires In (days)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  value={newKeyForm.expiresIn}
                  onChange={(e) => setNewKeyForm(prev => ({ 
                    ...prev, 
                    expiresIn: parseInt(e.target.value) || 365 
                  }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="ipWhitelist">IP Whitelist (comma-separated, optional)</Label>
              <Input
                id="ipWhitelist"
                placeholder="192.168.1.1, 10.0.0.1"
                value={newKeyForm.ipWhitelist}
                onChange={(e) => setNewKeyForm(prev => ({ ...prev, ipWhitelist: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createApiKey}
                disabled={creating || !newKeyForm.name || newKeyForm.permissions.length === 0}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create API Key'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center">Loading API keys...</p>
            </CardContent>
          </Card>
        ) : apiKeys.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No API keys found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create your first API key to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map(apiKey => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{apiKey.name}</h3>
                      <Badge className={getStatusColor(apiKey.status)}>
                        {apiKey.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                      {apiKey.expiresAt && ` • Expires ${new Date(apiKey.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyApiKey(apiKey.key)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* API Key Display */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <code className="text-sm font-mono break-all">
                    {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                  </code>
                </div>

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">
                      {apiKey.usageCount} requests
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      {apiKey.permissions.length} permissions
                    </span>
                  </div>
                  {apiKey.lastUsed && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">
                        Last used {new Date(apiKey.lastUsed).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rate Limit Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Rate Limit Usage</span>
                    <span>{apiKey.rateLimitUsed} / {apiKey.rateLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getUsagePercentage(apiKey.rateLimitUsed, apiKey.rateLimit) > 80 
                          ? 'bg-red-500' 
                          : getUsagePercentage(apiKey.rateLimitUsed, apiKey.rateLimit) > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${getUsagePercentage(apiKey.rateLimitUsed, apiKey.rateLimit)}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <p className="text-sm font-medium mb-2">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {apiKey.permissions.map(permission => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* IP Whitelist */}
                {apiKey.ipWhitelist && apiKey.ipWhitelist.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">IP Whitelist:</p>
                    <div className="flex flex-wrap gap-1">
                      {apiKey.ipWhitelist.map(ip => (
                        <Badge key={ip} variant="outline" className="text-xs">
                          {ip}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}