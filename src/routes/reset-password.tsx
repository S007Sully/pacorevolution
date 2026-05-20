import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import pacoLogo from "@/assets/paco-logo.png";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

type Status = "idle" | "loading" | "success" | "error";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase processes the recovery token from the URL hash and emits PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const busy = status === "loading" || status === "success";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password !== confirm) {
      setErrorMsg("Passwords do not match");
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus("success");
      toast.success("Password updated");
      setTimeout(() => navigate({ to: "/" }), 800);
    } catch (err) {
      const msg = (err as Error).message;
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  };

  const goldInput =
    "flex h-11 w-full rounded-md border border-[color:var(--gold)]/40 bg-input px-3 py-1 text-base text-[color:var(--gold)] caret-[color:var(--gold)] shadow-sm transition-colors placeholder:text-[color:var(--gold)]/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--gold)] focus-visible:border-[color:var(--gold)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 text-center flex flex-col items-center">
        <img src={pacoLogo} alt="PACO Revolution" className="w-36 h-36 object-contain -mb-1 glow-gold" />
        <h1 className="text-4xl font-black tracking-[0.25em] text-gradient-gold">PACO</h1>
        <p className="mt-1.5 text-[10px] tracking-[0.5em] text-muted-foreground">REVOLUTION</p>
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 glass rounded-2xl p-6 gold-border"
        aria-busy={busy}
      >
        <h2 className="text-lg font-semibold tracking-wide">Set a new password</h2>

        {!ready && (
          <p className="text-xs text-muted-foreground">
            Verifying your reset link…
          </p>
        )}

        <fieldset disabled={busy || !ready} className="space-y-4 contents">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">New password</Label>
            <input
              id="password" type="password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className={goldInput}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-xs uppercase tracking-wider text-[color:var(--gold)]/80">Confirm password</Label>
            <input
              id="confirm" type="password" required minLength={6}
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••" className={goldInput}
            />
          </div>
        </fieldset>

        {status === "error" && errorMsg && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-[color:var(--crimson)]/40 bg-[color:var(--crimson)]/10 px-3 py-2 text-xs">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--crimson)]" />
            <span className="leading-relaxed">{errorMsg}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={busy || !ready}
          className={`w-full h-11 font-semibold tracking-wide transition-all duration-300 ${
            status === "success"
              ? "bg-[color:var(--gold)] text-[color:var(--gold-foreground)] hover:bg-[color:var(--gold)] glow-gold"
              : "bg-primary hover:bg-primary/90 text-primary-foreground glow-crimson"
          }`}
        >
          {status === "loading" ? (
            <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Updating…</span>
          ) : status === "success" ? (
            <span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4" />Updated</span>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}
