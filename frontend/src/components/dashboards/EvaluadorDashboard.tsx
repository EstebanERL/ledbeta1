import { PageHeader, StatCard, Section } from "./shared";
import { Brain, FileText, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { usePostulaciones, estadoColor } from "@/lib/queries";

const COLORS = ["#10b981", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#22d3ee"];

export function EvaluadorDashboard({ name }: { name: string }) {
  const { data, isLoading } = usePostulaciones();
  if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const post = data ?? [];
  const pendientes = post.filter((p) => ["en_revision", "evaluacion", "entrevista"].includes(p.estado));
  const calif = post.filter((p) => ["rechazada", "contratada"].includes(p.estado));

  const byEstado = ["enviada", "en_revision", "evaluacion", "entrevista", "rechazada", "contratada"].map((e, i) => ({
    name: e, value: post.filter((p) => p.estado === e).length, color: COLORS[i],
  })).filter((d) => d.value > 0);

  const byDepto = Object.entries(
    post.reduce<Record<string, number>>((a, p) => { a[p.departamento] = (a[p.departamento] || 0) + 1; return a; }, {}),
  ).map(([name, value]) => ({ name, value })).slice(0, 8);

  return (
    <div>
      <PageHeader
        title={`Hola, ${name}`}
        subtitle="Evaluaciones, pruebas y resultados"
        accent="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Pendientes" value={String(pendientes.length)} icon={ClipboardList} tone="warning" />
          <StatCard label="Calificadas" value={String(calif.length)} icon={CheckCircle2} tone="success" />
          <StatCard label="Total candidatos" value={String(post.length)} icon={Brain} tone="primary" />
          <StatCard label="Contratados" value={String(post.filter((p) => p.estado === "contratada").length)} icon={FileText} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Distribución por estado">
            <div className="h-72">
              {byEstado.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sin datos</div>
              ) : (
                <ResponsiveContainer><PieChart>
                  <Pie data={byEstado} dataKey="value" nameKey="name" innerRadius={45} outerRadius={90}>
                    {byEstado.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart></ResponsiveContainer>
              )}
            </div>
          </Section>
          <Section title="Candidatos por departamento">
            <div className="h-72">
              <ResponsiveContainer><BarChart data={byDepto} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={12} width={120} />
                <Tooltip /><Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Cola de evaluaciones" action={
          <Button asChild size="sm" className="bg-gradient-primary"><Link to="/evaluaciones">Ir a evaluaciones</Link></Button>
        }>
          {pendientes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">Sin evaluaciones pendientes</div>
          ) : (
            <ul className="space-y-2">
              {pendientes.slice(0, 5).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <div className="font-medium text-sm">{p.candidatoNombre}</div>
                    <div className="text-xs text-muted-foreground">{p.vacanteTitulo}</div>
                  </div>
                  <Badge variant="outline" className={estadoColor(p.estado)}>{p.estado}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
