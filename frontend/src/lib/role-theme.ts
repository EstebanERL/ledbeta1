import type { AppRole } from "./auth";

export interface RoleTheme {
  label: string;
  shortLabel: string;
  /** Gradiente del logotipo y acentos principales */
  accent: string;
  /** Gradiente de la franja superior en PageHeader */
  headerAccent: string;
  /** Color sólido para badges / chips */
  badge: string;
  /** Fondo de la sidebar (gradiente vertical) */
  sidebarBg: string;
  /** Color del texto activo en sidebar */
  sidebarActive: string;
  /** Color del borde superior del workspace */
  topBar: string;
  /** Emoji o símbolo del rol */
  symbol: string;
  /** Color base hex para halos */
  glow: string;
}

export const ROLE_THEMES: Record<AppRole, RoleTheme> = {
  super_admin: {
    label: "Super Administrador",
    shortLabel: "Admin",
    accent: "from-violet-500 via-indigo-500 to-blue-600",
    headerAccent: "from-violet-500 via-indigo-500 to-blue-500",
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    sidebarBg: "bg-[linear-gradient(180deg,#1e1b4b_0%,#0f0a2e_100%)]",
    sidebarActive: "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/40",
    topBar: "from-violet-500 via-indigo-500 to-blue-500",
    symbol: "👑",
    glow: "#8b5cf6",
  },
  rrhh: {
    label: "Recursos Humanos",
    shortLabel: "RRHH",
    accent: "from-sky-500 via-cyan-500 to-teal-500",
    headerAccent: "from-blue-500 via-cyan-500 to-teal-500",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    sidebarBg: "bg-[linear-gradient(180deg,#0c2340_0%,#082032_100%)]",
    sidebarActive: "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-400/40",
    topBar: "from-blue-500 via-cyan-500 to-teal-500",
    symbol: "💼",
    glow: "#06b6d4",
  },
  evaluador: {
    label: "Evaluador / Psicólogo",
    shortLabel: "Eval",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    headerAccent: "from-emerald-500 via-teal-500 to-cyan-500",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    sidebarBg: "bg-[linear-gradient(180deg,#022c22_0%,#011f18_100%)]",
    sidebarActive: "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40",
    topBar: "from-emerald-500 via-teal-500 to-cyan-500",
    symbol: "🧠",
    glow: "#10b981",
  },
  candidato: {
    label: "Aspirante",
    shortLabel: "Cand",
    accent: "from-orange-500 via-pink-500 to-rose-500",
    headerAccent: "from-orange-500 via-pink-500 to-rose-500",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    sidebarBg: "bg-[linear-gradient(180deg,#3b0d2a_0%,#1f0613_100%)]",
    sidebarActive: "bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/40",
    topBar: "from-orange-500 via-pink-500 to-rose-500",
    symbol: "🚀",
    glow: "#f43f5e",
  },
};
