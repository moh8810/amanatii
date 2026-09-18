import {
  ClipboardList,
  PackageOpen,
  Radar,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "أنشئ طلبك",
    body: "أرسل بيانات شحنتك أو أمانتك خلال دقائق.",
  },
  {
    icon: PackageOpen,
    title: "نستلمها",
    body: "نتولى استلامها وتجهيزها بعناية.",
  },
  {
    icon: Radar,
    title: "نتابعها",
    body: "تابع حالتها خطوة بخطوة.",
  },
  {
    icon: ShieldCheck,
    title: "تصل بأمان",
    body: "يتم التسليم أو الاستلام بأمان.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how"
      className="w-full overflow-hidden bg-secondary/50 py-12 sm:py-16 lg:py-24"
    >
      <style>{`
        @keyframes amanati-progress {
          0% {
            transform: translateX(0%);
            opacity: 0;
          }

          8% {
            opacity: 1;
          }

          92% {
            opacity: 1;
          }

          100% {
            transform: translateX(-100%);
            opacity: 0;
          }
        }

        @keyframes amanati-soft-pulse {
          0%,
          100% {
            box-shadow:
              0 0 0 8px rgba(0, 0, 0, 0),
              0 0 0 0 rgba(0, 133, 119, 0);
          }

          50% {
            box-shadow:
              0 0 0 8px rgba(0, 133, 119, 0.08),
              0 0 18px 2px rgba(0, 133, 119, 0.12);
          }
        }

        @keyframes amanati-dot-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.8);
            opacity: 0.9;
          }
        }

        .amanati-progress-line {
          position: absolute;
          top: 0;
          right: 0;
          height: 1px;
          width: 22%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(0, 133, 119, 0.15),
            rgba(0, 133, 119, 0.9),
            rgba(0, 133, 119, 0.15),
            transparent
          );
          animation: amanati-progress 5s linear infinite;
          pointer-events: none;
        }

        .amanati-step-circle {
          transition:
            box-shadow 300ms ease,
            transform 300ms ease;
        }

        .amanati-step:hover .amanati-step-circle {
          transform: translateY(-2px);
          box-shadow:
            0 0 0 8px rgba(0, 133, 119, 0.07),
            0 0 20px 2px rgba(0, 133, 119, 0.10);
        }

        .amanati-step-dot {
          animation: amanati-dot-pulse 2.8s ease-in-out infinite;
        }

        .amanati-step:nth-child(2) .amanati-step-dot {
          animation-delay: 0.7s;
        }

        .amanati-step:nth-child(3) .amanati-step-dot {
          animation-delay: 1.4s;
        }

        .amanati-step:nth-child(4) .amanati-step-dot {
          animation-delay: 2.1s;
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-progress-line,
          .amanati-step-dot {
            animation: none !important;
          }

          .amanati-step-circle {
            transition: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        {/* Section heading */}
        <header className="text-center">
          <h2 className="break-words text-2xl font-bold leading-9 text-primary sm:text-3xl sm:leading-tight">
            كيف تعمل أمانتي؟
          </h2>

          <span
            className="mx-auto mt-3 block h-0.5 w-14 bg-brand-green"
            aria-hidden
          />
        </header>

        {/* Steps */}
        <ol className="relative mt-10 grid w-full min-w-0 grid-cols-1 gap-8 sm:mt-14 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-0">
          {/* Desktop connecting line */}
          <span
            className="pointer-events-none absolute inset-x-[12%] top-7 hidden border-t border-dashed border-navy/25 lg:block"
            aria-hidden
          >
            <span
              className="amanati-progress-line"
              aria-hidden
            />
          </span>

          {steps.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="amanati-step relative z-10 flex min-w-0 flex-col items-center text-center"
            >
              {/* Animated dot */}
              <span
                className="amanati-step-dot pointer-events-none absolute top-6 h-1.5 w-1.5 rounded-full bg-brand-green"
                aria-hidden
              />

              {/* Icon */}
              <span className="amanati-step-circle grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy text-navy-foreground ring-8 ring-secondary/50">
                <Icon size={22} strokeWidth={1.7} />
              </span>

              {/* Title */}
              <h3 className="mt-4 break-words text-base font-bold leading-7 text-primary sm:mt-5">
                {i + 1}. {title}
              </h3>

              {/* Description */}
              <p className="mt-1.5 w-full max-w-56 break-words text-sm leading-7 text-muted-foreground sm:mt-2">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
