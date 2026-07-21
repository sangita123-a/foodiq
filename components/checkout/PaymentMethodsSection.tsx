"use client";

import { CreditCard, Smartphone, Banknote, Wallet, Building2, Shield } from "lucide-react";

export type PaymentMethod =
  | "Cash on Delivery"
  | "UPI"
  | "Credit Card"
  | "Debit Card"
  | "Net Banking"
  | "Wallets"
  | "Razorpay";

const paymentOptions: {
  id: PaymentMethod;
  label: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "Cash on Delivery",
    label: "Cash on Delivery",
    hint: "Pay when your order arrives",
    icon: <Banknote className="w-5 h-5" />,
  },
  {
    id: "UPI",
    label: "UPI",
    hint: "GPay, PhonePe, Paytm & more",
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    id: "Credit Card",
    label: "Credit Card",
    hint: "Visa, Mastercard, RuPay via Razorpay",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "Debit Card",
    label: "Debit Card",
    hint: "Secure debit card payment via Razorpay",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "Net Banking",
    label: "Net Banking",
    hint: "All major Indian banks",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    id: "Wallets",
    label: "Wallets",
    hint: "Paytm, Amazon Pay & more",
    icon: <Wallet className="w-5 h-5" />,
  },
  {
    id: "Razorpay",
    label: "Razorpay Checkout",
    hint: "All methods in one secure window",
    icon: <Shield className="w-5 h-5" />,
  },
];

type Props = {
  selectedMethod: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
};

export default function PaymentMethodsSection({ selectedMethod, onSelect }: Props) {
  return (
    <div className="bg-section rounded-2xl p-6 border border-border mb-6">
      <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary" />
        Payment Method
      </h3>
      <p className="text-sm text-gray-text mb-6">
        Pay securely with Razorpay (UPI, cards, net banking, wallets) or choose Cash on Delivery.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Payment method">
        {paymentOptions.map((option) => {
          const isSelected = selectedMethod === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={`p-4 rounded-xl border flex items-start gap-3 text-left transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(226, 55, 68,0.15)]"
                  : "border-border bg-white text-gray-text hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="mt-0.5">{option.icon}</span>
              <span>
                <span className="font-bold text-sm block text-foreground">{option.label}</span>
                <span className="text-xs text-gray-text mt-1 block">{option.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function mapPaymentMethodToApi(method: PaymentMethod): string {
  const map: Record<PaymentMethod, string> = {
    "Cash on Delivery": "cod",
    UPI: "upi",
    "Credit Card": "credit_card",
    "Debit Card": "debit_card",
    "Net Banking": "net_banking",
    Wallets: "wallet",
    Razorpay: "razorpay",
  };
  return map[method] || "cod";
}

export function isOnlinePaymentMethod(method: PaymentMethod): boolean {
  return method !== "Cash on Delivery";
}
