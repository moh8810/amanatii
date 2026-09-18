import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarDays,

  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  CreditCard,
  DollarSign,
  FileText,
  Filter,
  Info,
  Loader2,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/wallet")({
  head: () => ({
    meta: [
      {
        title: "المحفظة والأرباح | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "متابعة رسوم الشحن والمدفوعات والأداء المالي الخاص بالمتجر.",
      },
    ],
  }),
  component: MerchantWalletPage,
});

type Shipment = {
  id: string;
  tracking_number: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  status: string | null;
  shipping_fee: number | null;
  pricing_status: string | null;
  payment_status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PaymentFilter =
  | "all"
  | "paid"
  | "unpaid"
  | "pending";

type PeriodFilter =
  | "all"
  | "today"
  | "week"
  | "month";

type SortType =
  | "recent"
  | "amount_high"
  | "amount_low";

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-YE")} ريال`;
}

function getPaymentLabel(
  status: string | null,
) {
  switch (status) {
    case "paid":
      return "تم الدفع";

    case "pending":
      return "قيد الدفع";

    case "unpaid":
      return "غير مدفوع";

    default:
      return "غير محدد";
  }
}

function getPaymentClass(
  status: string | null,
) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700";

    case "pending":
      return "bg-amber-50 text-amber-700";

    case "unpaid":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function getShipmentStatusLabel(
  status: string | null,
) {
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

function getShipmentStatusClass(
  status: string | null,
) {
  switch (status) {
    case "delivered":
    case "completed":
    case "done":
    case "received":
    case "collected":
      return "bg-emerald-50 text-emerald-700";

    case "in_transit":
    case "transit":
      return "bg-sky-50 text-sky-700";

    case "ready":
    case "ready_for_pickup":
      return "bg-amber-50 text-amber-700";

    case "stored":
    case "stored_amanat":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(
  value: string | null,
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ar-YE",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(date);
}

function isSameDay(
  dateValue: string | null,
) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDays(
  dateValue: string | null,
  days: number,
) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue).getTime();
  const now = Date.now();

  const difference =
    now - date;

  return (
    difference >= 0 &&
    difference <=
      days * 24 * 60 * 60 * 1000
  );
}

function isSameMonth(
  dateValue: string | null,
) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function MerchantWalletPage() {
  const [shipments, setShipments] =
    useState<Shipment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [paymentFilter, setPaymentFilter] =
    useState<PaymentFilter>("all");

  const [periodFilter, setPeriodFilter] =
    useState<PeriodFilter>("all");

  const [sort, setSort] =
    useState<SortType>("recent");

  const [selectedShipment, setSelectedShipment] =
    useState<Shipment | null>(null);

  const [showFilters, setShowFilters] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const [showTopUp, setShowTopUp] =
    useState(false);

  const [topUpAmount, setTopUpAmount] =
    useState("");

  async function loadWallet(
    showRefreshing = false,
  ) {
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
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى المحفظة.",
        );
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "MERCHANT WALLET PROFILE ERROR:",
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
      } =
        await supabase
          .from("shipments")
          .select(`
            id,
            tracking_number,
            receiver_name,
            receiver_phone,
            status,
            shipping_fee,
            pricing_status,
            payment_status,
            created_at,
            updated_at
          `)
          .eq("merchant_id", user.id)
          .order("updated_at", {
            ascending: false,
          });

      if (shipmentError) {
        console.error(
          "MERCHANT WALLET ERROR:",
          shipmentError,
        );

        throw new Error(
          "تعذر تحميل البيانات المالية.",
        );
      }

      setShipments(
        (data ?? []) as Shipment[],
      );
    } catch (loadError) {
      console.error(
        "MERCHANT WALLET LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل المحفظة.",
      );

      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadWallet();
  }, []);

  const financialShipments =
    useMemo(() => {
      return shipments.filter(
        (shipment) =>
          shipment.shipping_fee !== null &&
          shipment.shipping_fee !== undefined,
      );
    }, [shipments]);

  const totalFees =
    useMemo(() => {
      return financialShipments.reduce(
        (total, shipment) =>
          total +
          Number(
            shipment.shipping_fee ?? 0,
          ),
        0,
      );
    }, [financialShipments]);

  const paidFees =
    useMemo(() => {
      return financialShipments
        .filter(
          (shipment) =>
            shipment.payment_status ===
            "paid",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const pendingFees =
    useMemo(() => {
      return financialShipments
        .filter(
          (shipment) =>
            shipment.payment_status ===
            "pending",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const unpaidFees =
    useMemo(() => {
      return financialShipments
        .filter(
          (shipment) =>
            shipment.payment_status !==
              "paid" &&
            shipment.payment_status !==
              "pending",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const paidCount =
    financialShipments.filter(
      (shipment) =>
        shipment.payment_status ===
        "paid",
    ).length;

  const unpaidCount =
    financialShipments.filter(
      (shipment) =>
        shipment.payment_status !==
          "paid" &&
        shipment.payment_status !==
          "pending",
    ).length;

  const pendingCount =
    financialShipments.filter(
      (shipment) =>
        shipment.payment_status ===
        "pending",
    ).length;

  const collectionRate =
    totalFees > 0
      ? Math.round(
          (paidFees / totalFees) * 100,
        )
      : 0;

  const currentMonthFees =
    useMemo(() => {
      return financialShipments
        .filter((shipment) =>
          isSameMonth(
            shipment.created_at,
          ),
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const currentMonthPaid =
    useMemo(() => {
      return financialShipments
        .filter(
          (shipment) =>
            isSameMonth(
              shipment.created_at,
            ) &&
            shipment.payment_status ===
              "paid",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const todayPaid =
    useMemo(() => {
      return financialShipments
        .filter(
          (shipment) =>
            isSameDay(
              shipment.created_at,
            ) &&
            shipment.payment_status ===
              "paid",
        )
        .reduce(
          (total, shipment) =>
            total +
            Number(
              shipment.shipping_fee ?? 0,
            ),
          0,
        );
    }, [financialShipments]);

  const filteredShipments =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      const result =
        financialShipments.filter(
          (shipment) => {
            const matchesSearch =
              !value ||
              (
                shipment.tracking_number ??
                ""
              )
                .toLowerCase()
                .includes(value) ||
              (
                shipment.receiver_name ??
                ""
              )
                .toLowerCase()
                .includes(value) ||
              (
                shipment.receiver_phone ??
                ""
              )
                .toLowerCase()
                .includes(value);

            const matchesPayment =
              paymentFilter === "all" ||
              (
                paymentFilter ===
                  "paid" &&
                shipment.payment_status ===
                  "paid"
              ) ||
              (
                paymentFilter ===
                  "pending" &&
                shipment.payment_status ===
                  "pending"
              ) ||
              (
                paymentFilter ===
                  "unpaid" &&
                shipment.payment_status !==
                  "paid" &&
                shipment.payment_status !==
                  "pending"
              );

            const matchesPeriod =
              periodFilter === "all" ||
              (
                periodFilter ===
                  "today" &&
                isSameDay(
                  shipment.created_at,
                )
              ) ||
              (
                periodFilter ===
                  "week" &&
                isWithinDays(
                  shipment.created_at,
                  7,
                )
              ) ||
              (
                periodFilter ===
                  "month" &&
                isSameMonth(
                  shipment.created_at,
                )
              );

            return (
              matchesSearch &&
              matchesPayment &&
              matchesPeriod
            );
          },
        );

      return result.sort(
        (a, b) => {
          if (
            sort === "amount_high"
          ) {
            return (
              Number(
                b.shipping_fee ?? 0,
              ) -
              Number(
                a.shipping_fee ?? 0,
              )
            );
          }

          if (
            sort === "amount_low"
          ) {
            return (
              Number(
                a.shipping_fee ?? 0,
              ) -
              Number(
                b.shipping_fee ?? 0,
              )
            );
          }

          const aDate = new Date(
            a.updated_at ??
              a.created_at ??
              0,
          ).getTime();

          const bDate = new Date(
            b.updated_at ??
              b.created_at ??
              0,
          ).getTime();

          return bDate - aDate;
        },
      );
    }, [
      financialShipments,
      search,
      paymentFilter,
      periodFilter,
      sort,
    ]);

  async function copyTrackingNumber(
    value: string,
  ) {
    try {
      await navigator.clipboard.writeText(
        value,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (copyError) {
      console.error(
        "COPY TRACKING ERROR:",
        copyError,
      );
    }
  }

  const activeFiltersCount =
    (paymentFilter !== "all"
      ? 1
      : 0) +
    (periodFilter !== "all"
      ? 1
      : 0);

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* =====================================================
          البطاقة المالية الرئيسية
      ===================================================== */}
      <Card className="relative overflow-hidden border-primary/10 bg-primary p-6 text-primary-foreground shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <WalletCards className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-white/60">
                  المركز المالي
                </p>

                <h2 className="mt-0.5 text-xl font-extrabold sm:text-2xl">
                  المحفظة والأرباح
                </h2>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/65">
              تابع رسوم الشحن والمدفوعات والمبالغ غير المحصلة
              وأداء متجرك المالي من مكان واحد.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-bold text-white/55">
                  نسبة التحصيل
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {collectionRate}%
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-bold text-white/55">
                  مدفوع
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {paidCount.toLocaleString(
                    "ar-YE",
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/10">
                <p className="text-[10px] font-bold text-white/55">
                  غير محصل
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {unpaidCount.toLocaleString(
                    "ar-YE",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white/60">
                  إجمالي رسوم الشحن
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {loading
                    ? "..."
                    : formatMoney(
                        totalFees,
                      )}
                </p>
              </div>

              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <DollarSign className="size-6" />
              </div>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-white transition-all duration-700"
                style={{
                  width: `${collectionRate}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-white/55">
                تم تحصيله
              </span>

              <span className="font-extrabold">
                {formatMoney(
                  paidFees,
                )}
              </span>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-white/45">
                    محفظة التاجر
                  </p>

                  <p className="mt-1 text-lg font-extrabold">
                    0 ريال
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowTopUp(true)
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-extrabold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Banknote className="size-4" />
                  تغذية المحفظة
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 text-[9px] leading-5 text-white/40">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  يحوّل التاجر المبلغ بنكيًا، وبعد تأكيد التحويل
                  تتم إضافة الرصيد إلى محفظته.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          البطاقات المالية
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl">
          <div className="absolute -left-8 -top-8 size-28 rounded-full bg-emerald-50" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                المبالغ المدفوعة
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-emerald-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(
                      paidFees,
                    )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {paidCount.toLocaleString(
                  "ar-YE",
                )}{" "}
                عملية مدفوعة
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <ArrowDownLeft className="size-5 text-emerald-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl">
          <div className="absolute -left-8 -top-8 size-28 rounded-full bg-red-50" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                غير المحصل
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-red-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(
                      unpaidFees,
                    )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {unpaidCount.toLocaleString(
                  "ar-YE",
                )}{" "}
                عملية غير مدفوعة
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <ArrowUpRight className="size-5 text-red-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl">
          <div className="absolute -left-8 -top-8 size-28 rounded-full bg-amber-50" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                قيد الدفع
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-amber-700 sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(
                      pendingFees,
                    )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {pendingCount.toLocaleString(
                  "ar-YE",
                )}{" "}
                عملية قيد الدفع
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 className="size-5 text-amber-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl">
          <div className="absolute -left-8 -top-8 size-28 rounded-full bg-primary/5" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground">
                رسوم هذا الشهر
              </p>

              <p className="mt-2 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                {loading
                  ? "..."
                  : formatMoney(
                      currentMonthFees,
                    )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                المحصل هذا الشهر:{" "}
                {formatMoney(
                  currentMonthPaid,
                )}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5">
              <TrendingUp className="size-5 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          ملخص اليوم
      ===================================================== */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <CalendarDays className="size-5 text-primary" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-primary">
                  ملخص اليوم
                </h3>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  التحصيلات المسجلة اليوم
                </p>
              </div>
            </div>

            <span className="rounded-full bg-primary/5 px-3 py-1.5 text-[11px] font-extrabold text-primary">
              اليوم
            </span>
          </div>

          <div className="mt-6 flex items-end justify-between gap-5">
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-primary">
                {formatMoney(
                  todayPaid,
                )}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                قيمة الرسوم المدفوعة اليوم
              </p>
            </div>

            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50">
              <CheckCircle2 className="size-6 text-emerald-700" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50">
              <FileText className="size-5 text-sky-700" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-primary">
                النشاط المالي
              </h3>

              <p className="mt-0.5 text-xs text-muted-foreground">
                جميع العمليات المالية المرتبطة بشحنات متجرك
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-[10px] font-bold text-muted-foreground">
                عمليات مالية
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {financialShipments.length.toLocaleString(
                  "ar-YE",
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-[10px] font-bold text-emerald-700">
                نسبة التحصيل
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                {collectionRate}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          أدوات البحث والفلترة
      ===================================================== */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="ابحث برقم الشحنة أو اسم العميل أو الهاتف..."
                className="w-full rounded-xl border border-border bg-background py-3.5 pr-12 pl-12 text-sm font-medium text-primary outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/5"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                  aria-label="مسح البحث"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowFilters(
                  (value) => !value,
                )
              }
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition ${
                showFilters ||
                activeFiltersCount > 0
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-primary"
              }`}
            >
              <Filter className="size-4" />
              الفلاتر

              {activeFiltersCount >
                0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="relative">
              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as SortType,
                  )
                }
                className="h-full min-w-[170px] appearance-none rounded-xl border border-border bg-background py-3 pl-9 pr-4 text-xs font-bold text-primary outline-none focus:border-primary"
              >
                <option value="recent">
                  الأحدث أولاً
                </option>

                <option value="amount_high">
                  الأعلى قيمة
                </option>

                <option value="amount_low">
                  الأقل قيمة
                </option>
              </select>

              <ChevronDown className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            <button
              type="button"
              onClick={() =>
                void loadWallet(true)
              }
              disabled={
                loading ||
                refreshing
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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

          {showFilters && (
            <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-extrabold text-primary">
                  حالة الدفع
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      [
                        "all",
                        "الكل",
                      ],
                      [
                        "paid",
                        "مدفوع",
                      ],
                      [
                        "pending",
                        "قيد الدفع",
                      ],
                      [
                        "unpaid",
                        "غير مدفوع",
                      ],
                    ] as const
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setPaymentFilter(
                            value,
                          )
                        }
                        className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                          paymentFilter ===
                          value
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-extrabold text-primary">
                  الفترة
                </p>

                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      [
                        "all",
                        "كل الفترات",
                      ],
                      [
                        "today",
                        "اليوم",
                      ],
                      [
                        "week",
                        "آخر 7 أيام",
                      ],
                      [
                        "month",
                        "هذا الشهر",
                      ],
                    ] as const
                  ).map(
                    ([
                      value,
                      label,
                    ]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setPeriodFilter(
                            value,
                          )
                        }
                        className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                          periodFilter ===
                          value
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-primary"
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* =====================================================
          الخطأ
      ===================================================== */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadWallet(true)
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          سجل العمليات
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />

                <h3 className="text-base font-extrabold text-primary">
                  سجل العمليات المالية
                </h3>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                الرسوم والمدفوعات المرتبطة بشحنات متجرك
              </p>
            </div>

            <div className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-extrabold text-primary">
              {filteredShipments.length.toLocaleString(
                "ar-YE",
              )}{" "}
              عملية
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>

            <p className="mt-5 text-sm font-extrabold text-primary">
              جاري تحميل البيانات المالية
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              لحظات ونجهز لك سجل العمليات...
            </p>
          </div>
        ) : filteredShipments.length ===
          0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/5">
              <WalletCards className="size-9 text-primary/50" />
            </div>

            <h3 className="mt-6 text-xl font-extrabold text-primary">
              لا توجد عمليات مطابقة
            </h3>

            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              لم نجد عمليات مالية تطابق البحث أو الفلاتر الحالية.
            </p>

            {(search ||
              paymentFilter !==
                "all" ||
              periodFilter !==
                "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPaymentFilter(
                    "all",
                  );
                  setPeriodFilter(
                    "all",
                  );
                }}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                عرض كل العمليات
              </button>
            )}
          </div>
        ) : (
          <>
            {/* سطح المكتب */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background">
                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      العملية
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      العميل
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      المبلغ
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      الدفع
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      حالة الشحنة
                    </th>

                    <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                      التاريخ
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                      التفاصيل
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredShipments.map(
                    (shipment) => (
                      <tr
                        key={shipment.id}
                        className="border-b border-border transition last:border-b-0 hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                              <Package className="size-4 text-primary" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="max-w-[150px] truncate font-mono text-xs font-extrabold text-primary">
                                  {shipment.tracking_number ||
                                    shipment.id}
                                </span>

                                {shipment.tracking_number && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void copyTrackingNumber(
                                        shipment.tracking_number!,
                                      )
                                    }
                                    className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-primary"
                                    title="نسخ رقم الشحنة"
                                  >
                                    <Copy className="size-3" />
                                  </button>
                                )}
                              </div>

                              <p className="mt-1 text-[10px] text-muted-foreground">
                                رسوم شحن
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-bold text-primary">
                              {shipment.receiver_name ||
                                "عميل بدون اسم"}
                            </p>

                            {shipment.receiver_phone && (
                              <p
                                dir="ltr"
                                className="mt-1 text-[10px] text-muted-foreground"
                              >
                                {
                                  shipment.receiver_phone
                                }
                              </p>
                            )}
                          </div>
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
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-extrabold ${getPaymentClass(
                              shipment.payment_status,
                            )}`}
                          >
                            {shipment.payment_status ===
                            "paid" ? (
                              <CheckCircle2 className="size-3.5" />
                            ) : (
                              <Clock3 className="size-3.5" />
                            )}

                            {getPaymentLabel(
                              shipment.payment_status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-lg px-3 py-1.5 text-[10px] font-extrabold ${getShipmentStatusClass(
                              shipment.status,
                            )}`}
                          >
                            {getShipmentStatusLabel(
                              shipment.status,
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {formatDate(
                              shipment.updated_at ||
                                shipment.created_at,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedShipment(
                                shipment,
                              )
                            }
                            className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary transition hover:border-primary/20 hover:bg-primary/5"
                          >
                            عرض
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* الجوال */}
            <div className="divide-y divide-border md:hidden">
              {filteredShipments.map(
                (shipment) => (
                  <div
                    key={shipment.id}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                        <Package className="size-5 text-primary" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-mono text-xs font-extrabold text-primary">
                            {shipment.tracking_number ||
                              shipment.id}
                          </p>

                          {shipment.tracking_number && (
                            <button
                              type="button"
                              onClick={() =>
                                void copyTrackingNumber(
                                  shipment.tracking_number!,
                                )
                              }
                              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                            >
                              <Copy className="size-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs font-bold text-muted-foreground">
                          {shipment.receiver_name ||
                            "عميل بدون اسم"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedShipment(
                            shipment,
                          )
                        }
                        className="rounded-lg border border-border px-3 py-2 text-[11px] font-extrabold text-primary"
                      >
                        عرض
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          قيمة العملية
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-primary">
                          {formatMoney(
                            Number(
                              shipment.shipping_fee ??
                                0,
                            ),
                          )}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-extrabold ${getPaymentClass(
                          shipment.payment_status,
                        )}`}
                      >
                        {getPaymentLabel(
                          shipment.payment_status,
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${getShipmentStatusClass(
                          shipment.status,
                        )}`}
                      >
                        {getShipmentStatusLabel(
                          shipment.status,
                        )}
                      </span>

                      <span className="text-[10px] font-medium text-muted-foreground">
                        {formatDate(
                          shipment.updated_at ||
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
          نافذة تغذية المحفظة
      ===================================================== */}
      {showTopUp && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setShowTopUp(false)
          }
        >
          <div
            dir="rtl"
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="relative overflow-hidden bg-primary p-6 text-primary-foreground">
              <div className="pointer-events-none absolute -left-16 -top-16 size-36 rounded-full bg-white/5 blur-2xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                    <WalletCards className="size-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold">
                      تغذية محفظة التاجر
                    </h3>

                    <p className="mt-1 text-[10px] text-white/50">
                      إضافة رصيد لاستخدامه في رسوم الشحن
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowTopUp(false)
                  }
                  className="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
                  aria-label="إغلاق"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-xs font-extrabold text-primary">
                  المبلغ المراد إضافته
                </label>

                <div className="relative">
                  <Banknote className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="number"
                    min="1"
                    value={topUpAmount}
                    onChange={(event) =>
                      setTopUpAmount(
                        event.target.value,
                      )
                    }
                    placeholder="مثال: 50,000"
                    dir="ltr"
                    className="w-full rounded-xl border border-border bg-background py-3.5 pl-16 pr-11 text-sm font-bold text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                  />

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    ريال
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-primary/10 bg-primary/[0.035] p-4">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />

                  <div>
                    <p className="text-xs font-extrabold text-primary">
                      التحويل البنكي
                    </p>

                    <p className="mt-1 text-[10px] leading-6 text-muted-foreground">
                      يحوّل التاجر المبلغ إلى الحساب البنكي
                      المعتمد لدى أمانتي، ثم تقوم الإدارة
                      بمراجعة التحويل وإضافة الرصيد إلى المحفظة.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-amber-700" />

                  <p className="text-[10px] leading-6 text-amber-800/70">
                    سيتم ربط رقم الحساب البنكي وإيصال التحويل
                    ونظام الموافقة الإداري مع قاعدة البيانات
                    عند إنشاء نظام المحفظة الحقيقي.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount("");
                  }}
                  className="flex-1 rounded-xl bg-muted px-4 py-3 text-sm font-extrabold text-primary transition hover:bg-muted/80"
                >
                  إلغاء
                </button>

                <button
                  type="button"
                  disabled={
                    !topUpAmount ||
                    Number(topUpAmount) <= 0
                  }
                  onClick={() => {
                    setShowTopUp(false);
                    setTopUpAmount("");
                  }}
                  className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  متابعة التغذية
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          نافذة تفاصيل العملية
      ===================================================== */}
      {selectedShipment && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setSelectedShipment(null)
          }
        >
          <div
            dir="rtl"
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="border-b border-border bg-muted/20 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
                    <WalletCards className="size-6 text-primary" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-extrabold text-primary">
                      تفاصيل العملية
                    </h3>

                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {selectedShipment.tracking_number ||
                        selectedShipment.id}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedShipment(null)
                  }
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-primary"
                  aria-label="إغلاق"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-3xl bg-primary p-5 text-primary-foreground">
                <p className="text-xs font-bold text-white/60">
                  قيمة رسوم الشحن
                </p>

                <p className="mt-2 text-3xl font-extrabold tracking-tight">
                  {formatMoney(
                    Number(
                      selectedShipment.shipping_fee ??
                        0,
                    ),
                  )}
                </p>

                <div className="mt-5">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-extrabold ${getPaymentClass(
                      selectedShipment.payment_status,
                    )}`}
                  >
                    {selectedShipment.payment_status ===
                    "paid" ? (
                      <CheckCircle2 className="size-3.5" />
                    ) : (
                      <Clock3 className="size-3.5" />
                    )}

                    {getPaymentLabel(
                      selectedShipment.payment_status,
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <Package className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      رقم الشحنة
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-primary">
                      {selectedShipment.tracking_number ||
                        selectedShipment.id}
                    </span>

                    {selectedShipment.tracking_number && (
                      <button
                        type="button"
                        onClick={() =>
                          void copyTrackingNumber(
                            selectedShipment.tracking_number!,
                          )
                        }
                        className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-primary"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      حالة التسعير
                    </span>
                  </div>

                  <span className="text-xs font-extrabold text-primary">
                    {selectedShipment.pricing_status ===
                    "priced"
                      ? "تم تحديد الرسوم"
                      : "بانتظار تحديد الرسوم"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      حالة الدفع
                    </span>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${getPaymentClass(
                      selectedShipment.payment_status,
                    )}`}
                  >
                    {getPaymentLabel(
                      selectedShipment.payment_status,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      حالة الشحنة
                    </span>
                  </div>

                  <span
                    className={`rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold ${getShipmentStatusClass(
                      selectedShipment.status,
                    )}`}
                  >
                    {getShipmentStatusLabel(
                      selectedShipment.status,
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      العميل
                    </span>
                  </div>

                  <span className="max-w-[180px] truncate text-xs font-extrabold text-primary">
                    {selectedShipment.receiver_name ||
                      "عميل بدون اسم"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="size-4 text-primary" />

                    <span className="text-xs font-bold text-muted-foreground">
                      تاريخ العملية
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-primary">
                    {formatDate(
                      selectedShipment.created_at,
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedShipment(null)
                }
                className="mt-5 w-full rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:opacity-90"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* إشعار النسخ */}
      {copied && (
        <div className="fixed bottom-5 left-5 z-[300] flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-extrabold text-primary-foreground shadow-xl">
          <CheckCircle2 className="size-4" />
          تم نسخ رقم الشحنة
        </div>
      )}
    </div>
  );
}
