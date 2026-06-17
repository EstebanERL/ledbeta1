import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMisAsignacionesTest, calcularResumenAsignacion, APROBACION_PCT } from "@/lib/queries";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck, Loader2, CheckCircle2, XCircle, Sparkles, BookOpen, Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

/* ============================================================================
 * Utilidad: análisis IA-lite (heurístico, sin tocar backend)
 *   Detecta preguntas falladas (cuando la pregunta tiene clave correcta)
 *   y produce un mensaje alentador con guía de refuerzo.
 * ========================================================================== */
function analizarFallos(a: any) {
  const preguntas: any[] = a.preguntas ?? [];
  const respuestas: Record<string, any> = a.respuestas ?? {};
  const fallos: { enunciado: string; correcta?: string; tuya?: string }[] = [];

  for (const q of preguntas) {
    const correctas = (q.opciones ?? []).filter((o: any) => o.correcta);
    if (correctas.length === 0) continue; // sin clave → no se evalúa automáticamente
    const r = respuestas[q.id];
    const seleccion = Array.isArray(r) ? r : r ? [r] : [];
    const idsCorrectos = correctas.map((o: any) => o.id).sort().join("|");
    const idsElegidos = [...seleccion].sort().join("|");
    if (idsCorrectos !== idsElegidos) {
      fallos.push({
        enunciado: q.enunciado,
        correcta: correctas.map((o: any) => o.texto).join(", "),
        tuya: seleccion
          .map((id: string) => (q.opciones ?? []).find((o: any) => o.id === id)?.texto)
          .filter(Boolean)
          .join(", "),
      });
    }
  }
  return fallos;
}

function mensajeAlentador(pct: number, totalFallos: number) {
  if (pct >= APROBACION_PCT - 10) {
    return "¡Estuviste muy cerca! Con un repaso enfocado en los temas marcados abajo, en tu próximo intento puedes superar el umbral sin problema.";
  }
  if (totalFallos <= 3) {
    return "Buen esfuerzo. Identificamos solo algunos puntos a reforzar — son totalmente alcanzables con un poco de práctica dirigida.";
  }
  return "No te desanimes: cada intento es aprendizaje. Tómate unos días para repasar los temas listados y vuelve a postularte cuando te sientas más seguro/a.";
}

function guiaDeRefuerzo(enunciado: string): string {
  const t = enunciado.toLowerCase();
  if (/react|jsx|hook|component/.test(t)) return "Repasa hooks (useState, useEffect), props y ciclo de vida en la documentación oficial de React.";
  if (/sql|consulta|base de datos|join/.test(t)) return "Practica consultas SQL (JOIN, GROUP BY, subqueries) en plataformas como SQLZoo o HackerRank.";
  if (/javascript|js|promesa|async|await/.test(t)) return "Refuerza JavaScript moderno: promesas, async/await, scope y closures en MDN Web Docs.";
  if (/algoritmo|complejidad|big o/.test(t)) return "Practica algoritmos y estructuras de datos en LeetCode o ejercicios de Big-O.";
  if (/css|estilo|flex|grid/.test(t)) return "Refuerza CSS moderno: Flexbox y Grid con guías interactivas (CSS Tricks, MDN).";
  if (/comunic|trabajo en equipo|liderazgo|soft/.test(t)) return "Trabaja habilidades blandas con lecturas sobre comunicación efectiva y trabajo colaborativo.";
  if (/ingl[eé]s|english/.test(t)) return "Practica inglés técnico con podcasts y lectura de documentación en su idioma original.";
  return "Investiga este tema con fuentes oficiales y haz ejercicios prácticos antes de tu próximo intento.";
}

export default function MisTestsPage() {
  const { data: items = [], isLoading } = useMisAsignacionesTest();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [resp, setResp] = useState<Record<string, any>>({});

  const submit = useMutation({
    mutationFn: async (id: string) => (await api.post(`/test-asignaciones/${id}/responder`, { respuestas: resp })).data,
    onSuccess: () => {
      toast.success("Respuestas enviadas");
      qc.invalidateQueries({ queryKey: ["test-asignaciones"] });
      setOpenId(null); setResp({});
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  return (
    <div>
      <PageHeader title="Mis tests asignados" subtitle="Completa los tests que el equipo evaluador te asignó" accent="from-orange-500 via-pink-500 to-rose-500" />
      <div className="space-y-6 p-6 md:p-10">
        <Section title={`${items.length} test(s) asignados`}>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              <ClipboardCheck className="mx-auto mb-2 h-6 w-6 opacity-50" />
              No tienes tests pendientes por responder.
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((a: any) => (
                <AsignacionItem
                  key={a.id}
                  a={a}
                  open={openId === a.id}
                    setOpen={(v: boolean) => setOpenId(v ? a.id : null)}                  resp={resp}
                  setResp={setResp}
                  submitting={submit.isPending}
                  onSubmit={() => submit.mutate(a.id)}
                />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function AsignacionItem({ a, open, setOpen, resp, setResp, submitting, onSubmit }: any) {
  const r = calcularResumenAsignacion(a);
  const fallos = useMemo(() => (r.completado ? analizarFallos(a) : []), [a, r.completado]);
  const noAprobado = r.tieneClave && r.completado && r.aprobado === false;

  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-medium">{a.titulo}</div>
          <div className="text-xs text-muted-foreground">{a.vacanteTitulo} · {a.tipo}</div>
        </div>
        <Badge variant="outline">{a.estado}</Badge>
      </div>

      {a.estado === "pendiente" || a.estado === "en_curso" ? (
        open ? (
          <div className="mt-4 space-y-4">
            {(a.preguntas || []).map((q: any, i: number) => (
              <div key={q.id} className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-medium">{i + 1}. {q.enunciado}</p>
                {q.tipo === "texto" ? (
                  <Textarea className="mt-2" rows={2}
                    onChange={(e) => setResp({ ...resp, [q.id]: e.target.value })} />
                ) : (
                  <div className="mt-2 space-y-1">
                    {(q.opciones || []).map((o: any) => (
                      <label key={o.id} className="flex items-center gap-2 text-sm">
                        <input
                          type={q.tipo === "multi" ? "checkbox" : "radio"}
                          name={q.id}
                          onChange={(e) => {
                            if (q.tipo === "multi") {
                              const arr = Array.isArray(resp[q.id]) ? resp[q.id] : [];
                              setResp({ ...resp, [q.id]: e.target.checked ? [...arr, o.id] : arr.filter((x: string) => x !== o.id) });
                            } else {
                              setResp({ ...resp, [q.id]: o.id });
                            }
                          }}
                        />{o.texto}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button onClick={onSubmit} disabled={submitting} className="bg-gradient-primary">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Enviar respuestas
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen(true)}>Responder</Button>
        )
      ) : (
        <div className="mt-3 space-y-3">
          {r.tieneClave ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-2xl font-bold">{r.pct}%</span>
                  <span className="ml-2 text-xs text-muted-foreground">{r.score}/{r.max} pts</span>
                </div>
                <Badge variant="outline" className={r.aprobado
                  ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-700 border-rose-500/30"}>
                  {r.aprobado
                    ? <><CheckCircle2 className="mr-1 inline h-3 w-3" /> Aprobado</>
                    : <><XCircle className="mr-1 inline h-3 w-3" /> Reprobado</>}
                </Badge>
              </div>
              <Progress value={r.pct} className="h-2" />
              <p className="text-xs text-muted-foreground">Umbral de aprobación: {APROBACION_PCT}%</p>

              {/* === Mensaje alentador IA cuando no se aprobó === */}
              {noAprobado && (
                <div className="mt-2 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-blue-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
                    <Sparkles className="h-4 w-4" /> Mensaje de la IA para ti
                  </div>
                  <p className="mt-1 text-sm text-foreground/90">
                    {mensajeAlentador(r.pct, fallos.length)}
                  </p>

                  {fallos.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-violet-700/80">
                        <BookOpen className="h-3.5 w-3.5" /> Puntos a reforzar ({fallos.length})
                      </div>
                      <ul className="mt-2 space-y-2">
                        {fallos.slice(0, 6).map((f, i) => (
                          <li key={i} className="rounded-lg border border-violet-500/20 bg-background/60 p-3 text-sm">
                            <p className="font-medium">{i + 1}. {f.enunciado}</p>
                            {f.correcta && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                Respuesta esperada: <span className="font-medium text-emerald-600">{f.correcta}</span>
                              </p>
                            )}
                            <p className="mt-1 flex items-start gap-1 text-xs text-violet-700">
                              <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" />
                              <span>{guiaDeRefuerzo(f.enunciado)}</span>
                            </p>
                          </li>
                        ))}
                      </ul>
                      {fallos.length > 6 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          + {fallos.length - 6} punto(s) adicionales por reforzar.
                        </p>
                      )}
                    </div>
                  )}

                  <p className="mt-4 text-xs italic text-muted-foreground">
                    💪 ¡No te rindas! Vuelve a postularte cuando hayas reforzado estos temas. Cada intento te acerca más a tu objetivo.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-600" />
              Respuestas registradas. Un evaluador revisará tus resultados.
            </div>
          )}
          {a.observaciones && (
            <p className="rounded-md border-l-2 border-primary bg-muted/30 p-2 text-xs italic">
              {a.observaciones}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
