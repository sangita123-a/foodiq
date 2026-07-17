import type { ReactNode } from "react";
import "./partner-polish.css";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div data-partner-surface className="contents">
      {children}
    </div>
  );
}
