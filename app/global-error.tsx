"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-6 rounded-2xl shadow-xl text-center">
          <h2 className="text-xl font-bold mb-2">حدث خطأ غير متوقع في النظام</h2>
          <p className="text-sm text-slate-400 mb-6">
            تعذر تحميل التطبيق. يرجى إعادة المحاولة أو تحديث الصفحة.
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-semibold transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
