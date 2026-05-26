import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Send, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/messages/$userId")({
  component: DMThread,
});

type Message = {
  id: string; sender_id: string; receiver_id: string;
  content: string | null; created_at: string | null;
};

type OtherProfile = { name: string | null; avatar_url: string | null };

function DMThread() {
  const { userId } = Route.useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<OtherProfile | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,avatar_url")
      .eq("user_id", userId).maybeSingle()
      .then(({ data }) => setOther(data as OtherProfile | null));

    const load = async () => {
      const { data } = await supabase.from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Message[]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    load();

    const channel = supabase.channel(`dm-${user.id}-${userId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, userId]);

  const send = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const msg = { sender_id: user.id, receiver_id: userId, content: text.trim() };
    const { data } = await supabase.from("messages").insert(msg).select().single();
    if (data) setMessages((prev) => [...prev, data as Message]);
    setText("");
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link to="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="h-9 w-9 rounded-full overflow-hidden bg-secondary gold-border">
          {other?.avatar_url
            ? <img src={other.avatar_url} className="h-full w-full object-cover" />
            : <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />}
        </div>
        <span className="font-semibold">{other?.name ?? "..."}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                mine
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card border border-border rounded-bl-sm"
              }`}>
                {m.content}
                <p className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-12">
            Start the conversation.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-card shrink-0 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Message..."
          className="flex-1 h-11 rounded-xl bg-input border border-border px-4 text-sm focus:outline-none focus:border-gold/40 text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center glow-crimson disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
}
