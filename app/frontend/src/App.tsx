import { useState } from 'react';
import { ShoppingBag, PackageSearch, BellRing } from 'lucide-react';
import { useAppData } from './hooks/useAppData';
import SkeletonCard from './components/SkeletonCard';
import InventoryCard from './components/InventoryCard';
import Modal from './components/Modal';
import type { ModalType } from './types';
import './App.css';

export default function App() {
  const { inventory, orders, notifications, isLoading, loadingSku, handleBuy } = useAppData();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

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
            onClick={() => setActiveModal('orders')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveModal('notifications')}
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
        {isLoading ? (
          <>{Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}</>
        ) : (
          <>
            {inventory.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                loadingSku={loadingSku}
                onBuy={handleBuy}
              />
            ))}
            {inventory.length === 0 && <p className="text-gray-500 col-span-full">No inventory found.</p>}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        activeModal={activeModal}
        orders={orders}
        notifications={notifications}
        onClose={() => setActiveModal(null)}
      />
    </div>
  );
}
