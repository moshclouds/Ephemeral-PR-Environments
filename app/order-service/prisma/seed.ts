import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.order.deleteMany();

  // Seed orders that reference real inventory SKUs
  const orders = await prisma.order.createMany({
    data: [
      { itemId: 'SKU-001', quantity: 2,  status: 'DELIVERED' },
      { itemId: 'SKU-002', quantity: 1,  status: 'SHIPPED' },
      { itemId: 'SKU-003', quantity: 5,  status: 'PENDING' },
      { itemId: 'SKU-004', quantity: 1,  status: 'DELIVERED' },
      { itemId: 'SKU-005', quantity: 3,  status: 'SHIPPED' },
      { itemId: 'SKU-001', quantity: 1,  status: 'PENDING' },
      { itemId: 'SKU-006', quantity: 2,  status: 'DELIVERED' },
      { itemId: 'SKU-007', quantity: 1,  status: 'CANCELLED' },
      { itemId: 'SKU-008', quantity: 4,  status: 'PENDING' },
      { itemId: 'SKU-003', quantity: 10, status: 'SHIPPED' },
    ],
  });

  console.log(`✅ Seeded ${orders.count} orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
