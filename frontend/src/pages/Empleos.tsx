import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMyPostulaciones } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Search,
  MapPin,
  Building2,
  Briefcase,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

// Imagen profesional de cabecera (Unsplash – uso libre)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1800&q=80";

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
  vacantesDisponibles?: number;
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

  // Sincroniza la búsqueda con debounce ligero
  useEffect(() => {
    const t = setTimeout(() => {
      qc.invalidateQueries({ queryKey: ["empleos"] });
    }, 350);
    return () => clearTimeout(t);
  }, [q, qc]);

  const totalResultados = items.length;

  return (
    <div className="min-h-screen bg-background">
      {/* ===== Header con imagen profesional ===== */}
      <header className="relative overflow-hidden border-b">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_265_/_0.94)] via-[oklch(0.30_0.14_265_/_0.80)] to-[oklch(0.20_0.10_280_/_0.94)]" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_25%_25%,oklch(0.7_0.18_220_/_0.32),transparent_55%),radial-gradient(circle_at_80%_70%,oklch(0.65_0.2_280_/_0.28),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 text-white">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-md transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
            </Link>
            <Link to="/" className="hidden items-center gap-2 md:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20 backdrop-blur-md">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">TalentForge</span>
            </Link>
          </div>

          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-md">
              <Briefcase className="h-3.5 w-3.5" /> Portal de empleos
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Vacantes abiertas
            </h1>
            <p className="mt-3 max-w-xl text-white/80">
              Explora oportunidades laborales en empresas líderes y postúlate con un solo clic.
            </p>
          </div>

          {/* Filtros */}
          <div className="mt-8 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-md">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && qc.invalidateQueries({ queryKey: ["empleos"] })
                  }
                  placeholder="Buscar por título…"
                  className="border-transparent bg-white/95 pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-white/40"
                  maxLength={120}
                />
              </div>
              <Select value={dept} onValueChange={(v) => setDept(v === "all" ? "" : v)}>
                <SelectTrigger className="border-transparent bg-white/95 text-foreground focus:ring-white/40">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los departamentos</SelectItem>
                  {departamentos.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={mod} onValueChange={(v) => setMod(v === "all" ? "" : v)}>
                <SelectTrigger className="border-transparent bg-white/95 text-foreground focus:ring-white/40">
                  <SelectValue placeholder="Modalidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las modalidades</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="remoto">Remoto</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contrato} onValueChange={(v) => setContrato(v === "all" ? "" : v)}>
                <SelectTrigger className="border-transparent bg-white/95 text-foreground focus:ring-white/40">
                  <SelectValue placeholder="Tipo de contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los contratos</SelectItem>
                  <SelectItem value="indefinido">Indefinido</SelectItem>
                  <SelectItem value="temporal">Temporal</SelectItem>
                  <SelectItem value="practicas">Prácticas</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="prestacion_servicios">Prestación de servicios</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chips de filtros activos */}
            {(dept || mod || contrato || q) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 px-1 pt-3 text-xs">
                <span className="text-white/60">Filtros activos:</span>
                {q && (
                  <FilterChip label={`“${q}”`} onClear={() => setQ("")} />
                )}
                {dept && <FilterChip label={dept} onClear={() => setDept("")} />}
                {mod && <FilterChip label={mod} onClear={() => setMod("")} />}
                {contrato && (
                  <FilterChip
                    label={contrato.replace("_", " ")}
                    onClear={() => setContrato("")}
                  />
                )}
                <button
                  onClick={() => {
                    setQ("");
                    setDept("");
                    setMod("");
                    setContrato("");
                  }}
                  className="ml-auto text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  Limpiar todo
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== Resultados ===== */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Barra resumen */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Cargando vacantes…"
              : `${totalResultados} ${
                  totalResultados === 1 ? "vacante encontrada" : "vacantes encontradas"
                }`}
          </p>
          {user?.role === "candidato" && mine.length > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {mine.length} {mine.length === 1 ? "postulación" : "postulaciones"}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border bg-muted/40"
                aria-hidden
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border bg-card p-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Sin resultados</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              No encontramos vacantes que coincidan con tu búsqueda. Prueba ajustar los filtros
              o limpiarlos.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setQ("");
                setDept("");
                setMod("");
                setContrato("");
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => {
              const yaPostulado =
                !!user && user.role === "candidato" && postulado.has(v.id);
              const cupos = Number(v.vacantesDisponibles ?? 1);
              return (
                <article
                  key={v.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elegant"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary opacity-0 transition group-hover:opacity-100" />

                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary/10 text-primary ring-1 ring-primary/15">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge variant="secondary" className="capitalize">
                        {v.modalidad}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {v.tipoContrato.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold leading-tight tracking-tight">
                    {v.titulo}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {v.departamento}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {v.ubicacion}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {v.descripcion}
                  </p>

                  {(v.salarioMin || v.salarioMax) && (
                    <div className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
                      {v.salarioMin && Number(v.salarioMin).toLocaleString("es-CO")}
                      {v.salarioMin && v.salarioMax && " — "}
                      {v.salarioMax && Number(v.salarioMax).toLocaleString("es-CO")}{" "}
                      <span className="text-xs font-medium opacity-75">{v.moneda}</span>
                    </div>
                  )}

                  <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    {cupos === 1 ? "1 cupo disponible" : `${cupos} cupos disponibles`}
                  </div>

                  <div className="mt-auto pt-5">
                    {yaPostulado ? (
                      <Button disabled variant="outline" className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                        Ya te postulaste
                      </Button>
                    ) : (
                      <Button
                        onClick={() => onApplyClick(v)}
                        className="group/btn w-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <Briefcase className="mr-2 h-4 w-4" />
                        {user ? "Postularme ahora" : "Iniciar sesión y postularme"}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ===== Diálogo de confirmación ===== */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary/10 text-primary ring-1 ring-primary/15">
              <Briefcase className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">Confirmar postulación</DialogTitle>
            <DialogDescription>
              Estás a punto de postularte a{" "}
              <span className="font-semibold text-foreground">{selected?.titulo}</span> en el
              área de{" "}
              <span className="font-semibold text-foreground">{selected?.departamento}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-3">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="leading-relaxed text-muted-foreground">
                Se adjuntará el CV guardado en tu perfil. Puedes actualizarlo desde la sección{" "}
                <Link to="/perfil" className="font-medium text-primary hover:underline">
                  Mi perfil
                </Link>
                .
              </span>
            </div>
            {selected && (
              <div className="flex flex-wrap gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {selected.ubicacion}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {selected.departamento}
                </span>
                <span className="flex items-center gap-1.5 capitalize">
                  <Briefcase className="h-3.5 w-3.5" />
                  {selected.modalidad}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              className="bg-gradient-primary text-primary-foreground shadow-glow"
              disabled={applyMut.isPending}
              onClick={() => selected && applyMut.mutate(selected.id)}
            >
              {applyMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmar postulación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-white capitalize backdrop-blur-md">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Quitar filtro ${label}`}
        className="ml-0.5 text-white/70 transition hover:text-white"
      >
        ×
      </button>
    </span>
  );
}
