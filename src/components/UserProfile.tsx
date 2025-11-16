import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Mail, 
  Building2, 
  Calendar,
  Crown,
  Key,
  Activity,
  Settings,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const UserProfile: React.FC = () => {
  const { user, updateUser, userApiKeys } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    organization: user?.organization || ''
  });

  if (!user) return null;

  const handleSave = () => {
    updateUser(editData);
    setIsEditing(false);
    toast({
      title: 'Profile Updated',
      description: 'Your profile has been updated successfully.',
    });
  };

  const handleCancel = () => {
    setEditData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      organization: user?.organization || ''
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="grok-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="" />
                <AvatarFallback className="text-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold grok-text-gradient">
                  {user.first_name} {user.last_name}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    {user.plan || 'Free'} Plan
                  </Badge>
                  <Badge variant="outline" className="grok-border">
                    <Calendar className="w-3 h-3 mr-1" />
                    Joined {formatDate(user.created_at)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="grok-border"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={editData.first_name}
                    onChange={(e) => setEditData({...editData, first_name: e.target.value})}
                    className="grok-border"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={editData.last_name}
                    onChange={(e) => setEditData({...editData, last_name: e.target.value})}
                    className="grok-border"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={editData.organization}
                  onChange={(e) => setEditData({...editData, organization: e.target.value})}
                  className="grok-border"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSave} className="grok-hover">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} className="grok-border">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Full Name</span>
                </div>
                <p className="text-sm">
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                    : 'Not set'
                  }
                </p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm">{user.email}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Organization</span>
                </div>
                <p className="text-sm">{user.organization || 'Not specified'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">API Keys</p>
                <p className="text-2xl font-bold grok-text-gradient">{userApiKeys.length}</p>
              </div>
              <Key className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-bold grok-text-gradient">
                  {userApiKeys.reduce((sum, key) => sum + key.usage_count, 0).toLocaleString()}
                </p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Account Type</p>
                <p className="text-2xl font-bold grok-text-gradient">{user.plan || 'Free'}</p>
              </div>
              <Crown className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent API Keys */}
      <Card className="grok-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Recent API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userApiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys Yet</h3>
              <p className="text-muted-foreground">
                Generate your first API key to start using Nexariq AI
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userApiKeys.slice(0, 3).map((key) => (
                <div 
                  key={key.id}
                  className="flex items-center justify-between p-3 border grok-border rounded-lg bg-secondary/30"
                >
                  <div>
                    <h4 className="font-medium">{key.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Created {formatDate(key.created_at)} • {key.usage_count} requests
                    </p>
                  </div>
                  <Badge 
                    variant={key.is_active ? "default" : "secondary"}
                    className={key.is_active ? "bg-green-500/20 text-green-300 border-green-500/30" : ""}
                  >
                    {key.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
              
              {userApiKeys.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  And {userApiKeys.length - 3} more keys...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};