import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { ROLE_THEMES } from "@/lib/role-theme";
import { useMyProfile, fileUrl, type ExperienceItem, type EducationItem } from "@/lib/queries";
import { api } from "@/lib/api";
import { PageHeader, Section } from "@/components/dashboards/shared";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera, FileUp, FileText, Loader2, Plus, Save, Trash2, Linkedin, Github, Globe, Phone, MapPin, LogOut,
} from "lucide-react";
import { toast } from "sonner";

type Form = {
  fullName: string;
  phone: string;
  location: string;
  headline: string;
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl: string;
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
};

const empty: Form = {
  fullName: "", phone: "", location: "", headline: "", bio: "",
  linkedinUrl: "", githubUrl: "", websiteUrl: "",
  skills: [], experience: [], education: [],
};

export default function PerfilPage() {
  const { user, signOut, refresh } = useAuth();
  const { data: profile, isLoading } = useMyProfile(!!user);
  const qc = useQueryClient();
  const avatarInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<Form>(empty);
  const [skillDraft, setSkillDraft] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        fullName: profile.fullName ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        linkedinUrl: profile.linkedinUrl ?? "",
        githubUrl: profile.githubUrl ?? "",
        websiteUrl: profile.websiteUrl ?? "",
        skills: profile.skills ?? [],
        experience: profile.experience ?? [],
        education: profile.education ?? [],
      });
    }
  }, [profile]);

  const saveMut = useMutation({
    mutationFn: async () => (await api.patch("/users/me", form)).data,
    onSuccess: () => {
      toast.success("Perfil actualizado");
      qc.invalidateQueries({ queryKey: ["profile"] });
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error al guardar"),
  });

  const uploadFile = async (file: File, kind: "avatar" | "cv") => {
    const fd = new FormData();
    fd.append(kind, file);
    try {
      await api.post(`/users/me/${kind}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(kind === "avatar" ? "Foto actualizada" : "Hoja de vida subida");
      qc.invalidateQueries({ queryKey: ["profile"] });
      refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "Error al subir archivo");
    }
  };

  if (!user) return null;
  const theme = ROLE_THEMES[user.role];
  const isCandidato = user.role === "candidato";
  const initials = (user.fullName || user.email).slice(0, 2).toUpperCase();

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const addSkill = () => {
    const s = skillDraft.trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillDraft("");
  };

  return (
    <div>
      <PageHeader title="Mi perfil profesional" subtitle="Información visible para reclutadores y evaluadores" accent={theme.headerAccent} />
      <div className="space-y-6 p-6 md:p-10">

        {/* Identidad */}
        <Section title="Información personal">
          <div className="flex flex-wrap items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                {profile?.avatarUrl && <AvatarImage src={fileUrl(profile.avatarUrl)} alt={user.fullName} />}
                <AvatarFallback className={`bg-gradient-to-br ${theme.accent} text-white text-2xl font-semibold`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => avatarInput.current?.click()}
                className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-elegant hover:scale-105"
                aria-label="Cambiar foto"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "avatar")} />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-2xl font-bold">{user.fullName}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <Badge variant="outline" className={`${theme.badge} inline-flex items-center gap-1`}>
                <theme.Symbol className="h-3 w-3" /> {ROLE_LABELS[user.role]}
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nombre completo</Label>
              <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user.email} readOnly />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+57 300 000 0000" />
            </div>
            <div>
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Ubicación</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ciudad, País" />
            </div>
            <div className="md:col-span-2">
              <Label>Titular profesional</Label>
              <Input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} placeholder="Ej: Ingeniero de Software · Backend Node.js" />
            </div>
            <div className="md:col-span-2">
              <Label>Descripción profesional</Label>
              <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Cuéntale a los reclutadores sobre tu perfil, tus logros y tus intereses." />
            </div>
          </div>
        </Section>

        {isCandidato && (
          <>
            {/* CV */}
            <Section title="Hoja de vida (CV)">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-primary" />
                  <div>
                    {profile?.cvUrl ? (
                      <>
                        <p className="text-sm font-medium">Tu CV está adjunto y se enviará en cada postulación.</p>
                        <a href={fileUrl(profile.cvUrl)} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                          Ver hoja de vida actual
                        </a>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aún no has subido tu hoja de vida.</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" onClick={() => cvInput.current?.click()}>
                  <FileUp className="mr-2 h-4 w-4" /> {profile?.cvUrl ? "Reemplazar CV" : "Subir CV (PDF)"}
                </Button>
                <input ref={cvInput} type="file" accept=".pdf,application/pdf" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "cv")} />
              </div>
            </Section>

            {/* Enlaces */}
            <Section title="Enlaces profesionales">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label className="flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</Label>
                  <Input value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/…" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</Label>
                  <Input value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} placeholder="https://github.com/…" />
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Sitio / Portafolio</Label>
                  <Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://…" />
                </div>
              </div>
            </Section>

            {/* Skills */}
            <Section title="Habilidades">
              <div className="flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <Badge key={s} variant="secondary" className="gap-1 py-1.5">
                    {s}
                    <button onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20" aria-label={`Eliminar ${s}`}>
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {form.skills.length === 0 && <p className="text-xs text-muted-foreground">Aún no agregaste habilidades.</p>}
              </div>
              <div className="mt-3 flex gap-2">
                <Input value={skillDraft} onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Ej: React, Node.js, MySQL…" className="max-w-sm" />
                <Button type="button" variant="outline" onClick={addSkill}><Plus className="mr-1 h-4 w-4" />Agregar</Button>
              </div>
            </Section>

            {/* Experiencia */}
            <Section
              title="Experiencia laboral"
              action={
                <Button size="sm" variant="outline" onClick={() => setForm((f) => ({
                  ...f, experience: [...f.experience, { company: "", role: "", from: "", to: "", description: "" }],
                }))}>
                  <Plus className="mr-1 h-4 w-4" />Añadir
                </Button>
              }
            >
              {form.experience.length === 0 && <p className="text-sm text-muted-foreground">Sin experiencia registrada todavía.</p>}
              <div className="space-y-4">
                {form.experience.map((ex, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>Empresa</Label>
                        <Input value={ex.company} onChange={(e) => updateItem(setForm, "experience", i, { company: e.target.value })} />
                      </div>
                      <div><Label>Cargo</Label>
                        <Input value={ex.role} onChange={(e) => updateItem(setForm, "experience", i, { role: e.target.value })} />
                      </div>
                      <div><Label>Desde</Label>
                        <Input value={ex.from ?? ""} placeholder="2022" onChange={(e) => updateItem(setForm, "experience", i, { from: e.target.value })} />
                      </div>
                      <div><Label>Hasta</Label>
                        <Input value={ex.to ?? ""} placeholder="Actual" onChange={(e) => updateItem(setForm, "experience", i, { to: e.target.value })} />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Descripción</Label>
                        <Textarea rows={2} value={ex.description ?? ""} onChange={(e) => updateItem(setForm, "experience", i, { description: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => removeItem(setForm, "experience", i)}>
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Educación */}
            <Section
              title="Formación académica"
              action={
                <Button size="sm" variant="outline" onClick={() => setForm((f) => ({
                  ...f, education: [...f.education, { institution: "", degree: "", from: "", to: "" }],
                }))}>
                  <Plus className="mr-1 h-4 w-4" />Añadir
                </Button>
              }
            >
              {form.education.length === 0 && <p className="text-sm text-muted-foreground">Sin estudios registrados todavía.</p>}
              <div className="space-y-4">
                {form.education.map((ed, i) => (
                  <div key={i} className="rounded-lg border p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>Institución</Label>
                        <Input value={ed.institution} onChange={(e) => updateItem(setForm, "education", i, { institution: e.target.value })} />
                      </div>
                      <div><Label>Título / Programa</Label>
                        <Input value={ed.degree} onChange={(e) => updateItem(setForm, "education", i, { degree: e.target.value })} />
                      </div>
                      <div><Label>Desde</Label>
                        <Input value={ed.from ?? ""} onChange={(e) => updateItem(setForm, "education", i, { from: e.target.value })} />
                      </div>
                      <div><Label>Hasta</Label>
                        <Input value={ed.to ?? ""} onChange={(e) => updateItem(setForm, "education", i, { to: e.target.value })} />
                      </div>
                    </div>
                    <div className="mt-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => removeItem(setForm, "education", i)}>
                        <Trash2 className="mr-1 h-4 w-4 text-destructive" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
          </Button>
          <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="bg-gradient-primary shadow-glow">
            {saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

function updateItem<K extends "experience" | "education">(
  setForm: React.Dispatch<React.SetStateAction<Form>>, key: K, i: number, patch: Partial<Form[K][number]>,
) {
  setForm((f) => {
    const next = [...f[key]] as Form[K];
    next[i] = { ...next[i], ...patch } as Form[K][number];
    return { ...f, [key]: next };
  });
}
function removeItem<K extends "experience" | "education">(
  setForm: React.Dispatch<React.SetStateAction<Form>>, key: K, i: number,
) {
  setForm((f) => ({ ...f, [key]: (f[key] as Form[K]).filter((_, idx) => idx !== i) as Form[K] }));
}
