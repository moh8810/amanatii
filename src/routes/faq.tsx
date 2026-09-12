import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Faq } from "@/components/landing/Faq";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";

const title = "الأسئلة الشائعة | أمانتي";
const description =
  "إجابات عن أهم الأسئلة المتعلقة بخدمات الشحن وحفظ الأمانات وتتبع الطلبات في منصة أمانتي.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen w-full overflow-x-hidden bg-background"
    >
      <SiteHeader />

      <main className="w-full min-w-0">
        <div className="w-full min-w-0 pt-4 sm:pt-6">
          <Faq />
        </div>

        <div className="w-full min-w-0">
          <CtaBanner />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}