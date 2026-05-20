import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Welcome to the revolution");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-black tracking-[0.2em] text-gradient-gold">PACO</h1>
        <p className="mt-1 text-[10px] tracking-[0.5em] text-muted-foreground">REVOLUTION</p>
        <p className="mt-6 text-sm text-muted-foreground max-w-xs">
          A private social club for the world's most curious nightlife.
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-sm space-y-4 glass rounded-2xl p-6 gold-border">
        <h2 className="text-lg font-semibold tracking-wide">
          {mode === "signin" ? "Enter the room" : "Request entry"}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
          <Input
            id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="bg-input border-border h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
          <Input
            id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            className="bg-input border-border h-11"
          />
        </div>

        <Button type="submit" disabled={busy} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold tracking-wide glow-crimson">
          {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
        </Button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-xs text-muted-foreground hover:text-gold transition-colors"
        >
          {mode === "signin" ? "New here? Request entry →" : "Already a member? Sign in →"}
        </button>
      </form>
    </div>
  );
}
