import type { ReactNode } from "react";
import {
  ArrowRight,
  Construction,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, buttonClass } from "@/components/amanati/ui";
import { merchantNav } from "@/components/amanati/merchantNavigation";

type MerchantPlaceholderProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function MerchantPlaceholder({
  title,
  description,
  icon,
}: MerchantPlaceholderProps) {
  return (
    <DashboardShell
      title={title}
      subtitle={description}
      nav={merchantNav.map((item) => ({
        ...item,
        active: item.label === title,
      }))}
    >
      <Card className="overflow-hidden">
        <div className="flex min-h-[420px] flex-col items-center justify-center px-6 py-12 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-primary/5">
            {icon}
          </div>

          <h2 className="mt-6 text-2xl font-extrabold text-primary">
            {title}
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
            {description}
          </p>

          <div className="mt-6 flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
            <Construction className="size-4" />
            هذا القسم جاهز للتطوير
          </div>

          <Link
            to="/merchant"
            className={buttonClass("primary", "sm") + " mt-6"}
          >
            <ArrowRight className="size-4" />
            العودة للوحة التحكم
          </Link>
        </div>
      </Card>
    </DashboardShell>
  );
}