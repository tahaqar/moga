"use client";

import React, { useState, useEffect } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import { BarChart3, Download, TrendingUp, Users, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const { t } = useCrm();
  const [data, setData] = useState<any>({ countryData: [], studentsByStatus: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Fetch reports error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.countryData || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الدول");
    XLSX.writeFile(wb, `amalon_reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>{t("reports", "التقارير والإحصائيات التحليلية")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            تحليل أداء الفروع، نسب القبول والتأشيرات، والتقارير المالية المجمعة
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>تصدير التقرير الكامل</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">إجمالي الطلبات حسب الوجهات</h2>
          <div className="space-y-3">
            {data.countryData?.map((c: any) => (
              <div key={c.nameAr} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.nameAr}</span>
                <span className="font-bold text-indigo-600">{c.count} طلب</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white">توزيع حالات الطلاب في المنظومة</h2>
          <div className="space-y-3">
            {data.studentsByStatus?.map((s: any) => (
              <div key={s.status} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{s.status}</span>
                <span className="font-bold text-emerald-600">{s._count?.id || s.count} طالب</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
