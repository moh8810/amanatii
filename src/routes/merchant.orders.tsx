import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Filter,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
  User,
  WalletCards,
  X,
} from "lucide-react";

import { Card, StatusBadge } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/orders")({
  head: () => ({
    meta: [
      {
        title: "طلبات التاجر | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "إدارة ومتابعة طلبات وشحنات التاجر في أمانتي.",
      },
    ],
  }),
  component: MerchantOrdersPage,
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
  from_city_id: string | null;
  to_city_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type City = {
  id: string;
  name: string;
};

type StatusFilter =
  | "all"
  | "pending"
  | "in_transit"
  | "ready_for_pickup"
  | "delivered"
  | "received";

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
      return "أمانة محفوظة";

    default:
      return status || "غير محدد";
  }
}

function getStatusTone(
  status: string | null,
): "navy" | "teal" | "amber" | "green" {
  switch (status) {
    case "in_transit":
    case "transit":
      return "teal";

    case "ready_for_pickup":
    case "ready":
      return "amber";

    case "received":
    case "collected":
    case "delivered":
    case "completed":
    case "done":
      return "green";

    default:
      return "navy";
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "in_transit":
    case "transit":
      return Truck;

    case "ready_for_pickup":
    case "ready":
      return PackageCheck;

    case "received":
    case "collected":
    case "delivered":
    case "completed":
    case "done":
      return CheckCircle2;

    default:
      return Clock3;
  }
}

function getStatusCardStyle(status: string | null) {
  switch (status) {
    case "in_transit":
    case "transit":
      return {
        box: "bg-teal-50 border-teal-100",
        icon: "bg-teal-100 text-teal-700",
        accent: "bg-teal-500",
      };

    case "ready_for_pickup":
    case "ready":
      return {
        box: "bg-amber-50 border-amber-100",
        icon: "bg-amber-100 text-amber-700",
        accent: "bg-amber-500",
      };

    case "received":
    case "collected":
    case "delivered":
    case "completed":
    case "done":
      return {
        box: "bg-emerald-50 border-emerald-100",
        icon: "bg-emerald-100 text-emerald-700",
        accent: "bg-emerald-500",
      };

    default:
      return {
        box: "bg-primary/5 border-primary/10",
        icon: "bg-primary/10 text-primary",
        accent: "bg-primary",
      };
  }
}

function getPaymentLabel(status: string | null) {
  switch (status) {
    case "paid":
      return "مدفوع";

    case "unpaid":
      return "غير مدفوع";

    case "pending":
      return "قيد الانتظار";

    default:
      return status || "غير محدد";
  }
}

function getPricingLabel(status: string | null) {
  switch (status) {
    case "priced":
      return "تم تحديد السعر";

    case "pending":
      return "بانتظار التسعير";

    default:
      return status || "غير محدد";
  }
}

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getRelativeTime(date: string | null) {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const diff = Date.now() - parsed.getTime();

  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "الآن";
  }

  if (minutes < 60) {
    return `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `منذ ${hours} ساعة`;
  }

  const days = Math.floor(hours / 24);

  if (days < 30) {
    return `منذ ${days} يوم`;
  }

  return formatDate(date);
}

function MerchantOrdersPage() {
  const [shipments, setShipments] = useState<Shipment[]>(
    [],
  );

  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [copiedTracking, setCopiedTracking] =
    useState(false);

  async function loadOrders(showRefreshing = false) {
    if (showRefreshing) {
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
          "يجب تسجيل الدخول للوصول إلى طلبات التاجر.",
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        throw new Error(
          "تعذر التحقق من نوع الحساب.",
        );
      }

      if (profile.role !== "merchant") {
        throw new Error(
          "هذه الصفحة مخصصة لحسابات التجار فقط.",
        );
      }

      const {
        data: shipmentData,
        error: shipmentError,
      } = await supabase
        .from("shipments")
        .select(`
          id,
          tracking_number,
          receiver_name,
          receiver_phone,
          status,
          shipping_fee,
          payment_status,
          pricing_status,
          from_city_id,
          to_city_id,
          created_at,
          updated_at
        `)
        .eq("merchant_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (shipmentError) {
        console.error(
          "MERCHANT ORDERS ERROR:",
          shipmentError,
        );

        throw new Error(
          "تعذر تحميل طلبات التاجر.",
        );
      }

      const { data: cityData, error: cityError } =
        await supabase
          .from("cities")
          .select("id, name");

      if (cityError) {
        console.error(
          "MERCHANT CITIES ERROR:",
          cityError,
        );

        throw new Error(
          "تعذر تحميل بيانات المدن.",
        );
      }

      setShipments(
        (shipmentData || []) as Shipment[],
      );

      setCities((cityData || []) as City[]);
    } catch (loadError) {
      console.error(
        "MERCHANT ORDERS LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل الطلبات.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  const cityMap = useMemo(() => {
    return new Map(
      cities.map((city) => [
        city.id,
        city.name,
      ]),
    );
  }, [cities]);

  const filteredShipments = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesStatus =
        statusFilter === "all" ||
        shipment.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const values = [
        shipment.tracking_number,
        shipment.receiver_name,
        shipment.receiver_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(normalizedSearch);
    });
  }, [shipments, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: shipments.length,

      pending: shipments.filter(
        (shipment) =>
          shipment.status === "pending",
      ).length,

      inTransit: shipments.filter(
        (shipment) =>
          shipment.status === "in_transit" ||
          shipment.status === "transit",
      ).length,

      ready: shipments.filter(
        (shipment) =>
          shipment.status === "ready_for_pickup" ||
          shipment.status === "ready",
      ).length,

      received: shipments.filter(
        (shipment) =>
          shipment.status === "received" ||
          shipment.status === "collected" ||
          shipment.status === "delivered" ||
          shipment.status === "completed" ||
          shipment.status === "done",
      ).length,
    };
  }, [shipments]);

  const paidAmount = useMemo(() => {
    return shipments
      .filter(
        (shipment) =>
          shipment.payment_status === "paid",
      )
      .reduce(
        (sum, shipment) =>
          sum + (shipment.shipping_fee ?? 0),
        0,
      );
  }, [shipments]);

  const totalFees = useMemo(() => {
    return shipments.reduce(
      (sum, shipment) =>
        sum + (shipment.shipping_fee ?? 0),
      0,
    );
  }, [shipments]);

  const activePercentage =
    stats.total > 0
      ? Math.round(
          ((stats.pending +
            stats.inTransit +
            stats.ready) /
            stats.total) *
            100,
        )
      : 0;

  async function copyTracking(
    trackingNumber: string | null,
  ) {
    if (!trackingNumber) {
      return;
    }

    await navigator.clipboard.writeText(
      trackingNumber,
    );

    setCopiedTracking(true);

    window.setTimeout(() => {
      setCopiedTracking(false);
    }, 1600);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <div
      dir="rtl"
      className="space-y-7 pb-10"
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 right-10 size-96 rounded-full bg-white/5 blur-3xl" />

        <div className="pointer-events-none absolute left-1/3 top-1/2 size-32 -translate-y-1/2 rounded-full border border-white/10" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300" />
                  <span className="relative size-2 rounded-full bg-emerald-300" />
                </span>

                نظام الطلبات
              </span>

              <span className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white/70">
                {stats.total.toLocaleString("ar-YE")} شحنة
              </span>
            </div>

            <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              كل طلبات متجرك،
              <br />
              <span className="text-white/65">
                تحت سيطرتك.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              تابع شحناتك لحظة بلحظة، اعثر على أي طلب بسرعة،
              واعرف بالضبط أين وصلت عمليات التوصيل الخاصة
              بمتجرك.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/merchant/shipments/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <Plus className="size-4" />
                إنشاء شحنة جديدة
                <ArrowLeft className="size-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  void loadOrders(true);
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
                تحديث البيانات
              </button>
            </div>
          </div>

          <div className="hidden lg:flex">
            <div className="relative flex size-48 items-center justify-center rounded-[2.75rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
              <div className="absolute inset-4 rounded-[2.25rem] border border-white/10" />

              <div className="absolute inset-8 rounded-[1.75rem] bg-white/5" />

              <div className="relative flex size-24 items-center justify-center rounded-3xl bg-white text-primary shadow-2xl transition duration-500 hover:rotate-3 hover:scale-105">
                <ClipboardList
                  className="size-12"
                  strokeWidth={1.6}
                />
              </div>

              <div className="absolute -right-4 top-8 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <Truck className="size-5 text-emerald-300" />
              </div>

              <div className="absolute -bottom-3 -left-4 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <PackageCheck className="size-5 text-amber-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/45">
              الطلبات النشطة
            </p>

            <p className="mt-1 text-xl font-black">
              {activePercentage}%
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">
              رسوم الشحن المسجلة
            </p>

            <p className="mt-1 text-xl font-black">
              {totalFees.toLocaleString("ar-YE")} ريال
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">
              المحصل
            </p>

            <p className="mt-1 text-xl font-black">
              {paidAmount.toLocaleString("ar-YE")} ريال
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading ? (
        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-6 w-36 animate-pulse rounded-lg bg-muted" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl bg-muted/60"
                  />
                ),
              )}
            </div>

            <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />

            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-48 animate-pulse rounded-2xl bg-muted/50"
                  />
                ),
              )}
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="overflow-hidden p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <ClipboardList className="size-8" />
            </div>

            <h3 className="mt-5 text-lg font-black text-primary">
              تعذر تحميل الطلبات
            </h3>

            <p className="mt-2 text-sm leading-7 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadOrders(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* =====================================================
              STATS
          ===================================================== */}

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">
                  نظرة سريعة
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  حالة عمليات متجرك في لحظة واحدة.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "إجمالي الطلبات",
                  value: stats.total,
                  icon: ClipboardList,
                  style:
                    "bg-primary/5 text-primary border-primary/10",
                },
                {
                  label: "قيد المعالجة",
                  value: stats.pending,
                  icon: Clock3,
                  style:
                    "bg-slate-50 text-slate-700 border-slate-100",
                },
                {
                  label: "قيد الشحن",
                  value: stats.inTransit,
                  icon: Truck,
                  style:
                    "bg-teal-50 text-teal-700 border-teal-100",
                },
                {
                  label: "جاهزة للاستلام",
                  value: stats.ready,
                  icon: PackageCheck,
                  style:
                    "bg-amber-50 text-amber-700 border-amber-100",
                },
                {
                  label: "تم الاستلام",
                  value: stats.received,
                  icon: CheckCircle2,
                  style:
                    "bg-emerald-50 text-emerald-700 border-emerald-100",
                },
              ].map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (index === 0) {
                      setStatusFilter("all");
                    }

                    if (index === 1) {
                      setStatusFilter("pending");
                    }

                    if (index === 2) {
                      setStatusFilter("in_transit");
                    }

                    if (index === 3) {
                      setStatusFilter(
                        "ready_for_pickup",
                      );
                    }

                    if (index === 4) {
                      setStatusFilter("received");
                    }

                    window.setTimeout(() => {
                      document
                        .getElementById(
                          "merchant-orders-list",
                        )
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }, 50);
                  }}
                  className="group text-right"
                >
                  <Card
                    className={`relative overflow-hidden border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${item.style}`}
                  >
                    <div className="absolute -left-8 -top-8 size-24 rounded-full bg-white/60 blur-2xl transition duration-500 group-hover:scale-150" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">
                          {item.label}
                        </p>

                        <p className="mt-3 text-3xl font-black text-primary transition duration-300 group-hover:scale-105 origin-right">
                          {item.value.toLocaleString(
                            "ar-YE",
                          )}
                        </p>
                      </div>

                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/80 shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                        <item.icon className="size-5" />
                      </div>
                    </div>

                    <div className="relative mt-4 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                      <span>عرض الطلبات</span>
                      <ArrowLeft className="size-3 transition group-hover:-translate-x-1" />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>

          {/* =====================================================
              SEARCH + FILTER
          ===================================================== */}

          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -left-20 -top-20 size-48 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Filter className="size-4" />
                    </div>

                    <h3 className="text-base font-black text-primary">
                      ابحث وفلتر طلباتك
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    ابحث برقم الشحنة أو اسم المستلم أو رقم
                    الهاتف.
                  </p>
                </div>

                {(search ||
                  statusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="self-start rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-primary"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="رقم الشحنة، اسم المستلم، رقم الهاتف..."
                    className="h-13 w-full rounded-2xl border border-border bg-muted/20 py-3 pe-12 ps-12 text-sm font-medium text-primary outline-none transition duration-300 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-primary"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="h-13 rounded-2xl border border-border bg-muted/20 px-5 text-sm font-bold text-primary outline-none transition focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                >
                  <option value="all">
                    جميع الحالات
                  </option>

                  <option value="pending">
                    قيد المعالجة
                  </option>

                  <option value="in_transit">
                    قيد الشحن
                  </option>

                  <option value="ready_for_pickup">
                    جاهزة للاستلام
                  </option>

                  <option value="delivered">
                    تم التسليم
                  </option>

                  <option value="received">
                    تم الاستلام
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    void loadOrders(true);
                  }}
                  disabled={refreshing}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-primary transition duration-300 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md disabled:opacity-50"
                >
                  <RefreshCw
                    className={`size-4 ${
                      refreshing
                        ? "animate-spin"
                        : ""
                    }`}
                  />

                  تحديث
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  {
                    value: "all" as StatusFilter,
                    label: "الكل",
                  },
                  {
                    value: "pending" as StatusFilter,
                    label: "قيد المعالجة",
                  },
                  {
                    value: "in_transit" as StatusFilter,
                    label: "قيد الشحن",
                  },
                  {
                    value:
                      "ready_for_pickup" as StatusFilter,
                    label: "جاهزة للاستلام",
                  },
                  {
                    value: "delivered" as StatusFilter,
                    label: "تم التسليم",
                  },
                  {
                    value: "received" as StatusFilter,
                    label: "تم الاستلام",
                  },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(filter.value)
                    }
                    className={`rounded-xl px-3.5 py-2 text-xs font-black transition duration-300 ${
                      statusFilter === filter.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* =====================================================
              ORDERS
          ===================================================== */}

          <section id="merchant-orders-list">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">
                  طلبات متجرك
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredShipments.length.toLocaleString(
                    "ar-YE",
                  )}{" "}
                  نتيجة من أصل{" "}
                  {shipments.length.toLocaleString(
                    "ar-YE",
                  )}{" "}
                  شحنة
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-bold text-muted-foreground sm:flex">
                <ClipboardList className="size-3.5" />
                أحدث الطلبات أولًا
              </div>
            </div>

            {filteredShipments.length === 0 ? (
              <Card className="relative overflow-hidden p-10 sm:p-14">
                <div className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative mx-auto max-w-md text-center">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] bg-primary/5 text-primary shadow-inner">
                    <Package className="size-9" />
                  </div>

                  <h4 className="mt-6 text-xl font-black text-primary">
                    لا توجد طلبات هنا
                  </h4>

                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {shipments.length === 0
                      ? "لم يتم إنشاء أي شحنات لهذا المتجر حتى الآن."
                      : "لا توجد نتائج تطابق البحث أو الفلتر الحالي."}
                  </p>

                  {shipments.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <RefreshCw className="size-4" />
                      عرض جميع الطلبات
                    </button>
                  ) : (
                    <Link
                      to="/merchant/shipments/new"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <Plus className="size-4" />
                      إنشاء أول شحنة
                    </Link>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredShipments.map(
                  (shipment, index) => {
                    const style =
                      getStatusCardStyle(
                        shipment.status,
                      );

                    const StatusIcon =
                      getStatusIcon(
                        shipment.status,
                      );

                    const fromCity =
                      cityMap.get(
                        shipment.from_city_id || "",
                      ) || "—";

                    const toCity =
                      cityMap.get(
                        shipment.to_city_id || "",
                      ) || "—";

                    return (
                      <Card
                        key={shipment.id}
                        className="group relative overflow-hidden p-0 transition duration-500 hover:-translate-y-1 hover:shadow-2xl"
                        style={{
                          animationDelay: `${Math.min(
                            index * 45,
                            450,
                          )}ms`,
                        }}
                      >
                        <div
                          className={`absolute right-0 top-0 h-full w-1 ${style.accent}`}
                        />

                        <div className="p-5 sm:p-6">
                          {/* TOP */}

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition duration-500 group-hover:rotate-6 group-hover:scale-110 ${style.icon}`}
                              >
                                <StatusIcon className="size-6" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-mono text-sm font-black text-primary">
                                    {shipment.tracking_number ||
                                      shipment.id}
                                  </p>

                                  {shipment.tracking_number && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void copyTracking(
                                          shipment.tracking_number,
                                        )
                                      }
                                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                                      title="نسخ رقم التتبع"
                                    >
                                      {copiedTracking ? (
                                        <Check className="size-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="size-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {getRelativeTime(
                                    shipment.updated_at ||
                                      shipment.created_at,
                                  )}
                                </p>
                              </div>
                            </div>

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

                          {/* ROUTE */}

                          <div className="relative mt-6 rounded-2xl bg-muted/30 p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
                                <MapPin className="size-4" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-muted-foreground">
                                  مسار الشحنة
                                </p>

                                <div className="mt-1 flex min-w-0 items-center gap-2">
                                  <span className="truncate text-sm font-black text-primary">
                                    {fromCity}
                                  </span>

                                  <div className="flex min-w-10 flex-1 items-center gap-1">
                                    <span className="h-px flex-1 border-t border-dashed border-border" />

                                    <Truck className="size-3.5 shrink-0 text-muted-foreground" />

                                    <span className="h-px flex-1 border-t border-dashed border-border" />
                                  </div>

                                  <span className="truncate text-sm font-black text-primary">
                                    {toCity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* RECEIVER */}

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-border bg-background p-4 transition duration-300 group-hover:border-primary/10">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <User className="size-4" />

                                <span className="text-[10px] font-bold">
                                  المستلم
                                </span>
                              </div>

                              <p className="mt-2 truncate text-sm font-black text-primary">
                                {shipment.receiver_name ||
                                  "غير محدد"}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-border bg-background p-4 transition duration-300 group-hover:border-primary/10">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <CreditCard className="size-4" />

                                <span className="text-[10px] font-bold">
                                  رسوم الشحن
                                </span>
                              </div>

                              <p className="mt-2 text-sm font-black text-primary">
                                {shipment.shipping_fee !==
                                null
                                  ? `${shipment.shipping_fee.toLocaleString(
                                      "ar-YE",
                                    )} ريال`
                                  : "لم تحدد بعد"}
                              </p>
                            </div>
                          </div>

                          {/* FOOTER */}

                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${
                                  shipment.pricing_status ===
                                  "priced"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {getPricingLabel(
                                  shipment.pricing_status,
                                )}
                              </span>

                              <span
                                className={`rounded-lg px-2.5 py-1.5 text-[10px] font-black ${
                                  shipment.payment_status ===
                                  "paid"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {getPaymentLabel(
                                  shipment.payment_status,
                                )}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedShipment(
                                  shipment,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              عرض التفاصيل
                              <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedShipment && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedShipment(null)
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-background shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HERO */}

            <div className="relative overflow-hidden rounded-t-[2rem] bg-primary p-6 text-primary-foreground sm:p-7">
              <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                    <Package className="size-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/50">
                      تفاصيل الشحنة
                    </p>

                    <h3 className="mt-1 font-mono text-lg font-black">
                      {selectedShipment.tracking_number ||
                        selectedShipment.id}
                    </h3>

                    <p className="mt-1 text-[11px] text-white/55">
                      {getStatusLabel(
                        selectedShipment.status,
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedShipment(null)
                  }
                  className="flex size-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              {/* STATUS */}

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground">
                      حالة الشحنة الحالية
                    </p>

                    <p className="mt-1 text-lg font-black text-primary">
                      {getStatusLabel(
                        selectedShipment.status,
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    tone={getStatusTone(
                      selectedShipment.status,
                    )}
                  >
                    {getStatusLabel(
                      selectedShipment.status,
                    )}
                  </StatusBadge>
                </div>

                <div className="mt-5 flex items-center gap-1">
                  {[
                    "pending",
                    "in_transit",
                    "ready_for_pickup",
                    "delivered",
                  ].map((status, index) => {
                    const current =
                      selectedShipment.status;

                    const active =
                      status === current ||
                      (status === "delivered" &&
                        [
                          "delivered",
                          "completed",
                          "done",
                          "received",
                          "collected",
                        ].includes(
                          current || "",
                        )) ||
                      (status ===
                        "ready_for_pickup" &&
                        [
                          "ready",
                          "ready_for_pickup",
                        ].includes(
                          current || "",
                        )) ||
                      (status === "in_transit" &&
                        [
                          "in_transit",
                          "transit",
                        ].includes(
                          current || "",
                        ));

                    return (
                      <div
                        key={status}
                        className="flex min-w-0 flex-1 items-center"
                      >
                        <div
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full transition ${
                            active
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {active ? (
                            <Check className="size-3.5" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-current" />
                          )}
                        </div>

                        {index < 3 && (
                          <div
                            className={`mx-1 h-0.5 flex-1 rounded-full ${
                              active
                                ? "bg-primary/40"
                                : "bg-border"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>المعالجة</span>
                  <span>الشحن</span>
                  <span>الاستلام</span>
                  <span>التسليم</span>
                </div>
              </div>

              {/* RECEIVER */}

              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBox
                  icon={<User className="size-4" />}
                  label="اسم المستلم"
                  value={
                    selectedShipment.receiver_name ||
                    "غير محدد"
                  }
                />

                <InfoBox
                  icon={<PhoneIcon />}
                  label="رقم الهاتف"
                  value={
                    selectedShipment.receiver_phone ||
                    "غير محدد"
                  }
                  dir="ltr"
                />

                <InfoBox
                  icon={<MapPin className="size-4" />}
                  label="مدينة الإرسال"
                  value={
                    cityMap.get(
                      selectedShipment.from_city_id ||
                        "",
                    ) || "غير محدد"
                  }
                />

                <InfoBox
                  icon={<MapPin className="size-4" />}
                  label="مدينة الوصول"
                  value={
                    cityMap.get(
                      selectedShipment.to_city_id ||
                        "",
                    ) || "غير محدد"
                  }
                />
              </div>

              {/* FINANCIAL */}

              <div>
                <div className="mb-3 flex items-center gap-2">
                  <WalletCards className="size-4 text-primary" />

                  <h4 className="text-sm font-black text-primary">
                    المعلومات المالية
                  </h4>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <FinancialBox
                    label="رسوم الشحن"
                    value={
                      selectedShipment.shipping_fee !==
                      null
                        ? `${selectedShipment.shipping_fee.toLocaleString(
                            "ar-YE",
                          )} ريال`
                        : "غير محددة"
                    }
                  />

                  <FinancialBox
                    label="التسعير"
                    value={getPricingLabel(
                      selectedShipment.pricing_status,
                    )}
                  />

                  <FinancialBox
                    label="الدفع"
                    value={getPaymentLabel(
                      selectedShipment.payment_status,
                    )}
                  />
                </div>
              </div>

              {/* DATES */}

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock3 className="size-4" />

                      <span className="text-[10px] font-bold">
                        تاريخ إنشاء الطلب
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-bold text-primary">
                      {formatDate(
                        selectedShipment.created_at,
                      )}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RefreshCw className="size-4" />

                      <span className="text-[10px] font-bold">
                        آخر تحديث
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-bold text-primary">
                      {formatDate(
                        selectedShipment.updated_at ||
                          selectedShipment.created_at,
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedShipment.tracking_number && (
                  <button
                    type="button"
                    onClick={() =>
                      void copyTracking(
                        selectedShipment.tracking_number,
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-primary transition hover:bg-muted"
                  >
                    {copiedTracking ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}

                    {copiedTracking
                      ? "تم نسخ رقم التتبع"
                      : "نسخ رقم التتبع"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedShipment(null)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  إغلاق التفاصيل
                  <CheckCircle2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-[10px] font-bold">
          {label}
        </span>
      </div>

      <p
        dir={dir}
        className="mt-2 truncate text-sm font-black text-primary"
      >
        {value}
      </p>
    </div>
  );
}

function FinancialBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[10px] font-bold text-muted-foreground">
        {label}
      </p>

      <p className="mt-2 truncate text-sm font-black text-primary">
        {value}
      </p>
    </div>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-4"
      aria-hidden="true"
    >
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z"
      />
    </svg>
  );
}