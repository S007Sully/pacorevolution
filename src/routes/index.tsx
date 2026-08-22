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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;

      // A failed lookup is not the same as "never onboarded" — bouncing the
      // member to /onboarding here would wipe a finished profile.
      if (error) {
        setLoadError(error.message);
        return;
      }

      // No row means the on_auth_user_created trigger never ran for this
      // account. Create it here so the member isn't stuck outside the app.
      if (!data) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: user.id });
        if (cancelled) return;
        if (insertError && insertError.code !== "23505") {
          setLoadError(insertError.message);
          return;
        }
        setOnboarded(false);
        return;
      }

      setOnboarded(!!data.onboarding_complete);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/auth" />;
  if (loadError) return <LoadFailed message={loadError} />;
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

function LoadFailed({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <h1 className="text-4xl font-black tracking-[0.2em] text-gradient-gold">PACO</h1>
        <p className="mt-2 text-xs tracking-[0.4em] text-muted-foreground">REVOLUTION</p>
        <p className="mt-6 text-sm text-muted-foreground leading-relaxed">
          We couldn't load your profile just now. Check your connection and try again.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/70">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground glow-crimson"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
