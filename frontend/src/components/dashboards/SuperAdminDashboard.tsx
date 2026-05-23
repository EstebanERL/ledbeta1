import { PageHeader, StatCard, Section } from "./shared";
import { Users, Briefcase, ShieldCheck, Activity, FileText, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUsers, useVacantesAdmin, usePostulaciones } from "@/lib/queries";

function buildTrend(items: { createdAt: string }[]) {
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return { d: `${d.getDate()}/${d.getMonth() + 1}`, key: d.toISOString().slice(0, 10), v: 0 };
  });
  for (const it of items) {
    const k = new Date(it.createdAt).toISOString().slice(0, 10);
    const day = days.find((x) => x.key === k);
    if (day) day.v += 1;
  }
  return days;
}

export function SuperAdminDashboard({ name }: { name: string }) {
  const usersQ = useUsers();
  const vacQ = useVacantesAdmin();
  const postQ = usePostulaciones();

  if (usersQ.isLoading || vacQ.isLoading || postQ.isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const users = usersQ.data ?? [];
  const vac = vacQ.data ?? [];
  const post = postQ.data ?? [];
  const activas = vac.filter((v) => v.estado === "abierta" && v.publicada).length;
  const trend = buildTrend(post);
  const byRole = ["super_admin", "rrhh", "evaluador", "candidato"].map((r) => ({
    r, v: users.filter((u) => u.role === r).length,
  }));

  return (
    <div>
      <PageHeader
        title={`Bienvenido, ${name}`}
        subtitle="Vista ejecutiva — datos reales del sistema"
        accent="from-violet-500 via-indigo-500 to-blue-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Usuarios" value={String(users.length)} icon={Users} tone="primary" />
          <StatCard label="Vacantes activas" value={String(activas)} icon={Briefcase} tone="accent" />
          <StatCard label="Postulaciones" value={String(post.length)} icon={FileText} tone="warning" />
          <StatCard label="Contratados" value={String(post.filter((p) => p.estado === "contratada").length)} icon={ShieldCheck} tone="success" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Postulaciones (últimos 14 días)" action={
              <Button asChild size="sm" variant="outline"><Link to="/reportes">Ver reportes</Link></Button>
            }>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="gAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="d" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="url(#gAdmin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>
          <Section title="Usuarios por rol">
            <div className="h-72">
              <ResponsiveContainer><BarChart data={byRole}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="r" fontSize={11} /><YAxis allowDecimals={false} fontSize={12} />
                <Tooltip /><Bar dataKey="v" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart></ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Usuarios recientes" action={<Badge variant="outline">Últimos 5</Badge>}>
          <ul className="divide-y">
            {users.slice(0, 5).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Activity className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm"><b>{u.fullName}</b> — {u.role}</span>
                <span className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
