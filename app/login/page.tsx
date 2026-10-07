"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p className="text-sm font-semibold animate-pulse">جاري تحويلك مباشرة إلى لوحة تحكم أمالون...</p>
    </div>
  );
}
