import api from "@/services/api";
import { parseAuthApiResponse, type AuthApiPayload } from "@/lib/authResponse";

export async function sendOtp(payload: {
  mobile: string;
  purpose?: "phone_login" | "password_reset";
}) {
  const res = await api.post("/api/auth/send-otp", payload);
  return res.data as {
    success: boolean;
    message?: string;
    data?: {
      mobile?: string;
      expires_at?: string;
      debug_code?: string;
      account_exists?: boolean;
      purpose?: string;
    };
  };
}

export async function verifyOtp(payload: {
  mobile: string;
  otp: string;
  purpose?: "phone_login" | "password_reset";
}) {
  const res = await api.post("/api/auth/verify-otp", payload);
  return parseAuthApiResponse(res.data as AuthApiPayload);
}

export async function registerAccount(payload: {
  full_name: string;
  mobile: string;
  phone?: string;
  email?: string;
  password: string;
}) {
  const res = await api.post("/api/auth/register", {
    full_name: payload.full_name,
    phone: payload.mobile || payload.phone,
    email: payload.email || undefined,
    password: payload.password,
  });
  return parseAuthApiResponse(res.data as AuthApiPayload);
}

export async function loginWithPassword(payload: {
  mobile?: string;
  email?: string;
  password: string;
}) {
  const res = await api.post("/api/auth/login", payload);
  return parseAuthApiResponse(res.data as AuthApiPayload);
}

export async function forgotPassword(payload: { mobile: string }) {
  const res = await api.post("/api/auth/forgot-password", payload);
  return res.data as {
    success: boolean;
    message?: string;
    data?: { mobile?: string; debug_code?: string; expires_at?: string };
  };
}

export async function resetPassword(payload: {
  mobile: string;
  otp: string;
  new_password: string;
}) {
  const res = await api.post("/api/auth/reset-password", {
    mobile: payload.mobile,
    code: payload.otp,
    new_password: payload.new_password,
  });
  return res.data as { success: boolean; message?: string };
}

export async function logoutSession() {
  const res = await api.post("/api/auth/logout");
  return res.data;
}
