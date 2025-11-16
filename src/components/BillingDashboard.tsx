import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Zap, 
  Crown, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  ArrowUpRight,
  BarChart3,
  Clock,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export const BillingDashboard: React.FC = () => {
  const { user, subscription, usageStats, getBillingInfo, getUsageStats, createCheckoutSession, cancelSubscription } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [billingData, setBillingData] = useState<any>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        getBillingInfo(),
        getUsageStats()
      ]);
      
      // Load detailed billing data
      // This would typically come from the backend
      setBillingData({
        current_usage: {
          requests: usageStats?.total_requests || 0,
          tokens: usageStats?.total_api_calls || 0,
          limit: 10000
        },
        billing_cycle: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          current_amount: subscription?.price || 0
        },
        recent_invoices: [
          {
            id: 'inv_001',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 49.00,
            status: 'paid',
            description: 'Nexariq Pro - Monthly Subscription'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Developer',
      price: 0,
      interval: 'month',
      features: [
        '10,000 tokens/month',
        'Basic Grok models',
        'Standard rate limits',
        'Community support',
        'Basic analytics'
      ],
      popular: false,
      current: user?.plan === 'free',
      available: true
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 49,
      interval: 'month',
      features: [
        '1M tokens/month',
        'Advanced Grok models',
        'Priority processing',
        'Advanced analytics',
        'API webhooks',
        'Custom rate limits',
        'Email support',
        '✨ Demo Available'
      ],
      popular: true,
      current: user?.plan === 'pro',
      available: true,
      comingSoon: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      interval: 'month',
      features: [
        'Unlimited tokens',
        'Enterprise Grok models',
        'Dedicated infrastructure',
        '24/7 priority support',
        'Custom fine-tuning',
        'SLA guarantee',
        'White-label API',
        'Advanced security',
        '✨ Demo Available'
      ],
      popular: false,
      current: user?.plan === 'enterprise',
      available: true,
      comingSoon: true
    }
  ];

  const handleUpgrade = async (planId: string) => {
    toast({
      title: '🚀 Upgrade Coming Soon!',
      description: 'Payment processing will be available soon. For now, you can generate API keys for all plans in demo mode!',
    });
  };

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.');
    
    if (confirmed) {
      setIsLoading(true);
      const success = await cancelSubscription();
      if (success) {
        await loadBillingData();
      }
      setIsLoading(false);
    }
  };

  if (isLoading && !billingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading billing information...</span>
      </div>
    );
  }

  const usagePercentage = billingData ? 
    Math.min((billingData.current_usage.tokens / billingData.current_usage.limit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <Card className="grok-border bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-blue-400">Demo Mode Active</p>
              <p className="text-sm text-muted-foreground">
                All plans are available for testing. Payment processing will be integrated when available in your region.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold capitalize">{user?.plan || 'Free'}</p>
                <p className="text-sm text-muted-foreground">
                  {subscription?.price ? `$${subscription.price}/month` : 'No charge'}
                </p>
              </div>
              {user?.plan === 'pro' && <Crown className="w-8 h-8 text-yellow-500" />}
              {user?.plan === 'enterprise' && <Shield className="w-8 h-8 text-purple-500" />}
              {user?.plan === 'free' && <Zap className="w-8 h-8 text-blue-500" />}
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">
                  {usageStats?.total_api_calls?.toLocaleString() || 0}
                </p>
                <Badge variant="outline" className="grok-border">
                  {usagePercentage.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={usagePercentage} className="h-2" />
              <p className="text-sm text-muted-foreground">
                of {billingData?.current_usage.limit.toLocaleString() || 'unlimited'} tokens
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <p className="text-2xl font-bold">
                {subscription?.current_period_end ? 
                  new Date(subscription.current_period_end).toLocaleDateString() : 
                  'N/A'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {billingData?.billing_cycle.current_amount ? 
                  `$${billingData.billing_cycle.current_amount} charged` : 
                  'No upcoming charges'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 grok-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Details</TabsTrigger>
          <TabsTrigger value="plans">Plans & Pricing</TabsTrigger>
          <TabsTrigger value="invoices">Billing History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Usage Analytics */}
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Total Requests</span>
                  </div>
                  <p className="text-xl font-bold">
                    {usageStats?.total_requests?.toLocaleString() || 0}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Avg Response Time</span>
                  </div>
                  <p className="text-xl font-bold">
                    {usageStats?.avg_response_time ? `${usageStats.avg_response_time}ms` : 'N/A'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-muted-foreground">Error Rate</span>
                  </div>
                  <p className="text-xl font-bold">
                    {usageStats?.error_count ? 
                      `${((usageStats.error_count / usageStats.total_requests) * 100).toFixed(2)}%` : 
                      '0%'
                    }
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Active Keys</span>
                  </div>
                  <p className="text-xl font-bold">
                    {usageStats?.active_keys || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          {subscription && (
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Subscription Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{subscription.plan_name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${subscription.price}/{subscription.billing_interval}
                    </p>
                  </div>
                  <Badge 
                    variant={subscription.status === 'active' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {subscription.status}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Period</p>
                    <p className="font-medium">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Auto Renewal</p>
                    <p className="font-medium">
                      {subscription.cancel_at_period_end ? 'Disabled' : 'Enabled'}
                    </p>
                  </div>
                </div>

                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    className="w-full grok-border"
                    disabled={isLoading}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Detailed Usage Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed usage charts and metrics will be displayed here
                </p>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative grok-border bg-card/50 backdrop-blur-sm ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                } ${plan.current ? 'bg-gradient-to-br from-primary/5 to-secondary/5' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.interval}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  {plan.current ? (
                    <Button className="w-full" variant="secondary" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full grok-hover" 
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isLoading}
                      variant={plan.comingSoon ? "outline" : "default"}
                    >
                      {plan.comingSoon ? 'Try Demo' : (plan.price === 0 ? 'Downgrade' : 'Upgrade')}
                    </Button>
                  )}
                  
                  {plan.comingSoon && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      💳 Payment processing coming soon
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              {billingData?.recent_invoices?.length > 0 ? (
                <div className="space-y-4">
                  {billingData.recent_invoices.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border grok-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{invoice.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {invoice.status}
                        </Badge>
                        <span className="font-semibold">${invoice.amount.toFixed(2)}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Invoices Yet</h3>
                  <p className="text-muted-foreground">
                    Your billing history will appear here once you have transactions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};