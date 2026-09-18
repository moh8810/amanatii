import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "ما هي أمانتي؟",
    answer:
      "أمانتي منصة تجمع خدمات الشحن وحفظ الأمانات في مكان واحد، لتسهيل إرسال الشحنات وحفظ الأمانات ومتابعتها واستلامها بطريقة منظمة وواضحة.",
  },
  {
    question: "كيف يمكنني إرسال شحنة؟",
    answer:
      "يمكنك إنشاء حساب ثم اختيار خدمة إرسال شحنة وإدخال بيانات المستلم وبيانات الشحنة واختيار نقطة الاستلام المناسبة. بعد إنشاء الطلب يمكنك متابعة حالة الشحنة من حسابك.",
  },
  {
    question: "كيف يمكنني حفظ أمانة؟",
    answer:
      "من حسابك اختر خدمة حفظ أمانة، ثم أدخل بيانات الأمانة والمستلم واختر نقطة الاستلام المناسبة. بعد حفظ الأمانة يمكنك متابعة حالتها حتى تصبح جاهزة للاستلام.",
  },
  {
    question: "كيف أتتبع شحنتي؟",
    answer:
      "استخدم رقم التتبع الخاص بشحنتك في قسم تتبع الشحنة على الصفحة الرئيسية لمعرفة آخر حالة مسجلة للشحنة ومتابعة مراحلها.",
  },
  {
    question: "أين أستلم شحنتي أو أمانتي؟",
    answer:
      "يتم الاستلام من نقطة الاستلام المحددة في طلبك. تظهر نقطة الاستلام ضمن تفاصيل الطلب، ويتم تحديث الحالة عند وصول الشحنة أو الأمانة لتصبح جاهزة للاستلام.",
  },
  {
    question: "متى يتم تحديد سعر الشحن؟",
    answer:
      "يتم تحديد سعر الشحن من خلال إدارة أمانتي بعد مراجعة بيانات الشحنة. يظهر السعر في تفاصيل الشحنة عندما يتم تسعير الطلب.",
  },
  {
    question: "كيف أعرف أن شحنتي أصبحت جاهزة للاستلام؟",
    answer:
      "ستتغير حالة الشحنة إلى «جاهزة للاستلام» عند وصولها إلى نقطة الاستلام، كما يصلك إشعار عند تغير حالة الشحنة.",
  },
  {
    question: "هل يمكنني التواصل مع أمانتي إذا واجهت مشكلة؟",
    answer:
      "نعم، يمكنك التواصل مع فريق أمانتي عبر واتساب أو الهاتف أو البريد الإلكتروني أو حساباتنا على وسائل التواصل الاجتماعي. ستجد جميع وسائل التواصل في قسم «تواصل معنا».",
  },
];

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex((current) =>
      current === index ? null : index,
    );
  };

  return (
    <section id="faq" className="py-16 lg:py-20">
      <style>{`
        @keyframes amanati-faq-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .amanati-faq-item {
          animation: amanati-faq-enter 450ms ease both;
          transition:
            border-color 280ms ease,
            background-color 280ms ease,
            box-shadow 280ms ease,
            transform 280ms ease;
        }

        .amanati-faq-item:hover {
          border-color: rgba(0,133,119,.25);
        }

        .amanati-faq-item.is-open {
          border-color: rgba(0,133,119,.38);
          background-color: rgba(0,133,119,.025);
          box-shadow: 0 10px 28px rgba(8,34,58,.06);
        }

        .amanati-faq-button {
          transition: color 200ms ease;
        }

        .amanati-faq-item:hover .amanati-faq-button,
        .amanati-faq-item.is-open .amanati-faq-button {
          color: #008577;
        }

        .amanati-faq-icon {
          transition:
            transform 300ms cubic-bezier(.22,1,.36,1),
            background-color 300ms ease,
            color 300ms ease;
        }

        .amanati-faq-item:hover .amanati-faq-icon {
          transform: scale(1.06);
        }

        .amanati-faq-item.is-open .amanati-faq-icon {
          background-color: #008577;
          color: white;
        }

        .amanati-faq-arrow {
          transition:
            transform 300ms ease,
            background-color 300ms ease,
            color 300ms ease;
        }

        .amanati-faq-item.is-open .amanati-faq-arrow {
          transform: rotate(180deg);
          background-color: rgba(0,133,119,.08);
          color: #008577;
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-faq-item,
          .amanati-faq-icon,
          .amanati-faq-arrow {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
            <HelpCircle
              size={15}
              className="text-brand-green"
            />

            <span className="text-xs font-bold text-brand-green">
              الأسئلة الشائعة
            </span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold text-primary sm:text-4xl">
            هل لديك استفسار؟
          </h2>

          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            جمعنا لك أهم الأسئلة التي قد تحتاج إلى معرفة إجابتها.
          </p>
        </header>

        {/* الأسئلة */}
        <div className="mt-10 space-y-3">
          {faqs.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={question}
                className={`amanati-faq-item overflow-hidden rounded-xl border border-border bg-card ${
                  isOpen ? "is-open" : ""
                }`}
                style={{
                  animationDelay: `${index * 55}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 p-4 text-right sm:p-5"
                >
                  <span className="amanati-faq-icon grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-navy">
                    <HelpCircle
                      size={19}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span className="amanati-faq-button min-w-0 flex-1 text-sm font-bold text-primary sm:text-base">
                    {question}
                  </span>

                  <span className="amanati-faq-arrow grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                    <ChevronDown size={18} />
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-border px-5 pb-5 pt-4 pr-[4.5rem]">
                      <p className="text-sm leading-8 text-muted-foreground">
                        {answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* أسفل القسم */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            لم تجد إجابة سؤالك؟
          </p>

          <a
            href="#contact"
            className="mt-2 inline-flex text-sm font-bold text-brand-green transition-colors hover:text-navy"
          >
            تواصل معنا مباشرة
          </a>
        </div>
      </div>
    </section>
  );
}
