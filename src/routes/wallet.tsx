import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpLeft,
  Banknote,
  Bell,
  Clock3,
  CreditCard,
  HelpCircle,
  History,
  Plus,
  ShieldCheck,
  Settings,
  TrendingUp,
  Trophy,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import {
  Card,
  buttonClass,
} from "@/components/amanati/ui";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "المحفظة والأرباح | أمانتي" },
      {
        name: "description",
        content:
          "تابع رصيدك وأرباحك ومعاملاتك المالية من محفظة أمانتي.",
      },
      {
        property: "og:title",
        content: "المحفظة والأرباح | أمانتي",
      },
      {
        property: "og:description",
        content:
          "محفظتك الرقمية وأرباحك ومعاملاتك في أمانتي.",
      },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const nav = [
    {
      label: "لوحة التحكم",
      icon: Activity,
      to: "/dashboard",
    },
    {
      label: "شحناتي",
      icon: CreditCard,
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
      active: true,
    },
    {
      label: "تحديات أمانتي",
      icon: Trophy,
      to: "/challenges",
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

  return (
    <DashboardShell
      title="المحفظة والأرباح"
      subtitle="تابع رصيدك وأرباحك ومعاملاتك من مكان واحد."
      nav={nav}
    >
      <div className="space-y-7 sm:space-y-8">

        {/* HERO */}
        <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.10] via-card to-secondary/[0.10] p-5 shadow-soft sm:p-7 lg:p-8">

          <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 right-1/3 size-96 rounded-full bg-secondary/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">

            <div className="min-w-0">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-background/80 px-3.5 py-2 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <WalletCards className="size-4" />
                محفظة أمانتي الرقمية
              </div>

              <h1 className="max-w-2xl text-3xl font-black leading-[1.15] tracking-tight text-primary sm:text-4xl lg:text-[3.2rem]">
                أموالك وأرباحك،
                <span className="block text-secondary">
                  تحت سيطرتك ✨
                </span>
              </h1>

              <p className="mt-4 max-w-xl text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8">
                مساحة مالية منظمة تساعدك على متابعة
                رصيدك، أرباحك، وعملياتك المالية بسهولة
                ووضوح.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled
                  className={`${buttonClass(
                    "primary",
                    "lg",
                  )} justify-center opacity-70`}
                >
                  <ArrowUpLeft className="size-5" />
                  طلب سحب
                </button>

                <button
                  type="button"
                  disabled
                  className={`${buttonClass(
                    "secondary",
                    "lg",
                  )} justify-center opacity-70`}
                >
                  <Plus className="size-5" />
                  إضافة رصيد
                </button>

              </div>

            </div>

            {/* BALANCE CARD */}
            <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary p-6 text-primary-foreground shadow-xl">

              <div className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs font-medium text-primary-foreground/60">
                      الرصيد المتاح
                    </p>

                    <p className="mt-2 text-4xl font-black tracking-tight">
                      0
                      <span className="mr-2 text-sm font-bold text-primary-foreground/60">
                        ريال
                      </span>
                    </p>
                  </div>

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                    <WalletCards className="size-6" />
                  </div>

                </div>

                <div className="mt-7 grid grid-cols-2 gap-3">

                  <WalletMiniStat
                    label="الأرباح"
                    value="0 ريال"
                  />

                  <WalletMiniStat
                    label="المسحوبات"
                    value="0 ريال"
                  />

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* STATS */}
        <section>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-secondary" />

                <span className="text-[10px] font-black tracking-wider text-secondary">
                  ملخص مالي
                </span>
              </div>

              <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
                نظرة على محفظتك
              </h2>

              <p className="mt-1 text-xs font-medium text-muted-foreground">
                أهم المعلومات المالية في مكان واحد.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <FinancialCard
              icon={WalletCards}
              title="الرصيد الحالي"
              value="0 ريال"
              description="الرصيد المتاح للسحب"
              tone="navy"
            />

            <FinancialCard
              icon={TrendingUp}
              title="إجمالي الأرباح"
              value="0 ريال"
              description="كل الأرباح المكتسبة"
              tone="green"
            />

            <FinancialCard
              icon={ArrowDownLeft}
              title="إجمالي المسحوبات"
              value="0 ريال"
              description="المبالغ التي تم سحبها"
              tone="orange"
            />

            <FinancialCard
              icon={History}
              title="المعاملات"
              value="0"
              description="إجمالي العمليات المالية"
              tone="blue"
            />

          </div>
        </section>

        {/* TRANSACTIONS + SECURITY */}
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.85fr]">

          <Card className="overflow-hidden rounded-[1.75rem] border-border/70 p-0 shadow-soft">

            <div className="flex items-center justify-between border-b border-border/60 p-5 sm:p-6">

              <div>
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-secondary" />

                  <span className="text-[10px] font-black tracking-wider text-secondary">
                    السجل المالي
                  </span>
                </div>

                <h2 className="mt-1 text-lg font-black text-primary">
                  آخر المعاملات
                </h2>

                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  سجل عمليات المحفظة والأرباح.
                </p>
              </div>

              <History className="size-5 text-muted-foreground" />

            </div>

            <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">

              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/[0.06] text-primary">
                <History className="size-6" />
              </div>

              <h3 className="mt-4 font-black text-primary">
                لا توجد معاملات حتى الآن
              </h3>

              <p className="mt-1 max-w-md text-xs font-medium leading-6 text-muted-foreground">
                ستظهر هنا عمليات الإيداع والسحب والأرباح
                عندما تبدأ باستخدام المحفظة.
              </p>

            </div>

          </Card>

          <Card className="relative overflow-hidden rounded-[1.75rem] border-border/70 p-6 shadow-soft">

            <div className="pointer-events-none absolute -left-12 -top-12 size-32 rounded-full bg-secondary/[0.07] blur-3xl" />

            <div className="relative">

              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                <ShieldCheck className="size-5" />
              </div>

              <h2 className="mt-5 text-lg font-black text-primary">
                أمان محفظتك
              </h2>

              <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
                أمانتي تهتم بحماية بياناتك المالية
                والحفاظ على خصوصية معاملاتك.
              </p>

              <div className="mt-6 space-y-3">

                <SecurityItem text="بياناتك المالية محمية" />

                <SecurityItem text="المعاملات مسجلة بوضوح" />

                <SecurityItem text="إشعارات فورية للعمليات" />

              </div>

            </div>
          </Card>

        </section>

        {/* FUTURE FEATURES */}
        <section>

          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-secondary" />

            <span className="text-[10px] font-black tracking-wider text-secondary">
              قريباً
            </span>
          </div>

          <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
            مزايا مالية قادمة
          </h2>

          <p className="mt-1 text-xs font-medium text-muted-foreground">
            نعمل على تطوير تجربة مالية متكاملة داخل أمانتي.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">

            <FutureFeature
              icon={Banknote}
              title="السحب والإيداع"
              description="إدارة عمليات السحب والإيداع بسهولة وأمان."
            />

            <FutureFeature
              icon={TrendingUp}
              title="تقارير الأرباح"
              description="شاهد نمو أرباحك وتحليلاتك المالية بوضوح."
            />

            <FutureFeature
              icon={CreditCard}
              title="طرق دفع متعددة"
              description="خيارات مرنة لإدارة أموالك ومعاملاتك."
            />

          </div>
        </section>

        {/* BACK TO DASHBOARD */}
        <section className="flex justify-center pt-1">

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-primary transition-colors hover:text-secondary"
          >
            العودة إلى لوحة التحكم
            <ArrowLeft className="size-4" />
          </Link>

        </section>

      </div>
    </DashboardShell>
  );
}

/* ========================================================================== */
/* COMPONENTS                                                                 */
/* ========================================================================== */

function WalletMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">

      <p className="text-[10px] font-medium text-primary-foreground/55">
        {label}
      </p>

      <p className="mt-1 text-sm font-black">
        {value}
      </p>

    </div>
  );
}

function FinancialCard({
  icon: Icon,
  title,
  value,
  description,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
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

      <div className="absolute -left-10 -top-10 size-24 rounded-full bg-primary/[0.025] blur-2xl transition-transform duration-500 group-hover:scale-150" />

      <div className="relative flex items-start justify-between">

        <div
          className={`flex size-11 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon className="size-5" />
        </div>

      </div>

      <div className="relative mt-5">

        <p className="text-sm font-bold text-muted-foreground">
          {title}
        </p>

        <p className="mt-1 text-2xl font-black tracking-tight text-primary">
          {value}
        </p>

        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {description}
        </p>

      </div>
    </div>
  );
}

function SecurityItem({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-3">

      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        <ShieldCheck className="size-4" />
      </div>

      <span className="text-xs font-bold text-primary">
        {text}
      </span>

    </div>
  );
}

function FutureFeature({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">

      <div className="absolute left-4 top-4 rounded-full border border-border bg-background px-2.5 py-1 text-[9px] font-black text-muted-foreground">
        قريباً
      </div>

      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
        <Icon className="size-5" />
      </div>

      <h3 className="mt-5 font-black text-primary">
        {title}
      </h3>

      <p className="mt-2 text-xs font-medium leading-6 text-muted-foreground">
        {description}
      </p>

    </div>
  );
}