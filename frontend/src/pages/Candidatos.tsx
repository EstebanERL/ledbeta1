import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  usePostulaciones, estadoColor, ESTADOS_POSTULACION, ESTADO_LABEL,
  useUserProfile, fileUrl, Postulacion,
} from "@/lib/queries";
import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Users, Loader2, Download, Eye, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText, Briefcase, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";

export default function CandidatosPage() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const updateMut = useMutation({
    mutationFn: async (v: { id: string; estado?: string; notas?: string }) =>
      (await api.patch(`/postulaciones/${v.id}`, v)).data,
    onSuccess: () => { toast.success("Actualizado"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  const items = (data ?? []).filter((p) =>
    (estado === "all" || p.estado === estado) &&
    (!q || p.candidatoNombre.toLowerCase().includes(q.toLowerCase()) ||
      p.vacanteTitulo.toLowerCase().includes(q.toLowerCase())),
  );

  const stats = {
    total: data?.length ?? 0,
    revision: data?.filter((p) => p.estado === "en_revision").length ?? 0,
    entrevista: data?.filter((p) => p.estado === "entrevista").length ?? 0,
    contratados: data?.filter((p) => p.estado === "contratada").length ?? 0,
  };

  return (
    <div>
      <PageHeader
        title="Pipeline de candidatos"
        subtitle="Gestiona estados, revisa perfiles y avanza el proceso"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total" value={String(stats.total)} icon={Users} tone="primary" />
          <StatCard label="En revisión" value={String(stats.revision)} icon={Users} tone="warning" />
          <StatCard label="En entrevista" value={String(stats.entrevista)} icon={Users} tone="accent" />
          <StatCard label="Contratados" value={String(stats.contratados)} icon={Users} tone="success" />
        </div>

        <div className="flex flex-wrap gap-3">
          <Input placeholder="Buscar candidato o vacante..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Section title={`${items.length} resultados`}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
              No hay postulaciones que coincidan con los filtros.
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p: Postulacion) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-gradient-primary text-white">
                    {p.candidatoNombre.slice(0, 2).toUpperCase()}
                  </AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.candidatoNombre}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.candidatoEmail} · {p.vacanteTitulo}</div>
                  </div>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                  <Select value={p.estado} onValueChange={(v) => updateMut.mutate({ id: p.id, estado: v })}>
                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>)}</SelectContent>
                  </Select>
                  {p.cvUrl && (
                    <a href={fileUrl(p.cvUrl)} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Download className="h-3 w-3" /> CV
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setOpenId(p.candidatoId)}>
                    <Eye className="mr-1 h-3 w-3" /> Perfil
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <CandidateProfileSheet
        id={openId}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

function CandidateProfileSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data, isLoading } = useUserProfile(id);
  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Perfil del candidato</SheetTitle>
          <SheetDescription>Información profesional completa</SheetDescription>
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

function Row({ icon: Icon, label, href }: { icon: any; label: string; href?: string }) {
  const inner = <span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>;
  return href ? <a href={href} target="_blank" rel="noreferrer" className="hover:text-primary">{inner}</a> : <div>{inner}</div>;
}
