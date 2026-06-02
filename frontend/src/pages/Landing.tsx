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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">TalentForge</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition">Funcionalidades</a>
            <a href="#roles" className="text-muted-foreground hover:text-foreground transition">Roles</a>
            <Link to="/empleos" className="text-muted-foreground hover:text-foreground transition">Empleos</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Iniciar sesión</Button></Link>
            <Link to="/auth?tab=register">
              <Button size="sm" className="bg-gradient-primary shadow-glow hover:opacity-95">Empezar</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_20%_20%,oklch(0.7_0.18_220_/_0.35),transparent_50%),radial-gradient(circle_at_80%_60%,oklch(0.65_0.2_280_/_0.3),transparent_50%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2 md:py-32">
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full glass-dark px-4 py-1.5 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              Sistema empresarial de selección
            </div>
            <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
              Encuentra al <span className="text-gradient bg-gradient-to-r from-cyan-300 to-white">talento correcto</span>, más rápido.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Plataforma corporativa para reclutamiento, selección, pruebas técnicas, test psicotécnicos,
              evaluación e inducción — con dashboards diferenciados por rol.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth?tab=register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-elegant">
                  Crear cuenta gratis <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/empleos">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
                  Ver empleos
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/70">
              {["JWT por rol", "bcrypt", "Auditoría completa"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" /> {t}
                </div>
              ))}
            </div>
          </div>
          <div className="relative animate-float">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-primary opacity-30 blur-3xl" />
            <img src={heroImg} alt="Equipo de RRHH" width={1600} height={1024}
              className="relative w-full rounded-2xl shadow-elegant ring-1 ring-white/20" />
          </div>
        </div>
      </section>

      <section id="stats" className="border-y bg-gradient-subtle">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {[
            { v: "65%", l: "Menos tiempo de contratación" },
            { v: "12k+", l: "Candidatos evaluados" },
            { v: "98%", l: "Cumplimiento normativo" },
            { v: "4.9/5", l: "Satisfacción de RRHH" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-bold text-gradient md:text-4xl">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight">Todo el ciclo de selección, en un solo lugar</h2>
          <p className="mt-4 text-muted-foreground">Diseñado para RRHH, evaluadores y candidatos.</p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            { icon: Briefcase, t: "Vacantes", d: "Publica y gestiona vacantes con cargo, área, salario, modalidad." },
            { icon: Users, t: "Candidatos", d: "Hojas de vida estructuradas con experiencia y certificados." },
            { icon: FileText, t: "Pruebas técnicas", d: "Banco de preguntas, temporizador y calificación automática." },
            { icon: Brain, t: "Test psicotécnicos", d: "Personalidad y razonamiento lógico con perfil resultante." },
            { icon: GraduationCap, t: "Inducción", d: "Videos, PDFs y evaluación final." },
            { icon: BarChart3, t: "Reportes", d: "KPIs y métricas con filtros avanzados." },
          ].map((f) => (
            <div key={f.t} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-elegant hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary opacity-0 transition group-hover:opacity-100" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary/10 text-primary">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="bg-gradient-subtle">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold tracking-tight">Una experiencia por cada rol</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Super Administrador", c: "from-violet-500 to-indigo-600" },
              { t: "Administrador RRHH", c: "from-blue-500 to-cyan-500" },
              { t: "Evaluador", c: "from-emerald-500 to-teal-500" },
              { t: "Candidato", c: "from-orange-500 to-pink-500" },
            ].map((r) => (
              <div key={r.t} className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-elegant">
                <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${r.c}`} />
                <h3 className="mt-4 text-lg font-semibold">{r.t}</h3>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {["Acceso seguro JWT", "UI dedicada", "Permisos por rol"].map((b) => (
                    <li key={b} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-success" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-10">

          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

            {/* Empresa */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                TalentForge
              </h3>

              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Plataforma integral para reclutamiento, evaluación,
                selección y contratación de talento humano.
              </p>
            </div>

            {/* Navegación */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Navegación
              </h3>

              <ul className="mt-3 space-y-3 text-sm">

                <li>
                  <Link
                    to="/"
                    className="text-muted-foreground transition hover:text-primary"
                  >
                    Inicio
                  </Link>
                </li>

                <li>
                  <a
                    href="#features"
                    className="text-muted-foreground transition hover:text-primary"
                  >
                    Funcionalidades
                  </a>
                </li>

                <li>
                  <a
                    href="#roles"
                    className="text-muted-foreground transition hover:text-primary"
                  >
                    Roles
                  </a>
                </li>

                <li>
                  <Link
                    to="/empleos"
                    className="text-muted-foreground transition hover:text-primary"
                  >
                    Vacantes
                  </Link>
                </li>

              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Contacto
              </h3>

              <ul className="mt-3 space-y-3 text-sm">

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
              <h3 className="text-lg font-semibold text-foreground">
                Síguenos
              </h3>

              <ul className="mt-3 space-y-3 text-sm">

                <li>
                  <a
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                </li>

                <li>
                  <a
                    href="https://facebook.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                </li>

                <li>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                </li>

                <li>
                  <a
                    href="https://x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground transition hover:text-primary"
                  >
                    <Twitter className="h-4 w-4" />
                    X (Twitter)
                  </a>
                </li>

              </ul>
            </div>

          </div>

          {/* Línea inferior */}
          <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">

            <p>
              © {new Date().getFullYear()} TalentForge. Todos los derechos reservados.
            </p>

            <div className="mt-2 flex flex-wrap justify-center gap-4">

              <Link
                to="/"
                className="hover:text-primary transition"
              >
                Política de privacidad
              </Link>

              <span>•</span>

              <Link
                to="/"
                className="hover:text-primary transition"
              >
                Términos y condiciones
              </Link>

            </div>

          </div>

        </div>
      </footer>
    </div>
  );
}
