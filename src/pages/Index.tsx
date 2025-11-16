import React from 'react';
import { Brain, Zap, Shield, TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const GrokLogo: React.FC = () => (
  <div className="flex items-center space-x-2">
    <div className="relative">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <Brain className="w-5 h-5 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
    </div>
    <span className="text-xl font-bold grok-text-gradient">Nexariq AI</span>
  </div>
);

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <GrokLogo />
          <div className="hidden md:flex space-x-8">
            <Button variant="ghost" className="text-foreground hover:text-primary" onClick={() => navigate('/docs')}>
              Documentation
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              Pricing
            </Button>
            <Button variant="ghost" className="text-foreground hover:text-primary">
              API Status
            </Button>
          </div>
          <div className="flex space-x-4">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => navigate('/console')}>
                  Console
                </Button>
                <Button variant="outline" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/console')}>
                  Sign In
                </Button>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => navigate('/console')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const Hero: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center aurora-bg">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm text-muted-foreground">Powered by Lynxa Pro Backend</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="grok-text-gradient">AI that thinks</span>
              <br />
              <span className="text-foreground">like Grok</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              Experience the most advanced AI conversation platform. Built for developers, 
              designed for intelligence, trusted by innovators worldwide.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg grok-hover"
              onClick={() => navigate(user ? '/console' : '/console')}
            >
              {user ? 'Open Console' : 'Start Building Now'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="grok-border hover:bg-accent px-8 py-4 text-lg grok-hover"
              onClick={() => navigate('/docs')}
            >
              View Documentation
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
              <CardContent className="p-6 text-center">
                <Brain className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Intelligence</h3>
                <p className="text-muted-foreground">Grok-level AI with real-time knowledge and reasoning</p>
              </CardContent>
            </Card>
            <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
                <p className="text-muted-foreground">Bank-level security with comprehensive monitoring</p>
              </CardContent>
            </Card>
            <Card className="grok-border bg-card/50 backdrop-blur-sm grok-hover">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Real-time Analytics</h3>
                <p className="text-muted-foreground">Monitor every request with advanced insights</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const Stats: React.FC = () => {
  const stats = [
    { number: '10M+', label: 'API Calls Processed' },
    { number: '99.9%', label: 'Uptime Guarantee' },
    { number: '<150ms', label: 'Average Response Time' },
    { number: '24/7', label: 'Enterprise Support' },
  ];

  return (
    <section className="py-20 bg-card/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold grok-text-gradient mb-4">
            Trusted by Developers Worldwide
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join the ecosystem powering the next generation of AI applications
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold grok-text-gradient mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="py-20 grok-gradient">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to experience Grok-level AI?
        </h2>
        <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
          Join thousands of developers who trust Nexariq AI to power their applications. 
          Start building with our enterprise-grade platform today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            size="lg" 
            variant="secondary" 
            className="px-8 py-4 text-lg"
            onClick={() => navigate('/console')}
          >
            {user ? 'Go to Console' : 'Start Free Trial'}
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-white text-white hover:bg-white hover:text-background px-8 py-4 text-lg"
            onClick={() => navigate('/docs')}
          >
            View API Docs
          </Button>
        </div>
      </div>
    </section>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-card/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <GrokLogo />
            <p className="mt-4 text-muted-foreground">
              Advanced AI technology inspired by Grok, built for the enterprise.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="/docs" className="hover:text-foreground transition-colors">API</a></li>
              <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Compliance</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
          <p>&copy; 2025 Nexariq AI by AJ STUDIOZ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

const Index: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
