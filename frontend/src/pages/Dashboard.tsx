import { useAuth } from "@/lib/auth";
import { SuperAdminDashboard } from "@/components/dashboards/SuperAdminDashboard";
import { RRHHDashboard } from "@/components/dashboards/RRHHDashboard";
import { EvaluadorDashboard } from "@/components/dashboards/EvaluadorDashboard";
import { CandidatoDashboard } from "@/components/dashboards/CandidatoDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  const name = (user.fullName || user.email).split(" ")[0];
  switch (user.role) {
    case "super_admin": return <SuperAdminDashboard name={name} />;
    case "rrhh":        return <RRHHDashboard name={name} />;
    case "evaluador":   return <EvaluadorDashboard name={name} />;
    case "candidato":   return <CandidatoDashboard name={name} />;
    default:            return <CandidatoDashboard name={name} />;
  }
}
