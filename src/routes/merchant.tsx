import {
  createFileRoute,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { merchantNav } from "@/components/amanati/merchantNavigation";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant")({
  component: MerchantLayout,
});

type MerchantProfile = {
  full_name: string | null;
  role: string | null;
};

function MerchantLayout() {
  const location = useLocation();
  const pathname = location.pathname;

  const [merchantName, setMerchantName] = useState("التاجر");

  useEffect(() => {
    let mounted = true;

    async function loadMerchantProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error(
            "MERCHANT LAYOUT PROFILE ERROR:",
            error,
          );
          return;
        }

        const profile = data as MerchantProfile;

        if (!mounted) {
          return;
        }

        if (profile.role === "merchant") {
          setMerchantName(
            profile.full_name?.trim() || "التاجر",
          );
        }
      } catch (error) {
        console.error(
          "MERCHANT LAYOUT ERROR:",
          error,
        );
      }
    }

    void loadMerchantProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const pageInfo = (() => {
    if (pathname === "/merchant") {
      return {
        title: `مرحباً، ${merchantName} 👋`,
        subtitle:
          "تابع طلبات عملائك وشحناتك وأماناتك بسهولة.",
      };
    }

    if (pathname.startsWith("/merchant/orders")) {
      return {
        title: "الطلبات",
        subtitle:
          "إدارة ومتابعة جميع شحنات متجرك من مكان واحد.",
      };
    }

    if (pathname.startsWith("/merchant/amanat")) {
      return {
        title: "الأمانات",
        subtitle:
          "إدارة ومتابعة الأمانات الخاصة بمتجرك بسهولة.",
      };
    }

    if (pathname.startsWith("/merchant/customers")) {
      return {
        title: "العملاء",
        subtitle:
          "إدارة عملائك ومتابعة شحناتهم ونشاطهم مع متجرك.",
      };
    }

    if (pathname.startsWith("/merchant/wallet")) {
      return {
        title: "المحفظة والأرباح",
        subtitle:
          "تابع رصيدك وأرباحك وعمولاتك وحركاتك المالية.",
      };
    }

    if (pathname.startsWith("/merchant/marketing")) {
      return {
        title: "التسويق بالعمولة",
        subtitle:
          "نمِّ متجرك واستفد من برنامج الإحالات والعمولات.",
      };
    }

    if (pathname.startsWith("/merchant/leaderboard")) {
      return {
        title: "المتصدرين",
        subtitle:
          "تابع ترتيبك وإنجازاتك ومؤشرات أداء متجرك.",
      };
    }

    if (pathname.startsWith("/merchant/reports")) {
      return {
        title: "التقارير",
        subtitle:
          "حلّل أداء متجرك وشحناتك وعملائك وأرباحك.",
      };
    }

    if (pathname.startsWith("/merchant/notifications")) {
      return {
        title: "الإشعارات",
        subtitle:
          "تابع آخر التنبيهات والتحديثات المهمة الخاصة بمتجرك.",
      };
    }

    if (pathname.startsWith("/merchant/settings")) {
      return {
        title: "الإعدادات",
        subtitle:
          "إدارة بيانات متجرك وحسابك وتفضيلاتك.",
      };
    }

    if (pathname.startsWith("/merchant/support")) {
      return {
        title: "الدعم والمساعدة",
        subtitle:
          "نحن هنا لمساعدتك في أي وقت تحتاج فيه إلى الدعم.",
      };
    }

    return {
      title: "لوحة التاجر",
      subtitle:
        "إدارة متجرك وشحناتك وأماناتك من مكان واحد.",
    };
  })();

  const activeNav = merchantNav.map((item) => ({
    ...item,
    active:
      item.to === "/merchant"
        ? pathname === "/merchant"
        : pathname.startsWith(item.to),
  }));

  return (
    <DashboardShell
      title={pageInfo.title}
      subtitle={pageInfo.subtitle}
      nav={activeNav}
    >
      <Outlet />
    </DashboardShell>
  );
}
