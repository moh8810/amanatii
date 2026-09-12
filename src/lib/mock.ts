import type { StatusTone, TimelineStep } from "@/components/amanati/ui";

export type Shipment = {
  id: string;
  from: string;
  to: string;
  status: string;
  tone: StatusTone;
  updated: string;
  type: string;
  pickup: string;
};

export const shipments: Shipment[] = [
  {
    id: "AMA-48291",
    from: "صنعاء",
    to: "تعز",
    status: "جاهزة للاستلام",
    tone: "ready",
    updated: "اليوم ١١:٤٠ ص",
    type: "طرد صغير",
    pickup: "نقطة استلام أمانتي — الحي الشرقي",
  },
  {
    id: "AMA-48277",
    from: "صنعاء",
    to: "إب",
    status: "في الطريق",
    tone: "transit",
    updated: "اليوم ٩:١٥ ص",
    type: "ملابس",
    pickup: "نقطة استلام أمانتي — السوق المركزي",
  },
  {
    id: "AMA-48260",
    from: "صنعاء",
    to: "عدن",
    status: "تم الاستلام",
    tone: "done",
    updated: "أمس ٤:٣٠ م",
    type: "مستندات",
    pickup: "نقطة استلام أمانتي — شارع المدينة",
  },
  {
    id: "AMA-48243",
    from: "صنعاء",
    to: "الحديدة",
    status: "أمانة محفوظة",
    tone: "stored",
    updated: "قبل يومين",
    type: "صندوق مغلق",
    pickup: "مركز أمانتي الرئيسي",
  },
  {
    id: "AMA-48230",
    from: "صنعاء",
    to: "تعز",
    status: "قيد المعالجة",
    tone: "pending",
    updated: "قبل ٣ أيام",
    type: "إلكترونيات",
    pickup: "نقطة استلام أمانتي — الحي الشرقي",
  },
];

export const trackingTimeline: TimelineStep[] = [
  { label: "تم إنشاء الشحنة", time: "٢٠ أغسطس — ٠٩:٠٠ ص", state: "done" },
  { label: "تم استلام الشحنة في مركز أمانتي", time: "٢٠ أغسطس — ١١:٢٠ ص", state: "done" },
  { label: "تم تسليمها للسائق", time: "٢١ أغسطس — ٠٧:٤٥ ص", state: "done" },
  { label: "وصلت إلى نقطة الاستلام", time: "٢٢ أغسطس — ٠٥:١٠ م", state: "done" },
  { label: "جاهزة للاستلام", time: "اليوم — ١١:٤٠ ص", state: "current" },
  { label: "تم الاستلام", state: "upcoming" },
];

export const cities = [
  { name: "صنعاء", points: 6 },
  { name: "تعز", points: 4 },
  { name: "إب", points: 3 },
  { name: "عدن", points: 5 },
  { name: "الحديدة", points: 2 },
];

export const amanat = [
  { id: "AMN-1042", owner: "أمانة باسم: أحمد م.", status: "محفوظة", tone: "stored" as StatusTone, updated: "قبل يومين" },
  { id: "AMN-1039", owner: "أمانة باسم: سارة ع.", status: "جاهزة للاستلام", tone: "ready" as StatusTone, updated: "اليوم" },
];

export const notifications = [
  { title: "شحنتك AMA-48291 جاهزة للاستلام", time: "قبل ساعة" },
  { title: "تم تسليم AMA-48277 للسائق", time: "اليوم ٩:١٥ ص" },
  { title: "تم استلام أمانتك AMN-1042 في المركز", time: "قبل يومين" },
];
