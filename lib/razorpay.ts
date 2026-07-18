export type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    method?: string;
  };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
  notes?: Record<string, string>;
  config?: {
    display?: {
      preferences?: { show_default_blocks?: boolean };
    };
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (response: { error?: { description?: string } }) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout(params: {
  key: string;
  amountPaise: number;
  currency?: string;
  orderId: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  /** Razorpay method hint: upi | card | netbanking | wallet */
  preferredMethod?: string;
  onSuccess: (response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (message: string) => void;
}): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    params.onError?.("Unable to load Razorpay Checkout. Check your network connection.");
    return;
  }

  const rzp = new window.Razorpay({
    key: params.key,
    amount: params.amountPaise,
    currency: params.currency || "INR",
    name: "Foodiq",
    description: params.description || "Food order payment",
    order_id: params.orderId,
    prefill: {
      ...params.prefill,
      ...(params.preferredMethod ? { method: params.preferredMethod } : {}),
    },
    theme: { color: "#FC8019" },
    handler: params.onSuccess,
    modal: {
      ondismiss: () => params.onDismiss?.(),
    },
  });

  rzp.on("payment.failed", (response) => {
    params.onError?.(response.error?.description || "Payment failed");
  });

  rzp.open();
}
