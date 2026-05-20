import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/tickets")({
  component: Tickets,
});

type Row = {
  id: string; payment_status: string; payment_link: string | null;
  event: { id: string; name: string; date: string; location: string | null; image_url: string | null; price: number | null } | null;
};

function Tickets() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("tickets")
      .select("id,payment_status,payment_link,event:events(id,name,date,location,image_url,price)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  };
  useEffect(() => { load(); }, [user]);

  const markPaid = async (id: string) => {
    const { error } = await supabase.from("tickets").select("id").eq("id", id).maybeSingle();
    if (error) return toast.error(error.message);
    // Simulate confirmation locally (user returns from payment provider)
    setRows((rs) => rs.map((r) => r.id === id ? { ...r, payment_status: "paid" } : r));
    toast.success("Ticket confirmed");
  };

  return (
    <>
      <PageHeader eyebrow="Your access" title="Tickets">Confirm payment to lock your spot.</PageHeader>
      <div className="px-5 space-y-4">
        {rows.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="text-muted-foreground text-sm">No tickets yet. Reserve from Events.</p>
          </div>
        )}
        {rows.map((r) => (
          <article key={r.id} className="rounded-2xl overflow-hidden border border-border bg-card">
            <div className="aspect-[16/8] relative bg-gradient-to-br from-primary/30 via-card to-black">
              {r.event?.image_url && <img src={r.event.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <p className="text-[10px] tracking-[0.3em] uppercase text-gold">
                  {r.event && new Date(r.event.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
                <h3 className="text-lg font-bold">{r.event?.name}</h3>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{r.event?.location}</p>
                <p className="text-lg font-bold text-gradient-gold">${r.event?.price}</p>
              </div>
              {r.payment_status === "paid" ? (
                <span className="flex items-center gap-1.5 text-gold text-xs tracking-widest uppercase font-semibold">
                  <CheckCircle2 className="h-4 w-4" /> Confirmed
                </span>
              ) : (
                <div className="flex flex-col gap-2 items-end">
                  <a href={r.payment_link ?? "#"} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
                    Open payment <ExternalLink className="h-3 w-3" />
                  </a>
                  <Button size="sm" onClick={() => markPaid(r.id)} className="bg-primary text-primary-foreground glow-crimson h-9">
                    I've paid
                  </Button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
