import type { Customer } from "@/services/customerAdminApi";

export function exportCustomersToCSV(customers: Customer[], filename = "customers_report.csv") {
  const headers = [
    "Customer ID",
    "Full Name",
    "Email",
    "Phone",
    "City",
    "State",
    "Registration Date",
    "Verification Status",
    "Account Status",
    "Total Orders",
    "Completed Orders",
    "Cancelled Orders",
    "Total Spending (INR)",
    "Wallet Balance (INR)",
    "Reward Points",
    "Tier",
  ];

  const rows = customers.map((c) => [
    c.customerId,
    `"${(c.fullName || "").replace(/"/g, '""')}"`,
    c.email,
    c.phone,
    c.city,
    c.state,
    new Date(c.registrationDate).toLocaleDateString("en-IN"),
    c.isVerified ? "Verified" : "Unverified",
    c.status,
    c.totalOrders,
    c.completedOrders,
    c.cancelledOrders,
    c.totalSpending,
    c.walletBalance,
    c.rewardPoints,
    c.tier,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomersToExcel(customers: Customer[], filename = "customers_report.xlsx") {
  // Generates clean TSV/XML excel-compatible blob
  const headers = [
    "Customer ID",
    "Full Name",
    "Email",
    "Phone",
    "City",
    "State",
    "Registration Date",
    "Verification Status",
    "Status",
    "Total Orders",
    "Spending (INR)",
    "Wallet (INR)",
    "Rewards",
  ];

  const rows = customers.map((c) => [
    c.customerId,
    c.fullName,
    c.email,
    c.phone,
    c.city,
    c.state,
    new Date(c.registrationDate).toLocaleDateString("en-IN"),
    c.isVerified ? "Verified" : "Unverified",
    c.status,
    c.totalOrders,
    c.totalSpending,
    c.walletBalance,
    c.rewardPoints,
  ]);

  const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportCustomerToPDF(customer: Customer) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Customer Profile - ${customer.fullName} (${customer.customerId})</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { border-bottom: 3px solid #E23744; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .logo { font-size: 24px; font-weight: 900; color: #E23744; }
          .title { font-size: 20px; font-weight: 700; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
          .label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 16px; font-weight: 600; color: #0f172a; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .badge-active { background: #dcfce7; color: #166534; }
          .badge-verified { background: #dbeafe; color: #1e40af; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">FOODIQ ENTERPRISE</div>
            <div class="title">Customer Summary Report</div>
          </div>
          <div>
            <div>Generated: ${new Date().toLocaleString("en-IN")}</div>
            <div>Ref ID: ${customer.customerId}</div>
          </div>
        </div>
        <div class="grid">
          <div class="card">
            <div class="label">Customer Details</div>
            <div class="value">${customer.fullName}</div>
            <div>Email: ${customer.email}</div>
            <div>Phone: ${customer.phone}</div>
            <div>Location: ${customer.city}, ${customer.state}</div>
          </div>
          <div class="card">
            <div class="label">Account Status</div>
            <div>Status: <span class="badge badge-active">${customer.status}</span></div>
            <div>Verification: <span class="badge badge-verified">${customer.isVerified ? "VERIFIED" : "UNVERIFIED"}</span></div>
            <div>Tier: ${customer.tier}</div>
            <div>Registered: ${new Date(customer.registrationDate).toLocaleDateString("en-IN")}</div>
          </div>
          <div class="card">
            <div class="label">Order Metrics</div>
            <div>Total Orders: <strong>${customer.totalOrders}</strong></div>
            <div>Completed: <strong>${customer.completedOrders}</strong></div>
            <div>Cancelled: <strong>${customer.cancelledOrders}</strong></div>
            <div>Total Spent: <strong>₹${customer.totalSpending.toLocaleString("en-IN")}</strong></div>
          </div>
          <div class="card">
            <div class="label">Wallet & Loyalty</div>
            <div>Wallet Balance: <strong>₹${customer.walletBalance.toLocaleString("en-IN")}</strong></div>
            <div>Reward Points: <strong>${customer.rewardPoints} pts</strong></div>
            <div>Referral Code: <strong>${customer.referralCode || "N/A"}</strong></div>
          </div>
        </div>
        <div class="footer">Confidential Admin Audit Report • Foodiq Enterprise Dashboard</div>
        <script>window.print();</script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
