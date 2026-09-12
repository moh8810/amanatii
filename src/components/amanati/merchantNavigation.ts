import {
  LayoutDashboard,
  ClipboardList,
  ShieldCheck,
  Users,
  WalletCards,
  Megaphone,
  Trophy,
  BarChart3,
  Bell,
  Settings,
  Headset,
} from "lucide-react";

export const merchantNav = [
  {
    label: "لوحة التحكم",
    icon: LayoutDashboard,
    to: "/merchant",
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
    label: "المحفظة والأرباح",
    icon: WalletCards,
    to: "/merchant/wallet",
  },
  {
    label: "التسويق بالعمولة",
    icon: Megaphone,
    to: "/merchant/marketing",
  },
  {
    label: "المتصدرين",
    icon: Trophy,
    to: "/merchant/leaderboard",
  },
  {
    label: "التقارير",
    icon: BarChart3,
    to: "/merchant/reports",
  },
  {
    label: "الإشعارات",
    icon: Bell,
    to: "/merchant/notifications",
  },
  {
    label: "الإعدادات",
    icon: Settings,
    to: "/merchant/settings",
  },
  {
    label: "الدعم والمساعدة",
    icon: Headset,
    to: "/merchant/support",
  },
] as const;