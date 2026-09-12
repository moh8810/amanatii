import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Settings,
  User,
  Phone,
  Mail,
  Bell,
  LogOut,
  ArrowRight,
  Loader2,
  Save,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Lock,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      {
        title: "الإعدادات | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "إدارة بيانات الحساب والأمان والإشعارات في أمانتي.",
      },
    ],
  }),

  component: SettingsPage,
});

type Profile = {
  full_name: string | null;
  phone: string | null;
  email: string | null;
};

type MfaFactor = {
  id: string;
  type: string;
  status: string;
  friendly_name?: string | null;
};

function SettingsPage() {
  const [profile, setProfile] =
    useState<Profile>({
      full_name: "",
      phone: "",
      email: "",
    });

  const [emailConfirmed, setEmailConfirmed] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  /*
   * =====================================================
   * كلمة المرور
   * =====================================================
   */

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [changingPassword, setChangingPassword] =
    useState(false);

  /*
   * =====================================================
   * تأكيد البريد
   * =====================================================
   */

  const [sendingEmail, setSendingEmail] =
    useState(false);

  /*
   * =====================================================
   * المصادقة الثنائية 2FA
   * =====================================================
   */

  const [mfaLoading, setMfaLoading] =
    useState(true);

  const [mfaEnabled, setMfaEnabled] =
    useState(false);

  const [mfaFactor, setMfaFactor] =
    useState<MfaFactor | null>(null);

  const [mfaQrCode, setMfaQrCode] =
    useState("");

  const [mfaSecret, setMfaSecret] =
    useState("");

  const [mfaFactorId, setMfaFactorId] =
    useState("");

  const [mfaCode, setMfaCode] =
    useState("");

  const [mfaSettingUp, setMfaSettingUp] =
    useState(false);

  const [mfaVerifying, setMfaVerifying] =
    useState(false);

  const [mfaRemoving, setMfaRemoving] =
    useState(false);

  const [copiedSecret, setCopiedSecret] =
    useState(false);

  /*
   * =====================================================
   * تحميل الصفحة
   * =====================================================
   */

  useEffect(() => {
    loadProfile();
    loadMfa();
  }, []);

  /*
   * =====================================================
   * تحميل بيانات الحساب
   * =====================================================
   */

  async function loadProfile() {
    setLoading(true);
    setError("");
    setMessage("");
    setSaved(false);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "يجب تسجيل الدخول أولاً.",
        );

        return;
      }

      setEmailConfirmed(
        Boolean(user.email_confirmed_at),
      );

      const {
        data,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "full_name,phone,email",
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      setProfile({
        full_name:
          data?.full_name ?? "",
        phone:
          data?.phone ?? "",
        email:
          data?.email ??
          user.email ??
          "",
      });
    } catch (err) {
      console.error(
        "Error loading profile:",
        err,
      );

      setError(
        "حدث خطأ أثناء تحميل بيانات الحساب.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =====================================================
   * حفظ الاسم والهاتف
   * =====================================================
   */

  async function saveProfile() {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaved(false);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "يجب تسجيل الدخول أولاً.",
        );

        return;
      }

      const fullName =
        profile.full_name?.trim() ||
        null;

      const phone =
        profile.phone?.trim() ||
        null;

      const {
        error: updateError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(
        (current) => ({
          ...current,
          full_name:
            fullName ?? "",
          phone:
            phone ?? "",
        }),
      );

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      console.error(
        "Error saving profile:",
        err,
      );

      setError(
        "تعذر حفظ التغييرات. حاول مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =====================================================
   * إرسال رسالة تأكيد البريد
   * =====================================================
   */

  async function resendEmailConfirmation() {
    if (sendingEmail) {
      return;
    }

    setSendingEmail(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user?.email) {
        setError(
          "لا يوجد بريد إلكتروني مرتبط بالحساب.",
        );

        return;
      }

      if (user.email_confirmed_at) {
        setEmailConfirmed(true);

        setMessage(
          "البريد الإلكتروني مؤكد بالفعل.",
        );

        return;
      }

      const {
        error: resendError,
      } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: {
          emailRedirectTo:
            window.location.origin +
            "/dashboard",
        },
      });

      if (resendError) {
        throw resendError;
      }

      setMessage(
        "تم إرسال رسالة تأكيد جديدة إلى بريدك الإلكتروني. تحقق من البريد الوارد أو مجلد الرسائل غير المرغوب فيها.",
      );
    } catch (err) {
      console.error(
        "Email confirmation error:",
        err,
      );

      setError(
        "تعذر إرسال رسالة تأكيد البريد. حاول مرة أخرى.",
      );
    } finally {
      setSendingEmail(false);
    }
  }

  /*
   * =====================================================
   * تغيير كلمة المرور
   * =====================================================
   */

  async function changePassword() {
    if (changingPassword) {
      return;
    }

    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError(
        "يجب أن تتكون كلمة المرور من 8 أحرف أو أرقام على الأقل.",
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "كلمتا المرور غير متطابقتين.",
      );

      return;
    }

    setChangingPassword(true);

    try {
      const {
        error: updateError,
      } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);

      setMessage(
        "تم تغيير كلمة المرور بنجاح.",
      );
    } catch (err) {
      console.error(
        "Password change error:",
        err,
      );

      setError(
        "تعذر تغيير كلمة المرور. حاول مرة أخرى.",
      );
    } finally {
      setChangingPassword(false);
    }
  }

  /*
   * =====================================================
   * تحميل المصادقة الثنائية
   * =====================================================
   */

  async function loadMfa() {
    setMfaLoading(true);

    try {
      const {
        data,
        error: factorsError,
      } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const verifiedTotp =
        (data?.totp ?? []).find(
          (factor) =>
            factor.status ===
            "verified",
        );

      if (verifiedTotp) {
        setMfaEnabled(true);

        setMfaFactor({
          id: verifiedTotp.id,
          type: verifiedTotp.factor_type,
          status:
            verifiedTotp.status,
          friendly_name:
            verifiedTotp.friendly_name,
        });
      } else {
        setMfaEnabled(false);
        setMfaFactor(null);
      }
    } catch (err) {
      console.error(
        "MFA loading error:",
        err,
      );
    } finally {
      setMfaLoading(false);
    }
  }

  /*
   * =====================================================
   * بدء إعداد 2FA
   * =====================================================
   */

  async function startMfaSetup() {
    if (mfaSettingUp) {
      return;
    }

    setMfaSettingUp(true);
    setError("");
    setMessage("");

    setMfaQrCode("");
    setMfaSecret("");
    setMfaFactorId("");
    setMfaCode("");

    try {
      const {
        data,
        error: enrollError,
      } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName:
          "أمانتي Authenticator",
      });

      if (enrollError) {
        throw enrollError;
      }

      if (!data) {
        throw new Error(
          "لم يتم إنشاء عامل المصادقة.",
        );
      }

      setMfaFactorId(
        data.id,
      );

      setMfaQrCode(
        data.totp?.qr_code ?? "",
      );

      setMfaSecret(
        data.totp?.secret ?? "",
      );
    } catch (err) {
      console.error(
        "MFA enrollment error:",
        err,
      );

      setError(
        "تعذر بدء إعداد المصادقة الثنائية. حاول مرة أخرى.",
      );
    } finally {
      setMfaSettingUp(false);
    }
  }

  /*
   * =====================================================
   * التحقق من 2FA
   * =====================================================
   */

  async function verifyMfa() {
    if (
      mfaVerifying ||
      !mfaFactorId
    ) {
      return;
    }

    const code =
      mfaCode.trim();

    if (
      !/^\d{6}$/.test(code)
    ) {
      setError(
        "أدخل رمز المصادقة المكون من 6 أرقام.",
      );

      return;
    }

    setMfaVerifying(true);
    setError("");
    setMessage("");

    try {
      const {
        data,
        error: verifyError,
      } = await supabase.auth.mfa.challengeAndVerify({
        factorId:
          mfaFactorId,
        code,
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data) {
        throw new Error(
          "تعذر التحقق من رمز المصادقة.",
        );
      }

      setMfaEnabled(true);

      setMfaFactor({
        id: mfaFactorId,
        type: "totp",
        status: "verified",
        friendly_name:
          "أمانتي Authenticator",
      });

      setMfaQrCode("");
      setMfaSecret("");
      setMfaFactorId("");
      setMfaCode("");

      setMessage(
        "تم تفعيل المصادقة الثنائية بنجاح.",
      );

      await loadMfa();
    } catch (err) {
      console.error(
        "MFA verification error:",
        err,
      );

      setError(
        "رمز المصادقة غير صحيح أو انتهت صلاحيته. حاول مرة أخرى.",
      );
    } finally {
      setMfaVerifying(false);
    }
  }

  /*
   * =====================================================
   * إلغاء المصادقة الثنائية
   * =====================================================
   */

  async function disableMfa() {
    if (
      mfaRemoving ||
      !mfaFactor?.id
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "هل أنت متأكد من إيقاف المصادقة الثنائية؟ سيؤدي ذلك إلى إزالة عامل المصادقة من حسابك.",
      );

    if (!confirmed) {
      return;
    }

    setMfaRemoving(true);
    setError("");
    setMessage("");

    try {
      const {
        error: unenrollError,
      } = await supabase.auth.mfa.unenroll({
        factorId:
          mfaFactor.id,
      });

      if (unenrollError) {
        throw unenrollError;
      }

      setMfaEnabled(false);
      setMfaFactor(null);

      setMessage(
        "تم إيقاف المصادقة الثنائية.",
      );
    } catch (err) {
      console.error(
        "MFA disable error:",
        err,
      );

      setError(
        "تعذر إيقاف المصادقة الثنائية.",
      );
    } finally {
      setMfaRemoving(false);
    }
  }

  /*
   * =====================================================
   * نسخ مفتاح 2FA
   * =====================================================
   */

  async function copyMfaSecret() {
    if (!mfaSecret) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        mfaSecret,
      );

      setCopiedSecret(true);

      window.setTimeout(() => {
        setCopiedSecret(false);
      }, 2000);
    } catch (err) {
      console.error(
        "Copy error:",
        err,
      );
    }
  }

  /*
   * =====================================================
   * تسجيل الخروج
   * =====================================================
   */

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    setError("");

    try {
      const {
        error: logoutError,
      } = await supabase.auth.signOut();

      if (logoutError) {
        throw logoutError;
      }

      window.location.href =
        "/login";
    } catch (err) {
      console.error(
        "Logout error:",
        err,
      );

      setError(
        "تعذر تسجيل الخروج. حاول مرة أخرى.",
      );

      setLoggingOut(false);
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-900"
    >
      {/* =================================================
          Header
      ================================================== */}

      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl min-w-0 items-center justify-between gap-3 px-3 py-3.5 sm:px-6 sm:py-4">

          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm sm:size-11 sm:rounded-2xl">
              <Settings className="size-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold sm:text-xl">
                الإعدادات
              </h1>

              <p className="hidden truncate text-xs text-slate-500 sm:block sm:text-sm">
                إدارة بيانات حسابك وأمانه
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:gap-2 sm:px-3 sm:text-sm"
          >
            <ArrowRight className="size-4" />

            <span className="hidden sm:inline">
              لوحة التحكم
            </span>

            <span className="sm:hidden">
              الرئيسية
            </span>
          </Link>
        </div>
      </header>

      {/* =================================================
          Content
      ================================================== */}

      <main className="mx-auto w-full max-w-5xl min-w-0 px-3 py-5 sm:px-6 sm:py-8">

        {loading ? (
          <div className="flex min-h-[300px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm sm:min-h-[350px]">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="size-8 animate-spin" />

              <p className="text-sm">
                جاري تحميل بيانات الحساب...
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-0 space-y-4 sm:space-y-5">

            {/* =================================================
                الرسائل العامة
            ================================================== */}

            {(error || message) && (
              <div
                className={`w-full min-w-0 overflow-hidden rounded-xl border px-3.5 py-3 text-sm font-medium leading-6 sm:px-4 ${
                  error
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-green-200 bg-green-50 text-green-700"
                }`}
              >
                <p className="break-words whitespace-pre-wrap">
                  {error || message}
                </p>
              </div>
            )}

            {/* =================================================
                بيانات الحساب
            ================================================== */}

            <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

              <div className="mb-5 sm:mb-6">

                <div className="flex items-center gap-2">
                  <User className="size-5 text-slate-600" />

                  <h2 className="text-base font-bold sm:text-lg">
                    بيانات الحساب
                  </h2>
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                  يمكنك تعديل اسمك ورقم هاتفك من هنا.
                </p>

              </div>

              <div className="min-w-0 space-y-4 sm:space-y-5">

                {/* الاسم */}

                <div className="min-w-0">
                  <label
                    htmlFor="full_name"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    الاسم الكامل
                  </label>

                  <div className="relative min-w-0">

                    <User className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="full_name"
                      type="text"
                      value={
                        profile.full_name ??
                        ""
                      }
                      onChange={(event) =>
                        setProfile(
                          (current) => ({
                            ...current,
                            full_name:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="أدخل اسمك الكامل"
                      className="box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:pl-4"
                    />

                  </div>
                </div>

                {/* الهاتف */}

                <div className="min-w-0">
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    رقم الهاتف
                  </label>

                  <div className="relative min-w-0">

                    <Phone className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="phone"
                      type="tel"
                      value={
                        profile.phone ??
                        ""
                      }
                      onChange={(event) =>
                        setProfile(
                          (current) => ({
                            ...current,
                            phone:
                              event.target
                                .value,
                          }),
                        )
                      }
                      placeholder="أدخل رقم الهاتف"
                      className="box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white py-3 pr-11 pl-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:pl-4"
                    />

                  </div>
                </div>

                {/* البريد */}

                <div className="min-w-0">
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    البريد الإلكتروني
                  </label>

                  <div className="relative min-w-0">

                    <Mail className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                    <input
                      id="email"
                      type="email"
                      value={
                        profile.email ??
                        ""
                      }
                      disabled
                      className="box-border w-full min-w-0 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 py-3 pr-11 pl-3 text-sm text-slate-500 outline-none sm:pl-4"
                    />

                  </div>

                  <div className="mt-3 flex min-w-0 flex-col items-stretch gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">

                    {emailConfirmed ? (
                      <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        البريد الإلكتروني مؤكد
                      </span>
                    ) : (
                      <>
                        <span className="inline-flex w-fit max-w-full items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          <ShieldAlert className="size-4 shrink-0" />
                          البريد غير مؤكد
                        </span>

                        <button
                          type="button"
                          onClick={
                            resendEmailConfirmation
                          }
                          disabled={
                            sendingEmail
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {sendingEmail ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Mail className="size-4" />
                          )}

                          إرسال رسالة التأكيد
                        </button>
                      </>
                    )}

                  </div>
                </div>

                {/* الحفظ */}

                <div className="flex min-w-0 flex-col gap-3 pt-1 sm:flex-row sm:items-center">

                  <button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Save className="size-4" />
                    )}

                    {saving
                      ? "جاري الحفظ..."
                      : "حفظ التغييرات"}
                  </button>

                  {saved && (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-green-600 sm:justify-start">
                      <CheckCircle2 className="size-5" />
                      تم حفظ التغييرات بنجاح
                    </div>
                  )}

                </div>

              </div>
            </section>

            {/* =================================================
                أمان الحساب
            ================================================== */}

            <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

              <div className="mb-5 sm:mb-6">

                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-slate-600" />

                  <h2 className="text-base font-bold sm:text-lg">
                    أمان الحساب
                  </h2>
                </div>

                <p className="mt-1 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                  حافظ على حسابك آمنًا باستخدام كلمة مرور قوية
                  وتأكيد البريد الإلكتروني والمصادقة الثنائية.
                </p>

              </div>

              <div className="min-w-0 space-y-3 sm:space-y-4">

                {/* =================================================
                    كلمة المرور
                ================================================== */}

                <div className="min-w-0 rounded-2xl border border-slate-200 p-3.5 sm:p-5">

                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-start gap-3">

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:size-11">
                        <Lock className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold sm:text-base">
                          كلمة المرور
                        </h3>

                        <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                          غيّر كلمة مرور حسابك بشكل دوري للحفاظ على أمانه.
                        </p>
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowPasswordForm(
                          (value) =>
                            !value,
                        )
                      }
                      className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                    >
                      <KeyRound className="size-4" />

                      {showPasswordForm
                        ? "إلغاء"
                        : "تغيير كلمة المرور"}
                    </button>

                  </div>

                  {showPasswordForm && (
                    <div className="mt-5 min-w-0 border-t border-slate-200 pt-5">

                      <div className="min-w-0 space-y-4">

                        <div className="min-w-0">
                          <label
                            htmlFor="new_password"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            كلمة المرور الجديدة
                          </label>

                          <input
                            id="new_password"
                            type="password"
                            value={
                              newPassword
                            }
                            onChange={(event) =>
                              setNewPassword(
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="8 أحرف أو أرقام على الأقل"
                            autoComplete="new-password"
                            className="box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:px-4"
                          />
                        </div>

                        <div className="min-w-0">
                          <label
                            htmlFor="confirm_password"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            تأكيد كلمة المرور الجديدة
                          </label>

                          <input
                            id="confirm_password"
                            type="password"
                            value={
                              confirmPassword
                            }
                            onChange={(event) =>
                              setConfirmPassword(
                                event
                                  .target
                                  .value,
                              )
                            }
                            placeholder="أعد كتابة كلمة المرور"
                            autoComplete="new-password"
                            className="box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 sm:px-4"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={
                            changePassword
                          }
                          disabled={
                            changingPassword
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {changingPassword ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}

                          {changingPassword
                            ? "جاري التغيير..."
                            : "تغيير كلمة المرور"}
                        </button>

                      </div>
                    </div>
                  )}

                </div>

                {/* =================================================
                    المصادقة الثنائية
                ================================================== */}

                <div className="min-w-0 rounded-2xl border border-slate-200 p-3.5 sm:p-5">

                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex min-w-0 items-start gap-3">

                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:size-11">
                        <Smartphone className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold sm:text-base">
                          المصادقة الثنائية
                        </h3>

                        <p className="mt-1 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                          أضف طبقة حماية إضافية باستخدام تطبيق المصادقة على هاتفك.
                        </p>
                      </div>

                    </div>

                    {!mfaLoading && (
                      mfaEnabled ? (
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-700">
                          <CheckCircle2 className="size-4" />
                          مفعلة
                        </span>
                      ) : (
                        <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          غير مفعلة
                        </span>
                      )
                    )}

                  </div>

                  {/* حالة التحميل */}

                  {mfaLoading && (
                    <div className="mt-5 flex items-center gap-2 text-xs leading-5 text-slate-500 sm:text-sm">
                      <Loader2 className="size-4 shrink-0 animate-spin" />
                      <span>
                        جاري التحقق من حالة المصادقة الثنائية...
                      </span>
                    </div>
                  )}

                  {/* =================================================
                      إذا كانت مفعلة
                  ================================================== */}

                  {!mfaLoading &&
                    mfaEnabled && (
                      <div className="mt-5 min-w-0 rounded-xl bg-green-50 p-3.5 sm:p-4">

                        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="min-w-0">
                            <p className="font-bold text-green-800">
                              المصادقة الثنائية مفعلة
                            </p>

                            <p className="mt-1 break-words text-xs leading-6 text-green-700 sm:text-sm">
                              حسابك مرتبط بتطبيق مصادقة. ستحتاج إلى رمز المصادقة عند طلب التحقق الإضافي.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={
                              disableMfa
                            }
                            disabled={
                              mfaRemoving
                            }
                            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                          >
                            {mfaRemoving ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ShieldAlert className="size-4" />
                            )}

                            إيقاف المصادقة الثنائية
                          </button>

                        </div>
                      </div>
                    )}

                  {/* =================================================
                      زر التفعيل
                  ================================================== */}

                  {!mfaLoading &&
                    !mfaEnabled &&
                    !mfaFactorId && (
                      <div className="mt-5">

                        <button
                          type="button"
                          onClick={
                            startMfaSetup
                          }
                          disabled={
                            mfaSettingUp
                          }
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                        >
                          {mfaSettingUp ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}

                          {mfaSettingUp
                            ? "جاري الإعداد..."
                            : "تفعيل المصادقة الثنائية"}
                        </button>

                      </div>
                    )}

                  {/* =================================================
                      إعداد 2FA
                  ================================================== */}

                  {!mfaEnabled &&
                    mfaFactorId && (
                      <div className="mt-5 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 sm:p-6">

                        <div className="mb-5">
                          <h4 className="font-bold text-slate-800">
                            إعداد المصادقة الثنائية
                          </h4>

                          <p className="mt-1 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                            افتح تطبيق Google Authenticator أو Microsoft Authenticator
                            على هاتفك، ثم امسح رمز QR التالي.
                          </p>
                        </div>

                        {/* QR */}

                        {mfaQrCode && (
                          <div className="flex w-full justify-center rounded-2xl bg-white p-4 sm:p-5">
                            <img
                              src={
                                mfaQrCode
                              }
                              alt="رمز QR للمصادقة الثنائية"
                              className="size-44 max-w-full object-contain sm:size-52"
                            />
                          </div>
                        )}

                        {/* المفتاح السري */}

                        {mfaSecret && (
                          <div className="mt-5 min-w-0">

                            <p className="mb-2 text-xs font-semibold leading-5 text-slate-700 sm:text-sm">
                              إذا لم تستطع مسح QR، استخدم المفتاح التالي:
                            </p>

                            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">

                              <code
                                dir="ltr"
                                className="box-border min-w-0 flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-[10px] font-bold tracking-wider text-slate-700 sm:px-4 sm:text-xs"
                              >
                                {mfaSecret}
                              </code>

                              <button
                                type="button"
                                onClick={
                                  copyMfaSecret
                                }
                                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                              >
                                {copiedSecret ? (
                                  <Check className="size-4" />
                                ) : (
                                  <Copy className="size-4" />
                                )}

                                {copiedSecret
                                  ? "تم النسخ"
                                  : "نسخ"}
                              </button>

                            </div>
                          </div>
                        )}

                        {/* الكود */}

                        <div className="mt-5 min-w-0">

                          <label
                            htmlFor="mfa_code"
                            className="mb-2 block text-sm font-semibold text-slate-700"
                          >
                            رمز التحقق
                          </label>

                          <input
                            id="mfa_code"
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={
                              mfaCode
                            }
                            onChange={(event) =>
                              setMfaCode(
                                event
                                  .target
                                  .value
                                  .replace(
                                    /\D/g,
                                    "",
                                  )
                                  .slice(
                                    0,
                                    6,
                                  ),
                              )
                            }
                            placeholder="000000"
                            dir="ltr"
                            className="box-border w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg font-bold tracking-[0.5em] outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                          />

                          <p className="mt-2 break-words text-[11px] leading-5 text-slate-400 sm:text-xs">
                            أدخل الرمز المكون من 6 أرقام الظاهر في تطبيق المصادقة.
                          </p>

                        </div>

                        {/* التحقق */}

                        <button
                          type="button"
                          onClick={
                            verifyMfa
                          }
                          disabled={
                            mfaVerifying ||
                            mfaCode.length !==
                              6
                          }
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
                        >
                          {mfaVerifying ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <ShieldCheck className="size-4" />
                          )}

                          {mfaVerifying
                            ? "جاري التحقق..."
                            : "تأكيد وتفعيل المصادقة الثنائية"}
                        </button>

                      </div>
                    )}

                </div>

              </div>
            </section>

            {/* =================================================
                الإشعارات
            ================================================== */}

            <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

              <div className="flex min-w-0 items-start gap-3 sm:gap-4">

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 sm:size-11">
                  <Bell className="size-5" />
                </div>

                <div className="min-w-0 flex-1">

                  <h2 className="text-base font-bold sm:text-lg">
                    الإشعارات
                  </h2>

                  <p className="mt-1 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                    ستظهر لك إشعارات الشحنات والأمانات والتحديثات المهمة داخل صفحة الإشعارات.
                  </p>

                  <Link
                    to="/notifications"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                  >
                    <Bell className="size-4" />

                    فتح الإشعارات
                  </Link>

                </div>
              </div>
            </section>

            {/* =================================================
                تحديث البيانات
            ================================================== */}

            <section className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    تحديث البيانات
                  </h2>

                  <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                    إعادة تحميل بيانات حسابك من الخادم.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    loadProfile();
                    loadMfa();
                  }}
                  disabled={loading}
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <RefreshCw className="size-4" />

                  تحديث البيانات
                </button>

              </div>
            </section>

            {/* =================================================
                تسجيل الخروج
            ================================================== */}

            <section className="w-full min-w-0 rounded-2xl border border-red-100 bg-white p-4 shadow-sm sm:p-6">

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="min-w-0">

                  <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                    تسجيل الخروج
                  </h2>

                  <p className="mt-1 break-words text-xs leading-5 text-slate-500 sm:text-sm">
                    تسجيل الخروج من حسابك على أمانتي.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    logout
                  }
                  disabled={
                    loggingOut
                  }
                  className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >

                  {loggingOut ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}

                  {loggingOut
                    ? "جاري تسجيل الخروج..."
                    : "تسجيل الخروج"}

                </button>

              </div>
            </section>

          </div>
        )}
      </main>
    </div>
  );
}