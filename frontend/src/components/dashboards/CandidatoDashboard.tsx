import { PageHeader, StatCard, Section } from "./shared";
import {
  Briefcase, FileText, MapPin, ArrowRight, Loader2, CheckCircle2, Activity,
  Sparkles, Phone, Brain, FileCheck2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useMyPostulaciones, useMyProfile, useVacantesRecomendadasIA, useMyProfileTest,
  estadoColor, ESTADO_LABEL, fileUrl,
} from "@/lib/queries";

export function CandidatoDashboard({ name }: { name: string }) {
  const profQ = useMyProfile();
  const postQ = useMyPostulaciones();
  const recoQ = useVacantesRecomendadasIA();
  const testQ = useMyProfileTest();

  if (profQ.isLoading || postQ.isLoading || recoQ.isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const profile = profQ.data;
  const post = postQ.data ?? [];
  const reco = recoQ.data ?? [];
  const activas = post.filter((p) => !["rechazada", "contratada"].includes(p.estado));
  const initials = (profile?.fullName || name).slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader
        title={`Hola, ${name}`}
        subtitle="Tu espacio profesional para descubrir y avanzar en oportunidades"
        accent="from-orange-500 via-pink-500 to-rose-500"
      />
      <div className="space-y-6 p-6 md:p-10">

        {/* Summary card profesional */}
        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-rose-500/20">
              {profile?.avatarUrl && <AvatarImage src={fileUrl(profile.avatarUrl)} alt={profile.fullName} />}
              <AvatarFallback className="bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 text-white text-xl font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold">{profile?.fullName}</h2>
              {profile?.headline && <p className="text-sm text-muted-foreground">{profile.headline}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile?.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
                {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>}
                <span className="inline-flex items-center gap-1">
                  {profile?.cvUrl
                    ? <><FileCheck2 className="h-3 w-3 text-emerald-500" /> CV cargado</>
                    : <><FileText className="h-3 w-3 text-amber-500" /> CV pendiente</>}
                </span>
                {testQ.data?.perfil && (
                  <span className="inline-flex items-center gap-1"><Brain className="h-3 w-3 text-violet-500" /> {testQ.data.perfil}</span>
                )}
              </div>
              {!!profile?.skills?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.skills.slice(0, 8).map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild size="sm" variant="outline"><Link to="/perfil">Editar perfil</Link></Button>
              {!testQ.data && (
                <Button asChild size="sm" className="bg-gradient-primary">
                  <Link to="/test-perfil"><Brain className="mr-2 h-4 w-4" /> Realizar test</Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Postulaciones" value={String(post.length)} icon={FileText} tone="primary" />
          <StatCard label="Procesos activos" value={String(activas.length)} icon={Activity} tone="accent" />
          <StatCard label="Contratado" value={String(post.filter((p) => p.estado === "contratada").length)} icon={CheckCircle2} tone="success" />
        </div>

        <Section title="Empleos recomendados" action={
          <Button asChild size="sm" variant="outline"><Link to="/buscar-empleos">Ver todos <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        }>
          {reco.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto mb-2 h-6 w-6 opacity-50" />
              Completa tu perfil y habilidades para recibir recomendaciones personalizadas.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reco.map((v) => (
                <article key={v.id} className="group rounded-xl border bg-card p-5 transition hover:shadow-elegant hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary">{v.modalidad}</Badge>
                    {typeof v.score === "number" && v.score > 0 && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        {v.score}% match
                      </Badge>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold">{v.titulo}</h3>
                  {v.motivo && (
                    <p className="mt-1 line-clamp-2 text-xs text-violet-600">
                      <Sparkles className="mr-1 inline h-3 w-3" />{v.motivo}
                    </p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{v.descripcion}</p>
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {v.departamento}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {v.ubicacion}</span>
                  </div>
                  <Button asChild size="sm" className="mt-4 w-full bg-gradient-primary">
                    <Link to="/buscar-empleos">Ver vacante</Link>
                  </Button>
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Mis postulaciones recientes" action={
          <Button asChild size="sm" variant="outline"><Link to="/postulaciones">Ver todas</Link></Button>
        }>
          {post.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Aún no tienes postulaciones. <Link to="/buscar-empleos" className="text-primary hover:underline">Explora empleos</Link>
            </div>
          ) : (
            <ul className="divide-y">
              {post.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">{p.departamento} · {new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
