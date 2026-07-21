import type { PublicUser } from "@/lib/authUser";

export type AuthApiPayload = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

export function parseAuthApiResponse(payload: AuthApiPayload | null | undefined) {
  const body = payload && typeof payload === "object" ? payload : {};
  const nested = body.data && typeof body.data === "object" ? body.data : {};
  const userSource = (body.user && typeof body.user === "object" ? body.user : nested) as Record<
    string,
    unknown
  >;
  const token =
    (typeof body.token === "string" && body.token) ||
    (typeof nested.token === "string" ? nested.token : "") ||
    "";

  const user: PublicUser & { token?: string } = {
    id: userSource.id != null ? String(userSource.id) : undefined,
    full_name: userSource.full_name != null ? String(userSource.full_name) : undefined,
    email: userSource.email != null ? String(userSource.email) : undefined,
    phone_number:
      userSource.phone_number != null ? String(userSource.phone_number) : undefined,
    role: userSource.role != null ? String(userSource.role) : undefined,
    admin_role:
      userSource.admin_role != null ? String(userSource.admin_role) : undefined,
    token: token || undefined,
  };

  return {
    success: Boolean(body.success),
    message: typeof body.message === "string" ? body.message : "",
    token,
    user,
  };
}
