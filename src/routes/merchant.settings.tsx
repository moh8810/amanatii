import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  Moon,
  Phone,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Store,
  Sun,
  User,
  X,
} from "lucide-react";

import { Card } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute(
  "/merchant/settings",
)({
  head: () => ({
    meta: [
      {
        title: "الإعدادات | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "إدارة بيانات حساب التاجر والأمان والخصوصية والإشعارات في أمانتي.",
      },
    ],
  }),
  component: MerchantSettingsPage,
});

type SectionType =
  | "account"
  | "security"
  | "notifications"
  | "appearance";

type NotificationSettings = {
  orders: boolean;
  status: boolean;
  marketing: boolean;
};

type ProfileData = {
  full_name: string;
  phone: string;
};

type MfaFactor = {
  id: string;
  friendly_name: string | null;
  factor_type: string;
  status: string;
};

function MerchantSettingsPage() {
  const [activeSection, setActiveSection] =
    useState<SectionType>("account");

  const [loading, setLoading] =
    useState(true);

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [savingPassword, setSavingPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [profile, setProfile] =
    useState<ProfileData>({
      full_name: "",
      phone: "",
    });

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [notifications, setNotifications] =
    useState<NotificationSettings>({
      orders: true,
      status: true,
      marketing: false,
    });

  const [mfaFactor, setMfaFactor] =
    useState<MfaFactor | null>(null);

  const [mfaLoading, setMfaLoading] =
    useState(false);

  const [showMfaModal, setShowMfaModal] =
    useState(false);

  const [qrCode, setQrCode] =
    useState("");

  const [mfaSecret, setMfaSecret] =
    useState("");

  const [mfaFactorId, setMfaFactorId] =
    useState("");

  const [mfaVerifyCode, setMfaVerifyCode] =
    useState("");

  const [mfaError, setMfaError] =
    useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  async function loadSettings() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول للوصول إلى الإعدادات.",
        );
      }

      setEmail(user.email ?? "");

      const {
        data,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, phone, role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(
          "MERCHANT SETTINGS PROFILE ERROR:",
          profileError,
        );

        throw new Error(
          "تعذر تحميل بيانات الحساب.",
        );
      }

      if (data.role !== "merchant") {
        throw new Error(
          "هذه الصفحة مخصصة لحسابات التجار فقط.",
        );
      }

      setProfile({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
      });

      const storedNotifications =
        window.localStorage.getItem(
          "amanati-merchant-notifications",
        );

      if (storedNotifications) {
        try {
          const parsed =
            JSON.parse(
              storedNotifications,
            ) as NotificationSettings;

          setNotifications({
            orders:
              parsed.orders !== false,
            status:
              parsed.status !== false,
            marketing:
              parsed.marketing === true,
          });
        } catch {
          // تجاهل أي بيانات محلية تالفة.
        }
      }

      await loadMfaFactor();
    } catch (loadError) {
      console.error(
        "MERCHANT SETTINGS LOAD ERROR:",
        loadError,
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "حدث خطأ أثناء تحميل الإعدادات.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadMfaFactor() {
    const {
      data,
      error: mfaListError,
    } = await supabase.auth.mfa.listFactors();

    if (mfaListError) {
      console.error(
        "MFA LIST ERROR:",
        mfaListError,
      );

      return;
    }

    const verifiedTotp =
      data.totp?.find(
        (factor) =>
          factor.status === "verified",
      );

    if (verifiedTotp) {
      setMfaFactor({
        id: verifiedTotp.id,
        friendly_name:
          verifiedTotp.friendly_name,
        factor_type:
          verifiedTotp.factor_type,
        status:
          verifiedTotp.status,
      });
    } else {
      setMfaFactor(null);
    }
  }

  useEffect(() => {
    void loadSettings();
  }, []);

  function clearMessages() {
    setError("");
    setSuccess("");
  }

  async function saveProfile(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    clearMessages();
    setSavingProfile(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(
          "يجب تسجيل الدخول أولاً.",
        );
      }

      if (!profile.full_name.trim()) {
        throw new Error(
          "يرجى إدخال الاسم الكامل.",
        );
      }

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name:
            profile.full_name.trim(),
          phone:
            profile.phone.trim() || null,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error(
          "SAVE MERCHANT PROFILE ERROR:",
          updateError,
        );

        throw new Error(
          "تعذر حفظ بيانات الحساب. تحقق من الصلاحيات.",
        );
      }

      setSuccess(
        "تم حفظ بيانات الحساب بنجاح.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "تعذر حفظ البيانات.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    clearMessages();

    if (password.length < 8) {
      setError(
        "كلمة المرور الجديدة يجب أن تحتوي على 8 أحرف أو أرقام على الأقل.",
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "تأكيد كلمة المرور غير مطابق.",
      );

      return;
    }

    setSavingPassword(true);

    try {
      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        console.error(
          "PASSWORD UPDATE ERROR:",
          updateError,
        );

        throw new Error(
          updateError.message ||
            "تعذر تغيير كلمة المرور.",
        );
      }

      setPassword("");
      setConfirmPassword("");

      setSuccess(
        "تم تغيير كلمة المرور بنجاح.",
      );
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "تعذر تغيير كلمة المرور.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function updateNotification(
    key: keyof NotificationSettings,
    value: boolean,
  ) {
    const next = {
      ...notifications,
      [key]: value,
    };

    setNotifications(next);

    window.localStorage.setItem(
      "amanati-merchant-notifications",
      JSON.stringify(next),
    );

    setSuccess(
      "تم تحديث تفضيلات الإشعارات.",
    );

    window.setTimeout(() => {
      setSuccess("");
    }, 2200);
  }

  async function startMfaEnrollment() {
    setMfaLoading(true);
    setMfaError("");
    clearMessages();

    try {
      const {
        data,
        error: enrollError,
      } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName:
          "هاتف التاجر",
      });

      if (enrollError) {
        console.error(
          "MFA ENROLL ERROR:",
          enrollError,
        );

        throw new Error(
          enrollError.message ||
            "تعذر بدء إعداد التحقق بخطوتين.",
        );
      }

      if (!data?.id || !data.totp) {
        throw new Error(
          "تعذر إنشاء عامل التحقق بخطوتين.",
        );
      }

      setMfaFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaVerifyCode("");
      setShowMfaModal(true);
    } catch (enrollError) {
      setMfaError(
        enrollError instanceof Error
          ? enrollError.message
          : "تعذر إعداد التحقق بخطوتين.",
      );
    } finally {
      setMfaLoading(false);
    }
  }

  async function verifyMfa() {
    if (!mfaFactorId) {
      return;
    }

    if (
      !/^\d{6}$/.test(
        mfaVerifyCode.trim(),
      )
    ) {
      setMfaError(
        "أدخل رمز التحقق المكون من 6 أرقام.",
      );

      return;
    }

    setMfaLoading(true);
    setMfaError("");

    try {
      const {
        data: challengeData,
        error: challengeError,
      } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) {
        throw new Error(
          challengeError.message ||
            "تعذر إنشاء طلب التحقق.",
        );
      }

      const {
        error: verifyError,
      } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId:
          challengeData.id,
        code:
          mfaVerifyCode.trim(),
      });

      if (verifyError) {
        throw new Error(
          verifyError.message ||
            "رمز التحقق غير صحيح.",
        );
      }

      setShowMfaModal(false);
      setQrCode("");
      setMfaSecret("");
      setMfaVerifyCode("");

      await loadMfaFactor();

      setSuccess(
        "تم تفعيل التحقق بخطوتين بنجاح.",
      );
    } catch (verifyError) {
      console.error(
        "MFA VERIFY ERROR:",
        verifyError,
      );

      setMfaError(
        verifyError instanceof Error
          ? verifyError.message
          : "رمز التحقق غير صحيح.",
      );
    } finally {
      setMfaLoading(false);
    }
  }

  async function disableMfa() {
    if (!mfaFactor) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل أنت متأكد من إيقاف التحقق بخطوتين؟",
      );

    if (!confirmed) {
      return;
    }

    setMfaLoading(true);
    clearMessages();

    try {
      const {
        error: unenrollError,
      } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactor.id,
      });

      if (unenrollError) {
        console.error(
          "MFA UNENROLL ERROR:",
          unenrollError,
        );

        throw new Error(
          unenrollError.message ||
            "تعذر إيقاف التحقق بخطوتين.",
        );
      }

      await supabase.auth.refreshSession();

      setMfaFactor(null);

      setSuccess(
        "تم إيقاف التحقق بخطوتين.",
      );
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "تعذر إيقاف التحقق بخطوتين.",
      );
    } finally {
      setMfaLoading(false);
    }
  }

  async function signOut() {
    const confirmed =
      window.confirm(
        "هل تريد تسجيل الخروج من حساب التاجر؟",
      );

    if (!confirmed) {
      return;
    }

    await supabase.auth.signOut();

    window.location.href =
      "/login";
  }

  function goToSection(
    section: SectionType,
  ) {
    setActiveSection(section);
    clearMessages();
  }

  const sections = [
    {
      id: "account" as const,
      title: "الحساب والمتجر",
      description:
        "بياناتك الأساسية ومعلومات التواصل.",
      icon: User,
    },
    {
      id: "security" as const,
      title: "الأمان",
      description:
        "كلمة المرور والتحقق بخطوتين.",
      icon: ShieldCheck,
    },
    {
      id: "notifications" as const,
      title: "الإشعارات",
      description:
        "تحكم في التنبيهات التي تصلك.",
      icon: Bell,
    },
    {
      id: "appearance" as const,
      title: "المظهر",
      description:
        "تفضيلات واجهة لوحة التاجر.",
      icon: Settings2,
    },
  ];

  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-[520px] items-center justify-center"
      >
        <div className="flex flex-col items-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/5">
            <Settings2 className="size-7 animate-pulse text-primary" />
          </div>

          <p className="mt-5 text-sm font-extrabold text-primary">
            جاري تجهيز إعدادات حسابك...
          </p>

          <p className="mt-2 text-xs text-muted-foreground">
            لحظات ونجهز لك كل شيء.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="space-y-6"
    >
      {/* =====================================================
          HERO
      ===================================================== */}
      <Card className="relative overflow-hidden border-primary/10 bg-gradient-to-br from-primary via-primary to-primary/90 p-6 text-primary-foreground shadow-soft sm:p-8">
        <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 right-1/3 size-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Settings2 className="size-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-white/60">
                  مركز التحكم
                </p>

                <h2 className="mt-0.5 text-2xl font-extrabold sm:text-3xl">
                  إعدادات الحساب
                </h2>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70">
              تحكم في بيانات حسابك وأمانه وإشعاراتك
              وتفضيلات لوحة التاجر من مكان واحد.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
              <Store className="size-5" />
            </div>

            <div>
              <p className="text-[10px] font-bold text-white/55">
                حسابك
              </p>

              <p className="text-sm font-extrabold">
                تاجر أمانتي
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          الرسائل
      ===================================================== */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-100">
              <X className="size-4 text-red-700" />
            </div>

            <div>
              <p className="text-sm font-extrabold text-red-700">
                تعذر تنفيذ العملية
              </p>

              <p className="mt-1 text-xs leading-6 text-red-600">
                {error}
              </p>
            </div>
          </div>
        </Card>
      )}

      {success && (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <CheckCircle2 className="size-4 text-emerald-700" />
            </div>

            <p className="text-sm font-extrabold text-emerald-700">
              {success}
            </p>
          </div>
        </Card>
      )}

      {/* =====================================================
          BODY
      ===================================================== */}
      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* SIDEBAR SETTINGS */}
        <aside className="h-fit lg:sticky lg:top-6">
          <Card className="overflow-hidden p-2">
            <div className="p-3">
              <p className="text-[10px] font-extrabold tracking-wider text-muted-foreground">
                الإعدادات
              </p>
            </div>

            <nav className="space-y-1">
              {sections.map(
                ({
                  id,
                  title,
                  description,
                  icon: Icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      goToSection(id)
                    }
                    className={`group flex w-full items-center gap-3 rounded-2xl p-3 text-right transition-all duration-200 ${
                      activeSection === id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl transition ${
                        activeSection === id
                          ? "bg-white/10"
                          : "bg-muted group-hover:bg-primary/5"
                      }`}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold">
                        {title}
                      </p>

                      <p
                        className={`mt-0.5 truncate text-[10px] ${
                          activeSection === id
                            ? "text-white/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {description}
                      </p>
                    </div>

                    <ChevronLeft className="size-4 shrink-0 opacity-50" />
                  </button>
                ),
              )}
            </nav>

            <div className="my-2 border-t border-border" />

            <button
              type="button"
              onClick={() =>
                void signOut()
              }
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-right text-red-600 transition hover:bg-red-50"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50">
                <LogOut className="size-4" />
              </div>

              <div>
                <p className="text-xs font-extrabold">
                  تسجيل الخروج
                </p>

                <p className="mt-0.5 text-[10px] text-red-400">
                  إنهاء جلسة الحساب
                </p>
              </div>
            </button>
          </Card>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0">
          {activeSection === "account" && (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-extrabold text-primary">
                  الحساب والمتجر
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  حدّث بياناتك الأساسية ومعلومات التواصل.
                </p>
              </div>

              <Card className="overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                      <User className="size-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        البيانات الشخصية
                      </h4>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        هذه المعلومات تظهر ضمن حسابك.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={saveProfile}
                  className="space-y-5 p-5 sm:p-6"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-primary">
                        الاسم الكامل
                      </span>

                      <div className="relative">
                        <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          value={profile.full_name}
                          onChange={(event) =>
                            setProfile(
                              (current) => ({
                                ...current,
                                full_name:
                                  event.target.value,
                              }),
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background py-3.5 pr-11 pl-4 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                          placeholder="محمد منير"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-primary">
                        رقم الهاتف
                      </span>

                      <div className="relative">
                        <Phone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          value={profile.phone}
                          onChange={(event) =>
                            setProfile(
                              (current) => ({
                                ...current,
                                phone:
                                  event.target.value,
                              }),
                            )
                          }
                          dir="ltr"
                          className="w-full rounded-xl border border-border bg-background py-3.5 pr-11 pl-4 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                          placeholder="7XXXXXXXX"
                        />
                      </div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-extrabold text-primary">
                      البريد الإلكتروني
                    </span>

                    <div className="relative">
                      <Mail className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <input
                        value={email}
                        readOnly
                        dir="ltr"
                        className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/40 py-3.5 pr-11 pl-4 text-sm font-medium text-muted-foreground outline-none"
                      />
                    </div>

                    <p className="mt-2 text-[10px] text-muted-foreground">
                      البريد مرتبط بحساب تسجيل الدخول.
                    </p>
                  </label>

                  <div className="flex justify-end border-t border-border pt-5">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingProfile ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          جاري الحفظ...
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          حفظ التغييرات
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Card>

              <Card className="border-primary/10 bg-primary/[0.025] p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
                    <Store className="size-5 text-primary" />
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-primary">
                      حساب تاجر
                    </h4>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      هذا الحساب مخصص لإدارة الشحنات والعملاء
                      والأمانات والتقارير المالية الخاصة بمتجرك.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "security" && (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-extrabold text-primary">
                  الأمان والحماية
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  حافظ على حسابك محميًا باستخدام كلمة مرور قوية
                  والتحقق بخطوتين.
                </p>
              </div>

              {/* PASSWORD */}
              <Card className="overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                      <KeyRound className="size-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        تغيير كلمة المرور
                      </h4>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        استخدم كلمة مرور قوية وفريدة لحسابك.
                      </p>
                    </div>
                  </div>
                </div>

                <form
                  onSubmit={changePassword}
                  className="space-y-5 p-5 sm:p-6"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-primary">
                        كلمة المرور الجديدة
                      </span>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          value={password}
                          onChange={(event) =>
                            setPassword(
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background py-3.5 pr-11 pl-11 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                          placeholder="••••••••"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (value) =>
                                !value,
                            )
                          }
                          className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-primary">
                        تأكيد كلمة المرور
                      </span>

                      <div className="relative">
                        <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <input
                          type={
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          value={
                            confirmPassword
                          }
                          onChange={(event) =>
                            setConfirmPassword(
                              event.target.value,
                            )
                          }
                          className="w-full rounded-xl border border-border bg-background py-3.5 pr-11 pl-11 text-sm font-medium text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                          placeholder="••••••••"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (value) =>
                                !value,
                            )
                          }
                          className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-primary"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="rounded-2xl bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />

                      <p className="text-xs leading-6 text-muted-foreground">
                        نوصي باستخدام كلمة مرور تحتوي على أحرف
                        كبيرة وصغيرة وأرقام ورموز، وألا تستخدمها
                        في أي خدمة أخرى.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingPassword}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingPassword ? (
                        <>
                          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          جاري التحديث...
                        </>
                      ) : (
                        <>
                          <KeyRound className="size-4" />
                          تحديث كلمة المرور
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Card>

              {/* 2FA */}
              <Card className="relative overflow-hidden border-primary/10">
                <div className="pointer-events-none absolute -left-16 -top-16 size-48 rounded-full bg-primary/5 blur-2xl" />

                <div className="relative border-b border-border bg-primary/[0.025] p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <ShieldCheck className="size-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-primary">
                            التحقق بخطوتين
                          </h4>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[9px] font-extrabold ${
                              mfaFactor
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {mfaFactor
                              ? "مفعل"
                              : "غير مفعل"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          طبقة حماية إضافية باستخدام تطبيق المصادقة.
                        </p>
                      </div>
                    </div>

                    <Smartphone className="hidden size-7 text-primary/20 sm:block" />
                  </div>
                </div>

                <div className="relative p-5 sm:p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/5">
                        <Smartphone className="size-4 text-primary" />
                      </div>

                      <p className="mt-3 text-xs font-extrabold text-primary">
                        تطبيق المصادقة
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        Google Authenticator أو أي تطبيق يدعم TOTP.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50">
                        <CheckCircle2 className="size-4 text-emerald-700" />
                      </div>

                      <p className="mt-3 text-xs font-extrabold text-primary">
                        حماية إضافية
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        رمز مؤقت يتغير باستمرار لحماية الحساب.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-sky-50">
                        <LockKeyhole className="size-4 text-sky-700" />
                      </div>

                      <p className="mt-3 text-xs font-extrabold text-primary">
                        أمان الحساب
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        يقلل خطر الوصول غير المصرح به إلى الحساب.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4 rounded-2xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-extrabold text-primary">
                        {mfaFactor
                          ? "التحقق بخطوتين يحمي حسابك الآن"
                          : "حسابك غير محمي بالتحقق بخطوتين"}
                      </p>

                      <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                        {mfaFactor
                          ? "تم ربط تطبيق مصادقة بحسابك."
                          : "ننصح بتفعيل هذه الميزة لحسابات التجار."}
                      </p>
                    </div>

                    {mfaFactor ? (
                      <button
                        type="button"
                        onClick={() =>
                          void disableMfa()
                        }
                        disabled={mfaLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {mfaLoading ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
                        ) : (
                          <ShieldCheck className="size-4" />
                        )}
                        إيقاف التحقق
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void startMfaEnrollment()
                        }
                        disabled={mfaLoading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-extrabold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:opacity-95 disabled:opacity-50"
                      >
                        {mfaLoading ? (
                          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <ShieldCheck className="size-4" />
                        )}
                        تفعيل التحقق بخطوتين
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              {/* SESSION */}
              <Card className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-muted">
                      <Laptop className="size-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        جلسة الحساب الحالية
                      </h4>

                      <p className="mt-1 text-xs text-muted-foreground">
                        أنت مسجل الدخول حاليًا إلى لوحة التاجر.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void signOut()
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-extrabold text-primary transition hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                    تسجيل الخروج
                  </button>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "notifications" && (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-extrabold text-primary">
                  الإشعارات
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  اختر أنواع التنبيهات التي تريد متابعتها.
                </p>
              </div>

              <Card className="overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                      <Bell className="size-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        تفضيلات التنبيهات
                      </h4>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        يمكنك تعديل هذه التفضيلات في أي وقت.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  <NotificationRow
                    icon={PackageIcon}
                    title="طلبات جديدة"
                    description="إشعار عند وصول طلب أو شحنة جديدة إلى متجرك."
                    enabled={notifications.orders}
                    onChange={(value) =>
                      updateNotification(
                        "orders",
                        value,
                      )
                    }
                  />

                  <NotificationRow
                    icon={TruckIcon}
                    title="تحديثات الشحنات"
                    description="تنبيهات عند تغير حالة شحناتك أو اكتمال التسليم."
                    enabled={notifications.status}
                    onChange={(value) =>
                      updateNotification(
                        "status",
                        value,
                      )
                    }
                  />

                  <NotificationRow
                    icon={Bell}
                    title="العروض والتحديثات"
                    description="أخبار أمانتي والعروض والميزات الجديدة للتجار."
                    enabled={notifications.marketing}
                    onChange={(value) =>
                      updateNotification(
                        "marketing",
                        value,
                      )
                    }
                  />
                </div>
              </Card>

              <Card className="border-primary/10 bg-primary/[0.025] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Bell className="mt-0.5 size-5 text-primary" />

                  <div>
                    <p className="text-sm font-extrabold text-primary">
                      ملاحظة
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      إعدادات الإشعارات محفوظة لهذا المتصفح. عند
                      ربط نظام الإشعارات المركزي لاحقًا، يمكن نقلها
                      إلى حسابك في قاعدة البيانات.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}

          {activeSection === "appearance" && (
            <section className="space-y-5">
              <div>
                <h3 className="text-xl font-extrabold text-primary">
                  المظهر والتفضيلات
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  إعدادات واجهة لوحة التاجر.
                </p>
              </div>

              <Card className="overflow-hidden">
                <div className="border-b border-border bg-muted/20 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                      <Settings2 className="size-5 text-primary" />
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-primary">
                        تفضيلات الواجهة
                      </h4>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        بعض الخيارات مصممة خصيصًا لتجربة أمانتي.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50">
                        <Sun className="size-4 text-amber-600" />
                      </div>

                      <div>
                        <p className="text-xs font-extrabold text-primary">
                          الوضع الحالي
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          تصميم أمانتي الفاتح
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary">
                      فاتح
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50">
                        <Moon className="size-4 text-sky-700" />
                      </div>

                      <div>
                        <p className="text-xs font-extrabold text-primary">
                          الوضع الداكن
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          سيتم توفيره ضمن تحديثات الواجهة القادمة.
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-extrabold text-muted-foreground">
                      قريبًا
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/5">
                        <Mail className="size-4 text-primary" />
                      </div>

                      <div>
                        <p className="text-xs font-extrabold text-primary">
                          لغة لوحة التحكم
                        </p>

                        <p className="mt-1 text-[10px] text-muted-foreground">
                          اللغة العربية — اتجاه RTL
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-primary/5 px-3 py-1.5 text-[10px] font-extrabold text-primary">
                      العربية
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="border-primary/10 bg-primary/[0.025] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Settings2 className="mt-0.5 size-5 text-primary" />

                  <div>
                    <p className="text-sm font-extrabold text-primary">
                      أمانتي تتطور معك
                    </p>

                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      سنضيف المزيد من خيارات تخصيص لوحة التاجر
                      مع تطور المنصة، بدون التأثير على بياناتك
                      أو عملياتك الحالية.
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          )}
        </main>
      </div>

      {/* =====================================================
          MFA MODAL
      ===================================================== */}
      {showMfaModal && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={() =>
            !mfaLoading &&
            setShowMfaModal(false)
          }
        >
          <div
            dir="rtl"
            className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="border-b border-border bg-primary p-5 text-primary-foreground sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10">
                    <ShieldCheck className="size-6" />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold">
                      تفعيل التحقق بخطوتين
                    </h3>

                    <p className="mt-1 text-xs text-white/60">
                      خطوة واحدة تفصلك عن حماية أقوى لحسابك.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={mfaLoading}
                  onClick={() =>
                    setShowMfaModal(false)
                  }
                  className="flex size-9 items-center justify-center rounded-xl text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[80vh] overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-6 md:grid-cols-[190px_1fr] md:items-start">
                <div className="flex flex-col items-center">
                  {qrCode ? (
                    <div className="rounded-3xl border border-border bg-white p-4 shadow-sm">
                      <img
                        src={qrCode}
                        alt="رمز QR لتفعيل التحقق بخطوتين"
                        className="size-40"
                      />
                    </div>
                  ) : (
                    <div className="flex size-48 items-center justify-center rounded-3xl bg-muted">
                      <span className="size-7 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                    </div>
                  )}

                  <p className="mt-3 text-center text-[10px] leading-5 text-muted-foreground">
                    امسح الرمز باستخدام تطبيق المصادقة في هاتفك.
                  </p>
                </div>

                <div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-extrabold text-primary">
                        1. افتح تطبيق المصادقة
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        استخدم Google Authenticator أو Microsoft
                        Authenticator أو أي تطبيق يدعم TOTP.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-primary">
                        2. امسح رمز QR
                      </p>

                      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                        بعد المسح سيظهر حساب أمانتي داخل تطبيق
                        المصادقة.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-extrabold text-primary">
                        3. أدخل الرمز المكون من 6 أرقام
                      </p>

                      <input
                        value={mfaVerifyCode}
                        onChange={(event) =>
                          setMfaVerifyCode(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          )
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        dir="ltr"
                        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-center text-xl font-extrabold tracking-[0.35em] text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                        placeholder="000000"
                      />
                    </div>

                    {mfaSecret && (
                      <div className="rounded-2xl bg-muted/50 p-3">
                        <p className="text-[9px] font-bold text-muted-foreground">
                          لا تستطيع مسح QR؟
                        </p>

                        <p className="mt-1 break-all font-mono text-[10px] font-bold text-primary">
                          {mfaSecret}
                        </p>
                      </div>
                    )}

                    {mfaError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-bold leading-5 text-red-700">
                          {mfaError}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void verifyMfa()
                    }
                    disabled={
                      mfaLoading ||
                      mfaVerifyCode.length !== 6
                    }
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-extrabold text-primary-foreground transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mfaLoading ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="size-4" />
                        تأكيد وتفعيل الحماية
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          DANGER AREA
      ===================================================== */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50">
              <X className="size-6 text-red-600" />
            </div>

            <h3 className="mt-5 text-lg font-extrabold text-primary">
              منطقة الإجراءات الحساسة
            </h3>

            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              أي إجراءات متعلقة بحذف الحساب يجب أن تتم من خلال
              فريق أمانتي لضمان عدم فقدان بيانات الشحنات والأمانات.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-extrabold text-primary hover:bg-muted"
              >
                إغلاق
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  window.location.href =
                    "/merchant/support";
                }}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground hover:opacity-90"
              >
                التواصل مع الدعم
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: typeof Bell;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-5 transition hover:bg-muted/20">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/5">
        <Icon className="size-5 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-primary">
          {title}
        </p>

        <p className="mt-1 max-w-2xl text-[10px] leading-5 text-muted-foreground">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() =>
          onChange(!enabled)
        }
        className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 ${
          enabled
            ? "bg-primary"
            : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
            enabled
              ? "right-1"
              : "right-6"
          }`}
        />
      </button>
    </div>
  );
}

function PackageIcon(
  props: React.ComponentProps<typeof PackageIconBase>,
) {
  return <PackageIconBase {...props} />;
}

function PackageIconBase(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16.5 9.4-9-5.19" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.27 6.96 8.73 5.05 8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  );
}

function TruckIcon(
  props: React.ComponentProps<typeof TruckIconBase>,
) {
  return <TruckIconBase {...props} />;
}

function TruckIconBase(
  props: React.SVGProps<SVGSVGElement>,
) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17h4V5H2v12h3" />
      <path d="M14 8h4l4 4v5h-2" />
      <circle cx="7.5" cy="17.5" r="2.5" />
      <circle cx="16.5" cy="17.5" r="2.5" />
    </svg>
  );
}
