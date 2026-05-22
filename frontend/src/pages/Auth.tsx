import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export default function AuthPage() {
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const initialTab = params.get("tab") === "register" ? "register" : "login";

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [loading, user, navigate]);

  return (
    <div className="relative grid min-h-screen overflow-hidden md:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute inset-0 [background:radial-gradient(circle_at_30%_20%,oklch(0.7_0.18_220_/_0.35),transparent_50%)]" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">TalentForge</span>
        </Link>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight">
            Crea tu perfil profesional y postula a las mejores vacantes.
          </h2>
          <p className="text-white/75">
            Reclutamiento, evaluaciones, pruebas técnicas y reportes en un panel seguro.
          </p>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            <ShieldCheck className="mb-2 h-5 w-5 text-white" />
            Los accesos administrativos (RRHH, Evaluador, Super Admin) sólo se crean desde el panel del Super Administrador.
          </div>
        </div>
        <div className="relative text-xs text-white/50">© {new Date().getFullYear()} TalentForge</div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 md:p-12">
        <div className="w-full max-w-md">
          <Tabs defaultValue={initialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Crear cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6"><LoginForm /></TabsContent>
            <TabsContent value="register" className="mt-6"><RegisterForm /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accede a tu panel</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Nombre muy corto").max(100),
  email: z.string().trim().email("Correo inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ fullName, email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await register(parsed.data);
      toast.success("¡Cuenta de candidato creada!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al crear cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Crear cuenta como candidato</h1>
        <p className="text-sm text-muted-foreground">
          Postula a vacantes, sube tu CV y haz seguimiento a tu proceso.
        </p>
      </div>
      <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
        <UserPlus className="mt-0.5 h-4 w-4 text-primary" />
        <span>
          El registro público es <b>exclusivo para aspirantes</b>. Los roles administrativos
          (RRHH, Evaluador, Super Admin) sólo se crean desde el panel del Super Administrador.
        </span>
      </div>
      <div className="space-y-2">
        <Label>Nombre completo</Label>
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label>Correo</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} />
      </div>
      <div className="space-y-2">
        <Label>Contraseña</Label>
        <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta de candidato"}
      </Button>
    </form>
  );
}
