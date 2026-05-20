import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import pacoLogo from "@/assets/paco-logo.png";

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

  const goldInput =
    "flex h-11 w-full rounded-md border border-[color:var(--gold)]/40 bg-input px-3 py-1 text-base text-[color:var(--gold)] caret-[color:var(--gold)] shadow-sm transition-colors placeholder:text-[color:var(--gold)]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--gold)] focus-visible:border-[color:var(--gold)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 text-center flex flex-col items-center">
        <img
          src={pacoLogo}
          alt="PACO Revolution"
          className="w-36 h-36 object-contain -mb-1 glow-gold"
        />
        <h1 className="text-4xl font-black tracking-[0.25em] text-gradient-gold">PACO</h1>
        <p className="mt-1.5 text-[10px] tracking-[0.5em] text-muted-foreground">REVOLUTION</p>
        <div className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[color:var(--gold)]/60 to-transparent" />
        <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
          A private social club for the world's most curious nightlife.
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-sm space-y-4 glass rounded-2xl p-6 gold-border">
        <h2 className="text-lg font-semibold tracking-wide">
          {mode === "signin" ? "Enter the room" : "Request entry"}
        </h2>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">Email</Label>
          <input
            id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@revolution.club"
            className={goldInput}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">Password</Label>
          <input
            id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={goldInput}
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
