"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  FileCheck2,
  Search,
  Filter,
  Plus,
  Building,
  ExternalLink,
  Loader2,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  User,
  GraduationCap,
  X,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ApplicationsPage() {
  const { language, t } = useCrm();
  const { success, error: toastError } = useToast();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Aux data for add/edit modal
  const [students, setStudents] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentId: "",
    countryId: "",
    universityId: "",
    customMajor: "",
    level: "bachelor",
    intake: "Fall 2026",
    status: "submitted",
    tuitionFee: "6000",
    tuitionCurrency: "EUR",
    offerType: "none",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications?status=${statusFilter}&countryId=${countryFilter}`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Fetch applications error:", err);
      toastError("فشل تحميل قائمة الطلبات");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, countryFilter, toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load auxiliary data
  useEffect(() => {
    async function loadAux() {
      try {
        const [cRes, uRes, sRes] = await Promise.all([
          fetch("/api/countries"),
          fetch("/api/universities"),
          fetch("/api/students?limit=100"),
        ]);
        if (cRes.ok) {
          const d = await cRes.json();
          setCountries(d.countries || []);
        }
        if (uRes.ok) {
          const d = await uRes.json();
          setUniversities(d.universities || []);
        }
        if (sRes.ok) {
          const d = await sRes.json();
          setStudents(d.students || []);
        }
      } catch (err) {
        console.error("Auxiliary load error:", err);
      }
    }
    loadAux();
  }, []);

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData({
      studentId: students[0]?.id || "",
      countryId: countries[0]?.id || "",
      universityId: universities[0]?.id || "",
      customMajor: "Computer Science",
      level: "bachelor",
      intake: "Fall 2026",
      status: "submitted",
      tuitionFee: "6000",
      tuitionCurrency: "EUR",
      offerType: "none",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (app: any) => {
    setEditingApp(app);
    setFormData({
      studentId: app.studentId || app.student?.id || "",
      countryId: app.countryId || app.country?.id || "",
      universityId: app.universityId || app.university?.id || "",
      customMajor: app.customMajor || "",
      level: app.level || "bachelor",
      intake: app.intake || "Fall 2026",
      status: app.status || "submitted",
      tuitionFee: String(app.tuitionFee || 6000),
      tuitionCurrency: app.tuitionCurrency || "EUR",
      offerType: app.offerType || "none",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryId || !formData.universityId) {
      toastError("يرجى اختيار الدولة والجامعة");
      return;
    }
    if (!editingApp && !formData.studentId) {
      toastError("يرجى اختيار الطالب");
      return;
    }

    setSaving(true);
    try {
      const url = editingApp ? `/api/applications/${editingApp.id}` : "/api/applications";
      const method = editingApp ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ الطلب");

      success(editingApp ? "تم تعديل بيانات الطلب بنجاح" : "تم إضافة الطلب الجامعي بنجاح");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!appToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${appToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الطلب");
      success("تم حذف الطلب الجامعي بنجاح");
      setIsDeleteModalOpen(false);
      setAppToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered universities according to selected country in modal
  const filteredModalUnis = universities.filter((u) =>
    formData.countryId ? u.countryId === formData.countryId : true
  );

  const filteredApps = applications.filter((app) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      app.applicationCode?.toLowerCase().includes(q) ||
      app.student?.fullNameAr?.toLowerCase().includes(q) ||
      app.student?.studentCode?.toLowerCase().includes(q) ||
      app.university?.nameAr?.toLowerCase().includes(q) ||
      app.customMajor?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            <span>{t("applications", "القبولات والتقديمات الجامعية")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة وتتبع طلبات القبول، التعديل عليها، وحذف وإضافة ملفات التقديم الجديدة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/kanban"
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5 shadow-xs"
          >
            <span>لوحة كانبان (Kanban)</span>
          </Link>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تقديم جديد</span>
          </button>
        </div>
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
              placeholder="ابحث برقم الطلب، اسم الطالب، الجامعة، أو التخصص..."
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">جميع الحالات</option>
            <option value="submitted">تم التقديم</option>
            <option value="accepted">مقبول</option>
            <option value="in_progress">قيد المراجعة</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">جميع الوجهات</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flagEmoji} {c.nameAr}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          إجمالي النتائج: {filteredApps.length} طلب
        </span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل طلبات التقديم...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <FileCheck2 className="w-10 h-10 mx-auto opacity-40 text-indigo-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لا توجد طلبات تقديم مطابقة</p>
            <p className="text-xs">جرّب مسح الفلاتر أو اضغط على &quot;إضافة تقديم جديد&quot;</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">رقم الطلب</th>
                  <th className="p-3.5 text-start">الطالب</th>
                  <th className="p-3.5 text-start">الجامعة والوجهة</th>
                  <th className="p-3.5 text-start">التخصص والمرحلة</th>
                  <th className="p-3.5 text-start">الحالة ومرحلة كانبان</th>
                  <th className="p-3.5 text-start">الرسوم والبداية</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {app.applicationCode}
                    </td>
                    <td className="p-3.5">
                      <Link
                        href={`/students/${app.student?.id}?tab=applications`}
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 block"
                      >
                        {app.student?.fullNameAr || "طالب غير محدد"}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {app.student?.studentCode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {app.country?.flagEmoji} {app.university?.nameAr}
                      </span>
                      <span className="text-[11px] text-slate-400 block">{app.university?.city}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">
                        {app.customMajor || app.program?.nameAr || "تخصص عام"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {app.level} • {app.intake}
                      </span>
                    </td>
                    <td className="p-3.5 space-y-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === "accepted"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : app.status === "rejected"
                            ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {app.status === "accepted"
                          ? "مقبول"
                          : app.status === "rejected"
                          ? "مرفوض"
                          : "قيد المتابعة"}
                      </span>
                      {app.stage && (
                        <span className="block text-[11px] text-slate-400 font-medium">
                          {app.stage.nameAr}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                      <div>${app.tuitionFee || 0}</div>
                      <span className="text-[10px] text-slate-400 block">{app.intake}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/students/${app.student?.id}?tab=applications`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="عرض في ملف الطالب"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="تعديل بيانات التقديم"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAppToDelete(app);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="حذف التقديم"
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <span>{editingApp ? `تعديل الطلب: ${editingApp.applicationCode}` : "إضافة طلب تقديم جامعي جديد"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {!editingApp && (
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
                    الدولة المستهدفة <span className="text-rose-500">*</span>
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
                    الجامعة أو المعهد <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.universityId}
                    onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>-- اختر الجامعة --</option>
                    {filteredModalUnis.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nameAr} ({u.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    التخصص المطلوب
                  </label>
                  <input
                    type="text"
                    value={formData.customMajor}
                    onChange={(e) => setFormData({ ...formData, customMajor: e.target.value })}
                    placeholder="مثال: هندسة البرمجيات"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    المرحلة الدراسية
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="bachelor">بكالوريوس (Bachelor)</option>
                    <option value="master">ماجستير (Master)</option>
                    <option value="phd">دكتوراه (PhD)</option>
                    <option value="language">دورة لغة (Language)</option>
                    <option value="foundation">سنة تحضيرية (Foundation)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    فصل البدء (Intake)
                  </label>
                  <input
                    type="text"
                    value={formData.intake}
                    onChange={(e) => setFormData({ ...formData, intake: e.target.value })}
                    placeholder="Fall 2026"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الرسوم الدراسية
                  </label>
                  <input
                    type="number"
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                    placeholder="6000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    حالة الطلب
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="submitted">تم التقديم (Submitted)</option>
                    <option value="in_progress">قيد المراجعة (In Progress)</option>
                    <option value="accepted">مقبول (Accepted)</option>
                    <option value="rejected">مرفوض (Rejected)</option>
                  </select>
                </div>
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
                  <span>{editingApp ? "حفظ التعديلات" : "إضافة التقديم"}</span>
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
          setAppToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="تأكيد حذف الطلب الجامعي"
        message={`هل أنت متأكد من حذف الطلب رقم ${appToDelete?.applicationCode} للطالب "${appToDelete?.student?.fullNameAr}"؟ سيتم أرشفة الطلب نهائياً.`}
        confirmText="نعم، حذف الطلب"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
