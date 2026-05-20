import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/Landing";
import AuthPage from "@/pages/Auth";
import EmpleosPage from "@/pages/Empleos";
import DashboardPage from "@/pages/Dashboard";
import VacantesPage from "@/pages/Vacantes";
import NotFoundPage from "@/pages/NotFound";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/empleos" element={<EmpleosPage />} />

      <Route element={<AuthenticatedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/vacantes" element={<VacantesPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
