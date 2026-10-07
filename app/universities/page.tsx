"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  Building,
  Phone,
  Mail,
  Globe,
  Percent,
  Calendar,
  Loader2,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  CheckCircle,
} from "lucide-react";

export default function UniversitiesPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [universities, setUniversities] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("all");

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUni, setEditingUni] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [uniToDelete, setUniToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    nameAr: "",
    nameEn: "",
    countryId: "",
    city: "",
    type: "university",
    website: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    commissionType: "percentage",
    commissionValue: "15",
    commissionCurrency: "EUR",
    contractStatus: "active",
    notes: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [uRes, cRes] = await Promise.all([
        fetch("/api/universities"),
        fetch("/api/countries"),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        setUniversities(uData.universities || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCountries(cData.countries || []);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
      toastError("فشل تحميل قائمة الجامعات");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingUni(null);
    setFormData({
      nameAr: "",
      nameEn: "",
      countryId: countries[0]?.id || "",
      city: "",
      type: "university",
      website: "https://",
      contactPerson: "مكتب القبول والتسجيل الدولي",
      contactEmail: "admissions@university.edu",
      contactPhone: "+34 912 345 678",
      commissionType: "percentage",
      commissionValue: "15",
      commissionCurrency: "EUR",
      contractStatus: "active",
      notes: "اتفاقية تمثيل معتمدة ومجددة",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (uni: any) => {
    setEditingUni(uni);
    setFormData({
      nameAr: uni.nameAr || "",
      nameEn: uni.nameEn || "",
      countryId: uni.countryId || "",
      city: uni.city || "",
      type: uni.type || "university",
      website: uni.website || "",
      contactPerson: uni.contactPerson || "",
      contactEmail: uni.contactEmail || "",
      contactPhone: uni.contactPhone || "",
      commissionType: uni.commissionType || "percentage",
      commissionValue: String(uni.commissionValue || 15),
      commissionCurrency: uni.commissionCurrency || "EUR",
      contractStatus: uni.contractStatus || "active",
      notes: uni.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nameAr || !formData.countryId || !formData.city) {
      toastError("يرجى ملء الحقول الإجبارية");
      return;
    }

    setSaving(true);
    try {
      const url = editingUni ? `/api/universities/${editingUni.id}` : "/api/universities";
      const method = editingUni ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل حفظ بيانات الجامعة");

      success(editingUni ? "تم تحديث بيانات الجامعة بنجاح" : "تمت إضافة الجامعة بنجاح");
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!uniToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/universities/${uniToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل حذف الجامعة");
      success("تم حذف الجامعة بنجاح");
      setIsDeleteModalOpen(false);
      setUniToDelete(null);
      loadData();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredUnis = universities.filter((u) => {
    const matchesCountry = selectedCountryId === "all" || u.countryId === selectedCountryId;
    if (!matchesCountry) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.nameAr?.toLowerCase().includes(q) ||
      u.nameEn?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-6 h-6 text-indigo-600" />
            <span>{t("universities", "الجامعات والمعاهد الشريكة")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة عقود الشراكة المباشرة، نسب العمولات، ومسؤولو القبول مع التعديل والحذف الكامل
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة جامعة أو معهد</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الجامعة، المدينة، أو الكود..."
              className="w-full ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCountryId}
            onChange={(e) => setSelectedCountryId(e.target.value)}
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
          إجمالي الجامعات: {filteredUnis.length}
        </span>
      </div>

      {/* Grid of Universities */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">جاري تحميل الجامعات...</p>
        </div>
      ) : filteredUnis.length === 0 ? (
        <div className="p-16 text-center text-slate-400 space-y-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Building className="w-10 h-10 mx-auto opacity-40 text-indigo-600" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على جامعات مطابقة</p>
          <p className="text-xs">جرّب تغيير البحث أو إضافة جامعة جديدة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUnis.map((uni) => (
            <div
              key={uni.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-indigo-400 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {uni.country?.flagEmoji} {uni.nameAr}
                    </span>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {uni.nameEn} • {uni.city}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        uni.contractStatus === "active"
                          ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {uni.contractStatus === "active" ? "عقد ساري" : uni.contractStatus}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs py-2.5 border-y border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">نسبة عمولة أمالون:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {uni.commissionValue}% ({uni.commissionType === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">مسؤول التواصل:</span>
                    <span className="font-semibold">{uni.contactPerson || "مكتب القبول"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الطلبات المرتبطة:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {uni._count?.applications || 0} طلب
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between text-xs pt-2">
                <div className="flex items-center gap-2">
                  {uni.contactPhone && (
                    <a
                      href={`https://wa.me/${uni.contactPhone?.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-100 transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>واتساب</span>
                    </a>
                  )}
                  {uni.website && (
                    <a
                      href={uni.website}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="زيارة الموقع الإلكتروني"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(uni)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
                    title="تعديل بيانات الجامعة"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setUniToDelete(uni);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                    title="حذف الجامعة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit University Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <span>{editingUni ? `تعديل: ${editingUni.nameAr}` : "إضافة جامعة أو معهد شريك"}</span>
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
                    اسم الجامعة بالعربية <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    placeholder="مثال: جامعة مدريد المستقلة"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    اسم الجامعة بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="Autonomous University of Madrid"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    الدولة <span className="text-rose-500">*</span>
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
                    المدينة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="مدريد"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نوع المؤسسة
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="university">جامعة (University)</option>
                    <option value="institute">معهد لغة (Language School)</option>
                    <option value="college">كلية خاصة (College)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نسبة أو قيمة العمولة
                  </label>
                  <input
                    type="number"
                    value={formData.commissionValue}
                    onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                    placeholder="15"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    نوع العمولة
                  </label>
                  <select
                    value={formData.commissionType}
                    onChange={(e) => setFormData({ ...formData, commissionType: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ مقطوع (Fixed)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    حالة العقد
                  </label>
                  <select
                    value={formData.contractStatus}
                    onChange={(e) => setFormData({ ...formData, contractStatus: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="active">ساري (Active)</option>
                    <option value="expiring_soon">ينتهي قريباً (Expiring)</option>
                    <option value="expired">منتهي (Expired)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    مسؤول التواصل بالجامعة
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="اسم المنسق الدولي"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    رقم الهاتف / واتساب
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+34 ..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  الموقع الإلكتروني
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.uam.es"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ملاحظات الاتفاقية
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="شروط تحصيل العمولة أو تعليمات خاصة..."
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
                  <span>{editingUni ? "حفظ التعديلات" : "إضافة الجامعة"}</span>
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
          setUniToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="تأكيد حذف الجامعة"
        message={`هل أنت متأكد من حذف جامعة "${uniToDelete?.nameAr}"؟ سيتم أرشفة السجل وتحديث البيانات.`}
        confirmText="نعم، حذف الجامعة"
        cancelText="إلغاء"
        isDestructive={true}
      />
    </div>
  );
}
