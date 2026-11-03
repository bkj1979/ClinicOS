"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  UserPlus,
  Activity,
  Stethoscope,
  Pill,
  ClipboardList,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Mic,
  ChevronRight,
  Package,
  BarChart3,
  Heart,
  Thermometer,
  FileText,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { cn, formatCurrency, getStatusColor, getInitials } from "@/lib/utils";
import {
  appointments,
  opdQueue,
  revenueByMonth,
  departmentRevenue,
  drugs,
  patients,
  invoices,
  dailyPatientFlow,
} from "@/lib/mock-data";
import AppLayout from "@/components/layout/app-layout";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const paymentModes = [
  { name: "UPI", value: 40, color: "#8b5cf6" },
  { name: "Cash", value: 35, color: "#10b981" },
  { name: "Card", value: 18, color: "#3b82f6" },
  { name: "Insurance", value: 7, color: "#f59e0b" },
];

export default function DashboardPage() {
  const [currentDateStr, setCurrentDateStr] = useState("Monday, 2 November 2026");

  useEffect(() => {
    setCurrentDateStr(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  const todayAppointments = appointments;
  const waitingCount = opdQueue.filter((q) => q.status === "waiting").length;
  const inConsultCount = opdQueue.filter((q) => q.status === "in-consultation").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const todayRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingAmount = invoices.reduce((sum, inv) => sum + inv.balance, 0);
  const lowStockDrugs = drugs.filter((d) => d.currentStock <= d.minStock);

  const kpiCards = [
    {
      title: "Today's Appointments",
      value: todayAppointments.length.toString(),
      change: "+3 vs yesterday",
      changeType: "increase" as const,
      icon: CalendarDays,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Patients Waiting",
      value: waitingCount.toString(),
      change: `${inConsultCount} in consultation`,
      changeType: "neutral" as const,
      icon: Users,
      color: "from-amber-500 to-orange-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600",
    },
    {
      title: "Revenue Today",
      value: formatCurrency(todayRevenue),
      change: "+18.5% vs avg",
      changeType: "increase" as const,
      icon: DollarSign,
      color: "from-emerald-500 to-teal-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600",
    },
    {
      title: "Pending Collections",
      value: formatCurrency(pendingAmount),
      change: `${invoices.filter((i) => i.status !== "paid").length} invoices`,
      changeType: "decrease" as const,
      icon: Clock,
      color: "from-red-500 to-rose-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
    {
      title: "Completed Consults",
      value: completedCount.toString(),
      change: `${todayAppointments.length - completedCount} remaining`,
      changeType: "neutral" as const,
      icon: CheckCircle2,
      color: "from-violet-500 to-purple-500",
      bgColor: "bg-violet-50",
      textColor: "text-violet-600",
    },
    {
      title: "Avg Wait Time",
      value: "12 min",
      change: "-18% vs last week",
      changeType: "increase" as const,
      icon: Timer,
      color: "from-teal-500 to-cyan-500",
      bgColor: "bg-teal-50",
      textColor: "text-teal-600",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Welcome back, Dr. Priya Sharma • {currentDateStr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/voice-scribe"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <Mic className="w-4 h-4" />
              AI Voice Scribe
            </Link>
            <Link
              href="/appointments"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              New Appointment
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", card.bgColor)}>
                  <card.icon className={cn("w-4 h-4", card.textColor)} />
                </div>
                {card.changeType === "increase" ? (
                  <div className="flex items-center gap-0.5 text-emerald-600 text-xs font-medium">
                    <TrendingUp className="w-3 h-3" />
                  </div>
                ) : card.changeType === "decrease" ? (
                  <div className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
                    <TrendingDown className="w-3 h-3" />
                  </div>
                ) : null}
              </div>
              <div className="text-xl font-bold text-slate-800">{card.value}</div>
              <div className="text-xs text-slate-500 mt-1">{card.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{card.change}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Revenue Trend</h3>
                <p className="text-xs text-slate-500">Last 6 months performance</p>
              </div>
              <Link href="/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View Details <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueByMonth}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Mode Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Payment Modes</h3>
                <p className="text-xs text-slate-500">Today&apos;s distribution</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={paymentModes} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {paymentModes.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {paymentModes.map((mode) => (
                <div key={mode.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mode.color }} />
                  {mode.name} ({mode.value}%)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live OPD Queue */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">Live OPD Queue</h3>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <Link href="/opd-queue" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View Full Queue <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {opdQueue.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                    entry.status === "in-consultation"
                      ? "bg-emerald-50 border-emerald-200"
                      : entry.priority === "urgent"
                      ? "bg-red-50 border-red-200"
                      : "bg-slate-50 border-slate-200"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold",
                      entry.status === "in-consultation"
                        ? "bg-emerald-500 text-white"
                        : entry.priority === "urgent"
                        ? "bg-red-500 text-white"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {entry.tokenNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-800">{entry.patientName}</span>
                      <span className="text-xs text-slate-500">{entry.patientAge}y / {entry.patientGender[0]}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{entry.doctorName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">{entry.department}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium", getStatusColor(entry.status))}>
                      {entry.status === "in-consultation" ? "In Consultation" : entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {entry.status === "waiting" ? `~${entry.estimatedWaitMinutes} min wait` : "Now seeing"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "New Patient", icon: UserPlus, href: "/patients", color: "text-blue-600 bg-blue-50" },
                  { label: "Walk-in", icon: Users, href: "/opd-queue", color: "text-amber-600 bg-amber-50" },
                  { label: "Prescribe", icon: Pill, href: "/prescriptions", color: "text-emerald-600 bg-emerald-50" },
                  { label: "Bill Patient", icon: FileText, href: "/billing", color: "text-violet-600 bg-violet-50" },
                  { label: "Lab Order", icon: Activity, href: "/consultation", color: "text-red-600 bg-red-50" },
                  { label: "Inventory", icon: Package, href: "/pharmacy", color: "text-teal-600 bg-teal-50" },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-sm"
                  >
                    <div className={cn("p-1.5 rounded-md", action.color)}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-slate-700">{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Alerts</h3>
              <div className="space-y-2.5">
                {lowStockDrugs.length > 0 && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-700">Low Stock Alert</p>
                      <p className="text-[11px] text-red-600 mt-0.5">
                        {lowStockDrugs.map((d) => d.name).join(", ")} {lowStockDrugs.length === 1 ? "is" : "are"} below reorder level
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Pending Payments</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      {formatCurrency(pendingAmount)} pending across {invoices.filter((i) => i.status !== "paid").length} invoices
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                  <CalendarDays className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">Follow-ups Due</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">
                      3 patients have follow-ups scheduled this week
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-emerald-700">ABDM Sync Complete</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      4 patient records synced successfully
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Appointments Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Today&apos;s Schedule</h3>
                <p className="text-xs text-slate-500">{todayAppointments.length} appointments</p>
              </div>
              <Link href="/appointments" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="text-xs font-mono text-slate-500 w-16 shrink-0">{apt.timeSlot}</div>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0",
                    apt.status === "completed" ? "bg-slate-400" :
                    apt.status === "in-consultation" ? "bg-emerald-500" :
                    apt.status === "waiting" ? "bg-amber-500" : "bg-blue-500"
                  )}>
                    {getInitials(apt.patientName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{apt.patientName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{apt.chiefComplaint}</p>
                  </div>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0", getStatusColor(apt.status))}>
                    {apt.status === "in-consultation" ? "In Consult" : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Department Performance</h3>
                <p className="text-xs text-slate-500">This month revenue by department</p>
              </div>
              <Link href="/analytics" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Full Report <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={departmentRevenue} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={110} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fourth Row - Recent Patients & Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Patients */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Recent Patients</h3>
              <Link href="/patients" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {patients.slice(0, 6).map((patient) => (
                <div key={patient.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-600">
                    {getInitials(patient.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{patient.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{patient.uhid}</span>
                      <span>•</span>
                      <span>{patient.age}y / {patient.gender[0]}</span>
                      <span>•</span>
                      <span>{patient.phone}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500">{patient.totalVisits} visits</p>
                    {patient.abhaId && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> ABHA
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-800">Inventory Status</h3>
              <Link href="/pharmacy" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {drugs.slice(0, 8).map((drug) => {
                const stockPercent = (drug.currentStock / drug.maxStock) * 100;
                const isLow = drug.currentStock <= drug.minStock;
                const isCritical = drug.currentStock <= drug.reorderLevel * 0.5;
                return (
                  <div key={drug.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={cn("p-1.5 rounded-md", isLow ? "bg-red-50" : "bg-emerald-50")}>
                      <Pill className={cn("w-3.5 h-3.5", isLow ? "text-red-500" : "text-emerald-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{drug.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", isCritical ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-emerald-500")}
                            style={{ width: `${Math.min(stockPercent, 100)}%` }}
                          />
                        </div>
                        <span className={cn("text-[11px] font-medium", isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-500")}>
                          {drug.currentStock}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

