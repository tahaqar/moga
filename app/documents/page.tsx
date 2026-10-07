"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  FolderArchive,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  X,
  Save,
  Download,
  Upload,
} from "lucide-react";

export default function DocumentsPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [docTypes, setDocTypes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentId: "",
    documentTypeId: "",
    title: "",
    fileUrl: "",
    fileName: "",
    fileSize: 1024,
    status: "waiting_for_student",
    notes: "",
  });

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        setDocTypes(data.docTypes || []);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Fetch docs error:", err);
      toastError("فشل تحميل قائمة المستندات");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleOpenAdd = () => {
    setEditingDoc(null);
    setFormData({
      studentId: students[0]?.id || "",
      documentTypeId: docTypes[0]?.id || "",
      title: "جواز السفر المترجم",
      fileUrl: "/uploads/sample-passport.pdf",
      fileName: "passport.pdf",
      fileSize: 1048576,
      status: "verified",
      notes: "تم التدقيق والتصديق بنجاح",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: any) => {
    setEditingDoc(doc);
    setFormData({
      studentId: doc.studentId || doc.student?.id || "",
      documentTypeId: doc.documentTypeId || doc.documentType?.id || "",
      title: doc.title || "",
      fileUrl: doc.fileUrl || "",
      fileName: doc.fileName || "",
      fileSize: doc.fileSize || 1024,
      status: doc.status || "waiting_for_student",
      notes: doc.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.documentTypeId) {
      toastError("يرجى إدخال عنوان ونوع المستند");
      return;
    }
    if (!editingDoc && !formData.studentId) {
      toastError("يرجى اختيار الطالب");
      return;
    }

    setSaving(true);
    try {
      const url = editingDoc ? `/api/documents/${editingDoc.id}` : "/api/documents";
      const method = editingDoc ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بيانات المستند");

      success(editingDoc ? "تم تعديل المستند بنجاح" : "تمت إضافة المستند بنجاح");
      setIsModalOpen(false);
      loadDocs();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${docToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف المستند");
      success("تم حذف المستند بنجاح");
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
      loadDocs();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.documentTypeId === typeFilter;
    if (!matchesStatus || !matchesType) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.student?.fullNameAr?.toLowerCase().includes(q) ||
      doc.student?.studentCode?.toLowerCase().includes(q) ||
      doc.documentType?.nameAr?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-indigo-600" />
            <span>{t("documents", "إدارة وتدقيق المستندات")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            أرشيف وثائق الطلاب مع إمكانية الإضافة والتعديل والتحقق من الشهادات والجوازات وحذفها
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>رفع مستند جديد</span>
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
              placeholder="ابحث بعنوان المستند، الطالب، أو الكود..."
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">جميع حالات التدقيق</option>
            <option value="verified">معتمد (Verified)</option>
            <option value="in_translation">قيد الترجمة</option>
            <option value="waiting_for_student">بانتظار الطالب</option>
            <option value="rejected">مرفوض</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">جميع أنواع الوثائق</option>
            {docTypes.map((dt) => (
              <option key={dt.id} value={dt.id}>
                {dt.nameAr}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          إجمالي المستندات: {filteredDocs.length}
        </span>
      </div>

      {/* Main Documents Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل المستندات...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <FolderArchive className="w-10 h-10 mx-auto opacity-40 text-indigo-600" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على مستندات</p>
            <p className="text-xs">جرّب تغيير فلاتر البحث أو رفع مستند جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5 text-start">عنوان الوثيقة</th>
                  <th className="p-3.5 text-start">الطالب</th>
                  <th className="p-3.5 text-start">النوع والتصنيف</th>
                  <th className="p-3.5 text-start">حالة التدقيق</th>
                  <th className="p-3.5 text-start">الحجم والملف</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <div>
                        <span>{doc.title}</span>
                        {doc.notes && <span className="block text-[11px] text-slate-400 font-normal">{doc.notes}</span>}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Link
                        href={`/students/${doc.student?.id}?tab=documents`}
                        className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 block"
                      >
                        {doc.student?.fullNameAr || "طالب غير محدد"}
                      </Link>
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {doc.student?.studentCode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                        {doc.documentType?.nameAr || "مستند عام"}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {doc.documentType?.category || "عام"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          doc.status === "verified"
                            ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                            : doc.status === "in_translation"
                            ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                            : doc.status === "rejected"
                            ? "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300"
                            : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        {doc.status === "verified"
                          ? "معتمد"
                          : doc.status === "in_translation"
                          ? "قيد الترجمة"
                          : doc.status === "rejected"
                          ? "مرفوض"
                          : "بانتظار الطالب"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500">
                      <div>v{doc.version || 1} • {Math.round((doc.fileSize || 1024) / 1024)} KB</div>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[140px]">
                        {doc.fileName || "file.pdf"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/students/${doc.student?.id}?tab=documents`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="عرض في ملف الطالب"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                          title="تعديل بيانات المستند"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDocToDelete(doc);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="حذف المستند"
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

      {/* Add / Edit Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-indigo-600" />
                <span>{editingDoc ? `تعديل: ${editingDoc.title}` : "إضافة وتدقيق مستند جديد"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {!editingDoc && (
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
                    عنوان الوثيقة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: جواز السفر الأصلي"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نوع وتصنيف الوثيقة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.documentTypeId}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="" disabled>-- اختر النوع --</option>
                    {docTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.nameAr} ({dt.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    حالة الاعتماد والتدقيق
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="verified">معتمد وموثق (Verified)</option>
                    <option value="waiting_for_student">بانتظار الطالب (Waiting)</option>
                    <option value="in_translation">قيد الترجمة (In Translation)</option>
                    <option value="needs_correction">يحتاج تعديل (Correction)</option>
                    <option value="rejected">مرفوض (Rejected)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اسم الملف
                  </label>
                  <input
                    type="text"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    placeholder="passport_scan.pdf"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  رابط الملف أو المسار
                </label>
                <input
                  type="text"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  placeholder="/uploads/doc.pdf"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ملاحظات التدقيق
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات حول صلاحية الجواز، الترجمة، تصديق الخارجية..."
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
                  <span>{editingDoc ? "حفظ التعديلات" : "إضافة المستند"}</span>
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
          setDocToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="تأكيد حذف المستند"
        message={`هل أنت متأكد من حذف مستند "${docToDelete?.title}" الخاص بالطالب "${docToDelete?.student?.fullNameAr}"؟`}
        confirmText="نعم، حذف المستند"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
