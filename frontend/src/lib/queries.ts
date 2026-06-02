import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type AdminUser = {
  id: string; email: string; fullName: string;
  role: "super_admin" | "rrhh" | "evaluador" | "candidato";
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt: string;
};

export type Vacante = {
  id: string; titulo: string; descripcion: string; departamento: string; ubicacion: string;
  modalidad: string; tipoContrato: string; estado: string; publicada: boolean;
  salarioMin?: string | null; salarioMax?: string | null; moneda: string;
  vacantesDisponibles: number; fechaPublicacion?: string | null; createdAt: string;
  requisitos?: string | null; beneficios?: string | null;
  score?: number;
};

export type Postulacion = {
  id: string; estado: string; cvUrl?: string | null; notas?: string | null; createdAt: string;
  vacanteId: string; vacanteTitulo: string; departamento: string; modalidad: string;
  candidatoId: string; candidatoNombre: string; candidatoEmail: string;
  candidatoAvatar?: string | null;
};

export type MyPostulacion = {
  id: string; estado: string; cvUrl?: string | null; createdAt: string;
  vacanteId: string; titulo: string; departamento: string; modalidad: string; vacanteEstado: string;
};

export type ExperienceItem = { company: string; role: string; from?: string; to?: string; description?: string };
export type EducationItem = { institution: string; degree: string; from?: string; to?: string };

export type UserProfile = {
  id: string; email: string; fullName: string;
  role: AdminUser["role"];
  avatarUrl?: string | null;
  phone?: string | null; location?: string | null; headline?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null; githubUrl?: string | null; websiteUrl?: string | null;
  cvUrl?: string | null;
  skills?: string[] | null;
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  isActive?: boolean;
  createdAt: string;
};

export type PostulacionEvento = {
  id: string; estado?: string | null; tipo: string; nota?: string | null;
  createdAt: string; autorId?: string | null; autorRol?: string | null; autorNombre?: string | null;
};

export type ChatMensaje = {
  id: string; mensaje: string; createdAt: string;
  autorId: string; autorRol: string; autorNombre: string;
};

export type ProfileTest = {
  id: string; userId: string;
  scores: Record<string, number>;
  perfil?: string | null; resumen?: string | null;
  completedAt: string;
};

export function useUsers() {
  return useQuery({ queryKey: ["users"], queryFn: async () => (await api.get<{ users: AdminUser[] }>("/users")).data.users });
}
export function useVacantesAdmin(enabled = true) {
  return useQuery({ enabled, queryKey: ["vacantes", "admin"], queryFn: async () => (await api.get<{ items: Vacante[] }>("/vacantes")).data.items });
}
export function useVacantesPublic() {
  return useQuery({ queryKey: ["vacantes", "public"], queryFn: async () => (await api.get<{ items: Vacante[] }>("/vacantes/public")).data.items });
}
export function useVacantesRecomendadas(enabled = true) {
  return useQuery({ enabled, queryKey: ["vacantes", "reco"], queryFn: async () => (await api.get<{ items: Vacante[] }>("/vacantes/recomendadas")).data.items });
}
export function usePostulaciones(enabled = true) {
  return useQuery({ enabled, queryKey: ["postulaciones"], queryFn: async () => (await api.get<{ items: Postulacion[] }>("/postulaciones")).data.items });
}
export function useMyPostulaciones(enabled = true) {
  return useQuery({ enabled, queryKey: ["postulaciones", "me"], queryFn: async () => (await api.get<{ items: MyPostulacion[] }>("/postulaciones/me")).data.items });
}
export function useMyProfile(enabled = true) {
  return useQuery({ enabled, queryKey: ["profile", "me"], queryFn: async () => (await api.get<{ user: UserProfile }>("/users/me")).data.user });
}
export function useUserProfile(id: string | null) {
  return useQuery({ enabled: !!id, queryKey: ["profile", id], queryFn: async () => (await api.get<{ user: UserProfile }>(`/users/${id}`)).data.user });
}
export function useMyProfileTest(enabled = true) {
  return useQuery({
    enabled, queryKey: ["profile-test", "me"],
    queryFn: async () => (await api.get<{ test: ProfileTest | null }>("/profile-tests/me")).data.test,
  });
}
export function useEventos(postulacionId: string | null) {
  return useQuery({
    enabled: !!postulacionId, queryKey: ["eventos", postulacionId],
    queryFn: async () => (await api.get<{ items: PostulacionEvento[] }>(`/postulaciones/${postulacionId}/eventos`)).data.items,
  });
}
export function useMensajes(postulacionId: string | null) {
  return useQuery({
    enabled: !!postulacionId, queryKey: ["mensajes", postulacionId],
    queryFn: async () => (await api.get<{ items: ChatMensaje[] }>(`/postulaciones/${postulacionId}/mensajes`)).data.items,
    refetchInterval: 8000,
  });
}
export function useMisAsignacionesTest(enabled = true) {
  return useQuery({
    enabled, queryKey: ["test-asignaciones", "me"],
    queryFn: async () => (await api.get<{ items: any[] }>("/test-asignaciones/me")).data.items,
  });
}
export function useTests(enabled = true) {
  return useQuery({
    enabled, queryKey: ["tests"],
    queryFn: async () => (await api.get<{ items: any[] }>("/tests")).data.items,
  });
}
export function useAsignacionesByPostulacion(postulacionId: string | null) {
  return useQuery({
    enabled: !!postulacionId, queryKey: ["test-asignaciones", "post", postulacionId],
    queryFn: async () => (await api.get<{ items: any[] }>(`/test-asignaciones/postulacion/${postulacionId}`)).data.items,
  });
}
export function useEntrevistasByPostulacion(postulacionId: string | null) {
  return useQuery({
    enabled: !!postulacionId, queryKey: ["entrevistas", postulacionId],
    queryFn: async () => (await api.get<{ items: any[] }>(`/entrevistas/postulacion/${postulacionId}`)).data.items,
  });
}
export function useUserProfileTest(userId: string | null) {
  return useQuery({
    enabled: !!userId, queryKey: ["profile-test", userId],
    queryFn: async () => (await api.get<{ test: ProfileTest | null }>(`/profile-tests/user/${userId}`)).data.test,
  });
}

export function fileUrl(p?: string | null): string | undefined {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return p;
  const base = (import.meta.env.VITE_API_URL || "http://localhost:4000/api").replace(/\/api\/?$/, "");
  return `${base}${p.startsWith("/") ? "" : "/"}${p}`;
}

export const ESTADOS_FINALIZADOS = ["contratada", "rechazada"] as const;
export function isFinalizada(estado: string) {
  return (ESTADOS_FINALIZADOS as readonly string[]).includes(estado);
}
export const ESTADOS_VACANTE_FINALIZADA = ["cerrada"] as const;
export function isVacanteFinalizada(estado: string) {
  return (ESTADOS_VACANTE_FINALIZADA as readonly string[]).includes(estado);
}

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  rrhh: "RRHH",
  evaluador: "Evaluador",
  candidato: "Candidato",
  sistema: "Sistema",
};
export function roleBadgeColor(role: string): string {
  const map: Record<string, string> = {
    super_admin: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    rrhh: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    evaluador: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    candidato: "bg-orange-500/15 text-orange-600 border-orange-500/30",
    sistema: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  };
  return map[role] ?? "bg-muted text-muted-foreground";
}

export const ESTADOS_POSTULACION = [
  "enviada", "en_revision", "evaluacion", "test_asignado", "test_completado",
  "entrevista_pendiente", "entrevista_realizada", "aprobado",
  "rechazada", "contratada",
] as const;

export const ESTADO_LABEL: Record<string, string> = {
  enviada: "Enviada",
  en_revision: "En revisión",
  evaluacion: "En evaluación",
  test_asignado: "Test asignado",
  test_completado: "Test completado",
  entrevista: "Entrevista",
  entrevista_pendiente: "Entrevista pendiente",
  entrevista_realizada: "Entrevista realizada",
  aprobado: "Aprobado",
  rechazada: "Rechazado",
  contratada: "Contratado",
};

export function estadoColor(estado: string): string {
  const map: Record<string, string> = {
    enviada: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    en_revision: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    evaluacion: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    test_asignado: "bg-indigo-500/15 text-indigo-600 border-indigo-500/30",
    test_completado: "bg-fuchsia-500/15 text-fuchsia-600 border-fuchsia-500/30",
    entrevista: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
    entrevista_pendiente: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
    entrevista_realizada: "bg-teal-500/15 text-teal-600 border-teal-500/30",
    aprobado: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    rechazada: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    contratada: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  };
  return map[estado] ?? "bg-muted text-muted-foreground";
}

export const TIMELINE_ORDER = [
  "enviada", "en_revision", "test_asignado", "test_completado",
  "entrevista_pendiente", "entrevista_realizada", "contratada",
];

/** Flujo controlado (debe coincidir con backend/src/lib/state-machine.js). */
export const TRANSITIONS: Record<string, string[]> = {
  enviada:              ["en_revision", "rechazada"],
  en_revision:          ["test_asignado", "entrevista_pendiente", "rechazada"],
  evaluacion:           ["test_asignado", "entrevista_pendiente", "rechazada"],
  test_asignado:        ["test_completado", "rechazada"],
  test_completado:      ["entrevista_pendiente", "rechazada"],
  entrevista_pendiente: ["entrevista_realizada", "rechazada"],
  entrevista_realizada: ["contratada", "rechazada"],
  aprobado:             ["contratada", "rechazada"],
  contratada:           [],
  rechazada:            [],
};

const ACCIONES_FINALES = new Set(["contratada", "rechazada"]);

export function allowedTransitionsFor(role: string, from: string): string[] {
  const list = TRANSITIONS[from] ?? [];
  if (role === "evaluador") return list.filter((s) => !ACCIONES_FINALES.has(s));
  return list;
}
