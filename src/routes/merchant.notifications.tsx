import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock3,
  Info,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/notifications")({
  component: MerchantNotificationsPage,
});

type Notification = {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

type FilterType = "all" | "unread" | "read";

function formatDate(date: string) {
  try {
    return new Intl.DateTimeFormat("ar-YE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function getRelativeTime(date: string) {
  const now = Date.now();
  const target = new Date(date).getTime();
  const diff = Math.max(0, now - target);

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "منذ يوم";
  if (days < 7) return `منذ ${days} أيام`;

  return formatDate(date);
}

function getNotificationType(title: string, message: string | null) {
  const text = `${title} ${message ?? ""}`.toLowerCase();

  if (
    text.includes("شحن") ||
    text.includes("طلب") ||
    text.includes("توصيل")
  ) {
    return {
      label: "شحنات",
      icon: Truck,
      iconClass: "text-primary",
      iconBg: "bg-primary/10",
    };
  }

  if (
    text.includes("أمان") ||
    text.includes("امان") ||
    text.includes("استلام")
  ) {
    return {
      label: "أمانات",
      icon: ShieldCheck,
      iconClass: "text-secondary",
      iconBg: "bg-secondary/10",
    };
  }

  if (
    text.includes("تنبيه") ||
    text.includes("مهم") ||
    text.includes("تحذير")
  ) {
    return {
      label: "تنبيه",
      icon: BellRing,
      iconClass: "text-amber-600",
      iconBg: "bg-amber-500/10",
    };
  }

  return {
    label: "عام",
    icon: Info,
    iconClass: "text-primary",
    iconBg: "bg-primary/10",
  };
}

function MerchantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  async function loadNotifications(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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
        setError("يجب تسجيل الدخول أولاً.");
        setNotifications([]);
        return;
      }

      const { data, error: queryError } = await supabase
        .from("notifications")
        .select("id,title,message,is_read,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setNotifications((data ?? []) as Notification[]);
    } catch (err) {
      console.error("MERCHANT NOTIFICATIONS ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "تعذر تحميل الإشعارات.",
      );

      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return;

      channel = supabase
        .channel(`merchant-notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications(false);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;

      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const stats = useMemo(() => {
    const unread = notifications.filter(
      (item) => !item.is_read,
    ).length;

    const read = notifications.filter(
      (item) => item.is_read,
    ).length;

    const today = notifications.filter((item) => {
      const date = new Date(item.created_at);
      const now = new Date();

      return (
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      total: notifications.length,
      unread,
      read,
      today,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.is_read) ||
        (filter === "read" && notification.is_read);

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        notification.title.toLowerCase().includes(query) ||
        (notification.message ?? "").toLowerCase().includes(query)
      );
    });
  }, [notifications, search, filter]);

  async function markRead(id: string) {
    setBusyId(id);
    setError("");

    try {
      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, is_read: true }
            : item,
        ),
      );

      setSelectedNotification((current) =>
        current?.id === id
          ? { ...current, is_read: true }
          : current,
      );
    } catch (err) {
      console.error("MARK NOTIFICATION READ ERROR:", err);
      setError("تعذر تحديث الإشعار.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAllRead() {
    if (!stats.unread) return;

    setBusyId("all");
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("يجب تسجيل الدخول أولاً.");
      }

      const { error: updateError } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (updateError) {
        throw updateError;
      }

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        })),
      );

      setSelectedNotification((current) =>
        current
          ? { ...current, is_read: true }
          : null,
      );
    } catch (err) {
      console.error("MARK ALL NOTIFICATIONS ERROR:", err);
      setError("تعذر تحديث الإشعارات.");
    } finally {
      setBusyId(null);
    }
  }

  function openNotification(notification: Notification) {
    setSelectedNotification(notification);

    if (!notification.is_read) {
      void markRead(notification.id);
    }
  }

  return (
    <div dir="rtl" className="space-y-8">
      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-secondary/[0.08] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 size-64 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-background/70 px-3 py-1.5 text-xs font-extrabold text-primary backdrop-blur">
              <Sparkles className="size-3.5" />
              مركز التنبيهات الذكي
            </div>

            <h2 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
              كل جديد في متجرك،
              <span className="block text-secondary">
                في مكان واحد.
              </span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              تابع تحديثات الشحنات والأمانات والتنبيهات المهمة
              لحظة بلحظة، ولا تفوّت أي شيء يحتاج انتباهك.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-bold text-muted-foreground shadow-sm">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                التحديثات اللحظية مفعّلة
              </div>

              {stats.unread > 0 && (
                <div className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground shadow-sm">
                  <BellRing className="size-3.5" />
                  لديك {stats.unread} إشعار غير مقروء
                </div>
              )}
            </div>
          </div>

          <div className="relative shrink-0">
            <div className="flex size-28 items-center justify-center rounded-[2rem] border border-primary/10 bg-card/80 shadow-xl backdrop-blur sm:size-36">
              <div className="relative flex size-20 items-center justify-center rounded-[1.5rem] bg-primary/10 sm:size-24">
                <Bell
                  className="size-10 text-primary sm:size-12"
                  strokeWidth={1.5}
                />

                {stats.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg">
                    {stats.unread > 99 ? "99+" : stats.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Bell}
          label="إجمالي الإشعارات"
          value={stats.total}
          description="جميع التنبيهات"
          iconClass="text-primary"
          iconBg="bg-primary/10"
        />

        <StatCard
          icon={BellRing}
          label="غير مقروء"
          value={stats.unread}
          description="تحتاج انتباهك"
          iconClass="text-red-500"
          iconBg="bg-red-500/10"
          highlight={stats.unread > 0}
        />

        <StatCard
          icon={CheckCheck}
          label="تمت قراءتها"
          value={stats.read}
          description="إشعارات مكتملة"
          iconClass="text-emerald-600"
          iconBg="bg-emerald-500/10"
        />

        <StatCard
          icon={Clock3}
          label="اليوم"
          value={stats.today}
          description="إشعارات اليوم"
          iconClass="text-secondary"
          iconBg="bg-secondary/10"
        />
      </section>

      {/* =====================================================
          TOOLBAR
      ====================================================== */}
      <section className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث في عنوان الإشعار أو محتواه..."
              className="w-full rounded-2xl border border-border bg-background py-3.5 pl-4 pr-11 text-sm font-medium text-primary outline-none transition focus:border-primary/30 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              الكل
              <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[10px]">
                {stats.total}
              </span>
            </FilterButton>

            <FilterButton
              active={filter === "unread"}
              onClick={() => setFilter("unread")}
            >
              غير مقروء
              {stats.unread > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {stats.unread}
                </span>
              )}
            </FilterButton>

            <FilterButton
              active={filter === "read"}
              onClick={() => setFilter("read")}
            >
              مقروء
            </FilterButton>

            <button
              type="button"
              onClick={() => loadNotifications(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-extrabold text-primary transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              تحديث
            </button>

            <button
              type="button"
              onClick={markAllRead}
              disabled={!stats.unread || busyId === "all"}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCheck className="size-4" />
              {busyId === "all"
                ? "جاري التحديث..."
                : "قراءة الكل"}
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 transition hover:bg-red-100"
            >
              <X className="size-4" />
            </button>
          </div>
        </section>
      )}

      {/* =====================================================
          NOTIFICATIONS LIST
      ====================================================== */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-primary">
              مركز الإشعارات
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              {filteredNotifications.length} إشعار ظاهر
              {search || filter !== "all"
                ? " حسب الفلتر الحالي"
                : ""}
            </p>
          </div>

          {stats.unread > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-extrabold text-red-600">
              <span className="size-2 rounded-full bg-red-500" />
              {stats.unread} يحتاج قراءة
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-3xl border border-border bg-card p-5"
              >
                <div className="flex gap-4">
                  <div className="size-12 shrink-0 rounded-2xl bg-muted" />

                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="h-4 w-2/5 rounded bg-muted" />
                    <div className="h-3 w-4/5 rounded bg-muted" />
                    <div className="h-3 w-1/4 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyNotifications
            hasSearch={Boolean(search.trim())}
            hasFilter={filter !== "all"}
            onReset={() => {
              setSearch("");
              setFilter("all");
            }}
          />
        ) : (
          <div className="grid gap-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                busy={busyId === notification.id}
                onOpen={() =>
                  openNotification(notification)
                }
                onMarkRead={() =>
                  markRead(notification.id)
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* =====================================================
          DETAIL MODAL
      ====================================================== */}
      {selectedNotification && (
        <NotificationModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onMarkRead={() =>
            markRead(selectedNotification.id)
          }
          busy={busyId === selectedNotification.id}
        />
      )}
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  iconBg,
  highlight = false,
}: {
  icon: typeof Bell;
  label: string;
  value: number;
  description: string;
  iconClass: string;
  iconBg: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        highlight
          ? "border-red-200"
          : "border-border"
      }`}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-primary/[0.03] blur-2xl transition group-hover:bg-primary/[0.07]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-primary">
            {value.toLocaleString("ar-YE")}
          </p>

          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} transition duration-300 group-hover:scale-110`}
        >
          <Icon className={`size-5 ${iconClass}`} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   FILTER BUTTON
============================================================ */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "border border-border bg-background text-muted-foreground hover:border-primary/20 hover:bg-muted hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/* ============================================================
   NOTIFICATION CARD
============================================================ */

function NotificationCard({
  notification,
  busy,
  onOpen,
  onMarkRead,
}: {
  notification: Notification;
  busy: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const type = getNotificationType(
    notification.title,
    notification.message,
  );

  const Icon = type.icon;

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-xl ${
        notification.is_read
          ? "border-border"
          : "border-primary/20 bg-primary/[0.025]"
      }`}
    >
      {!notification.is_read && (
        <div className="absolute right-0 top-0 h-full w-1 bg-primary" />
      )}

      <button
        type="button"
        onClick={onOpen}
        className="w-full p-5 text-right sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div
            className={`relative flex size-12 shrink-0 items-center justify-center rounded-2xl ${type.iconBg} transition duration-300 group-hover:scale-105`}
          >
            <Icon
              className={`size-5 ${type.iconClass}`}
              strokeWidth={1.8}
            />

            {!notification.is_read && (
              <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-card bg-primary" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4
                    className={`break-words text-sm font-black leading-6 ${
                      notification.is_read
                        ? "text-primary"
                        : "text-primary"
                    }`}
                  >
                    {notification.title}
                  </h4>

                  {!notification.is_read && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-primary-foreground">
                      جديد
                    </span>
                  )}
                </div>

                {notification.message && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-6 text-muted-foreground">
                    {notification.message}
                  </p>
                )}
              </div>

              <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                {getRelativeTime(notification.created_at)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${type.iconBg} ${type.iconClass}`}
              >
                <Icon className="size-3" />
                {type.label}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground">
                <Clock3 className="size-3" />
                {formatDate(notification.created_at)}
              </span>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <span className="rounded-xl border border-border bg-background px-3 py-2 text-[10px] font-extrabold text-primary transition group-hover:border-primary/20 group-hover:bg-primary/5">
              عرض التفاصيل
            </span>
          </div>
        </div>
      </button>

      <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/20 px-5 py-3 sm:px-6">
        <span className="text-[10px] font-bold text-muted-foreground">
          {notification.is_read
            ? "تمت قراءة هذا الإشعار"
            : "هذا الإشعار يحتاج انتباهك"}
        </span>

        {!notification.is_read && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onMarkRead();
            }}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-[10px] font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-3.5" />
            {busy ? "جاري..." : "تمت القراءة"}
          </button>
        )}
      </div>
    </article>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyNotifications({
  hasSearch,
  hasFilter,
  onReset,
}: {
  hasSearch: boolean;
  hasFilter: boolean;
  onReset: () => void;
}) {
  const filtered = hasSearch || hasFilter;

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-soft sm:p-12">
      <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] bg-primary/10">
        {filtered ? (
          <Search className="size-8 text-primary" />
        ) : (
          <Bell className="size-8 text-primary" />
        )}
      </div>

      <h4 className="mt-5 text-lg font-black text-primary">
        {filtered
          ? "لم نجد إشعارات مطابقة"
          : "لا توجد إشعارات حتى الآن"}
      </h4>

      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        {filtered
          ? "جرّب تغيير كلمات البحث أو الفلتر للوصول إلى الإشعارات التي تبحث عنها."
          : "عندما يحدث شيء مهم في متجرك، ستظهر التنبيهات هنا مباشرة."}
      </p>

      {filtered && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <RefreshCw className="size-4" />
          إظهار كل الإشعارات
        </button>
      )}
    </div>
  );
}

/* ============================================================
   MODAL
============================================================ */

function NotificationModal({
  notification,
  onClose,
  onMarkRead,
  busy,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkRead: () => void;
  busy: boolean;
}) {
  const type = getNotificationType(
    notification.title,
    notification.message,
  );

  const Icon = type.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/[0.08] via-card to-secondary/[0.08] p-6">
          <div className="pointer-events-none absolute -left-16 -top-16 size-40 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${type.iconBg}`}
              >
                <Icon
                  className={`size-6 ${type.iconClass}`}
                  strokeWidth={1.7}
                />
              </div>

              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-extrabold ${type.iconBg} ${type.iconClass}`}
                >
                  {type.label}
                </span>

                <h3 className="mt-2 break-words text-lg font-black leading-7 text-primary">
                  {notification.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-primary"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-border bg-muted/30 p-5">
            <p className="text-sm leading-8 text-primary">
              {notification.message ||
                "لا يوجد محتوى إضافي لهذا الإشعار."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-xl bg-muted px-3 py-2 font-bold">
              <Clock3 className="size-3.5" />
              {formatDate(notification.created_at)}
            </span>

            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 font-bold ${
                notification.is_read
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <CheckCheck className="size-3.5" />
              {notification.is_read
                ? "تمت القراءة"
                : "غير مقروء"}
            </span>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-background px-4 py-3 text-xs font-extrabold text-primary transition hover:bg-muted"
            >
              إغلاق
            </button>

            {!notification.is_read && (
              <button
                type="button"
                onClick={onMarkRead}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
              >
                <CheckCheck className="size-4" />
                {busy
                  ? "جاري الحفظ..."
                  : "تحديد كمقروء"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
