export default function SkeletonCard() {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col justify-between animate-pulse">
      <div>
        <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
      </div>
      <div className="mt-4 h-10 bg-gray-700 rounded-lg w-full"></div>
    </div>
  );
}
