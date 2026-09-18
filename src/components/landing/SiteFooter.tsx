import { Mail } from "lucide-react";
import {
  SiFacebook,
  SiInstagram,
  SiWhatsapp,
} from "react-icons/si";
import { Logo } from "@/components/amanati/ui";

const columns = [
  {
    title: "روابط سريعة",
    links: [
      { label: "الرئيسية", href: "/#home" },
      { label: "خدماتنا", href: "/#services" },
      { label: "تتبع الشحنة", href: "/#tracking" },
      { label: "كيف تعمل أمانتي", href: "/#how" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "عن أمانتي", href: "/#why" },
      { label: "تواصل معنا", href: "/#contact" },
      { label: "الأسئلة الشائعة", href: "/faq" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "مركز المساعدة", href: "/help" },
      { label: "سياسة الشحن", href: "/shipping-policy" },
      { label: "سياسة الخصوصية", href: "/privacy" },
      { label: "الشروط والأحكام", href: "/terms" },
    ],
  },
];

const socials = [
  {
    icon: SiFacebook,
    label: "فيسبوك",
    href: "https://www.facebook.com/profile.php?id=61593675934934",
    color: "#1877F2",
  },
  {
    icon: SiInstagram,
    label: "إنستغرام",
    href: "https://instagram.com/amanati.yem",
    color: "#E1306C",
  },
  {
    icon: SiWhatsapp,
    label: "واتساب",
    href: "https://wa.me/967784440148",
    color: "#25D366",
  },
  {
    icon: Mail,
    label: "البريد الإلكتروني",
    href: "mailto:example@gmail.com",
    color: "#EA4335",
  },
];

function handleHomeNavigation(
  event: React.MouseEvent<HTMLAnchorElement>,
  href: string,
) {
  if (!href.startsWith("/#")) {
    return;
  }

  event.preventDefault();

  window.location.assign(
    `${window.location.origin}${href}`,
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full overflow-hidden border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:gap-10 sm:px-6 sm:py-14 lg:grid-cols-[1.3fr_repeat(3,1fr)_auto] lg:px-8">
        {/* هوية أمانتي */}
        <div className="min-w-0 text-center lg:text-right">
          <div className="flex justify-center lg:justify-start">
            <Logo size="md" />
          </div>

          <p className="mx-auto mt-3 max-w-64 break-words text-xs leading-6 text-muted-foreground sm:mt-4 sm:text-sm sm:leading-7 lg:mx-0">
            أمانتك أولويتنا، وأمانك وعدنا.
          </p>
        </div>

        {/* الروابط */}
        {columns.map((col) => (
          <nav
            key={col.title}
            className="min-w-0 text-center lg:text-right"
          >
            <h3 className="text-sm font-bold text-primary">
              {col.title}
            </h3>

            <ul className="mt-3 space-y-2.5 sm:mt-4 sm:space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(event) =>
                      handleHomeNavigation(event, link.href)
                    }
                    className="inline-block max-w-full break-words text-xs leading-6 text-muted-foreground transition-colors hover:text-brand-green sm:text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* تابعنا */}
        <div className="min-w-0 text-center lg:text-right">
          <h3 className="text-sm font-bold text-primary">
            تابعنا
          </h3>

          <ul className="mt-3 flex justify-center gap-2 sm:mt-4 lg:justify-start">
            {socials.map(
              ({
                icon: Icon,
                label,
                href,
                color,
              }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="group grid size-9 place-items-center rounded-md border border-border bg-card text-navy transition-all duration-300 hover:-translate-y-1 sm:size-10"
                    style={
                      {
                        "--social-color": color,
                      } as React.CSSProperties
                    }
                  >
                    <Icon
                      size={16}
                      className="transition-colors duration-300 group-hover:text-[var(--social-color)] sm:size-[17px]"
                    />
                  </a>
                </li>
              ),
            )}
          </ul>

          <p className="mx-auto mt-3 max-w-52 break-words text-xs leading-6 text-muted-foreground sm:mt-4 lg:mx-0">
            تابع أمانتي وتواصل معنا عبر قنواتنا الرسمية.
          </p>
        </div>
      </div>

      {/* حقوق النشر */}
      <div className="border-t border-border/70 py-4 sm:py-5">
        <p className="mx-auto w-full max-w-7xl px-4 text-center text-[11px] leading-5 text-muted-foreground sm:px-6 sm:text-xs lg:px-8 lg:text-right">
          © 2026 AMANATI. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
