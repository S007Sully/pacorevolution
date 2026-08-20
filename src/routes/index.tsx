import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadError(null);
    supabase.from("profiles").select("onboarding_complete").eq("user_id", user.id).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // Never drop this error: `onboarded` would stay null and strand the user on the splash.
        if (error) { setLoadError(error.message); return; }
        setOnboarded(!!data?.onboarding_complete);
      });
    return () => { cancelled = true; };
  }, [user, attempt]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/auth" />;
  if (loadError) return <LoadError message={loadError} onRetry={() => setAttempt((a) => a + 1)} />;
  if (onboarded === null) return <Splash />;
  if (!onboarded) return <Navigate to="/onboarding" />;
  return <Navigate to="/discover" />;
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-[0.2em] text-gradient-gold">PACO</h1>
        <p className="mt-2 text-xs tracking-[0.4em] text-muted-foreground">REVOLUTION</p>
      </div>
    </div>
  );
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-5xl font-black tracking-[0.2em] text-gradient-gold">PACO</h1>
        <p className="mt-2 text-xs tracking-[0.4em] text-muted-foreground">REVOLUTION</p>
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
          We couldn't load your profile.
        </p>
        <p className="mt-2 text-xs text-[color:var(--crimson)]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground glow-crimson"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
