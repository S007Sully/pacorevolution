import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { CalendarDays, MapPin } from "lucide-react";

export const Route = createFileRoute("/_app/events")({
  component: Events,
});

type Event = { id: string; name: string; description: string | null; date: string; location: string | null; image_url: string | null; price: number | null };

function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    supabase.from("events").select("*").order("date").then(({ data }) => setEvents((data ?? []) as Event[]));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Upcoming" title="Events">Reserved nights, intimate rooms.</PageHeader>
      <div className="px-5 space-y-4">
        {events.map((e) => (
          <Link key={e.id} to="/events/$eventId" params={{ eventId: e.id }} className="block group">
            <article className="relative rounded-2xl overflow-hidden border border-border bg-card hover:border-gold/40 transition-colors">
              <div className="aspect-[16/10] relative bg-gradient-to-br from-primary/30 via-card to-black">
                {e.image_url && <img src={e.image_url} alt={e.name} className="absolute inset-0 h-full w-full object-cover" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[10px] tracking-[0.3em] uppercase text-gold">{new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  <h3 className="text-xl font-bold mt-1">{e.name}</h3>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.location}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(e.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="text-gold font-semibold">${e.price}</span>
              </div>
            </article>
          </Link>
        ))}
        {events.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No events yet.</p>}
      </div>
    </>
  );
}
