import { ShoppingBag, BellRing, X } from 'lucide-react';
import type { Order, Notification, ModalType } from '../types';

interface ModalProps {
  activeModal: ModalType;
  orders: Order[];
  notifications: Notification[];
  onClose: () => void;
}

export default function Modal({ activeModal, orders, notifications, onClose }: ModalProps) {
  if (!activeModal) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
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
            onClick={onClose}
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
  );
}
