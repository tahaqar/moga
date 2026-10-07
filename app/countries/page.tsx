"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Globe2,
  Building,
  FileText,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
} from "lucide-react";

export default function CountriesPage() {
  const { language, t } = useCrm();
  const { success, error: toastError } = useToast();

  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [search, setSearch] = useState("");

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    code: "",
    flagEmoji: "🌍",
    currencyCode: "EUR",
    responsibleStaff: "فريق القبول والتسجيل",
    visaRequirements: "",
    admissionRequirements: "",
    languageRequirements: "",
    checklistNotes: "",
  });

  const loadCountries = useCallback(async () => {
    try {
      const res = await fetch("/api/countries");
      if (res.ok) {
        const data = await res.json();
        const list = data.countries || [];
        setCountries(list);
        if (list.length > 0) {
          setSelectedCountry((prev: any) => {
            if (!prev) return list[0];
            const found = list.find((c: any) => c.id === prev.id);
            return found || list[0];
          });
        } else {
          setSelectedCountry(null);
        }
      }
    } catch (err) {
      console.error("Fetch countries error:", err);
      toastError("فشل تحميل قائمة الدول");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCountries();
  }, [loadCountries]);

  const handleOpenAdd = () => {
    setEditingCountry(null);
    setFormData({
      nameAr: "",
      nameEn: "",
      code: "",
      flagEmoji: "🌍",
      currencyCode: "EUR",
      responsibleStaff: "فريق القبول والتسجيل",
      visaRequirements: "جواز سفر ساري المفعول، كشف حساب بنكي، قبول جامعي رسمي.",
      admissionRequirements: "شهادة الثانوية العامة أو البكالوريوس مع كشف العلامات مصدقة ومترجمة.",
      languageRequirements: "شهادة IELTS 6.0 أو شهادة دورة لغة مكثفة.",
      checklistNotes: "التقديم متاح للفصول الدراسية القادمة.",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCountry(c);
    setFormData({
      nameAr: c.nameAr || "",
      nameEn: c.nameEn || "",
      code: c.code || "",
      flagEmoji: c.flagEmoji || "🌍",
      currencyCode: c.currencyCode || "EUR",
      responsibleStaff: c.responsibleStaff || "",
      visaRequirements: c.visaRequirements || "",
      admissionRequirements: c.admissionRequirements || "",
      languageRequirements: c.languageRequirements || "",
      checklistNotes: c.checklistNotes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr || !formData.nameEn || !formData.code) {
      toastError("يرجى ملء الحقول الإجبارية");
      return;
    }

    setSaving(true);
    try {
      const url = editingCountry ? `/api/countries/${editingCountry.id}` : "/api/countries";
      const method = editingCountry ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بيانات الدولة");

      success(editingCountry ? "تم تعديل بيانات الوجهة بنجاح" : "تم إضافة الدولة بنجاح");
      setIsModalOpen(false);
      loadCountries();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!countryToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/countries/${countryToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الدولة");
      success("تم حذف الدولة بنجاح");
      setIsDeleteModalOpen(false);
      setCountryToDelete(null);
      loadCountries();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCountries = countries.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nameAr?.toLowerCase().includes(q) ||
      c.nameEn?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">جاري تحميل دليل الوجهات الدراسية...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-6 h-6 text-indigo-600" />
            <span>{t("countries", "دليل الدول والوجهات الدراسية")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة متطلبات القبول والتأشيرات لجميع الدول، مع إمكانية الإضافة والتعديل والحذف
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دولة جديدة</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Country Selector */}
        <div className="space-y-3 lg:col-span-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رمز الدولة..."
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pe-1">
            {filteredCountries.map((c) => {
              const isSelected = selectedCountry?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCountry(c)}
                  className={`w-full text-start p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{c.flagEmoji}</span>
                    <div>
                      <span className="font-bold text-xs block">
                        {language === "ar" ? c.nameAr : c.nameEn}
                      </span>
                      <span className={`text-[11px] block ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                        {c.nameEn} • {c.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {c._count?.universities || 0} جامعة
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Country Dossier */}
        <div className="lg:col-span-2">
          {selectedCountry ? (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              {/* Header inside dossier */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedCountry.flagEmoji}</span>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{selectedCountry.nameAr}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
                        {selectedCountry.code}
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedCountry.nameEn} • العملة: {selectedCountry.currencyCode} • مسؤول الملف:{" "}
                      {selectedCountry.responsibleStaff || "فريق القبول"}
                    </p>
                  </div>
                </div>

                {/* Edit & Delete Buttons for Country */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(selectedCountry)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    onClick={() => {
                      setCountryToDelete(selectedCountry);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                    title="حذف الدولة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dossier Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span>متطلبات القبول الجامعي</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCountry.admissionRequirements || "لا توجد متطلبات مضافة حالياً"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>شروط وإجراءات التأشيرة</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCountry.visaRequirements || "لا توجد شروط تأشيرة مضافة حالياً"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>متطلبات اللغة</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCountry.languageRequirements || "غير محدد"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-purple-500" />
                    <span>ملاحظات إضافية والمواعيد</span>
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedCountry.checklistNotes || "لا توجد ملاحظات"}
                  </p>
                </div>
              </div>

              {/* Universities in this country */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3">
                  الجامعات الشريكة المسجلة في {selectedCountry.nameAr} (
                  {selectedCountry.universities?.length || 0})
                </h3>
                {selectedCountry.universities?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedCountry.universities.map((u: any) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{u.nameAr}</span>
                          <span className="text-[11px] text-slate-400 block">{u.nameEn} • {u.city}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                          {u.type === "university" ? "جامعة" : "معهد"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">لا توجد جامعات مرتبطة بعد بهذه الدولة</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <Globe2 className="w-10 h-10 mx-auto opacity-40 text-indigo-600 mb-2" />
              <p className="text-sm font-semibold">اختر دولة لعرض متطلباتها أو قم بإضافة دولة جديدة</p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Country Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-indigo-600" />
                <span>{editingCountry ? `تعديل الدولة: ${editingCountry.nameAr}` : "إضافة وجهة دراسية جديدة"}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الاسم بالعربية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: إسبانيا"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الاسم بالإنجليزية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Spain"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    رمز الدولة (كود) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="ES"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono uppercase"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    إيموجي العلم
                  </label>
                  <input
                    type="text"
                    value={formData.flagEmoji}
                    onChange={(e) => setFormData({ ...formData, flagEmoji: e.target.value })}
                    placeholder="🇪🇸"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-center text-base"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    العملة الرسمية
                  </label>
                  <input
                    type="text"
                    value={formData.currencyCode}
                    onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                    placeholder="EUR"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  مسؤول الملف / الفريق
                </label>
                <input
                  type="text"
                  value={formData.responsibleStaff}
                  onChange={(e) => setFormData({ ...formData, responsibleStaff: e.target.value })}
                  placeholder="مثال: مسؤول ملف أوروبا"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  متطلبات القبول الجامعي
                </label>
                <textarea
                  rows={2}
                  value={formData.admissionRequirements}
                  onChange={(e) => setFormData({ ...formData, admissionRequirements: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  شروط التأشيرة والسفارة
                </label>
                <textarea
                  rows={2}
                  value={formData.visaRequirements}
                  onChange={(e) => setFormData({ ...formData, visaRequirements: e.target.value })}
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
                  <span>{editingCountry ? "حفظ التعديلات" : "إضافة الدولة"}</span>
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
          setCountryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="تأكيد حذف الدولة"
        message={`هل أنت متأكد من حذف وجهة "${countryToDelete?.nameAr}"؟ سيتم أرشفة الدولة وتحديث بيانات الربط.`}
        confirmText="نعم، حذف الدولة"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
