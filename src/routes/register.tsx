import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  PackageCheck,
  Bell,
  UserRound,
  Store,
  CheckCircle2,
  Loader2,
  MailCheck,
  RefreshCw,
} from "lucide-react";
import { Button, Field, Logo } from "@/components/amanati/ui";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | أمانتي AMANATI" },
      {
        name: "description",
        content:
          "أنشئ حسابك في أمانتي وابدأ باستخدام خدمات الشحن والأمانات.",
      },
    ],
  }),
  component: RegisterPage,
});

type AccountType = "customer" | "merchant";

function RegisterPage() {
  const navigate = useNavigate();

  const [accountType, setAccountType] =
    useState<AccountType>("customer");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailConfirmationSent, setEmailConfirmationSent] =
    useState(false);

  async function handleRegister(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const trimmedFullName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFullName) {
      setError("يرجى إدخال الاسم الكامل.");
      setLoading(false);
      return;
    }

    if (!trimmedPhone) {
      setError("يرجى إدخال رقم الهاتف.");
      setLoading(false);
      return;
    }

    if (!trimmedEmail) {
      setError("يرجى إدخال البريد الإلكتروني.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(
        "كلمة المرور يجب أن تحتوي على 8 أحرف أو أرقام على الأقل.",
      );
      setLoading(false);
      return;
    }

    const safeRole: AccountType =
      accountType === "merchant"
        ? "merchant"
        : "customer";

    const { data, error: signupError } =
      await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/login`,
          data: {
            full_name: trimmedFullName,
            phone: trimmedPhone,
            role: safeRole,
          },
        },
      });

    if (signupError) {
      console.error("REGISTER ERROR:", signupError);

      const errorMessage =
        signupError.message?.toLowerCase() || "";

      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists")
      ) {
        setError(
          "هذا البريد الإلكتروني مستخدم بالفعل. حاول تسجيل الدخول.",
        );
      } else {
        setError(
          signupError.message ||
            "تعذر إنشاء الحساب. حاول مرة أخرى.",
        );
      }

      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("تعذر إنشاء الحساب. حاول مرة أخرى.");
      setLoading(false);
      return;
    }

    if (!data.session) {
      setEmailConfirmationSent(true);
      setSuccess("");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: trimmedFullName,
          phone: trimmedPhone,
          email: trimmedEmail,
          role: safeRole,
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      console.error(
        "PROFILE CREATION ERROR:",
        profileError,
      );
    }

    setSuccess(
      safeRole === "merchant"
        ? "تم إنشاء حساب التاجر بنجاح."
        : "تم إنشاء حساب العميل بنجاح.",
    );

    window.setTimeout(() => {
      if (safeRole === "merchant") {
        void navigate({ to: "/merchant" });
      } else {
        void navigate({ to: "/dashboard" });
      }
    }, 800);
  }

  async function handleResendConfirmation() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(
        "يرجى إدخال البريد الإلكتروني أولًا.",
      );
      return;
    }

    setError("");
    setSuccess("");
    setResending(true);

    const { error: resendError } =
      await supabase.auth.resend({
        type: "signup",
        email: trimmedEmail,
        options: {
          emailRedirectTo:
            `${window.location.origin}/login`,
        },
      });

    if (resendError) {
      console.error(
        "RESEND CONFIRMATION ERROR:",
        resendError,
      );

      setError(
        resendError.message ||
          "تعذر إعادة إرسال رسالة التأكيد. حاول مرة أخرى.",
      );

      setResending(false);
      return;
    }

    setSuccess(
      "تمت إعادة إرسال رسالة التأكيد إلى بريدك الإلكتروني.",
    );

    setResending(false);
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-screen w-full overflow-x-hidden bg-slate-50 lg:grid lg:grid-cols-2"
    >
      {/* =========================
          الجانب الرئيسي
      ========================== */}
      <div className="flex min-h-screen w-full min-w-0 items-center justify-center px-3 py-6 sm:px-6 sm:py-10 lg:py-14">
        <div className="w-full max-w-md min-w-0">
          {/* Logo */}
          <div className="flex justify-center lg:justify-start">
            <Logo size="sm" />
          </div>

          {!emailConfirmationSent ? (
            <>
              {/* Heading */}
              <div className="mt-6 sm:mt-10">
                <h1 className="break-words text-2xl font-extrabold leading-9 text-primary sm:text-3xl">
                  إنشاء حساب جديد
                </h1>

                <p className="mt-2 break-words text-sm leading-6 text-muted-foreground sm:mt-3">
                  اختر نوع حسابك ثم ابدأ باستخدام أمانتي.
                </p>
              </div>

              <form
                onSubmit={handleRegister}
                className="mt-6 space-y-4 sm:mt-8 sm:space-y-5"
              >
                {/* نوع الحساب */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    نوع الحساب
                  </label>

                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                    {/* العميل */}
                    <button
                      type="button"
                      onClick={() =>
                        setAccountType("customer")
                      }
                      className={`w-full min-w-0 rounded-2xl border p-3 text-right transition active:scale-[0.99] sm:p-4 ${
                        accountType === "customer"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${
                            accountType === "customer"
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <UserRound className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">
                            عميل
                          </p>

                          <p className="mt-1 break-words text-[11px] leading-5 text-slate-500 sm:text-xs">
                            إرسال ومتابعة الشحنات
                          </p>
                        </div>
                      </div>

                      {accountType === "customer" && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>تم الاختيار</span>
                        </div>
                      )}
                    </button>

                    {/* التاجر */}
                    <button
                      type="button"
                      onClick={() =>
                        setAccountType("merchant")
                      }
                      className={`w-full min-w-0 rounded-2xl border p-3 text-right transition active:scale-[0.99] sm:p-4 ${
                        accountType === "merchant"
                          ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11 ${
                            accountType === "merchant"
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Store className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-bold text-slate-800">
                            تاجر
                          </p>

                          <p className="mt-1 break-words text-[11px] leading-5 text-slate-500 sm:text-xs">
                            إدارة العملاء والشحنات
                          </p>
                        </div>
                      </div>

                      {accountType === "merchant" && (
                        <div className="mt-3 flex items-center gap-1 text-xs font-bold text-primary">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>تم الاختيار</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* الاسم */}
                <Field
                  label="الاسم الكامل"
                  placeholder="محمد أحمد"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  required
                />

                {/* الهاتف */}
                <Field
                  label="رقم الهاتف"
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  required
                />

                {/* البريد */}
                <Field
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                />

                {/* كلمة المرور */}
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

                <p className="break-words text-xs leading-5 text-muted-foreground">
                  يجب أن تحتوي كلمة المرور على 8 أحرف أو أرقام
                  على الأقل.
                </p>

                {error && (
                  <div className="break-words rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700 sm:px-4">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="break-words rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm leading-6 text-green-700 sm:px-4">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-13 w-full rounded-2xl sm:h-14"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      جاري إنشاء الحساب...
                    </span>
                  ) : accountType === "merchant" ? (
                    "إنشاء حساب تاجر"
                  ) : (
                    "إنشاء حساب عميل"
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm leading-6 text-muted-foreground sm:mt-6">
                لديك حساب بالفعل؟{" "}
                <Link
                  to="/login"
                  className="font-bold text-secondary hover:underline"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </>
          ) : (
            /* =========================
               شاشة تأكيد البريد
            ========================== */
            <div className="mt-7 text-center sm:mt-10">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10 sm:size-20">
                <MailCheck className="size-8 text-primary sm:size-10" />
              </div>

              <h1 className="mt-5 break-words text-2xl font-extrabold leading-9 text-primary sm:mt-7 sm:text-3xl">
                تحقق من بريدك الإلكتروني
              </h1>

              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:mt-4">
                أرسلنا رابط تأكيد إلى:
              </p>

              <p
                dir="ltr"
                className="mt-1 break-all px-2 text-sm font-bold text-primary"
              >
                {email}
              </p>

              <div className="mt-5 rounded-2xl border border-primary/10 bg-primary/5 p-4 text-right sm:mt-6 sm:p-5">
                <p className="text-sm font-bold text-primary">
                  ماذا تفعل الآن؟
                </p>

                <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                  <p>1. افتح بريدك الإلكتروني.</p>

                  <p>2. ابحث عن رسالة من أمانتي.</p>

                  <p>
                    3. اضغط على زر تأكيد البريد الإلكتروني.
                  </p>

                  <p>
                    4. بعد التأكيد ارجع إلى صفحة تسجيل الدخول.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-4 break-words rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700 sm:mt-5 sm:px-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 break-words rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-sm leading-6 text-green-700 sm:mt-5 sm:px-4">
                  {success}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  void handleResendConfirmation();
                }}
                disabled={resending}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-6"
              >
                {resending ? (
                  <>
                    <Loader2 className="size-5 shrink-0 animate-spin" />
                    <span>جاري إعادة الإرسال...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-5 shrink-0" />
                    <span>إعادة إرسال رسالة التأكيد</span>
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                الانتقال إلى تسجيل الدخول
              </Link>

              <button
                type="button"
                onClick={() => {
                  setEmailConfirmationSent(false);
                  setError("");
                  setSuccess("");
                }}
                className="mt-4 min-h-10 px-3 text-sm font-semibold text-muted-foreground hover:text-primary sm:mt-5"
              >
                العودة إلى إنشاء الحساب
              </button>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          الجانب التعريفي
      ========================== */}
      <div className="relative hidden min-h-screen overflow-hidden bg-primary p-10 lg:flex lg:flex-col lg:justify-center xl:p-14">
        <div className="absolute -top-24 -left-24 size-80 rounded-full bg-secondary/25 blur-3xl" />

        <div className="relative mx-auto w-full max-w-xl">
          <h2 className="break-words text-3xl leading-snug font-extrabold text-primary-foreground xl:text-4xl">
            أمانتي، شحنتك وأمانتك في أمان.
          </h2>

          <div className="mt-8 space-y-5 xl:mt-10">
            {[
              {
                icon: ShieldCheck,
                t: "حفظ آمن",
                s: "أمانتك محفوظة في مركز أمانتي.",
              },
              {
                icon: PackageCheck,
                t: "رقم تتبع خاص",
                s: "لكل شحنة رقم يتابعها خطوة بخطوة.",
              },
              {
                icon: Bell,
                t: "إشعارات عند الوصول",
                s: "نعلمك فور جاهزية الاستلام.",
              },
            ].map((f) => (
              <div
                key={f.t}
                className="flex min-w-0 items-start gap-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10">
                  <f.icon
                    className="size-5 text-primary-foreground"
                    strokeWidth={1.5}
                  />
                </div>

                <div className="min-w-0">
                  <p className="break-words font-bold text-primary-foreground">
                    {f.t}
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-primary-foreground/60">
                    {f.s}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4 xl:mt-10 xl:p-5">
            <p className="text-sm font-bold text-primary-foreground">
              {accountType === "merchant"
                ? "🏪 حساب تاجر"
                : "👤 حساب عميل"}
            </p>

            <p className="mt-2 break-words text-xs leading-6 text-primary-foreground/50">
              {accountType === "merchant"
                ? "حساب مخصص للتجار لإدارة العملاء والشحنات من لوحة خاصة."
                : "حساب مخصص للعملاء لإرسال ومتابعة الشحنات والأمانات."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}