"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import {
  SupportErrorState,
  SupportSpinner,
} from "@/components/support/SupportStates";
import { trackOrder } from "@/services/supportApi";

const schema = z.object({
  orderId: z.string().min(4, "Enter a valid Order ID"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  variant?: "modal" | "page";
};

/**
 * Order ID entry for Help & Support — validates then opens the existing
 * `/track-order/[orderId]` live tracking page (TrackOrderView).
 */
export default function TrackOrderModal({ open, onClose, variant = "modal" }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { orderId: "" },
  });

  const onSearch = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      const orderId = values.orderId.trim();
      await trackOrder(orderId);
      onClose();
      router.push(`/track-order/${encodeURIComponent(orderId)}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string }; status?: number } })?.response?.data
          ?.message ||
        ((err as { response?: { status?: number } })?.response?.status === 404
          ? "Order not found"
          : "Could not fetch order");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SupportModal open={open} onClose={onClose} title="Track an Order" variant={variant}>
      <form onSubmit={handleSubmit(onSearch)} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            {...register("orderId")}
            placeholder="Enter Order ID"
            className="w-full rounded-xl border border-border bg-white py-3 pl-11 pr-4 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            aria-invalid={!!errors.orderId}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-5 py-3 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Track
        </button>
      </form>
      {errors.orderId ? (
        <p className="mb-4 text-sm font-bold text-red-500">{errors.orderId.message}</p>
      ) : null}

      {loading ? <SupportSpinner label="Fetching order…" /> : null}
      {!loading && error ? (
        <SupportErrorState
          message={error}
          onRetry={() => {
            const id = getValues("orderId");
            if (id) void onSearch({ orderId: id });
          }}
        />
      ) : null}
      {!loading && !error ? (
        <p className="py-6 text-center text-sm text-gray-text">
          Enter your Order ID to open live tracking with status timeline, ETA, delivery partner,
          address, payment, and items.
        </p>
      ) : null}
    </SupportModal>
  );
}
