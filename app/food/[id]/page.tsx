import FoodDetailView from "@/components/food/FoodDetailView";

export default async function FoodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FoodDetailView id={id} />;
}
