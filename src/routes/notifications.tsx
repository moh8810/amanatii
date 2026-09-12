import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  ArrowRight,
  Package,
  ShieldCheck,
  Info,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

type Notification = {
  id: string;
  title: string | null;
  message: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

function NotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [markingId, setMarkingId] =
    useState<string | null>(null);

  /*
   * =====================================================
   * تحميل الإشعارات
   * =====================================================
   *
   * عند فتح الصفحة:
   *
   * 1. نجلب إشعارات المستخدم.
   * 2. نعرضها.
   * 3. نحدد جميع الإشعارات غير المقروءة
   *    كمقروءة تلقائيًا.
   */
  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "يجب تسجيل الدخول أولاً.",
        );

        setNotifications([]);

        return;
      }

      /*
       * جلب جميع إشعارات المستخدم
       */
      const {
        data,
        error: notificationsError,
      } = await supabase
        .from("notifications")
        .select(
          "id,title,message,is_read,created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (notificationsError) {
        throw notificationsError;
      }

      const loadedNotifications =
        (data ?? []) as Notification[];

      /*
       * عرض الإشعارات
       */
      setNotifications(
        loadedNotifications,
      );

      /*
       * =================================================
       * تحديد جميع الإشعارات غير المقروءة كمقروءة
       * تلقائيًا
       * =================================================
       */
      const hasUnread =
        loadedNotifications.some(
          (notification) =>
            !notification.is_read,
        );

      if (hasUnread) {
        const {
          error: updateError,
        } = await supabase
          .from("notifications")
          .update({
            is_read: true,
          })
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (updateError) {
          console.error(
            "Error marking notifications as read:",
            updateError,
          );

          setError(
            "تم تحميل الإشعارات، لكن تعذر تحديث حالتها كمقروءة.",
          );
        } else {
          setNotifications(
            (current) =>
              current.map(
                (notification) => ({
                  ...notification,
                  is_read: true,
                }),
              ),
          );
        }
      }
    } catch (err) {
      console.error(
        "Error loading notifications:",
        err,
      );

      setError(
        "حدث خطأ أثناء تحميل الإشعارات.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * عند فتح صفحة الإشعارات
   * =====================================================
   */
  useEffect(() => {
    loadNotifications();
  }, []);

  /*
   * =====================================================
   * تحديد إشعار فردي كمقروء
   * =====================================================
   */
  async function markAsRead(
    id: string,
  ) {
    if (markingId) {
      return;
    }

    setMarkingId(id);

    try {
      const {
        error: updateError,
      } = await supabase
        .from("notifications")
        .update({
          is_read: true,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setNotifications(
        (current) =>
          current.map(
            (notification) =>
              notification.id === id
                ? {
                    ...notification,
                    is_read: true,
                  }
                : notification,
          ),
      );
    } catch (err) {
      console.error(
        "Error marking notification as read:",
        err,
      );
    } finally {
      setMarkingId(null);
    }
  }

  /*
   * =====================================================
   * أيقونة الإشعار
   * =====================================================
   */
  function getNotificationIcon(
    title: string | null,
  ) {
    const text =
      (title ?? "").toLowerCase();

    if (
      text.includes("شحن") ||
      text.includes("shipment") ||
      text.includes("طلب")
    ) {
      return (
        <Package className="size-5" />
      );
    }

    if (
      text.includes("أمان") ||
      text.includes("امان") ||
      text.includes("amanah")
    ) {
      return (
        <ShieldCheck className="size-5" />
      );
    }

    if (
      text.includes("تنبيه") ||
      text.includes("خطأ") ||
      text.includes("alert")
    ) {
      return (
        <AlertCircle className="size-5" />
      );
    }

    return (
      <Info className="size-5" />
    );
  }

  /*
   * =====================================================
   * تنسيق التاريخ
   * =====================================================
   */
  function formatDate(
    date: string | null,
  ) {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    if (
      Number.isNaN(
        value.getTime(),
      )
    ) {
      return "";
    }

    return value.toLocaleString(
      "ar-SA",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  /*
   * عدد الإشعارات غير المقروءة
   */
  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read,
    ).length;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900"
    >
      {/* =================================================
          Header
      ================================================== */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl min-w-0 items-center justify-between gap-3 px-3 py-3.5 sm:px-6 sm:py-4">

          {/* عنوان الصفحة */}

          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm sm:size-11 sm:rounded-2xl">
              <Bell className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-xl">
                الإشعارات
              </h1>

              <p className="hidden truncate text-xs text-slate-500 sm:mt-0.5 sm:block sm:text-sm">
                جميع التحديثات والتنبيهات الخاصة بحسابك
              </p>
            </div>
          </div>

          {/* العودة */}

          <a
            href="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ArrowRight className="size-4" />

            <span className="hidden sm:inline">
              لوحة التحكم
            </span>

            <span className="sm:hidden">
              الرئيسية
            </span>
          </a>
        </div>
      </header>

      {/* =================================================
          Main
      ================================================== */}

      <main className="mx-auto w-full max-w-5xl min-w-0 px-3 py-4 sm:px-6 sm:py-8">

        {/* =================================================
            معلومات الإشعارات
        ================================================== */}

        <div className="mb-4 flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-5 sm:p-5">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-bold sm:text-lg">
                إشعاراتك
              </h2>

              {unreadCount > 0 && (
                <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white sm:text-xs">
                  {unreadCount} غير مقروء
                </span>
              )}

              {unreadCount === 0 &&
                notifications.length > 0 && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:text-xs">
                    الكل مقروء
                  </span>
                )}
            </div>

            <p className="mt-1.5 break-words text-xs leading-5 text-slate-500 sm:text-sm">
              تابع حالة شحناتك وأماناتك وأي تحديثات جديدة.
            </p>
          </div>
        </div>

        {/* =================================================
            Loading
        ================================================== */}

        {loading && (
          <div className="flex min-h-[280px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm sm:min-h-[300px]">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="size-8 animate-spin" />

              <p className="text-sm">
                جاري تحميل الإشعارات...
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            Error
        ================================================== */}

        {!loading && error && (
          <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-4 text-center sm:p-5">
            <AlertCircle className="mx-auto mb-3 size-8 text-red-500" />

            <p className="break-words text-sm font-semibold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadNotifications}
              className="mt-4 w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* =================================================
            لا توجد إشعارات
        ================================================== */}

        {!loading &&
          !error &&
          notifications.length === 0 && (
            <div className="flex min-h-[320px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-center shadow-sm sm:min-h-[350px] sm:px-6">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 sm:size-16">
                <Bell className="size-6 text-slate-400 sm:size-7" />
              </div>

              <h3 className="text-base font-bold text-slate-800 sm:text-lg">
                لا توجد إشعارات
              </h3>

              <p className="mt-2 max-w-md break-words text-xs leading-6 text-slate-500 sm:text-sm">
                عندما يحدث تحديث على شحناتك أو أماناتك ستظهر الإشعارات هنا.
              </p>
            </div>
          )}

        {/* =================================================
            قائمة الإشعارات
        ================================================== */}

        {!loading &&
          !error &&
          notifications.length > 0 && (
            <div className="w-full min-w-0 space-y-3">
              {notifications.map(
                (notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      if (
                        !notification.is_read
                      ) {
                        markAsRead(
                          notification.id,
                        );
                      }
                    }}
                    disabled={
                      markingId ===
                      notification.id
                    }
                    className={`w-full min-w-0 rounded-2xl border p-3.5 text-right shadow-sm transition sm:p-5 ${
                      notification.is_read
                        ? "border-slate-200 bg-white hover:bg-slate-50"
                        : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">

                      {/* أيقونة */}

                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${
                          notification.is_read
                            ? "bg-slate-100 text-slate-500"
                            : "bg-slate-900 text-white"
                        }`}
                      >
                        {getNotificationIcon(
                          notification.title,
                        )}
                      </div>

                      {/* المحتوى */}

                      <div className="min-w-0 flex-1">

                        {/* العنوان + التاريخ */}

                        <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">

                          <div className="flex min-w-0 items-start gap-2">
                            <h3 className="min-w-0 break-words text-sm font-bold leading-6 text-slate-800 sm:text-base">
                              {notification.title ||
                                "إشعار جديد"}
                            </h3>

                            {!notification.is_read && (
                              <span className="mt-2 size-2 shrink-0 rounded-full bg-slate-900" />
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] leading-5 text-slate-400 sm:text-xs">
                            {formatDate(
                              notification.created_at,
                            )}
                          </span>
                        </div>

                        {/* الرسالة */}

                        <p className="mt-2 break-words whitespace-pre-wrap text-xs leading-6 text-slate-600 sm:text-sm">
                          {notification.message ||
                            "لديك تحديث جديد في أمانتي."}
                        </p>

                        {!notification.is_read && (
                          <p className="mt-2.5 text-[11px] font-semibold leading-5 text-slate-500 sm:mt-3 sm:text-xs">
                            اضغط على الإشعار لتحديده كمقروء
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ),
              )}
            </div>
          )}
      </main>
    </div>
  );
}