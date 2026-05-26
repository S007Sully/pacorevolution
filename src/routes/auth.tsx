import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import pacoLogo from "@/assets/paco-logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Status = "idle" | "loading" | "success" | "error";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const busy = status === "loading" || status === "success";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        setStatus("success");
        toast.success("Welcome to the revolution");
        setTimeout(() => navigate({ to: "/onboarding" }), 700);
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setStatus("success");
        toast.success("Check your email for the reset link");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setStatus("success");
        setTimeout(() => navigate({ to: "/" }), 500);
      }
    } catch (err) {
      const msg = (err as Error).message;
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const goldInput =
    "flex h-11 w-full rounded-md border border-[color:var(--gold)]/40 bg-input px-3 py-1 text-base text-[color:var(--gold)] caret-[color:var(--gold)] shadow-sm transition-colors placeholder:text-[color:var(--gold)]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--gold)] focus-visible:border-[color:var(--gold)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  const renderButtonContent = () => {
    if (status === "loading") {
      return (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {mode === "signin" ? "Opening the door…" : mode === "signup" ? "Securing your spot…" : "Sending link…"}
        </span>
      );
    }
    if (status === "success") {
      return (
        <span className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "You're in" : "Link sent"}
        </span>
      );
    }
    return mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link";
  };

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

      <form
        onSubmit={submit}
        className={`w-full max-w-sm space-y-4 glass rounded-2xl p-6 gold-border transition-all duration-500 ${
          status === "loading" ? "opacity-90" : ""
        } ${status === "success" ? "ring-1 ring-[color:var(--gold)]/60 glow-gold" : ""} ${
          status === "error" ? "ring-1 ring-[color:var(--crimson)]/60" : ""
        }`}
        aria-busy={busy}
      >
        <h2 className="text-lg font-semibold tracking-wide">
          {mode === "signin" ? "Enter the room" : mode === "signup" ? "Request entry" : "Reset password"}
        </h2>

        <fieldset disabled={busy} className="space-y-4 contents">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">Email</Label>
            <input
              id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@revolution.club"
              disabled={busy}
              className={goldInput}
            />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">Password</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => { setMode("forgot"); setStatus("idle"); setErrorMsg(null); }}
                    className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-gold transition-colors disabled:opacity-50"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={busy}
                className={goldInput}
              />
            </div>
          )}
        </fieldset>

        {status === "error" && errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-[color:var(--crimson)]/40 bg-[color:var(--crimson)]/10 px-3 py-2 text-xs text-[color:var(--foreground)] animate-in fade-in slide-in-from-top-1 duration-300"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--crimson)]" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {mode === "forgot" && status === "success" && (
          <div
            role="status"
            className="space-y-2 rounded-md border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 px-3 py-3 text-xs text-[color:var(--foreground)] animate-in fade-in slide-in-from-top-1 duration-300"
          >
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--gold)]" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-medium text-[color:var(--gold)]">Reset link sent</p>
                <p className="text-muted-foreground">
                  We sent a password reset link to <span className="text-[color:var(--gold)]/90">{email}</span>. Open it on this device to set a new password.
                </p>
              </div>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-muted-foreground">
              <li>Check your spam or promotions folder.</li>
              <li>Make sure {email || "your address"} is spelled correctly.</li>
              <li>Wait a minute, then{" "}
                <button
                  type="button"
                  onClick={() => { setStatus("idle"); }}
                  className="underline underline-offset-2 text-[color:var(--gold)] hover:text-[color:var(--gold)]/80"
                >
                  resend the link
                </button>.
              </li>
            </ul>
          </div>
        )}

        <Button
          type="submit"
          disabled={busy}
          className={`w-full h-11 font-semibold tracking-wide transition-all duration-300 ${
            status === "success"
              ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)] hover:bg-[color:var(--gold)] glow-gold"
              : "bg-primary hover:bg-primary/90 text-primary-foreground glow-crimson"
          }`}
        >
          {renderButtonContent()}
        </Button>

        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const next = mode === "signin" ? "signup" : "signin";
            setMode(next);
            setStatus("idle");
            setErrorMsg(null);
          }}
          className="w-full text-center text-xs text-muted-foreground hover:text-gold transition-colors disabled:opacity-50"
        >
          {mode === "signin" && "New here? Request entry →"}
          {mode === "signup" && "Already a member? Sign in →"}
          {mode === "forgot" && "← Back to sign in"}
        </button>
      </form>
    </div>
  );
}
