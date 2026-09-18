import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Users,
  BarChart3,
  Settings,
  Plus,
  Truck,
  PackageCheck,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "@/components/amanati/DashboardShell";
import {
  Card,
  StatCard,
  StatusBadge,
  buttonClass,
} from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/dashboard/backup")({
  head: () => ({
    meta: [
      { title: "لوحة التاجر | أمانتي AMANATI" },
      {
        name: "description",
        content:
          "إدارة العملاء والشحنات والأمانات من لوحة تحكم واحدة في أمانتي.",
      },
      {
        property: "og:title",
        content: "لوحة التاجر | أمانتي",
      },
      {
        property: "og:description",
        content:
          "إدارة العملاء والشحنات من مكان واحد.",
      },
    ],
  }),
  component: MerchantDashboard,
});

const nav = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    to: "/merchant",
    active: true,
  },
  {
    label: "الطلبات",
    icon: ClipboardList,
    to: "/merchant/orders",
  },
  {
    label: "الأمانات",
    icon: ShieldCheck,
    to: "/merchant/amanat",
  },
  {
    label: "العملاء",
    icon: Users,
    to: "/merchant/customers",
  },
  {
    label: "التقارير",
    icon: BarChart3,
    to: "/merchant/reports",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    to: "/merchant/settings",
  },
];

type MerchantShipment = {
  id: string;
  tracking_number: string | null;
  receiver_name: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  from_city: {
    name: string;
  } | null;
  to_city: {
    name: string;
  } | null;
};

type MerchantProfile = {
  full_name: string | null;
  role: string | null;
};

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

function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

function MerchantDashboard() {
  const [profile, setProfile] =
    useState<MerchantProfile | null>(null);

  const [shipments, setShipments] = useState<
    MerchantShipment[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadMerchantDashboard(
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
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى لوحة التاجر.",
        );
      }

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error(
          "MERCHANT PROFILE ERROR:",
          profileError,
        );

        throw new Error(
          "تعذر تحميل بيانات التاجر.",
        );
      }

      if (profileData.role !== "merchant") {
        throw new Error(
          "هذا الحساب ليس حساب تاجر.",
        );
      }

      setProfile(profileData);

      const {
        data: shipmentData,
        error: shipmentError,
      } = await supabase
        .from("shipments")
        .select(`
          id,
          tracking_number,
          receiver_name,
          status,
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
        .order("updated_at", {
          ascending: false,
        });

      if (shipmentError) {
        console.error(
          "MERCHANT SHIPMENTS ERROR:",
          shipmentError,
        );

        throw new Error(
          "تعذر تحميل شحنات التاجر.",
        );
      }

      setShipments(
        (shipmentData || []) as MerchantShipment[],
      );
    } catch (loadError) {
      console.error(
        "MERCHANT DASHBOARD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل لوحة التاجر.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadMerchantDashboard();
  }, []);

  const totalShipments = shipments.length;

  const inTransitCount = shipments.filter(
    (shipment) =>
      shipment.status === "in_transit" ||
      shipment.status === "transit",
  ).length;

  const readyCount = shipments.filter(
    (shipment) =>
      shipment.status === "ready_for_pickup" ||
      shipment.status === "ready",
  ).length;

  const receivedCount = shipments.filter(
    (shipment) =>
      shipment.status === "received" ||
      shipment.status === "collected",
  ).length;

  const visibleShipments = shipments.slice(0, 5);

  const merchantName =
    profile?.full_name?.trim() || "التاجر";

  return (
    <DashboardShell
      title={`مرحباً، ${merchantName} 👋`}
      subtitle="متابعة طلبات عملائك وشحناتك."
      nav={nav}
      actions={
        <Link
          to="/shipments/new"
          className={buttonClass("primary", "md")}
        >
          <Plus className="size-4" />
          إضافة شحنة
        </Link>
      }
    >
      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            جاري تحميل لوحة التاجر...
          </div>
        </div>
      ) : error ? (
        <Card className="p-6">
          <div className="text-center">
            <p className="font-bold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadMerchantDashboard(true);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-muted"
            >
              <RefreshCw className="size-4" />
              إعادة المحاولة
            </button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="إجمالي الطلبات"
              value={totalShipments.toLocaleString("ar-YE")}
              icon={ClipboardList}
              tone="navy"
            />

            <StatCard
              label="قيد الشحن"
              value={inTransitCount.toLocaleString("ar-YE")}
              icon={Truck}
              tone="teal"
            />

            <StatCard
              label="جاهزة للاستلام"
              value={readyCount.toLocaleString("ar-YE")}
              icon={PackageCheck}
              tone="amber"
            />

            <StatCard
              label="تم الاستلام"
              value={receivedCount.toLocaleString("ar-YE")}
              icon={CheckCircle2}
              tone="green"
            />
          </div>

          <section>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4">
              <h2 className="truncate text-lg font-bold text-primary">
                إدارة الشحنات
              </h2>

              <span className="text-xs text-muted-foreground">
                {totalShipments.toLocaleString("ar-YE")} شحنة
              </span>

              <button
                type="button"
                onClick={() => {
                  void loadMerchantDashboard(true);
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-primary disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${
                    refreshing
                      ? "animate-spin"
                      : ""
                  }`}
                />
                تحديث
              </button>
            </div>

            <Card className="mt-4 overflow-hidden">
              {visibleShipments.length === 0 ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center px-5 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/5">
                    <PackageCheck className="size-7 text-primary" />
                  </div>

                  <p className="mt-4 font-bold text-primary">
                    لا توجد شحنات حتى الآن
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    ابدأ بإضافة أول شحنة لتظهر هنا.
                  </p>

                  <Link
                    to="/shipments/new"
                    className={
                      buttonClass("primary", "sm") +
                      " mt-5"
                    }
                  >
                    <Plus className="size-4" />
                    إضافة شحنة
                  </Link>
                </div>
              ) : (
                <>
                  <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs font-bold text-muted-foreground lg:grid">
                    <span>رقم الشحنة</span>
                    <span>من</span>
                    <span>الوجهة</span>
                    <span>الحالة</span>
                    <span>آخر تحديث</span>
                  </div>

                  <div className="divide-y divide-border">
                    {visibleShipments.map(
                      (shipment) => (
                        <Link
                          key={shipment.id}
                          to="/shipments/$id"
                          params={{
                            id:
                              shipment.tracking_number ||
                              shipment.id,
                          }}
                          className="grid gap-2 px-5 py-4 transition-colors hover:bg-muted/60 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr] lg:items-center lg:gap-4"
                        >
                          <div className="min-w-0">
                            <span className="font-mono text-sm font-bold text-primary">
                              {shipment.tracking_number ||
                                shipment.id}
                            </span>

                            {shipment.receiver_name && (
                              <p className="mt-1 truncate text-xs text-muted-foreground lg:hidden">
                                المستلم:{" "}
                                {shipment.receiver_name}
                              </p>
                            )}
                          </div>

                          <span className="text-sm text-muted-foreground">
                            {shipment.from_city?.name ||
                              "—"}
                          </span>

                          <span className="text-sm text-muted-foreground">
                            {shipment.to_city?.name ||
                              "—"}
                          </span>

                          <span>
                            <StatusBadge
                              tone={getStatusTone(
                                shipment.status,
                              )}
                            >
                              {getStatusLabel(
                                shipment.status,
                              )}
                            </StatusBadge>
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              shipment.updated_at ||
                                shipment.created_at,
                            )}
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                </>
              )}
            </Card>

            {totalShipments > 5 && (
              <div className="mt-4 text-center">
                <Link
                  to="/shipments"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  عرض جميع الشحنات
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardShell>
  );
}
