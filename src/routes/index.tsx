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

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_complete").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setOnboarded(!!data?.onboarding_complete));
  }, [user]);

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/auth" />;
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
