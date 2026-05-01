import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicHeader } from "@/components/PublicHeader";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — OTMS" }, { name: "description", content: "About the OTMS project, architecture, tech stack and team." }] }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-5xl font-bold">About OTMS</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          OTMS (Online Tuition Management System) is a production-grade web application
          built as a BCA major project. It demonstrates a complete client-server LMS
          using a modern stack while staying conceptually identical to a Laravel/MySQL build.
        </p>

        <h2 className="mt-12 font-display text-2xl font-bold">System Architecture</h2>
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <pre className="overflow-x-auto text-xs leading-relaxed text-muted-foreground">{`
┌─────────────────────────────────────────┐
│        Client (Browser / Mobile)        │
│  React 19 · TanStack Router · Tailwind  │
└──────────────────┬──────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼──────────────────────┐
│      TanStack Start  (Server Layer)      │
│  · Auth middleware                       │
│  · Server functions (RPC)                │
│  · Edge functions (AI, payments, etc.)   │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│   PostgreSQL (Lovable Cloud / Supabase)  │
│  · Tables · RLS · Triggers · Functions   │
└─────────────────────────────────────────┘`}</pre>
        </div>

        <h2 className="mt-12 font-display text-2xl font-bold">Tech Stack</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li><b>Frontend:</b> React 19, TypeScript, Tailwind CSS v4, Lucide icons</li>
          <li><b>Routing:</b> TanStack Router (file-based, type-safe)</li>
          <li><b>Backend:</b> TanStack Start server functions + Edge functions</li>
          <li><b>Database:</b> PostgreSQL with Row-Level Security policies</li>
          <li><b>Auth:</b> JWT-based with role-based access control (Admin/Tutor/Student)</li>
          <li><b>AI:</b> Lovable AI Gateway → Google Gemini 2.5 Flash</li>
          <li><b>Video:</b> Jitsi Meet (free, open-source WebRTC)</li>
        </ul>

        <h2 className="mt-12 font-display text-2xl font-bold">ER Diagram (text)</h2>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card p-6 text-xs">{`
auth.users (managed)
   │
   ├─< profiles (1:1)
   ├─< user_roles (1:n)  → role: admin | tutor | student
   │
   ├─< courses (as tutor)
   │      │
   │      ├─< enrollments (n:m with students)
   │      ├─< attendance
   │      ├─< assignments
   │      │      └─< submissions
   │      ├─< payments
   │      └─< live_classes
   │
   └─< chat_messages (AI bot)`}</pre>

        <div className="mt-12">
          <Link to="/sprint-plan" className="text-primary hover:underline">→ View Agile Sprint Plan</Link>
        </div>
      </main>
    </div>
  );
}
