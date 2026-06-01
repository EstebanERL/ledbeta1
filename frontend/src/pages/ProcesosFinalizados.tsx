import { useState } from "react";
import {
  usePostulaciones, useVacantesAdmin, estadoColor, ESTADO_LABEL,
  isFinalizada, isVacanteFinalizada, fileUrl,
} from "@/lib/queries";
import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Archive, Briefcase, CheckCircle2, XCircle, Loader2, Eye, Download, Users } from "lucide-react";
import { ProcesoDetalle } from "@/components/proceso/ProcesoDetalle";
import { CandidateProfileSheet } from "@/pages/Candidatos";

export default function ProcesosFinalizadosPage() {
  return (
    <div>
      <PageHeader
        title="Procesos finalizados"
        subtitle="Histórico de candidatos y vacantes cerradas"
        accent="from-slate-500 via-zinc-500 to-stone-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <Tabs defaultValue="candidatos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="candidatos" className="gap-1.5">
              <Users className="h-4 w-4" /> Candidatos
            </TabsTrigger>
            <TabsTrigger value="vacantes" className="gap-1.5">
              <Briefcase className="h-4 w-4" /> Vacantes
            </TabsTrigger>
          </TabsList>
          <TabsContent value="candidatos"><CandidatosFinalizados /></TabsContent>
          <TabsContent value="vacantes"><VacantesFinalizadas /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CandidatosFinalizados() {
  const { data, isLoading } = usePostulaciones();
  const [q, setQ] = useState("");
  const [resultado, setResultado] = useState<"all" | "contratada" | "rechazada">("all");
  const [openProceso, setOpenProceso] = useState<string | null>(null);
  const [openPerfil, setOpenPerfil] = useState<string | null>(null);

  const finalizadas = (data ?? []).filter((p) => isFinalizada(p.estado));
  const items = finalizadas.filter((p) =>
    (resultado === "all" || p.estado === resultado) &&
    (!q || p.candidatoNombre.toLowerCase().includes(q.toLowerCase()) ||
      p.vacanteTitulo.toLowerCase().includes(q.toLowerCase())),
  );

  const stats = {
    total: finalizadas.length,
    contratados: finalizadas.filter((p) => p.estado === "contratada").length,
    rechazados: finalizadas.filter((p) => p.estado === "rechazada").length,
  };

  const open = (data ?? []).find((p) => p.id === openProceso);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total finalizados" value={String(stats.total)} icon={Archive} tone="primary" />
        <StatCard label="Contratados" value={String(stats.contratados)} icon={CheckCircle2} tone="success" />
        <StatCard label="Rechazados" value={String(stats.rechazados)} icon={XCircle} tone="warning" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={resultado} onValueChange={(v: any) => setResultado(v)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los resultados</SelectItem>
            <SelectItem value="contratada">Contratados</SelectItem>
            <SelectItem value="rechazada">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Section title={`${items.length} procesos`}>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            <Archive className="mx-auto mb-2 h-8 w-8 opacity-40" />
            No hay procesos finalizados con esos filtros.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar className="h-10 w-10">
                  {p.candidatoAvatar && <AvatarImage src={fileUrl(p.candidatoAvatar)} />}
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {p.candidatoNombre.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{p.candidatoNombre}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {p.vacanteTitulo} · Finalizado {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className={estadoColor(p.estado)}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                {p.cvUrl && (
                  <a href={fileUrl(p.cvUrl)} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Download className="h-3 w-3" /> CV
                  </a>
                )}
                <Button size="sm" variant="outline" onClick={() => setOpenProceso(p.id)}>Proceso</Button>
                <Button size="sm" variant="outline" onClick={() => setOpenPerfil(p.candidatoId)}>
                  <Eye className="mr-1 h-3 w-3" /> Perfil
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Sheet open={!!openProceso} onOpenChange={(o) => !o && setOpenProceso(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {openProceso && (
            <ProcesoDetalle id={openProceso} titulo={open?.candidatoNombre} subtitle={`${open?.vacanteTitulo} · ${ESTADO_LABEL[open?.estado ?? ""]}`} />
          )}
        </SheetContent>
      </Sheet>
      <CandidateProfileSheet id={openPerfil} onClose={() => setOpenPerfil(null)} />
    </div>
  );
}

function VacantesFinalizadas() {
  const { data: vacantes, isLoading } = useVacantesAdmin();
  const { data: posts } = usePostulaciones();
  const finalizadas = (vacantes ?? []).filter((v) => isVacanteFinalizada(v.estado));
  const contratadosPorVacante = (vid: string) => (posts ?? []).filter((p) => p.vacanteId === vid && p.estado === "contratada").length;
  const totalPostulantes = (vid: string) => (posts ?? []).filter((p) => p.vacanteId === vid).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Vacantes finalizadas" value={String(finalizadas.length)} icon={Archive} tone="primary" />
        <StatCard label="Contrataciones totales"
          value={String(finalizadas.reduce((acc, v) => acc + contratadosPorVacante(v.id), 0))}
          icon={CheckCircle2} tone="success" />
      </div>

      <Section title="Vacantes cerradas">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : finalizadas.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            <Archive className="mx-auto mb-2 h-8 w-8 opacity-40" />
            Aún no hay vacantes finalizadas.
          </div>
        ) : (
          <ul className="divide-y">
            {finalizadas.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{v.titulo}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {v.departamento} · {v.ubicacion} · Creada {new Date(v.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-700">{v.estado}</Badge>
                <Badge variant="secondary">{contratadosPorVacante(v.id)}/{v.vacantesDisponibles} contratados</Badge>
                <Badge variant="outline">{totalPostulantes(v.id)} postulantes</Badge>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
