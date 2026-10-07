"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  ShieldCheck,
  Building,
  Phone,
  Mail,
  UserCheck,
  Loader2,
  Plus,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  MapPin,
  Globe,
  Search,
  Lock,
  Save,
  Users,
  Building2,
} from "lucide-react";

export default function EmployeesPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"employees" | "branches">("employees");
  const [data, setData] = useState<any>({ users: [], branches: [], roles: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Employee Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    roleId: "",
    branchId: "",
    isActive: true,
  });

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [savingBranch, setSavingBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({
    name: "",
    code: "",
    city: "",
    country: "",
    address: "",
    phone: "",
    email: "",
    isHeadquarter: false,
    isActive: true,
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "employee" | "branch" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
      toastError("فشل تحميل بيانات الموظفين والفروع");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // Employee Actions
  const handleOpenAddEmployee = () => {
    setEditingEmployee(null);
    setEmployeeForm({
      name: "",
      email: "",
      password: "",
      phone: "",
      roleId: data.roles?.[0]?.id || "",
      branchId: data.branches?.[0]?.id || "",
      isActive: true,
    });
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (user: any) => {
    setEditingEmployee(user);
    setEmployeeForm({
      name: user.name || "",
      email: user.email || "",
      password: "", // Leave blank if unchanged
      phone: user.phone || "",
      roleId: user.roleId || user.role?.id || "",
      branchId: user.branchId || user.branch?.id || "",
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.email.trim()) {
      toastError("الاسم والبريد الإلكتروني مطلوبان");
      return;
    }
    if (!editingEmployee && !employeeForm.password.trim()) {
      toastError("كلمة المرور مطلوبة للموظف الجديد");
      return;
    }

    setSavingEmployee(true);
    try {
      const url = "/api/employees";
      const method = editingEmployee ? "PUT" : "POST";
      const payload = {
        ...employeeForm,
        ...(editingEmployee ? { id: editingEmployee.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ الموظف");

      success(editingEmployee ? "تم تحديث بيانات الموظف بنجاح" : "تمت إضافة الموظف بنجاح");
      setIsEmployeeModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ الموظف");
    } finally {
      setSavingEmployee(false);
    }
  };

  // Branch Actions
  const handleOpenAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({
      name: "",
      code: `BR-${Math.floor(100 + Math.random() * 900)}`,
      city: "",
      country: "",
      address: "",
      phone: "",
      email: "",
      isHeadquarter: false,
      isActive: true,
    });
    setIsBranchModalOpen(true);
  };

  const handleOpenEditBranch = (b: any) => {
    setEditingBranch(b);
    setBranchForm({
      name: b.name || "",
      code: b.code || "",
      city: b.city || "",
      country: b.country || "",
      address: b.address || "",
      phone: b.phone || "",
      email: b.email || "",
      isHeadquarter: b.isHeadquarter || false,
      isActive: b.isActive !== undefined ? b.isActive : true,
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name.trim()) {
      toastError("اسم الفرع مطلوب");
      return;
    }

    setSavingBranch(true);
    try {
      const url = "/api/branches";
      const method = editingBranch ? "PUT" : "POST";
      const payload = {
        ...branchForm,
        ...(editingBranch ? { id: editingBranch.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ الفرع");

      success(editingBranch ? "تم تحديث بيانات الفرع بنجاح" : "تمت إضافة الفرع بنجاح");
      setIsBranchModalOpen(false);
      setRefreshKey((k) => k + 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("amalon:branches-updated"));
      }
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ الفرع");
    } finally {
      setSavingBranch(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const url =
        deleteTarget.type === "employee"
          ? `/api/employees?id=${deleteTarget.id}`
          : `/api/branches?id=${deleteTarget.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل الحذف");

      success(deleteTarget.type === "employee" ? "تم حذف الموظف بنجاح" : "تم حذف الفرع بنجاح");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
      if (deleteTarget.type === "branch" && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("amalon:branches-updated"));
      }
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered lists
  const filteredUsers = (data.users || []).filter((u: any) => {
    const q = search.toLowerCase();
    const nameMatch = (u.name || "").toLowerCase().includes(q);
    const emailMatch = (u.email || "").toLowerCase().includes(q);
    const phoneMatch = (u.phone || "").toLowerCase().includes(q);
    const roleMatch = (u.role?.displayName || u.role?.name || "").toLowerCase().includes(q);
    return !search || nameMatch || emailMatch || phoneMatch || roleMatch;
  });

  const filteredBranches = (data.branches || []).filter((b: any) => {
    const q = search.toLowerCase();
    const nameMatch = (b.name || "").toLowerCase().includes(q);
    const cityMatch = (b.city || "").toLowerCase().includes(q);
    const countryMatch = (b.country || "").toLowerCase().includes(q);
    const codeMatch = (b.code || "").toLowerCase().includes(q);
    return !search || nameMatch || cityMatch || countryMatch || codeMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>{t("employees", "فريق العمل والفروع الدولية")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة الموظفين، الفروع الدولية، وتوزيع الصلاحيات الإدارية
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "employees" ? (
            <button
              onClick={handleOpenAddEmployee}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddBranch}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة فرع جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("employees")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "employees"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الموظفون ({data.users?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("branches")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "branches"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>الفروع والمكاتب ({data.branches?.length || 0})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "employees" ? "بحث في الموظفين..." : "بحث في الفروع..."}
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">جاري تحميل بيانات الموظفين والفروع...</p>
        </div>
      ) : activeTab === "employees" ? (
        /* Employees Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              لا يوجد موظفون مطابقون للشروط
            </div>
          ) : (
            filteredUsers.map((u: any) => (
              <div
                key={u.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {u.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{u.name}</h3>
                        <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                          {u.role?.displayName || u.role?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditEmployee(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل الموظف"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: u.id, name: u.name, type: "employee" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="حذف الموظف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-mono">{u.email}</span>
                    </div>
                    {u.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{u.phone}</span>
                      </div>
                    )}
                    {u.branch && (
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{u.branch.name.split("(")[0].trim()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {u.isActive ? "نشط" : "معطل"}
                  </span>
                  <span className="text-slate-400 font-mono">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : "-"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Branches Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBranches.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              لا توجد فروع مطابقة
            </div>
          ) : (
            filteredBranches.map((b: any) => (
              <div
                key={b.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-xs flex flex-col justify-between gap-4 transition ${
                  b.isHeadquarter
                    ? "border-indigo-400 dark:border-indigo-800 bg-indigo-50/10 dark:bg-indigo-950/10"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">{b.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">{b.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditBranch(b)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل الفرع"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: b.id, name: b.name, type: "branch" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="حذف الفرع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {b.isHeadquarter && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold">
                      🏢 المقر الرئيسي (Headquarters)
                    </span>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {b.city}، {b.country}
                      </span>
                    </div>
                    {b.address && <p className="text-[11px] text-slate-400 line-clamp-1">{b.address}</p>}
                    {b.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{b.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <span>الموظفون: {b._count?.users || 0}</span>
                  <span>الطلاب: {b._count?.students || 0}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>{editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</span>
              </h3>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الموظف بالكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    placeholder="مثال: م. أحمد عبد العزيز"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="ahmed@amalon.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {editingEmployee ? "كلمة المرور (اتركها فارغة للتخطي)" : "كلمة المرور *"}
                  </label>
                  <input
                    type="password"
                    required={!editingEmployee}
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف / الواتساب
                  </label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    placeholder="+20 100 000 0000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الدور والصلاحيات *
                  </label>
                  <select
                    value={employeeForm.roleId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, roleId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الدور...</option>
                    {data.roles?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.displayName || r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الفرع التابع له
                  </label>
                  <select
                    value={employeeForm.branchId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, branchId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">عام (بدون فرع مخصص / الإدارة العليا)</option>
                    {data.branches?.map((b: any) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="employeeActive"
                    checked={employeeForm.isActive}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="employeeActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    حساب الموظف نشط ويمكنه تسجيل الدخول
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEmployee}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingEmployee ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingEmployee ? "تحديث الموظف" : "حفظ الموظف"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>{editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع دولي جديد"}</span>
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اسم الفرع *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    placeholder="مثال: فرع الرياض - المملكة العربية السعودية"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رمز الفرع (Code) *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    placeholder="RUH-01"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المدينة *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    placeholder="الرياض"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الدولة *
                  </label>
                  <input
                    type="text"
                    required
                    value={branchForm.country}
                    onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                    placeholder="السعودية"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    هاتف الفرع
                  </label>
                  <input
                    type="text"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    placeholder="+966 11 000 0000"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني للفرع
                  </label>
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    placeholder="riyadh@amalon.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العنوان التفصيلي
                  </label>
                  <input
                    type="text"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    placeholder="طريق الملك فهد، برج الفيصلية، الطابق 10"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="branchHq"
                    checked={branchForm.isHeadquarter}
                    onChange={(e) => setBranchForm({ ...branchForm, isHeadquarter: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="branchHq" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    تعيين كمقر رئيسي للشركة (Headquarters)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingBranch}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingBranch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingBranch ? "تحديث الفرع" : "حفظ الفرع"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "employee" ? "حذف الموظف" : "حذف الفرع"}
        description={`هل أنت متأكد من حذف ${deleteTarget?.type === "employee" ? "الموظف" : "الفرع"} "${deleteTarget?.name}"؟`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
