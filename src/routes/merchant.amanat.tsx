import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  Filter,
  LockKeyhole,
  Package,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/merchant/amanat")({
  head: () => ({
    meta: [
      {
        title: "الأمانات | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "إدارة ومتابعة أمانات متجرك بسهولة وأمان.",
      },
    ],
  }),
  component: MerchantAmanatPage,
});

type AmanatItem = {
  id: string;
  tracking_number: string | null;
  owner_id: string;
  status: string;
  description: string | null;
  notes: string | null;
  updated_at?: string | null;
};

type AmanatFilter =
  | "all"
  | "stored"
  | "ready_for_pickup"
  | "received"
  | "expired"
  | "cancelled";

const statusLabels: Record<string, string> = {
  stored: "أمانة محفوظة",
  ready_for_pickup: "جاهزة للاستلام",
  received: "تم الاستلام",
  expired: "منتهية",
  cancelled: "ملغاة",
};

function getStatusLabel(status: string | null) {
  return (
    statusLabels[status || ""] ||
    status ||
    "غير محدد"
  );
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case "stored":
      return LockKeyhole;

    case "ready_for_pickup":
      return PackageCheck;

    case "received":
      return CheckCircle2;

    case "expired":
    case "cancelled":
      return ShieldAlert;

    default:
      return ShieldCheck;
  }
}

function getStatusTone(
  status: string | null,
): "navy" | "teal" | "amber" | "green" {
  switch (status) {
    case "ready_for_pickup":
      return "amber";

    case "received":
      return "green";

    default:
      return "navy";
  }
}

function getStatusStyle(status: string | null) {
  switch (status) {
    case "stored":
      return {
        card:
          "bg-slate-50 border-slate-200",
        icon:
          "bg-slate-200 text-slate-700",
        accent: "bg-slate-500",
        glow: "bg-slate-200",
      };

    case "ready_for_pickup":
      return {
        card:
          "bg-amber-50 border-amber-100",
        icon:
          "bg-amber-100 text-amber-700",
        accent: "bg-amber-500",
        glow: "bg-amber-200",
      };

    case "received":
      return {
        card:
          "bg-emerald-50 border-emerald-100",
        icon:
          "bg-emerald-100 text-emerald-700",
        accent: "bg-emerald-500",
        glow: "bg-emerald-200",
      };

    case "expired":
    case "cancelled":
      return {
        card:
          "bg-red-50 border-red-100",
        icon:
          "bg-red-100 text-red-700",
        accent: "bg-red-500",
        glow: "bg-red-200",
      };

    default:
      return {
        card:
          "bg-primary/5 border-primary/10",
        icon:
          "bg-primary/10 text-primary",
        accent: "bg-primary",
        glow: "bg-primary/20",
      };
  }
}

function formatDate(date: string | null | undefined) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getRelativeTime(
  date: string | null | undefined,
) {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const diff =
    Date.now() - parsed.getTime();

  const minutes = Math.floor(
    diff / 60000,
  );

  if (minutes < 1) {
    return "الآن";
  }

  if (minutes < 60) {
    return `منذ ${minutes} دقيقة`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `منذ ${hours} ساعة`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 30) {
    return `منذ ${days} يوم`;
  }

  return formatDate(date);
}

function MerchantAmanatPage() {
  const [amanat, setAmanat] = useState<
    AmanatItem[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState<AmanatFilter>("all");

  const [selectedAmanat, setSelectedAmanat] =
    useState<AmanatItem | null>(null);

  const [copiedTracking, setCopiedTracking] =
    useState(false);

  async function loadAmanat(
    showRefresh = false,
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى الأمانات.",
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw new Error(
          "تعذر التحقق من نوع الحساب.",
        );
      }

      if (profile.role !== "merchant") {
        throw new Error(
          "هذه الصفحة مخصصة لحسابات التجار فقط.",
        );
      }

      const {
        data,
        error: amanatError,
      } = await supabase
        .from("amanat")
        .select(`
          id,
          tracking_number,
          owner_id,
          status,
          description,
          notes,
          updated_at
        `)
        .eq("owner_id", user.id)
        .order("updated_at", {
          ascending: false,
        });

      if (amanatError) {
        console.error(
          "MERCHANT AMANAT ERROR:",
          amanatError,
        );

        throw new Error(
          "تعذر تحميل أمانات التاجر.",
        );
      }

      setAmanat(
        (data ?? []) as AmanatItem[],
      );
    } catch (err) {
      console.error(
        "MERCHANT AMANAT LOAD ERROR:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تحميل الأمانات.",
      );

      setAmanat([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAmanat();
  }, []);

  const filteredAmanat = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return amanat.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        item.status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const values = [
        item.tracking_number,
        item.description,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(
        normalizedSearch,
      );
    });
  }, [amanat, search, filter]);

  const stats = useMemo(
    () => ({
      total: amanat.length,

      stored: amanat.filter(
        (item) =>
          item.status === "stored",
      ).length,

      ready: amanat.filter(
        (item) =>
          item.status ===
          "ready_for_pickup",
      ).length,

      received: amanat.filter(
        (item) =>
          item.status === "received",
      ).length,

      attention: amanat.filter(
        (item) =>
          item.status === "expired" ||
          item.status === "cancelled",
      ).length,
    }),
    [amanat],
  );

  const protectedPercentage =
    stats.total > 0
      ? Math.round(
          ((stats.stored +
            stats.ready +
            stats.received) /
            stats.total) *
            100,
        )
      : 0;

  async function copyTracking(
    trackingNumber: string | null,
  ) {
    if (!trackingNumber) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        trackingNumber,
      );

      setCopiedTracking(true);

      window.setTimeout(() => {
        setCopiedTracking(false);
      }, 1600);
    } catch {
      setCopiedTracking(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setFilter("all");
  }

  return (
    <div
      dir="rtl"
      className="space-y-7 pb-10"
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden rounded-[2rem] bg-primary p-6 text-primary-foreground shadow-2xl sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 right-0 size-96 rounded-full bg-white/5 blur-3xl" />

        <div className="pointer-events-none absolute right-1/3 top-1/2 size-36 -translate-y-1/2 rounded-full border border-white/10" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300" />

                  <span className="relative size-2 rounded-full bg-emerald-300" />
                </span>

                نظام الأمانات
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white/70">
                <ShieldCheck className="size-3.5" />

                {stats.total.toLocaleString(
                  "ar-YE",
                )}{" "}
                أمانة
              </span>
            </div>

            <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              أماناتك محفوظة،
              <br />
              <span className="text-white/65">
                وإدارتها أسهل.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              تابع جميع الأمانات الخاصة بمتجرك،
              واعرف ما تم حفظه وما أصبح جاهزًا
              للاستلام وما تم استلامه بالفعل.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/merchant/amanat/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <Plus className="size-4" />

                إنشاء أمانة

                <ArrowLeft className="size-4" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  void loadAmanat(true);
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  className={
                    refreshing
                      ? "size-4 animate-spin"
                      : "size-4"
                  }
                />

                تحديث الأمانات
              </button>
            </div>
          </div>

          <div className="hidden lg:flex">
            <div className="relative flex size-48 items-center justify-center rounded-[2.75rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
              <div className="absolute inset-4 rounded-[2.25rem] border border-white/10" />

              <div className="absolute inset-8 rounded-[1.75rem] bg-white/5" />

              <div className="relative flex size-24 items-center justify-center rounded-3xl bg-white text-primary shadow-2xl transition duration-500 hover:rotate-3 hover:scale-105">
                <ShieldCheck
                  className="size-12"
                  strokeWidth={1.5}
                />
              </div>

              <div className="absolute -right-4 top-8 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <LockKeyhole className="size-5 text-emerald-300" />
              </div>

              <div className="absolute -bottom-3 -left-4 flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <PackageCheck className="size-5 text-amber-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div>
            <p className="text-xs text-white/45">
              نسبة الأمانات النشطة
            </p>

            <p className="mt-1 text-xl font-black">
              {protectedPercentage}%
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">
              محفوظة حاليًا
            </p>

            <p className="mt-1 text-xl font-black">
              {stats.stored.toLocaleString(
                "ar-YE",
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-white/45">
              جاهزة للاستلام
            </p>

            <p className="mt-1 text-xl font-black">
              {stats.ready.toLocaleString(
                "ar-YE",
              )}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          LOADING / ERROR
      ===================================================== */}

      {loading ? (
        <Card className="overflow-hidden p-6 sm:p-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 animate-pulse rounded-lg bg-muted" />

              <div className="h-10 w-24 animate-pulse rounded-xl bg-muted" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({
                length: 5,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-muted/60"
                />
              ))}
            </div>

            <div className="h-24 animate-pulse rounded-2xl bg-muted/50" />

            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-2xl bg-muted/50"
                />
              ))}
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="overflow-hidden p-8">
          <div className="mx-auto max-w-lg text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <ShieldAlert className="size-8" />
            </div>

            <h3 className="mt-5 text-lg font-black text-primary">
              تعذر تحميل الأمانات
            </h3>

            <p className="mt-2 text-sm leading-7 text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                void loadAmanat(true);
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <RefreshCw className="size-4" />

              إعادة المحاولة
            </button>
          </div>
        </Card>
      ) : (
        <>
          {/* =====================================================
              STATS
          ===================================================== */}

          <section>
            <div className="mb-4">
              <h3 className="text-xl font-black text-primary">
                حالة الأمانات
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                نظرة سريعة على جميع أمانات متجرك.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "إجمالي الأمانات",
                  value: stats.total,
                  icon: ShieldCheck,
                  style:
                    "bg-primary/5 text-primary border-primary/10",
                  filter: "all" as AmanatFilter,
                },
                {
                  label: "محفوظة",
                  value: stats.stored,
                  icon: LockKeyhole,
                  style:
                    "bg-slate-50 text-slate-700 border-slate-100",
                  filter: "stored" as AmanatFilter,
                },
                {
                  label: "جاهزة للاستلام",
                  value: stats.ready,
                  icon: PackageCheck,
                  style:
                    "bg-amber-50 text-amber-700 border-amber-100",
                  filter:
                    "ready_for_pickup" as AmanatFilter,
                },
                {
                  label: "تم الاستلام",
                  value: stats.received,
                  icon: CheckCircle2,
                  style:
                    "bg-emerald-50 text-emerald-700 border-emerald-100",
                  filter: "received" as AmanatFilter,
                },
                {
                  label: "تحتاج انتباه",
                  value: stats.attention,
                  icon: ShieldAlert,
                  style:
                    "bg-red-50 text-red-700 border-red-100",
                  filter: "expired" as AmanatFilter,
                },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setFilter(item.filter);

                    window.setTimeout(() => {
                      document
                        .getElementById(
                          "merchant-amanat-list",
                        )
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }, 50);
                  }}
                  className="group text-right"
                >
                  <Card
                    className={`relative overflow-hidden border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl ${item.style}`}
                  >
                    <div className="absolute -left-8 -top-8 size-24 rounded-full bg-white/60 blur-2xl transition duration-500 group-hover:scale-150" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground">
                          {item.label}
                        </p>

                        <p className="mt-3 origin-right text-3xl font-black text-primary transition duration-300 group-hover:scale-105">
                          {item.value.toLocaleString(
                            "ar-YE",
                          )}
                        </p>
                      </div>

                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-background/80 shadow-sm transition duration-300 group-hover:rotate-6 group-hover:scale-110">
                        <item.icon className="size-5" />
                      </div>
                    </div>

                    <div className="relative mt-4 flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                      <span>
                        عرض الأمانات
                      </span>

                      <ArrowLeft className="size-3 transition group-hover:-translate-x-1" />
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>

          {/* =====================================================
              SEARCH / FILTER
          ===================================================== */}

          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div className="pointer-events-none absolute -left-20 -top-20 size-48 rounded-full bg-primary/5 blur-3xl" />

            <div className="relative">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Filter className="size-4" />
                    </div>

                    <h3 className="text-base font-black text-primary">
                      ابحث في الأمانات
                    </h3>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    ابحث برقم الأمانة أو وصفها أو
                    ملاحظاتها.
                  </p>
                </div>

                {(search ||
                  filter !== "all") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="self-start rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-primary"
                  >
                    مسح الفلاتر
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                    placeholder="رقم الأمانة، الوصف، الملاحظات..."
                    className="h-13 w-full rounded-2xl border border-border bg-muted/20 py-3 pe-12 ps-12 text-sm font-medium text-primary outline-none transition duration-300 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() =>
                        setSearch("")
                      }
                      className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-primary"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(
                      event.target
                        .value as AmanatFilter,
                    )
                  }
                  className="h-13 rounded-2xl border border-border bg-muted/20 px-5 text-sm font-bold text-primary outline-none transition focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                >
                  <option value="all">
                    جميع الأمانات
                  </option>

                  <option value="stored">
                    أمانات محفوظة
                  </option>

                  <option value="ready_for_pickup">
                    جاهزة للاستلام
                  </option>

                  <option value="received">
                    تم الاستلام
                  </option>

                  <option value="expired">
                    منتهية
                  </option>

                  <option value="cancelled">
                    ملغاة
                  </option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    void loadAmanat(true);
                  }}
                  disabled={refreshing}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 text-sm font-black text-primary transition duration-300 hover:-translate-y-0.5 hover:bg-muted hover:shadow-md disabled:opacity-50"
                >
                  <RefreshCw
                    className={
                      refreshing
                        ? "size-4 animate-spin"
                        : "size-4"
                    }
                  />

                  تحديث
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  {
                    value:
                      "all" as AmanatFilter,
                    label: "الكل",
                  },
                  {
                    value:
                      "stored" as AmanatFilter,
                    label: "محفوظة",
                  },
                  {
                    value:
                      "ready_for_pickup" as AmanatFilter,
                    label: "جاهزة للاستلام",
                  },
                  {
                    value:
                      "received" as AmanatFilter,
                    label: "تم الاستلام",
                  },
                  {
                    value:
                      "expired" as AmanatFilter,
                    label: "منتهية",
                  },
                  {
                    value:
                      "cancelled" as AmanatFilter,
                    label: "ملغاة",
                  },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFilter(item.value)
                    }
                    className={`rounded-xl px-3.5 py-2 text-xs font-black transition duration-300 ${
                      filter === item.value
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* =====================================================
              AMANAT LIST
          ===================================================== */}

          <section id="merchant-amanat-list">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-primary">
                  أمانات متجرك
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  عرض{" "}
                  {filteredAmanat.length.toLocaleString(
                    "ar-YE",
                  )}{" "}
                  من أصل{" "}
                  {amanat.length.toLocaleString(
                    "ar-YE",
                  )}{" "}
                  أمانة
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-xs font-bold text-muted-foreground sm:flex">
                <Sparkles className="size-3.5" />

                أحدث الأمانات أولًا
              </div>
            </div>

            {filteredAmanat.length === 0 ? (
              <Card className="relative overflow-hidden p-10 sm:p-14">
                <div className="pointer-events-none absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative mx-auto max-w-md text-center">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] bg-primary/5 text-primary shadow-inner">
                    <ShieldCheck className="size-9" />
                  </div>

                  <h4 className="mt-6 text-xl font-black text-primary">
                    لا توجد أمانات هنا
                  </h4>

                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {amanat.length === 0
                      ? "لم يتم إنشاء أي أمانات لهذا المتجر حتى الآن."
                      : "لا توجد نتائج تطابق البحث أو الفلتر الحالي."}
                  </p>

                  {amanat.length > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <RefreshCw className="size-4" />

                      عرض جميع الأمانات
                    </button>
                  ) : (
                    <Link
                      to="/merchant/amanat/new"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <Plus className="size-4" />

                      إنشاء أول أمانة
                    </Link>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredAmanat.map(
                  (item, index) => {
                    const style =
                      getStatusStyle(
                        item.status,
                      );

                    const StatusIcon =
                      getStatusIcon(
                        item.status,
                      );

                    return (
                      <Card
                        key={item.id}
                        className="group relative overflow-hidden p-0 transition duration-500 hover:-translate-y-1 hover:shadow-2xl"
                        style={{
                          animationDelay: `${Math.min(
                            index * 45,
                            450,
                          )}ms`,
                        }}
                      >
                        <div
                          className={`absolute right-0 top-0 h-full w-1 ${style.accent}`}
                        />

                        <div className="p-5 sm:p-6">
                          {/* HEADER */}

                          <div className="flex items-start justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <div
                                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition duration-500 group-hover:rotate-6 group-hover:scale-110 ${style.icon}`}
                              >
                                <StatusIcon className="size-6" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-mono text-sm font-black text-primary">
                                    {item.tracking_number ||
                                      item.id}
                                  </p>

                                  {item.tracking_number && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        void copyTracking(
                                          item.tracking_number,
                                        )
                                      }
                                      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                                      title="نسخ رقم الأمانة"
                                    >
                                      {copiedTracking ? (
                                        <Check className="size-3.5 text-emerald-600" />
                                      ) : (
                                        <Copy className="size-3.5" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {getRelativeTime(
                                    item.updated_at,
                                  )}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black ${
                                item.status ===
                                "received"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.status ===
                                      "ready_for_pickup"
                                    ? "bg-amber-100 text-amber-700"
                                    : item.status ===
                                        "expired" ||
                                      item.status ===
                                        "cancelled"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {getStatusLabel(
                                item.status,
                              )}
                            </span>
                          </div>

                          {/* PROTECTION VISUAL */}

                          <div
                            className={`relative mt-6 overflow-hidden rounded-2xl border p-4 ${style.card}`}
                          >
                            <div
                              className={`pointer-events-none absolute -left-8 -top-8 size-28 rounded-full opacity-40 blur-2xl ${style.glow}`}
                            />

                            <div className="relative flex items-center gap-4">
                              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                                <ShieldCheck className="size-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-muted-foreground">
                                  حالة الحفظ
                                </p>

                                <p className="mt-1 text-sm font-black text-primary">
                                  {item.status ===
                                  "stored"
                                    ? "الأمانة محفوظة بأمان"
                                    : item.status ===
                                        "ready_for_pickup"
                                      ? "الأمانة جاهزة للاستلام"
                                      : item.status ===
                                          "received"
                                        ? "تم استلام الأمانة"
                                        : getStatusLabel(
                                            item.status,
                                          )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* DESCRIPTION */}

                          <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                            <p className="text-[10px] font-bold text-muted-foreground">
                              وصف الأمانة
                            </p>

                            <p className="mt-2 min-h-10 text-sm font-semibold leading-6 text-primary">
                              {item.description ||
                                "لا يوجد وصف مضاف لهذه الأمانة."}
                            </p>
                          </div>

                          {/* NOTES */}

                          {item.notes && (
                            <div className="mt-3 rounded-2xl bg-muted/40 px-4 py-3">
                              <p className="text-[10px] font-bold text-muted-foreground">
                                ملاحظات
                              </p>

                              <p className="mt-1 text-xs leading-6 text-primary">
                                {item.notes}
                              </p>
                            </div>
                          )}

                          {/* FOOTER */}

                          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground">
                                آخر تحديث
                              </p>

                              <p className="mt-1 text-[11px] font-bold text-primary">
                                {formatDate(
                                  item.updated_at,
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAmanat(
                                  item,
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                            >
                              <Eye className="size-3.5" />

                              التفاصيل

                              <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {selectedAmanat && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedAmanat(null)
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-background shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HERO */}

            <div className="relative overflow-hidden rounded-t-[2rem] bg-primary p-6 text-primary-foreground sm:p-7">
              <div className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-white/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                    <ShieldCheck className="size-6" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white/50">
                      تفاصيل الأمانة
                    </p>

                    <h3 className="mt-1 font-mono text-lg font-black">
                      {selectedAmanat.tracking_number ||
                        selectedAmanat.id}
                    </h3>

                    <p className="mt-1 text-[11px] text-white/55">
                      {getStatusLabel(
                        selectedAmanat.status,
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmanat(null)
                  }
                  className="flex size-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6 sm:p-7">
              {/* STATUS */}

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-muted-foreground">
                      الحالة الحالية
                    </p>

                    <p className="mt-1 text-lg font-black text-primary">
                      {getStatusLabel(
                        selectedAmanat.status,
                      )}
                    </p>
                  </div>

                  <div
                    className={`flex size-12 items-center justify-center rounded-2xl ${
                      getStatusStyle(
                        selectedAmanat.status,
                      ).icon
                    }`}
                  >
                    {(() => {
                      const Icon =
                        getStatusIcon(
                          selectedAmanat.status,
                        );

                      return (
                        <Icon className="size-6" />
                      );
                    })()}
                  </div>
                </div>

                {/* TIMELINE */}

                <div className="mt-6 flex items-center gap-1">
                  {[
                    {
                      key: "stored",
                      label: "محفوظة",
                    },
                    {
                      key: "ready_for_pickup",
                      label: "جاهزة",
                    },
                    {
                      key: "received",
                      label: "مستلمة",
                    },
                  ].map(
                    (step, index) => {
                      const current =
                        selectedAmanat.status;

                      const active =
                        step.key === current ||
                        (step.key ===
                          "ready_for_pickup" &&
                          current ===
                            "received") ||
                        (step.key === "stored" &&
                          [
                            "stored",
                            "ready_for_pickup",
                            "received",
                          ].includes(
                            current,
                          ));

                      return (
                        <div
                          key={step.key}
                          className="flex min-w-0 flex-1 items-center"
                        >
                          <div
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full transition ${
                              active
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {active ? (
                              <Check className="size-4" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-current" />
                            )}
                          </div>

                          {index < 2 && (
                            <div
                              className={`mx-1 h-0.5 flex-1 rounded-full ${
                                active
                                  ? "bg-primary/40"
                                  : "bg-border"
                              }`}
                            />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>

                <div className="mt-3 flex justify-between text-[9px] font-bold text-muted-foreground">
                  <span>
                    محفوظة
                  </span>

                  <span>
                    جاهزة
                  </span>

                  <span>
                    تم الاستلام
                  </span>
                </div>
              </div>

              {/* DESCRIPTION */}

              <InfoBox
                icon={
                  <Package className="size-4" />
                }
                label="وصف الأمانة"
                value={
                  selectedAmanat.description ||
                  "لا يوجد وصف."
                }
              />

              {/* NOTES */}

              <InfoBox
                icon={
                  <Sparkles className="size-4" />
                }
                label="ملاحظات"
                value={
                  selectedAmanat.notes ||
                  "لا توجد ملاحظات."
                }
              />

              {/* TRACKING */}

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex items-center gap-2">
                  <PackageCheck className="size-4 text-primary" />

                  <span className="text-[10px] font-bold text-muted-foreground">
                    رقم الأمانة
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="min-w-0 flex-1 rounded-xl bg-background px-4 py-3">
                    <p className="truncate font-mono text-sm font-black text-primary">
                      {selectedAmanat.tracking_number ||
                        selectedAmanat.id}
                    </p>
                  </div>

                  {selectedAmanat.tracking_number && (
                    <button
                      type="button"
                      onClick={() =>
                        void copyTracking(
                          selectedAmanat.tracking_number,
                        )
                      }
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-primary transition hover:-translate-y-0.5 hover:bg-muted"
                    >
                      {copiedTracking ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* UPDATE */}

              <div className="rounded-2xl border border-border bg-muted/20 p-5">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="size-4" />

                  <span className="text-[10px] font-bold">
                    آخر تحديث
                  </span>
                </div>

                <p className="mt-2 text-xs font-black text-primary">
                  {formatDate(
                    selectedAmanat.updated_at,
                  )}
                </p>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col gap-2 sm:flex-row">
                {selectedAmanat.tracking_number && (
                  <button
                    type="button"
                    onClick={() =>
                      void copyTracking(
                        selectedAmanat.tracking_number,
                      )
                    }
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-primary transition hover:bg-muted"
                  >
                    {copiedTracking ? (
                      <Check className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}

                    {copiedTracking
                      ? "تم النسخ"
                      : "نسخ رقم الأمانة"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSelectedAmanat(null)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  إغلاق التفاصيل

                  <CheckCircle2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}

        <span className="text-[10px] font-bold">
          {label}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm font-black leading-7 text-primary">
        {value}
      </p>
    </div>
  );
}