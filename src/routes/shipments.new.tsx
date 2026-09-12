import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Package,
  Phone,
  User,
  Mail,
  FileText,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, buttonClass } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/shipments/new")({
  head: () => ({
    meta: [
      {
        title: "إرسال شحنة | أمانتي AMANATI",
      },
      {
        name: "description",
        content: "إرسال شحنة جديدة عبر أمانتي.",
      },
    ],
  }),
  component: NewShipmentPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type City = {
  id: string;
  name: string;
};

type PickupPoint = {
  id: string;
  name: string;
  city_id: string;
  address: string | null;
};

function generateTrackingNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `AM-${timestamp}-${random}`;
}

function NewShipmentPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [cities, setCities] = useState<City[]>([]);

  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [
    createdTrackingNumber,
    setCreatedTrackingNumber,
  ] = useState("");

  const [receiverName, setReceiverName] = useState("");

  const [receiverPhone, setReceiverPhone] = useState("");

  const [receiverEmail, setReceiverEmail] = useState("");

  const [fromCityId, setFromCityId] = useState("");

  const [toCityId, setToCityId] = useState("");

  const [pickupPointId, setPickupPointId] = useState("");

  const [description, setDescription] = useState("");

  const [notes, setNotes] = useState("");

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  /*
   * =========================================================
   * تحميل بيانات المستخدم والمدن ونقاط التسليم
   * =========================================================
   */

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("يجب تسجيل الدخول أولاً لإرسال شحنة.");

        setLoading(false);
        return;
      }

      const [
        profileResult,
        citiesResult,
        pickupResult,
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,full_name,phone,email")
          .eq("id", user.id)
          .single(),

        supabase
          .from("cities")
          .select("id,name")
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("pickup_points")
          .select("id,name,city_id,address")
          .eq("is_active", true)
          .order("name", {
            ascending: true,
          }),
      ]);

      if (profileResult.error) {
        console.error(
          "PROFILE ERROR:",
          profileResult.error,
        );

        setError(
          "تعذر تحميل بيانات حسابك. تأكد من وجود ملفك الشخصي.",
        );

        setLoading(false);
        return;
      }

      if (citiesResult.error) {
        console.error(
          "CITIES ERROR:",
          citiesResult.error,
        );

        setError("تعذر تحميل قائمة المدن.");

        setLoading(false);
        return;
      }

      if (pickupResult.error) {
        console.error(
          "PICKUP POINTS ERROR:",
          pickupResult.error,
        );

        setError("تعذر تحميل نقاط التسليم.");

        setLoading(false);
        return;
      }

      setProfile(profileResult.data as Profile);

      setCities((citiesResult.data ?? []) as City[]);

      setPickupPoints(
        (pickupResult.data ?? []) as PickupPoint[],
      );

      setLoading(false);
    }

    loadData();
  }, []);

  /*
   * =========================================================
   * نقاط التسليم الخاصة بمدينة الوصول
   * =========================================================
   */

  const filteredPickupPoints = useMemo(() => {
    if (!toCityId) {
      return [];
    }

    return pickupPoints.filter(
      (point) => point.city_id === toCityId,
    );
  }, [pickupPoints, toCityId]);

  /*
   * عند تغيير مدينة الوصول
   * يتم إلغاء نقطة التسليم السابقة.
   */

  useEffect(() => {
    setPickupPointId("");
  }, [toCityId]);

  /*
   * =========================================================
   * اختيار الصور
   * =========================================================
   */

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    if (selectedImages.length + files.length > 3) {
      setError("يمكنك رفع 3 صور كحد أقصى للشحنة.");

      event.target.value = "";
      return;
    }

    const invalidFile = files.find(
      (file) => !file.type.startsWith("image/"),
    );

    if (invalidFile) {
      setError("يسمح برفع الصور فقط.");

      event.target.value = "";
      return;
    }

    const oversizedFile = files.find(
      (file) => file.size > 5 * 1024 * 1024,
    );

    if (oversizedFile) {
      setError(
        "حجم الصورة الواحدة يجب ألا يتجاوز 5 ميجابايت.",
      );

      event.target.value = "";
      return;
    }

    setSelectedImages((current) => [
      ...current,
      ...files,
    ]);

    event.target.value = "";
  }

  /*
   * حذف صورة قبل إرسال الشحنة
   */

  function removeImage(index: number) {
    setSelectedImages((current) =>
      current.filter(
        (_, imageIndex) => imageIndex !== index,
      ),
    );
  }

  /*
   * =========================================================
   * التحقق من النموذج
   * =========================================================
   */

  function validateForm() {
    if (!profile) {
      return "تعذر تحميل بيانات المرسل.";
    }

    if (!profile.full_name?.trim()) {
      return "اسمك غير موجود في ملفك الشخصي. أكمل بيانات حسابك أولاً.";
    }

    if (!profile.phone?.trim()) {
      return "رقم هاتفك غير موجود في ملفك الشخصي. أكمل بيانات حسابك أولاً.";
    }

    if (!receiverName.trim()) {
      return "اكتب اسم المستلم.";
    }

    if (!receiverPhone.trim()) {
      return "اكتب رقم هاتف المستلم.";
    }

    if (receiverEmail.trim()) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(receiverEmail.trim())) {
        return "البريد الإلكتروني للمستلم غير صحيح.";
      }
    }

    if (!fromCityId) {
      return "اختر مدينة الإرسال.";
    }

    if (!toCityId) {
      return "اختر مدينة الوصول.";
    }

    if (!pickupPointId) {
      return "اختر نقطة التسليم.";
    }

    if (!description.trim()) {
      return "اكتب وصف الشحنة.";
    }

    if (selectedImages.length === 0) {
      return "يجب رفع صورة واحدة على الأقل للشحنة.";
    }

    if (selectedImages.length > 3) {
      return "يمكنك رفع 3 صور كحد أقصى.";
    }

    return null;
  }

  /*
   * =========================================================
   * رفع الصور
   * =========================================================
   */

  async function uploadImages(trackingNumber: string) {
    const imagePaths: string[] = [];

    for (
      let index = 0;
      index < selectedImages.length;
      index++
    ) {
      const file = selectedImages[index];

      const extension =
        file.name.split(".").pop()?.toLowerCase() ||
        "jpg";

      const filePath =
        `shipments/${profile?.id}/${trackingNumber}/${index + 1}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from("amanati-images")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(
          "SHIPMENT IMAGE UPLOAD ERROR:",
          uploadError,
        );

        if (imagePaths.length > 0) {
          await supabase.storage
            .from("amanati-images")
            .remove(imagePaths);
        }

        throw new Error(
          "تعذر رفع صور الشحنة. حاول مرة أخرى.",
        );
      }

      imagePaths.push(filePath);
    }

    return imagePaths;
  }

  /*
   * =========================================================
   * إنشاء الشحنة
   * =========================================================
   */

  async function submitShipment() {
    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!profile) {
      setError("تعذر تحميل بيانات المرسل.");
      return;
    }

    setSaving(true);

    let imagePaths: string[] = [];

    try {
      const trackingNumber = generateTrackingNumber();

      imagePaths = await uploadImages(trackingNumber);

      const payload = {
        tracking_number: trackingNumber,

        sender_id: profile.id,

        sender_type: "user",

        sender_name:
          profile.full_name?.trim() || null,

        sender_phone:
          profile.phone?.trim() || null,

        sender_email:
          profile.email?.trim() || null,

        receiver_name: receiverName.trim(),

        receiver_phone: receiverPhone.trim(),

        receiver_email:
          receiverEmail.trim() || null,

        from_city_id: fromCityId,

        to_city_id: toCityId,

        pickup_point_id: pickupPointId,

        status: "pending",

        description:
          description.trim() || null,

        notes: notes.trim() || null,

        shipping_fee: null,

        pricing_status: "pending",

        payment_status: "unpaid",

        image_urls: imagePaths,

        updated_at: new Date().toISOString(),
      };

      const { error: insertError } =
        await supabase
          .from("shipments")
          .insert(payload);

      if (insertError) {
        console.error(
          "CREATE SHIPMENT ERROR:",
          insertError,
        );

        if (imagePaths.length > 0) {
          await supabase.storage
            .from("amanati-images")
            .remove(imagePaths);
        }

        throw new Error(
          `تعذر إنشاء الشحنة.\nCode: ${
            insertError.code ?? "غير معروف"
          }\nMessage: ${
            insertError.message ??
            "حدث خطأ غير معروف."
          }`,
        );
      }

      setCreatedTrackingNumber(
        trackingNumber,
      );

      setSuccess(
        "تم إنشاء الشحنة بنجاح.",
      );

      setReceiverName("");
      setReceiverPhone("");
      setReceiverEmail("");
      setFromCityId("");
      setToCityId("");
      setPickupPointId("");
      setDescription("");
      setNotes("");
      setSelectedImages([]);
    } catch (error) {
      console.error(
        "CREATE SHIPMENT FAILED:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الشحنة.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * التحميل
   * =========================================================
   */

  if (loading) {
    return (
      <DashboardShell
        title="إرسال شحنة"
        subtitle="إنشاء شحنة جديدة عبر أمانتي."
        nav={[]}
      >
        <Card className="p-5 text-center sm:p-10">
          <Loader2 className="mx-auto size-8 animate-spin text-primary" />

          <p className="mt-4 text-sm font-bold text-primary">
            جاري تحميل بياناتك...
          </p>
        </Card>
      </DashboardShell>
    );
  }

  /*
   * =========================================================
   * الواجهة
   * =========================================================
   */

  return (
    <DashboardShell
      title="إرسال شحنة"
      subtitle="أرسل بيانات الشحنة وصورها وسيتم تحديد رسوم الشحن من قبل إدارة أمانتي."
      nav={[]}
    >
      <div className="mx-auto w-full min-w-0 max-w-4xl">
        <Card className="w-full min-w-0 overflow-hidden">

          {/* =================================================
              العنوان
          ================================================== */}

          <div className="border-b border-border bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">

              <Link
                to="/dashboard"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary transition hover:bg-muted"
                title="العودة"
              >
                <ArrowRight className="size-5" />
              </Link>

              <div className="min-w-0 flex-1">
                <h2 className="break-words text-base font-extrabold text-primary sm:text-lg">
                  إرسال شحنة جديدة
                </h2>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  بياناتك ستُستخدم تلقائيًا كبيانات المرسل.
                </p>
              </div>

            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-6">

            {/* =================================================
                الخطأ
            ================================================== */}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 sm:mb-6 sm:p-4">
                <p className="whitespace-pre-wrap break-words text-sm font-bold leading-6 text-red-600">
                  {error}
                </p>
              </div>
            )}

            {/* =================================================
                النجاح
            ================================================== */}

            {success && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:mb-6 sm:p-5">

                <div className="flex items-start gap-3">

                  <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600" />

                  <div className="min-w-0 flex-1">

                    <p className="break-words text-sm font-extrabold text-green-700">
                      {success}
                    </p>

                    <p className="mt-2 text-xs text-green-700">
                      رقم الشحنة:
                    </p>

                    <p
                      className="mt-1 break-all font-mono text-base font-extrabold tracking-wide text-green-800 sm:text-lg"
                      dir="ltr"
                    >
                      {createdTrackingNumber}
                    </p>

                    <p className="mt-3 text-xs leading-6 text-green-700">
                      تم استلام بيانات الشحنة والصور.
                      ستقوم إدارة أمانتي بمراجعتها وتحديد رسوم الشحن.
                      سيظهر السعر تلقائيًا في حسابك بعد اعتماده.
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">

                      <Link
                        to="/dashboard"
                        className={`${buttonClass(
                          "primary",
                          "sm",
                        )} w-full justify-center sm:w-auto`}
                      >
                        العودة للوحة التحكم
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setSuccess("");
                          setCreatedTrackingNumber("");
                        }}
                        className="w-full rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold text-primary hover:bg-muted sm:w-auto"
                      >
                        إرسال شحنة أخرى
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            )}

            {!success && (
              <>

                {/* =================================================
                    بيانات المرسل
                ================================================== */}

                <section>

                  <div className="mb-4">

                    <h3 className="text-base font-extrabold text-primary">
                      بيانات المرسل
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      هذه البيانات مأخوذة تلقائيًا من حسابك.
                    </p>

                  </div>

                  <div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2">

                    <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4">

                      <div className="flex min-w-0 items-start gap-3">

                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <User className="size-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-xs text-muted-foreground">
                            اسم المرسل
                          </p>

                          <p className="mt-1 break-words text-sm font-extrabold text-primary">
                            {profile?.full_name ||
                              "غير موجود"}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4">

                      <div className="flex min-w-0 items-start gap-3">

                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Phone className="size-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-xs text-muted-foreground">
                            رقم هاتف المرسل
                          </p>

                          <p
                            className="mt-1 break-all text-sm font-extrabold text-primary"
                            dir="ltr"
                          >
                            {profile?.phone ||
                              "غير موجود"}
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                </section>

                {/* =================================================
                    بيانات المستلم
                ================================================== */}

                <section className="mt-7 sm:mt-8">

                  <div className="mb-4">

                    <h3 className="text-base font-extrabold text-primary">
                      بيانات المستلم
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      أدخل بيانات الشخص الذي سيستلم الشحنة.
                    </p>

                  </div>

                  <div className="grid min-w-0 gap-4 md:grid-cols-2">

                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-bold text-primary">
                        اسم المستلم
                      </label>

                      <div className="relative">

                        <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type="text"
                          value={receiverName}
                          onChange={(event) =>
                            setReceiverName(
                              event.target.value,
                            )
                          }
                          placeholder="مثال: أحمد محمد"
                          disabled={saving}
                          className="box-border w-full min-w-0 rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                        />

                      </div>

                    </div>

                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-bold text-primary">
                        رقم هاتف المستلم
                      </label>

                      <div className="relative">

                        <Phone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type="tel"
                          value={receiverPhone}
                          onChange={(event) =>
                            setReceiverPhone(
                              event.target.value,
                            )
                          }
                          placeholder="مثال: 777000000"
                          disabled={saving}
                          dir="ltr"
                          className="box-border w-full min-w-0 rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                        />

                      </div>

                    </div>

                    <div className="min-w-0 md:col-span-2">

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
                          value={receiverEmail}
                          onChange={(event) =>
                            setReceiverEmail(
                              event.target.value,
                            )
                          }
                          placeholder="receiver@example.com"
                          disabled={saving}
                          dir="ltr"
                          className="box-border w-full min-w-0 rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                        />

                      </div>

                    </div>

                  </div>

                </section>

                {/* =================================================
                    تفاصيل الشحنة
                ================================================== */}

                <section className="mt-7 sm:mt-8">

                  <div className="mb-4">

                    <h3 className="text-base font-extrabold text-primary">
                      تفاصيل الشحنة
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      حدد مدينة الإرسال ومدينة الوصول ونقطة التسليم.
                    </p>

                  </div>

                  <div className="grid min-w-0 gap-4 md:grid-cols-2">

                    {/* مدينة الإرسال */}

                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-bold text-primary">
                        مدينة الإرسال
                      </label>

                      <select
                        value={fromCityId}
                        onChange={(event) =>
                          setFromCityId(
                            event.target.value,
                          )
                        }
                        disabled={saving}
                        className="box-border w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      >

                        <option value="">
                          اختر مدينة الإرسال
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

                    {/* مدينة الوصول */}

                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-bold text-primary">
                        مدينة الوصول
                      </label>

                      <select
                        value={toCityId}
                        onChange={(event) =>
                          setToCityId(
                            event.target.value,
                          )
                        }
                        disabled={saving}
                        className="box-border w-full min-w-0 rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      >

                        <option value="">
                          اختر مدينة الوصول
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

                    {/* نقطة التسليم */}

                    <div className="min-w-0 md:col-span-2">

                      <label className="mb-2 block text-sm font-bold text-primary">
                        نقطة التسليم
                      </label>

                      <div className="relative">

                        <MapPin className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <select
                          value={pickupPointId}
                          onChange={(event) =>
                            setPickupPointId(
                              event.target.value,
                            )
                          }
                          disabled={
                            saving ||
                            !toCityId
                          }
                          className="box-border w-full min-w-0 appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                        >

                          <option value="">
                            {!toCityId
                              ? "اختر مدينة الوصول أولاً"
                              : filteredPickupPoints.length ===
                                  0
                                ? "لا توجد نقاط تسليم لهذه المدينة"
                                : "اختر نقطة التسليم"}
                          </option>

                          {filteredPickupPoints.map(
                            (point) => (
                              <option
                                key={point.id}
                                value={point.id}
                              >
                                {point.name}
                                {point.address
                                  ? ` — ${point.address}`
                                  : ""}
                              </option>
                            ),
                          )}

                        </select>

                      </div>

                    </div>

                    {/* وصف الشحنة */}

                    <div className="min-w-0">

                      <label className="mb-2 block text-sm font-bold text-primary">

                        وصف الشحنة

                        <span className="mr-1 text-xs font-normal text-muted-foreground">
                          اختياري
                        </span>

                      </label>

                      <div className="relative">

                        <FileText className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type="text"
                          value={description}
                          onChange={(event) =>
                            setDescription(
                              event.target.value,
                            )
                          }
                          placeholder="مثال: ملابس، وثائق، أجهزة..."
                          disabled={saving}
                          className="box-border w-full min-w-0 rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                        />

                      </div>

                    </div>

                    {/* ملاحظات */}

                    <div className="min-w-0 md:col-span-2">

                      <label className="mb-2 block text-sm font-bold text-primary">

                        ملاحظات

                        <span className="mr-1 text-xs font-normal text-muted-foreground">
                          اختياري
                        </span>

                      </label>

                      <textarea
                        value={notes}
                        onChange={(event) =>
                          setNotes(
                            event.target.value,
                          )
                        }
                        placeholder="أي ملاحظات إضافية..."
                        disabled={saving}
                        rows={3}
                        className="box-border w-full min-w-0 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                      />

                    </div>

                  </div>

                </section>

                {/* =================================================
                    صور الشحنة
                ================================================== */}

                <section className="mt-7 sm:mt-8">

                  <div className="mb-4">

                    <h3 className="text-base font-extrabold text-primary">
                      صور الشحنة
                    </h3>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      ارفع من صورة واحدة إلى 3 صور كحد أقصى حتى تتمكن إدارة أمانتي من مراجعة الشحنة وتحديد رسوم الشحن.
                    </p>

                  </div>

                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-3.5 sm:p-5">

                    <label
                      htmlFor="shipment-images"
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-background px-4 py-7 text-center transition hover:bg-muted/30 sm:px-5 sm:py-8"
                    >

                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 sm:size-12">
                        <ImagePlus className="size-6 text-primary" />
                      </div>

                      <p className="mt-3 text-sm font-bold text-primary">
                        اختر صور الشحنة
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        الحد الأقصى 3 صور — 5MB للصورة
                      </p>

                      <input
                        id="shipment-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        disabled={
                          saving ||
                          selectedImages.length >= 3
                        }
                        className="hidden"
                      />

                    </label>

                    {/* معاينة الصور */}

                    {selectedImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3">

                        {selectedImages.map(
                          (file, index) => {
                            const previewUrl =
                              URL.createObjectURL(
                                file,
                              );

                            return (
                              <div
                                key={`${file.name}-${index}`}
                                className="relative min-w-0 overflow-hidden rounded-xl border border-border bg-background"
                              >

                                <img
                                  src={previewUrl}
                                  alt={`صورة الشحنة ${index + 1}`}
                                  className="h-44 w-full object-cover sm:h-40"
                                  onLoad={() =>
                                    URL.revokeObjectURL(
                                      previewUrl,
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      index,
                                    )
                                  }
                                  disabled={saving}
                                  className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                                  title="حذف الصورة"
                                >
                                  <X className="size-4" />
                                </button>

                                <div className="min-w-0 px-3 py-2">

                                  <p className="text-xs font-bold text-primary">
                                    الصورة {index + 1}
                                  </p>

                                  <p className="truncate text-[10px] text-muted-foreground">
                                    {file.name}
                                  </p>

                                </div>

                              </div>
                            );
                          },
                        )}

                      </div>
                    )}

                  </div>

                </section>

                {/* =================================================
                    الرسوم
                ================================================== */}

                <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3.5 sm:mt-6 sm:p-4">

                  <p className="text-sm font-bold text-primary">
                    رسوم الشحن
                  </p>

                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    لا يتم احتساب أو عرض أي رسوم شحن عند إنشاء الشحنة.
                    ستقوم إدارة أمانتي بمراجعة الصور وتحديد الرسوم لاحقًا.
                    بعد اعتماد السعر سيظهر تلقائيًا في حسابك، ويمكنك عندها إتمام الدفع.
                  </p>

                </div>

                {/* =================================================
                    الأزرار
                ================================================== */}

                <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:mt-8 sm:flex-row sm:flex-wrap sm:pt-6">

                  <button
                    type="button"
                    onClick={submitShipment}
                    disabled={
                      saving ||
                      selectedImages.length === 0
                    }
                    className={`${buttonClass(
                      "primary",
                      "md",
                    )} w-full justify-center sm:w-auto`}
                  >

                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Package className="size-4" />
                    )}

                    {saving
                      ? "جاري إنشاء الشحنة..."
                      : "إرسال الشحنة"}

                  </button>

                  <Link
                    to="/dashboard"
                    className="flex w-full items-center justify-center rounded-xl border border-border bg-muted px-5 py-3 text-sm font-bold text-primary transition hover:bg-muted/70 sm:w-auto"
                  >
                    إلغاء
                  </Link>

                </div>

              </>
            )}

          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}