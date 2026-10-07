"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import {
  KanbanSquare,
  Building,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function KanbanPage() {
  const { direction, t } = useCrm();
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function fetchKanban() {
      try {
        const res = await fetch("/api/kanban");
        if (res.ok && isMounted) {
          const data = await res.json();
          setStages(data.stages || []);
        }
      } catch (err) {
        console.error("Fetch kanban error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchKanban();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const moveApplication = async (applicationId: string, newStageId: string) => {
    setMovingId(applicationId);
    try {
      const res = await fetch("/api/kanban", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, newStageId }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      console.error("Move application error:", err);
    } finally {
      setMovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs">جاري تحميل لوحة كانبان (14 مرحلة)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <KanbanSquare className="w-6 h-6 text-indigo-600" />
          <span>{t("kanban", "لوحة كانبان للقبولات والتأشيرات")}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          متابعة مسار رحلة الطالب عبر 14 مرحلة متسلسلة من الطلب الجديد حتى وصول الطالب
        </p>
      </div>

      {/* 14 Kanban Columns Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex items-start gap-3.5 min-w-full">
          {stages.map((stage, index) => {
            const prevStage = stages[index - 1];
            const nextStage = stages[index + 1];
            const count = stage.applications?.length || 0;

            return (
              <div
                key={stage.id}
                className="w-72 shrink-0 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 space-y-3 flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color || "#6366f1" }}
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[170px]">
                      {stage.nameAr}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-black text-slate-700 dark:text-slate-300">
                    {count}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {stage.applications?.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-400">
                      فارغ حالياً
                    </div>
                  ) : (
                    stage.applications?.map((app: any) => {
                      const daysInStage = Math.floor(
                        (Date.now() - new Date(app.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
                      );
                      const isOverdue = daysInStage > 7;

                      return (
                        <div
                          key={app.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2 text-xs hover:border-indigo-500 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {app.student?.fullNameAr}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                              {app.student?.studentCode}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            <p className="truncate font-medium text-slate-700 dark:text-slate-300">
                              {app.country?.flagEmoji} {app.university?.nameAr}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
                            <span
                              className={`flex items-center gap-1 font-semibold ${
                                isOverdue ? "text-rose-600 font-bold" : "text-slate-400"
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>{daysInStage} يوم بالمرحلة</span>
                            </span>

                            <Link
                              href={`/students/${app.student?.id}`}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 font-bold"
                            >
                              <span>الملف</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>

                          {/* Quick Stage Mover Controls */}
                          <div className="flex items-center justify-between pt-1 gap-1">
                            {prevStage ? (
                              <button
                                onClick={() => moveApplication(app.id, prevStage.id)}
                                disabled={movingId === app.id}
                                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-[10px] text-slate-600 dark:text-slate-300 flex items-center gap-0.5 transition"
                                title={`رجوع إلى: ${prevStage.nameAr}`}
                              >
                                {direction === "rtl" ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                                <span>السابق</span>
                              </button>
                            ) : <div />}

                            {nextStage ? (
                              <button
                                onClick={() => moveApplication(app.id, nextStage.id)}
                                disabled={movingId === app.id}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 text-[10px] font-bold flex items-center gap-0.5 transition ms-auto"
                                title={`تقديم إلى: ${nextStage.nameAr}`}
                              >
                                <span>التالي</span>
                                {direction === "rtl" ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
