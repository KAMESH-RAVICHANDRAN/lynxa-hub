import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Clock, 
  Users, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const AdvancedAnalytics: React.FC = () => {
  const { usageStats, getUsageStats } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      await getUsageStats();
      
      // Simulate advanced analytics data
      setAnalyticsData({
        overview: {
          total_requests: Math.floor(Math.random() * 10000) + 5000,
          successful_requests: Math.floor(Math.random() * 9000) + 4500,
          failed_requests: Math.floor(Math.random() * 500) + 100,
          avg_response_time: Math.floor(Math.random() * 200) + 100,
          unique_ips: Math.floor(Math.random() * 100) + 50,
          data_transferred: Math.floor(Math.random() * 1000) + 500
        },
        trends: {
          requests_change: Math.floor(Math.random() * 50) - 25,
          response_time_change: Math.floor(Math.random() * 20) - 10,
          success_rate_change: Math.floor(Math.random() * 10) - 5
        },
        top_endpoints: [
          { endpoint: '/api/lynxa', requests: 4521, avg_time: 145, success_rate: 99.2 },
          { endpoint: '/api/chat', requests: 2890, avg_time: 167, success_rate: 98.8 },
          { endpoint: '/api/completion', requests: 1234, avg_time: 134, success_rate: 99.5 },
          { endpoint: '/api/models', requests: 567, avg_time: 89, success_rate: 100 }
        ],
        geographic_distribution: [
          { country: 'United States', requests: 3456, percentage: 45 },
          { country: 'India', requests: 2890, percentage: 38 },
          { country: 'United Kingdom', requests: 567, percentage: 7 },
          { country: 'Germany', requests: 432, percentage: 6 },
          { country: 'Canada', requests: 298, percentage: 4 }
        ],
        hourly_distribution: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          requests: Math.floor(Math.random() * 500) + 100
        }))
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const timeRanges = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  if (isLoading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  const successRate = analyticsData ? 
    ((analyticsData.overview.successful_requests / analyticsData.overview.total_requests) * 100).toFixed(1) : 
    0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold grok-text-gradient">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive insights into your API usage</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {timeRanges.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(range.value)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.overview.total_requests?.toLocaleString() || 0}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {analyticsData?.trends.requests_change >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${
                    analyticsData?.trends.requests_change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {Math.abs(analyticsData?.trends.requests_change || 0)}%
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{successRate}%</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">
                    +{Math.abs(analyticsData?.trends.success_rate_change || 2.1)}%
                  </span>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.overview.avg_response_time || 145}ms
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {analyticsData?.trends.response_time_change <= 0 ? (
                    <TrendingDown className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${
                    analyticsData?.trends.response_time_change <= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {Math.abs(analyticsData?.trends.response_time_change || 5)}ms
                  </span>
                </div>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="grok-border bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-2xl font-bold">
                  {analyticsData?.overview.unique_ips?.toLocaleString() || 0}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+12%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-secondary/50 grok-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="geographic">Geographic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Request Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Request Status Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Successful</span>
                    </div>
                    <span className="font-medium">
                      {analyticsData?.overview.successful_requests?.toLocaleString() || 0}
                    </span>
                  </div>
                  <Progress value={parseFloat(successRate)} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Failed</span>
                    </div>
                    <span className="font-medium">
                      {analyticsData?.overview.failed_requests?.toLocaleString() || 0}
                    </span>
                  </div>
                  <Progress value={100 - parseFloat(successRate)} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Data Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Data Transferred</span>
                    <span className="font-semibold">
                      {analyticsData?.overview.data_transferred || 0} GB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average per Request</span>
                    <span className="font-semibold">2.3 KB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Peak Hour Usage</span>
                    <span className="font-semibold">45.2 MB/hr</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hourly Distribution */}
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Request Distribution by Hour (UTC)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-12 gap-1 h-32">
                {analyticsData?.hourly_distribution?.map((hour: any, index: number) => {
                  const maxRequests = Math.max(...(analyticsData?.hourly_distribution?.map((h: any) => h.requests) || [1]));
                  const height = (hour.requests / maxRequests) * 100;
                  
                  return (
                    <div key={index} className="flex flex-col items-center justify-end h-full">
                      <div 
                        className="w-full bg-primary/60 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${height}%` }}
                        title={`${hour.hour}:00 - ${hour.requests} requests`}
                      ></div>
                      <span className="text-xs mt-1 text-muted-foreground">
                        {hour.hour.toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Top API Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.top_endpoints?.map((endpoint: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border grok-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        <Server className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{endpoint.endpoint}</p>
                        <p className="text-sm text-muted-foreground">
                          {endpoint.requests.toLocaleString()} requests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{endpoint.avg_time}ms</p>
                        <p className="text-xs text-muted-foreground">avg time</p>
                      </div>
                      <Badge 
                        variant={endpoint.success_rate >= 99 ? 'default' : 'secondary'}
                        className="min-w-[60px]"
                      >
                        {endpoint.success_rate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <Card className="grok-border bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.geographic_distribution?.map((country: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32">
                        <Progress value={country.percentage} className="h-2" />
                      </div>
                      <span className="text-sm font-medium min-w-[60px] text-right">
                        {country.requests.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                        {country.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">P50 Response Time</span>
                    <span className="font-medium">120ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">P95 Response Time</span>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">P99 Response Time</span>
                    <span className="font-medium">567ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-medium text-green-400">0.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Uptime</span>
                  <Badge variant="default" className="bg-green-500/20 text-green-400">
                    99.98%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Health</span>
                  <Badge variant="default" className="bg-green-500/20 text-green-400">
                    Healthy
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cache Hit Rate</span>
                  <span className="font-medium">94.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Connections</span>
                  <span className="font-medium">1,247</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <Card className="grok-border bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Export Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="grok-border">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" className="grok-border">
              <Download className="w-4 h-4 mr-2" />
              Export PDF Report
            </Button>
            <Badge variant="outline" className="grok-border">
              Advanced analytics available in Pro plans
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};