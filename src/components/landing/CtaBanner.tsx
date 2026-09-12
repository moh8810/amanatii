import type { CSSProperties } from "react";
import {
  ArrowUpLeft,
  Clock3,
  MapPin,
  Phone,
} from "lucide-react";
import {
  SiFacebook,
  SiGmail,
  SiInstagram,
  SiWhatsapp,
} from "react-icons/si";
import { actionRoutes } from "./navigation";

const contactItems = [
  {
    icon: Phone,
    title: "الهاتف",
    value: "+967 784 440 148",
    href: "tel:+967784440148",
    color: "#1877F2",
    iconType: "phone",
  },
  {
    icon: SiGmail,
    title: "البريد الإلكتروني",
    value: "example@gmail.com",
    href: "mailto:example@gmail.com",
    color: "#EA4335",
    iconType: "gmail",
  },
  {
    icon: SiInstagram,
    title: "إنستغرام",
    value: "@amanati.yem",
    href: "https://instagram.com/amanati.yem",
    color: "#E1306C",
    iconType: "instagram",
  },
  {
    icon: SiFacebook,
    title: "فيسبوك",
    value: "صفحة أمانتي",
    href: "https://www.facebook.com/profile.php?id=61593675934934",
    color: "#1877F2",
    iconType: "facebook",
  },
];

export function CtaBanner() {
  return (
    <section
      id="contact"
      className="w-full overflow-hidden pb-12 sm:pb-14 lg:pb-20"
    >
      <style>{`
        @keyframes amanati-contact-fade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .amanati-contact-card {
          animation: amanati-contact-fade 500ms ease both;
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            border-color 280ms ease,
            background-color 280ms ease,
            box-shadow 280ms ease;
        }

        .amanati-contact-card:hover {
          transform: translateY(-4px);
          border-color: var(--contact-color);
          background-color: rgba(255,255,255,.055);
          box-shadow:
            0 10px 28px rgba(0,0,0,.10),
            0 0 0 1px color-mix(in srgb, var(--contact-color) 20%, transparent);
        }

        .amanati-contact-icon {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            box-shadow 280ms ease;
        }

        .amanati-contact-card:hover .amanati-contact-icon {
          transform: scale(1.08);
        }

        .amanati-contact-arrow {
          transition:
            transform 280ms ease,
            opacity 280ms ease;
        }

        .amanati-contact-card:hover .amanati-contact-arrow {
          transform: translate(-2px, -2px);
          opacity: 1;
        }

        .amanati-whatsapp {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            border-color 280ms ease,
            background-color 280ms ease,
            box-shadow 280ms ease;
        }

        .amanati-whatsapp:hover {
          transform: translateY(-3px);
          border-color: rgba(37,211,102,.65);
          background-color: rgba(37,211,102,.09);
          box-shadow:
            0 14px 35px rgba(37,211,102,.10),
            0 0 0 1px rgba(37,211,102,.12);
        }

        .amanati-whatsapp-icon {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            box-shadow 280ms ease;
        }

        .amanati-whatsapp:hover .amanati-whatsapp-icon {
          transform: scale(1.07);
          box-shadow:
            0 0 0 6px rgba(37,211,102,.10),
            0 8px 22px rgba(37,211,102,.20);
        }

        .amanati-brand-icon {
          transition:
            transform 280ms cubic-bezier(.22,1,.36,1),
            box-shadow 280ms ease;
        }

        .amanati-contact-card:hover .amanati-brand-icon {
          transform: scale(1.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-contact-card,
          .amanati-contact-icon,
          .amanati-contact-arrow,
          .amanati-whatsapp,
          .amanati-whatsapp-icon,
          .amanati-brand-icon {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="relative w-full min-w-0 overflow-hidden rounded-2xl bg-navy-deep">
          {/* الخلفية */}
          <div
            className="pointer-events-none absolute inset-0 grid-tech opacity-30"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-brand-green/10 blur-3xl"
            aria-hidden
          />

          <div
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/[0.03] blur-3xl"
            aria-hidden
          />

          <div className="relative min-w-0 p-4 sm:p-8 lg:p-10">
            {/* العنوان */}
            <div className="mx-auto w-full max-w-2xl text-center">
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-green/20 bg-brand-green/[0.07] px-3 py-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
                  aria-hidden
                />

                <span className="text-xs font-bold text-brand-green">
                  تواصل معنا
                </span>
              </div>

              <h2 className="mt-4 break-words text-2xl font-extrabold leading-8 text-navy-foreground sm:text-3xl sm:leading-tight">
                نحن هنا لخدمتك
              </h2>

              <p className="mx-auto mt-3 max-w-xl break-words text-xs leading-6 text-navy-foreground/60 sm:text-sm sm:leading-7">
                لديك استفسار أو تحتاج إلى مساعدة؟ تواصل معنا عبر الوسيلة
                المناسبة لك وسنكون سعداء بخدمتك.
              </p>
            </div>

            {/* واتساب الرئيسي */}
            <a
              href="https://wa.me/967784440148"
              target="_blank"
              rel="noreferrer"
              className="amanati-whatsapp group mx-auto mt-6 block w-full max-w-3xl rounded-xl border border-[#25D366]/25 bg-[#25D366]/[0.055] p-3.5 sm:mt-7 sm:p-5"
            >
              <div className="flex min-w-0 items-center justify-between gap-2.5 sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-3.5">
                  <div className="amanati-whatsapp-icon grid size-11 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white sm:size-14">
                    <SiWhatsapp
                      size={23}
                      aria-hidden
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-xs font-extrabold leading-5 text-navy-foreground sm:text-base sm:leading-normal">
                      تواصل معنا عبر واتساب
                    </h3>

                    <p
                      dir="ltr"
                      className="mt-0.5 truncate text-xs font-semibold text-navy-foreground/65 sm:mt-1 sm:text-sm"
                    >
                      +967 784 440 148
                    </p>

                    <p className="mt-0.5 break-words text-[10px] leading-5 text-navy-foreground/40 sm:text-[11px]">
                      اضغط لفتح المحادثة مباشرة
                    </p>
                  </div>
                </div>

                <div className="grid size-8 shrink-0 place-items-center rounded-full border border-[#25D366]/30 text-[#25D366] transition-all duration-300 group-hover:bg-[#25D366] group-hover:text-white sm:size-9">
                  <ArrowUpLeft
                    size={16}
                    className="amanati-contact-arrow"
                  />
                </div>
              </div>
            </a>

            {/* وسائل التواصل */}
            <div className="mx-auto mt-3 grid w-full max-w-5xl min-w-0 gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
              {contactItems.map(
                ({
                  icon: Icon,
                  title,
                  value,
                  href,
                  color,
                  iconType,
                }) => (
                  <a
                    key={title}
                    href={href}
                    target={
                      href.startsWith("https://")
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      href.startsWith("https://")
                        ? "noreferrer"
                        : undefined
                    }
                    className="amanati-contact-card group block min-w-0 w-full rounded-xl border border-navy-foreground/10 bg-white/[0.035] p-3.5 text-right sm:p-4"
                    style={
                      {
                        "--contact-color": color,
                      } as CSSProperties
                    }
                  >
                    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                      {/* الأيقونة / الشعار */}
                      {iconType === "instagram" ? (
                        <div
                          className="amanati-brand-icon grid size-9 shrink-0 place-items-center rounded-lg text-white shadow-sm sm:size-10"
                          style={{
                            background:
                              "linear-gradient(135deg, #833AB4 0%, #C13584 35%, #E1306C 65%, #F77737 82%, #FCAF45 100%)",
                          }}
                        >
                          <SiInstagram
                            size={20}
                            aria-hidden
                          />
                        </div>
                      ) : iconType === "facebook" ? (
                        <div className="amanati-brand-icon grid size-9 shrink-0 place-items-center rounded-lg bg-[#1877F2] text-white shadow-sm sm:size-10">
                          <SiFacebook
                            size={20}
                            aria-hidden
                          />
                        </div>
                      ) : iconType === "gmail" ? (
                        <div className="amanati-brand-icon grid size-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm sm:size-10">
                          <SiGmail
                            size={20}
                            color="#EA4335"
                            aria-hidden
                          />
                        </div>
                      ) : (
                        <div className="amanati-brand-icon grid size-9 shrink-0 place-items-center rounded-lg bg-[#1877F2] text-white shadow-sm sm:size-10">
                          <Icon
                            size={19}
                            strokeWidth={2}
                            aria-hidden
                          />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-[11px] font-extrabold leading-5 text-navy-foreground sm:text-xs">
                          {title}
                        </h3>

                        <p
                          dir={
                            title === "الهاتف"
                              ? "ltr"
                              : undefined
                          }
                          className="mt-0.5 truncate text-[10px] leading-5 text-navy-foreground/55 transition-colors group-hover:text-navy-foreground/80 sm:text-xs"
                        >
                          {value}
                        </p>
                      </div>

                      <ArrowUpLeft
                        size={15}
                        className="amanati-contact-arrow shrink-0 opacity-40"
                        style={{
                          color: "var(--contact-color)",
                        }}
                      />
                    </div>

                    {/* خط بلون الشعار عند Hover */}
                    <div
                      className="mt-2.5 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-full sm:mt-3"
                      style={{
                        backgroundColor: color,
                      }}
                    />
                  </a>
                ),
              )}
            </div>

            {/* أوقات العمل + خدمة العملاء */}
            <div className="mx-auto mt-3 grid w-full max-w-5xl min-w-0 gap-2.5 sm:mt-4 sm:grid-cols-2 sm:gap-3">
              <div className="min-w-0 rounded-xl border border-navy-foreground/10 bg-white/[0.035] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#008577]/50 hover:bg-white/[0.05] sm:p-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#008577] text-white shadow-sm sm:size-10">
                    <Clock3 size={18} strokeWidth={2} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[11px] font-extrabold leading-5 text-navy-foreground sm:text-xs">
                      أوقات العمل
                    </h3>

                    <p className="mt-0.5 break-words text-[10px] leading-5 text-navy-foreground/55 sm:text-xs">
                      يوميًا من 8:00 صباحًا إلى 6:30 مساءً
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 rounded-xl border border-navy-foreground/10 bg-white/[0.035] p-3.5 transition-all duration-300 hover:-translate-y-1 hover:border-[#008577]/50 hover:bg-white/[0.05] sm:p-4">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#008577] text-white shadow-sm sm:size-10">
                    <MapPin size={18} strokeWidth={2} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-[11px] font-extrabold leading-5 text-navy-foreground sm:text-xs">
                      خدمة العملاء
                    </h3>

                    <p className="mt-0.5 break-words text-[10px] leading-5 text-navy-foreground/55 sm:text-xs">
                      فريق أمانتي جاهز لمساعدتك والإجابة عن استفساراتك.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* الأزرار */}
            <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-2.5 sm:mt-7 sm:flex-row sm:items-center">
              <a
                href="https://wa.me/967784440148"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-[#25D366]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#20bd5b] active:scale-[0.98] sm:w-auto sm:text-sm"
              >
                <SiWhatsapp size={17} />
                تواصل عبر واتساب
              </a>

              <a
                href={actionRoutes.getStarted}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-navy-foreground/20 px-5 py-3 text-xs font-extrabold text-navy-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-green/50 hover:bg-white/[0.04] active:scale-[0.98] sm:w-auto sm:text-sm"
              >
                إنشاء حساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
