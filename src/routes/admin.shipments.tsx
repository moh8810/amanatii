import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  Truck,
  CheckCircle2,
  Clock3,
  PackageCheck,
  Plus,
  X,
  MapPin,
  User,
  Mail,
  Store,
  Edit3,
  Trash2,
  Copy,
  Phone,
  CalendarDays,
  Wallet,
  Image as ImageIcon,
  Eye,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

import { DashboardShell } from "@/components/amanati/DashboardShell";
import { Card, StatusBadge } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/shipments")({
  head: () => ({
    meta: [
      {
        title: "الشحنات | لوحة الإدارة | أمانتي",
      },
      {
        name: "description",
        content: "إدارة ومتابعة جميع شحنات أمانتي.",
      },
    ],
  }),

  component: AdminShipmentsPage,
});

const nav = [
  {
    label: "نظرة عامة",
    icon: Package,
    to: "/admin",
  },
  {
    label: "الشحنات",
    icon: Package,
    to: "/admin/shipments",
    active: true,
  },
  {
    label: "الأمانات",
    icon: Package,
    to: "/admin/amanat",
  },
];

type Merchant = {
  id: string;
  full_name: string;
  store_name: string;
  phone: string;
  is_active: boolean;
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

type Shipment = {
  id: string;
  tracking_number: string;

  merchant_id: string | null;

  sender_type: "merchant" | "customer" | null;
  sender_name: string | null;
  sender_phone: string | null;

  receiver_name: string | null;
  receiver_phone: string | null;
  receiver_email: string | null;

  from_city_id: string | null;
  to_city_id: string | null;
  pickup_point_id: string | null;

  status: string | null;

  description: string | null;
  notes: string | null;

  shipping_fee: number | null;
  pricing_status: string | null;
  payment_status: string | null;
  image_urls: string[] | null;
  created_at: string;
};

type SenderType = "merchant" | "customer";

function statusLabel(status: string | null) {
  switch (status) {
    case "pending":
      return "قيد المعالجة";

    case "in_transit":
    case "transit":
      return "قيد التوصيل";

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

function statusTone(
  status: string | null,
): "pending" | "transit" | "ready" | "done" | "stored" {
  switch (status) {
    case "in_transit":
    case "transit":
      return "transit";

    case "ready":
    case "ready_for_pickup":
      return "ready";

    case "delivered":
    case "completed":
    case "received":
      return "done";

    case "stored":
    case "stored_amanat":
      return "stored";

    default:
      return "pending";
  }
}

const statusOptions = [
  ["pending", "قيد المعالجة"],
  ["in_transit", "قيد التوصيل"],
  ["ready_for_pickup", "جاهزة للاستلام"],
  ["delivered", "تم التسليم"],
  ["stored_amanat", "أمانة محفوظة"],
  ["received", "تم الاستلام"],
] as const;

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-YE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: number | null) {
  if (value === null || value === undefined) {
    return "بانتظار تحديد الرسوم";
  }

  return `${new Intl.NumberFormat("ar-YE").format(value)} ريال`;
}

function getPricingLabel(status: string | null) {
  return status === "priced"
    ? "تم تحديد الرسوم"
    : "بانتظار تحديد الرسوم";
}

function getPaymentLabel(status: string | null) {
  if (status === "paid") {
    return "تم الدفع";
  }

  if (status === "pending") {
    return "قيد الدفع";
  }

  return "لم يتم الدفع";
}

function normalizeImagePaths(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function generateTrackingNumber() {
  const time = Date.now().toString().slice(-8);
  const random = Math.floor(100 + Math.random() * 900);

  return `AM-${time}-${random}`;
}

async function copyTrackingNumber(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    console.error("COPY TRACKING NUMBER ERROR:", error);
  }
}

function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingFormData, setLoadingFormData] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [updatingStatusId, setUpdatingStatusId] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [showForm, setShowForm] = useState(false);

  const [editingShipment, setEditingShipment] =
    useState<Shipment | null>(null);

  // =========================
  // Sender
  // =========================

  const [senderType, setSenderType] =
    useState<SenderType>("merchant");

  const [merchantId, setMerchantId] =
    useState("");

  const [senderName, setSenderName] =
    useState("");

  const [senderPhone, setSenderPhone] =
    useState("");

  // =========================
  // Receiver
  // =========================

  const [receiverName, setReceiverName] =
    useState("");

  const [receiverPhone, setReceiverPhone] =
    useState("");

  const [receiverEmail, setReceiverEmail] =
    useState("");

  // =========================
  // Cities
  // =========================

  const [fromCityId, setFromCityId] =
    useState("");

  const [toCityId, setToCityId] =
    useState("");

  const [pickupPointId, setPickupPointId] =
    useState("");

  // =========================
  // Shipment details
  // =========================

  const [description, setDescription] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [shippingFee, setShippingFee] =
    useState("");

  // =========================
  // Pricing / payment / images
  // =========================

  const [pricingId, setPricingId] =
    useState<string | null>(null);

  const [pricingValue, setPricingValue] =
    useState("");

  const [updatingPaymentId, setUpdatingPaymentId] =
    useState<string | null>(null);

  const [viewingImages, setViewingImages] =
    useState<string[] | null>(null);

  const [signedImageUrls, setSignedImageUrls] =
    useState<string[]>([]);

  const [loadingImages, setLoadingImages] =
    useState(false);

  // =========================
  // Load shipments
  // =========================

  async function loadShipments(
    refresh = false,
  ) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const { data, error: dbError } =
      await supabase
        .from("shipments")
        .select(`
          id,
          tracking_number,
          merchant_id,
          sender_type,
          sender_name,
          sender_phone,
          receiver_name,
          receiver_phone,
          receiver_email,
          from_city_id,
          to_city_id,
          pickup_point_id,
          status,
          description,
          notes,
          shipping_fee,
          pricing_status,
          payment_status,
          image_urls,
          created_at
        `)
        .order("created_at", {
          ascending: false,
        });

    if (dbError) {
      console.error(
        "SHIPMENTS ERROR:",
        dbError,
      );

      setError(
        `تعذر تحميل الشحنات.
Code: ${
          dbError.code ?? "غير معروف"
        }
Message: ${
          dbError.message ?? ""
        }`,
      );

      setShipments([]);
    } else {
      setShipments(
        (data ?? []) as Shipment[],
      );
    }

    setLoading(false);
    setRefreshing(false);
  }

  // =========================
  // Load form data
  // =========================

  async function loadFormData() {
    setLoadingFormData(true);
    setFormError("");

    const [
      merchantsResult,
      citiesResult,
      pickupResult,
    ] = await Promise.all([
      supabase
        .from("merchants")
        .select(
          "id,full_name,store_name,phone,is_active",
        )
        .eq("is_active", true)
        .order("full_name"),

      supabase
        .from("cities")
        .select("id,name")
        .order("name"),

      supabase
        .from("pickup_points")
        .select(
          "id,name,city_id,address",
        )
        .eq("is_active", true)
        .order("name"),
    ]);

    if (merchantsResult.error) {
      setFormError(
        "تعذر تحميل قائمة التجار.",
      );

      setLoadingFormData(false);
      return;
    }

    if (citiesResult.error) {
      setFormError(
        "تعذر تحميل قائمة المدن.",
      );

      setLoadingFormData(false);
      return;
    }

    if (pickupResult.error) {
      setFormError(
        "تعذر تحميل نقاط الاستلام.",
      );

      setLoadingFormData(false);
      return;
    }

    setMerchants(
      (merchantsResult.data ??
        []) as Merchant[],
    );

    setCities(
      (citiesResult.data ??
        []) as City[],
    );

    setPickupPoints(
      (pickupResult.data ??
        []) as PickupPoint[],
    );

    setLoadingFormData(false);
  }

  useEffect(() => {
    loadShipments();
  }, []);

  // =========================
  // Reset form
  // =========================

  function resetForm() {
    setSenderType("merchant");

    setMerchantId("");
    setSenderName("");
    setSenderPhone("");

    setReceiverName("");
    setReceiverPhone("");
    setReceiverEmail("");

    setFromCityId("");
    setToCityId("");
    setPickupPointId("");

    setDescription("");
    setNotes("");
    setShippingFee("");

    setFormError("");
    setEditingShipment(null);
  }

  // =========================
  // Add
  // =========================

  async function openAddForm() {
    resetForm();

    setShowForm(true);

    await loadFormData();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // =========================
  // Edit
  // =========================

  async function openEditForm(
    shipment: Shipment,
  ) {
    setEditingShipment(shipment);
    setShowForm(true);
    setFormError("");

    const type: SenderType =
      shipment.sender_type === "customer"
        ? "customer"
        : "merchant";

    setSenderType(type);

    setMerchantId(
      shipment.merchant_id ?? "",
    );

    setSenderName(
      shipment.sender_name ?? "",
    );

    setSenderPhone(
      shipment.sender_phone ?? "",
    );

    setReceiverName(
      shipment.receiver_name ?? "",
    );

    setReceiverPhone(
      shipment.receiver_phone ?? "",
    );

    setReceiverEmail(
      shipment.receiver_email ?? "",
    );

    setFromCityId(
      shipment.from_city_id ?? "",
    );

    setToCityId(
      shipment.to_city_id ?? "",
    );

    setPickupPointId(
      shipment.pickup_point_id ?? "",
    );

    setDescription(
      shipment.description ?? "",
    );

    setNotes(
      shipment.notes ?? "",
    );

    setShippingFee(
      shipment.shipping_fee == null
        ? ""
        : String(
            shipment.shipping_fee,
          ),
    );

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

  // =========================
  // Validation
  // =========================

  function validateForm() {
    if (
      senderType === "merchant" &&
      !merchantId
    ) {
      return "اختر التاجر.";
    }

    if (
      senderType === "customer" &&
      !senderName.trim()
    ) {
      return "اكتب اسم المرسل.";
    }

    if (
      senderType === "customer" &&
      !senderPhone.trim()
    ) {
      return "اكتب رقم هاتف المرسل.";
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

      if (
        !emailPattern.test(
          receiverEmail.trim(),
        )
      ) {
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
      return "اختر نقطة الاستلام.";
    }

    if (shippingFee.trim()) {
      const fee = Number(shippingFee);

      if (!Number.isFinite(fee) || fee < 0) {
        return "رسوم الشحن غير صحيحة.";
      }
    }

    return null;
  }

  // =========================
  // Save
  // =========================

  async function saveShipment() {
    const validationError =
      validateForm();

    if (validationError) {
      setFormError(
        validationError,
      );

      return;
    }

    setSaving(true);
    setFormError("");

    const payload = {
      sender_type: senderType,

      merchant_id:
        senderType === "merchant"
          ? merchantId
          : null,

      sender_name:
        senderType === "customer"
          ? senderName.trim()
          : null,

      sender_phone:
        senderType === "customer"
          ? senderPhone.trim()
          : null,

      receiver_name:
        receiverName.trim(),

      receiver_phone:
        receiverPhone.trim(),

      receiver_email:
        receiverEmail.trim() || null,

      from_city_id:
        fromCityId,

      to_city_id:
        toCityId,

      pickup_point_id:
        pickupPointId,

      description:
        description.trim() || null,

      notes:
        notes.trim() || null,

      shipping_fee:
        shippingFee.trim()
          ? Number(shippingFee)
          : null,

      pricing_status:
        shippingFee.trim()
          ? "priced"
          : editingShipment?.pricing_status || "pending",

      payment_status:
        editingShipment?.payment_status || "unpaid",

      updated_at:
        new Date().toISOString(),
    };

    let dbError: any = null;

    if (editingShipment) {
      const result =
        await supabase
          .from("shipments")
          .update(payload)
          .eq(
            "id",
            editingShipment.id,
          );

      dbError = result.error;
    } else {
      const result =
        await supabase
          .from("shipments")
          .insert({
            ...payload,

            tracking_number:
              generateTrackingNumber(),

            status: "pending",
            pricing_status:
              shippingFee.trim() ? "priced" : "pending",
            payment_status: "unpaid",
          });

      dbError = result.error;
    }

    if (dbError) {
      console.error(
        "SAVE SHIPMENT ERROR:",
        dbError,
      );

      setFormError(
        `تعذر حفظ الشحنة.
Code: ${
          dbError.code ??
          "غير معروف"
        }
Message: ${
          dbError.message ?? ""
        }`,
      );

      setSaving(false);
      return;
    }

    setSaving(false);
    setShowForm(false);

    resetForm();

    await loadShipments();
  }

  // =========================
  // Pricing
  // =========================

  function startPricing(shipment: Shipment) {
    setPricingId(shipment.id);
    setPricingValue(
      shipment.shipping_fee == null
        ? ""
        : String(shipment.shipping_fee),
    );
  }

  function cancelPricing() {
    setPricingId(null);
    setPricingValue("");
  }

  async function savePricing(shipment: Shipment) {
    if (updatingPaymentId || saving || deletingId) {
      return;
    }

    const value = pricingValue.trim();

    if (!value) {
      setError("اكتب رسوم الشحن أولاً.");
      return;
    }

    const fee = Number(value);

    if (!Number.isFinite(fee) || fee < 0) {
      setError("رسوم الشحن غير صحيحة.");
      return;
    }

    setError("");

    const { data, error: dbError } = await supabase
      .from("shipments")
      .update({
        shipping_fee: fee,
        pricing_status: "priced",
        payment_status: shipment.payment_status || "unpaid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipment.id)
      .select(
        "id,shipping_fee,pricing_status,payment_status,updated_at",
      )
      .maybeSingle();

    if (dbError) {
      console.error("SAVE SHIPMENT PRICING ERROR:", dbError);
      setError(
        `تعذر حفظ رسوم الشحن.\nCode: ${
          dbError.code ?? "غير معروف"
        }\nMessage: ${dbError.message ?? ""}`,
      );
      return;
    }

    setShipments((list) =>
      list.map((item) =>
        item.id === shipment.id
          ? {
              ...item,
              shipping_fee: data?.shipping_fee ?? fee,
              pricing_status: data?.pricing_status ?? "priced",
              payment_status:
                data?.payment_status ??
                shipment.payment_status ??
                "unpaid",
            }
          : item,
      ),
    );

    cancelPricing();
  }

  // =========================
  // Payment
  // =========================

  async function togglePaymentStatus(shipment: Shipment) {
    if (
      updatingPaymentId ||
      saving ||
      deletingId ||
      updatingStatusId
    ) {
      return;
    }

    if (
      shipment.shipping_fee == null ||
      shipment.pricing_status !== "priced"
    ) {
      setError("حدد رسوم الشحن أولاً قبل تغيير حالة الدفع.");
      return;
    }

    const nextStatus =
      shipment.payment_status === "paid"
        ? "unpaid"
        : "paid";

    const confirmed = window.confirm(
      nextStatus === "paid"
        ? `هل تؤكد أن الشحنة "${shipment.tracking_number}" تم دفع رسومها؟`
        : `هل تريد إعادة الشحنة "${shipment.tracking_number}" إلى حالة لم يتم الدفع؟`,
    );

    if (!confirmed) {
      return;
    }

    setUpdatingPaymentId(shipment.id);
    setError("");

    const { error: dbError } = await supabase
      .from("shipments")
      .update({
        payment_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipment.id);

    if (dbError) {
      console.error("UPDATE SHIPMENT PAYMENT ERROR:", dbError);
      setError(
        `تعذر تحديث حالة الدفع.\nCode: ${
          dbError.code ?? "غير معروف"
        }\nMessage: ${dbError.message ?? ""}`,
      );
    } else {
      setShipments((list) =>
        list.map((item) =>
          item.id === shipment.id
            ? {
                ...item,
                payment_status: nextStatus,
              }
            : item,
        ),
      );
    }

    setUpdatingPaymentId(null);
  }

  // =========================
  // Shipment images
  // =========================

  async function openImages(shipment: Shipment) {
    const paths = normalizeImagePaths(shipment.image_urls);

    if (paths.length === 0) {
      setError("لا توجد صور مرفوعة لهذه الشحنة.");
      return;
    }

    setError("");
    setLoadingImages(true);
    setViewingImages(paths);
    setSignedImageUrls([]);

    const directUrls = paths.filter(
      (path) =>
        path.startsWith("http://") ||
        path.startsWith("https://"),
    );

    const storagePaths = paths.filter(
      (path) =>
        !path.startsWith("http://") &&
        !path.startsWith("https://"),
    );

    if (storagePaths.length === 0) {
      setSignedImageUrls(directUrls);
      setLoadingImages(false);
      return;
    }

    const { data, error: signedError } = await supabase.storage
      .from("amanati-images")
      .createSignedUrls(storagePaths, 60 * 10);

    if (signedError) {
      console.error("VIEW SHIPMENT IMAGES ERROR:", signedError);
      setSignedImageUrls(directUrls);
      setLoadingImages(false);
      return;
    }

    setSignedImageUrls([
      ...directUrls,
      ...(data ?? [])
        .map((item) => item.signedUrl)
        .filter((url): url is string => Boolean(url)),
    ]);
    setLoadingImages(false);
  }

  function closeImages() {
    setViewingImages(null);
    setSignedImageUrls([]);
    setLoadingImages(false);
  }

  // =========================
  // Update status
  // =========================

  async function updateShipmentStatus(
    shipment: Shipment,
    newStatus: string,
  ) {
    if (
      updatingStatusId ||
      deletingId ||
      saving
    ) {
      return;
    }

    if (
      newStatus ===
      (shipment.status ??
        "pending")
    ) {
      return;
    }

    setUpdatingStatusId(
      shipment.id,
    );

    setError("");

    const previousStatus =
      shipment.status;

    setShipments((list) =>
      list.map((item) =>
        item.id === shipment.id
          ? {
              ...item,
              status: newStatus,
            }
          : item,
      ),
    );

    const { error: dbError } =
      await supabase
        .from("shipments")
        .update({
          status: newStatus,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          shipment.id,
        );

    if (dbError) {
      setShipments((list) =>
        list.map((item) =>
          item.id === shipment.id
            ? {
                ...item,
                status:
                  previousStatus,
              }
            : item,
        ),
      );

      setError(
        `تعذر تحديث الحالة.
Code: ${
          dbError.code ??
          "غير معروف"
        }
Message: ${
          dbError.message ?? ""
        }`,
      );
    }

    setUpdatingStatusId(null);
  }

  // =========================
  // Delete
  // =========================

  async function deleteShipment(
    shipment: Shipment,
  ) {
    if (deletingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `هل أنت متأكد من حذف الشحنة "${shipment.tracking_number}"؟\n\nلا يمكن التراجع عن هذا الإجراء.`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(
      shipment.id,
    );

    setError("");

    const { error: dbError } =
      await supabase
        .from("shipments")
        .delete()
        .eq(
          "id",
          shipment.id,
        );

    if (dbError) {
      setError(
        `تعذر حذف الشحنة.
Code: ${
          dbError.code ??
          "غير معروف"
        }
Message: ${
          dbError.message ?? ""
        }`,
      );
    } else {
      setShipments((list) =>
        list.filter(
          (item) =>
            item.id !==
            shipment.id,
        ),
      );
    }

    setDeletingId(null);
  }

  // =========================
  // Pickup points
  // =========================

  const filteredPickupPoints =
    useMemo(
      () =>
        !toCityId
          ? []
          : pickupPoints.filter(
              (point) =>
                point.city_id ===
                toCityId,
            ),
      [
        pickupPoints,
        toCityId,
      ],
    );

  useEffect(() => {
    setPickupPointId("");
  }, [toCityId]);

  // =========================
  // Search
  // =========================

  const filteredShipments =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      return shipments.filter(
        (shipment) => {
          const searchable = [
            shipment.tracking_number,
            shipment.sender_name,
            shipment.sender_phone,
            shipment.receiver_name,
            shipment.receiver_phone,
            shipment.receiver_email,
          ]
            .map(
              (value) =>
                String(
                  value ?? "",
                ).toLowerCase(),
            );

          const matchesSearch =
            !q ||
            searchable.some(
              (value) =>
                value.includes(q),
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            shipment.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      shipments,
      search,
      statusFilter,
    ]);

  // =========================
  // Statistics
  // =========================

  const total =
    shipments.length;

  const processing =
    shipments.filter(
      (shipment) =>
        !shipment.status ||
        shipment.status ===
          "pending",
    ).length;

  const inTransit =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "in_transit" ||
        shipment.status ===
          "transit",
    ).length;

  const ready =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "ready" ||
        shipment.status ===
          "ready_for_pickup",
    ).length;

  const delivered =
    shipments.filter(
      (shipment) =>
        shipment.status ===
          "delivered" ||
        shipment.status ===
          "completed" ||
        shipment.status ===
          "received",
    ).length;

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20";

  const iconInputClass =
    "w-full rounded-xl border border-border bg-background py-3 pl-4 pr-11 text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <DashboardShell
      title="الشحنات"
      subtitle="إدارة ومتابعة جميع شحنات أمانتي."
      nav={nav}
    >

      {/* =========================
          الإحصائيات
      ========================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                إجمالي الشحنات
              </p>

              <p className="mt-2 text-3xl font-extrabold text-primary">
                {total}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Package className="size-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                قيد المعالجة
              </p>

              <p className="mt-2 text-3xl font-extrabold text-primary">
                {processing}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Clock3 className="size-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                قيد التوصيل
              </p>

              <p className="mt-2 text-3xl font-extrabold text-primary">
                {inTransit}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10">
              <Truck className="size-5 text-secondary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                جاهزة للاستلام
              </p>

              <p className="mt-2 text-3xl font-extrabold text-primary">
                {ready}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
              <PackageCheck className="size-5 text-accent" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                تم التسليم
              </p>

              <p className="mt-2 text-3xl font-extrabold text-primary">
                {delivered}
              </p>
            </div>

            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
          </div>
        </div>

      </div>

      {/* =========================
          البحث والفلاتر
      ========================= */}

      <Card className="p-5">
        <div className="flex flex-col gap-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-background px-4 py-3">

              <Search className="size-5 shrink-0 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="ابحث برقم الشحنة أو اسم المرسل أو المستلم أو الهاتف..."
                className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted-foreground"
              />

            </div>

            <button
              type="button"
              onClick={openAddForm}
              disabled={
                saving ||
                deletingId !==
                  null ||
                updatingStatusId !==
                  null
              }
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Plus className="size-4" />
              إضافة شحنة
            </button>

            <button
              type="button"
              onClick={() =>
                loadShipments(true)
              }
              disabled={
                refreshing ||
                updatingStatusId !==
                  null
              }
              className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-primary hover:bg-muted disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw
                className={`size-4 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>

          </div>

          <div className="flex flex-wrap gap-2">

            <button
              type="button"
              onClick={() =>
                setStatusFilter("all")
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                statusFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              الكل
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "pending",
                )
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                statusFilter ===
                "pending"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              قيد المعالجة
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "in_transit",
                )
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                statusFilter ===
                "in_transit"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              قيد التوصيل
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "ready_for_pickup",
                )
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                statusFilter ===
                "ready_for_pickup"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              جاهزة
            </button>

            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  "delivered",
                )
              }
              className={`rounded-xl px-5 py-2.5 text-sm font-bold ${
                statusFilter ===
                "delivered"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary hover:bg-muted/70"
              }`}
            >
              تم التسليم
            </button>

          </div>

        </div>
      </Card>

      {/* =========================
          نموذج الإضافة والتعديل
      ========================= */}

      {showForm && (
        <Card className="p-6">

          <div className="mb-6 flex items-start justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-primary">
                {editingShipment
                  ? "تعديل الشحنة"
                  : "إضافة شحنة جديدة"}
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                أدخل بيانات المرسل والمستلم وبقية بيانات الشحنة.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
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

                {/* =========================
                    نوع المرسل
                ========================= */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-primary">
                    نوع المرسل
                  </label>

                  {senderType ===
                  "merchant" ? (
                    <>
                      <div className="relative">

                        <Store className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <select
                          value={
                            merchantId
                          }
                          onChange={(event) =>
                            setMerchantId(
                              event
                                .target
                                .value,
                            )
                          }
                          disabled={saving}
                          className={`${iconInputClass} appearance-none`}
                        >
                          <option value="">
                            اختر التاجر
                          </option>

                          {merchants.map(
                            (
                              merchant,
                            ) => (
                              <option
                                key={
                                  merchant.id
                                }
                                value={
                                  merchant.id
                                }
                              >
                                {
                                  merchant.full_name
                                }{" "}
                                —{" "}
                                {
                                  merchant.store_name
                                }
                              </option>
                            ),
                          )}
                        </select>

                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSenderType(
                            "customer",
                          );

                          setMerchantId(
                            "",
                          );
                        }}
                        disabled={saving}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-bold text-primary hover:bg-muted/70 disabled:opacity-50"
                      >
                        <User className="size-4" />

                        إضافة الشحنة كمستخدم عادي
                      </button>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-secondary/20 bg-secondary/5 p-4">

                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                        <div className="flex items-center gap-2">

                          <User className="size-4 text-secondary" />

                          <div>
                            <p className="text-sm font-bold text-primary">
                              شحنة من مستخدم عادي
                            </p>

                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              اكتب اسم المرسل ورقمه مباشرة.
                            </p>
                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSenderType(
                              "merchant",
                            );

                            setSenderName(
                              "",
                            );

                            setSenderPhone(
                              "",
                            );
                          }}
                          disabled={saving}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary hover:bg-muted disabled:opacity-50"
                        >
                          اختيار تاجر بدلًا منه
                        </button>

                      </div>

                      <div className="grid gap-4 md:grid-cols-2">

                        <div>

                          <label className="mb-2 block text-sm font-bold text-primary">
                            اسم المرسل
                          </label>

                          <div className="relative">

                            <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                              type="text"
                              value={
                                senderName
                              }
                              onChange={(
                                event,
                              ) =>
                                setSenderName(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="مثال: محمد أحمد عبدالله"
                              disabled={
                                saving
                              }
                              className={
                                iconInputClass
                              }
                            />

                          </div>

                        </div>

                        <div>

                          <label className="mb-2 block text-sm font-bold text-primary">
                            رقم هاتف المرسل
                          </label>

                          <div className="relative">

                            <Phone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                            <input
                              type="tel"
                              value={
                                senderPhone
                              }
                              onChange={(
                                event,
                              ) =>
                                setSenderPhone(
                                  event
                                    .target
                                    .value,
                                )
                              }
                              placeholder="مثال: 777000000"
                              dir="ltr"
                              disabled={
                                saving
                              }
                              className={
                                iconInputClass
                              }
                            />

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </div>

                {/* =========================
                    المستلم
                ========================= */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-primary">
                    اسم المستلم
                  </label>

                  <div className="relative">

                    <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="text"
                      value={
                        receiverName
                      }
                      onChange={(event) =>
                        setReceiverName(
                          event.target
                            .value,
                        )
                      }
                      placeholder="مثال: أحمد محمد عبدالله"
                      disabled={saving}
                      className={
                        iconInputClass
                      }
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
                      value={
                        receiverPhone
                      }
                      onChange={(event) =>
                        setReceiverPhone(
                          event.target
                            .value,
                        )
                      }
                      placeholder="مثال: 777000000"
                      dir="ltr"
                      disabled={saving}
                      className={
                        iconInputClass
                      }
                    />

                  </div>

                </div>

                <div className="md:col-span-2">

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
                      value={
                        receiverEmail
                      }
                      onChange={(event) =>
                        setReceiverEmail(
                          event.target
                            .value,
                        )
                      }
                      placeholder="receiver@example.com"
                      dir="ltr"
                      disabled={saving}
                      className={
                        iconInputClass
                      }
                    />

                  </div>

                </div>

                {/* =========================
                    المدن
                ========================= */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-primary">
                    مدينة الإرسال
                  </label>

                  <select
                    value={
                      fromCityId
                    }
                    onChange={(event) =>
                      setFromCityId(
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      اختر مدينة الإرسال
                    </option>

                    {cities.map(
                      (city) => (
                        <option
                          key={
                            city.id
                          }
                          value={
                            city.id
                          }
                        >
                          {city.name}
                        </option>
                      ),
                    )}
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-primary">
                    مدينة الوصول
                  </label>

                  <select
                    value={
                      toCityId
                    }
                    onChange={(event) =>
                      setToCityId(
                        event.target
                          .value,
                      )
                    }
                    disabled={saving}
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      اختر مدينة الوصول
                    </option>

                    {cities.map(
                      (city) => (
                        <option
                          key={
                            city.id
                          }
                          value={
                            city.id
                          }
                        >
                          {city.name}
                        </option>
                      ),
                    )}
                  </select>

                </div>

                {/* =========================
                    نقطة الاستلام
                ========================= */}

                <div className="md:col-span-2">

                  <label className="mb-2 block text-sm font-bold text-primary">
                    نقطة الاستلام
                  </label>

                  <div className="relative">

                    <MapPin className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <select
                      value={
                        pickupPointId
                      }
                      onChange={(event) =>
                        setPickupPointId(
                          event.target
                            .value,
                        )
                      }
                      disabled={
                        saving ||
                        !toCityId
                      }
                      className={`${iconInputClass} appearance-none`}
                    >

                      <option value="">
                        {!toCityId
                          ? "اختر مدينة الوصول أولاً"
                          : filteredPickupPoints.length ===
                              0
                            ? "لا توجد نقاط استلام لهذه المدينة"
                            : "اختر نقطة الاستلام"}
                      </option>

                      {filteredPickupPoints.map(
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
                            {
                              point.name
                            }

                            {point.address
                              ? ` — ${point.address}`
                              : ""}
                          </option>
                        ),
                      )}

                    </select>

                  </div>

                </div>

                {/* =========================
                    رسوم الشحن
                ========================= */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-primary">
                    رسوم الشحن
                  </label>

                  <div className="relative">

                    <Wallet className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={
                        shippingFee
                      }
                      onChange={(event) =>
                        setShippingFee(
                          event.target
                            .value,
                        )
                      }
                      placeholder="مثال: 1500"
                      dir="ltr"
                      disabled={saving}
                      className={
                        iconInputClass
                      }
                    />

                  </div>

                </div>

                {/* =========================
                    الوصف
                ========================= */}

                <div>

                  <label className="mb-2 block text-sm font-bold text-primary">
                    وصف الشحنة
                    <span className="mr-1 text-xs font-normal text-muted-foreground">
                      اختياري
                    </span>
                  </label>

                  <input
                    type="text"
                    value={
                      description
                    }
                    onChange={(event) =>
                      setDescription(
                        event.target
                          .value,
                      )
                    }
                    placeholder="مثال: ملابس"
                    disabled={saving}
                    className={
                      inputClass
                    }
                  />

                </div>

                {/* =========================
                    الملاحظات
                ========================= */}

                <div className="md:col-span-2">

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
                        event.target
                          .value,
                      )
                    }
                    placeholder="أي ملاحظات إضافية..."
                    disabled={saving}
                    rows={3}
                    className={`${inputClass} resize-none`}
                  />

                </div>

              </div>

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={
                    saveShipment
                  }
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {editingShipment ? (
                    <Edit3 className="size-4" />
                  ) : (
                    <Package className="size-4" />
                  )}

                  {saving
                    ? "جاري الحفظ..."
                    : editingShipment
                      ? "حفظ التعديلات"
                      : "حفظ الشحنة"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={saving}
                  className="rounded-xl bg-muted px-6 py-3 text-sm font-bold text-primary hover:bg-muted/80 disabled:opacity-50"
                >
                  إلغاء
                </button>

              </div>

            </>
          )}

        </Card>
      )}

      {/* الخطأ العام */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="whitespace-pre-wrap text-sm font-bold leading-6 text-red-600">
            {error}
          </p>
        </div>
      )}

      {/* =========================
          قائمة الشحنات
      ========================= */}

      <section>

        <div className="mb-4">

          <h2 className="text-lg font-bold text-primary">
            قائمة الشحنات
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            جميع الشحنات المسجلة في نظام أمانتي.
          </p>

        </div>

        <Card className="overflow-x-auto overflow-y-hidden">

          {loading ? (
            <div className="px-5 py-16 text-center">

              <Clock3 className="mx-auto size-9 animate-pulse text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                جاري تحميل الشحنات...
              </p>

            </div>
          ) : filteredShipments.length ===
            0 ? (
            <div className="px-5 py-16 text-center">

              <Package className="mx-auto size-10 text-muted-foreground" />

              <p className="mt-4 text-sm font-bold text-primary">
                {shipments.length ===
                0
                  ? "لا توجد شحنات حتى الآن"
                  : "لا توجد نتائج مطابقة"}
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                {shipments.length ===
                0
                  ? "ستظهر الشحنات هنا عند إنشاء أول شحنة."
                  : "جرّب تغيير البحث أو فلتر الحالة."}
              </p>

            </div>
          ) : (
            <>
              {/* =========================
    Header Desktop
========================= */}

<div className="hidden min-w-[1160px] grid-cols-[180px_205px_205px_150px_190px_190px] gap-4 border-b border-border bg-muted/30 px-5 py-4 text-xs font-bold text-muted-foreground xl:grid">

  <span>
    رقم الشحنة
  </span>

  <span>
    المرسل
  </span>

  <span>
    المستلم
  </span>

  <span>
    التاريخ
  </span>

  <span>
    الحالة
  </span>

  <span>
    الإجراءات
  </span>

</div>

<div className="divide-y divide-border">

  {filteredShipments.map(
    (shipment) => {
      const merchant =
        merchants.find(
          (item) =>
            item.id ===
            shipment.merchant_id,
        );

      const senderIsMerchant =
        shipment.sender_type ===
          "merchant" ||
        Boolean(
          shipment.merchant_id,
        );

      return (
        <article
          key={
            shipment.id
          }
          className="px-4 py-5 transition hover:bg-muted/20 xl:px-5"
        >

          {/* =========================
              Desktop
          ========================= */}

          <div className="hidden xl:grid xl:min-w-[1160px] grid-cols-[180px_205px_205px_150px_190px_190px] xl:items-start xl:gap-4">

            {/* رقم الشحنة */}

            <div className="min-w-0">

              <div className="flex items-start gap-2">

                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="size-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">

                  <div className="flex min-w-0 items-center gap-1.5">

                    <p
                      className="min-w-0 truncate font-mono text-[10px] font-extrabold text-primary"
                      dir="ltr"
                      title={
                        shipment.tracking_number
                      }
                    >
                      {
                        shipment.tracking_number
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        copyTrackingNumber(
                          shipment.tracking_number,
                        )
                      }
                      className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-muted hover:text-primary"
                      title="نسخ رقم الشحنة"
                    >
                      <Copy className="size-3" />
                    </button>

                  </div>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    رسوم الشحن:{" "}
                    <span className="font-bold text-primary">
                      {formatMoney(
                        shipment.shipping_fee,
                      )}
                    </span>
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-muted px-2 py-1 text-[9px] font-bold text-muted-foreground">
                      {getPricingLabel(shipment.pricing_status)}
                    </span>

                    <span
                      className={`rounded-lg px-2 py-1 text-[9px] font-bold ${
                        shipment.payment_status === "paid"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {getPaymentLabel(shipment.payment_status)}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* المرسل */}

            <div className="min-w-0">

              <div className="flex items-start gap-2.5">

                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/10">

                  {senderIsMerchant ? (
                    <Store className="size-4 text-secondary" />
                  ) : (
                    <User className="size-4 text-secondary" />
                  )}

                </div>

                <div className="min-w-0 flex-1">

                  <p className="break-words text-sm font-bold leading-5 text-primary">

                    {senderIsMerchant
                      ? merchant?.full_name ||
                        "تاجر"
                      : shipment.sender_name ||
                        "مستخدم عادي"}

                  </p>

                  <span className="mt-1 inline-flex max-w-full rounded-lg bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">

                    {senderIsMerchant
                      ? merchant?.store_name ||
                        "تاجر"
                      : "مستخدم عادي"}

                  </span>

                  <p
                    className="mt-1 break-all text-[10px] text-muted-foreground"
                    dir="ltr"
                  >

                    {senderIsMerchant
                      ? merchant?.phone ||
                        ""
                      : shipment.sender_phone ||
                        ""}

                  </p>

                </div>

              </div>

            </div>

            {/* المستلم */}

            <div className="min-w-0">

              <div className="flex items-start gap-2.5">

                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <User className="size-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="break-words text-sm font-bold leading-5 text-primary">
                    {shipment.receiver_name ||
                      "غير محدد"}
                  </p>

                  {shipment.receiver_phone && (
                    <p
                      className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"
                      dir="ltr"
                    >
                      <Phone className="size-3" />

                      {
                        shipment.receiver_phone
                      }
                    </p>
                  )}

                  {shipment.receiver_email && (
                    <p
                      className="mt-1 break-all text-[10px] text-muted-foreground"
                      dir="ltr"
                    >
                      {
                        shipment.receiver_email
                      }
                    </p>
                  )}

                </div>

              </div>

            </div>

            {/* التاريخ */}

            <div className="min-w-0">

              <div className="flex items-start gap-1.5">

                <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />

                <p className="text-[10px] leading-5 text-muted-foreground">
                  {formatDate(
                    shipment.created_at,
                  )}
                </p>

              </div>

            </div>

            {/* الحالة */}

            <div className="min-w-0">

              <div className="flex flex-col items-start gap-2">

                <StatusBadge
                  tone={statusTone(
                    shipment.status,
                  )}
                >
                  {statusLabel(
                    shipment.status,
                  )}
                </StatusBadge>

                <select
                  value={
                    shipment.status ??
                    "pending"
                  }
                  onChange={(
                    event,
                  ) =>
                    updateShipmentStatus(
                      shipment,
                      event
                        .target
                        .value,
                    )
                  }
                  disabled={
                    saving ||
                    deletingId !==
                      null ||
                    updatingStatusId !==
                      null
                  }
                  className="w-full min-w-0 rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-bold text-primary outline-none disabled:opacity-50"
                >

                  {statusOptions.map(
                    ([
                      value,
                      label,
                    ]) => (
                      <option
                        key={
                          value
                        }
                        value={
                          value
                        }
                      >
                        {
                          label
                        }
                      </option>
                    ),
                  )}

                </select>

                <button
                  type="button"
                  onClick={() => togglePaymentStatus(shipment)}
                  disabled={
                    saving ||
                    deletingId !== null ||
                    updatingStatusId !== null ||
                    updatingPaymentId !== null ||
                    shipment.shipping_fee == null ||
                    shipment.pricing_status !== "priced"
                  }
                  className={`w-full rounded-lg border px-2 py-2 text-[10px] font-bold transition ${
                    shipment.payment_status === "paid"
                      ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  }`}
                  title={
                    shipment.pricing_status !== "priced"
                      ? "حدد السعر أولاً"
                      : "تغيير حالة الدفع"
                  }
                >
                  {shipment.payment_status === "paid" ? (
                    <span className="inline-flex items-center justify-center gap-1">
                      <CircleCheck className="size-3.5" />
                      تم الدفع
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-1">
                      <CircleAlert className="size-3.5" />
                      لم يتم الدفع
                    </span>
                  )}
                </button>

              </div>

            </div>

            {/* الإجراءات */}

            <div className="flex w-full min-w-0 flex-col gap-2">

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openImages(shipment)}
                  disabled={
                    !normalizeImagePaths(shipment.image_urls).length ||
                    saving ||
                    deletingId !== null ||
                    updatingStatusId !== null
                  }
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl border border-secondary/30 px-2 py-2.5 text-[10px] font-bold text-secondary hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-40"
                  title="عرض صور الشحنة"
                >
                  <Eye className="size-3.5" />
                  الصور ({normalizeImagePaths(shipment.image_urls).length})
                </button>

                <button
                  type="button"
                  onClick={() =>
                    pricingId === shipment.id
                      ? cancelPricing()
                      : startPricing(shipment)
                  }
                  disabled={
                    saving ||
                    deletingId !== null ||
                    updatingStatusId !== null
                  }
                  className="flex min-w-0 items-center justify-center gap-1 rounded-xl border border-primary/20 px-2 py-2.5 text-[10px] font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <Wallet className="size-3.5" />
                  {pricingId === shipment.id ? "إلغاء" : "تحديد السعر"}
                </button>
              </div>

              {pricingId === shipment.id && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={pricingValue}
                    onChange={(event) =>
                      setPricingValue(event.target.value)
                    }
                    placeholder="رسوم الشحن"
                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-[10px] font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => savePricing(shipment)}
                    disabled={saving || updatingPaymentId !== null}
                    className="mt-2 w-full rounded-lg bg-primary px-2 py-2 text-[10px] font-bold text-primary-foreground disabled:opacity-50"
                  >
                    حفظ السعر
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  openEditForm(
                    shipment,
                  )
                }
                disabled={
                  saving ||
                  deletingId !==
                    null ||
                  updatingStatusId !==
                    null
                }
                className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border px-2 py-2.5 text-[11px] font-bold text-primary hover:bg-muted disabled:opacity-50"
              >
                <Edit3 className="size-3.5" />
                تعديل
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteShipment(
                    shipment,
                  )
                }
                disabled={
                  saving ||
                  deletingId !==
                    null ||
                  updatingStatusId !==
                    null
                }
                className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-2 py-2.5 text-[11px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />

                {deletingId ===
                shipment.id
                  ? "جاري الحذف..."
                  : "حذف"}
              </button>

            </div>

          </div>
                        {/* =========================
                            Mobile / Tablet
                        ========================= */}

                        <div className="xl:hidden">

                          <div className="flex flex-col gap-4">

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                              <div className="flex min-w-0 items-start gap-3">

                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                  <Package className="size-5 text-primary" />
                                </div>

                                <div className="min-w-0">

                                  <div className="flex min-w-0 items-center gap-1.5">

                                    <p
                                      className="truncate font-mono text-xs font-extrabold text-primary"
                                      dir="ltr"
                                    >
                                      {
                                        shipment.tracking_number
                                      }
                                    </p>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyTrackingNumber(
                                          shipment.tracking_number,
                                        )
                                      }
                                      className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border"
                                    >
                                      <Copy className="size-3" />
                                    </button>

                                  </div>

                                  <p className="mt-1 text-xs text-muted-foreground">
                                    رسوم الشحن:{" "}
                                    <b className="text-primary">
                                      {formatMoney(
                                        shipment.shipping_fee,
                                      )}
                                    </b>
                                  </p>

                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <span className="rounded-lg bg-muted px-2 py-1 text-[9px] font-bold text-muted-foreground">
                                      {getPricingLabel(shipment.pricing_status)}
                                    </span>

                                    <span
                                      className={`rounded-lg px-2 py-1 text-[9px] font-bold ${
                                        shipment.payment_status === "paid"
                                          ? "bg-green-50 text-green-700"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {getPaymentLabel(shipment.payment_status)}
                                    </span>
                                  </div>


                                </div>

                              </div>

                              <StatusBadge
                                tone={statusTone(
                                  shipment.status,
                                )}
                              >
                                {statusLabel(
                                  shipment.status,
                                )}
                              </StatusBadge>

                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">

                              {/* المرسل */}

                              <div className="rounded-2xl border border-border bg-muted/20 p-4">

                                <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                                  المرسل
                                </p>

                                <div className="flex items-start gap-3">

                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary/10">

                                    {senderIsMerchant ? (
                                      <Store className="size-4 text-secondary" />
                                    ) : (
                                      <User className="size-4 text-secondary" />
                                    )}

                                  </div>

                                  <div className="min-w-0">

                                    <p className="break-words text-sm font-bold text-primary">
                                      {senderIsMerchant
                                        ? merchant?.full_name ||
                                          "تاجر"
                                        : shipment.sender_name ||
                                          "مستخدم عادي"}
                                    </p>

                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      {senderIsMerchant
                                        ? merchant?.store_name ||
                                          "تاجر"
                                        : "مستخدم عادي"}
                                    </p>

                                    <p
                                      className="mt-1 text-xs text-muted-foreground"
                                      dir="ltr"
                                    >
                                      {senderIsMerchant
                                        ? merchant?.phone ||
                                          ""
                                        : shipment.sender_phone ||
                                          ""}
                                    </p>

                                  </div>

                                </div>

                              </div>

                              {/* المستلم */}

                              <div className="rounded-2xl border border-border bg-muted/20 p-4">

                                <p className="mb-2 text-[11px] font-bold text-muted-foreground">
                                  المستلم
                                </p>

                                <div className="flex items-start gap-3">

                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                    <User className="size-4 text-primary" />
                                  </div>

                                  <div className="min-w-0">

                                    <p className="break-words text-sm font-bold text-primary">
                                      {shipment.receiver_name ||
                                        "غير محدد"}
                                    </p>

                                    <p
                                      className="mt-1 text-xs text-muted-foreground"
                                      dir="ltr"
                                    >
                                      {shipment.receiver_phone ||
                                        ""}
                                    </p>

                                    {shipment.receiver_email && (
                                      <p
                                        className="mt-1 break-all text-[10px] text-muted-foreground"
                                        dir="ltr"
                                      >
                                        {
                                          shipment.receiver_email
                                        }
                                      </p>
                                    )}

                                  </div>

                                </div>

                              </div>

                            </div>

                            <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-4 py-3">

                              <CalendarDays className="size-4 text-muted-foreground" />

                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  shipment.created_at,
                                )}
                              </span>

                            </div>

                            <div>

                              <label className="mb-2 block text-xs font-bold text-primary">
                                تغيير حالة الشحنة
                              </label>

                              <select
                                value={
                                  shipment.status ??
                                  "pending"
                                }
                                onChange={(
                                  event,
                                ) =>
                                  updateShipmentStatus(
                                    shipment,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                disabled={
                                  saving ||
                                  deletingId !==
                                    null ||
                                  updatingStatusId !==
                                    null
                                }
                                className={
                                  inputClass
                                }
                              >

                                {statusOptions.map(
                                  ([
                                    value,
                                    label,
                                  ]) => (
                                    <option
                                      key={
                                        value
                                      }
                                      value={
                                        value
                                      }
                                    >
                                      {
                                        label
                                      }
                                    </option>
                                  ),
                                )}

                              </select>

                              <button
                                type="button"
                                onClick={() => togglePaymentStatus(shipment)}
                                disabled={
                                  saving ||
                                  deletingId !== null ||
                                  updatingStatusId !== null ||
                                  updatingPaymentId !== null ||
                                  shipment.shipping_fee == null ||
                                  shipment.pricing_status !== "priced"
                                }
                                className={`w-full rounded-lg border px-3 py-2 text-xs font-bold ${
                                  shipment.payment_status === "paid"
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-red-200 bg-red-50 text-red-600"
                                } disabled:cursor-not-allowed disabled:opacity-40`}
                              >
                                {shipment.payment_status === "paid"
                                  ? "تم الدفع ✓"
                                  : "لم يتم الدفع"}
                              </button>

                            </div>

                            <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">

                              <button
                                type="button"
                                onClick={() => openImages(shipment)}
                                disabled={!normalizeImagePaths(shipment.image_urls).length}
                                className="flex items-center justify-center gap-1 rounded-xl border border-secondary/30 px-2 py-3 text-xs font-bold text-secondary hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Eye className="size-4" />
                                الصور
                              </button>

                              <button
                                type="button"
                                onClick={() => startPricing(shipment)}
                                disabled={
                                  saving ||
                                  deletingId !== null ||
                                  updatingStatusId !== null
                                }
                                className="flex items-center justify-center gap-1 rounded-xl border border-primary/20 px-2 py-3 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
                              >
                                <Wallet className="size-4" />
                                السعر
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(
                                    shipment,
                                  )
                                }
                                disabled={
                                  saving ||
                                  deletingId !==
                                    null ||
                                  updatingStatusId !==
                                    null
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-bold text-primary hover:bg-muted"
                              >
                                <Edit3 className="size-4" />
                                تعديل
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteShipment(
                                    shipment,
                                  )
                                }
                                disabled={
                                  saving ||
                                  deletingId !==
                                    null ||
                                  updatingStatusId !==
                                    null
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="size-4" />

                                {deletingId ===
                                shipment.id
                                  ? "جاري الحذف..."
                                  : "حذف"}
                              </button>

                            </div>

                            {pricingId === shipment.id && (
                              <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={pricingValue}
                                    onChange={(event) =>
                                      setPricingValue(event.target.value)
                                    }
                                    placeholder="رسوم الشحن"
                                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => savePricing(shipment)}
                                    className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
                                  >
                                    حفظ
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelPricing}
                                    className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-primary"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            )}

                            {(shipment.description ||
                              shipment.notes) && (
                              <div className="border-t border-border pt-4 text-xs leading-6 text-muted-foreground">

                                {shipment.description && (
                                  <p>
                                    <b className="text-primary">
                                      الوصف:
                                    </b>{" "}
                                    {
                                      shipment.description
                                    }
                                  </p>
                                )}

                                {shipment.notes && (
                                  <p>
                                    <b className="text-primary">
                                      ملاحظات:
                                    </b>{" "}
                                    {
                                      shipment.notes
                                    }
                                  </p>
                                )}

                              </div>
                            )}

                          </div>

                        </div>

                      </article>
                    );
                  },
                )}

              </div>
            </>
          )}

        </Card>

      </section>

      {viewingImages && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          onClick={closeImages}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-background p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-primary">
                  صور الشحنة
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  الصور التي رفعها العميل عند إنشاء الشحنة.
                </p>
              </div>

              <button
                type="button"
                onClick={closeImages}
                className="rounded-xl border border-border p-2 text-primary hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {loadingImages ? (
              <div className="py-12 text-center text-sm font-bold text-primary">
                جاري تحميل الصور...
              </div>
            ) : signedImageUrls.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                تعذر عرض الصور حاليًا.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {signedImageUrls.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-border bg-muted"
                  >
                    <img
                      src={url}
                      alt={`صورة الشحنة ${index + 1}`}
                      className="h-64 w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                    />
                    <div className="p-3">
                      <p className="text-xs font-bold text-primary">
                        صورة الشحنة {index + 1}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        اضغط لفتح الصورة بحجم أكبر
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </DashboardShell>
  );
}
