import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ImagePlus,
  MapPin,
  Package,
  Phone,
  Save,
  User,
  X,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/amanat/new")({
  head: () => ({
    meta: [
      {
        title: "إضافة أمانة | أمانتي",
      },
      {
        name: "description",
        content: "إضافة أمانة جديدة إلى أمانتي.",
      },
    ],
  }),
  component: NewAmanatPage,
});

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type PickupPoint = {
  id: string;
  name: string;
  city_id: string;
  address: string | null;
  is_active?: boolean;
};

function generateReferenceNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `AMN-${timestamp}-${random}`;
}

function NewAmanatPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mainPickupPoint, setMainPickupPoint] =
    useState<PickupPoint | null>(null);

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedImages, setSelectedImages] =
    useState<File[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successReference, setSuccessReference] =
    useState("");

  /*
   * تحميل بيانات المستخدم + مركز أمانتي الرئيسي في تعز
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
        setError("يجب تسجيل الدخول أولاً.");
        setLoading(false);
        return;
      }

      /*
       * بيانات الحساب
       */
      const profileResult = await supabase
        .from("profiles")
        .select("id,full_name,phone,email")
        .eq("id", user.id)
        .maybeSingle();

      if (profileResult.error) {
        console.error(
          "PROFILE ERROR:",
          profileResult.error,
        );

        setError(
          "تعذر تحميل بيانات حسابك.",
        );

        setLoading(false);
        return;
      }

      /*
       * الحصول على مدينة تعز
       */
      const taizCityResult = await supabase
        .from("cities")
        .select("id,name")
        .ilike("name", "%تعز%")
        .limit(10);

      if (taizCityResult.error) {
        console.error(
          "TAIZ CITY ERROR:",
          taizCityResult.error,
        );

        setError(
          "تعذر العثور على مدينة تعز.",
        );

        setLoading(false);
        return;
      }

      const taizCity =
        taizCityResult.data?.find(
          (city) =>
            city.name
              ?.trim()
              .includes("تعز"),
        );

      if (!taizCity) {
        setError(
          "لم يتم العثور على مدينة تعز في قاعدة البيانات.",
        );

        setLoading(false);
        return;
      }

      /*
       * البحث عن مركز أمانتي الرئيسي في تعز.
       *
       * نعتمد على:
       * 1. المدينة = تعز
       * 2. النقطة فعالة
       * 3. العنوان أو الاسم يشير إلى المركز الرئيسي
       */
      const pickupResult = await supabase
        .from("pickup_points")
        .select(
          "id,name,city_id,address,is_active",
        )
        .eq("city_id", taizCity.id)
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        });

      if (pickupResult.error) {
        console.error(
          "PICKUP POINT ERROR:",
          pickupResult.error,
        );

        setError(
          "تعذر تحميل مركز أمانتي في تعز.",
        );

        setLoading(false);
        return;
      }

      const pickupPoints =
        (pickupResult.data ??
          []) as PickupPoint[];

      /*
       * نحاول العثور على المركز الرئيسي.
       */
      const mainPoint =
        pickupPoints.find((point) => {
          const name =
            point.name?.toLowerCase() ?? "";

          const address =
            point.address?.toLowerCase() ?? "";

          return (
            name.includes("رئيسي") ||
            name.includes("الرئيسية") ||
            address.includes("الأدوية") ||
            address.includes("الادوية")
          );
        }) ?? null;

      if (!mainPoint) {
        setError(
          "لم يتم العثور على مركز أمانتي الرئيسي في تعز. تأكد من أن نقطة المركز مفعّلة وأن عنوانها يحتوي على شارع الأدوية.",
        );

        setLoading(false);
        return;
      }

      setProfile(
        profileResult.data as Profile | null,
      );

      setMainPickupPoint(mainPoint);

      setLoading(false);
    }

    loadData();
  }, []);

  /*
   * اختيار الصور
   */
  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const files = Array.from(
      event.target.files ?? [],
    );

    if (files.length === 0) {
      return;
    }

    /*
     * الحد الأقصى 3 صور
     */
    if (
      selectedImages.length +
        files.length >
      3
    ) {
      setError(
        "يمكنك رفع 3 صور كحد أقصى للأمانة.",
      );

      event.target.value = "";
      return;
    }

    /*
     * التحقق من نوع الملفات
     */
    const invalidFile = files.find(
      (file) =>
        !file.type.startsWith("image/"),
    );

    if (invalidFile) {
      setError(
        "يسمح برفع الصور فقط.",
      );

      event.target.value = "";
      return;
    }

    /*
     * الحد الأقصى لحجم الصورة الواحدة:
     * 5MB
     */
    const oversizedFile = files.find(
      (file) =>
        file.size >
        5 * 1024 * 1024,
    );

    if (oversizedFile) {
      setError(
        "حجم الصورة الواحدة يجب ألا يتجاوز 5 ميجابايت.",
      );

      event.target.value = "";
      return;
    }

    setSelectedImages(
      (current) => [
        ...current,
        ...files,
      ],
    );

    event.target.value = "";
  }

  /*
   * حذف صورة قبل الإرسال
   */
  function removeImage(index: number) {
    setSelectedImages(
      (current) =>
        current.filter(
          (_, imageIndex) =>
            imageIndex !== index,
        ),
    );
  }

  function validateForm() {
    if (!profile) {
      return "تعذر تحميل بيانات حسابك.";
    }

    if (!profile.full_name?.trim()) {
      return "اسمك غير موجود في ملفك الشخصي. أكمل بيانات حسابك أولاً.";
    }

    if (!profile.phone?.trim()) {
      return "رقم هاتفك غير موجود في ملفك الشخصي. أكمل بيانات حسابك أولاً.";
    }

    if (!mainPickupPoint) {
      return "لم يتم تحديد مركز أمانتي الرئيسي في تعز.";
    }

    if (!receiverName.trim()) {
      return "اكتب اسم المستلم.";
    }

    if (!receiverPhone.trim()) {
      return "اكتب رقم هاتف المستلم.";
    }

    if (!description.trim()) {
      return "اكتب وصف الأمانة.";
    }

    if (selectedImages.length === 0) {
      return "يجب رفع صورة واحدة على الأقل للأمانة.";
    }

    if (selectedImages.length > 3) {
      return "يمكنك رفع 3 صور كحد أقصى.";
    }

    return null;
  }

  async function uploadImages(
    referenceNumber: string,
  ) {
    const imagePaths: string[] = [];

    for (
      let index = 0;
      index < selectedImages.length;
      index++
    ) {
      const file =
        selectedImages[index];

      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const filePath =
        `amanat/${profile?.id}/${referenceNumber}/${index + 1}-${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("amanati-images")
        .upload(
          filePath,
          file,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              file.type,
          },
        );

      if (uploadError) {
        console.error(
          "IMAGE UPLOAD ERROR:",
          uploadError,
        );

        /*
         * محاولة حذف الصور التي تم رفعها
         * إذا فشلت إحدى الصور.
         */
        if (
          imagePaths.length > 0
        ) {
          await supabase.storage
            .from("amanati-images")
            .remove(imagePaths);
        }

        throw new Error(
          "تعذر رفع صور الأمانة. حاول مرة أخرى.",
        );
      }

      /*
       * نخزن المسار وليس Public URL
       * لأن الـBucket خاص Private.
       */
      imagePaths.push(filePath);
    }

    return imagePaths;
  }

  async function createAmanat() {
    setError("");
    setSuccessReference("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (!profile) {
      setError(
        "تعذر تحميل بيانات حسابك.",
      );
      return;
    }

    if (!mainPickupPoint) {
      setError(
        "لم يتم تحديد مركز أمانتي الرئيسي.",
      );
      return;
    }

    setSaving(true);

    let imagePaths: string[] = [];

    try {
      const referenceNumber =
        generateReferenceNumber();

      /*
       * رفع الصور أولاً
       */
      imagePaths =
        await uploadImages(
          referenceNumber,
        );

      /*
       * إنشاء الأمانة
       *
       * السعر NULL:
       * الإدارة تحدده لاحقًا.
       */
      const payload = {
        reference_number:
          referenceNumber,

        owner_id:
          profile.id,

        receiver_name:
          receiverName.trim(),

        receiver_phone:
          receiverPhone.trim(),

        pickup_point_id:
          mainPickupPoint.id,

        status: "stored",

        description:
          description.trim(),

        notes:
          notes.trim() || null,

        storage_fee: null,

        pricing_status:
          "pending",

        payment_status:
          "unpaid",

        image_urls:
          imagePaths,
      };

      const {
        error: insertError,
      } = await supabase
        .from("amanat")
        .insert(payload);

      if (insertError) {
        console.error(
          "CREATE AMANAT ERROR:",
          insertError,
        );

        /*
         * حذف الصور إذا فشل إنشاء سجل الأمانة.
         */
        if (
          imagePaths.length > 0
        ) {
          await supabase.storage
            .from("amanati-images")
            .remove(imagePaths);
        }

        throw new Error(
          `تعذر إنشاء الأمانة.\nCode: ${
            insertError.code ??
            "غير معروف"
          }\nMessage: ${
            insertError.message ??
            "حدث خطأ غير معروف."
          }`,
        );
      }

      setSuccessReference(
        referenceNumber,
      );

      /*
       * تنظيف النموذج
       */
      setReceiverName("");
      setReceiverPhone("");
      setDescription("");
      setNotes("");
      setSelectedImages([]);

    } catch (error) {
      console.error(
        "CREATE AMANAT FAILED:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء إنشاء الأمانة.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardShell
        title="إضافة أمانة"
        subtitle="إضافة أمانة جديدة إلى أمانتي."
        nav={[]}
      >
        <Card className="p-6 sm:p-10 text-center">
          <Clock3 className="mx-auto size-9 animate-pulse text-muted-foreground" />

          <p className="mt-4 text-sm font-bold text-primary">
            جاري تحميل بياناتك...
          </p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="إضافة أمانة"
      subtitle="أرسل بيانات الأمانة وصورها وسيتم تحديد الرسوم من قبل إدارة أمانتي."
      nav={[
        {
          label: "لوحة التحكم",
          icon: Package,
          to: "/dashboard",
        },
      ]}
    >
      <div className="mx-auto w-full max-w-4xl min-w-0">
        <Card className="w-full min-w-0 overflow-hidden">

          {/* العنوان */}

          <div className="border-b border-border bg-muted/20 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 sm:size-11">
                <Package className="size-5 text-primary" />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-primary sm:text-lg">
                  تسجيل أمانة جديدة
                </h2>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  ارفع صور الأمانة وسيتم مراجعتها وتحديد الرسوم من الإدارة.
                </p>
              </div>
            </div>
          </div>

          <div className="min-w-0 p-4 sm:p-6">

            {/* الخطأ */}

            {error && (
              <div className="mb-5 overflow-hidden rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-bold leading-6 text-red-600 sm:mb-6 sm:p-4">
                <div className="break-words whitespace-pre-wrap">
                  {error}
                </div>
              </div>
            )}

            {/* النجاح */}

            {successReference && (
              <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 sm:mb-6 sm:p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-green-600" />

                  <div className="min-w-0">
                    <p className="font-bold text-green-700">
                      تم إنشاء الأمانة بنجاح
                    </p>

                    <p className="mt-2 text-sm text-green-700">
                      رقم الأمانة:
                    </p>

                    <p
                      className="mt-1 break-all font-mono text-base font-extrabold text-green-800 sm:text-lg"
                      dir="ltr"
                    >
                      {successReference}
                    </p>

                    <p className="mt-3 text-xs leading-6 text-green-700">
                      سيتم مراجعة الأمانة من قبل إدارة أمانتي وتحديد الرسوم لاحقًا.
                      سيظهر السعر تلقائيًا في حسابك بعد اعتماده.
                    </p>

                    <Link
                      to="/amanat"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white sm:w-auto"
                    >
                      عرض أماناتي
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {!successReference && (
              <>
                {/* بيانات المرسل */}

                <section>
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-primary">
                      بيانات المرسل
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      هذه البيانات مأخوذة تلقائيًا من حسابك.
                    </p>
                  </div>

                  <div className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2">

                    <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4">
                      <div className="flex items-start gap-3">
                        <User className="mt-1 size-5 shrink-0 text-primary" />

                        <div className="min-w-0">
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
                      <div className="flex items-start gap-3">
                        <Phone className="mt-1 size-5 shrink-0 text-primary" />

                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            رقم هاتف المرسل
                          </p>

                          <p
                            className="mt-1 break-words text-sm font-extrabold text-primary"
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

                {/* بيانات المستلم */}

                <section className="mt-7 sm:mt-8">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-primary">
                      بيانات المستلم
                    </h3>
                  </div>

                  <div className="grid min-w-0 gap-4 md:grid-cols-2">

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-bold text-primary">
                        اسم المستلم
                      </label>

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
                        className="box-border w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
                      />
                    </div>

                    <div className="min-w-0">
                      <label className="mb-2 block text-sm font-bold text-primary">
                        رقم هاتف المستلم
                      </label>

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
                        className="box-border w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
                      />
                    </div>

                  </div>
                </section>

                {/* مكان حفظ الأمانة */}

                <section className="mt-7 sm:mt-8">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-primary">
                      مكان حفظ الأمانة
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      يتم تحديد مركز أمانتي تلقائيًا ولا يمكن للعميل تغييره.
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-border bg-muted/20 p-3.5 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <MapPin className="size-5 text-primary" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          مركز أمانتي الرئيسي
                        </p>

                        <p className="mt-1 break-words text-sm font-extrabold text-primary">
                          {mainPickupPoint?.name ||
                            "مركز أمانتي الرئيسي"}
                        </p>

                        <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                          {mainPickupPoint?.address ||
                            "تعز — شارع الأدوية مقابل مفروشات الملك"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* تفاصيل الأمانة */}

                <section className="mt-7 sm:mt-8">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-primary">
                      تفاصيل الأمانة
                    </h3>
                  </div>

                  <div className="min-w-0">
                    <label className="mb-2 block text-sm font-bold text-primary">
                      وصف الأمانة
                    </label>

                    <input
                      type="text"
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      placeholder="مثال: حقيبة، وثائق، ملابس..."
                      disabled={saving}
                      className="box-border w-full min-w-0 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
                    />
                  </div>

                  <div className="mt-4 min-w-0">
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
                      rows={4}
                      className="box-border w-full min-w-0 resize-none rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20 sm:px-4"
                    />
                  </div>
                </section>

                {/* صور الأمانة */}

                <section className="mt-7 sm:mt-8">
                  <div className="mb-4">
                    <h3 className="text-sm font-extrabold text-primary">
                      صور الأمانة
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      ارفع من صورة واحدة إلى 3 صور كحد أقصى حتى تتمكن إدارة أمانتي من مراجعة الأمانة وتحديد الرسوم.
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-dashed border-border bg-muted/20 p-3.5 sm:p-5">

                    <label
                      htmlFor="amanat-images"
                      className="flex min-w-0 cursor-pointer flex-col items-center justify-center rounded-xl border border-border bg-background px-3 py-7 text-center transition hover:bg-muted/30 sm:px-5 sm:py-8"
                    >
                      <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 sm:size-12">
                        <ImagePlus className="size-5 text-primary sm:size-6" />
                      </div>

                      <p className="mt-3 text-sm font-bold text-primary">
                        اختر صور الأمانة
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        الحد الأقصى 3 صور — 5MB للصورة
                      </p>

                      <input
                        id="amanat-images"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={
                          handleImageChange
                        }
                        disabled={
                          saving ||
                          selectedImages.length >= 3
                        }
                        className="hidden"
                      />
                    </label>

                    {/* معاينة الصور */}

                    {selectedImages.length > 0 && (
                      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:mt-5 sm:grid-cols-3">

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
                                  alt={`صورة الأمانة ${index + 1}`}
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
                                  disabled={
                                    saving
                                  }
                                  className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
                                  title="حذف الصورة"
                                >
                                  <X className="size-4" />
                                </button>

                                <div className="min-w-0 px-3 py-2">
                                  <p className="truncate text-xs font-bold text-primary">
                                    الصورة{" "}
                                    {index + 1}
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

                {/* الرسوم */}

                <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3.5 sm:mt-6 sm:p-4">
                  <p className="text-sm font-bold text-primary">
                    رسوم الأمانة
                  </p>

                  <p className="mt-1 text-xs leading-6 text-muted-foreground">
                    لا يتم احتساب أو عرض أي رسوم في هذه الصفحة.
                    سيتم مراجعة الصور وتحديد رسوم الأمانة لاحقًا من قبل إدارة أمانتي، وسيظهر السعر تلقائيًا في حسابك.
                  </p>
                </div>

                {/* الأزرار */}

                <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:mt-6 sm:flex-row sm:flex-wrap sm:pt-6">

                  <button
                    type="button"
                    onClick={createAmanat}
                    disabled={
                      saving ||
                      selectedImages.length === 0
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    <Save className="size-4" />

                    {saving
                      ? "جاري إنشاء الأمانة..."
                      : "إضافة الأمانة"}
                  </button>

                  <Link
                    to="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-6 py-3 text-sm font-bold text-primary transition hover:bg-muted/80 sm:w-auto"
                  >
                    <ArrowRight className="size-4" />
                    العودة للوحة التحكم
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
