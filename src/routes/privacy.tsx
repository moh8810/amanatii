import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { LockKeyhole } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
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
                <LockKeyhole className="size-6 sm:size-[26px]" />
              </div>

              <span className="mt-4 block text-xs font-bold text-brand-green sm:mt-5 sm:text-sm">
                الخصوصية
              </span>

              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary sm:mt-3 sm:text-4xl">
                سياسة الخصوصية
              </h1>

              <p className="mx-auto mt-3 max-w-2xl break-words text-xs leading-7 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
                نحرص على التعامل مع بياناتك بطريقة مسؤولة واستخدامها
                لتقديم خدمات أمانتي.
              </p>
            </div>

            <div className="mt-7 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:mt-10 sm:p-8">
              <ul className="list-inside space-y-4 text-xs leading-7 text-muted-foreground sm:space-y-5 sm:text-sm sm:leading-8">
                <li className="break-words">
                  تُستخدم البيانات التي تقدمها عند إنشاء الحساب والطلبات
                  لتشغيل خدمات أمانتي.
                </li>

                <li className="break-words">
                  يتم التعامل مع بيانات الشحن والمستلمين ضمن نطاق تنفيذ
                  الطلب وإدارته.
                </li>

                <li className="break-words">
                  يجب على المستخدم المحافظة على بيانات تسجيل الدخول
                  الخاصة بحسابه.
                </li>

                <li className="break-words">
                  سيتم تحديث سياسة الخصوصية بشكل رسمي عند اعتماد السياسة
                  النهائية للمنصة.
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
