'use client';

// Skeleton loader component for list pages
const SkeletonLoader = ({ count = 5, rows = 6 }) => {
  return (
    <div className="space-y-3">
      {Array(count)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="space-y-2 p-4 border border-gray-200 rounded-lg">
            {Array(rows)
              .fill(0)
              .map((_, j) => (
                <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
          </div>
        ))}
    </div>
  );
};

// Skeleton for card
const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 space-y-4">
    <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
    <div className="space-y-3">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
    </div>
  </div>
);

export default SkeletonLoader;
export { CardSkeleton };
