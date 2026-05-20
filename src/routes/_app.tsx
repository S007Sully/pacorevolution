import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { SwipeContainer } from "@/components/SwipeContainer";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  return (
    <SwipeContainer>
      <div className="min-h-screen pb-24">
        <div className="mx-auto max-w-2xl">
          <Outlet />
        </div>
        <BottomNav />
      </div>
    </SwipeContainer>
  );
}
