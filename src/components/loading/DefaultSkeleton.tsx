/**
 * DefaultSkeleton - Simple loading skeleton for non-events pages
 * Minimal skeleton with pulse animation only
 */

export default function DefaultSkeleton() {
  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-3">
          <div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex items-center justify-center">
        <div className="space-y-6 p-8">
          {/* Simple content skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Card skeletons */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="space-y-3">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

