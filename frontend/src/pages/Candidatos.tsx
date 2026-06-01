import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  usePostulaciones, estadoColor, ESTADOS_POSTULACION, ESTADO_LABEL,
  useUserProfile, useUserProfileTest, useEntrevistasByPostulacion,
  fileUrl, isFinalizada, Postulacion,
} from "@/lib/queries";
import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Users, Loader2, Download, Eye, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText,
  Briefcase, GraduationCap, CalendarPlus, CalendarClock, Brain, BarChart3, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { ProcesoDetalle } from "@/components/proceso/ProcesoDetalle";

export default function CandidatosPage() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("all");
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);
  const [openProcesoId, setOpenProcesoId] = useState<string | null>(null);
  const [scheduleFor, setScheduleFor] = useState<{ id: string; candidatoNombre: string; vacanteTitulo: string } | null>(null);

  const updateMut = useMutation({
    mutationFn: async (v: { id: string; estado?: string; notas?: string }) =>
      (await api.patch(`/postulaciones/${v.id}`, v)).data,
    onSuccess: () => { toast.success("Actualizado"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  const activas = (data ?? []).filter((p) => !isFinalizada(p.estado));
  const items = activas.filter((p) =>
    (estado === "all" || p.estado === estado) &&
    (!q || p.candidatoNombre.toLowerCase().includes(q.toLowerCase()) ||
      p.vacanteTitulo.toLowerCase().includes(q.toLowerCase())),
  );

  const stats = {
    total: activas.length,
    revision: activas.filter((p) => p.estado === "en_revision").length,
    entrevista: activas.filter((p) => p.estado === "entrevista_pendiente" || p.estado === "entrevista_realizada" || p.estado === "entrevista").length,
    aprobados: activas.filter((p) => p.estado === "aprobado").length,
  };

  const estadosActivos = ESTADOS_POSTULACION.filter((e) => !isFinalizada(e));

  return (
    <div>
      <PageHeader
        title="Pipeline de candidatos"
        subtitle="Gestiona estados, programa entrevistas y revisa perfiles"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Activos" value={String(stats.total)} icon={Users} tone="primary" />
          <StatCard label="En revisión" value={String(stats.revision)} icon={Users} tone="warning" />
          <StatCard label="En entrevista" value={String(stats.entrevista)} icon={CalendarClock} tone="accent" />
          <StatCard label="Aprobados" value={String(stats.aprobados)} icon={Users} tone="success" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar candidato o vacante..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados activos</SelectItem>
              {estadosActivos.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Section title={`${items.length} candidatos en proceso`}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No hay postulaciones activas que coincidan con los filtros.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p: Postulacion) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar className="h-10 w-10">
                    {p.candidatoAvatar && <AvatarImage src={fileUrl(p.candidatoAvatar)} />}
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {p.candidatoNombre.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.candidatoNombre}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.candidatoEmail} · {p.vacanteTitulo}</div>
                  </div>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                  <Select value={p.estado} onValueChange={(v) => updateMut.mutate({ id: p.id, estado: v })}>
                    <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}</SelectContent>
                  </Select>
                  {p.cvUrl && (
                    <a href={fileUrl(p.cvUrl)} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Download className="h-3 w-3" /> CV
                    </a>
                  )}
                  <Button size="sm" variant="outline"
                    onClick={() => setScheduleFor({ id: p.id, candidatoNombre: p.candidatoNombre, vacanteTitulo: p.vacanteTitulo })}>
                    <CalendarPlus className="mr-1 h-3.5 w-3.5" /> Entrevista
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenProcesoId(p.id)}>
                    <MessageSquare className="mr-1 h-3 w-3" /> Proceso
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setOpenProfileId(p.candidatoId)}>
                    <Eye className="mr-1 h-3 w-3" /> Perfil
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <CandidateProfileSheet id={openProfileId} onClose={() => setOpenProfileId(null)} />
      <ScheduleInterviewDialog target={scheduleFor} onClose={() => setScheduleFor(null)} />
      <Sheet open={!!openProcesoId} onOpenChange={(o) => !o && setOpenProcesoId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {openProcesoId && (() => {
            const p = (data ?? []).find((x) => x.id === openProcesoId);
            return <ProcesoDetalle id={openProcesoId} titulo={p?.candidatoNombre} subtitle={p?.vacanteTitulo} />;
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ScheduleInterviewDialog({
  target,
  onClose,
}: {
  target: { id: string; candidatoNombre: string; vacanteTitulo: string } | null;
  onClose: () => void;
}) {
  const open = !!target;
  const qc = useQueryClient();
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [modalidad, setModalidad] = useState<"virtual" | "presencial" | "telefonica">("virtual");
  const [link, setLink] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [notas, setNotas] = useState("");

  const handleClose = () => {
    setFecha(""); setHora(""); setModalidad("virtual"); setLink(""); setUbicacion(""); setNotas("");
    onClose();
  };

  const crear = useMutation({
    mutationFn: async () => {
      const programadaPara = new Date(`${fecha}T${hora}:00`).toISOString();
      return (await api.post("/entrevistas", {
        postulacionId: target!.id,
        programadaPara,
        modalidad,
        link: modalidad === "virtual" ? link || undefined : undefined,
        ubicacion: modalidad !== "virtual" ? ubicacion || undefined : undefined,
        notas: notas || undefined,
      })).data;
    },
    onSuccess: () => {
      toast.success("Entrevista programada");
      qc.invalidateQueries({ queryKey: ["postulaciones"] });
      qc.invalidateQueries({ queryKey: ["entrevistas", target!.id] });
      qc.invalidateQueries({ queryKey: ["eventos", target!.id] });
      qc.invalidateQueries({ queryKey: ["mensajes", target!.id] });
      handleClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo programar"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Programar entrevista</DialogTitle>
          <DialogDescription>
            {target ? <>{target.candidatoNombre} · {target.vacanteTitulo}</> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Modalidad</Label>
            <Select value={modalidad} onValueChange={(v: any) => setModalidad(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="virtual">Virtual</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="telefonica">Telefónica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {modalidad === "virtual" ? (
            <div className="space-y-2">
              <Label>Link de la reunión</Label>
              <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet..." />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{modalidad === "presencial" ? "Ubicación" : "Número de contacto"}</Label>
              <Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={3}
              placeholder="Temas a tratar, documentación a llevar, etc." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={() => crear.mutate()} disabled={!fecha || !hora || crear.isPending}>
            {crear.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-1 h-4 w-4" />}
            Programar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CandidateProfileSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useUserProfile(id);
  const { data: profileTest } = useUserProfileTest(id);
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Perfil del candidato</SheetTitle>
          <SheetDescription>Información profesional y resultados de evaluación</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : !data ? null : (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {data.avatarUrl && <AvatarImage src={fileUrl(data.avatarUrl)} />}
                <AvatarFallback className="bg-gradient-primary text-white">
                  {data.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold">{data.fullName}</h3>
                {data.headline && <p className="text-sm text-muted-foreground">{data.headline}</p>}
              </div>
            </div>

            <div className="grid gap-2 text-sm">
              <Row icon={Mail} label={data.email} />
              {data.phone && <Row icon={Phone} label={data.phone} />}
              {data.location && <Row icon={MapPin} label={data.location} />}
              {data.linkedinUrl && <Row icon={Linkedin} label={data.linkedinUrl} href={data.linkedinUrl} />}
              {data.githubUrl && <Row icon={Github} label={data.githubUrl} href={data.githubUrl} />}
              {data.websiteUrl && <Row icon={Globe} label={data.websiteUrl} href={data.websiteUrl} />}
              {data.cvUrl && (
                <a href={fileUrl(data.cvUrl)} target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-2 rounded-lg border bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                  <FileText className="h-4 w-4" /> Descargar hoja de vida
                </a>
              )}
            </div>

            <ProfileTestCard test={profileTest} />

            {data.bio && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Sobre mí</h4>
                <p className="whitespace-pre-line text-sm text-muted-foreground">{data.bio}</p>
              </div>
            )}

            {!!data.skills?.length && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Habilidades</h4>
                <div className="flex flex-wrap gap-1.5">
                  {data.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                </div>
              </div>
            )}

            {!!data.experience?.length && (
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold"><Briefcase className="h-4 w-4" /> Experiencia</h4>
                <ul className="space-y-3">
                  {data.experience.map((ex, i) => (
                    <li key={i} className="rounded-lg border p-3">
                      <div className="text-sm font-medium">{ex.role} <span className="text-muted-foreground">· {ex.company}</span></div>
                      <div className="text-xs text-muted-foreground">{ex.from} — {ex.to || "Actual"}</div>
                      {ex.description && <p className="mt-1 text-sm text-muted-foreground">{ex.description}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!data.education?.length && (
              <div>
                <h4 className="mb-2 flex items-center gap-1 text-sm font-semibold"><GraduationCap className="h-4 w-4" /> Formación</h4>
                <ul className="space-y-3">
                  {data.education.map((ed, i) => (
                    <li key={i} className="rounded-lg border p-3">
                      <div className="text-sm font-medium">{ed.degree}</div>
                      <div className="text-xs text-muted-foreground">{ed.institution} · {ed.from} — {ed.to || "Actual"}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ProfileTestCard({ test }: { test: any }) {
  if (!test) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Brain className="h-4 w-4" /> Test de perfil profesional
        </div>
        <p className="mt-1 text-xs">El candidato aún no ha completado el test de perfil.</p>
      </div>
    );
  }
  const scores: Record<string, number> = test.scores ?? {};
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ordered.slice(0, 3).map(([k]) => k);
  return (
    <div className="rounded-xl border bg-gradient-to-br from-violet-500/5 to-primary/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="h-4 w-4 text-violet-600" /> Test de perfil profesional
        </div>
        {test.perfil && <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-700">{test.perfil}</Badge>}
      </div>
      {test.resumen && <p className="mb-3 text-xs text-muted-foreground">{test.resumen}</p>}
      <div className="space-y-2">
        {ordered.map(([dim, val]) => (
          <div key={dim}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium capitalize">{dim}</span>
              <span className="text-muted-foreground">{val}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-primary"
                style={{ width: `${Math.max(0, Math.min(100, val))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {top.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {top.map((t) => (
            <Badge key={t} variant="secondary" className="gap-1 capitalize">
              <BarChart3 className="h-3 w-3" /> Fortaleza: {t}
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
        Completado: {new Date(test.completedAt).toLocaleDateString()}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, href }: { icon: any; label: string; href?: string }) {
  const inner = <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>;
  return href ? <a href={href} target="_blank" rel="noreferrer" className="hover:text-primary">{inner}</a> : <div>{inner}</div>;
}
