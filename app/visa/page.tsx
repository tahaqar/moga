"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Stamp,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  X,
  Save,
} from "lucide-react";

export default function VisaPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [visaCases, setVisaCases] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentId: "",
    countryId: "",
    embassyLocation: "الرياض",
    appointmentDate: "",
    submissionDate: "",
    status: "preparing_documents",
    visaDuration: "1 year",
    notes: "",
  });

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/visa");
      if (res.ok) {
        const data = await res.json();
        setVisaCases(data.visaCases || []);
        setStudents(data.students || []);
        setCountries(data.countries || []);
      }
    } catch (err) {
      console.error("Fetch visa error:", err);
      toastError("فشل تحميل ملفات التأشيرة");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingCase(null);
    setFormData({
      studentId: students[0]?.id || "",
      countryId: countries[0]?.id || "",
      embassyLocation: "الرياض",
      appointmentDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      submissionDate: "",
      status: "preparing_documents",
      visaDuration: "1 year",
      notes: "تم استلام القبول وبدء حجز موعد السفارة",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: any) => {
    setEditingCase(v);
    setFormData({
      studentId: v.studentId || v.student?.id || "",
      countryId: v.countryId || v.country?.id || "",
      embassyLocation: v.embassyLocation || "الرياض",
      appointmentDate: v.appointmentDate ? new Date(v.appointmentDate).toISOString().slice(0, 10) : "",
      submissionDate: v.submissionDate ? new Date(v.submissionDate).toISOString().slice(0, 10) : "",
      status: v.status || "preparing_documents",
      visaDuration: v.visaDuration || "1 year",
      notes: v.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId) {
      toastError("يرجى اختيار الوجهة / الدولة");
      return;
    }
    if (!editingCase && !formData.studentId) {
      toastError("يرجى اختيار الطالب");
      return;
    }

    setSaving(true);
    try {
      const url = editingCase ? `/api/visa/${editingCase.id}` : "/api/visa";
      const method = editingCase ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ ملف التأشيرة");

      success(editingCase ? "تم تحديث ملف التأشيرة بنجاح" : "تمت إضافة ملف التأشيرة بنجاح");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!caseToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/visa/${caseToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف ملف التأشيرة");
      success("تم حذف ملف التأشيرة بنجاح");
      setIsDeleteModalOpen(false);
      setCaseToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCases = visaCases.filter((v) => {
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    if (!matchesStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.caseNumber?.toLowerCase().includes(q) ||
      v.student?.fullNameAr?.toLowerCase().includes(q) ||
      v.student?.studentCode?.toLowerCase().includes(q) ||
      v.embassyLocation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Stamp className="w-6 h-6 text-indigo-600" />
            <span>{t("visa", "متابعة وإدارة التأشيرات (Visa Operations)")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة مواعيد السفارات وتجهيز الملفات البنكية ومتابعة صدور التأشيرات مع الإضافة والتعديل والحذف
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>فتح ملف تأشيرة جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الملف، اسم الطالب، أو السفارة..."
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">جميع حالات التأشيرة</option>
            <option value="preparing_documents">تجهيز المستندات</option>
            <option value="appointment_booked">تم حجز الموعد</option>
            <option value="submitted">تم التقديم في السفارة</option>
            <option value="approved">تمت الموافقة (Approved)</option>
            <option value="rejected">مرفوض (Rejected)</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          إجمالي الملفات: {filteredCases.length}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل ملفات التأشيرة...</p>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Stamp className="w-10 h-10 mx-auto opacity-40 text-indigo-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على ملفات تأشيرة</p>
            <p className="text-xs">جرّب تغيير فلاتر البحث أو فتح ملف تأشيرة جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">رقم ملف التأشيرة</th>
                  <th className="p-3.5 text-start">الطالب</th>
                  <th className="p-3.5 text-start">الوجهة وموقع السفارة</th>
                  <th className="p-3.5 text-start">موعد السفارة</th>
                  <th className="p-3.5 text-start">الحالة الحالية</th>
                  <th className="p-3.5 text-start">المسؤول</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCases.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {v.caseNumber}
                    </td>
                    <td className="p-3.5">
                      <Link
                        href={`/students/${v.student?.id}?tab=visa`}
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 block"
                      >
                        {v.student?.fullNameAr || "طالب غير محدد"}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {v.student?.studentCode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {v.country?.flagEmoji} {v.country?.nameAr}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{v.embassyLocation}</span>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {v.appointmentDate ? (
                        <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(v.appointmentDate).toLocaleDateString("ar-EG")}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">لم يُحدد موعد</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          v.status === "approved"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : v.status === "appointment_booked"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                            : v.status === "rejected"
                            ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {v.status === "approved"
                          ? "صدرت التأشيرة"
                          : v.status === "appointment_booked"
                          ? "موعد محجوز"
                          : v.status === "rejected"
                          ? "مرفوضة"
                          : "تجهيز أوراق"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">
                      {v.responsibleOfficer?.name || "مسؤول التأشيرات"}
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/students/${v.student?.id}?tab=visa`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="عرض في ملف الطالب"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="تعديل ملف التأشيرة"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setCaseToDelete(v);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="حذف ملف التأشيرة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Visa Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Stamp className="w-5 h-5 text-indigo-600" />
                <span>{editingCase ? `تعديل ملف: ${editingCase.caseNumber}` : "فتح ملف تأشيرة وسفارة جديد"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {!editingCase && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اختر الطالب <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>-- اختر الطالب --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullNameAr} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الوجهة / الدولة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.countryId}
                    onChange={(e) => setFormData({ ...formData, countryId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>-- اختر الدولة --</option>
                    {countries.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.flagEmoji} {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    مقر السفارة / القنصلية
                  </label>
                  <input
                    type="text"
                    value={formData.embassyLocation}
                    onChange={(e) => setFormData({ ...formData, embassyLocation: e.target.value })}
                    placeholder="الرياض أو جدة"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    موعد المقابلة بالسفارة
                  </label>
                  <input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    حالة ملف التأشيرة
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="preparing_documents">تجهيز المستندات والحساب البنكي</option>
                    <option value="appointment_booked">تم حجز موعد المقابلة</option>
                    <option value="submitted">تم تسليم الجواز والمستندات للسفارة</option>
                    <option value="approved">تمت الموافقة وصدور الفيزا</option>
                    <option value="rejected">مرفوضة من السفارة</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ملاحظات التأشيرة والمتابعة
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات حول موعد البصمة، التأمين الصحي الدولي، كشف الحساب..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingCase ? "حفظ التعديلات" : "إضافة الملف"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCaseToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="تأكيد حذف ملف التأشيرة"
        message={`هل أنت متأكد من حذف ملف التأشيرة رقم "${caseToDelete?.caseNumber}" للطالب "${caseToDelete?.student?.fullNameAr}"؟`}
        confirmText="نعم، حذف الملف"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
