import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/shipping-policy")({
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen w-full overflow-x-hidden bg-background"
    >
      <SiteHeader />

      <main className="w-full min-w-0">
        <section className="w-full min-w-0 py-10 sm:py-16 lg:py-24">
          <div className="mx-auto w-full max-w-4xl min-w-0 px-3 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#008577] text-white sm:size-14">
                <ShieldCheck className="size-6 sm:size-[26px]" />
              </div>

              <span className="mt-4 block text-xs font-bold text-brand-green sm:mt-5 sm:text-sm">
                الخدمات
              </span>

              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary sm:mt-3 sm:text-4xl">
                سياسة الشحن
              </h1>

              <p className="mx-auto mt-3 max-w-2xl break-words text-xs leading-7 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
                معلومات عامة حول آلية إرسال الشحنات ومتابعتها عبر أمانتي.
              </p>
            </div>

            <div className="mt-7 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:mt-10 sm:p-8">
              <ul className="list-inside space-y-4 text-xs leading-7 text-muted-foreground sm:space-y-5 sm:text-sm sm:leading-8">
                <li className="break-words">
                  يتم إنشاء طلب الشحن من خلال منصة أمانتي وإدخال بيانات
                  الشحنة والمستلم.
                </li>

                <li className="break-words">
                  يتم تحديد نقطة الاستلام المناسبة وفق الخيارات المتاحة
                  في المنصة.
                </li>

                <li className="break-words">
                  يتم تحديد رسوم الشحن من خلال إدارة أمانتي بعد مراجعة
                  بيانات الطلب.
                </li>

                <li className="break-words">
                  يمكن للعميل متابعة حالة الشحنة باستخدام رقم التتبع
                  الخاص بها.
                </li>

                <li className="break-words">
                  عند تغير حالة الشحنة، تظهر الحالة الجديدة في حساب
                  العميل ويتم إرسال إشعار عند توفره.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="w-full min-w-0">
          <CtaBanner />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
