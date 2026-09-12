import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, StatCard } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pickup-points")({
  head: () => ({
    meta: [
      {
        title: "نقاط الاستلام | لوحة الإدارة | أمانتي",
      },
      {
        name: "description",
        content: "إدارة ومتابعة نقاط استلام أمانتي.",
      },
    ],
  }),

  component: PickupPointsPage,
});

/* =========================================================
   Navigation
========================================================= */

const nav = [
  {
    label: "نظرة عامة",
    icon: Building2,
    to: "/admin",
  },
  {
    label: "الشحنات",
    icon: MapPin,
    to: "/admin/shipments",
  },
  {
    label: "الأمانات",
    icon: MapPin,
    to: "/admin/amanat",
  },
  {
    label: "نقاط الاستلام",
    icon: MapPin,
    to: "/admin/pickup-points",
    active: true,
  },
  {
    label: "المدن",
    icon: Building2,
    to: "/admin/cities",
  },
];

/* =========================================================
   Types
========================================================= */

type City = {
  id: string;
  name: string;
};

type PickupPoint = {
  id: string;
  name: string;
  city_id: string | null;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string | null;
  cities?: {
    name: string;
  } | null;
};

/* =========================================================
   Helpers
========================================================= */

function formatDate(value: string | null) {
  if (!value) return "غير محدد";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/* =========================================================
   Page
========================================================= */

function PickupPointsPage() {
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPoint, setEditingPoint] =
    useState<PickupPoint | null>(null);

  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isActive, setIsActive] = useState(true);

  /* =========================================================
     Load Cities
  ========================================================= */

  async function loadCities() {
    setLoadingCities(true);

    const { data, error } = await supabase
      .from("cities")
      .select("id,name")
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("CITIES ERROR:", error);

      setErrorMessage(
        `تعذر تحميل المدن.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setCities([]);
      setLoadingCities(false);

      return;
    }

    setCities(data ?? []);
    setLoadingCities(false);
  }

  /* =========================================================
     Load Pickup Points
  ========================================================= */

  async function loadPoints() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("pickup_points")
      .select(`
        id,
        name,
        city_id,
        address,
        phone,
        latitude,
        longitude,
        is_active,
        created_at,
        cities (
          name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("PICKUP POINTS ERROR:", error);

      setErrorMessage(
        `تعذر تحميل نقاط الاستلام.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setPoints([]);
      setLoading(false);

      return;
    }

    setPoints((data ?? []) as PickupPoint[]);
    setLoading(false);
  }

  /* =========================================================
     Load Everything
  ========================================================= */

  async function loadAll() {
    await Promise.all([
      loadPoints(),
      loadCities(),
    ]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* =========================================================
     Reset Form
  ========================================================= */

  function resetForm() {
    setName("");
    setCityId("");
    setAddress("");
    setPhone("");
    setLatitude("");
    setLongitude("");
    setIsActive(true);

    setShowAddForm(false);
    setEditingPoint(null);
  }

  /* =========================================================
     Open Edit
  ========================================================= */

  function openEditForm(point: PickupPoint) {
    setErrorMessage("");

    setEditingPoint(point);

    setName(point.name ?? "");
    setCityId(point.city_id ?? "");
    setAddress(point.address ?? "");
    setPhone(point.phone ?? "");

    setLatitude(
      point.latitude !== null
        ? String(point.latitude)
        : "",
    );

    setLongitude(
      point.longitude !== null
        ? String(point.longitude)
        : "",
    );

    setIsActive(point.is_active);

    setShowAddForm(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =========================================================
     Validate Form
  ========================================================= */

  function validateForm() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "اكتب اسم نقطة الاستلام.";
    }

    if (!cityId) {
      return "اختر المدينة.";
    }

    if (!address.trim()) {
      return "اكتب عنوان نقطة الاستلام.";
    }

    if (!phone.trim()) {
      return "اكتب رقم هاتف نقطة الاستلام.";
    }

    if (latitude.trim()) {
      const value = Number(latitude);

      if (
        Number.isNaN(value) ||
        value < -90 ||
        value > 90
      ) {
        return "خط العرض غير صحيح. يجب أن يكون بين -90 و 90.";
      }
    }

    if (longitude.trim()) {
      const value = Number(longitude);

      if (
        Number.isNaN(value) ||
        value < -180 ||
        value > 180
      ) {
        return "خط الطول غير صحيح. يجب أن يكون بين -180 و 180.";
      }
    }

    return null;
  }

  /* =========================================================
     Save Point
  ========================================================= */

  async function savePoint() {
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const latitudeValue = latitude.trim()
      ? Number(latitude)
      : null;

    const longitudeValue = longitude.trim()
      ? Number(longitude)
      : null;

    setSaving(true);

    const payload = {
      name: name.trim(),
      city_id: cityId,
      address: address.trim(),
      phone: phone.trim(),
      latitude: latitudeValue,
      longitude: longitudeValue,
      is_active: isActive,
    };

    /* تعديل */

    if (editingPoint) {
      const { error } = await supabase
        .from("pickup_points")
        .update(payload)
        .eq("id", editingPoint.id);

      if (error) {
        console.error(
          "UPDATE PICKUP POINT ERROR:",
          error,
        );

        setErrorMessage(
          `تعذر تعديل نقطة الاستلام.\nCode: ${
            error.code ?? "غير معروف"
          }\nMessage: ${error.message ?? ""}`,
        );

        setSaving(false);

        return;
      }
    }

    /* إضافة */

    else {
      const { error } = await supabase
        .from("pickup_points")
        .insert(payload);

      if (error) {
        console.error(
          "ADD PICKUP POINT ERROR:",
          error,
        );

        setErrorMessage(
          `تعذر إضافة نقطة الاستلام.\nCode: ${
            error.code ?? "غير معروف"
          }\nMessage: ${error.message ?? ""}`,
        );

        setSaving(false);

        return;
      }
    }

    setSaving(false);

    resetForm();

    await loadPoints();
  }

  /* =========================================================
     Toggle Active / Inactive
  ========================================================= */

  async function togglePoint(point: PickupPoint) {
    setErrorMessage("");

    const { error } = await supabase
      .from("pickup_points")
      .update({
        is_active: !point.is_active,
      })
      .eq("id", point.id);

    if (error) {
      console.error(
        "TOGGLE PICKUP POINT ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر تغيير حالة النقطة.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      return;
    }

    await loadPoints();
  }

  /* =========================================================
     Delete Point
  ========================================================= */

  async function deletePoint(point: PickupPoint) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف نقطة الاستلام "${point.name}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("pickup_points")
      .delete()
      .eq("id", point.id);

    if (error) {
      console.error(
        "DELETE PICKUP POINT ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر حذف نقطة الاستلام.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setDeleting(false);

      return;
    }

    setDeleting(false);

    await loadPoints();
  }

  /* =========================================================
     Open Google Maps
  ========================================================= */

  function openMap(point: PickupPoint) {
    if (
      point.latitude === null ||
      point.longitude === null
    ) {
      setErrorMessage(
        "لا توجد إحداثيات جغرافية لهذه النقطة.",
      );

      return;
    }

    const url = `https://www.google.com/maps?q=${point.latitude},${point.longitude}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer",
    );
  }

  /* =========================================================
     Search
  ========================================================= */

  const filteredPoints = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return points;
    }

    return points.filter((point) => {
      const cityName =
        point.cities?.name ?? "";

      return [
        point.name,
        cityName,
        point.address ?? "",
        point.phone ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [points, search]);

  /* =========================================================
     Statistics
  ========================================================= */

  const activePoints = points.filter(
    (point) => point.is_active,
  ).length;

  const inactivePoints =
    points.length - activePoints;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <DashboardShell
      title="نقاط الاستلام"
      subtitle="إدارة ومتابعة مراكز ونقاط استلام أمانتي."
      nav={nav}
    >
      {/* =====================================================
          Statistics
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي النقاط"
          value={points.length}
          icon={MapPin}
          tone="navy"
        />

        <StatCard
          label="النقاط النشطة"
          value={activePoints}
          icon={CheckCircle2}
          tone="teal"
        />

        <StatCard
          label="النقاط غير النشطة"
          value={inactivePoints}
          icon={XCircle}
          tone="amber"
        />

        <StatCard
          label="المدن"
          value={cities.length}
          icon={Building2}
          tone="green"
        />
      </div>

      {/* =====================================================
          Search + Actions
      ===================================================== */}

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <Search className="size-5 shrink-0 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث باسم النقطة أو المدينة أو الهاتف..."
              className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              إضافة نقطة
            </button>

            <button
              type="button"
              onClick={loadAll}
              disabled={
                loading ||
                loadingCities ||
                saving ||
                deleting
              }
              className="flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-primary transition hover:bg-muted disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw
                className={`size-4 ${
                  loading ||
                  loadingCities
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* =====================================================
          Add / Edit Form
      ===================================================== */}

      {(showAddForm || editingPoint) && (
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {editingPoint
                  ? "تعديل نقطة الاستلام"
                  : "إضافة نقطة استلام جديدة"}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {editingPoint
                  ? "عدّل بيانات نقطة الاستلام ثم احفظ التغييرات."
                  : "أدخل بيانات نقطة الاستلام واربطها بالمدينة المناسبة."}
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted"
              title="إغلاق"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* اسم النقطة */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                اسم نقطة الاستلام
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="مثال: أمانتي - فرع صنعاء الرئيسي"
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* المدينة */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                المدينة
              </label>

              <select
                value={cityId}
                onChange={(event) =>
                  setCityId(event.target.value)
                }
                disabled={
                  saving || loadingCities
                }
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">
                  {loadingCities
                    ? "جاري تحميل المدن..."
                    : "اختر المدينة"}
                </option>

                {cities.map((city) => (
                  <option
                    key={city.id}
                    value={city.id}
                  >
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* العنوان */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-primary">
                العنوان
              </label>

              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="مثال: شارع حدة، بجانب..."
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* الهاتف */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                رقم الهاتف
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="مثال: 777000000"
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* الحالة */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                حالة النقطة
              </label>

              <button
                type="button"
                onClick={() =>
                  setIsActive((value) => !value)
                }
                disabled={saving}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                <span>
                  {isActive
                    ? "النقطة نشطة"
                    : "النقطة غير نشطة"}
                </span>

                {isActive ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <XCircle className="size-5" />
                )}
              </button>
            </div>

            {/* Latitude */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                خط العرض Latitude
              </label>

              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(event) =>
                  setLatitude(event.target.value)
                }
                placeholder="مثال: 15.3694"
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Longitude */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                خط الطول Longitude
              </label>

              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(event) =>
                  setLongitude(event.target.value)
                }
                placeholder="مثال: 44.1910"
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={savePoint}
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving
                ? "جاري الحفظ..."
                : editingPoint
                  ? "حفظ التعديلات"
                  : "حفظ نقطة الاستلام"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-xl bg-muted px-6 py-3 text-sm font-bold text-primary"
            >
              إلغاء
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          Error
      ===================================================== */}

      {errorMessage && (
        <Card className="border-red-200 p-5">
          <div className="text-center">
            <XCircle className="mx-auto size-10 text-red-500" />

            <p className="mt-3 text-sm font-bold text-red-600">
              حدث خطأ
            </p>

            <pre className="mx-auto mt-3 max-w-2xl whitespace-pre-wrap rounded-xl bg-muted p-4 text-left text-xs leading-6 text-primary">
              {errorMessage}
            </pre>

            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                loadAll();
              }}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* =====================================================
          Pickup Points List
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-primary">
            نقاط الاستلام
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            جميع نقاط الاستلام المسجلة في قاعدة بيانات أمانتي.
          </p>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              جاري تحميل نقاط الاستلام...
            </div>
          ) : filteredPoints.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <MapPin className="mx-auto size-12 text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                لا توجد نقاط استلام
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                لم تتم إضافة أي نقطة استلام حتى الآن.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1200px]">
                {/* =================================================
                    Table Header
                ================================================= */}

                <div
                  dir="rtl"
                  className="grid grid-cols-[260px_140px_minmax(220px,1fr)_150px_110px_330px] items-center gap-4 border-b border-border bg-muted/30 px-5 py-4 text-xs font-bold text-muted-foreground"
                >
                  <div>النقطة</div>

                  <div>المدينة</div>

                  <div>العنوان</div>

                  <div>الهاتف</div>

                  <div>الحالة</div>

                  <div className="text-center">
                    إجراء
                  </div>
                </div>

                {/* =================================================
                    Table Rows
                ================================================= */}

                <div className="divide-y divide-border">
                  {filteredPoints.map((point) => (
                    <div
                      key={point.id}
                      dir="rtl"
                      className="grid grid-cols-[260px_140px_minmax(220px,1fr)_150px_110px_330px] items-center gap-4 px-5 py-5 transition hover:bg-muted/20"
                    >
                      {/* =================================================
                          Point
                      ================================================= */}

                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <MapPin className="size-5 text-primary" />
                          </div>

                          <div className="min-w-0">
                            <p className="whitespace-normal break-words text-sm font-bold leading-6 text-primary">
                              {point.name}
                            </p>

                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {formatDate(
                                point.created_at,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* =================================================
                          City
                      ================================================= */}

                      <div className="min-w-0">
                        <p className="whitespace-normal break-words text-sm font-medium leading-6 text-primary">
                          {point.cities?.name ??
                            "غير محددة"}
                        </p>
                      </div>

                      {/* =================================================
                          Address
                      ================================================= */}

                      <div className="min-w-0">
                        <p className="whitespace-normal break-words text-sm leading-6 text-muted-foreground">
                          {point.address ??
                            "غير محدد"}
                        </p>
                      </div>

                      {/* =================================================
                          Phone
                      ================================================= */}

                      <div className="min-w-0">
                        <p
                          dir="ltr"
                          className="whitespace-nowrap text-sm text-muted-foreground"
                        >
                          {point.phone ??
                            "غير محدد"}
                        </p>
                      </div>

                      {/* =================================================
                          Status
                      ================================================= */}

                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            togglePoint(point)
                          }
                          disabled={
                            saving || deleting
                          }
                          className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition ${
                            point.is_active
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          } disabled:opacity-50`}
                        >
                          {point.is_active
                            ? "نشطة"
                            : "غير نشطة"}
                        </button>
                      </div>

                      {/* =================================================
                          Actions
                      ================================================= */}

                      <div className="flex items-center justify-center gap-2">
                        {/* الموقع */}

                        {point.latitude !== null &&
                          point.longitude !== null && (
                            <button
                              type="button"
                              onClick={() =>
                                openMap(point)
                              }
                              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary transition hover:bg-muted"
                              title="فتح الموقع"
                            >
                              <MapPin className="size-4" />

                              <span>
                                الموقع
                              </span>
                            </button>
                          )}

                        {/* تعديل */}

                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(point)
                          }
                          disabled={
                            saving || deleting
                          }
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary transition hover:bg-muted disabled:opacity-50"
                          title="تعديل"
                        >
                          <Edit3 className="size-4" />

                          <span>
                            تعديل
                          </span>
                        </button>

                        {/* حذف */}

                        <button
                          type="button"
                          onClick={() =>
                            deletePoint(point)
                          }
                          disabled={
                            deleting || saving
                          }
                          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-background px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          title="حذف"
                        >
                          <Trash2 className="size-4" />

                          <span>
                            حذف
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>
    </DashboardShell>
  );
}