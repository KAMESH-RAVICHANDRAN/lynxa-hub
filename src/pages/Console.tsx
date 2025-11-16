import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Console = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "user", content: "Hello Lynxa Pro! Introduce yourself." }
  ]);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("lynxa-pro");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleRun = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to test the API",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const res = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: messages
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setResponse(JSON.stringify(data, null, 2));
        toast({
          title: "Success",
          description: "API call completed successfully"
        });
      } else {
        setResponse(JSON.stringify(data, null, 2));
        toast({
          title: "Error",
          description: data.error || "API call failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to call API";
      setResponse(JSON.stringify({ error: errorMessage }, null, 2));
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(response);
    toast({
      title: "Copied",
      description: "Response copied to clipboard"
    });
  };

  const handleClearMessages = () => {
    setMessages([{ role: "user", content: "" }]);
    setResponse("");
  };

  const updateMessage = (index: number, content: string) => {
    const newMessages = [...messages];
    newMessages[index].content = content;
    setMessages(newMessages);
  };

  const addMessage = () => {
    setMessages([...messages, { role: "user", content: "" }]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">API Console</h1>
          <p className="text-muted-foreground text-lg">
            Test and debug your Lynxa Pro API calls in real-time
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Request Panel */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <h2 className="text-xl font-semibold mb-4">Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="nxq_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lynxa-pro">lynxa-pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Messages</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearMessages}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
              
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index}>
                    <Label>Message {index + 1} ({message.role})</Label>
                    <Textarea
                      value={message.content}
                      onChange={(e) => updateMessage(index, e.target.value)}
                      placeholder="Enter your message..."
                      className="bg-secondary border-border min-h-[100px] font-mono text-sm"
                    />
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addMessage}
                  className="w-full"
                >
                  Add Message
                </Button>
              </div>

              <div className="mt-6">
                <Button
                  onClick={handleRun}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Run API Call
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Response Panel */}
          <div>
            <Card className="p-6 bg-gradient-card border-border shadow-card sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Response</h2>
                {response && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyResponse}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                )}
              </div>
              
              {response ? (
                <div className="bg-secondary rounded-lg p-4 border border-border overflow-auto max-h-[600px]">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    <code className="text-foreground">{response}</code>
                  </pre>
                </div>
              ) : (
                <div className="bg-secondary rounded-lg p-8 border border-border border-dashed flex items-center justify-center text-muted-foreground">
                  Response will appear here after running the API call
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;
