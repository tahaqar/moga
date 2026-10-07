"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Check,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  X,
  Save,
  Send,
  Calendar,
  User,
  Users,
  Clock,
  Sparkles,
} from "lucide-react";

export default function CommunicationsPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"templates" | "logs">("templates");
  const [data, setData] = useState<any>({
    templates: [],
    communications: [],
    students: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    code: "",
    nameAr: "",
    nameEn: "",
    channel: "whatsapp",
    contentAr: "",
    contentEn: "",
    variables: "{student_name}, {university}, {major}, {date}",
    isActive: true,
  });

  // Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [logForm, setLogForm] = useState({
    studentId: "",
    userId: "",
    type: "whatsapp",
    direction: "outbound",
    subject: "",
    content: "",
    sentAt: new Date().toISOString().slice(0, 16),
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; entityType: "template" | "communication" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadComms = useCallback(async () => {
    try {
      const res = await fetch("/api/communications");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch comms error:", err);
      toastError("فشل تحميل بيانات التواصل");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadComms();
  }, [loadComms, refreshKey]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success("تم نسخ نص القالب للحافظة");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Template Actions
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      code: `tpl_${Date.now()}`,
      nameAr: "",
      nameEn: "",
      channel: "whatsapp",
      contentAr: "مرحباً بك عزيزي {student_name}، نود إعلامك بأنه تم استلام مستنداتك بنجاح...",
      contentEn: "Dear {student_name}, your documents have been successfully received...",
      variables: "{student_name}, {university}, {major}, {branch_phone}",
      isActive: true,
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      code: tpl.code || "",
      nameAr: tpl.nameAr || "",
      nameEn: tpl.nameEn || "",
      channel: tpl.channel || "whatsapp",
      contentAr: tpl.contentAr || "",
      contentEn: tpl.contentEn || "",
      variables: tpl.variables || "",
      isActive: tpl.isActive !== undefined ? tpl.isActive : true,
    });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.nameAr.trim() || !templateForm.contentAr.trim()) {
      toastError("يرجى إدخال اسم القالب والمحتوى بالعربية");
      return;
    }

    setSavingTemplate(true);
    try {
      const url = "/api/communications";
      const method = editingTemplate ? "PUT" : "POST";
      const payload = {
        ...templateForm,
        entityType: "template",
        ...(editingTemplate ? { id: editingTemplate.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ القالب");

      success(editingTemplate ? "تم تحديث القالب بنجاح" : "تمت إضافة القالب بنجاح");
      setIsTemplateModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ القالب");
    } finally {
      setSavingTemplate(false);
    }
  };

  // Log Actions
  const handleOpenAddLog = () => {
    setEditingLog(null);
    setLogForm({
      studentId: data.students?.[0]?.id || "",
      userId: data.users?.[0]?.id || "",
      type: "whatsapp",
      direction: "outbound",
      subject: "متابعة أوراق القبول الجامعي",
      content: "",
      sentAt: new Date().toISOString().slice(0, 16),
    });
    setIsLogModalOpen(true);
  };

  const handleOpenEditLog = (comm: any) => {
    setEditingLog(comm);
    setLogForm({
      studentId: comm.studentId || comm.student?.id || "",
      userId: comm.userId || "",
      type: comm.type || "whatsapp",
      direction: comm.direction || "outbound",
      subject: comm.subject || "",
      content: comm.content || "",
      sentAt: comm.sentAt ? new Date(comm.sentAt).toISOString().slice(0, 16) : "",
    });
    setIsLogModalOpen(true);
  };

  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logForm.studentId || !logForm.content.trim()) {
      toastError("يرجى اختيار الطالب وكتابة نص المحادثة");
      return;
    }

    setSavingLog(true);
    try {
      const url = "/api/communications";
      const method = editingLog ? "PUT" : "POST";
      const payload = {
        ...logForm,
        entityType: "communication",
        ...(editingLog ? { id: editingLog.id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ المحادثة");

      success(editingLog ? "تم تحديث سجل المحادثة" : "تم تسجيل المحادثة بنجاح");
      setIsLogModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ المحادثة");
    } finally {
      setSavingLog(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/communications?id=${deleteTarget.id}&entityType=${deleteTarget.entityType}`, {
        method: "DELETE",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل الحذف");

      success(deleteTarget.entityType === "template" ? "تم حذف القالب" : "تم حذف سجل التواصل");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Templates
  const filteredTemplates = (data.templates || []).filter((tpl: any) => {
    const q = search.toLowerCase();
    const nameMatch = (tpl.nameAr || tpl.nameEn || "").toLowerCase().includes(q);
    const contentMatch = (tpl.contentAr || "").toLowerCase().includes(q);
    return !search || nameMatch || contentMatch;
  });

  // Filtered Communications
  const filteredCommunications = (data.communications || []).filter((comm: any) => {
    const q = search.toLowerCase();
    const stuMatch = (comm.student?.fullNameAr || comm.student?.fullNameEn || "").toLowerCase().includes(q);
    const subMatch = (comm.subject || "").toLowerCase().includes(q);
    const contentMatch = (comm.content || "").toLowerCase().includes(q);
    return !search || stuMatch || subMatch || contentMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            <span>{t("communications", "قوالب رسائل واتساب وسجل التواصل")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة قوالب الرسائل المعتمدة الجاهزة مع المتغيرات الديناميكية وتوثيق سجل المحادثات والاتصالات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "templates" ? (
            <button
              onClick={handleOpenAddTemplate}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة قالب رسالة جديد</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddLog}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>تسجيل محادثة جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "templates"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>قوالب الرسائل ({data.templates?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>سجل التواصل والاتصالات ({data.communications?.length || 0})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "templates" ? "بحث في القوالب..." : "بحث في سجل المحادثات..."}
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">جاري تحميل بيانات التواصل...</p>
        </div>
      ) : activeTab === "templates" ? (
        /* Templates Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-2 p-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              لا توجد قوالب رسائل مطابقة
            </div>
          ) : (
            filteredTemplates.map((tpl: any) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{tpl.nameAr}</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 font-semibold text-[10px] uppercase">
                        {tpl.channel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(tpl.id, tpl.contentAr)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1 text-[11px] font-semibold transition cursor-pointer"
                        title="نسخ نص الرسالة"
                      >
                        {copiedId === tpl.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === tpl.id ? "تم النسخ" : "نسخ"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditTemplate(tpl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="تعديل القالب"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setDeleteTarget({ id: tpl.id, name: tpl.nameAr, entityType: "template" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="حذف القالب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                    {tpl.contentAr}
                  </div>
                </div>

                {tpl.variables && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">المتغيرات: {tpl.variables}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Communications Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">الطالب</th>
                  <th className="p-3.5 text-start font-semibold">قناة التواصل</th>
                  <th className="p-3.5 text-start font-semibold">الموضوع والملخص</th>
                  <th className="p-3.5 text-start font-semibold">الاتجاه</th>
                  <th className="p-3.5 text-start font-semibold">الموظف / المستشار</th>
                  <th className="p-3.5 text-start font-semibold">تاريخ التواصل</th>
                  <th className="p-3.5 text-end font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCommunications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      لا توجد سجلات تواصل مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredCommunications.map((comm: any) => (
                    <tr key={comm.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <Link href={`/students/${comm.student?.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                          {comm.student?.fullNameAr || comm.student?.fullNameEn}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px] capitalize">
                          {comm.type === "whatsapp"
                            ? "واتساب"
                            : comm.type === "call"
                            ? "مكالمة هاتفية"
                            : comm.type === "email"
                            ? "بريد إلكتروني"
                            : comm.type === "visit"
                            ? "زيارة للفرع"
                            : "ملاحظة"}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-sm">
                        {comm.subject && <span className="font-bold block text-slate-800 dark:text-slate-200">{comm.subject}</span>}
                        <span className="text-slate-500 dark:text-slate-400 line-clamp-1">{comm.content}</span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            comm.direction === "inbound"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                              : "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                          }`}
                        >
                          {comm.direction === "inbound" ? "وارد من الطالب" : "صادر من الشركة"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400">{comm.user?.name || "النظام"}</td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        {comm.sentAt ? new Date(comm.sentAt).toLocaleString("ar-EG") : "-"}
                      </td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditLog(comm)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل السجل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: comm.id, name: comm.subject || "المحادثة", entityType: "communication" });
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="حذف السجل"
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
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>{editingTemplate ? "تعديل قالب الرسالة" : "إضافة قالب رسالة جديد"}</span>
              </h3>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    اسم القالب (بالعربية) *
                  </label>
                  <input
                    type="text"
                    required
                    value={templateForm.nameAr}
                    onChange={(e) => setTemplateForm({ ...templateForm, nameAr: e.target.value })}
                    placeholder="مثال: رسالة استلام الوثائق الأولية"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    قناة الإرسال *
                  </label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="whatsapp">واتساب (WhatsApp)</option>
                    <option value="email">بريد إلكتروني (Email)</option>
                    <option value="sms">رسالة قصيرة (SMS)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    كود القالب البرمجي (رمز فريد)
                  </label>
                  <input
                    type="text"
                    value={templateForm.code}
                    onChange={(e) => setTemplateForm({ ...templateForm, code: e.target.value })}
                    placeholder="tpl_welcome_student"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نص الرسالة بالعربية *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={templateForm.contentAr}
                    onChange={(e) => setTemplateForm({ ...templateForm, contentAr: e.target.value })}
                    placeholder="اكتب نص القالب هنا... يمكنك استخدام {student_name} و {university} و {major}"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المتغيرات المتاحة
                  </label>
                  <input
                    type="text"
                    value={templateForm.variables}
                    onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                    placeholder="{student_name}, {university}, {major}, {date}"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingTemplate ? "تحديث القالب" : "حفظ القالب"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <span>{editingLog ? "تعديل سجل المحادثة" : "توثيق محادثة وتواصل جديد"}</span>
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الطالب المستهدف *
                  </label>
                  <select
                    value={logForm.studentId}
                    onChange={(e) => setLogForm({ ...logForm, studentId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الطالب...</option>
                    {data.students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.fullNameAr} ({s.phone || s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة التواصل *
                  </label>
                  <select
                    value={logForm.type}
                    onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="whatsapp">واتساب (WhatsApp)</option>
                    <option value="call">مكالمة هاتفية (Phone Call)</option>
                    <option value="email">بريد إلكتروني (Email)</option>
                    <option value="visit">زيارة للفرع (Office Visit)</option>
                    <option value="note">ملاحظة داخلية (Internal Note)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الاتجاه *
                  </label>
                  <select
                    value={logForm.direction}
                    onChange={(e) => setLogForm({ ...logForm, direction: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="outbound">صادر من الشركة (Outbound)</option>
                    <option value="inbound">وارد من الطالب (Inbound)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    موضوع المحادثة
                  </label>
                  <input
                    type="text"
                    value={logForm.subject}
                    onChange={(e) => setLogForm({ ...logForm, subject: e.target.value })}
                    placeholder="مثال: مناقشة خيارات التخصصات في إسبانيا..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تفاصيل ومضمون المحادثة *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={logForm.content}
                    onChange={(e) => setLogForm({ ...logForm, content: e.target.value })}
                    placeholder="ما تم التوافق عليه مع الطالب، الملاحظات، والخطوات القادمة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الموظف المتواصل
                  </label>
                  <select
                    value={logForm.userId}
                    onChange={(e) => setLogForm({ ...logForm, userId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الموظف...</option>
                    {data.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ ووقت المحادثة
                  </label>
                  <input
                    type="datetime-local"
                    value={logForm.sentAt}
                    onChange={(e) => setLogForm({ ...logForm, sentAt: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingLog}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingLog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingLog ? "تحديث السجل" : "حفظ وتوثيق"}</span>
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
        title={deleteTarget?.entityType === "template" ? "حذف قالب الرسالة" : "حذف سجل المحادثة"}
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
