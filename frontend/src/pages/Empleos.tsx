import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMyPostulaciones } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2, Search, MapPin, Building2, Briefcase, Sparkles, ArrowLeft, CheckCircle2, FileText,
} from "lucide-react";
import { toast } from "sonner";

type Vacante = {
  id: string;
  titulo: string;
  departamento: string;
  ubicacion: string;
  modalidad: string;
  tipoContrato: string;
  salarioMin?: string | null;
  salarioMax?: string | null;
  moneda: string;
  descripcion: string;
  fechaPublicacion?: string | null;
};

export default function EmpleosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [mod, setMod] = useState("");
  const [contrato, setContrato] = useState("");
  const [selected, setSelected] = useState<Vacante | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["empleos", dept, mod, contrato],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (dept) params.departamento = dept;
      if (mod) params.modalidad = mod;
      if (contrato) params.contrato = contrato;
      const { data } = await api.get<{ items: Vacante[] }>("/vacantes/public", { params });
      return data.items;
    },
  });

  const { data: mine = [] } = useMyPostulaciones(user?.role === "candidato");
  const postulado = new Set(mine.map((p) => p.vacanteId));

  const applyMut = useMutation({
    mutationFn: async (id: string) => (await api.post("/postulaciones", { vacanteId: id })).data,
    onSuccess: () => {
      toast.success("¡Postulación enviada con éxito!");
      qc.invalidateQueries({ queryKey: ["postulaciones"] });
      setSelected(null);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.error;
      if (e?.response?.status === 409) toast.warning(msg ?? "Ya te postulaste a esta vacante");
      else toast.error(msg ?? "No se pudo enviar la postulación");
    },
  });

  const onApplyClick = (v: Vacante) => {
    if (!user) {
      toast.info("Inicia sesión o crea tu cuenta de candidato para postularte");
      navigate("/auth?tab=register");
      return;
    }
    if (user.role !== "candidato") {
      toast.error("Sólo los aspirantes pueden postularse");
      return;
    }
    if (postulado.has(v.id)) {
      toast.warning("Ya te postulaste a esta vacante");
      return;
    }
    setSelected(v);
  };

  const departamentos = Array.from(new Set(items.map((i) => i.departamento))).sort();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <div className="mt-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">TalentForge — Empleos</span>
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">Vacantes abiertas</h1>
          <p className="mt-2 text-white/80">Encuentra tu próxima oportunidad.</p>

          <div className="mt-8 grid gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur md:grid-cols-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input value={q} onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && qc.invalidateQueries({ queryKey: ["empleos"] })}
                placeholder="Buscar título…"
                className="bg-white/90 pl-9 text-foreground placeholder:text-muted-foreground" />
            </div>
            <Select value={dept} onValueChange={(v) => setDept(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white/90 text-foreground"><SelectValue placeholder="Departamento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={mod} onValueChange={(v) => setMod(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white/90 text-foreground"><SelectValue placeholder="Modalidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="remoto">Remoto</SelectItem>
                <SelectItem value="hibrido">Híbrido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={contrato} onValueChange={(v) => setContrato(v === "all" ? "" : v)}>
              <SelectTrigger className="bg-white/90 text-foreground"><SelectValue placeholder="Contrato" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="indefinido">Indefinido</SelectItem>
                <SelectItem value="temporal">Temporal</SelectItem>
                <SelectItem value="practicas">Prácticas</SelectItem>
                <SelectItem value="freelance">Freelance</SelectItem>
                <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">No hay vacantes que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => {
              const yaPostulado = postulado.has(v.id);
              return (
                <article key={v.id} className="group flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-elegant hover:-translate-y-0.5">
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
                  <div className="mt-auto pt-4">
                    {yaPostulado ? (
                      <Button disabled variant="outline" className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Ya postulaste
                      </Button>
                    ) : (
                      <Button onClick={() => onApplyClick(v)} className="w-full bg-gradient-primary">
                        <Briefcase className="mr-2 h-4 w-4" />Postularme
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar postulación</DialogTitle>
            <DialogDescription>
              Vas a postularte a <b>{selected?.titulo}</b> ({selected?.departamento}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <FileText className="mt-0.5 h-4 w-4 text-primary" />
              <span>
                Se adjuntará el CV guardado en tu perfil. Puedes actualizarlo desde la sección{" "}
                <Link to="/perfil" className="font-medium text-primary hover:underline">Mi perfil</Link>.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button
              className="bg-gradient-primary"
              disabled={applyMut.isPending}
              onClick={() => selected && applyMut.mutate(selected.id)}
            >
              {applyMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirmar postulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
