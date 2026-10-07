"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useCrm } from "@/components/providers/crm-provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useCrm();

  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold text-xs mb-3">
        System Alert
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
        {language === "ar" ? "حدث خطأ غير متوقع" : "Something Went Wrong"}
      </h1>

      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {language === "ar"
          ? "واجه النظام استثناء مؤقتاً أثناء معالجة الطلب. يمكنك إعادة المحاولة أو العودة إلى لوحة التحكم."
          : "An error occurred while loading this section. Please try again or return to dashboard."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{language === "ar" ? "إعادة المحاولة" : "Try Again"}</span>
        </button>

        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition"
        >
          <Home className="w-4 h-4" />
          <span>{language === "ar" ? "لوحة التحكم" : "Dashboard"}</span>
        </Link>
      </div>
    </div>
  );
}
