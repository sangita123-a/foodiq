"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAt?: string | null;
  onExpired?: () => void;
};

export default function OrderExpiryCountdown({ expiresAt, onExpired }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) onExpired?.();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [expiresAt, onExpired]);

  if (secondsLeft == null) return null;

  const urgent = secondsLeft <= 15;
  return (
    <span
      className={`text-xs font-bold px-2 py-1 rounded-lg ${
        urgent ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700"
      }`}
    >
      {secondsLeft > 0 ? `Expires in ${secondsLeft}s` : "Expired"}
    </span>
  );
}
