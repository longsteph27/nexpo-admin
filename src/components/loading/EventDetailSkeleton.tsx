/**
 * EventDetailSkeleton - Loading skeleton for Event Detail page (events/[id])
 * Matches the structure of BasicInformation, EventRecognition, and EventLocation components
 */

import { Icon } from '@iconify/react';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';

export default function EventDetailSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* Page Header */}
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">
            Event Information
          </h1>
          <p className="text-content-tertiary mt-1 text-sm">
            View and manage event details and settings
          </p>
        </div>
        <div className="flex gap-2">
          <div className="w-28 h-8 bg-gray-200 rounded animate-pulse" />
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        </div>
      </ContainerHeader>

      {/* Content Sections */}
      <Container className="space-y-4">
        {/* Basic Information Card Skeleton */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">
                Basic Information
              </h2>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>
          
          <div className="p-4 space-y-6">
            {/* Event Name Field */}
            <div>
              <label className="text-sm font-semibold text-content-primary mb-2 block">
                Event Name<span className="text-red-500 ml-1">*</span>
              </label>
              {/* Skeleton for dynamic event name value */}
              <div className="py-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-64" />
              </div>
            </div>

            {/* Description Field */}
            <div>
              <label className="text-sm font-semibold text-content-primary mb-2 block">
                Description
              </label>
              {/* Skeleton for dynamic description value */}
              <div className="space-y-2 py-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>

            {/* Status and Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-content-primary mb-2 block">
                  Status
                </label>
                {/* Skeleton for dynamic status value */}
                <div className="py-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-24" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-content-primary mb-2 block">
                  Location
                </label>
                {/* Skeleton for dynamic location value */}
                <div className="py-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse w-48" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Recognition Card Skeleton */}
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">
                Event Recognization
              </h2>
              <p className="text-xs text-content-tertiary">
                Required fields are marked with an asterisk *
              </p>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="p-4">
            <div className="space-y-6">
              {/* Logo Section */}
              <div>
                <div className="text-xs font-medium text-content-secondary mb-2">
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Section */}
              <div>
                <div className="text-xs font-medium text-content-secondary mb-2">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-full h-40 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300 rounded-sm animate-pulse" />
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Location Card Skeleton */}
        <section className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">
                Event Location
              </h2>
              <p className="text-xs text-content-tertiary">
                * indicates a required field
              </p>
            </div>
            <div className="w-16 h-8 bg-gray-200 rounded animate-pulse" />
          </div>

          <div className="p-4 space-y-4">
            {/* Start and End Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div>
                <label className="text-xs font-medium text-content-primary mb-1 block">
                  Start day<span className="text-red-500 ml-1">*</span>
                </label>
                <div className="space-y-1.5">
                  {/* Skeleton for dynamic date/time values */}
                  <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-b-[#23DD4E] space-x-5">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                    </div>
                  </div>
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="text-xs font-medium text-content-primary mb-1 block">
                  End date
                </label>
                <div className="space-y-1.5">
                  {/* Skeleton for dynamic date/time values */}
                  <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-b-[#FF6321] space-x-5">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-24" />
                    </div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Field */}
            <div>
              <label className="text-xs font-medium text-content-primary mb-1 block">
                Location
              </label>
              <div className="relative">
                {/* Skeleton for dynamic location value */}
                <div className="py-1.5 pr-6">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <div className="flex items-center space-x-1.5 text-xs text-content-tertiary">
          <Icon icon="lucide:info" className="w-3 h-3" />
          <span>Message content</span>
        </div>
      </Container>
    </div>
  );
}

