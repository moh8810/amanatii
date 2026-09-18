import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  LockKeyhole,
  Smartphone,
  Loader2,
  LogOut,
} from "lucide-react";
import { Button, Field, Logo } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "دخول الإدارة | أمانتي AMANATI" },
      {
        name: "description",
        content: "تسجيل الدخول الآمن إلى لوحة إدارة أمانتي.",
      },
    ],
  }),
  component: AdminLoginPage,
});

type MfaFactor = {
  id: string;
  factor_type: string;
  status: string;
  friendly_name?: string | null;
};

function AdminLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);
  const [mfaFactor, setMfaFactor] = useState<MfaFactor | null>(null);

  async function redirectToAdmin(userId: string) {
    const role = (
      await supabase.auth.getUser()
    ).data.user?.app_metadata?.role;

    if (role !== "admin") {
      await supabase.auth.signOut();

      setError("ليس لديك صلاحية دخول لوحة الإدارة.");
      setLoading(false);
      return;
    }

    await navigate({ to: "/admin" });
  }

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      setLoading(false);
      return;
    }

    const { data, error: loginError } =
      await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

    if (loginError || !data.user) {
      console.error("ADMIN AUTH ERROR:", loginError);

      setError("بيانات الدخول غير صحيحة.");
      setLoading(false);
      return;
    }

    /*
     * التحقق من صلاحية الإدارة أولاً.
     */
    const role = data.user.app_metadata?.role;

    console.log("ADMIN LOGIN DEBUG:", {
      userId: data.user.id,
      email: data.user.email,
      role,
    });

    if (role !== "admin") {
      await supabase.auth.signOut();

      setError("ليس لديك صلاحية دخول لوحة الإدارة.");
      setLoading(false);
      return;
    }

    /*
     * التحقق من مستوى المصادقة.
     *
     * aal1 = البريد + كلمة المرور
     * aal2 = البريد + كلمة المرور + 2FA
     */
    const {
      data: aal,
      error: aalError,
    } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalError) {
      console.error("ADMIN AAL ERROR:", aalError);

      await supabase.auth.signOut();

      setError("تعذر التحقق من حالة المصادقة الثنائية.");
      setLoading(false);
      return;
    }

    /*
     * إذا كان الحساب يحتاج AAL2،
     * نعرض شاشة رمز Authenticator.
     */
    if (
      aal?.nextLevel === "aal2" &&
      aal.currentLevel !== "aal2"
    ) {
      const {
        data: factors,
        error: factorsError,
      } = await supabase.auth.mfa.listFactors();

      if (factorsError) {
        console.error(
          "ADMIN MFA FACTORS ERROR:",
          factorsError,
        );

        await supabase.auth.signOut();

        setError(
          "تعذر تحميل إعدادات المصادقة الثنائية.",
        );
        setLoading(false);
        return;
      }

      const verifiedTotp = (factors?.totp ?? []).find(
        (factor) => factor.status === "verified",
      );

      if (!verifiedTotp) {
        /*
         * احتياطياً إذا لم يوجد عامل TOTP موثق.
         */
        await redirectToAdmin(data.user.id);
        return;
      }

      setMfaFactor({
        id: verifiedTotp.id,
        factor_type: verifiedTotp.factor_type,
        status: verifiedTotp.status,
        friendly_name: verifiedTotp.friendly_name,
      });

      setShowMfa(true);
      setLoading(false);
      return;
    }

    /*
     * لا يوجد MFA أو الجلسة بالفعل AAL2.
     */
    await redirectToAdmin(data.user.id);
  }

  async function verifyMfaLogin() {
    if (mfaVerifying || !mfaFactor?.id) {
      return;
    }

    setError("");

    const code = mfaCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setError("أدخل رمز المصادقة المكون من 6 أرقام.");
      return;
    }

    setMfaVerifying(true);

    try {
      const {
        data: verification,
        error: verifyError,
      } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactor.id,
        code,
      });

      if (verifyError) {
        console.error(
          "ADMIN MFA VERIFICATION ERROR:",
          verifyError,
        );

        setError(
          "رمز المصادقة غير صحيح أو انتهت صلاحيته.",
        );
        setMfaVerifying(false);
        return;
      }

      if (!verification) {
        setError("تعذر إكمال التحقق. حاول مرة أخرى.");
        setMfaVerifying(false);
        return;
      }

      /*
       * نتأكد أن الجلسة أصبحت AAL2 فعلاً.
       */
      const {
        data: aal,
        error: aalError,
      } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        console.error(
          "ADMIN AAL VERIFICATION ERROR:",
          aalError,
        );

        await supabase.auth.signOut();

        setShowMfa(false);
        setMfaCode("");

        setError(
          "تعذر تأكيد المصادقة الثنائية.",
        );

        setMfaVerifying(false);
        return;
      }

      if (aal?.currentLevel !== "aal2") {
        setError(
          "لم تكتمل المصادقة الثنائية. حاول إدخال رمز جديد.",
        );

        setMfaVerifying(false);
        return;
      }

      /*
       * التأكد مرة أخرى من أن المستخدم Admin.
       */
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        await supabase.auth.signOut();

        setError("تعذر التحقق من جلسة الإدارة.");
        setMfaVerifying(false);
        return;
      }

      const role = user.app_metadata?.role;

      if (role !== "admin") {
        await supabase.auth.signOut();

        setShowMfa(false);
        setMfaCode("");

        setError(
          "ليس لديك صلاحية دخول لوحة الإدارة.",
        );

        setMfaVerifying(false);
        return;
      }

      setMfaCode("");

      await navigate({ to: "/admin" });
    } catch (err) {
      console.error("ADMIN MFA LOGIN ERROR:", err);

      setError(
        "حدث خطأ أثناء التحقق من المصادقة الثنائية.",
      );

      setMfaVerifying(false);
    }
  }

  async function cancelMfaLogin() {
    if (mfaVerifying) {
      return;
    }

    await supabase.auth.signOut();

    setShowMfa(false);
    setMfaCode("");
    setMfaFactor(null);
    setPassword("");
    setError("");
  }

  /*
   * شاشة المصادقة الثنائية للإدارة
   */
  if (showMfa) {
    return (
      <div
        dir="rtl"
        className="grid min-h-screen lg:grid-cols-2"
      >
        <div className="flex items-center justify-center px-5 py-14">
          <div className="w-full max-w-sm">
            <Logo />

            <div className="mt-10 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <ShieldCheck className="size-8 text-primary" />
              </div>
            </div>

            <h1 className="mt-6 text-center text-3xl font-extrabold text-primary">
              تحقق أمني
            </h1>

            <p className="mt-3 text-center text-sm leading-6 text-muted-foreground">
              حساب الإدارة محمي بالمصادقة الثنائية.
              <br />
              افتح تطبيق Authenticator وأدخل رمز التحقق.
            </p>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Smartphone className="size-5 text-primary" />
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    تطبيق المصادقة
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {mfaFactor?.friendly_name ||
                      "Authenticator"}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="admin-mfa-code"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  رمز التحقق
                </label>

                <input
                  id="admin-mfa-code"
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                <p className="mt-2 text-center text-xs text-slate-400">
                  أدخل الرمز المكون من 6 أرقام
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="button"
                size="lg"
                className="mt-5 w-full"
                disabled={
                  mfaVerifying ||
                  mfaCode.length !== 6
                }
                onClick={() => void verifyMfaLogin()}
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
                onClick={() => void cancelMfaLogin()}
                disabled={mfaVerifying}
                className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary disabled:opacity-50"
              >
                <LogOut className="size-4" />
                إلغاء وتسجيل الخروج
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4" />
              دخول الإدارة محمي بطبقة أمان إضافية
            </div>
          </div>
        </div>

        <div className="relative hidden overflow-hidden bg-primary p-14 lg:flex lg:flex-col lg:justify-center">
          <div className="absolute -top-24 -left-24 size-80 rounded-full bg-secondary/25 blur-3xl" />

          <div className="relative">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
              <ShieldCheck
                className="size-7 text-primary-foreground"
                strokeWidth={1.5}
              />
            </div>

            <h2 className="mt-8 text-3xl leading-snug font-extrabold text-primary-foreground">
              حماية لوحة الإدارة
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-primary-foreground/60">
              لا يمكن الوصول إلى لوحة إدارة أمانتي إلا بعد
              التحقق من حساب الإدارة والمصادقة الثنائية.
            </p>

            <div className="mt-10 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
              <p className="text-sm font-bold text-primary-foreground">
                🔐 وصول إداري محمي
              </p>

              <p className="mt-2 text-xs leading-6 text-primary-foreground/50">
                يجب إدخال رمز المصادقة الثنائية قبل الوصول
                إلى لوحة الإدارة.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
   * صفحة تسجيل دخول الإدارة
   */
  return (
    <div
      dir="rtl"
      className="grid min-h-screen lg:grid-cols-2"
    >
      <div className="flex items-center justify-center px-5 py-14">
        <div className="w-full max-w-sm">
          <Logo />

          <div className="mt-10 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <LockKeyhole className="size-5 text-primary" />
            </div>

            <div>
              <p className="text-xs font-bold text-secondary">
                ADMINISTRATION
              </p>

              <h1 className="mt-1 text-3xl font-extrabold text-primary">
                دخول الإدارة
              </h1>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            سجّل الدخول للوصول إلى لوحة إدارة أمانتي.
          </p>

          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >
            <Field
              label="البريد الإلكتروني"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <Field
              label="كلمة المرور"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? "جاري التحقق..."
                : "دخول لوحة الإدارة"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            هذه الصفحة مخصصة لمسؤولي أمانتي فقط.
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary p-14 lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-secondary/25 blur-3xl" />

        <div className="relative">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <ShieldCheck
              className="size-7 text-primary-foreground"
              strokeWidth={1.5}
            />
          </div>

          <h2 className="mt-8 text-3xl leading-snug font-extrabold text-primary-foreground">
            لوحة إدارة أمانتي
          </h2>

          <p className="mt-4 max-w-md text-sm leading-7 text-primary-foreground/60">
            إدارة الشحنات والأمانات والعملاء ونقاط
            الاستلام والعمليات من مكان واحد.
          </p>

          <div className="mt-10 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-5">
            <p className="text-sm font-bold text-primary-foreground">
              🔐 وصول محمي
            </p>

            <p className="mt-2 text-xs leading-6 text-primary-foreground/50">
              يتطلب الوصول إلى لوحة الإدارة حسابًا يحمل
              صلاحية admin، وقد يتطلب رمز المصادقة الثنائية.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
