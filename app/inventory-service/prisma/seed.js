"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    await prisma.inventoryItem.deleteMany();
    const items = await prisma.inventoryItem.createMany({
        data: [
            { sku: 'SKU-001', name: 'Wireless Mouse', availableQuantity: 50 },
            { sku: 'SKU-002', name: 'Mechanical Keyboard', availableQuantity: 30 },
            { sku: 'SKU-003', name: 'USB-C Hub', availableQuantity: 100 },
            { sku: 'SKU-004', name: '27" 4K Monitor', availableQuantity: 15 },
            { sku: 'SKU-005', name: 'Laptop Stand', availableQuantity: 75 },
            { sku: 'SKU-006', name: 'Webcam HD 1080p', availableQuantity: 40 },
            { sku: 'SKU-007', name: 'Noise Cancelling Headphones', availableQuantity: 25 },
            { sku: 'SKU-008', name: 'Wireless Charger', availableQuantity: 60 },
            { sku: 'SKU-009', name: 'Ergonomic Chair', availableQuantity: 10 },
            { sku: 'SKU-010', name: 'Desk Lamp LED', availableQuantity: 90 },
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
//# sourceMappingURL=seed.js.map