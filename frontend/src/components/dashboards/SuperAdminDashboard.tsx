import { PageHeader, StatCard, Section } from "./shared";
import { Users, Briefcase, ShieldCheck, Activity, Server } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

const trendData = [
  { mes: "Ene", contrataciones: 12, postulaciones: 240 },
  { mes: "Feb", contrataciones: 18, postulaciones: 320 },
  { mes: "Mar", contrataciones: 22, postulaciones: 410 },
  { mes: "Abr", contrataciones: 28, postulaciones: 480 },
  { mes: "May", contrataciones: 35, postulaciones: 560 },
  { mes: "Jun", contrataciones: 41, postulaciones: 640 },
];
const areaData = [
  { dia: "L", v: 32 }, { dia: "M", v: 41 }, { dia: "X", v: 38 },
  { dia: "J", v: 56 }, { dia: "V", v: 61 }, { dia: "S", v: 24 }, { dia: "D", v: 18 },
];

export function SuperAdminDashboard({ name }: { name: string }) {
  return (
    <div>
      <PageHeader
        title={`Hola, ${name} 👋`}
        subtitle="Vista ejecutiva — métricas globales del sistema"
        accent="from-violet-500 via-indigo-500 to-blue-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Usuarios totales" value="1,284" delta="+12% vs mes anterior" icon={Users} tone="primary" />
          <StatCard label="Vacantes activas" value="47" delta="+8 nuevas" icon={Briefcase} tone="accent" />
          <StatCard label="Cumplimiento RLS" value="100%" icon={ShieldCheck} tone="success" />
          <StatCard label="Uptime" value="99.98%" icon={Server} tone="warning" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Tendencia de reclutamiento (6 meses)">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.18 240)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.62 0.18 240)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.72 0.15 200)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="mes" stroke="currentColor" fontSize={12} />
                    <YAxis stroke="currentColor" fontSize={12} />
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                    <Legend />
                    <Area type="monotone" dataKey="postulaciones" stroke="oklch(0.62 0.18 240)" fill="url(#grad1)" />
                    <Area type="monotone" dataKey="contrataciones" stroke="oklch(0.72 0.15 200)" fill="url(#grad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
          <Section title="Actividad de la semana">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="dia" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="v" fill="oklch(0.42 0.16 260)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Eventos recientes" action={<Badge variant="outline">Últimas 24h</Badge>}>
          <ul className="divide-y">
            {[
              { t: "Nuevo administrador RRHH registrado", time: "hace 12 min", tone: "bg-primary/10 text-primary" },
              { t: "Vacante 'Senior Backend' publicada", time: "hace 1 h", tone: "bg-accent/15 text-accent" },
              { t: "12 candidatos completaron prueba técnica", time: "hace 3 h", tone: "bg-success/15 text-success" },
              { t: "Reporte mensual generado", time: "hace 8 h", tone: "bg-warning/20 text-warning" },
            ].map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${e.tone}`}>
                  <Activity className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm">{e.t}</span>
                <span className="text-xs text-muted-foreground">{e.time}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
