import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, StatCard } from "@/components/dashboards/shared";
import { ExportButtons } from "@/components/ExportButtons";
import { Briefcase, Plus, Edit, Trash2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

type Vacante = {
  id: string; titulo: string; descripcion: string; departamento: string; ubicacion: string;
  modalidad: string; tipoContrato: string; estado: string; publicada: boolean;
  salarioMin?: string | null; salarioMax?: string | null; moneda: string;
  vacantesDisponibles: number;
};

const empty: Partial<Vacante> = {
  titulo: "", descripcion: "", departamento: "", ubicacion: "",
  modalidad: "presencial", tipoContrato: "indefinido", estado: "borrador",
  publicada: false, moneda: "COP", vacantesDisponibles: 1,
};

export default function VacantesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Vacante> | null>(null);
  const [filterEstado, setFilterEstado] = useState("");

  const canManage = user?.role === "rrhh" || user?.role === "super_admin";

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/vacantes");
      setItems(data.items);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error cargando vacantes");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (canManage) load(); else setLoading(false); }, [canManage]);

  const onSave = async () => {
    if (!editing) return;
    try {
      const payload = {
        ...editing,
        salarioMin: editing.salarioMin ? Number(editing.salarioMin) : null,
        salarioMax: editing.salarioMax ? Number(editing.salarioMax) : null,
        vacantesDisponibles: Number(editing.vacantesDisponibles ?? 1),
      };
      if (editing.id) await api.patch(`/vacantes/${editing.id}`, payload);
      else await api.post("/vacantes", payload);
      toast.success("Vacante guardada");
      setOpen(false); setEditing(null); load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al guardar");
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("¿Eliminar vacante?")) return;
    await api.delete(`/vacantes/${id}`);
    toast.success("Eliminada"); load();
  };

  const togglePublicada = async (v: Vacante) => {
    await api.patch(`/vacantes/${v.id}`, { publicada: !v.publicada });
    load();
  };

  if (!canManage) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        Sin permisos para gestionar vacantes.
      </div>
    );
  }

  const activas = items.filter((i) => i.estado !== "cerrada");
  const filtered = filterEstado ? activas.filter((i) => i.estado === filterEstado) : activas;
  const stats = {
    total: items.length,
    abiertas: items.filter((i) => i.estado === "abierta").length,
    publicadas: items.filter((i) => i.publicada).length,
    borradores: items.filter((i) => i.estado === "borrador").length,
  };

  return (
    <div>
      <PageHeader title="Gestión de vacantes" subtitle="Crea, publica y administra ofertas laborales" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total" value={String(stats.total)} icon={Briefcase} tone="primary" />
          <StatCard label="Abiertas" value={String(stats.abiertas)} icon={Briefcase} tone="success" />
          <StatCard label="Publicadas" value={String(stats.publicadas)} icon={Briefcase} tone="accent" />
          <StatCard label="Borradores" value={String(stats.borradores)} icon={Briefcase} tone="warning" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={filterEstado} onValueChange={(v) => setFilterEstado(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <ExportButtons
              filename={`Vacantes_${Date.now()}`}
              title="Listado de vacantes"
              subtitle={`${filtered.length} registros`}
              head={["Título", "Departamento", "Modalidad", "Estado", "Publicada", "Cupos"]}
              rows={filtered.map((v) => [v.titulo, v.departamento, v.modalidad, v.estado, v.publicada ? "Sí" : "No", v.vacantesDisponibles])}
            />
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(empty)} className="bg-gradient-primary">
                  <Plus className="mr-2 h-4 w-4" />Nueva vacante
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editing?.id ? "Editar" : "Nueva"} vacante</DialogTitle>
                </DialogHeader>
                {editing && <VacanteForm value={editing} onChange={setEditing} />}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={onSave} className="bg-gradient-primary">Guardar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>



        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          // Cuadro con scrollbar para no saturar la pantalla con muchas vacantes.
          <div className="h-[calc(100vh-22rem)] min-h-[28rem] overflow-y-auto rounded-2xl border bg-muted/20 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => {
                const cupos = Number(v.vacantesDisponibles ?? 0);
                return (
                  <div key={v.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{v.titulo}</h3>
                      <Badge variant={v.estado === "abierta" ? "default" : "secondary"}>{v.estado}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{v.departamento} · {v.ubicacion}</p>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{v.descripcion}</p>
                    {/* Cupos disponibles visibles antes de editar */}
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                      <Users className="h-3 w-3 text-primary" />
                      Cupos disponibles: <span className="tabular-nums">{cupos}</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Switch checked={v.publicada} onCheckedChange={() => togglePublicada(v)} />
                        <span>{v.publicada ? "Publicada" : "Sin publicar"}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEditing(v); setOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => onDelete(v.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function VacanteForm({ value, onChange }: { value: Partial<Vacante>; onChange: (v: Partial<Vacante>) => void }) {
  const set = (k: keyof Vacante, v: any) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <Label>Título</Label>
          <Input value={value.titulo ?? ""} onChange={(e) => set("titulo", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Departamento</Label>
          <Input value={value.departamento ?? ""} onChange={(e) => set("departamento", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Ubicación</Label>
          <Input value={value.ubicacion ?? ""} onChange={(e) => set("ubicacion", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Modalidad</Label>
          <Select value={value.modalidad} onValueChange={(v) => set("modalidad", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="remoto">Remoto</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Contrato</Label>
          <Select value={value.tipoContrato} onValueChange={(v) => set("tipoContrato", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="indefinido">Indefinido</SelectItem>
              <SelectItem value="temporal">Temporal</SelectItem>
              <SelectItem value="practicas">Prácticas</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Salario mín.</Label>
          <Input type="number" value={value.salarioMin ?? ""} onChange={(e) => set("salarioMin", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Salario máx.</Label>
          <Input type="number" value={value.salarioMax ?? ""} onChange={(e) => set("salarioMax", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Estado</Label>
          <Select value={value.estado} onValueChange={(v) => set("estado", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="abierta">Abierta</SelectItem>
              <SelectItem value="pausada">Pausada</SelectItem>
              <SelectItem value="cerrada">Cerrada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Cupos</Label>
          <Input type="number" min={1} value={value.vacantesDisponibles ?? 1} onChange={(e) => set("vacantesDisponibles", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Descripción</Label>
          <Textarea rows={4} value={value.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Switch checked={!!value.publicada} onCheckedChange={(v) => set("publicada", v)} />
          <Label>Publicar al guardar</Label>
        </div>
      </div>
    </div>
  );
}
