import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
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
                <FileText className="size-6 sm:size-[26px]" />
              </div>

              <span className="mt-4 block text-xs font-bold text-brand-green sm:mt-5 sm:text-sm">
                القواعد
              </span>

              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-primary sm:mt-3 sm:text-4xl">
                الشروط والأحكام
              </h1>

              <p className="mx-auto mt-3 max-w-2xl break-words text-xs leading-7 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
                قواعد استخدام منصة أمانتي وخدماتها.
              </p>
            </div>

            <div className="mt-7 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card p-4 sm:mt-10 sm:p-8">
              <ul className="list-inside space-y-4 text-xs leading-7 text-muted-foreground sm:space-y-5 sm:text-sm sm:leading-8">
                <li className="break-words">
                  باستخدام منصة أمانتي، يلتزم المستخدم بتقديم بيانات صحيحة
                  عند إنشاء الحساب والطلبات.
                </li>

                <li className="break-words">
                  يتحمل المستخدم مسؤولية صحة بيانات المرسل والمستلم التي
                  يدخلها في الطلب.
                </li>

                <li className="break-words">
                  يجب استخدام خدمات أمانتي للأغراض المشروعة والالتزام
                  بالأنظمة واللوائح المعمول بها.
                </li>

                <li className="break-words">
                  تحتفظ أمانتي بحق تحديث هذه الشروط عند اعتماد النسخة
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