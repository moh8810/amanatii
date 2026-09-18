import {
  FileText,
  HelpCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

const sections = [
  {
    id: "help",
    icon: HelpCircle,
    label: "الدعم",
    title: "مركز المساعدة",
    description:
      "نساعدك في معرفة طريقة استخدام خدمات أمانتي والوصول إلى الإجابات التي تحتاجها.",
    items: [
      "يمكنك إنشاء شحنة من خلال حسابك وإدخال بيانات المستلم واختيار نقطة الاستلام المناسبة.",
      "يمكنك حفظ أمانة وتحديد بيانات الشخص الذي سيقوم باستلامها.",
      "يمكنك استخدام رقم التتبع لمعرفة آخر حالة مسجلة لطلبك.",
      "إذا احتجت إلى مساعدة إضافية، يمكنك التواصل معنا مباشرة من قسم تواصل معنا.",
    ],
  },
  {
    id: "shipping-policy",
    icon: ShieldCheck,
    label: "الخدمات",
    title: "سياسة الشحن",
    description:
      "معلومات عامة حول آلية إرسال الشحنات ومتابعتها عبر أمانتي.",
    items: [
      "يتم إنشاء طلب الشحن من خلال منصة أمانتي وإدخال بيانات الشحنة والمستلم.",
      "يتم تحديد نقطة الاستلام المناسبة وفق الخيارات المتاحة في المنصة.",
      "يتم تحديد رسوم الشحن من خلال إدارة أمانتي بعد مراجعة بيانات الطلب.",
      "يمكن للعميل متابعة حالة الشحنة باستخدام رقم التتبع الخاص بها.",
      "عند تغير حالة الشحنة، تظهر الحالة الجديدة في حساب العميل ويتم إرسال إشعار عند توفره.",
    ],
  },
  {
    id: "privacy",
    icon: LockKeyhole,
    label: "الخصوصية",
    title: "سياسة الخصوصية",
    description:
      "نحرص على التعامل مع بياناتك بطريقة مسؤولة واستخدامها لتقديم خدمات أمانتي.",
    items: [
      "تُستخدم البيانات التي تقدمها عند إنشاء الحساب والطلبات لتشغيل خدمات أمانتي.",
      "يتم التعامل مع بيانات الشحن والمستلمين ضمن نطاق تنفيذ الطلب وإدارته.",
      "يجب على المستخدم المحافظة على بيانات تسجيل الدخول الخاصة بحسابه.",
      "سيتم تحديث سياسة الخصوصية بشكل رسمي عند اعتماد السياسة النهائية للمنصة.",
    ],
  },
  {
    id: "terms",
    icon: FileText,
    label: "القواعد",
    title: "الشروط والأحكام",
    description:
      "قواعد استخدام منصة أمانتي وخدماتها.",
    items: [
      "باستخدام منصة أمانتي، يلتزم المستخدم بتقديم بيانات صحيحة عند إنشاء الحساب والطلبات.",
      "يتحمل المستخدم مسؤولية صحة بيانات المرسل والمستلم التي يدخلها في الطلب.",
      "يجب استخدام خدمات أمانتي للأغراض المشروعة والالتزام بالأنظمة واللوائح المعمول بها.",
      "تحتفظ أمانتي بحق تحديث هذه الشروط عند اعتماد النسخة النهائية للمنصة.",
    ],
  },
];

export function SupportSections() {
  return (
    <section className="pb-16 lg:pb-20">
      <style>{`
        .amanati-support-card {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            border-color 280ms ease,
            box-shadow 280ms ease,
            background-color 280ms ease;
        }

        .amanati-support-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0,133,119,.28);
          box-shadow: 0 12px 30px rgba(8,34,58,.06);
        }

        .amanati-support-icon {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            box-shadow 280ms ease;
        }

        .amanati-support-card:hover .amanati-support-icon {
          transform: scale(1.07);
          box-shadow: 0 0 0 6px rgba(0,133,119,.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-support-card,
          .amanati-support-icon {
            transition: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold text-brand-green">
            الدعم والمعلومات
          </span>

          <h2 className="mt-3 text-3xl font-extrabold text-primary sm:text-4xl">
            كل ما تحتاج معرفته
          </h2>

          <p className="mt-4 text-sm leading-8 text-muted-foreground sm:text-base">
            تعرف على طريقة استخدام خدمات أمانتي والمعلومات الأساسية
            المتعلقة بالمنصة.
          </p>
        </div>

        {/* الأقسام */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {sections.map(
            ({
              id,
              icon: Icon,
              label,
              title,
              description,
              items,
            }) => (
              <article
                key={id}
                id={id}
                className="amanati-support-card scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <div className="amanati-support-icon grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#008577] text-white">
                    <Icon size={22} strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0">
                    <span className="text-xs font-bold text-brand-green">
                      {label}
                    </span>

                    <h3 className="mt-1 text-xl font-extrabold text-primary">
                      {title}
                    </h3>

                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-5">
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-sm leading-7 text-primary/75"
                      >
                        <span
                          className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                          aria-hidden
                        />

                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
