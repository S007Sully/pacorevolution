import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Heart, X, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/discover")({
  component: Discover,
});

type Profile = {
  id: string; user_id: string; name: string | null; bio: string | null;
  location: string | null; avatar_url: string | null; photos: string[] | null;
  membership_tier: string | null;
};

function Discover() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles")
        .select("id,user_id,name,bio,location,avatar_url,photos,membership_tier")
        .eq("onboarding_complete", true)
        .neq("user_id", user?.id ?? "")
        .limit(20);
      setProfiles((data ?? []) as Profile[]);
      setLoading(false);
    })();
  }, []);

  const advance = () => setIdx((i) => i + 1);
  const current = profiles[idx];

  return (
    <>
      <PageHeader eyebrow="Tonight" title="Discover">The room is curated. Swipe with intent.</PageHeader>

      <div className="px-5">
        {loading ? (
          <div className="aspect-[3/4] rounded-3xl bg-card animate-pulse" />
        ) : !current ? (
          <div className="aspect-[3/4] rounded-3xl glass flex flex-col items-center justify-center text-center px-8">
            <p className="text-gradient-gold font-bold tracking-widest text-sm">END OF NIGHT</p>
            <p className="text-muted-foreground mt-2 text-sm">New faces every evening. Check back soon.</p>
          </div>
        ) : (
          <article className="relative aspect-[3/4] rounded-3xl overflow-hidden gold-border glow-crimson bg-card">
            {current.avatar_url ? (
              <img src={current.avatar_url} alt={current.name ?? ""} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-card to-black" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6 pt-20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] tracking-[0.3em] uppercase text-gold">{current.membership_tier ?? "initiate"}</span>
              </div>
              <h2 className="text-3xl font-bold">{current.name ?? "Anonymous"}</h2>
              {current.location && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" /> {current.location}
                </p>
              )}
              {current.bio && <p className="text-sm mt-2 line-clamp-2">{current.bio}</p>}
            </div>
          </article>
        )}

        {current && (
          <div className="mt-6 flex items-center justify-center gap-6">
            <button onClick={advance} className="h-14 w-14 rounded-full bg-card border border-border flex items-center justify-center hover:border-muted-foreground transition-colors">
              <X className="h-6 w-6 text-muted-foreground" />
            </button>
            <button onClick={advance} className="h-16 w-16 rounded-full bg-primary flex items-center justify-center glow-crimson hover:scale-105 transition-transform">
              <Heart className="h-7 w-7 text-primary-foreground fill-current" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
