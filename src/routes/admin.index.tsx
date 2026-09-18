import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShieldCheck,
  Store,
  Users,
  Car,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  Truck,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, StatCard, StatusBadge } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/admin-login",
      });
    }

    const role = session.user.app_metadata?.role;

    if (role !== "admin") {
      throw redirect({
        to: "/",
      });
    }
  },

  head: () => ({
    meta: [
      { title: "لوحة الإدارة | أمانتي AMANATI" },
      {
        name: "description",
        content:
          "نظرة عامة على الشحنات والأمانات ونقاط الاستلام في أمانتي.",
      },
      {
        property: "og:title",
        content: "لوحة الإدارة | أمانتي",
      },
      {
        property: "og:description",
        content:
          "متابعة العمليات ونقاط الاستلام والشحنات.",
      },
    ],
  }),

  component: AdminDashboard,
});

/* =========================
   Navigation
========================= */

const nav = [
  {
    label: "نظرة عامة",
    icon: LayoutDashboard,
    active: true,
    to: "/admin/",
  },
  {
    label: "الشحنات",
    icon: Package,
    to: "/admin/shipments",
  },
  {
    label: "الأمانات",
    icon: ShieldCheck,
    to: "/admin/amanat",
  },
  {
    label: "التاجر",
    icon: Store,
    to: "/admin/merchants",
  },
  {
    label: "العملاء",
    icon: Users,
    to: "/admin/customers",
  },
  {
    label: "السائقون",
    icon: Car,
    to: "/admin/drivers",
  },
  {
    label: "نقاط الاستلام",
    icon: MapPin,
    to: "/admin/pickup-points",
  },
  {
    label: "المدفوعات",
    icon: CreditCard,
    to: "/admin/payments",
  },
  {
    label: "الإشعارات",
    icon: Bell,
    to: "/admin/notifications",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    to: "/admin/settings",
  },
];

/* =========================
   Types
========================= */

type ShipmentRow = {
  id: string;
  tracking_number: string;
  receiver_name: string;
  receiver_phone: string;
  status: string;
  shipping_fee: number;
  created_at: string;
  from_city: { name: string } | null;
  to_city: { name: string } | null;
};

type CityStats = {
  name: string;
  points: number;
};

/* =========================
   Helpers
========================= */

function getStatusTone(
  status: string,
): "pending" | "transit" | "ready" | "done" | "stored" {
  switch (status) {
    case "delivered":
    case "completed":
    case "received":
      return "done";

    case "ready":
    case "ready_for_pickup":
      return "ready";

    case "in_transit":
    case "transit":
      return "transit";

    case "stored":
    case "stored_amanat":
      return "stored";

    default:
      return "pending";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "قيد المعالجة";

    case "in_transit":
    case "transit":
      return "في الطريق";

    case "ready":
    case "ready_for_pickup":
      return "جاهزة للاستلام";

    case "delivered":
    case "completed":
      return "تم التسليم";

    case "received":
      return "تم الاستلام";

    case "stored":
    case "stored_amanat":
      return "أمانة محفوظة";

    default:
      return status || "غير محدد";
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

/* =========================
   Dashboard
========================= */

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalShipments: 0,
    inTransit: 0,
    readyForPickup: 0,
    delivered: 0,
    storedAmanat: 0,
  });

  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [cities, setCities] = useState<CityStats[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      /*
       * ============================================
       * 1. الحصول على الجلسة الحالية
       * ============================================
       */

      let {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      /*
       * إذا لم توجد جلسة نحاول تحديثها
       */
      if (!session) {
        const refreshResult =
          await supabase.auth.refreshSession();

        session = refreshResult.data.session;
        sessionError = refreshResult.error;
      }

      if (sessionError || !session) {
        console.error(
          "ADMIN SESSION ERROR:",
          sessionError,
        );

        if (!cancelled) {
          setErrorMessage(
            "جلسة الأدمن غير صالحة. افتح صفحة الأدمن من جديد.",
          );
          setLoading(false);
        }

        return;
      }

      /*
       * ============================================
       * 2. تحديث الجلسة للحصول على JWT جديد
       * ============================================
       */

      const refreshResult =
        await supabase.auth.refreshSession();

      if (refreshResult.data.session) {
        session = refreshResult.data.session;
      }

      /*
       * ============================================
       * 3. التأكد أن الحساب Admin
       * ============================================
       */

      const role = session.user.app_metadata?.role;

      console.log(
        "ADMIN USER:",
        session.user.email,
      );

      console.log(
        "ADMIN ROLE:",
        role,
      );

      if (role !== "admin") {
        console.error(
          "ADMIN ACCESS DENIED. ROLE:",
          role,
        );

        if (!cancelled) {
          setErrorMessage(
            "هذا الحساب ليس لديه صلاحية مدير النظام.",
          );
          setLoading(false);
        }

        return;
      }

      /*
       * ============================================
       * 4. تحميل إحصائيات الشحنات والأمانات
       * ============================================
       */

      const [
        totalResult,
        transitResult,
        readyResult,
        deliveredResult,
        amanatResult,
      ] = await Promise.all([
        supabase
          .from("shipments")
          .select("id", {
            count: "exact",
            head: true,
          }),

        supabase
          .from("shipments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("status", [
            "in_transit",
            "transit",
          ]),

        supabase
          .from("shipments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("status", [
            "ready",
            "ready_for_pickup",
          ]),

        supabase
          .from("shipments")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("status", [
            "delivered",
            "completed",
          ]),

        supabase
          .from("amanat")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("status", [
            "stored",
            "stored_amanat",
          ]),
      ]);

      /*
       * ============================================
       * 5. آخر الشحنات
       * ============================================
       */

      const shipmentsResult =
        await supabase
          .from("shipments")
          .select(`
            id,
            tracking_number,
            receiver_name,
            receiver_phone,
            status,
            shipping_fee,
            created_at,
            from_city:cities!shipments_from_city_id_fkey(name),
            to_city:cities!shipments_to_city_id_fkey(name)
          `)
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

      /*
       * ============================================
       * 6. المدن ونقاط الاستلام
       * ============================================
       */

      const citiesResult =
        await supabase
          .from("cities")
          .select(`
            id,
            name,
            pickup_points(id)
          `)
          .order("name");

      /*
       * ============================================
       * 7. فحص الأخطاء
       * ============================================
       */

      const errors = [
        totalResult.error,
        transitResult.error,
        readyResult.error,
        deliveredResult.error,
        amanatResult.error,
        shipmentsResult.error,
        citiesResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        console.error(
          "ADMIN DATABASE ERRORS:",
          errors,
        );

        if (!cancelled) {
          setErrorMessage(
            "تعذر تحميل بيانات لوحة الإدارة. تحقق من صلاحيات Supabase.",
          );
        }
      }

      /*
       * ============================================
       * 8. تحديث الإحصائيات
       * ============================================
       */

      if (!cancelled) {
        setStats({
          totalShipments:
            totalResult.count ?? 0,

          inTransit:
            transitResult.count ?? 0,

          readyForPickup:
            readyResult.count ?? 0,

          delivered:
            deliveredResult.count ?? 0,

          storedAmanat:
            amanatResult.count ?? 0,
        });

        setShipments(
          (shipmentsResult.data ??
            []) as ShipmentRow[],
        );

        const cityData: CityStats[] = (
          citiesResult.data ?? []
        ).map((city: any) => ({
          name: city.name,
          points: Array.isArray(
            city.pickup_points,
          )
            ? city.pickup_points.length
            : 0,
        }));

        setCities(cityData);

        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell
      title="نظرة عامة"
      subtitle="ملخص عمليات أمانتي لهذا الأسبوع."
      nav={nav}
    >
      {/* =========================
          Statistics
      ========================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="إجمالي الشحنات"
          value={stats.totalShipments}
          icon={Package}
          tone="navy"
        />

        <StatCard
          label="قيد النقل"
          value={stats.inTransit}
          icon={Truck}
          tone="teal"
        />

        <StatCard
          label="جاهزة للاستلام"
          value={stats.readyForPickup}
          icon={PackageCheck}
          tone="amber"
        />

        <StatCard
          label="تم التسليم"
          value={stats.delivered}
          icon={CheckCircle2}
          tone="green"
        />

        <StatCard
          label="الأمانات الموجودة"
          value={stats.storedAmanat}
          icon={ShieldCheck}
          tone="navy"
        />
      </div>

      {/* =========================
          Main dashboard
      ========================= */}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary">
            حركة الشحنات
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            الإحصائيات مرتبطة ببيانات الشحنات الحالية.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                إجمالي الشحنات
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {stats.totalShipments}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                قيد النقل
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {stats.inTransit}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                جاهزة للاستلام
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {stats.readyForPickup}
              </p>
            </div>

            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                تم التسليم
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {stats.delivered}
              </p>
            </div>
          </div>
        </Card>

        {/* Pickup points */}

        <Card className="p-6">
          <h2 className="text-lg font-bold text-primary">
            نقاط الاستلام حسب المدينة
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            بيانات حقيقية من نقاط الاستلام.
          </p>

          {cities.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              لا توجد نقاط استلام حتى الآن.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {cities.map((city) => {
                const maxPoints = Math.max(
                  ...cities.map(
                    (c) => c.points,
                  ),
                  1,
                );

                return (
                  <div key={city.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-primary">
                        {city.name}
                      </span>

                      <span className="text-muted-foreground">
                        {city.points} نقاط
                      </span>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${
                            (city.points /
                              maxPoints) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* =========================
          Latest shipments
      ========================= */}

      <section>
        <h2 className="text-lg font-bold text-primary">
          آخر الشحنات
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          أحدث الشحنات من قاعدة بيانات أمانتي.
        </p>

        <Card className="mt-4 overflow-hidden">
          {loading ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              جاري تحميل بيانات أمانتي...
            </div>
          ) : errorMessage ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-bold text-red-600">
                حدث خطأ أثناء تحميل البيانات.
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {errorMessage}
              </p>
            </div>
          ) : shipments.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Package className="mx-auto size-10 text-muted-foreground" />

              <p className="mt-3 text-sm font-bold text-primary">
                لا توجد شحنات حتى الآن
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                ستظهر الشحنات هنا عند إنشاء أول شحنة.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs font-bold text-muted-foreground lg:grid">
                <span>رقم الشحنة</span>
                <span>من</span>
                <span>إلى</span>
                <span>المستلم</span>
                <span>الحالة</span>
              </div>

              <div className="divide-y divide-border">
                {shipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr_1fr] lg:items-center lg:gap-4"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold text-primary">
                        {shipment.tracking_number}
                      </p>

                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDate(
                          shipment.created_at,
                        )}
                      </p>
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {shipment.from_city?.name ??
                        "غير محدد"}
                    </span>

                    <span className="text-sm text-muted-foreground">
                      {shipment.to_city?.name ??
                        "غير محدد"}
                    </span>

                    <div>
                      <p className="text-sm font-medium text-primary">
                        {shipment.receiver_name}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {shipment.receiver_phone}
                      </p>
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
                ))}
              </div>
            </>
          )}
        </Card>
      </section>
    </DashboardShell>
  );
}
