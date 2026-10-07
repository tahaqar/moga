"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Trash2, RotateCcw, AlertTriangle, Loader2, CheckCircle2, Search, Filter } from "lucide-react";

export default function TrashPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Permanent Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; entity: string; label: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTrash = useCallback(async () => {
    try {
      const res = await fetch("/api/trash");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Fetch trash error:", err);
      toastError("فشل تحميل عناصر سلة المحذوفات");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadTrash();
  }, [loadTrash, refreshKey]);

  const handleRestore = async (id: string, entity: string) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, entity }),
      });
      if (res.ok) {
        success("تم استعادة السجل بنجاح وإعادته للنظام");
        setRefreshKey((k) => k + 1);
      } else {
        throw new Error("فشلت الاستعادة");
      }
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء استعادة السجل");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/trash?id=${deleteTarget.id}&entity=${deleteTarget.entity}`, {
        method: "DELETE",
      });
      if (res.ok) {
        success("تم الحذف النهائي للسجل");
        setIsDeleteModalOpen(false);
        setDeleteTarget(null);
        setRefreshKey((k) => k + 1);
      } else {
        throw new Error("فشل الحذف النهائي");
      }
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف النهائي");
    } finally {
      setIsDeleting(false);
    }
  };

  const entities = Array.from(new Set(items.map((i) => i.entity).filter(Boolean)));

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const labelMatch = (item.label || "").toLowerCase().includes(q);
    const entityMatch = (item.entity || "").toLowerCase().includes(q);
    const matchesSearch = !search || labelMatch || entityMatch;
    const matchesEntity = entityFilter === "all" || item.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-rose-600" />
          <span>{t("trash", "سلة المحذوفات (Trash & Recovery)")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          استعادة السجلات المحذوفة لجميع أقسام النظام أو حذفها نهائياً بصلاحية الإدارة
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setEntityFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              entityFilter === "all"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            جميع الأقسام ({items.length})
          </button>
          {entities.map((ent: any) => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                entityFilter === ent
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
              }`}
            >
              {ent}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في العناصر المحذوفة..."
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري فحص سلة المحذوفات...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">سلة المحذوفات فارغة</p>
            <p className="text-xs text-slate-400 mt-1">لا توجد سجلات محذوفة حالياً مطابقة للبحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">نوع السجل</th>
                  <th className="p-3.5 text-start font-semibold">تفاصيل العنصر</th>
                  <th className="p-3.5 text-start font-semibold">تاريخ الحذف</th>
                  <th className="p-3.5 text-end font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 font-mono">
                        {item.entity}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-md truncate">
                      {item.label}
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono">
                      {new Date(item.deletedAt).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-3.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRestore(item.id, item.entity)}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:hover:bg-emerald-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                          <span>استعادة</span>
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(item);
                            setIsDeleteModalOpen(true);
                          }}
                          disabled={actionLoading === item.id}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف نهائي</span>
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmPermanentDelete}
        title="حذف نهائي لا رجعة فيه"
        description={`هل أنت متأكد من الحذف النهائي لسجل "${deleteTarget?.label}"؟ لن تتمكن من استعادته مرة أخرى.`}
        confirmText="نعم، حذف نهائي"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
