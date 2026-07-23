"use client";

import { useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, CheckCircle2 } from "lucide-react";
import SupportModal from "@/components/support/SupportModal";
import { fetchUserOrders, submitOrderProblem } from "@/services/supportApi";
import { useToast } from "@/contexts/ToastContext";

const PROBLEM_TYPES = [
  "Missing Item",
  "Wrong Order",
  "Food Quality",
  "Cold Food",
  "Packaging Issue",
  "Late Delivery",
] as const;

const schema = z.object({
  order_id: z.string().min(1, "Select an order"),
  problem_type: z.enum(PROBLEM_TYPES),
  description: z.string().min(10, "Please describe the issue (min 10 characters)"),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  variant?: "modal" | "page";
};

export default function OrderProblemModal({
  open,
  onClose,
  onSubmitted,
  variant = "modal",
}: Props) {
  const { showToast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    ticket_number: string;
    status: string;
    expected_resolution_time?: string;
  } | null>(null);

  const { data: orders = [] } = useSWR(open ? "/api/orders" : null, fetchUserOrders);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_id: "",
      problem_type: "Missing Item",
      description: "",
    },
  });

  const handleClose = () => {
    setResult(null);
    setImage(null);
    reset();
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("order_id", values.order_id);
      fd.append("problem_type", values.problem_type);
      fd.append("description", values.description);
      if (image) fd.append("file", image);
      const res = await submitOrderProblem(fd);
      setResult(res);
      showToast("Complaint Submitted", "success");
      onSubmitted?.();
      reset();
      setImage(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to submit complaint";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SupportModal open={open} onClose={handleClose} title="Order Problems" wide variant={variant}>
      {result ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
          <h3 className="text-2xl font-black text-foreground">Complaint Submitted</h3>
          <div className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-white p-5 text-left">
            <p className="text-sm">
              <span className="text-[#9CA3AF] font-bold uppercase text-[10px] tracking-widest block">
                Ticket Number
              </span>
              <span className="font-black text-foreground text-lg">{result.ticket_number}</span>
            </p>
            <p className="text-sm">
              <span className="text-[#9CA3AF] font-bold uppercase text-[10px] tracking-widest block">
                Complaint Status
              </span>
              <span className="font-bold text-foreground">{result.status}</span>
            </p>
            <p className="text-sm">
              <span className="text-[#9CA3AF] font-bold uppercase text-[10px] tracking-widest block">
                Expected Resolution Time
              </span>
              <span className="font-bold text-foreground">
                {result.expected_resolution_time
                  ? new Date(result.expected_resolution_time).toLocaleString("en-IN")
                  : "Within 24 hours"}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl bg-primary px-6 py-3 font-bold text-white"
          >
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              Order
            </label>
            <select
              {...register("order_id")}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 font-bold text-foreground outline-none focus:border-primary"
            >
              <option value="">Select order</option>
              {(orders as Array<{ id: string; restaurant_name?: string }>).map((o) => (
                <option key={o.id} value={o.id}>
                  #{String(o.id).slice(0, 8).toUpperCase()}
                  {o.restaurant_name ? ` — ${o.restaurant_name}` : ""}
                </option>
              ))}
            </select>
            {errors.order_id ? (
              <p className="mt-1 text-sm font-bold text-red-500">{errors.order_id.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              Problem Type
            </label>
            <select
              {...register("problem_type")}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 font-bold text-foreground outline-none focus:border-primary"
            >
              {PROBLEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.problem_type ? (
              <p className="mt-1 text-sm font-bold text-red-500">{errors.problem_type.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={4}
              placeholder="Tell us what went wrong…"
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
            {errors.description ? (
              <p className="mt-1 text-sm font-bold text-red-500">{errors.description.message}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
              Upload Image
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-white px-4 py-4 text-sm font-bold text-gray-text hover:border-primary">
              <ImagePlus className="h-5 w-5 text-primary" />
              {image ? image.name : "Choose a photo (optional)"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-primary py-4 font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Complaint"}
          </button>
        </form>
      )}
    </SupportModal>
  );
}
