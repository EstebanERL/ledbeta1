import { PageHeader, StatCard, Section } from "./shared";
import { Briefcase, Users, Clock, TrendingUp, Plus, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useVacantesAdmin, usePostulaciones, estadoColor } from "@/lib/queries";

const PIE_COLORS = ["#6366f1", "#06b6d4", "#8b5cf6", "#0ea5e9", "#ef4444", "#10b981"];

export function RRHHDashboard({ name }: { name: string }) {
  const vacQ = useVacantesAdmin();
  const postQ = usePostulaciones();

  if (vacQ.isLoading || postQ.isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  const vac = vacQ.data ?? [];
  const post = postQ.data ?? [];
  const activas = vac.filter((v) => v.estado === "abierta").length;

  const trend = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const k = d.toISOString().slice(0, 10);
    return {
      d: `${d.getDate()}/${d.getMonth() + 1}`,
      postulaciones: post.filter((p) => p.createdAt.slice(0, 10) === k).length,
    };
  });
  const pipeline = ["enviada", "en_revision", "evaluacion", "entrevista", "contratada", "rechazada"].map((e, i) => ({
    name: e, value: post.filter((p) => p.estado === e).length, color: PIE_COLORS[i],
  })).filter((d) => d.value > 0);
  const tasaConv = post.length ? Math.round((post.filter((p) => p.estado === "contratada").length / post.length) * 1000) / 10 : 0;

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${name}`}
        subtitle="Gestión operativa de vacantes y candidatos"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Vacantes activas" value={String(activas)} icon={Briefcase} tone="primary" />
          <StatCard label="Candidatos" value={String(post.length)} icon={Users} tone="accent" />
          <StatCard label="En entrevista" value={String(post.filter((p) => p.estado === "entrevista").length)} icon={Clock} tone="warning" />
          <StatCard label="Tasa conversión" value={`${tasaConv}%`} icon={TrendingUp} tone="success" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Postulaciones (últimos 14 días)" action={
              <Button asChild size="sm" className="bg-gradient-primary"><Link to="/vacantes"><Plus className="mr-1 h-4 w-4" /> Nueva vacante</Link></Button>
            }>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="d" fontSize={12} /><YAxis fontSize={12} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="postulaciones" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
          <Section title="Pipeline">
            <div className="h-72">
              {pipeline.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin postulaciones</div>
              ) : (
                <ResponsiveContainer><PieChart>
                  <Pie data={pipeline} dataKey="value" innerRadius={45} outerRadius={85} paddingAngle={3}>
                    {pipeline.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart></ResponsiveContainer>
              )}
            </div>
          </Section>
        </div>

        <Section title="Vacantes recientes" action={
          <Button asChild size="sm" variant="outline"><Link to="/vacantes">Ver todas</Link></Button>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
                <th className="px-3 py-2 text-left">Cargo</th>
                <th className="px-3 py-2 text-left">Departamento</th>
                <th className="px-3 py-2 text-left">Modalidad</th>
                <th className="px-3 py-2 text-left">Postulantes</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr></thead>
              <tbody>
                {vac.slice(0, 6).map((v) => {
                  const cnt = post.filter((p) => p.vacanteId === v.id).length;
                  return (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-3 py-3 font-medium">{v.titulo}</td>
                      <td className="px-3 py-3 text-muted-foreground">{v.departamento}</td>
                      <td className="px-3 py-3 text-muted-foreground">{v.modalidad}</td>
                      <td className="px-3 py-3">{cnt}</td>
                      <td className="px-3 py-3"><Badge variant="outline" className={estadoColor(v.estado)}>{v.estado}</Badge></td>
                    </tr>
                  );
                })}
                {vac.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">Sin vacantes aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}
