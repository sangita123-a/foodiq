export type OrderStatus = "New" | "Accepted" | "Preparing" | "Ready for Pickup" | "Picked Up" | "Delivered" | "Rejected";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  customizations?: string[];
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: OrderItem[];
  specialInstructions?: string;
  paymentMethod: "Card" | "Cash on Delivery" | "UPI" | "Wallet";
  paymentStatus: "Paid" | "Pending";
  subtotal: number;
  taxes: number;
  discount: number;
  grandTotal: number;
  orderTime: string; // ISO string or formatted string
  estimatedPickupTime?: string;
  status: OrderStatus;
  deliveryPartner?: {
    name: string;
    phone: string;
  };
}
