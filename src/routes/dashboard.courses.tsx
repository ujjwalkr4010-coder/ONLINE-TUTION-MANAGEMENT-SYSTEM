import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, IndianRupee, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/courses")({
  head: () => ({ meta: [{ title: "Courses — OTMS" }] }),
  component: () => <DashboardLayout><Courses /></DashboardLayout>,
});

interface Course {
  id: string; title: string; subject: string; description: string | null;
  fee: number; tutor_id: string; status: string;
}

function Courses() {
  const { user, role } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [tutorNames, setTutorNames] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    let q = supabase.from("courses").select("*").order("created_at", { ascending: false });
    if (role === "tutor") q = q.eq("tutor_id", user.id);
    const { data } = await q;
    const list = (data ?? []) as Course[];
    setCourses(list);

    // tutor names
    const tutorIds = [...new Set(list.map((c) => c.tutor_id))];
    if (tutorIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", tutorIds);
      setTutorNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name])));
    }

    if (role === "student") {
      const { data: en } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      setEnrolledIds(new Set((en ?? []).map((e) => e.course_id)));
    }
  };

  useEffect(() => { load(); }, [user, role]);

  const enroll = async (courseId: string) => {
    if (!user) return;
    const { error } = await supabase.from("enrollments").insert({ course_id: courseId, student_id: user.id });
    if (error) return toast.error(error.message);
    toast.success("Enrolled!");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">{role === "student" ? "Browse courses" : "Courses"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{role === "student" ? "Enroll in courses to start learning." : "Create and manage your course catalog."}</p>
        </div>
        {(role === "tutor" || role === "admin") && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="shadow-mint"><Plus className="mr-2 h-4 w-4" /> New course</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create course</DialogTitle></DialogHeader>
              <CourseForm onDone={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-10 w-10 opacity-50" />
          <p className="mt-3">No courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <div key={c.id} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary">{c.subject}</Badge>
                <Badge variant="outline">{c.status}</Badge>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3 w-3" /> {tutorNames[c.tutor_id] ?? "Tutor"}</span>
                <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> {Number(c.fee).toFixed(0)}</span>
              </div>
              {role === "student" && (
                <Button
                  onClick={() => enroll(c.id)}
                  disabled={enrolledIds.has(c.id)}
                  className="mt-4 w-full"
                  variant={enrolledIds.has(c.id) ? "secondary" : "default"}
                >
                  {enrolledIds.has(c.id) ? "Enrolled ✓" : "Enroll now"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [fee, setFee] = useState("0");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("courses").insert({
      title, subject, description, fee: Number(fee), tutor_id: user.id, status: "active",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Course created");
    onDone();
  };

  return (
    <div className="space-y-3">
      <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" /></div>
      <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1" /></div>
      <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" /></div>
      <div><Label>Fee (₹)</Label><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} className="mt-1" /></div>
      <Button onClick={submit} disabled={loading || !title || !subject} className="w-full">Create</Button>
    </div>
  );
}
