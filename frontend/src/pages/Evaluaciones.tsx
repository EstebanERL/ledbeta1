import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  usePostulaciones, useTests, useTestsBiblioteca, useTestStats,
  estadoColor, ESTADO_LABEL, isFinalizada,
} from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Brain, ClipboardList, CheckCircle2, Loader2, ClipboardCheck, Plus,
  Sparkles, Copy, Power, Trash2, Edit3, Library, BarChart3, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { ExportButtons } from "@/components/ExportButtons";

export default function EvaluacionesPage() {
  return (
    <div>
      <PageHeader
        title="Gestión de Evaluaciones"
        subtitle="Bandeja de candidatos, biblioteca de tests y generación con IA"
        accent="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <Tabs defaultValue="bandeja" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bandeja"><Inbox className="mr-1 h-4 w-4" /> Bandeja</TabsTrigger>
            <TabsTrigger value="biblioteca"><Library className="mr-1 h-4 w-4" /> Biblioteca</TabsTrigger>
            <TabsTrigger value="ia"><Sparkles className="mr-1 h-4 w-4" /> Crear con IA</TabsTrigger>
          </TabsList>
          <TabsContent value="bandeja"><BandejaTab /></TabsContent>
          <TabsContent value="biblioteca"><BibliotecaTab /></TabsContent>
          <TabsContent value="ia"><CrearConIATab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- BANDEJA (proceso de evaluación) ---------------- */

function BandejaTab() {
  const { data, isLoading } = usePostulaciones();
  const qc = useQueryClient();
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [assignFor, setAssignFor] = useState<{ id: string; candidatoNombre: string; vacanteTitulo: string } | null>(null);

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) =>
      (await api.patch(`/postulaciones/${id}`, body)).data,
    onSuccess: () => { toast.success("Notas guardadas"); qc.invalidateQueries({ queryKey: ["postulaciones"] }); },
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
    <div className="space-y-6">
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

      <AsignarTestDialog target={assignFor} onClose={() => setAssignFor(null)} />
    </div>
  );
}

/* ---------------- BIBLIOTECA ---------------- */

function BibliotecaTab() {
  const { data: tests = [], isLoading } = useTestsBiblioteca();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"all" | "tecnico" | "psicologico">("all");
  const [estado, setEstado] = useState<"all" | "activos" | "inactivos">("activos");
  const [editing, setEditing] = useState<any | null>(null);
  const [statsFor, setStatsFor] = useState<any | null>(null);

  const filtered = useMemo(() => {
    return tests.filter((t: any) => {
      if (tipo !== "all" && t.tipo !== tipo) return false;
      if (estado === "activos" && !t.isActive) return false;
      if (estado === "inactivos" && t.isActive) return false;
      if (q && !`${t.titulo} ${t.categoria ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [tests, q, tipo, estado]);

  const toggle = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.patch(`/tests/${id}/active`, { isActive: !isActive })).data,
    onSuccess: () => { toast.success("Estado actualizado"); qc.invalidateQueries({ queryKey: ["tests"] }); },
  });
  const duplicar = useMutation({
    mutationFn: async (id: string) => (await api.post(`/tests/${id}/duplicate`)).data,
    onSuccess: () => { toast.success("Test duplicado"); qc.invalidateQueries({ queryKey: ["tests"] }); },
  });
  const eliminar = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/tests/${id}`)).data,
    onSuccess: () => { toast.success("Test eliminado"); qc.invalidateQueries({ queryKey: ["tests"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo eliminar"),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="tecnico">Técnico</SelectItem>
              <SelectItem value="psicologico">Psicológico</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estado} onValueChange={(v: any) => setEstado(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="inactivos">Inactivos</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setEditing({ titulo: "", tipo: "tecnico", categoria: "", descripcion: "", preguntas: [] })}>
          <Plus className="mr-1 h-4 w-4" /> Crear test
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          No hay tests que coincidan con los filtros.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((t: any) => (
            <div key={t.id} className={`rounded-xl border p-4 ${!t.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{t.titulo}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="capitalize">{t.tipo}</Badge>
                    {t.categoria && <Badge variant="secondary">{t.categoria}</Badge>}
                    {!t.isActive && <Badge variant="outline" className="text-rose-600">Inactivo</Badge>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {(t.preguntas?.length ?? 0)} preguntas
                </div>
              </div>
              {t.descripcion && <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{t.descripcion}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                  <Edit3 className="mr-1 h-3 w-3" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatsFor(t)}>
                  <BarChart3 className="mr-1 h-3 w-3" /> Estadísticas
                </Button>
                <Button size="sm" variant="outline" onClick={() => duplicar.mutate(t.id)}>
                  <Copy className="mr-1 h-3 w-3" /> Duplicar
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: t.id, isActive: t.isActive })}>
                  <Power className="mr-1 h-3 w-3" /> {t.isActive ? "Desactivar" : "Activar"}
                </Button>
                <Button size="sm" variant="outline" className="text-rose-600"
                  onClick={() => { if (confirm(`¿Eliminar "${t.titulo}"?`)) eliminar.mutate(t.id); }}>
                  <Trash2 className="mr-1 h-3 w-3" /> Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TestEditorDialog test={editing} onClose={() => setEditing(null)} />
      <TestStatsDialog test={statsFor} onClose={() => setStatsFor(null)} />
    </div>
  );
}

function TestStatsDialog({ test, onClose }: { test: any | null; onClose: () => void }) {
  const { data, isLoading } = useTestStats(test?.id ?? null);
  return (
    <Dialog open={!!test} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Estadísticas del test</DialogTitle>
          <DialogDescription>{test?.titulo}</DialogDescription>
        </DialogHeader>
        {isLoading || !data ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Veces utilizado" value={String(data.usos)} icon={ClipboardList} tone="primary" />
            <StatCard label="Completados" value={String(data.completados)} icon={CheckCircle2} tone="accent" />
            <StatCard label="Aprobados" value={String(data.aprobados)} icon={CheckCircle2} tone="success" />
            <StatCard label="Reprobados" value={String(data.reprobados)} icon={ClipboardList} tone="warning" />
            <div className="col-span-2 rounded-lg border p-3 text-center">
              <div className="text-xs text-muted-foreground">Promedio</div>
              <div className="text-2xl font-bold">{data.promedio}%</div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- EDITOR DE TEST ---------------- */

function TestEditorDialog({ test, onClose }: { test: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [data, setData] = useState<any>(test);
  // sync when prop changes
  useEffect(() => { setData(test); }, [test]);

  const isNew = test && !test.id;
  const save = useMutation({
    mutationFn: async () => {
      const body = {
        titulo: data.titulo, descripcion: data.descripcion || null,
        tipo: data.tipo, categoria: data.categoria || null,
        preguntas: (data.preguntas ?? []).map((q: any, i: number) => ({
          id: q.id || `q${i + 1}`,
          enunciado: q.enunciado || "",
          tipo: q.tipo || "single",
          puntaje: Number(q.puntaje) || 1,
          opciones: q.opciones?.length ? q.opciones : undefined,
          explicacion: q.explicacion || null,
        })),
      };
      if (isNew) return (await api.post("/tests", body)).data;
      return (await api.patch(`/tests/${test.id}`, body)).data;
    },
    onSuccess: () => {
      toast.success(isNew ? "Test creado" : "Test actualizado");
      qc.invalidateQueries({ queryKey: ["tests"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  if (!test || !data) return null;

  const addQ = () => setData({
    ...data,
    preguntas: [...(data.preguntas ?? []), {
      id: `q${(data.preguntas?.length ?? 0) + 1}`, enunciado: "", tipo: "single", puntaje: 1,
      opciones: [
        { id: "a", texto: "", correcta: false },
        { id: "b", texto: "", correcta: true },
        { id: "c", texto: "", correcta: false },
        { id: "d", texto: "", correcta: false },
      ],
    }],
  });

  const updQ = (i: number, patch: any) => {
    const arr = [...(data.preguntas ?? [])];
    arr[i] = { ...arr[i], ...patch };
    setData({ ...data, preguntas: arr });
  };
  const delQ = (i: number) => setData({ ...data, preguntas: data.preguntas.filter((_: any, idx: number) => idx !== i) });

  return (
    <Dialog open={!!test} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "Crear test" : "Editar test"}</DialogTitle>
          <DialogDescription>Define preguntas, opciones y respuesta correcta.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input value={data.titulo ?? ""} onChange={(e) => setData({ ...data, titulo: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Input value={data.categoria ?? ""} onChange={(e) => setData({ ...data, categoria: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={data.tipo ?? "tecnico"} onValueChange={(v) => setData({ ...data, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="psicologico">Psicológico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label>Descripción</Label>
              <Textarea rows={2} value={data.descripcion ?? ""} onChange={(e) => setData({ ...data, descripcion: e.target.value })} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Preguntas ({data.preguntas?.length ?? 0})</h4>
              <Button size="sm" variant="outline" onClick={addQ}><Plus className="mr-1 h-3 w-3" /> Añadir</Button>
            </div>
            {(data.preguntas ?? []).map((q: any, i: number) => (
              <div key={i} className="space-y-2 rounded-lg border p-3">
                <div className="flex gap-2">
                  <Input className="flex-1" placeholder={`Pregunta ${i + 1}`}
                    value={q.enunciado ?? ""} onChange={(e) => updQ(i, { enunciado: e.target.value })} />
                  <Select value={q.tipo ?? "single"} onValueChange={(v) => updQ(i, { tipo: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Única</SelectItem>
                      <SelectItem value="multi">Múltiple</SelectItem>
                      <SelectItem value="texto">Texto</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input className="w-20" type="number" min="0" step="0.5" value={q.puntaje ?? 1}
                    onChange={(e) => updQ(i, { puntaje: Number(e.target.value) })} />
                  <Button size="icon" variant="ghost" onClick={() => delQ(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                {q.tipo !== "texto" && (
                  <div className="space-y-1 pl-3">
                    {(q.opciones ?? []).map((o: any, j: number) => (
                      <div key={j} className="flex items-center gap-2">
                        <input type={q.tipo === "multi" ? "checkbox" : "radio"} name={`q${i}`}
                          checked={!!o.correcta}
                          onChange={(e) => {
                            const opciones = [...q.opciones];
                            if (q.tipo === "single") {
                              opciones.forEach((x, k) => { x.correcta = k === j && e.target.checked; });
                            } else {
                              opciones[j] = { ...o, correcta: e.target.checked };
                            }
                            updQ(i, { opciones });
                          }} />
                        <Input className="flex-1" placeholder={`Opción ${o.id}`} value={o.texto ?? ""}
                          onChange={(e) => {
                            const opciones = [...q.opciones];
                            opciones[j] = { ...o, texto: e.target.value };
                            updQ(i, { opciones });
                          }} />
                        <Button size="icon" variant="ghost" onClick={() => updQ(i, { opciones: q.opciones.filter((_: any, k: number) => k !== j) })}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" className="h-7"
                      onClick={() => updQ(i, { opciones: [...(q.opciones ?? []), { id: String.fromCharCode(97 + (q.opciones?.length ?? 0)), texto: "", correcta: false }] })}>
                      <Plus className="mr-1 h-3 w-3" /> Añadir opción
                    </Button>
                  </div>
                )}
                <Input placeholder="Explicación (opcional)" value={q.explicacion ?? ""}
                  onChange={(e) => updQ(i, { explicacion: e.target.value })} />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !data.titulo || !(data.preguntas?.length)}>
            {save.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- IA ---------------- */

function CrearConIATab() {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<"tecnico" | "psicologico">("tecnico");
  const [categoria, setCategoria] = useState("");
  const [nivel, setNivel] = useState("intermedio");
  const [cantidad, setCantidad] = useState(10);
  const [instrucciones, setInstrucciones] = useState("");
  const [preview, setPreview] = useState<any | null>(null);

  const generar = useMutation({
    mutationFn: async () => (await api.post("/tests/generate-ai", { tipo, categoria, nivel, cantidad, instrucciones })).data,
    onSuccess: (d) => { setPreview(d); toast.success("Test generado — revisa y guárdalo"); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error al generar"),
  });

  const guardar = useMutation({
    mutationFn: async () => (await api.post("/tests", preview)).data,
    onSuccess: () => {
      toast.success("Test guardado en la biblioteca");
      qc.invalidateQueries({ queryKey: ["tests"] });
      setPreview(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error al guardar"),
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold">Generación con IA</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Indica los parámetros y deja que la IA construya el test. Podrás editarlo antes de guardarlo.
        </p>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Categoría / tecnología</Label>
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ej: Node.js, ventas..." />
          </div>
          <div className="space-y-2">
            <Label>Nivel</Label>
            <Select value={nivel} onValueChange={setNivel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basico">Básico</SelectItem>
                <SelectItem value="intermedio">Intermedio</SelectItem>
                <SelectItem value="avanzado">Avanzado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Cantidad de preguntas ({cantidad})</Label>
          <Input type="range" min="3" max="30" value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Instrucciones adicionales</Label>
          <Textarea rows={3} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)}
            placeholder="Ej: enfócate en Express, JWT y APIs REST." />
        </div>
        <Button onClick={() => generar.mutate()} disabled={generar.isPending} className="w-full">
          {generar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          Generar
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border p-5">
        <h3 className="text-base font-semibold">Vista previa</h3>
        {!preview ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aún no hay test generado. Completa el formulario y pulsa "Generar".
          </p>
        ) : (
          <>
            <Input value={preview.titulo} onChange={(e) => setPreview({ ...preview, titulo: e.target.value })} />
            <Textarea rows={2} value={preview.descripcion ?? ""} onChange={(e) => setPreview({ ...preview, descripcion: e.target.value })} />
            <div className="max-h-96 space-y-2 overflow-y-auto rounded-lg border p-2">
              {preview.preguntas.map((q: any, i: number) => (
                <div key={q.id} className="rounded-md bg-muted/30 p-2 text-xs">
                  <div className="font-medium">{i + 1}. {q.enunciado}</div>
                  <ul className="mt-1 space-y-0.5">
                    {q.opciones?.map((o: any) => (
                      <li key={o.id} className={o.correcta ? "text-emerald-700" : "text-muted-foreground"}>
                        {o.correcta ? "✓ " : "· "}{o.texto}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPreview(null)}>Descartar</Button>
              <Button className="flex-1" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
                {guardar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                Guardar en biblioteca
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- ASIGNAR TEST (reutilizado de Bandeja) ---------------- */

function AsignarTestDialog({
  target, onClose,
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
      toast.success("Test asignado");
      qc.invalidateQueries({ queryKey: ["postulaciones"] });
      qc.invalidateQueries({ queryKey: ["mensajes", target!.id] });
      qc.invalidateQueries({ queryKey: ["eventos", target!.id] });
      handleClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo asignar"),
  });

  const handleClose = () => { setTestId(""); setObservaciones(""); setFiltroTipo("all"); onClose(); };

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
            <Label>Test a asignar</Label>
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No hay tests activos. Crea uno desde la pestaña "Biblioteca" o "Crear con IA".
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

          <div className="space-y-2">
            <Label>Instrucciones (opcional)</Label>
            <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Indica al candidato cómo abordar el test..." rows={3} />
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
