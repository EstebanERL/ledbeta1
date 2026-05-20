import { PageHeader, StatCard, Section } from "./shared";
import { Briefcase, FileText, GraduationCap, Sparkles, MapPin, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function CandidatoDashboard({ name }: { name: string }) {
  const completion = 65;
  return (
    <div>
      <PageHeader
        title={`¡Hola, ${name}! 🎯`}
        subtitle="Tu camino hacia tu próxima oportunidad"
        accent="from-orange-500 via-pink-500 to-rose-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        {/* Welcome card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-white shadow-elegant md:p-8">
          <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,oklch(0.7_0.18_220_/_0.4),transparent_60%)]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Tu perfil está al {completion}%
              </div>
              <h2 className="mt-3 text-2xl font-bold">Completa tu perfil para destacar</h2>
              <p className="mt-1 text-white/80">Agrega tu experiencia, estudios y habilidades para postular más rápido.</p>
            </div>
            <Button size="lg" className="bg-white text-primary hover:bg-white/90">
              Completar ahora <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="relative mt-6 max-w-md">
            <Progress value={completion} className="h-2 bg-white/20" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Vacantes recomendadas" value="12" icon={Briefcase} tone="primary" />
          <StatCard label="Mis postulaciones" value="4" icon={FileText} tone="accent" />
          <StatCard label="Inducción" value="0/3" icon={GraduationCap} tone="warning" />
        </div>

        <Section title="Vacantes para ti" action={<Button size="sm" variant="outline">Ver todas</Button>}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { c: "Frontend Engineer", a: "Tecnología", m: "Remoto", s: "$3,500 USD", match: 92 },
              { c: "Product Designer", a: "Producto", m: "Híbrido", s: "$2,800 USD", match: 85 },
              { c: "Data Analyst", a: "Datos", m: "Remoto", s: "$2,400 USD", match: 78 },
            ].map((v) => (
              <div key={v.c} className="group rounded-xl border bg-card p-5 transition hover:shadow-elegant hover:-translate-y-0.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{v.c}</h3>
                    <div className="mt-1 text-xs text-muted-foreground">{v.a}</div>
                  </div>
                  <Badge className="bg-success/15 text-success">{v.match}% match</Badge>
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.m}</span>
                  <span>•</span>
                  <span>{v.s}</span>
                </div>
                <Button size="sm" className="mt-4 w-full bg-gradient-primary">Postular</Button>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Mis postulaciones recientes">
          <ul className="divide-y">
            {[
              { c: "Senior Backend Engineer", e: "En revisión", t: "bg-warning/20 text-warning", d: "hace 2 días" },
              { c: "QA Engineer", e: "Prueba técnica", t: "bg-primary/15 text-primary", d: "hace 5 días" },
              { c: "DevOps Junior", e: "Rechazado", t: "bg-destructive/15 text-destructive", d: "hace 1 sem." },
            ].map((p, i) => (
              <li key={i} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{p.c}</div>
                  <div className="text-xs text-muted-foreground">{p.d}</div>
                </div>
                <Badge className={p.t}>{p.e}</Badge>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
