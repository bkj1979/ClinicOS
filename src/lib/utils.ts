import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)}, ${formatTime(date)}`;
}

export function generateUHID(): string {
  const prefix = "COS";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
}

export function generateTokenNumber(prefix: string = "T"): string {
  const num = Math.floor(1 + Math.random() * 999);
  return `${prefix}${num.toString().padStart(3, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    waiting: "bg-amber-100 text-amber-700",
    "in-progress": "bg-emerald-100 text-emerald-700",
    "in-consultation": "bg-emerald-100 text-emerald-700",
    completed: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-100 text-red-700",
    "no-show": "bg-gray-100 text-gray-500",
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-500",
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    overdue: "bg-red-100 text-red-700",
    partial: "bg-orange-100 text-orange-700",
    "low-stock": "bg-red-100 text-red-700",
    "in-stock": "bg-emerald-100 text-emerald-700",
    "out-of-stock": "bg-red-100 text-red-800",
    dispensed: "bg-emerald-100 text-emerald-700",
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    normal: "bg-emerald-100 text-emerald-700",
  };
  return colors[status.toLowerCase()] || "bg-gray-100 text-gray-600";
}

export function calculateAge(dob: string | Date): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const prefix = "INV";
  const yr = date.getFullYear().toString().slice(-2);
  const mn = (date.getMonth() + 1).toString().padStart(2, "0");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yr}${mn}-${num}`;
}

