export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  availableQuantity: number;
}

export interface Order {
  id: string;
  itemId: string;
  quantity: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  recipient: string;
  message: string;
  channel: string;
  status: string;
}

export type ModalType = 'orders' | 'notifications' | null;
