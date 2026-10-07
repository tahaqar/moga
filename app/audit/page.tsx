"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { History, Shield, Clock, Loader2, Trash2, Search, Filter, AlertTriangle } from "lucide-react";

export default function AuditPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id?: string; isAll?: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAudit = useCallback(async () => {
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Fetch audit error:", err);
      toastError("فشل تحميل سجل التدقيق");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadAudit();
  }, [loadAudit, refreshKey]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const url = deleteTarget.isAll ? "/api/audit?clearAll=true" : `/api/audit?id=${deleteTarget.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("فشل الحذف");

      success(deleteTarget.isAll ? "تم مسح جميع السجلات" : "تم حذف السجل");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  const entities = Array.from(new Set(logs.map((l) => l.entity).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    const q = search.toLowerCase();
    const userMatch = (log.userName || "").toLowerCase().includes(q);
    const actionMatch = (log.action || "").toLowerCase().includes(q);
    const entityMatch = (log.entity || "").toLowerCase().includes(q);
    const detailsMatch = (log.details || "").toLowerCase().includes(q);
    const matchesSearch = !search || userMatch || actionMatch || entityMatch || detailsMatch;
    const matchesEntity = entityFilter === "all" || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>{t("audit_logs", "سجل العمليات والتدقيق (Audit Trail)")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            توثيق كامل لكافة عمليات النظام (الإنشاء، التعديل، الحذف، وتغيير الحالات) مع إمكانية الإدارة
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => {
              setDeleteTarget({ isAll: true });
              setIsDeleteModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950 dark:hover:bg-rose-900 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>مسح جميع السجلات القديمة</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setEntityFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              entityFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
            }`}
          >
            جميع الكيانات
          </button>
          {entities.map((ent: any) => (
            <button
              key={ent}
              onClick={() => setEntityFilter(ent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                entityFilter === ent
                  ? "bg-indigo-600 text-white shadow-xs"
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
            placeholder="بحث في المستخدمين والتفاصيل..."
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-xs">جاري تحميل سجل التدقيق...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">المستخدم</th>
                  <th className="p-3.5 text-start font-semibold">نوع العملية</th>
                  <th className="p-3.5 text-start font-semibold">الكيان (Entity)</th>
                  <th className="p-3.5 text-start font-semibold">التفاصيل والتغييرات</th>
                  <th className="p-3.5 text-start font-semibold">التاريخ والوقت</th>
                  <th className="p-3.5 text-end font-semibold">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      لا توجد سجلات مطابقة للبحث
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">{log.userName || "النظام"}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            log.action === "create"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                              : log.action === "update"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                              : log.action === "delete"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                        {log.entity}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300 max-w-md truncate">
                        {log.details || "-"}
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono">
                        {new Date(log.createdAt).toLocaleString("ar-EG")}
                      </td>
                      <td className="p-3.5 text-end">
                        <button
                          onClick={() => {
                            setDeleteTarget({ id: log.id });
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="حذف هذا السجل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.isAll ? "مسح جميع سجلات العمليات" : "حذف السجل"}
        description={
          deleteTarget?.isAll
            ? "هل أنت متأكد من مسح جميع سجلات التدقيق في النظام نهائياً؟"
            : "هل أنت متأكد من حذف هذا السجل نهائياً؟"
        }
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
