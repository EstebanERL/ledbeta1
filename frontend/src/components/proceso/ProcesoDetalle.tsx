import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  useEventos, useMensajes, useEntrevistasByPostulacion, useAsignacionesByPostulacion,
  ESTADO_LABEL, TIMELINE_ORDER, roleBadgeColor, ROLE_LABEL,
  calcularResumenAsignacion, APROBACION_PCT, useCompatibilidad,
} from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Loader2, MessageSquare, Send, CalendarClock, ClipboardCheck, Video, MapPin, Phone,
  CheckCircle2, XCircle, ChevronDown, FileText, FileDown, Sparkles, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { exportProcesoPDF, exportEvaluacionPDF } from "@/lib/export-utils";
import { ESTADO_LABEL as _EST } from "@/lib/queries";


/** Detalle compartido de proceso: timeline, entrevistas, tests asignados y chat. */
export function ProcesoDetalle({
  id,
  titulo,
  subtitle,
  candidato,
  vacante,
  postulacion,
}: {
  id: string;
  titulo?: string;
  subtitle?: string;
  candidato?: { fullName: string; email: string; phone?: string | null; location?: string | null; headline?: string | null };
  vacante?: { titulo: string; departamento: string; modalidad: string; ubicacion?: string };
  postulacion?: { id: string; estado: string; createdAt: string; notas?: string | null };
}) {
  const { user } = useAuth();
  const { data: eventos = [], isLoading } = useEventos(id);
  const { data: entrevistas = [] } = useEntrevistasByPostulacion(id);
  const { data: asignaciones = [] } = useAsignacionesByPostulacion(id);
  const { data: mensajes = [] } = useMensajes(id);
  const canDownload = user?.role === "super_admin" || user?.role === "rrhh";

  const handleDownload = () => {
    if (!candidato || !vacante || !postulacion) {
      toast.error("Datos del proceso incompletos");
      return;
    }
    exportProcesoPDF({
      postulacion, candidato, vacante,
      eventos: eventos as any, entrevistas: entrevistas as any,
      asignaciones: asignaciones as any, mensajes: mensajes as any,
      estadoLabel: _EST,
    });
  };

  return (
    <>
      <SheetHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <SheetTitle>{titulo}</SheetTitle>
            <SheetDescription>{subtitle ?? "Timeline, entrevistas, tests y mensajes del proceso"}</SheetDescription>
          </div>
          {canDownload && candidato && vacante && postulacion && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <FileDown className="mr-1 h-4 w-4" /> PDF
            </Button>
          )}
        </div>
      </SheetHeader>


      <div className="mt-6 space-y-6">
        <section>
          <h4 className="mb-3 text-sm font-semibold">Línea de tiempo</h4>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <Timeline eventos={eventos} />
          )}
        </section>

        {entrevistas.length > 0 && (
          <section>
            <h4 className="mb-3 flex items-center gap-1 text-sm font-semibold">
              <CalendarClock className="h-4 w-4" /> Entrevistas programadas
            </h4>
            <ul className="space-y-2">
              {entrevistas.map((e: any) => (
                <li key={e.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{new Date(e.programadaPara).toLocaleString()}</span>
                    <Badge variant="outline" className="capitalize">{e.modalidad}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {e.modalidad === "virtual" && e.link && (
                      <a href={e.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Video className="h-3 w-3" /> Unirse
                      </a>
                    )}
                    {e.modalidad === "presencial" && e.ubicacion && (
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.ubicacion}</span>
                    )}
                    {e.modalidad === "telefonica" && e.ubicacion && (
                      <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {e.ubicacion}</span>
                    )}
                    <Badge variant="secondary" className="capitalize">{e.estado}</Badge>
                  </div>
                  {e.notas && <p className="mt-2 text-xs text-muted-foreground">{e.notas}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {asignaciones.length > 0 && (
          <section>
            <h4 className="mb-3 flex items-center gap-1 text-sm font-semibold">
              <ClipboardCheck className="h-4 w-4" /> Tests asignados
            </h4>
            <ul className="space-y-2">
              {asignaciones.map((a: any) => (
                <AsignacionCard key={a.id} a={a} />
              ))}
            </ul>
          </section>
        )}

        <CompatibilidadPanel postulacionId={id} />

        <ChatPanel postulacionId={id} />
      </div>
    </>
  );
}

function CompatibilidadPanel({ postulacionId }: { postulacionId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canSee = user?.role === "super_admin" || user?.role === "rrhh";
  const { data, isLoading } = useCompatibilidad(postulacionId, canSee);
  const analizar = useMutation({
    mutationFn: async () =>
      (await api.post(`/postulaciones/${postulacionId}/compatibilidad`)).data.compatibilidad,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["compatibilidad", postulacionId] });
      toast.success("Análisis de compatibilidad generado");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.error ?? "No se pudo generar el análisis"),
  });
  if (!canSee) return null;

  const score = data?.score ?? 0;
  const tone =
    score >= 75 ? "text-emerald-600" :
    score >= 50 ? "text-amber-600" : "text-rose-600";

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-violet-500" /> Compatibilidad IA
        </h4>
        <Button
          size="sm"
          variant={data ? "outline" : "default"}
          onClick={() => analizar.mutate()}
          disabled={analizar.isPending}
        >
          {analizar.isPending
            ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analizando…</>
            : data
              ? <><RefreshCw className="mr-1 h-4 w-4" /> Re-analizar</>
              : <><Sparkles className="mr-1 h-4 w-4" /> Analizar compatibilidad con IA</>}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : !data ? (
        <p className="text-xs text-muted-foreground">
          Aún no se ha generado análisis. Genera uno para evaluar la afinidad entre el candidato y la vacante.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className={`text-3xl font-bold ${tone}`}>{score}%</div>
            <div className="flex-1">
              <Progress value={score} className="h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                Generado el {new Date(data.generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {data.resumen && <p className="text-sm">{data.resumen}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-emerald-600">Fortalezas</div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {data.fortalezas.length === 0 && <li>—</li>}
                {data.fortalezas.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-rose-600">Aspectos a mejorar</div>
              <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-0.5">
                {data.debilidades.length === 0 && <li>—</li>}
                {data.debilidades.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          </div>
          {data.opinion && (
            <div className="rounded-md bg-muted/50 p-3 text-xs">
              <span className="font-semibold">Opinión: </span>{data.opinion}
            </div>
          )}
          {data.recomendacion && (
            <div className="rounded-md border-l-4 border-violet-500 bg-violet-500/5 p-3 text-sm">
              <span className="font-semibold">Recomendación: </span>{data.recomendacion}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AsignacionCard({ a }: { a: any }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [obs, setObs] = useState(a.observaciones ?? "");
  const puedeCalificar = user?.role && ["evaluador", "rrhh", "super_admin"].includes(user.role);
  const canDownload = user?.role === "super_admin" || user?.role === "rrhh";
  const r = calcularResumenAsignacion(a);
  const completado = r.completado;

  const downloadEval = () => {
    exportEvaluacionPDF({
      candidato: { fullName: a.candidatoNombre ?? "Candidato", email: a.candidatoEmail ?? "" },
      test: { titulo: a.titulo, tipo: a.tipo, categoria: a.categoria },
      asignacion: a,
    });
  };

  const calificar = useMutation({

    mutationFn: async () =>
      (await api.patch(`/test-asignaciones/${a.id}/calificar`, { observaciones: obs })).data,
    onSuccess: () => {
      toast.success("Observaciones guardadas");
      qc.invalidateQueries({ queryKey: ["test-asignaciones", "post", a.postulacion_id ?? a.postulacionId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  return (
    <li className="rounded-lg border p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{a.titulo}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">{a.tipo}</Badge>
          <Badge variant="secondary" className="capitalize">{a.estado}</Badge>
        </div>
      </div>

      {completado && r.tieneClave && (
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{r.pct}% · {r.score}/{r.max} pts</span>
            <Badge variant="outline" className={r.aprobado
              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
              : "bg-rose-500/15 text-rose-700 border-rose-500/30"}>
              {r.aprobado
                ? <><CheckCircle2 className="mr-1 inline h-3 w-3" /> Aprobado</>
                : <><XCircle className="mr-1 inline h-3 w-3" /> Reprobado</>}
            </Badge>
          </div>
          <Progress value={r.pct} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">Umbral {APROBACION_PCT}%</p>
        </div>
      )}
      {completado && !r.tieneClave && (
        <p className="mt-2 text-xs text-muted-foreground">
          Test cualitativo: las respuestas deben revisarse manualmente.
        </p>
      )}

      {completado && puedeCalificar && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button size="sm" variant="ghost" className="mt-2 h-7 px-2 text-xs">
              <FileText className="mr-1 h-3 w-3" />
              {open ? "Ocultar respuestas" : "Ver respuestas del candidato"}
              <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {(a.preguntas ?? []).map((q: any, i: number) => (
              <PreguntaResultado key={q.id} q={q} resp={a.respuestas?.[q.id]} idx={i} />
            ))}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-medium">Observaciones del evaluador</label>
              <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)}
                placeholder="Comentarios sobre el desempeño del candidato..." />
              <Button size="sm" onClick={() => calificar.mutate()} disabled={calificar.isPending}>
                {calificar.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                Guardar observaciones
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {!completado && a.observaciones && (
        <p className="mt-1 text-xs text-muted-foreground">{a.observaciones}</p>
      )}
    </li>
  );
}

function PreguntaResultado({ q, resp, idx }: { q: any; resp: any; idx: number }) {
  const correctas = (q.opciones ?? []).filter((o: any) => o.correcta).map((o: any) => String(o.id));
  const tieneClave = correctas.length > 0;
  const sel = resp == null ? [] : (Array.isArray(resp) ? resp.map(String) : [String(resp)]);
  const correcto = tieneClave && JSON.stringify([...correctas].sort()) === JSON.stringify([...sel].sort());
  const label = (id: string) => q.opciones?.find((o: any) => String(o.id) === id)?.texto ?? id;
  return (
    <div className={`rounded-md border p-2 ${tieneClave ? (correcto ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5") : "bg-muted/20"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium">{idx + 1}. {q.enunciado}</p>
        {tieneClave && (correcto
          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
          : <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />)}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        <span className="font-semibold">Respuesta:</span>{" "}
        {sel.length === 0 ? <em>(sin responder)</em> : q.tipo === "texto" ? sel[0] : sel.map(label).join(", ")}
      </div>
      {tieneClave && (
        <div className="text-[11px] text-emerald-700">
          <span className="font-semibold">Correcta:</span> {correctas.map(label).join(", ")}
        </div>
      )}
      {q.explicacion && (
        <p className="mt-1 text-[11px] italic text-muted-foreground">💡 {q.explicacion}</p>
      )}
    </div>
  );
}

export function Timeline({ eventos }: { eventos: any[] }) {
  const ultimoEstado = [...eventos].reverse().find((e) => e.tipo === "estado")?.estado;
  return (
    <ol className="relative space-y-3 border-l-2 border-muted pl-4">
      {TIMELINE_ORDER.map((est) => {
        const pasado = eventos.some((e) => e.estado === est);
        const actual = est === ultimoEstado;
        return (
          <li key={est} className="relative">
            <span
              className={`absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 ${
                actual ? "bg-primary border-primary ring-4 ring-primary/20"
                  : pasado ? "bg-emerald-500 border-emerald-500"
                  : "bg-background border-muted-foreground/30"
              }`}
            />
            <div className={`text-sm ${actual ? "font-semibold" : pasado ? "text-foreground" : "text-muted-foreground"}`}>
              {ESTADO_LABEL[est] ?? est}
            </div>
            {eventos.filter((e) => e.estado === est).map((e) => (
              <div key={e.id} className="text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()} {e.nota && <>· {e.nota}</>}
              </div>
            ))}
          </li>
        );
      })}
      {eventos.filter((e) => e.tipo === "nota").map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[1.4rem] top-1 h-3 w-3 rounded-full border-2 border-amber-500 bg-amber-500/30" />
          <div className="text-sm">Nota del equipo</div>
          <div className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()} · {e.nota}</div>
        </li>
      ))}
    </ol>
  );
}

export function ChatPanel({ postulacionId, readOnly = false }: { postulacionId: string; readOnly?: boolean }) {
  const { data: msgs = [] } = useMensajes(postulacionId);
  const [txt, setTxt] = useState("");
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs.length]);

  const send = useMutation({
    mutationFn: async () => (await api.post(`/postulaciones/${postulacionId}/mensajes`, { mensaje: txt })).data,
    onSuccess: () => { setTxt(""); qc.invalidateQueries({ queryKey: ["mensajes", postulacionId] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo enviar"),
  });

  return (
    <section>
      <h4 className="mb-3 flex items-center gap-1 text-sm font-semibold">
        <MessageSquare className="h-4 w-4" /> Conversación del proceso
      </h4>
      <div
        ref={scrollRef}
        className="max-h-80 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3"
      >
        {msgs.length === 0
          ? <p className="py-4 text-center text-xs text-muted-foreground">Aún no hay mensajes en este proceso.</p>
          : msgs.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg p-2 text-sm ${m.autorRol === "sistema" ? "border border-dashed bg-muted/40" : "bg-card border"}`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{m.autorNombre}</span>
                  <Badge variant="outline" className={`${roleBadgeColor(m.autorRol)} px-1.5 py-0 text-[10px]`}>
                    {ROLE_LABEL[m.autorRol] ?? m.autorRol}
                  </Badge>
                </div>
                <span className="text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-line">{m.mensaje}</p>
            </div>
          ))}
      </div>
      {!readOnly && (
        <div className="mt-2 flex gap-2">
          <Input value={txt} onChange={(e) => setTxt(e.target.value)}
            placeholder="Escribe un mensaje…"
            onKeyDown={(e) => e.key === "Enter" && txt.trim() && send.mutate()} />
          <Button onClick={() => send.mutate()} disabled={!txt.trim() || send.isPending}>
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </section>
  );
}
