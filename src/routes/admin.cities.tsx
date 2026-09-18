import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  MapPin,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, StatCard } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/cities")({
  head: () => ({
    meta: [
      {
        title: "المدن | لوحة الإدارة | أمانتي",
      },
      {
        name: "description",
        content: "إدارة المدن في نظام أمانتي.",
      },
    ],
  }),

  component: CitiesPage,
});

const nav = [
  {
    label: "نظرة عامة",
    icon: Building2,
    to: "/admin",
  },
  {
    label: "الشحنات",
    icon: Building2,
    to: "/admin/shipments",
  },
  {
    label: "الأمانات",
    icon: Building2,
    to: "/admin/amanat",
  },
  {
    label: "نقاط الاستلام",
    icon: MapPin,
    to: "/admin/pickup-points",
  },
  {
    label: "المدن",
    icon: Building2,
    to: "/admin/cities",
    active: true,
  },
];

type City = {
  id: string;
  name: string;
  created_at?: string | null;
};

function formatDate(value?: string | null) {
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

function CitiesPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [cityName, setCityName] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadCities() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("cities")
      .select("id,name,created_at")
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("CITIES DATABASE ERROR:", error);

      setErrorMessage(
        `Code: ${error.code ?? "غير معروف"}\nMessage: ${
          error.message ?? "حدث خطأ أثناء تحميل المدن."
        }`,
      );

      setCities([]);
      setLoading(false);
      return;
    }

    setCities(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCities();
  }, []);

  async function addCity() {
    const name = cityName.trim();

    if (!name) {
      setErrorMessage("اكتب اسم المدينة أولًا.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("cities")
      .insert({
        name,
      });

    if (error) {
      console.error("ADD CITY ERROR:", error);

      setErrorMessage(
        `تعذر إضافة المدينة.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setSaving(false);
      return;
    }

    setCityName("");
    setShowAddForm(false);
    setSaving(false);

    await loadCities();
  }

  async function deleteCity(city: City) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف مدينة "${city.name}"؟`,
    );

    if (!confirmed) return;

    setErrorMessage("");

    const { error } = await supabase
      .from("cities")
      .delete()
      .eq("id", city.id);

    if (error) {
      console.error("DELETE CITY ERROR:", error);

      setErrorMessage(
        `تعذر حذف المدينة.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      return;
    }

    await loadCities();
  }

  const filteredCities = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return cities;
    }

    return cities.filter((city) =>
      city.name.toLowerCase().includes(query),
    );
  }, [cities, search]);

  return (
    <DashboardShell
      title="المدن"
      subtitle="إدارة المدن التي تحتوي على نقاط استلام أمانتي."
      nav={nav}
    >
      {/* الإحصائيات */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        <StatCard
          label="إجمالي المدن"
          value={cities.length}
          icon={Building2}
          tone="navy"
        />

        <StatCard
          label="المدن الظاهرة"
          value={filteredCities.length}
          icon={MapPin}
          tone="teal"
        />
      </div>

      {/* الأدوات */}

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
              placeholder="ابحث عن مدينة..."
              className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setShowAddForm((value) => !value)
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="size-4" />
              إضافة مدينة
            </button>

            <button
              type="button"
              onClick={loadCities}
              disabled={loading}
              className="flex items-center justify-center rounded-xl border border-border bg-background px-4 py-3 text-primary transition hover:bg-muted disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw
                className={`size-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* نموذج إضافة مدينة */}

      {showAddForm && (
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-primary">
              إضافة مدينة جديدة
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              أضف المدينة التي ستستخدم لاحقًا مع نقاط
              الاستلام.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={cityName}
              onChange={(event) =>
                setCityName(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  addCity();
                }
              }}
              placeholder="مثال: صنعاء"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              disabled={saving}
            />

            <button
              type="button"
              onClick={addCity}
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "جاري الحفظ..." : "حفظ المدينة"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setCityName("");
              }}
              disabled={saving}
              className="rounded-xl bg-muted px-6 py-3 text-sm font-bold text-primary"
            >
              إلغاء
            </button>
          </div>
        </Card>
      )}

      {/* الخطأ */}

      {errorMessage && (
        <Card className="border-red-200 p-5">
          <div className="text-center">
            <p className="text-sm font-bold text-red-600">
              حدث خطأ
            </p>

            <pre className="mx-auto mt-3 max-w-2xl whitespace-pre-wrap rounded-xl bg-muted p-4 text-left text-xs leading-6 text-primary">
              {errorMessage}
            </pre>

            <button
              type="button"
              onClick={loadCities}
              className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
            >
              إعادة المحاولة
            </button>
          </div>
        </Card>
      )}

      {/* قائمة المدن */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-primary">
            قائمة المدن
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            جميع المدن المسجلة في قاعدة بيانات أمانتي.
          </p>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              جاري تحميل المدن...
            </div>
          ) : filteredCities.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Building2 className="mx-auto size-12 text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                لا توجد مدن
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                أضف أول مدينة باستخدام زر "إضافة مدينة".
              </p>
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[1.2fr_1.5fr_1fr_auto] gap-4 border-b border-border px-5 py-3 text-xs font-bold text-muted-foreground lg:grid">
                <span>المدينة</span>
                <span>المعرف</span>
                <span>تاريخ الإنشاء</span>
                <span>إجراء</span>
              </div>

              <div className="divide-y divide-border">
                {filteredCities.map((city) => (
                  <div
                    key={city.id}
                    className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_1.5fr_1fr_auto] lg:items-center lg:gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="size-5 text-primary" />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-primary">
                          {city.name}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          مدينة أمانتي
                        </p>
                      </div>
                    </div>

                    <p className="break-all font-mono text-xs text-muted-foreground">
                      {city.id}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {formatDate(city.created_at)}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteCity(city)}
                      className="flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 transition hover:bg-red-50"
                      title="حذف المدينة"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </section>
    </DashboardShell>
  );
}
