import { PageHeader, StatCard, Section } from "./shared";
import { Briefcase, Users, Clock, TrendingUp, Plus } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pipeline = [
  { name: "Nuevos", value: 124, color: "oklch(0.62 0.18 240)" },
  { name: "En revisión", value: 78, color: "oklch(0.72 0.15 200)" },
  { name: "Pruebas", value: 42, color: "oklch(0.78 0.16 75)" },
  { name: "Entrevista", value: 21, color: "oklch(0.55 0.18 290)" },
  { name: "Contratados", value: 9, color: "oklch(0.62 0.16 155)" },
];

const trend = Array.from({ length: 14 }).map((_, i) => ({
  d: `${i + 1}`, postulaciones: 10 + Math.round(Math.sin(i / 2) * 8 + i * 2),
}));

export function RRHHDashboard({ name }: { name: string }) {
  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${name}`}
        subtitle="Gestión operativa de vacantes y candidatos"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Vacantes activas" value="14" delta="+3 esta semana" icon={Briefcase} tone="primary" />
            <StatCard label="Candidatos en pipeline" value="274" delta="+18%" icon={Users} tone="accent" />
            <StatCard label="Tiempo promedio de hire" value="18 días" delta="-4 días" icon={Clock} tone="success" />
            <StatCard label="Tasa de conversión" value="7.3%" delta="+0.8%" icon={TrendingUp} tone="warning" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Postulaciones (últimos 14 días)" action={<Button size="sm" className="bg-gradient-primary"><Plus className="mr-1 h-4 w-4" /> Nueva vacante</Button>}>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="d" stroke="currentColor" fontSize={12} />
                    <YAxis stroke="currentColor" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="postulaciones" stroke="oklch(0.42 0.16 260)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
          <Section title="Embudo del pipeline">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pipeline} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                    {pipeline.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Vacantes recientes" action={<Button size="sm" variant="outline">Ver todas</Button>}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left">Cargo</th>
                  <th className="px-3 py-2 text-left">Área</th>
                  <th className="px-3 py-2 text-left">Modalidad</th>
                  <th className="px-3 py-2 text-left">Postulantes</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { c: "Senior Backend Engineer", a: "Tecnología", m: "Remoto", p: 47, s: "Activa", t: "bg-success/15 text-success" },
                  { c: "Diseñador UX/UI", a: "Producto", m: "Híbrido", p: 32, s: "Activa", t: "bg-success/15 text-success" },
                  { c: "Analista Financiero", a: "Finanzas", m: "Presencial", p: 21, s: "En revisión", t: "bg-warning/20 text-warning" },
                  { c: "Especialista Marketing", a: "Marketing", m: "Remoto", p: 18, s: "Pausada", t: "bg-muted text-muted-foreground" },
                ].map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-3 py-3 font-medium">{r.c}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.a}</td>
                    <td className="px-3 py-3 text-muted-foreground">{r.m}</td>
                    <td className="px-3 py-3">{r.p}</td>
                    <td className="px-3 py-3"><Badge className={r.t}>{r.s}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}
