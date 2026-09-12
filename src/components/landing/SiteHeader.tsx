import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AmanatiLogo } from "./AmanatiLogo";
import { navLinks, actionRoutes } from "./navigation";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("/#")) {
      return;
    }

    event.preventDefault();

    window.location.href =
      window.location.origin + href;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <a
          href="/#home"
          onClick={(event) =>
            handleNavigation(event, "/#home")
          }
          className="flex shrink-0 items-center"
          aria-label="أمانتي"
        >
          <AmanatiLogo className="h-12 w-auto" />
        </a>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) =>
                handleNavigation(event, link.href)
              }
              className="relative text-[0.95rem] font-medium text-muted-foreground transition-colors hover:text-primary after:absolute after:-bottom-1.5 after:right-0 after:h-0.5 after:w-0 after:bg-brand-green after:transition-all hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <a
            href={actionRoutes.login}
            className="rounded-md border border-input px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary"
          >
            تسجيل الدخول
          </a>

          <a
            href={actionRoutes.getStarted}
            className="rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-navy-foreground transition-all hover:bg-navy-deep active:scale-[0.98]"
          >
            ابدأ الآن
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="القائمة"
          aria-expanded={open}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-input text-primary lg:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => {
                  handleNavigation(event, link.href);
                  setOpen(false);
                }}
                className="border-b border-border/60 py-3.5 text-base font-medium text-primary last:border-0"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-4 flex flex-col gap-2.5 pb-4">
              <a
                href={actionRoutes.login}
                onClick={() => setOpen(false)}
                className="rounded-md border border-input px-5 py-3 text-center text-sm font-semibold text-primary"
              >
                تسجيل الدخول
              </a>

              <a
                href={actionRoutes.getStarted}
                onClick={() => setOpen(false)}
                className="rounded-md bg-navy px-5 py-3 text-center text-sm font-semibold text-navy-foreground"
              >
                ابدأ الآن
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}