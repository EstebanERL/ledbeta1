import {
  useMyPostulaciones, useEventos, useMensajes, estadoColor, ESTADO_LABEL, TIMELINE_ORDER,
} from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { FileText, Briefcase, CheckCircle2, Loader2, ArrowRight, MessageSquare, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function MisPostulacionesPage() {
  const { data, isLoading } = useMyPostulaciones();
  const items = data ?? [];
  const [openId, setOpenId] = useState<string | null>(null);
  const stats = {
    total: items.length,
    activas: items.filter((p) => !["rechazada", "contratada"].includes(p.estado)).length,
    contratada: items.filter((p) => p.estado === "contratada").length,
  };

  return (
    <div>
      <PageHeader title="Mis postulaciones" subtitle="Sigue el estado de cada proceso en tiempo real" accent="from-orange-500 via-pink-500 to-rose-500" />
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
          {openId && <DetalleProceso id={openId} titulo={items.find((p) => p.id === openId)?.titulo} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetalleProceso({ id, titulo }: { id: string; titulo?: string }) {
  const { data: eventos = [], isLoading } = useEventos(id);
  return (
    <>
      <SheetHeader>
        <SheetTitle>{titulo}</SheetTitle>
        <SheetDescription>Timeline y mensajes del proceso</SheetDescription>
      </SheetHeader>

      <div className="mt-6 space-y-6">
        <div>
          <h4 className="mb-3 text-sm font-semibold">Línea de tiempo</h4>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <Timeline eventos={eventos} />
          )}
        </div>
        <ChatPanel postulacionId={id} />
      </div>
    </>
  );
}

function Timeline({ eventos }: { eventos: any[] }) {
  // Determina el estado actual: último evento con tipo='estado'
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
              <div key={e.id} className="ml-0 text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()} {e.nota && <>· {e.nota}</>}
              </div>
            ))}
          </li>
        );
      })}
      {/* Notas sin estado */}
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

function ChatPanel({ postulacionId }: { postulacionId: string }) {
  const { data: msgs = [] } = useMensajes(postulacionId);
  const [txt, setTxt] = useState("");
  const qc = useQueryClient();
  const send = useMutation({
    mutationFn: async () => (await api.post(`/postulaciones/${postulacionId}/mensajes`, { mensaje: txt })).data,
    onSuccess: () => { setTxt(""); qc.invalidateQueries({ queryKey: ["mensajes", postulacionId] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "No se pudo enviar"),
  });

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-1 text-sm font-semibold"><MessageSquare className="h-4 w-4" /> Mensajes</h4>
      <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-muted/20 p-3">
        {msgs.length === 0
          ? <p className="py-4 text-center text-xs text-muted-foreground">Aún no hay mensajes en este proceso.</p>
          : msgs.map((m) => (
            <div key={m.id} className="rounded-lg bg-card p-2 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{m.autorNombre}</span>
                <span>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1 whitespace-pre-line">{m.mensaje}</p>
            </div>
          ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Input value={txt} onChange={(e) => setTxt(e.target.value)}
          placeholder="Escribe un mensaje al equipo de reclutamiento…"
          onKeyDown={(e) => e.key === "Enter" && txt.trim() && send.mutate()} />
        <Button onClick={() => send.mutate()} disabled={!txt.trim() || send.isPending}>
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
