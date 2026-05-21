import { useUsers, useVacantesAdmin, usePostulaciones } from "@/lib/queries";
import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Server, ShieldCheck, Activity, Database, Loader2 } from "lucide-react";
import { ROLE_THEMES } from "@/lib/role-theme";

export default function SistemaPage() {
  const usersQ = useUsers();
  const vacQ = useVacantesAdmin();
  const postQ = usePostulaciones();

  if (usersQ.isLoading || vacQ.isLoading || postQ.isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const users = usersQ.data ?? [];
  const vac = vacQ.data ?? [];
  const post = postQ.data ?? [];

  // Audit log: combine recent events from real data
  const events = [
    ...users.slice(0, 5).map((u) => ({
      t: `Usuario ${u.fullName} (${u.role}) registrado`,
      d: u.createdAt, tone: "bg-violet-500/15 text-violet-600",
    })),
    ...vac.slice(0, 5).map((v) => ({
      t: `Vacante "${v.titulo}" — ${v.estado}${v.publicada ? " · publicada" : ""}`,
      d: v.createdAt, tone: "bg-cyan-500/15 text-cyan-600",
    })),
    ...post.slice(0, 5).map((p) => ({
      t: `Postulación de ${p.candidatoNombre} a "${p.vacanteTitulo}" — ${p.estado}`,
      d: p.createdAt, tone: "bg-emerald-500/15 text-emerald-600",
    })),
  ].sort((a, b) => +new Date(b.d) - +new Date(a.d)).slice(0, 15);

  return (
    <div>
      <PageHeader
        title="Sistema y auditoría"
        subtitle="Estado general, eventos y permisos"
        accent="from-violet-500 via-indigo-500 to-blue-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Backend" value="Online" icon={Server} tone="success" />
          <StatCard label="MySQL" value="Conectado" icon={Database} tone="primary" />
          <StatCard label="Registros totales" value={String(users.length + vac.length + post.length)} icon={Activity} tone="accent" />
          <StatCard label="Roles activos" value={String(new Set(users.map((u) => u.role)).size)} icon={ShieldCheck} tone="warning" />
        </div>

        <Section title="Matriz de roles y permisos">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left">Rol</th>
                  <th className="px-3 py-2 text-left">Permisos</th>
                  <th className="px-3 py-2 text-left">Usuarios</th>
                </tr>
              </thead>
              <tbody>
                {(["super_admin", "rrhh", "evaluador", "candidato"] as const).map((r) => {
                  const t = ROLE_THEMES[r];
                  const perms: Record<string, string> = {
                    super_admin: "Acceso total · gestiona usuarios · configura sistema",
                    rrhh: "Crea vacantes · gestiona candidatos · reportes",
                    evaluador: "Califica y clasifica candidatos · pruebas",
                    candidato: "Postula a vacantes · seguimiento · inducción",
                  };
                  return (
                    <tr key={r} className="border-b last:border-0">
                      <td className="px-3 py-3 font-medium">{t.symbol} {t.label}</td>
                      <td className="px-3 py-3 text-muted-foreground">{perms[r]}</td>
                      <td className="px-3 py-3">{users.filter((u) => u.role === r).length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Registro de actividad reciente">
          <ul className="divide-y">
            {events.map((e, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${e.tone}`}>
                  <Activity className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm">{e.t}</span>
                <span className="text-xs text-muted-foreground">{new Date(e.d).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
