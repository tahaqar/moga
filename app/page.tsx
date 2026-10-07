"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import {
  Users,
  UserPlus,
  FileCheck2,
  CheckCircle2,
  Clock,
  Stamp,
  Plane,
  DollarSign,
  TrendingUp,
  Percent,
  Building,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  PhoneCall,
  Loader2,
  ExternalLink,
  PlusCircle,
} from "lucide-react";

interface DashboardData {
  counters: {
    totalStudents: number;
    newStudents: number;
    inProgressApps: number;
    acceptedApps: number;
    visaFiles: number;
    visasIssued: number;
    travelledStudents: number;
    totalCollected: number;
    totalRemaining: number;
    universitiesCount: number;
    employeesCount: number;
    branchesCount: number;
    unreceivedCommissions: number;
  };
  countryStats: Array<{
    countryId: string;
    nameAr: string;
    nameEn: string;
    flagEmoji: string;
    count: number;
  }>;
  levelStats: Array<{
    level: string;
    count: number;
  }>;
  todayTasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate?: string | null;
    student?: { id: string; fullNameAr: string; studentCode: string } | null;
    assignee?: { id: string; name: string } | null;
  }>;
  upcomingVisas: Array<{
    id: string;
    caseNumber: string;
    appointmentDate: string;
    embassyLocation?: string | null;
    student: { id: string; fullNameAr: string; studentCode: string; phone: string };
    country: { nameAr: string; flagEmoji: string };
  }>;
}

export default function DashboardPage() {
  const { language, direction, selectedBranchId, t } = useCrm();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/dashboard?branchId=${selectedBranchId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [selectedBranchId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-semibold">جاري تحميل إحصائيات لوحة التحكم...</p>
      </div>
    );
  }

  const counters = data?.counters || {
    totalStudents: 0,
    newStudents: 0,
    inProgressApps: 0,
    acceptedApps: 0,
    visaFiles: 0,
    visasIssued: 0,
    travelledStudents: 0,
    totalCollected: 0,
    totalRemaining: 0,
    universitiesCount: 0,
    employeesCount: 0,
    branchesCount: 0,
    unreceivedCommissions: 0,
  };

  const levelNameMap: Record<string, string> = {
    bachelor: "بكالوريوس (Bachelor)",
    master: "ماجستير (Master)",
    phd: "دكتوراه (PhD)",
    language: "لغة (Language)",
    foundation: "سنة تحضيرية (Foundation)",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 12 Key Clickable CRM Metric Cards */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-3.5">
          {/* Card 1: Total Students */}
          <Link
            href="/students"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                إجمالي الطلاب
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:scale-110 transition shrink-0">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.totalStudents}
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 truncate">
              السجل الكامل ←
            </p>
          </Link>

          {/* Card 2: New Students */}
          <Link
            href="/students?status=new"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                طلاب جدد
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 group-hover:scale-110 transition shrink-0">
                <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.newStudents}
            </div>
            <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              متابعة أولى ←
            </p>
          </Link>

          {/* Card 3: In Progress Apps */}
          <Link
            href="/applications?status=in_progress"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                قيد المعالجة
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 group-hover:scale-110 transition shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.inProgressApps}
            </div>
            <p className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">
              مراجعة الجامعات ←
            </p>
          </Link>

          {/* Card 4: Accepted Apps */}
          <Link
            href="/applications?status=accepted"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                قبولات صادرة
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 group-hover:scale-110 transition shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400 leading-normal">
              {counters.acceptedApps}
            </div>
            <p className="text-[10px] sm:text-[11px] text-teal-600 mt-0.5 truncate">
              مشروط ونهائي ←
            </p>
          </Link>

          {/* Card 5: Visa Files */}
          <Link
            href="/visa"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                ملفات التأشيرة
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 group-hover:scale-110 transition shrink-0">
                <Stamp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.visaFiles}
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              مواعيد السفارات ←
            </p>
          </Link>

          {/* Card 6: Visas Issued */}
          <Link
            href="/visa?result=approved"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                تأشيرات صادرة
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-green-50 dark:bg-green-950/40 text-green-600 group-hover:scale-110 transition shrink-0">
                <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-green-600 dark:text-green-400 leading-normal">
              {counters.visasIssued}
            </div>
            <p className="text-[10px] sm:text-[11px] text-green-600 mt-0.5 truncate">
              جاهزون للسفر ←
            </p>
          </Link>

          {/* Card 7: Total Collected */}
          <Link
            href="/payments"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                إجمالي المحصل
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:scale-110 transition shrink-0">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              ${counters.totalCollected.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              إيصالات رسمية ←
            </p>
          </Link>

          {/* Card 8: Total Remaining */}
          <Link
            href="/payments?status=unpaid"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                مستحقات متبقية
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 group-hover:scale-110 transition shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 leading-normal">
              ${counters.totalRemaining.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-rose-600 mt-0.5 truncate">
              أقساط وعقود ←
            </p>
          </Link>

          {/* Card 9: Unreceived Commissions */}
          <Link
            href="/commissions"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                عمولات معلقة
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 group-hover:scale-110 transition shrink-0">
                <Percent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-purple-600 dark:text-purple-400 leading-normal">
              ${counters.unreceivedCommissions.toLocaleString()}
            </div>
            <p className="text-[10px] sm:text-[11px] text-purple-600 mt-0.5 truncate">
              مستحقة من الجامعات ←
            </p>
          </Link>

          {/* Card 10: Universities */}
          <Link
            href="/universities"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                الجامعات والشركاء
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 group-hover:scale-110 transition shrink-0">
                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.universitiesCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-cyan-600 mt-0.5 truncate">
              عقود شراكة فعالة ←
            </p>
          </Link>

          {/* Card 11: Employees */}
          <Link
            href="/employees"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                فريق العمل
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.employeesCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
              المستشارون والإداريون ←
            </p>
          </Link>

          {/* Card 12: Branches */}
          <Link
            href="/employees"
            prefetch={false}
            className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                الفروع
              </span>
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 group-hover:scale-110 transition shrink-0">
                <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-normal">
              {counters.branchesCount}
            </div>
            <p className="text-[10px] sm:text-[11px] text-blue-600 mt-0.5 truncate">
              إدارة الفروع ←
            </p>
          </Link>
        </div>
      </div>

      {/* Main Grid: Charts & Operational Queues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Country & Level Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Countries distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  توزيع طلبات الطلاب حسب الدول والوجهات
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  نسب الإقبال على الوجهات الـ 11 المعتمدة لشركة أمالون
                </p>
              </div>
              <Link
                href="/countries"
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <span>دليل الدول</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3.5">
              {data?.countryStats && data.countryStats.length > 0 ? (
                data.countryStats.map((item) => {
                  const total = counters.totalStudents || 1;
                  const percent = Math.min(100, Math.round((item.count / total) * 100));
                  return (
                    <div key={item.countryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{item.flagEmoji}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {language === "ar" ? item.nameAr : item.nameEn}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-slate-900 dark:text-white">{item.count} طلب</span>
                          <span>({percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, percent)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد طلبات مسجلة حتى الآن
                </div>
              )}
            </div>
          </div>

          {/* Academic Level distribution */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-4">
              الطلاب حسب المرحلة الدراسية المطلوبة
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {["bachelor", "master", "phd", "language", "foundation"].map((lvl) => {
                const found = data?.levelStats.find((l) => l.level === lvl);
                const count = found?.count || 0;
                return (
                  <div
                    key={lvl}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center"
                  >
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {levelNameMap[lvl]}
                    </p>
                    <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                      {count}
                    </p>
                    <span className="text-[10px] text-slate-400">طالب مسجل</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Operational Task Queue & Upcoming Embassy Dates */}
        <div className="space-y-6">
          {/* Upcoming Embassy Appointments */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <span>مواعيد السفارة القادمة</span>
              </h3>
              <Link href="/visa" className="text-xs text-amber-600 font-semibold hover:underline">
                عرض الكل
              </Link>
            </div>

            <div className="space-y-3">
              {data?.upcomingVisas && data.upcomingVisas.length > 0 ? (
                data.upcomingVisas.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {v.country?.flagEmoji} {v.student.fullNameAr}
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {v.appointmentDate ? new Date(v.appointmentDate).toLocaleDateString("ar-EG") : "قريباً"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {v.embassyLocation || "مقر السفارة"} • ملف {v.caseNumber}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-amber-200/40 dark:border-amber-900/20 flex items-center justify-between">
                      <a
                        href={`https://wa.me/${v.student.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>تذكير واتساب</span>
                      </a>
                      <Link
                        href={`/students/${v.student.id}?tab=visa`}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        ملف الطالب ←
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  لا توجد مواعيد سفارة معلقة لهذا الأسبوع
                </div>
              )}
            </div>
          </div>

          {/* Today's Tasks */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>مهام المتابعة والعمليات</span>
              </h3>
              <Link href="/tasks" className="text-xs text-blue-600 font-semibold hover:underline">
                إدارة المهام
              </Link>
            </div>

            <div className="space-y-3">
              {data?.todayTasks && data.todayTasks.length > 0 ? (
                data.todayTasks.map((t) => {
                  const isUrgent = t.priority === "urgent" || t.priority === "high";
                  return (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {t.title}
                        </p>
                        {isUrgent && (
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-[10px] font-bold">
                            عاجل
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 text-[11px] text-slate-500">
                        <span>{t.student ? `طالب: ${t.student.fullNameAr}` : "مهمة عامة"}</span>
                        <span>{t.assignee ? t.assignee.name.split(" ")[0] : "فريق العمل"}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  جميع المهام مكتملة بنجاح!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
