import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock } from "lucide-react";

export const Route = createFileRoute("/dashboard/attendance")({
  head: () => ({ meta: [{ title: "Attendance — OTMS" }] }),
  component: () => <DashboardLayout><Att /></DashboardLayout>,
});

type Status = "present" | "absent" | "late";
const today = () => new Date().toISOString().slice(0, 10);

function Att() {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [courseId, setCourseId] = useState<string>("");
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [date] = useState(today());
  const [history, setHistory] = useState<{ date: string; status: Status }[]>([]);

  // Load courses depending on role
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (role === "tutor") {
        const { data } = await supabase.from("courses").select("id,title").eq("tutor_id", user.id);
        setCourses(data ?? []); if (data?.[0]) setCourseId(data[0].id);
      } else if (role === "student") {
        const { data } = await supabase.from("attendance").select("date,status").eq("student_id", user.id).order("date", { ascending: false }).limit(30);
        setHistory((data ?? []) as any);
      } else {
        const { data } = await supabase.from("courses").select("id,title");
        setCourses(data ?? []); if (data?.[0]) setCourseId(data[0].id);
      }
    })();
  }, [user, role]);

  // Tutor: load enrolled students for selected course
  useEffect(() => {
    if (!courseId || role === "student") return;
    (async () => {
      const { data: en } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
      const ids = (en ?? []).map((e) => e.student_id);
      if (!ids.length) { setStudents([]); return; }
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      setStudents(profs ?? []);
      // Pre-load existing marks for today
      const { data: existing } = await supabase.from("attendance").select("student_id,status").eq("course_id", courseId).eq("date", date);
      const m: Record<string, Status> = {};
      (existing ?? []).forEach((r) => { m[r.student_id] = r.status as Status; });
      setMarks(m);
    })();
  }, [courseId, role, date]);

  const setMark = (studentId: string, status: Status) => setMarks((m) => ({ ...m, [studentId]: status }));

  const save = async () => {
    if (!courseId) return;
    const rows = Object.entries(marks).map(([student_id, status]) => ({
      course_id: courseId, student_id, status, date, marked_by: user?.id,
    }));
    if (!rows.length) return toast.error("Mark at least one student");
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "course_id,student_id,date" });
    if (error) return toast.error(error.message);
    toast.success("Attendance saved");
  };

  if (role === "student") {
    const present = history.filter((h) => h.status === "present").length;
    const total = history.length;
    const pct = total ? Math.round((present / total) * 100) : 0;
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold">My Attendance</h1>
        <div className="rounded-2xl border border-border gradient-card p-6 shadow-soft">
          <div className="font-display text-5xl font-bold text-primary">{pct}%</div>
          <p className="mt-1 text-sm text-muted-foreground">{present} of {total} sessions attended (last 30 days)</p>
        </div>
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground"><tr><th className="p-3">Date</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="p-3">{h.date}</td>
                  <td className="p-3"><Badge variant={h.status === "present" ? "default" : h.status === "late" ? "secondary" : "destructive"}>{h.status}</Badge></td>
                </tr>
              ))}
              {!history.length && <tr><td colSpan={2} className="p-6 text-center text-muted-foreground">No attendance recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-display text-3xl font-bold">Mark Attendance</h1><p className="text-sm text-muted-foreground">Date: {date}</p></div>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Choose course" /></SelectTrigger>
          <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No students enrolled in this course yet.</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50 text-left">
                <tr><th className="p-3">Student</th><th className="p-3 text-right">Mark</th></tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0">
                    <td className="p-3 font-medium">{s.full_name}</td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        {(["present", "late", "absent"] as Status[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={marks[s.id] === st ? "default" : "outline"}
                            onClick={() => setMark(s.id, st)}
                            className="capitalize"
                          >
                            {st === "present" && <Check className="mr-1 h-3 w-3" />}
                            {st === "late" && <Clock className="mr-1 h-3 w-3" />}
                            {st === "absent" && <X className="mr-1 h-3 w-3" />}
                            {st}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={save} className="shadow-mint">Save attendance</Button>
        </>
      )}
    </div>
  );
}
