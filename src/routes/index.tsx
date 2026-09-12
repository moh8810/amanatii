import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { TrackingSection } from "@/components/landing/TrackingSection";
import { Services } from "@/components/landing/Services";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import { WhyAmanati } from "@/components/landing/WhyAmanati";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { SiteFooter } from "@/components/landing/SiteFooter";

const title = "أمانتي | الشحن وحفظ الأمانات في منصة واحدة";
const description =
  "أمانتي منصة يمنية تجمع خدمات الشحن السريع وحفظ الأمانات بأمان، مع تتبع واضح لشحنتك أو أمانتك في أي وقت.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  /** Hook this up to the existing tracking backend later. */
  const handleTrack = (reference: string) => {
    if (!reference) return;
    console.info("tracking request:", reference);
  };

  return (
    <div
      dir="rtl"
      lang="ar"
      className="min-h-screen bg-background"
    >
      <SiteHeader />

      <main>
        <Hero />

        <TrackingSection onTrack={handleTrack} />

        <Services />

        <HowItWorks />

        <Stats />

        <WhyAmanati />

        <CtaBanner />
      </main>

      <SiteFooter />
    </div>
  );
}