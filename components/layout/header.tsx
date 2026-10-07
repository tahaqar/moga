"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCrm } from "@/components/providers/crm-provider";
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Building2,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Shield,
  CheckCheck,
  Check,
  RotateCcw,
  Clock,
  GraduationCap,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuToggle: () => void;
  user: {
    name: string;
    email: string;
    role: { displayName: string; name: string };
    branch?: { id: string; name: string; code: string } | null;
  } | null;
}

interface NotificationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function Header({ onMenuToggle, user }: HeaderProps) {
  const {
    language,
    toggleLanguage,
    theme,
    toggleTheme,
    selectedBranchId,
    setSelectedBranchId,
    t,
  } = useCrm();

  const router = useRouter();

  const [branches, setBranches] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const [branchRes, notifRes] = await Promise.all([
          fetch("/api/branches"),
          fetch("/api/notifications"),
        ]);

        if (branchRes.ok && !ignore) {
          const bData = await branchRes.json();
          setBranches(bData.branches || []);
        }

        if (notifRes.ok && !ignore) {
          const nData = await notifRes.json();
          setNotifications(nData.notifications || []);
          setUnreadCount(nData.unreadCount || 0);
        }
      } catch (err) {
        console.error("Header data load error:", err);
      }
    }

    fetchData();

    // Listen for custom branch updates
    const handleBranchesUpdated = () => {
      fetch("/api/branches")
        .then((res) => res.json())
        .then((data) => {
          if (!ignore) {
            setBranches(data.branches || []);
          }
        })
        .catch(console.error);
    };

    window.addEventListener("amalon:branches-updated", handleBranchesUpdated);
    return () => {
      ignore = true;
      window.removeEventListener("amalon:branches-updated", handleBranchesUpdated);
    };
  }, []);

  // Close desktop dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notif: NotificationItem) => {
    // Optimistic update: mark as read immediately and decrement unread counter
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id, isRead: true }),
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === "number") {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch (err) {
        console.error("Mark notification read error:", err);
      }
    }

    setShowNotifications(false);

    if (notif.linkUrl) {
      router.push(notif.linkUrl);
    }
  };

  const markAllRead = async () => {
    // Optimistically mark all as read and clear unread badge to 0 immediately
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications/read-all", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      }
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-3">
      {/* Start side (Right in RTL): Hamburger + Brand + Desktop Branch Selector */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0 cursor-pointer"
          aria-label="القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Compact Brand display on mobile */}
        <Link href="/" prefetch={true} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <GraduationCap className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white hidden xs:inline-block">
            AMALON
          </span>
        </Link>

        {/* Desktop Branch Selector (Hidden on mobile to prevent overcrowding) */}
        <div className="hidden md:flex relative min-w-0 max-w-[200px] lg:max-w-[240px]">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="w-full appearance-none bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl ps-7 pe-6 py-2 truncate focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">🏢 {t("all_branches", "جميع الفروع")}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                📍 {b.name.split("(")[0].trim()}
              </option>
            ))}
          </select>
          <Building2 className="w-3.5 h-3.5 absolute inset-y-0 start-2 my-auto text-slate-500 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 absolute inset-y-0 end-1.5 my-auto text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* End side (Left in RTL): Clean Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Desktop Language Toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="hidden sm:flex px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 items-center gap-1 transition shrink-0 cursor-pointer"
          title={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
        >
          <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px]">
            {language === "ar" ? "EN" : "عربي"}
          </span>
        </button>

        {/* Desktop Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="hidden sm:flex p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shrink-0 cursor-pointer"
          title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          )}
        </button>

        {/* Notifications Button */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className={`p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 relative transition cursor-pointer ${
              showNotifications
                ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600"
                : ""
            }`}
            title="التنبيهات والإشعارات"
            aria-label="التنبيهات والإشعارات"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -end-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Desktop Notifications Dropdown */}
          {showNotifications && (
            <div className="hidden sm:block absolute end-0 mt-2 w-80 lg:w-92 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>{t("notifications", "التنبيهات والإشعارات")}</span>
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
              </div>

              <div className="max-h-88 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    لا توجد تنبيهات في الوقت الحالي
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs transition cursor-pointer relative ${
                        !n.isRead
                          ? "bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold flex-1 ${!n.isRead ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                          {language === "ar" ? n.titleAr : n.titleEn}
                        </p>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        {language === "ar" ? n.messageAr : n.messageEn}
                      </p>
                      {n.linkUrl && (
                        <div className="mt-1.5 flex justify-end">
                          <Link
                            href={n.linkUrl}
                            prefetch={true}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(n);
                              setShowNotifications(false);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                          >
                            <span>عرض التفاصيل</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Menu */}
        {user && (
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 ps-1 sm:ps-2 sm:border-s sm:border-slate-200 dark:sm:border-slate-800 shrink-0 hover:opacity-85 transition cursor-pointer text-start"
              title="الملف الشخصي"
              aria-label="قائمة الحساب"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {user.name.charAt(0)}
              </div>
              <div className="hidden md:block text-start leading-tight">
                <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                  {user.name.split(" ")[0]}
                </span>
                <span className="block text-[10px] text-indigo-600 dark:text-indigo-400 font-medium truncate">
                  {user.role?.displayName?.split("(")[0]?.trim() || "مدير النظام"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
            </button>

            {showUserMenu && (
              <div className="absolute end-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50">
                <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                    <Shield className="w-3 h-3" />
                    <span>{user.role?.displayName || "مدير"}</span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/employees"
                    prefetch={true}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>الموظفون والفروع</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-start cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile-Only Centered Modal Notifications Dialog (Never overflows screen!) */}
      {showNotifications && (
        <div className="sm:hidden fixed inset-0 z-50 flex items-start justify-center p-4 pt-18">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {t("notifications", "التنبيهات والإشعارات")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                  <Bell className="w-6 h-6 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">لا توجد تنبيهات جديدة</p>
                  <p className="text-[11px]">سيتم إشعارك هنا عند وجود تحديثات أو مواعيد</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 text-xs rounded-xl transition cursor-pointer relative my-1 ${
                      !n.isRead
                        ? "bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold flex-1 ${!n.isRead ? "text-slate-900 dark:text-white font-bold" : "text-slate-600 dark:text-slate-400"}`}>
                        {language === "ar" ? n.titleAr : n.titleEn}
                      </p>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                      {language === "ar" ? n.messageAr : n.messageEn}
                    </p>
                    {n.linkUrl && (
                      <div className="mt-2 flex justify-end">
                        <Link
                          href={n.linkUrl}
                          prefetch={true}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(n);
                            setShowNotifications(false);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                        >
                          <span>عرض التفاصيل</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
