import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Plus,
  Search,
  User,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import {
  Card,
  StatusBadge,
} from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/amanat")({
  head: () => ({
    meta: [
      {
        title: "أماناتي | أمانتي",
      },
      {
        name: "description",
        content:
          "تابع جميع أماناتك من مكان واحد في أمانتي.",
      },
    ],
  }),

  component: AmanatRoute,
});

function AmanatRoute() {
  const location = useLocation();

  if (location.pathname === "/amanat/new") {
    return <Outlet />;
  }

  return <AmanatPage />;
}

type Amanat = {
  id: string;
  reference_number: string;
  owner_id: string | null;
  pickup_point_id: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  stored_at: string;
  collected_at: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;
  storage_fee: number | null;
  pricing_status: string | null;
  payment_status: string | null;
};

type PickupPoint = {
  id: string;
  name: string;
  address: string | null;
};

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    stored: "محفوظة",
    pending: "قيد المعالجة",
    processing: "قيد المعالجة",
    ready: "جاهزة للاستلام",
    ready_for_pickup: "جاهزة للاستلام",
    collected: "تم الاستلام",
    received: "تم الاستلام",
    completed: "تم الاستلام",
  };

  return labels[status] ?? status;
}

function getStatusTone(
  status: string,
):
  | "pending"
  | "stored"
  | "ready"
  | "done"
  | "transit" {
  if (
    status === "ready" ||
    status === "ready_for_pickup"
  ) {
    return "ready";
  }

  if (
    status === "collected" ||
    status === "received" ||
    status === "completed"
  ) {
    return "done";
  }

  if (status === "stored") {
    return "stored";
  }

  if (
    status === "transit" ||
    status === "in_transit"
  ) {
    return "transit";
  }

  return "pending";
}

function formatFee(
  fee: number | null,
) {
  if (
    fee === null ||
    fee === undefined
  ) {
    return null;
  }

  return `${Number(fee).toLocaleString(
    "ar-YE",
  )} ريال`;
}

function getPricingLabel(
  pricingStatus: string | null,
  fee: number | null,
) {
  if (
    fee !== null &&
    fee !== undefined
  ) {
    return "تم تحديد السعر";
  }

  if (
    pricingStatus === "priced" ||
    pricingStatus === "approved" ||
    pricingStatus === "completed"
  ) {
    return "تم تحديد السعر";
  }

  return "بانتظار تحديد السعر";
}

function getPaymentLabel(
  paymentStatus: string | null,
) {
  if (
    paymentStatus === "paid" ||
    paymentStatus === "completed"
  ) {
    return "تم الدفع";
  }

  return "لم يتم الدفع";
}

function getPaymentTone(
  paymentStatus: string | null,
) {
  if (
    paymentStatus === "paid" ||
    paymentStatus === "completed"
  ) {
    return "done";
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

function AmanatPage() {
  const [amanat, setAmanat] =
    useState<Amanat[]>([]);

  const [pickupPoints, setPickupPoints] =
    useState<PickupPoint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  async function loadAmanat(
    showLoading = true,
  ) {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError("");

    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError || !user) {
      setError(
        "يجب تسجيل الدخول أولاً.",
      );

      setLoading(false);
      setRefreshing(false);

      return;
    }

    const [
      amanatResult,
      pickupResult,
    ] = await Promise.all([
      supabase
        .from("amanat")
        .select(
          `
            id,
            reference_number,
            owner_id,
            pickup_point_id,
            status,
            description,
            notes,
            stored_at,
            collected_at,
            receiver_name,
            receiver_phone,
            storage_fee,
            pricing_status,
            payment_status
          `,
        )
        .eq("owner_id", user.id)
        .order("stored_at", {
          ascending: false,
        }),

      supabase
        .from("pickup_points")
        .select(
          "id,name,address",
        )
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        }),
    ]);

    if (amanatResult.error) {
      console.error(
        "AMANAT ERROR:",
        amanatResult.error,
      );

      setError(
        "تعذر تحميل أماناتك. تحقق من اتصال قاعدة البيانات وصلاحيات الحساب.",
      );

      setAmanat([]);
    } else {
      setAmanat(
        (amanatResult.data ??
          []) as Amanat[],
      );
    }

    if (pickupResult.error) {
      console.error(
        "PICKUP POINTS ERROR:",
        pickupResult.error,
      );

      setPickupPoints([]);
    } else {
      setPickupPoints(
        (pickupResult.data ??
          []) as PickupPoint[],
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadAmanat(true);
  }, []);

  useEffect(() => {
    let channel:
      ReturnType<
        typeof supabase.channel
      > | null = null;

    async function subscribeToChanges() {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        return;
      }

      channel = supabase
        .channel(
          `amanat-client-${user.id}`,
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "amanat",
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            loadAmanat(false);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "amanat",
            filter: `owner_id=eq.${user.id}`,
          },
          () => {
            loadAmanat(false);
          },
        )
        .subscribe();
    }

    subscribeToChanges();

    return () => {
      if (channel) {
        supabase.removeChannel(
          channel,
        );
      }
    };
  }, []);

  useEffect(() => {
    const interval =
      window.setInterval(() => {
        loadAmanat(false);
      }, 15000);

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, []);

  const pickupPointMap =
    useMemo(() => {
      return new Map(
        pickupPoints.map(
          (point) => [
            point.id,
            point,
          ],
        ),
      );
    }, [pickupPoints]);

  const filteredAmanat =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return amanat.filter(
        (item) => {
          const matchesSearch =
            !searchValue ||
            item.reference_number
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            (
              item.receiver_name ??
              ""
            )
              .toLowerCase()
              .includes(
                searchValue,
              ) ||
            (
              item.receiver_phone ??
              ""
            )
              .toLowerCase()
              .includes(
                searchValue,
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            item.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      amanat,
      search,
      statusFilter,
    ]);

  const total =
    amanat.length;

  const stored =
    amanat.filter(
      (item) =>
        item.status ===
        "stored",
    ).length;

  const ready =
    amanat.filter(
      (item) =>
        item.status ===
          "ready" ||
        item.status ===
          "ready_for_pickup",
    ).length;

  const collected =
    amanat.filter(
      (item) =>
        item.status ===
          "collected" ||
        item.status ===
          "received" ||
        item.status ===
          "completed",
    ).length;

  return (
    <DashboardShell
      title="أماناتي"
      subtitle="تابع أماناتك وحالة استلامها من مكان واحد."
      nav={[
        {
          label: "لوحة التحكم",
          icon: Package,
          to: "/dashboard",
        },
        {
          label: "أماناتي",
          icon: Package,
          to: "/amanat",
          active: true,
        },
      ]}
      actions={
        <Link
          to="/amanat/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 sm:w-auto"
        >
          <Plus className="size-4" />
          إضافة أمانة
        </Link>
      }
    >
      {/* =================================================
          الإحصائيات
      ================================================== */}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                إجمالي الأمانات
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
                {loading
                  ? "..."
                  : total}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-11">
              <Package className="size-5 text-primary" />
            </div>

          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                محفوظة
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
                {loading
                  ? "..."
                  : stored}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/10 sm:size-11">
              <Clock3 className="size-5 text-secondary" />
            </div>

          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                جاهزة للاستلام
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
                {loading
                  ? "..."
                  : ready}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 sm:size-11">
              <MapPin className="size-5 text-accent" />
            </div>

          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                تم الاستلام
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary sm:text-3xl">
                {loading
                  ? "..."
                  : collected}
              </p>
            </div>

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 sm:size-11">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>

          </div>
        </Card>

      </div>

      {/* =================================================
          البحث والفلاتر
      ================================================== */}

      <Card className="min-w-0 p-4 sm:p-5">

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">

          <div className="flex min-w-0 w-full items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 sm:px-4 lg:flex-1">

            <Search className="size-5 shrink-0 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="ابحث برقم الأمانة أو اسم المستلم أو رقم الهاتف..."
              className="min-w-0 w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />

          </div>

          <div className="flex w-full min-w-0 gap-2 overflow-x-auto pb-1 lg:w-auto lg:flex-wrap lg:overflow-visible lg:pb-0">

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "all",
                )
              }
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition sm:px-4 ${
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
                  "stored",
                )
              }
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition sm:px-4 ${
                statusFilter ===
                "stored"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              محفوظة
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "ready_for_pickup",
                )
              }
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition sm:px-4 ${
                statusFilter ===
                "ready_for_pickup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              جاهزة للاستلام
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "collected",
                )
              }
              className={`shrink-0 rounded-xl px-3.5 py-2.5 text-sm font-bold transition sm:px-4 ${
                statusFilter ===
                "collected"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              تم الاستلام
            </button>

            <button
              type="button"
              onClick={() =>
                loadAmanat(false)
              }
              disabled={refreshing}
              className="shrink-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-bold text-primary transition hover:bg-muted disabled:opacity-50 sm:px-4"
            >
              {refreshing
                ? "جاري التحديث..."
                : "تحديث"}
            </button>

          </div>

        </div>

      </Card>

      {/* =================================================
          قائمة الأمانات
      ================================================== */}

      <Card className="min-w-0 overflow-hidden">

        {loading ? (
          <div className="px-4 py-14 text-center sm:px-5 sm:py-16">

            <Clock3 className="mx-auto size-9 animate-pulse text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              جاري تحميل أماناتك...
            </p>

          </div>
        ) : error ? (
          <div className="px-4 py-14 text-center sm:px-5 sm:py-16">

            <Package className="mx-auto size-10 text-red-500" />

            <p className="mt-4 text-sm font-bold text-red-600">
              حدث خطأ أثناء تحميل الأمانات
            </p>

            <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadAmanat(true)
              }
              className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              المحاولة مرة أخرى
            </button>

          </div>
        ) : filteredAmanat.length === 0 ? (
          <div className="px-4 py-14 text-center sm:px-5 sm:py-16">

            <Package className="mx-auto size-10 text-muted-foreground" />

            <p className="mt-4 text-sm font-bold text-primary">
              {amanat.length === 0
                ? "لا توجد أمانات حتى الآن"
                : "لا توجد نتائج مطابقة"}
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {amanat.length === 0
                ? "عند إضافة أمانة جديدة ستظهر هنا."
                : "جرّب تغيير البحث أو فلتر الحالة."}
            </p>

            {amanat.length === 0 && (
              <Link
                to="/amanat/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Plus className="size-4" />
                إضافة أمانة
              </Link>
            )}

          </div>
        ) : (
          <>
            {/* =================================================
                MOBILE CARDS
            ================================================== */}

            <div className="grid gap-3 p-3 sm:hidden">

              {filteredAmanat.map(
                (item) => {
                  const pickupPoint =
                    item.pickup_point_id
                      ? pickupPointMap.get(
                          item.pickup_point_id,
                        )
                      : null;

                  const formattedFee =
                    formatFee(
                      item.storage_fee,
                    );

                  const pricingLabel =
                    getPricingLabel(
                      item.pricing_status,
                      item.storage_fee,
                    );

                  const paymentLabel =
                    getPaymentLabel(
                      item.payment_status,
                    );

                  const paymentTone =
                    getPaymentTone(
                      item.payment_status,
                    );

                  return (
                    <div
                      key={item.id}
                      className="min-w-0 rounded-2xl border border-border bg-background p-4"
                    >

                      {/* الرقم والحالة */}

                      <div className="flex min-w-0 items-start justify-between gap-3">

                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground">
                            رقم الأمانة
                          </p>

                          <p
                            className="mt-1 break-all font-mono text-sm font-extrabold text-primary"
                            dir="ltr"
                          >
                            {item.reference_number}
                          </p>

                          <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                            {formatDate(
                              item.stored_at,
                            )}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge
                            tone={getStatusTone(
                              item.status,
                            )}
                          >
                            {getStatusLabel(
                              item.status,
                            )}
                          </StatusBadge>
                        </div>

                      </div>

                      {/* المستلم */}

                      <div className="mt-4 grid gap-3">

                        <div className="rounded-xl bg-muted/30 p-3">

                          <div className="flex items-start gap-2">

                            <User className="mt-0.5 size-4 shrink-0 text-primary" />

                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground">
                                المستلم
                              </p>

                              <p className="mt-1 break-words text-sm font-bold text-primary">
                                {item.receiver_name ||
                                  "غير محدد"}
                              </p>
                            </div>

                          </div>

                        </div>

                        <div className="rounded-xl bg-muted/30 p-3">

                          <div className="flex items-start gap-2">

                            <PhoneIcon />

                            <div className="min-w-0">
                              <p className="text-[10px] text-muted-foreground">
                                رقم الهاتف
                              </p>

                              <p
                                className="mt-1 break-all text-sm font-bold text-primary"
                                dir="ltr"
                              >
                                {item.receiver_phone ||
                                  "غير محدد"}
                              </p>
                            </div>

                          </div>

                        </div>

                      </div>

                      {/* نقطة الاستلام */}

                      <div className="mt-3 rounded-xl bg-muted/30 p-3">

                        <div className="flex items-start gap-2">

                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                          <div className="min-w-0">

                            <p className="text-[10px] text-muted-foreground">
                              نقطة الاستلام
                            </p>

                            <p className="mt-1 break-words text-sm font-bold text-primary">
                              {pickupPoint?.name ||
                                "غير محددة"}
                            </p>

                            {pickupPoint?.address && (
                              <p className="mt-1 break-words text-[10px] leading-5 text-muted-foreground">
                                {
                                  pickupPoint.address
                                }
                              </p>
                            )}

                          </div>

                        </div>

                      </div>

                      {/* السعر والدفع */}

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">

                        <div className="rounded-xl border border-border p-3">

                          <div className="flex items-start gap-2">

                            <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />

                            <div className="min-w-0">

                              <p className="text-[10px] text-muted-foreground">
                                السعر
                              </p>

                              {formattedFee ? (
                                <>
                                  <p className="mt-1 break-words text-sm font-extrabold text-primary">
                                    {formattedFee}
                                  </p>

                                  <p className="mt-1 text-[10px] font-bold text-green-600">
                                    {pricingLabel}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="mt-1 text-xs font-bold text-muted-foreground">
                                    لم يتم تحديد السعر
                                  </p>

                                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                                    بانتظار مراجعة الإدارة
                                  </p>
                                </>
                              )}

                            </div>

                          </div>

                        </div>

                        <div className="rounded-xl border border-border p-3">

                          <p className="text-[10px] text-muted-foreground">
                            حالة الدفع
                          </p>

                          <div className="mt-2">
                            <StatusBadge
                              tone={
                                paymentTone
                              }
                            >
                              {paymentLabel}
                            </StatusBadge>
                          </div>

                          {paymentLabel ===
                            "لم يتم الدفع" &&
                            formattedFee && (
                              <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                                بعد تحديد السعر يمكنك إتمام الدفع بالطريقة المعتمدة من أمانتي.
                              </p>
                            )}

                          {paymentLabel ===
                            "تم الدفع" && (
                            <p className="mt-2 text-[10px] font-bold leading-5 text-green-600">
                              تم تسجيل الدفع من إدارة أمانتي.
                            </p>
                          )}

                        </div>

                      </div>

                      {/* الوصف والملاحظات */}

                      {(item.description ||
                        item.notes) && (
                        <div className="mt-3 rounded-xl bg-muted/30 p-3">

                          {item.description && (
                            <p className="break-words text-xs leading-6 text-muted-foreground">
                              <span className="font-bold text-primary">
                                الوصف:
                              </span>{" "}
                              {item.description}
                            </p>
                          )}

                          {item.notes && (
                            <p className="mt-1 break-words text-xs leading-6 text-muted-foreground">
                              <span className="font-bold text-primary">
                                ملاحظات:
                              </span>{" "}
                              {item.notes}
                            </p>
                          )}

                        </div>
                      )}

                      {item.collected_at && (
                        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <CheckCircle2 className="size-3.5 text-green-600" />
                          تم الاستلام:{" "}
                          {formatDate(
                            item.collected_at,
                          )}
                        </div>
                      )}

                    </div>
                  );
                },
              )}

            </div>

            {/* =================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="hidden w-full overflow-x-auto sm:block">

              <table
                className="w-full min-w-[1100px] border-collapse text-right"
                dir="rtl"
              >

                <thead>
                  <tr className="border-b border-border bg-muted/30">

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      رقم الأمانة
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      المستلم
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      الهاتف
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      نقطة الاستلام
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      الحالة
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      السعر
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold text-muted-foreground">
                      حالة الدفع
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredAmanat.map(
                    (item) => {
                      const pickupPoint =
                        item.pickup_point_id
                          ? pickupPointMap.get(
                              item.pickup_point_id,
                            )
                          : null;

                      const formattedFee =
                        formatFee(
                          item.storage_fee,
                        );

                      const pricingLabel =
                        getPricingLabel(
                          item.pricing_status,
                          item.storage_fee,
                        );

                      const paymentLabel =
                        getPaymentLabel(
                          item.payment_status,
                        );

                      const paymentTone =
                        getPaymentTone(
                          item.payment_status,
                        );

                      return (
                        <React.Fragment
                          key={item.id}
                        >

                          <tr className="border-b border-border transition-colors hover:bg-muted/20">

                            <td className="px-5 py-5 align-middle">
                              <div className="min-w-0">

                                <p
                                  className="break-all font-mono text-sm font-extrabold text-primary"
                                  dir="ltr"
                                >
                                  {
                                    item.reference_number
                                  }
                                </p>

                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  تمت الإضافة:
                                </p>

                                <p className="text-[11px] text-muted-foreground">
                                  {formatDate(
                                    item.stored_at,
                                  )}
                                </p>

                              </div>
                            </td>

                            <td className="px-5 py-5 align-middle">

                              <div className="flex items-center gap-2">

                                <User className="size-4 shrink-0 text-primary" />

                                <p className="break-words text-sm font-bold text-primary">
                                  {
                                    item.receiver_name ||
                                    "غير محدد"
                                  }
                                </p>

                              </div>

                            </td>

                            <td className="px-5 py-5 align-middle">

                              <p
                                className="break-all text-sm text-muted-foreground"
                                dir="ltr"
                              >
                                {
                                  item.receiver_phone ||
                                  "غير محدد"
                                }
                              </p>

                            </td>

                            <td className="px-5 py-5 align-middle">

                              <div className="flex items-start gap-2">

                                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                                <div className="min-w-0">

                                  <p className="break-words text-sm font-bold text-primary">
                                    {
                                      pickupPoint?.name ||
                                      "غير محددة"
                                    }
                                  </p>

                                  {pickupPoint?.address && (
                                    <p className="mt-1 break-words text-[10px] text-muted-foreground">
                                      {
                                        pickupPoint.address
                                      }
                                    </p>
                                  )}

                                </div>

                              </div>

                            </td>

                            <td className="px-5 py-5 align-middle">

                              <StatusBadge
                                tone={getStatusTone(
                                  item.status,
                                )}
                              >
                                {getStatusLabel(
                                  item.status,
                                )}
                              </StatusBadge>

                              {item.collected_at && (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {formatDate(
                                    item.collected_at,
                                  )}
                                </p>
                              )}

                            </td>

                            <td className="px-5 py-5 align-middle">

                              <div className="flex items-start gap-3">

                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                  <CreditCard className="size-5 text-primary" />
                                </div>

                                <div className="min-w-0">

                                  {formattedFee ? (
                                    <>
                                      <p className="break-words text-base font-extrabold text-primary">
                                        {
                                          formattedFee
                                        }
                                      </p>

                                      <p className="mt-1 text-[11px] font-bold text-green-600">
                                        {
                                          pricingLabel
                                        }
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-bold text-muted-foreground">
                                        لم يتم تحديد السعر
                                      </p>

                                      <p className="mt-1 text-[11px] text-muted-foreground">
                                        بانتظار مراجعة الإدارة
                                      </p>
                                    </>
                                  )}

                                </div>

                              </div>

                            </td>

                            <td className="px-5 py-5 align-middle">

                              <div className="min-w-[170px]">

                                <StatusBadge
                                  tone={
                                    paymentTone
                                  }
                                >
                                  {
                                    paymentLabel
                                  }
                                </StatusBadge>

                                {paymentLabel ===
                                  "لم يتم الدفع" &&
                                  formattedFee && (
                                    <p className="mt-2 text-[10px] leading-5 text-muted-foreground">
                                      بعد تحديد السعر، يمكنك إتمام الدفع بالطريقة المعتمدة من أمانتي.
                                    </p>
                                  )}

                                {paymentLabel ===
                                  "تم الدفع" && (
                                  <p className="mt-2 text-[10px] font-bold leading-5 text-green-600">
                                    تم تسجيل الدفع من إدارة أمانتي.
                                  </p>
                                )}

                              </div>

                            </td>

                          </tr>

                          {(item.description ||
                            item.notes) && (
                            <tr className="border-b border-border">

                              <td
                                colSpan={7}
                                className="px-5 pb-5 pt-0"
                              >

                                <div className="rounded-xl bg-muted/30 px-4 py-3">

                                  {item.description && (
                                    <p className="break-words text-xs text-muted-foreground">
                                      <span className="font-bold text-primary">
                                        الوصف:
                                      </span>{" "}
                                      {
                                        item.description
                                      }
                                    </p>
                                  )}

                                  {item.notes && (
                                    <p className="mt-1 break-words text-xs text-muted-foreground">
                                      <span className="font-bold text-primary">
                                        ملاحظات:
                                      </span>{" "}
                                      {
                                        item.notes
                                      }
                                    </p>
                                  )}

                                </div>

                              </td>

                            </tr>
                          )}

                        </React.Fragment>
                      );
                    },
                  )}
                </tbody>

              </table>

            </div>
          </>
        )}

      </Card>

      {/* =================================================
          ملاحظة النظام
      ================================================== */}

      {amanat.length > 0 && (
        <Card className="border-border bg-muted/20 p-4 sm:p-5">

          <div className="flex items-start gap-3">

            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="size-5 text-primary" />
            </div>

            <div className="min-w-0">

              <p className="text-sm font-extrabold text-primary">
                آلية تحديد الرسوم والدفع
              </p>

              <p className="mt-1 break-words text-xs leading-6 text-muted-foreground">
                تقوم إدارة أمانتي بمراجعة بيانات وصور الأمانة
                وتحديد الرسوم المناسبة. سيظهر السعر تلقائيًا
                في حسابك بعد اعتماده، ثم يتم تحديث حالة الدفع
                من قبل إدارة أمانتي بعد استلام المبلغ.
              </p>

            </div>

          </div>

        </Card>
      )}

      {/* =================================================
          العودة
      ================================================== */}

      <div>
        <Link
          to="/dashboard"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-muted/80 sm:w-auto"
        >
          <ArrowRight className="size-4" />
          العودة للوحة التحكم
        </Link>
      </div>

    </DashboardShell>
  );
}

/*
 * أيقونة الهاتف بشكل منفصل حتى يبقى
 * قسم بطاقات الجوال مرتبًا.
 */
function PhoneIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 size-4 shrink-0 text-primary"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}