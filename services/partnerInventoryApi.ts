import api, { fetcher } from "@/services/api";

export const inventoryFetcher = fetcher;

export type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchase_price?: number;
  category_id?: string;
  category_name?: string;
  supplier_id?: string;
  supplier_name?: string;
  expiry_date?: string;
  reorder_level?: number;
  stock_status?: string;
};

export type InventoryAlert = InventoryItem & { alert_type?: string };

export type Supplier = {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  purchase_count?: number;
};

export type RecipeRow = {
  menu_item_id: string;
  menu_item_name: string;
  price: number;
  is_available?: boolean;
  ingredients: Array<{
    id?: string;
    inventory_item_id: string;
    ingredient_name?: string;
    quantity_required: number;
    unit?: string;
    available_qty?: number;
  }>;
};

export type PurchaseOrder = {
  id: string;
  supplier_id?: string;
  supplier_name?: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at?: string;
  received_at?: string;
  item_count?: number;
  items?: Array<{
    id: string;
    inventory_item_id?: string;
    item_name?: string;
    inventory_name?: string;
    quantity: number;
    unit: string;
    unit_price: number;
  }>;
};

export type KitchenOrder = {
  id: string;
  customer_name?: string;
  status: string;
  total_amount: number;
  created_at?: string;
  started_at?: string;
  ready_at?: string;
  completed_at?: string;
  prep_minutes?: number;
  items: Array<{ name: string; quantity: number }>;
};

export type InventoryReports = {
  daily_consumption: Array<{ day: string; consumed: number }>;
  weekly_consumption: Array<{ week_start: string; consumed: number }>;
  monthly_consumption: Array<{ month_start: string; consumed: number }>;
  wastage: Array<{ name: string; wasted: number }>;
  low_stock: Array<{ name: string; quantity: number; unit: string; reorder_level: number }>;
  inventory_value: number;
  most_consumed: Array<{ name: string; total_used: number }>;
  least_used: Array<{ name: string; total_used: number }>;
  food_cost_percent: number;
  inventory_turnover: number;
};

export async function fetchInventoryOverview() {
  const res = await api.get("/api/partner/inventory/overview");
  return res.data.data;
}

export async function fetchInventoryItems() {
  const res = await api.get("/api/partner/inventory/items");
  return res.data.data as InventoryItem[];
}

export async function createInventoryItem(body: Record<string, unknown>) {
  const res = await api.post("/api/partner/inventory/items", body);
  return res.data.data as InventoryItem;
}

export async function updateInventoryItem(id: string, body: Record<string, unknown>) {
  const res = await api.put(`/api/partner/inventory/items/${id}`, body);
  return res.data.data as InventoryItem;
}

export async function deleteInventoryItem(id: string) {
  await api.delete(`/api/partner/inventory/items/${id}`);
}

export async function fetchInventoryAlerts() {
  const res = await api.get("/api/partner/inventory/alerts");
  return res.data.data as InventoryAlert[];
}

export async function fetchInventoryCategories() {
  const res = await api.get("/api/partner/inventory/categories");
  return res.data.data as Array<{ id: string; name: string }>;
}

export async function createInventoryCategory(name: string) {
  const res = await api.post("/api/partner/inventory/categories", { name });
  return res.data.data;
}

export async function fetchSuppliers() {
  const res = await api.get("/api/partner/inventory/suppliers");
  return res.data.data as Supplier[];
}

export async function createSupplier(body: Record<string, unknown>) {
  const res = await api.post("/api/partner/inventory/suppliers", body);
  return res.data.data as Supplier;
}

export async function updateSupplier(id: string, body: Record<string, unknown>) {
  const res = await api.put(`/api/partner/inventory/suppliers/${id}`, body);
  return res.data.data as Supplier;
}

export async function deleteSupplier(id: string) {
  await api.delete(`/api/partner/inventory/suppliers/${id}`);
}

export async function fetchRecipes() {
  const res = await api.get("/api/partner/inventory/recipes");
  return res.data.data as RecipeRow[];
}

export async function updateRecipe(menuItemId: string, ingredients: Array<Record<string, unknown>>) {
  const res = await api.put(`/api/partner/inventory/recipes/${menuItemId}`, { ingredients });
  return res.data.data;
}

export async function fetchPurchases() {
  const res = await api.get("/api/partner/inventory/purchases");
  return res.data.data as PurchaseOrder[];
}

export async function createPurchase(body: Record<string, unknown>) {
  const res = await api.post("/api/partner/inventory/purchases", body);
  return res.data.data as PurchaseOrder;
}

export async function receivePurchase(id: string) {
  const res = await api.post(`/api/partner/inventory/purchases/${id}/receive`);
  return res.data.data as PurchaseOrder;
}

export async function fetchKitchenDashboard() {
  const res = await api.get("/api/partner/inventory/kitchen");
  return res.data.data as {
    orders: KitchenOrder[];
    stats: {
      new_orders: number;
      preparing: number;
      ready: number;
      completed_today: number;
      avg_prep_minutes: number;
    };
  };
}

export async function fetchInventoryReports() {
  const res = await api.get("/api/partner/inventory/reports");
  return res.data.data as InventoryReports;
}

export async function recordWastage(body: { inventory_item_id: string; quantity: number; notes?: string }) {
  const res = await api.post("/api/partner/inventory/wastage", body);
  return res.data.data;
}

export const INVENTORY_UNITS = ["kg", "g", "litre", "ml", "pieces", "bottles", "packets", "boxes"];
