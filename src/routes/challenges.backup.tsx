import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  Flame,
  Gift,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  Megaphone,
  Package,
  Play,
  Rocket,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Video,
  WalletCards,
  Zap,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, buttonClass } from "@/components/amanati/ui";

export const Route = createFileRoute("/challenges/backup")({
  head: () => ({
    meta: [
      {
        title: "تحديات أمانتي | AMANATI",
      },
      {
        name: "description",
        content:
          "أنجز التحديات، شارك أمانتي، واربح مكافآت تضاف إلى محفظتك.",
      },
      {
        property: "og:title",
        content: "تحديات أمانتي | AMANATI",
      },
      {
        property: "og:description",
        content:
          "أنجز التحديات اليومية والأسبوعية واحصل على مكافآت أمانتي.",
      },
    ],
  }),
  component: ChallengesPage,
});

type NavItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  active?: boolean;
};

type Challenge = {
  id: number;
  title: string;
  description: string;
  reward: number;
  progress: number;
  target: string;
  category: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  badge?: string;
  featured?: boolean;
  timeLeft?: string;
};

function ChallengesPage() {
  const [activeFilter, setActiveFilter] = useState("الكل");
  const [startedChallenge, setStartedChallenge] = useState<number | null>(
    null,
  );

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
      label: "تحديات أمانتي",
      icon: Trophy,
      to: "/challenges",
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

  /*
   * البيانات الحالية تجريبية للواجهة.
   * سيتم ربط التحديات والمكافآت والمحفظة بـ Supabase
   * عند بناء النظام الفعلي.
   */
  const challenges: Challenge[] = [
    {
      id: 1,
      title: "تحدي ستوري اليوم",
      description:
        "انشر ستوري عن أمانتي وشارك رابطك أو المادة المطلوبة مع متابعيك.",
      reward: 500,
      progress: 0,
      target: "500 مشاهدة",
      category: "سوشيال",
      icon: ImageIcon,
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-600",
      badge: "الأكثر طلبًا",
      featured: true,
      timeLeft: "06:24:18",
    },
    {
      id: 2,
      title: "تحدي الريلز",
      description:
        "أنشئ Reel قصيرًا ومميزًا يعرّف الناس بخدمات أمانتي.",
      reward: 1000,
      progress: 0,
      target: "2,000 مشاهدة",
      category: "سوشيال",
      icon: Video,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600",
      badge: "مكافأة عالية",
    },
    {
      id: 3,
      title: "تحدي المنشور",
      description:
        "شارك منشورًا عن أمانتي بالطريقة المحددة واستوفِ شروط المشاركة.",
      reward: 300,
      progress: 0,
      target: "منشور مؤهل",
      category: "سوشيال",
      icon: Megaphone,
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-600",
    },
    {
      id: 4,
      title: "تحدي التفاعل",
      description:
        "تفاعل مع منشور الحملة، اكتب تعليقًا حقيقيًا وشارك المنشور.",
      reward: 100,
      progress: 0,
      target: "3 إجراءات",
      category: "تفاعل",
      icon: Share2,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
    },
    {
      id: 5,
      title: "ادعُ صديقًا",
      description:
        "شارك رابط الدعوة الخاص بك وساعد مستخدمًا جديدًا على الانضمام إلى أمانتي.",
      reward: 500,
      progress: 0,
      target: "مستخدم جديد",
      category: "إحالات",
      icon: Users,
      iconBg: "bg-primary/[0.07]",
      iconColor: "text-primary",
    },
    {
      id: 6,
      title: "أول شحنة عن طريقك",
      description:
        "شارك أمانتي مع شخص جديد، وعند إتمام أول شحنة مؤهلة تحصل على المكافأة.",
      reward: 750,
      progress: 0,
      target: "شحنة مكتملة",
      category: "إحالات",
      icon: Package,
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-600",
    },
  ];

  const filters = [
    "الكل",
    "سوشيال",
    "تفاعل",
    "إحالات",
  ];

  const filteredChallenges = useMemo(() => {
    if (activeFilter === "الكل") {
      return challenges;
    }

    return challenges.filter(
      (challenge) => challenge.category === activeFilter,
    );
  }, [activeFilter]);

  function handleStartChallenge(id: number) {
    setStartedChallenge(id);
  }

  return (
    <DashboardShell
      title="تحديات أمانتي"
      subtitle="أنجز التحديات، شارك أمانتي، واربح مكافآت."
      nav={nav}
    >
      <div className="space-y-7 sm:space-y-8">

        {/* ================================================================ */}
        {/* HERO                                                              */}
        {/* ================================================================ */}

        <section className="relative isolate overflow-hidden rounded-[2rem] border border-primary/10 bg-primary p-5 text-primary-foreground shadow-xl sm:p-7 lg:p-9">

          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-32 -top-32 size-80 rounded-full bg-secondary/30 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 left-1/4 size-96 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute right-1/2 top-1/2 size-72 -translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />

          {/* Decorative dots */}
          <div className="pointer-events-none absolute right-8 top-8 grid grid-cols-5 gap-2 opacity-20">
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                key={index}
                className="size-1 rounded-full bg-white"
              />
            ))}
          </div>

          <div className="relative grid gap-8 xl:grid-cols-[1fr_390px] xl:items-center">

            <div className="min-w-0">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur-md">
                <Sparkles
                  className="size-4"
                  strokeWidth={1.7}
                />
                عالم المكافآت من أمانتي
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-[1.12] tracking-tight sm:text-4xl lg:text-[3.4rem]">
                أنجز التحدي،
                <span className="block text-secondary">
                  واكسب مع أمانتي ✨
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-primary-foreground/70 sm:text-base sm:leading-8">
                كل يوم توجد فرص جديدة لكسب المكافآت.
                شارك، تفاعل، ادعُ أصدقاءك، وأنجز المهام
                لتحصل على مكافآت يمكن إضافتها إلى محفظتك.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">

                <a
                  href="#today"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-black text-secondary-foreground shadow-lg shadow-secondary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <Rocket
                    className="size-5"
                    strokeWidth={1.7}
                  />
                  اكتشف تحدي اليوم
                </a>

                <Link
                  to="/wallet"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black backdrop-blur-md transition-all hover:bg-white/15"
                >
                  <WalletCards
                    className="size-5"
                    strokeWidth={1.7}
                  />
                  محفظتي
                </Link>

              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-bold text-primary-foreground/65">

                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-white/10">
                    <Flame
                      className="size-4 text-secondary"
                      strokeWidth={1.7}
                    />
                  </span>
                  سلسلة إنجازك تبدأ اليوم
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-white/10">
                    <Zap
                      className="size-4 text-secondary"
                      strokeWidth={1.7}
                    />
                  </span>
                  تحديات متجددة
                </div>

              </div>

            </div>

            {/* HERO REWARD CARD */}

            <div className="relative">

              <div className="absolute -inset-3 rounded-[2rem] bg-secondary/10 blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl backdrop-blur-xl sm:p-6">

                <div className="flex items-center justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                      <Trophy
                        className="size-5"
                        strokeWidth={1.7}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-primary-foreground/50">
                        مكافآتك
                      </p>

                      <p className="mt-0.5 text-sm font-black">
                        تقدمك هذا الأسبوع
                      </p>
                    </div>

                  </div>

                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1.5 text-[10px] font-black text-emerald-300">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    نشط
                  </div>

                </div>

                <div className="mt-7 flex items-end justify-between gap-4">

                  <div>
                    <p className="text-xs font-medium text-primary-foreground/50">
                      أرباح التحديات
                    </p>

                    <p className="mt-1 text-4xl font-black tracking-tight">
                      0
                      <span className="mr-2 text-sm font-bold text-primary-foreground/50">
                        ريال
                      </span>
                    </p>
                  </div>

                  <div className="flex size-14 items-center justify-center rounded-full border-4 border-secondary/20 bg-secondary/10">
                    <span className="text-sm font-black text-secondary">
                      0%
                    </span>
                  </div>

                </div>

                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-primary-foreground/50">
                    <span>التقدم الأسبوعي</span>
                    <span>0 / 5 مهام</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-0 rounded-full bg-secondary" />
                  </div>

                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">

                  <div className="rounded-2xl bg-white/[0.06] p-3">
                    <div className="flex items-center gap-2 text-primary-foreground/50">
                      <Flame
                        className="size-4 text-secondary"
                        strokeWidth={1.7}
                      />
                      <span className="text-[10px] font-bold">
                        السلسلة
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-black">
                      0 يوم
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/[0.06] p-3">
                    <div className="flex items-center gap-2 text-primary-foreground/50">
                      <Target
                        className="size-4 text-secondary"
                        strokeWidth={1.7}
                      />
                      <span className="text-[10px] font-bold">
                        المستوى
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-black">
                      مبتدئ
                    </p>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================================================================ */}
        {/* QUICK STATS                                                       */}
        {/* ================================================================ */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          <QuickStat
            icon={Gift}
            title="مكافآت متاحة"
            value="6"
            description="تحديات يمكنك تنفيذها"
            tone="green"
          />

          <QuickStat
            icon={Flame}
            title="سلسلتك"
            value="0 يوم"
            description="حافظ على نشاطك اليومي"
            tone="orange"
          />

          <QuickStat
            icon={CheckCircle2}
            title="أنجزت"
            value="0"
            description="مهمة مكتملة"
            tone="blue"
          />

          <QuickStat
            icon={WalletCards}
            title="أرباحك"
            value="0 ريال"
            description="من التحديات"
            tone="navy"
          />

        </section>

        {/* ================================================================ */}
        {/* TODAY'S CHALLENGE                                                 */}
        {/* ================================================================ */}

        <section id="today">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-secondary" />

                <span className="text-[10px] font-black tracking-wider text-secondary">
                  تحدي اليوم
                </span>
              </div>

              <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
                مهمتك الذهبية اليوم
              </h2>

              <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                تحدي محدود الوقت بمكافأة مميزة.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-xl border border-orange-500/10 bg-orange-500/[0.06] px-3 py-2 text-xs font-black text-orange-600 sm:self-auto">
              <Clock3
                className="size-4"
                strokeWidth={1.7}
              />
              ينتهي اليوم
            </div>

          </div>

          <div className="relative overflow-hidden rounded-[1.75rem] border border-secondary/20 bg-gradient-to-br from-secondary/[0.10] via-card to-primary/[0.04] p-5 shadow-soft sm:p-7">

            <div className="pointer-events-none absolute -left-20 -top-20 size-48 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative grid gap-7 lg:grid-cols-[1fr_280px] lg:items-center">

              <div className="min-w-0">

                <div className="flex flex-wrap items-center gap-2">

                  <span className="rounded-full bg-secondary/10 px-3 py-1.5 text-[10px] font-black text-secondary">
                    مكافأة 500 ريال
                  </span>

                  <span className="rounded-full bg-primary/[0.06] px-3 py-1.5 text-[10px] font-black text-primary">
                    06:24:18 متبقي
                  </span>

                </div>

                <div className="mt-5 flex items-start gap-4">

                  <div className="flex size-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-sky-500/10 text-sky-600 shadow-sm">
                    <ImageIcon
                      className="size-7"
                      strokeWidth={1.6}
                    />
                  </div>

                  <div className="min-w-0">

                    <h3 className="text-xl font-black text-primary sm:text-2xl">
                      انشر ستوري أمانتي
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
                      انشر محتوى أمانتي في Story وحقق العدد
                      المطلوب من المشاهدات خلال مدة التحدي.
                    </p>

                  </div>

                </div>

                <div className="mt-6">

                  <div className="mb-2 flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">
                      التقدم
                    </span>

                    <span className="text-primary">
                      0 / 500 مشاهدة
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-0 rounded-full bg-secondary transition-all" />
                  </div>

                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={() => handleStartChallenge(1)}
                    className={`${buttonClass(
                      "primary",
                      "lg",
                    )} justify-center gap-2`}
                  >
                    <Play
                      className="size-5"
                      strokeWidth={1.7}
                    />
                    {startedChallenge === 1
                      ? "التحدي بدأ"
                      : "ابدأ التحدي"}
                  </button>

                  <button
                    type="button"
                    className={`${buttonClass(
                      "ghost",
                      "lg",
                    )} justify-center gap-2`}
                  >
                    <ShieldCheck
                      className="size-5"
                      strokeWidth={1.7}
                    />
                    شروط التحدي
                  </button>

                </div>

              </div>

              <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-5 backdrop-blur-sm">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      المكافأة
                    </p>

                    <p className="mt-1 text-3xl font-black text-secondary">
                      500
                    </p>

                    <p className="text-xs font-bold text-muted-foreground">
                      ريال
                    </p>
                  </div>

                  <div className="flex size-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Trophy
                      className="size-7"
                      strokeWidth={1.5}
                    />
                  </div>

                </div>

                <div className="mt-6 border-t border-border/60 pt-5">

                  <div className="flex items-center gap-3">

                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.06] text-primary">
                      <Users
                        className="size-4"
                        strokeWidth={1.7}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-black text-primary">
                        شارك واربح
                      </p>

                      <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                        المكافأة بعد التحقق من الإنجاز
                      </p>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FILTERS                                                           */}
        {/* ================================================================ */}

        <section>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-secondary" />

                <span className="text-[10px] font-black tracking-wider text-secondary">
                  اكتشف المزيد
                </span>
              </div>

              <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
                جميع التحديات
              </h2>

              <p className="mt-1 text-xs font-medium text-muted-foreground">
                اختر التحدي الذي يناسبك وابدأ بجمع المكافآت.
              </p>
            </div>

            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted hover:text-primary"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">

            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                started={startedChallenge === challenge.id}
                onStart={() => handleStartChallenge(challenge.id)}
              />
            ))}

          </div>

        </section>

        {/* ================================================================ */}
        {/* LEVEL / STREAK                                                    */}
        {/* ================================================================ */}

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">

          <Card className="relative overflow-hidden rounded-[1.75rem] border-border/70 p-6 shadow-soft sm:p-7">

            <div className="pointer-events-none absolute -left-16 -top-16 size-40 rounded-full bg-orange-500/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                    <Flame
                      className="size-6"
                      strokeWidth={1.6}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      سلسلة الإنجاز
                    </p>

                    <h3 className="mt-1 text-lg font-black text-primary">
                      لا تكسر السلسلة 🔥
                    </h3>
                  </div>

                </div>

                <span className="text-2xl font-black text-orange-600">
                  0
                </span>

              </div>

              <p className="mt-5 text-sm font-medium leading-7 text-muted-foreground">
                أنجز تحديًا واحدًا على الأقل كل يوم
                وحافظ على سلسلة إنجازك لفتح مكافآت
                إضافية مستقبلًا.
              </p>

              <div className="mt-6 grid grid-cols-7 gap-2">

                {[
                  "س",
                  "ح",
                  "ن",
                  "ث",
                  "ر",
                  "خ",
                  "ج",
                ].map((day) => (
                  <div
                    key={day}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {day}
                    </span>

                    <div className="flex size-8 items-center justify-center rounded-xl border border-border bg-muted/30 text-[10px] font-black text-muted-foreground">
                      —
                    </div>
                  </div>
                ))}

              </div>

            </div>
          </Card>

          <Card className="relative overflow-hidden rounded-[1.75rem] border-border/70 p-6 shadow-soft sm:p-7">

            <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-start gap-3">

                <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Trophy
                    className="size-6"
                    strokeWidth={1.6}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground">
                    مستويات أمانتي
                  </p>

                  <h3 className="mt-1 text-lg font-black text-primary">
                    تقدّم وافتح مزايا جديدة
                  </h3>
                </div>

              </div>

              <div className="mt-6">

                <div className="flex items-end justify-between gap-3">

                  <div>
                    <p className="text-xs font-bold text-muted-foreground">
                      مستواك الحالي
                    </p>

                    <p className="mt-1 text-2xl font-black text-primary">
                      المبتدئ
                    </p>
                  </div>

                  <p className="text-xs font-black text-secondary">
                    0 / 10 مهمة
                  </p>

                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-0 rounded-full bg-secondary" />
                </div>

              </div>

              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/40 p-3">

                <Gift
                  className="size-5 shrink-0 text-secondary"
                  strokeWidth={1.7}
                />

                <p className="text-xs font-bold leading-5 text-muted-foreground">
                  أكمل 10 مهام لفتح المستوى التالي.
                </p>

              </div>

            </div>
          </Card>

        </section>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                      */}
        {/* ================================================================ */}

        <section>

          <div>
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-secondary" />

              <span className="text-[10px] font-black tracking-wider text-secondary">
                كيف تحصل على مكافأتك؟
              </span>
            </div>

            <h2 className="mt-1.5 text-xl font-black text-primary sm:text-2xl">
              أربع خطوات بسيطة
            </h2>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <HowStep
              number="01"
              icon={Target}
              title="اختر تحديًا"
              description="اختر من التحديات اليومية والأسبوعية المتاحة لك."
            />

            <HowStep
              number="02"
              icon={Play}
              title="ابدأ التنفيذ"
              description="اقرأ الشروط ونفذ المهمة بالطريقة المطلوبة."
            />

            <HowStep
              number="03"
              icon={CheckCircle2}
              title="أرسل الإثبات"
              description="أرسل ما يثبت إتمامك للتحدي ليتم التحقق منه."
            />

            <HowStep
              number="04"
              icon={WalletCards}
              title="استلم المكافأة"
              description="بعد اعتماد المهمة تضاف المكافأة إلى محفظتك."
            />

          </div>
        </section>

        {/* ================================================================ */}
        {/* LEADERBOARD                                                       */}
        {/* ================================================================ */}

        <section>

          <Card className="relative overflow-hidden rounded-[1.75rem] border-border/70 p-0 shadow-soft">

            <div className="pointer-events-none absolute -left-20 -top-20 size-52 rounded-full bg-secondary/[0.07] blur-3xl" />

            <div className="relative border-b border-border/60 p-5 sm:p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                    <Trophy
                      className="size-6"
                      strokeWidth={1.6}
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-black tracking-wider text-secondary">
                      المنافسة
                    </p>

                    <h2 className="mt-1 text-lg font-black text-primary">
                      أبطال هذا الأسبوع
                    </h2>

                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      ترتيب تجريبي للمشاركين الأكثر نشاطًا.
                    </p>
                  </div>

                </div>

                <span className="self-start rounded-xl bg-primary/[0.05] px-3 py-2 text-[10px] font-black text-primary sm:self-auto">
                  هذا الأسبوع
                </span>

              </div>

            </div>

            <div className="grid gap-3 p-5 sm:p-6 md:grid-cols-3">

              <LeaderboardItem
                rank="01"
                name="—"
                tasks="0 مهمة"
                reward="0 ريال"
                highlighted
              />

              <LeaderboardItem
                rank="02"
                name="—"
                tasks="0 مهمة"
                reward="0 ريال"
              />

              <LeaderboardItem
                rank="03"
                name="—"
                tasks="0 مهمة"
                reward="0 ريال"
              />

            </div>

          </Card>
        </section>

        {/* ================================================================ */}
        {/* TRUST / RULES                                                     */}
        {/* ================================================================ */}

        <section>

          <Card className="relative overflow-hidden rounded-[1.75rem] border-primary/10 bg-gradient-to-br from-primary/[0.04] via-card to-secondary/[0.04] p-5 shadow-soft sm:p-7">

            <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-secondary/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex min-w-0 gap-4">

                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary">
                  <ShieldCheck
                    className="size-5"
                    strokeWidth={1.7}
                  />
                </div>

                <div className="min-w-0">

                  <h3 className="text-base font-black text-primary sm:text-lg">
                    مكافآت عادلة ونظام واضح
                  </h3>

                  <p className="mt-1 max-w-2xl text-xs font-medium leading-6 text-muted-foreground sm:text-sm">
                    كل تحدٍ له شروطه الخاصة. بعد إرسال الإثبات
                    تتم مراجعته، وعند قبول الإنجاز تضاف
                    المكافأة إلى محفظتك.
                  </p>

                </div>

              </div>

              <Link
                to="/terms"
                className={`${buttonClass(
                  "ghost",
                  "sm",
                )} shrink-0 justify-center gap-2`}
              >
                الشروط والأحكام
                <ChevronLeft
                  className="size-4"
                  strokeWidth={1.7}
                />
              </Link>

            </div>

          </Card>
        </section>

        {/* ================================================================ */}
        {/* FOOTER BACK                                                       */}
        {/* ================================================================ */}

        <div className="flex justify-center pb-2">

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-muted-foreground transition-colors hover:text-primary"
          >
            العودة إلى لوحة التحكم
            <ArrowLeft
              className="size-4"
              strokeWidth={1.7}
            />
          </Link>

        </div>

      </div>
    </DashboardShell>
  );
}

/* ==========================================================================
 * QUICK STAT
 * ========================================================================== */

function QuickStat({
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
  tone: "green" | "orange" | "blue" | "navy";
}) {
  const tones = {
    green: "bg-emerald-500/10 text-emerald-600",
    orange: "bg-orange-500/10 text-orange-600",
    blue: "bg-sky-500/10 text-sky-600",
    navy: "bg-primary/[0.07] text-primary",
  };

  return (
    <Card className="group relative overflow-hidden rounded-[1.5rem] border-border/70 p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-5">

      <div className="flex items-center gap-3">

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}
        >
          <Icon
            className="size-5"
            strokeWidth={1.7}
          />
        </div>

        <div className="min-w-0">

          <p className="text-xs font-bold text-muted-foreground">
            {title}
          </p>

          <p className="mt-0.5 text-xl font-black text-primary">
            {value}
          </p>

        </div>

      </div>

      <p className="mt-3 text-[10px] font-medium text-muted-foreground">
        {description}
      </p>

    </Card>
  );
}

/* ==========================================================================
 * CHALLENGE CARD
 * ========================================================================== */

function ChallengeCard({
  challenge,
  started,
  onStart,
}: {
  challenge: Challenge;
  started: boolean;
  onStart: () => void;
}) {
  const Icon = challenge.icon;

  return (
    <Card
      className={`group relative overflow-hidden rounded-[1.5rem] border-border/70 p-0 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        challenge.featured
          ? "ring-1 ring-secondary/15"
          : ""
      }`}
    >

      <div className="relative p-5 sm:p-6">

        {challenge.badge && (
          <div className="absolute left-5 top-5 rounded-full border border-secondary/15 bg-secondary/10 px-2.5 py-1 text-[9px] font-black text-secondary">
            {challenge.badge}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">

          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${challenge.iconBg} ${challenge.iconColor}`}
          >
            <Icon
              className="size-5"
              strokeWidth={1.7}
            />
          </div>

          {challenge.featured ? (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1.5 text-[9px] font-black text-orange-600">
              <Flame
                className="size-3.5"
                strokeWidth={1.7}
              />
              يومي
            </div>
          ) : null}

        </div>

        <div className="mt-5">

          <p className="text-[10px] font-black text-secondary">
            {challenge.category}
          </p>

          <h3 className="mt-1 text-lg font-black text-primary">
            {challenge.title}
          </h3>

          <p className="mt-2 min-h-[66px] text-xs font-medium leading-6 text-muted-foreground">
            {challenge.description}
          </p>

        </div>

        <div className="mt-5 rounded-2xl bg-muted/35 p-3">

          <div className="flex items-center justify-between gap-3">

            <div>
              <p className="text-[9px] font-bold text-muted-foreground">
                المكافأة
              </p>

              <p className="mt-0.5 text-xl font-black text-secondary">
                {challenge.reward}
                <span className="mr-1 text-[10px]">
                  ريال
                </span>
              </p>
            </div>

            <div className="text-left">

              <p className="text-[9px] font-bold text-muted-foreground">
                المطلوب
              </p>

              <p className="mt-0.5 text-xs font-black text-primary">
                {challenge.target}
              </p>

            </div>

          </div>

        </div>

        <div className="mt-4">

          <div className="mb-2 flex items-center justify-between text-[10px] font-bold">

            <span className="text-muted-foreground">
              التقدم
            </span>

            <span className="text-primary">
              {challenge.progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500"
              style={{
                width: `${challenge.progress}%`,
              }}
            />
          </div>

        </div>

        <button
          type="button"
          onClick={onStart}
          className={`mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
            started
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-lg"
          }`}
        >
          {started ? (
            <>
              <Check
                className="size-4"
                strokeWidth={1.8}
              />
              التحدي بدأ
            </>
          ) : (
            <>
              <Play
                className="size-4"
                strokeWidth={1.7}
              />
              ابدأ التحدي
            </>
          )}
        </button>

      </div>
    </Card>
  );
}

/* ==========================================================================
 * HOW STEP
 * ========================================================================== */

function HowStep({
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

      <div className="absolute left-5 top-4 text-4xl font-black tracking-tight text-primary/[0.04]">
        {number}
      </div>

      <div className="relative">

        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/[0.07] text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon
            className="size-5"
            strokeWidth={1.7}
          />
        </div>

        <h3 className="mt-5 text-base font-black text-primary">
          {title}
        </h3>

        <p className="mt-2 text-xs font-medium leading-6 text-muted-foreground">
          {description}
        </p>

      </div>
    </div>
  );
}

/* ==========================================================================
 * LEADERBOARD ITEM
 * ========================================================================== */

function LeaderboardItem({
  rank,
  name,
  tasks,
  reward,
  highlighted = false,
}: {
  rank: string;
  name: string;
  tasks: string;
  reward: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border p-4 ${
        highlighted
          ? "border-secondary/15 bg-secondary/[0.06]"
          : "border-border/60 bg-muted/20"
      }`}
    >

      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
          highlighted
            ? "bg-secondary/10 text-secondary"
            : "bg-background text-primary"
        }`}
      >
        {rank}
      </div>

      <div className="min-w-0 flex-1">

        <p className="truncate text-sm font-black text-primary">
          {name}
        </p>

        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
          {tasks}
        </p>

      </div>

      <p className="shrink-0 text-xs font-black text-secondary">
        {reward}
      </p>

    </div>
  );
}