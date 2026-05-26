import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LogOut, MapPin, Crown, Camera, Plus, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { normalizeImageOrientation } from "@/lib/image-orientation";

export const Route = createFileRoute("/_app/profile")({
  component: Profile,
});

type P = {
  name: string | null; bio: string | null; location: string | null;
  avatar_url: string | null; photos: string[] | null; membership_tier: string | null;
};

function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<P | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const photosInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles")
      .select("name,bio,location,avatar_url,photos,membership_tier")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setP(data as P | null);
        if (data) { setName(data.name ?? ""); setBio(data.bio ?? ""); setLocation(data.location ?? ""); }
      });
  }, [user]);

  const uploadOne = async (file: File, folder: "avatar" | "gallery") => {
    if (!user) return null;
    const normalized = await normalizeImageOrientation(file);
    const ext = normalized.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg");
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("profile-photos")
      .upload(path, normalized, { contentType: normalized.type || "image/jpeg" });
    if (error) { toast.error(error.message); return null; }
    return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f || !p) return;
    setBusy(true);
    const url = await uploadOne(f, "avatar");
    if (url) {
      await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user!.id);
      setP({ ...p, avatar_url: url });
    }
    setBusy(false);
  };

  const onPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []); if (!files.length || !p) return;
    setBusy(true);
    const urls: string[] = [];
    for (const f of files) { const u = await uploadOne(f, "gallery"); if (u) urls.push(u); }
    const newPhotos = [...(p.photos ?? []), ...urls];
    await supabase.from("profiles").update({ photos: newPhotos }).eq("user_id", user!.id);
    setP({ ...p, photos: newPhotos });
    setBusy(false);
  };

  const removePhoto = async (idx: number) => {
    if (!p) return;
    const newPhotos = (p.photos ?? []).filter((_, i) => i !== idx);
    await supabase.from("profiles").update({ photos: newPhotos }).eq("user_id", user!.id);
    setP({ ...p, photos: newPhotos });
  };

  const saveEdit = async () => {
    if (!user || !p) return;
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ name, bio, location, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    if (error) { toast.error(error.message); setBusy(false); return; }
    setP({ ...p, name, bio, location });
    setEditing(false);
    setBusy(false);
    toast.success("Profile updated.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  if (!p) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  const goldInput = "w-full h-10 rounded-lg border border-gold/40 bg-input px-3 text-sm text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold";
  const goldTextarea = "w-full rounded-lg border border-gold/40 bg-input px-3 py-2 text-sm text-gold placeholder:text-gold/40 focus:outline-none focus:border-gold min-h-20";

  return (
    <>
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-primary/30 via-card to-black" />
        <div className="px-5 -mt-16">
          <div className="relative h-32 w-32 mx-auto">
            <div className="h-32 w-32 rounded-full overflow-hidden gold-border bg-card glow-gold">
              {p.avatar_url
                ? <img src={p.avatar_url} className="h-full w-full object-cover" />
                : <div className="h-full w-full bg-gradient-to-br from-primary/40 to-card" />}
            </div>
            <button
              onClick={() => avatarInput.current?.click()}
              className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary flex items-center justify-center glow-crimson"
            >
              <Camera className="h-4 w-4 text-primary-foreground" />
            </button>
            <input ref={avatarInput} type="file" accept="image/*" hidden onChange={onAvatar} />
          </div>

          <div className="text-center mt-3">
            {editing ? (
              <div className="space-y-3 text-left mt-4">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={goldInput} />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className={goldTextarea} />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City" className={goldInput} />
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEditing(false)} className="flex-1 h-10 rounded-xl border border-border bg-transparent text-sm">Cancel</button>
                  <button onClick={saveEdit} disabled={busy} className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-crimson">
                    <Check className="h-4 w-4 inline mr-1" /> Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-2xl font-black">{p.name ?? "Anonymous"}</h1>
                  <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-gold transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {p.location && <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1"><MapPin className="h-3 w-3" />{p.location}</p>}
                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full gold-border text-[10px] tracking-[0.25em] uppercase text-gold">
                  <Crown className="h-3 w-3" /> {p.membership_tier}
                </span>
                {p.bio && <p className="text-sm text-foreground/80 mt-4 max-w-sm mx-auto">{p.bio}</p>}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="px-5 mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Gallery</p>
          <button onClick={() => photosInput.current?.click()} className="flex items-center gap-1 text-xs text-gold hover:text-gold/80">
            <Plus className="h-3.5 w-3.5" /> Add photos
          </button>
          <input ref={photosInput} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(p.photos ?? []).map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
              <img src={url} className="h-full w-full object-cover" />
              <button
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {(!p.photos || p.photos.length === 0) && (
            <p className="col-span-3 text-center text-sm text-muted-foreground py-6">No photos yet.</p>
          )}
        </div>
      </div>

      <div className="px-5 py-8">
        <button onClick={signOut} className="w-full h-11 rounded-xl border border-border bg-transparent text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </>
  );
}
