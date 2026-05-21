import { PageHeader, Section, StatCard } from "@/components/dashboards/shared";
import { GraduationCap, BookOpen, Award, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const modulos = [
  { t: "Bienvenida e historia de la empresa", d: "15 min", done: false },
  { t: "Políticas internas y código de conducta", d: "25 min", done: false },
  { t: "Seguridad y salud en el trabajo", d: "20 min", done: false },
  { t: "Herramientas y stack tecnológico", d: "30 min", done: false },
  { t: "Cultura, valores y beneficios", d: "10 min", done: false },
];

export default function InduccionPage() {
  const completados = modulos.filter((m) => m.done).length;
  const pct = Math.round((completados / modulos.length) * 100);

  return (
    <div>
      <PageHeader
        title="Inducción"
        subtitle="Tu camino de incorporación a la empresa"
        accent="from-orange-500 via-pink-500 to-rose-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Módulos" value={`${completados}/${modulos.length}`} icon={BookOpen} tone="primary" />
          <StatCard label="Progreso" value={`${pct}%`} icon={GraduationCap} tone="accent" />
          <StatCard label="Certificación" value={pct === 100 ? "Lista" : "Pendiente"} icon={Award} tone="success" />
        </div>

        <Section title="Tu progreso">
          <Progress value={pct} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            Disponible una vez seas contratado. Pregunta a RRHH para activar tu inducción.
          </p>
        </Section>

        <Section title="Módulos del programa">
          <ul className="space-y-3">
            {modulos.map((m, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <div className="font-medium">{i + 1}. {m.t}</div>
                  <div className="text-xs text-muted-foreground">Duración: {m.d}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.done ? "default" : "secondary"}>{m.done ? "Completado" : "Pendiente"}</Badge>
                  <Button size="sm" variant="outline" disabled={!m.done && i > 0}>
                    <Play className="mr-1 h-3 w-3" /> Iniciar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
