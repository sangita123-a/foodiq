import api from "@/services/api";

export type TestimonialItem = {
  id: string;
  name: string;
  city: string;
  image: string | null;
  rating: number;
  review: string;
  restaurant: string;
  dish: string;
  date: string;
  order_id?: string | null;
  helpful_count?: number;
  has_voted?: boolean;
  images?: string[];
  order_date?: string;
};

function unwrap<T>(res: { data?: { data?: T; success?: boolean } }): T {
  return res.data?.data as T;
}

export async function fetchTestimonials(params?: {
  search?: string;
  restaurant?: string;
  rating?: number | "";
  sort?: "latest" | "oldest" | "rating";
  featured?: boolean;
}) {
  const res = await api.get("/api/testimonials", { params });
  return unwrap<TestimonialItem[]>(res) || [];
}

export async function fetchFeaturedTestimonials() {
  const res = await api.get("/api/testimonials/featured");
  return unwrap<TestimonialItem[]>(res) || [];
}

export async function createTestimonial(payload: {
  order_id: string;
  restaurant_id?: string;
  rating: number;
  review: string;
  city?: string;
  image_urls?: string[];
  dish?: string;
  restaurant?: string;
}) {
  const res = await api.post("/api/testimonials", payload);
  return unwrap<TestimonialItem>(res);
}

export async function markTestimonialHelpful(id: string) {
  const res = await api.patch(`/api/testimonials/${id}/helpful`);
  return unwrap<{ helpful_count: number; has_voted: boolean }>(res);
}

export async function reportTestimonial(id: string, reason: string) {
  const res = await api.post(`/api/testimonials/${id}/report`, { reason });
  return unwrap(res);
}
