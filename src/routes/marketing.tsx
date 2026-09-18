import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  Bell,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Gift,
  HelpCircle,
  Megaphone,
  Package,
  Link2,
  Share2,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, buttonClass } from "@/components/amanati/ui";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      {
        title: "التسويق بالعمولة | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "شارك أمانتي مع الآخرين واحصل على مكافآت مقابل المستخدمين الجدد.",
      },
      {
        property: "og:title",
        content: "التسويق بالعمولة | أمانتي",
      },
      {
        property: "og:description",
        content:
          "شارك أمانتي واحصل على مكافآت مقابل الإحالات الجديدة.",
      },
    ],
  }),
  component: MarketingPage,
});

type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  active?: boolean;
};

function MarketingPage() {
  const [copied, setCopied] = useState(false);

  /*
   * القيم الحالية تجريبية للواجهة فقط.
   * سيتم ربطها ببيانات Supabase عند بناء نظام الإحالات الفعلي.
   */
  const stats = {
    earnings: 0,
    referrals: 0,
    conversions: 0,
    pending: 0,
  };

  const referralCode = "AMANATI";
  const referralLink = `https://amanatii.vercel.app/register?ref=${referralCode}`;

  const nav: NavItem[] = [
    {
      label: "لوحة التحكم",
      icon: Activity,
      to: "/dashboard",
    },
    {
      label: "شحناتي",
      icon: Package,
      to: "/shipments",
    },
    {
      label: "أماناتي",
      icon: ShieldCheck,
      to: "/amanat",
    },
    {
      label: "المحفظة والأرباح",
      icon: WalletCards,
      to: "/wallet",
    },
    {
      label: "التسويق بالعمولة",
      icon: Megaphone,
      to: "/marketing",
      active: true,
    },
    {
      label: "الإشعارات",
      icon: Bell,
      to: "/notifications",
    },
    {
      label: "الدعم والمساعدة",
      icon: HelpCircle,
      to: "/help",
    },
    {
      label: "الإعدادات",
      icon: Settings,
      to: "/settings",
    },
  ];

  const conversionRate = useMemo(() => {
    if (stats.referrals === 0) {
      return 0;
    }

    return Math.round(
      (stats.conversions / stats.referrals) * 100,
    );
  }, [stats.conversions, stats.referrals]);

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      setCopied(false);
    }
  }

  async function shareReferralLink() {
    const shareData = {
      title: "أمانتي",
      text:
        "انضم إلى أمانتي واستخدم خدمات الشحن وحفظ الأمانات بسهولة.",
      url: referralLink,
    };

    try {
      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {
        await navigator.share(shareData);
        return;
      }

      await copyReferralLink();
    } catch {
      // المستخدم أغلق نافذة المشاركة.
    }
  }

  return (
    <DashboardShell
      title="التسويق بالعمولة"
      subtitle="شارك أمانتي مع الآخرين واحصل على مكافآت."
      nav={nav}
    >
      <div className="space-y-7 sm:space-y-8">

        {/* ================================================================= */}
        {/* HERO                                                              */}
        {/* ================================================================= */}

        <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.09] via-card to-secondary/[0.09] p-5 shadow-soft sm:p-7 lg:p-8">

          <div className="pointer-events-none absolute -left-28 -top-28 size-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 right-1/3 size-96 rounded-full bg-secondary/10 blur-3xl" />

          <div className="pointer-events-none absolute right-10 top-1/2 size-40 -translate-y-1/2 rounded-full bg-primary/[0.04] blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">

            <div className="min-w-0">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-background/80 px-3.5 py-2 text-xs font-black text-secondary shadow-sm backdrop-blur">
                <Sparkles
                  className="size-4 shrink-0"
                  strokeWidth={1.7}
                />
                برنامج أمانتي للشركاء
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-[1.15] tracking-tight text-primary sm:text-4xl lg:text-[3.25rem]">
                شارك أمانتي،
                <span className="block text-secondary">
                  واربح مع كل إحالة ✨
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8">
                شارك رابطك الخاص مع أصدقائك وعائلتك
                ومجتمعك. عندما ينضم مستخدم جديد من
                خلالك ويبدأ باستخدام أمانتي، تحصل على
                مكافآت وفقًا لشروط البرنامج.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  onClick={shareReferralLink}
                  className={`${buttonClass(
                    "primary",
                    "lg",
                  )} justify-center gap-2 shadow-lg shadow-primary/10`}
                >
                  <Share2
                    className="size-5 shrink-0"
                    strokeWidth={1.7}
                  />
                  <span>مشاركة رابط الدعوة</span>
                </button>

                <button
                  type="button"
                  onClick={copyReferralLink}
                  className={`${buttonClass(
                    "secondary",
                    "lg",
                  )} justify-center gap-2`}
                >
                  {copied ? (
                    <Check
                      className="size-5 shrink-0"
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Copy
                      className="size-5 shrink-0"
                      strokeWidth={1.7}
                    />
                  )}

                  <span>
                    {copied
                      ? "تم نسخ الرابط"
                      : "نسخ رابط الدعوة"}
                  </span>
                </button>

              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-muted-foreground">

                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.10)]" />
                  رابطك جاهز للمشاركة
                </div>

                <div className="flex items-center gap-2">
                  <ShieldDot />
                  نظام مكافآت واضح
                </div>

              </div>

            </div>

            {/* HERO SUMMARY */}

            <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-background/75 p-5 shadow-xl shadow-primary/5 backdrop-blur-xl sm:p-6">

              <div className="pointer-events-none absolute -left-14 -top-14 size-36 rounded-full bg-secondary/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      أرباح الإحالات
                    </p>

                    <p className="mt-1 text-lg font-black text-primary">
                      رصيدك الحالي
                    </p>
                  </div>

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <WalletCards
                      className="size-5"
                      strokeWidth={1.7}
                    />
                  </div>

                </div>

                <div className="mt-7">

                  <div className="flex items-end gap-2">

                    <span className="text-4xl font-black tracking-tight text-primary">
                      {stats.earnings}
                    </span>

                    <span className="pb-1 text-sm font-black text-muted-foreground">
                      ريال
                    </span>

                  </div>

                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    إجمالي الأرباح المكتسبة من البرنامج
                  </p>

                </div>

                <div className="mt-6 grid grid-cols-2 gap-2">

                  <MiniStat
                    icon={Users}
                    label="الإحالات"
                    value={stats.referrals}
                  />

                  <MiniStat
                    icon={CheckCircle2}
                    label="المسجلون"
                    value={stats.conversions}
                  />

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================================================================= */}
        {/* REFERRAL LINK                                                     */}
        {/* ================================================================= */}

        <section>

          <SectionHeading
            eyebrow="رابط الدعوة"
            title="رابطك الخاص"
            description="استخدم هذا الرابط في واتساب أو وسائل التواصل أو شاركه مباشرة مع من تريد دعوته."
          />

          <Card className="mt-4 overflow-hidden rounded-[1.75rem] border-border/70 p-0 shadow-soft">

            <div className="p-5 sm:p-6">

              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
                <Link2
                  className="size-5"
                  strokeWidth={1.7}
                />
              </div>

              <div className="mt-5">

                <p className="text-xs font-bold text-muted-foreground">
                  رابط الإحالة
                </p>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">

                  <div className="min-w-0 flex-1 rounded-2xl border border-border bg-muted/30 px-4 py-3">

                    <p
                      dir="ltr"
                      className="truncate text-sm font-bold text-primary"
                    >
                      {referralLink}
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={copyReferralLink}
                    className={`${buttonClass(
                      "secondary",
                      "md",
                    )} shrink-0 justify-center gap-2`}
                  >
                    {copied ? (
                      <Check
                        className="size-4 shrink-0"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <Copy
                        className="size-4 shrink-0"
                        strokeWidth={1.7}
                      />
                    )}

                    <span>
                      {copied
                        ? "تم النسخ"
                        : "نسخ الرابط"}
                    </span>
                  </button>

                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-2">

                <div className="rounded-xl bg-primary/[0.05] px-3 py-2 text-xs font-black text-primary">
                  كود الدعوة: {referralCode}
                </div>

                <div className="rounded-xl bg-secondary/[0.08] px-3 py-2 text-xs font-black text-secondary">
                  مشاركة سهلة
                </div>

              </div>

            </div>
          </Card>
        </section>

        {/* ================================================================= */}
        {/* STATS                                                              */}
        {/* ================================================================= */}

        <section>

          <SectionHeading
            eyebrow="الأداء"
            title="أداء برنامجك"
            description="تابع نتائج مشاركاتك والإحالات القادمة من رابطك."
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <MarketingStat
              icon={Users}
              title="إجمالي الإحالات"
              value={stats.referrals}
              description="الأشخاص الذين استخدموا رابطك"
              tone="navy"
            />

            <MarketingStat
              icon={CheckCircle2}
              title="المستخدمون المسجلون"
              value={stats.conversions}
              description="إحالات تحولت إلى تسجيل"
              tone="green"
            />

            <MarketingStat
              icon={TrendingUp}
              title="معدل التحويل"
              value={`${conversionRate}%`}
              description="نسبة التسجيل من الإحالات"
              tone="blue"
            />

            <MarketingStat
              icon={WalletCards}
              title="أرباح معلقة"
              value={`${stats.pending} ريال`}
              description="مكافآت قيد المعالجة"
              tone="orange"
            />

          </div>
        </section>

        {/* ================================================================= */}
        {/* HOW IT WORKS                                                       */}
        {/* ================================================================= */}

        <section>

          <SectionHeading
            eyebrow="كيف يعمل؟"
            title="ابدأ خلال ثلاث خطوات"
            description="طريقة بسيطة لمشاركة أمانتي وتحويل الإحالات إلى مكافآت."
          />

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <StepCard
              number="01"
              icon={Link2}
              title="انسخ رابطك"
              description="استخدم رابط الإحالة الخاص بك وشاركه مع الأشخاص الذين ترغب في دعوتهم."
            />

            <StepCard
              number="02"
              icon={Users}
              title="شارك أمانتي"
              description="أرسل الرابط عبر واتساب أو وسائل التواصل أو أي قناة مناسبة لك."
            />

            <StepCard
              number="03"
              icon={Trophy}
              title="احصل على المكافأة"
              description="عند تحقق شروط البرنامج، تُحتسب المكافآت المرتبطة بإحالاتك."
            />

          </div>
        </section>

        {/* ================================================================= */}
        {/* LEVELS                                                             */}
        {/* ================================================================= */}

        <section>

          <SectionHeading
            eyebrow="المستويات"
            title="تقدّم مع أمانتي"
            description="كلما زادت إحالاتك، يمكنك الوصول إلى مستويات ومزايا أفضل."
          />

          <div className="mt-4 grid gap-4 lg:grid-cols-3">

            <LevelCard
              level="المبتدئ"
              icon={Sparkles}
              target="0 – 9 إحالات"
              description="ابدأ ببناء شبكة الإحالات الخاصة بك."
              active
            />

            <LevelCard
              level="المتقدم"
              icon={TrendingUp}
              target="10 – 49 إحالة"
              description="وسّع نطاق مشاركتك واستفد من مزايا البرنامج."
            />

            <LevelCard
              level="المحترف"
              icon={Trophy}
              target="50+ إحالة"
              description="مستوى أعلى للمستخدمين الأكثر نشاطًا."
            />

          </div>
        </section>

        {/* ================================================================= */}
        {/* ACTIVITY                                                           */}
        {/* ================================================================= */}

        <section>

          <div className="flex items-end justify-between gap-4">

            <SectionHeading
              eyebrow="النشاط"
              title="آخر الإحالات"
              description="تابع أحدث النشاط المرتبط برابط الدعوة الخاص بك."
            />

          </div>

          <Card className="mt-4 rounded-[1.75rem] border-border/70 p-0 shadow-soft">

            <div className="flex flex-col items-center justify-center px-5 py-12 text-center sm:px-8">

              <div className="flex size-16 items-center justify-center rounded-[1.5rem] bg-primary/[0.06] text-primary">
                <Users
                  className="size-7"
                  strokeWidth={1.6}
                />
              </div>

              <h3 className="mt-5 text-lg font-black text-primary">
                لا توجد إحالات بعد
              </h3>

              <p className="mt-2 max-w-md text-sm font-medium leading-7 text-muted-foreground">
                عندما يبدأ الأشخاص باستخدام رابطك،
                ستظهر هنا الإحالات والنشاط المرتبط بها.
              </p>

              <button
                type="button"
                onClick={shareReferralLink}
                className={`${buttonClass(
                  "secondary",
                  "sm",
                )} mt-5 justify-center gap-2`}
              >
                <Share2
                  className="size-4 shrink-0"
                  strokeWidth={1.7}
                />
                <span>ابدأ بالمشاركة</span>
              </button>

            </div>

          </Card>
        </section>

        {/* ================================================================= */}
        {/* TERMS / TRUST                                                      */}
        {/* ================================================================= */}

        <section>

          <Card className="relative overflow-hidden rounded-[1.75rem] border-primary/10 bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04] p-5 shadow-soft sm:p-7">

            <div className="pointer-events-none absolute -bottom-16 -left-16 size-40 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex min-w-0 gap-4">

                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Megaphone
                    className="size-5"
                    strokeWidth={1.7}
                  />
                </div>

                <div className="min-w-0">

                  <h3 className="text-base font-black text-primary sm:text-lg">
                    شارك أمانتي بطريقة صحيحة
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs font-medium leading-6 text-muted-foreground sm:text-sm">
                    استخدم رابطك بشكل طبيعي وشارك الخدمة مع
                    أشخاص قد يستفيدون منها. المكافآت تخضع
                    لشروط وأحكام برنامج الإحالة.
                  </p>

                </div>

              </div>

              <a
                href="/terms"
                className={`${buttonClass(
                  "ghost",
                  "sm",
                )} shrink-0 justify-center gap-2`}
              >
                <span>الشروط والأحكام</span>
                <ChevronLeft
                  className="size-4 shrink-0"
                  strokeWidth={1.7}
                />
              </a>

            </div>

          </Card>
        </section>

        {/* BACK */}

        <div className="flex justify-center pb-2">

          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors hover:text-primary"
          >
            <span>العودة إلى لوحة التحكم</span>
            <ArrowLeft
              className="size-4 shrink-0"
              strokeWidth={1.7}
            />
          </a>

        </div>

      </div>
    </DashboardShell>
  );
}

/* ==========================================================================
 * MINI STAT
 * ========================================================================== */

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3 text-center">

      <div className="mx-auto flex size-8 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
        <Icon
          className="size-4"
          strokeWidth={1.7}
        />
      </div>

      <p className="mt-2 text-[10px] font-bold text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-lg font-black text-primary">
        {value}
      </p>

    </div>
  );
}

/* ==========================================================================
 * MARKETING STAT
 * ========================================================================== */

function MarketingStat({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: number | string;
  description: string;
  tone: "navy" | "blue" | "orange" | "green";
}) {
  const tones = {
    navy: "bg-primary/[0.07] text-primary",
    blue: "bg-sky-500/10 text-sky-600",
    orange: "bg-orange-500/10 text-orange-600",
    green: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="pointer-events-none absolute -left-10 -top-10 size-24 rounded-full bg-primary/[0.025] blur-2xl transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">

        <div
          className={`flex size-12 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon
            className="size-5"
            strokeWidth={1.7}
          />
        </div>

        <span className="mt-2 size-2 rounded-full bg-secondary/70" />

      </div>

      <div className="relative mt-5">

        <p className="text-sm font-bold text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 text-3xl font-black tracking-tight text-primary">
          {value}
        </p>

        <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
          {description}
        </p>

      </div>
    </div>
  );
}

/* ==========================================================================
 * STEP CARD
 * ========================================================================== */

function StepCard({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6">

      <div className="absolute left-5 top-5 text-4xl font-black tracking-tight text-primary/[0.045]">
        {number}
      </div>

      <div className="relative">

        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon
            className="size-5"
            strokeWidth={1.7}
          />
        </div>

        <h3 className="mt-6 text-lg font-black text-primary">
          {title}
        </h3>

        <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
          {description}
        </p>

      </div>
    </div>
  );
}

/* ==========================================================================
 * LEVEL CARD
 * ========================================================================== */

function LevelCard({
  level,
  icon: Icon,
  target,
  description,
  active = false,
}: {
  level: string;
  icon: LucideIcon;
  target: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.5rem] border p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6 ${
        active
          ? "border-secondary/20 bg-gradient-to-br from-secondary/[0.07] via-card to-primary/[0.04]"
          : "border-border/70 bg-card"
      }`}
    >

      {active ? (
        <div className="absolute left-5 top-5 rounded-full border border-secondary/15 bg-secondary/10 px-2.5 py-1 text-[9px] font-black text-secondary">
          المستوى الحالي
        </div>
      ) : null}

      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
        <Icon
          className="size-5"
          strokeWidth={1.7}
        />
      </div>

      <h3 className="mt-5 text-lg font-black text-primary">
        {level}
      </h3>

      <p className="mt-1 text-sm font-black text-secondary">
        {target}
      </p>

      <p className="mt-3 text-xs font-medium leading-6 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}

/* ==========================================================================
 * SECTION HEADING
 * ========================================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">

      <div className="flex items-center gap-2">

        <span className="size-1.5 rounded-full bg-secondary" />

        <span className="text-[10px] font-black tracking-wider text-secondary">
          {eyebrow}
        </span>

      </div>

      <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
        {title}
      </h2>

      <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}

/* ==========================================================================
 * SMALL TRUST ICON
 * ========================================================================== */

function ShieldDot() {
  return (
    <span className="flex size-4 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
      <CheckCircle2
        className="size-3"
        strokeWidth={1.7}
      />
    </span>
  );
}