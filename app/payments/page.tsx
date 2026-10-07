"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCrm } from "@/components/providers/crm-provider";
import { useToast } from "@/components/ui/toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  ExternalLink,
  Loader2,
  X,
  Save,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

export default function PaymentsPage() {
  const { t } = useCrm();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<"payments" | "contracts">("payments");
  const [data, setData] = useState<any>({
    payments: [],
    contracts: [],
    students: [],
    users: [],
    totalCollected: 0,
    totalRemaining: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    contractId: "",
    amount: "",
    currency: "USD",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    receiptNumber: "",
    notes: "",
    receiverId: "",
  });

  // Contract Modal State
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<any>(null);
  const [savingContract, setSavingContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    studentId: "",
    contractNumber: "",
    totalAmount: "",
    currency: "USD",
    paidAmount: "0",
    terms: "",
    status: "active",
    startDate: new Date().toISOString().slice(0, 10),
  });

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "payment" | "contract" } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/payments");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Fetch payments error:", err);
      toastError("فشل تحميل بيانات المدفوعات والعقود");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // Open Payment Modal
  const handleOpenAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm({
      studentId: data.students?.[0]?.id || "",
      contractId: "",
      amount: "",
      currency: "USD",
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "bank_transfer",
      receiptNumber: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: "",
      receiverId: data.users?.[0]?.id || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (p: any) => {
    setEditingPayment(p);
    setPaymentForm({
      studentId: p.studentId || p.student?.id || "",
      contractId: p.contractId || "",
      amount: String(p.amount || ""),
      currency: p.currency || "USD",
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      method: p.method || "bank_transfer",
      receiptNumber: p.receiptNumber || "",
      notes: p.notes || "",
      receiverId: p.receiverId || "",
    });
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId) {
      toastError("يرجى اختيار الطالب");
      return;
    }
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toastError("يرجى إدخال مبلغ صحيح");
      return;
    }

    setSavingPayment(true);
    try {
      const url = "/api/payments";
      const method = editingPayment ? "PUT" : "POST";
      const payload = editingPayment ? { ...paymentForm, id: editingPayment.id } : paymentForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ الدفعة");

      success(editingPayment ? "تم تعديل سند القبض بنجاح" : "تم إصدار سند القبض بنجاح");
      setIsPaymentModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ سند القبض");
    } finally {
      setSavingPayment(false);
    }
  };

  // Open Contract Modal
  const handleOpenAddContract = () => {
    setEditingContract(null);
    setContractForm({
      studentId: data.students?.[0]?.id || "",
      contractNumber: `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      totalAmount: "",
      currency: "USD",
      paidAmount: "0",
      terms: "دفعة أولى 50% عند التقديم، والمتبقي عند صدور القبول النهائي",
      status: "active",
      startDate: new Date().toISOString().slice(0, 10),
    });
    setIsContractModalOpen(true);
  };

  const handleOpenEditContract = (c: any) => {
    setEditingContract(c);
    setContractForm({
      studentId: c.studentId || c.student?.id || "",
      contractNumber: c.contractNumber || "",
      totalAmount: String(c.totalAmount || ""),
      currency: c.currency || "USD",
      paidAmount: String(c.paidAmount || "0"),
      terms: c.terms || "",
      status: c.status || "active",
      startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setIsContractModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractForm.studentId) {
      toastError("يرجى اختيار الطالب");
      return;
    }
    if (!contractForm.totalAmount || parseFloat(contractForm.totalAmount) <= 0) {
      toastError("يرجى إدخال إجمالي العقد");
      return;
    }

    setSavingContract(true);
    try {
      const url = "/api/payments/contracts";
      const method = editingContract ? "PUT" : "POST";
      const payload = editingContract ? { ...contractForm, id: editingContract.id } : contractForm;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل حفظ العقد");

      success(editingContract ? "تم تعديل العقد بنجاح" : "تم إبرام العقد المالي بنجاح");
      setIsContractModalOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء حفظ العقد");
    } finally {
      setSavingContract(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const url =
        deleteTarget.type === "payment"
          ? `/api/payments?id=${deleteTarget.id}`
          : `/api/payments/contracts?id=${deleteTarget.id}`;

      const res = await fetch(url, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "فشل الحذف");

      success(deleteTarget.type === "payment" ? "تم حذف سند القبض" : "تم حذف العقد");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      toastError(err.message || "حدث خطأ أثناء الحذف");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Lists
  const filteredPayments = (data.payments || []).filter((p: any) => {
    const q = search.toLowerCase();
    const stuName = (p.student?.fullNameAr || p.student?.fullNameEn || "").toLowerCase();
    const receipt = (p.receiptNumber || "").toLowerCase();
    return !search || stuName.includes(q) || receipt.includes(q);
  });

  const filteredContracts = (data.contracts || []).filter((c: any) => {
    const q = search.toLowerCase();
    const stuName = (c.student?.fullNameAr || c.student?.fullNameEn || "").toLowerCase();
    const cntNum = (c.contractNumber || "").toLowerCase();
    return !search || stuName.includes(q) || cntNum.includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <span>{t("payments", "المدفوعات وسندات القبض والعقود")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة المعاملات المالية، تسجيل سندات القبض، ومتابعة العقود والأقساط للطلاب
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "payments" ? (
            <button
              onClick={handleOpenAddPayment}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إصدار سند قبض جديد</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAddContract}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إبرام عقد مالي جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">إجمالي المحصل الفعلي</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              ${data.totalCollected?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">إجمالي المتبقي للتحصيل</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              ${data.totalRemaining?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950 text-rose-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-400">عدد العقود النشطة</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">
              {data.contracts?.length || 0} عقد
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "payments"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>سندات القبض والدفعات ({data.payments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("contracts")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "contracts"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>العقود والاتفاقيات ({data.contracts?.length || 0})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute inset-y-0 start-3 my-auto text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === "payments" ? "بحث برقم السند أو اسم الطالب..." : "بحث برقم العقد أو اسم الطالب..."}
            className="w-full ps-9 pe-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">جاري تحميل البيانات المالية...</p>
        </div>
      ) : activeTab === "payments" ? (
        /* Payments Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">رقم الإيصال</th>
                  <th className="p-3.5 text-start font-semibold">اسم الطالب</th>
                  <th className="p-3.5 text-start font-semibold">المبلغ المسدد</th>
                  <th className="p-3.5 text-start font-semibold">تاريخ الدفع</th>
                  <th className="p-3.5 text-start font-semibold">طريقة السداد</th>
                  <th className="p-3.5 text-start font-semibold">المستلم</th>
                  <th className="p-3.5 text-start font-semibold">ملاحظات</th>
                  <th className="p-3.5 text-end font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد سندات قبض مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{p.receiptNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <Link href={`/students/${p.student?.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                          {p.student?.fullNameAr || p.student?.fullNameEn}
                        </Link>
                      </td>
                      <td className="p-3.5 font-black text-emerald-600 text-sm">
                        ${p.amount?.toLocaleString()} {p.currency}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("ar-EG") : "-"}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                          {p.method === "cash"
                            ? "نقداً (كاش)"
                            : p.method === "bank_transfer"
                            ? "تحويل بنكي"
                            : p.method === "card"
                            ? "بطاقة دفع"
                            : p.method === "western_union"
                            ? "ويسترن يونيون"
                            : p.method}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{p.receiver?.name?.split("(")[0]?.trim() || "النظام"}</td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{p.notes || "-"}</td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditPayment(p)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل السند"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: p.id, name: p.receiptNumber, type: "payment" });
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="حذف السند"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Contracts Table */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="p-3.5 text-start font-semibold">رقم العقد</th>
                  <th className="p-3.5 text-start font-semibold">اسم الطالب</th>
                  <th className="p-3.5 text-start font-semibold">إجمالي العقد</th>
                  <th className="p-3.5 text-start font-semibold">المسدد</th>
                  <th className="p-3.5 text-start font-semibold">المتبقي</th>
                  <th className="p-3.5 text-start font-semibold">الحالة</th>
                  <th className="p-3.5 text-start font-semibold">تاريخ العقد</th>
                  <th className="p-3.5 text-start font-semibold">الشروط والأقساط</th>
                  <th className="p-3.5 text-end font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد عقود مسجلة حالياً
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">{c.contractNumber}</td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                        <Link href={`/students/${c.student?.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">
                          {c.student?.fullNameAr || c.student?.fullNameEn}
                        </Link>
                      </td>
                      <td className="p-3.5 font-black text-slate-900 dark:text-white text-sm">
                        ${c.totalAmount?.toLocaleString()} {c.currency}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-600">
                        ${c.paidAmount?.toLocaleString()} {c.currency}
                      </td>
                      <td className="p-3.5 font-bold text-rose-600">
                        ${c.remainingAmount?.toLocaleString()} {c.currency}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                            c.status === "completed"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : c.status === "cancelled"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400"
                          }`}
                        >
                          {c.status === "completed" ? "مكتمل السداد" : c.status === "cancelled" ? "ملغي" : "ساري / نشط"}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {c.startDate ? new Date(c.startDate).toLocaleDateString("ar-EG") : "-"}
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{c.terms || "-"}</td>
                      <td className="p-3.5 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditContract(c)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="تعديل العقد"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget({ id: c.id, name: c.contractNumber, type: "contract" });
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="حذف العقد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Add/Edit Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>{editingPayment ? "تعديل سند قبض" : "إصدار سند قبض جديد"}</span>
              </h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الطالب المستفيد *
                  </label>
                  <select
                    value={paymentForm.studentId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الطالب...</option>
                    {data.students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.fullNameAr} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="500.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العملة *
                  </label>
                  <select
                    value={paymentForm.currency}
                    onChange={(e) => setPaymentForm({ ...paymentForm, currency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD ($ - دولار)</option>
                    <option value="EUR">EUR (€ - يورو)</option>
                    <option value="TRY">TRY (₺ - ليرة تركية)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                    <option value="EGP">EGP (جنيه مصري)</option>
                    <option value="GBP">GBP (£ - جنيه إسترليني)</option>
                    <option value="SAR">SAR (ريال سعودي)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    طريقة السداد *
                  </label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="cash">نقداً (كاش)</option>
                    <option value="card">بطاقة دفع إلكتروني</option>
                    <option value="western_union">ويسترن يونيون</option>
                    <option value="check">شيك مصرفي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الدفع *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم السند / الإيصال
                  </label>
                  <input
                    type="text"
                    value={paymentForm.receiptNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiptNumber: e.target.value })}
                    placeholder="REC-2026-..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    المستلم / المسؤول
                  </label>
                  <select
                    value={paymentForm.receiverId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, receiverId: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الموظف المستلم...</option>
                    {data.users?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ملاحظات أو تفاصيل التحويل
                  </label>
                  <textarea
                    rows={2}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="مثال: رقم الحوالة البنكية، الدفعة الثانية من رسوم التأشيرة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingPayment}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingPayment ? "تحديث السند" : "حفظ وإصدار السند"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contract Add/Edit Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{editingContract ? "تعديل العقد المالي" : "إبرام عقد مالي جديد"}</span>
              </h3>
              <button
                onClick={() => setIsContractModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الطالب المتعاقد *
                  </label>
                  <select
                    value={contractForm.studentId}
                    onChange={(e) => setContractForm({ ...contractForm, studentId: e.target.value })}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر الطالب...</option>
                    {data.students?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.fullNameAr} ({s.studentCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رقم العقد *
                  </label>
                  <input
                    type="text"
                    required
                    value={contractForm.contractNumber}
                    onChange={(e) => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                    placeholder="CNT-2026-..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    العملة *
                  </label>
                  <select
                    value={contractForm.currency}
                    onChange={(e) => setContractForm({ ...contractForm, currency: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="USD">USD ($ - دولار)</option>
                    <option value="EUR">EUR (€ - يورو)</option>
                    <option value="TRY">TRY (₺ - ليرة تركية)</option>
                    <option value="AED">AED (درهم إماراتي)</option>
                    <option value="EGP">EGP (جنيه مصري)</option>
                    <option value="GBP">GBP (£ - جنيه إسترليني)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    إجمالي مبلغ العقد *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={contractForm.totalAmount}
                    onChange={(e) => setContractForm({ ...contractForm, totalAmount: e.target.value })}
                    placeholder="2500.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الدفعة المقدمة / المسددة
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={contractForm.paidAmount}
                    onChange={(e) => setContractForm({ ...contractForm, paidAmount: e.target.value })}
                    placeholder="500.00"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    حالة العقد *
                  </label>
                  <select
                    value={contractForm.status}
                    onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">ساري / نشط</option>
                    <option value="completed">مكتمل السداد</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ توقيع العقد *
                  </label>
                  <input
                    type="date"
                    required
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm({ ...contractForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شروط السداد والأقساط والاتفاقية
                  </label>
                  <textarea
                    rows={3}
                    value={contractForm.terms}
                    onChange={(e) => setContractForm({ ...contractForm, terms: e.target.value })}
                    placeholder="جدولة الدفعات والأقساط والشروط الجزائية..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsContractModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingContract}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 disabled:opacity-50 cursor-pointer"
                >
                  {savingContract ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{editingContract ? "تحديث العقد" : "حفظ وإبرام العقد"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "payment" ? "حذف سند القبض" : "حذف العقد المالي"}
        description={`هل أنت متأكد من حذف ${deleteTarget?.type === "payment" ? "سند القبض" : "العقد"} "${deleteTarget?.name}"؟ سيتم نقله إلى سلة المحذوفات.`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
