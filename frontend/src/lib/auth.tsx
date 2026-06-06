import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, TOKEN_KEY } from "./api";

export type AppRole = "super_admin" | "rrhh" | "evaluador" | "candidato";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  avatarUrl?: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string }) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Administrador",
  rrhh: "Administrador RRHH",
  evaluador: "Evaluador / Psicólogo",
  candidato: "Aspirante / Candidato",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) fetchMe().finally(() => setLoading(false));
    else setLoading(false);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        login: async (email, password) => {
          const { data } = await api.post("/auth/login", {
            email,
            password,
          });

          localStorage.setItem(TOKEN_KEY, data.token);
          setUser(data.user);
        },

        register: async (payload) => {
          const { data } = await api.post("/auth/register", payload);

          localStorage.setItem(TOKEN_KEY, data.token);
          setUser(data.user);
        },
        signOut: () => {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        },
        refresh: fetchMe,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
