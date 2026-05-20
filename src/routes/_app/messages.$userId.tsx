import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ImagePlus, Send, Video } from "lucide-react";

export const Route = createFileRoute("/_app/messages/$userId")({
  component: Thread,
});

type Msg = { id: string; sender_id: string; receiver_id: string; content: string | null; media_url: string | null; media_type: string | null; created_at: string };

function Thread() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [other, setOther] = useState<{ name: string | null; avatar_url: string | null } | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("profiles").select("name,avatar_url").eq("user_id", userId).maybeSingle()
      .then(({ data }) => setOther(data));
  }, [userId]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
      .order("created_at");
    setMsgs((data ?? []) as Msg[]);
    setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  useEffect(() => { load(); }, [user, userId]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`dm:${user.id}:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if ((m.sender_id === user.id && m.receiver_id === userId) || (m.sender_id === userId && m.receiver_id === user.id)) {
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, userId]);

  const send = async (content: string | null, media?: { url: string; type: string }) => {
    if (!user) return;
    if (!content && !media) return;
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id, receiver_id: userId,
      content, media_url: media?.url ?? null, media_type: media?.type ?? null,
    });
    if (error) toast.error(error.message);
    setText("");
  };

  const uploadMedia = async (file: File, kind: "image" | "video") => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("message-media").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = await supabase.storage.from("message-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    if (data?.signedUrl) await send(null, { url: data.signedUrl, type: kind });
  };

  return (
    <div className="flex flex-col h-screen pb-24">
      <header className="sticky top-0 z-10 glass border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: "/messages" })}><ArrowLeft className="h-5 w-5" /></button>
        <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary">
          {other?.avatar_url ? <img src={other.avatar_url} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />}
        </div>
        <h2 className="font-semibold">{other?.name ?? "Anonymous"}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {msgs.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                {m.media_type === "image" && m.media_url && <img src={m.media_url} className="rounded-lg max-w-full mb-1" />}
                {m.media_type === "video" && m.media_url && <video src={m.media_url} controls className="rounded-lg max-w-full mb-1" />}
                {m.content && <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(text || null); }}
        className="fixed bottom-[64px] left-0 right-0 glass border-t border-border px-3 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)]"
      >
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-gold">
            <ImagePlus className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => videoRef.current?.click()} className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-gold">
            <Video className="h-5 w-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "image")} />
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0], "video")} />
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message…" className="bg-input h-10" />
          <Button type="submit" size="icon" className="h-10 w-10 bg-primary glow-crimson">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
