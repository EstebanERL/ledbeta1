import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export type AdminUser = {
  id: string; email: string; fullName: string;
  role: "super_admin" | "rrhh" | "evaluador" | "candidato";
  createdAt: string;
};

export type Vacante = {
  id: string; titulo: string; descripcion: string; departamento: string; ubicacion: string;
  modalidad: string; tipoContrato: string; estado: string; publicada: boolean;
  salarioMin?: string | null; salarioMax?: string | null; moneda: string;
  vacantesDisponibles: number; fechaPublicacion?: string | null; createdAt: string;
};

export type Postulacion = {
  id: string; estado: string; cvUrl?: string | null; notas?: string | null; createdAt: string;
  vacanteId: string; vacanteTitulo: string; departamento: string; modalidad: string;
  candidatoId: string; candidatoNombre: string; candidatoEmail: string;
};

export type MyPostulacion = {
  id: string; estado: string; cvUrl?: string | null; createdAt: string;
  vacanteId: string; titulo: string; departamento: string; modalidad: string; vacanteEstado: string;
};

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get<{ users: AdminUser[] }>("/users")).data.users,
  });
}

export function useVacantesAdmin(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["vacantes", "admin"],
    queryFn: async () => (await api.get<{ items: Vacante[] }>("/vacantes")).data.items,
  });
}

export function useVacantesPublic() {
  return useQuery({
    queryKey: ["vacantes", "public"],
    queryFn: async () => (await api.get<{ items: Vacante[] }>("/vacantes/public")).data.items,
  });
}

export function usePostulaciones(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["postulaciones"],
    queryFn: async () => (await api.get<{ items: Postulacion[] }>("/postulaciones")).data.items,
  });
}

export function useMyPostulaciones(enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["postulaciones", "me"],
    queryFn: async () => (await api.get<{ items: MyPostulacion[] }>("/postulaciones/me")).data.items,
  });
}

export const ESTADOS_POSTULACION = [
  "enviada", "en_revision", "evaluacion", "entrevista", "rechazada", "contratada",
] as const;

export function estadoColor(estado: string): string {
  const map: Record<string, string> = {
    enviada: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    en_revision: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    evaluacion: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    entrevista: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30",
    rechazada: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    contratada: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  };
  return map[estado] ?? "bg-muted text-muted-foreground";
}
