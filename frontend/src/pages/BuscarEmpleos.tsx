// Vista de empleos para candidatos dentro del workspace autenticado.
// Reutiliza el endpoint público /vacantes/public pero queda embebida en el layout.
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMyPostulaciones } from "@/lib/queries";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Search, MapPin, Building2, Briefcase, CheckCircle2, FileText, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import ConfirmarPostulacionDialog from "@/components/ConfirmarPostulacionDialog";

type V = {
  id: string; titulo: string; departamento: string; ubicacion: string; modalidad: string;
  tipoContrato: string; salarioMin?: string | null; salarioMax?: string | null; moneda: string;
  descripcion: string; requisitos?: string | null; beneficios?: string | null;
  vacantesDisponibles?: number;
};

export default function BuscarEmpleosPage() {
  const [confirmando, setConfirmando] = useState<any>(null);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [mod, setMod] = useState("");
  const [contrato, setContrato] = useState("");
  const [orden, setOrden] = useState("recientes");
  const [sel, setSel] = useState<V | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["empleos-auth", dept, mod, contrato, q],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (dept) params.departamento = dept;
      if (mod) params.modalidad = mod;
      if (contrato) params.contrato = contrato;
      const { data } = await api.get<{ items: V[] }>("/vacantes/public", { params });
      return data.items;
    },
  });

  const { data: mine = [] } = useMyPostulaciones();
  const postuladas = new Set(mine.map((p) => p.vacanteId));

  // Si llega ?vacante=ID (p. ej. desde el panel del candidato), abrimos el diálogo de postulación.
  const preselectId = searchParams.get("vacante");
  useEffect(() => {
    if (!preselectId || items.length === 0) return;
    const found = items.find((v) => v.id === preselectId);
    if (found) {
      setSel(found);
      // limpiamos el query param para que recargar no re-abra el diálogo
      const next = new URLSearchParams(searchParams);
      next.delete("vacante");
      setSearchParams(next, { replace: true });
    }
  }, [preselectId, items, searchParams, setSearchParams]);

  const applyMut = useMutation({
    mutationFn: async (id: string) => (await api.post("/postulaciones", { vacanteId: id })).data,
    onSuccess: () => {
      toast.success("Postulación enviada");
      qc.invalidateQueries({ queryKey: ["postulaciones"] });
      setSel(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo postular"),
  });

  const departamentos = Array.from(new Set(items.map((i) => i.departamento))).sort();
  const sorted = [...items].sort((a, b) => {
    if (orden === "titulo") return a.titulo.localeCompare(b.titulo);
    if (orden === "salario") return Number(b.salarioMax || 0) - Number(a.salarioMax || 0);
    return 0;
  });

  return (
    <div>
      <PageHeader title="Buscar empleos" subtitle="Explora vacantes abiertas y postúlate con un clic" accent="from-orange-500 via-pink-500 to-rose-500" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o descripción…" className="pl-9" />
          </div>
          <Select value={dept || "all"} onValueChange={(v) => setDept(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={mod || "all"} onValueChange={(v) => setMod(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Modalidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier modalidad</SelectItem>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="remoto">Remoto</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contrato || "all"} onValueChange={(v) => setContrato(v === "all" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="Contrato" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier contrato</SelectItem>
              <SelectItem value="indefinido">Indefinido</SelectItem>
              <SelectItem value="temporal">Temporal</SelectItem>
              <SelectItem value="practicas">Prácticas</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
              <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{sorted.length} vacante(s)</span>
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Más recientes</SelectItem>
              <SelectItem value="salario">Mayor salario</SelectItem>
              <SelectItem value="titulo">Título A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : sorted.length === 0 ? (
          <Section title="Sin resultados">
            <p className="py-6 text-center text-sm text-muted-foreground">Ajusta los filtros para encontrar más vacantes.</p>
          </Section>
        ) : (
          // Cuadro con scrollbar que ocupa la ventana disponible para no saturar la página.
          <div className="h-[calc(100vh-22rem)] min-h-[28rem] overflow-y-auto rounded-2xl border bg-muted/20 p-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sorted.map((v) => {
                const ya = postuladas.has(v.id);
                const cupos = Number(v.vacantesDisponibles ?? 0);
                return (
                  <article key={v.id} className="group flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:shadow-elegant hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary">{v.modalidad}</Badge>
                      <Badge variant="outline">{v.tipoContrato.replace("_", " ")}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold">{v.titulo}</h3>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{v.departamento}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{v.ubicacion}</span>
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{v.descripcion}</p>
                    {(v.salarioMin || v.salarioMax) && (
                      <div className="mt-3 text-sm font-medium text-primary">
                        {v.salarioMin && Number(v.salarioMin).toLocaleString("es-CO")} —{" "}
                        {v.salarioMax && Number(v.salarioMax).toLocaleString("es-CO")} {v.moneda}
                      </div>
                    )}
                    {/* Cupos restantes visibles fuera del detalle */}
                    <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground/80">
                      <Users className="h-3 w-3" />
                      {cupos > 0
                        ? (cupos === 1 ? "1 cupo restante" : `${cupos} cupos restantes`)
                        : "Sin cupos disponibles"}
                    </div>
                    <div className="mt-auto flex gap-2 pt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setSel(v)}>Ver detalle</Button>
                      {ya ? (
                        <Button disabled variant="outline"><CheckCircle2 className="mr-1 h-4 w-4 text-emerald-500" />Postulado</Button>
                      ) : (
                        <Button className="bg-gradient-primary" onClick={() => setConfirmando(v)}><Briefcase className="mr-1 h-4 w-4" />Postularme</Button>
                        
                      )}
                    </div>
                  </article>
                );
              })}
              <ConfirmarPostulacionDialog
              open={!!confirmando}
              onOpenChange={(o) => !o && setConfirmando(null)}
              vacanteTitulo={confirmando?.titulo}
              loading={applyMut.isPending}
              onConfirm={() => {
                if (!confirmando) return;
                applyMut.mutate(confirmando.id);
              }}
            />
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{sel?.titulo}</DialogTitle>
            <DialogDescription>{sel?.departamento} · {sel?.ubicacion} · {sel?.modalidad}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {sel && (
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium">
                <Users className="h-3.5 w-3.5 text-primary" />
                {Number(sel.vacantesDisponibles ?? 0) > 0
                  ? `${sel.vacantesDisponibles} ${Number(sel.vacantesDisponibles) === 1 ? "cupo restante" : "cupos restantes"}`
                  : "Sin cupos disponibles"}
              </div>
            )}
            <p className="whitespace-pre-line text-muted-foreground">{sel?.descripcion}</p>
            {sel?.requisitos && <div><h4 className="font-semibold">Requisitos</h4><p className="whitespace-pre-line text-muted-foreground">{sel.requisitos}</p></div>}
            {sel?.beneficios && <div><h4 className="font-semibold">Beneficios</h4><p className="whitespace-pre-line text-muted-foreground">{sel.beneficios}</p></div>}
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
              <FileText className="h-4 w-4 text-primary" /> Se enviará el CV que tengas en tu perfil.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSel(null)}>Cerrar</Button>
            {sel && !postuladas.has(sel.id) && (
              <Button
                className="bg-gradient-primary"
                disabled={applyMut.isPending}
                onClick={() => setConfirmando(sel)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirmar postulación
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

