import type { LucideIcon } from "lucide-react";
import {
  PackagePlus,
  ClipboardCheck,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Wallet,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  ShieldAlert,
  Megaphone,
  Headphones,
  MessageCircleMore,
} from "lucide-react";
import type {
  DeliveryNotificationCategory,
  DeliveryNotificationType,
} from "@/services/deliveryApi";

export const NOTIFICATION_TYPE_META: Record<
  DeliveryNotificationType,
  { label: string; icon: LucideIcon; color: string }
> = {
  new_order: { label: "New Order", icon: PackagePlus, color: "text-blue-600 bg-blue-50" },
  order_assigned: { label: "Order Assigned", icon: ClipboardCheck, color: "text-indigo-600 bg-indigo-50" },
  order_cancelled: { label: "Order Cancelled", icon: XCircle, color: "text-red-600 bg-red-50" },
  order_updated: { label: "Order Update", icon: RefreshCw, color: "text-amber-600 bg-amber-50" },
  delivery_completed: { label: "Delivery Completed", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  wallet_credit: { label: "Wallet Credited", icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
  withdrawal_approved: { label: "Withdrawal Approved", icon: ThumbsUp, color: "text-emerald-600 bg-emerald-50" },
  withdrawal_rejected: { label: "Withdrawal Rejected", icon: ThumbsDown, color: "text-red-600 bg-red-50" },
  kyc_approved: { label: "KYC Approved", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
  kyc_rejected: { label: "KYC Rejected", icon: ShieldAlert, color: "text-red-600 bg-red-50" },
  admin_message: { label: "Message from Admin", icon: Megaphone, color: "text-primary bg-primary/10" },
  support_ticket_reply: { label: "Support Reply", icon: MessageCircleMore, color: "text-sky-600 bg-sky-50" },
  support_ticket_resolved: { label: "Ticket Resolved", icon: Headphones, color: "text-emerald-600 bg-emerald-50" },
};

export const NOTIFICATION_FILTER_TABS: Array<DeliveryNotificationCategory | "All"> = [
  "All",
  "Orders",
  "Wallet",
  "KYC",
  "System",
  "Support",
];

export const NOTIFICATION_TYPES_BY_CATEGORY: Record<DeliveryNotificationCategory, DeliveryNotificationType[]> = {
  Orders: ["new_order", "order_assigned", "order_cancelled", "order_updated", "delivery_completed"],
  Wallet: ["wallet_credit", "withdrawal_approved", "withdrawal_rejected"],
  KYC: ["kyc_approved", "kyc_rejected"],
  System: ["admin_message"],
  Support: ["support_ticket_reply", "support_ticket_resolved"],
};

export function getNotificationMeta(type: string) {
  return (
    NOTIFICATION_TYPE_META[type as DeliveryNotificationType] || {
      label: "Notification",
      icon: Megaphone,
      color: "text-gray-600 bg-gray-100",
    }
  );
}
