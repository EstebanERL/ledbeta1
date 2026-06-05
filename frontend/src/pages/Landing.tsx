import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Users,
  BarChart3,
  Brain,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  GraduationCap,
  Linkedin,
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import heroImg from "@/assets/hero-recruitment.jpg";

// Imágenes profesionales (Unsplash – uso libre)
const IMG_TEAM_MEETING =
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80";
const IMG_OFFICE =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80";
const IMG_INTERVIEW =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80";
const IMG_ANALYTICS =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80";

const LOGOS = ["LED Corp", "Northwind", "Acme Inc.", "Globex", "Initech", "Soylent"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">TalentForge</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground transition hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#roles" className="text-muted-foreground transition hover:text-foreground">
              Roles
            </a>
            <Link to="/empleos" className="text-muted-foreground transition hover:text-foreground">
              Empleos
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/auth?tab=register">
              <Button
                size="sm"
                className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
              >
                Empezar
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden">
        {/* Imagen de fondo + overlays */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url('${IMG_TEAM_MEETING}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_265_/_0.94)] via-[oklch(0.30_0.14_265_/_0.82)] to-[oklch(0.20_0.10_280_/_0.94)]" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,oklch(0.7_0.18_220_/_0.35),transparent_55%),radial-gradient(circle_at_80%_60%,oklch(0.65_0.2_280_/_0.3),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:42px_42px]" />
        <div className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div className="text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Sistema empresarial de selección
            </span>
            <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Encuentra al{" "}
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                talento correcto
              </span>
              , más rápido.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">
              Plataforma corporativa para reclutamiento, selección, pruebas técnicas, test
              psicotécnicos, evaluación e inducción — con dashboards diferenciados por rol.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth?tab=register">
                <Button
                  size="lg"
                  className="group bg-white text-primary shadow-elegant hover:bg-white/90"
                >
                  Crear cuenta gratis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link to="/empleos">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
                >
                  Ver empleos
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/75">
              {["", "", ""].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-white/90" /> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Imagen hero con overlay corporativo */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-30 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/20 shadow-elegant">
              <img
                src={heroImg}
                alt="Equipo de RRHH evaluando candidatos"
                width={1600}
                height={1024}
                className="w-full"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
              {/* Tarjeta flotante: contratación */}
              
            </div>
            {/* Tarjeta flotante: stats */}
            <div className="absolute -left-6 top-6 hidden rounded-xl border border-white/20 bg-white/10 p-3 text-white backdrop-blur-md md:block">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/75">
                <BarChart3 className="h-3.5 w-3.5" /> Tiempo de cierre
              </div>
              <div className="mt-1 text-2xl font-bold">−40%</div>
            </div>
          </div>
        </div>

        {/* Logos / confianza */}
        <div className="relative border-t border-white/10 bg-black/10 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-6 py-6 text-xs font-medium uppercase tracking-[0.18em] text-white/55">
            <span className="text-white/40">Empresas que confían</span>
            {LOGOS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section id="stats" className="border-b bg-gradient-subtle">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
          {[
            { v: "65%", l: "Menos tiempo de contratación" },
            { v: "12k+", l: "Candidatos evaluados" },
            { v: "98%", l: "Cumplimiento normativo" },
            { v: "4.9/5", l: "Satisfacción de RRHH" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-bold tracking-tight text-gradient md:text-4xl">
                {s.v}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Funcionalidades
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">
            Todo el ciclo de selección, en un solo lugar
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado para equipos de RRHH, evaluadores técnicos y candidatos profesionales.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Briefcase,
              t: "Vacantes",
              d: "Publica y gestiona vacantes con cargo, área, salario y modalidad.",
            },
            {
              icon: Users,
              t: "Candidatos",
              d: "Hojas de vida estructuradas con experiencia y certificados.",
            },
            {
              icon: FileText,
              t: "Pruebas técnicas",
              d: "Banco de preguntas, temporizador y calificación automática.",
            },
            {
              icon: Brain,
              t: "Test psicotécnicos",
              d: "Personalidad y razonamiento lógico con perfil resultante.",
            },
            {
              icon: GraduationCap,
              t: "Inducción",
              d: "Recursos audiovisuales, materiales PDF y evaluación final.",
            },
            {
              icon: BarChart3,
              t: "Reportes",
              d: "KPIs y métricas operativas con filtros avanzados.",
            },
          ].map((f) => (
            <div
              key={f.t}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary opacity-0 transition group-hover:opacity-100" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10 text-primary ring-1 ring-primary/15">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Showcase (imagen + bullets) ===== */}
      <section className="border-y bg-gradient-subtle">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <div className="relative order-2 md:order-1">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-elegant">
              <img
                src={IMG_ANALYTICS}
                alt="Panel de analítica de selección"
                className="w-full"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/40 via-transparent to-transparent" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <BarChart3 className="h-3.5 w-3.5" /> Datos en tiempo real
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Decisiones de contratación con respaldo de datos
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
              Visualiza el embudo de selección, el desempeño por evaluador y el cumplimiento
              normativo de cada proceso, todo desde un panel ejecutivo.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Embudo de conversión por etapa",
                "Tiempo promedio de cierre por vacante",
                "Auditoría de acciones y trazabilidad",
                "Exportación a PDF y CSV",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== Roles ===== */}
      <section id="roles" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Roles
          </span>
          <h2 className="mt-4 text-4xl font-bold tracking-tight">
            Una experiencia por cada rol
          </h2>
          <p className="mt-4 text-muted-foreground">
            Permisos, vistas y flujos diseñados específicamente para cada perfil de usuario.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Super Administrador", c: "from-violet-500 to-indigo-600", icon: ShieldCheck },
            { t: "Administrador RRHH", c: "from-blue-500 to-cyan-500", icon: Briefcase },
            { t: "Evaluador", c: "from-emerald-500 to-teal-500", icon: FileText },
            { t: "Candidato", c: "from-orange-500 to-pink-500", icon: Users },
          ].map((r) => (
            <div
              key={r.t}
              className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-elegant"
            >
              <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${r.c}`} />
              <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/60 text-foreground/80">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{r.t}</h3>
              <ul className="mt-4 space-y-2 text-sm">
                {["Acceso seguro JWT", "Interfaz dedicada", "Permisos por rol"].map((b) => (
                  <li key={b} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url('${IMG_OFFICE}')` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.25_0.12_265_/_0.95)] via-[oklch(0.30_0.14_265_/_0.85)] to-[oklch(0.20_0.10_280_/_0.95)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 text-center text-primary-foreground">
          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">x|
            Profesionaliza tu proceso de selección
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Comienza hoy mismo. Configura tu primera vacante en menos de 5 minutos y empieza a
            recibir candidatos calificados.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth?tab=register">
              <Button
                size="lg"
                className="group bg-white text-primary shadow-elegant hover:bg-white/90"
              >
                Crear cuenta gratis
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link to="/empleos">
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:text-white"
              >
                Explorar empleos
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Marca */}
            <div>
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-semibold tracking-tight">TalentForge</span>
              </Link>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Plataforma integral para reclutamiento, evaluación, selección y contratación de
                talento humano.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Cifrado SSL · ISO 27001
              </div>
            </div>

            {/* Navegación */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Navegación
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link to="/" className="text-muted-foreground transition hover:text-primary">
                    Inicio
                  </Link>
                </li>
                <li>
                  <a href="#features" className="text-muted-foreground transition hover:text-primary">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#roles" className="text-muted-foreground transition hover:text-primary">
                    Roles
                  </a>
                </li>
                <li>
                  <Link to="/empleos" className="text-muted-foreground transition hover:text-primary">
                    Vacantes
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Contacto
              </h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <a
                    href="mailto:contacto@talentforge.com"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Mail className="h-4 w-4" />
                    contacto@talentforge.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+573001234567"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Phone className="h-4 w-4" />
                    +57 300 123 4567
                  </a>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Barranquilla, Colombia
                </li>
              </ul>
            </div>

            {/* Redes Sociales */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Síguenos
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  { Icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
                  { Icon: Facebook, label: "Facebook", href: "https://facebook.com" },
                  { Icon: Instagram, label: "Instagram", href: "https://instagram.com" },
                  { Icon: Twitter, label: "X (Twitter)", href: "https://x.com" },
                ].map(({ Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Línea inferior */}
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground md:flex-row">
            <p>© {new Date().getFullYear()} TalentForge. Todos los derechos reservados.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/" className="transition hover:text-primary">
                Política de privacidad
              </Link>
              <span className="text-border">•</span>
              <Link to="/" className="transition hover:text-primary">
                Términos y condiciones
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
