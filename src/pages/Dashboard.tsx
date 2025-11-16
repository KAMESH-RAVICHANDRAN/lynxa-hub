import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, BarChart3, FileCode, Settings, Copy } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your API keys, monitor usage, and configure settings</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-card border-border shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">1.2M</h3>
            <p className="text-sm text-muted-foreground">API Requests (30 days)</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">3</h3>
            <p className="text-sm text-muted-foreground">Active API Keys</p>
          </Card>

          <Card className="p-6 bg-gradient-card border-border shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileCode className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">8</h3>
            <p className="text-sm text-muted-foreground">Active Projects</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">API Keys</h2>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Key className="mr-2 h-4 w-4" />
                  Create New Key
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm">lx_prod_•••••••••••••</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Production • Created Jan 15, 2025</p>
                  </div>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono text-sm">lx_dev_•••••••••••••</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Development • Created Jan 10, 2025</p>
                  </div>
                  <Button variant="ghost" size="sm">Manage</Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">API key created: lx_prod_•••••••••••••</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">Usage limit updated for project "Chat Assistant"</p>
                    <p className="text-xs text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">New project created: "Content Generator"</p>
                    <p className="text-xs text-muted-foreground">3 days ago</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-border shadow-card">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileCode className="mr-2 h-4 w-4" />
                  View Documentation
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Usage Analytics
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-primary">
              <h3 className="font-semibold mb-2 text-primary-foreground">Need Help?</h3>
              <p className="text-sm text-primary-foreground/90 mb-4">
                Check out our documentation or reach out to our support team.
              </p>
              <Button variant="secondary" className="w-full">
                Contact Support
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
