import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PREGUNTAS_PERFIL } from "@/lib/profile-test-questions";
import { useMyProfileTest } from "@/lib/queries";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, CheckCircle2, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const ESCALA = [
  { v: 1, label: "Totalmente en desacuerdo" },
  { v: 2, label: "En desacuerdo" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "De acuerdo" },
  { v: 5, label: "Totalmente de acuerdo" },
];

export default function TestPerfilPage() {
  const { data: existing, isLoading } = useMyProfileTest();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [retomar, setRetomar] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      const respuestas = PREGUNTAS_PERFIL.map((q) => ({
        id: q.id, dimension: q.dimension, valor: answers[q.id],
      })).filter((r) => r.valor);
      return (await api.post("/profile-tests", { respuestas })).data;
    },
    onSuccess: () => {
      toast.success("Test enviado correctamente");
      qc.invalidateQueries({ queryKey: ["profile-test"] });
      setRetomar(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo guardar"),
  });

  if (isLoading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const showResults = existing && !retomar;
  const responded = Object.keys(answers).length;

  return (
    <div>
      <PageHeader title="Test de perfil profesional" subtitle="15 afirmaciones · ~5 minutos" accent="from-violet-500 via-indigo-500 to-blue-500" />
      <div className="space-y-6 p-6 md:p-10">
        {showResults ? (
          <Section title="Tus resultados" action={
            <Button size="sm" variant="outline" onClick={() => setRetomar(true)}><RotateCcw className="mr-1 h-3 w-3" />Volver a hacer</Button>
          }>
            <div className="mb-4 rounded-xl border bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
                <Brain className="h-4 w-4" /> {existing.perfil}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{existing.resumen}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(existing.scores).map(([k, v]) => (
                <div key={k} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">{k}</span>
                    <Badge variant="secondary">{v}%</Badge>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        ) : (
          <Section title={`Cuestionario · ${responded}/${PREGUNTAS_PERFIL.length} respondidas`}>
            <div className="space-y-5">
              {PREGUNTAS_PERFIL.map((q, i) => (
                <div key={q.id} className="rounded-xl border p-4">
                  <p className="text-sm font-medium">{i + 1}. {q.texto}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ESCALA.map((e) => (
                      <button key={e.v} type="button"
                        onClick={() => setAnswers({ ...answers, [q.id]: e.v })}
                        className={`rounded-full border px-3 py-1 text-xs transition ${
                          answers[q.id] === e.v
                            ? "border-violet-500 bg-violet-500/10 text-violet-600 font-semibold"
                            : "border-muted-foreground/20 text-muted-foreground hover:bg-muted"
                        }`}
                      >{e.v} · {e.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => mut.mutate()} disabled={mut.isPending || responded < PREGUNTAS_PERFIL.length} className="bg-gradient-primary">
                {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Enviar respuestas
              </Button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
