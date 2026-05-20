import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, accent = "from-violet-500 to-indigo-600" }: { title: string; subtitle: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden border-b bg-card">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="px-6 py-8 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export function StatCard({ label, value, delta, icon: Icon, tone = "primary" }: {
  label: string; value: string; delta?: string; icon: any; tone?: "primary" | "success" | "warning" | "accent";
}) {
  const tones: Record<string, string> = {
    primary: "from-primary/15 to-primary-glow/10 text-primary",
    success: "from-success/15 to-success/5 text-success",
    warning: "from-warning/15 to-warning/5 text-warning",
    accent: "from-accent/20 to-accent/5 text-accent",
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-elegant">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tones[tone]} blur-2xl opacity-60`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
          {delta && <div className="mt-1 text-xs font-medium text-success">{delta}</div>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
