export interface KPIStats {
  totalOrders: number;
  totalOrdersGrowth: number;
  totalRevenue: number;
  revenueGrowth: number;
  newCustomers: number;
  newCustomersGrowth: number;
  averageRating: number;
  averageRatingGrowth: number;
  bestSellingDish: string;
  bestSellingDishSales: number;
  avgDeliveryTime: number; // in minutes
  avgDeliveryTimeGrowth: number; // e.g. -2 (faster is better)
  averageOrderValue: number;
  aovGrowth: number;
}

export interface RevenueDataPoint {
  label: string; // e.g., "Mon", "Week 1", "Jan"
  value: number;
  height: string; // percentage for CSS height
}

export interface OrderAnalyticsData {
  completionRate: number; // percentage
  cancellationRate: number; // percentage
  peakHour: string;
  ordersByHour: { hour: string; count: number; height: string }[];
}

export interface MenuPerformanceItem {
  id: string;
  name: string;
  image: string;
  metricLabel: string; // e.g., "Orders", "Revenue", "Prep Time"
  metricValue: string | number;
}

export interface CustomerInsightsData {
  newPercentage: number;
  returningPercentage: number;
  satisfaction: number;
  repeatPercentage: number;
}

export interface PaymentDataPoint {
  method: string;
  percentage: number;
  color: string;
}

export interface LocationData {
  area: string;
  orders: number;
  percentage: number;
}

export interface FullAnalyticsData {
  kpis: KPIStats;
  revenue: {
    daily: RevenueDataPoint[];
    weekly: RevenueDataPoint[];
    monthly: RevenueDataPoint[];
    yearly: RevenueDataPoint[];
  };
  orders: OrderAnalyticsData;
  menu: {
    topSelling: MenuPerformanceItem[];
    leastOrdered: MenuPerformanceItem[];
    highestRevenue: MenuPerformanceItem;
    fastestPrep: MenuPerformanceItem;
  };
  customers: CustomerInsightsData;
  payments: PaymentDataPoint[];
  locations: LocationData[];
  aiInsights: string[];
}
