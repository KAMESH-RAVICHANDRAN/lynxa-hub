import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, Sparkles, Zap, CheckCircle, AlertCircle, Mail, User, Building2, Crown, Rocket, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ApiKeyGeneratorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApiKeyGenerator: React.FC<ApiKeyGeneratorProps> = ({ isOpen, onOpenChange }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [selectedTier, setSelectedTier] = useState('free');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState('');
  const [step, setStep] = useState(1);

  const tiers = [
    {
      id: 'free',
      name: 'Starter',
      icon: Zap,
      price: 'Free',
      limits: '1K requests/month',
      features: ['Basic AI Chat', 'Standard Models', 'Community Support'],
      color: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'pro',
      name: 'Professional',
      icon: Crown,
      price: '$29/month',
      limits: '100K requests/month',
      features: ['Advanced AI Models', 'Priority Support', 'Analytics Dashboard', 'API Webhooks'],
      color: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      gradient: 'from-purple-500/20 to-pink-500/20',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Shield,
      price: 'Custom',
      limits: 'Unlimited requests',
      features: ['Dedicated Infrastructure', '24/7 Support', 'Custom Models', 'SLA Guarantee', 'White-label Options'],
      color: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
      gradient: 'from-orange-500/20 to-red-500/20'
    }
  ];

  const generateApiKey = async () => {
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to generate an API key.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('https://lynxa-pro-backend.vercel.app/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
          organization: organization.trim() || undefined,
          tier: selectedTier
        })
      });

      const data = await response.json();

      if (response.ok && data.api_key) {
        setGeneratedKey(data.api_key);
        setStep(3);
        toast({
          title: '🎉 API Key Generated!',
          description: 'Your Nexariq API key has been created successfully.',
        });
      } else {
        throw new Error(data.error || 'Failed to generate API key');
      }
    } catch (error) {
      console.error('API key generation failed:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate API key. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard.',
    });
  };

  const resetForm = () => {
    setStep(1);
    setEmail('');
    setFirstName('');
    setLastName('');
    setOrganization('');
    setSelectedTier('free');
    setGeneratedKey('');
    setIsGenerating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto grok-border bg-background/95 backdrop-blur-xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <span className="grok-text-gradient">Generate Nexariq API Key</span>
          </DialogTitle>
          <p className="text-muted-foreground">
            Create your personalized API key to access Grok-level AI intelligence
          </p>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${
                  step >= stepNum 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {step > stepNum ? <CheckCircle className="w-4 h-4" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-8 h-0.5 transition-all ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Account Information */}
        {step === 1 && (
          <div className="space-y-6">
            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="grok-border"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization">
                      <Building2 className="w-4 h-4 inline mr-2" />
                      Organization (Optional)
                    </Label>
                    <Input
                      id="organization"
                      placeholder="Your Company Name"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="grok-border"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name (Optional)</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="grok-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name (Optional)</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="grok-border"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!email.trim()}
                className="grok-hover"
              >
                Continue to Plan Selection
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Plan Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold mb-2">Choose Your Plan</h3>
              <p className="text-muted-foreground">Select the plan that best fits your needs</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <Card 
                    key={tier.id}
                    className={`cursor-pointer transition-all duration-300 relative ${
                      selectedTier === tier.id 
                        ? 'ring-2 ring-primary grok-border bg-gradient-to-br ' + tier.gradient
                        : 'grok-border hover:border-primary/50 bg-card/30'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${tier.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                      <div className="text-2xl font-bold grok-text-gradient">{tier.price}</div>
                      <p className="text-sm text-muted-foreground">{tier.limits}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="grok-border">
                Back
              </Button>
              <Button 
                onClick={generateApiKey}
                disabled={isGenerating}
                className="grok-hover"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    Generate API Key
                    <Sparkles className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Key */}
        {step === 3 && generatedKey && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">API Key Generated Successfully! 🎉</h3>
              <p className="text-muted-foreground">Your Nexariq API key is ready to use</p>
            </div>

            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Your API Key
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg border grok-border">
                  <code className="flex-1 text-sm font-mono text-primary break-all">
                    {generatedKey}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(generatedKey)}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-400">Important Security Notice</p>
                      <p className="text-xs text-yellow-300/80 mt-1">
                        Store this API key securely. It won't be shown again for security reasons.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="grok-border bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList className="bg-secondary/50 grok-border">
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="curl" className="mt-4">
                    <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                      <pre className="text-sm font-mono overflow-x-auto">
                        <code>{`curl -X POST https://lynxa-pro-backend.vercel.app/api/lynxa \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${generatedKey}" \\
  -d '{
    "model": "lynxa-pro",
    "messages": [
      {"role": "user", "content": "Hello Nexariq!"}
    ]
  }'`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="python" className="mt-4">
                    <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                      <pre className="text-sm font-mono overflow-x-auto">
                        <code>{`import requests

headers = {
    "Authorization": f"Bearer ${generatedKey}",
    "Content-Type": "application/json"
}
data = {
    "model": "lynxa-pro",
    "messages": [{"role": "user", "content": "Hello Nexariq!"}]
}
response = requests.post(
    "https://lynxa-pro-backend.vercel.app/api/lynxa",
    json=data, headers=headers
)`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="javascript" className="mt-4">
                    <div className="bg-secondary/50 rounded-lg p-4 border grok-border">
                      <pre className="text-sm font-mono overflow-x-auto">
                        <code>{`const response = await fetch('https://lynxa-pro-backend.vercel.app/api/lynxa', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${generatedKey}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'lynxa-pro',
    messages: [{role: 'user', content: 'Hello Nexariq!'}]
  })
});`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="grok-border"
              >
                Generate Another Key
              </Button>
              <Button 
                onClick={() => onOpenChange(false)}
                className="grok-hover"
              >
                Start Building
                <Rocket className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};