import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.notificationLog.deleteMany();

  // Seed notifications that correspond to the seeded orders
  const notifications = [
    { recipient: 'customer@example.com', message: 'Order created for item SKU-001 (Quantity: 2)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-002 (Quantity: 1)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-003 (Quantity: 5)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-004 (Quantity: 1)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-005 (Quantity: 3)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-001 (Quantity: 1)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-006 (Quantity: 2)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-007 (Quantity: 1)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-008 (Quantity: 4)',  channel: 'EMAIL', status: 'SENT' },
    { recipient: 'customer@example.com', message: 'Order created for item SKU-003 (Quantity: 10)', channel: 'EMAIL', status: 'SENT' },
  ];

  for (const notif of notifications) {
    await prisma.notificationLog.create({ data: notif });
  }

  console.log(`✅ Seeded ${notifications.length} notification logs`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
