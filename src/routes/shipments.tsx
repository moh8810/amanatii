import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Package,
  Search,
  Truck,
  CheckCircle2,
  PackageCheck,
  CreditCard,
  UserRound,
  Phone,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import {
  Card,
  StatusBadge,
} from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/shipments")({
  head: () => ({
    meta: [
      {
        title: "شحناتي | أمانتي",
      },
      {
        name: "description",
        content:
          "عرض ومتابعة جميع شحناتك في أمانتي.",
      },
    ],
  }),
  component: ShipmentsRoute,
});

type Shipment = {
  id: string;
  tracking_number: string;
  receiver_name: string;
  receiver_phone: string;
  status: string;
  description: string | null;
  shipping_fee: number | null;
  pricing_status: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
};

function ShipmentsRoute() {
  const location = useLocation();

  /*
   * /shipments/new هو Route ابن لـ /shipments.
   *
   * عندما نكون في صفحة إضافة شحنة،
   * نعرض الـ Outlet فقط.
   */

  if (location.pathname === "/shipments/new") {
    return <Outlet />;
  }

  return <ShipmentsPage />;
}

/*
 * =========================================================
 * حالات الشحنة
 * =========================================================
 */

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "قيد المعالجة",
    processing: "قيد المعالجة",

    transit: "قيد التوصيل",
    in_transit: "قيد التوصيل",

    ready: "جاهزة للاستلام",
    ready_for_pickup: "جاهزة للاستلام",

    delivered: "تم التسليم",
    completed: "تم التسليم",
    received: "تم الاستلام",

    stored: "أمانة محفوظة",
    stored_amanat: "أمانة محفوظة",
  };

  return labels[status] ?? status;
}

function getStatusTone(
  status: string,
):
  | "pending"
  | "transit"
  | "ready"
  | "done"
  | "stored" {
  if (
    status === "transit" ||
    status === "in_transit"
  ) {
    return "transit";
  }

  if (
    status === "ready" ||
    status === "ready_for_pickup"
  ) {
    return "ready";
  }

  if (
    status === "delivered" ||
    status === "completed" ||
    status === "received"
  ) {
    return "done";
  }

  if (
    status === "stored" ||
    status === "stored_amanat"
  ) {
    return "stored";
  }

  return "pending";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString(
    "ar-YE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
}

/*
 * =========================================================
 * تنسيق السعر
 * =========================================================
 */

function formatMoney(
  value: number | null,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return `${Number(value).toLocaleString(
    "ar-YE",
  )} ريال`;
}

/*
 * =========================================================
 * حالة السعر
 * =========================================================
 */

function getPricingText(
  shipment: Shipment,
) {
  if (
    shipment.shipping_fee === null ||
    shipment.shipping_fee === undefined ||
    shipment.pricing_status ===
      "pending"
  ) {
    return "بانتظار تحديد الرسوم";
  }

  return formatMoney(
    shipment.shipping_fee,
  );
}

/*
 * =========================================================
 * حالة الدفع
 * =========================================================
 */

function getPaymentText(
  shipment: Shipment,
) {
  if (
    shipment.shipping_fee === null ||
    shipment.shipping_fee === undefined ||
    shipment.pricing_status ===
      "pending"
  ) {
    return "بانتظار تحديد الرسوم";
  }

  if (
    shipment.payment_status ===
      "paid"
  ) {
    return "تم الدفع";
  }

  return "بانتظار الدفع";
}

function ShipmentsPage() {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /*
   * =========================================================
   * تحميل الشحنات
   * =========================================================
   */

  useEffect(() => {
    let mounted = true;

    async function loadShipments() {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        if (mounted) {
          setError(
            "يجب تسجيل الدخول أولاً.",
          );
          setLoading(false);
        }

        return;
      }

      const {
        data,
        error: shipmentsError,
      } =
        await supabase
          .from("shipments")
          .select(
            `
              id,
              tracking_number,
              receiver_name,
              receiver_phone,
              status,
              description,
              shipping_fee,
              pricing_status,
              payment_status,
              created_at,
              updated_at
            `,
          )
          .eq(
            "sender_id",
            user.id,
          )
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

      if (!mounted) {
        return;
      }

      if (shipmentsError) {
        console.error(
          "SHIPMENTS ERROR:",
          shipmentsError,
        );

        setError(
          "تعذر تحميل شحناتك. تحقق من اتصال قاعدة البيانات وصلاحيات الحساب.",
        );

        setShipments([]);
      } else {
        setShipments(
          (data ??
            []) as Shipment[],
        );
      }

      setLoading(false);
    }

    loadShipments();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * =========================================================
   * Supabase Realtime
   * =========================================================
   */

  useEffect(() => {
    let channel:
      | ReturnType<
          typeof supabase.channel
        >
      | null = null;

    async function subscribeToShipments() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      channel =
        supabase
          .channel(
            `customer-shipments-${user.id}`,
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "shipments",
              filter: `sender_id=eq.${user.id}`,
            },
            (payload) => {
              const updatedShipment =
                payload.new as Partial<Shipment>;

              setShipments(
                (current) =>
                  current.map(
                    (shipment) =>
                      shipment.id ===
                      updatedShipment.id
                        ? {
                            ...shipment,
                            ...updatedShipment,
                          }
                        : shipment,
                  ),
              );
            },
          )
          .subscribe();
    }

    subscribeToShipments();

    return () => {
      if (channel) {
        supabase.removeChannel(
          channel,
        );
      }
    };
  }, []);

  /*
   * =========================================================
   * البحث والفلاتر
   * =========================================================
   */

  const filteredShipments =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return shipments.filter(
        (shipment) => {
          const matchesSearch =
            !searchValue ||
            shipment.tracking_number
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            shipment.receiver_name
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            shipment.receiver_phone
              .toLowerCase()
              .includes(
                searchValue,
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            shipment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      shipments,
      search,
      statusFilter,
    ]);

  /*
   * =========================================================
   * الإحصائيات
   * =========================================================
   */

  const total =
    shipments.length;

  const pending =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "pending" ||
        shipment.status ===
          "processing",
    ).length;

  const inTransit =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "transit" ||
        shipment.status ===
          "in_transit",
    ).length;

  const ready =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "ready" ||
        shipment.status ===
          "ready_for_pickup",
    ).length;

  const delivered =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "delivered" ||
        shipment.status ===
          "completed" ||
        shipment.status ===
          "received",
    ).length;

  return (
    <DashboardShell
      title="شحناتي"
      subtitle="تابع جميع شحناتك وحالتها من مكان واحد."
      nav={[
        {
          label: "لوحة التحكم",
          icon: Package,
          to: "/dashboard",
        },
        {
          label: "شحناتي",
          icon: Package,
          to: "/shipments",
          active: true,
        },
      ]}
      actions={
        <Link
          to="/shipments/new"
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 sm:w-auto"
        >
          <Package className="size-4 shrink-0" />
          <span>إرسال شحنة</span>
        </Link>
      }
    >
      {/* =================================================
          الإحصائيات
      ================================================== */}

      <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-[11px] text-muted-foreground sm:text-xs">
                إجمالي الشحنات
              </p>

              <p className="mt-1.5 text-2xl font-extrabold text-primary sm:mt-2 sm:text-3xl">
                {loading
                  ? "..."
                  : total}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-11">
              <Package className="size-4 text-primary sm:size-5" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-[11px] text-muted-foreground sm:text-xs">
                قيد المعالجة
              </p>

              <p className="mt-1.5 text-2xl font-extrabold text-primary sm:mt-2 sm:text-3xl">
                {loading
                  ? "..."
                  : pending}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-11">
              <Clock3 className="size-4 text-primary sm:size-5" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-[11px] text-muted-foreground sm:text-xs">
                قيد التوصيل
              </p>

              <p className="mt-1.5 text-2xl font-extrabold text-primary sm:mt-2 sm:text-3xl">
                {loading
                  ? "..."
                  : inTransit}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10 sm:size-11">
              <Truck className="size-4 text-secondary sm:size-5" />
            </div>
          </div>
        </Card>

        <Card className="min-w-0 p-4 sm:p-5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-[11px] text-muted-foreground sm:text-xs">
                جاهزة للاستلام
              </p>

              <p className="mt-1.5 text-2xl font-extrabold text-primary sm:mt-2 sm:text-3xl">
                {loading
                  ? "..."
                  : ready}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 sm:size-11">
              <PackageCheck className="size-4 text-accent sm:size-5" />
            </div>
          </div>
        </Card>

        <Card className="col-span-2 min-w-0 p-4 sm:col-span-2 sm:p-5 lg:col-span-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="break-words text-[11px] text-muted-foreground sm:text-xs">
                تم التسليم
              </p>

              <p className="mt-1.5 text-2xl font-extrabold text-primary sm:mt-2 sm:text-3xl">
                {loading
                  ? "..."
                  : delivered}
              </p>
            </div>

            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-500/10 sm:size-11">
              <CheckCircle2 className="size-4 text-green-600 sm:size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* =================================================
          البحث والفلاتر
      ================================================== */}

      <Card className="w-full min-w-0 p-3 sm:p-5">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">

          {/* البحث */}
          <div className="flex min-h-12 w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-background px-3 sm:px-4">
            <Search className="size-5 shrink-0 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="ابحث برقم الشحنة أو اسم المستلم..."
              className="min-w-0 w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* الفلاتر */}
          <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 lg:w-auto lg:flex-wrap lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "all",
                )
              }
              className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
                statusFilter ===
                "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              الكل
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "pending",
                )
              }
              className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
                statusFilter ===
                "pending"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              قيد المعالجة
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "in_transit",
                )
              }
              className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
                statusFilter ===
                "in_transit"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              قيد التوصيل
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "ready_for_pickup",
                )
              }
              className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
                statusFilter ===
                "ready_for_pickup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              جاهزة
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "delivered",
                )
              }
              className={`min-h-10 shrink-0 rounded-xl px-3 text-xs font-bold transition sm:px-4 sm:text-sm ${
                statusFilter ===
                "delivered"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              تم التسليم
            </button>
          </div>
        </div>
      </Card>

      {/* =================================================
          قائمة الشحنات - MOBILE
      ================================================== */}

      <div className="block w-full min-w-0 space-y-3 sm:hidden">
        {loading ? (
          <Card className="p-8 text-center">
            <Clock3 className="mx-auto size-9 animate-pulse text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              جاري تحميل شحناتك...
            </p>
          </Card>
        ) : error ? (
          <Card className="p-6 text-center">
            <Package className="mx-auto size-10 text-red-500" />

            <p className="mt-4 text-sm font-bold text-red-600">
              حدث خطأ أثناء تحميل الشحنات
            </p>

            <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
              {error}
            </p>
          </Card>
        ) : filteredShipments.length ===
          0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              {shipments.length ===
              0
                ? "لا توجد شحنات حتى الآن"
                : "لا توجد نتائج مطابقة"}
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {shipments.length ===
              0
                ? "عند إنشاء شحنة جديدة ستظهر هنا."
                : "جرّب تغيير البحث أو فلتر الحالة."}
            </p>

            {shipments.length ===
              0 && (
              <Link
                to="/shipments/new"
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Package className="size-4" />
                إرسال شحنة
              </Link>
            )}
          </Card>
        ) : (
          filteredShipments.map(
            (shipment) => {
              const price =
                getPricingText(
                  shipment,
                );

              const isPriced =
                shipment.shipping_fee !==
                  null &&
                shipment.pricing_status !==
                  "pending";

              const isPaid =
                shipment.payment_status ===
                "paid";

              return (
                <Link
                  key={shipment.id}
                  to="/shipments/$id"
                  params={{
                    id: shipment.id,
                  }}
                  className="block w-full min-w-0"
                >
                  <Card className="w-full min-w-0 overflow-hidden p-4 transition-all active:scale-[0.99]">

                    {/* رأس البطاقة */}
                    <div className="flex min-w-0 items-start justify-between gap-3">

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          رقم الشحنة
                        </p>

                        <p
                          dir="ltr"
                          className="mt-1 truncate font-mono text-sm font-extrabold text-primary"
                        >
                          {
                            shipment.tracking_number
                          }
                        </p>
                      </div>

                      <div className="shrink-0">
                        <StatusBadge
                          tone={getStatusTone(
                            shipment.status,
                          )}
                        >
                          {getStatusLabel(
                            shipment.status,
                          )}
                        </StatusBadge>
                      </div>
                    </div>

                    {/* المستلم */}
                    <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">

                      <div className="flex min-w-0 items-start gap-2">
                        <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            المستلم
                          </p>

                          <p className="mt-1 truncate text-sm font-bold text-primary">
                            {
                              shipment.receiver_name
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-2">
                        <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            رقم الهاتف
                          </p>

                          <p
                            dir="ltr"
                            className="mt-1 truncate text-xs text-muted-foreground"
                          >
                            {
                              shipment.receiver_phone
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* الوصف */}
                    {shipment.description && (
                      <div className="mt-4 rounded-xl bg-muted/40 px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          وصف الشحنة
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-primary/80">
                          {
                            shipment.description
                          }
                        </p>
                      </div>
                    )}

                    {/* الرسوم والدفع */}
                    <div className="mt-4 grid grid-cols-2 gap-2">

                      <div className="min-w-0 rounded-xl border border-border bg-background p-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4 shrink-0 text-primary" />

                          <p className="text-[10px] font-semibold text-muted-foreground">
                            رسوم الشحن
                          </p>
                        </div>

                        <p className="mt-2 break-words text-xs font-extrabold text-primary">
                          {isPriced
                            ? price
                            : "بانتظار تحديد الرسوم"}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-xl border border-border bg-background p-3">
                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                          ) : (
                            <Clock3 className="size-4 shrink-0 text-amber-600" />
                          )}

                          <p className="text-[10px] font-semibold text-muted-foreground">
                            الدفع
                          </p>
                        </div>

                        <p
                          className={`mt-2 break-words text-xs font-bold ${
                            isPaid
                              ? "text-green-700"
                              : isPriced
                                ? "text-amber-700"
                                : "text-muted-foreground"
                          }`}
                        >
                          {getPaymentText(
                            shipment,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* التاريخ */}
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">

                      <div className="flex min-w-0 items-center gap-2">
                        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-muted-foreground">
                            آخر تحديث
                          </p>

                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {formatDate(
                              shipment.updated_at,
                            )}
                          </p>
                        </div>
                      </div>

                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>

                  </Card>
                </Link>
              );
            },
          )
        )}
      </div>

      {/* =================================================
          قائمة الشحنات - DESKTOP
      ================================================== */}

      <Card className="hidden overflow-hidden sm:block">

        {loading ? (
          <div className="px-5 py-16 text-center">
            <Clock3 className="mx-auto size-9 animate-pulse text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              جاري تحميل شحناتك...
            </p>
          </div>
        ) : error ? (
          <div className="px-5 py-16 text-center">
            <Package className="mx-auto size-10 text-red-500" />

            <p className="mt-4 text-sm font-bold text-red-600">
              حدث خطأ أثناء تحميل الشحنات
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {error}
            </p>
          </div>
        ) : filteredShipments.length ===
          0 ? (
          <div className="px-5 py-16 text-center">
            <Package className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              {shipments.length ===
              0
                ? "لا توجد شحنات حتى الآن"
                : "لا توجد نتائج مطابقة"}
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              {shipments.length ===
              0
                ? "عند إنشاء شحنة جديدة ستظهر هنا."
                : "جرّب تغيير البحث أو فلتر الحالة."}
            </p>

            {shipments.length ===
              0 && (
              <Link
                to="/shipments/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Package className="size-4" />
                إرسال شحنة
              </Link>
            )}
          </div>
        ) : (
          <div className="w-full overflow-x-auto">

            <table
              className="w-full min-w-[1100px] border-collapse text-right"
              dir="rtl"
            >

              <thead>
                <tr className="border-b border-border bg-muted/30">

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    رقم الشحنة
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    المستلم
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    الهاتف
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    رسوم الشحن
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    الدفع
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    التاريخ
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                    الحالة
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-border">

                {filteredShipments.map(
                  (shipment) => {

                    const price =
                      getPricingText(
                        shipment,
                      );

                    const isPriced =
                      shipment.shipping_fee !==
                        null &&
                      shipment.pricing_status !==
                        "pending";

                    const isPaid =
                      shipment.payment_status ===
                      "paid";

                    return (
                      <tr
                        key={shipment.id}
                        className="transition-colors hover:bg-muted/30"
                      >

                        {/* رقم الشحنة */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="block"
                          >
                            <p
                              className="whitespace-nowrap font-mono text-sm font-extrabold text-primary"
                              dir="ltr"
                            >
                              {
                                shipment.tracking_number
                              }
                            </p>

                            <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">
                              أُنشئت:
                            </p>

                            <p className="text-[11px] text-muted-foreground">
                              {formatDate(
                                shipment.created_at,
                              )}
                            </p>
                          </Link>

                        </td>

                        {/* المستلم */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="block min-w-[170px]"
                          >
                            <p className="break-words text-sm font-bold text-primary">
                              {
                                shipment.receiver_name
                              }
                            </p>

                            {shipment.description && (
                              <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                                {
                                  shipment.description
                                }
                              </p>
                            )}
                          </Link>

                        </td>

                        {/* الهاتف */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="block whitespace-nowrap text-sm text-muted-foreground"
                            dir="ltr"
                          >
                            {
                              shipment.receiver_phone
                            }
                          </Link>

                        </td>

                        {/* الرسوم */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="block min-w-[180px]"
                          >

                            {isPriced ? (
                              <div className="flex items-center gap-2">

                                <CreditCard className="size-4 shrink-0 text-primary" />

                                <div>

                                  <p className="text-sm font-extrabold text-primary">
                                    {price}
                                  </p>

                                  <p className="mt-1 text-[10px] text-muted-foreground">
                                    تم تحديد الرسوم من الإدارة
                                  </p>

                                </div>

                              </div>
                            ) : (
                              <div>

                                <p className="text-sm font-bold text-muted-foreground">
                                  بانتظار تحديد الرسوم
                                </p>

                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  ستظهر الرسوم هنا تلقائيًا
                                </p>

                              </div>
                            )}

                          </Link>

                        </td>

                        {/* الدفع */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="block min-w-[140px]"
                          >

                            {isPriced ? (
                              isPaid ? (
                                <div className="flex items-center gap-2">

                                  <CheckCircle2 className="size-4 text-green-600" />

                                  <span className="text-sm font-bold text-green-700">
                                    تم الدفع
                                  </span>

                                </div>
                              ) : (
                                <div className="flex items-center gap-2">

                                  <Clock3 className="size-4 text-amber-600" />

                                  <span className="text-sm font-bold text-amber-700">
                                    بانتظار الدفع
                                  </span>

                                </div>
                              )
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                بانتظار تحديد الرسوم
                              </span>
                            )}

                          </Link>

                        </td>

                        {/* التاريخ */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="flex min-w-[150px] items-center gap-2"
                          >

                            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />

                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {formatDate(
                                shipment.updated_at,
                              )}
                            </span>

                          </Link>

                        </td>

                        {/* الحالة */}
                        <td className="px-5 py-5 align-middle">

                          <Link
                            to="/shipments/$id"
                            params={{
                              id: shipment.id,
                            }}
                            className="inline-block"
                          >

                            <StatusBadge
                              tone={getStatusTone(
                                shipment.status,
                              )}
                            >
                              {getStatusLabel(
                                shipment.status,
                              )}
                            </StatusBadge>

                          </Link>

                        </td>

                      </tr>
                    );
                  },
                )}

              </tbody>

            </table>

          </div>
        )}

      </Card>

      {/* =================================================
          العودة
      ================================================== */}

      <div className="w-full">

        <Link
          to="/dashboard"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-muted/80 sm:w-auto"
        >
          <ArrowRight className="size-4" />
          العودة للوحة التحكم
        </Link>

      </div>
    </DashboardShell>
  );
}