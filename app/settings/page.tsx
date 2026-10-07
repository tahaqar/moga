"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  Layers,
  Share2,
  Loader2,
  AlertCircle,
  Save,
  Tag,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"lookups" | "customFields" | "leadSources">("lookups");

  // Lookups state
  const [options, setOptions] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("study_level");
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [newKey, setNewKey] = useState("");
  const [newLabelAr, setNewLabelAr] = useState("");
  const [newLabelEn, setNewLabelEn] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Edit Lookup Modal
  const [editingLookup, setEditingLookup] = useState<any>(null);
  const [editLookupForm, setEditLookupForm] = useState({ labelAr: "", labelEn: "", color: "#6366f1" });

  // Custom fields state
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("Student");
  const [loadingFields, setLoadingFields] = useState(true);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldLabelAr, setNewFieldLabelAr] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");

  // Edit Custom Field Modal
  const [editingField, setEditingField] = useState<any>(null);
  const [editFieldForm, setEditFieldForm] = useState({ labelAr: "", labelEn: "", type: "text", isRequired: false });

  // Lead Sources state
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [newSourceNameAr, setNewSourceNameAr] = useState("");
  const [newSourceNameEn, setNewSourceNameEn] = useState("");
  const [newSourceCode, setNewSourceCode] = useState("");
  const [newSourceColor, setNewSourceColor] = useState("#6366f1");

  // Edit Lead Source Modal
  const [editingSource, setEditingSource] = useState<any>(null);
  const [editSourceForm, setEditSourceForm] = useState({ nameAr: "", nameEn: "", color: "#6366f1" });

  // Delete Confirm State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "lookup" | "field" | "source" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch Lookups
  const loadLookups = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/lookups?category=${selectedCategory}`);
      if (res.ok) {
        const data = await res.json();
        setOptions(data.options || []);
      }
    } catch (err) {
      console.error("Fetch lookups error:", err);
      toastError("فشل تحميل خيارات القائمة");
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedCategory, toastError]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups, refreshKey]);

  // Fetch Custom Fields
  const loadFields = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings/custom-fields?entity=${selectedEntity}`);
      if (res.ok) {
        const data = await res.json();
        setCustomFields(data.fields || []);
      }
    } catch (err) {
      console.error("Fetch fields error:", err);
      toastError("فشل تحميل الحقول المخصصة");
    } finally {
      setLoadingFields(false);
    }
  }, [selectedEntity, toastError]);

  useEffect(() => {
    loadFields();
  }, [loadFields, refreshKey]);

  // Fetch Lead Sources
  const loadSources = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/lead-sources");
      if (res.ok) {
        const data = await res.json();
        setLeadSources(data.sources || []);
      }
    } catch (err) {
      console.error("Fetch sources error:", err);
      toastError("فشل تحميل مصادر الطلاب");
    } finally {
      setLoadingSources(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSources();
  }, [loadSources, refreshKey]);

  // Lookup Handlers
  const handleCreateLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    try {
      const res = await fetch("/api/settings/lookups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          key: newKey.trim(),
          labelAr: newLabelAr.trim(),
          labelEn: newLabelEn.trim() || newLabelAr.trim(),
          color: newColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء الخيار");

      setNewKey("");
      setNewLabelAr("");
      setNewLabelEn("");
      success("تمت إضافة الخيار بنجاح");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      setLookupError(err.message);
      toastError(err.message);
    }
  };

  const handleUpdateLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLookup) return;
    try {
      const res = await fetch("/api/settings/lookups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLookup.id,
          labelAr: editLookupForm.labelAr.trim(),
          labelEn: editLookupForm.labelEn.trim(),
          color: editLookupForm.color,
        }),
      });
      if (!res.ok) throw new Error("فشل تعديل الخيار");
      success("تم تعديل الخيار بنجاح");
      setEditingLookup(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء تعديل الخيار");
    }
  };

  // Custom Field Handlers
  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: selectedEntity,
          name: newFieldName.trim(),
          labelAr: newFieldLabelAr.trim(),
          type: newFieldType,
        }),
      });
      if (res.ok) {
        setNewFieldName("");
        setNewFieldLabelAr("");
        success("تمت إضافة الحقل المخصص بنجاح");
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Create custom field error:", err);
      toastError("فشل إنشاء الحقل المخصص");
    }
  };

  const handleUpdateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    try {
      const res = await fetch("/api/settings/custom-fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingField.id,
          labelAr: editFieldForm.labelAr.trim(),
          labelEn: editFieldForm.labelEn.trim(),
          type: editFieldForm.type,
          isRequired: editFieldForm.isRequired,
        }),
      });
      if (!res.ok) throw new Error("فشل تعديل الحقل المخصص");
      success("تم تعديل الحقل المخصص بنجاح");
      setEditingField(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء تعديل الحقل المخصص");
    }
  };

  // Lead Source Handlers
  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/lead-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr: newSourceNameAr.trim(),
          nameEn: newSourceNameEn.trim() || newSourceNameAr.trim(),
          code: newSourceCode.trim() || undefined,
          color: newSourceColor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء مصدر الطلاب");

      setNewSourceNameAr("");
      setNewSourceNameEn("");
      setNewSourceCode("");
      success("تمت إضافة مصدر الطلاب بنجاح");
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "فشل إنشاء مصدر الطلاب");
    }
  };

  const handleUpdateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSource) return;
    try {
      const res = await fetch("/api/settings/lead-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSource.id,
          nameAr: editSourceForm.nameAr.trim(),
          nameEn: editSourceForm.nameEn.trim(),
          color: editSourceForm.color,
        }),
      });
      if (!res.ok) throw new Error("فشل تعديل مصدر الطلاب");
      success("تم تعديل مصدر الطلاب بنجاح");
      setEditingSource(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء تعديل مصدر الطلاب");
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      let url = "";
      if (deleteTarget.type === "lookup") url = `/api/settings/lookups?id=${deleteTarget.id}`;
      else if (deleteTarget.type === "field") url = `/api/settings/custom-fields?id=${deleteTarget.id}`;
      else if (deleteTarget.type === "source") url = `/api/settings/lead-sources?id=${deleteTarget.id}`;

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");

      success("تم الحذف بنجاح");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <span>{t("settings", "إعدادات النظام والخيارات الحية")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          إدارة خيارات القوائم المنسدلة بدون أي كود ثابت، إضافة حقول مخصصة، وإدارة قنوات ومصادر الطلاب
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("lookups")}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "lookups"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>خيارات القوائم المنسدلة (Lookups)</span>
        </button>

        <button
          onClick={() => setActiveTab("customFields")}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "customFields"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>الحقول المخصصة (Custom Fields)</span>
        </button>

        <button
          onClick={() => setActiveTab("leadSources")}
          className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
            activeTab === "leadSources"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>مصادر الطلاب والتسويق (Lead Sources)</span>
        </button>
      </div>

      {/* Tab 1: Lookups */}
      {activeTab === "lookups" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              فئة الخيارات
            </h2>
            <div className="space-y-1.5">
              {[
                { id: "study_level", label: "المراحل الدراسية (Study Levels)" },
                { id: "student_status", label: "حالات الطلاب (Student Statuses)" },
                { id: "payment_method", label: "طرق السداد (Payment Methods)" },
                { id: "task_priority", label: "أولويات المهام (Task Priorities)" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full text-start p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">إضافة خيار جديد</h3>
              {lookupError && (
                <div className="p-2 mb-2 rounded-lg bg-rose-50 text-rose-600 text-[11px] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
              <form onSubmit={handleCreateLookup} className="space-y-2">
                <input
                  type="text"
                  placeholder="المفتاح البرمجي (e.g. bachelor)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="الاسم بالعربية (بكالوريوس)"
                  value={newLabelAr}
                  onChange={(e) => setNewLabelAr(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="الاسم بالإنجليزية (Bachelor)"
                  value={newLabelEn}
                  onChange={(e) => setNewLabelEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[11px] text-slate-400">لون العلامة</span>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الخيار</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>الخيارات الحالية في النظام</span>
              <span className="text-slate-400 text-[11px]">{options.length} خيار</span>
            </div>
            {loadingOptions ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs">جاري التحميل...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {options.map((opt) => (
                  <div key={opt.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opt.color || "#6366f1" }} />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{opt.labelAr}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {opt.key} ({opt.labelEn})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingLookup(opt);
                          setEditLookupForm({ labelAr: opt.labelAr, labelEn: opt.labelEn || "", color: opt.color || "#6366f1" });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: opt.id, name: opt.labelAr, type: "lookup" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
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
        </div>
      )}

      {/* Tab 2: Custom Fields */}
      {activeTab === "customFields" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h2 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              الكيان المرتبط بالحقل
            </h2>
            <div className="space-y-1.5">
              {[
                { id: "Student", label: "ملف الطالب (Student)" },
                { id: "Application", label: "التقديم الجامعي (Application)" },
                { id: "University", label: "الجامعة (University)" },
              ].map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => setSelectedEntity(ent.id)}
                  className={`w-full text-start p-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    selectedEntity === ent.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {ent.label}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-2">إضافة حقل مخصص جديد</h3>
              <form onSubmit={handleCreateCustomField} className="space-y-2">
                <input
                  type="text"
                  placeholder="اسم الحقل البرمجي (e.g. high_school_gpa)"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="تسمية الحقل بالعربية (معدل الثانوية)"
                  value={newFieldLabelAr}
                  onChange={(e) => setNewFieldLabelAr(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="text">نص عادي (Text)</option>
                  <option value="number">رقم (Number)</option>
                  <option value="date">تاريخ (Date)</option>
                  <option value="select">قائمة اختيار (Select)</option>
                  <option value="checkbox">مربع تحديد (Checkbox)</option>
                </select>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الحقل المخصص</span>
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>الحقول المخصصة النشطة في الكيان</span>
              <span className="text-slate-400 text-[11px]">{customFields.length} حقل</span>
            </div>
            {loadingFields ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs">جاري التحميل...</p>
              </div>
            ) : customFields.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">لا توجد حقول مخصصة مضافة لهذا الكيان</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {customFields.map((field) => (
                  <div key={field.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">{field.labelAr}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        {field.name} - نوع: {field.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingField(field);
                          setEditFieldForm({
                            labelAr: field.labelAr,
                            labelEn: field.labelEn || "",
                            type: field.type || "text",
                            isRequired: !!field.isRequired,
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: field.id, name: field.labelAr, type: "field" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
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
        </div>
      )}

      {/* Tab 3: Lead Sources */}
      {activeTab === "leadSources" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              إضافة مصدر تسويقي جديد
            </h2>
            <form onSubmit={handleCreateSource} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  اسم المصدر بالعربية *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إعلانات تيك توك"
                  value={newSourceNameAr}
                  onChange={(e) => setNewSourceNameAr(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  placeholder="TikTok Ads"
                  value={newSourceNameEn}
                  onChange={(e) => setNewSourceNameEn(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  كود المصدر (فريد)
                </label>
                <input
                  type="text"
                  placeholder="tiktok_ads"
                  value={newSourceCode}
                  onChange={(e) => setNewSourceCode(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={newSourceColor}
                  onChange={(e) => setNewSourceColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-[11px] text-slate-400">لون العلامة والتقارير</span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ المصدر</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
              <span>مصادر وقنوات جذب الطلاب</span>
              <span className="text-slate-400 text-[11px]">{leadSources.length} مصدر</span>
            </div>
            {loadingSources ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs">جاري التحميل...</p>
              </div>
            ) : leadSources.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">لا توجد مصادر مضافة حالياً</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {leadSources.map((src) => (
                  <div key={src.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <div className="flex items-center gap-3">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: src.color || "#6366f1" }} />
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-white block">{src.nameAr}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {src.code} ({src.nameEn}) - عدد الطلاب: {src._count?.students || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingSource(src);
                          setEditSourceForm({ nameAr: src.nameAr, nameEn: src.nameEn || "", color: src.color || "#6366f1" });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTarget({ id: src.id, name: src.nameAr, type: "source" });
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
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
        </div>
      )}

      {/* Edit Lookup Modal */}
      {editingLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">تعديل الخيار</h3>
              <button onClick={() => setEditingLookup(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateLookup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">الاسم بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editLookupForm.labelAr}
                  onChange={(e) => setEditLookupForm({ ...editLookupForm, labelAr: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={editLookupForm.labelEn}
                  onChange={(e) => setEditLookupForm({ ...editLookupForm, labelEn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editLookupForm.color}
                  onChange={(e) => setEditLookupForm({ ...editLookupForm, color: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-[11px] text-slate-400">لون الخيار</span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingLookup(null)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Custom Field Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">تعديل الحقل المخصص</h3>
              <button onClick={() => setEditingField(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateCustomField} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">تسمية الحقل بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editFieldForm.labelAr}
                  onChange={(e) => setEditFieldForm({ ...editFieldForm, labelAr: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">نوع الحقل</label>
                <select
                  value={editFieldForm.type}
                  onChange={(e) => setEditFieldForm({ ...editFieldForm, type: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                >
                  <option value="text">نص عادي (Text)</option>
                  <option value="number">رقم (Number)</option>
                  <option value="date">تاريخ (Date)</option>
                  <option value="select">قائمة اختيار (Select)</option>
                  <option value="checkbox">مربع تحديد (Checkbox)</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fieldReq"
                  checked={editFieldForm.isRequired}
                  onChange={(e) => setEditFieldForm({ ...editFieldForm, isRequired: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300"
                />
                <label htmlFor="fieldReq" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  حقل إلزامي
                </label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingField(null)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                  حفظ التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead Source Modal */}
      {editingSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">تعديل مصدر الطلاب</h3>
              <button onClick={() => setEditingSource(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSource} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">اسم المصدر بالعربية *</label>
                <input
                  type="text"
                  required
                  value={editSourceForm.nameAr}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, nameAr: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  value={editSourceForm.nameEn}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, nameEn: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editSourceForm.color}
                  onChange={(e) => setEditSourceForm({ ...editSourceForm, color: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-[11px] text-slate-400">لون العلامة</span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingSource(null)} className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:bg-slate-100 cursor-pointer">
                  إلغاء
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer">
                  حفظ التعديل
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
        title="تأكيد الحذف"
        description={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
