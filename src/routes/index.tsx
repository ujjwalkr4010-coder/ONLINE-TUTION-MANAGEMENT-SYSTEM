import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/PublicHeader";
import {
  GraduationCap, Users, BookOpen, ClipboardCheck, FileText, CreditCard,
  Video, Bot, Sparkles, ArrowRight, CheckCircle2,
} from "lucide-react";
import hero from "@/assets/hero-otms.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OTMS — Online Tuition Management System" },
      { name: "description", content: "All-in-one LMS: courses, attendance, assignments, fees, live classes, and AI tutoring." },
      { property: "og:title", content: "OTMS — Online Tuition Management System" },
      { property: "og:description", content: "Modern LMS built for tutors and students. AI-powered, mobile-ready." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: Users, title: "3 Roles, 1 Platform", desc: "Admin, Tutor, Student — each with a tailored dashboard." },
  { icon: BookOpen, title: "Course Management", desc: "Create, enroll, organize. Cover images, fees, status." },
  { icon: ClipboardCheck, title: "Attendance Tracking", desc: "One-tap daily attendance with present/absent/late." },
  { icon: FileText, title: "Assignments", desc: "Upload, submit, grade with feedback — all in one place." },
  { icon: CreditCard, title: "Fee Management", desc: "Mock checkout flow, full payment history & receipts." },
  { icon: Video, title: "Live Classes", desc: "One-click Jitsi video rooms scheduled per course." },
  { icon: Bot, title: "AI Chatbot", desc: "Student support and FAQs powered by Gemini." },
  { icon: Sparkles, title: "AI Performance Analysis", desc: "Auto-generated insights from grades + attendance." },
];

function Home() {
  return (
    <div className="min-h-screen">
      <PublicHeader />

      {/* HERO */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 30% 40%, oklch(0.78 0.16 165 / 0.4), transparent 50%)",
        }} />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="text-balance">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary backdrop-blur">
              <Sparkles className="h-3 w-3" /> BCA Project · Agile MVP
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
              The modern way to <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">run online tuitions</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">
              OTMS is a full-stack learning management system. Manage tutors, students, courses, attendance, assignments and fees — with AI-powered insights and live video classes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="gap-2 shadow-mint">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  Learn more
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
              {["Role-based access", "REST API ready", "Mobile responsive"].map((t) => (
                <div key={t} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{t}</div>
              ))}
            </div>
          </div>

          <div className="relative">
            <img src={hero} alt="OTMS dashboard preview" className="relative z-10 rounded-3xl shadow-elevated" />
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-primary/30 to-primary-glow/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold">Everything an online tuition needs</h2>
          <p className="mt-4 text-muted-foreground">8 modules. 1 codebase. 3 dashboards. Built with React, TanStack Start & PostgreSQL.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group relative rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-mint shadow-mint">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 font-display font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-10 text-center md:p-16">
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: "radial-gradient(circle at 50% 0%, oklch(0.88 0.18 160 / 0.5), transparent 60%)",
          }} />
          <div className="relative">
            <GraduationCap className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 font-display text-4xl font-bold text-white">Ready to launch your tuition online?</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">Sign up as Admin, Tutor, or Student in under 30 seconds.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register"><Button size="lg" className="shadow-mint">Create account</Button></Link>
              <Link to="/login"><Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">Sign in</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        OTMS · Online Tuition Management System · BCA Project
      </footer>
    </div>
  );
}
