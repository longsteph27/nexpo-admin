/**
 * Loading Components Index
 * Centralized exports for all loading/skeleton components
 * 
 * Usage:
 * import { EventsPageSkeleton, EventDetailSkeleton } from '@/components/loading';
 * 
 * Available Skeletons:
 * - EventsPageSkeleton: For /events list page
 * - EventDetailSkeleton: For /events/[id] detail page
 * - EventCardSkeleton: Reusable event card skeleton
 * - DefaultSkeleton: Generic fallback skeleton
 */

export { default as EventCardSkeleton } from './EventCardSkeleton';
export { default as EventsPageSkeleton } from './EventsPageSkeleton';
export { default as EventDetailSkeleton } from './EventDetailSkeleton';
export { default as DefaultSkeleton } from './DefaultSkeleton';

