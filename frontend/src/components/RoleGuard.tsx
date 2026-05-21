import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/lib/auth";

export function RoleGuard({ roles, children }: { roles: AppRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!roles.includes(user.role)) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No tienes permisos para acceder a esta sección.
      </div>
    );
  }
  return <>{children}</>;
}
