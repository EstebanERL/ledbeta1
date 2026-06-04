import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Loader2,
  ShieldCheck,
  Briefcase,
  Users,
  TrendingUp,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  Quote,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

// Imagen profesional (Unsplash – uso libre)
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80";

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
      {/* ===== Lado izquierdo: branding visual ===== */}
      <div className="relative hidden overflow-hidden bg-gradient-hero text-white md:flex md:flex-col md:justify-between">
        {/* Imagen de fondo profesional */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('${HERO_IMAGE}')` }}
          aria-hidden
        />
        {/* Overlay degradado para legibilidad */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_265_/_0.92)] via-[oklch(0.30_0.14_265_/_0.78)] to-[oklch(0.20_0.10_280_/_0.92)]" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_30%_20%,oklch(0.7_0.18_220_/_0.35),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_80%_85%,oklch(0.65_0.2_280_/_0.30),transparent_50%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />

        {/* Orbes flotantes */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-2 p-12 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 shadow-lg shadow-black/10 backdrop-blur-md ring-1 ring-white/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TalentForge</span>
        </Link>

        {/* Contenido central */}
        <div className="relative z-10 space-y-8 px-12">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Plataforma corporativa de talento
            </span>
            <h2 className="text-4xl font-bold leading-[1.1] tracking-tight">
              Conecta talento con <br />
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                las mejores oportunidades.
              </span>
            </h2>
            <p className="max-w-md text-white/75">
              Reclutamiento, evaluaciones técnicas y reportes inteligentes en un entorno seguro
              de nivel empresarial.
            </p>
          </div>

          {/* Mini-stats / features */}
          <div className="grid max-w-md grid-cols-3 gap-3">
            <FeatureCard icon={Briefcase} label="Vacantes activas" value="+1.2k" />
            <FeatureCard icon={Users} label="Empresas" value="350" />
            <FeatureCard icon={TrendingUp} label="Efectividad" value="98%" />
          </div>

          {/* Testimonio corporativo */}
          <div className="flex max-w-md items-start gap-3 rounded-xl border border-white/15 bg-white/[0.07] p-4 text-sm text-white/85 backdrop-blur-md">
            <Quote className="mt-0.5 h-5 w-5 shrink-0 text-white/70" />
            <div className="space-y-2">
              <p className="leading-relaxed">
                “Redujimos el ciclo de contratación en un 40% manteniendo la calidad del talento
                contratado.”
              </p>
              <p className="text-xs text-white/60">
                Esteban Redondo, Deivis Yepes, Laura Reguillo · Directoria de Talento, LED Corp
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between p-12 pt-0 text-xs text-white/50">
          <span>© {new Date().getFullYear()} TalentForge</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Cifrado SSL · ISO 27001
          </span>
        </div>
      </div>

      {/* ===== Lado derecho: formulario ===== */}
      <div className="relative flex items-center justify-center bg-background p-6 md:p-12">
        {/* Halo de color sutil detrás del card */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-primary opacity-[0.07] blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Logo móvil */}
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 md:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-white shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">TalentForge</span>
          </Link>

          <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl shadow-black/[0.04] backdrop-blur-sm md:p-8">
            <Tabs defaultValue={initialTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/60 p-1">
                <TabsTrigger value="login" className="rounded-lg data-[state=active]:shadow-sm">
                  Iniciar sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg data-[state=active]:shadow-sm">
                  Crear cuenta
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <LoginForm />
              </TabsContent>
              <TabsContent value="register" className="mt-6">
                <RegisterForm />
              </TabsContent>
            </Tabs>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Al continuar aceptas nuestros{" "}
            <Link to="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Términos
            </Link>{" "}
            y{" "}
            <Link to="/" className="font-medium text-foreground underline-offset-4 hover:underline">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-md">
      <Icon className="mb-2 h-4 w-4 text-white/80" />
      <div className="text-lg font-bold leading-none">{value}</div>
      <div className="mt-1 text-[11px] text-white/60">{label}</div>
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
      toast.success("Sesión iniciada");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al iniciar sesión");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">
          Ingresa a tu panel para continuar con tu proceso.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo corporativo</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            required
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ¿Olvidaste tu contraseña?
          </Link>

        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            className="pl-9"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="group h-11 w-full bg-gradient-primary text-base font-semibold shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Acceder
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
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
      toast.success("Cuenta creada correctamente");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "Error al crear cuenta");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Regístrate como candidato</h1>
        <p className="text-sm text-muted-foreground">
          Postula a vacantes, gestiona tu CV y haz seguimiento a tu proceso.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Nombre completo</Label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            required
            placeholder="Nombre y apellidos"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Correo electrónico</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="email"
            required
            placeholder="nombre@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Contraseña</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          Usa una combinación de letras, números y símbolos.
        </div>
      </div>

      <Button
        type="submit"
        disabled={busy}
        className="group h-11 w-full bg-gradient-primary text-base font-semibold shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            Crear cuenta de candidato
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
