import { Facebook, Instagram, MessageCircle, Music2 } from "lucide-react";
import { Logo } from "./ui";

const columns = [
  { title: "أمانتي", links: ["من نحن", "كيف تعمل", "تواصل معنا"] },
  { title: "الخدمات", links: ["الشحن", "الأمانات", "تتبع الشحنات", "للتاجرات"] },
  { title: "الدعم", links: ["الأسئلة الشائعة", "سياسة الخصوصية", "الشروط والأحكام"] },
];

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-primary">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-primary-foreground/60">
            حلول أبسط للشحن والأمانات داخل اليمن.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Music2, MessageCircle].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="flex size-10 items-center justify-center rounded-xl border border-primary-foreground/15 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10"
              >
                <Icon className="size-4" strokeWidth={1.5} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-bold text-primary-foreground">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((l) => (
                <li key={l}>
                  <a
                    href="#"
                    className="text-sm text-primary-foreground/60 transition-colors hover:text-primary-foreground"
                  >
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-primary-foreground/10 py-6 text-center text-xs text-primary-foreground/50">
        © 2026 أمانتي | AMANATI — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

