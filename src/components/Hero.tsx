import { Button } from "./ui/button";
import { ArrowRight, Sparkles, Zap, Code2, Brain } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const stats = [
    { value: "99.9%", label: "Uptime SLA", icon: Zap },
    { value: "<100ms", label: "Response Time", icon: Brain },
    { value: "128K", label: "Context Window", icon: Code2 },
  ];

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Enhanced Gradient Orbs with Mouse Interaction */}
      <motion.div 
        className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 50,
          y: mousePosition.y * 30,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 30 }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * -30,
          y: mousePosition.y * -50,
        }}
        transition={{ type: "spring", stiffness: 150, damping: 30 }}
      />
      
      {/* Floating Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 text-purple-500/30"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0] 
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Code2 className="h-8 w-8" />
        </motion.div>
        <motion.div
          className="absolute top-40 right-20 text-cyan-500/30"
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -10, 0] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Brain className="h-6 w-6" />
        </motion.div>
        <motion.div
          className="absolute bottom-40 left-20 text-purple-400/30"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 15, 0] 
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        >
          <Sparkles className="h-10 w-10" />
        </motion.div>
      </div>
      
      <div className="container relative mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div 
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            <span className="text-sm text-muted-foreground">Powered by Advanced AI</span>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-bold tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Build with{" "}
            <motion.span 
              className="bg-gradient-to-r from-primary via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] 
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            >
              Lynxa AI
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            The most advanced AI language model API for developers. Integrate powerful 
            natural language processing into your applications with just a few lines of code.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                asChild 
                className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white glow-purple"
              >
                <Link to="/signup">
                  Get API Key
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </motion.div>
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" variant="outline" asChild className="glow-hover">
                <Link to="/docs">View Documentation</Link>
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="pt-8 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex flex-col items-center space-y-2">
                  <motion.div
                    className="text-primary/50 group-hover:text-primary transition-colors"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
                  >
                    <stat.icon className="h-6 w-6" />
                  </motion.div>
                  <motion.div 
                    className="text-3xl font-bold text-primary"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
