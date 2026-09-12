import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  Phone,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Users,
  X,
  ArrowUpDown,
  ExternalLink,
  Activity,
  TrendingUp,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/customers")({
  head: () => ({
    meta: [
      {
        title: "العملاء | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "إدارة عملاء المتجر ومتابعة الشحنات ونشاط العملاء.",
      },
    ],
  }),
  component: MerchantCustomersPage,
});

type Shipment = {
  id: string;
  tracking_number: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type Customer = {
  key: string;
  name: string;
  phone: string;
  shipments: Shipment[];
  completed: number;
  inTransit: number;
  pending: number;
  lastActivity: string | null;
};

type FilterType = "all" | "active" | "completed" | "pending";
type SortType = "recent" | "shipments" | "name";

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

function getStatusClass(status: string | null) {
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

    case "ready_for_pickup":
    case "ready":
      return "bg-amber-50 text-amber-700";

    case "stored_amanat":
      return "bg-violet-50 text-violet-700";

    default:
      return "bg-slate-100 text-slate-700";
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

function isInTransit(status: string | null) {
  return (
    status === "in_transit" ||
    status === "transit" ||
    status === "ready_for_pickup" ||
    status === "ready"
  );
}

function isPending(status: string | null) {
  return status === "pending";
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
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getInitials(name: string) {
  const clean = name.trim();

  if (!clean) {
    return "؟";
  }

  return clean.charAt(0);
}

function MerchantCustomersPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("recent");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  async function loadCustomers(showRefreshing = false) {
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
          "يجب تسجيل الدخول للوصول إلى عملاء التاجر.",
        );
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "MERCHANT CUSTOMER PROFILE ERROR:",
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
          receiver_phone,
          status,
          created_at,
          updated_at
        `)
        .eq("merchant_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (shipmentError) {
        console.error(
          "MERCHANT CUSTOMERS ERROR:",
          shipmentError,
        );

        throw new Error(
          "تعذر تحميل بيانات العملاء.",
        );
      }

      setShipments((data ?? []) as Shipment[]);
    } catch (loadError) {
      console.error(
        "MERCHANT CUSTOMERS LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل العملاء.",
      );

      setShipments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadCustomers();
  }, []);

  const customers = useMemo<Customer[]>(() => {
    const customerMap = new Map<string, Customer>();

    for (const shipment of shipments) {
      const name =
        shipment.receiver_name?.trim() ||
        "عميل بدون اسم";

      const phone =
        shipment.receiver_phone?.trim() ||
        "بدون رقم";

      const key = `${phone}__${name}`;

      const existing = customerMap.get(key);

      if (!existing) {
        customerMap.set(key, {
          key,
          name,
          phone,
          shipments: [shipment],
          completed: isCompleted(shipment.status)
            ? 1
            : 0,
          inTransit: isInTransit(shipment.status)
            ? 1
            : 0,
          pending: isPending(shipment.status)
            ? 1
            : 0,
          lastActivity:
            shipment.updated_at ||
            shipment.created_at,
        });

        continue;
      }

      existing.shipments.push(shipment);

      if (isCompleted(shipment.status)) {
        existing.completed += 1;
      }

      if (isInTransit(shipment.status)) {
        existing.inTransit += 1;
      }

      if (isPending(shipment.status)) {
        existing.pending += 1;
      }

      const currentDate = existing.lastActivity
        ? new Date(
            existing.lastActivity,
          ).getTime()
        : 0;

      const shipmentDate =
        shipment.updated_at ||
        shipment.created_at;

      const newDate = shipmentDate
        ? new Date(shipmentDate).getTime()
        : 0;

      if (newDate > currentDate) {
        existing.lastActivity = shipmentDate;
      }
    }

    return Array.from(customerMap.values());
  }, [shipments]);

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    const result = customers.filter((customer) => {
      const matchesSearch =
        !value ||
        customer.name
          .toLowerCase()
          .includes(value) ||
        customer.phone
          .toLowerCase()
          .includes(value);

      let matchesFilter = true;

      if (filter === "active") {
        matchesFilter = customer.inTransit > 0;
      }

      if (filter === "completed") {
        matchesFilter =
          customer.completed > 0 &&
          customer.inTransit === 0 &&
          customer.pending === 0;
      }

      if (filter === "pending") {
        matchesFilter = customer.pending > 0;
      }

      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sort === "shipments") {
        return (
          b.shipments.length -
          a.shipments.length
        );
      }

      if (sort === "name") {
        return a.name.localeCompare(
          b.name,
          "ar",
        );
      }

      const aDate = a.lastActivity
        ? new Date(
            a.lastActivity,
          ).getTime()
        : 0;

      const bDate = b.lastActivity
        ? new Date(
            b.lastActivity,
          ).getTime()
        : 0;

      return bDate - aDate;
    });
  }, [
    customers,
    search,
    filter,
    sort,
  ]);

  const totalCustomers = customers.length;

  const totalShipments = shipments.length;

  const completedShipments =
    shipments.filter((shipment) =>
      isCompleted(shipment.status),
    ).length;

  const activeShipments =
    shipments.filter((shipment) =>
      isInTransit(shipment.status),
    ).length;

  const pendingShipments =
    shipments.filter((shipment) =>
      isPending(shipment.status),
    ).length;

  const completionRate =
    totalShipments > 0
      ? Math.round(
          (completedShipments /
            totalShipments) *
            100,
        )
      : 0;

  return (
    <div dir="rtl" className="space-y-6">
      {/* أدوات الصفحة */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
            <Users
              className="size-5 text-primary"
              strokeWidth={1.7}
            />
          </div>

          <div>
            <p className="text-sm font-bold text-primary">
              قاعدة العملاء
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              تابع عملاء متجرك ونشاطهم وشحناتهم
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadCustomers(true)
          }
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-primary shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-primary/[0.03] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={`size-4 ${
              refreshing
                ? "animate-spin"
                : ""
            }`}
          />

          {refreshing
            ? "جاري التحديث..."
            : "تحديث البيانات"}
        </button>
      </div>

      {/* =====================================================
          الإحصائيات — بطاقات Premium تفاعلية
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* إجمالي العملاء */}
        <Card className="group relative overflow-hidden border-border/80 bg-card p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/15 hover:shadow-xl">
          <div className="pointer-events-none absolute -left-7 -top-7 size-24 rounded-full bg-primary/5 transition-all duration-500 ease-out group-hover:scale-[1.55] group-hover:bg-primary/[0.075]" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-primary/20 transition-all duration-500 group-hover:w-full" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:text-primary/70">
                إجمالي العملاء
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                {totalCustomers.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                عملاء لديهم شحنات
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/10">
              <Users
                className="size-5 text-primary transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.7}
              />
            </div>
          </div>
        </Card>

        {/* إجمالي الشحنات */}
        <Card className="group relative overflow-hidden border-border/80 bg-card p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-sky-200 hover:shadow-xl">
          <div className="pointer-events-none absolute -left-7 -top-7 size-24 rounded-full bg-sky-50 transition-all duration-500 ease-out group-hover:scale-[1.55] group-hover:bg-sky-100/80" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-sky-200 transition-all duration-500 group-hover:w-full" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:text-sky-700/70">
                إجمالي الشحنات
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-tight text-primary transition-transform duration-300 group-hover:translate-x-0.5">
                {totalShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                جميع شحنات المتجر
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-sky-100">
              <Package
                className="size-5 text-sky-700 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.7}
              />
            </div>
          </div>
        </Card>

        {/* مكتملة */}
        <Card className="group relative overflow-hidden border-border/80 bg-card p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-emerald-200 hover:shadow-xl">
          <div className="pointer-events-none absolute -left-7 -top-7 size-24 rounded-full bg-emerald-50 transition-all duration-500 ease-out group-hover:scale-[1.55] group-hover:bg-emerald-100/80" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-emerald-200 transition-all duration-500 group-hover:w-full" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:text-emerald-700/70">
                مكتملة
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-tight text-emerald-700 transition-transform duration-300 group-hover:translate-x-0.5">
                {completedShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                شحنات تم إنجازها
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-emerald-100">
              <CheckCircle2
                className="size-5 text-emerald-700 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.7}
              />
            </div>
          </div>
        </Card>

        {/* نشطة الآن */}
        <Card className="group relative overflow-hidden border-border/80 bg-card p-5 transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] hover:border-amber-200 hover:shadow-xl">
          <div className="pointer-events-none absolute -left-7 -top-7 size-24 rounded-full bg-amber-50 transition-all duration-500 ease-out group-hover:scale-[1.55] group-hover:bg-amber-100/80" />

          <div className="pointer-events-none absolute bottom-0 left-0 h-px w-0 bg-amber-200 transition-all duration-500 group-hover:w-full" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground transition-colors duration-300 group-hover:text-amber-700/70">
                نشطة الآن
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-tight text-amber-700 transition-transform duration-300 group-hover:translate-x-0.5">
                {activeShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                شحنات قيد المتابعة
              </p>
            </div>

            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 transition-all duration-300 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:bg-amber-100">
              <Activity
                className="size-5 text-amber-700 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.7}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* ملخص الأداء */}
      <Card className="overflow-hidden transition-all duration-300 hover:border-primary/10 hover:shadow-md">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <TrendingUp className="size-5 text-primary" />
              </div>

              <div>
                <h3 className="text-sm font-extrabold text-primary">
                  أداء العملاء
                </h3>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  نظرة سريعة على حالة شحنات متجرك
                </p>
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${completionRate}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-medium text-muted-foreground">
                نسبة الإنجاز
              </span>

              <span className="font-extrabold text-primary">
                {completionRate}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 border-t border-border sm:grid-cols-3 lg:border-r lg:border-t-0">
            <div className="border-l border-border p-5 text-center">
              <p className="text-[11px] font-bold text-muted-foreground">
                معلقة
              </p>

              <p className="mt-2 text-xl font-extrabold text-amber-700">
                {pendingShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>
            </div>

            <div className="border-l border-border p-5 text-center">
              <p className="text-[11px] font-bold text-muted-foreground">
                نشطة
              </p>

              <p className="mt-2 text-xl font-extrabold text-sky-700">
                {activeShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>
            </div>

            <div className="col-span-2 p-5 text-center sm:col-span-1">
              <p className="text-[11px] font-bold text-muted-foreground">
                مكتملة
              </p>

              <p className="mt-2 text-xl font-extrabold text-emerald-700">
                {completedShipments.toLocaleString(
                  "ar-YE",
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* البحث والفلاتر */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              className="w-full rounded-xl border border-border bg-background py-3.5 pr-12 pl-12 text-sm font-medium text-primary outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/5"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                aria-label="مسح البحث"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "الكل"],
                ["active", "نشط"],
                ["pending", "معلّق"],
                ["completed", "مكتمل"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilter(value)
                }
                className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                  filter === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value as SortType,
                )
              }
              className="h-full min-w-[155px] appearance-none rounded-xl border border-border bg-background py-2.5 pl-9 pr-9 text-xs font-bold text-primary outline-none transition focus:border-primary"
            >
              <option value="recent">
                الأحدث نشاطًا
              </option>

              <option value="shipments">
                الأكثر شحنات
              </option>

              <option value="name">
                الاسم
              </option>
            </select>
          </div>
        </div>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold leading-6 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadCustomers(true)
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* المحتوى */}
      {loading ? (
        <Card className="p-10">
          <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5">
              <Loader2 className="size-7 animate-spin text-primary" />
            </div>

            <p className="mt-5 text-sm font-extrabold text-primary">
              جاري تحميل بيانات العملاء
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              لحظات ونجهز لك قائمة العملاء...
            </p>
          </div>
        </Card>
      ) : filteredCustomers.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/5">
              <Users
                className="size-9 text-primary/60"
                strokeWidth={1.4}
              />
            </div>

            <h3 className="mt-6 text-xl font-extrabold text-primary">
              {search
                ? "لم نجد هذا العميل"
                : filter !== "all"
                  ? "لا توجد نتائج لهذا التصنيف"
                  : "لا يوجد عملاء حتى الآن"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              {search
                ? "جرّب البحث باستخدام اسم العميل أو رقم الهاتف بطريقة مختلفة."
                : filter !== "all"
                  ? "لا يوجد عملاء يطابقون حالة الفلتر المحددة حاليًا."
                  : "سيظهر عملاؤك هنا تلقائيًا عند إنشاء شحنات جديدة واستلام بيانات المستلمين."}
            </p>

            {(search || filter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                عرض جميع العملاء
              </button>
            )}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* رأس القائمة */}
          <div className="border-b border-border bg-muted/20 px-5 py-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-primary">
                  قائمة العملاء
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {search || filter !== "all"
                    ? `عرض ${filteredCustomers.length.toLocaleString(
                        "ar-YE",
                      )} من أصل ${totalCustomers.toLocaleString(
                        "ar-YE",
                      )} عميل`
                    : `إجمالي ${totalCustomers.toLocaleString(
                        "ar-YE",
                      )} عميل`}
                </p>
              </div>

              <div className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                {filteredCustomers.length.toLocaleString(
                  "ar-YE",
                )}{" "}
                نتيجة
              </div>
            </div>
          </div>

          {/* جدول سطح المكتب */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                    العميل
                  </th>

                  <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                    الهاتف
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                    الشحنات
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                    المكتملة
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                    الحالة
                  </th>

                  <th className="px-5 py-4 text-right text-[11px] font-extrabold text-muted-foreground">
                    آخر نشاط
                  </th>

                  <th className="px-5 py-4 text-center text-[11px] font-extrabold text-muted-foreground">
                    التفاصيل
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => {
                    const completion =
                      customer.shipments.length >
                      0
                        ? Math.round(
                            (customer.completed /
                              customer.shipments
                                .length) *
                              100,
                          )
                        : 0;

                    return (
                      <tr
                        key={customer.key}
                        className="border-b border-border transition last:border-b-0 hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-sm font-extrabold text-primary">
                              {getInitials(
                                customer.name,
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-extrabold text-primary">
                                {customer.name}
                              </p>

                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-[11px] text-muted-foreground">
                                  نسبة الإنجاز
                                </span>

                                <span className="text-[11px] font-extrabold text-primary">
                                  {completion}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Phone className="size-4 text-muted-foreground" />

                            <span dir="ltr">
                              {customer.phone}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex min-w-10 items-center justify-center rounded-lg bg-primary/5 px-3 py-1.5 text-sm font-extrabold text-primary">
                            {customer.shipments.length}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700">
                            <CheckCircle2 className="size-3.5" />
                            {customer.completed}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-center">
                          {customer.inTransit > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-3 py-1.5 text-[11px] font-extrabold text-sky-700">
                              <Truck className="size-3.5" />
                              {customer.inTransit} نشطة
                            </span>
                          ) : customer.pending > 0 ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold text-amber-700">
                              <Clock3 className="size-3.5" />
                              {customer.pending} معلقة
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-extrabold text-slate-600">
                              <CheckCircle2 className="size-3.5" />
                              مكتملة
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-muted-foreground">
                            {formatDate(
                              customer.lastActivity,
                            )}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedCustomer(
                                customer,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary transition hover:border-primary/20 hover:bg-primary/5"
                          >
                            عرض التفاصيل
                            <ExternalLink className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>

          {/* بطاقات الجوال */}
          <div className="divide-y divide-border md:hidden">
            {filteredCustomers.map(
              (customer) => {
                const completion =
                  customer.shipments.length > 0
                    ? Math.round(
                        (customer.completed /
                          customer.shipments
                            .length) *
                          100,
                      )
                    : 0;

                return (
                  <div
                    key={customer.key}
                    className="p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-sm font-extrabold text-primary">
                        {getInitials(
                          customer.name,
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-primary">
                          {customer.name}
                        </p>

                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="size-3.5" />

                          <span dir="ltr">
                            {customer.phone}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCustomer(
                            customer,
                          )
                        }
                        className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-primary"
                      >
                        عرض
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">
                          نسبة الإنجاز
                        </span>

                        <span className="text-primary">
                          {completion}%
                        </span>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${completion}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-muted/50 p-3 text-center">
                        <p className="text-[10px] font-bold text-muted-foreground">
                          الشحنات
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-primary">
                          {customer.shipments.length}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 p-3 text-center">
                        <p className="text-[10px] font-bold text-emerald-700">
                          مكتملة
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-emerald-700">
                          {customer.completed}
                        </p>
                      </div>

                      <div className="rounded-xl bg-sky-50 p-3 text-center">
                        <p className="text-[10px] font-bold text-sky-700">
                          نشطة
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-sky-700">
                          {customer.inTransit}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="text-[11px] font-bold text-muted-foreground">
                        آخر نشاط
                      </span>

                      <span className="text-[11px] font-medium text-primary">
                        {formatDate(
                          customer.lastActivity,
                        )}
                      </span>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </Card>
      )}

      {/* نافذة تفاصيل العميل */}
      {selectedCustomer && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            setSelectedCustomer(null)
          }
        >
          <div
            dir="rtl"
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="border-b border-border bg-muted/20 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/5 text-lg font-extrabold text-primary">
                    {getInitials(
                      selectedCustomer.name,
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-extrabold text-primary">
                      {selectedCustomer.name}
                    </h3>

                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="size-3.5" />

                      <span dir="ltr">
                        {selectedCustomer.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedCustomer.phone !==
                    "بدون رقم" && (
                    <a
                      href={`tel:${selectedCustomer.phone}`}
                      className="flex size-9 items-center justify-center rounded-xl bg-primary/5 text-primary transition hover:bg-primary/10"
                      aria-label="الاتصال بالعميل"
                    >
                      <Phone className="size-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCustomer(null)
                    }
                    className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-primary"
                    aria-label="إغلاق"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-5 sm:p-6">
              <div className="rounded-2xl bg-primary/5 p-4 text-center">
                <Package className="mx-auto size-5 text-primary" />

                <p className="mt-2 text-xl font-extrabold text-primary">
                  {selectedCustomer.shipments.length}
                </p>

                <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                  إجمالي الشحنات
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-center">
                <CheckCircle2 className="mx-auto size-5 text-emerald-700" />

                <p className="mt-2 text-xl font-extrabold text-emerald-700">
                  {selectedCustomer.completed}
                </p>

                <p className="mt-1 text-[10px] font-bold text-emerald-700/70">
                  مكتملة
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 p-4 text-center">
                <Truck className="mx-auto size-5 text-sky-700" />

                <p className="mt-2 text-xl font-extrabold text-sky-700">
                  {selectedCustomer.inTransit}
                </p>

                <p className="mt-1 text-[10px] font-bold text-sky-700/70">
                  نشطة
                </p>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto border-t border-border">
              <div className="px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-primary" />

                    <h4 className="text-sm font-extrabold text-primary">
                      سجل شحنات العميل
                    </h4>
                  </div>

                  <span className="text-[11px] font-bold text-muted-foreground">
                    {selectedCustomer.shipments.length} شحنة
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border">
                {selectedCustomer.shipments.map(
                  (shipment) => (
                    <div
                      key={shipment.id}
                      className="px-5 py-4 transition hover:bg-muted/20 sm:px-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-primary">
                            {shipment.tracking_number ||
                              "بدون رقم تتبع"}
                          </p>

                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(
                              shipment.updated_at ||
                                shipment.created_at,
                            )}
                          </p>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-lg px-3 py-1.5 text-[11px] font-extrabold ${getStatusClass(
                            shipment.status,
                          )}`}
                        >
                          {getStatusLabel(
                            shipment.status,
                          )}
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <UserRound className="size-4" />

                <span>
                  عميل المتجر
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedCustomer(null)
                }
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}