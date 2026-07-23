"use client";

import SupportFlowPage from "@/components/support/SupportFlowPage";
import EmailSupportModal from "@/components/support/EmailSupportModal";

export default function EmailSupportPage() {
  return (
    <SupportFlowPage>
      {({ onClose }) => (
        <EmailSupportModal open onClose={onClose} variant="page" />
      )}
    </SupportFlowPage>
  );
}
