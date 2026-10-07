"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  CheckSquare,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  X,
  Save,
  Filter,
} from "lucide-react";

export default function TasksPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
    assigneeId: "",
    studentId: "",
    status: "pending",
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setUsers(data.users || []);
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
      toastError("فشل تحميل المهام");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshKey]);

  const toggleTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completed" ? "pending" : "completed";
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        success(nextStatus === "completed" ? "تم إنجاز المهمة بنجاح" : "تمت إعادة فتح المهمة");
      }
    } catch (err) {
      console.error("Toggle task error:", err);
      toastError("حدث خطأ أثناء تغيير حالة المهمة");
    }
  };

  const handleOpenAdd = () => {
    setEditingTask(null);
    setForm({
      title: "",
      description: "",
      priority: "medium",
      dueDate: new Date().toISOString().slice(0, 10),
      assigneeId: users[0]?.id || "",
      studentId: "",
      status: "pending",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: any) => {
    setEditingTask(t);
    setForm({
      title: t.title || "",
      description: t.description || "",
      priority: t.priority || "medium",
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "",
      assigneeId: t.assigneeId || "",
      studentId: t.studentId || "",
      status: t.status || "pending",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toastError("عنوان المهمة مطلوب");
      return;
    }

    setSaving(true);
    try {
      const url = "/api/tasks";
      const method = editingTask ? "PUT" : "POST";
      const payload = editingTask ? { ...form, id: editingTask.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ المهمة");

      success(editingTask ? "تم تعديل المهمة بنجاح" : "تمت إضافة المهمة بنجاح");
      setIsModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ المهمة");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks?id=${deleteTarget.id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل الحذف");

      success("تم حذف المهمة");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTasks = tasks.filter((t: any) => {
    const q = search.toLowerCase();
    const titleMatch = (t.title || "").toLowerCase().includes(q);
    const descMatch = (t.description || "").toLowerCase().includes(q);
    const stuMatch = (t.student?.fullNameAr || t.student?.fullNameEn || "").toLowerCase().includes(q);
    const assigneeMatch = (t.assignee?.name || "").toLowerCase().includes(q);
    const matchesSearch = !search || titleMatch || descMatch || stuMatch || assigneeMatch;

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status !== "completed").length;
  const urgentCount = tasks.filter((t) => t.priority === "urgent" && t.status !== "completed").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            <span>{t("tasks", "المهام والمتابعات التشغيلية")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            متابعة المهام اليومية، التذكيرات، مواعيد السفارات واستلام وثائق الطلاب
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">المهام قيد المتابعة</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{pendingCount} مهمة</p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">المهام المنجزة</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{completedCount} مهمة</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">مهام عاجلة طارئة</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{urgentCount} مهمة</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "جميع الحالات" },
            { id: "pending", label: "قيد الانتظار" },
            { id: "in_progress", label: "قيد التنفيذ" },
            { id: "completed", label: "المكتملة" },
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

          <span className="text-slate-300 dark:text-slate-700">|</span>

          {[
            { id: "all", label: "جميع الأولويات" },
            { id: "urgent", label: "عاجل" },
            { id: "high", label: "مرتفع" },
            { id: "medium", label: "متوسط" },
          ].map((pr) => (
            <button
              key={pr.id}
              onClick={() => setPriorityFilter(pr.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                priorityFilter === pr.id
                  ? "bg-slate-800 text-white dark:bg-slate-700"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {pr.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المهام والطلاب والمكلفين..."
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل المهام...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            لا توجد مهام مطابقة للشروط
          </div>
        ) : (
          filteredTasks.map((t: any) => {
            const isCompleted = t.status === "completed";
            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex items-center justify-between gap-4 ${
                  isCompleted
                    ? "border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/10 dark:bg-emerald-950/10 opacity-75"
                    : "border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => toggleTask(t.id, t.status)}
                    className="cursor-pointer shrink-0 text-slate-400 hover:text-emerald-600 transition"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <div className="w-6 h-6 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-600" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        isCompleted
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{t.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      {t.student && (
                        <Link
                          href={`/students/${t.student?.id}`}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold hover:underline"
                        >
                          طالب: {t.student?.fullNameAr || t.student?.fullNameEn}
                        </Link>
                      )}
                      {t.assignee && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{t.assignee?.name}</span>
                        </span>
                      )}
                      {t.dueDate && (
                        <span className="text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(t.dueDate).toLocaleDateString("ar-EG")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                      t.priority === "urgent"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                        : t.priority === "high"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {t.priority === "urgent"
                      ? "عاجل"
                      : t.priority === "high"
                      ? "مرتفع"
                      : t.priority === "medium"
                      ? "متوسط"
                      : "منخفض"}
                  </span>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="تعديل المهمة"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      setDeleteTarget(t);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <span>{editingTask ? "تعديل المهمة" : "إضافة مهمة جديدة"}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان المهمة *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: تجهيز أوراق السفارة الألمانية للطالب أحمد..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تفاصيل ووصف المهمة
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="شرح متطلبات المهمة والمستندات المطلوبة..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الطالب المرتبط (اختياري)
                  </label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">بدون ربط بطالب معين</option>
                    {students.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.fullNameAr} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الموظف المكلف
                  </label>
                  <select
                    value={form.assigneeId}
                    onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الموظف...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    درجة الأولوية *
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="urgent">عاجل (Urgent)</option>
                    <option value="high">مرتفع (High)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="low">منخفض (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الاستحقاق *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حالة المهمة *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pending">قيد الانتظار</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
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
                  <span>{editingTask ? "تحديث المهمة" : "حفظ المهمة"}</span>
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
        title="حذف المهمة"
        description={`هل أنت متأكد من حذف المهمة "${deleteTarget?.title}"؟`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
