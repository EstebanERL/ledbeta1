import { PageHeader, StatCard, Section } from "./shared";
import { Brain, FileText, CheckCircle2, ClipboardList } from "lucide-react";
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const radarData = [
  { skill: "Lógica", A: 82 },
  { skill: "Comunicación", A: 74 },
  { skill: "Liderazgo", A: 68 },
  { skill: "Análisis", A: 88 },
  { skill: "Creatividad", A: 71 },
  { skill: "Trabajo en equipo", A: 79 },
];
const scores = [
  { name: "M. Pérez", score: 92 }, { name: "L. Gómez", score: 86 },
  { name: "A. Ríos", score: 78 }, { name: "C. Díaz", score: 71 },
  { name: "J. Vega", score: 64 },
];

export function EvaluadorDashboard({ name }: { name: string }) {
  return (
    <div>
      <PageHeader
        title={`Hola, ${name}`}
        subtitle="Evaluaciones, pruebas técnicas y resultados psicológicos"
        accent="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Evaluaciones pendientes" value="9" icon={ClipboardList} tone="warning" />
          <StatCard label="Pruebas calificadas" value="142" delta="+24 esta semana" icon={CheckCircle2} tone="success" />
          <StatCard label="Test psicotécnicos" value="58" icon={Brain} tone="primary" />
          <StatCard label="Reportes generados" value="31" icon={FileText} tone="accent" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Perfil promedio de candidatos">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid strokeOpacity={0.3} />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="A" stroke="oklch(0.62 0.16 155)" fill="oklch(0.62 0.16 155)" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Section>
          <Section title="Top candidatos por puntaje">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" stroke="currentColor" fontSize={12} domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" stroke="currentColor" fontSize={12} width={80} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="score" fill="oklch(0.72 0.15 200)" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section title="Cola de evaluaciones">
          <ul className="space-y-3">
            {[
              { c: "Mariana Pérez", v: "Senior Backend", p: 80, t: "Prueba técnica" },
              { c: "Luis Gómez", v: "Diseñador UX", p: 60, t: "Test psicotécnico" },
              { c: "Ana Ríos", v: "Analista Financiero", p: 35, t: "Prueba técnica" },
            ].map((e, i) => (
              <li key={i} className="rounded-lg border p-4 transition hover:bg-muted/40">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{e.c}</div>
                    <div className="text-xs text-muted-foreground">{e.v}</div>
                  </div>
                  <Badge variant="outline">{e.t}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={e.p} className="h-2" />
                  <span className="text-xs font-medium tabular-nums">{e.p}%</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
