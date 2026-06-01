import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useMyPostulaciones, estadoColor, ESTADO_LABEL,
} from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent,
} from "@/components/ui/sheet";
import { FileText, Briefcase, CheckCircle2, Loader2, ArrowRight, Clock } from "lucide-react";
import { ProcesoDetalle } from "@/components/proceso/ProcesoDetalle";

export default function MisPostulacionesPage() {
  const { data, isLoading } = useMyPostulaciones();
  const items = data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const stats = {
    total: items.length,
    activas: items.filter((p) => !["rechazada", "contratada"].includes(p.estado)).length,
    contratada: items.filter((p) => p.estado === "contratada").length,
  };

  const open = items.find((p) => p.id === openId);

  return (
    <div>
      <PageHeader title="Mis postulaciones" subtitle="Sigue el estado de cada proceso en tiempo real"
        accent="from-orange-500 via-pink-500 to-rose-500" />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total" value={String(stats.total)} icon={FileText} tone="primary" />
          <StatCard label="Activas" value={String(stats.activas)} icon={Briefcase} tone="accent" />
          <StatCard label="Contratado" value={String(stats.contratada)} icon={CheckCircle2} tone="success" />
        </div>

        <Section title="Historial" action={
          <Button asChild size="sm" variant="outline"><Link to="/buscar-empleos">Ver empleos <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
        }>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No tienes postulaciones aún. <Link to="/buscar-empleos" className="text-primary hover:underline">Explora empleos</Link>
            </div>
          ) : (
            <ul className="divide-y">
              {items.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium">{p.titulo}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.departamento} · {p.modalidad} · {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={estadoColor(p.estado)}>{ESTADO_LABEL[p.estado] ?? p.estado}</Badge>
                    <Button size="sm" variant="outline" onClick={() => setOpenId(p.id)}>
                      <Clock className="mr-1 h-3 w-3" />Detalle
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {openId && <ProcesoDetalle id={openId} titulo={open?.titulo} subtitle={`${open?.departamento ?? ""} · ${open?.modalidad ?? ""}`} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
