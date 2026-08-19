import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create a Restaurant Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@foodiq.com' },
    update: {},
    create: {
      email: 'owner@foodiq.com',
      name: 'John Owner',
      role: Role.RESTAURANT_OWNER,
    },
  });

  // 2. Create a Restaurant
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Spice Symphony',
      description: 'Authentic Indian flavors delivered to your door.',
      ownerId: owner.id,
      menuItems: {
        create: [
          {
            name: 'Chicken Tikka Masala',
            description: 'Roasted marinated chicken chunks in spiced curry sauce.',
            price: 15.99,
          },
          {
            name: 'Garlic Naan',
            description: 'Soft and pillowy Indian bread with garlic and butter.',
            price: 3.99,
          },
          {
            name: 'Palak Paneer',
            description: 'Cottage cheese cubes in a thick paste made from puréed spinach.',
            price: 13.99,
          },
        ],
      },
    },
  });

  console.log(`Created restaurant: ${restaurant.name}`);
  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
