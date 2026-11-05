"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  Stethoscope,
  Pill,
  Package,
  Receipt,
  Mic,
  BarChart3,
  Shield,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Building2,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/auth-types";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/appointments", icon: CalendarDays },
  { name: "Live OPD Queue", href: "/opd-queue", icon: Users },
  { name: "Patients / EMR", href: "/patients", icon: ClipboardList },
  { name: "Consultation", href: "/consultation", icon: Stethoscope },
  { name: "Prescriptions", href: "/prescriptions", icon: Pill },
  { name: "Pharmacy & Inventory", href: "/pharmacy", icon: Package },
  { name: "Billing & Payments", href: "/billing", icon: Receipt },
  { name: "AI Voice Scribe", href: "/voice-scribe", icon: Mic },
  { name: "Analytics & BI", href: "/analytics", icon: BarChart3 },
  { name: "ABDM / NABH", href: "/compliance", icon: Shield },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [centreDropdown, setCentreDropdown] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState("ClinicOS - Koramangala");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const centres = ["ClinicOS - Koramangala", "ClinicOS - Indiranagar", "ClinicOS - HSR Layout"];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        const result = await response.json() as { user?: AuthUser; error?: string };
        if (!response.ok || !result.user) throw new Error(result.error || "Unable to verify your sign-in.");
        return result.user;
      })
      .then((authenticatedUser) => {
        if (!active || !authenticatedUser) return;
        setUser(authenticatedUser);
        if (pathname === "/settings" && authenticatedUser.role !== "admin") router.replace("/dashboard");
      })
      .catch((error: unknown) => {
        if (active) setAuthError(error instanceof Error ? error.message : "Unable to verify your sign-in.");
      })
      .finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, [pathname, router]);

  const handleSignOut = async () => {
    setAuthError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Unable to sign out. Please try again.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p role={authError ? "alert" : "status"} className="text-sm text-slate-500">{authError || "Checking your secure clinic session..."}</p>
      </div>
    );
  }

  const initials = user.name.split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
  const displayName = user.name.startsWith("Dr.") ? user.name : `Dr. ${user.name}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ClinicOS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Intelligent Practice OS</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Centre Selector */}
        <div className="px-3 py-3 border-b border-slate-700">
          <div className="relative">
            <button
              onClick={() => setCentreDropdown(!centreDropdown)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm"
            >
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate text-left flex-1 text-slate-200">{selectedCentre.replace("ClinicOS - ", "")}</span>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
            {centreDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 rounded-lg border border-slate-600 shadow-xl z-10">
                {centres.map((centre) => (
                  <button
                    key={centre}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-slate-700 first:rounded-t-lg last:rounded-b-lg transition-colors",
                      selectedCentre === centre ? "text-emerald-400 bg-slate-700" : "text-slate-300"
                    )}
                    onClick={() => { setSelectedCentre(centre); setCentreDropdown(false); }}
                  >
                    {centre.replace("ClinicOS - ", "")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {[...navigation, ...(user.role === "admin" ? [{ name: "Settings", href: "/settings", icon: Settings }] : [])].map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
              >
                <item.icon className={cn("w-[18px] h-[18px] shrink-0", isActive ? "text-emerald-400" : "")} />
                {item.name}
                {item.name === "Live OPD Queue" && (
                  <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-[10px] font-bold text-white animate-pulse">
                    4
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-3 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
              <p className="text-[11px] capitalize text-slate-500">{user.role === "doctor" ? user.specialization || user.role : user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-72">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patients, prescriptions..."
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
                />
                <kbd className="hidden md:inline text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdown(!profileDropdown)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>
                {profileDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-20 py-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                        <p className="text-xs text-slate-500">{user.loginId}</p>
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-emerald-700">{user.role === "admin" ? "Administrator" : user.role}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/profile" onClick={() => setProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <User className="w-4 h-4" /> My Profile
                        </Link>
                        {user.role === "admin" && <Link href="/settings" onClick={() => setProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                          <Settings className="w-4 h-4" /> Settings
                        </Link>}
                      </div>
                      <div className="border-t border-slate-100 py-1">
                        <button onClick={() => void handleSignOut()} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {authError && <p role="alert" className="absolute right-4 top-full mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{authError}</p>}
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
