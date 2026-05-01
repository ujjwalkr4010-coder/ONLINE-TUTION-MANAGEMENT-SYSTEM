import { createFileRoute } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";
import { CheckCircle2, Circle } from "lucide-react";

export const Route = createFileRoute("/sprint-plan")({
  head: () => ({ meta: [{ title: "Agile Sprint Plan — OTMS" }, { name: "description", content: "Sprint-wise delivery plan for OTMS." }] }),
  component: Sprints,
});

const sprints = [
  { n: 1, name: "Foundation & Auth", done: true, items: ["Project scaffold", "DB schema + RLS", "Auth (signup/login)", "Role-based routing", "Design system"] },
  { n: 2, name: "Course & Enrollment", done: true, items: ["Tutor: create/edit courses", "Student: browse + enroll", "Course detail page", "Cover images & status"] },
  { n: 3, name: "Attendance & Assignments", done: true, items: ["Daily attendance marking", "Assignment CRUD", "Student submissions", "Grading + feedback"] },
  { n: 4, name: "Fees & Payments", done: true, items: ["Mock checkout", "Payment history", "Fee status per student", "Receipt view"] },
  { n: 5, name: "AI & Live Classes", done: true, items: ["AI chatbot (Gemini)", "Performance analysis", "Jitsi live class scheduling", "Join class button"] },
  { n: 6, name: "Polish & Mobile API", done: false, items: ["Push notifications", "Mobile app endpoints (REST)", "Dark mode", "Bulk import students"] },
];

function Sprints() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-5xl font-bold">Agile Sprint Plan</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Iterative 2-week sprints. MVP scope (Sprints 1–5) is shipped; Sprint 6 is the post-submission roadmap.
        </p>

        <div className="mt-12 space-y-6">
          {sprints.map((s) => (
            <div key={s.n} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-display font-bold ${s.done ? "gradient-mint text-primary-foreground shadow-mint" : "bg-muted text-muted-foreground"}`}>
                  {s.n}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-semibold">Sprint {s.n} · {s.name}</h3>
                  <p className="text-xs text-muted-foreground">{s.done ? "✓ Delivered" : "In backlog"}</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {s.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-sm">
                    {s.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h3 className="font-display text-xl font-bold">User Stories (sample)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• <b>As a Student</b> I want to enroll in a course so I can attend classes.</li>
            <li>• <b>As a Tutor</b> I want to mark daily attendance so I can track participation.</li>
            <li>• <b>As an Admin</b> I want to view system analytics so I can monitor usage.</li>
            <li>• <b>As a Student</b> I want AI feedback on my performance so I can improve.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
