import { useState } from "react";
import {
  Search,
  Check,
  Truck,
  PackageCheck,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type TrackingRecord = {
  type: "shipment" | "amanat";
  reference: string;
  status: string;
  origin: string;
  destination: string;
  lastUpdate: string;
};

const shipmentStages = [
  { key: "pending", label: "تم الاستلام", icon: Check },
  { key: "in_transit", label: "قيد التوصيل", icon: Truck },
  {
    key: "ready_for_pickup",
    label: "جاهزة للاستلام",
    icon: PackageCheck,
  },
  { key: "delivered", label: "تم التسليم", icon: Check },
];

const amanatStages = [
  { key: "stored", label: "أمانة محفوظة", icon: ShieldCheck },
  {
    key: "ready_for_pickup",
    label: "جاهزة للاستلام",
    icon: PackageCheck,
  },
  { key: "received", label: "تم الاستلام", icon: Check },
];

const statusLabels: Record<string, string> = {
  pending: "قيد المعالجة",
  in_transit: "قيد التوصيل",
  transit: "قيد التوصيل",
  ready_for_pickup: "جاهزة للاستلام",
  delivered: "تم التسليم",
  completed: "تم التسليم",
  done: "تم التسليم",
  stored: "أمانة محفوظة",
  stored_amanat: "أمانة محفوظة",
  received: "تم الاستلام",
  collected: "تم الاستلام",
};

function formatDate(date: string | null | undefined) {
  if (!date) return "غير متوفر";

  try {
    return new Intl.DateTimeFormat("ar-YE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
}

function getCityName(city: unknown) {
  if (!city || typeof city !== "object") return "غير محدد";

  const cityObject = city as {
    name?: string;
    city_name?: string;
  };

  return cityObject.name || cityObject.city_name || "غير محدد";
}

export function TrackingSection() {
  const [reference, setReference] = useState("");
  const [record, setRecord] = useState<TrackingRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack(value?: string) {
    const trackingNumber = (value ?? reference).trim();

    if (!trackingNumber) {
      setError("أدخل رقم الشحنة أو رقم الأمانة أولاً.");
      setRecord(null);
      return;
    }

    setLoading(true);
    setError("");
    setRecord(null);

    try {
      // 1. البحث عن الشحنة
      const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .select(
          `
          tracking_number,
          status,
          created_at,
          updated_at,
          from_city_id,
          to_city_id
          `,
        )
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (shipmentError) {
        throw shipmentError;
      }

      if (shipment) {
        const cityIds = [
          shipment.from_city_id,
          shipment.to_city_id,
        ].filter(Boolean);

        const { data: cities, error: citiesError } = await supabase
          .from("cities")
          .select("id, name")
          .in("id", cityIds);

        if (citiesError) {
          throw citiesError;
        }

        const cityMap = new Map(
          (cities ?? []).map((city) => [city.id, city.name]),
        );

        setRecord({
          type: "shipment",
          reference: shipment.tracking_number,
          status: shipment.status,
          origin:
            cityMap.get(shipment.from_city_id) ||
            "غير محدد",
          destination:
            cityMap.get(shipment.to_city_id) ||
            "غير محدد",
          lastUpdate: formatDate(
            shipment.updated_at || shipment.created_at,
          ),
        });

        setLoading(false);
        return;
      }

      // 2. إذا لم تكن شحنة، نبحث عن أمانة
      const { data: amanat, error: amanatError } = await supabase
        .from("amanat")
        .select(
          `
          tracking_number,
          status,
          pickup_point_id
          `,
        )
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (amanatError) {
        throw amanatError;
      }

      if (amanat) {
        let pickupCity = "غير محدد";

        if (amanat.pickup_point_id) {
          const { data: pickupPoint, error: pickupError } =
            await supabase
              .from("pickup_points")
              .select("city_id")
              .eq("id", amanat.pickup_point_id)
              .maybeSingle();

          if (pickupError) {
            throw pickupError;
          }

          if (pickupPoint?.city_id) {
            const { data: city, error: cityError } =
              await supabase
                .from("cities")
                .select("name")
                .eq("id", pickupPoint.city_id)
                .maybeSingle();

            if (cityError) {
              throw cityError;
            }

            pickupCity = getCityName(city);
          }
        }

        setRecord({
          type: "amanat",
          reference: amanat.tracking_number,
          status: amanat.status,
          origin: pickupCity,
          destination: pickupCity,
          lastUpdate: "آخر حالة مسجلة في النظام",
        });

        setLoading(false);
        return;
      }

      setError(
        "لم نجد شحنة أو أمانة بهذا الرقم. تأكد من الرقم وحاول مرة أخرى.",
      );
    } catch (err) {
      console.error("Tracking error:", err);

      setError("حدث خطأ أثناء البحث. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  const stages =
    record?.type === "amanat"
      ? amanatStages
      : shipmentStages;

  const currentIndex = record
    ? Math.max(
        stages.findIndex(
          (stage) => stage.key === record.status,
        ),
        0,
      )
    : 0;

  return (
    <section
      id="tracking"
      className="relative -mt-10 overflow-hidden pb-12 sm:-mt-28 sm:pb-20 lg:-mt-40"
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="grid w-full min-w-0 gap-5 rounded-xl border border-border bg-card p-4 shadow-panel sm:gap-8 sm:p-9 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          {/* Search */}
          <div className="min-w-0 w-full">
            <h2 className="break-words text-xl font-bold leading-8 text-primary sm:text-[1.75rem] sm:leading-normal">
              تتبع شحنتك أو أمانتك
            </h2>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              أدخل رقم الشحنة أو رقم الأمانة لمعرفة آخر تحديثات الحالة.
            </p>

            <form
              className="mt-5 flex w-full min-w-0 flex-col gap-3 sm:mt-6 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                handleTrack();
              }}
            >
              <div className="relative min-w-0 w-full flex-1">
                <input
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    setError("");
                  }}
                  placeholder="أدخل رقم الشحنة أو الأمانة"
                  aria-label="رقم الشحنة أو الأمانة"
                  className="h-12 w-full min-w-0 rounded-md border border-input bg-background py-3 pe-4 ps-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-navy focus:ring-2 focus:ring-ring/15 sm:h-13 sm:ps-14"
                />

                <Search
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground sm:left-5"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-md bg-navy px-5 text-sm font-bold text-navy-foreground transition-all hover:bg-navy-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:h-13 sm:w-auto sm:px-7"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    جاري البحث...
                  </>
                ) : (
                  <>
                    تتبع الآن
                    <Search size={17} />
                  </>
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 flex min-w-0 items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700 sm:px-4">
                <AlertCircle
                  size={18}
                  className="mt-1 shrink-0"
                />

                <span className="min-w-0 break-words">
                  {error}
                </span>
              </div>
            )}

            <div className="mt-3 break-words text-xs leading-6 text-muted-foreground">
              أدخل رقم التتبع الموجود في تفاصيل شحنتك أو أمانتك.
            </div>
          </div>

          {/* Tracking result */}
          <div className="min-w-0 w-full overflow-hidden rounded-lg bg-navy p-4 text-navy-foreground sm:p-6">
            {!record ? (
              <div className="flex min-h-[210px] flex-col items-center justify-center px-2 text-center sm:min-h-[250px]">
                <Search
                  size={36}
                  className="text-navy-foreground/30"
                />

                <p className="mt-4 break-words text-sm font-semibold text-navy-foreground/70">
                  ستظهر تفاصيل الشحنة أو الأمانة هنا
                </p>

                <p className="mt-2 max-w-sm break-words text-xs leading-6 text-navy-foreground/45">
                  أدخل رقم التتبع واضغط «تتبع الآن».
                </p>
              </div>
            ) : (
              <>
                {/* Reference + status */}
                <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="max-w-full break-all font-mono text-sm font-bold tracking-wide">
                    {record.reference}
                  </span>

                  <span className="inline-flex max-w-full shrink-0 items-center rounded-full bg-brand-green/15 px-3 py-1 text-xs font-semibold text-brand-green-soft">
                    <span className="break-words">
                      {statusLabels[record.status] ||
                        record.status}
                    </span>
                  </span>
                </div>

                {/* Stages */}
                <ol className="relative mt-7 grid w-full grid-cols-3 gap-1 sm:mt-8 sm:flex sm:items-start sm:justify-between">
                  <span
                    className="absolute right-[16%] left-[16%] top-[11px] h-px bg-navy-foreground/20 sm:right-4 sm:left-4"
                    aria-hidden
                  />

                  {stages.map(
                    ({ key, label, icon: Icon }, index) => {
                      const done =
                        index <= currentIndex;

                      return (
                        <li
                          key={key}
                          className="relative z-10 flex min-w-0 flex-col items-center gap-2 text-center sm:flex-1 sm:gap-2.5"
                        >
                          <span
                            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                              done
                                ? "bg-brand-green text-navy-deep"
                                : "bg-navy-soft text-navy-foreground/60"
                            }`}
                          >
                            <Icon size={13} />
                          </span>

                          <span
                            className={`max-w-full break-words text-[0.62rem] font-semibold leading-5 sm:text-xs ${
                              done
                                ? "text-brand-green-soft"
                                : "text-navy-foreground/60"
                            }`}
                          >
                            {label}
                          </span>
                        </li>
                      );
                    },
                  )}
                </ol>

                {/* Details */}
                <dl className="mt-7 grid min-w-0 grid-cols-1 gap-4 border-t border-navy-foreground/10 pt-5 text-sm sm:mt-8 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5 sm:pt-6">
                  <div className="min-w-0">
                    <dt className="text-xs text-navy-foreground/55">
                      نقطة الانطلاق
                    </dt>

                    <dd className="mt-1 break-words font-semibold">
                      {record.origin}
                    </dd>
                  </div>

                  <div className="min-w-0">
                    <dt className="text-xs text-navy-foreground/55">
                      الوجهة
                    </dt>

                    <dd className="mt-1 break-words font-semibold">
                      {record.destination}
                    </dd>
                  </div>

                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-xs text-navy-foreground/55">
                      آخر تحديث
                    </dt>

                    <dd className="mt-1 break-words font-semibold">
                      {record.lastUpdate}
                    </dd>
                  </div>
                </dl>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
