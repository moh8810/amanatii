import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bell,
  BellRing,
  CheckCircle2,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Copy,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/")({
  head: () => ({
    meta: [
      {
        title: "لوحة تحكم التاجر | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "لوحة التحكم الخاصة بالتاجر في منصة أمانتي.",
      },
    ],
  }),
  component: MerchantDashboardPage,
});

type Shipment = {
  id: string;
  tracking_number: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  status: string | null;
  shipping_fee: number | null;
  payment_status: string | null;
  pricing_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AmanatItem = {
  id: string;
  tracking_number: string | null;
  owner_id: string;
  status: string;
  description: string | null;
  notes: string | null;
  updated_at: string | null;
};

type Notification = {
  id: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

type Profile = {
  full_name: string | null;
  store_name: string | null;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-YE")} ريال`;
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function relativeTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const difference = Math.max(
    0,
    Date.now() - date.getTime(),
  );

  const minutes = Math.floor(difference / 60000);
  const hours = Math.floor(difference / 3600000);
  const days = Math.floor(difference / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days === 1) return "منذ يوم";
  if (days < 7) return `منذ ${days} أيام`;

  return formatDate(value);
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "قيد المعالجة";

    case "in_transit":
    case "transit":
      return "قيد الشحن";

    case "ready_for_pickup":
    case "ready":
      return "جاهزة للاستلام";

    case "delivered":
    case "completed":
    case "done":
      return "تم التسليم";

    case "received":
    case "collected":
      return "تم الاستلام";

    case "stored_amanat":
    case "stored":
      return "أمانة محفوظة";

    default:
      return status || "غير محدد";
  }
}

function getStatusStyle(status: string | null) {
  switch (status) {
    case "delivered":
    case "completed":
    case "done":
    case "received":
    case "collected":
      return {
        wrapper: "bg-emerald-500/10 text-emerald-700",
        icon: CheckCircle2,
      };

    case "in_transit":
    case "transit":
      return {
        wrapper: "bg-sky-500/10 text-sky-700",
        icon: Truck,
      };

    case "ready_for_pickup":
    case "ready":
      return {
        wrapper: "bg-amber-500/10 text-amber-700",
        icon: PackageCheck,
      };

    case "stored":
    case "stored_amanat":
      return {
        wrapper: "bg-violet-500/10 text-violet-700",
        icon: ShieldCheck,
      };

    default:
      return {
        wrapper: "bg-primary/10 text-primary",
        icon: Clock3,
      };
  }
}

function MerchantDashboardPage() {
  const [profile, setProfile] = useState<Profile>({
    full_name: null,
    store_name: null,
  });

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [amanat, setAmanat] = useState<AmanatItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [copied, setCopied] = useState(false);

  async function loadDashboard(showRefresh = false) {
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

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى لوحة التحكم.",
        );
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name,store_name,role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw new Error(
          "تعذر تحميل بيانات المتجر.",
        );
      }

      if (profileData.role !== "merchant") {
        throw new Error(
          "هذه الصفحة مخصصة لحسابات التجار فقط.",
        );
      }

      const [
        shipmentsResult,
        amanatResult,
        notificationsResult,
      ] = await Promise.all([
        supabase
          .from("shipments")
          .select(
            `
              id,
              tracking_number,
              receiver_name,
              receiver_phone,
              status,
              shipping_fee,
              payment_status,
              pricing_status,
              created_at,
              updated_at
            `,
          )
          .eq("merchant_id", user.id)
          .order("updated_at", {
            ascending: false,
          }),

        supabase
          .from("amanat")
          .select(
            `
              id,
              tracking_number,
              owner_id,
              status,
              description,
              notes,
              updated_at
            `,
          )
          .eq("owner_id", user.id)
          .order("updated_at", {
            ascending: false,
          }),

        supabase
          .from("notifications")
          .select(
            "id,title,message,is_read,created_at",
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(5),
      ]);

      if (shipmentsResult.error) {
        throw new Error(
          "تعذر تحميل شحنات المتجر.",
        );
      }

      if (amanatResult.error) {
        console.error(
          "MERCHANT DASHBOARD AMANAT ERROR:",
          amanatResult.error,
        );
      }

      if (notificationsResult.error) {
        console.error(
          "MERCHANT DASHBOARD NOTIFICATIONS ERROR:",
          notificationsResult.error,
        );
      }

      setProfile({
        full_name: profileData.full_name ?? null,
        store_name: profileData.store_name ?? null,
      });

      setShipments(
        (shipmentsResult.data ?? []) as Shipment[],
      );

      setAmanat(
        (amanatResult.data ?? []) as AmanatItem[],
      );

      setNotifications(
        (notificationsResult.data ?? []) as Notification[],
      );
    } catch (err) {
      console.error(
        "MERCHANT DASHBOARD ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل لوحة التحكم.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const total = shipments.length;

    const pending = shipments.filter(
      (item) => item.status === "pending",
    ).length;

    const inTransit = shipments.filter(
      (item) =>
        item.status === "in_transit" ||
        item.status === "transit",
    ).length;

    const ready = shipments.filter(
      (item) =>
        item.status === "ready_for_pickup" ||
        item.status === "ready",
    ).length;

    const completed = shipments.filter(
      (item) =>
        item.status === "delivered" ||
        item.status === "completed" ||
        item.status === "done" ||
        item.status === "received" ||
        item.status === "collected",
    ).length;

    const totalFees = shipments.reduce(
      (sum, item) =>
        sum + Number(item.shipping_fee ?? 0),
      0,
    );

    const paidFees = shipments
      .filter(
        (item) =>
          item.payment_status === "paid",
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.shipping_fee ?? 0),
        0,
      );

    return {
      total,
      pending,
      inTransit,
      ready,
      completed,
      totalFees,
      paidFees,
    };
  }, [shipments]);

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (item) => !item.is_read,
      ).length,
    [notifications],
  );

  const activeShipments = useMemo(
    () =>
      shipments.filter(
        (item) =>
          item.status !== "delivered" &&
          item.status !== "completed" &&
          item.status !== "done" &&
          item.status !== "received" &&
          item.status !== "collected",
      ).length,
    [shipments],
  );

  const collectionRate =
    stats.totalFees > 0
      ? Math.round(
          (stats.paidFees / stats.totalFees) * 100,
        )
      : 0;

  const performanceRate =
    stats.total > 0
      ? Math.round(
          (stats.completed / stats.total) * 100,
        )
      : 0;

  const recentShipments = shipments.slice(0, 5);
  const recentAmanat = amanat.slice(0, 4);
  const recentNotifications = notifications.slice(
    0,
    4,
  );

  async function copyTracking(value: string) {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error(
        "COPY TRACKING ERROR:",
        err,
      );
    }
  }

  const merchantName =
    profile.full_name?.trim() || "التاجر";

  const storeName =
    profile.store_name?.trim() || "متجرك في أمانتي";

  return (
    <div
      dir="rtl"
      className="space-y-8"
    >
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.08] via-card to-secondary/[0.08] p-6 shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-28 right-1/3 size-80 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-background/70 px-3 py-1.5 text-[11px] font-extrabold text-primary backdrop-blur">
              <Sparkles className="size-3.5" />
              لوحة التاجر الذكية
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-tight text-primary sm:text-4xl">
  نظرة سريعة على
  <span className="block text-secondary">
    نشاط متجرك ✨
  </span>
</h2>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
              هذه نظرتك السريعة على نشاط متجرك في أمانتي.
              تابع شحناتك، أماناتك، أداءك المالي، وكل ما
              يحتاج انتباهك من مكان واحد.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/merchant/shipments/new"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <Truck className="size-4" />
                إضافة شحنة
              </Link>

              <Link
                to="/merchant/amanat/new"
                className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-xs font-extrabold text-secondary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <ShieldCheck className="size-4" />
                إضافة أمانة
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                النظام يعمل بشكل طبيعي
              </span>

              <span className="text-border">
                •
              </span>

              <span>
                {storeName}
              </span>
            </div>
          </div>

          {/* HERO SUMMARY */}

          <div className="relative min-w-[260px] rounded-[1.75rem] border border-border bg-card/80 p-5 shadow-xl backdrop-blur sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground">
                  نشاط المتجر
                </p>

                <p className="mt-2 text-3xl font-black text-primary">
                  {stats.total.toLocaleString("ar-YE")}
                </p>

                <p className="mt-1 text-xs font-bold text-muted-foreground">
                  إجمالي الشحنات
                </p>
              </div>

              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <ClipboardList className="size-7 text-primary" />
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[10px] font-bold">
                <span className="text-muted-foreground">
                  نسبة الإنجاز
                </span>

                <span className="font-black text-primary">
                  {performanceRate}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{
                    width: `${performanceRate}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <MiniMetric
                label="نشطة"
                value={activeShipments}
              />

              <MiniMetric
                label="غير مقروء"
                value={unreadNotifications}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          icon={ClipboardList}
          label="إجمالي الطلبات"
          value={stats.total}
          description="كل شحنات متجرك"
          iconClass="text-primary"
          iconBg="bg-primary/10"
        />

        <DashboardStat
          icon={Truck}
          label="قيد الشحن"
          value={stats.inTransit}
          description="شحنات في الطريق"
          iconClass="text-sky-700"
          iconBg="bg-sky-500/10"
        />

        <DashboardStat
          icon={PackageCheck}
          label="جاهزة للاستلام"
          value={stats.ready}
          description="تحتاج استلام العميل"
          iconClass="text-amber-700"
          iconBg="bg-amber-500/10"
        />

        <DashboardStat
          icon={CheckCircle2}
          label="تم الإنجاز"
          value={stats.completed}
          description="شحنات مكتملة"
          iconClass="text-emerald-700"
          iconBg="bg-emerald-500/10"
        />
      </section>

      {/* =====================================================
          QUICK OVERVIEW
      ====================================================== */}

      <section className="grid gap-4 lg:grid-cols-3">
        <OverviewCard
          icon={Clock3}
          title="قيد المعالجة"
          value={stats.pending}
          description="شحنات تنتظر المعالجة"
          tone="amber"
        />

        <OverviewCard
          icon={WalletCards}
          title="إجمالي رسوم الشحن"
          value={formatMoney(stats.totalFees)}
          description={`تم تحصيل ${formatMoney(stats.paidFees)}`}
          tone="primary"
        />

        <OverviewCard
          icon={TrendingUp}
          title="نسبة التحصيل"
          value={`${collectionRate}%`}
          description="من إجمالي رسوم الشحن"
          tone="green"
        />
      </section>

      {/* =====================================================
          MAIN GRID
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        {/* =================================================
            RECENT SHIPMENTS
        ================================================== */}

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-primary">
                آخر الشحنات
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                أحدث عمليات متجرك
              </p>
            </div>

            <Link
              to="/merchant/orders"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-primary transition hover:text-secondary"
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            {loading ? (
              <DashboardLoadingRows />
            ) : recentShipments.length === 0 ? (
              <EmptyBlock
                icon={PackageCheck}
                title="لا توجد شحنات حتى الآن"
                description="ابدأ بإضافة أول شحنة لمتجرك وستظهر عملياتك هنا."
                actionLabel="إضافة شحنة"
                actionTo="/merchant/shipments/new"
              />
            ) : (
              <div className="divide-y divide-border">
                {recentShipments.map(
                  (shipment) => {
                    const statusStyle =
                      getStatusStyle(
                        shipment.status,
                      );

                    const StatusIcon =
                      statusStyle.icon;

                    return (
                      <button
                        key={shipment.id}
                        type="button"
                        onClick={() =>
                          setSelectedShipment(
                            shipment,
                          )
                        }
                        className="group w-full p-5 text-right transition hover:bg-muted/30 sm:p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5 transition group-hover:scale-105 group-hover:bg-primary/10">
                            <PackageCheck className="size-5 text-primary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-mono text-sm font-black text-primary">
                                    {shipment.tracking_number ||
                                      shipment.id}
                                  </p>

                                  {shipment.tracking_number && (
                                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
                                      رقم التتبع
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                                  {shipment.receiver_name ||
                                    "مستلم غير محدد"}
                                </p>
                              </div>

                              <div
                                className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold ${statusStyle.wrapper}`}
                              >
                                <StatusIcon className="size-3.5" />
                                {getStatusLabel(
                                  shipment.status,
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-bold text-muted-foreground">
                              {shipment.receiver_phone && (
                                <span dir="ltr">
                                  {shipment.receiver_phone}
                                </span>
                              )}

                              <span>
                                {relativeTime(
                                  shipment.updated_at ||
                                    shipment.created_at,
                                )}
                              </span>

                              {shipment.shipping_fee !==
                                null && (
                                <span className="font-black text-primary">
                                  {formatMoney(
                                    Number(
                                      shipment.shipping_fee,
                                    ),
                                  )}
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronLeft className="mt-2 hidden size-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary sm:block" />
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            NOTIFICATIONS
        ================================================== */}

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-primary">
                التنبيهات
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                آخر المستجدات التي تحتاج انتباهك
              </p>
            </div>

            <Link
              to="/merchant/notifications"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-primary transition hover:text-secondary"
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            {loading ? (
              <DashboardLoadingRows count={4} />
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/5">
                  <Bell className="size-7 text-primary/60" />
                </div>

                <p className="mt-4 text-sm font-black text-primary">
                  لا توجد تنبيهات
                </p>

                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  ستظهر هنا آخر التحديثات المهمة لمتجرك.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentNotifications.map(
                  (notification) => (
                    <Link
                      key={notification.id}
                      to="/merchant/notifications"
                      className={`group block p-5 transition hover:bg-muted/30 ${
                        notification.is_read
                          ? ""
                          : "bg-primary/[0.025]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`relative flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            notification.is_read
                              ? "bg-muted"
                              : "bg-primary/10"
                          }`}
                        >
                          <BellRing
                            className={`size-4 ${
                              notification.is_read
                                ? "text-muted-foreground"
                                : "text-primary"
                            }`}
                          />

                          {!notification.is_read && (
                            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="break-words text-xs font-black leading-5 text-primary">
                              {notification.title}
                            </p>

                            <span className="shrink-0 text-[9px] font-bold text-muted-foreground">
                              {relativeTime(
                                notification.created_at,
                              )}
                            </span>
                          </div>

                          {notification.message && (
                            <p className="mt-1 line-clamp-2 text-[10px] leading-5 text-muted-foreground">
                              {notification.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </div>
            )}

            {!loading &&
              unreadNotifications > 0 && (
                <div className="border-t border-border bg-primary/[0.025] px-5 py-3">
                  <Link
                    to="/merchant/notifications"
                    className="flex items-center justify-between gap-3 text-xs font-extrabold text-primary"
                  >
                    <span>
                      لديك{" "}
                      {unreadNotifications.toLocaleString(
                        "ar-YE",
                      )}{" "}
                      إشعار غير مقروء
                    </span>

                    <ArrowLeft className="size-4" />
                  </Link>
                </div>
              )}
          </div>
        </section>
      </div>

      {/* =====================================================
          AMANAT + QUICK ACTIONS
      ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        {/* AMANAT */}

        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-primary">
                أمانات متجرك
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                آخر الأمانات المسجلة
              </p>
            </div>

            <Link
              to="/merchant/amanat"
              className="inline-flex items-center gap-1 text-xs font-extrabold text-primary transition hover:text-secondary"
            >
              عرض الكل
              <ChevronLeft className="size-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card shadow-soft">
            {loading ? (
              <DashboardLoadingRows count={3} />
            ) : recentAmanat.length === 0 ? (
              <EmptyBlock
                icon={ShieldCheck}
                title="لا توجد أمانات"
                description="ستظهر أمانات متجرك الأخيرة هنا."
                actionLabel="إضافة أمانة"
                actionTo="/merchant/amanat/new"
              />
            ) : (
              <div className="divide-y divide-border">
                {recentAmanat.map(
                  (item) => {
                    const statusStyle =
                      getStatusStyle(
                        item.status,
                      );

                    const StatusIcon =
                      statusStyle.icon;

                    return (
                      <div
                        key={item.id}
                        className="p-5 transition hover:bg-muted/20 sm:p-6"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10">
                            <ShieldCheck className="size-5 text-secondary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <p className="truncate font-mono text-xs font-black text-primary">
                                  {item.tracking_number ||
                                    item.id}
                                </p>

                                <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground">
                                  {item.description ||
                                    item.notes ||
                                    "أمانة بدون وصف"}
                                </p>
                              </div>

                              <span
                                className={`inline-flex w-fit items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-extrabold ${statusStyle.wrapper}`}
                              >
                                <StatusIcon className="size-3.5" />
                                {getStatusLabel(
                                  item.status,
                                )}
                              </span>
                            </div>

                            <p className="mt-3 text-[10px] font-bold text-muted-foreground">
                              {relativeTime(
                                item.updated_at,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section>
          <div className="mb-4">
            <h3 className="text-xl font-black text-primary">
              الوصول السريع
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              أهم الأدوات التي تحتاجها يوميًا
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <QuickAction
              to="/merchant/shipments/new"
              icon={Truck}
              title="إنشاء شحنة"
              description="أضف شحنة جديدة بسرعة"
              iconBg="bg-primary/10"
              iconClass="text-primary"
            />

            <QuickAction
              to="/merchant/amanat/new"
              icon={ShieldCheck}
              title="إضافة أمانة"
              description="سجل أمانة جديدة للمتجر"
              iconBg="bg-secondary/10"
              iconClass="text-secondary"
            />

            <QuickAction
              to="/merchant/customers"
              icon={Users}
              title="العملاء"
              description="تابع عملاء متجرك"
              iconBg="bg-sky-500/10"
              iconClass="text-sky-700"
            />

            <QuickAction
              to="/merchant/wallet"
              icon={WalletCards}
              title="المحفظة والأرباح"
              description="راجع أداءك المالي"
              iconBg="bg-emerald-500/10"
              iconClass="text-emerald-700"
            />
          </div>
        </section>
      </div>

      {/* =====================================================
          PERFORMANCE FOOTER
      ====================================================== */}

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
        <div className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <PerformanceItem
            icon={TrendingUp}
            label="أداء الشحنات"
            value={`${performanceRate}%`}
            description="نسبة الشحنات المنجزة"
          />

          <PerformanceItem
            icon={WalletCards}
            label="التحصيل المالي"
            value={`${collectionRate}%`}
            description="نسبة الرسوم المحصلة"
          />

          <PerformanceItem
            icon={BellRing}
            label="التنبيهات"
            value={unreadNotifications.toLocaleString(
              "ar-YE",
            )}
            description="إشعارات غير مقروءة"
          />
        </div>
      </section>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadDashboard(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm transition hover:bg-red-100"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          REFRESH FLOATING BUTTON
      ====================================================== */}

      <button
        type="button"
        onClick={() =>
          void loadDashboard(true)
        }
        disabled={refreshing}
        className="fixed bottom-6 left-6 z-40 flex size-12 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-xl transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50"
        title="تحديث لوحة التحكم"
      >
        <RefreshCw
          className={`size-5 ${
            refreshing ? "animate-spin" : ""
          }`}
        />
      </button>

      {/* =====================================================
          SHIPMENT DETAILS MODAL
      ====================================================== */}

      {selectedShipment && (
        <ShipmentModal
          shipment={selectedShipment}
          onClose={() =>
            setSelectedShipment(null)
          }
          onCopy={() => {
            const value =
              selectedShipment.tracking_number ||
              selectedShipment.id;

            void copyTracking(value);
          }}
        />
      )}

      {/* =====================================================
          COPY TOAST
      ====================================================== */}

      {copied && (
        <div className="fixed bottom-6 left-1/2 z-[300] flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-extrabold text-primary-foreground shadow-2xl">
          <CheckCircle2 className="size-4" />
          تم نسخ رقم الشحنة
        </div>
      )}
    </div>
  );
}

/* ============================================================
   DASHBOARD STAT
============================================================ */

function DashboardStat({
  icon: Icon,
  label,
  value,
  description,
  iconClass,
  iconBg,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  description: string;
  iconClass: string;
  iconBg: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-primary/[0.035] blur-2xl transition group-hover:bg-primary/[0.08]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-primary">
            {value.toLocaleString("ar-YE")}
          </p>

          <p className="mt-1 text-[10px] font-bold text-muted-foreground">
            {description}
          </p>
        </div>

        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconBg} transition duration-300 group-hover:scale-110`}
        >
          <Icon
            className={`size-5 ${iconClass}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MINI METRIC
============================================================ */

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2.5">
      <p className="text-[9px] font-bold text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-primary">
        {value.toLocaleString("ar-YE")}
      </p>
    </div>
  );
}

/* ============================================================
   OVERVIEW CARD
============================================================ */

function OverviewCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: typeof Clock3;
  title: string;
  value: string | number;
  description: string;
  tone: "amber" | "primary" | "green";
}) {
  const styles = {
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-700",
    },
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
    },
    green: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-700",
    },
  }[tone];

  return (
    <div className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${styles.bg}`}
        >
          <Icon
            className={`size-5 ${styles.text}`}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground">
            {title}
          </p>

          <p className="mt-1 truncate text-xl font-black text-primary">
            {typeof value === "number"
              ? value.toLocaleString("ar-YE")
              : value}
          </p>
        </div>
      </div>

      <p className="mt-4 text-[10px] font-bold text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  iconBg,
  iconClass,
}: {
  to: string;
  icon: typeof Truck;
  title: string;
  description: string;
  iconBg: string;
  iconClass: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-lg"
    >
      <div
        className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconBg} transition group-hover:scale-105`}
      >
        <Icon className={`size-5 ${iconClass}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-primary">
          {title}
        </p>

        <p className="mt-1 text-[10px] font-bold text-muted-foreground">
          {description}
        </p>
      </div>

      <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

/* ============================================================
   PERFORMANCE ITEM
============================================================ */

function PerformanceItem({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-5 sm:p-6">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
        <Icon className="size-5 text-primary" />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 text-xl font-black text-primary">
          {value}
        </p>

        <p className="mt-0.5 text-[9px] font-bold text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function DashboardLoadingRows({
  count = 5,
}: {
  count?: number;
}) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map(
        (_, index) => (
          <div
            key={index}
            className="animate-pulse p-5 sm:p-6"
          >
            <div className="flex gap-4">
              <div className="size-11 shrink-0 rounded-2xl bg-muted" />

              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-3 w-2/5 rounded bg-muted" />
                <div className="h-3 w-3/5 rounded bg-muted" />
                <div className="h-2.5 w-1/4 rounded bg-muted" />
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

/* ============================================================
   EMPTY BLOCK
============================================================ */

function EmptyBlock({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: typeof PackageCheck;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <div className="p-8 text-center sm:p-10">
      <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-primary/5">
        <Icon className="size-7 text-primary/60" />
      </div>

      <h4 className="mt-4 text-base font-black text-primary">
        {title}
      </h4>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
        {description}
      </p>

      <Link
        to={actionTo}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        {actionLabel}
        <ArrowUpLeft className="size-4" />
      </Link>
    </div>
  );
}

/* ============================================================
   SHIPMENT MODAL
============================================================ */

function ShipmentModal({
  shipment,
  onClose,
  onCopy,
}: {
  shipment: Shipment;
  onClose: () => void;
  onCopy: () => void;
}) {
  const statusStyle = getStatusStyle(
    shipment.status,
  );

  const StatusIcon = statusStyle.icon;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground">
          <div className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <PackageCheck className="size-6" />
              </div>

              <div>
                <p className="text-[10px] font-bold text-white/60">
                  تفاصيل الشحنة
                </p>

                <h3 className="mt-1 text-lg font-black">
                  {shipment.tracking_number ||
                    shipment.id}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-3xl bg-muted/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground">
                  الحالة الحالية
                </p>

                <div
                  className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${statusStyle.wrapper}`}
                >
                  <StatusIcon className="size-4" />
                  {getStatusLabel(
                    shipment.status,
                  )}
                </div>
              </div>

              {shipment.shipping_fee !==
                null && (
                <div className="text-left">
                  <p className="text-[10px] font-bold text-muted-foreground">
                    رسوم الشحن
                  </p>

                  <p className="mt-2 text-xl font-black text-primary">
                    {formatMoney(
                      Number(
                        shipment.shipping_fee,
                      ),
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DetailRow
            label="رقم الشحنة"
            value={
              shipment.tracking_number ||
              shipment.id
            }
            action={
              <button
                type="button"
                onClick={onCopy}
                className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:text-primary"
                title="نسخ"
              >
                <Copy className="size-3.5" />
              </button>
            }
          />

          <DetailRow
            label="المستلم"
            value={
              shipment.receiver_name ||
              "غير محدد"
            }
          />

          <DetailRow
            label="رقم الهاتف"
            value={
              shipment.receiver_phone ||
              "غير محدد"
            }
          />

          <DetailRow
            label="حالة التسعير"
            value={
              shipment.pricing_status ===
              "priced"
                ? "تم تحديد الرسوم"
                : "بانتظار تحديد الرسوم"
            }
          />

          <DetailRow
            label="حالة الدفع"
            value={
              shipment.payment_status ===
              "paid"
                ? "تم الدفع"
                : shipment.payment_status ===
                    "pending"
                  ? "قيد الدفع"
                  : "غير مدفوع"
            }
          />

          <DetailRow
            label="آخر تحديث"
            value={formatDate(
              shipment.updated_at ||
                shipment.created_at,
            )}
          />

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:opacity-90"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
  action,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
      <span className="shrink-0 text-xs font-bold text-muted-foreground">
        {label}
      </span>

      <div className="flex min-w-0 items-center gap-2">
        <span
          className="truncate text-xs font-black text-primary"
          dir={
            label.includes("الهاتف") ||
            label.includes("رقم")
              ? "ltr"
              : undefined
          }
        >
          {value}
        </span>

        {action}
      </div>
    </div>
  );
}
