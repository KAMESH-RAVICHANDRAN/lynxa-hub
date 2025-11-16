import { Card } from "./ui/card";
import { Zap, Shield, Code, BarChart3, Globe, Rocket } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Industry-leading response times with optimized infrastructure for real-time applications."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with SOC 2, GDPR, and HIPAA standards."
  },
  {
    icon: Code,
    title: "Simple Integration",
    description: "RESTful API with SDKs for Python, JavaScript, Go, and more. Get started in minutes."
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description: "Real-time dashboards to monitor API usage, costs, and performance metrics."
  },
  {
    icon: Globe,
    title: "Global CDN",
    description: "Edge nodes worldwide ensure low latency no matter where your users are."
  },
  {
    icon: Rocket,
    title: "Scale Effortlessly",
    description: "From prototype to production, our infrastructure scales with your needs."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Why Developers Choose Lynxa Pro</h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to build intelligent applications at scale
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 bg-gradient-card border-border hover:border-primary/50 transition-colors shadow-card"
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
