import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useChat } from "@/hooks/use-chat";
import { FloatingChatCopilot } from "@/components/chat/FloatingChatCopilot";
import { LayoutDashboard, FolderKanban, Settings, BookOpen, Moon, Sun, Menu, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImg from "@assets/logo_nobg.png";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", adminOnly: false },
  { label: "Dự án", icon: FolderKanban, href: "/projects", adminOnly: false },
  { label: "Hướng dẫn", icon: BookOpen, href: "/guide", adminOnly: false },
  { label: "Cài đặt", icon: Settings, href: "/settings", adminOnly: true },
];

function useCurrentUser() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

function SidebarContent({ location }: { location: string }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.clear();
    navigate("/auth");
  }
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b border-border/30">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <img src={logoImg} alt="BMT Decor" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight" data-testid="text-brand-name">BMT Decor</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">AI Kiến trúc & Nội thất</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.filter(item => !item.adminOnly || user?.role === "admin").map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                isActive
                  ? "text-white bg-primary shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:bg-primary/8 hover:text-foreground dark:hover:bg-primary/15"
              )}
              data-testid={`link-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className={cn("w-5 h-5 transition-transform duration-200 shrink-0", isActive ? "" : "group-hover:scale-110")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/30 space-y-2">
        <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-3 flex items-center gap-2">
          <img src={logoImg} alt="BMT Decor" className="w-8 h-8 object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{user?.name || "BMT DECOR"}</p>
            <p className="text-[10px] text-primary font-semibold">{user?.phone || ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const pageTitle =
    location === "/" ? "Dashboard"
    : location.startsWith("/projects/") ? "Wizard thiết kế"
    : location === "/settings" ? "Cài đặt"
    : location === "/guide" ? "Hướng dẫn"
    : "Dự án";

  return (
    <div className="min-h-screen flex bg-background" data-testid="app-layout">
      <aside className="w-64 fixed inset-y-0 left-0 z-50 glass border-r border-border/50 hidden md:flex flex-col">
        <SidebarContent location={location} />
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        <header className="h-14 glass z-40 sticky top-0 px-4 sm:px-6 flex items-center justify-between border-b border-border/50">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-lg" data-testid="button-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SidebarContent location={location} />
              </SheetContent>
            </Sheet>
            <h2 className="text-base font-semibold text-foreground hidden sm:block">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-xl text-muted-foreground hover:text-foreground"
              data-testid="button-toggle-theme"
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6">
          {children}
        </div>
      </main>
      <GlobalChat />
    </div>
  );
}

function GlobalChat() {
  const { messages, isLoading, unreadCount, sendMessage, markRead, markClosed } = useChat(0);
  return (
    <FloatingChatCopilot
      messages={messages}
      isLoading={isLoading}
      onSendMessage={msg => sendMessage(msg)}
      unreadCount={unreadCount}
      onOpen={markRead}
      onClose={markClosed}
    />
  );
}
