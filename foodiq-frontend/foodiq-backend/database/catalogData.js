const slugify = (value) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const cuisines = [
  ['chinese', 'Chinese', 'Wok-tossed noodles, dumplings and bold Indo-Chinese flavours'],
  ['indian', 'Indian', 'Classic Indian curries, breads and tandoor favourites'],
  ['north-indian', 'North Indian', 'Rich Punjabi curries, kebabs and fresh breads'],
  ['south-indian', 'South Indian', 'Crisp dosas, fluffy idlis and comforting rice dishes'],
  ['italian', 'Italian', 'Handcrafted pasta, risotto and rustic Italian classics'],
  ['pizza', 'Pizza', 'Stone-baked pizzas with fresh toppings and bubbling cheese'],
  ['burger', 'Burger', 'Juicy burgers, crisp patties and loaded stacks'],
  ['healthy', 'Healthy', 'Balanced salads, protein bowls and nourishing meals'],
  ['street-food', 'Street Food', 'India’s most-loved chaats, rolls and roadside favourites'],
  ['seafood', 'Seafood', 'Fresh fish, prawns and coastal specialities'],
  ['bakery', 'Bakery', 'Fresh breads, pastries and oven-baked treats'],
  ['desserts', 'Desserts', 'Cakes, ice creams and indulgent sweets'],
  ['fast-food', 'Fast Food', 'Quick, craveable burgers, wraps, fries and snacks'],
  ['beverages', 'Beverages', 'Coffee, shakes, juices and refreshing coolers'],
  ['biryani', 'Biryani', 'Aromatic dum biryanis layered with herbs and spices'],
  ['mexican', 'Mexican', 'Tacos, burritos and vibrant Mexican comfort food'],
].map(([slug, name, description], index) => ({
  slug,
  name,
  description,
  sortOrder: index + 1,
  image: `/images/catalog/cuisines/${slug}.webp`,
}));

const dishNames = {
  chinese: [
    'Hakka Noodles', 'Schezwan Noodles', 'Veg Fried Rice', 'Chicken Fried Rice',
    'Veg Momos', 'Chicken Momos', 'Spring Rolls', 'Veg Manchurian',
    'Chilli Chicken', 'Hot and Sour Soup', 'Dim Sum', 'Chow Mein',
    'Honey Chilli Potato', 'Kung Pao Chicken', 'Chilli Paneer',
  ],
  indian: [
    'Butter Chicken', 'Paneer Butter Masala', 'Dal Makhani', 'Garlic Naan',
    'Tandoori Chicken', 'Chole Bhature', 'Chicken Tikka Masala', 'Shahi Paneer',
    'Jeera Rice', 'Malai Kofta', 'Rajma Chawal', 'Aloo Paratha',
    'Mixed Veg Curry', 'Chicken Korma', 'Gulab Jamun',
  ],
  'north-indian': [
    'Butter Naan', 'North Indian Butter Chicken', 'Kadhai Paneer', 'Palak Paneer',
    'Dal Tadka', 'Amritsari Kulcha', 'Chicken Seekh Kebab', 'Paneer Tikka',
    'Chana Masala', 'Lachha Paratha', 'Paneer Paratha', 'Tandoori Roti',
    'Punjabi Kadhi', 'Aloo Gobi', 'Sweet Lassi',
  ],
  'south-indian': [
    'Masala Dosa', 'Plain Dosa', 'Idli Sambar', 'Medu Vada', 'Onion Uttapam',
    'Ven Pongal', 'Mysore Masala Dosa', 'Rava Dosa', 'Podi Idli',
    'Appam with Stew', 'Lemon Rice', 'Curd Rice', 'Bisi Bele Bath',
    'Neer Dosa', 'Filter Coffee',
  ],
  italian: [
    'Italian Margherita Pizza', 'Alfredo Pasta', 'White Sauce Pasta', 'Vegetable Lasagna',
    'Garlic Bread', 'Mushroom Risotto', 'Penne Arrabbiata', 'Spaghetti Aglio Olio',
    'Pesto Pasta', 'Bruschetta', 'Four Cheese Ravioli', 'Chicken Parmigiana',
    'Minestrone Soup', 'Tiramisu', 'Caprese Salad',
  ],
  pizza: [
    'Classic Margherita', 'Farmhouse Pizza', 'Veggie Supreme Pizza', 'Pepperoni Pizza',
    'Cheese Burst Pizza', 'Paneer Tikka Pizza', 'BBQ Chicken Pizza', 'Four Cheese Pizza',
    'Mexican Green Wave Pizza', 'Mushroom Truffle Pizza', 'Hawaiian Pizza',
    'Chicken Sausage Pizza', 'Corn and Cheese Pizza', 'Tandoori Pizza', 'Spicy Peri Peri Pizza',
  ],
  burger: [
    'Chicken Burger', 'Veg Burger', 'Cheese Burger', 'Double Patty Burger',
    'Crispy Chicken Burger', 'Paneer Burger', 'Smash Burger', 'BBQ Chicken Burger',
    'Mushroom Swiss Burger', 'Peri Peri Burger', 'Aloo Tikki Burger',
    'Grilled Chicken Burger', 'Spicy Bean Burger', 'Bacon Cheese Burger', 'Mini Slider Trio',
  ],
  healthy: [
    'Green Salad', 'Seasonal Fruit Bowl', 'Protein Power Bowl', 'Smoothie Bowl',
    'Avocado Toast', 'Grilled Chicken Salad', 'Quinoa Buddha Bowl', 'Greek Salad',
    'Grilled Paneer Bowl', 'Oats and Berry Bowl', 'Hummus Veggie Bowl',
    'Chicken Caesar Salad', 'Sprouts Chaat', 'Tofu Stir Fry', 'Detox Green Bowl',
  ],
  'street-food': [
    'Pani Puri', 'Pav Bhaji', 'Vada Pav', 'Punjabi Samosa', 'Papdi Chaat',
    'Chicken Kathi Roll', 'Bhel Puri', 'Dahi Puri', 'Aloo Tikki Chaat',
    'Paneer Kathi Roll', 'Dabeli', 'Kachori', 'Chole Kulche',
    'Bombay Sandwich', 'Masala Corn',
  ],
  seafood: [
    'Fish Fry', 'Prawns Curry', 'Grilled Fish', 'Garlic Butter Prawns', 'Fish Biryani',
    'Tandoori Pomfret', 'Crab Masala', 'Fish Tikka', 'Prawn Ghee Roast',
    'Malabar Fish Curry', 'Calamari Rings', 'Lemon Herb Salmon',
    'Goan Prawn Curry', 'Crispy Fish Fingers', 'Seafood Platter',
  ],
  bakery: [
    'Sourdough Bread', 'Butter Croissant', 'Blueberry Muffin', 'Chocolate Cupcake',
    'Choco Chip Cookies', 'Veg Puff', 'Garlic Loaf', 'Cinnamon Roll',
    'Chocolate Danish', 'Chicken Puff', 'Banana Bread', 'Almond Croissant',
    'Focaccia', 'Red Velvet Cupcake', 'Cheese Straw',
  ],
  desserts: [
    'Chocolate Cake', 'Glazed Donuts', 'Fudge Brownie', 'Vanilla Ice Cream',
    'New York Cheesecake', 'Assorted Pastries', 'Gulab Jamun', 'Rasmalai',
    'Tiramisu Cup', 'Chocolate Mousse', 'Belgian Waffle', 'Caramel Custard',
    'Red Velvet Cake', 'Mango Pudding', 'Hot Chocolate Sundae',
  ],
  'fast-food': [
    'Classic Burger', 'Peri Peri Fries', 'Personal Pizza', 'Loaded Hot Dog',
    'Club Sandwich', 'Chicken Wrap', 'Chicken Nuggets', 'Cheese Fries',
    'Paneer Wrap', 'Onion Rings', 'Grilled Sandwich', 'Fried Chicken Bucket',
    'Nacho Cheese Bites', 'Veggie Sub', 'Mozzarella Sticks',
  ],
  beverages: [
    'Coca Cola', 'Pepsi', 'Sprite', 'Fanta', 'Cold Coffee',
    'Classic Cappuccino', 'Cafe Latte', 'Mango Shake', 'Oreo Shake',
    'Chocolate Milkshake', 'Espresso Coffee', 'Masala Tea', 'Fresh Orange Juice',
    'Virgin Mojito', 'Salted Caramel Frappe',
  ],
  biryani: [
    'Chicken Biryani', 'Mutton Biryani', 'Veg Biryani', 'Hyderabadi Biryani',
    'Egg Biryani', 'Chicken Dum Biryani', 'Lucknowi Biryani', 'Kolkata Biryani',
    'Paneer Biryani', 'Prawn Biryani', 'Boneless Chicken Biryani',
    'Keema Biryani', 'Mushroom Biryani', 'Fish Biryani Pot', 'Family Biryani Feast',
  ],
  mexican: [
    'Veg Taco', 'Chicken Burrito', 'Loaded Nachos', 'Cheese Quesadilla',
    'Chicken Enchiladas', 'Burrito Bowl', 'Fish Tacos', 'Bean and Rice Burrito',
    'Mexican Rice Bowl', 'Chicken Quesadilla', 'Guacamole Nachos',
    'Corn Tostada', 'Fajita Bowl', 'Churros', 'Tres Leches Cake',
  ],
};

const dishes = Object.fromEntries(
  Object.entries(dishNames).map(([cuisineSlug, names]) => [
    cuisineSlug,
    names.map((name) => {
      const image = `/images/catalog/dishes/${cuisineSlug}/${slugify(name)}.webp`;
      return {
        name,
        image,
        gallery: [image],
      };
    }),
  ])
);

const restaurantNames = [
  'Wok Republic', 'Curry & Co.', 'Punjab Junction', 'Dosa District',
  'Casa Italiano', 'Stone Oven Pizza', 'The Burger Foundry', 'Green Bowl Kitchen',
  'Chaat Bazaar', 'Coastal Catch', 'The Daily Bakehouse', 'Sweet Theory',
  'Quick Bite Company', 'Brew & Blend', 'Royal Dum Biryani', 'Casa Mexicana',
  'Spice Route', 'Urban Tandoor', 'Napoli Kitchen', 'Bombay Street Kitchen',
  'Harbour Grill', 'Morning Crumbs', 'The Dessert Room', 'Fresh Fuel Cafe',
  'Foodiq Express',
];

const restaurantCuisineSlugs = [
  'chinese', 'indian', 'north-indian', 'south-indian', 'italian', 'pizza',
  'burger', 'healthy', 'street-food', 'seafood', 'bakery', 'desserts',
  'fast-food', 'beverages', 'biryani', 'mexican', 'indian', 'north-indian',
  'italian', 'street-food', 'seafood', 'bakery', 'desserts', 'healthy', 'fast-food',
];

const RESTAURANT_COVER_BY_CUISINE = {
  chinese: '/images/catalog/restaurants/rest-chinese.jpg',
  indian: '/images/catalog/restaurants/rest-north-indian.jpg',
  'north-indian': '/images/catalog/restaurants/rest-north-indian.jpg',
  'south-indian': '/images/catalog/restaurants/rest-south-indian.jpg',
  italian: '/images/catalog/restaurants/rest-pasta.jpg',
  pizza: '/images/catalog/restaurants/rest-pizza.jpg',
  burger: '/images/catalog/restaurants/rest-burger.jpg',
  healthy: '/images/catalog/restaurants/rest-healthy.jpg',
  'street-food': '/images/catalog/restaurants/rest-street-food.jpg',
  seafood: '/images/catalog/restaurants/rest-seafood.jpg',
  bakery: '/images/catalog/restaurants/rest-bakery.jpg',
  desserts: '/images/catalog/restaurants/rest-desserts.jpg',
  'fast-food': '/images/catalog/restaurants/rest-fast-food.jpg',
  beverages: '/images/catalog/restaurants/rest-coffee.jpg',
  biryani: '/images/catalog/restaurants/rest-biryani.jpg',
  mexican: '/images/catalog/restaurants/rest-shawarma.jpg',
};

const RESTAURANT_COVER_IMAGES = Object.values(RESTAURANT_COVER_BY_CUISINE);

const RESTAURANT_LOGO_IMAGES = [
  '/images/catalog/dishes/chinese/hakka-noodles.webp',
  '/images/catalog/dishes/indian/butter-chicken.webp',
  '/images/catalog/dishes/south-indian/masala-dosa.webp',
  '/images/catalog/dishes/italian/alfredo-pasta.webp',
  '/images/catalog/dishes/pizza/classic-margherita.webp',
  '/images/catalog/dishes/burger/cheese-burger.webp',
  '/images/catalog/dishes/healthy/greek-salad.webp',
  '/images/catalog/dishes/street-food/pani-puri.webp',
  '/images/catalog/dishes/seafood/garlic-butter-prawns.webp',
  '/images/catalog/dishes/bakery/butter-croissant.webp',
  '/images/catalog/dishes/desserts/chocolate-cake.webp',
  '/images/catalog/dishes/fast-food/classic-burger.webp',
  '/images/catalog/dishes/beverages/coca-cola.webp',
  '/images/catalog/dishes/biryani/hyderabadi-biryani.webp',
  '/images/catalog/dishes/dish-sh-1.jpg',
  '/images/catalog/dishes/north-indian/tandoori-chicken.webp',
  '/images/catalog/dishes/dish-th-1.jpg',
  '/images/catalog/dishes/dish-bb-1.jpg',
  '/images/catalog/dishes/fast-food/club-sandwich.webp',
  '/images/catalog/dishes/chinese/chicken-momos.webp',
  '/images/catalog/dishes/dish-sn-1.jpg',
  '/images/catalog/dishes/beverages/classic-cappuccino.webp',
  '/images/catalog/dishes/desserts/butterscotch-ice-cream.webp',
  '/images/catalog/dishes/healthy/chicken-caesar-salad.webp',
  '/images/catalog/dishes/beverages/fresh-orange-juice.webp',
];

const restaurants = restaurantNames.map((name, index) => {
  const cuisineSlug = restaurantCuisineSlugs[index];
  const slug = slugify(name);
  const coverImage =
    RESTAURANT_COVER_BY_CUISINE[cuisineSlug] ||
    RESTAURANT_COVER_IMAGES[index % RESTAURANT_COVER_IMAGES.length];
  const logoImage = RESTAURANT_LOGO_IMAGES[index % RESTAURANT_LOGO_IMAGES.length];
  return {
    slug,
    name,
    cuisineSlug,
    description: `${cuisines.find((c) => c.slug === cuisineSlug).name} favourites prepared fresh for every order.`,
    address: `${10 + index}, Foodiq Avenue, Hyderabad`,
    phone: `04040${String(10000 + index).slice(-5)}`,
    rating: Number((4.1 + (index % 8) / 10).toFixed(1)),
    deliveryTime: 22 + (index % 5) * 4,
    distanceKm: Number((1.2 + (index % 7) * 0.55).toFixed(1)),
    offerText: index % 3 === 0 ? '50% OFF up to ₹100' : index % 3 === 1 ? 'Free delivery' : '20% OFF above ₹299',
    image: coverImage,
    logo: logoImage,
    banner: coverImage,
  };
});

const vegetarianKeywords = [
  'veg', 'paneer', 'dal', 'naan', 'rice', 'salad', 'bowl', 'toast', 'dosa',
  'idli', 'vada', 'uttapam', 'pongal', 'pasta', 'pizza', 'bread', 'risotto',
  'bruschetta', 'ravioli', 'soup', 'tiramisu', 'burger', 'puri', 'bhaji',
  'samosa', 'chaat', 'corn', 'croissant', 'muffin', 'cupcake', 'cookies',
  'cake', 'donut', 'brownie', 'ice cream', 'cheesecake', 'pastr', 'gulab',
  'rasmalai', 'waffle', 'custard', 'coffee', 'tea', 'shake', 'mojito', 'juice',
  'smoothie', 'fries', 'sandwich', 'wrap', 'nachos', 'quesadilla', 'taco',
  'churros', 'bean', 'guacamole', 'focaccia', 'cinnamon', 'danish', 'cheese',
];

function isVegetarian(name) {
  const lower = name.toLowerCase();
  const explicitlyNonVeg = ['chicken', 'mutton', 'prawn', 'fish', 'crab', 'calamari', 'salmon', 'bacon', 'pepperoni', 'sausage', 'egg', 'keema'];
  if (explicitlyNonVeg.some((word) => lower.includes(word))) return false;
  return vegetarianKeywords.some((word) => lower.includes(word));
}

module.exports = { cuisines, dishes, restaurants, isVegetarian };
