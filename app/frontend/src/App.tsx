import { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingBag, PackageSearch, BellRing, Loader2 } from 'lucide-react'
import './App.css'

// 1. Configure Axios Interceptor for HTTP Header Propagation
const api = axios.create()

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      // Look for any query params ending with _pr (e.g., ?inventory_pr=42)
      if (key.endsWith('_pr')) {
        const serviceName = key.replace('_pr', '');
        // Convert to X-Service-PR
        const headerName = `X-${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}-PR`;
        config.headers[headerName] = value;
      }
    });
  }
  return config;
});

// Extract Base URLs
const ORDER_URL = import.meta.env.VITE_API_ORDER_URL || 'http://localhost:3000'
const INVENTORY_URL = import.meta.env.VITE_API_INVENTORY_URL || 'http://localhost:3001'
const NOTIFICATION_URL = import.meta.env.VITE_API_NOTIFICATION_URL || 'http://localhost:3002'

export default function App() {
  const [inventory, setInventory] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingSku, setLoadingSku] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [invRes, ordRes, notRes] = await Promise.all([
        api.get(`${INVENTORY_URL}/inventory`),
        api.get(`${ORDER_URL}/orders`),
        api.get(`${NOTIFICATION_URL}/notifications`)
      ])
      setInventory(invRes.data)
      setOrders(ordRes.data)
      setNotifications(notRes.data)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleBuy = async (sku: string) => {
    setLoadingSku(sku)
    try {
      await api.post(`${ORDER_URL}/orders`, {
        itemId: sku,
        quantity: 1
      })
      // Refresh all data to see the updated inventory, new order, and new notification!
      await fetchData()
    } catch (error) {
      alert("Purchase failed! " + (error as any).message)
    }
    setLoadingSku(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
          Ephemeral POS System
        </h1>
        <p className="text-gray-400 mt-2">Test Dynamic Inter-Service Routing</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Inventory Column */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <PackageSearch className="text-blue-400 w-6 h-6" />
            <h2 className="text-2xl font-bold">Inventory</h2>
          </div>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div key={item.id} className="bg-gray-700/50 p-4 rounded-lg flex justify-between items-center transition-all hover:bg-gray-700">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-gray-400">Stock: <span className="text-blue-300">{item.availableQuantity}</span> | SKU: {item.sku}</p>
                </div>
                <button
                  onClick={() => handleBuy(item.sku)}
                  disabled={loadingSku === item.sku || item.availableQuantity === 0}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  {loadingSku === item.sku ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                </button>
              </div>
            ))}
            {inventory.length === 0 && <p className="text-gray-500">No inventory found.</p>}
          </div>
        </div>

        {/* Orders Column */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <ShoppingBag className="text-emerald-400 w-6 h-6" />
            <h2 className="text-2xl font-bold">Recent Orders</h2>
          </div>
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2">
            {orders.slice().reverse().map((order) => (
              <div key={order.id} className="bg-gray-700/50 p-4 rounded-lg border-l-4 border-emerald-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{order.itemId}</h3>
                    <p className="text-xs text-gray-400">ID: {order.id.slice(0, 8)}...</p>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-full">
                    Qty: {order.quantity}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {orders.length === 0 && <p className="text-gray-500">No orders found.</p>}
          </div>
        </div>

        {/* Notifications Column */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <BellRing className="text-purple-400 w-6 h-6" />
            <h2 className="text-2xl font-bold">Notifications Log</h2>
          </div>
          <div className="space-y-4 h-[600px] overflow-y-auto pr-2">
            {notifications.slice().reverse().map((notif) => (
              <div key={notif.id} className="bg-gray-700/50 p-4 rounded-lg border-l-4 border-purple-500">
                <h3 className="font-medium text-sm text-purple-300 mb-1">To: {notif.recipient}</h3>
                <p className="text-sm">{notif.message}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400">{notif.channel}</span>
                  <span className="text-xs bg-gray-600 px-2 py-1 rounded-md">{notif.status}</span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-gray-500">No notifications found.</p>}
          </div>
        </div>

      </div>
    </div>
  )
}
