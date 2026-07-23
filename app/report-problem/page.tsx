"use client";

import SupportFlowPage from "@/components/support/SupportFlowPage";
import OrderProblemModal from "@/components/support/OrderProblemModal";

export default function ReportProblemPage() {
  return (
    <SupportFlowPage>
      {({ onClose }) => (
        <OrderProblemModal open onClose={onClose} variant="page" />
      )}
    </SupportFlowPage>
  );
}
