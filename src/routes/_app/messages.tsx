import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/messages")({
  component: Messages,
});

type Thread = { user_id: string; name: string | null; avatar_url: string | null; last: string | null; at: string };

function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: msgs } = await supabase.from("messages")
        .select("sender_id,receiver_id,content,created_at")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const seen = new Map<string, Thread>();
      for (const m of msgs ?? []) {
        const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!seen.has(other)) seen.set(other, { user_id: other, name: null, avatar_url: null, last: m.content, at: m.created_at ?? new Date().toISOString() });
      }
      const ids = [...seen.keys()];
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id,name,avatar_url").in("user_id", ids);
        for (const p of profs ?? []) {
          const t = seen.get(p.user_id); if (t) { t.name = p.name; t.avatar_url = p.avatar_url; }
        }
      }
      setThreads([...seen.values()]);
    })();
  }, [user]);

  return (
    <>
      <PageHeader eyebrow="Private" title="Messages">DMs and inner-circle chats.</PageHeader>
      <div className="px-5 space-y-2">
        {threads.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-12">
            No messages yet. Start one from <Link to="/community" className="text-gold">Community</Link>.
          </div>
        )}
        {threads.map((t) => (
          <Link key={t.user_id} to="/messages/$userId" params={{ userId: t.user_id }}
            className="flex items-center gap-3 rounded-xl p-3 hover:bg-card transition-colors">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-secondary shrink-0">
              {t.avatar_url ? <img src={t.avatar_url} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{t.name ?? "Anonymous"}</p>
              <p className="text-xs text-muted-foreground truncate">{t.last ?? "Media"}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{new Date(t.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
