import { Link } from "@tanstack/react-router";
import { ShieldCheck, Check } from "lucide-react";
import type {
  ComponentType,
  ReactNode,
  InputHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

/* ---------------- Logo ---------------- */

export function Logo({
  tone = "navy",
  size = "md",
}: {
  tone?: "navy" | "light";
  size?: "sm" | "md";
}) {
  const main = tone === "light" ? "text-primary-foreground" : "text-primary";
  const sub =
    tone === "light"
      ? "text-primary-foreground/60"
      : "text-muted-foreground";
  const box = tone === "light" ? "bg-primary-foreground/10" : "bg-primary";
  const icon = "text-primary-foreground";

  return (
    <Link to="/" className="flex min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          box,
          size === "sm" ? "size-9" : "size-10",
        )}
      >
        <ShieldCheck
          className={cn("size-5", icon)}
          strokeWidth={1.75}
        />
      </div>

      <div className="leading-none">
        <div
          className={cn(
            "font-extrabold",
            main,
            size === "sm" ? "text-lg" : "text-xl",
          )}
        >
          أمانتي
        </div>

        <div
          className={cn(
            "mt-1 text-[10px] font-medium tracking-[0.35em]",
            sub,
          )}
        >
          AMANATI
        </div>
      </div>
    </Link>
  );
}

/* ---------------- Button ---------------- */

type BtnVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "outline"
  | "ghost";

type BtnSize = "sm" | "md" | "lg";

const variants: Record<BtnVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-primary/95",
  secondary:
    "bg-secondary text-secondary-foreground shadow-soft hover:-translate-y-0.5",
  accent:
    "bg-accent text-accent-foreground shadow-soft hover:opacity-90",
  outline:
    "border border-border bg-card text-primary hover:bg-muted",
  ghost:
    "text-muted-foreground hover:bg-muted hover:text-primary",
};

const sizes: Record<BtnSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-3.5 text-sm",
};

export function buttonClass(
  variant: BtnVariant = "primary",
  size: BtnSize = "md",
) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:opacity-50",
    variants[variant],
    sizes[size],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: {
  variant?: BtnVariant;
  size?: BtnSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(buttonClass(variant, size), className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */

export function Card({
  className,
  children,
  hover = false,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-soft",
        hover &&
          "transition-transform duration-200 hover:-translate-y-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ---------------- Section heading ---------------- */

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow ? (
        <span className="text-xs font-bold tracking-widest text-secondary">
          {eyebrow}
        </span>
      ) : null}

      <h2 className="mt-3 text-3xl leading-snug font-extrabold text-primary sm:text-4xl">
        {title}
      </h2>

      {subtitle ? (
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Status badge ---------------- */

export type StatusTone =
  | "pending"
  | "transit"
  | "ready"
  | "done"
  | "stored";

const tones: Record<StatusTone, string> = {
  pending: "bg-muted text-muted-foreground",
  transit: "bg-secondary/10 text-secondary",
  ready: "bg-accent/20 text-accent-foreground",
  done: "bg-emerald-500/10 text-emerald-700",
  stored: "bg-primary/10 text-primary",
};

export function StatusBadge({
  tone,
  children,
}: {
  tone: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ---------------- Stat card ---------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "navy",
}: {
  label: string;
  value: string | number;
  icon?: ComponentType<{
    className?: string;
    strokeWidth?: number;
  }>;
  tone?: "navy" | "teal" | "amber" | "green";
}) {
  const iconTone = {
    navy: "bg-primary/10 text-primary",
    teal: "bg-secondary/10 text-secondary",
    amber: "bg-accent/20 text-accent-foreground",
    green: "bg-emerald-500/10 text-emerald-700",
  }[tone];

  return (
    <Card className="p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">
            {label}
          </p>

          <p className="mt-2 text-3xl font-extrabold text-primary">
            {value}
          </p>
        </div>

        {Icon ? (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              iconTone,
            )}
          >
            <Icon className="size-5" strokeWidth={1.6} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

/* ---------------- Timeline ---------------- */

export type TimelineStep = {
  label: string;
  time?: string;
  state: "done" | "current" | "upcoming";
};

export function Timeline({
  steps,
}: {
  steps: TimelineStep[];
}) {
  return (
    <ol className="relative space-y-6 pr-6">
      <span
        className="absolute top-2 right-[11px] bottom-2 w-px bg-border"
        aria-hidden
      />

      {steps.map((s) => (
        <li
          key={s.label}
          className="relative flex items-start gap-4"
        >
          <span
            className={cn(
              "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              s.state === "done" &&
                "border-secondary bg-secondary text-secondary-foreground",
              s.state === "current" &&
                "border-accent bg-accent text-accent-foreground",
              s.state === "upcoming" &&
                "border-border bg-background",
            )}
          >
            {s.state === "done" ? (
              <Check className="size-3.5" strokeWidth={3} />
            ) : null}

            {s.state === "current" ? (
              <span className="size-2 rounded-full bg-current" />
            ) : null}
          </span>

          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-bold",
                s.state === "upcoming"
                  ? "text-muted-foreground"
                  : "text-primary",
              )}
            >
              {s.label}
            </p>

            {s.time ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {s.time}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Field ---------------- */

export function Field({
  label,
  placeholder,
  type = "text",
  hint,
  ...inputProps
}: {
  label: string;
  placeholder?: string;
  type?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-primary">
        {label}
      </span>

      <input
        {...inputProps}
        type={type}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none transition-colors placeholder:text-muted-foreground focus:border-secondary"
      />

      {hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
