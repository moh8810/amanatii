import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  PackageCheck,
  Bell,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { Button, Logo } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      {
        title: "تسجيل الدخول | أمانتي AMANATI",
      },
      {
        name: "description",
        content:
          "سجّل الدخول إلى حسابك في أمانتي لمتابعة شحناتك وأماناتك.",
      },
      {
        property: "og:title",
        content: "تسجيل الدخول | أمانتي",
      },
      {
        property: "og:description",
        content:
          "ادخل إلى حسابك لمتابعة الشحنات والأمانات.",
      },
    ],
  }),

  component: LoginPage,
});

type MfaFactor = {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string | null;
};

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const [mfaFactor, setMfaFactor] =
    useState<MfaFactor | null>(null);

  async function redirectByRole(userId: string) {
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Profile error:", profileError);

      await supabase.auth.signOut();

      setError(
        "حدث خطأ أثناء التحقق من صلاحيات الحساب.",
      );

      setLoading(false);
      return;
    }

    if (profile?.role === "admin") {
      await supabase.auth.signOut();

      setError(
        "حساب الإدارة يستخدم صفحة دخول الإدارة.",
      );

      setLoading(false);
      return;
    }

    if (profile?.role === "merchant") {
      await navigate({
        to: "/merchant",
      });

      return;
    }

    await navigate({
      to: "/dashboard",
    });
  }

  async function checkMfaAndContinue(userId: string) {
    const {
      data: aal,
      error: aalError,
    } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      console.error("AAL error:", aalError);

      await supabase.auth.signOut();

      setError(
        "تعذر التحقق من حالة المصادقة الثنائية.",
      );

      setLoading(false);
      return;
    }

    if (
      aal?.nextLevel === "aal2" &&
      aal.currentLevel !== "aal2"
    ) {
      const {
        data: factors,
        error: factorsError,
      } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error(
          "MFA factors error:",
          factorsError,
        );

        await supabase.auth.signOut();

        setError(
          "تعذر تحميل إعدادات المصادقة الثنائية.",
        );

        setLoading(false);
        return;
      }

      const verifiedTotp = (
        factors?.totp ?? []
      ).find(
        (factor) =>
          factor.status === "verified",
      );

      if (verifiedTotp) {
        setMfaFactor({
          id: verifiedTotp.id,
          factor_type:
            verifiedTotp.factor_type,
          status: verifiedTotp.status,
          friendly_name:
            verifiedTotp.friendly_name,
        });

        setShowMfa(true);
        setLoading(false);

        return;
      }
    }

    await redirectByRole(userId);
  }

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError(
        "يرجى إدخال البريد الإلكتروني وكلمة المرور.",
      );

      setLoading(false);
      return;
    }

    const {
      data,
      error: loginError,
    } =
      await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

    if (loginError) {
      console.error(
        "LOGIN ERROR:",
        loginError,
      );

      setError(
        "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
      );

      setLoading(false);
      return;
    }

    if (!data.user) {
      setError(
        "تعذر تسجيل الدخول. حاول مرة أخرى.",
      );

      setLoading(false);
      return;
    }

    await checkMfaAndContinue(
      data.user.id,
    );
  }

  async function handleGoogleLogin() {
    if (googleLoading) return;

    setError("");
    setSuccess("");
    setGoogleLoading(true);

    try {
      const {
        data,
        error: googleError,
      } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}/login`,
          },
        });

      if (googleError) {
        throw googleError;
      }

      if (!data?.url) {
        throw new Error(
          "Google OAuth URL was not generated.",
        );
      }

      window.location.href = data.url;
    } catch (err) {
      console.error(
        "Google login error:",
        err,
      );

      setError(
        "تعذر تسجيل الدخول باستخدام Google. تأكد من تفعيل Google في إعدادات Supabase.",
      );

      setGoogleLoading(false);
    }
  }

  async function verifyMfaLogin() {
    if (
      mfaVerifying ||
      !mfaFactor?.id
    ) {
      return;
    }

    const code = mfaCode.trim();

    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError(
        "أدخل رمز المصادقة المكون من 6 أرقام.",
      );

      return;
    }

    setMfaVerifying(true);

    try {
      const {
        data: verification,
        error: verifyError,
      } =
        await supabase.auth.mfa.challengeAndVerify(
          {
            factorId: mfaFactor.id,
            code,
          },
        );

      if (verifyError) {
        console.error(
          "MFA verification error:",
          verifyError,
        );

        setError(
          "رمز المصادقة غير صحيح أو انتهت صلاحيته.",
        );

        setMfaVerifying(false);
        return;
      }

      if (!verification) {
        setError(
          "تعذر إكمال التحقق. حاول مرة أخرى.",
        );

        setMfaVerifying(false);
        return;
      }

      const {
        data: aal,
        error: aalError,
      } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (
        aalError ||
        aal?.currentLevel !== "aal2"
      ) {
        await supabase.auth.signOut();

        setError(
          "لم تكتمل المصادقة الثنائية.",
        );

        setMfaVerifying(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        await supabase.auth.signOut();

        setError(
          "تعذر التحقق من جلسة الحساب.",
        );

        setMfaVerifying(false);
        return;
      }

      setMfaCode("");

      await redirectByRole(user.id);
    } catch (err) {
      console.error(
        "MFA login error:",
        err,
      );

      setError(
        "حدث خطأ أثناء التحقق من المصادقة الثنائية.",
      );

      setMfaVerifying(false);
    }
  }

  async function cancelMfaLogin() {
    if (mfaVerifying) return;

    await supabase.auth.signOut();

    setShowMfa(false);
    setMfaCode("");
    setMfaFactor(null);
    setPassword("");
    setError("");
  }

  /*
   * ================================
   * شاشة المصادقة الثنائية
   * ================================
   */
  if (showMfa) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen w-full overflow-x-hidden bg-slate-50 lg:grid lg:grid-cols-2"
      >
        <div className="flex min-h-screen w-full min-w-0 items-center justify-center px-3 py-6 sm:px-6 sm:py-12">
          <div className="w-full max-w-md min-w-0">
            <div className="flex justify-center">
              <Logo size="sm" />
            </div>

            <div className="mt-6 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-8 sm:rounded-3xl sm:p-8">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 sm:size-16">
                  <ShieldCheck className="size-7 text-primary sm:size-8" />
                </div>
              </div>

              <h1 className="mt-5 break-words text-center text-2xl font-extrabold leading-9 text-primary sm:mt-6 sm:text-3xl">
                تأكيد هويتك
              </h1>

              <p className="mt-3 text-center text-sm leading-7 text-muted-foreground">
                حسابك محمي بالمصادقة الثنائية.
                <br />
                افتح تطبيق المصادقة وأدخل الرمز الظاهر لديك.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="mfa-login-code"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  رمز التحقق
                </label>

                <input
                  id="mfa-login-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(event) =>
                    setMfaCode(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      mfaCode.length === 6
                    ) {
                      void verifyMfaLogin();
                    }
                  }}
                  placeholder="000000"
                  dir="ltr"
                  autoFocus
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-center text-xl font-extrabold tracking-[0.4em] outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 sm:h-16 sm:px-4 sm:text-2xl sm:tracking-[0.5em]"
                />
              </div>

              {error && (
                <div className="mt-4 break-words rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-center text-sm font-medium leading-6 text-red-700 sm:px-4">
                  {error}
                </div>
              )}

              <Button
                type="button"
                size="lg"
                className="mt-4 h-13 w-full rounded-2xl sm:mt-5 sm:h-14"
                disabled={
                  mfaVerifying ||
                  mfaCode.length !== 6
                }
                onClick={() =>
                  void verifyMfaLogin()
                }
              >
                {mfaVerifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : (
                  "تأكيد الدخول"
                )}
              </Button>

              <button
                type="button"
                onClick={() =>
                  void cancelMfaLogin()
                }
                disabled={mfaVerifying}
                className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-500 transition hover:text-primary"
              >
                <LogOut className="size-4 shrink-0" />
                <span>إلغاء وتسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>

        <BrandPanel />
      </div>
    );
  }

  /*
   * ================================
   * صفحة تسجيل الدخول الرئيسية
   * ================================
   */
  return (
    <div
      dir="rtl"
      className="flex min-h-screen w-full overflow-x-hidden bg-slate-50 lg:grid lg:grid-cols-2"
    >
      {/* =========================
          LOGIN SIDE
      ========================== */}
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center px-3 py-6 sm:px-6 sm:py-10 lg:py-14">
        <div className="w-full max-w-md min-w-0">
          {/* Logo */}
          <div className="flex justify-center">
            <Logo size="sm" />
          </div>

          {/* Heading */}
          <div className="mt-6 text-center sm:mt-8">
            <h1 className="break-words text-2xl font-extrabold leading-9 tracking-tight text-primary sm:text-3xl sm:text-[38px]">
              مرحباً بك في أمانتي
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-muted-foreground">
              سجّل الدخول لمتابعة شحناتك وأماناتك بسهولة.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="mt-6 sm:mt-8"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                البريد الإلكتروني
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="example@email.com"
                  autoComplete="email"
                  required
                  className="h-13 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:h-14"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mt-4 sm:mt-5">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                كلمة المرور
              </label>

              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="h-13 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-12 pl-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:h-14"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value,
                    )
                  }
                  aria-label={
                    showPassword
                      ? "إخفاء كلمة المرور"
                      : "إظهار كلمة المرور"
                  }
                  className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:text-primary sm:left-4"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 break-words rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm font-medium leading-6 text-red-700 sm:mt-5 sm:px-4">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 break-words rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm font-medium leading-6 text-green-700 sm:mt-5 sm:px-4">
                {success}
              </div>
            )}

            {/* Links */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link
                to="/"
                className="font-semibold text-secondary transition hover:underline"
              >
                هل نسيت كلمة المرور؟
              </Link>

              <Link
                to="/register"
                className="font-semibold text-primary transition hover:underline"
              >
                إنشاء حساب
              </Link>
            </div>

            {/* Login button */}
            <Button
              type="submit"
              size="lg"
              className="mt-5 h-13 w-full rounded-2xl text-base font-bold shadow-sm sm:h-14"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  جاري تسجيل الدخول...
                </span>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          {/* Social divider */}
          <div className="mt-7 flex items-center gap-2 sm:mt-8 sm:gap-4">
            <div className="h-px min-w-0 flex-1 bg-slate-200" />

            <span className="shrink-0 whitespace-nowrap text-[11px] font-medium text-slate-400 sm:text-xs">
              أو تسجيل الدخول باستخدام
            </span>

            <div className="h-px min-w-0 flex-1 bg-slate-200" />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() =>
              void handleGoogleLogin()
            }
            disabled={googleLoading}
            className="mt-4 flex min-h-13 w-full min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:gap-3 sm:px-4"
          >
            {googleLoading ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : (
              <GoogleIcon />
            )}

            <span className="min-w-0 truncate sm:overflow-visible sm:text-clip">
              {googleLoading
                ? "جاري الاتصال بـ Google..."
                : "المتابعة باستخدام Google"}
            </span>
          </button>

          {/* Security */}
          <div className="mx-auto mt-6 flex max-w-sm items-start justify-center gap-2 text-center text-[11px] leading-5 text-slate-400 sm:mt-7 sm:items-center sm:text-xs sm:leading-normal">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 sm:mt-0" />

            <span>
              بياناتك محمية بأعلى معايير الأمان والخصوصية
            </span>
          </div>
        </div>
      </div>

      {/* =========================
          BRAND SIDE
      ========================== */}
      <BrandPanel />
    </div>
  );
}

/*
 * Google Icon
 */
function GoogleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.7-1.72-5.47-4.04H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.53 13.84A5.86 5.86 0 0 1 6.23 12c0-.64.11-1.26.3-1.84V7.63H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.03 4.37l3.25-2.53Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.38l3.25 2.53C7.3 7.84 9.46 6.12 12 6.12Z"
      />
    </svg>
  );
}

/*
 * الجانب الأزرق/الكحلي
 */
function BrandPanel() {
  return (
    <div className="relative hidden min-h-screen overflow-hidden bg-primary px-8 py-12 lg:flex lg:items-center xl:px-16 xl:py-14">
      {/* Glow */}
      <div className="absolute -left-28 -top-28 size-[420px] rounded-full bg-secondary/15 blur-3xl" />

      <div className="absolute -right-32 top-1/3 size-[360px] rounded-full bg-cyan-400/5 blur-3xl" />

      {/* Decorative circles */}
      <div className="absolute left-[-90px] top-[40px] size-40 rounded-full bg-secondary/5 blur-2xl" />

      <div className="relative mx-auto w-full max-w-xl min-w-0">
        {/* Main slogan */}
        <div>
          <p className="break-words text-4xl font-extrabold leading-tight text-primary-foreground xl:text-[46px]">
            مع أمانتي
          </p>

          <h2 className="mt-1 break-words text-4xl font-extrabold leading-[1.35] xl:text-[46px]">
            <span className="text-secondary">
              شحنتك وأمانتك
            </span>{" "}
            <span className="text-primary-foreground">
              في أمان.
            </span>
          </h2>
        </div>

        {/* Features */}
        <div className="mt-10 space-y-6 xl:mt-12 xl:space-y-7">
          {[
            {
              icon: ShieldCheck,
              title: "حفظ آمن",
              description:
                "أمانتك محفوظة في مركز أمانتي.",
            },
            {
              icon: PackageCheck,
              title: "رقم تتبع خاص",
              description:
                "لكل شحنة رقم يتابعها خطوة بخطوة.",
            },
            {
              icon: Bell,
              title: "إشعارات عند الوصول",
              description:
                "نعلمك فور جاهزية الاستلام.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex min-w-0 items-center gap-4 xl:gap-5"
            >
              <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/10 shadow-sm ring-1 ring-primary-foreground/5 xl:size-14">
                <feature.icon
                  className="size-6 text-primary-foreground xl:size-7"
                  strokeWidth={1.5}
                />
              </div>

              <div className="min-w-0">
                <p className="break-words text-lg font-bold text-primary-foreground">
                  {feature.title}
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-primary-foreground/55">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust card */}
        <div className="mt-10 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 backdrop-blur-sm xl:mt-12 xl:p-5">
          <div className="flex min-w-0 items-center gap-3 xl:gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 xl:size-11">
              <CheckCircle2 className="size-5 text-secondary" />
            </div>

            <div className="min-w-0">
              <p className="break-words text-sm font-bold text-primary-foreground">
                شحن وأمانات بكل ثقة
              </p>

              <p className="mt-1 break-words text-xs leading-5 text-primary-foreground/50">
                تابع شحناتك وأدر أماناتك من مكان واحد.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dotted wave */}
      <div className="pointer-events-none absolute -bottom-16 -left-20 h-64 w-[620px] max-w-[80%] opacity-70">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(45, 212, 191, 0.75) 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            maskImage:
              "radial-gradient(ellipse 75% 70% at 20% 100%, black 0%, transparent 72%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 70% at 20% 100%, black 0%, transparent 72%)",
          }}
        />
      </div>

      {/* Decorative small bubbles */}
      <div className="pointer-events-none absolute left-20 top-16">
        <div className="size-7 rounded-full bg-secondary/10 blur-sm" />
        <div className="-mt-5 ml-6 size-12 rounded-full bg-secondary/5 blur-sm" />
        <div className="-mt-2 ml-1 size-5 rounded-full bg-secondary/10" />
      </div>
    </div>
  );
}
