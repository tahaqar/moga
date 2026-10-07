import type { Metadata } from "next";
import "./globals.css";
import { CrmProvider } from "@/components/providers/crm-provider";
import { ToastProvider } from "@/components/ui/toast";
import { CrmShell } from "@/components/layout/crm-shell";

export const metadata: Metadata = {
  title: "Amalon Education CRM | Study-Abroad Consultancy & Admissions",
  description:
    "Comprehensive Study-Abroad Consultancy & University Admissions CRM for Amalon International Education",
  openGraph: {
    title: "Amalon Education CRM",
    description: "Comprehensive Study-Abroad Consultancy & University Admissions CRM for Amalon International Education",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amalon Education CRM",
    description: "Comprehensive Study-Abroad Consultancy & University Admissions CRM for Amalon International Education",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <CrmProvider>
          <ToastProvider>
            <CrmShell>{children}</CrmShell>
          </ToastProvider>
        </CrmProvider>
      </body>
    </html>
  );
}
