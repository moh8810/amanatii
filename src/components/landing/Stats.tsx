/**
 * Placeholder metrics for design purposes only — not verified figures.
 * Replace `stats` with values fetched from the database during integration.
 */

import { useState } from "react";

const stats = [
  { value: "350+", label: "شحنة تم توصيلها" },
  { value: "100+", label: "عميل" },
  { value: "99.8%", label: "نسبة نجاح التوصيل" },
  { value: "24/7", label: "دعم ومتابعة" },
];

export function Stats() {
  const [activeStat, setActiveStat] = useState<string | null>(null);

  return (
    <section className="w-full overflow-hidden pb-12 sm:pb-16 lg:pb-24">
      <style>{`
        @keyframes amanati-stat-enter {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes amanati-stat-shine {
          0% {
            transform: translateX(120%);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          45% {
            opacity: 0.7;
          }

          100% {
            transform: translateX(-120%);
            opacity: 0;
          }
        }

        @keyframes amanati-stat-glow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 133, 119, 0);
          }

          50% {
            box-shadow: 0 0 0 7px rgba(0, 133, 119, 0.08);
          }
        }

        .amanati-stat {
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          padding: 10px 8px;
          cursor: default;
          animation: amanati-stat-enter 600ms ease both;
          transition:
            transform 300ms ease,
            background-color 300ms ease;
        }

        .amanati-stat:nth-child(1) {
          animation-delay: 80ms;
        }

        .amanati-stat:nth-child(2) {
          animation-delay: 160ms;
        }

        .amanati-stat:nth-child(3) {
          animation-delay: 240ms;
        }

        .amanati-stat:nth-child(4) {
          animation-delay: 320ms;
        }

        .amanati-stat:hover {
          transform: translateY(-3px);
        }

        .amanati-stat-value {
          display: block;
          transform-origin: center;
          transition:
            transform 300ms cubic-bezier(0.22, 1, 0.36, 1),
            text-shadow 300ms ease;
        }

        .amanati-stat:hover .amanati-stat-value,
        .amanati-stat.is-active .amanati-stat-value {
          transform: scale(1.10);
          text-shadow: 0 0 18px rgba(0, 133, 119, 0.22);
        }

        .amanati-stat-shine {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -40%;
          width: 22%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.12),
            transparent
          );
          transform: translateX(120%);
          opacity: 0;
          pointer-events: none;
        }

        .amanati-stat:hover .amanati-stat-shine,
        .amanati-stat.is-active .amanati-stat-shine {
          animation: amanati-stat-shine 900ms ease;
        }

        .amanati-stat-line {
          width: 0;
          height: 2px;
          margin: 7px auto 0;
          border-radius: 999px;
          background: #008577;
          opacity: 0;
          transition:
            width 300ms ease,
            opacity 300ms ease;
        }

        .amanati-stat:hover .amanati-stat-line,
        .amanati-stat.is-active .amanati-stat-line {
          width: 28px;
          opacity: 1;
        }

        .amanati-stat.is-active {
          animation: amanati-stat-glow 1.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .amanati-stat {
            animation: none !important;
            transition: none !important;
          }

          .amanati-stat-value,
          .amanati-stat-line {
            transition: none !important;
          }

          .amanati-stat-shine {
            display: none;
          }

          .amanati-stat.is-active {
            animation: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid w-full min-w-0 gap-6 rounded-xl bg-navy p-5 text-navy-foreground sm:gap-8 sm:p-8 lg:grid-cols-[1fr_1.6fr] lg:items-center lg:p-10">
          {/* Heading */}
          <div className="min-w-0 text-center lg:text-right">
            <h2 className="break-words text-xl font-bold leading-8 sm:text-2xl sm:leading-normal">
              ثقة تُبنى مع كل شحنة وكل أمانة
            </h2>

            <p className="mx-auto mt-2.5 max-w-xl break-words text-xs leading-6 text-navy-foreground/70 sm:text-sm sm:leading-7 lg:mx-0">
              أرقام تقديرية لأغراض العرض، يتم تحديثها لاحقاً من بيانات المنصة.
            </p>
          </div>

          {/* Statistics */}
          <dl className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4 lg:text-center">
            {stats.map(({ value, label }) => {
              const isActive = activeStat === label;

              return (
                <div
                  key={label}
                  className={`amanati-stat min-w-0 ${
                    isActive ? "is-active" : ""
                  }`}
                  onMouseEnter={() => setActiveStat(label)}
                  onMouseLeave={() => setActiveStat(null)}
                  onTouchStart={() => setActiveStat(label)}
                  onTouchEnd={() => {
                    setTimeout(() => {
                      setActiveStat((current) =>
                        current === label ? null : current,
                      );
                    }, 700);
                  }}
                >
                  <span
                    className="amanati-stat-shine"
                    aria-hidden
                  />

                  <dt className="sr-only">{label}</dt>

                  <dd className="min-w-0">
                    <span className="amanati-stat-value break-words text-xl font-extrabold text-brand-green-soft sm:text-3xl">
                      {value}
                    </span>

                    <span
                      className="amanati-stat-line"
                      aria-hidden
                    />

                    <span className="mt-1.5 block break-words text-[11px] leading-5 text-navy-foreground/70 sm:text-sm sm:leading-normal">
                      {label}
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </section>
  );
}