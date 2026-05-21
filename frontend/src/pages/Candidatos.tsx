import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePostulaciones, estadoColor, ESTADOS_POSTULACION, Postulacion } from "@/lib/queries";
import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export default function CandidatosPage() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("all");

  const updateMut = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) =>
      (await api.patch(`/postulaciones/${id}`, { estado })).data,
    onSuccess: () => { toast.success("Actualizado"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
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
        title="Candidatos"
        subtitle="Pipeline completo de postulaciones"
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
              {ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Section title={`${items.length} resultados`}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sin postulaciones</div>
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
                  <Badge variant="outline" className={estadoColor(p.estado)}>{p.estado}</Badge>
                  <Select value={p.estado} onValueChange={(v) => updateMut.mutate({ id: p.id, estado: v })}>
                    <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                  {p.cvUrl && (
                    <a href={`${import.meta.env.VITE_API_URL?.replace(/\/api$/, "") || "http://localhost:4000"}${p.cvUrl}`}
                       target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <Download className="h-3 w-3" /> CV
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
