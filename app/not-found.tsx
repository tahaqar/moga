"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Home } from "lucide-react";
import { useCrm } from "@/components/providers/crm-provider";

export default function NotFound() {
  const { language, direction } = useCrm();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 shadow-sm">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs mb-3">
        404
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        {language === "ar" ? "الصفحة المطلوبة غير موجودة" : "Page Not Found"}
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {language === "ar"
          ? "عذراً، الرابط الذي تحاول الوصول إليه غير متوفر أو تم نقله. يمكنك العودة إلى لوحة التحكم الرئيسية ومتابعة العمل."
          : "The page you are looking for might have been removed or is temporarily unavailable."}
      </p>

      <Link
        href="/"
        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
      >
        <Home className="w-4 h-4" />
        <span>{language === "ar" ? "العودة إلى لوحة التحكم" : "Back to Dashboard"}</span>
        {direction === "rtl" ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
      </Link>
    </div>
  );
}
