import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { HelpCircle } from "lucide-react";

export const Route = createFileRoute("/help")({
  component: HelpPage,
});

function HelpPage() {
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

            {/* العنوان */}

            <div className="text-center">

              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#008577] text-white sm:size-14">
                <HelpCircle className="size-6 sm:size-[26px]" />
              </div>

              <span className="mt-4 block text-xs font-bold text-brand-green sm:mt-5 sm:text-sm">
                الدعم
              </span>

              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary sm:mt-3 sm:text-4xl">
                مركز المساعدة
              </h1>

              <p className="mx-auto mt-3 max-w-2xl break-words text-xs leading-7 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
                نساعدك في معرفة طريقة استخدام خدمات أمانتي والوصول إلى
                المعلومات التي تحتاجها.
              </p>

            </div>

            {/* المحتوى */}

            <div className="mt-7 w-full min-w-0 rounded-2xl border border-border bg-card p-4 sm:mt-10 sm:p-8">

              <div className="min-w-0 space-y-4 text-xs leading-7 text-muted-foreground sm:space-y-5 sm:text-sm sm:leading-8">

                <p className="break-words">
                  يمكنك إنشاء شحنة من خلال حسابك وإدخال بيانات المستلم
                  واختيار نقطة الاستلام المناسبة.
                </p>

                <p className="break-words">
                  يمكنك حفظ أمانة وتحديد بيانات الشخص الذي سيقوم باستلامها.
                </p>

                <p className="break-words">
                  يمكنك استخدام رقم التتبع لمعرفة آخر حالة مسجلة لطلبك.
                </p>

                <p className="break-words">
                  إذا احتجت إلى مساعدة إضافية، يمكنك التواصل مع فريق
                  أمانتي من خلال وسائل التواصل المتاحة في الموقع.
                </p>

              </div>
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