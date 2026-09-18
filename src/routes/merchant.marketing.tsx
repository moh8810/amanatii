import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  Link2,
  Loader2,
  Megaphone,
  MousePointerClick,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/marketing")({
  head: () => ({
    meta: [
      {
        title: "التسويق بالعمولة | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "شارك رابط الإحالة الخاص بك وساهم في نمو أمانتي واستفد من برنامج التسويق بالعمولة.",
      },
    ],
  }),
  component: MerchantMarketingPage,
});

type MerchantProfile = {
  full_name: string | null;
  role: string | null;
};

type ReferralStats = {
  referredUsers: number;
  qualifiedReferrals: number;
  pendingCommission: number;
  totalCommission: number;
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ar-YE")} ريال`;
}

function MerchantMarketingPage() {
  const [profile, setProfile] =
    useState<MerchantProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  const [shared, setShared] =
    useState(false);

  const referralStats: ReferralStats = {
    referredUsers: 0,
    qualifiedReferrals: 0,
    pendingCommission: 0,
    totalCommission: 0,
  };

  async function loadMerchant() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى برنامج التسويق بالعمولة.",
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
          "MERCHANT MARKETING PROFILE ERROR:",
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
    } catch (loadError) {
      console.error(
        "MERCHANT MARKETING LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل برنامج التسويق بالعمولة.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMerchant();
  }, []);

  const merchantName =
    profile?.full_name?.trim() ||
    "التاجر";

  const referralCode = useMemo(() => {
    const cleanName =
      merchantName
        .replace(
          /[^a-zA-Z0-9\u0600-\u06FF]/g,
          "",
        )
        .slice(0, 8);

    return (
      cleanName.toUpperCase() ||
      "AMANATI"
    );
  }, [merchantName]);

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${encodeURIComponent(
          referralCode,
        )}`
      : `/register?ref=${encodeURIComponent(
          referralCode,
        )}`;

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(
        referralLink,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (copyError) {
      console.error(
        "COPY REFERRAL ERROR:",
        copyError,
      );
    }
  }

  async function shareReferralLink() {
    try {
      if (
        typeof navigator !== "undefined" &&
        "share" in navigator
      ) {
        await navigator.share({
          title: "انضم إلى أمانتي",
          text:
            "انضم إلى أمانتي من خلال رابط الإحالة الخاص بي.",
          url: referralLink,
        });

        setShared(true);

        window.setTimeout(() => {
          setShared(false);
        }, 2200);

        return;
      }

      await copyReferralLink();
    } catch (shareError) {
      console.error(
        "SHARE REFERRAL ERROR:",
        shareError,
      );
    }
  }

  const levelProgress = Math.min(
    100,
    referralStats.qualifiedReferrals * 10,
  );

  const remainingToNextLevel = Math.max(
    0,
    10 - referralStats.qualifiedReferrals,
  );

  return (
    <div
      dir="rtl"
      className="space-y-7"
    >
      {/* =====================================================
          HERO — REFERRAL COMMAND CENTER
      ===================================================== */}
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-primary text-primary-foreground shadow-soft">
        {/* الخلفية */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 size-[28rem] rounded-full bg-white/[0.045] blur-3xl" />

          <div className="absolute -bottom-40 right-1/3 size-[30rem] rounded-full bg-white/[0.04] blur-3xl" />

          <div className="absolute right-[15%] top-[15%] size-48 rounded-full border border-white/[0.04]" />

          <div className="absolute right-[18%] top-[20%] size-32 rounded-full border border-white/[0.035]" />

          <div className="absolute bottom-10 left-[25%] size-2 rounded-full bg-white/20" />

          <div className="absolute left-[18%] top-20 size-1.5 rounded-full bg-white/20" />
        </div>

        <div className="relative p-6 sm:p-8 lg:p-10">
          {/* =================================================
              الجزء العلوي
          ================================================= */}
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-[10px] font-extrabold text-white/70 backdrop-blur-sm">
                <Sparkles className="size-3.5" />

                برنامج أمانتي للتسويق بالعمولة
              </div>

              <h2 className="mt-5 text-3xl font-extrabold leading-[1.25] tracking-tight sm:text-4xl lg:text-[3.25rem]">
                كبّر شبكتك،
                <br />
                <span className="text-white/55">
                  واربح مع نمو أمانتي.
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-8 text-white/60 sm:text-base">
                رابط واحد يمكن أن يفتح لك فرصًا جديدة.
                شاركه مع أصحاب المتاجر والعملاء وساهم في
                نمو شبكة أمانتي.
              </p>
            </div>

            {/* هوية الحساب */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur-sm lg:min-w-[245px]">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Megaphone className="size-5 text-white/80" />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-bold text-white/40">
                  حساب الإحالة
                </p>

                <p className="mt-1 truncate text-sm font-extrabold text-white">
                  {merchantName}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wider text-white/45">
                    {referralCode}
                  </span>

                  <span className="size-1 rounded-full bg-emerald-300/60" />

                  <span className="text-[9px] font-bold text-emerald-200/70">
                    نشط
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              مركز رابط الإحالة — بدون مربع تقليدي
          ================================================= */}
          <div className="mt-9">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-white/10">
                  <Link2 className="size-4 text-white/75" />
                </div>

                <div>
                  <p className="text-xs font-extrabold text-white">
                    رابطك جاهز للمشاركة
                  </p>

                  <p className="mt-0.5 text-[9px] text-white/35">
                    استخدمه في رسائلك ومنشوراتك
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-1.5 text-[9px] font-bold text-white/35 sm:flex">
                <ShieldCheck className="size-3.5" />
                رابط آمن
              </div>
            </div>

            {/* الرابط كـ Command Bar */}
            <div className="group relative flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/10 p-2 backdrop-blur-md transition hover:border-white/15 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Link2 className="size-4 text-white/60" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-[8px] font-bold text-white/30">
                    رابط التسجيل بالإحالة
                  </p>

                  <p
                    dir="ltr"
                    className="truncate text-left font-mono text-[11px] text-white/65 sm:text-xs"
                  >
                    {referralLink}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 sm:shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    void copyReferralLink()
                  }
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-extrabold text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 sm:flex-none"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}

                  {copied
                    ? "تم النسخ"
                    : "نسخ الرابط"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void shareReferralLink()
                  }
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-white/15 disabled:opacity-60"
                >
                  {shared ? (
                    <Check className="size-4" />
                  ) : (
                    <Share2 className="size-4" />
                  )}

                  <span className="hidden sm:inline">
                    {shared
                      ? "تمت المشاركة"
                      : "مشاركة"}
                  </span>
                </button>
              </div>
            </div>

            {/* الكود */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold text-white/30">
                كود الإحالة:
              </span>

              <span className="rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1.5 font-mono text-[10px] font-extrabold tracking-wider text-white/65">
                {referralCode}
              </span>

              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(
                    referralCode,
                  )
                }
                className="rounded-lg px-2 py-1.5 text-[9px] font-bold text-white/35 transition hover:bg-white/5 hover:text-white/60"
              >
                نسخ الكود
              </button>
            </div>
          </div>

          {/* =================================================
              مؤشرات الإحالة
          ================================================= */}
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Users className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  الأشخاص المحالون
                </p>

                <p className="mt-1 text-lg font-extrabold text-white">
                  {referralStats.referredUsers.toLocaleString(
                    "ar-YE",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <CheckCircle2 className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  الإحالات المؤهلة
                </p>

                <p className="mt-1 text-lg font-extrabold text-white">
                  {referralStats.qualifiedReferrals.toLocaleString(
                    "ar-YE",
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <WalletCards className="size-4 text-white/70" />
              </div>

              <div>
                <p className="text-[9px] font-bold text-white/35">
                  إجمالي الأرباح
                </p>

                <p className="mt-1 text-lg font-extrabold text-white">
                  {formatMoney(
                    referralStats.totalCommission,
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          حالة التحميل / الخطأ
      ===================================================== */}
      {loading && (
        <Card className="flex items-center justify-center gap-3 p-4">
          <Loader2 className="size-4 animate-spin text-primary" />

          <span className="text-xs font-bold text-muted-foreground">
            جاري تحميل بيانات البرنامج...
          </span>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadMerchant()
              }
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-red-700 shadow-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          إحصائيات البرنامج
      ===================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-primary/5 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                إجمالي الأرباح
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {formatMoney(
                  referralStats.totalCommission,
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                من الإحالات المؤهلة
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/5">
              <WalletCards className="size-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-sky-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                الأشخاص المحالون
              </p>

              <p className="mt-2 text-2xl font-extrabold text-primary">
                {referralStats.referredUsers.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                عبر رابطك
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-sky-50">
              <Users className="size-5 text-sky-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-emerald-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                الإحالات المؤهلة
              </p>

              <p className="mt-2 text-2xl font-extrabold text-emerald-700">
                {referralStats.qualifiedReferrals.toLocaleString(
                  "ar-YE",
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                مستوفية للشروط
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="size-5 text-emerald-700" />
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
          <div className="absolute -left-10 -top-10 size-28 rounded-full bg-amber-50 transition group-hover:scale-125" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground">
                عمولات معلقة
              </p>

              <p className="mt-2 text-2xl font-extrabold text-amber-700">
                {formatMoney(
                  referralStats.pendingCommission,
                )}
              </p>

              <p className="mt-1 text-[10px] text-muted-foreground">
                بانتظار الاستحقاق
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50">
              <TrendingUp className="size-5 text-amber-700" />
            </div>
          </div>
        </Card>
      </div>

      {/* =====================================================
          تقدم الإحالات
      ===================================================== */}
      <Card className="overflow-hidden">
        <div className="p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50">
                <Trophy className="size-5 text-amber-700" />
              </div>

              <div>
                <p className="text-[10px] font-bold text-muted-foreground">
                  رحلتك في البرنامج
                </p>

                <h3 className="mt-0.5 text-lg font-extrabold text-primary">
                  المستوى الأول
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-2.5">
              <Target className="size-4 text-primary" />

              <span className="text-xs font-bold text-muted-foreground">
                {remainingToNextLevel === 0
                  ? "وصلت للمستوى التالي"
                  : `باقي ${remainingToNextLevel} إحالات مؤهلة`}
              </span>
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground">
                التقدم للمستوى التالي
              </span>

              <span className="text-xs font-extrabold text-primary">
                {referralStats.qualifiedReferrals} / 10
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{
                  width: `${levelProgress}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/40 p-4">
              <p className="text-[10px] font-bold text-muted-foreground">
                المستوى الحالي
              </p>

              <p className="mt-2 text-xl font-extrabold text-primary">
                01
              </p>
            </div>

            <div className="rounded-2xl bg-primary/5 p-4">
              <p className="text-[10px] font-bold text-primary/60">
                المستوى القادم
              </p>

              <p className="mt-2 text-xl font-extrabold text-primary">
                02
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-[10px] font-bold text-amber-700/70">
                المتبقي
              </p>

              <p className="mt-2 text-xl font-extrabold text-amber-700">
                {remainingToNextLevel}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          كيف يعمل؟
      ===================================================== */}
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
              <Zap className="size-5 text-primary" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-primary">
                ابدأ خلال دقائق
              </h3>

              <p className="mt-1 text-[11px] text-muted-foreground">
                ثلاث خطوات فقط
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/10 transition group-hover:bg-primary" />

            <div className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/5">
                <Share2 className="size-5 text-primary" />
              </div>

              <span className="font-mono text-4xl font-extrabold text-primary/5">
                01
              </span>
            </div>

            <h4 className="mt-5 text-base font-extrabold text-primary">
              شارك رابطك
            </h4>

            <p className="mt-2 text-xs leading-7 text-muted-foreground">
              شارك رابط الإحالة الخاص بك مع عملائك
              وأصحاب المتاجر والأشخاص المهتمين.
            </p>
          </Card>

          <Card className="group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-sky-100 transition group-hover:bg-sky-500" />

            <div className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-sky-50">
                <UserPlus className="size-5 text-sky-700" />
              </div>

              <span className="font-mono text-4xl font-extrabold text-sky-700/5">
                02
              </span>
            </div>

            <h4 className="mt-5 text-base font-extrabold text-primary">
              ينضمون إلى أمانتي
            </h4>

            <p className="mt-2 text-xs leading-7 text-muted-foreground">
              عند التسجيل من خلال رابطك يتم ربط الإحالة
              بحسابك وفق نظام البرنامج.
            </p>
          </Card>

          <Card className="group relative overflow-hidden p-6 transition duration-300 hover:-translate-y-1 hover:shadow-soft">
            <div className="absolute inset-x-0 top-0 h-1 bg-emerald-100 transition group-hover:bg-emerald-500" />

            <div className="flex items-center justify-between">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50">
                <Gift className="size-5 text-emerald-700" />
              </div>

              <span className="font-mono text-4xl font-extrabold text-emerald-700/5">
                03
              </span>
            </div>

            <h4 className="mt-5 text-base font-extrabold text-primary">
              احصل على المكافآت
            </h4>

            <p className="mt-2 text-xs leading-7 text-muted-foreground">
              الإحالات المؤهلة تمنحك العمولات والمزايا
              وفق شروط برنامج أمانتي.
            </p>
          </Card>
        </div>
      </section>

      {/* =====================================================
          لماذا تشارك + الحماية
      ===================================================== */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-50">
              <TrendingUp className="size-5 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-primary">
                لماذا تشارك؟
              </h3>

              <p className="mt-1 text-[10px] text-muted-foreground">
                فوائد البرنامج
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              {
                icon: WalletCards,
                title: "دخل إضافي",
                text: "استفد من الإحالات المؤهلة وفق شروط البرنامج.",
              },
              {
                icon: Users,
                title: "شبكة أكبر",
                text: "ساعد المزيد من العملاء والمتاجر على استخدام أمانتي.",
              },
              {
                icon: Trophy,
                title: "مستويات ومكافآت",
                text: "زد إحالاتك المؤهلة وتقدم في مستويات البرنامج.",
              },
              {
                icon: Target,
                title: "تابع أداءك",
                text: "راقب إحالاتك وأرباحك من لوحة التاجر.",
              },
            ].map(
              ({
                icon: Icon,
                title,
                text,
              }) => (
                <div
                  key={title}
                  className="flex items-start gap-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-primary">
                      {title}
                    </p>

                    <p className="mt-1 text-[11px] leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/5">
              <ShieldCheck className="size-5 text-primary" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-primary">
                برنامج موثوق
              </h3>

              <p className="mt-1 text-[10px] text-muted-foreground">
                قواعد تحافظ على عدالة البرنامج
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "تحتسب العمولات على الإحالات المؤهلة فقط.",
              "لا يسمح بإحالة الحساب إلى نفسه أو إنشاء حسابات وهمية.",
              "قد تخضع العمولة لفترة تحقق قبل اعتمادها.",
              "تحدد إدارة أمانتي شروط الاستحقاق والصرف.",
            ].map(
              (text) => (
                <div
                  key={text}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                    <Check className="size-3.5 text-emerald-700" />
                  </div>

                  <p className="text-xs leading-7 text-muted-foreground">
                    {text}
                  </p>
                </div>
              ),
            )}
          </div>
        </Card>
      </div>

      {/* =====================================================
          CTA
      ===================================================== */}
      <Card className="relative overflow-hidden border-primary/10 bg-muted/30 p-6 sm:p-8">
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <MousePointerClick className="size-5 text-primary" />

              <h3 className="text-lg font-extrabold text-primary">
                جاهز لتوسيع شبكتك؟
              </h3>
            </div>

            <p className="mt-2 max-w-xl text-xs leading-7 text-muted-foreground">
              شارك رابطك الآن وابدأ ببناء شبكة الإحالات
              الخاصة بك.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void copyReferralLink()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}

              {copied
                ? "تم نسخ الرابط"
                : "نسخ رابط الإحالة"}
            </button>

            <button
              type="button"
              onClick={() =>
                void shareReferralLink()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-extrabold text-primary transition hover:bg-muted"
            >
              <Share2 className="size-4" />

              مشاركة
            </button>
          </div>
        </div>
      </Card>

      {/* =====================================================
          تنبيه
      ===================================================== */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

        <p className="text-[10px] leading-6 text-muted-foreground">
          برنامج الإحالة والعمولات يخضع لشروط أمانتي
          المعتمدة. يتم اعتماد العمولات وصرفها بعد
          استيفاء شروط الاستحقاق والتحقق من صحة الإحالة.
        </p>

        <button
          type="button"
          className="mr-auto hidden shrink-0 items-center gap-1 text-[10px] font-extrabold text-primary sm:inline-flex"
        >
          التفاصيل
          <ArrowLeft className="size-3" />
        </button>
      </div>
    </div>
  );
}
