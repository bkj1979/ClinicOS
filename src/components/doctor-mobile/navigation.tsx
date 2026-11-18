"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Download, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const items = [
  { href: "/doctor", label: "Today", icon: CalendarDays },
  { href: "/doctor/patients", label: "Patients", icon: ClipboardList },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function DoctorMobileHeader({ title = "ClinicOS Doctor" }: { title?: string }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleInstall);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
    } catch (error) {
      console.error("Unable to start the doctor app installation:", error);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/doctor" className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-lg font-bold text-white">+</span>
          <span>{title}</span>
        </Link>
        <div className="flex items-center gap-1">
          {installPrompt && <button onClick={() => void install()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50"><Download className="h-4 w-4" /><span className="hidden sm:inline">Install app</span></button>}
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
            <MonitorSmartphone className="h-4 w-4" />
            <span className="hidden sm:inline">Full ClinicOS</span>
            <span className="sm:hidden">Desktop</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function DoctorMobileNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Doctor app navigation" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-2 px-2">
        {items.map((item) => {
          const active = item.href === "/doctor"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-emerald-700" : "text-slate-500",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
