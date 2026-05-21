import { PageHeader, StatCard, Section } from "./shared";
import { Briefcase, FileText, GraduationCap, Sparkles, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useVacantesPublic, useMyPostulaciones, estadoColor } from "@/lib/queries";

export function CandidatoDashboard({ name }: { name: string }) {
  const vacQ = useVacantesPublic();
  const postQ = useMyPostulaciones();

  if (vacQ.isLoading || postQ.isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const vac = vacQ.data ?? [];
  const post = postQ.data ?? [];
  const activas = post.filter((p) => !["rechazada", "contratada"].includes(p.estado)).length;
  const recomendadas = vac.filter((v) => !post.some((p) => p.vacanteId === v.id)).slice(0, 3);
  const completion = 65;

  return (
    <div>
      <PageHeader
        title={`¡Hola, ${name}! 🎯`}
        subtitle="Tu camino hacia tu próxima oportunidad"
        accent="from-orange-500 via-pink-500 to-rose-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-hero p-6 text-white shadow-elegant md:p-8">
          <div className="absolute inset-0 [background:radial-gradient(circle_at_80%_20%,oklch(0.7_0.18_220_/_0.4),transparent_60%)]" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Perfil al {completion}%
              </div>
              <h2 className="mt-3 text-2xl font-bold">Completa tu perfil para destacar</h2>
              <p className="mt-1 text-white/80">Agrega experiencia y habilidades para postular más rápido.</p>
            </div>
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/perfil">Ir a mi perfil <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="relative mt-6 max-w-md">
            <Progress value={completion} className="h-2 bg-white/20" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Vacantes disponibles" value={String(vac.length)} icon={Briefcase} tone="primary" />
          <StatCard label="Mis postulaciones" value={String(post.length)} icon={FileText} tone="accent" />
          <StatCard label="Activas" value={String(activas)} icon={GraduationCap} tone="warning" />
        </div>

        <Section title="Vacantes para ti" action={
          <Button asChild size="sm" variant="outline"><Link to="/empleos">Ver todas</Link></Button>
        }>
          {recomendadas.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No hay vacantes recomendadas ahora.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recomendadas.map((v) => (
                <div key={v.id} className="group rounded-xl border bg-card p-5 transition hover:shadow-elegant hover:-translate-y-0.5">
                  <h3 className="font-semibold">{v.titulo}</h3>
                  <div className="mt-1 text-xs text-muted-foreground">{v.departamento}</div>
                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.ubicacion}</span>
                    <span>•</span><span>{v.modalidad}</span>
                  </div>
                  <Button asChild size="sm" className="mt-4 w-full bg-gradient-primary">
                    <Link to="/empleos">Ver detalle</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Mis postulaciones recientes" action={
          <Button asChild size="sm" variant="outline"><Link to="/postulaciones">Ver todas</Link></Button>
        }>
          {post.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tienes postulaciones. <Link to="/empleos" className="text-primary hover:underline">Explora empleos</Link>
            </div>
          ) : (
            <ul className="divide-y">
              {post.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{p.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
