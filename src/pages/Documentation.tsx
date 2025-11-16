import React, { useState } from "react";
import { Brain, Key, Zap, Code2, Shield, Clock, TrendingUp, Copy, Check, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const Documentation = () => {
  const navigate = useNavigate();
  const [copiedSections, setCopiedSections] = useState<{[key: string]: boolean}>({});

  const copyCode = async (code: string, section: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedSections(prev => ({ ...prev, [section]: true }));
    setTimeout(() => {
      setCopiedSections(prev => ({ ...prev, [section]: false }));
    }, 2000);
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold grok-text-gradient">Nexariq AI Documentation</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Code2 className="w-3 h-3 mr-1" />
                    API Reference
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    v2.0.0
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
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/console')}
              >
                Try Console
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 aurora-bg rounded-2xl p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="grok-text-gradient">Lynxa Pro API</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Complete Lynxa AI Platform - Generate API keys, chat with Grok-level intelligence, 
            and integrate advanced AI into your applications. This is your one-stop platform for all Lynxa AI services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-primary hover:bg-primary/90 grok-hover"
            >
              <Key className="w-4 h-4 mr-2" />
              Get Your API Key
            </Button>
            <Button 
              size="lg"
              onClick={() => navigate('/console')}
              className="bg-green-600 hover:bg-green-700 grok-hover"
            >
              <Zap className="w-4 h-4 mr-2" />
              Try Console
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="grok-border grok-hover"
            >
              <Code2 className="w-4 h-4 mr-2" />
              View Examples
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="grok-border bg-card/50 backdrop-blur-sm text-center p-6">
            <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold grok-text-gradient">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </Card>
          <Card className="grok-border bg-card/50 backdrop-blur-sm text-center p-6">
            <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold grok-text-gradient">&lt;150ms</div>
            <div className="text-sm text-muted-foreground">Response Time</div>
          </Card>
          <Card className="grok-border bg-card/50 backdrop-blur-sm text-center p-6">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold grok-text-gradient">10M+</div>
            <div className="text-sm text-muted-foreground">API Calls/Month</div>
          </Card>
          <Card className="grok-border bg-card/50 backdrop-blur-sm text-center p-6">
            <Brain className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold grok-text-gradient">Grok</div>
            <div className="text-sm text-muted-foreground">Intelligence Level</div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                Documentation
              </h3>
              <div className="space-y-1">
                <a href="#authentication" className="block text-sm hover:text-primary transition-colors">Authentication</a>
                <a href="#quickstart" className="block text-sm hover:text-primary transition-colors">Quick Start</a>
                <a href="#endpoints" className="block text-sm hover:text-primary transition-colors">API Endpoints</a>
                <a href="#examples" className="block text-sm hover:text-primary transition-colors">Examples</a>
                <a href="#errors" className="block text-sm hover:text-primary transition-colors">Error Handling</a>
                <a href="#rate-limits" className="block text-sm hover:text-primary transition-colors">Rate Limits</a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Authentication */}
            <section id="authentication">
              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Key className="w-6 h-6 text-primary" />
                    Authentication
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    All API requests require authentication using API keys. Your API key carries many privileges, 
                    so be sure to keep it secure!
                  </p>
                  
                  <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Base URL</h4>
                    </div>
                    <code className="text-sm text-primary">https://lynxa-pro-backend.vercel.app</code>
                  </div>

                  <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold">Authentication Header</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyCode('X-API-Key: YOUR_API_KEY', 'auth')}
                      >
                        {copiedSections.auth ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <code className="text-sm text-foreground">X-API-Key: YOUR_API_KEY</code>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Quick Start */}
            <section id="quickstart">
              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-primary" />
                    Quick Start
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="curl" className="w-full">
                    <TabsList className="bg-secondary/50 grok-border">
                      <TabsTrigger value="curl">cURL</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="node">Node.js</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="curl" className="mt-4">
                      <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Make your first request</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyCode(`curl -X POST https://lynxa-pro-backend.vercel.app/api/lynxa \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "message": "Hello, Nexariq AI!",
    "conversation_id": null,
    "model": "lynxa-pro"
  }'`, 'curl')}
                          >
                            {copiedSections.curl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <pre className="text-sm font-mono overflow-x-auto">
                          <code className="text-foreground">{`curl -X POST https://lynxa-pro-backend.vercel.app/api/lynxa \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "message": "Hello, Nexariq AI!",
    "conversation_id": null,
    "model": "lynxa-pro"
  }'`}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="python" className="mt-4">
                      <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Python Example</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyCode(`import requests

url = "https://lynxa-pro-backend.vercel.app/api/lynxa"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}
data = {
    "message": "Hello, Nexariq AI!",
    "conversation_id": None,
    "model": "lynxa-pro"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(result["response"])`, 'python')}
                          >
                            {copiedSections.python ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <pre className="text-sm font-mono overflow-x-auto">
                          <code className="text-foreground">{`import requests

url = "https://lynxa-pro-backend.vercel.app/api/lynxa"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}
data = {
    "message": "Hello, Nexariq AI!",
    "conversation_id": None,
    "model": "lynxa-pro"
}

response = requests.post(url, json=data, headers=headers)
result = response.json()
print(result["response"])`}</code>
                        </pre>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="javascript" className="mt-4">
                      <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">JavaScript Example</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyCode(`const response = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, Nexariq AI!',
    conversation_id: null,
    model: 'lynxa-pro'
  })
});

const data = await response.json();
console.log(data.response);`, 'javascript')}
                          >
                            {copiedSections.javascript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <pre className="text-sm font-mono overflow-x-auto">
                          <code className="text-foreground">{`const response = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Hello, Nexariq AI!',
    conversation_id: null,
    model: 'lynxa-pro'
  })
});

const data = await response.json();
console.log(data.response);`}</code>
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="node" className="mt-4">
                      <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Node.js Example</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyCode(`const axios = require('axios');

const nexariqAI = async (message) => {
  try {
    const response = await axios.post(
      'https://lynxa-pro-backend.vercel.app/api/lynxa',
      {
        message: message,
        conversation_id: null,
        model: 'lynxa-pro'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXARIQ_API_KEY
        }
      }
    );
    
    return response.data.response;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Usage
nexariqAI('Hello, Nexariq AI!').then(console.log);`, 'node')}
                          >
                            {copiedSections.node ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                        <pre className="text-sm font-mono overflow-x-auto">
                          <code className="text-foreground">{`const axios = require('axios');

const nexariqAI = async (message) => {
  try {
    const response = await axios.post(
      'https://lynxa-pro-backend.vercel.app/api/lynxa',
      {
        message: message,
        conversation_id: null,
        model: 'lynxa-pro'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXARIQ_API_KEY
        }
      }
    );
    
    return response.data.response;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
};

// Usage
nexariqAI('Hello, Nexariq AI!').then(console.log);`}</code>
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </section>

            {/* API Endpoints */}
            <section id="endpoints">
              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Code2 className="w-6 h-6 text-primary" />
                    API Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="border grok-border rounded-lg p-4 bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">POST</Badge>
                        <code className="text-sm">/api/lynxa</code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Chat completion with Grok-level AI intelligence</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Request Body:</h5>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                            <code>{`{
  "message": "string",
  "conversation_id": "string?",
  "model": "lynxa-pro"
}`}</code>
                          </pre>
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold mb-2">Response:</h5>
                          <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
                            <code>{`{
  "response": "string",
  "conversation_id": "string",
  "model": "lynxa-pro",
  "usage": {...}
}`}</code>
                          </pre>
                        </div>
                      </div>
                    </div>

                    <div className="border grok-border rounded-lg p-4 bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">GET</Badge>
                        <code className="text-sm">/api/analytics</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Get usage analytics and metrics</p>
                    </div>

                    <div className="border grok-border rounded-lg p-4 bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">POST</Badge>
                        <code className="text-sm">/api/generate-key</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Generate new API keys</p>
                    </div>

                    <div className="border grok-border rounded-lg p-4 bg-secondary/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">GET</Badge>
                        <code className="text-sm">/api/health</code>
                      </div>
                      <p className="text-sm text-muted-foreground">Check API health status</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Rate Limits & Pricing */}
            <section id="rate-limits">
              <Card className="grok-border bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Rate Limits & Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border grok-border rounded-lg">
                      <h4 className="font-semibold mb-2">Free Tier</h4>
                      <div className="text-2xl font-bold text-primary mb-1">1,000</div>
                      <div className="text-sm text-muted-foreground">requests/month</div>
                    </div>
                    <div className="text-center p-4 border grok-border rounded-lg">
                      <h4 className="font-semibold mb-2">Pro Tier</h4>
                      <div className="text-2xl font-bold text-primary mb-1">100K</div>
                      <div className="text-sm text-muted-foreground">requests/month</div>
                    </div>
                    <div className="text-center p-4 border grok-border rounded-lg">
                      <h4 className="font-semibold mb-2">Enterprise</h4>
                      <div className="text-2xl font-bold text-primary mb-1">Unlimited</div>
                      <div className="text-sm text-muted-foreground">custom limits</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
