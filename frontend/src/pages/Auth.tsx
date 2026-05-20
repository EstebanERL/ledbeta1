import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type AppRole } from "@/lib/auth";

const SELECTABLE_ROLES: { value: Exclude<AppRole, "super_admin">; label: string; desc: string }[] = [
  { value: "candidato", label: "Aspirante / Candidato", desc: "Quiero postular a vacantes" },
  { value: "rrhh", label: "Administrador RRHH", desc: "Gestiono vacantes y candidatos" },
  { value: "evaluador", label: "Evaluador / Psicólogo", desc: "Realizo evaluaciones" },
];

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
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Bienvenido al sistema de gestión de talento.
          </h2>
          <p className="mt-4 text-white/75">
            Reclutamiento, evaluaciones, pruebas técnicas y reportes en un panel seguro.
          </p>
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
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(["candidato", "rrhh", "evaluador"]),
});

function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidato" | "rrhh" | "evaluador">("candidato");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ fullName, email, password, role });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await register(parsed.data);
      toast.success("¡Cuenta creada!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al crear cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Crear cuenta</h1>
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
      <div className="space-y-2">
        <Label>Tipo de cuenta</Label>
        <RadioGroup value={role} onValueChange={(v) => setRole(v as typeof role)} className="grid gap-2">
          {SELECTABLE_ROLES.map((r) => (
            <label key={r.value} htmlFor={`role-${r.value}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value={r.value} id={`role-${r.value}`} className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-muted-foreground">{r.desc}</div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
      </Button>
    </form>
  );
}
