"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Percent,
  DollarSign,
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  X,
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
} from "lucide-react";

export default function CommissionsPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [data, setData] = useState<any>({
    commissions: [],
    universities: [],
    applications: [],
    unreceivedTotal: 0,
    receivedTotal: 0,
    expectedTotal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCommission, setEditingCommission] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    referenceNumber: "",
    universityId: "",
    applicationId: "",
    tuitionPaid: "",
    tuitionCurrency: "EUR",
    commissionRate: "15",
    commissionAmount: "",
    currency: "EUR",
    status: "expected",
    invoicedDate: "",
    receivedDate: "",
    amountReceived: "0",
    notes: "",
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCommissions = useCallback(async () => {
    try {
      const res = await fetch("/api/commissions");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch commissions error:", err);
      toastError("فشل تحميل عمولات الجامعات");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions, refreshKey]);

  // Recalculate Commission Amount on changes
  const handleTuitionOrRateChange = (tuition: string, rate: string) => {
    const t = parseFloat(tuition) || 0;
    const r = parseFloat(rate) || 0;
    const calculated = (t * r) / 100;
    setForm((prev) => ({
      ...prev,
      tuitionPaid: tuition,
      commissionRate: rate,
      commissionAmount: calculated > 0 ? calculated.toFixed(2) : prev.commissionAmount,
    }));
  };

  const handleOpenAdd = () => {
    setEditingCommission(null);
    const firstUni = data.universities?.[0];
    const defaultRate = firstUni?.commissionValue ? String(firstUni.commissionValue) : "15";

    setForm({
      referenceNumber: `COM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      universityId: firstUni?.id || "",
      applicationId: data.applications?.[0]?.id || "",
      tuitionPaid: "5000",
      tuitionCurrency: "EUR",
      commissionRate: defaultRate,
      commissionAmount: String((5000 * parseFloat(defaultRate)) / 100),
      currency: "EUR",
      status: "expected",
      invoicedDate: "",
      receivedDate: "",
      amountReceived: "0",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCommission(c);
    setForm({
      referenceNumber: c.referenceNumber || "",
      universityId: c.universityId || c.university?.id || "",
      applicationId: c.applicationId || c.application?.id || "",
      tuitionPaid: String(c.tuitionPaid || ""),
      tuitionCurrency: c.tuitionCurrency || "EUR",
      commissionRate: String(c.commissionRate || ""),
      commissionAmount: String(c.commissionAmount || ""),
      currency: c.currency || "EUR",
      status: c.status || "expected",
      invoicedDate: c.invoicedDate ? new Date(c.invoicedDate).toISOString().slice(0, 10) : "",
      receivedDate: c.receivedDate ? new Date(c.receivedDate).toISOString().slice(0, 10) : "",
      amountReceived: String(c.amountReceived || "0"),
      notes: c.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.universityId || !form.applicationId) {
      toastError("يرجى اختيار الجامعة والتقديم المرتبط");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/commissions";
      const method = editingCommission ? "PUT" : "POST";
      const payload = editingCommission ? { ...form, id: editingCommission.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ العمولة");

      success(editingCommission ? "تم تعديل مطالبة العمولة بنجاح" : "تمت إضافة مطالبة العمولة بنجاح");
      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ العمولة");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/commissions?id=${deleteTarget.id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل الحذف");

      success("تم حذف مطالبة العمولة");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCommissions = (data.commissions || []).filter((c: any) => {
    const q = search.toLowerCase();
    const uniName = (c.university?.nameAr || c.university?.nameEn || "").toLowerCase();
    const stuName = (c.application?.student?.fullNameAr || c.application?.student?.fullNameEn || "").toLowerCase();
    const ref = (c.referenceNumber || "").toLowerCase();
    const matchesSearch = !search || uniName.includes(q) || stuName.includes(q) || ref.includes(q);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-indigo-600" />
            <span>{t("commissions", "عمولات الجامعات الشريكة")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة مستحقات أمالون من الرسوم الدراسية وعمولات القبولات الصادرة وفواتير الجامعات
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مطالبة عمولة جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">إجمالي العمولات المتوقعة</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              ${data.expectedTotal?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">العمولات المحصلة فعلياً</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ${data.receivedTotal?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">المتبقي غير المحصل</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ${data.unreceivedTotal?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "الكل" },
            { id: "expected", label: "متوقعة" },
            { id: "invoiced", label: "مفوترة" },
            { id: "partially_received", label: "محصلة جزئياً" },
            { id: "received", label: "محصلة بالكامل" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالجامعة أو الطالب أو الكود..."
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل عمولات الجامعات...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">رقم المطالبة</th>
                  <th className="p-3.5 text-start font-semibold">الجامعة الشريكة</th>
                  <th className="p-3.5 text-start font-semibold">الطالب والتقديم</th>
                  <th className="p-3.5 text-start font-semibold">الرسوم المسددة</th>
                  <th className="p-3.5 text-start font-semibold">نسبة العمولة</th>
                  <th className="p-3.5 text-start font-semibold">مبلغ العمولة</th>
                  <th className="p-3.5 text-start font-semibold">المحصل</th>
                  <th className="p-3.5 text-start font-semibold">الحالة</th>
                  <th className="p-3.5 text-end font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد عمولات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{c.referenceNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.university?.nameAr || c.university?.nameEn}</span>
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        <span className="font-semibold block">
                          {c.application?.student?.fullNameAr || c.application?.student?.fullNameEn}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {c.application?.applicationCode}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">
                        ${c.tuitionPaid?.toLocaleString()} {c.tuitionCurrency}
                      </td>
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                        {c.commissionRate}%
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white text-sm">
                        ${c.commissionAmount?.toLocaleString()} {c.currency}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600">
                        ${c.amountReceived?.toLocaleString()} {c.currency}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            c.status === "received"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : c.status === "partially_received"
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                              : c.status === "invoiced"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {c.status === "received"
                            ? "محصلة بالكامل"
                            : c.status === "partially_received"
                            ? "محصلة جزئياً"
                            : c.status === "invoiced"
                            ? "تمت الفوترة"
                            : "متوقعة"}
                        </span>
                      </td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل المطالبة"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: c.id, name: c.referenceNumber });
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="حذف المطالبة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Percent className="w-5 h-5 text-indigo-600" />
                <span>{editingCommission ? "تعديل مطالبة العمولة" : "إضافة مطالبة عمولة جامعية جديدة"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الجامعة الشريكة *
                  </label>
                  <select
                    value={form.universityId}
                    onChange={(e) => {
                      const uniId = e.target.value;
                      const u = data.universities?.find((x: any) => x.id === uniId);
                      const rate = u?.commissionValue ? String(u.commissionValue) : form.commissionRate;
                      setForm((prev) => ({ ...prev, universityId: uniId }));
                      handleTuitionOrRateChange(form.tuitionPaid, rate);
                    }}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الجامعة...</option>
                    {data.universities?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.nameAr} ({u.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    التقديم / الطالب المرتبط *
                  </label>
                  <select
                    value={form.applicationId}
                    onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر التقديم...</option>
                    {data.applications?.map((app: any) => (
                      <option key={app.id} value={app.id}>
                        {app.student?.fullNameAr} - {app.customMajor || "التقديم"} ({app.applicationCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الرسوم الدراسية المسددة *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.tuitionPaid}
                    onChange={(e) => handleTuitionOrRateChange(e.target.value, form.commissionRate)}
                    placeholder="5000.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة العمولة (%) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={form.commissionRate}
                    onChange={(e) => handleTuitionOrRateChange(form.tuitionPaid, e.target.value)}
                    placeholder="15"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ العمولة المحسوب *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.commissionAmount}
                    onChange={(e) => setForm({ ...form, commissionAmount: e.target.value })}
                    placeholder="750.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العملة *
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value, tuitionCurrency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="EUR">EUR (€ - يورو)</option>
                    <option value="USD">USD ($ - دولار)</option>
                    <option value="GBP">GBP (£ - إسترليني)</option>
                    <option value="TRY">TRY (₺ - تركي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حالة المطالبة *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="expected">متوقعة (قيد المتابعة)</option>
                    <option value="invoiced">تم إرسال الفاتورة للجامعة</option>
                    <option value="partially_received">محصلة جزئياً</option>
                    <option value="received">محصلة بالكامل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ المحصل فعلياً
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amountReceived}
                    onChange={(e) => setForm({ ...form, amountReceived: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ إرسال الفاتورة
                  </label>
                  <input
                    type="date"
                    value={form.invoicedDate}
                    onChange={(e) => setForm({ ...form, invoicedDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ استلام العمولة
                  </label>
                  <input
                    type="date"
                    value={form.receivedDate}
                    onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات المطالبة
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="تفاصيل الحساب البنكي المحول إليه، رقم الفاتورة الصادرة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCommission ? "تحديث المطالبة" : "حفظ المطالبة"}</span>
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
        title="حذف مطالبة العمولة"
        description={`هل أنت متأكد من حذف مطالبة العمولة "${deleteTarget?.name}"؟ سيتم نقلها إلى سلة المحذوفات.`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
