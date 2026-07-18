export interface DishCustomization {
  id: string;
  name: string;
  price: number;
}

export interface DishState {
  image: string | null;
  name: string;
  shortDesc: string;
  longDesc: string;
  category: string;
  subCategory: string;
  cuisine: string;
  foodType: "Veg" | "Non-Veg" | "Egg" | "";
  regularPrice: number;
  discountPrice: number;
  costPrice: number;
  tax: number;
  servingSize: string;
  weight: string;
  prepTime: string;
  calories: string;
  spiceLevel: number; // 1 to 4
  customizations: DishCustomization[];
  badges: {
    bestseller: boolean;
    trending: boolean;
    chefsSpecial: boolean;
    healthyChoice: boolean;
    newArrival: boolean;
  };
  availability: "Available" | "Out of Stock" | "Hidden";
}

export const initialDishState: DishState = {
  image: null,
  name: "",
  shortDesc: "",
  longDesc: "",
  category: "",
  subCategory: "",
  cuisine: "",
  foodType: "",
  regularPrice: 0,
  discountPrice: 0,
  costPrice: 0,
  tax: 0,
  servingSize: "",
  weight: "",
  prepTime: "",
  calories: "",
  spiceLevel: 1,
  customizations: [],
  badges: {
    bestseller: false,
    trending: false,
    chefsSpecial: false,
    healthyChoice: false,
    newArrival: false,
  },
  availability: "Available",
};
