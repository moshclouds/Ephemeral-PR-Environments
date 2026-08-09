import { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingBag, PackageSearch, BellRing, Loader2, X } from 'lucide-react'
import './App.css'

// Axios Interceptor for HTTP Header Propagation
const api = axios.create()

const cloudRunSuffix = import.meta.env.VITE_CLOUD_RUN_SUFFIX;

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      if (key.endsWith('_pr')) {
        const serviceName = key.replace('_pr', '');
        const headerName = `X-${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}-PR`;
        config.headers[headerName] = value;
      }
    });
  }
  return config;
});

const getBaseUrl = (servicePrefix: string, envVar: string | undefined, defaultLocalUrl: string, prQueryKey: string) => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const prNumber = urlParams.get(prQueryKey);
    // If a PR is specified and we have the suffix, route directly to Cloud Run
    if (prNumber && cloudRunSuffix) {
      return `https://${servicePrefix}-pr-${prNumber}${cloudRunSuffix}`;
    }
  }
  return envVar || defaultLocalUrl;
};

const ORDER_URL = getBaseUrl('order-service', import.meta.env.VITE_API_ORDER_URL, 'http://localhost:3000', 'order_pr')
const INVENTORY_URL = getBaseUrl('inventory-service', import.meta.env.VITE_API_INVENTORY_URL, 'http://localhost:3001', 'inventory_pr')
const NOTIFICATION_URL = getBaseUrl('notification-service', import.meta.env.VITE_API_NOTIFICATION_URL, 'http://localhost:3002', 'notification_pr')

type ModalType = 'orders' | 'notifications' | null;

export default function App() {
  const [inventory, setInventory] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingSku, setLoadingSku] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

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
      await fetchData()
    } catch (error) {
      alert("Purchase failed! " + (error as any).message)
    }
    setLoadingSku(null)
  }

  const openModal = (type: ModalType) => {
    setActiveModal(type)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">

      {/* Header */}
      <header className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Ephemeral PRs POC
          </h1>
          <p className="text-gray-400 mt-2">Test Dynamic Inter-Service Routing</p>
        </div>
        <div className="flex gap-3 mt-1">
          <button
            onClick={() => openModal('orders')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => openModal('notifications')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <BellRing className="w-4 h-4" />
            Notifications ({notifications.length})
          </button>
        </div>
      </header>

      {/* Inventory Grid */}
      <div className="mb-6 flex items-center gap-3">
        <PackageSearch className="text-blue-400 w-6 h-6" />
        <h2 className="text-2xl font-bold">Inventory</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all"
          >
            <div>
              <h3 className="font-bold text-lg mb-1">{item.name}</h3>
              <p className="text-sm text-gray-400">SKU: <span className="text-blue-300">{item.sku}</span></p>
              <p className="text-sm text-gray-400 mt-1">
                Stock: <span className={`font-semibold ${item.availableQuantity < 20 ? 'text-red-400' : 'text-emerald-400'}`}>{item.availableQuantity}</span>
              </p>
            </div>
            <button
              onClick={() => handleBuy(item.sku)}
              disabled={loadingSku === item.sku || item.availableQuantity === 0}
              className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loadingSku === item.sku ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
            </button>
          </div>
        ))}
        {inventory.length === 0 && <p className="text-gray-500 col-span-full">No inventory found.</p>}
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                {activeModal === 'orders' ? (
                  <ShoppingBag className="text-emerald-400 w-6 h-6" />
                ) : (
                  <BellRing className="text-purple-400 w-6 h-6" />
                )}
                <h2 className="text-xl font-bold">
                  {activeModal === 'orders' ? 'Recent Orders' : 'Notifications Log'}
                </h2>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[65vh] space-y-3">
              {activeModal === 'orders' && (
                <>
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
                </>
              )}

              {activeModal === 'notifications' && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
