import {
  Link,
  useLocation,
} from "@tanstack/react-router";
import { ArrowLeft, Menu, X } from "lucide-react";
import type {
  ComponentType,
  ReactNode,
} from "react";
import { useEffect, useState } from "react";
import { Logo } from "./ui";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  icon: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  to?: string;
  active?: boolean;
  badge?: number;
};

const defaultRoutes: Record<string, string> = {
  "لوحة التحكم": "/dashboard",
  "شحناتي": "/shipments",
  "أماناتي": "/amanat",
  "المحفظة والأرباح": "/wallet",
  "التسويق بالعمولة": "/marketing",
  "الإشعارات": "/notifications",
  "الدعم والمساعدة": "/help",
  "الإعدادات": "/settings",
};

export function DashboardShell({
  title,
  subtitle,
  nav,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const location = useLocation();

  /*
   * عند الانتقال إلى صفحة جديدة:
   * - على الجوال نغلق القائمة.
   * - على الكمبيوتر لا يحدث أي شيء للقائمة الجانبية.
   */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  function getRoute(item: NavItem) {
    return (
      item.to ??
      defaultRoutes[item.label] ??
      "/dashboard"
    );
  }

  function isActive(item: NavItem) {
    const route = getRoute(item);

    if (route === "/dashboard") {
      return location.pathname === "/dashboard";
    }

    return (
      location.pathname === route ||
      location.pathname.startsWith(`${route}/`)
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-background"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-6 lg:flex-row lg:gap-8 lg:px-6 lg:py-10">

        {/* ================================================================ */}
        {/* MOBILE HEADER                                                     */}
        {/* ================================================================ */}

        <div className="mb-4 flex w-full items-center justify-between gap-3 lg:hidden">
          <div className="min-w-0">
            <Logo size="sm" />
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current,
              )
            }
            aria-label={
              mobileMenuOpen
                ? "إغلاق القائمة"
                : "فتح القائمة"
            }
            aria-expanded={mobileMenuOpen}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary shadow-soft transition-all hover:bg-muted active:scale-95"
          >
            {mobileMenuOpen ? (
              <X className="size-5" />
            ) : (
              <Menu className="size-5" />
            )}
          </button>
        </div>

        {/* ================================================================ */}
        {/* MOBILE NAVIGATION                                                 */}
        {/* ================================================================ */}

        {mobileMenuOpen ? (
          <div className="mb-5 w-full lg:hidden">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">

              <nav className="flex w-full flex-col gap-1">
                {nav.map((item) => {
                  const route = getRoute(item);
                  const active = isActive(item);

                  return (
                    <Link
                      key={item.label}
                      to={route}
                      onClick={() =>
                        setMobileMenuOpen(false)
                      }
                      className={cn(
                        "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-primary",
                      )}
                    >
                      <item.icon
                        className="size-4 shrink-0"
                        strokeWidth={1.6}
                      />

                      <span className="min-w-0 flex-1">
                        {item.label}
                      </span>

                      {item.badge !== undefined &&
                        item.badge > 0 ? (
                        <span
                          className={cn(
                            "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none",
                            active
                              ? "bg-primary-foreground text-primary"
                              : "bg-red-500 text-white",
                          )}
                        >
                          {item.badge > 99
                            ? "99+"
                            : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <Link
                to="/"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                <ArrowLeft
                  className="size-4 shrink-0"
                  strokeWidth={1.6}
                />

                <span>العودة للموقع</span>
              </Link>
            </div>
          </div>
        ) : null}

        {/* ================================================================ */}
        {/* DESKTOP SIDEBAR                                                   */}
        {/* ================================================================ */}

        <aside className="relative z-20 hidden w-64 shrink-0 lg:block">
          <div className="sticky top-8 rounded-2xl border border-border bg-card p-4 shadow-soft">

            {/* LOGO */}

            <div className="px-1 pb-4">
              <Logo size="sm" />
            </div>

            {/* NAVIGATION */}

            <nav className="flex w-full flex-col gap-1">
              {nav.map((item) => {
                const route = getRoute(item);
                const active = isActive(item);

                return (
                  <Link
                    key={item.label}
                    to={route}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-primary",
                    )}
                  >
                    <item.icon
                      className="size-4 shrink-0"
                      strokeWidth={1.6}
                    />

                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>

                      {item.badge !== undefined &&
                        item.badge > 0 ? (
                        <span
                          className={cn(
                            "inline-flex min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none",
                            active
                              ? "bg-primary-foreground text-primary"
                              : "bg-red-500 text-white",
                          )}
                        >
                          {item.badge > 99
                            ? "99+"
                            : item.badge}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* العودة للموقع */}

            <Link
              to="/"
              className="mt-4 flex w-full cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              <ArrowLeft
                className="size-4 shrink-0"
                strokeWidth={1.6}
              />

              <span>العودة للموقع</span>
            </Link>
          </div>
        </aside>

        {/* ================================================================ */}
        {/* MAIN                                                              */}
        {/* ================================================================ */}

        <main className="relative z-10 min-w-0 w-full flex-1 lg:mt-0">

          {/* HEADER */}

          <header className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">

            <div className="min-w-0 flex-1">
              <h1 className="break-words text-xl font-extrabold leading-8 text-primary sm:text-3xl sm:leading-tight">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="relative z-[100] flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                {actions}
              </div>
            ) : null}
          </header>

          {/* CONTENT */}

          <div className="relative z-10 mt-6 w-full min-w-0 space-y-6 sm:mt-8 sm:space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}