import { useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";

const order = ["/discover", "/events", "/memberships", "/tickets", "/community", "/messages", "/profile"];

export function SwipeContainer({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      if (startX.current == null || startY.current == null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      startX.current = null;
      startY.current = null;
      if (Math.abs(dx) < 70 || Math.abs(dy) > Math.abs(dx)) return;
      const idx = order.findIndex((p) => loc.pathname.startsWith(p));
      if (idx === -1) return;
      const next = dx < 0 ? idx + 1 : idx - 1;
      if (next >= 0 && next < order.length) navigate({ to: order[next] });
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [loc.pathname, navigate]);

  return <>{children}</>;
}
