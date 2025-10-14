/**
 * EventsPageSkeleton - Loading skeleton for Events page
 * Shows static text with skeleton animation only for dynamic data (cards, counts)
 */

import EventCardSkeleton from './EventCardSkeleton';

export default function EventsPageSkeleton() {
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
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Static Title */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-content-primary">Events</h1>
                <p className="text-content-secondary">Manage and organize your events</p>
              </div>
              <div className="w-40 h-10 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Static Filter Tabs - Skeleton for counts only */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-8">
                {['All Events', 'Published', 'Draft', 'Archived'].map((label, i) => (
                  <div key={i} className="py-4 flex items-center space-x-2">
                    <span className="text-sm font-medium text-content-tertiary">{label}</span>
                    <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Event Cards Skeleton */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} index={i} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

