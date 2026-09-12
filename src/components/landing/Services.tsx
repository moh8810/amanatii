import { useState } from "react";
import {
  Truck,
  ShieldCheck,
  MapPin,
  Route,
  ArrowUpLeft,
  ChevronDown,
} from "lucide-react";

const services = [
  {
    icon: Truck,
    title: "الشحن",
    body: "أرسل شحناتك بسهولة وأمان مع إمكانية متابعة حالتها حتى الوصول.",
    details:
      "من خلال أمانتي يمكنك إنشاء شحنتك وإدخال بيانات المستلم واختيار نقطة الاستلام المناسبة، ثم متابعة حالة الشحنة حتى تصل إلى وجهتها.",
  },
  {
    icon: ShieldCheck,
    title: "الأمانات",
    body: "احفظ أمانتك لك أو لشخص آخر واسترجعها بسهولة عند الحاجة.",
    details:
      "تتيح لك أمانتي حفظ أمانة سواء كانت لك أو لشخص آخر، مع تنظيم بيانات المستلم وحفظ الأمانة بشكل آمن، ليتمكن الشخص المحدد من الحضور واستلام أمانته من إحدى نقاط أمانتي.",
  },
  {
    icon: MapPin,
    title: "نقاط الاستلام",
    body: "نقاط استلام مريحة وآمنة لتسهيل تسليم واستلام شحناتك وأماناتك.",
    details:
      "توفر أمانتي نقاط استلام وتسليم في مواقع مختلفة، لتتمكن من اختيار النقطة الأنسب لك عند إرسال أو استلام شحنتك أو أمانتك.",
  },
  {
    icon: Route,
    title: "التتبع",
    body: "تابع شحنتك أو أمانتك واعرف حالتها وتفاصيلها في أي وقت.",
    details:
      "باستخدام رقم التتبع الخاص بك يمكنك معرفة آخر حالة لشحنتك أو أمانتك ومتابعة مراحلها بسهولة من خلال منصة أمانتي.",
  },
];

export function Services() {
  const [openService, setOpenService] = useState<string | null>(null);

  const toggleService = (title: string) => {
    setOpenService((current) =>
      current === title ? null : title,
    );
  };

  return (
    <section
      id="services"
      className="w-full overflow-hidden py-12 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="mx-auto w-full max-w-2xl text-center">
          <span className="text-sm font-bold text-brand-green">
            خدماتنا
          </span>

          <h2 className="mt-2 break-words text-2xl font-extrabold leading-9 text-primary sm:mt-3 sm:text-4xl sm:leading-tight">
            خدمات أمانتي
          </h2>

          <p className="mt-3 break-words text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base sm:leading-8">
            حلول موثوقة للشحن وحفظ الأمانات في مكان واحد.
          </p>
        </div>

        {/* Services */}
        <div className="mt-8 grid w-full min-w-0 grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {services.map(
            ({
              icon: Icon,
              title,
              body,
              details,
            }) => {
              const isOpen = openService === title;

              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => toggleService(title)}
                  aria-expanded={isOpen}
                  className="group relative flex min-w-0 w-full flex-col overflow-hidden rounded-lg border border-border bg-card p-5 text-right shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-navy/25 hover:shadow-card-hover focus:outline-none focus:ring-2 focus:ring-navy/20 sm:p-7"
                >
                  {/* Icon */}
                  <div className="mb-5 flex justify-end sm:mb-7">
                    <div
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-navy sm:h-14 sm:w-14"
                      style={{ backgroundColor: "#008577" }}
                    >
                      <Icon
                        size={23}
                        strokeWidth={1.8}
                        className="transition-transform duration-300 group-hover:scale-105 sm:size-[25px]"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 break-words text-lg font-extrabold leading-7 text-primary sm:text-xl">
                      {title}
                    </span>

                    <ChevronDown
                      size={19}
                      className={`shrink-0 text-muted-foreground transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {/* Short description */}
                  <p className="mt-4 break-words text-sm leading-7 text-muted-foreground sm:mt-5 sm:leading-8">
                    {body}
                  </p>

                  {/* Expanded explanation */}
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="mt-4 border-t border-border pt-4 sm:mt-5 sm:pt-5">
                        <p className="break-words text-sm leading-7 text-primary/75 sm:leading-8">
                          {details}
                        </p>

                        <div className="mt-4 flex items-start gap-2 text-xs font-bold leading-5 text-brand-green">
                          <ArrowUpLeft
                            size={15}
                            className="mt-0.5 shrink-0 transition-transform duration-300"
                          />

                          <span>
                            اضغط مرة أخرى لإغلاق الشرح
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}