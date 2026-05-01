import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, IndianRupee, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/payments")({
  head: () => ({ meta: [{ title: "Payments — OTMS" }] }),
  component: () => <DashboardLayout><Pay /></DashboardLayout>,
});

function Pay() {
  const { user, role } = useAuth();
  const [pending, setPending] = useState<{ courseId: string; title: string; fee: number }[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({});

  const load = async () => {
    if (!user) return;
    if (role === "student") {
      const { data: en } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      const ids = (en ?? []).map((e) => e.course_id);
      if (ids.length) {
        const { data: cs } = await supabase.from("courses").select("id,title,fee").in("id", ids);
        const { data: pays } = await supabase.from("payments").select("*").eq("student_id", user.id);
        const paidIds = new Set((pays ?? []).filter((p) => p.status === "paid").map((p) => p.course_id));
        setPending((cs ?? []).filter((c) => !paidIds.has(c.id) && Number(c.fee) > 0).map((c) => ({ courseId: c.id, title: c.title, fee: Number(c.fee) })));
        setPayments(pays ?? []);
        setCourseTitles(Object.fromEntries((cs ?? []).map((c) => [c.id, c.title])));
      }
    } else {
      const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      setPayments(data ?? []);
      const ids = [...new Set((data ?? []).map((p) => p.course_id))];
      if (ids.length) {
        const { data: cs } = await supabase.from("courses").select("id,title").in("id", ids);
        setCourseTitles(Object.fromEntries((cs ?? []).map((c) => [c.id, c.title])));
      }
    }
  };

  useEffect(() => { load(); }, [user, role]);

  const payNow = async (courseId: string, amount: number) => {
    if (!user) return;
    // Mock checkout
    const txn = "MOCK_" + Math.random().toString(36).slice(2, 12).toUpperCase();
    const { error } = await supabase.from("payments").insert({
      student_id: user.id, course_id: courseId, amount, status: "paid",
      transaction_id: txn, paid_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success(`Payment successful! TXN: ${txn}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{role === "student" ? "Fees & Payments" : "All Payments"}</h1>
        <p className="text-sm text-muted-foreground">Mock checkout — for demo only. No real charges.</p>
      </div>

      {role === "student" && pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold">Pending fees</h2>
          {pending.map((p) => (
            <div key={p.courseId} className="flex items-center justify-between rounded-2xl border border-warning/30 bg-warning/5 p-5 shadow-soft">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><IndianRupee className="h-3 w-3" /> {p.fee.toFixed(2)}</p>
              </div>
              <Button onClick={() => payNow(p.courseId, p.fee)} className="shadow-mint">
                <CreditCard className="mr-2 h-4 w-4" /> Pay now
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h2 className="font-display text-xl font-semibold">Payment history</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-muted-foreground">
              <tr>
                <th className="p-3">Course</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Transaction</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border/50 last:border-0">
                  <td className="p-3 font-medium">{courseTitles[p.course_id] ?? "—"}</td>
                  <td className="p-3 flex items-center gap-1"><IndianRupee className="h-3 w-3" />{Number(p.amount).toFixed(2)}</td>
                  <td className="p-3"><Badge variant={p.status === "paid" ? "default" : p.status === "pending" ? "secondary" : "destructive"} className="capitalize">{p.status === "paid" && <Check className="mr-1 h-3 w-3" />}{p.status}</Badge></td>
                  <td className="p-3 font-mono text-xs">{p.transaction_id ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
              {!payments.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No payments yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
