import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileBarChart,
  Loader2,
  Package,
  RefreshCw,
  TrendingUp,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/reports")({
  head: () => ({
    meta: [
      {
        title: "التقارير | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "تحليل أداء المتجر والشحنات والمدفوعات من خلال تقارير واضحة.",
      },
    ],
  }),
  component: MerchantReportsPage,
});

type Shipment = {
  id: string;
  tracking_number: string | null;
  receiver_name: string | null;
  status: string | null;
  shipping_fee: number | null;
  payment_status: string | null;
  pricing_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  from_city: {
    name: string;
  } | null;
  to_city: {
    name: string;
  } | null;
};

type PeriodType = "7days" | "30days" | "all";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-YE")} ريال`;
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-YE");
}

function getStatusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "قيد المعالجة";

    case "in_transit":
    case "transit":
      return "قيد الشحن";

    case "ready":
    case "ready_for_pickup":
      return "جاهزة للاستلام";

    case "delivered":
    case "completed":
    case "done":
      return "تم التسليم";

    case "received":
    case "collected":
      return "تم الاستلام";

    case "stored":
    case "stored_amanat":
      return "أمانة محفوظة";

    default:
      return status || "غير محدد";
  }
}

function isCompleted(status: string | null) {
  return (
    status === "delivered" ||
    status === "completed" ||
    status === "done" ||
    status === "received" ||
    status === "collected"
  );
}

function isActive(status: string | null) {
  return (
    status === "in_transit" ||
    status === "transit" ||
    status === "ready" ||
    status === "ready_for_pickup"
  );
}

function isPending(status: string | null) {
  return status === "pending";
}

function formatShortDate(dateValue: string) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat("ar-YE", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

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

function getDateDaysAgo(days: number) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);

  return date;
}

function MerchantReportsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [period, setPeriod] =
    useState<PeriodType>("7days");

  async function loadReports(showRefreshing = false) {
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
          "يجب تسجيل الدخول للوصول إلى التقارير.",
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "MERCHANT REPORTS PROFILE ERROR:",
          profileError,
        );

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
        data,
        error: shipmentError,
      } = await supabase
        .from("shipments")
        .select(`
          id,
          tracking_number,
          receiver_name,
          status,
          shipping_fee,
          payment_status,
          pricing_status,
          created_at,
          updated_at,
          from_city:cities!from_city_id (
            name
          ),
          to_city:cities!to_city_id (
            name
          )
        `)
        .eq("merchant_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (shipmentError) {
        console.error(
          "MERCHANT REPORTS ERROR:",
          shipmentError,
        );

        throw new Error(
          "تعذر تحميل تقارير المتجر.",
        );
      }

      setShipments(
        (data ?? []) as Shipment[],
      );
    } catch (loadError) {
      console.error(
        "MERCHANT REPORTS LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل التقارير.",
      );

      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadReports();
  }, []);

  const financialShipments = useMemo(
    () =>
      shipments.filter(
        (shipment) =>
          shipment.shipping_fee !== null &&
          shipment.shipping_fee !== undefined,
      ),
    [shipments],
  );

  const filteredShipments = useMemo(() => {
    if (period === "all") {
      return financialShipments;
    }

    const days = period === "7days" ? 7 : 30;
    const startDate = getDateDaysAgo(days - 1);

    return financialShipments.filter(
      (shipment) => {
        if (!shipment.created_at) {
          return false;
        }

        return (
          new Date(shipment.created_at) >=
          startDate
        );
      },
    );
  }, [financialShipments, period]);

  const totalShipments =
    filteredShipments.length;

  const completedShipments =
    filteredShipments.filter((shipment) =>
      isCompleted(shipment.status),
    ).length;

  const activeShipments =
    filteredShipments.filter((shipment) =>
      isActive(shipment.status),
    ).length;

  const pendingShipments =
    filteredShipments.filter((shipment) =>
      isPending(shipment.status),
    ).length;

  const totalFees = filteredShipments.reduce(
    (total, shipment) =>
      total +
      Number(shipment.shipping_fee ?? 0),
    0,
  );

  const paidFees = filteredShipments
    .filter(
      (shipment) =>
        shipment.payment_status === "paid",
    )
    .reduce(
      (total, shipment) =>
        total +
        Number(shipment.shipping_fee ?? 0),
      0,
    );

  const unpaidFees = filteredShipments
    .filter(
      (shipment) =>
        shipment.payment_status !== "paid",
    )
    .reduce(
      (total, shipment) =>
        total +
        Number(shipment.shipping_fee ?? 0),
      0,
    );

  const collectionRate =
    totalFees > 0
      ? Math.round(
          (paidFees / totalFees) * 100,
        )
      : 0;

  const averageFee =
    totalShipments > 0
      ? Math.round(totalFees / totalShipments)
      : 0;

  const completionRate =
    totalShipments > 0
      ? Math.round(
          (completedShipments /
            totalShipments) *
            100,
        )
      : 0;

  const chartData = useMemo(() => {
    const days =
      period === "7days"
        ? 7
        : period === "30days"
          ? 14
          : 14;

    const result: {
      date: string;
      label: string;
      shipments: number;
      paid: number;
      fees: number;
    }[] = [];

    for (let index = days - 1; index >= 0; index--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);

      const nextDate = new Date(date);
      nextDate.setDate(
        nextDate.getDate() + 1,
      );

      const dayShipments =
        filteredShipments.filter(
          (shipment) => {
            if (!shipment.created_at) {
              return false;
            }

            const created =
              new Date(shipment.created_at);

            return (
              created >= date &&
              created < nextDate
            );
          },
        );

      const fees = dayShipments.reduce(
        (total, shipment) =>
          total +
          Number(shipment.shipping_fee ?? 0),
        0,
      );

      const paid = dayShipments
        .filter(
          (shipment) =>
            shipment.payment_status === "paid",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );

      result.push({
        date: date.toISOString(),
        label: formatShortDate(
          date.toISOString(),
        ),
        shipments: dayShipments.length,
        paid,
        fees,
      });
    }

    return result;
  }, [filteredShipments, period]);

  const maxChartFees = Math.max(
    ...chartData.map((item) => item.fees),
    1,
  );

  const statusData = [
    {
      label: "مكتملة",
      value: completedShipments,
      percentage:
        totalShipments > 0
          ? Math.round(
              (completedShipments /
                totalShipments) *
                100,
            )
          : 0,
      icon: CheckCircle2,
      className:
        "bg-emerald-50 text-emerald-700",
      barClass: "bg-emerald-500",
    },
    {
      label: "قيد الشحن",
      value: activeShipments,
      percentage:
        totalShipments > 0
          ? Math.round(
              (activeShipments /
                totalShipments) *
                100,
            )
          : 0,
      icon: Activity,
      className: "bg-sky-50 text-sky-700",
      barClass: "bg-sky-500",
    },
    {
      label: "قيد المعالجة",
      value: pendingShipments,
      percentage:
        totalShipments > 0
          ? Math.round(
              (pendingShipments /
                totalShipments) *
                100,
            )
          : 0,
      icon: Clock3,
      className:
        "bg-amber-50 text-amber-700",
      barClass: "bg-amber-500",
    },
  ];

  const topRoutes = useMemo(() => {
    const routeMap = new Map<
      string,
      {
        from: string;
        to: string;
        count: number;
        fees: number;
      }
    >();

    for (const shipment of filteredShipments) {
      const from =
        shipment.from_city?.name || "غير محدد";

      const to =
        shipment.to_city?.name || "غير محدد";

      const key = `${from}__${to}`;

      const existing = routeMap.get(key);

      if (!existing) {
        routeMap.set(key, {
          from,
          to,
          count: 1,
          fees: Number(
            shipment.shipping_fee ?? 0,
          ),
        });
      } else {
        existing.count += 1;
        existing.fees += Number(
          shipment.shipping_fee ?? 0,
        );
      }
    }

    return Array.from(routeMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredShipments]);

  const recentShipments =
    filteredShipments.slice(0, 5);

  function exportReport() {
    const rows = [
      [
        "رقم الشحنة",
        "العميل",
        "الحالة",
        "حالة الدفع",
        "رسوم الشحن",
        "التاريخ",
      ],
      ...filteredShipments.map(
        (shipment) => [
          shipment.tracking_number ||
            shipment.id,
          shipment.receiver_name ||
            "عميل بدون اسم",
          getStatusLabel(shipment.status),
          shipment.payment_status === "paid"
            ? "تم الدفع"
            : shipment.payment_status ===
                "pending"
              ? "قيد الدفع"
              : "غير مدفوع",
          String(
            Number(
              shipment.shipping_fee ?? 0,
            ),
          ),
          formatDate(
            shipment.created_at,
          ),
        ],
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(","),
      )
      .join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = `amanati-report-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* =====================================================
          HERO
      ===================================================== */}
      <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-primary-foreground shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 right-1/3 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="pointer-events-none absolute bottom-5 left-8 grid grid-cols-5 gap-2 opacity-20">
          {Array.from({ length: 25 }).map(
            (_, index) => (
              <span
                key={index}
                className="size-1 rounded-full bg-white"
              />
            ),
          )}
        </div>

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <BarChart3 className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-white/60">
                  مركز التحليلات
                </p>

                <h2 className="mt-0.5 text-2xl font-extrabold sm:text-3xl">
                  التقارير
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/70">
              حوّل بيانات متجرك إلى قرارات أفضل.
              راقب الشحنات والتحصيلات والأداء
              المالي من لوحة واحدة واضحة.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <span className="text-[10px] font-bold text-white/55">
                  نسبة الإنجاز
                </span>

                <p className="mt-1 text-lg font-extrabold">
                  {completionRate}%
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <span className="text-[10px] font-bold text-white/55">
                  نسبة التحصيل
                </span>

                <p className="mt-1 text-lg font-extrabold">
                  {collectionRate}%
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <span className="text-[10px] font-bold text-white/55">
                  متوسط الرسوم
                </span>

                <p className="mt-1 text-lg font-extrabold">
                  {formatMoney(averageFee)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void loadReports(true)
              }
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-white/10 transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
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

            <button
              type="button"
              onClick={exportReport}
              disabled={
                loading ||
                filteredShipments.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-primary shadow-lg transition duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" />
              تصدير التقرير
            </button>
          </div>
        </div>
      </Card>

      {/* =====================================================
          اختيار الفترة
      ===================================================== */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-primary">
            نظرة عامة على الأداء
          </h3>

          <p className="mt-1 text-xs text-muted-foreground">
            مؤشرات حية مبنية على شحنات متجرك.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
          {(
            [
              ["7days", "آخر 7 أيام"],
              ["30days", "آخر 30 يوم"],
              ["all", "كل البيانات"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setPeriod(value)
              }
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition duration-200 ${
                period === value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* =====================================================
          KPI CARDS
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                إجمالي الشحنات
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary">
                {loading
                  ? "..."
                  : formatNumber(
                      totalShipments,
                    )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                ضمن الفترة المحددة
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 transition duration-300 group-hover:scale-110 group-hover:bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-emerald-50 transition-transform duration-500 group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                رسوم الشحن
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(totalFees)}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                القيمة الإجمالية للرسوم
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 transition duration-300 group-hover:scale-110">
              <WalletCards className="size-5 text-emerald-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-sky-50 transition-transform duration-500 group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                تم التحصيل
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-sky-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(paidFees)}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {formatNumber(collectionRate)}%
                من الرسوم
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 transition duration-300 group-hover:scale-110">
              <ArrowDownLeft className="size-5 text-sky-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="pointer-events-none absolute -left-10 -top-10 size-28 rounded-full bg-amber-50 transition-transform duration-500 group-hover:scale-125" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                غير المحصل
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-amber-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(unpaidFees)}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                مبالغ تحتاج متابعة
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 transition duration-300 group-hover:scale-110">
              <Zap className="size-5 text-amber-700" />
            </div>
          </div>
        </Card>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadReports(true)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm transition hover:-translate-y-0.5"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          الرسم البياني
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <TrendingUp className="size-5 text-primary" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-primary">
                  حركة الشحنات والرسوم
                </h3>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  متابعة النشاط المالي والتشغيلي خلال الفترة
                  المحددة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                رسوم الشحن
              </span>

              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                المحصل
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[340px] items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="size-7 animate-spin text-primary" />

              <p className="mt-4 text-sm font-bold text-primary">
                جاري تجهيز التحليلات...
              </p>
            </div>
          </div>
        ) : totalShipments === 0 ? (
          <div className="flex min-h-[340px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5">
              <BarChart3 className="size-7 text-primary/60" />
            </div>

            <p className="mt-4 text-sm font-extrabold text-primary">
              لا توجد بيانات كافية للرسم البياني
            </p>

            <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground">
              عند إنشاء شحنات جديدة ستظهر هنا حركة
              الأداء المالي والتشغيلي لمتجرك.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            <div className="flex h-[300px] items-end gap-1.5 overflow-hidden sm:gap-3">
              {chartData.map((item) => {
                const height =
                  item.fees > 0
                    ? Math.max(
                        8,
                        Math.round(
                          (item.fees /
                            maxChartFees) *
                            100,
                        ),
                      )
                    : 3;

                const paidHeight =
                  item.paid > 0
                    ? Math.max(
                        5,
                        Math.round(
                          (item.paid /
                            maxChartFees) *
                            100,
                        ),
                      )
                    : 2;

                return (
                  <div
                    key={item.date}
                    className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="relative flex h-full w-full max-w-10 items-end justify-center gap-1">
                      <div
                        className="relative w-2.5 rounded-t-md bg-primary/15 transition-all duration-500 group-hover:bg-primary/30 sm:w-3"
                        style={{
                          height: `${height}%`,
                        }}
                        title={`${formatMoney(
                          item.fees,
                        )}`}
                      >
                        <div
                          className="absolute inset-x-0 bottom-0 rounded-t-md bg-primary transition-all duration-500"
                          style={{
                            height: `${paidHeight}%`,
                          }}
                        />
                      </div>
                    </div>

                    <span className="max-w-12 truncate text-[9px] font-bold text-muted-foreground sm:text-[10px]">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-[10px] font-bold text-muted-foreground">
                  إجمالي الرسوم
                </p>

                <p className="mt-2 text-lg font-extrabold text-primary">
                  {formatMoney(totalFees)}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-[10px] font-bold text-emerald-700">
                  المحصل
                </p>

                <p className="mt-2 text-lg font-extrabold text-emerald-700">
                  {formatMoney(paidFees)}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-[10px] font-bold text-amber-700">
                  غير المحصل
                </p>

                <p className="mt-2 text-lg font-extrabold text-amber-700">
                  {formatMoney(unpaidFees)}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-[10px] font-bold text-sky-700">
                  متوسط الشحنة
                </p>

                <p className="mt-2 text-lg font-extrabold text-sky-700">
                  {formatMoney(averageFee)}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* =====================================================
          توزيع الحالات + نسبة التحصيل
      ===================================================== */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
              <Activity className="size-5 text-primary" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-primary">
                حالة الشحنات
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                توزيع الشحنات حسب حالتها الحالية.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {statusData.map(
              ({
                label,
                value,
                percentage,
                icon: Icon,
                className,
                barClass,
              }) => (
                <div key={label}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex size-9 items-center justify-center rounded-xl ${className}`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <span className="text-xs font-bold text-primary">
                        {label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-primary">
                        {formatNumber(value)}
                      </span>

                      <span className="text-[10px] font-bold text-muted-foreground">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${barClass}`}
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground">
            <div>
              <p className="text-[10px] font-bold text-white/60">
                معدل الإنجاز
              </p>

              <p className="mt-1 text-2xl font-extrabold">
                {completionRate}%
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50">
              <WalletCards className="size-5 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-primary">
                التحصيل المالي
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                صورة واضحة عن الرسوم المحصلة وغير المحصلة.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground">
                  نسبة التحصيل
                </p>

                <p className="mt-2 text-4xl font-extrabold tracking-tight text-primary">
                  {collectionRate}%
                </p>
              </div>

              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
                <TrendingUp className="size-7 text-emerald-700" />
              </div>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${collectionRate}%`,
                }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-[10px] font-bold text-muted-foreground">
                  تم التحصيل
                </p>

                <p className="mt-2 text-lg font-extrabold text-emerald-700">
                  {formatMoney(paidFees)}
                </p>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <p className="text-[10px] font-bold text-muted-foreground">
                  غير المحصل
                </p>

                <p className="mt-2 text-lg font-extrabold text-amber-700">
                  {formatMoney(unpaidFees)}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          أكثر المسارات نشاطاً
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50">
              <Zap className="size-5 text-sky-700" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-primary">
                أكثر المسارات نشاطًا
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                المسارات التي تشهد أكبر عدد من الشحنات.
              </p>
            </div>
          </div>
        </div>

        {topRoutes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-muted-foreground">
              لا توجد بيانات مسارات حتى الآن.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {topRoutes.map(
              (route, index) => {
                const percentage =
                  topRoutes[0].count > 0
                    ? Math.round(
                        (route.count /
                          topRoutes[0].count) *
                          100,
                      )
                    : 0;

                return (
                  <div
                    key={`${route.from}-${route.to}`}
                    className="group flex flex-col gap-4 px-5 py-4 transition-all duration-200 hover:bg-muted/30 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-3 sm:w-72">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-xs font-extrabold text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                        {formatNumber(index + 1)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-primary">
                          {route.from}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          إلى {route.to}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          النشاط
                        </span>

                        <span className="text-xs font-extrabold text-primary">
                          {formatNumber(
                            route.count,
                          )}{" "}
                          شحنة
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="shrink-0 text-left sm:w-32">
                      <p className="text-[10px] font-bold text-muted-foreground">
                        الرسوم
                      </p>

                      <p className="mt-1 text-sm font-extrabold text-primary">
                        {formatMoney(route.fees)}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </Card>

      {/* =====================================================
          أحدث العمليات
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <FileBarChart className="size-5 text-primary" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-primary">
                  أحدث العمليات
                </h3>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  آخر الشحنات المسجلة في التقرير.
                </p>
              </div>
            </div>

            <span className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary">
              {formatNumber(
                recentShipments.length,
              )}{" "}
              عمليات
            </span>
          </div>
        </div>

        {recentShipments.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <FileBarChart className="size-7 text-muted-foreground" />
            </div>

            <p className="mt-4 text-sm font-extrabold text-primary">
              لا توجد عمليات لعرضها
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              ستظهر أحدث العمليات هنا عند توفر البيانات.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      الشحنة
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      العميل
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      المبلغ
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      الحالة
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      التاريخ
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {recentShipments.map(
                    (shipment) => (
                      <tr
                        key={shipment.id}
                        className="group border-b border-border transition-all duration-200 last:border-b-0 hover:bg-muted/25"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 transition duration-300 group-hover:scale-105 group-hover:bg-primary/10">
                              <Package className="size-4 text-primary" />
                            </div>

                            <span className="font-mono text-xs font-extrabold text-primary">
                              {shipment.tracking_number ||
                                shipment.id}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-primary">
                            {shipment.receiver_name ||
                              "عميل بدون اسم"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-extrabold text-primary">
                            {formatMoney(
                              Number(
                                shipment.shipping_fee ??
                                  0,
                              ),
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-extrabold ${
                              isCompleted(
                                shipment.status,
                              )
                                ? "bg-emerald-50 text-emerald-700"
                                : isActive(
                                      shipment.status,
                                    )
                                  ? "bg-sky-50 text-sky-700"
                                  : isPending(
                                        shipment.status,
                                      )
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isCompleted(
                              shipment.status,
                            ) ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : isActive(
                                  shipment.status,
                                ) ? (
                              <Activity className="size-3.5" />
                            ) : isPending(
                                  shipment.status,
                                ) ? (
                              <Clock3 className="size-3.5" />
                            ) : (
                              <XCircle className="size-3.5" />
                            )}

                            {getStatusLabel(
                              shipment.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <CalendarDays className="size-3.5" />

                            {formatDate(
                              shipment.created_at,
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border md:hidden">
              {recentShipments.map(
                (shipment) => (
                  <div
                    key={shipment.id}
                    className="p-5 transition hover:bg-muted/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                        <Package className="size-5 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs font-extrabold text-primary">
                          {shipment.tracking_number ||
                            shipment.id}
                        </p>

                        <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                          {shipment.receiver_name ||
                            "عميل بدون اسم"}
                        </p>
                      </div>

                      <span className="text-sm font-extrabold text-primary">
                        {formatMoney(
                          Number(
                            shipment.shipping_fee ??
                              0,
                          ),
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${
                          isCompleted(
                            shipment.status,
                          )
                            ? "bg-emerald-50 text-emerald-700"
                            : isActive(
                                  shipment.status,
                                )
                              ? "bg-sky-50 text-sky-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {getStatusLabel(
                          shipment.status,
                        )}
                      </span>

                      <span className="text-[10px] font-medium text-muted-foreground">
                        {formatDate(
                          shipment.created_at,
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </Card>

      {/* =====================================================
          FOOTER INSIGHT
      ===================================================== */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-primary/[0.03] p-5 sm:p-6">
        <div className="pointer-events-none absolute -left-10 -top-10 size-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
              <BarChart3 className="size-5 text-primary" />
            </div>

            <div>
              <p className="text-sm font-extrabold text-primary">
                البيانات تصنع قرارات أفضل
              </p>

              <p className="mt-1 text-xs leading-6 text-muted-foreground">
                تابع تقارير متجرك باستمرار لمعرفة نقاط القوة
                والفرص التي تستحق التركيز.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
            <CalendarDays className="size-3.5" />
            تقرير مبني على بيانات متجرك
          </div>
        </div>
      </div>
    </div>
  );
}