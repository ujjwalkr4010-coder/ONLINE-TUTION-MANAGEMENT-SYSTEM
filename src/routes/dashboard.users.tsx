import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export const Route = createFileRoute("/dashboard/users")({
  head: () => ({ meta: [{ title: "Users — OTMS" }] }),
  component: () => <DashboardLayout><UsersPage /></DashboardLayout>,
});

function UsersPage() {
  const { role } = useAuth();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (role !== "admin") return;
    (async () => {
      const { data: profs } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const ids = (profs ?? []).map((p) => p.id);
      const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const roleMap = Object.fromEntries((roles ?? []).map((r) => [r.user_id, r.role]));
      setRows((profs ?? []).map((p) => ({ ...p, role: roleMap[p.id] ?? "—" })));
    })();
  }, [role]);

  if (role !== "admin") {
    return <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Users className="h-7 w-7" /> Users</h1>
        <p className="text-sm text-muted-foreground">All registered users across the platform.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Role</th><th className="p-3">Joined</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <td className="p-3 font-medium">{r.full_name}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3 text-muted-foreground">{r.phone ?? "—"}</td>
                <td className="p-3"><Badge variant="outline" className="capitalize">{r.role}</Badge></td>
                <td className="p-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
