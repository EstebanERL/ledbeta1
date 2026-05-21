import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useUsers, AdminUser } from "@/lib/queries";
import { PageHeader, StatCard, Section } from "@/components/dashboards/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { ROLE_THEMES } from "@/lib/role-theme";
import { Users, Plus, Trash2, Crown, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin", rrhh: "RRHH", evaluador: "Evaluador", candidato: "Candidato",
};

export default function UsuariosPage() {
  const { data: users, isLoading } = useUsers();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "rrhh" });
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const createMut = useMutation({
    mutationFn: async () => (await api.post("/users", form)).data,
    onSuccess: () => {
      toast.success("Usuario creado");
      qc.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
      setForm({ email: "", password: "", fullName: "", role: "rrhh" });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error al crear"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/${id}`)).data,
    onSuccess: () => { toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  const updateRoleMut = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) =>
      (await api.patch(`/users/${id}/role`, { role })).data,
    onSuccess: () => { toast.success("Rol actualizado"); qc.invalidateQueries({ queryKey: ["users"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error ?? "Error"),
  });

  const list = users ?? [];
  const filtered = roleFilter === "all" ? list : list.filter((u) => u.role === roleFilter);
  const stats = {
    total: list.length,
    admins: list.filter((u) => u.role === "super_admin").length,
    rrhh: list.filter((u) => u.role === "rrhh").length,
    evaluadores: list.filter((u) => u.role === "evaluador").length,
    candidatos: list.filter((u) => u.role === "candidato").length,
  };

  return (
    <div>
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Crea, asigna roles y administra los accesos del sistema"
        accent="from-violet-500 via-indigo-500 to-blue-500"
      />
      <div className="space-y-6 p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Total" value={String(stats.total)} icon={Users} tone="primary" />
          <StatCard label="Super Admins" value={String(stats.admins)} icon={Crown} tone="accent" />
          <StatCard label="RRHH" value={String(stats.rrhh)} icon={ShieldCheck} tone="primary" />
          <StatCard label="Evaluadores" value={String(stats.evaluadores)} icon={ShieldCheck} tone="success" />
          <StatCard label="Candidatos" value={String(stats.candidatos)} icon={Users} tone="warning" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="rrhh">RRHH</SelectItem>
              <SelectItem value="evaluador">Evaluador</SelectItem>
              <SelectItem value="candidato">Candidato</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Crear usuario</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo usuario interno</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Nombre completo</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </div>
                <div><Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div><Label>Contraseña temporal</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
                <div><Label>Rol</Label>
                  <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rrhh">Administrador RRHH</SelectItem>
                      <SelectItem value="evaluador">Evaluador / Psicólogo</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                      <SelectItem value="candidato">Candidato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="bg-gradient-primary">
                  {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Crear
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Section title="Usuarios del sistema">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Sin usuarios</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left">Usuario</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">Rol</th>
                    <th className="px-3 py-2 text-left">Creado</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u: AdminUser) => {
                    const t = ROLE_THEMES[u.role];
                    return (
                      <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-3 py-3 font-medium">{t.symbol} {u.fullName}</td>
                        <td className="px-3 py-3 text-muted-foreground">{u.email}</td>
                        <td className="px-3 py-3">
                          <Select value={u.role} onValueChange={(v) => updateRoleMut.mutate({ id: u.id, role: v })}>
                            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="rrhh">RRHH</SelectItem>
                              <SelectItem value="evaluador">Evaluador</SelectItem>
                              <SelectItem value="candidato">Candidato</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button size="icon" variant="ghost" onClick={() => {
                            if (confirm(`¿Eliminar a ${u.fullName}?`)) deleteMut.mutate(u.id);
                          }}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
