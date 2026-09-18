import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ShieldCheck,
  Search,
  RefreshCw,
  PackageCheck,
  Clock3,
  CheckCircle2,
  MapPin,
  User,
  Phone,
  Wallet,
  Plus,
  X,
  Edit3,
  Trash2,
  Save,
  Image as ImageIcon,
  Eye,
  Copy,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import {
  Card,
  StatCard,
  StatusBadge,
} from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/amanat")({
  head: () => ({
    meta: [
      {
        title: "الأمانات | لوحة الإدارة | أمانتي",
      },
      {
        name: "description",
        content:
          "إدارة ومتابعة الأمانات المحفوظة في مراكز أمانتي.",
      },
    ],
  }),
  component: AmanatPage,
});

const nav = [
  {
    label: "نظرة عامة",
    icon: ShieldCheck,
    to: "/admin",
  },
  {
    label: "الشحنات",
    icon: PackageCheck,
    to: "/admin/shipments",
  },
  {
    label: "الأمانات",
    icon: ShieldCheck,
    to: "/admin/amanat",
    active: true,
  },
];

type AmanatRow = {
  id: string;
  reference_number: string;
  owner_id: string | null;
  pickup_point_id: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  storage_fee: number | null;
  stored_at: string;
  collected_at: string | null;
  receiver_name: string | null;
  receiver_phone: string | null;

  image_urls: string[] | null;
  payment_status: string | null;
  pricing_status: string | null;

  owner?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    role: string | null;
  } | null;

  pickup_point?: {
    id: string;
    name: string | null;
    address: string | null;
    phone: string | null;
    city?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
};

type PickupPoint = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  city_id: string | null;
  city?: {
    id: string;
    name: string;
  } | null;
};

function getStatusTone(
  status: string,
): "pending" | "transit" | "ready" | "done" | "stored" {
  switch (status) {
    case "delivered":
    case "completed":
    case "received":
      return "done";

    case "ready":
    case "ready_for_pickup":
      return "ready";

    case "in_transit":
    case "transit":
      return "transit";

    case "stored":
    case "stored_amanat":
      return "stored";

    default:
      return "pending";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "قيد المعالجة";

    case "in_transit":
    case "transit":
      return "في الطريق";

    case "ready":
    case "ready_for_pickup":
      return "جاهزة للاستلام";

    case "delivered":
    case "completed":
      return "تم التسليم";

    case "received":
      return "تم الاستلام";

    case "stored":
    case "stored_amanat":
      return "أمانة محفوظة";

    default:
      return status || "غير محدد";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(
  value: number | null | undefined,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "غير محدد";
  }

  return new Intl.NumberFormat("ar-YE").format(
    value,
  );
}

function generateReferenceNumber(
  existing: AmanatRow[],
) {
  const numbers = existing
    .map((item) => {
      const match =
        item.reference_number?.match(
          /^AMN-(\d+)$/,
        );

      return match
        ? Number(match[1])
        : 10000;
    })
    .filter((number) =>
      Number.isFinite(number),
    );

  const highest =
    numbers.length > 0
      ? Math.max(...numbers)
      : 10000;

  return `AMN-${highest + 1}`;
}

function getPricingLabel(
  status: string | null,
) {
  switch (status) {
    case "priced":
      return "تم تحديد السعر";

    case "pending":
    default:
      return "بانتظار التسعير";
  }
}

function getPaymentLabel(
  status: string | null,
) {
  switch (status) {
    case "paid":
      return "تم الدفع";

    case "pending":
      return "قيد الدفع";

    case "unpaid":
    default:
      return "لم يتم الدفع";
  }
}

function getImagePath(value: string) {
  /*
   * image_urls عندنا تخزن المسار داخل الـBucket
   * وليس Public URL.
   *
   * إذا كان الرابط كاملاً نعيده كما هو.
   */
  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return value;
}

async function copyReferenceNumber(
  referenceNumber: string,
) {
  try {
    await navigator.clipboard.writeText(
      referenceNumber,
    );

    window.alert(
      "تم نسخ رقم الأمانة بنجاح.",
    );
  } catch (error) {
    console.error(
      "COPY REFERENCE ERROR:",
      error,
    );

    window.alert(
      "تعذر نسخ رقم الأمانة.",
    );
  }
}

function AmanatPage() {
  const [amanat, setAmanat] =
    useState<AmanatRow[]>([]);

  const [owners, setOwners] =
    useState<Owner[]>([]);

  const [pickupPoints, setPickupPoints] =
    useState<PickupPoint[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingFormData, setLoadingFormData] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [formError, setFormError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showForm, setShowForm] =
    useState(false);

  const [editingAmanat, setEditingAmanat] =
    useState<AmanatRow | null>(null);

  const [ownerId, setOwnerId] =
    useState("");

  const [ownerSearch, setOwnerSearch] =
    useState("");

  const [ownerSearchFocused, setOwnerSearchFocused] =
    useState(false);

  const [receiverName, setReceiverName] =
    useState("");

  const [receiverPhone, setReceiverPhone] =
    useState("");

  const ownerSearchRef =
    useRef<HTMLDivElement | null>(null);

  const [pickupPointId, setPickupPointId] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [storageFee, setStorageFee] =
    useState("");

  const [status, setStatus] =
    useState("stored");

  const [selectedImageUrls, setSelectedImageUrls] =
    useState<string[]>([]);

  const [viewingImages, setViewingImages] =
    useState<string[] | null>(null);

  const [signedImageUrls, setSignedImageUrls] =
    useState<string[]>([]);

  const [pricingId, setPricingId] =
    useState<string | null>(null);

  const [pricingValue, setPricingValue] =
    useState("");

  /*
   * =====================================================
   * تحميل الأمانات
   * =====================================================
   */

  async function loadAmanat() {
    setLoading(true);
    setErrorMessage("");

    try {
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const refreshResult =
          await supabase.auth.refreshSession();

        session =
          refreshResult.data.session;
      }

      if (!session) {
        setErrorMessage(
          "لا توجد جلسة تسجيل دخول صالحة. سجّل الدخول إلى حساب الأدمن ثم حاول مرة أخرى.",
        );

        setAmanat([]);
        setLoading(false);
        return;
      }

      const role =
        session.user.app_metadata?.role;

      if (role !== "admin") {
        setErrorMessage(
          "الحساب الحالي ليس لديه صلاحية مدير النظام.",
        );

        setAmanat([]);
        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("amanat")
          .select(`
            id,
            reference_number,
            owner_id,
            pickup_point_id,
            status,
            description,
            notes,
            storage_fee,
            stored_at,
            collected_at,
            receiver_name,
            receiver_phone,
            image_urls,
            payment_status,
            pricing_status,

            owner:profiles!amanat_owner_id_fkey(
              id,
              full_name,
              phone,
              email,
              role
            ),

            pickup_point:pickup_points!amanat_pickup_point_id_fkey(
              id,
              name,
              address,
              phone,

              city:cities(
                id,
                name
              )
            )
          `)
          .order("stored_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "AMANAT DATABASE ERROR:",
          error,
        );

        setErrorMessage(
          [
            error.code
              ? `Code: ${error.code}`
              : null,
            error.message
              ? `Message: ${error.message}`
              : null,
            error.details
              ? `Details: ${error.details}`
              : null,
            error.hint
              ? `Hint: ${error.hint}`
              : null,
          ]
            .filter(Boolean)
            .join("\n") ||
            "حدث خطأ أثناء تحميل الأمانات.",
        );

        setAmanat([]);
        setLoading(false);
        return;
      }

      setAmanat(
        (data ?? []) as unknown as AmanatRow[],
      );

      setLoading(false);
    } catch (error: any) {
      console.error(
        "AMANAT UNEXPECTED ERROR:",
        error,
      );

      setErrorMessage(
        error?.message ||
          "حدث خطأ غير متوقع أثناء تحميل الأمانات.",
      );

      setAmanat([]);
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * تحميل بيانات النموذج
   * =====================================================
   */

  async function loadFormData() {
    setLoadingFormData(true);
    setFormError("");

    const [
      ownersResult,
      pickupResult,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id,full_name,phone,email,role",
        )
        .order("full_name", {
          ascending: true,
        }),

      supabase
        .from("pickup_points")
        .select(`
          id,
          name,
          address,
          phone,
          city_id,

          city:cities(
            id,
            name
          )
        `)
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        }),
    ]);

    if (ownersResult.error) {
      console.error(
        "OWNERS ERROR:",
        ownersResult.error,
      );

      setFormError(
        `تعذر تحميل قائمة العملاء.\n${ownersResult.error.message}`,
      );

      setLoadingFormData(false);
      return;
    }

    if (pickupResult.error) {
      console.error(
        "PICKUP POINTS ERROR:",
        pickupResult.error,
      );

      setFormError(
        `تعذر تحميل نقاط الاستلام.\n${pickupResult.error.message}`,
      );

      setLoadingFormData(false);
      return;
    }

    setOwners(
      (ownersResult.data ??
        []) as Owner[],
    );

    setPickupPoints(
      (pickupResult.data ??
        []) as unknown as PickupPoint[],
    );

    setLoadingFormData(false);
  }

  useEffect(() => {
    loadAmanat();
  }, []);

  /*
   * =====================================================
   * Form
   * =====================================================
   */

  function resetForm() {
    setOwnerId("");
    setOwnerSearch("");
    setOwnerSearchFocused(false);
    setReceiverName("");
    setReceiverPhone("");
    setPickupPointId("");
    setDescription("");
    setNotes("");
    setStorageFee("");
    setStatus("stored");
    setFormError("");
    setEditingAmanat(null);
    setSelectedImageUrls([]);
  }

  async function openAddForm() {
    resetForm();

    setShowForm(true);

    await loadFormData();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function openEditForm(
    item: AmanatRow,
  ) {
    setEditingAmanat(item);

    setOwnerId(
      item.owner_id ?? "",
    );

    setOwnerSearch(
      item.owner?.full_name ||
        item.owner?.phone ||
        "",
    );

    setReceiverName(
      item.receiver_name ?? "",
    );

    setReceiverPhone(
      item.receiver_phone ?? "",
    );

    setPickupPointId(
      item.pickup_point_id ?? "",
    );

    setDescription(
      item.description ?? "",
    );

    setNotes(item.notes ?? "");

    setStorageFee(
      item.storage_fee !== null &&
        item.storage_fee !== undefined
        ? String(item.storage_fee)
        : "",
    );

    setStatus(
      item.status || "stored",
    );

    setSelectedImageUrls(
      item.image_urls ?? [],
    );

    setFormError("");
    setShowForm(true);

    await loadFormData();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setShowForm(false);
    resetForm();
  }

  function validateForm() {
    if (!ownerId) {
      return "اختر العميل صاحب الأمانة.";
    }

    if (!receiverName.trim()) {
      return "اكتب اسم المستلم.";
    }

    if (!receiverPhone.trim()) {
      return "اكتب رقم هاتف المستلم.";
    }

    if (!pickupPointId) {
      return "اختر نقطة الاستلام.";
    }

    if (!storageFee.trim()) {
      return "اكتب رسوم الأمانة.";
    }

    const fee =
      Number(storageFee);

    if (
      Number.isNaN(fee) ||
      fee < 0
    ) {
      return "رسوم الأمانة غير صحيحة.";
    }

    if (!status) {
      return "اختر حالة الأمانة.";
    }

    return null;
  }

  /*
   * =====================================================
   * Owner Search
   * =====================================================
   */

  const filteredOwners =
    useMemo(() => {
      const query =
        ownerSearch
          .trim()
          .toLowerCase();

      if (!query) {
        return owners;
      }

      return owners.filter(
        (owner) => {
          const name =
            owner.full_name
              ?.toLowerCase() || "";

          const phone =
            owner.phone
              ?.toLowerCase() || "";

          const email =
            owner.email
              ?.toLowerCase() || "";

          return (
            name.includes(query) ||
            phone.includes(query) ||
            email.includes(query)
          );
        },
      );
    }, [
      owners,
      ownerSearch,
    ]);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        ownerSearchRef.current &&
        !ownerSearchRef.current.contains(
          event.target as Node,
        )
      ) {
        setOwnerSearchFocused(
          false,
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  function selectOwner(
    owner: Owner,
  ) {
    setOwnerId(owner.id);

    setOwnerSearch(
      [
        owner.full_name ||
          "بدون اسم",
        owner.phone,
      ]
        .filter(Boolean)
        .join(" — "),
    );

    setOwnerSearchFocused(
      false,
    );
  }

  function handleOwnerSearchChange(
    value: string,
  ) {
    setOwnerSearch(value);
    setOwnerSearchFocused(true);

    if (ownerId) {
      const currentOwner =
        owners.find(
          (owner) =>
            owner.id === ownerId,
        );

      if (
        !currentOwner?.full_name ||
        !value.includes(
          currentOwner.full_name,
        )
      ) {
        setOwnerId("");
      }
    }
  }

  /*
   * =====================================================
   * حفظ الأمانة
   * =====================================================
   */

  async function saveAmanat() {
    setFormError("");

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(
        validationError,
      );
      return;
    }

    setSaving(true);

    const fee =
      Number(storageFee);

    const payload = {
      owner_id: ownerId,

      receiver_name: receiverName.trim(),
      receiver_phone: receiverPhone.trim(),

      pickup_point_id:
        pickupPointId,

      status,

      description:
        description.trim() ||
        null,

      notes:
        notes.trim() ||
        null,

      storage_fee: fee,

      pricing_status: "priced",

      payment_status:
        editingAmanat?.payment_status ||
        "unpaid",
    };

    if (editingAmanat) {
      const { error } =
        await supabase
          .from("amanat")
          .update(payload)
          .eq(
            "id",
            editingAmanat.id,
          );

      if (error) {
        console.error(
          "UPDATE AMANAT ERROR:",
          error,
        );

        setFormError(
          `تعذر تعديل الأمانة.\nCode: ${
            error.code ??
            "غير معروف"
          }\nMessage: ${
            error.message ?? ""
          }`,
        );

        setSaving(false);
        return;
      }
    } else {
      const referenceNumber =
        generateReferenceNumber(
          amanat,
        );

      // لا نرسل status عند إنشاء سجل جديد، حتى تستخدم قاعدة البيانات
      // القيمة الافتراضية المسموح بها في amanat_status_check.
      const insertPayload = {
        owner_id: ownerId,

        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhone.trim(),

        pickup_point_id:
          pickupPointId,

        description:
          description.trim() ||
          null,

        notes:
          notes.trim() ||
          null,

        storage_fee: fee,

        pricing_status: "priced",

        payment_status: "unpaid",

        reference_number:
          referenceNumber,

        stored_at:
          new Date().toISOString(),

        collected_at: null,

        image_urls:
          selectedImageUrls,
      };

      const { error } =
        await supabase
          .from("amanat")
          .insert(
            insertPayload,
          );

      if (error) {
        console.error(
          "INSERT AMANAT ERROR:",
          error,
        );

        setFormError(
          `تعذر إضافة الأمانة.\nCode: ${
            error.code ??
            "غير معروف"
          }\nMessage: ${
            error.message ?? ""
          }`,
        );

        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setShowForm(false);
    resetForm();

    await loadAmanat();
  }

  /*
   * =====================================================
   * تحديد السعر مباشرة من القائمة
   * =====================================================
   */

  function startPricing(
    item: AmanatRow,
  ) {
    setPricingId(item.id);

    setPricingValue(
      item.storage_fee !== null &&
        item.storage_fee !== undefined
        ? String(item.storage_fee)
        : "",
    );
  }

  function cancelPricing() {
    if (saving) {
      return;
    }

    setPricingId(null);
    setPricingValue("");
  }

  async function savePricing(
    item: AmanatRow,
  ) {
    const value =
      Number(pricingValue);

    if (
      !pricingValue.trim() ||
      Number.isNaN(value) ||
      value < 0
    ) {
      setErrorMessage(
        "أدخل سعرًا صحيحًا للأمانة.",
      );
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const {
      error,
    } = await supabase
      .from("amanat")
      .update({
        storage_fee: value,
        pricing_status:
          "priced",
        payment_status:
          item.payment_status ||
          "unpaid",
      })
      .eq("id", item.id);

    if (error) {
      console.error(
        "SAVE PRICING ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر حفظ سعر الأمانة.\nCode: ${
          error.code ??
          "غير معروف"
        }\nMessage: ${
          error.message ?? ""
        }`,
      );

      setSaving(false);
      return;
    }

    setPricingId(null);
    setPricingValue("");

    setSaving(false);

    await loadAmanat();
  }

  /*
   * =====================================================
   * حالة الأمانة
   * =====================================================
   */

  async function updateStatus(
    item: AmanatRow,
    newStatus: string,
  ) {
    if (
      saving ||
      deletingId !== null
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد تغيير حالة الأمانة "${item.reference_number}" إلى "${getStatusLabel(
          newStatus,
        )}"؟`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setSaving(true);

    const updatePayload: {
      status: string;
      collected_at?: string | null;
    } = {
      status: newStatus,
    };

    if (
      newStatus === "received" ||
      newStatus === "completed" ||
      newStatus === "delivered"
    ) {
      updatePayload.collected_at =
        new Date().toISOString();
    } else {
      updatePayload.collected_at =
        null;
    }

    const { error } =
      await supabase
        .from("amanat")
        .update(updatePayload)
        .eq("id", item.id);

    if (error) {
      console.error(
        "UPDATE STATUS ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر تحديث حالة الأمانة.\nCode: ${
          error.code ??
          "غير معروف"
        }\nMessage: ${
          error.message ?? ""
        }`,
      );

      setSaving(false);
      return;
    }

    setSaving(false);

    await loadAmanat();
  }

  async function togglePaymentStatus(
    item: AmanatRow,
  ) {
    if (
      saving ||
      deletingId !== null
    ) {
      return;
    }

    const newStatus =
      item.payment_status === "paid"
        ? "unpaid"
        : "paid";

    const confirmed =
      window.confirm(
        newStatus === "paid"
          ? `هل تم استلام رسوم الأمانة ${item.reference_number} من العميل؟`
          : `هل تريد إعادة حالة الدفع للأمانة ${item.reference_number} إلى "لم يتم الدفع"؟`,
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("amanat")
        .update({
          payment_status: newStatus,
        })
        .eq("id", item.id);

    if (error) {
      console.error(
        "UPDATE PAYMENT STATUS ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر تحديث حالة الدفع.\nCode: ${
          error.code ??
          "غير معروف"
        }\nMessage: ${
          error.message ??
          ""
        }`,
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    await loadAmanat();
  }

  /*
   * =====================================================
   * حذف
   * =====================================================
   */

  async function deleteAmanat(
    item: AmanatRow,
  ) {
    if (
      deletingId !== null ||
      saving
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف الأمانة "${item.reference_number}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setErrorMessage("");

    const { error } =
      await supabase
        .from("amanat")
        .delete()
        .eq("id", item.id);

    if (error) {
      console.error(
        "DELETE AMANAT ERROR:",
        error,
      );

      setErrorMessage(
        `تعذر حذف الأمانة.\nCode: ${
          error.code ??
          "غير معروف"
        }\nMessage: ${
          error.message ?? ""
        }`,
      );

      setDeletingId(null);
      return;
    }

    setAmanat(
      (current) =>
        current.filter(
          (row) =>
            row.id !== item.id,
        ),
    );

    setDeletingId(null);
  }

  /*
   * =====================================================
   * الصور
   * =====================================================
   */

  async function openImages(
    item: AmanatRow,
  ) {
    const paths =
      item.image_urls ?? [];

    if (paths.length === 0) {
      setErrorMessage(
        "لا توجد صور مرفوعة لهذه الأمانة.",
      );
      return;
    }

    setErrorMessage("");

    const directUrls =
      paths.filter(
        (path) =>
          path.startsWith(
            "http://",
          ) ||
          path.startsWith(
            "https://",
          ),
      );

    const storagePaths =
      paths.filter(
        (path) =>
          !path.startsWith(
            "http://",
          ) &&
          !path.startsWith(
            "https://",
          ),
      );

    let urls = [
      ...directUrls,
    ];

    if (
      storagePaths.length > 0
    ) {
      const {
        data,
        error,
      } =
        await supabase.storage
          .from(
            "amanati-images",
          )
          .createSignedUrls(
            storagePaths,
            60 * 10,
          );

      if (error) {
        console.error(
          "CREATE SIGNED URLS ERROR:",
          error,
        );

        setErrorMessage(
          `تعذر فتح صور الأمانة.\n${error.message}`,
        );
        return;
      }

      urls = [
        ...urls,
        ...(data ?? [])
          .map(
            (item) =>
              item.signedUrl,
          )
          .filter(
            (
              url,
            ): url is string =>
              Boolean(url),
          ),
      ];
    }

    if (urls.length === 0) {
      setErrorMessage(
        "تعذر الحصول على روابط صور الأمانة.",
      );
      return;
    }

    setSignedImageUrls(
      urls,
    );

    setViewingImages(
      urls,
    );
  }

  function closeImages() {
    setViewingImages(null);
    setSignedImageUrls([]);
  }

  /*
   * =====================================================
   * الإحصائيات
   * =====================================================
   */

  const stats =
    useMemo(() => {
      const stored =
        amanat.filter(
          (item) =>
            [
              "stored",
              "stored_amanat",
            ].includes(
              String(
                item.status,
              ).toLowerCase(),
            ),
        ).length;

      const ready =
        amanat.filter(
          (item) =>
            [
              "ready",
              "ready_for_pickup",
            ].includes(
              String(
                item.status,
              ).toLowerCase(),
            ),
        ).length;

      const completed =
        amanat.filter(
          (item) =>
            [
              "delivered",
              "completed",
              "received",
            ].includes(
              String(
                item.status,
              ).toLowerCase(),
            ),
        ).length;

      return {
        total: amanat.length,
        stored,
        ready,
        completed,
      };
    }, [amanat]);

  /*
   * =====================================================
   * البحث
   * =====================================================
   */

  const filteredAmanat =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return amanat.filter(
        (item) => {
          const itemStatus =
            String(
              item.status ?? "",
            ).toLowerCase();

          if (
            statusFilter ===
              "stored" &&
            ![
              "stored",
              "stored_amanat",
            ].includes(
              itemStatus,
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              "ready" &&
            ![
              "ready",
              "ready_for_pickup",
            ].includes(
              itemStatus,
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              "completed" &&
            ![
              "delivered",
              "completed",
              "received",
            ].includes(
              itemStatus,
            )
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const searchableText =
            [
              item.reference_number,
              item.description,
              item.notes,
              item.status,
              item.pricing_status,
              item.payment_status,
              item.owner?.full_name,
              item.owner?.phone,
              item.owner?.email,
              item.receiver_name,
              item.receiver_phone,
              item.pickup_point?.name,
              item.pickup_point?.address,
              item.pickup_point?.city?.name,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            query,
          );
        },
      );
    }, [
      amanat,
      search,
      statusFilter,
    ]);

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <DashboardShell
      title="الأمانات"
      subtitle="إدارة ومتابعة الأمانات المحفوظة في مراكز أمانتي."
      nav={nav}
    >
      {/* الإحصائيات */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="إجمالي الأمانات"
          value={stats.total}
          icon={ShieldCheck}
          tone="navy"
        />

        <StatCard
          label="أمانات محفوظة"
          value={stats.stored}
          icon={Clock3}
          tone="teal"
        />

        <StatCard
          label="جاهزة للاستلام"
          value={stats.ready}
          icon={PackageCheck}
          tone="amber"
        />

        <StatCard
          label="تم الاستلام"
          value={stats.completed}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      {/* البحث */}

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">
            <Search className="size-5 shrink-0 text-muted-foreground" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
              }
              placeholder="ابحث برقم الأمانة أو اسم العميل أو الهاتف..."
              className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "الكل"],
              ["stored", "محفوظة"],
              ["ready", "جاهزة"],
              [
                "completed",
                "تم الاستلام",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setStatusFilter(
                      value,
                    )
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    statusFilter ===
                    value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-primary"
                  }`}
                >
                  {label}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={
                loadAmanat
              }
              disabled={loading}
              className="flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-primary transition hover:bg-muted disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw
                className={`size-4 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

            <button
              type="button"
              onClick={
                openAddForm
              }
              disabled={
                saving ||
                deletingId !== null
              }
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" />
              إضافة أمانة
            </button>
          </div>
        </div>
      </Card>

      {/* رسالة عامة */}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-red-600">
            {errorMessage}
          </p>
        </div>
      )}

      {/* نموذج الإدارة */}

      {showForm && (
        <Card className="p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-primary">
                {editingAmanat
                  ? "تعديل الأمانة"
                  : "إضافة أمانة جديدة"}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                الإدارة تحدد رسوم الأمانة، وبعد حفظ السعر يظهر تلقائيًا في حساب العميل.
              </p>
            </div>

            <button
              type="button"
              onClick={
                closeForm
              }
              disabled={saving}
              className="rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted disabled:opacity-50"
            >
              <X className="size-5" />
            </button>
          </div>

          {loadingFormData ? (
            <div className="py-12 text-center">
              <Clock3 className="mx-auto size-8 animate-pulse text-muted-foreground" />

              <p className="mt-3 text-sm text-muted-foreground">
                جاري تحميل بيانات النموذج...
              </p>
            </div>
          ) : (
            <>
              {formError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-red-600">
                    {formError}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">

                {/* العميل */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-primary">
                    صاحب الأمانة
                  </label>

                  <div
                    ref={
                      ownerSearchRef
                    }
                    className="relative"
                  >
                    <User className="pointer-events-none absolute right-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="text"
                      value={
                        ownerSearch
                      }
                      onChange={(
                        event,
                      ) =>
                        handleOwnerSearchChange(
                          event
                            .target
                            .value,
                        )
                      }
                      onFocus={() =>
                        setOwnerSearchFocused(
                          true,
                        )
                      }
                      placeholder="اكتب اسم العميل أو رقم الهاتف..."
                      disabled={
                        saving
                      }
                      autoComplete="off"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />

                    {ownerSearchFocused &&
                      ownerSearch.trim() && (
                        <div className="absolute right-0 left-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-background p-1 shadow-xl">
                          {filteredOwners.length >
                          0 ? (
                            filteredOwners.map(
                              (
                                owner,
                              ) => (
                                <button
                                  key={
                                    owner.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    selectOwner(
                                      owner,
                                    )
                                  }
                                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-right transition hover:bg-muted ${
                                    ownerId ===
                                    owner.id
                                      ? "bg-muted"
                                      : ""
                                  }`}
                                >
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
                                    <User className="size-4 text-secondary" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-primary">
                                      {owner.full_name ||
                                        "بدون اسم"}
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {owner.phone ||
                                        owner.email ||
                                        ""}
                                    </p>
                                  </div>

                                  {ownerId ===
                                    owner.id && (
                                    <CheckCircle2 className="size-5 shrink-0 text-secondary" />
                                  )}
                                </button>
                              ),
                            )
                          ) : (
                            <div className="px-4 py-8 text-center">
                              <User className="mx-auto size-8 text-muted-foreground" />

                              <p className="mt-2 text-sm font-bold text-primary">
                                لا يوجد عميل مطابق
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {/* المستلم */}

                <div>
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
                      placeholder="اكتب اسم المستلم"
                      disabled={saving}
                      className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
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
                      className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* نقطة الاستلام */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-primary">
                    نقطة الاستلام
                  </label>

                  <div className="relative">
                    <MapPin className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <select
                      value={
                        pickupPointId
                      }
                      onChange={(
                        event,
                      ) =>
                        setPickupPointId(
                          event
                            .target
                            .value,
                        )
                      }
                      disabled={
                        saving
                      }
                      className="w-full appearance-none rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">
                        اختر نقطة الاستلام
                      </option>

                      {pickupPoints.map(
                        (
                          point,
                        ) => (
                          <option
                            key={
                              point.id
                            }
                            value={
                              point.id
                            }
                          >
                            {point.name ||
                              "نقطة بدون اسم"}
                            {point.city
                              ?.name
                              ? ` — ${point.city.name}`
                              : ""}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>

                {/* السعر */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-primary">
                    رسوم الأمانة
                  </label>

                  <div className="relative">
                    <Wallet className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        storageFee
                      }
                      onChange={(
                        event,
                      ) =>
                        setStorageFee(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="مثال: 500"
                      disabled={
                        saving
                      }
                      dir="ltr"
                      className="w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    السعر الذي تحدده الإدارة سيظهر تلقائيًا للعميل.
                  </p>
                </div>

                {/* الحالة */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-primary">
                    حالة الأمانة
                  </label>

                  <select
                    value={
                      status
                    }
                    onChange={(
                      event,
                    ) =>
                      setStatus(
                        event
                          .target
                          .value,
                      )
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="stored">
                      أمانة محفوظة
                    </option>

                    <option value="ready_for_pickup">
                      جاهزة للاستلام
                    </option>

                    <option value="received">
                      تم الاستلام
                    </option>
                  </select>
                </div>

                {/* الوصف */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-primary">
                    وصف الأمانة
                  </label>

                  <input
                    type="text"
                    value={
                      description
                    }
                    onChange={(
                      event,
                    ) =>
                      setDescription(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="مثال: ظرف مستندات"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* الملاحظات */}

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-primary">
                    ملاحظات
                    <span className="mr-1 text-xs font-normal text-muted-foreground">
                      اختياري
                    </span>
                  </label>

                  <textarea
                    value={
                      notes
                    }
                    onChange={(
                      event,
                    ) =>
                      setNotes(
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                    disabled={
                      saving
                    }
                    className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={
                    saveAmanat
                  }
                  disabled={
                    saving
                  }
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="size-4" />

                  {saving
                    ? "جاري الحفظ..."
                    : editingAmanat
                      ? "حفظ التعديلات"
                      : "إضافة الأمانة"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-muted px-6 py-3 text-sm font-bold text-primary transition hover:bg-muted/80"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* القائمة */}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-primary">
            قائمة الأمانات
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            راجع الصور وحدد السعر، وسيظهر السعر تلقائيًا في حساب العميل.
          </p>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="px-5 py-16 text-center text-sm text-muted-foreground">
              جاري تحميل الأمانات...
            </div>
          ) : filteredAmanat.length ===
            0 ? (
            <div className="px-5 py-16 text-center">
              <ShieldCheck className="mx-auto size-12 text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                لا توجد أمانات
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                لا توجد بيانات مطابقة للبحث أو الفلتر الحالي.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredAmanat.map(
                (item) => {
                  const owner =
                    item.owner;

                  const pickupPoint =
                    item.pickup_point;

                  const hasImages =
                    (
                      item.image_urls ??
                      []
                    ).length >
                    0;

                  const isPricing =
                    pricingId ===
                    item.id;

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="p-5"
                    >
                      <div className="grid gap-5 xl:grid-cols-[1.0fr_1.15fr_1.15fr_1.15fr_1.1fr_1.3fr_auto] xl:items-start">

                        {/* الرقم */}

                        <div>
                          <div className="flex items-center gap-2">
                            <p
                              className="font-mono text-sm font-extrabold text-primary"
                              dir="ltr"
                            >
                              {item.reference_number}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                copyReferenceNumber(
                                  item.reference_number,
                                )
                              }
                              className="flex size-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-primary"
                              title="نسخ رقم الأمانة"
                              aria-label="نسخ رقم الأمانة"
                            >
                              <Copy className="size-3.5" />
                            </button>
                          </div>

                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(
                              item.stored_at,
                            )}
                          </p>
                        </div>

                        {/* العميل */}

                        <div>
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-secondary" />

                            <p className="text-sm font-bold text-primary">
                              {owner?.full_name ||
                                "غير محدد"}
                            </p>
                          </div>

                          {owner?.phone && (
                            <div className="mt-1 flex items-center gap-2">
                              <Phone className="size-3 text-muted-foreground" />

                              <p className="text-xs text-muted-foreground">
                                {
                                  owner.phone
                                }
                              </p>
                            </div>
                          )}
                        </div>

                        {/* المستلم */}

                        <div>
                          <div className="flex items-center gap-2">
                            <User className="size-4 text-primary" />

                            <p className="text-sm font-bold text-primary">
                              {item.receiver_name ||
                                "غير محدد"}
                            </p>
                          </div>

                          {item.receiver_phone && (
                            <div className="mt-1 flex items-center gap-2">
                              <Phone className="size-3 text-muted-foreground" />

                              <p
                                className="text-xs text-muted-foreground"
                                dir="ltr"
                              >
                                {item.receiver_phone}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* المركز */}

                        <div>
                          <div className="flex items-center gap-2">
                            <MapPin className="size-4 text-secondary" />

                            <p className="text-sm font-medium text-primary">
                              {pickupPoint?.name ||
                                "غير محددة"}
                            </p>
                          </div>

                          {pickupPoint?.city?.name && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {
                                pickupPoint
                                  .city
                                  .name
                              }
                            </p>
                          )}

                          {pickupPoint?.address && (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {
                                pickupPoint.address
                              }
                            </p>
                          )}
                        </div>

                        {/* السعر */}

                        <div>
                          {isPricing ? (
                            <div className="space-y-2">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={
                                  pricingValue
                                }
                                onChange={(
                                  event,
                                ) =>
                                  setPricingValue(
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                autoFocus
                                dir="ltr"
                                placeholder="السعر"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    savePricing(
                                      item,
                                    )
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                                >
                                  حفظ
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelPricing
                                  }
                                  disabled={
                                    saving
                                  }
                                  className="rounded-lg bg-muted px-3 py-2 text-xs font-bold text-primary"
                                >
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <Wallet className="size-4 text-secondary" />

                                <p className="text-sm font-extrabold text-primary">
                                  {formatMoney(
                                    item.storage_fee,
                                  )}
                                </p>
                              </div>

                              <p className="mt-1 text-[11px] text-muted-foreground">
                                رسوم الأمانة
                              </p>

                              <p
                                className={`mt-2 inline-flex rounded-lg px-2 py-1 text-[10px] font-bold ${
                                  item.pricing_status ===
                                  "priced"
                                    ? "bg-green-50 text-green-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {getPricingLabel(
                                  item.pricing_status,
                                )}
                              </p>
                            </>
                          )}
                        </div>

                        {/* الحالة والدفع */}

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                              tone={getStatusTone(
                                item.status,
                              )}
                            >
                              {getStatusLabel(
                                item.status,
                              )}
                            </StatusBadge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                togglePaymentStatus(
                                  item,
                                )
                              }
                              disabled={
                                saving ||
                                deletingId !== null
                              }
                              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                                item.payment_status ===
                                "paid"
                                  ? "bg-green-50 text-green-700 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 hover:bg-red-100"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                              title="اضغط لتغيير حالة الدفع"
                            >
                              {getPaymentLabel(
                                item.payment_status,
                              )}
                            </button>
                          </div>

                          {item.status !==
                            "received" &&
                            item.status !==
                              "completed" &&
                            item.status !==
                              "delivered" && (
                              <select
                                value={
                                  item.status
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateStatus(
                                    item,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={
                                  saving ||
                                  deletingId !==
                                    null
                                }
                                className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-bold text-primary outline-none"
                              >
                                <option value="stored">
                                  محفوظة
                                </option>

                                <option value="ready_for_pickup">
                                  جاهزة
                                </option>

                                <option value="received">
                                  تم الاستلام
                                </option>
                              </select>
                            )}
                        </div>

                        {/* الإجراءات */}

                        <div className="flex flex-wrap items-center gap-2">
                          {/* الصور */}

                          <button
                            type="button"
                            onClick={() =>
                              openImages(
                                item,
                              )
                            }
                            disabled={
                              saving ||
                              !hasImages
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-secondary/30 px-3 py-2 text-xs font-bold text-secondary transition hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              hasImages
                                ? "عرض صور الأمانة"
                                : "لا توجد صور"
                            }
                          >
                            {hasImages ? (
                              <Eye className="size-4" />
                            ) : (
                              <ImageIcon className="size-4" />
                            )}

                            {hasImages
                              ? `الصور (${item.image_urls?.length ?? 0})`
                              : "لا توجد صور"}
                          </button>

                          {/* تحديد السعر */}

                          <button
                            type="button"
                            onClick={() =>
                              startPricing(
                                item,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !==
                                null ||
                              isPricing
                            }
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                          >
                            <Wallet className="size-4" />

                            {item.pricing_status ===
                            "priced"
                              ? "تعديل السعر"
                              : "تحديد السعر"}
                          </button>

                          {/* تعديل */}

                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                item,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !==
                                null
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-primary transition hover:bg-muted disabled:opacity-50"
                          >
                            <Edit3 className="size-4" />
                            تعديل
                          </button>

                          {/* حذف */}

                          <button
                            type="button"
                            onClick={() =>
                              deleteAmanat(
                                item,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !==
                                null
                            }
                            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />

                            {deletingId ===
                            item.id
                              ? "جاري الحذف..."
                              : "حذف"}
                          </button>
                        </div>
                      </div>

                      {/* تفاصيل إضافية */}

                      <div className="mt-5 grid gap-3 border-t border-border pt-4 md:grid-cols-3">
                        {item.description && (
                          <div>
                            <p className="text-[11px] font-bold text-muted-foreground">
                              وصف الأمانة
                            </p>

                            <p className="mt-1 text-xs font-medium text-primary">
                              {
                                item.description
                              }
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground">
                            حالة التسعير
                          </p>

                          <p className="mt-1 text-xs font-bold text-primary">
                            {getPricingLabel(
                              item.pricing_status,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-muted-foreground">
                            حالة الدفع
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              togglePaymentStatus(
                                item,
                              )
                            }
                            disabled={
                              saving ||
                              deletingId !== null
                            }
                            className={`mt-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                              item.payment_status ===
                              "paid"
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                            title="اضغط لتغيير حالة الدفع"
                          >
                            {getPaymentLabel(
                              item.payment_status,
                            )}
                          </button>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="mt-3 rounded-xl bg-muted/30 p-3">
                          <p className="text-xs leading-6 text-muted-foreground">
                            <span className="font-bold text-primary">
                              ملاحظات:
                            </span>{" "}
                            {
                              item.notes
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}
        </Card>
      </section>

      {/* =====================================================
          نافذة الصور
      ===================================================== */}

      {viewingImages && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={
            closeImages
          }
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-primary">
                  صور الأمانة
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  الصور التي رفعها العميل لمراجعة الأمانة وتحديد السعر.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeImages
                }
                className="rounded-xl border border-border p-2 text-primary hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {signedImageUrls.map(
                (
                  url,
                  index,
                ) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={url}
                      alt={`صورة الأمانة ${index + 1}`}
                      className="h-64 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                    />

                    <div className="p-3">
                      <p className="text-xs font-bold text-primary">
                        صورة الأمانة{" "}
                        {index + 1}
                      </p>

                      <p className="mt-1 text-[10px] text-muted-foreground">
                        اضغط لفتح الصورة بحجم أكبر
                      </p>
                    </div>
                  </a>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
