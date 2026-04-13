import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import ProjectWizard from "@/pages/ProjectWizard";
import NewProjectWizard from "@/pages/NewProjectWizard";
import Settings from "@/pages/Settings";
import Guide from "@/pages/Guide";
import AuthPage from "@/pages/AuthPage";
import { ThemeProvider } from "@/contexts/ThemeContext";

function useAuth() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) {
    navigate("/auth");
    return null;
  }
  return <Component />;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="text-muted-foreground">Đang tải...</div></div>;
  if (!user) { navigate("/auth"); return null; }
  if (user.role !== "admin") { navigate("/"); return null; }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/projects" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/projects/new" component={() => <ProtectedRoute component={NewProjectWizard} />} />
      <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectWizard} />} />
      <Route path="/settings" component={() => <AdminRoute component={Settings} />} />
      <Route path="/guide" component={() => <ProtectedRoute component={Guide} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
