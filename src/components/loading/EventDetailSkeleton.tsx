/**
 * EventDetailSkeleton - Loading skeleton for Event Detail page (events/[id])
 * Matches the structure of BasicInformation, EventRecognition, and EventLocation components
 */

export default function EventDetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-content-primary">
            Event Information
          </h1>
          <p className="text-content-secondary text-sm">
            View and manage event details and settings
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {/* Basic Information Card Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-content-primary">
              Basic Information
            </h2>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="space-y-6">
            {/* Event Name Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-content-primary">Event Name</span>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-content-primary">Description</span>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>

            {/* Status and Location Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-content-primary">Status</span>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-content-primary">Location</span>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Recognition Card Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-content-primary">
              Event Recognization
            </h2>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="space-y-6">
            {/* Logo Section */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-medium text-content-primary">Logo</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>

            {/* Banner Section */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xs font-medium text-content-primary">Banner</span>
              </div>
              <div className="w-full h-40 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm animate-pulse" />
              <div className="mt-2 space-y-1">
                <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Location Card Skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-content-primary">
              Event Location
            </h2>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="space-y-6">
            {/* Event Type Cards */}
            <div>
              <span className="text-xs font-medium text-content-primary mb-2 block">
                Event Type
              </span>
              <div className="grid grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-24 bg-gray-200 rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-content-primary">Start day</span>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-content-primary">End date</span>
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Location Field */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-content-primary">Location</span>
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Map Placeholder */}
            <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center space-x-1.5 text-xs text-content-tertiary">
          <div className="w-3 h-3 bg-gray-200 rounded animate-pulse" />
          <span>Message content</span>
        </div>
      </div>
    </div>
  );
}

