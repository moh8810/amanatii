import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo, buttonClass } from "./ui";

const nav = [
  { label: "الرئيسية", to: "/" as const, hash: "top" },
  { label: "تتبع شحنتك", to: "/" as const, hash: "track" },
  { label: "الشحن", to: "/" as const, hash: "services" },
  { label: "الأمانات", to: "/" as const, hash: "amanat" },
  { label: "للتاجرات", to: "/" as const, hash: "merchants" },
  { label: "كيف تعمل؟", to: "/" as const, hash: "how" },
  { label: "تواصل معنا", to: "/" as const, hash: "contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto grid h-20 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5">
        <Logo />

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-6 xl:flex">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link to="/login" className={`${buttonClass("ghost", "sm")} hidden sm:inline-flex`}>
            تسجيل الدخول
          </Link>
          <Link to="/shipments/new" className={`${buttonClass("primary", "sm")} hidden sm:inline-flex`}>
            ابدأ الآن
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary xl:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background xl:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 sm:hidden">
              <Link to="/login" className={buttonClass("outline", "md")} onClick={() => setOpen(false)}>
                تسجيل الدخول
              </Link>
              <Link
                to="/shipments/new"
                className={buttonClass("primary", "md")}
                onClick={() => setOpen(false)}
              >
                ابدأ الآن
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

