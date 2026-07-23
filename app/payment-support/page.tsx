"use client";

import SupportFlowPage from "@/components/support/SupportFlowPage";
import PaymentIssuesModal from "@/components/support/PaymentIssuesModal";

export default function PaymentSupportPage() {
  return (
    <SupportFlowPage>
      {({ onClose }) => (
        <PaymentIssuesModal open onClose={onClose} variant="page" />
      )}
    </SupportFlowPage>
  );
}
