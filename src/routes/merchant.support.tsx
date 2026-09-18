import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Clock3,
  Copy,
  CreditCard,
  Headphones,
  HelpCircle,
  LifeBuoy,
  MessageCircle,
  Package,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Truck,
  WalletCards,
  X,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";

export const Route = createFileRoute("/merchant/support")({
  head: () => ({
    meta: [
      {
        title: "الدعم والمساعدة | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "مركز الدعم والمساعدة الخاص بتجار أمانتي.",
      },
    ],
  }),
  component: MerchantSupportPage,
});

type SupportCategory =
  | "shipping"
  | "wallet"
  | "account"
  | "affiliate"
  | "technical"
  | "other";

type FaqItem = {
  question: string;
  answer: string;
  category: SupportCategory;
};

const faqs: FaqItem[] = [
  {
    question: "كيف أتابع حالة شحنة من متجري؟",
    answer:
      "يمكنك الدخول إلى قسم الطلبات من القائمة الجانبية، ثم البحث باستخدام رقم التتبع أو بيانات المستلم. ستظهر لك حالة الشحنة وآخر تحديث عليها.",
    category: "shipping",
  },
  {
    question: "متى يتم تحديث حالة الشحنة؟",
    answer:
      "يتم تحديث حالة الشحنة عند انتقالها بين مراحل المعالجة والشحن والتجهيز للاستلام والتسليم. قد يختلف وقت التحديث بحسب المرحلة التشغيلية.",
    category: "shipping",
  },
  {
    question: "كيف أعرف أرباحي ورسوم الشحن؟",
    answer:
      "من قسم المحفظة والأرباح يمكنك متابعة إجمالي رسوم الشحن وحالات التحصيل والمؤشرات المالية المتاحة لحساب متجرك.",
    category: "wallet",
  },
  {
    question: "هل أستطيع تغيير بيانات متجري؟",
    answer:
      "نعم، يمكنك إدارة البيانات المتاحة لحسابك من قسم الإعدادات. بعض البيانات الحساسة قد تحتاج إلى مراجعة من فريق أمانتي.",
    category: "account",
  },
  {
    question: "كيف أحمي حساب التاجر الخاص بي؟",
    answer:
      "ننصح بتفعيل التحقق بخطوتين واستخدام كلمة مرور قوية وعدم مشاركتها مع أي شخص. يمكنك إدارة التحقق بخطوتين من الإعدادات.",
    category: "account",
  },
  {
    question: "كيف تعمل الإحالات والعمولات؟",
    answer:
      "من قسم التسويق بالعمولة يمكنك متابعة رابط الإحالة ومؤشرات البرنامج. تفاصيل استحقاق العمولة تعتمد على قواعد البرنامج والحالات المؤهلة.",
    category: "affiliate",
  },
  {
    question: "ماذا أفعل إذا واجهت مشكلة تقنية؟",
    answer:
      "ابدأ بإعادة تحميل الصفحة وتأكد من اتصال الإنترنت. إذا استمرت المشكلة، أنشئ طلب دعم واذكر الصفحة التي ظهرت فيها المشكلة والخطوات التي أدت إليها.",
    category: "technical",
  },
  {
    question: "كيف أتواصل مع فريق الدعم؟",
    answer:
      "يمكنك إنشاء طلب دعم من هذه الصفحة مع اختيار نوع المشكلة وكتابة التفاصيل. كلما كانت المعلومات أوضح، كان من الأسهل معالجة الطلب بسرعة.",
    category: "other",
  },
];

const quickActions = [
  {
    title: "مشكلة في شحنة",
    description: "تتبع أو تحديث أو تسليم",
    icon: Truck,
    category: "shipping" as SupportCategory,
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    title: "المحفظة والأرباح",
    description: "الرصيد أو التحصيلات",
    icon: WalletCards,
    category: "wallet" as SupportCategory,
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "الحساب والأمان",
    description: "الدخول أو التحقق",
    icon: ShieldCheck,
    category: "account" as SupportCategory,
    iconClass: "bg-violet-50 text-violet-600",
  },
  {
    title: "التسويق والعمولات",
    description: "الإحالات والمكافآت",
    icon: Sparkles,
    category: "affiliate" as SupportCategory,
    iconClass: "bg-amber-50 text-amber-600",
  },
];

const categoryLabels: Record<SupportCategory, string> = {
  shipping: "الشحنات",
  wallet: "المحفظة والأرباح",
  account: "الحساب والأمان",
  affiliate: "التسويق والعمولات",
  technical: "مشكلة تقنية",
  other: "استفسار آخر",
};

function MerchantSupportPage() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory>("shipping");

  const [showTicketModal, setShowTicketModal] =
    useState(false);

  const [showSuccess, setShowSuccess] = useState(false);

  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketTracking, setTicketTracking] = useState("");

  const [copied, setCopied] = useState(false);

  const filteredFaqs = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return faqs;
    }

    return faqs.filter((item) =>
      `${item.question} ${item.answer}`
        .toLowerCase()
        .includes(value),
    );
  }, [search]);

  function openTicket(category: SupportCategory = selectedCategory) {
    setSelectedCategory(category);
    setShowTicketModal(true);
    setShowSuccess(false);
  }

  function closeTicket() {
    setShowTicketModal(false);
    setShowSuccess(false);
  }

  function submitTicket() {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      return;
    }

    const ticket = {
      id: `AMANATI-${Date.now().toString().slice(-6)}`,
      category: selectedCategory,
      subject: ticketSubject.trim(),
      message: ticketMessage.trim(),
      trackingNumber: ticketTracking.trim(),
      createdAt: new Date().toISOString(),
    };

    const previousTickets = JSON.parse(
      localStorage.getItem("amanati-merchant-support-tickets") ??
        "[]",
    );

    localStorage.setItem(
      "amanati-merchant-support-tickets",
      JSON.stringify([ticket, ...previousTickets]),
    );

    setShowSuccess(true);
  }

  async function copyTicketInfo() {
    await navigator.clipboard.writeText(
      "أمانتي - طلب دعم\n" +
        `القسم: ${categoryLabels[selectedCategory]}\n` +
        `الموضوع: ${ticketSubject || "غير محدد"}\n` +
        `رقم التتبع: ${ticketTracking || "لا يوجد"}\n` +
        `التفاصيل: ${ticketMessage || "غير محددة"}`,
    );

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
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
        <div className="pointer-events-none absolute -left-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 right-20 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />

        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold backdrop-blur">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-300" />
                </span>

                مركز الدعم متاح
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white/80">
                <Sparkles className="size-3.5" />
                نحن هنا لمساعدتك
              </div>
            </div>

            <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              تحتاج مساعدة؟
              <br />
              <span className="text-white/70">
                خلّها علينا.
              </span>
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
              مركز الدعم الخاص بتجار أمانتي. ابحث عن إجابتك،
              استعرض الحلول السريعة، أو أرسل طلب دعم وسنساعدك
              في حل المشكلة.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => openTicket()}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <MessageCircle className="size-4" />
                تحدث مع الدعم
                <ArrowLeft className="size-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("merchant-faq")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
              >
                <BookOpen className="size-4" />
                مركز المعرفة
              </button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative flex size-44 items-center justify-center rounded-[2.5rem] border border-white/10 bg-white/10 shadow-2xl backdrop-blur">
              <div className="absolute inset-4 rounded-[2rem] border border-white/10" />

              <div className="relative flex size-24 items-center justify-center rounded-3xl bg-white text-primary shadow-xl">
                <Headphones
                  className="size-12"
                  strokeWidth={1.7}
                />
              </div>

              <div className="absolute -right-4 top-6 flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <CheckCircle2 className="size-5 text-emerald-300" />
              </div>

              <div className="absolute -bottom-3 -left-4 flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <Sparkles className="size-5 text-amber-300" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Clock3 className="size-5 text-white/60" />

            <div>
              <p className="text-xs text-white/50">
                الاستجابة
              </p>

              <p className="mt-0.5 text-sm font-extrabold">
                بأسرع وقت ممكن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5 text-white/60" />

            <div>
              <p className="text-xs text-white/50">
                الأمان
              </p>

              <p className="mt-0.5 text-sm font-extrabold">
                بياناتك محمية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LifeBuoy className="size-5 text-white/60" />

            <div>
              <p className="text-xs text-white/50">
                الدعم
              </p>

              <p className="mt-0.5 text-sm font-extrabold">
                دعم مخصص للتجار
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h3 className="text-xl font-black text-primary">
            كيف نقدر نساعدك؟
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            اختر الموضوع الأقرب لمشكلتك وسنأخذك مباشرة إلى
            الخطوة المناسبة.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <button
              key={item.title}
              type="button"
              onClick={() => openTicket(item.category)}
              className="group text-right"
            >
              <Card className="h-full overflow-hidden p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${item.iconClass} transition duration-300 group-hover:scale-110`}
                  >
                    <item.icon className="size-6" />
                  </div>

                  <ArrowLeft className="mt-1 size-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary" />
                </div>

                <h4 className="mt-5 text-base font-black text-primary">
                  {item.title}
                </h4>

                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </Card>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <Card className="relative overflow-hidden p-5 sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-16 size-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Search className="size-5" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-primary">
                    ابحث في مركز المعرفة
                  </h3>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ربما تكون إجابة سؤالك هنا بالفعل.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full md:max-w-md">
              <Search className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="ابحث عن مشكلة أو سؤال..."
                className="h-12 w-full rounded-2xl border border-border bg-muted/30 pr-11 pl-4 text-sm font-medium text-primary outline-none transition focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-primary"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          FAQ
      ===================================================== */}

      <section id="merchant-faq">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-primary">
              الأسئلة الشائعة
            </h3>

            <p className="mt-1 text-sm text-muted-foreground">
              إجابات سريعة على أكثر الأسئلة التي قد تواجهك.
            </p>
          </div>

          {search && (
            <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              {filteredFaqs.length} نتيجة
            </span>
          )}
        </div>

        <div className="grid gap-3">
          {filteredFaqs.length === 0 ? (
            <Card className="p-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <HelpCircle className="size-7" />
              </div>

              <h4 className="mt-4 text-base font-black text-primary">
                لم نجد إجابة مطابقة
              </h4>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                جرّب كلمات مختلفة أو أرسل طلب دعم وسنساعدك
                مباشرة.
              </p>

              <button
                type="button"
                onClick={() => openTicket("other")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
              >
                <MessageCircle className="size-4" />
                إرسال طلب دعم
              </button>
            </Card>
          ) : (
            filteredFaqs.map((item) => {
              const index = faqs.indexOf(item);
              const isOpen = openFaq === index;

              return (
                <Card
                  key={item.question}
                  className="overflow-hidden p-0"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaq(isOpen ? null : index)
                    }
                    className="flex w-full items-center justify-between gap-4 p-5 text-right transition hover:bg-muted/30 sm:p-6"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl transition ${
                          isOpen
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        <HelpCircle className="size-4.5" />
                      </div>

                      <span className="text-sm font-extrabold leading-6 text-primary">
                        {item.question}
                      </span>
                    </div>

                    <ChevronDown
                      className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/20 px-5 pb-6 pt-5 sm:px-6">
                      <p className="pr-12 text-sm leading-7 text-muted-foreground">
                        {item.answer}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          openTicket(item.category)
                        }
                        className="mt-5 mr-12 inline-flex items-center gap-2 text-xs font-black text-primary transition hover:gap-3"
                      >
                        ما زلت بحاجة للمساعدة
                        <ArrowLeft className="size-3.5" />
                      </button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* =====================================================
          SECURITY + SUPPORT
      ===================================================== */}

      <section className="grid gap-5 lg:grid-cols-2">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute -left-12 -top-12 size-32 rounded-full bg-emerald-500/5 blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="size-6" />
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
                حماية الحساب
              </span>
            </div>

            <h3 className="mt-5 text-lg font-black text-primary">
              حسابك أمانة
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              لا تشارك كلمة المرور أو رموز التحقق مع أي شخص.
              ولحماية إضافية، يمكنك تفعيل التحقق بخطوتين من
              صفحة الإعدادات.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-bold text-primary">
                <ShieldCheck className="size-3.5" />
                تحقق بخطوتين
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-bold text-primary">
                <LockKeyholeIcon />
                كلمة مرور قوية
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden bg-muted/20 p-6 sm:p-7">
          <div className="absolute -bottom-16 -left-16 size-40 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LifeBuoy className="size-6" />
              </div>

              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary">
                دعم مخصص
              </span>
            </div>

            <h3 className="mt-5 text-lg font-black text-primary">
              لم تجد ما تبحث عنه؟
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              لا تقلق. أخبرنا بالتفاصيل وسنساعدك على تحديد
              المشكلة والوصول للحل المناسب.
            </p>

            <button
              type="button"
              onClick={() => openTicket("other")}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Ticket className="size-4" />
              إنشاء طلب دعم
              <ArrowLeft className="size-3.5" />
            </button>
          </div>
        </Card>
      </section>

      {/* =====================================================
          SUPPORT MODAL
      ===================================================== */}

      {showTicketModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeTicket}
        >
          <div
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-background shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {!showSuccess ? (
              <>
                <div className="relative overflow-hidden rounded-t-[2rem] bg-primary p-6 text-primary-foreground sm:p-7">
                  <div className="absolute -left-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10">
                        <Ticket className="size-6" />
                      </div>

                      <div>
                        <h3 className="text-xl font-black">
                          إنشاء طلب دعم
                        </h3>

                        <p className="mt-1 text-xs leading-6 text-white/65">
                          اكتب لنا المشكلة بالتفصيل وسنراجعها.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeTicket}
                      className="flex size-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 p-6 sm:p-7">
                  <div>
                    <label className="mb-2 block text-xs font-black text-primary">
                      نوع المشكلة
                    </label>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {(
                        Object.keys(
                          categoryLabels,
                        ) as SupportCategory[]
                      ).map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() =>
                            setSelectedCategory(category)
                          }
                          className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                            selectedCategory === category
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {categoryLabels[category]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-primary">
                      موضوع الطلب
                    </label>

                    <input
                      value={ticketSubject}
                      onChange={(event) =>
                        setTicketSubject(
                          event.target.value,
                        )
                      }
                      placeholder="مثلاً: مشكلة في تحديث حالة الشحنة"
                      className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-primary">
                      رقم التتبع
                      <span className="mr-1 font-normal text-muted-foreground">
                        (اختياري)
                      </span>
                    </label>

                    <div className="relative">
                      <Package className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        value={ticketTracking}
                        onChange={(event) =>
                          setTicketTracking(
                            event.target.value,
                          )
                        }
                        placeholder="مثلاً: AMN-123456"
                        className="h-12 w-full rounded-xl border border-border bg-background pr-11 pl-4 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-primary">
                      تفاصيل المشكلة
                    </label>

                    <textarea
                      value={ticketMessage}
                      onChange={(event) =>
                        setTicketMessage(
                          event.target.value,
                        )
                      }
                      rows={6}
                      placeholder="اشرح لنا ماذا حدث، وما الخطوات التي قمت بها، وأي معلومات تعتقد أنها ستساعدنا..."
                      className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm font-medium leading-7 text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-blue-600" />

                    <p className="text-xs leading-6 text-blue-800">
                      تجنب إرسال كلمات المرور أو رموز التحقق أو
                      أي معلومات سرية داخل رسالة الدعم.
                    </p>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeTicket}
                      className="rounded-xl border border-border px-5 py-3 text-sm font-bold text-muted-foreground transition hover:bg-muted"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={submitTicket}
                      disabled={
                        !ticketSubject.trim() ||
                        !ticketMessage.trim()
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="size-4" />
                      إرسال طلب الدعم
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-7 text-center sm:p-10">
                <div className="mx-auto flex size-20 items-center justify-center rounded-[1.75rem] bg-emerald-50 text-emerald-600">
                  <CheckCircle2
                    className="size-10"
                    strokeWidth={1.8}
                  />
                </div>

                <h3 className="mt-6 text-2xl font-black text-primary">
                  تم تجهيز طلب الدعم 🎉
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  تم حفظ تفاصيل طلبك على هذا الجهاز بنجاح.
                  سيتم ربط هذه التذكرة بنظام الدعم الفعلي
                  عند تفعيل قاعدة بيانات التذاكر.
                </p>

                <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-muted/30 p-4 text-right">
                  <p className="text-[11px] font-bold text-muted-foreground">
                    نوع الطلب
                  </p>

                  <p className="mt-1 text-sm font-black text-primary">
                    {categoryLabels[selectedCategory]}
                  </p>

                  {ticketTracking && (
                    <>
                      <p className="mt-4 text-[11px] font-bold text-muted-foreground">
                        رقم التتبع
                      </p>

                      <p className="mt-1 text-sm font-black text-primary">
                        {ticketTracking}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <button
                    type="button"
                    onClick={copyTicketInfo}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-black text-primary transition hover:bg-muted"
                  >
                    {copied ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <Copy className="size-4" />
                    )}

                    {copied
                      ? "تم النسخ"
                      : "نسخ تفاصيل الطلب"}
                  </button>

                  <button
                    type="button"
                    onClick={closeTicket}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground"
                  >
                    <CheckCircle2 className="size-4" />
                    تم
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * أيقونة صغيرة خاصة بكلمة المرور حتى لا نحتاج
 * إلى أي مكون إضافي.
 */
function LockKeyholeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-3.5"
      aria-hidden="true"
    >
      <rect
        width="13"
        height="10"
        x="5.5"
        y="10"
        rx="2"
      />
      <path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" />
      <path d="M12 14v2" />
    </svg>
  );
}
