/**
 * EventCardSkeleton - Skeleton loader for event cards
 * Matches the exact structure of actual event cards for smooth loading transition
 */

export default function EventCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="flex">
        {/* Image Container Skeleton - matches actual structure */}
        <div className="w-56 h-40 flex-shrink-0 pl-2 pt-3 pb-3">
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg" />
        </div>

        {/* Content Skeleton - matches actual structure */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              {/* Title and Badge Skeleton */}
              <div className="flex items-center space-x-3">
                <div className="h-6 w-48 bg-gray-200 rounded" />
                <div className="h-5 w-16 bg-gray-200 rounded-full" />
              </div>

              {/* Date and Location Skeleton */}
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-200 rounded mr-2" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

            {/* Menu Button Skeleton */}
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

