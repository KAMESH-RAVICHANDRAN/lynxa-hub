import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Key, Zap } from "lucide-react";

const Documentation = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
            <p className="text-muted-foreground text-lg">
              Complete guide to integrating Lynxa Pro into your applications
            </p>
          </div>

          <div className="space-y-8">
            {/* Authentication Section */}
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Authentication</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Generate your API key to start making requests to Lynxa Pro.
              </p>
              
              <div className="bg-secondary rounded-lg p-4 border border-border">
                <p className="text-sm font-semibold mb-2">Generate API Key</p>
                <pre className="text-sm font-mono overflow-x-auto">
                  <code className="text-foreground">{`curl -X POST https://lynxa-pro-backend.vercel.app/api/generate-key \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "youremail@gmail.com"
  }'`}</code>
                </pre>
              </div>
            </Card>

            {/* Quick Start Section */}
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Quick Start</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                Start building with Lynxa Pro in seconds with your favorite language.
              </p>

              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                </TabsList>
                
                <TabsContent value="curl" className="mt-4">
                  <div className="bg-secondary rounded-lg p-4 border border-border">
                    <pre className="text-sm font-mono overflow-x-auto">
                      <code className="text-foreground">{`curl -X POST https://lynxa-pro-backend.vercel.app/api/lynxa \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "lynxa-pro",
    "messages": [
      { "role": "user", "content": "Hello Lynxa Pro! Introduce yourself." }
    ]
  }'`}</code>
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="python" className="mt-4">
                  <div className="bg-secondary rounded-lg p-4 border border-border">
                    <pre className="text-sm font-mono overflow-x-auto">
                      <code className="text-foreground">{`import requests

url = "https://lynxa-pro-backend.vercel.app/api/lynxa"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_API_KEY"
}
data = {
    "model": "lynxa-pro",
    "messages": [
        {"role": "user", "content": "Hello Lynxa Pro! Introduce yourself."}
    ]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`}</code>
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="javascript" className="mt-4">
                  <div className="bg-secondary rounded-lg p-4 border border-border">
                    <pre className="text-sm font-mono overflow-x-auto">
                      <code className="text-foreground">{`const response = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    model: 'lynxa-pro',
    messages: [
      { role: 'user', content: 'Hello Lynxa Pro! Introduce yourself.' }
    ]
  })
});

const data = await response.json();
console.log(data);`}</code>
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* API Reference Section */}
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">API Reference</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Endpoint</h3>
                  <code className="text-sm bg-secondary px-3 py-1 rounded">POST https://lynxa-pro-backend.vercel.app/api/lynxa</code>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Headers</h3>
                  <div className="bg-secondary rounded-lg p-4 border border-border space-y-2">
                    <div>
                      <code className="text-sm text-primary">Content-Type:</code>
                      <code className="text-sm ml-2">application/json</code>
                    </div>
                    <div>
                      <code className="text-sm text-primary">Authorization:</code>
                      <code className="text-sm ml-2">Bearer YOUR_API_KEY</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Request Body</h3>
                  <div className="bg-secondary rounded-lg p-4 border border-border">
                    <pre className="text-sm font-mono">
                      <code className="text-foreground">{`{
  "model": "lynxa-pro",
  "messages": [
    {
      "role": "user",
      "content": "Your message here"
    }
  ]
}`}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Response</h3>
                  <div className="bg-secondary rounded-lg p-4 border border-border">
                    <pre className="text-sm font-mono">
                      <code className="text-foreground">{`{
  "id": "msg_123456",
  "model": "lynxa-pro",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Response from Lynxa Pro"
      }
    }
  ]
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
