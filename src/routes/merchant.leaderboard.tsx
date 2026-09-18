import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  Check,
  CheckCircle2,
  Crown,
  Flame,
  Loader2,
  Medal,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/leaderboard")({
  head: () => ({
    meta: [
      {
        title: "المتصدرين | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "تابع ترتيبك وإنجازاتك ومؤشرات أداء متجرك ضمن شبكة تجار أمانتي.",
      },
    ],
  }),
  component: MerchantLeaderboardPage,
});

type MerchantProfile = {
  full_name: string | null;
  role: string | null;
};

type MerchantShipment = {
  id: string;
  merchant_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type LeaderboardMerchant = {
  id: string;
  name: string;
  shipments: number;
  completed: number;
  active: number;
  score: number;
};

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
    status === "pending" ||
    status === "in_transit" ||
    status === "transit" ||
    status === "ready_for_pickup" ||
    status === "ready"
  );
}

function getInitials(name: string) {
  const clean = name.trim();

  if (!clean) {
    return "؟";
  }

  return clean.charAt(0);
}

function formatNumber(value: number) {
  return value.toLocaleString("ar-YE");
}

function MerchantLeaderboardPage() {
  const [profile, setProfile] =
    useState<MerchantProfile | null>(null);

  const [merchantShipments, setMerchantShipments] =
    useState<MerchantShipment[]>([]);

  const [leaderboard, setLeaderboard] =
    useState<LeaderboardMerchant[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadLeaderboard(
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
          "يجب تسجيل الدخول للوصول إلى لوحة المتصدرين.",
        );
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "LEADERBOARD PROFILE ERROR:",
          profileError,
        );

        throw new Error(
          "تعذر تحميل بيانات التاجر.",
        );
      }

      if (profileData.role !== "merchant") {
        throw new Error(
          "هذه الصفحة مخصصة لحسابات التجار فقط.",
        );
      }

      setProfile(profileData);

      /*
       * =====================================================
       * شحنات التاجر الحالي
       * =====================================================
       */
      const {
        data: ownShipments,
        error: ownShipmentsError,
      } = await supabase
        .from("shipments")
        .select(`
          id,
          merchant_id,
          status,
          created_at,
          updated_at
        `)
        .eq("merchant_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (ownShipmentsError) {
        console.error(
          "LEADERBOARD OWN SHIPMENTS ERROR:",
          ownShipmentsError,
        );

        throw new Error(
          "تعذر تحميل أداء متجرك.",
        );
      }

      setMerchantShipments(
        (ownShipments ?? []) as MerchantShipment[],
      );

      /*
       * =====================================================
       * جلب التجار
       *
       * لا نفترض وجود جدول خاص بالمتصدرين.
       * نستخدم profiles الموجود أصلًا.
       * =====================================================
       */
      const {
        data: merchants,
        error: merchantsError,
      } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("role", "merchant");

      if (merchantsError) {
        console.error(
          "LEADERBOARD MERCHANTS ERROR:",
          merchantsError,
        );

        /*
         * إذا كانت سياسة RLS تمنع رؤية باقي التجار،
         * لا نفشل الصفحة بالكامل.
         */
        setLeaderboard([]);
      } else {
        const merchantIds = (merchants ?? []).map(
          (merchant) => merchant.id,
        );

        if (merchantIds.length > 0) {
          const {
            data: allShipments,
            error: allShipmentsError,
          } = await supabase
            .from("shipments")
            .select(`
              id,
              merchant_id,
              status,
              created_at,
              updated_at
            `)
            .in(
              "merchant_id",
              merchantIds,
            );

          if (allShipmentsError) {
            console.error(
              "LEADERBOARD ALL SHIPMENTS ERROR:",
              allShipmentsError,
            );

            setLeaderboard([]);
          } else {
            const shipmentList =
              (allShipments ??
                []) as MerchantShipment[];

            const calculatedLeaderboard =
              (merchants ?? []).map(
                (merchant) => {
                  const merchantRows =
                    shipmentList.filter(
                      (shipment) =>
                        shipment.merchant_id ===
                        merchant.id,
                    );

                  const completed =
                    merchantRows.filter(
                      (shipment) =>
                        isCompleted(
                          shipment.status,
                        ),
                    ).length;

                  const active =
                    merchantRows.filter(
                      (shipment) =>
                        isActive(
                          shipment.status,
                        ),
                    ).length;

                  /*
                   * النقاط الحالية:
                   * الشحنة = 1
                   * المكتملة = +3
                   *
                   * هذه معادلة مؤقتة قابلة للتعديل
                   * عندما نبني نظام النقاط النهائي.
                   */
                  const score =
                    merchantRows.length +
                    completed * 3;

                  return {
                    id: merchant.id,
                    name:
                      merchant.full_name?.trim() ||
                      "تاجر أمانتي",
                    shipments:
                      merchantRows.length,
                    completed,
                    active,
                    score,
                  };
                },
              );

            calculatedLeaderboard.sort(
              (a, b) =>
                b.score - a.score ||
                b.completed -
                  a.completed ||
                b.shipments -
                  a.shipments,
            );

            setLeaderboard(
              calculatedLeaderboard,
            );
          }
        } else {
          setLeaderboard([]);
        }
      }
    } catch (loadError) {
      console.error(
        "LEADERBOARD LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل لوحة المتصدرين.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  /*
   * =====================================================
   * بيانات التاجر الحالي
   * =====================================================
   */
  const totalShipments =
    merchantShipments.length;

  const completedShipments =
    merchantShipments.filter(
      (shipment) =>
        isCompleted(shipment.status),
    ).length;

  const activeShipments =
    merchantShipments.filter(
      (shipment) =>
        isActive(shipment.status),
    ).length;

  const completionRate =
    totalShipments > 0
      ? Math.round(
          (completedShipments /
            totalShipments) *
            100,
        )
      : 0;

  const merchantScore =
    totalShipments +
    completedShipments * 3;

  /*
   * ترتيب التاجر الحالي
   */
  const currentMerchantId =
    profile
      ? undefined
      : undefined;

  const merchantEntry = useMemo(() => {
    if (!profile) {
      return null;
    }

    const profileName =
      profile.full_name?.trim() ||
      "التاجر";

    const entry = leaderboard.find(
      (merchant) =>
        merchant.name === profileName,
    );

    return entry ?? null;
  }, [leaderboard, profile]);

  const currentRank =
    merchantEntry &&
    leaderboard.length > 0
      ? leaderboard.findIndex(
          (merchant) =>
            merchant.id ===
            merchantEntry.id,
        ) + 1
      : null;

  const topThree =
    leaderboard.slice(0, 3);

  const remainingToNextRank =
    currentRank && currentRank > 1
      ? Math.max(
          0,
          (leaderboard[
            currentRank - 2
          ]?.score ?? 0) -
            merchantScore,
        )
      : 0;

  const merchantName =
    profile?.full_name?.trim() ||
    "التاجر";

  return (
    <div
      dir="rtl"
      className="space-y-7"
    >
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-primary text-primary-foreground shadow-soft">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-white/[0.045] blur-3xl" />

          <div className="absolute -bottom-40 right-1/3 size-[30rem] rounded-full bg-white/[0.04] blur-3xl" />

          <div className="absolute right-[12%] top-[12%] size-48 rounded-full border border-white/[0.04]" />

          <div className="absolute right-[15%] top-[17%] size-32 rounded-full border border-white/[0.035]" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold text-white/70">
                <Sparkles className="size-3.5" />

                لوحة إنجازات تجار أمانتي
              </div>

              <h2 className="mt-5 text-3xl font-extrabold leading-[1.25] tracking-tight sm:text-4xl lg:text-5xl">
                تصدّر القائمة،
                <br />

                <span className="text-white/50">
                  واجعل إنجازك يُرى.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-8 text-white/60 sm:text-base">
                تابع أداء متجرك، راقب ترتيبك بين التجار،
                واعمل على رفع مستواك من خلال إنجاز المزيد
                من الشحنات وتحقيق نتائج أفضل.
              </p>
            </div>

            {/* مركز التاجر */}
            <div className="min-w-[230px] rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-extrabold">
                  {getInitials(
                    merchantName,
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-white/35">
                    حساب التاجر
                  </p>

                  <p className="mt-1 truncate text-sm font-extrabold">
                    {merchantName}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-[9px] font-bold text-white/35">
                    ترتيبك الحالي
                  </p>

                  <p className="mt-1 text-3xl font-black">
                    {currentRank
                      ? `#${formatNumber(
                          currentRank,
                        )}`
                      : "—"}
                  </p>
                </div>

                <Trophy className="size-8 text-white/20" />
              </div>
            </div>
          </div>

          {/* مؤشرات سريعة */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <BarChart3 className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  نقاطك
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {formatNumber(
                    merchantScore,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <Package className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  الشحنات
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {formatNumber(
                    totalShipments,
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <Target className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  نسبة الإنجاز
                </p>

                <p className="mt-1 text-lg font-extrabold">
                  {formatNumber(
                    completionRate,
                  )}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          تحديث / خطأ
      ===================================================== */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadLeaderboard()
              }
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          بطاقات الأداء
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-primary/5 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                نقاط الأداء
              </p>

              <p className="mt-2 text-3xl font-black text-primary">
                {formatNumber(
                  merchantScore,
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                مجموع نقاطك الحالية
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/5">
              <Zap className="size-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-emerald-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                شحنات مكتملة
              </p>

              <p className="mt-2 text-3xl font-black text-emerald-700">
                {formatNumber(
                  completedShipments,
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                تم تسليمها أو استلامها
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="size-5 text-emerald-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-sky-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                الشحنات النشطة
              </p>

              <p className="mt-2 text-3xl font-black text-sky-700">
                {formatNumber(
                  activeShipments,
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                قيد المتابعة حاليًا
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50">
              <TrendingUp className="size-5 text-sky-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-amber-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                المركز
              </p>

              <p className="mt-2 text-3xl font-black text-amber-700">
                {currentRank
                  ? `#${formatNumber(
                      currentRank,
                    )}`
                  : "—"}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                ترتيبك بين التجار
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <Trophy className="size-5 text-amber-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          منصة المتصدرين
      ===================================================== */}
      <section>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-600" />

              <h3 className="text-xl font-extrabold text-primary">
                منصة المتصدرين
              </h3>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              أفضل التجار حسب نقاط الأداء والإنجاز.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadLeaderboard(true)
            }
            disabled={
              loading || refreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-extrabold text-primary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
              : "تحديث الترتيب"}
          </button>
        </div>

        {loading ? (
          <Card className="flex min-h-[360px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/5">
                <Loader2 className="size-7 animate-spin text-primary" />
              </div>

              <p className="mt-5 text-sm font-extrabold text-primary">
                جاري تجهيز منصة المتصدرين
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                نحسب ترتيب التجار وإنجازاتهم...
              </p>
            </div>
          </Card>
        ) : topThree.length === 0 ? (
          <Card className="flex min-h-[330px] flex-col items-center justify-center p-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-amber-50">
              <Trophy className="size-9 text-amber-600" />
            </div>

            <h3 className="mt-5 text-xl font-extrabold text-primary">
              لوحة المتصدرين قيد التجهيز
            </h3>

            <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
              ستظهر هنا قائمة المتصدرين عندما تصبح
              بيانات الترتيب العامة متاحة للحساب.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3 lg:items-end">
            {/* المركز الثاني */}
            {topThree[1] && (
              <Card className="relative overflow-hidden p-6 lg:order-1 lg:min-h-[290px]">
                <div className="absolute inset-x-0 top-0 h-1 bg-slate-300" />

                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100">
                    <Medal className="size-6 text-slate-500" />
                  </div>

                  <span className="font-mono text-4xl font-black text-slate-200">
                    02
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-extrabold text-slate-600">
                    {getInitials(
                      topThree[1].name,
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-primary">
                      {topThree[1].name}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      المركز الثاني
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      النقاط
                    </p>

                    <p className="mt-1 text-2xl font-black text-primary">
                      {formatNumber(
                        topThree[1].score,
                      )}
                    </p>
                  </div>

                  <p className="text-[10px] font-bold text-muted-foreground">
                    {formatNumber(
                      topThree[1]
                        .completed,
                    )}{" "}
                    مكتملة
                  </p>
                </div>
              </Card>
            )}

            {/* المركز الأول */}
            {topThree[0] && (
              <Card className="relative order-first overflow-hidden border-amber-200 bg-gradient-to-b from-amber-50/80 to-card p-6 shadow-soft lg:order-2 lg:min-h-[340px]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-amber-400" />

                <div className="absolute -left-10 -top-10 size-32 rounded-full bg-amber-100/50 blur-2xl" />

                <div className="relative flex items-center justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-100">
                    <Crown className="size-7 text-amber-600" />
                  </div>

                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-extrabold text-amber-700">
                    <Sparkles className="size-3.5" />
                    المتصدر
                  </div>
                </div>

                <div className="relative mt-6 flex flex-col items-center text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground shadow-lg">
                    {getInitials(
                      topThree[0].name,
                    )}
                  </div>

                  <p className="mt-4 text-lg font-black text-primary">
                    {topThree[0].name}
                  </p>

                  <p className="mt-1 text-[10px] font-bold text-muted-foreground">
                    المركز الأول
                  </p>

                  <div className="mt-6">
                    <p className="text-[10px] font-bold text-muted-foreground">
                      مجموع النقاط
                    </p>

                    <p className="mt-1 text-4xl font-black text-primary">
                      {formatNumber(
                        topThree[0].score,
                      )}
                    </p>
                  </div>

                  <div className="mt-5 grid w-full grid-cols-2 gap-2">
                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-[9px] font-bold text-muted-foreground">
                        الشحنات
                      </p>

                      <p className="mt-1 text-base font-black text-primary">
                        {formatNumber(
                          topThree[0]
                            .shipments,
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/80 p-3">
                      <p className="text-[9px] font-bold text-muted-foreground">
                        مكتملة
                      </p>

                      <p className="mt-1 text-base font-black text-emerald-700">
                        {formatNumber(
                          topThree[0]
                            .completed,
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* المركز الثالث */}
            {topThree[2] && (
              <Card className="relative overflow-hidden p-6 lg:order-3 lg:min-h-[270px]">
                <div className="absolute inset-x-0 top-0 h-1 bg-orange-200" />

                <div className="flex items-center justify-between">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-50">
                    <Award className="size-6 text-orange-500" />
                  </div>

                  <span className="font-mono text-4xl font-black text-orange-100">
                    03
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-orange-50 text-sm font-extrabold text-orange-600">
                    {getInitials(
                      topThree[2].name,
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-primary">
                      {topThree[2].name}
                    </p>

                    <p className="mt-1 text-[10px] text-muted-foreground">
                      المركز الثالث
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      النقاط
                    </p>

                    <p className="mt-1 text-2xl font-black text-primary">
                      {formatNumber(
                        topThree[2].score,
                      )}
                    </p>
                  </div>

                  <p className="text-[10px] font-bold text-muted-foreground">
                    {formatNumber(
                      topThree[2]
                        .completed,
                    )}{" "}
                    مكتملة
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          ترتيب جميع التجار
      ===================================================== */}
      {leaderboard.length > 3 && (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                <Users className="size-5 text-primary" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-primary">
                  ترتيب التجار
                </h3>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  الترتيب حسب نقاط الأداء الحالية
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {leaderboard.map(
              (merchant, index) => {
                const rank = index + 1;

                const isCurrent =
                  merchant.id ===
                  merchantEntry?.id;

                return (
                  <div
                    key={merchant.id}
                    className={`flex flex-col gap-4 px-5 py-4 transition sm:flex-row sm:items-center sm:justify-between ${
                      isCurrent
                        ? "bg-primary/[0.035]"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
                          rank === 1
                            ? "bg-amber-100 text-amber-700"
                            : rank === 2
                              ? "bg-slate-100 text-slate-600"
                              : rank === 3
                                ? "bg-orange-50 text-orange-600"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rank}
                      </div>

                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
                          isCurrent
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/5 text-primary"
                        }`}
                      >
                        {getInitials(
                          merchant.name,
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-extrabold text-primary">
                            {merchant.name}
                          </p>

                          {isCurrent && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-extrabold text-primary">
                              أنت
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {formatNumber(
                            merchant.shipments,
                          )}{" "}
                          شحنة
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
                      <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-muted-foreground">
                          النقاط
                        </p>

                        <p className="mt-1 text-sm font-black text-primary">
                          {formatNumber(
                            merchant.score,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-emerald-700/70">
                          مكتملة
                        </p>

                        <p className="mt-1 text-sm font-black text-emerald-700">
                          {formatNumber(
                            merchant.completed,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-sky-50 px-3 py-2 text-center">
                        <p className="text-[9px] font-bold text-sky-700/70">
                          نشطة
                        </p>

                        <p className="mt-1 text-sm font-black text-sky-700">
                          {formatNumber(
                            merchant.active,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </Card>
      )}

      {/* =====================================================
          بطاقة تقدم التاجر
      ===================================================== */}
      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -left-16 -top-16 size-40 rounded-full bg-primary/5 blur-2xl" />

          <div className="relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/5">
                  <Target className="size-5 text-primary" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-primary">
                    تقدمك في الترتيب
                  </h3>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    استمر في رفع أداء متجرك
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary">
                {completionRate}% إنجاز
              </span>
            </div>

            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground">
                  نسبة الشحنات المكتملة
                </span>

                <span className="text-xs font-black text-primary">
                  {completionRate}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{
                    width: `${completionRate}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-[9px] font-bold text-muted-foreground">
                  شحناتك
                </p>

                <p className="mt-2 text-xl font-black text-primary">
                  {formatNumber(
                    totalShipments,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="text-[9px] font-bold text-emerald-700/70">
                  مكتملة
                </p>

                <p className="mt-2 text-xl font-black text-emerald-700">
                  {formatNumber(
                    completedShipments,
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-50 p-4">
                <p className="text-[9px] font-bold text-sky-700/70">
                  نشطة
                </p>

                <p className="mt-2 text-xl font-black text-sky-700">
                  {formatNumber(
                    activeShipments,
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* المركز القادم */}
        <Card className="relative overflow-hidden border-amber-200 bg-amber-50/40 p-6 sm:p-7">
          <div className="absolute -left-12 -top-12 size-32 rounded-full bg-amber-100 blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100">
                <Flame className="size-5 text-amber-600" />
              </div>

              <Sparkles className="size-5 text-amber-500/50" />
            </div>

            <p className="mt-6 text-[10px] font-bold text-amber-700/70">
              هدفك القادم
            </p>

            <h3 className="mt-1 text-xl font-black text-primary">
              {currentRank === 1
                ? "حافظ على الصدارة 🏆"
                : currentRank
                  ? "اقترب من المركز الأعلى"
                  : "ابدأ رحلة الصدارة"}
            </h3>

            <p className="mt-3 text-xs leading-7 text-muted-foreground">
              {currentRank === 1
                ? "أنت في القمة حاليًا. استمر في الحفاظ على أداء متجرك."
                : remainingToNextRank > 0
                  ? `تحتاج إلى ${formatNumber(
                      remainingToNextRank,
                    )} نقطة إضافية على الأقل للتقدم في الترتيب.`
                  : "ابدأ بإنجاز المزيد من الشحنات لبناء نقاطك وتحسين ترتيبك."}
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3">
              <ShieldCheck className="size-4 text-amber-600" />

              <span className="text-[10px] font-bold text-amber-800/70">
                الأداء والإنجازات هما أساس الترتيب.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          قواعد الترتيب
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/5">
              <Award className="size-5 text-primary" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-primary">
                كيف يتم احتساب الترتيب؟
              </h3>

              <p className="mt-1 text-[10px] text-muted-foreground">
                مؤشرات الأداء الحالية
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl bg-muted/40 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/5">
                <Package className="size-4 text-primary" />
              </div>

              <div>
                <p className="text-xs font-extrabold text-primary">
                  نشاط الشحنات
                </p>

                <p className="mt-1 text-[10px] leading-6 text-muted-foreground">
                  كلما زاد نشاط متجرك زادت نقاط الأداء.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
                <Check className="size-4 text-emerald-700" />
              </div>

              <div>
                <p className="text-xs font-extrabold text-emerald-800">
                  الإنجاز
                </p>

                <p className="mt-1 text-[10px] leading-6 text-emerald-800/60">
                  الشحنات المكتملة ترفع نقاط الأداء بشكل أكبر.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/70">
                <Trophy className="size-4 text-amber-700" />
              </div>

              <div>
                <p className="text-xs font-extrabold text-amber-800">
                  المنافسة
                </p>

                <p className="mt-1 text-[10px] leading-6 text-amber-800/60">
                  يتم ترتيب التجار بناءً على مؤشرات الأداء المعتمدة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          حالة النهاية
      ===================================================== */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

        <p className="text-[10px] leading-6 text-muted-foreground">
          نظام الترتيب قابل للتطوير ويمكن لأمانتي إضافة مؤشرات
          أخرى مستقبلًا مثل رضا العملاء، النمو الشهري، الإحالات
          والالتزام بمستويات الخدمة.
        </p>

        <WalletCards className="mr-auto hidden size-4 shrink-0 text-muted-foreground sm:block" />
      </div>
    </div>
  );
}
