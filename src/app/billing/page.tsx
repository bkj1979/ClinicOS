"use client";

import React, { useState, useMemo } from "react";
import {
  IndianRupee,
  FileText,
  CreditCard,
  Receipt,
  Plus,
  Search,
  Filter,
  Eye,
  Printer,
  Download,
  XCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Banknote,
  Smartphone,
  Building2,
  Globe,
  QrCode,
  Trash2,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { invoices, patients, centres } from "@/lib/mock-data";
import { cn, formatCurrency, formatDate, getStatusColor, generateInvoiceNumber } from "@/lib/utils";
import type { Invoice, InvoiceItem, Payment, PaymentMode, InvoiceStatus } from "@/lib/types";
import AppLayout from "@/components/layout/app-layout";

// ============================================================
// Billing & Payments Page
// ============================================================

const paymentModeIcons: Record<PaymentMode, React.ReactNode> = {
  cash: <Banknote className="w-4 h-4" />,
  upi: <Smartphone className="w-4 h-4" />,
  card: <CreditCard className="w-4 h-4" />,
  insurance: <Building2 className="w-4 h-4" />,
  online: <Globe className="w-4 h-4" />,
  cheque: <FileText className="w-4 h-4" />,
};

const paymentModeLabels: Record<PaymentMode, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  insurance: "Insurance",
  online: "Online",
  cheque: "Cheque",
};

const statusIcons: Record<string, React.ReactNode> = {
  paid: <CheckCircle className="w-3.5 h-3.5" />,
  partial: <Clock className="w-3.5 h-3.5" />,
  pending: <AlertTriangle className="w-3.5 h-3.5" />,
  overdue: <XCircle className="w-3.5 h-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  consultation: "bg-blue-50 text-blue-700 border-blue-200",
  procedure: "bg-purple-50 text-purple-700 border-purple-200",
  lab: "bg-cyan-50 text-cyan-700 border-cyan-200",
  pharmacy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  service: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-slate-50 text-slate-700 border-slate-200",
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6366f1"];

// ---- number to words ----
function numberToWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const hundred = Math.floor(n / 100);
  const rem = n % 100;
  let str = "";
  if (crore) str += numberToWords(crore) + " Crore ";
  if (lakh) str += numberToWords(lakh) + " Lakh ";
  if (thousand) str += numberToWords(thousand) + " Thousand ";
  if (hundred) str += ones[hundred] + " Hundred ";
  if (rem) {
    if (rem < 20) str += ones[rem];
    else str += tens[Math.floor(rem / 10)] + " " + ones[rem % 10];
  }
  return str.trim();
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ---- Stats Cards ----
function StatsCards({ data }: { data: Invoice[] }) {
  const todayRevenue = data.reduce((s, i) => s + i.grandTotal, 0);
  const collected = data.reduce((s, i) => s + i.amountPaid, 0);
  const pending = data.reduce((s, i) => s + i.balance, 0);
  const stats = [
    { label: "Today's Revenue", value: formatCurrency(todayRevenue), icon: IndianRupee, color: "bg-emerald-50 text-emerald-600 border-emerald-200", iconBg: "bg-emerald-100" },
    { label: "Collected", value: formatCurrency(collected), icon: CheckCircle, color: "bg-blue-50 text-blue-600 border-blue-200", iconBg: "bg-blue-100" },
    { label: "Pending", value: formatCurrency(pending), icon: Clock, color: "bg-amber-50 text-amber-600 border-amber-200", iconBg: "bg-amber-100" },
    { label: "Total Invoices", value: data.length.toString(), icon: FileText, color: "bg-purple-50 text-purple-600 border-purple-200", iconBg: "bg-purple-100" },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className={cn("rounded-xl border p-5 flex items-center gap-4", s.color)}>
          <div className={cn("p-3 rounded-xl", s.iconBg)}>
            <s.icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium opacity-70">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Invoice Detail Panel ----
function InvoiceDetail({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const patient = patients.find((p) => p.id === invoice.patientId);
  const grouped = invoice.items.reduce<Record<string, InvoiceItem[]>>((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{invoice.invoiceNo}</h2>
            <p className="text-sm text-slate-500">{formatDate(invoice.date)} • {invoice.centre}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Patient */}
        <div className="p-6 border-b">
          <p className="text-sm font-semibold text-slate-500 mb-2">Patient</p>
          <p className="font-semibold text-slate-900">{invoice.patientName}</p>
          <p className="text-sm text-slate-500">{patient?.uhid} • {invoice.patientPhone}</p>
        </div>

        {/* Itemized */}
        <div className="p-6 border-b space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <span className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded border", CATEGORY_COLORS[cat] || CATEGORY_COLORS.other)}>{cat}</span>
              <table className="w-full mt-2 text-sm">
                <thead><tr className="text-left text-slate-400"><th className="pb-1">Description</th><th className="pb-1 text-center">Qty</th><th className="pb-1 text-right">Unit</th><th className="pb-1 text-right">Disc</th><th className="pb-1 text-right">GST</th><th className="pb-1 text-right">Total</th></tr></thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="text-slate-700 border-t border-slate-100">
                      <td className="py-1.5">{it.description}</td>
                      <td className="py-1.5 text-center">{it.quantity}</td>
                      <td className="py-1.5 text-right">{formatCurrency(it.unitPrice)}</td>
                      <td className="py-1.5 text-right">{it.discount > 0 ? formatCurrency(it.discount) : "—"}</td>
                      <td className="py-1.5 text-right">{it.gstAmount > 0 ? formatCurrency(it.gstAmount) : "—"}</td>
                      <td className="py-1.5 text-right font-medium">{formatCurrency(it.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="p-6 border-b">
          <div className="flex justify-between text-sm text-slate-600 mb-1"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          {invoice.totalDiscount > 0 && <div className="flex justify-between text-sm text-emerald-600 mb-1"><span>Discount</span><span>-{formatCurrency(invoice.totalDiscount)}</span></div>}
          {invoice.totalGst > 0 && <div className="flex justify-between text-sm text-slate-600 mb-1"><span>GST</span><span>+{formatCurrency(invoice.totalGst)}</span></div>}
          <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t mt-2"><span>Grand Total</span><span>{formatCurrency(invoice.grandTotal)}</span></div>
          <div className="flex justify-between text-sm text-blue-600 mt-1"><span>Paid</span><span>{formatCurrency(invoice.amountPaid)}</span></div>
          {invoice.balance > 0 && <div className="flex justify-between text-sm text-red-600"><span>Balance Due</span><span>{formatCurrency(invoice.balance)}</span></div>}
        </div>

        {/* Payments */}
        {invoice.payments.length > 0 && (
          <div className="p-6">
            <p className="text-sm font-semibold text-slate-500 mb-2">Payment History</p>
            {invoice.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  {paymentModeIcons[p.mode]}
                  <span className="text-slate-700">{paymentModeLabels[p.mode]}</span>
                  {p.referenceNo && <span className="text-slate-400 text-xs">({p.referenceNo})</span>}
                </div>
                <span className="font-semibold text-slate-900">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Create Invoice Modal ----
function CreateInvoiceModal({ onClose }: { onClose: () => void }) {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [items, setItems] = useState<{ category: string; description: string; qty: number; unitPrice: number; discount: number; gstPercent: number }[]>([
    { category: "consultation", description: "", qty: 1, unitPrice: 0, discount: 0, gstPercent: 0 },
  ]);

  const addItem = () => setItems((prev) => [...prev, { category: "consultation", description: "", qty: 1, unitPrice: 0, discount: 0, gstPercent: 0 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string | number) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));

  const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  const totalDiscount = items.reduce((s, it) => s + it.discount, 0);
  const totalGst = items.reduce((s, it) => s + ((it.qty * it.unitPrice - it.discount) * it.gstPercent) / 100, 0);
  const grandTotal = subtotal - totalDiscount + totalGst;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create New Invoice</h2>
            <p className="text-sm text-slate-500">Invoice No: {generateInvoiceNumber()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient */}
          <div>
            <label className="text-sm font-medium text-slate-700">Patient</label>
            <select value={selectedPatient} onChange={(e) => setSelectedPatient(e.target.value)} className="mt-1 w-full rounded-lg border-slate-200 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
              <option value="">Select patient...</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}
            </select>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">Line Items</label>
              <button onClick={addItem} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Item</button>
            </div>
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs">
                  <tr>
                    <th className="text-left px-3 py-2.5">Category</th>
                    <th className="text-left px-3 py-2.5">Description</th>
                    <th className="text-center px-3 py-2.5 w-16">Qty</th>
                    <th className="text-right px-3 py-2.5 w-24">Unit Price</th>
                    <th className="text-right px-3 py-2.5 w-20">Discount</th>
                    <th className="text-right px-3 py-2.5 w-16">GST%</th>
                    <th className="text-right px-3 py-2.5 w-24">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, i) => {
                    const lineTotal = it.qty * it.unitPrice - it.discount + ((it.qty * it.unitPrice - it.discount) * it.gstPercent) / 100;
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="px-3 py-2">
                          <select value={it.category} onChange={(e) => updateItem(i, "category", e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400">
                            {["consultation", "procedure", "lab", "pharmacy", "service", "other"].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2"><input value={it.description} onChange={(e) => updateItem(i, "description", e.target.value)} placeholder="Description" className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                        <td className="px-3 py-2"><input type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, "qty", Number(e.target.value))} className="w-full text-center border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} value={it.unitPrice} onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))} className="w-full text-right border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} value={it.discount} onChange={(e) => updateItem(i, "discount", Number(e.target.value))} className="w-full text-right border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                        <td className="px-3 py-2"><input type="number" min={0} value={it.gstPercent} onChange={(e) => updateItem(i, "gstPercent", Number(e.target.value))} className="w-full text-right border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-emerald-400" /></td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">{formatCurrency(lineTotal > 0 ? lineTotal : 0)}</td>
                        <td className="px-2 py-2">{items.length > 1 && <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 max-w-xs ml-auto">
            <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatCurrency(totalDiscount)}</span></div>
            <div className="flex justify-between text-sm text-slate-600"><span>GST</span><span>+{formatCurrency(Math.round(totalGst))}</span></div>
            <div className="flex justify-between text-base font-bold text-slate-900 border-t pt-2"><span>Grand Total</span><span>{formatCurrency(Math.round(grandTotal))}</span></div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Create Invoice</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Payment Collection Modal ----
function PaymentModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const [amount, setAmount] = useState(invoice.balance);
  const [mode, setMode] = useState<PaymentMode>("cash");
  const [refNo, setRefNo] = useState("");
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-bold text-slate-900">Collect Payment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-sm text-slate-500">Invoice: <span className="font-semibold text-slate-900">{invoice.invoiceNo}</span></p>
            <p className="text-sm text-slate-500 mt-1">Patient: <span className="font-semibold text-slate-900">{invoice.patientName}</span></p>
            <div className="flex justify-between mt-3 pt-3 border-t">
              <div><p className="text-xs text-slate-400">Grand Total</p><p className="font-bold text-slate-900">{formatCurrency(invoice.grandTotal)}</p></div>
              <div><p className="text-xs text-slate-400">Paid</p><p className="font-bold text-blue-600">{formatCurrency(invoice.amountPaid)}</p></div>
              <div><p className="text-xs text-slate-400">Balance</p><p className="font-bold text-red-600">{formatCurrency(invoice.balance)}</p></div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} max={invoice.balance} className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Payment Mode</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(Object.keys(paymentModeLabels) as PaymentMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={cn("flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all", mode === m ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                  {paymentModeIcons[m]}
                  {paymentModeLabels[m]}
                </button>
              ))}
            </div>
          </div>
          {mode !== "cash" && (
            <div>
              <label className="text-sm font-medium text-slate-700">Reference / Transaction No.</label>
              <input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="Enter reference number" className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Record Payment</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Receipt Preview Modal ----
function ReceiptPreview({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const patient = patients.find((p) => p.id === invoice.patientId);
  const centre = centres[0];
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h2 className="font-bold text-slate-900">Receipt Preview</h2>
          <div className="flex items-center gap-2">
            <button className="px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1"><Download className="w-4 h-4" /> Download</button>
            <button className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 flex items-center gap-1"><Printer className="w-4 h-4" /> Print</button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8" id="receipt-content">
          {/* Clinic Header */}
          <div className="text-center border-b-2 border-slate-800 pb-4 mb-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl mx-auto mb-2 flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{centre.name}</h1>
            <p className="text-xs text-slate-500 mt-1">{centre.address}</p>
            <p className="text-xs text-slate-500">Phone: {centre.phone} | Email: {centre.email}</p>
            <p className="text-xs text-slate-500">GSTIN: {centre.gstNo} | Reg: {centre.registrationNo}</p>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 bg-slate-100 inline-block px-6 py-1 rounded-full">Payment Receipt</h2>
          </div>

          {/* Invoice & Patient */}
          <div className="grid grid-cols-2 gap-4 text-xs mb-4">
            <div className="space-y-1">
              <p className="text-slate-400 font-semibold uppercase">Patient Details</p>
              <p className="font-semibold text-slate-900">{invoice.patientName}</p>
              <p className="text-slate-600">UHID: {patient?.uhid}</p>
              <p className="text-slate-600">Phone: {invoice.patientPhone}</p>
              {patient?.address && <p className="text-slate-600">{patient.address.line1}, {patient.address.city}</p>}
            </div>
            <div className="space-y-1 text-right">
              <p className="text-slate-400 font-semibold uppercase">Receipt Info</p>
              <p className="font-semibold text-slate-900">Receipt No: {invoice.invoiceNo.replace("INV", "RCP")}</p>
              <p className="text-slate-600">Invoice: {invoice.invoiceNo}</p>
              <p className="text-slate-600">Date: {formatDate(invoice.date)}</p>
              <p className={cn("inline-block px-2 py-0.5 rounded text-xs font-bold mt-1", getStatusColor(invoice.status))}>{invoice.status.toUpperCase()}</p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-xs border border-slate-300 mb-4">
            <thead>
              <tr className="bg-slate-100 text-slate-600 font-semibold">
                <th className="text-left px-3 py-2 border-b border-slate-300">#</th>
                <th className="text-left px-3 py-2 border-b border-slate-300">Description</th>
                <th className="text-center px-3 py-2 border-b border-slate-300">Qty</th>
                <th className="text-right px-3 py-2 border-b border-slate-300">Rate</th>
                <th className="text-right px-3 py-2 border-b border-slate-300">Disc</th>
                <th className="text-right px-3 py-2 border-b border-slate-300">GST</th>
                <th className="text-right px-3 py-2 border-b border-slate-300">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((it, i) => (
                <tr key={it.id} className="border-b border-slate-200">
                  <td className="px-3 py-1.5 text-slate-500">{i + 1}</td>
                  <td className="px-3 py-1.5 text-slate-800">{it.description}</td>
                  <td className="px-3 py-1.5 text-center">{it.quantity}</td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(it.unitPrice)}</td>
                  <td className="px-3 py-1.5 text-right">{it.discount > 0 ? formatCurrency(it.discount) : "—"}</td>
                  <td className="px-3 py-1.5 text-right">{it.gstAmount > 0 ? formatCurrency(it.gstAmount) : "—"}</td>
                  <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(it.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax & Total */}
          <div className="flex justify-end mb-4">
            <div className="w-64 text-xs space-y-1">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              {invoice.totalDiscount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatCurrency(invoice.totalDiscount)}</span></div>}
              {invoice.totalGst > 0 && (
                <>
                  <div className="flex justify-between text-slate-500"><span>CGST ({(invoice.items.find(i => i.gstPercent > 0)?.gstPercent || 0)/2}%)</span><span>{formatCurrency(Math.round(invoice.totalGst / 2))}</span></div>
                  <div className="flex justify-between text-slate-500"><span>SGST ({(invoice.items.find(i => i.gstPercent > 0)?.gstPercent || 0)/2}%)</span><span>{formatCurrency(Math.round(invoice.totalGst / 2))}</span></div>
                </>
              )}
              <div className="flex justify-between font-bold text-slate-900 border-t border-double border-slate-400 pt-1"><span>Grand Total</span><span>{formatCurrency(invoice.grandTotal)}</span></div>
              <div className="flex justify-between text-blue-600"><span>Amount Paid</span><span>{formatCurrency(invoice.amountPaid)}</span></div>
              {invoice.balance > 0 && <div className="flex justify-between text-red-600 font-semibold"><span>Balance Due</span><span>{formatCurrency(invoice.balance)}</span></div>}
            </div>
          </div>

          {/* Amount in words */}
          <div className="border border-slate-200 rounded-lg p-3 mb-4 text-xs">
            <p className="text-slate-400 font-semibold">Amount in Words:</p>
            <p className="text-slate-800 font-medium italic">Indian Rupees {numberToWords(invoice.amountPaid)} Only</p>
          </div>

          {/* Payment Details */}
          {invoice.payments.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">Payment Details:</p>
              {invoice.payments.map((p) => (
                <p key={p.id} className="text-xs text-slate-600">
                  {paymentModeLabels[p.mode]} — {formatCurrency(p.amount)} {p.referenceNo && <>({p.referenceNo})</>} on {formatDate(p.date)} — Received by: {p.receivedBy}
                </p>
              ))}
            </div>
          )}

          {/* QR Code Area */}
          <div className="flex items-start justify-between border-t pt-4">
            <div className="w-20 h-20 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-right text-xs text-slate-500 max-w-xs">
              <p className="font-semibold text-slate-700 mb-1">Authorized Signatory</p>
              <p className="border-t border-slate-300 pt-6 mt-6">{centre.name}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-400 space-y-0.5">
            <p>This is a computer-generated receipt and does not require a physical signature.</p>
            <p>Terms: All payments are non-refundable unless approved by the management. For queries, contact the billing desk.</p>
            <p>Thank you for choosing {centre.name}. We wish you good health!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "receipts">("invoices");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchSearch = inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, statusFilter]);

  // Payment distribution for pie chart
  const allPayments = invoices.flatMap((inv) => inv.payments);
  const paymentDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    allPayments.forEach((p) => { dist[p.mode] = (dist[p.mode] || 0) + p.amount; });
    return Object.entries(dist).map(([mode, amount]) => ({ name: paymentModeLabels[mode as PaymentMode], value: amount }));
  }, []);

  const tabs = [
    { id: "invoices" as const, label: "Invoices", icon: FileText, count: invoices.length },
    { id: "payments" as const, label: "Payments", icon: CreditCard, count: allPayments.length },
    { id: "receipts" as const, label: "Receipts", icon: Receipt, count: invoices.filter((i) => i.amountPaid > 0).length },
  ];

  return (
    <AppLayout>
      {/* Modals */}
      {selectedInvoice && <InvoiceDetail invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {payInvoice && <PaymentModal invoice={payInvoice} onClose={() => setPayInvoice(null)} />}
      {receiptInvoice && <ReceiptPreview invoice={receiptInvoice} onClose={() => setReceiptInvoice(null)} />}
      {showCreateInvoice && <CreateInvoiceModal onClose={() => setShowCreateInvoice(false)} />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Billing &amp; Payments</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage invoices, collect payments and generate receipts</p>
          </div>
          <button onClick={() => setShowCreateInvoice(true)} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>

        {/* Stats */}
        <StatsCards data={invoices} />

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all -mb-px", activeTab === tab.id ? "border-emerald-600 text-emerald-700 bg-emerald-50/40" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50")}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-bold", activeTab === tab.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{tab.count}</span>
              </button>
            ))}
          </div>

          {/* ===================== INVOICES TAB ===================== */}
          {activeTab === "invoices" && (
            <div>
              {/* Filters */}
              <div className="p-4 border-b bg-slate-50/50 flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search patient or invoice..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white">
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Filter className="w-4 h-4" />
                  <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                  <span>to</span>
                  <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
                </div>
              </div>

              {/* Invoice Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-3 font-semibold">Invoice No</th>
                      <th className="text-left px-4 py-3 font-semibold">Patient</th>
                      <th className="text-left px-4 py-3 font-semibold">Date</th>
                      <th className="text-center px-4 py-3 font-semibold">Items</th>
                      <th className="text-right px-4 py-3 font-semibold">Subtotal</th>
                      <th className="text-right px-4 py-3 font-semibold">Disc</th>
                      <th className="text-right px-4 py-3 font-semibold">GST</th>
                      <th className="text-right px-4 py-3 font-semibold">Grand Total</th>
                      <th className="text-right px-4 py-3 font-semibold">Paid</th>
                      <th className="text-right px-4 py-3 font-semibold">Balance</th>
                      <th className="text-center px-4 py-3 font-semibold">Status</th>
                      <th className="text-center px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <React.Fragment key={inv.id}>
                        <tr className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setExpandedRow(expandedRow === inv.id ? null : inv.id)}>
                          <td className="px-4 py-3 font-semibold text-emerald-700">{inv.invoiceNo}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{inv.patientName}</p>
                            <p className="text-xs text-slate-400">{inv.patientPhone}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{formatDate(inv.date)}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{inv.items.length}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(inv.subtotal)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{inv.totalDiscount > 0 ? formatCurrency(inv.totalDiscount) : "—"}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{inv.totalGst > 0 ? formatCurrency(inv.totalGst) : "—"}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                          <td className="px-4 py-3 text-right text-blue-600 font-medium">{formatCurrency(inv.amountPaid)}</td>
                          <td className="px-4 py-3 text-right font-medium text-red-600">{inv.balance > 0 ? formatCurrency(inv.balance) : "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full", getStatusColor(inv.status))}>
                              {statusIcons[inv.status]}
                              {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="View"><Eye className="w-4 h-4" /></button>
                              {inv.balance > 0 && <button onClick={(e) => { e.stopPropagation(); setPayInvoice(inv); }} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500" title="Pay"><CreditCard className="w-4 h-4" /></button>}
                              <button onClick={(e) => { e.stopPropagation(); setReceiptInvoice(inv); }} className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500" title="Print"><Printer className="w-4 h-4" /></button>
                              <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Cancel"><XCircle className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded row preview */}
                        {expandedRow === inv.id && (
                          <tr>
                            <td colSpan={12} className="bg-slate-50 px-6 py-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {inv.items.map((it) => (
                                  <div key={it.id} className="bg-white rounded-lg border border-slate-200 p-3">
                                    <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border", CATEGORY_COLORS[it.category] || CATEGORY_COLORS.other)}>{it.category}</span>
                                    <p className="text-sm font-medium text-slate-900 mt-1.5">{it.description}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{it.quantity} × {formatCurrency(it.unitPrice)} = {formatCurrency(it.totalAmount)}</p>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== PAYMENTS TAB ===================== */}
          {activeTab === "payments" && (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Payment Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Collect */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Collect Payment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Select Invoice</label>
                      <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">Choose an invoice...</option>
                        {invoices.filter((i) => i.balance > 0).map((i) => <option key={i.id} value={i.id}>{i.invoiceNo} — {i.patientName} (Bal: {formatCurrency(i.balance)})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Amount (₹)</label>
                      <input type="number" placeholder="0" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Payment Mode</label>
                      <select className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                        {(Object.keys(paymentModeLabels) as PaymentMode[]).map((m) => <option key={m} value={m}>{paymentModeLabels[m]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Reference No.</label>
                      <input placeholder="Transaction ID" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <button className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Record Payment</button>
                </div>

                {/* Today's Payment Log */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b bg-slate-50">
                    <h3 className="font-bold text-slate-900">Today&apos;s Payments</h3>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 uppercase bg-slate-50/60">
                        <th className="text-left px-4 py-3 font-semibold">Invoice</th>
                        <th className="text-left px-4 py-3 font-semibold">Patient</th>
                        <th className="text-center px-4 py-3 font-semibold">Mode</th>
                        <th className="text-left px-4 py-3 font-semibold">Ref No.</th>
                        <th className="text-right px-4 py-3 font-semibold">Amount</th>
                        <th className="text-left px-4 py-3 font-semibold">Received By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.flatMap((inv) =>
                        inv.payments.map((p) => (
                          <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-emerald-700">{inv.invoiceNo}</td>
                            <td className="px-4 py-3 text-slate-700">{inv.patientName}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {paymentModeIcons[p.mode]}
                                <span className="text-slate-600">{paymentModeLabels[p.mode]}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.referenceNo || "—"}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                            <td className="px-4 py-3 text-slate-600">{p.receivedBy}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={4} className="px-4 py-3 font-bold text-slate-700">Total Collected Today</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700 text-lg">{formatCurrency(allPayments.reduce((s, p) => s + p.amount, 0))}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Right: Pie Chart */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4">Payment Mode Distribution</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={paymentDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={((props: any) => `${props.name || ''} ${(((props.percent || 0)) * 100).toFixed(0)}%`)} labelLine={false}>
                        {paymentDistribution.map((_entry, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {paymentDistribution.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-slate-600">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Summary */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="font-bold mb-4 text-emerald-100">Today&apos;s Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Total Billed</span>
                      <span className="font-bold">{formatCurrency(invoices.reduce((s, i) => s + i.grandTotal, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Total Collected</span>
                      <span className="font-bold">{formatCurrency(invoices.reduce((s, i) => s + i.amountPaid, 0))}</span>
                    </div>
                    <div className="flex justify-between border-t border-emerald-400/30 pt-2">
                      <span className="text-emerald-200">Outstanding</span>
                      <span className="font-bold text-amber-300">{formatCurrency(invoices.reduce((s, i) => s + i.balance, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-200">Collection Rate</span>
                      <span className="font-bold">{Math.round((invoices.reduce((s, i) => s + i.amountPaid, 0) / invoices.reduce((s, i) => s + i.grandTotal, 0)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== RECEIPTS TAB ===================== */}
          {activeTab === "receipts" && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {invoices.filter((inv) => inv.amountPaid > 0).map((inv) => (
                  <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-slate-900">{inv.invoiceNo.replace("INV", "RCP")}</p>
                        <p className="text-xs text-slate-400">{formatDate(inv.date)}</p>
                      </div>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", getStatusColor(inv.status))}>{inv.status.toUpperCase()}</span>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-slate-800">{inv.patientName}</p>
                      <p className="text-xs text-slate-500">{inv.patientPhone}</p>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-slate-400">Amount Paid</p>
                        <p className="text-lg font-bold text-emerald-700">{formatCurrency(inv.amountPaid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Mode</p>
                        <div className="flex items-center gap-1 text-sm">
                          {inv.payments.map((p) => (
                            <span key={p.id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-600">
                              {paymentModeIcons[p.mode]}
                              {paymentModeLabels[p.mode]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setReceiptInvoice(inv)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
                        <Eye className="w-4 h-4" /> Preview
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      <button className="flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
