import { Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import EmpleosPage from "@/pages/Empleos";
import DashboardPage from "@/pages/Dashboard";
import VacantesPage from "@/pages/Vacantes";
import UsuariosPage from "@/pages/Usuarios";
import ReportesPage from "@/pages/Reportes";
import CandidatosPage from "@/pages/Candidatos";
import EvaluacionesPage from "@/pages/Evaluaciones";
import MisPostulacionesPage from "@/pages/MisPostulaciones";
import InduccionPage from "@/pages/Induccion";
import SistemaPage from "@/pages/Sistema";
import PerfilPage from "@/pages/Perfil";
import TestPerfilPage from "@/pages/TestPerfil";
import MisTestsPage from "@/pages/MisTests";
import BuscarEmpleosPage from "@/pages/BuscarEmpleos";
import NotFoundPage from "@/pages/NotFound";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { RoleGuard } from "@/components/RoleGuard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/empleos" element={<EmpleosPage />} />

      <Route element={<AuthenticatedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/perfil" element={<PerfilPage />} />

        {/* Super Admin */}
        <Route path="/usuarios" element={<RoleGuard roles={["super_admin"]}><UsuariosPage /></RoleGuard>} />
        <Route path="/sistema" element={<RoleGuard roles={["super_admin"]}><SistemaPage /></RoleGuard>} />

        {/* RRHH + Super Admin */}
        <Route path="/vacantes" element={<RoleGuard roles={["rrhh", "super_admin"]}><VacantesPage /></RoleGuard>} />
        <Route path="/candidatos" element={<RoleGuard roles={["rrhh", "super_admin"]}><CandidatosPage /></RoleGuard>} />
        <Route path="/reportes" element={<RoleGuard roles={["rrhh", "super_admin"]}><ReportesPage /></RoleGuard>} />

        {/* Evaluador */}
        <Route path="/evaluaciones" element={<RoleGuard roles={["evaluador", "rrhh", "super_admin"]}><EvaluacionesPage /></RoleGuard>} />

        {/* Candidato */}
        <Route path="/buscar-empleos" element={<RoleGuard roles={["candidato"]}><BuscarEmpleosPage /></RoleGuard>} />
        <Route path="/postulaciones" element={<RoleGuard roles={["candidato"]}><MisPostulacionesPage /></RoleGuard>} />
        <Route path="/mis-tests" element={<RoleGuard roles={["candidato"]}><MisTestsPage /></RoleGuard>} />
        <Route path="/test-perfil" element={<RoleGuard roles={["candidato"]}><TestPerfilPage /></RoleGuard>} />
        <Route path="/induccion" element={<RoleGuard roles={["candidato"]}><InduccionPage /></RoleGuard>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
