import { useUsers, useVacantesAdmin, usePostulaciones } from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Briefcase, Users, FileText, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ReportesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "super_admin";
  const usersQ = useUsers();
  const vacQ = useVacantesAdmin();
  const postQ = usePostulaciones();

  if (vacQ.isLoading || postQ.isLoading || (isAdmin && usersQ.isLoading)) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const vac = vacQ.data ?? [];
  const post = postQ.data ?? [];
  const users = usersQ.data ?? [];

  const byEstadoVac = ["borrador", "abierta", "pausada", "cerrada"].map((e) => ({
    name: e, value: vac.filter((v) => v.estado === e).length,
  }));
  const byDepto = Object.entries(vac.reduce<Record<string, number>>((a, v) => {
    a[v.departamento] = (a[v.departamento] || 0) + 1; return a;
  }, {})).map(([name, value]) => ({ name, value })).slice(0, 8);
  const byEstadoPost = ["enviada", "en_revision", "evaluacion", "entrevista", "rechazada", "contratada"].map((e) => ({
    name: e, value: post.filter((p) => p.estado === e).length,
  }));

  return (
    <div>
      <PageHeader
        title="Reportes y métricas"
        subtitle="Datos reales del sistema en tiempo real"
        accent="from-blue-500 via-cyan-500 to-teal-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Vacantes totales" value={String(vac.length)} icon={Briefcase} tone="primary" />
          <StatCard label="Postulaciones" value={String(post.length)} icon={FileText} tone="accent" />
          <StatCard label="Contratados" value={String(post.filter((p) => p.estado === "contratada").length)} icon={TrendingUp} tone="success" />
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
                      name: r, value: users.filter((u) => u.role === r).length,
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
    </div>
  );
}
