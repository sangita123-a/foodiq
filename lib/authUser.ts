/**
 * Persist only non-sensitive user profile fields in localStorage.
 * JWT stays in the js-cookie used for Bearer auth (never duplicate tokens in localStorage).
 */
export type PublicUser = {
  id?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  role?: string;
  admin_role?: string;
  profile_image_url?: string | null;
};

export function toPublicUser(payload: Record<string, unknown> | null | undefined): PublicUser {
  if (!payload || typeof payload !== "object") return {};
  return {
    id: payload.id != null ? String(payload.id) : undefined,
    full_name: payload.full_name != null ? String(payload.full_name) : undefined,
    email: payload.email != null ? String(payload.email) : undefined,
    phone_number:
      payload.phone_number != null ? String(payload.phone_number) : undefined,
    role: payload.role != null ? String(payload.role) : undefined,
    admin_role: payload.admin_role != null ? String(payload.admin_role) : undefined,
    profile_image_url:
      payload.profile_image_url != null
        ? String(payload.profile_image_url)
        : null,
  };
}

export function persistAuthUser(payload: Record<string, unknown> | null | undefined) {
  if (typeof window === "undefined") return;
  const safe = toPublicUser(payload);
  localStorage.setItem("user", JSON.stringify(safe));
}

export function clearAuthUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}
