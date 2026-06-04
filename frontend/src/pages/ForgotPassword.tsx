import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al solicitar el cambio");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <Link to="/auth" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
        </Link>
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">TalentForge</span>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold">Revisa tu correo</h1>
            <p className="text-sm text-muted-foreground">
              Si <strong>{email}</strong> corresponde a una cuenta registrada, te hemos enviado un
              enlace para restablecer tu contraseña. Este enlace es válido por <strong>60 minutos</strong>.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/auth">Volver al inicio de sesión</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Recupera tu contraseña</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para crear una nueva.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com" className="pl-9" maxLength={255} />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="h-11 w-full bg-gradient-primary font-semibold">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace de recuperación"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
