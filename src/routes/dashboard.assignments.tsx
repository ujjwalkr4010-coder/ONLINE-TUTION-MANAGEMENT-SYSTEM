import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/assignments")({
  head: () => ({ meta: [{ title: "Assignments — OTMS" }] }),
  component: () => <DashboardLayout><Asg /></DashboardLayout>,
});

interface Assignment {
  id: string; title: string; description: string | null;
  due_date: string; max_marks: number; course_id: string; created_by: string;
}

function Asg() {
  const { user, role } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, { content: string; marks_obtained: number | null; feedback: string | null }>>({});
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    if (role === "tutor") {
      const { data: cs } = await supabase.from("courses").select("id,title").eq("tutor_id", user.id);
      setCourses(cs ?? []);
      const ids = (cs ?? []).map((c) => c.id);
      if (ids.length) {
        const { data } = await supabase.from("assignments").select("*").in("course_id", ids).order("due_date");
        setAssignments(data ?? []);
      }
    } else if (role === "student") {
      const { data: en } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      const ids = (en ?? []).map((e) => e.course_id);
      if (ids.length) {
        const { data } = await supabase.from("assignments").select("*").in("course_id", ids).order("due_date");
        setAssignments(data ?? []);
        const { data: subs } = await supabase.from("submissions").select("*").eq("student_id", user.id);
        const m: Record<string, any> = {};
        (subs ?? []).forEach((s) => { m[s.assignment_id] = s; });
        setSubmissions(m);
      }
    } else {
      const { data } = await supabase.from("assignments").select("*").order("due_date");
      setAssignments(data ?? []);
    }
  };

  useEffect(() => { load(); }, [user, role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">Assignments</h1><p className="text-sm text-muted-foreground">{role === "student" ? "Submit your work and view grades." : "Post and grade assignments."}</p></div>
        {role === "tutor" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="shadow-mint"><Plus className="mr-2 h-4 w-4" /> New assignment</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create assignment</DialogTitle></DialogHeader>
              <NewAssignmentForm courses={courses} onDone={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <FileText className="mx-auto h-10 w-10 opacity-50" /><p className="mt-3">No assignments yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => {
            const sub = submissions[a.id];
            return (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                      <Badge variant="outline">{a.max_marks} marks</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> Due {new Date(a.due_date).toLocaleString()}</p>
                  </div>
                  {role === "student" && (
                    sub ? (
                      <div className="text-right text-sm">
                        <Badge variant={sub.marks_obtained != null ? "default" : "secondary"}>
                          {sub.marks_obtained != null ? `Graded: ${sub.marks_obtained}/${a.max_marks}` : "Submitted"}
                        </Badge>
                        {sub.feedback && <p className="mt-2 max-w-xs text-xs text-muted-foreground">"{sub.feedback}"</p>}
                      </div>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm">Submit</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Submit: {a.title}</DialogTitle></DialogHeader>
                          <SubmitForm assignmentId={a.id} onDone={load} />
                        </DialogContent>
                      </Dialog>
                    )
                  )}
                  {role === "tutor" && (
                    <Dialog>
                      <DialogTrigger asChild><Button size="sm" variant="outline">View submissions</Button></DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Submissions: {a.title}</DialogTitle></DialogHeader>
                        <GradeList assignmentId={a.id} maxMarks={a.max_marks} />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewAssignmentForm({ courses, onDone }: { courses: { id: string; title: string }[]; onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const submit = async () => {
    if (!user || !courseId || !dueDate) return toast.error("Fill all fields");
    const { error } = await supabase.from("assignments").insert({
      title, description, course_id: courseId, due_date: dueDate, max_marks: Number(maxMarks), created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Assignment created"); onDone();
  };

  return (
    <div className="space-y-3">
      <div><Label>Course</Label>
        <Select value={courseId} onValueChange={setCourseId}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
      <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Due date</Label><Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" /></div>
        <div><Label>Max marks</Label><Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} className="mt-1" /></div>
      </div>
      <Button onClick={submit} className="w-full">Create</Button>
    </div>
  );
}

function SubmitForm({ assignmentId, onDone }: { assignmentId: string; onDone: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const submit = async () => {
    if (!user) return;
    const { error } = await supabase.from("submissions").insert({ assignment_id: assignmentId, student_id: user.id, content });
    if (error) return toast.error(error.message);
    toast.success("Submitted!"); onDone();
  };
  return (
    <div className="space-y-3">
      <Label>Your answer / submission notes</Label>
      <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Type your answer or paste a link to your work…" />
      <Button onClick={submit} className="w-full">Submit assignment</Button>
    </div>
  );
}

function GradeList({ assignmentId, maxMarks }: { assignmentId: string; maxMarks: number }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId);
    setSubs(data ?? []);
    const ids = [...new Set((data ?? []).map((s) => s.student_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name])));
    }
  };
  useEffect(() => { load(); }, [assignmentId]);

  const grade = async (id: string, marks: number, feedback: string) => {
    const { error } = await supabase.from("submissions").update({
      marks_obtained: marks, feedback, graded_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Graded"); load();
  };

  if (!subs.length) return <p className="py-6 text-center text-sm text-muted-foreground">No submissions yet.</p>;

  return (
    <div className="max-h-[60vh] space-y-3 overflow-y-auto">
      {subs.map((s) => (
        <div key={s.id} className="rounded-lg border border-border p-3">
          <div className="font-semibold">{names[s.student_id] ?? "Student"}</div>
          <p className="mt-1 text-sm text-muted-foreground">{s.content}</p>
          <div className="mt-3 flex items-end gap-2">
            <div className="flex-1"><Label className="text-xs">Marks (/{maxMarks})</Label><Input id={`m-${s.id}`} type="number" defaultValue={s.marks_obtained ?? ""} max={maxMarks} className="mt-1 h-9" /></div>
            <div className="flex-[2]"><Label className="text-xs">Feedback</Label><Input id={`f-${s.id}`} defaultValue={s.feedback ?? ""} className="mt-1 h-9" /></div>
            <Button size="sm" onClick={() => {
              const m = (document.getElementById(`m-${s.id}`) as HTMLInputElement).value;
              const f = (document.getElementById(`f-${s.id}`) as HTMLInputElement).value;
              grade(s.id, Number(m), f);
            }}>Save</Button>
          </div>
        </div>
      ))}
    </div>
  );
}
