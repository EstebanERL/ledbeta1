import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  useEventos, useMensajes, useEntrevistasByPostulacion, useAsignacionesByPostulacion,
  ESTADO_LABEL, TIMELINE_ORDER, roleBadgeColor, ROLE_LABEL,
} from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  Loader2, MessageSquare, Send, CalendarClock, ClipboardCheck, Video, MapPin, Phone,
} from "lucide-react";
import { toast } from "sonner";

/** Detalle compartido de proceso: timeline, entrevistas, tests asignados y chat. */
export function ProcesoDetalle({
  id,
  titulo,
  subtitle,
}: {
  id: string;
  titulo?: string;
  subtitle?: string;
}) {
  const { data: eventos = [], isLoading } = useEventos(id);
  const { data: entrevistas = [] } = useEntrevistasByPostulacion(id);
  const { data: asignaciones = [] } = useAsignacionesByPostulacion(id);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{titulo}</SheetTitle>
        <SheetDescription>{subtitle ?? "Timeline, entrevistas, tests y mensajes del proceso"}</SheetDescription>
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
                <li key={a.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{a.titulo}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">{a.tipo}</Badge>
                      <Badge variant="secondary" className="capitalize">{a.estado}</Badge>
                    </div>
                  </div>
                  {a.score != null && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Puntaje: <span className="font-medium text-foreground">{a.score}/{a.maxScore ?? "—"}</span>
                    </div>
                  )}
                  {a.observaciones && <p className="mt-1 text-xs text-muted-foreground">{a.observaciones}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <ChatPanel postulacionId={id} />
      </div>
    </>
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
