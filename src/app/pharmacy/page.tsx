"use client";

import React, { useState, useMemo } from "react";
import {
  Pill,
  Search,
  Plus,
  ShoppingCart,
  Package,
  AlertTriangle,
  XCircle,
  IndianRupee,
  Clock,
  Truck,
  Users,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Hash,
  ClipboardList,
  ArrowRight,
  Printer,
  ScanLine,
  PackageCheck,
  History,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { drugs, suppliers, prescriptions, patients, users } from "@/lib/mock-data";
import type { Drug, Supplier, PurchaseOrder, PurchaseOrderItem } from "@/lib/types";
import AppLayout from "@/components/layout/app-layout";

// ---- Inline Purchase Order mock data ----
const purchaseOrders: PurchaseOrder[] = [
  {
    id: "po1",
    orderNo: "PO-2610-001",
    supplierId: "s1",
    supplierName: "MedSupply India Pvt Ltd",
    items: [
      { drugId: "d1", drugName: "Metformin 500mg", quantity: 500, unitPrice: 28, totalPrice: 14000, receivedQuantity: 500 },
      { drugId: "d5", drugName: "Paracetamol 650mg", quantity: 1000, unitPrice: 18, totalPrice: 18000, receivedQuantity: 1000 },
      { drugId: "d6", drugName: "Cetirizine 10mg", quantity: 500, unitPrice: 15, totalPrice: 7500, receivedQuantity: 500 },
    ],
    totalAmount: 39500,
    status: "received",
    orderDate: "2026-10-15",
    expectedDate: "2026-10-20",
    receivedDate: "2026-10-19",
  },
  {
    id: "po2",
    orderNo: "PO-2610-002",
    supplierId: "s2",
    supplierName: "PharmaDirect Solutions",
    items: [
      { drugId: "d2", drugName: "Amlodipine 5mg", quantity: 300, unitPrice: 32, totalPrice: 9600 },
      { drugId: "d8", drugName: "Atorvastatin 10mg", quantity: 200, unitPrice: 44, totalPrice: 8800 },
      { drugId: "d4", drugName: "Pantoprazole 40mg", quantity: 400, unitPrice: 42, totalPrice: 16800 },
    ],
    totalAmount: 35200,
    status: "ordered",
    orderDate: "2026-10-28",
    expectedDate: "2026-11-03",
  },
  {
    id: "po3",
    orderNo: "PO-2610-003",
    supplierId: "s3",
    supplierName: "HealthWholesale Corp",
    items: [
      { drugId: "d7", drugName: "Amoxicillin 500mg", quantity: 500, unitPrice: 52, totalPrice: 26000 },
      { drugId: "d3", drugName: "Azithromycin 500mg", quantity: 300, unitPrice: 58, totalPrice: 17400 },
    ],
    totalAmount: 43400,
    status: "partial",
    orderDate: "2026-10-22",
    expectedDate: "2026-10-28",
    receivedDate: "2026-10-27",
  },
  {
    id: "po4",
    orderNo: "PO-2610-004",
    supplierId: "s1",
    supplierName: "MedSupply India Pvt Ltd",
    items: [
      { drugId: "d9", drugName: "Insulin Glargine 100IU/ml", quantity: 30, unitPrice: 1100, totalPrice: 33000 },
      { drugId: "d10", drugName: "Salbutamol 100mcg Inhaler", quantity: 50, unitPrice: 95, totalPrice: 4750 },
      { drugId: "d11", drugName: "Betamethasone Cream 0.1%", quantity: 100, unitPrice: 75, totalPrice: 7500 },
    ],
    totalAmount: 45250,
    status: "draft",
    orderDate: "2026-10-31",
    expectedDate: "2026-11-07",
  },
];

// ---- Inline dispensing history ----
const dispensingHistory = [
  {
    id: "dh1",
    prescriptionNo: "RX-2610-001",
    patientName: "Arun Kumar Verma",
    doctorName: "Dr. Priya Sharma",
    items: [
      { drugName: "Metformin 1000mg", qty: 60 },
      { drugName: "Glimepiride 1mg", qty: 30 },
      { drugName: "Amlodipine 5mg", qty: 30 },
    ],
    dispensedBy: "Suresh Kumar",
    dispensedAt: "2026-10-31T10:30:00",
    totalAmount: 892,
    status: "dispensed" as const,
  },
];

type TabType = "inventory" | "purchase-orders" | "suppliers" | "dispensing";

function getStockStatus(drug: Drug): "in-stock" | "low-stock" | "out-of-stock" {
  if (drug.currentStock === 0) return "out-of-stock";
  if (drug.currentStock < drug.minStock) return "low-stock";
  return "in-stock";
}

function getScheduleBadgeColor(schedule: string): string {
  switch (schedule) {
    case "H": return "bg-blue-100 text-blue-700 border-blue-200";
    case "H1": return "bg-purple-100 text-purple-700 border-purple-200";
    case "X": return "bg-red-100 text-red-700 border-red-200";
    case "OTC": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function getPOStatusColor(status: string): string {
  switch (status) {
    case "draft": return "bg-slate-100 text-slate-600";
    case "ordered": return "bg-blue-100 text-blue-700";
    case "received": return "bg-emerald-100 text-emerald-700";
    case "partial": return "bg-amber-100 text-amber-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

export default function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [showAddDrugModal, setShowAddDrugModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [dispensingStep, setDispensingStep] = useState<number>(0);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);

  // Compute stats
  const totalDrugs = drugs.length;
  const inStockCount = drugs.filter(d => getStockStatus(d) === "in-stock").length;
  const lowStockCount = drugs.filter(d => getStockStatus(d) === "low-stock").length;
  const outOfStockCount = drugs.filter(d => getStockStatus(d) === "out-of-stock").length;
  const totalValue = drugs.reduce((sum, d) => sum + d.currentStock * d.purchasePrice, 0);

  // Get unique categories and manufacturers
  const categories = [...new Set(drugs.map(d => d.category))];
  const manufacturers = [...new Set(drugs.map(d => d.manufacturer))];

  // Filtered drugs
  const filteredDrugs = useMemo(() => {
    return drugs.filter(d => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.genericName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;
      const matchesMfr = manufacturerFilter === "all" || d.manufacturer === manufacturerFilter;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "low" && getStockStatus(d) === "low-stock") ||
        (stockFilter === "out" && getStockStatus(d) === "out-of-stock") ||
        (stockFilter === "in" && getStockStatus(d) === "in-stock");
      return matchesSearch && matchesCategory && matchesMfr && matchesStock;
    });
  }, [searchQuery, categoryFilter, manufacturerFilter, stockFilter]);

  const pendingPrescriptions = prescriptions.filter(p => p.status === "created");

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "inventory", label: "Drug Inventory", icon: <Pill className="w-4 h-4" /> },
    { id: "purchase-orders", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4" />, count: purchaseOrders.filter(po => po.status === "ordered" || po.status === "partial").length },
    { id: "suppliers", label: "Suppliers", icon: <Truck className="w-4 h-4" /> },
    { id: "dispensing", label: "Dispensing", icon: <PackageCheck className="w-4 h-4" />, count: pendingPrescriptions.length },
  ];

  const statsCards = [
    { label: "Total Drugs", value: totalDrugs, icon: <Pill className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "In Stock", value: inStockCount, icon: <Package className="w-5 h-5" />, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "Low Stock", value: lowStockCount, icon: <AlertTriangle className="w-5 h-5" />, color: "text-amber-600 bg-amber-50 border-amber-100", highlight: lowStockCount > 0 },
    { label: "Out of Stock", value: outOfStockCount, icon: <XCircle className="w-5 h-5" />, color: "text-red-600 bg-red-50 border-red-100", highlight: outOfStockCount > 0 },
    { label: "Total Value", value: formatCurrency(totalValue), icon: <IndianRupee className="w-5 h-5" />, color: "text-teal-600 bg-teal-50 border-teal-100", isString: true },
    { label: "Expiring Soon", value: 3, icon: <Clock className="w-5 h-5" />, color: "text-orange-600 bg-orange-50 border-orange-100" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Pill className="w-7 h-7 text-emerald-600" />
              Pharmacy &amp; Inventory
            </h1>
            <p className="text-sm text-slate-500 mt-1">Manage drug inventory, purchase orders, suppliers &amp; dispensing</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddDrugModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Drug
            </button>
            <button
              onClick={() => setShowCreatePOModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium border border-slate-200 shadow-sm"
            >
              <ShoppingCart className="w-4 h-4" />
              Purchase Order
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className={cn(
                "bg-white rounded-xl border p-4 shadow-sm transition-all",
                card.highlight && "ring-2 ring-offset-1",
                card.highlight && card.label === "Low Stock" && "ring-amber-300",
                card.highlight && card.label === "Out of Stock" && "ring-red-300"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
                <span className={cn("p-1.5 rounded-lg", card.color)}>{card.icon}</span>
              </div>
              <p className="text-xl font-bold text-slate-800">{card.isString ? card.value : card.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="border-b border-slate-200">
            <nav className="flex gap-0 overflow-x-auto px-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full font-semibold">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-5">
            {/* Drug Inventory Tab */}
            {activeTab === "inventory" && (
              <div className="space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by drug name or generic name..."
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    value={manufacturerFilter}
                    onChange={(e) => setManufacturerFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="all">All Manufacturers</option>
                    {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="all">All Stock</option>
                    <option value="in">In Stock</option>
                    <option value="low">Low Stock</option>
                    <option value="out">Out of Stock</option>
                  </select>
                </div>

                {/* Drug Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Drug Name</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Generic Name</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Category</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Form</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Strength</th>
                        <th className="text-center px-3 py-3 font-semibold text-slate-600">Schedule</th>
                        <th className="text-right px-3 py-3 font-semibold text-slate-600">MRP</th>
                        <th className="text-right px-3 py-3 font-semibold text-slate-600">Stock</th>
                        <th className="text-right px-3 py-3 font-semibold text-slate-600">Min Stock</th>
                        <th className="text-left px-3 py-3 font-semibold text-slate-600">Rack</th>
                        <th className="text-center px-3 py-3 font-semibold text-slate-600">Status</th>
                        <th className="text-center px-3 py-3 font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredDrugs.map((drug) => {
                        const status = getStockStatus(drug);
                        return (
                          <tr
                            key={drug.id}
                            className={cn(
                              "hover:bg-slate-50 transition-colors",
                              status === "low-stock" && "bg-amber-50/50",
                              status === "out-of-stock" && "bg-red-50/50"
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-800">{drug.name}</div>
                              <div className="text-xs text-slate-400">{drug.manufacturer}</div>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{drug.genericName}</td>
                            <td className="px-3 py-3 text-slate-600">{drug.category}</td>
                            <td className="px-3 py-3 text-slate-600">{drug.dosageForm}</td>
                            <td className="px-3 py-3 text-slate-600">{drug.strength}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn("px-2 py-0.5 rounded text-xs font-semibold border", getScheduleBadgeColor(drug.schedule))}>
                                {drug.schedule}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-slate-700">₹{drug.mrp}</td>
                            <td className={cn("px-3 py-3 text-right font-semibold", status === "out-of-stock" ? "text-red-600" : status === "low-stock" ? "text-amber-600" : "text-slate-700")}>
                              {drug.currentStock.toLocaleString("en-IN")}
                            </td>
                            <td className="px-3 py-3 text-right text-slate-500">{drug.minStock.toLocaleString("en-IN")}</td>
                            <td className="px-3 py-3 text-slate-600 font-mono text-xs">{drug.rackLocation}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-semibold",
                                status === "in-stock" && "bg-emerald-100 text-emerald-700",
                                status === "low-stock" && "bg-amber-100 text-amber-700",
                                status === "out-of-stock" && "bg-red-100 text-red-700"
                              )}>
                                {status === "in-stock" ? "In Stock" : status === "low-stock" ? "Low Stock" : "Out of Stock"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-emerald-600 transition-colors" title="View">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Edit">
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="text-xs text-slate-500 text-right">
                  Showing {filteredDrugs.length} of {drugs.length} drugs
                </div>
              </div>
            )}

            {/* Purchase Orders Tab */}
            {activeTab === "purchase-orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Purchase Orders</h3>
                  <button
                    onClick={() => setShowCreatePOModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Create PO
                  </button>
                </div>

                <div className="space-y-3">
                  {purchaseOrders.map((po) => (
                    <div key={po.id} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}
                        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-6">
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-800">{po.orderNo}</p>
                            <p className="text-xs text-slate-500">{po.supplierName}</p>
                          </div>
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", getPOStatusColor(po.status))}>
                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{formatCurrency(po.totalAmount)}</p>
                            <p className="text-xs text-slate-500">{po.items.length} items</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Ordered: {formatDate(po.orderDate)}</p>
                            <p className="text-xs text-slate-500">Expected: {formatDate(po.expectedDate)}</p>
                          </div>
                          {expandedPO === po.id ? (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>
                      {expandedPO === po.id && (
                        <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-slate-500">
                                <th className="text-left py-2 font-medium">Drug</th>
                                <th className="text-right py-2 font-medium">Qty Ordered</th>
                                <th className="text-right py-2 font-medium">Unit Price</th>
                                <th className="text-right py-2 font-medium">Total</th>
                                {po.status === "received" || po.status === "partial" ? (
                                  <th className="text-right py-2 font-medium">Received</th>
                                ) : null}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {po.items.map((item, i) => (
                                <tr key={i}>
                                  <td className="py-2 text-slate-700">{item.drugName}</td>
                                  <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                                  <td className="py-2 text-right text-slate-700">{formatCurrency(item.unitPrice)}</td>
                                  <td className="py-2 text-right font-medium text-slate-800">{formatCurrency(item.totalPrice)}</td>
                                  {po.status === "received" || po.status === "partial" ? (
                                    <td className="py-2 text-right">
                                      <span className={cn("font-medium", item.receivedQuantity === item.quantity ? "text-emerald-600" : "text-amber-600")}>
                                        {item.receivedQuantity ?? 0}
                                      </span>
                                    </td>
                                  ) : null}
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-slate-300">
                                <td className="py-2 font-semibold text-slate-800" colSpan={3}>Total</td>
                                <td className="py-2 text-right font-bold text-slate-800">{formatCurrency(po.totalAmount)}</td>
                                {po.status === "received" || po.status === "partial" ? <td></td> : null}
                              </tr>
                            </tfoot>
                          </table>
                          {po.receivedDate && (
                            <p className="text-xs text-slate-500 mt-2">
                              Received on: {formatDate(po.receivedDate)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === "suppliers" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">Suppliers ({suppliers.length})</h3>
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Supplier
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suppliers.map((supplier) => {
                    const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id);
                    const totalOrdered = supplierPOs.reduce((sum, po) => sum + po.totalAmount, 0);
                    return (
                      <div key={supplier.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800 text-sm">{supplier.name}</h4>
                              <p className="text-xs text-slate-500">{supplier.contactPerson}</p>
                            </div>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", supplier.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500")}>
                            {supplier.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {supplier.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {supplier.email}
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                            <span className="line-clamp-2">{supplier.address}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1"><Hash className="w-3 h-3" /> GST</span>
                            <span className="font-mono text-slate-700">{supplier.gstNo}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Drug License</span>
                            <span className="font-mono text-slate-700">{supplier.drugLicenseNo}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-xs">
                          <span className="text-slate-500">{supplierPOs.length} orders</span>
                          <span className="font-semibold text-slate-700">{formatCurrency(totalOrdered)} total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dispensing Tab */}
            {activeTab === "dispensing" && (
              <div className="space-y-6">
                {/* Pending Prescriptions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                    Pending Prescriptions ({pendingPrescriptions.length})
                  </h3>
                  {pendingPrescriptions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                      <p>All prescriptions dispensed!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingPrescriptions.map((rx) => {
                        const patient = patients.find(p => p.id === rx.patientId);
                        const doctor = users.find(u => u.id === rx.doctorId);
                        const isSelected = selectedPrescription === rx.id;
                        return (
                          <div key={rx.id} className={cn("border rounded-lg overflow-hidden transition-all", isSelected ? "border-emerald-300 ring-2 ring-emerald-100" : "border-slate-200")}>
                            <div className="flex items-center justify-between px-5 py-4 bg-white">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{rx.prescriptionNo}</p>
                                  <p className="text-sm text-slate-500">{rx.patientName} • {patient?.uhid}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right text-sm">
                                  <p className="text-slate-600">{rx.doctorName}</p>
                                  <p className="text-xs text-slate-400">{rx.items.length} items</p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedPrescription(isSelected ? null : rx.id);
                                    setDispensingStep(isSelected ? 0 : 1);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                >
                                  <ScanLine className="w-4 h-4" />
                                  Dispense
                                </button>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="border-t border-slate-200 bg-slate-50 p-5">
                                {/* Dispensing Steps */}
                                <div className="flex items-center gap-4 mb-4">
                                  {["Select Rx", "Verify Items", "Check Stock", "Dispense"].map((step, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                      <div className={cn(
                                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                                        dispensingStep > i + 1 ? "bg-emerald-600 text-white" : dispensingStep === i + 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                                      )}>
                                        {dispensingStep > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                      </div>
                                      <span className={cn("text-xs font-medium", dispensingStep >= i + 1 ? "text-emerald-700" : "text-slate-400")}>{step}</span>
                                      {i < 3 && <ArrowRight className="w-3 h-3 text-slate-300" />}
                                    </div>
                                  ))}
                                </div>

                                {/* Items Table */}
                                <table className="w-full text-sm mb-4">
                                  <thead>
                                    <tr className="text-slate-500 border-b border-slate-200">
                                      <th className="text-left py-2 font-medium">Drug</th>
                                      <th className="text-left py-2 font-medium">Dosage</th>
                                      <th className="text-left py-2 font-medium">Frequency</th>
                                      <th className="text-right py-2 font-medium">Qty</th>
                                      <th className="text-center py-2 font-medium">Stock</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {rx.items.map((item) => {
                                      const matchedDrug = drugs.find(d => d.genericName.toLowerCase().includes(item.genericName.toLowerCase().split(" ")[0]));
                                      const hasStock = matchedDrug ? matchedDrug.currentStock >= item.quantity : false;
                                      return (
                                        <tr key={item.id}>
                                          <td className="py-2 font-medium text-slate-700">{item.drugName}</td>
                                          <td className="py-2 text-slate-600">{item.dosage}</td>
                                          <td className="py-2 text-slate-600">{item.frequency}</td>
                                          <td className="py-2 text-right text-slate-700">{item.quantity}</td>
                                          <td className="py-2 text-center">
                                            {matchedDrug ? (
                                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", hasStock ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                                                {hasStock ? `✓ ${matchedDrug.currentStock}` : `✗ ${matchedDrug.currentStock}`}
                                              </span>
                                            ) : (
                                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">N/A</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>

                                <div className="flex justify-end gap-3">
                                  <button
                                    onClick={() => {
                                      setSelectedPrescription(null);
                                      setDispensingStep(0);
                                    }}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  {dispensingStep < 4 ? (
                                    <button
                                      onClick={() => setDispensingStep(s => s + 1)}
                                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                    >
                                      Next Step
                                      <ArrowRight className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setSelectedPrescription(null);
                                        setDispensingStep(0);
                                      }}
                                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      Confirm Dispense
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Dispensing History */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" />
                    Dispensing History
                  </h3>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-slate-600">Rx No</th>
                          <th className="text-left px-3 py-3 font-semibold text-slate-600">Patient</th>
                          <th className="text-left px-3 py-3 font-semibold text-slate-600">Doctor</th>
                          <th className="text-left px-3 py-3 font-semibold text-slate-600">Items</th>
                          <th className="text-right px-3 py-3 font-semibold text-slate-600">Amount</th>
                          <th className="text-left px-3 py-3 font-semibold text-slate-600">Dispensed By</th>
                          <th className="text-left px-3 py-3 font-semibold text-slate-600">Time</th>
                          <th className="text-center px-3 py-3 font-semibold text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dispensingHistory.map((dh) => (
                          <tr key={dh.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{dh.prescriptionNo}</td>
                            <td className="px-3 py-3 text-slate-700">{dh.patientName}</td>
                            <td className="px-3 py-3 text-slate-600">{dh.doctorName}</td>
                            <td className="px-3 py-3">
                              <div className="space-y-0.5">
                                {dh.items.map((item, i) => (
                                  <p key={i} className="text-xs text-slate-600">{item.drugName} × {item.qty}</p>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right font-medium text-slate-700">{formatCurrency(dh.totalAmount)}</td>
                            <td className="px-3 py-3 text-slate-600">{dh.dispensedBy}</td>
                            <td className="px-3 py-3 text-slate-500 text-xs">{formatDate(dh.dispensedAt)}</td>
                            <td className="px-3 py-3 text-center">
                              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                Dispensed
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Drug Modal */}
      {showAddDrugModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Add New Drug</h3>
              <button onClick={() => setShowAddDrugModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Drug Name *</label>
                  <input type="text" placeholder="e.g., Metformin 500mg" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Generic Name *</label>
                  <input type="text" placeholder="e.g., Metformin Hydrochloride" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Manufacturer *</label>
                  <input type="text" placeholder="e.g., Cipla Ltd" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Dosage Form *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Select Form</option>
                    {["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Powder", "Gel", "Ointment"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Strength *</label>
                  <input type="text" placeholder="e.g., 500mg" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Schedule *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="H">H</option>
                    <option value="H1">H1</option>
                    <option value="X">X</option>
                    <option value="OTC">OTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">HSN Code</label>
                  <input type="text" placeholder="e.g., 30049099" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">MRP (₹) *</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Price (₹) *</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">GST %</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit *</label>
                  <input type="text" placeholder="e.g., Strip of 10" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Stock</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Stock</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reorder Level</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rack Location</label>
                  <input type="text" placeholder="e.g., A1-01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowAddDrugModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setShowAddDrugModal(false)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Save Drug
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Add New Supplier</h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier Name *</label>
                <input type="text" placeholder="Company name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contact Person *</label>
                <input type="text" placeholder="Name" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone *</label>
                  <input type="tel" placeholder="9XXXXXXXXX" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email *</label>
                  <input type="email" placeholder="email@company.in" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">GST Number *</label>
                  <input type="text" placeholder="29AABCC1234D1ZN" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Drug License No *</label>
                  <input type="text" placeholder="KA/20B/2020/1234" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Address *</label>
                <textarea placeholder="Full address" rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowAddSupplierModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setShowAddSupplierModal(false)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Save Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create PO Modal */}
      {showCreatePOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Create Purchase Order</h3>
              <button onClick={() => setShowCreatePOModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Supplier *</label>
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Delivery Date *</label>
                  <input type="date" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Add Items</label>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-slate-600">Drug</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-600">Qty</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-600">Unit Price</th>
                        <th className="text-right px-3 py-2 font-medium text-slate-600">Total</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="px-4 py-2">
                          <select className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm outline-none bg-white">
                            <option value="">Select Drug</option>
                            {drugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" placeholder="0" className="w-20 px-2 py-1.5 border border-slate-200 rounded text-sm text-right outline-none" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" placeholder="0" className="w-20 px-2 py-1.5 border border-slate-200 rounded text-sm text-right outline-none" />
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-600">₹0</td>
                        <td className="px-3 py-2">
                          <button className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-slate-200">
                    <button className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                      <Plus className="w-4 h-4" />
                      Add Another Item
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button onClick={() => setShowCreatePOModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={() => setShowCreatePOModal(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  Save as Draft
                </button>
                <button onClick={() => setShowCreatePOModal(false)} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
