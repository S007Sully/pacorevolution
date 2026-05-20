import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin, Crown } from "lucide-react";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

type P = { name: string | null; bio: string | null; location: string | null; avatar_url: string | null; photos: string[] | null; membership_tier: string | null };

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<P | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,bio,location,avatar_url,photos,membership_tier")
      .eq("user_id", user.id).maybeSingle().then(({ data }) => setP(data as P | null));
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!p) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <>
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-primary/30 via-card to-black" />
        <div className="px-5 -mt-16">
          <div className="h-32 w-32 rounded-full overflow-hidden gold-border bg-card glow-gold mx-auto">
            {p.avatar_url ? <img src={p.avatar_url} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />}
          </div>
          <div className="text-center mt-3">
            <h1 className="text-2xl font-black">{p.name ?? "Anonymous"}</h1>
            {p.location && <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.location}</p>}
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full gold-border text-[10px] tracking-[0.25em] uppercase text-gold">
              <Crown className="h-3 w-3" /> {p.membership_tier}
            </span>
            {p.bio && <p className="text-sm text-foreground/80 mt-4 max-w-sm mx-auto">{p.bio}</p>}
          </div>
        </div>
      </div>

      <PageHeader title="Gallery" />
      <div className="px-5 grid grid-cols-3 gap-2">
        {(p.photos ?? []).map((url, i) => (
          <div key={i} className="aspect-square rounded-lg overflow-hidden border border-border">
            <img src={url} className="h-full w-full object-cover" />
          </div>
        ))}
        {(!p.photos || p.photos.length === 0) && <p className="col-span-3 text-center text-sm text-muted-foreground py-6">No photos yet.</p>}
      </div>

      <div className="px-5 py-8">
        <Button variant="outline" onClick={signOut} className="w-full h-11 border-border bg-transparent text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </>
  );
}
