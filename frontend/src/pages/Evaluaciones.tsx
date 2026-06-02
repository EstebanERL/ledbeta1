import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  usePostulaciones, useTests, estadoColor, ESTADO_LABEL, isFinalizada,
} from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Brain, ClipboardList, CheckCircle2, Loader2, ClipboardCheck, Plus } from "lucide-react";
import { toast } from "sonner";

export default function EvaluacionesPage() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [assignFor, setAssignFor] = useState<{ id: string; candidatoNombre: string; vacanteTitulo: string } | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) =>
      (await api.patch(`/postulaciones/${id}`, body)).data,
    onSuccess: () => { toast.success("Evaluación guardada"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
  });

  const activas = (data ?? []).filter((p) => !isFinalizada(p.estado));
  const items = activas.filter((p) => ["en_revision", "evaluacion", "entrevista", "test_asignado"].includes(p.estado));
  const stats = {
    pendientes: items.length,
    evaluacion: activas.filter((p) => p.estado === "evaluacion").length,
    asignados: activas.filter((p) => p.estado === "test_asignado").length,
    completadas: (data ?? []).filter((p) => isFinalizada(p.estado)).length,
  };

  return (
    <div>
      <PageHeader
        title="Evaluaciones"
        subtitle="Aplica tests, califica y clasifica candidatos"
        accent="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="En cola" value={String(stats.pendientes)} icon={ClipboardList} tone="warning" />
          <StatCard label="En evaluación" value={String(stats.evaluacion)} icon={Brain} tone="primary" />
          <StatCard label="Tests asignados" value={String(stats.asignados)} icon={ClipboardCheck} tone="accent" />
          <StatCard label="Finalizadas" value={String(stats.completadas)} icon={CheckCircle2} tone="success" />
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
                    <Badge variant="outline" className={estadoColor(p.estado)}>
                      {ESTADO_LABEL[p.estado] ?? p.estado}
                    </Badge>
                  </div>
                  <Textarea
                    className="mt-3"
                    placeholder="Notas y concepto del evaluador..."
                    defaultValue={p.notas ?? ""}
                    onChange={(e) => setNotas({ ...notas, [p.id]: e.target.value })}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline"
                      onClick={() => update.mutate({ id: p.id, body: { notas: notas[p.id] ?? p.notas } })}>
                      Guardar notas
                    </Button>
                    <Button size="sm"
                      onClick={() => setAssignFor({ id: p.id, candidatoNombre: p.candidatoNombre, vacanteTitulo: p.vacanteTitulo })}>
                      <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Asignar test
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <AsignarTestDialog
        target={assignFor}
        onClose={() => setAssignFor(null)}
      />
    </div>
  );
}

function AsignarTestDialog({
  target,
  onClose,
}: {
  target: { id: string; candidatoNombre: string; vacanteTitulo: string } | null;
  onClose: () => void;
}) {
  const open = !!target;
  const { data: tests, isLoading } = useTests(open);
  const qc = useQueryClient();
  const [testId, setTestId] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"all" | "tecnico" | "psicologico">("all");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const list = tests ?? [];
    return filtroTipo === "all" ? list : list.filter((t: any) => t.tipo === filtroTipo);
  }, [tests, filtroTipo]);

  const asignar = useMutation({
    mutationFn: async () =>
      (await api.post("/test-asignaciones", {
        testId, postulacionId: target!.id, observaciones: observaciones || undefined,
      })).data,
    onSuccess: () => {
      toast.success("Test asignado al candidato");
      qc.invalidateQueries({ queryKey: ["postulaciones"] });
      qc.invalidateQueries({ queryKey: ["mensajes", target!.id] });
      qc.invalidateQueries({ queryKey: ["eventos", target!.id] });
      handleClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo asignar"),
  });

  const handleClose = () => {
    setTestId(""); setObservaciones(""); setFiltroTipo("all"); setCreating(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Asignar test al candidato</DialogTitle>
          <DialogDescription>
            {target ? <>{target.candidatoNombre} · {target.vacanteTitulo}</> : null}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select value={filtroTipo} onValueChange={(v: any) => { setFiltroTipo(v); setTestId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="psicologico">Psicológico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test a asignar</Label>
              <Button size="sm" variant="ghost" onClick={() => setCreating((c) => !c)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> {creating ? "Cancelar" : "Crear test"}
              </Button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No hay tests disponibles. Crea uno para empezar.
              </div>
            ) : (
              <Select value={testId} onValueChange={setTestId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un test..." /></SelectTrigger>
                <SelectContent>
                  {filtered.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.titulo} · <span className="text-xs uppercase text-muted-foreground">{t.tipo}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {creating && <CreateTestInline onCreated={() => setCreating(false)} />}

          <div className="space-y-2">
            <Label>Instrucciones / comentarios (opcional)</Label>
            <Textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Indica al candidato cómo abordar el test, tiempo estimado, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button onClick={() => asignar.mutate()} disabled={!testId || asignar.isPending}>
            {asignar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <ClipboardCheck className="mr-1 h-4 w-4" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTestInline({ onCreated }: { onCreated: () => void }) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"tecnico" | "psicologico">("tecnico");
  const [descripcion, setDescripcion] = useState("");

  const create = useMutation({
    mutationFn: async () =>
      (await api.post("/tests", {
        titulo, descripcion: descripcion || undefined, tipo,
        preguntas: [{
          id: "q1", enunciado: "Describe brevemente tu experiencia relevante.",
          tipo: "texto", puntaje: 1,
        }],
      })).data,
    onSuccess: () => {
      toast.success("Test creado");
      qc.invalidateQueries({ queryKey: ["tests"] });
      onCreated();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo crear"),
  });

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <div className="space-y-2">
        <Label>Título del test</Label>
        <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Test técnico Frontend" />
      </div>
      <div className="space-y-2">
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tecnico">Técnico</SelectItem>
            <SelectItem value="psicologico">Psicológico</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Descripción (opcional)</Label>
        <Textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2} />
      </div>
      <p className="text-xs text-muted-foreground">
        Se creará con una pregunta base de texto libre. Podrás ampliarlo desde el editor de tests.
      </p>
      <Button size="sm" onClick={() => create.mutate()} disabled={titulo.length < 2 || create.isPending}>
        {create.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
        Crear test
      </Button>
    </div>
  );
}
