import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, BookOpen, Award, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/performance")({
  head: () => ({ meta: [{ title: "AI Performance Insights — OTMS" }] }),
  component: () => <DashboardLayout><Perf /></DashboardLayout>,
});

function Perf() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const [stats, setStats] = useState<{ courses: number; submissions: number; avgMarks: number; attendancePct: number } | null>(null);

  const analyze = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [enRes, subRes, attRes] = await Promise.all([
        supabase.from("enrollments").select("course_id").eq("student_id", user.id),
        supabase.from("submissions").select("marks_obtained, assignment_id, feedback").eq("student_id", user.id),
        supabase.from("attendance").select("status").eq("student_id", user.id),
      ]);

      const submissions = subRes.data ?? [];
      const graded = submissions.filter((s) => s.marks_obtained != null);
      const avgMarks = graded.length ? graded.reduce((a, b) => a + (b.marks_obtained ?? 0), 0) / graded.length : 0;
      const attendance = attRes.data ?? [];
      const present = attendance.filter((a) => a.status === "present").length;
      const attendancePct = attendance.length ? (present / attendance.length) * 100 : 0;

      const s = { courses: enRes.data?.length ?? 0, submissions: submissions.length, avgMarks, attendancePct };
      setStats(s);

      const prompt = `You are an academic advisor. Analyze this student's performance and provide a friendly, actionable report in Markdown. Use these stats:
- Enrolled courses: ${s.courses}
- Total submissions: ${s.submissions}
- Graded submissions: ${graded.length}
- Average marks obtained: ${avgMarks.toFixed(1)}
- Attendance percentage: ${attendancePct.toFixed(1)}%
- Recent feedback received: ${graded.slice(0, 5).map((g) => g.feedback).filter(Boolean).join(" | ") || "none"}

Structure: 1) Overall summary (1 line), 2) Strengths (bullets), 3) Areas to improve (bullets), 4) Concrete next steps (bullets). Keep it under 200 words.`;

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [{ role: "user", content: prompt }],
          system: "You are an encouraging academic advisor. Be specific, kind and brief.",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.reply);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to analyze");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" /> AI Performance Insights</h1>
        <p className="text-sm text-muted-foreground">Get a personalized analysis of your academic progress.</p>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookOpen, label: "Enrolled", value: stats.courses },
            { icon: Award, label: "Submissions", value: stats.submissions },
            { icon: TrendingUp, label: "Avg Marks", value: stats.avgMarks.toFixed(1) },
            { icon: Calendar, label: "Attendance", value: `${stats.attendancePct.toFixed(0)}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-mint shadow-mint"><s.icon className="h-4 w-4 text-primary-foreground" /></div>
              <div className="mt-3 font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border gradient-card p-6 shadow-soft">
        {!report ? (
          <div className="text-center py-8">
            <Sparkles className="mx-auto h-12 w-12 text-primary" />
            <p className="mt-4 text-muted-foreground">Click below to generate your AI-powered performance report.</p>
            <Button onClick={analyze} disabled={loading} className="mt-4 shadow-mint">
              {loading ? "Analyzing…" : "Generate report"}
            </Button>
          </div>
        ) : (
          <>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
              {report}
            </div>
            <Button onClick={analyze} disabled={loading} variant="outline" className="mt-4">
              {loading ? "Analyzing…" : "Regenerate"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
