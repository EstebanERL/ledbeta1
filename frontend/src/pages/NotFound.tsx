import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gradient">404</h1>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link to="/"><Button>Volver al inicio</Button></Link>
    </div>
  );
}
