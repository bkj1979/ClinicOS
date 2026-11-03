"use client";

import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, IndianRupee, Clock, UserPlus,
  CalendarDays, Activity, Download, Filter, ChevronDown, Star,
  Building2, ArrowUpRight, ArrowDownRight, BarChart3, RefreshCw,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import AppLayout from "@/components/layout/app-layout";
import {
  revenueByMonth, departmentRevenue, patientDemographics,
  topDiagnoses, centreComparison, dailyPatientFlow,
} from "@/lib/mock-data";

// ---- Additional inline mock data ----
const paymentModeData = [
  { name: "UPI", value: 40, amount: 258000, color: "#6366f1" },
  { name: "Cash", value: 35, amount: 225750, color: "#10b981" },
  { name: "Card", value: 18, amount: 116100, color: "#f59e0b" },
  { name: "Insurance", value: 7, amount: 45150, color: "#ef4444" },
];

const doctorPerformance = [
  { name: "Dr. Priya Sharma", department: "General Medicine", patients: 180, revenue: 245000, avgTime: "12 min", satisfaction: 4.8 },
  { name: "Dr. Rajesh Patel", department: "Cardiology", patients: 95, revenue: 185000, avgTime: "18 min", satisfaction: 4.6 },
  { name: "Dr. Ananya Reddy", department: "Dermatology", patients: 88, revenue: 125000, avgTime: "14 min", satisfaction: 4.7 },
  { name: "Dr. Mohammed Irfan", department: "Orthopedics", patients: 72, revenue: 110000, avgTime: "16 min", satisfaction: 4.5 },
  { name: "Dr. Kavitha Nair", department: "Pediatrics", patients: 65, revenue: 85000, avgTime: "15 min", satisfaction: 4.9 },
];

// ---- KPI card data ----
const kpiCards = [
  { label: "Total Revenue", value: "₹6,45,000", change: 11.2, changeType: "increase" as const, icon: IndianRupee, color: "emerald" },
  { label: "Total Patients", value: "428", change: 8.4, changeType: "increase" as const, icon: Users, color: "blue" },
  { label: "Avg Revenue/Patient", value: "₹1,507", change: 2.6, changeType: "increase" as const, icon: BarChart3, color: "violet" },
  { label: "New Patients", value: "65", change: 15, changeType: "increase" as const, icon: UserPlus, color: "teal" },
  { label: "Follow-up Rate", value: "72%", change: 3.2, changeType: "increase" as const, icon: RefreshCw, color: "amber" },
  { label: "Avg Wait Time", value: "12 min", change: 18, changeType: "decrease" as const, icon: Clock, color: "rose" },
];

const kpiColorMap: Record<string, { bg: string; icon: string; text: string }> = {
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", text: "text-emerald-700" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", text: "text-blue-700" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", text: "text-violet-700" },
  teal: { bg: "bg-teal-50", icon: "text-teal-600", text: "text-teal-700" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", text: "text-amber-700" },
  rose: { bg: "bg-rose-50", icon: "text-rose-600", text: "text-rose-700" },
};

// ---- Custom tooltip ----
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-slate-600">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === "number" && entry.name.toLowerCase().includes("revenue") ? formatCurrency(entry.value) : entry.value.toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

// ---- Stars renderer ----
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={cn(
            s <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : s - rating < 1 ? "fill-amber-400/50 text-amber-400" : "text-slate-300"
          )}
        />
      ))}
      <span className="ml-1.5 text-sm text-slate-600 font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

// ---- Main page ----
export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [centreFilter, setCentreFilter] = useState("All Centres");

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* -------- Header -------- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-emerald-600" size={26} />
              Analytics & Business Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Multi-centre performance overview</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date range selector */}
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Today</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Last 3 Months</option>
                <option>This Year</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 text-slate-400" size={16} />
            </div>
            {/* Centre filter */}
            <div className="relative">
              <select
                value={centreFilter}
                onChange={(e) => setCentreFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>All Centres</option>
                <option>Koramangala</option>
                <option>Indiranagar</option>
                <option>HSR Layout</option>
              </select>
              <Filter className="absolute right-2.5 top-2.5 text-slate-400" size={16} />
            </div>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition">
              <Download size={15} /> Export
            </button>
          </div>
        </div>

        {/* -------- KPI Cards -------- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiCards.map((kpi) => {
            const colors = kpiColorMap[kpi.color];
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", colors.bg)}>
                    <Icon size={18} className={colors.icon} />
                  </div>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 text-xs font-semibold rounded-full px-2 py-0.5",
                      kpi.changeType === "increase" ? "bg-emerald-50 text-emerald-600" : "bg-emerald-50 text-emerald-600"
                    )}
                  >
                    {kpi.changeType === "increase" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.change}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{kpi.value}</p>
                <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
              </div>
            );
          })}
        </div>

        {/* -------- Charts 2x3 grid -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* 1. Revenue Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 col-span-1 xl:col-span-1">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" /> Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueByMonth} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 2. Department Revenue */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-blue-600" /> Department Revenue
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departmentRevenue} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Revenue" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 3. Patient Demographics */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Users size={16} className="text-violet-600" /> Patient Demographics
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={patientDemographics} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="male" name="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="female" name="Female" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 4. Daily Patient Flow */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <CalendarDays size={16} className="text-teal-600" /> Daily Patient Flow
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyPatientFlow} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="walkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="schedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#3b82f6" strokeWidth={2} fill="url(#schedGrad)" />
                <Area type="monotone" dataKey="walkin" name="Walk-in" stroke="#f59e0b" strokeWidth={2} fill="url(#walkGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 5. Top Diagnoses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Activity size={16} className="text-rose-600" /> Top Diagnoses
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topDiagnoses} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#334155", fontSize: 11 }} width={130} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Cases" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={18}>
                  {topDiagnoses.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "#f43f5e" : "#fb7185"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 6. Payment Mode Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <IndianRupee size={16} className="text-amber-600" /> Payment Mode Distribution
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={paymentModeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                >
                  {paymentModeData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}%`, String(name)]}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* -------- Multi-Centre Comparison -------- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-indigo-600" /> Multi-Centre Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Centre</th>
                    <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Revenue</th>
                    <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Patients</th>
                    <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Satisfaction</th>
                    <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Avg Wait</th>
                  </tr>
                </thead>
                <tbody>
                  {centreComparison.map((c, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-medium text-slate-800">{c.name}</td>
                      <td className="py-3 px-3 text-right text-slate-700">{formatCurrency(c.revenue)}</td>
                      <td className="py-3 px-3 text-right text-slate-700">{c.patients}</td>
                      <td className="py-3 px-3 text-right">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
                          c.satisfaction >= 4.5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        )}>
                          <Star size={11} className="fill-current" /> {c.satisfaction}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700">{c.avgWaitTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison bar chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-600" /> Revenue by Centre
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={centreComparison} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: "#334155", fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={50}>
                  {centreComparison.map((_, i) => (
                    <Cell key={i} fill={["#6366f1", "#8b5cf6", "#a78bfa"][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* -------- Doctor Performance -------- */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-emerald-600" /> Doctor Performance
            </h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
              <Download size={13} /> Export CSV / PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Doctor</th>
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium">Department</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Patients Seen</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Revenue Generated</th>
                  <th className="text-right py-2.5 px-3 text-slate-500 font-medium">Avg Consultation</th>
                  <th className="text-left py-2.5 px-3 text-slate-500 font-medium pl-6">Patient Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {doctorPerformance.map((doc, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                          {doc.name.split(" ").slice(1).map((n) => n[0]).join("")}
                        </div>
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{doc.department}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">{doc.patients}</td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">{formatCurrency(doc.revenue)}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{doc.avgTime}</td>
                    <td className="py-3 px-3 pl-6"><StarRating rating={doc.satisfaction} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="py-3 px-3 font-semibold text-slate-700" colSpan={2}>Total / Average</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {doctorPerformance.reduce((s, d) => s + d.patients, 0)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-800">
                    {formatCurrency(doctorPerformance.reduce((s, d) => s + d.revenue, 0))}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">15 min</td>
                  <td className="py-3 px-3 pl-6">
                    <StarRating rating={Number((doctorPerformance.reduce((s, d) => s + d.satisfaction, 0) / doctorPerformance.length).toFixed(1))} />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
