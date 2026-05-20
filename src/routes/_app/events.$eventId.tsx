import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/events/$eventId")({
  component: EventDetail,
});

type Event = { id: string; name: string; description: string | null; date: string; location: string | null; image_url: string | null; price: number | null };

function EventDetail() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("events").select("*").eq("id", eventId).maybeSingle().then(({ data }) => setEvent(data as Event | null));
  }, [eventId]);

  const reserve = async () => {
    if (!event) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("tickets").insert({
      event_id: event.id, user_id: user.id, payment_status: "pending",
      payment_link: `https://buy.stripe.com/test_paco_${event.id}`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reserved. Complete payment in Tickets.");
    navigate({ to: "/tickets" });
  };

  if (!event) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div>
      <div className="relative aspect-[4/5]">
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-card to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <button onClick={() => navigate({ to: "/events" })} className="absolute top-12 left-5 h-10 w-10 rounded-full glass flex items-center justify-center">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-[10px] tracking-[0.4em] uppercase text-gold">{new Date(event.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="text-3xl font-black mt-2">{event.name}</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">
        <div className="flex gap-6 text-sm">
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> {event.location}</span>
          <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-gold" /> {new Date(event.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <p className="text-foreground/80 leading-relaxed">{event.description}</p>

        <div className="glass rounded-2xl p-5 flex items-center justify-between gold-border">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Entry</p>
            <p className="text-2xl font-bold text-gradient-gold">${event.price}</p>
          </div>
          <Button onClick={reserve} disabled={busy} className="bg-primary text-primary-foreground font-semibold h-11 px-6 glow-crimson">
            Reserve
          </Button>
        </div>
      </div>
    </div>
  );
}
