import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/community")({
  component: Community,
});

type Profile = {
  user_id: string; name: string | null; bio: string | null; location: string | null;
  avatar_url: string | null; membership_tier: string | null;
};

function Community() {
  const [feed, setFeed] = useState<Profile[]>([]);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from("profiles")
        .select("user_id,name,bio,location,avatar_url,membership_tier")
        .eq("onboarding_complete", true)
        .neq("user_id", user?.id ?? "")
        .order("updated_at", { ascending: false })
        .limit(50);
      setFeed((data ?? []) as Profile[]);
    })();
  }, []);

  return (
    <>
      <PageHeader eyebrow="The Circle" title="Community">Who's in the room tonight.</PageHeader>
      <div className="px-5 space-y-3">
        {feed.map((p) => (
          <article key={p.user_id} className="rounded-2xl border border-border bg-card p-4 flex gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden bg-secondary shrink-0 gold-border">
              {p.avatar_url ? (
                <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold truncate">{p.name ?? "Anonymous"}</h3>
                <span className="text-[9px] tracking-[0.25em] uppercase text-gold">{p.membership_tier}</span>
              </div>
              {p.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{p.location}</p>}
              {p.bio && <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{p.bio}</p>}
              <Link to="/messages/$userId" params={{ userId: p.user_id }}
                className="inline-flex items-center gap-1.5 text-xs text-primary mt-3 hover:text-primary/80">
                <MessageCircle className="h-3.5 w-3.5" /> Message
              </Link>
            </div>
          </article>
        ))}
        {feed.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">Quiet right now.</p>}
      </div>
    </>
  );
}
