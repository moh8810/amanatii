 import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Edit3,
  Mail,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, StatCard } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/merchants")({
  head: () => ({
    meta: [
      {
        title: "التجار | لوحة الإدارة | أمانتي",
      },
      {
        name: "description",
        content:
          "إدارة ومتابعة التجار والمتاجر المسجلة في أمانتي.",
      },
    ],
  }),

  component: MerchantsPage,
});

const nav = [
  {
    label: "نظرة عامة",
    icon: Building2,
    to: "/admin",
  },
  {
    label: "الشحنات",
    icon: Store,
    to: "/admin/shipments",
  },
  {
    label: "الأمانات",
    icon: Store,
    to: "/admin/amanat",
  },
  {
    label: "التجار",
    icon: Users,
    to: "/admin/merchants",
    active: true,
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
  },
];

type City = {
  id: string;
  name: string;
};

type Merchant = {
  id: string;
  full_name: string;
  store_name: string;
  phone: string;
  email: string | null;
  city_id: string | null;
  address: string | null;
  business_type: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  cities?: {
    name: string;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MerchantsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingCities, setLoadingCities] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingMerchant, setEditingMerchant] =
    useState<Merchant | null>(null);

  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cityId, setCityId] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function loadCities() {
    setLoadingCities(true);

    const { data, error } = await supabase
      .from("cities")
      .select("id,name")
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("MERCHANT CITIES ERROR:", error);

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

  async function loadMerchants() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("merchants")
      .select(`
        id,
        full_name,
        store_name,
        phone,
        email,
        city_id,
        address,
        business_type,
        is_active,
        created_at,
        updated_at,
        cities (
          name
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("MERCHANTS ERROR:", error);

      setErrorMessage(
        `تعذر تحميل التجار.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setMerchants([]);
      setLoading(false);
      return;
    }

    setMerchants((data ?? []) as Merchant[]);
    setLoading(false);
  }

  async function loadAll() {
    await Promise.all([
      loadMerchants(),
      loadCities(),
    ]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function resetForm() {
    setFullName("");
    setStoreName("");
    setPhone("");
    setEmail("");
    setCityId("");
    setAddress("");
    setBusinessType("");
    setIsActive(true);

    setShowForm(false);
    setEditingMerchant(null);
  }

  function openAddForm() {
    setErrorMessage("");

    resetForm();

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openEditForm(merchant: Merchant) {
    setErrorMessage("");

    setEditingMerchant(merchant);

    setFullName(merchant.full_name ?? "");
    setStoreName(merchant.store_name ?? "");
    setPhone(merchant.phone ?? "");
    setEmail(merchant.email ?? "");
    setCityId(merchant.city_id ?? "");
    setAddress(merchant.address ?? "");
    setBusinessType(merchant.business_type ?? "");
    setIsActive(merchant.is_active);

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function validateForm() {
    if (!fullName.trim()) {
      return "اكتب اسم التاجر.";
    }

    if (!storeName.trim()) {
      return "اكتب اسم المتجر.";
    }

    if (!phone.trim()) {
      return "اكتب رقم هاتف التاجر.";
    }

    if (!cityId) {
      return "اختر المدينة.";
    }

    if (!address.trim()) {
      return "اكتب عنوان المتجر.";
    }

    if (email.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email.trim())) {
        return "البريد الإلكتروني غير صحيح.";
      }
    }

    return null;
  }

  async function saveMerchant() {
    setErrorMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      store_name: storeName.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      city_id: cityId,
      address: address.trim(),
      business_type: businessType.trim() || null,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };

    if (editingMerchant) {
      const { error } = await supabase
        .from("merchants")
        .update(payload)
        .eq("id", editingMerchant.id);

      if (error) {
        console.error(
          "UPDATE MERCHANT ERROR:",
          error,
        );

        setErrorMessage(
          `تعذر تعديل بيانات التاجر.\nCode: ${
            error.code ?? "غير معروف"
          }\nMessage: ${error.message ?? ""}`,
        );

        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("merchants")
        .insert(payload);

      if (error) {
        console.error(
          "ADD MERCHANT ERROR:",
          error,
        );

        setErrorMessage(
          `تعذر إضافة التاجر.\nCode: ${
            error.code ?? "غير معروف"
          }\nMessage: ${error.message ?? ""}`,
        );

        setSaving(false);
        return;
      }
    }

    setSaving(false);

    resetForm();

    await loadMerchants();
  }

  async function toggleMerchant(
    merchant: Merchant,
  ) {
    setErrorMessage("");

    const { error } = await supabase
      .from("merchants")
      .update({
        is_active: !merchant.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", merchant.id);

    if (error) {
      console.error(
        "TOGGLE MERCHANT ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر تغيير حالة التاجر.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      return;
    }

    await loadMerchants();
  }

  async function deleteMerchant(
    merchant: Merchant,
  ) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف التاجر "${merchant.full_name}"؟\n\nسيتم حذف بيانات التاجر من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("merchants")
      .delete()
      .eq("id", merchant.id);

    if (error) {
      console.error(
        "DELETE MERCHANT ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر حذف التاجر.\nCode: ${
          error.code ?? "غير معروف"
        }\nMessage: ${error.message ?? ""}`,
      );

      setDeleting(false);
      return;
    }

    setDeleting(false);

    if (editingMerchant?.id === merchant.id) {
      resetForm();
    }

    await loadMerchants();
  }

  const filteredMerchants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return merchants;
    }

    return merchants.filter((merchant) => {
      const cityName =
        merchant.cities?.name ?? "";

      return [
        merchant.full_name,
        merchant.store_name,
        merchant.phone,
        merchant.email ?? "",
        cityName,
        merchant.address ?? "",
        merchant.business_type ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [merchants, search]);

  const activeMerchants = merchants.filter(
    (merchant) => merchant.is_active,
  ).length;

  const inactiveMerchants =
    merchants.length - activeMerchants;

  const storeCount = new Set(
    merchants
      .map((merchant) =>
        merchant.store_name.trim().toLowerCase(),
      )
      .filter(Boolean),
  ).size;

  return (
    <DashboardShell
      title="التجار"
      subtitle="إدارة ومتابعة التجار والمتاجر المسجلة في أمانتي."
      nav={nav}
    >
      {/* الإحصائيات */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي التجار"
          value={merchants.length}
          icon={Users}
          tone="navy"
        />

        <StatCard
          label="التجار النشطون"
          value={activeMerchants}
          icon={CheckCircle2}
          tone="teal"
        />

        <StatCard
          label="التجار غير النشطين"
          value={inactiveMerchants}
          icon={XCircle}
          tone="amber"
        />

        <StatCard
          label="المتاجر"
          value={storeCount}
          icon={Store}
          tone="green"
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
              placeholder="ابحث باسم التاجر أو المتجر أو الهاتف أو المدينة..."
              className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openAddForm}
              disabled={saving || deleting}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" />
              إضافة تاجر
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
                  loading || loadingCities
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* نموذج الإضافة والتعديل */}

      {showForm && (
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {editingMerchant
                  ? "تعديل بيانات التاجر"
                  : "إضافة تاجر جديد"}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                {editingMerchant
                  ? "عدّل بيانات التاجر ثم احفظ التغييرات."
                  : "أدخل بيانات التاجر والمتجر لإضافته إلى أمانتي."}
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
            {/* اسم التاجر */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                اسم التاجر
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="مثال: محمد أحمد"
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* اسم المتجر */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                اسم المتجر
              </label>

              <input
                type="text"
                value={storeName}
                onChange={(event) =>
                  setStoreName(event.target.value)
                }
                placeholder="مثال: متجر الأمانة"
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
                dir="ltr"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* البريد */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                البريد الإلكتروني
                <span className="mr-1 text-xs font-normal text-muted-foreground">
                  اختياري
                </span>
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="merchant@example.com"
                  disabled={saving}
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
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

            {/* نوع النشاط */}

            <div>
              <label className="mb-2 block text-sm font-bold text-primary">
                نوع النشاط
                <span className="mr-1 text-xs font-normal text-muted-foreground">
                  اختياري
                </span>
              </label>

              <input
                type="text"
                value={businessType}
                onChange={(event) =>
                  setBusinessType(event.target.value)
                }
                placeholder="مثال: ملابس، إلكترونيات، أغذية..."
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* العنوان */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-primary">
                عنوان المتجر
              </label>

              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="مثال: صنعاء - شارع حدة - بجانب..."
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* الحالة */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold text-primary">
                حالة التاجر
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
                    ? "التاجر نشط"
                    : "التاجر غير نشط"}
                </span>

                {isActive ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <XCircle className="size-5" />
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveMerchant}
              disabled={saving}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? "جاري الحفظ..."
                : editingMerchant
                  ? "حفظ التعديلات"
                  : "حفظ التاجر"}
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

      {/* الأخطاء */}

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

      {/* قائمة التجار */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-primary">
            قائمة التجار
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            جميع التجار والمتاجر المسجلة في قاعدة بيانات أمانتي.
          </p>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              جاري تحميل التجار...
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <Users className="mx-auto size-12 text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                {search.trim()
                  ? "لا توجد نتائج"
                  : "لا يوجد تجار حتى الآن"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {search.trim()
                  ? "جرّب البحث بكلمة مختلفة."
                  : "لم تتم إضافة أي تاجر حتى الآن."}
              </p>
            </div>
          ) : (
            <>
              {/* رأس الجدول */}

              <div
                dir="rtl"
                className="hidden border-b border-border bg-muted/20 px-5 py-4 text-xs font-bold text-muted-foreground xl:grid xl:grid-cols-[1.5fr_1.3fr_1.3fr_1.1fr_auto] xl:items-center xl:gap-6"
              >
                <div>التاجر والمتجر</div>
                <div>المدينة والعنوان</div>
                <div>التواصل</div>
                <div>الحالة والنشاط</div>
                <div className="text-left">
                  الإجراءات
                </div>
              </div>

              {/* الصفوف */}

              <div className="divide-y divide-border">
                {filteredMerchants.map(
                  (merchant) => (
                    <div
                      key={merchant.id}
                      dir="rtl"
                      className="p-5 transition hover:bg-muted/20"
                    >
                      {/* نسخة سطح المكتب */}

                      <div className="hidden xl:grid xl:grid-cols-[1.5fr_1.3fr_1.3fr_1.1fr_auto] xl:items-center xl:gap-6">
                        {/* التاجر والمتجر */}

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                              <Users className="size-5 text-primary" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className="break-words text-sm font-bold leading-6 text-primary"
                                title={merchant.full_name}
                              >
                                {merchant.full_name}
                              </p>

                              <div className="mt-1 flex min-w-0 items-start gap-1.5">
                                <Store className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

                                <p
                                  className="break-words text-xs leading-5 text-muted-foreground"
                                  title={merchant.store_name}
                                >
                                  {merchant.store_name}
                                </p>
                              </div>

                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {formatDate(
                                  merchant.created_at,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* المدينة والعنوان */}

                        <div className="min-w-0">
                          <div className="flex min-w-0 items-start gap-2">
                            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                            <div className="min-w-0">
                              <p
                                className="break-words text-sm font-bold leading-5 text-primary"
                                title={
                                  merchant.cities?.name ??
                                  "غير محددة"
                                }
                              >
                                {merchant.cities?.name ??
                                  "غير محددة"}
                              </p>

                              <p
                                className="mt-1 break-words text-xs leading-5 text-muted-foreground"
                                title={
                                  merchant.address ??
                                  "غير محدد"
                                }
                              >
                                {merchant.address ??
                                  "غير محدد"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* التواصل */}

<div className="min-w-0">
  <div className="relative min-w-0">
    <p
      className="w-full truncate text-sm font-medium leading-6 text-primary"
      dir="ltr"
      title={merchant.phone}
    >
      {merchant.phone}
    </p>

    {merchant.email ? (
      <div className="relative mt-1 min-w-0">
        <Mail className="pointer-events-none absolute right-0 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

        <p
          className="w-full truncate pr-5 text-xs leading-5 text-muted-foreground"
          dir="ltr"
          title={merchant.email}
        >
          {merchant.email}
        </p>
      </div>
    ) : (
      <p className="mt-1 w-full truncate text-xs leading-5 text-muted-foreground">
        بدون بريد إلكتروني
      </p>
    )}
  </div>
</div>

                        {/* الحالة والنشاط */}

                        <div className="min-w-0 -ml-1">
                          <button
                            type="button"
                            onClick={() =>
                              toggleMerchant(
                                merchant,
                              )
                            }
                            disabled={
                              saving ||
                              deleting
                            }
                            className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                              merchant.is_active
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {merchant.is_active
                              ? "نشط"
                              : "غير نشط"}
                          </button>

                          {merchant.business_type && (
                            <p
                              className="mt-2 max-w-full break-words text-xs text-muted-foreground"
                              title={
                                merchant.business_type
                              }
                            >
                              {merchant.business_type}
                            </p>
                          )}
                        </div>

                        {/* الإجراءات */}

                        <div className="flex flex-col items-stretch gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                merchant,
                              )
                            }
                            disabled={deleting}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-primary transition hover:bg-muted disabled:opacity-50"
                          >
                            <Edit3 className="size-4" />
                            <span>تعديل</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteMerchant(
                                merchant,
                              )
                            }
                            disabled={deleting}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>

                      {/* نسخة الجوال / التابلت */}

                      <div className="xl:hidden">
                        <div className="flex items-start gap-3">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <Users className="size-5 text-primary" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-bold leading-6 text-primary">
                              {merchant.full_name}
                            </p>

                            <div className="mt-1 flex items-start gap-1.5">
                              <Store className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

                              <p className="break-words text-xs leading-5 text-muted-foreground">
                                {merchant.store_name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          {/* المدينة والعنوان */}

                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                              المدينة والعنوان
                            </p>

                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                              <div className="min-w-0">
                                <p className="break-words text-sm font-bold text-primary">
                                  {merchant.cities?.name ??
                                    "غير محددة"}
                                </p>

                                <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                                  {merchant.address ??
                                    "غير محدد"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* التواصل */}

                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                              التواصل
                            </p>

                            <p
                              className="break-all text-sm font-medium text-primary"
                              dir="ltr"
                            >
                              {merchant.phone}
                            </p>

                            {merchant.email && (
                              <p
                                className="mt-1 break-all text-xs text-muted-foreground"
                                dir="ltr"
                              >
                                {merchant.email}
                              </p>
                            )}
                          </div>

                          {/* الحالة والنشاط */}

                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                              الحالة والنشاط
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleMerchant(
                                    merchant,
                                  )
                                }
                                disabled={
                                  saving ||
                                  deleting
                                }
                                className={`rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-50 ${
                                  merchant.is_active
                                    ? "bg-green-50 text-green-700"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {merchant.is_active
                                  ? "نشط"
                                  : "غير نشط"}
                              </button>

                              {merchant.business_type && (
                                <span className="break-words rounded-xl bg-primary/5 px-3 py-2 text-xs font-medium text-primary">
                                  {merchant.business_type}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* الإجراءات */}

                          <div className="rounded-xl border border-border bg-background p-4">
                            <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                              الإجراءات
                            </p>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    merchant,
                                  )
                                }
                                disabled={deleting}
                                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-bold text-primary transition hover:bg-muted disabled:opacity-50"
                              >
                                <Edit3 className="size-4" />
                                تعديل
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteMerchant(
                                    merchant,
                                  )
                                }
                                disabled={deleting}
                                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="size-4" />
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-[10px] text-muted-foreground">
                          أضيف في{" "}
                          {formatDate(
                            merchant.created_at,
                          )}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </>
          )}
        </Card>
      </section>
    </DashboardShell>
  );
}