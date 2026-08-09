import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.inventoryItem.deleteMany();

  // Seed inventory items
  const items = await prisma.inventoryItem.createMany({
    data: [
      { sku: 'SKU-001', name: 'Wireless Mouse',       availableQuantity: 5000 },
      { sku: 'SKU-002', name: 'Mechanical Keyboard',   availableQuantity: 5500 },
      { sku: 'SKU-003', name: 'USB-C Hub',             availableQuantity: 7000 },
      { sku: 'SKU-004', name: '27" 4K Monitor',        availableQuantity: 5200 },
      { sku: 'SKU-005', name: 'Laptop Stand',          availableQuantity: 6000 },
      { sku: 'SKU-006', name: 'Webcam HD 1080p',       availableQuantity: 5800 },
      { sku: 'SKU-007', name: 'Noise Cancelling Headphones', availableQuantity: 5100 },
      { sku: 'SKU-008', name: 'Wireless Charger',      availableQuantity: 6500 },
      { sku: 'SKU-009', name: 'Ergonomic Chair',       availableQuantity: 5300 },
      { sku: 'SKU-010', name: 'Desk Lamp LED',         availableQuantity: 7500 },
    ],
  });

  console.log(`✅ Seeded ${items.count} inventory items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
