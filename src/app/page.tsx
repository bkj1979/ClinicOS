import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="ClinicOS home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/15">
            <Stethoscope className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-xl font-bold tracking-tight">ClinicOS</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Practice, connected</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-500 sm:block">Already a member?</span>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:pb-28 lg:pt-16">
        <div className="pointer-events-none absolute -left-48 top-0 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="relative">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800">
            <ShieldCheck className="h-4 w-4" /> A calmer way to run your practice
          </div>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-6xl">
            More time for <span className="text-emerald-700">care.</span>
            <br />Less time on admin.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Bring appointments, patient records, consultations, prescriptions, and your clinic team together in one thoughtfully designed workspace.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800">
              Sign in to your clinic <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-slate-500">Secure access for your care team</span>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-600">
            {["Patient-first workflows", "Connected clinic operations", "Local AI documentation"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -right-7 -top-8 h-48 w-48 rounded-full bg-teal-100 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-52 w-52 rounded-full bg-emerald-100 blur-3xl" />
          <div className="relative rounded-[2rem] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Today at your clinic</p>
                <h2 className="mt-1 text-xl font-bold">Care, in good flow</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 py-5">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500"><CalendarDays className="h-4 w-4" /><span className="text-xs font-medium">Appointments</span></div>
                <p className="mt-3 text-3xl font-bold">24</p><p className="mt-1 text-xs text-slate-500">On today&apos;s schedule</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-700"><HeartPulse className="h-4 w-4" /><span className="text-xs font-medium">In your care</span></div>
                <p className="mt-3 text-3xl font-bold text-emerald-950">08</p><p className="mt-1 text-xs text-emerald-800/70">Patients in the queue</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ClipboardPlus className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Patient records</p><p className="mt-0.5 text-xs text-slate-500">A clearer picture at every visit</p></div>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Stethoscope className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">Consultation workspace</p><p className="mt-0.5 text-xs text-slate-500">Stay focused on the conversation</p></div>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-center text-xs text-slate-400">A unified workspace for your independent practice</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100 bg-slate-50/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>ClinicOS · Your clinic, thoughtfully connected.</span>
          <span>For authorized clinic team members</span>
        </div>
      </footer>
    </main>
  );
}
