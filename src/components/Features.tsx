import { Card } from "./ui/card";
import { Zap, Shield, Code, BarChart3, Globe, Rocket } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";

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
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-20 bg-secondary/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div 
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-purple-400 bg-clip-text text-transparent">
            Why Developers Choose Lynxa AI
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to build intelligent applications at scale
          </p>
        </motion.div>
        
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.3 }
                }}
                className="group"
              >
                <Card className="p-6 h-full bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 shadow-card hover:shadow-xl hover:shadow-primary/10 glass-enhanced">
                  <motion.div 
                    className="h-12 w-12 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 flex items-center justify-center mb-4 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-all duration-300"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 360,
                      transition: { duration: 0.5 }
                    }}
                  >
                    <Icon className="h-6 w-6 text-primary group-hover:text-purple-400 transition-colors duration-300" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
