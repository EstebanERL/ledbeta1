import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Lock, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setValid(false); return; }
    api.get(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => setValid(!!r.data?.valid))
      .catch(() => setValid(false));
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) return toast.error("Mínimo 8 caracteres");
    if (pwd !== pwd2) return toast.error("Las contraseñas no coinciden");
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password: pwd });
      setDone(true);
      setTimeout(() => navigate("/auth"), 2500);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al restablecer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">TalentForge</span>
        </div>

        {valid === null && (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}
        {valid === false && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold">Enlace inválido o expirado</h1>
            <p className="text-sm text-muted-foreground">
              El enlace de recuperación no es válido. Solicita uno nuevo.
            </p>
            <Button asChild className="w-full bg-gradient-primary">
              <Link to="/forgot-password">Solicitar nuevo enlace</Link>
            </Button>
          </div>
        )}
        {valid && done && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold">Contraseña actualizada</h1>
            <p className="text-sm text-muted-foreground">Te estamos redirigiendo al inicio de sesión…</p>
          </div>
        )}
        {valid && !done && (
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Crea tu nueva contraseña</h1>
              <p className="mt-1 text-sm text-muted-foreground">Elige una contraseña segura de al menos 8 caracteres.</p>
            </div>
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" required minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" required minLength={8} value={pwd2} onChange={(e) => setPwd2(e.target.value)} className="pl-9" />
              </div>
            </div>
            <Button type="submit" disabled={busy} className="h-11 w-full bg-gradient-primary font-semibold">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
