import { createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, Plus, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/live")({
  head: () => ({ meta: [{ title: "Live Classes — OTMS" }] }),
  component: () => <DashboardLayout><Live /></DashboardLayout>,
});

function Live() {
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    let courseIds: string[] = [];
    if (role === "tutor") {
      const { data } = await supabase.from("courses").select("id,title").eq("tutor_id", user.id);
      setCourses(data ?? []); courseIds = (data ?? []).map((c) => c.id);
    } else if (role === "student") {
      const { data } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
      courseIds = (data ?? []).map((e) => e.course_id);
    }

    let q = supabase.from("live_classes").select("*").order("scheduled_at", { ascending: true });
    if (role !== "admin" && courseIds.length) q = q.in("course_id", courseIds);
    if (role !== "admin" && !courseIds.length) { setClasses([]); return; }
    const { data } = await q;
    setClasses(data ?? []);
  };

  useEffect(() => { load(); }, [user, role]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">Live Classes</h1><p className="text-sm text-muted-foreground">Powered by Jitsi Meet — free & open.</p></div>
        {role === "tutor" && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="shadow-mint"><Plus className="mr-2 h-4 w-4" /> Schedule class</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule live class</DialogTitle></DialogHeader>
              <ScheduleForm courses={courses} onDone={() => { setOpen(false); load(); }} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          <Video className="mx-auto h-10 w-10 opacity-50" /><p className="mt-3">No live classes scheduled.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => {
            const url = `https://meet.jit.si/${c.meeting_room}`;
            const upcoming = new Date(c.scheduled_at) > new Date(Date.now() - 60 * 60 * 1000);
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-mint shadow-mint">
                  <Video className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" /> {new Date(c.scheduled_at).toLocaleString()} · {c.duration_minutes} min
                </p>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button className="mt-4 w-full" disabled={!upcoming}>
                    {upcoming ? <>Join class <ExternalLink className="ml-2 h-3 w-3" /></> : "Ended"}
                  </Button>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleForm({ courses, onDone }: { courses: { id: string; title: string }[]; onDone: () => void }) {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");

  const submit = async () => {
    if (!user || !courseId) return toast.error("Pick a course");
    const room = "OTMS-" + Math.random().toString(36).slice(2, 10);
    const { error } = await supabase.from("live_classes").insert({
      course_id: courseId, title, scheduled_at: scheduledAt, duration_minutes: Number(duration),
      meeting_room: room, created_by: user.id,
    });
    if (error) return toast.error(error.message);
    toast.success("Class scheduled"); onDone();
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
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Date & time</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-1" /></div>
        <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1" /></div>
      </div>
      <Button onClick={submit} className="w-full">Schedule</Button>
    </div>
  );
}
