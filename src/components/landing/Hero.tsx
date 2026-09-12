import {
  ShieldCheck,
  Truck,
  Sparkles,
  Package,
  MapPin,
  LockKeyhole,
} from "lucide-react";
import heroTruck from "@/assets/hero-truck.jpg";
import { actionRoutes } from "./navigation";

const badges = [
  { icon: ShieldCheck, label: "آمن وموثوق" },
  { icon: Truck, label: "توصيل سريع" },
  { icon: Sparkles, label: "بسيط وسهل" },
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-navy-deep pb-16 pt-10 sm:pb-40 sm:pt-20 lg:pb-56"
    >
      {/* Futuristic logistics backdrop */}
      <div
        className="pointer-events-none absolute inset-0 grid-tech opacity-60"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 glow-route"
        aria-hidden
      />

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
        viewBox="0 0 1200 600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M40 480 C 300 380, 520 520, 780 300 S 1080 180, 1180 120"
          fill="none"
          stroke="oklch(0.72 0.12 230 / 0.5)"
          strokeWidth="1.5"
          className="route-dash"
        />
      </svg>

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {[18, 42, 66].map((top, i) => (
          <span
            key={top}
            className="trail-line absolute h-px w-40 bg-gradient-to-l from-transparent via-sky-400/70 to-transparent"
            style={{
              top: `${top}%`,
              right: "-10%",
              animationDelay: `${i * 1.6}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
        {/* Text content */}
        <div className="min-w-0 w-full text-right">
          <h1 className="break-words text-[2.05rem] font-extrabold leading-[1.35] text-navy-foreground sm:text-5xl sm:leading-[1.25] lg:text-[3.5rem]">
            مع أمانتي، شحنتك
            <br />
            <span className="text-brand-green">
              وأمانتك في أمان...
            </span>
          </h1>

          <p className="mt-5 w-full max-w-xl break-words text-sm leading-7 text-navy-foreground/75 sm:mt-6 sm:text-lg sm:leading-8">
            أمانتي تجمع لك خدمات الشحن وحفظ الأمانات في منصة واحدة، بسيطة،
            موثوقة وآمنة.
          </p>

          {/* Main actions */}
          <div className="mt-7 grid w-full grid-cols-1 gap-3 sm:mt-9 sm:flex sm:flex-wrap">
            {/* إرسال شحنة */}
            <a
              href={actionRoutes.sendShipment}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-background px-5 py-3.5 text-sm font-bold text-primary shadow-panel transition-all hover:bg-secondary active:scale-[0.98] sm:w-auto sm:px-6"
            >
              إرسال شحنة
              <Package size={18} />
            </a>

            {/* حفظ أمانة */}
            <a
              href="/amanat/new"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-background px-5 py-3.5 text-sm font-bold text-primary shadow-panel transition-all hover:bg-secondary active:scale-[0.98] sm:w-auto sm:px-6"
            >
              حفظ أمانة
              <LockKeyhole size={18} />
            </a>

            {/* تتبع شحنتك */}
            <a
              href={actionRoutes.trackShipment}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md border border-navy-foreground/25 px-5 py-3.5 text-sm font-bold text-navy-foreground transition-all hover:border-brand-green/60 hover:bg-navy-foreground/5 active:scale-[0.98] sm:w-auto sm:px-6"
            >
              تتبع شحنتك
              <MapPin size={18} />
            </a>
          </div>

          {/* Trust badges */}
          <ul className="mt-7 flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:mt-9 sm:justify-start sm:gap-x-7 sm:gap-y-3">
            {badges.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex shrink-0 items-center gap-2 text-xs text-navy-foreground/85 sm:text-sm"
              >
                <Icon
                  size={16}
                  className="shrink-0 text-brand-green sm:size-[17px]"
                />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Truck visual */}
        <div className="relative mx-auto w-full max-w-2xl min-w-0">
          <img
            src={heroTruck}
            alt="شاحنة توصيل حديثة تنطلق عبر شبكة لوجستية رقمية"
            width={1280}
            height={912}
            className="block h-auto w-full rounded-xl object-cover mix-blend-screen"
          />

          <span
            className="pin-pulse absolute right-[12%] top-[14%] h-2.5 w-2.5 rounded-full bg-brand-green sm:h-3 sm:w-3"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}