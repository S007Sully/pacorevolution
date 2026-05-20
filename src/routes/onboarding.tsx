import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Camera, Plus, X } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const TIERS = [
  { id: "initiate", label: "Initiate", desc: "Discover the world of Paco" },
  { id: "noir", label: "Noir", desc: "Priority access to monthly events" },
  { id: "crimson", label: "Crimson", desc: "Inner circle, private rooms, +1s" },
  { id: "gold", label: "Gold", desc: "Unlimited everything. By invitation." },
] as const;

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [tier, setTier] = useState<string>("initiate");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const uploadOne = async (file: File, folder: "avatar" | "gallery") => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos").upload(path, file);
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const url = await uploadOne(f, "avatar");
    if (url) setAvatar(url);
    setBusy(false);
  };

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const f of files) {
      const u = await uploadOne(f, "gallery"); if (u) urls.push(u);
    }
    setPhotos((p) => [...p, ...urls]);
    setBusy(false);
  };

  const finish = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      name, bio, location, membership_tier: tier, avatar_url: avatar, photos,
      onboarding_complete: true, updated_at: new Date().toISOString(),
    }).eq("user_id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome inside.");
    navigate({ to: "/discover" });
  };

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xs tracking-[0.3em] text-muted-foreground">STEP {step + 1} / 3</span>
        <span className="text-xs tracking-[0.3em] text-gradient-gold font-bold">PACO</span>
      </div>

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Who are you?</h2>
            <p className="text-sm text-muted-foreground mt-1">The basics. Keep it real.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-input" placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="bg-input min-h-24" placeholder="A line or two." />
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">City</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-11 bg-input" placeholder="New York" />
          </div>
          <Button onClick={() => setStep(1)} disabled={!name} className="w-full h-12 bg-primary text-primary-foreground font-semibold glow-crimson">
            Continue
          </Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Your face. Your gallery.</h2>
            <p className="text-sm text-muted-foreground mt-1">Real photos only. No filters needed.</p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => avatarInput.current?.click()}
              className="relative h-32 w-32 rounded-full overflow-hidden gold-border bg-card flex items-center justify-center glow-gold"
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-gold" />
              )}
            </button>
            <input ref={avatarInput} type="file" accept="image/*" capture="user" hidden onChange={onAvatar} />
            <span className="text-xs text-muted-foreground">Tap to add profile photo</span>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Gallery ({photos.length})</Label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photosInput.current?.click()}
                className="aspect-square rounded-lg border border-dashed border-border flex items-center justify-center text-muted-foreground hover:text-gold hover:border-gold/40 transition-colors"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
            <input ref={photosInput} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(0)} className="flex-1 h-12 border-border bg-transparent">Back</Button>
            <Button onClick={() => setStep(2)} disabled={busy} className="flex-1 h-12 bg-primary text-primary-foreground font-semibold glow-crimson">
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Pick your tier</h2>
            <p className="text-sm text-muted-foreground mt-1">You can change this anytime.</p>
          </div>

          <div className="space-y-3">
            {TIERS.map((t) => {
              const active = tier === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id)}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    active ? "border-gold bg-gold/5 glow-gold" : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold tracking-wider uppercase ${active ? "text-gold" : ""}`}>{t.label}</span>
                    {active && <span className="text-[10px] text-gold tracking-widest">SELECTED</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-border bg-transparent">Back</Button>
            <Button onClick={finish} disabled={busy} className="flex-1 h-12 bg-primary text-primary-foreground font-semibold glow-crimson">
              {busy ? "..." : "Enter"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
