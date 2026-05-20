import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, CalendarDays, Crown, Ticket, Users, MessageCircle, User } from "lucide-react";

const tabs = [
  { to: "/discover", label: "Discover", icon: Sparkles },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/memberships", label: "Tiers", icon: Crown },
  { to: "/tickets", label: "Tickets", icon: Ticket },
  { to: "/community", label: "Feed", icon: Users },
  { to: "/messages", label: "DMs", icon: MessageCircle },
  { to: "/profile", label: "You", icon: User },
] as const;

export function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/60 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-2xl px-2">
        <ul className="grid grid-cols-7 gap-0.5 py-2">
          {tabs.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5 transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-[18px] w-[18px] ${active ? "drop-shadow-[0_0_6px_oklch(0.52_0.23_27)]" : ""}`} />
                  <span className="text-[10px] font-medium tracking-wide uppercase">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
