import { Card } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const CodeExample = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Start Building in Seconds</h2>
            <p className="text-muted-foreground text-lg">
              Simple, intuitive API that works with your favorite languages
            </p>
          </div>

          <Card className="bg-gradient-card border-border shadow-card overflow-hidden">
            <Tabs defaultValue="python" className="w-full">
              <div className="border-b border-border px-6">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="python" className="p-6">
                <pre className="text-sm font-mono">
                  <code className="text-foreground">{`import lynxapro

client = lynxapro.Client(api_key="your-api-key")

response = client.chat.completions.create(
    model="lynxa-pro-v1",
    messages=[
        {"role": "user", "content": "Hello, Lynxa!"}
    ]
)

print(response.choices[0].message.content)`}</code>
                </pre>
              </TabsContent>
              
              <TabsContent value="javascript" className="p-6">
                <pre className="text-sm font-mono">
                  <code className="text-foreground">{`import LynxaPro from 'lynxa-pro';

const client = new LynxaPro({
  apiKey: 'your-api-key'
});

const response = await client.chat.completions.create({
  model: 'lynxa-pro-v1',
  messages: [
    { role: 'user', content: 'Hello, Lynxa!' }
  ]
});

console.log(response.choices[0].message.content);`}</code>
                </pre>
              </TabsContent>
              
              <TabsContent value="curl" className="p-6">
                <pre className="text-sm font-mono">
                  <code className="text-foreground">{`curl https://api.lynxapro.dev/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "lynxa-pro-v1",
    "messages": [
      {"role": "user", "content": "Hello, Lynxa!"}
    ]
  }'`}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CodeExample;
