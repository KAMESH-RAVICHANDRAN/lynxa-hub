import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-secondary border border-border">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            Build with{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Lynxa Pro
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The most advanced AI language model API for developers. Integrate powerful 
            natural language processing into your applications with just a few lines of code.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              asChild 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            >
              <Link to="/signup">
                Get API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/docs">View Documentation</Link>
            </Button>
          </div>

          <div className="pt-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime SLA</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">&lt;100ms</div>
              <div className="text-sm text-muted-foreground">Response Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">128K</div>
              <div className="text-sm text-muted-foreground">Context Window</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
