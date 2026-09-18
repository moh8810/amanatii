import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  Bell,
  Clock3,
  HelpCircle,
  Package,
  Settings,
  ShieldCheck,
  Trophy,
  WalletCards,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card } from "@/components/amanati/ui";

export const Route = createFileRoute("/challenges")({
  head: () => ({
    meta: [
      {
        title: "تحديات أمانتي | AMANATI",
      },
      {
        name: "description",
        content:
          "تحديات أمانتي ومكافآتها ستكون متاحة قريبًا.",
      },
      {
        property: "og:title",
        content: "تحديات أمانتي | AMANATI",
      },
      {
        property: "og:description",
        content:
          "تحديات أمانتي ومكافآتها ستكون متاحة قريبًا.",
      },
    ],
  }),
  component: ChallengesPage,
});

function ChallengesPage() {
  const nav = [
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

  return (
    <DashboardShell
      title="تحديات أمانتي"
      subtitle="مكافآت وتجارب جديدة قادمة إليك قريبًا."
      nav={nav}
    >
      <div className="flex min-h-[65vh] items-center justify-center py-10">
        <Card className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-primary/10 p-0 shadow-soft">
          
          {/* الخلفية الزخرفية */}
          <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-secondary/[0.10] blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-primary/[0.06] blur-3xl" />

          <div className="relative px-6 py-12 text-center sm:px-10 sm:py-16">

            {/* الأيقونة */}
            <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] bg-secondary/10 text-secondary shadow-sm">
              <Trophy
                className="size-10"
                strokeWidth={1.5}
              />
            </div>

            {/* قريبًا */}
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-orange-500/10 bg-orange-500/[0.07] px-4 py-2 text-xs font-black text-orange-600">
              <Clock3
                className="size-4"
                strokeWidth={1.7}
              />
              قريبًا
            </div>

            {/* العنوان */}
            <h1 className="mt-5 text-3xl font-black tracking-tight text-primary sm:text-4xl">
              تحديات أمانتي
            </h1>

            {/* الوصف */}
            <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-8 text-muted-foreground sm:text-base">
              نعمل حاليًا على تجهيز تحديات ومكافآت خاصة بك.
              <br />
              ستكون هذه الميزة متاحة قريبًا.
            </p>

            {/* العودة للوحة التحكم */}
            <Link
              to="/dashboard"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            >
              العودة إلى لوحة التحكم

              <ArrowLeft
                className="size-4"
                strokeWidth={1.8}
              />
            </Link>

          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}