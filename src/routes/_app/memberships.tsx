import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/memberships")({
  component: Memberships,
});

const TIERS = [
  { id: "initiate", label: "Initiate", price: "Free", perks: ["Discover the room", "Public events"] },
  { id: "noir", label: "Noir", price: "$49/mo", perks: ["Priority RSVP", "Member events"] },
  { id: "crimson", label: "Crimson", price: "$199/mo", perks: ["Inner circle", "Private rooms", "+1 invites"], featured: true },
  { id: "gold", label: "Gold", price: "By invitation", perks: ["Unlimited everything", "Concierge", "Yacht access"] },
] as const;

function Memberships() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<string>("initiate");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("membership_tier").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => data?.membership_tier && setCurrent(data.membership_tier));
  }, [user]);

  const upgrade = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ membership_tier: id }).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setCurrent(id);
    toast.success(`Welcome to ${id.toUpperCase()}`);
  };

  return (
    <>
      <PageHeader eyebrow="Membership" title="Tiers">Choose your level of access.</PageHeader>
      <div className="px-5 space-y-3">
        {TIERS.map((t) => {
          const active = current === t.id;
          return (
            <article
              key={t.id}
              className={`rounded-2xl p-5 border ${t.featured ? "gold-border bg-gold/[0.03] glow-gold" : "border-border bg-card"}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Crown className={`h-4 w-4 ${t.featured ? "text-gold" : "text-muted-foreground"}`} />
                    <h3 className="font-bold tracking-widest uppercase">{t.label}</h3>
                  </div>
                  <p className={`mt-1 text-2xl font-black ${t.featured ? "text-gradient-gold" : ""}`}>{t.price}</p>
                </div>
                {active && <span className="text-[10px] tracking-[0.2em] text-gold uppercase">Current</span>}
              </div>
              <ul className="mt-4 space-y-1.5">
                {t.perks.map((p) => (
                  <li key={p} className="text-sm text-foreground/80 flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-gold" /> {p}
                  </li>
                ))}
              </ul>
              {!active && (
                <Button
                  onClick={() => upgrade(t.id)}
                  className={`mt-4 w-full h-10 font-semibold ${t.featured ? "bg-gold text-gold-foreground hover:bg-gold/90" : "bg-primary text-primary-foreground glow-crimson"}`}
                >
                  Upgrade
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
