import { useState } from "react";
import {
  Lock,
  Eye,
  Store,
  MousePointerClick,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";

const reasons = [
  {
    icon: Lock,
    title: "الأمان أولاً",
    body: "إجراءات دقيقة لحماية شحناتك وأماناتك في كل مرحلة.",
    details: [
      "حماية بيانات الشحنات والأمانات.",
      "تنظيم عمليات التسليم والاستلام.",
      "متابعة حالة الطلب في كل مرحلة.",
      "إجراءات واضحة للحفاظ على الأمان.",
    ],
  },
  {
    icon: Eye,
    title: "تتبع واضح",
    body: "حالة محدثة وتفاصيل مفهومة بدون تعقيد.",
    details: [
      "استخدم رقم التتبع لمعرفة حالة طلبك.",
      "معلومات واضحة وسهلة القراءة.",
      "متابعة مراحل الشحنة أو الأمانة.",
      "الوصول إلى آخر حالة في أي وقت.",
    ],
  },
  {
    icon: Store,
    title: "نقاط استلام موثوقة",
    body: "شبكة نقاط منتقاة بعناية وقريبة منك.",
    details: [
      "اختيار نقطة استلام مناسبة لك.",
      "نقاط منظمة لتسهيل التسليم والاستلام.",
      "معلومات النقطة تظهر بوضوح عند توفرها.",
      "إدارة النقاط تتم مركزيًا من أمانتي.",
    ],
  },
  {
    icon: MousePointerClick,
    title: "تجربة بسيطة",
    body: "واجهة عربية سهلة تنجز طلبك في خطوات قليلة.",
    details: [
      "واجهة عربية واضحة وسهلة الاستخدام.",
      "خطوات مختصرة لإنشاء الطلب.",
      "تصميم مناسب للجوال والكمبيوتر.",
      "كل ما تحتاجه في مكان واحد.",
    ],
  },
  {
    icon: Layers,
    title: "الشحن والأمانات في منصة واحدة",
    body: "خدمتان متكاملتان بحساب واحد وإدارة موحدة.",
    details: [
      "إدارة الشحنات والأمانات من حساب واحد.",
      "متابعة طلباتك من مكان واحد.",
      "تجربة موحدة بدل استخدام عدة خدمات.",
      "منصة واحدة لإدارة احتياجاتك بسهولة.",
    ],
  },
];

export function WhyAmanati() {
  const [openReason, setOpenReason] = useState<string | null>(null);

  const toggleReason = (title: string) => {
    setOpenReason((current) =>
      current === title ? null : title,
    );
  };

  return (
    <section
      id="why"
      className="w-full overflow-hidden pb-12 sm:pb-16 lg:pb-24"
    >
      <style>{`
        @keyframes amanati-why-glow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 133, 119, 0);
          }

          50% {
            box-shadow: 0 0 0 7px rgba(0, 133, 119, 0.08);
          }
        }

        @keyframes amanati-why-check {
          from {
            opacity: 0;
            transform: scale(0.7);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .amanati-why-card {
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 300ms ease,
            border-color 300ms ease,
            background-color 300ms ease;
        }

        .amanati-why-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 32px rgba(8, 34, 58, 0.08);
        }

        .amanati-why-card.is-open {
          border-color: rgba(0, 133, 119, 0.35);
          background-color: rgba(0, 133, 119, 0.025);
        }

        .amanati-why-icon {
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 300ms ease;
        }

        .amanati-why-card:hover .amanati-why-icon {
          transform: scale(1.07);
          box-shadow: 0 0 0 7px rgba(0, 133, 119, 0.08);
        }

        .amanati-why-card.is-open .amanati-why-icon {
          animation: amanati-why-glow 1.8s ease-in-out infinite;
        }

        .amanati-why-arrow {
          transition:
            transform 300ms ease,
            background-color 300ms ease,
            color 300ms ease;
        }

        .amanati-why-card:hover .amanati-why-arrow {
          border-color: rgba(0, 133, 119, 0.35);
          color: #008577;
        }

        .amanati-why-card.is-open .amanati-why-arrow {
          transform: rotate(180deg);
          background-color: rgba(0, 133, 119, 0.08);
          color: #008577;
        }

        .amanati-why-check {
          animation: amanati-why-check 300ms ease both;
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-why-card,
          .amanati-why-icon,
          .amanati-why-arrow {
            transition: none !important;
          }

          .amanati-why-card.is-open .amanati-why-icon {
            animation: none !important;
          }

          .amanati-why-check {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section heading */}
        <header className="w-full text-center">
          <span className="text-sm font-bold text-brand-green">
            لماذا أمانتي؟
          </span>

          <h2 className="mt-3 break-words text-2xl font-extrabold leading-8 text-primary sm:text-4xl sm:leading-tight">
            لماذا أمانتي؟
          </h2>

          <span
            className="mx-auto mt-4 block h-0.5 w-14 bg-brand-green"
            aria-hidden
          />

          <p className="mx-auto mt-4 max-w-2xl break-words text-xs leading-6 text-muted-foreground sm:text-base sm:leading-7">
            لأننا نجمع بين الأمان، السهولة، والموثوقية في مكان واحد.
          </p>
        </header>

        {/* Reasons */}
        <div className="mt-8 grid w-full min-w-0 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {reasons.map(
            ({
              icon: Icon,
              title,
              body,
              details,
            }) => {
              const isOpen = openReason === title;

              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => toggleReason(title)}
                  aria-expanded={isOpen}
                  className={`amanati-why-card group relative block min-w-0 w-full overflow-hidden rounded-xl border border-border bg-card p-4 text-right focus:outline-none focus:ring-2 focus:ring-navy/20 sm:p-6 ${
                    isOpen ? "is-open" : ""
                  }`}
                >
                  {/* Top accent */}
                  <span
                    className={`absolute inset-x-0 top-0 h-0.5 bg-brand-green transition-transform duration-300 ${
                      isOpen
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                    aria-hidden
                  />

                  {/* Header */}
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    {/* Green icon */}
                    <span className="amanati-why-icon grid size-12 shrink-0 place-items-center rounded-full bg-[#008577] text-navy sm:size-14">
                      <Icon
                        size={21}
                        strokeWidth={1.7}
                        className="sm:hidden"
                      />

                      <Icon
                        size={23}
                        strokeWidth={1.7}
                        className="hidden sm:block"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-bold leading-6 text-primary sm:text-lg sm:leading-normal">
                        {title}
                      </h3>

                      <p className="mt-1.5 break-words text-xs leading-6 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-7">
                        {body}
                      </p>
                    </div>

                    {/* Arrow */}
                    <span
                      className="amanati-why-arrow grid size-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground sm:size-9"
                      aria-hidden
                    >
                      <ChevronDown size={16} />
                    </span>
                  </div>

                  {/* Expanded explanation */}
                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen
                        ? "mt-4 grid-rows-[1fr] opacity-100 sm:mt-5"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="border-t border-border pt-4 sm:pt-5">
                        <div className="space-y-2.5 sm:space-y-3">
                          {details.map((detail) => (
                            <div
                              key={detail}
                              className="flex min-w-0 items-start gap-2 text-xs leading-6 text-primary/75 sm:gap-2.5 sm:text-sm"
                            >
                              <span className="amanati-why-check mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-green text-navy">
                                <Check
                                  size={11}
                                  strokeWidth={2.5}
                                />
                              </span>

                              <span className="min-w-0 break-words">
                                {detail}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 text-[11px] font-bold text-brand-green sm:mt-5 sm:text-xs">
                          اضغط مرة أخرى لإغلاق الشرح
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>

        {/* Closing statement */}
        <div className="mt-8 flex w-full items-center justify-center gap-3 sm:mt-12 sm:gap-4">
          <span
            className="hidden h-px w-16 bg-border sm:block"
            aria-hidden
          />

          <p className="break-words text-center text-xs font-bold leading-6 text-primary sm:text-base">
            أمان أكثر .. راحة أكبر .. مع أمانتي
          </p>

          <span
            className="hidden h-px w-16 bg-border sm:block"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
