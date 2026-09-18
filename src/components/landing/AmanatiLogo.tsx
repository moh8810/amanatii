type Props = {
  variant?: "navy" | "white";
  className?: string;
};

export function AmanatiLogo({
  variant = "navy",
  className = "h-12 w-auto",
}: Props) {
  const textColor =
    variant === "white" ? "text-white" : "text-navy";

  const subColor =
    variant === "white"
      ? "text-white/65"
      : "text-slate-500";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* شعار أمانتي */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white">
        <img
          src="/amanati-logo.png"
          alt=""
          aria-hidden="true"
          className="absolute left-[-3px] top-[-3px] h-[58px] w-[58px] max-w-none object-cover"
        />
      </div>

      {/* اسم أمانتي */}
      <div className="flex flex-col items-start justify-center leading-none">
        <span
          className={`font-[Tajawal] text-[22px] font-extrabold tracking-tight ${textColor}`}
        >
          أمانتي
        </span>

        <span
          dir="ltr"
          className={`mt-1 text-[9px] font-bold tracking-[0.34em] ${subColor}`}
        >
          AMANATI
        </span>
      </div>
    </div>
  );
}
