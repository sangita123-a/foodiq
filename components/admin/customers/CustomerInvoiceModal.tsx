"use client";

import { X, Printer, Download, CheckCircle2 } from "lucide-react";
import type { CustomerOrder, Customer } from "@/services/customerAdminApi";

type Props = {
  isOpen: boolean;
  order: CustomerOrder | null;
  customer: Customer | null;
  onClose: () => void;
};

export default function CustomerInvoiceModal({
  isOpen,
  order,
  customer,
  onClose,
}: Props) {
  if (!isOpen || !order || !customer) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white border border-gray-100 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Invoice Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E23744] text-white flex items-center justify-center font-black text-xl">
              F
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">TAX INVOICE</h3>
              <p className="text-xs text-gray-500 font-mono">Invoice #{order.orderNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Address & Vendor Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1">
            <div className="font-bold text-gray-400 uppercase text-[10px]">Billed To</div>
            <div className="font-bold text-gray-900 text-sm">{customer.fullName}</div>
            <div className="text-gray-600">{order.deliveryAddress}</div>
            <div className="text-gray-500 font-mono">{customer.phone}</div>
            <div className="text-gray-500">{customer.email}</div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-1 text-right">
            <div className="font-bold text-gray-400 uppercase text-[10px]">Vendor Details</div>
            <div className="font-bold text-gray-900 text-sm">{order.restaurantName}</div>
            <div className="text-gray-600">GSTIN: 27AAAAA0000A1Z5</div>
            <div className="text-gray-500 font-mono">
              Date: {new Date(order.date).toLocaleDateString("en-IN")}
            </div>
            <div className="text-emerald-600 font-bold flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{order.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Item Summary Table */}
        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                <th className="p-3">Description</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-3 font-semibold text-gray-800">{order.itemsSummary}</td>
                <td className="p-3 text-center text-gray-600">{order.itemCount}</td>
                <td className="p-3 text-right font-bold text-gray-900">
                  ₹{order.subtotal.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Total Calculation breakdown */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Item Subtotal</span>
            <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Promo Discount</span>
              <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>Delivery Fee</span>
            <span>₹{order.deliveryFee.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Taxes & GST (5%)</span>
            <span>₹{order.taxAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-gray-900">
            <span>Total Payable</span>
            <span className="text-[#E23744]">₹{order.totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Print / Close Footer */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-gray-400 font-mono">
            Payment Method: {order.paymentMethod}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all"
          >
            Close Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
