"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { StudentModal } from "@/components/students/student-modal";
import { ImportModal } from "@/components/students/import-modal";
import { CustomFieldsModal } from "@/components/students/custom-fields-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  Phone,
  Mail,
  GraduationCap,
  ExternalLink,
  Loader2,
  X,
  AlertCircle,
  Building,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Edit,
  ArrowUpDown,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import * as XLSX from "xlsx";

export default function StudentsPage() {
  const { language, selectedBranchId, t, direction } = useCrm();
  const { success, error: toastError } = useToast();

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [counselorFilter, setCounselorFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState(selectedBranchId || "all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection for Bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Lookups & Options data
  const [countries, setCountries] = useState<any[]>([]);
  const [universities, setUniversities] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [counselors, setCounselors] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [lookupStatuses, setLookupStatuses] = useState<any[]>([]);

  // Current user permissions
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState("admin");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingStudent, setCurrentEditingStudent] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);

  // Confirm delete modals
  const [isDeleteSingleModalOpen, setIsDeleteSingleModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // Synchronize branch with global CrmProvider
  useEffect(() => {
    if (selectedBranchId && selectedBranchId !== "all") {
      setBranchFilter(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Load auxiliary data (countries, universities, branches, counselors, lookups, user)
  useEffect(() => {
    async function loadAuxiliaryData() {
      try {
        const [countriesRes, unisRes, branchesRes, usersRes, meRes, lookupsRes] = await Promise.all([
          fetch("/api/countries"),
          fetch("/api/universities"),
          fetch("/api/branches"),
          fetch("/api/employees"),
          fetch("/api/auth/me"),
          fetch("/api/students/lookups?category=student_status"),
        ]);

        if (countriesRes.ok) {
          const d = await countriesRes.json();
          setCountries(d.countries || []);
        }
        if (unisRes.ok) {
          const d = await unisRes.json();
          setUniversities(d.universities || []);
        }
        if (branchesRes.ok) {
          const d = await branchesRes.json();
          setBranches(d.branches || []);
        }
        if (usersRes.ok) {
          const d = await usersRes.json();
          setCounselors(d.users || d.employees || []);
        }
        if (meRes.ok) {
          const d = await meRes.json();
          if (d.user) {
            setUserRole(d.user.role?.name || "admin");
            setPermissions(d.user.permissions || []);
          }
        }
        if (lookupsRes.ok) {
          const d = await lookupsRes.json();
          setLookupStatuses(d.options || []);
        }
      } catch (err) {
        console.error("Auxiliary data load error:", err);
      }
    }

    loadAuxiliaryData();
  }, []);

  // Fetch students with active filters, search, sort and pagination
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        country: countryFilter,
        universityId: universityFilter,
        level: levelFilter,
        counselorId: counselorFilter,
        branchId: branchFilter,
        sortBy,
        sortOrder,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });

      const res = await fetch(`/api/students?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        toastError("فشل تحميل قائمة الطلاب");
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      toastError("خطأ في الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    statusFilter,
    countryFilter,
    universityFilter,
    levelFilter,
    counselorFilter,
    branchFilter,
    sortBy,
    sortOrder,
    pagination.page,
    pagination.limit,
    toastError,
  ]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents, refreshKey]);

  // Permissions helpers
  const canCreate = userRole === "admin" || permissions.includes("students:create") || permissions.includes("students:*");
  const canEdit = userRole === "admin" || permissions.includes("students:edit") || permissions.includes("students:*");
  const canDelete = userRole === "admin" || permissions.includes("students:delete") || permissions.includes("students:*");
  const canExport = userRole === "admin" || permissions.includes("students:export") || permissions.includes("students:*");

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(students.map((s) => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const isAllSelected = students.length > 0 && selectedIds.length === students.length;

  // Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${studentToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف ملف الطالب");
      success(`تم حذف الطالب ${studentToDelete.fullNameAr} بنجاح`);
      setIsDeleteSingleModalOpen(false);
      setStudentToDelete(null);
      setSelectedIds((prev) => prev.filter((i) => i !== studentToDelete.id));
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/students", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIds: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف الجماعي");
      success(`تم حذف ${data.count || selectedIds.length} طالب بنجاح`);
      setIsBulkDeleteModalOpen(false);
      setSelectedIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Update Status
  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0 || !newStatus) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedIds,
          data: { status: newStatus },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحديث الجماعي");
      success(`تم تحديث حالة ${data.count || selectedIds.length} طالب إلى "${newStatus}" بنجاح`);
      setSelectedIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  // Bulk Update Counselor
  const handleBulkCounselorChange = async (newCounselorId: string) => {
    if (selectedIds.length === 0 || !newCounselorId) return;
    setBulkUpdating(true);
    try {
      const res = await fetch("/api/students", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedIds,
          data: { counselorId: newCounselorId },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إعادة تعيين المستشار");
      success(`تم تعيين المستشار لـ ${data.count || selectedIds.length} طالب بنجاح`);
      setSelectedIds([]);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setBulkUpdating(false);
    }
  };

  // Export to Excel with active filters
  const handleExportExcel = async () => {
    try {
      // Query all matching students without pagination limit for export
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        country: countryFilter,
        universityId: universityFilter,
        level: levelFilter,
        counselorId: counselorFilter,
        branchId: branchFilter,
        sortBy,
        sortOrder,
        export: "true",
      });

      const res = await fetch(`/api/students?${query.toString()}`);
      if (!res.ok) throw new Error("فشل تصدير البيانات");
      const data = await res.json();
      const exportList = data.students || students;

      const formatted = exportList.map((s: any) => ({
        "كود الطالب": s.studentCode,
        "الاسم بالعربية": s.fullNameAr,
        "الاسم بالإنجليزية": s.fullNameEn,
        "الهاتف": s.phone,
        "البريد الإلكتروني": s.email,
        "الجنسية": s.nationality,
        "بلد الإقامة": s.residenceCountry,
        "الدولة المستهدفة": s.desiredCountry,
        "التخصص المطلوب": s.desiredMajor,
        "المرحلة": s.targetLevel,
        "الميزانية التقديرية": `$${s.budget || 0}`,
        "الحالة": s.status,
        "المستشار الأكاديمي": s.counselor?.name || "غير معين",
        "الفرع": s.branch?.name || "المقر الرئيسي",
        "تاريخ التسجيل": new Date(s.registrationDate).toLocaleDateString("ar-EG"),
      }));

      const ws = XLSX.utils.json_to_sheet(formatted);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
      XLSX.writeFile(wb, `amalon_students_${new Date().toISOString().slice(0, 10)}.xlsx`);
      success(`تم تصدير ${formatted.length} طالب إلى ملف Excel بنجاح`);
    } catch (err: any) {
      toastError(err.message);
    }
  };

  // Status badge config
  const statusBadge = (st: string) => {
    const config: Record<string, { label: string; bg: string; text: string }> = {
      new: { label: "جديد", bg: "bg-blue-100 dark:bg-blue-950/80", text: "text-blue-700 dark:text-blue-300" },
      active: { label: "نشط", bg: "bg-indigo-100 dark:bg-indigo-950/80", text: "text-indigo-700 dark:text-indigo-300" },
      accepted: { label: "مقبول", bg: "bg-emerald-100 dark:bg-emerald-950/80", text: "text-emerald-700 dark:text-emerald-300" },
      visa_stage: { label: "تأشيرة", bg: "bg-amber-100 dark:bg-amber-950/80", text: "text-amber-700 dark:text-amber-300" },
      travelled: { label: "سافر", bg: "bg-teal-100 dark:bg-teal-950/80", text: "text-teal-700 dark:text-teal-300" },
      cancelled: { label: "ملغي", bg: "bg-rose-100 dark:bg-rose-950/80", text: "text-rose-700 dark:text-rose-300" },
    };

    const c = config[st] || { label: st, bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300" };

    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setCountryFilter("all");
    setUniversityFilter("all");
    setLevelFilter("all");
    setCounselorFilter("all");
    setBranchFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Metrics summary
  const stats = useMemo(() => {
    const total = pagination.total || students.length;
    const active = students.filter((s) => s.status === "active").length;
    const visa = students.filter((s) => s.status === "visa_stage").length;
    const accepted = students.filter((s) => s.status === "accepted").length;
    return { total, active, visa, accepted };
  }, [pagination.total, students]);

  return (
    <div className="space-y-6">
      {/* Top Actions: Only Export Excel & Add Student */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          onClick={handleExportExcel}
          className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-500" />
          <span>تصدير Excel</span>
        </button>

        {canCreate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة طالب جديد</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">إجمالي الطلاب</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.total}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">قيد المتابعة النشطة</span>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{stats.active}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">مرحلة التأشيرة</span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.visa}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">حصلوا على قبولات</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.accepted}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، الكود، الهاتف، البريد، أو الجنسية..."
              className="w-full ps-10 pe-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل الحالات</option>
              <option value="new">جديد</option>
              <option value="active">نشط</option>
              <option value="accepted">مقبول</option>
              <option value="visa_stage">مرحلة التأشيرة</option>
              <option value="travelled">سافر</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>

          {/* Country Filter */}
          <div className="lg:col-span-2">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل الدول المستهدفة</option>
              {countries.map((c) => (
                <option key={c.id} value={c.nameEn}>
                  {c.flagEmoji} {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* University Filter */}
          <div className="lg:col-span-2">
            <select
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل الجامعات</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* Counselor Filter */}
          <div className="lg:col-span-2">
            <select
              value={counselorFilter}
              onChange={(e) => setCounselorFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كل المستشارين</option>
              {counselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary controls: Sort, Branch, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              <option value="createdAt">تاريخ الإضافة</option>
              <option value="name">اسم الطالب</option>
              <option value="code">كود الطالب</option>
              <option value="status">الحالة</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
              className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
              title="عكس الترتيب"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-semibold transition"
            >
              إعادة ضبط الفلاتر
            </button>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/90 border border-indigo-200 dark:border-indigo-800 animate-in fade-in shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-100">
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>تم تحديد {selectedIds.length} طالب</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick bulk status change */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-indigo-700 dark:text-indigo-300">تغيير الحالة:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value);
                }}
                defaultValue=""
                disabled={bulkUpdating}
                className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-medium"
              >
                <option value="" disabled>
                  اختر الحالة...
                </option>
                <option value="new">جديد</option>
                <option value="active">نشط</option>
                <option value="accepted">مقبول</option>
                <option value="visa_stage">مرحلة التأشيرة</option>
                <option value="travelled">سافر</option>
                <option value="cancelled">ملغي</option>
              </select>
            </div>

            {/* Quick bulk reassign counselor */}
            {counselors.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300">إسناد لمستشار:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) handleBulkCounselorChange(e.target.value);
                  }}
                  defaultValue=""
                  disabled={bulkUpdating}
                  className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 font-medium"
                >
                  <option value="" disabled>
                    اختر المستشار...
                  </option>
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Bulk delete */}
            {canDelete && (
              <button
                onClick={() => setIsBulkDeleteModalOpen(true)}
                disabled={bulkUpdating}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد ({selectedIds.length})</span>
              </button>
            )}

            {/* Cancel selection */}
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Students Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل سجلات الطلاب...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 px-4 text-center space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">
              لم يتم العثور على أي طلاب مطابقين
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              جرّب تغيير كلمات البحث أو إعادة ضبط الفلاتر، أو قم بتسجيل طالب جديد الآن.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
              >
                مسح الفلاتر
              </button>
              {canCreate && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  إضافة طالب جديد
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(!isAllSelected)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3.5 font-bold">الطالب</th>
                  <th className="p-3.5 font-bold">بيانات التواصل</th>
                  <th className="p-3.5 font-bold">الوجهة والتخصص</th>
                  <th className="p-3.5 font-bold">الفرع والمستشار</th>
                  <th className="p-3.5 font-bold">الحالة</th>
                  <th className="p-3.5 font-bold">الملفات</th>
                  <th className="p-3.5 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => {
                  const isSelected = selectedIds.includes(student.id);

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                        isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectOne(student.id, !isSelected)}
                          className="p-1 rounded text-slate-400 hover:text-indigo-600 transition"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Student info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {student.fullNameAr?.[0] || "ط"}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition block text-xs"
                            >
                              {student.fullNameAr}
                            </Link>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                {student.studentCode}
                              </span>
                              <span>•</span>
                              <span>{student.nationality}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span dir="ltr" className="text-[11px]">
                            {student.phone}
                          </span>
                          <a
                            href={`https://wa.me/${student.phone?.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                            title="محادثة واتساب سريعة"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span dir="ltr" className="truncate max-w-[140px]">
                            {student.email}
                          </span>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {student.desiredCountry}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {student.desiredMajor || "عام"} • {student.targetLevel || "بكالوريوس"}
                        </div>
                      </td>

                      {/* CRM Assignment */}
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                          {student.branch?.name?.split("(")[0]?.trim() || "المقر الرئيسي"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student.counselor?.name?.split("(")[0]?.trim() || "غير معين"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3.5">{statusBadge(student.status)}</td>

                      {/* Counts / files */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"
                            title="القبولات والتقديمات"
                          >
                            🎓 {student._count?.applications || student.applications?.length || 0}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800"
                            title="المستندات"
                          >
                            📄 {student._count?.documents || 0}
                          </span>
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center justify-center gap-1">
                          {/* View profile */}
                          <Link
                            href={`/students/${student.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                            title="عرض الملف الشامل"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Quick edit */}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentEditingStudent(student);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => {
                                setStudentToDelete(student);
                                setIsDeleteSingleModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition"
                              title="حذف الطالب"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Toolbar */}
        {!loading && students.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>
                عرض {(pagination.page - 1) * pagination.limit + 1} إلى{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} من إجمالي{" "}
                {pagination.total} طالب
              </span>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <span>العدد بالصفحة:</span>
                <select
                  value={pagination.limit}
                  onChange={(e) =>
                    setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))
                  }
                  className="px-2 py-0.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40 flex items-center gap-1 font-bold"
              >
                {direction === "rtl" ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                <span>السابق</span>
              </button>

              <div className="px-3 py-1 font-bold text-slate-800 dark:text-slate-200">
                صفحة {pagination.page} من {pagination.totalPages || 1}
              </div>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition disabled:opacity-40 flex items-center gap-1 font-bold"
              >
                <span>التالي</span>
                {direction === "rtl" ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <StudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        branches={branches}
        counselors={counselors}
        leadSources={leadSources}
        countries={countries}
      />

      {/* Edit Student Modal */}
      <StudentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setCurrentEditingStudent(null);
        }}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        student={currentEditingStudent}
        branches={branches}
        counselors={counselors}
        leadSources={leadSources}
        countries={countries}
      />

      {/* Import Excel Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {/* Custom Fields & Lookups Modal */}
      <CustomFieldsModal
        isOpen={isFieldsModalOpen}
        onClose={() => setIsFieldsModalOpen(false)}
        onRefresh={() => setRefreshKey((k) => k + 1)}
      />

      {/* Confirm Single Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteSingleModalOpen}
        onClose={() => {
          setIsDeleteSingleModalOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleConfirmSingleDelete}
        loading={deleting}
        title="تأكيد حذف ملف الطالب"
        message={`هل أنت متأكد من حذف الطالب "${studentToDelete?.fullNameAr}" (${studentToDelete?.studentCode})؟ سيتم أرشفة الملف وحذفه من العرض النشط.`}
        confirmText="نعم، حذف الملف"
        cancelText="إلغاء"
        isDestructive={true}
      />

      {/* Confirm Bulk Delete Modal */}
      <ConfirmModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        loading={deleting}
        title="تأكيد الحذف الجماعي للطلاب"
        message={`أنت على وشك حذف ${selectedIds.length} طالب دفعة واحدة. هذه العملية ستؤرشف جميع الملفات المحددة. هل تريد المتابعة؟`}
        confirmText={`نعم، حذف ${selectedIds.length} طالب`}
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
