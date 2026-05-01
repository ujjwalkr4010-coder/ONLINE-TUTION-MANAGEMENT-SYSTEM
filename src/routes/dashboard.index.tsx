import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Users, FileText, CreditCard, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — OTMS" }] }),
  component: DashboardHome,
});

function DashboardHome() {
  return (
    <DashboardLayout>
      <Inner />
    </DashboardLayout>
  );
}

function Inner() {
  const { user, role } = useAuth();
  const [stats, setStats] = useState({ courses: 0, students: 0, assignments: 0, payments: 0 });
  const [name, setName] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      setName(prof?.full_name ?? "");

      if (role === "admin") {
        const [c, u, a, p] = await Promise.all([
          supabase.from("courses").select("*", { count: "exact", head: true }),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("assignments").select("*", { count: "exact", head: true }),
          supabase.from("payments").select("amount").eq("status", "paid"),
        ]);
        const sum = (p.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
        setStats({ courses: c.count ?? 0, students: u.count ?? 0, assignments: a.count ?? 0, payments: sum });
      } else if (role === "tutor") {
        const { data: cs } = await supabase.from("courses").select("id").eq("tutor_id", user.id);
        const ids = (cs ?? []).map((c) => c.id);
        const [en, asg] = await Promise.all([
          ids.length ? supabase.from("enrollments").select("*", { count: "exact", head: true }).in("course_id", ids) : Promise.resolve({ count: 0 } as any),
          ids.length ? supabase.from("assignments").select("*", { count: "exact", head: true }).in("course_id", ids) : Promise.resolve({ count: 0 } as any),
        ]);
        setStats({ courses: ids.length, students: en.count ?? 0, assignments: asg.count ?? 0, payments: 0 });
      } else {
        const [en, asg, paid] = await Promise.all([
          supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("student_id", user.id),
          supabase.from("submissions").select("*", { count: "exact", head: true }).eq("student_id", user.id),
          supabase.from("payments").select("amount").eq("student_id", user.id).eq("status", "paid"),
        ]);
        const sum = (paid.data ?? []).reduce((s, x) => s + Number(x.amount), 0);
        setStats({ courses: en.count ?? 0, students: 0, assignments: asg.count ?? 0, payments: sum });
      }
    })();
  }, [user, role]);

  const cards = role === "admin"
    ? [
        { icon: BookOpen, label: "Total courses", value: stats.courses },
        { icon: Users, label: "Total users", value: stats.students },
        { icon: FileText, label: "Assignments", value: stats.assignments },
        { icon: CreditCard, label: "Revenue (₹)", value: stats.payments.toFixed(0) },
      ]
    : role === "tutor"
    ? [
        { icon: BookOpen, label: "My courses", value: stats.courses },
        { icon: Users, label: "Students enrolled", value: stats.students },
        { icon: FileText, label: "Assignments", value: stats.assignments },
        { icon: TrendingUp, label: "Avg. attendance", value: "—" },
      ]
    : [
        { icon: BookOpen, label: "Enrolled courses", value: stats.courses },
        { icon: FileText, label: "My submissions", value: stats.assignments },
        { icon: CreditCard, label: "Fees paid (₹)", value: stats.payments.toFixed(0) },
        { icon: Sparkles, label: "AI Insights", value: "Ready" },
      ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Hi {name || "there"} 👋</h1>
        <p className="mt-1 text-muted-foreground">Welcome back to your <span className="capitalize">{role}</span> dashboard.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-mint shadow-mint">
                <c.icon className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
            <div className="mt-3 font-display text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border gradient-card p-6 shadow-soft">
        <h2 className="font-display text-xl font-semibold">Quick guide</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {role === "admin" && "Manage all users and oversee the entire platform from this dashboard."}
          {role === "tutor" && "Create courses, mark attendance, post assignments and schedule live classes."}
          {role === "student" && "Browse courses, submit assignments, track attendance and pay fees online."}
        </p>
      </div>
    </div>
  );
}
