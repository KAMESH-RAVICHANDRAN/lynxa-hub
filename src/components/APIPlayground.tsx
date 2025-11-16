import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Copy, 
  Loader2, 
  Terminal, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap, 
  Settings, 
  RefreshCw 
} from 'lucide-react';

interface APIPlaygroundProps {
  apiKey?: string;
}

export const APIPlayground: React.FC<APIPlaygroundProps> = ({ apiKey }) => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('lynxa-pro');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const models = [
    { id: 'lynxa-pro', name: 'Lynxa Pro', description: 'Most advanced model' },
    { id: 'lynxa-fast', name: 'Lynxa Fast', description: 'Optimized for speed' },
    { id: 'lynxa-creative', name: 'Lynxa Creative', description: 'Creative writing focused' },
    { id: 'lynxa-code', name: 'Lynxa Code', description: 'Programming assistance' }
  ];

  const examplePrompts = [
    'Explain quantum computing in simple terms',
    'Write a Python function to sort a list',
    'Create a marketing strategy for a tech startup',
    'Translate "Hello, how are you?" to Spanish',
    'Summarize the benefits of renewable energy'
  ];

  const handleRun = async () => {
    if (!apiKey) {
      toast({
        title: 'API Key Required',
        description: 'Please generate an API key first to use the playground.',
        variant: 'destructive'
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a prompt to send to the API.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setResponse('');
    setResponseTime(null);
    setRequestId(null);
    
    const startTime = Date.now();
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://lynxa-pro-backend.vercel.app';
      const res = await fetch(`${backendUrl}/api/lynxa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          message: prompt,
          model: model,
          temperature: temperature,
          max_tokens: maxTokens
        })
      });

      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const data = await res.json();
      
      if (res.ok && data.success) {
        setResponse(data.response || data.message || 'Response received successfully');
        setRequestId(data.requestId || `req_${Math.random().toString(36).substr(2, 9)}`);
        toast({
          title: '✨ Request Successful',
          description: `Response received in ${endTime - startTime}ms`,
        });
      } else {
        throw new Error(data.error || 'Request failed');
      }
    } catch (error) {
      console.error('API request failed:', error);
      setResponse(`Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`);
      toast({
        title: 'Request Failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${type} copied to clipboard.`,
    });
  };

  const generateCurlCommand = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://lynxa-pro-backend.vercel.app';
    return `curl -X POST "${backendUrl}/api/lynxa" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}" \\
  -d '${JSON.stringify({
      message: prompt,
      model: model,
      temperature: temperature,
      max_tokens: maxTokens
    }, null, 2)}'`;
  };

  const generatePythonCode = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://lynxa-pro-backend.vercel.app';
    return `import requests
import json

url = "${backendUrl}/api/lynxa"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer ${apiKey || 'YOUR_API_KEY'}"
}

data = {
    "message": "${prompt}",
    "model": "${model}",
    "temperature": ${temperature},
    "max_tokens": ${maxTokens}
}

response = requests.post(url, headers=headers, json=data)
result = response.json()

print(json.dumps(result, indent=2))`;
  };

  const generateJavaScriptCode = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://lynxa-pro-backend.vercel.app';
    return `const response = await fetch('${backendUrl}/api/lynxa', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${apiKey || 'YOUR_API_KEY'}'
  },
  body: JSON.stringify({
    message: '${prompt}',
    model: '${model}',
    temperature: ${temperature},
    max_tokens: ${maxTokens}
  })
});

const data = await response.json();
console.log(data);`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          API Playground
        </h2>
        <p className="text-muted-foreground">Test your API key and experience Lynxa AI in real-time</p>
      </div>

      {/* API Key Status */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {apiKey ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">API Key Active</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">No API Key</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {responseTime && (
                <Badge variant="outline" className="border-border/50">
                  <Clock className="w-3 h-3 mr-1" />
                  {responseTime}ms
                </Badge>
              )}
              {requestId && (
                <Badge variant="outline" className="border-border/50 text-xs">
                  ID: {requestId}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="playground" className="space-y-6">
        <TabsList className="bg-secondary/50 border-border/50">
          <TabsTrigger value="playground">Playground</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="playground" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={8}
                    className="border-border/50 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Quick Examples</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(example)}
                        className="justify-start text-left h-auto py-2 px-3 border-border/50"
                      >
                        <span className="text-xs text-muted-foreground truncate">{example}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleRun} 
                  disabled={isLoading || !prompt.trim() || !apiKey}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Response Panel */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Response
                  </div>
                  {response && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(response, 'Response')}
                      className="border-border/50"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Processing your request...</p>
                      </div>
                    </div>
                  ) : response ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                        <pre className="whitespace-pre-wrap text-sm font-mono">{response}</pre>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-muted-foreground">
                      <div className="text-center">
                        <Zap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Response will appear here</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>cURL Command</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-secondary/50 rounded-lg text-sm overflow-x-auto border border-border/50">
                    <code>{generateCurlCommand()}</code>
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 border-border/50"
                    onClick={() => handleCopy(generateCurlCommand(), 'cURL command')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Python</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-secondary/50 rounded-lg text-sm overflow-x-auto border border-border/50">
                    <code>{generatePythonCode()}</code>
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 border-border/50"
                    onClick={() => handleCopy(generatePythonCode(), 'Python code')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>JavaScript</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="p-4 bg-secondary/50 rounded-lg text-sm overflow-x-auto border border-border/50">
                    <code>{generateJavaScriptCode()}</code>
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 border-border/50"
                    onClick={() => handleCopy(generateJavaScriptCode(), 'JavaScript code')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Request Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Temperature: {temperature}</Label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Controls randomness. Lower values make responses more focused and deterministic.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Max Tokens: {maxTokens}</Label>
                <input 
                  type="range" 
                  min="100" 
                  max="4000" 
                  step="100" 
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens to generate in the response.
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setTemperature(0.7);
                    setMaxTokens(1000);
                    setModel('lynxa-pro');
                  }}
                  className="border-border/50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default APIPlayground;