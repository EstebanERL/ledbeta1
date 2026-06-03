import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useMisAsignacionesTest, calcularResumenAsignacion, APROBACION_PCT } from "@/lib/queries";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ClipboardCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

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
                <li key={a.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{a.titulo}</div>
                      <div className="text-xs text-muted-foreground">{a.vacanteTitulo} · {a.tipo}</div>
                    </div>
                    <Badge variant="outline">{a.estado}</Badge>
                  </div>
                  {a.estado === "pendiente" || a.estado === "en_curso" ? (
                    openId === a.id ? (
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
                        <Button onClick={() => submit.mutate(a.id)} disabled={submit.isPending} className="bg-gradient-primary">
                          {submit.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Enviar respuestas
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpenId(a.id)}>Responder</Button>
                    )
                  ) : (
                    (() => {
                      const r = calcularResumenAsignacion(a);
                      return (
                        <div className="mt-3 space-y-2">
                          {r.tieneClave ? (
                            <>
                              <div className="flex items-center justify-between">
                                <div className="text-sm">
                                  <span className="text-2xl font-bold">{r.pct}%</span>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {r.score}/{r.max} pts
                                  </span>
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
                      );
                    })()
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
