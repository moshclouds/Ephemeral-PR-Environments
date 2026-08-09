import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import { ORDER_URL, INVENTORY_URL, NOTIFICATION_URL } from '../lib/urls';
import type { InventoryItem, Order, Notification } from '../types';

export function useAppData() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSku, setLoadingSku] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const [invRes, ordRes, notRes] = await Promise.all([
        api.get(`${INVENTORY_URL}/inventory`),
        api.get(`${ORDER_URL}/orders`),
        api.get(`${NOTIFICATION_URL}/notifications`),
      ]);
      setInventory(invRes.data);
      setOrders(ordRes.data);
      setNotifications(notRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const handleBuy = async (sku: string) => {
    setLoadingSku(sku);
    try {
      await api.post(`${ORDER_URL}/orders`, {
        itemId: sku,
        quantity: 1,
      });
      await fetchData();
    } catch (error) {
      alert('Purchase failed! ' + (error as Error).message);
    }
    setLoadingSku(null);
  };

  return {
    inventory,
    orders,
    notifications,
    isLoading,
    loadingSku,
    handleBuy,
  };
}
