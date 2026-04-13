import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";

async function apiPost(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Loi khong xac dinh");
  return data;
}

// ─── Google Login Button ────────────────────────────────────────────────────

function GoogleLoginButton({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!(window as any).google?.accounts?.id) return;
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "933836762009-6bd6tjmk3a4g66d532mq84lmrgj94ngq.apps.googleusercontent.com";
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });
      if (buttonRef.current) {
        (window as any).google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "pill",
          logo_alignment: "left",
        });
      }
      initializedRef.current = true;
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  async function handleGoogleResponse(response: any) {
    if (!response?.credential) return;
    setLoading(true);
    try {
      await apiPost("/api/auth/google", { credential: response.credential });
      toast({ title: "Dang nhap Google thanh cong!" });
      onSuccess();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // Make handleGoogleResponse available globally for GSI callback
  useEffect(() => {
    (window as any).__googleAuthCallback = handleGoogleResponse;
  }, []);

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center [&>div]:!w-full" />
      {loading && (
        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Dang xu ly...
        </div>
      )}
      {/* Fallback button shown alongside GSI */}
    </div>
  );
}

// ─── Login Form ──────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleLogin() {
    if (!phone || !password) return toast({ title: "Vui long dien day du thong tin", variant: "destructive" });
    setLoading(true);
    try {
      await apiPost("/api/auth/login", { phone, password });
      toast({ title: "Dang nhap thanh cong" });
      onSuccess();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 auth-form-animate">
      {/* Google Login */}
      <GoogleLoginButton onSuccess={onSuccess} />

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border dark:bg-white/10" />
        <span className="text-xs text-muted-foreground font-medium px-2">hoac</span>
        <div className="flex-1 h-px bg-border dark:bg-white/10" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-phone" className="text-foreground font-medium">So dien thoai</Label>
        <Input
          id="login-phone"
          placeholder="0901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={loading}
          className="h-12 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-foreground font-medium">Mat khau</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="******"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
            className="h-12 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-12 transition-all duration-200"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <Button
        className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200"
        onClick={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Dang xu ly...
          </span>
        ) : "Dang nhap"}
      </Button>
    </div>
  );
}

// ─── Register Form ───────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleRegister() {
    if (!phone || !name || !password || !confirmPassword)
      return toast({ title: "Vui long dien day du thong tin", variant: "destructive" });
    if (password !== confirmPassword)
      return toast({ title: "Mat khau nhap lai khong khop", variant: "destructive" });
    if (password.length < 6)
      return toast({ title: "Mat khau phai co it nhat 6 ky tu", variant: "destructive" });

    setLoading(true);
    try {
      await apiPost("/api/auth/register", { phone, name, password, email: email || undefined });
      toast({ title: "Dang ky thanh cong" });
      onSuccess();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4 auth-form-animate">
      {/* Google Register */}
      <GoogleLoginButton onSuccess={onSuccess} />

      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-border dark:bg-white/10" />
        <span className="text-xs text-muted-foreground font-medium px-2">hoac dang ky thu cong</span>
        <div className="flex-1 h-px bg-border dark:bg-white/10" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-phone" className="text-foreground font-medium">So dien thoai</Label>
        <Input id="reg-phone" placeholder="0901234567" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading}
          className="h-11 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-name" className="text-foreground font-medium">Ho va ten</Label>
        <Input id="reg-name" placeholder="Nguyen Van A" value={name} onChange={(e) => setName(e.target.value)} disabled={loading}
          className="h-11 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-email" className="text-foreground font-medium flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5" /> Email <span className="text-xs text-muted-foreground font-normal">(tuy chon)</span>
        </Label>
        <Input id="reg-email" type="email" placeholder="email@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading}
          className="h-11 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password" className="text-foreground font-medium">Mat khau</Label>
        <div className="relative">
          <Input id="reg-password" type={showPassword ? "text" : "password"} placeholder="Toi thieu 6 ky tu" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading}
            className="h-11 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 pr-12 transition-all duration-200" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm" className="text-foreground font-medium">Nhap lai mat khau</Label>
        <Input id="reg-confirm" type="password" placeholder="******" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRegister()} disabled={loading}
          className="h-11 rounded-xl bg-white/60 dark:bg-white/5 border-border/50 dark:border-white/10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 transition-all duration-200" />
      </div>
      <Button
        className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200"
        onClick={handleRegister} disabled={loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Dang xu ly...
          </span>
        ) : "Dang ky"}
      </Button>
    </div>
  );
}

// ─── Forgot Password ─────────────────────────────────────────────────────────

function ForgotNotice() {
  return (
    <div className="space-y-3 py-2 auth-form-animate">
      <p className="text-sm text-muted-foreground">
        De dat lai mat khau, vui long lien he admin:
      </p>
      <div className="rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/40 p-4 space-y-2">
        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">BMT Decor — Ho tro ky thuat</p>
        <p className="text-sm text-orange-700 dark:text-orange-400">Zalo / Dien thoai: <strong>0934 888 881</strong></p>
        <p className="text-sm text-orange-700 dark:text-orange-400">Email: <strong>depdecor.vn@gmail.com</strong></p>
      </div>
      <p className="text-xs text-muted-foreground">
        Admin se reset mat khau va gui lai cho ban qua Zalo.
      </p>
    </div>
  );
}

// ─── Branding Panel (desktop left side) ──────────────────────────────────────

function BrandingPanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-orange-600 to-amber-500 text-white p-10 rounded-l-2xl min-h-full relative overflow-hidden">
      {/* Subtle glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-700/30 via-transparent to-amber-400/20 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-800/20 rounded-full blur-3xl pointer-events-none" />

      <div className="mb-6 relative z-10 auth-panel-fade" style={{ animationDelay: "0.1s" }}>
        <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-900/20 mb-4 mx-auto transform hover:scale-105 transition-transform duration-300">
          <span className="text-orange-600 font-black text-3xl">BMT</span>
        </div>
        <h1 className="text-3xl font-black text-center tracking-tight">BMT Decor AI</h1>
        <p className="text-orange-100 text-center mt-2 text-sm">Thiet ke kien truc & noi that</p>
      </div>
      <div className="space-y-3 w-full max-w-xs relative z-10">
        {[
          { icon: "\uD83C\uDFE0", title: "Ban ve CAD tu dong", desc: "Tao mat bang trong vai phut" },
          { icon: "\uD83C\uDFA8", title: "Phoi canh 3D & noi that", desc: "Hinh anh thuc te bang AI" },
          { icon: "\uD83D\uDCCB", title: "Du toan chi phi", desc: "Bao gia nhanh chong, chinh xac" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/25 transition-all duration-200 auth-panel-fade" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-orange-100 text-xs">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-orange-200 text-xs mt-8 text-center relative z-10 auth-panel-fade" style={{ animationDelay: "0.5s" }}>
        7/92 Thanh Thai, P.14, Q.10, TP.HCM<br />
        0934 888 881
      </p>
    </div>
  );
}

// ─── Main AuthPage ────────────────────────────────────────────────────────────

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("login");

  function onAuthSuccess() {
    navigate("/");
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      theme === "dark"
        ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
        : "bg-gradient-to-br from-orange-50 to-amber-50"
    }`}>
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${theme === "dark" ? "bg-orange-600/5" : "bg-orange-200/40"}`} />
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl ${theme === "dark" ? "bg-amber-600/5" : "bg-amber-200/30"}`} />
      </div>

      {/* Mobile: single card / Desktop: two-column */}
      <div className="w-full max-w-4xl relative z-10 auth-card-entrance">
        <div className="md:grid md:grid-cols-2 md:shadow-2xl md:rounded-2xl overflow-hidden">

          {/* Left — branding (desktop only) */}
          <BrandingPanel />

          {/* Right — form */}
          <div className={`${theme === "dark" ? "bg-slate-900/95 backdrop-blur-xl" : "bg-white"} md:rounded-r-2xl`}>
            {/* Mobile header */}
            <div className="md:hidden text-center pt-8 pb-2 px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mx-auto mb-3">
                <span className="text-white font-black text-xl">BMT</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">BMT Decor AI</h1>
              <p className="text-sm text-muted-foreground mt-1">He thong thiet ke kien truc & noi that</p>
            </div>

            <Card className={`border-0 shadow-none md:rounded-none md:rounded-r-2xl h-full ${theme === "dark" ? "bg-transparent" : "bg-transparent"}`}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-2 pt-6 md:pt-8 px-6">
                  <TabsList className={`w-full h-12 rounded-xl p-1 ${theme === "dark" ? "bg-white/5 border border-white/10" : "bg-slate-100"}`}>
                    <TabsTrigger
                      value="login"
                      className={`flex-1 rounded-lg h-10 text-sm font-semibold transition-all duration-300 data-[state=active]:shadow-md ${
                        theme === "dark"
                          ? "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-500 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
                          : "data-[state=active]:bg-white data-[state=active]:text-orange-700 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Dang nhap
                    </TabsTrigger>
                    <TabsTrigger
                      value="register"
                      className={`flex-1 rounded-lg h-10 text-sm font-semibold transition-all duration-300 data-[state=active]:shadow-md ${
                        theme === "dark"
                          ? "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-500 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
                          : "data-[state=active]:bg-white data-[state=active]:text-orange-700 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Dang ky
                    </TabsTrigger>
                    <TabsTrigger
                      value="forgot"
                      className={`flex-1 rounded-lg h-10 text-sm font-semibold transition-all duration-300 data-[state=active]:shadow-md ${
                        theme === "dark"
                          ? "data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-amber-500 data-[state=active]:text-white text-slate-400 hover:text-slate-200"
                          : "data-[state=active]:bg-white data-[state=active]:text-orange-700 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Quen MK
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="pt-4 pb-8 px-6">
                  <TabsContent value="login" className="mt-0">
                    <LoginForm onSuccess={onAuthSuccess} />
                  </TabsContent>
                  <TabsContent value="register" className="mt-0">
                    <RegisterForm onSuccess={onAuthSuccess} />
                  </TabsContent>
                  <TabsContent value="forgot" className="mt-0">
                    <CardDescription className="mb-4 text-muted-foreground">Lien he admin de duoc ho tro dat lai mat khau</CardDescription>
                    <ForgotNotice />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
