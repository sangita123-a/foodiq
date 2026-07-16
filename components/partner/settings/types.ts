export interface WorkingDay {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface SettingsState {
  profile: {
    logo: string;
    cover: string;
    restaurantName: string;
    ownerName: string;
    email: string;
    phone: string;
    description: string;
    cuisineType: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  workingHours: WorkingDay[];
  delivery: {
    radius: number;
    minOrderAmount: number;
    estimatedTime: number;
    acceptOnlineOrders: boolean;
    acceptPickupOrders: boolean;
  };
  bank: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ifsc: string;
    upi: string;
  };
  tax: {
    gst: string;
    pan: string;
    regNumber: string;
  };
  notifications: {
    newOrders: boolean;
    orderCancellation: boolean;
    customerReviews: boolean;
    paymentAlerts: boolean;
    marketingUpdates: boolean;
  };
  security: {
    twoFactorAuth: boolean;
  };
  branding: {
    themeColor: string;
    primaryBanner: string;
    promoBanner: string;
  };
}
