import api from "@/services/api";
import { mapRestaurantCard } from "@/lib/images";

export type RestaurantPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchRestaurantsPage(
  page: number,
  limit: number,
  queryString = ""
) {
  const separator = queryString ? "&" : "";
  const res = await api.get(
    `/api/restaurants?${queryString}${separator}page=${page}&limit=${limit}`
  );
  const restaurants = (res.data.data || []).map(mapRestaurantCard);
  const pagination: RestaurantPagination = res.data.pagination || {
    total: restaurants.length,
    page,
    limit,
    totalPages: 1,
  };
  return { restaurants, pagination };
}
