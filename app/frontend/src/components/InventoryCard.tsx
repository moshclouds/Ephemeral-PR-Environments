import { Loader2 } from 'lucide-react';
import type { InventoryItem } from '../types';

interface InventoryCardProps {
  item: InventoryItem;
  loadingSku: string | null;
  onBuy: (sku: string) => void;
}

export default function InventoryCard({ item, loadingSku, onBuy }: InventoryCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between hover:border-blue-500/50 transition-all">
      <div>
        <h3 className="font-bold text-lg mb-1">{item.name}</h3>
        <p className="text-sm text-gray-400">
          SKU: <span className="text-blue-300">{item.sku}</span>
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Stock:{' '}
          <span className={`font-semibold ${item.availableQuantity < 20 ? 'text-red-400' : 'text-emerald-400'}`}>
            {item.availableQuantity}
          </span>
        </p>
      </div>
      <button
        onClick={() => onBuy(item.sku)}
        disabled={loadingSku === item.sku || item.availableQuantity === 0}
        className="mt-4 w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        {loadingSku === item.sku ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy Now'}
      </button>
    </div>
  );
}
