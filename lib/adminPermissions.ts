export type AdminRole =
  | "super_admin"
  | "admin"
  | "support_executive"
  | "finance_manager"
  | "marketing_manager";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support_executive: "Support Executive",
  finance_manager: "Finance Manager",
  marketing_manager: "Marketing Manager",
};

const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "dashboard",
    "orders",
    "customers",
    "restaurants",
    "delivery",
    "payments",
    "coupons",
    "menu",
    "analytics",
    "live",
    "monitoring",
    "bi",
    "ai",
    "fleet",
    "feedback",
    "bugs",
    "maintenance",
    "media",
    "settings",
    "notifications",
    "reports",
    "marketing",
    "cms",
    "security",
    "staff",
    "loyalty",
  ],
  support_executive: [
    "dashboard",
    "orders",
    "customers",
    "restaurants",
    "delivery",
    "feedback",
    "bugs",
    "live",
    "menu",
  ],
  finance_manager: [
    "dashboard",
    "orders",
    "payments",
    "coupons",
    "reports",
    "analytics",
    "bi",
  ],
  marketing_manager: [
    "dashboard",
    "coupons",
    "loyalty",
    "marketing",
    "cms",
    "notifications",
    "media",
    "analytics",
  ],
};

export type AdminNavItem = {
  name: string;
  href: string;
  permission: string;
  icon: string;
};

export function resolveAdminRole(role?: string | null, adminRole?: string | null): AdminRole | null {
  if (role !== "admin") return null;
  const r = (adminRole || "admin") as AdminRole;
  return r in ROLE_PERMISSIONS ? r : "admin";
}

export function hasAdminPermission(
  role?: string | null,
  adminRole?: string | null,
  permission?: string
): boolean {
  if (!permission) return true;
  const resolved = resolveAdminRole(role, adminRole);
  if (!resolved) return false;
  const perms = ROLE_PERMISSIONS[resolved];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  const base = permission.split(".")[0];
  return perms.includes(base);
}

export function getStoredAdminRole(): AdminRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw) as { role?: string; admin_role?: string };
    return resolveAdminRole(user.role, user.admin_role);
  } catch {
    return null;
  }
}
