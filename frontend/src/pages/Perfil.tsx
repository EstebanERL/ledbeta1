import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { ROLE_THEMES } from "@/lib/role-theme";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PerfilPage() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  const theme = ROLE_THEMES[user.role];
  const initials = (user.fullName || user.email).slice(0, 2).toUpperCase();

  return (
    <div>
      <PageHeader title="Mi perfil" subtitle="Datos de tu cuenta" accent={`from-${theme.glow} via-${theme.glow} to-${theme.glow}`} />
      <div className="space-y-6 p-6 md:p-10">
        <Section title="Información personal">
          <div className="flex flex-wrap items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarFallback className={`bg-gradient-to-br ${theme.accent} text-white text-2xl font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <h3 className="text-2xl font-bold">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className={theme.badge}>
                {theme.symbol} {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div><Label>Nombre completo</Label><Input defaultValue={user.fullName} readOnly /></div>
            <div><Label>Email</Label><Input defaultValue={user.email} readOnly /></div>
            <div><Label>Rol</Label><Input defaultValue={ROLE_LABELS[user.role]} readOnly /></div>
            <div><Label>ID</Label><Input defaultValue={user.id} readOnly className="font-mono text-xs" /></div>
          </div>
        </Section>

        <Section title="Sesión">
          <Button variant="destructive" onClick={signOut}>Cerrar sesión</Button>
        </Section>
      </div>
    </div>
  );
}
