import { useEffect, type ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  useEffect(() => { document.title = `${title} · PACO REVOLUTION`; }, [title]);
  return (
    <header className="px-5 pt-10 pb-6">
      {eyebrow && <p className="text-[10px] tracking-[0.4em] text-gold uppercase mb-2">{eyebrow}</p>}
      <h1 className="text-3xl font-black tracking-tight">{title}</h1>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}
