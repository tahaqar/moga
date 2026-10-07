"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { StudentModal } from "@/components/students/student-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  FolderArchive,
  CreditCard,
  Stamp,
  CheckSquare,
  MessageSquare,
  Plane,
  Clock,
  Shield,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Edit,
  Trash2,
  Upload,
  Download,
  ExternalLink,
  MessageCircle,
  Sparkles,
  FileText,
  DollarSign,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { direction, t } = useCrm();
  const { success, error: toastError } = useToast();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Auxiliary data
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Modals
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Sub-resource modals
  // 1. Documents
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docEditing, setDocEditing] = useState<any>(null);
  const [docForm, setDocForm] = useState({
    title: "",
    documentTypeId: "",
    fileUrl: "",
    fileName: "",
    fileSize: 0,
    status: "complete",
    notes: "",
  });
  const [docUploading, setDocUploading] = useState(false);

  // 2. Applications
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appEditing, setAppEditing] = useState<any>(null);
  const [appForm, setAppForm] = useState({
    countryId: "",
    universityId: "",
    customMajor: "",
    level: "bachelor",
    intake: "Fall 2026",
    tuitionFee: "",
    status: "submitted",
    notes: "",
  });

  // 3. Visa
  const [isVisaModalOpen, setIsVisaModalOpen] = useState(false);
  const [visaEditing, setVisaEditing] = useState<any>(null);
  const [visaForm, setVisaForm] = useState({
    countryId: "",
    embassyLocation: "",
    appointmentDate: "",
    submissionDate: "",
    status: "preparing_documents",
    notes: "",
  });

  // 4. Payments
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentEditing, setPaymentEditing] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    receiptNumber: "",
    amount: "",
    currency: "USD",
    method: "cash",
    status: "completed",
    notes: "",
    paymentDate: new Date().toISOString().slice(0, 10),
  });

  // 5. Tasks
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskEditing, setTaskEditing] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    priority: "normal",
    assigneeId: "",
  });

  // 6. Notes / Communications
  const [noteContent, setNoteContent] = useState("");
  const [noteChannel, setNoteChannel] = useState("note");
  const [noteSubject, setNoteSubject] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  // Delete item confirm
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string; name: string } | null>(null);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);

  const fetchStudentData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data.student);
      } else {
        toastError("فشل العثور على ملف الطالب");
        router.push("/students");
      }
    } catch (err) {
      console.error("Fetch student error:", err);
    } finally {
      setLoading(false);
    }
  }, [id, router, toastError]);

  const fetchAuxiliary = useCallback(async () => {
    try {
      const [countriesRes, unisRes, usersRes, branchesRes, activityRes] = await Promise.all([
        fetch("/api/countries"),
        fetch("/api/universities"),
        fetch("/api/employees"),
        fetch("/api/branches"),
        fetch(`/api/students/${id}/activity`),
      ]);

      if (countriesRes.ok) {
        const d = await countriesRes.json();
        setCountries(d.countries || []);
      }
      if (unisRes.ok) {
        const d = await unisRes.json();
        setUniversities(d.universities || []);
      }
      if (usersRes.ok) {
        const d = await usersRes.json();
        setCounselors(d.users || d.employees || []);
      }
      if (branchesRes.ok) {
        const d = await branchesRes.json();
        setBranches(d.branches || []);
      }
      if (activityRes.ok) {
        const d = await activityRes.json();
        setActivityLogs(d.auditLogs || []);
      }
    } catch (err) {
      console.error("Auxiliary load error:", err);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentData();
    fetchAuxiliary();
  }, [fetchStudentData, fetchAuxiliary]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">جاري تحميل الملف الشامل للطالب...</p>
      </div>
    );
  }

  if (!student) return null;

  // Status Quick Update
  const handleQuickStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("فشل تغيير حالة الطالب");
      success(`تم تحديث حالة الطالب إلى "${newStatus}"`);
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    setDeletingStudent(true);
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف ملف الطالب");
      success("تم حذف ملف الطالب بنجاح");
      router.push("/students");
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeletingStudent(false);
    }
  };

  // Add/Edit Document
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.title || !docForm.fileUrl) {
      toastError("عنوان المستند والملف مطلوبان");
      return;
    }

    try {
      const url = `/api/students/${id}/documents`;
      const method = docEditing ? "PATCH" : "POST";
      const payload = docEditing ? { documentId: docEditing.id, ...docForm } : docForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل حفظ المستند");
      success(docEditing ? "تم تحديث المستند بنجاح" : "تمت إضافة المستند بنجاح");
      setIsDocModalOpen(false);
      setDocEditing(null);
      setDocForm({ title: "", documentTypeId: "", fileUrl: "", fileName: "", fileSize: 0, status: "complete", notes: "" });
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // File upload for documents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل رفع الملف");

      setDocForm((prev) => ({
        ...prev,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
      success("تم رفع الملف بنجاح!");
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDocUploading(false);
    }
  };

  // Add/Edit Application
  const handleSaveApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.countryId || !appForm.universityId) {
      toastError("الدولة والجامعة مطلوبة");
      return;
    }

    try {
      const url = `/api/students/${id}/applications`;
      const method = appEditing ? "PATCH" : "POST";
      const payload = appEditing ? { applicationId: appEditing.id, ...appForm } : appForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل حفظ التقديم الجامعي");
      success(appEditing ? "تم تحديث التقديم بنجاح" : "تم تسجيل التقديم الجامعي بنجاح");
      setIsAppModalOpen(false);
      setAppEditing(null);
      setAppForm({ countryId: "", universityId: "", customMajor: "", level: "bachelor", intake: "Fall 2026", tuitionFee: "", status: "submitted", notes: "" });
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Add/Edit Visa Case
  const handleSaveVisa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = `/api/students/${id}/visa`;
      const method = visaEditing ? "PATCH" : "POST";
      const payload = visaEditing ? { visaCaseId: visaEditing.id, ...visaForm } : visaForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل حفظ ملف التأشيرة");
      success(visaEditing ? "تم تحديث ملف التأشيرة" : "تم فتح ملف التأشيرة بنجاح");
      setIsVisaModalOpen(false);
      setVisaEditing(null);
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Add/Edit Payment
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) {
      toastError("المبلغ مطلوب");
      return;
    }

    try {
      const url = `/api/students/${id}/payments`;
      const method = paymentEditing ? "PATCH" : "POST";
      const payload = paymentEditing ? { paymentId: paymentEditing.id, ...paymentForm } : paymentForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل حفظ الدفعة المالية");
      success(paymentEditing ? "تم تحديث السند بنجاح" : "تم تسجيل سند القبض بنجاح");
      setIsPaymentModalOpen(false);
      setPaymentEditing(null);
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Add/Edit Task
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) {
      toastError("عنوان المهمة مطلوب");
      return;
    }

    try {
      const url = `/api/students/${id}/tasks`;
      const method = taskEditing ? "PATCH" : "POST";
      const payload = taskEditing ? { taskId: taskEditing.id, ...taskForm } : taskForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل حفظ المهمة");
      success(taskEditing ? "تم تحديث المهمة" : "تمت إضافة المهمة بنجاح");
      setIsTaskModalOpen(false);
      setTaskEditing(null);
      setTaskForm({ title: "", description: "", dueDate: "", priority: "normal", assigneeId: "" });
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Toggle Task Completion
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "completed" ? "pending" : "completed";
      const res = await fetch(`/api/students/${id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: nextStatus }),
      });
      if (!res.ok) throw new Error("فشل تحديث المهمة");
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Add Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/students/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: noteChannel,
          subject: noteSubject || "متابعة دورية",
          content: noteContent,
        }),
      });

      if (!res.ok) throw new Error("فشل حفظ الملاحظة");
      success("تمت إضافة الملاحظة بنجاح");
      setNoteContent("");
      setNoteSubject("");
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Generic Sub-Item Delete
  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      let endpoint = "";
      if (itemToDelete.type === "document") endpoint = `/api/students/${id}/documents?documentId=${itemToDelete.id}`;
      else if (itemToDelete.type === "application") endpoint = `/api/students/${id}/applications?applicationId=${itemToDelete.id}`;
      else if (itemToDelete.type === "visa") endpoint = `/api/students/${id}/visa?visaCaseId=${itemToDelete.id}`;
      else if (itemToDelete.type === "payment") endpoint = `/api/students/${id}/payments?paymentId=${itemToDelete.id}`;
      else if (itemToDelete.type === "task") endpoint = `/api/students/${id}/tasks?taskId=${itemToDelete.id}`;
      else if (itemToDelete.type === "note") endpoint = `/api/students/${id}/notes?noteId=${itemToDelete.id}`;

      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف العنصر");

      success(`تم حذف ${itemToDelete.name} بنجاح`);
      setIsDeleteItemModalOpen(false);
      setItemToDelete(null);
      fetchStudentData();
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Parse custom fields values
  const parsedCustomFields: Record<string, any> = (() => {
    if (!student.customFieldsData) return {};
    try {
      return typeof student.customFieldsData === "string"
        ? JSON.parse(student.customFieldsData)
        : student.customFieldsData;
    } catch {
      return {};
    }
  })();

  const tabs = [
    { id: "overview", label: "نظرة عامة والبيانات", icon: Users },
    { id: "applications", label: `القبولات (${student.applications?.length || 0})`, icon: FileCheck2 },
    { id: "documents", label: `المستندات (${student.documents?.length || 0})`, icon: FolderArchive },
    { id: "visa", label: `ملف التأشيرة (${student.visaCases?.length || 0})`, icon: Stamp },
    { id: "payments", label: `المدفوعات (${student.payments?.length || 0})`, icon: CreditCard },
    { id: "tasks", label: `المهام (${student.tasks?.length || 0})`, icon: CheckSquare },
    { id: "communications", label: `الملاحظات والتواصل (${student.communications?.length || 0})`, icon: MessageSquare },
    { id: "timeline", label: "سجل النشاط والأحداث", icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/students"
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition"
            title="العودة لقائمة الطلاب"
          >
            {direction === "rtl" ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md">
            {student.fullNameAr?.[0] || "ط"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {student.fullNameAr}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs font-mono">
                {student.studentCode}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {student.fullNameEn} • {student.nationality} • فرع {student.branch?.name?.split("(")[0]?.trim() || "الرئيسي"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick status selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-400 font-medium">الحالة:</span>
            <select
              value={student.status}
              onChange={(e) => handleQuickStatusChange(e.target.value)}
              className="text-xs font-bold bg-transparent text-indigo-600 dark:text-indigo-400 focus:outline-hidden cursor-pointer"
            >
              <option value="new">جديد (New)</option>
              <option value="active">نشط (Active)</option>
              <option value="accepted">مقبول (Accepted)</option>
              <option value="visa_stage">مرحلة التأشيرة (Visa)</option>
              <option value="travelled">سافر (Travelled)</option>
              <option value="cancelled">ملغي (Cancelled)</option>
            </select>
          </div>

          {/* WhatsApp chat */}
          {student.phone && (
            <a
              href={`https://wa.me/${student.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>
          )}

          {/* Edit profile modal trigger */}
          <button
            onClick={() => setIsEditStudentModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>تعديل الملف</span>
          </button>

          {/* Delete student trigger */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="حذف ملف الطالب"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Personal Data */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  البيانات الشخصية وجواز السفر
                </h3>
                <button
                  onClick={() => setIsEditStudentModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <Edit className="w-3 h-3" />
                  <span>تعديل</span>
                </button>
              </div>
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">رقم جواز السفر:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {student.passportNumber || "••••••••"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">الهاتف:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200" dir="ltr">
                    {student.phone}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">البريد الإلكتروني:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200" dir="ltr">
                    {student.email}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">تاريخ الميلاد:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {student.birthDate ? new Date(student.birthDate).toLocaleDateString("ar-EG") : "غير مسجل"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">الجنسية:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{student.nationality}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">بلد الإقامة والمدينة:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {student.residenceCountry} {student.city ? `(${student.city})` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Background */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  المؤهل الأكاديمي والاهتمامات
                </h3>
                <button
                  onClick={() => setIsEditStudentModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <Edit className="w-3 h-3" />
                  <span>تعديل</span>
                </button>
              </div>
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">آخر مؤهل:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{student.lastCertificate || "ثانوية عامة"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">المعدل / GPA:</span>
                  <span className="font-bold text-emerald-600">{student.gpa || "غير محدد"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">مستوى اللغة:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{student.languageLevel || "B1"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">اختبار اللغة (IELTS/TOEFL):</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{student.ieltsToeflScore || "غير محدد"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">التخصص المطلوب:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{student.desiredMajor || "عام"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">الوجهة والمرحلة:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {student.desiredCountry} • {student.targetLevel || "بكالوريوس"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">الميزانية السنوية:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    ${student.budget?.toLocaleString() || "5,000"} {student.budgetCurrency}
                  </span>
                </div>
              </div>
            </div>

            {/* CRM & Counselor */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  المتابعة الداخلية والفرع
                </h3>
                <button
                  onClick={() => setIsEditStudentModalOpen(true)}
                  className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                >
                  <Edit className="w-3 h-3" />
                  <span>تعديل</span>
                </button>
              </div>
              <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">الفرع المسؤول:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.branch?.name?.split("(")[0]?.trim() || "المقر الرئيسي"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">المستشار الأكاديمي:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {student.counselor?.name?.split("(")[0]?.trim() || "غير معين"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">مصدر الطالب:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {student.leadSource?.nameAr || "مباشر"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">تاريخ التسجيل:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(student.registrationDate).toLocaleDateString("ar-EG")}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">فصل الالتحاق المستهدف:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{student.intake || "Fall 2026"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Custom Fields Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>الحقول والبيانات المخصصة (Custom Fields)</span>
              </h3>
              <button
                onClick={() => setIsEditStudentModalOpen(true)}
                className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-semibold"
              >
                <Edit className="w-3 h-3" />
                <span>تعديل الحقول</span>
              </button>
            </div>

            {Object.keys(parsedCustomFields).length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                لم يتم تسجيل قيم للحقول المخصصة لهذا الطالب بعد. اضغط &quot;تعديل الحقول&quot; لإدخالها.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(parsedCustomFields).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <span className="text-slate-400 block text-[11px] font-semibold">{key}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {typeof val === "boolean" ? (val ? "نعم / نعم" : "لا / كلا") : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Card */}
          {student.notes && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="font-bold text-xs text-slate-400 uppercase">ملاحظات عامة حول الطالب</h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {student.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: APPLICATIONS ================= */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">القبولات والتقديمات المسجلة</h3>
              <p className="text-xs text-slate-400">متابعة ملفات التقديم لجامعات الشركاء ومراحل القبول</p>
            </div>
            <button
              onClick={() => {
                setAppEditing(null);
                setAppForm({ countryId: "", universityId: "", customMajor: "", level: "bachelor", intake: "Fall 2026", tuitionFee: "", status: "submitted", notes: "" });
                setIsAppModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>تقديم جديد لجامعة</span>
            </button>
          </div>

          {student.applications?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <FileCheck2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">لا توجد تقديمات جامعية مسجلة لهذا الطالب حتى الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.applications?.map((app: any) => (
                <div
                  key={app.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900 dark:text-white block">
                        {app.university?.nameAr}
                      </span>
                      <span className="text-xs text-slate-400">{app.university?.nameEn}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs">
                        {app.stage?.nameAr || app.status}
                      </span>
                      <button
                        onClick={() => {
                          setAppEditing(app);
                          setAppForm({
                            countryId: app.countryId,
                            universityId: app.universityId,
                            customMajor: app.customMajor || "",
                            level: app.level || "bachelor",
                            intake: app.intake || "Fall 2026",
                            tuitionFee: app.tuitionFee ? String(app.tuitionFee) : "",
                            status: app.status,
                            notes: app.notes || "",
                          });
                          setIsAppModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                        title="تعديل"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ type: "application", id: app.id, name: app.university?.nameAr });
                          setIsDeleteItemModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p>
                      <span className="text-slate-400">الدولة:</span> {app.country?.flagEmoji} {app.country?.nameAr}
                    </p>
                    <p>
                      <span className="text-slate-400">البرنامج:</span> {app.program?.nameAr || app.customMajor || "بكالوريوس"}
                    </p>
                    <p>
                      <span className="text-slate-400">الرسوم الدراسية:</span> {app.tuitionFee?.toLocaleString() || 0} {app.tuitionCurrency || "EUR"}
                    </p>
                    <p>
                      <span className="text-slate-400">فصل الالتحاق:</span> {app.intake || "Fall 2026"}
                    </p>
                    {app.notes && (
                      <p className="text-[11px] text-slate-500 pt-1">
                        <span className="font-semibold">ملاحظات:</span> {app.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: DOCUMENTS ================= */}
      {activeTab === "documents" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">المستندات والأوراق المرفوعة</h3>
              <p className="text-xs text-slate-400">إدارة الجوازات، الشهادات، كشوف الدرجات، والترجمات</p>
            </div>
            <button
              onClick={() => {
                setDocEditing(null);
                setDocForm({ title: "", documentTypeId: "", fileUrl: "", fileName: "", fileSize: 0, status: "complete", notes: "" });
                setIsDocModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>رفع مستند جديد</span>
            </button>
          </div>

          {student.documents?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <FolderArchive className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">لا توجد مستندات مرفوعة لهذا الطالب بعد.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
              {student.documents?.map((doc: any) => (
                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block text-sm">
                        {doc.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {doc.documentType?.nameAr || "مستند عام"} • إصدار {doc.version} • {new Date(doc.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      {doc.status}
                    </span>

                    {/* Download / Open */}
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        title="فتح / تحميل المستند"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setDocEditing(doc);
                        setDocForm({
                          title: doc.title,
                          documentTypeId: doc.documentTypeId,
                          fileUrl: doc.fileUrl,
                          fileName: doc.fileName,
                          fileSize: doc.fileSize,
                          status: doc.status,
                          notes: doc.notes || "",
                        });
                        setIsDocModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      title="تعديل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        setItemToDelete({ type: "document", id: doc.id, name: doc.title });
                        setIsDeleteItemModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: VISA ================= */}
      {activeTab === "visa" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">ملفات التأشيرة ومواعيد السفارة</h3>
              <p className="text-xs text-slate-400">تجهيز ملف التأشيرة، المواعيد، ونتائج القرار</p>
            </div>
            <button
              onClick={() => {
                setVisaEditing(null);
                setVisaForm({ countryId: "", embassyLocation: "", appointmentDate: "", submissionDate: "", status: "preparing_documents", notes: "" });
                setIsVisaModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>فتح ملف تأشيرة</span>
            </button>
          </div>

          {student.visaCases?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <Stamp className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">لا يوجد ملف تأشيرة مفتوح لهذا الطالب بعد.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {student.visaCases?.map((vc: any) => (
                <div
                  key={vc.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        تأشيرة {vc.country?.nameAr}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 font-bold">
                        {vc.caseNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700">
                        {vc.status}
                      </span>
                      <button
                        onClick={() => {
                          setVisaEditing(vc);
                          setVisaForm({
                            countryId: vc.countryId,
                            embassyLocation: vc.embassyLocation || "",
                            appointmentDate: vc.appointmentDate ? new Date(vc.appointmentDate).toISOString().slice(0, 10) : "",
                            submissionDate: vc.submissionDate ? new Date(vc.submissionDate).toISOString().slice(0, 10) : "",
                            status: vc.status,
                            notes: vc.notes || "",
                          });
                          setIsVisaModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete({ type: "visa", id: vc.id, name: vc.caseNumber });
                          setIsDeleteItemModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 block">مركز التقديم / السفارة:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{vc.embassyLocation || "غير محدد"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">موعد السفارة:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {vc.appointmentDate ? new Date(vc.appointmentDate).toLocaleDateString("ar-EG") : "لم يُحجز بعد"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">المسؤول:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{vc.responsibleOfficer?.name || "غير معين"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 5: PAYMENTS ================= */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">سندات القبض والمدفوعات</h3>
              <p className="text-xs text-slate-400">إدارة الدفعات، الأقساط، والإيصالات المالية</p>
            </div>
            <button
              onClick={() => {
                setPaymentEditing(null);
                setPaymentForm({
                  receiptNumber: "",
                  amount: "",
                  currency: "USD",
                  method: "cash",
                  status: "completed",
                  notes: "",
                  paymentDate: new Date().toISOString().slice(0, 10),
                });
                setIsPaymentModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة سند قبض</span>
            </button>
          </div>

          {student.payments?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">لا توجد سندات قبض مسجلة لهذا الطالب حتى الآن.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
              {student.payments?.map((pay: any) => (
                <div key={pay.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {pay.receiptNumber}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 dark:text-slate-300">{pay.notes || "دفعة رسمية"}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {new Date(pay.paymentDate).toLocaleDateString("ar-EG")} • طريقة السداد: {pay.method} • المستلم: {pay.receiver?.name || "النظام"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      +${pay.amount?.toLocaleString()} {pay.currency}
                    </span>

                    <button
                      onClick={() => {
                        setPaymentEditing(pay);
                        setPaymentForm({
                          receiptNumber: pay.receiptNumber,
                          amount: String(pay.amount),
                          currency: pay.currency,
                          method: pay.method,
                          status: pay.status,
                          notes: pay.notes || "",
                          paymentDate: new Date(pay.paymentDate).toISOString().slice(0, 10),
                        });
                        setIsPaymentModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-indigo-600"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete({ type: "payment", id: pay.id, name: pay.receiptNumber });
                        setIsDeleteItemModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 6: TASKS ================= */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">المهام والمتابعات المطلوبة</h3>
              <p className="text-xs text-slate-400">إسناد المهام للمستشارين ومتابعة مواعيد استحقاقها</p>
            </div>
            <button
              onClick={() => {
                setTaskEditing(null);
                setTaskForm({ title: "", description: "", dueDate: "", priority: "normal", assigneeId: "" });
                setIsTaskModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة مهمة جديدة</span>
            </button>
          </div>

          {student.tasks?.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <CheckSquare className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">لا توجد مهام مسجلة لهذا الطالب.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {student.tasks?.map((task: any) => {
                const isCompleted = task.status === "completed";

                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                      isCompleted
                        ? "bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-70"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-700 hover:border-indigo-600"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <span
                          className={`font-bold block ${
                            isCompleted ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          موعد الاستحقاق: {new Date(task.dueDate).toLocaleDateString("ar-EG")} • المكلف: {task.assignee?.name || "غير محدد"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === "urgent"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600"
                        }`}
                      >
                        {task.priority === "urgent" ? "عاجل" : "عادي"}
                      </span>
                      <button
                        onClick={() => {
                          setItemToDelete({ type: "task", id: task.id, name: task.title });
                          setIsDeleteItemModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 7: NOTES & COMMUNICATIONS ================= */}
      {activeTab === "communications" && (
        <div className="space-y-5">
          {/* Add Note Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-xs text-indigo-600 dark:text-indigo-400">
              إضافة ملاحظة أو توثيق مكالمة / محادثة
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={noteSubject}
                  onChange={(e) => setNoteSubject(e.target.value)}
                  placeholder="موضوع الملاحظة (اختياري)..."
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <select
                  value={noteChannel}
                  onChange={(e) => setNoteChannel(e.target.value)}
                  className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="note">ملاحظة داخلية (Internal Note)</option>
                  <option value="call">مكالمة هاتفية (Phone Call)</option>
                  <option value="whatsapp">محادثة واتساب (WhatsApp)</option>
                  <option value="email">بريد إلكتروني (Email)</option>
                </select>
              </div>

              <textarea
                rows={3}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="اكتب تفاصيل الملاحظة أو ملخص الحديث مع الطالب..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !noteContent.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {submittingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>حفظ الملاحظة</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {student.communications?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد ملاحظات مسجلة بعد.</p>
            ) : (
              student.communications?.map((c: any) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{c.subject}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                        {c.channel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <span>{new Date(c.sentAt).toLocaleDateString("ar-EG")}</span>
                      <button
                        onClick={() => {
                          setItemToDelete({ type: "note", id: c.id, name: c.subject });
                          setIsDeleteItemModalOpen(true);
                        }}
                        className="hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    بواسطة: {c.user?.name || "مستخدم"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 8: TIMELINE & ACTIVITY LOG ================= */}
      {activeTab === "timeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestones Timeline */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              الجدول الزمني ومراحل الملف
            </h3>

            <div className="relative border-s-2 border-slate-200 dark:border-slate-800 ms-3 space-y-5">
              {student.timelineEvents?.map((ev: any) => (
                <div key={ev.id} className="relative ps-5 text-xs">
                  <span className="absolute -start-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600" />
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{ev.titleAr}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.eventDate).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{ev.description}</p>
                    <span className="text-[10px] text-slate-400 block">بواسطة: {ev.actorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              سجل تدقيق العمليات (Audit Trail)
            </h3>
            <p className="text-xs text-slate-400">
              سجل تفصيلي يوضح من قام بأي تعديل أو إضافة أو حذف على هذا الملف وتوقيتها
            </p>

            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد عمليات تدقيق إضافية مسجلة.</p>
              ) : (
                activityLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "create"
                              ? "bg-emerald-100 text-emerald-700"
                              : log.action === "delete"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {log.userName || "النظام"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString("ar-EG")}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px]">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Profile Modal */}
      <StudentModal
        isOpen={isEditStudentModalOpen}
        onClose={() => setIsEditStudentModalOpen(false)}
        onSuccess={fetchStudentData}
        student={student}
        branches={branches}
        counselors={counselors}
        countries={countries}
      />

      {/* Delete Student Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteStudent}
        loading={deletingStudent}
        title="تأكيد حذف الطالب"
        message={`هل أنت متأكد من حذف الطالب "${student.fullNameAr}" نهائياً من العرض؟`}
        confirmText="نعم، حذف الملف"
        cancelText="إلغاء"
        isDestructive={true}
      />

      {/* Confirm Delete Sub Item Modal */}
      <ConfirmModal
        isOpen={isDeleteItemModalOpen}
        onClose={() => {
          setIsDeleteItemModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleConfirmDeleteItem}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف "${itemToDelete?.name}"؟`}
        confirmText="حذف"
        cancelText="إلغاء"
        isDestructive={true}
      />

      {/* Upload/Edit Document Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {docEditing ? "تعديل المستند" : "رفع مستند جديد"}
            </h3>

            <form onSubmit={handleSaveDocument} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">عنوان المستند</label>
                <input
                  type="text"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="شهادة الثانوية العامة، جواز السفر..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">رفع الملف من جهازك</label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {docUploading && <p className="text-indigo-600 mt-1">جاري رفع الملف...</p>}
                {docForm.fileUrl && <p className="text-emerald-600 mt-1">✓ تم تجهيز الملف: {docForm.fileName}</p>}
              </div>

              <div>
                <label className="font-semibold block mb-1">حالة المستند</label>
                <select
                  value={docForm.status}
                  onChange={(e) => setDocForm({ ...docForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="complete">مكتمل وجاهز</option>
                  <option value="waiting_for_student">بانتظار الطالب</option>
                  <option value="in_translation">قيد الترجمة والتوثيق</option>
                  <option value="needs_correction">يحتاج تعديل</option>
                  <option value="verified">تم التحقق رسمياً</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  placeholder="ملاحظات حول صلاحية المستند..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={docUploading || !docForm.fileUrl}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {appEditing ? "تعديل التقديم الجامعي" : "تقديم لجامعة جديدة"}
            </h3>

            <form onSubmit={handleSaveApplication} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">الوجهة / الدولة</label>
                <select
                  value={appForm.countryId}
                  onChange={(e) => setAppForm({ ...appForm, countryId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                >
                  <option value="">اختر الدولة...</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">الجامعة</label>
                <select
                  value={appForm.universityId}
                  onChange={(e) => setAppForm({ ...appForm, universityId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                >
                  <option value="">اختر الجامعة...</option>
                  {universities
                    .filter((u) => !appForm.countryId || u.countryId === appForm.countryId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nameAr}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">التخصص المطلوب</label>
                <input
                  type="text"
                  value={appForm.customMajor}
                  onChange={(e) => setAppForm({ ...appForm, customMajor: e.target.value })}
                  placeholder="هندسة، إدارة، طب..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">المرحلة</label>
                  <select
                    value={appForm.level}
                    onChange={(e) => setAppForm({ ...appForm, level: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="bachelor">بكالوريوس</option>
                    <option value="master">ماجستير</option>
                    <option value="phd">دكتوراه</option>
                    <option value="language">لغة</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">الرسوم الدراسية</label>
                  <input
                    type="number"
                    value={appForm.tuitionFee}
                    onChange={(e) => setAppForm({ ...appForm, tuitionFee: e.target.value })}
                    placeholder="8000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAppModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {paymentEditing ? "تعديل سند القبض" : "إضافة سند قبض / دفعة"}
            </h3>

            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">المبلغ</label>
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="1500"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">العملة</label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="SAR">SAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">طريقة السداد</label>
                <select
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="cash">نقداً (Cash)</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="credit_card">بطاقة ائتمان</option>
                  <option value="online_link">بوابة دفع إلكترونية</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">بيان / ملاحظات الدفعة</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="دفعة أولى للتقديم الجامعي..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {taskEditing ? "تعديل المهمة" : "إضافة مهمة جديدة"}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">عنوان المهمة</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="طلب كشف الحساب البنكي من الطالب..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">الأولوية</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="normal">عادية</option>
                  <option value="urgent">عاجلة جداً</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
