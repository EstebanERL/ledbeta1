// ============================================================================
// Diálogo reutilizable: aviso legal antes de postularse.
// Informa al candidato que sus datos públicos (antecedentes, historial legal,
// datos disponibles) podrán ser revisados durante el proceso de evaluación.
//
// Uso (en BuscarEmpleos.tsx o Empleos.tsx):
//
//   import ConfirmarPostulacionDialog from "@/components/ConfirmarPostulacionDialog";
//   const [confirmando, setConfirmando] = useState<V | null>(null);
//
//   // En el botón "Postularme" / "Confirmar postulación":
//   <Button onClick={() => setConfirmando(sel)}>Postularme</Button>
//
//   <ConfirmarPostulacionDialog
//     open={!!confirmando}
//     onOpenChange={(o) => !o && setConfirmando(null)}
//     vacanteTitulo={confirmando?.titulo}
//     loading={applyMut.isPending}
//     onConfirm={() => confirmando && applyMut.mutate(confirmando.id)}
//   />
// ============================================================================
import { useEffect, useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, FileSearch, Scale, Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vacanteTitulo?: string;
  loading?: boolean;
  onConfirm: () => void;
};

export default function ConfirmarPostulacionDialog({
  open, onOpenChange, vacanteTitulo, loading, onConfirm,
}: Props) {
  const [aceptado, setAceptado] = useState(false);

  // Reset cuando se cierra
  useEffect(() => { if (!open) setAceptado(false); }, [open]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-center">
            Antes de postularte
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {vacanteTitulo
              ? <>Estás a punto de postularte a <span className="font-semibold text-foreground">{vacanteTitulo}</span>.</>
              : "Estás a punto de enviar tu postulación."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium text-foreground">
            Al continuar, autorizas que tu información sea revisada como parte del proceso de selección. Esto incluye:
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <FileSearch className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>La consulta de tus <strong>datos públicos disponibles</strong> (perfil profesional, redes profesionales, publicaciones).</span>
            </li>
            <li className="flex items-start gap-2">
              <Scale className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>La revisión de tu <strong>historial de antecedentes penales y datos legales públicos</strong> conforme a la normativa vigente.</span>
            </li>
            <li className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>El uso de esta información <strong>únicamente con fines de evaluación</strong> para esta vacante.</span>
            </li>
          </ul>
        </div>

        <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm">
          <Checkbox
            checked={aceptado}
            onCheckedChange={(v) => setAceptado(v === true)}
            className="mt-0.5"
          />
          <span>
            He leído y acepto que se consulten mis datos públicos y antecedentes
            como parte del proceso de selección.
          </span>
        </label>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!aceptado || loading}
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            className="bg-gradient-primary"
          >
            {loading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando…</>
              : "Acepto y postularme"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
