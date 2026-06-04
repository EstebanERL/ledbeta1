import { Outlet, Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { ROLE_THEMES } from "@/lib/role-theme";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Sparkles, LogOut, Loader2, Briefcase, Users, BarChart3,
  Brain, FileText, Settings, ClipboardList, UserCircle, Search, ClipboardCheck, Archive,
} from "lucide-react";


export default function AuthenticatedLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const theme = ROLE_THEMES[user.role];
  const initials = (user.fullName || user.email).slice(0, 2).toUpperCase();

  const navByRole: Record<string, { to: string; icon: any; label: string }[]> = {
    super_admin: [
      { to: "/dashboard",   icon: LayoutDashboard, label: "Visión general" },
      { to: "/usuarios",    icon: Users,           label: "Usuarios" },
      { to: "/vacantes",    icon: Briefcase,       label: "Vacantes" },
      { to: "/candidatos",  icon: ClipboardList,   label: "Candidatos" },
      { to: "/procesos-finalizados", icon: Archive, label: "Procesos finalizados" },
      { to: "/reportes",    icon: BarChart3,       label: "Reportes" },
      { to: "/sistema",     icon: Settings,        label: "Sistema" },
      { to: "/perfil",      icon: UserCircle,      label: "Mi perfil" },
    ],
    rrhh: [
      { to: "/dashboard",   icon: LayoutDashboard, label: "Inicio" },
      { to: "/vacantes",    icon: Briefcase,       label: "Vacantes" },
      { to: "/candidatos",  icon: Users,           label: "Candidatos" },
      { to: "/evaluaciones",icon: ClipboardList,   label: "Evaluaciones" },
      { to: "/procesos-finalizados", icon: Archive, label: "Procesos finalizados" },
      { to: "/reportes",    icon: BarChart3,       label: "Reportes" },
      { to: "/perfil",      icon: UserCircle,      label: "Mi perfil" },
    ],
    evaluador: [
      { to: "/dashboard",   icon: LayoutDashboard, label: "Inicio" },
      { to: "/evaluaciones",icon: Brain,           label: "Evaluaciones" },
      { to: "/candidatos",  icon: Users,           label: "Candidatos" },
      { to: "/procesos-finalizados", icon: Archive, label: "Procesos finalizados" },
      { to: "/perfil",      icon: UserCircle,      label: "Mi perfil" },
    ],
    candidato: [
      { to: "/dashboard",       icon: LayoutDashboard, label: "Mi panel" },
      { to: "/buscar-empleos",  icon: Search,          label: "Empleos" },
      { to: "/postulaciones",   icon: FileText,        label: "Postulaciones" },
      { to: "/mis-tests",       icon: ClipboardCheck,  label: "Mis tests" },
      { to: "/test-perfil",     icon: Brain,           label: "Test de perfil" },
      { to: "/perfil",          icon: UserCircle,      label: "Mi perfil" },
    ],
  };


  const items = navByRole[user.role];

  const handleSignOut = () => { signOut(); navigate("/"); };

  return (
    <div className="flex min-h-screen bg-gradient-subtle">
      {/* SIDEBAR — tematizado por rol */}
      <aside className={`hidden w-64 flex-col text-white md:flex ${theme.sidebarBg} relative overflow-hidden`}>
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30 blur-3xl"
          style={{ background: theme.glow }}
        />
        <Link to="/" className="relative flex items-center gap-3 border-b border-white/10 px-6 py-5">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${theme.accent} shadow-lg`}>
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight">TalentForge</span>
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              {theme.shortLabel} workspace
            </span>
          </div>
        </Link>

        {/* Identificador de rol bien visible */}
        <div className="relative mx-3 mt-4 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-xs">
            <theme.Symbol className="h-4 w-4 text-white" />
            <div className="flex flex-col">
              <span className="font-semibold text-white">{theme.label}</span>
              <span className="text-[10px] uppercase tracking-wider text-white/50">Modo activo</span>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 space-y-1 px-3 py-6">
          {items.map((it, i) => {
            const active = pathname === it.to;
            return (
              <Link
                key={i}
                to={it.to}
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? theme.sidebarActive
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <it.icon className={`h-4 w-4 transition group-hover:scale-110 ${active ? "" : "opacity-70"}`} />
                {it.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-white/20">
              <AvatarFallback className={`bg-gradient-to-br ${theme.accent} text-white text-xs font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{user.fullName}</div>
              <div className="truncate text-xs text-white/50">{user.email}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSignOut}
              className="text-white/70 hover:bg-white/10 hover:text-white"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* WORKSPACE */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra de acento superior por rol (siempre visible) */}
        <div className={`h-1 w-full bg-gradient-to-r ${theme.topBar}`} />

        <header className="flex items-center justify-between border-b bg-background/70 px-6 py-3 backdrop-blur md:hidden">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">TalentForge</span>
          </Link>
          <Badge variant="outline" className={`${theme.badge} inline-flex items-center gap-1`}>
            <theme.Symbol className="h-3 w-3" /> {theme.shortLabel}
          </Badge>
          <Button size="sm" variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
