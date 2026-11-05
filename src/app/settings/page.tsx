"use client";

import React, { FormEvent, useEffect, useState } from "react";
import {
  Building2, Users, Shield, Bell, Printer, Database, UserPlus, X,
  Globe, Save, CheckCircle2, ChevronRight, Key, Mail,
  Monitor, Smartphone, HardDrive, Upload, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { centres } from "@/lib/mock-data";
import AppLayout from "@/components/layout/app-layout";

const tabs = [
  { id: "clinic", label: "Clinic Profile", icon: Building2 },
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "printing", label: "Print Templates", icon: Printer },
  { id: "integrations", label: "Integrations", icon: Globe },
  { id: "backup", label: "Backup & Data", icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("clinic");
  const [saved, setSaved] = useState(false);
  const [accounts, setAccounts] = useState<Array<{
    userId: string;
    name: string;
    loginId: string;
    role: "admin" | "doctor" | "receptionist" | "pharmacist" | "nurse" | "lab_tech";
    phone: string;
    specialization: string | null;
    isActive: number;
    passwordConfigured: number;
  }>>([]);
  const [accountsError, setAccountsError] = useState("");
  const [editingAccount, setEditingAccount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"doctor" | "receptionist" | "pharmacist" | "nurse" | "admin" | "lab_tech">("doctor");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserSpecialization, setNewUserSpecialization] = useState("");

  const newUserLoginId = `${newUserName.trim().replace(/^dr\.?\s*/i, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "")}@clinicos.in`;

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  useEffect(() => {
    if (activeTab !== "users") return;
    let active = true;
    fetch("/api/auth/users", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { users?: typeof accounts; error?: string };
        if (!response.ok) throw new Error(result.error || "Unable to load login accounts.");
        if (active) setAccounts(result.users || []);
      })
      .catch((error: unknown) => {
        if (active) setAccountsError(error instanceof Error ? error.message : "Unable to load login accounts.");
      })
      .finally(() => { if (active) setAccountsLoading(false); });
    return () => { active = false; };
  }, [activeTab]);

  const handleSetPassword = async (event: FormEvent<HTMLFormElement>, userId: string) => {
    event.preventDefault();
    setAccountsError("");
    setPasswordMessage("");
    try {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password: newPassword }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to set this password.");
      setAccounts((current) => current.map((account) => account.userId === userId ? { ...account, passwordConfigured: 1 } : account));
      setEditingAccount("");
      setNewPassword("");
      setPasswordMessage("Password saved securely. It cannot be viewed here.");
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : "Unable to set this password.");
    }
  };

  const handleAddUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAccountsError("");
    setPasswordMessage("");
    try {
      const response = await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newUserName,
          loginId: newUserLoginId,
          role: newUserRole,
          phone: newUserPhone,
          specialization: newUserSpecialization,
        }),
      });
      const result = await response.json() as { user?: typeof accounts[number]; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error || "Unable to add this user.");
      const createdUser = result.user;
      setAccounts((current) => [...current, createdUser].sort((a, b) => a.name.localeCompare(b.name)));
      setNewUserName("");
      setNewUserRole("doctor");
      setNewUserPhone("");
      setNewUserSpecialization("");
      setShowAddUser(false);
      setPasswordMessage(`User added. Set a password for ${createdUser.loginId} below.`);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : "Unable to add this user.");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage clinic configuration and preferences</p>
          </div>
          <button onClick={handleSave} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            saved ? "bg-emerald-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600")}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Sidebar */}
          <div className="bg-white rounded-xl border border-slate-200 p-2 h-fit">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { if (tab.id === "users") setAccountsLoading(true); setActiveTab(tab.id); }}
                className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === tab.id ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50")}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-6">
            {activeTab === "clinic" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Clinic Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Clinic Name</label><input defaultValue="ClinicOS - Koramangala" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Registration No.</label><input defaultValue="KA/BLR/2024/0456" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Phone</label><input defaultValue="080-41234567" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Email</label><input defaultValue="koramangala@clinicos.in" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div className="md:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1">Address</label><textarea defaultValue="No. 42, 80 Feet Road, Koramangala 4th Block, Bangalore - 560034" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">GST Number</label><input defaultValue="29AABCC1234D1ZN" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1">Drug License No.</label><input defaultValue="KA/20B/2024/DL-789" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Multi-Centre Configuration</h3>
                  <div className="space-y-2">
                    {centres.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.address}</p>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800">Users & Roles</h2>
                  <button type="button" onClick={() => { setShowAddUser((current) => !current); setAccountsError(""); }} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                    {showAddUser ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {showAddUser ? "Cancel" : "Add User"}
                  </button>
                </div>
                <p className="text-xs leading-5 text-slate-500">Roles come directly from the Users table. Login IDs use the stored email address. Passwords are stored as secure hashes and are never displayed.</p>
                {showAddUser && (
                  <form onSubmit={(event) => void handleAddUser(event)} className="grid gap-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="new-user-name" className="mb-1.5 block text-xs font-medium text-slate-700">Name</label>
                      <input id="new-user-name" required maxLength={120} value={newUserName} onChange={(event) => setNewUserName(event.target.value)} placeholder="Dr Hitendra Pandey" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="new-user-role" className="mb-1.5 block text-xs font-medium text-slate-700">Role</label>
                      <select id="new-user-role" value={newUserRole} onChange={(event) => setNewUserRole(event.target.value as typeof newUserRole)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-emerald-500">
                        {(["doctor", "receptionist", "pharmacist", "nurse", "admin", "lab_tech"] as const).map((role) => <option key={role} value={role}>{role === "lab_tech" ? "Lab Technician" : role}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="new-user-login" className="mb-1.5 block text-xs font-medium text-slate-700">Login ID</label>
                      <input id="new-user-login" readOnly value={newUserLoginId === "@clinicos.in" ? "" : newUserLoginId} placeholder="firstname.lastname@clinicos.in" className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600" />
                    </div>
                    <div>
                      <label htmlFor="new-user-phone" className="mb-1.5 block text-xs font-medium text-slate-700">Phone (optional)</label>
                      <input id="new-user-phone" type="tel" maxLength={32} value={newUserPhone} onChange={(event) => setNewUserPhone(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    {newUserRole === "doctor" && <div>
                      <label htmlFor="new-user-specialization" className="mb-1.5 block text-xs font-medium text-slate-700">Specialization (optional)</label>
                      <input id="new-user-specialization" maxLength={120} value={newUserSpecialization} onChange={(event) => setNewUserSpecialization(event.target.value)} placeholder="e.g. General Medicine" className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500" />
                    </div>}
                    <div className="flex items-end sm:col-span-2">
                      <button type="submit" disabled={!newUserName.trim() || newUserLoginId === "@clinicos.in"} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">Create account</button>
                      <p className="ml-3 text-xs text-slate-500">The account is added to Users; set its password in the table below.</p>
                    </div>
                  </form>
                )}
                {accountsError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{accountsError}</p>}
                {passwordMessage && <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{passwordMessage}</p>}
                {accountsLoading ? <p className="text-sm text-slate-500">Loading login accounts...</p> : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[690px] text-sm">
                      <thead className="bg-slate-50"><tr>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Login ID</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Access</th>
                        <th className="px-4 py-3 text-left font-medium text-slate-600">Password</th>
                      </tr></thead>
                      <tbody>
                        {accounts.map((account) => (
                          <tr key={account.userId} className="border-t align-top hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-800">{account.name}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{account.specialization || "Doctor"}</p>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{account.loginId}</td>
                            <td className="px-4 py-3"><span className={cn("rounded px-2 py-1 text-[10px] font-semibold capitalize", account.role === "admin" ? "bg-violet-100 text-violet-700" : account.role === "doctor" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700")}>{account.role}</span></td>
                            <td className="px-4 py-3">
                              {editingAccount === account.userId ? (
                                <form onSubmit={(event) => void handleSetPassword(event, account.userId)} className="flex min-w-56 items-center gap-2">
                                  <input aria-label={`New password for ${account.name}`} type="password" autoComplete="new-password" minLength={12} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="12+ characters" className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-xs" />
                                  <button type="submit" className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white">Save</button>
                                  <button type="button" onClick={() => { setEditingAccount(""); setNewPassword(""); }} className="text-xs text-slate-500">Cancel</button>
                                </form>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs", account.passwordConfigured ? "text-emerald-700" : "text-amber-700")}>{account.passwordConfigured ? "Configured" : "Not set"}</span>
                                  <button type="button" onClick={() => { setEditingAccount(account.userId); setNewPassword(""); }} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">{account.passwordConfigured ? "Reset" : "Set password"}</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
                {[
                  { label: "SMS appointment reminders", desc: "Send SMS 2 hours before scheduled appointments", enabled: true },
                  { label: "WhatsApp notifications", desc: "Queue position updates via WhatsApp", enabled: true },
                  { label: "Low stock alerts", desc: "Notify when drug stock falls below reorder level", enabled: true },
                  { label: "Payment reminders", desc: "Send payment reminders for overdue invoices", enabled: false },
                  { label: "Follow-up reminders", desc: "Remind patients about upcoming follow-up visits", enabled: true },
                  { label: "ABDM sync notifications", desc: "Notify on successful health record sync", enabled: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                    <div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
                    <button className={cn("w-11 h-6 rounded-full transition-colors relative", item.enabled ? "bg-emerald-500" : "bg-slate-300")}>
                      <span className={cn("absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", item.enabled ? "right-0.5" : "left-0.5")} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "printing" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Print Templates</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Prescription", "Invoice / Receipt", "Lab Report", "Discharge Summary", "Consent Form", "Patient Card"].map((template) => (
                    <div key={template} className="p-4 border rounded-lg hover:border-emerald-300 cursor-pointer transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Printer className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-700">{template}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Customize layout, header, footer, and branding</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Integrations</h2>
                {[
                  { name: "ABDM (Ayushman Bharat Digital Mission)", status: "connected", desc: "HIP/HIU services, ABHA verification", icon: Shield },
                  { name: "SMS Gateway (MSG91)", status: "connected", desc: "Patient notifications and OTP", icon: Smartphone },
                  { name: "WhatsApp Business API", status: "connected", desc: "Queue updates and appointment reminders", icon: Mail },
                  { name: "Payment Gateway (Razorpay)", status: "pending", desc: "Online payment collection", icon: Key },
                  { name: "Lab Equipment Integration", status: "not-connected", desc: "Automated lab result import", icon: Monitor },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg"><item.icon className="w-5 h-5 text-slate-500" /></div>
                      <div><p className="text-sm font-medium text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.desc}</p></div>
                    </div>
                    <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium",
                      item.status === "connected" ? "bg-emerald-100 text-emerald-700" : item.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                    )}>{item.status === "connected" ? "Connected" : item.status === "pending" ? "Setup Pending" : "Not Connected"}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "backup" && (
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-slate-800">Backup & Data Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2"><HardDrive className="w-4 h-4 text-blue-500" /><span className="text-sm font-medium">Auto Backup</span></div>
                    <p className="text-xs text-slate-500 mb-3">Last backup: Today at 02:00 AM</p>
                    <p className="text-xs text-emerald-600 font-medium">✓ Daily automated backups enabled</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2"><Upload className="w-4 h-4 text-violet-500" /><span className="text-sm font-medium">Export Data</span></div>
                    <p className="text-xs text-slate-500 mb-3">Export patient data, invoices, or inventory</p>
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-violet-500 text-white rounded text-xs font-medium hover:bg-violet-600"><Download className="w-3 h-3" /> Export CSV</button>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Storage Usage</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: "34%" }} /></div>
                    <span className="text-xs text-slate-500">3.4 GB / 10 GB</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
