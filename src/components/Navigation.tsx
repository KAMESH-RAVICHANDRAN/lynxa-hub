import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Code2, BookOpen, LayoutDashboard, Menu, Terminal } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Code2 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Lynxa Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" asChild>
              <Link to="/docs">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/console">
                <Terminal className="mr-2 h-4 w-4" />
                Console
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/docs">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/console">
                <Terminal className="mr-2 h-4 w-4" />
                Console
              </Link>
            </Button>
            <Button variant="ghost" asChild className="w-full justify-start">
              <Link to="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <div className="pt-2 space-y-2">
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
