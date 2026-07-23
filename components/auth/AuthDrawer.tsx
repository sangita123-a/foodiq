"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import MobileDrawer from "@/components/ui/MobileDrawer";
import { useToast } from "@/contexts/ToastContext";
import { markAuthenticated, authCookieOptions } from "@/lib/authSession";
import { persistAuthUser } from "@/lib/authUser";
import { validateIndianMobile, normalizeIndianMobile } from "@/lib/phone";
import { validateFullName, validatePassword, validateEmail } from "@/lib/authValidation";
import {
  sendOtp,
  verifyOtp,
  registerAccount,
  loginWithPassword,
  resetPassword,
} from "@/services/authApi";
import Cookies from "js-cookie";

type AuthView =
  | "otp-phone"
  | "otp-verify"
  | "register"
  | "password"
  | "forgot-phone"
  | "forgot-otp"
  | "forgot-reset";

type Props = {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
};

const RESEND_SECONDS = 30;

export default function AuthDrawer({ open, onClose, onAuthenticated }: Props) {
  const { showToast } = useToast();
  const [view, setView] = useState<AuthView>("otp-phone");
  const [loading, setLoading] = useState(false);

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpPurpose, setOtpPurpose] = useState<"phone_login" | "password_reset">("phone_login");
  const [resendIn, setResendIn] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setView("otp-phone");
    setLoading(false);
    setMobile("");
    setOtp(["", "", "", "", "", ""]);
    setOtpPurpose("phone_login");
    setResendIn(0);
    setFullName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setRememberMe(true);
    setFieldError(null);
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (view === "otp-verify" || view === "forgot-otp") {
      otpRefs.current[0]?.focus();
    }
  }, [view]);

  const finishAuth = (token: string, user: Record<string, unknown>) => {
    markAuthenticated(token);
    persistAuthUser(user);
    if (rememberMe) {
      Cookies.set("foodiq_session", "1", { ...authCookieOptions(), expires: 30 });
    }
    showToast("Signed in successfully", "success");
    onAuthenticated?.();
    onClose();
  };

  const otpCode = otp.join("");

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setFieldError(null);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split("");
    while (next.length < 6) next.push("");
    setOtp(next.slice(0, 6));
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const requestOtp = async (purpose: "phone_login" | "password_reset") => {
    const err = validateIndianMobile(mobile);
    if (err) {
      setFieldError(err);
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const res = await sendOtp({ mobile: normalizeIndianMobile(mobile), purpose });
      if (!res.success) {
        setFieldError(res.message || "Failed to send OTP");
        return;
      }
      if (res.data?.debug_code) {
        showToast(`Dev OTP: ${res.data.debug_code}`, "success");
      } else {
        showToast("OTP sent to your mobile", "success");
      }
      setOtpPurpose(purpose);
      setOtp(["", "", "", "", "", ""]);
      setResendIn(RESEND_SECONDS);
      setView(purpose === "password_reset" ? "forgot-otp" : "otp-verify");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to send OTP";
      setFieldError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitOtpLogin = async () => {
    if (otpCode.length !== 6) {
      setFieldError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const parsed = await verifyOtp({
        mobile: normalizeIndianMobile(mobile),
        otp: otpCode,
        purpose: "phone_login",
      });
      if (!parsed.success || !parsed.token) {
        setFieldError(parsed.message || "Invalid OTP");
        showToast(parsed.message || "Invalid OTP", "error");
        return;
      }
      finishAuth(parsed.token, parsed.user as Record<string, unknown>);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string; data?: { needs_registration?: boolean } } } })
        ?.response?.data;
      const msg = data?.message || "OTP verification failed";
      if (data?.data?.needs_registration) {
        setFieldError(null);
        showToast("No account found. Create an account to continue.", "error");
        setView("register");
        return;
      }
      setFieldError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async () => {
    const nameErr = validateFullName(fullName);
    const phoneErr = validateIndianMobile(mobile);
    const passErr = validatePassword(password);
    const emailErr = email.trim() ? validateEmail(email) : null;
    if (nameErr || phoneErr || passErr || emailErr) {
      setFieldError(nameErr || phoneErr || passErr || emailErr);
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match");
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const parsed = await registerAccount({
        full_name: fullName.trim(),
        mobile: normalizeIndianMobile(mobile),
        email: email.trim() || undefined,
        password,
      });
      if (!parsed.success || !parsed.token) {
        setFieldError(parsed.message || "Registration failed");
        showToast(parsed.message || "Registration failed", "error");
        return;
      }
      finishAuth(parsed.token, parsed.user as Record<string, unknown>);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Registration failed";
      setFieldError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordLogin = async () => {
    const phoneErr = validateIndianMobile(mobile);
    if (phoneErr) {
      setFieldError(phoneErr);
      return;
    }
    if (!password.trim()) {
      setFieldError("Password is required");
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const parsed = await loginWithPassword({
        mobile: normalizeIndianMobile(mobile),
        password,
      });
      if (!parsed.success || !parsed.token) {
        setFieldError(parsed.message || "Login failed");
        showToast(parsed.message || "Login failed", "error");
        return;
      }
      finishAuth(parsed.token, parsed.user as Record<string, unknown>);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Login failed";
      setFieldError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitForgotOtp = async () => {
    if (otpCode.length !== 6) {
      setFieldError("Enter the 6-digit OTP");
      return;
    }
    setFieldError(null);
    setView("forgot-reset");
  };

  const submitNewPassword = async () => {
    const passErr = validatePassword(password);
    if (passErr) {
      setFieldError(passErr);
      return;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match");
      return;
    }
    setLoading(true);
    setFieldError(null);
    try {
      const res = await resetPassword({
        mobile: normalizeIndianMobile(mobile),
        otp: otpCode,
        new_password: password,
      });
      if (!res.success) {
        setFieldError(res.message || "Could not reset password");
        return;
      }
      showToast("Password updated. Sign in with your new password.", "success");
      setPassword("");
      setConfirmPassword("");
      setView("password");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not reset password";
      setFieldError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const title =
    view === "register"
      ? "Create an Account"
      : view === "password"
        ? "Login with Password"
        : view.startsWith("forgot")
          ? "Forgot Password"
          : "Sign In";

  return (
    <MobileDrawer open={open} onClose={onClose} title={title} side="right" width="w-[min(420px,100vw)]">
      <div className="flex flex-1 flex-col overflow-y-auto p-5 md:p-6">
        {fieldError && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
            {fieldError}
          </p>
        )}

        {(view === "otp-phone" || view === "forgot-phone") && (
          <div className="space-y-5">
            <p className="text-sm text-gray-text">
              {view === "forgot-phone"
                ? "Enter your registered mobile number to receive a reset code."
                : "Enter your mobile number to continue. We’ll send a one-time password."}
            </p>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
                Mobile Number
              </span>
              <div className="flex overflow-hidden rounded-xl border border-border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <span className="flex items-center border-r border-border bg-section px-3 text-sm font-semibold text-foreground">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setFieldError(null);
                  }}
                  placeholder="9876543210"
                  className="w-full bg-transparent px-3 py-3 text-foreground outline-none"
                  aria-label="Mobile number"
                />
              </div>
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                view === "forgot-phone"
                  ? requestOtp("password_reset")
                  : requestOtp("phone_login")
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continue
            </button>
            {view === "otp-phone" && (
              <div className="space-y-3 pt-2 text-center text-sm">
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => {
                    setFieldError(null);
                    setView("password");
                  }}
                >
                  Login with Password
                </button>
                <p className="text-gray-text">
                  New to Foodiq?{" "}
                  <button
                    type="button"
                    className="font-semibold text-foreground hover:text-primary"
                    onClick={() => {
                      setFieldError(null);
                      setView("register");
                    }}
                  >
                    Create an Account
                  </button>
                </p>
              </div>
            )}
            {view === "forgot-phone" && (
              <button
                type="button"
                className="w-full text-center text-sm font-semibold text-gray-text hover:text-foreground"
                onClick={() => setView("password")}
              >
                Back to password login
              </button>
            )}
          </div>
        )}

        {(view === "otp-verify" || view === "forgot-otp") && (
          <div className="space-y-5">
            <p className="text-sm text-gray-text">
              Enter the 6-digit OTP sent to{" "}
              <span className="font-semibold text-foreground">+91 {normalizeIndianMobile(mobile)}</span>
            </p>
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="h-12 w-11 rounded-xl border border-border bg-white text-center text-lg font-bold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={view === "forgot-otp" ? submitForgotOtp : submitOtpLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify OTP
            </button>
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                className="font-medium text-gray-text hover:text-foreground"
                onClick={() => setView(view === "forgot-otp" ? "forgot-phone" : "otp-phone")}
              >
                Change number
              </button>
              <button
                type="button"
                disabled={resendIn > 0 || loading}
                onClick={() => requestOtp(otpPurpose)}
                className="font-semibold text-primary disabled:text-muted disabled:opacity-60"
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </button>
            </div>
          </div>
        )}

        {view === "register" && (
          <div className="space-y-4">
            <Field
              label="Full Name"
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
              placeholder="Your full name"
            />
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
                Mobile Number
              </span>
              <div className="flex overflow-hidden rounded-xl border border-border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <span className="flex items-center border-r border-border bg-section px-3 text-sm font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-transparent px-3 py-3 outline-none"
                  placeholder="9876543210"
                />
              </div>
            </label>
            <Field
              label="Email (optional)"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={submitRegister}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Create Account
            </button>
            <p className="text-center text-sm text-gray-text">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-foreground hover:text-primary"
                onClick={() => setView("otp-phone")}
              >
                Sign In
              </button>
            </p>
          </div>
        )}

        {view === "password" && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">
                Mobile Number
              </span>
              <div className="flex overflow-hidden rounded-xl border border-border bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                <span className="flex items-center border-r border-border bg-section px-3 text-sm font-semibold">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full bg-transparent px-3 py-3 outline-none"
                  placeholder="9876543210"
                />
              </div>
            </label>
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-text">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border"
                />
                Remember Me
              </label>
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => {
                  setFieldError(null);
                  setView("forgot-phone");
                }}
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={submitPasswordLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign In
            </button>
            <p className="text-center text-sm text-gray-text">
              Prefer OTP?{" "}
              <button
                type="button"
                className="font-semibold text-foreground hover:text-primary"
                onClick={() => setView("otp-phone")}
              >
                Sign In with OTP
              </button>
            </p>
          </div>
        )}

        {view === "forgot-reset" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-text">Create a new password for your account.</p>
            <PasswordField
              label="New Password"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              onToggle={() => setShowPassword((s) => !s)}
            />
            <button
              type="button"
              disabled={loading}
              onClick={submitNewPassword}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Update Password
            </button>
          </div>
        )}
      </div>
    </MobileDrawer>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-white px-3 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          autoComplete="current-password"
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-border bg-white px-3 py-3 pr-11 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
