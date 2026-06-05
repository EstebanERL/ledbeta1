import { useMemo, useState } from "react";
import {
  useUsers, useVacantesAdmin, usePostulaciones, useTestsBiblioteca,
  ESTADO_LABEL, ROLE_LABEL,
} from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ExportButtons } from "@/components/ExportButtons";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Briefcase, Users, FileText, TrendingUp, Loader2, ClipboardCheck, Library,
  BarChart3, GraduationCap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

/* ---------------- Filtros compartidos ---------------- */
type Filtros = {
  desde: string;
  hasta: string;
  departamento: string;
  vacante: string;
  estado: string;
};

const filtrosVacios: Filtros = {
  desde: "", hasta: "", departamento: "all", vacante: "all", estado: "all",
};

function inRange(d: string | Date | null | undefined, desde: string, hasta: string) {
  if (!d) return true;
  const t = new Date(d).getTime();
  if (desde && t < new Date(desde + "T00:00:00").getTime()) return false;
  if (hasta && t > new Date(hasta + "T23:59:59").getTime()) return false;
  return true;
}

function FiltrosBar({
  value, onChange, departamentos, vacantes, estados,
}: {
  value: Filtros;
  onChange: (f: Filtros) => void;
  departamentos?: string[];
  vacantes?: { id: string; titulo: string }[];
  estados?: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
      <div>
        <Label className="text-xs">Desde</Label>
        <Input type="date" value={value.desde} onChange={(e) => onChange({ ...value, desde: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Hasta</Label>
        <Input type="date" value={value.hasta} onChange={(e) => onChange({ ...value, hasta: e.target.value })} />
      </div>
      {departamentos && (
        <div>
          <Label className="text-xs">Departamento</Label>
          <Select value={value.departamento} onValueChange={(v) => onChange({ ...value, departamento: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departamentos.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {vacantes && (
        <div>
          <Label className="text-xs">Vacante</Label>
          <Select value={value.vacante} onValueChange={(v) => onChange({ ...value, vacante: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {vacantes.map((v) => <SelectItem key={v.id} value={v.id}>{v.titulo}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      {estados && (
        <div>
          <Label className="text-xs">Estado</Label>
          <Select value={value.estado} onValueChange={(v) => onChange({ ...value, estado: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {estados.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

/* ---------------- Page ---------------- */
export default function ReportesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const usersQ = useUsers();
  const vacQ = useVacantesAdmin();
  const postQ = usePostulaciones();
  const testsQ = useTestsBiblioteca();

  if (vacQ.isLoading || postQ.isLoading || testsQ.isLoading || (isAdmin && usersQ.isLoading)) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const vacantes = vacQ.data ?? [];
  const postulaciones = postQ.data ?? [];
  const tests = testsQ.data ?? [];
  const users = usersQ.data ?? [];

  return (
    <div>
      <PageHeader
        title="Reportes y métricas"
        subtitle="Tableros, filtros y exportaciones PDF/Excel sobre datos reales"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <Tabs defaultValue="estadisticas" className="space-y-6">
          <TabsList className="flex-wrap">
            <TabsTrigger value="estadisticas"><BarChart3 className="mr-1 h-4 w-4" /> Estadísticas</TabsTrigger>
            <TabsTrigger value="vacantes"><Briefcase className="mr-1 h-4 w-4" /> Vacantes</TabsTrigger>
            <TabsTrigger value="postulaciones"><FileText className="mr-1 h-4 w-4" /> Postulaciones</TabsTrigger>
            <TabsTrigger value="contrataciones"><GraduationCap className="mr-1 h-4 w-4" /> Contrataciones</TabsTrigger>
            <TabsTrigger value="evaluaciones"><ClipboardCheck className="mr-1 h-4 w-4" /> Evaluaciones</TabsTrigger>
            <TabsTrigger value="tests"><Library className="mr-1 h-4 w-4" /> Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="estadisticas">
            <EstadisticasTab vacantes={vacantes} postulaciones={postulaciones} users={users} isAdmin={isAdmin} />
          </TabsContent>
          <TabsContent value="vacantes"><VacantesTab vacantes={vacantes} postulaciones={postulaciones} /></TabsContent>
          <TabsContent value="postulaciones"><PostulacionesTab postulaciones={postulaciones} vacantes={vacantes} /></TabsContent>
          <TabsContent value="contrataciones"><ContratacionesTab postulaciones={postulaciones} vacantes={vacantes} /></TabsContent>
          <TabsContent value="evaluaciones"><EvaluacionesTab postulaciones={postulaciones} vacantes={vacantes} /></TabsContent>
          <TabsContent value="tests"><TestsTab tests={tests} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ---------------- Estadísticas ---------------- */
function EstadisticasTab({ vacantes, postulaciones, users, isAdmin }: any) {
  const byEstadoVac = ["borrador", "abierta", "pausada", "cerrada"].map((e) => ({
    name: e, value: vacantes.filter((v: any) => v.estado === e).length,
  }));
  const byDepto = Object.entries(vacantes.reduce((a: Record<string, number>, v: any) => {
    a[v.departamento] = (a[v.departamento] || 0) + 1;
    return a;
  }, {} as Record<string, number>)).map(([name, value]) => ({ name, value })).slice(0, 8);
  const byEstadoPost = ["enviada", "en_revision", "evaluacion", "entrevista_pendiente", "rechazada", "contratada"].map((e) => ({
    name: ESTADO_LABEL[e] ?? e, value: postulaciones.filter((p: any) => p.estado === e).length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Vacantes totales" value={String(vacantes.length)} icon={Briefcase} tone="primary" />
        <StatCard label="Postulaciones" value={String(postulaciones.length)} icon={FileText} tone="accent" />
        <StatCard label="Contratados" value={String(postulaciones.filter((p: any) => p.estado === "contratada").length)} icon={TrendingUp} tone="success" />
        {isAdmin && <StatCard label="Usuarios" value={String(users.length)} icon={Users} tone="warning" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Vacantes por estado">
          <div className="h-72">
            <ResponsiveContainer><BarChart data={byEstadoVac}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
              <Tooltip /><Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#6366f1" />
            </BarChart></ResponsiveContainer>
          </div>
        </Section>
        <Section title="Postulaciones por estado">
          <div className="h-72">
            <ResponsiveContainer><PieChart>
              <Pie data={byEstadoPost.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90}>
                {byEstadoPost.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart></ResponsiveContainer>
          </div>
        </Section>
        <Section title="Vacantes por departamento">
          <div className="h-72">
            <ResponsiveContainer><BarChart data={byDepto} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis type="number" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" fontSize={12} width={120} />
              <Tooltip /><Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#06b6d4" />
            </BarChart></ResponsiveContainer>
          </div>
        </Section>
        {isAdmin && (
          <Section title="Distribución de roles">
            <div className="h-72">
              <ResponsiveContainer><PieChart>
                <Pie
                  data={["super_admin", "rrhh", "evaluador", "candidato"].map((r) => ({
                    name: ROLE_LABEL[r] ?? r, value: users.filter((u: any) => u.role === r).length,
                  })).filter((d) => d.value > 0)}
                  dataKey="value" nameKey="name" innerRadius={45} outerRadius={90}
                >
                  {[0, 1, 2, 3].map((i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart></ResponsiveContainer>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

/* ---------------- Vacantes ---------------- */
function VacantesTab({ vacantes, postulaciones }: any) {
  const [f, setF] = useState<Filtros>(filtrosVacios);
  const departamentos = useMemo(
    () => Array.from(new Set(vacantes.map((v: any) => v.departamento).filter(Boolean))) as string[], [vacantes],
  );
  const estadosVac = [
    { value: "borrador", label: "Borrador" },
    { value: "abierta", label: "Abierta" },
    { value: "pausada", label: "Pausada" },
    { value: "cerrada", label: "Cerrada" },
  ];

  const filtered = vacantes.filter((v: any) =>
    inRange(v.createdAt, f.desde, f.hasta) &&
    (f.departamento === "all" || v.departamento === f.departamento) &&
    (f.estado === "all" || v.estado === f.estado),
  );
  const postPorVac = (id: string) => postulaciones.filter((p: any) => p.vacanteId === id).length;

  const head = ["Título", "Departamento", "Modalidad", "Estado", "Publicada", "Postulaciones", "Creada"];
  const rows = filtered.map((v: any) => [
    v.titulo, v.departamento, v.modalidad, v.estado, v.publicada ? "Sí" : "No",
    postPorVac(v.id), new Date(v.createdAt).toLocaleDateString(),
  ]);

  return (
    <div className="space-y-4">
      <FiltrosBar value={f} onChange={setF} departamentos={departamentos} estados={estadosVac} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} vacantes</p>
        <ExportButtons filename={`Reporte_Vacantes_${Date.now()}`} title="Reporte de vacantes"
          subtitle={`${filtered.length} registros`} head={head} rows={rows} />
      </div>
      <DataTable head={head} rows={rows} />
    </div>
  );
}

/* ---------------- Postulaciones ---------------- */
function PostulacionesTab({ postulaciones, vacantes }: any) {
  const [f, setF] = useState<Filtros>(filtrosVacios);
  const departamentos = useMemo(
    () => Array.from(new Set(postulaciones.map((p: any) => p.departamento).filter(Boolean))) as string[],
    [postulaciones],
  );
  const estados = Array.from(new Set(postulaciones.map((p: any) => p.estado))).map((e: any) => ({
    value: e, label: ESTADO_LABEL[e] ?? e,
  }));

  const filtered = postulaciones.filter((p: any) =>
    inRange(p.createdAt, f.desde, f.hasta) &&
    (f.departamento === "all" || p.departamento === f.departamento) &&
    (f.vacante === "all" || p.vacanteId === f.vacante) &&
    (f.estado === "all" || p.estado === f.estado),
  );

  const head = ["Candidato", "Correo", "Vacante", "Departamento", "Estado", "Fecha"];
  const rows = filtered.map((p: any) => [
    p.candidatoNombre, p.candidatoEmail, p.vacanteTitulo, p.departamento,
    ESTADO_LABEL[p.estado] ?? p.estado, new Date(p.createdAt).toLocaleString(),
  ]);

  return (
    <div className="space-y-4">
      <FiltrosBar value={f} onChange={setF} departamentos={departamentos} vacantes={vacantes} estados={estados} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} postulaciones</p>
        <ExportButtons filename={`Reporte_Postulaciones_${Date.now()}`} title="Reporte de postulaciones"
          subtitle={`${filtered.length} registros`} head={head} rows={rows} />
      </div>
      <DataTable head={head} rows={rows} />
    </div>
  );
}

/* ---------------- Contrataciones ---------------- */
function ContratacionesTab({ postulaciones, vacantes }: any) {
  const [f, setF] = useState<Filtros>(filtrosVacios);
  const contratados = postulaciones.filter((p: any) => p.estado === "contratada");
  const departamentos = useMemo(
    () => Array.from(new Set(contratados.map((p: any) => p.departamento).filter(Boolean))) as string[],
    [contratados],
  );
  const filtered = contratados.filter((p: any) =>
    inRange(p.createdAt, f.desde, f.hasta) &&
    (f.departamento === "all" || p.departamento === f.departamento) &&
    (f.vacante === "all" || p.vacanteId === f.vacante),
  );
  const head = ["Candidato", "Correo", "Vacante", "Departamento", "Modalidad", "Fecha de contratación"];
  const rows = filtered.map((p: any) => [
    p.candidatoNombre, p.candidatoEmail, p.vacanteTitulo, p.departamento, p.modalidad,
    new Date(p.createdAt).toLocaleString(),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Contratados (total)" value={String(contratados.length)} icon={TrendingUp} tone="success" />
        <StatCard label="Filtrados" value={String(filtered.length)} icon={FileText} tone="primary" />
        <StatCard label="Departamentos" value={String(departamentos.length)} icon={Briefcase} tone="accent" />
      </div>
      <FiltrosBar value={f} onChange={setF} departamentos={departamentos} vacantes={vacantes} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} contrataciones</p>
        <ExportButtons filename={`Reporte_Contrataciones_${Date.now()}`} title="Reporte de contrataciones"
          subtitle={`${filtered.length} registros`} head={head} rows={rows} />
      </div>
      <DataTable head={head} rows={rows} />
    </div>
  );
}

/* ---------------- Evaluaciones ---------------- */
function EvaluacionesTab({ postulaciones, vacantes }: any) {
  const [f, setF] = useState<Filtros>(filtrosVacios);
  const evaluadas = postulaciones.filter((p: any) =>
    ["evaluacion", "test_asignado", "test_completado", "entrevista_pendiente", "entrevista_realizada", "aprobado", "contratada"].includes(p.estado),
  );
  const departamentos = useMemo(
    () => Array.from(new Set(evaluadas.map((p: any) => p.departamento).filter(Boolean))) as string[],
    [evaluadas],
  );
  const estados = Array.from(new Set(evaluadas.map((p: any) => p.estado))).map((e: any) => ({
    value: e, label: ESTADO_LABEL[e] ?? e,
  }));

  const filtered = evaluadas.filter((p: any) =>
    inRange(p.createdAt, f.desde, f.hasta) &&
    (f.departamento === "all" || p.departamento === f.departamento) &&
    (f.vacante === "all" || p.vacanteId === f.vacante) &&
    (f.estado === "all" || p.estado === f.estado),
  );
  const head = ["Candidato", "Vacante", "Departamento", "Estado actual", "Fecha postulación"];
  const rows = filtered.map((p: any) => [
    p.candidatoNombre, p.vacanteTitulo, p.departamento,
    ESTADO_LABEL[p.estado] ?? p.estado, new Date(p.createdAt).toLocaleString(),
  ]);

  return (
    <div className="space-y-4">
      <FiltrosBar value={f} onChange={setF} departamentos={departamentos} vacantes={vacantes} estados={estados} />
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} procesos en evaluación</p>
        <ExportButtons filename={`Reporte_Evaluaciones_${Date.now()}`} title="Reporte de evaluaciones"
          subtitle={`${filtered.length} registros`} head={head} rows={rows} />
      </div>
      <DataTable head={head} rows={rows} />
    </div>
  );
}

/* ---------------- Tests ---------------- */
function TestsTab({ tests }: any) {
  const head = ["Título", "Tipo", "Categoría", "Preguntas", "Puntaje máx.", "Activo", "Creado"];
  const rows = tests.map((t: any) => [
    t.titulo, t.tipo, t.categoria ?? "—",
    (t.preguntas?.length ?? 0),
    t.maxScore ?? 0,
    t.active ? "Sí" : "No",
    t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "—",
  ]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tests.length} tests en biblioteca</p>
        <ExportButtons filename={`Reporte_Tests_${Date.now()}`} title="Biblioteca de tests"
          subtitle={`${tests.length} registros`} head={head} rows={rows} />
      </div>
      <DataTable head={head} rows={rows} />
    </div>
  );
}

/* ---------------- Tabla compartida ---------------- */
function DataTable({ head, rows }: { head: string[]; rows: any[][] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        Sin registros para los filtros seleccionados.
      </div>
    );
  }
  return (
    <div className="overflow-auto rounded-xl border bg-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted/40">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 250).map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => <td key={j} className="px-3 py-2 align-top">{c == null ? "—" : String(c)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 250 && (
        <p className="border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Mostrando 250 de {rows.length} filas. Exporta a PDF/Excel para ver el detalle completo.
        </p>
      )}
    </div>
  );
}
