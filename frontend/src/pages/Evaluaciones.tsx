import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePostulaciones, estadoColor, ESTADOS_POSTULACION } from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Brain, ClipboardList, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EvaluacionesPage() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [notas, setNotas] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) =>
      (await api.patch(`/postulaciones/${id}`, body)).data,
    onSuccess: () => { toast.success("Evaluación guardada"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
  });

  const items = (data ?? []).filter((p) => ["en_revision", "evaluacion", "entrevista"].includes(p.estado));
  const stats = {
    pendientes: items.length,
    evaluacion: (data ?? []).filter((p) => p.estado === "evaluacion").length,
    completadas: (data ?? []).filter((p) => ["rechazada", "contratada"].includes(p.estado)).length,
  };

  return (
    <div>
      <PageHeader
        title="Evaluaciones"
        subtitle="Aplica, califica y clasifica candidatos"
        accent="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="En cola" value={String(stats.pendientes)} icon={ClipboardList} tone="warning" />
          <StatCard label="En evaluación" value={String(stats.evaluacion)} icon={Brain} tone="primary" />
          <StatCard label="Completadas" value={String(stats.completadas)} icon={CheckCircle2} tone="success" />
        </div>

        <Section title="Candidatos a evaluar">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sin evaluaciones pendientes</div>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">{p.candidatoNombre}</div>
                      <div className="text-xs text-muted-foreground">{p.vacanteTitulo} · {p.departamento}</div>
                    </div>
                    <Badge variant="outline" className={estadoColor(p.estado)}>{p.estado}</Badge>
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Notas y concepto del evaluador..."
                    defaultValue={p.notas ?? ""}
                    onChange={(e) => setNotas({ ...notas, [p.id]: e.target.value })}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Select onValueChange={(v) => update.mutate({ id: p.id, body: { estado: v, notas: notas[p.id] } })}>
                      <SelectTrigger className="h-9 w-48"><SelectValue placeholder="Clasificar..." /></SelectTrigger>
                      <SelectContent>{ESTADOS_POSTULACION.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button size="sm" variant="outline"
                      onClick={() => update.mutate({ id: p.id, body: { notas: notas[p.id] ?? p.notas } })}>
                      Guardar notas
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
