'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { collectionsAPI } from '@/lib/collections-api';
import CreateEventFlow from './CreateEventFlow';
import { ProtectedButton } from '@/components/ProtectedComponent';

interface Site {
  id: string | number;
  domain: string;
  slug: string;
}

interface Event {
  id: string | number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location?: string;
  status: 'draft' | 'published' | 'live' | 'cancelled' | 'past';
  sort?: number;
  tenant_id?: string | number;
  user_created?: string | number;
  event_users?: unknown[];
  sites?: Site[];
  forms?: unknown[];
}

type EventStatus = 'all' | 'live' | 'past' | 'draft' | 'cancelled';

export default function EventsList() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventStatus>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 15;

  const statusFilters = [
    { id: 'all', label: 'All event', count: 0 },
    { id: 'live', label: 'Live', count: 0 },
    { id: 'past', label: 'Past', count: 0 },
    { id: 'draft', label: 'Draft', count: 0 },
    { id: 'cancelled', label: 'Cancelled', count: 0 }
  ];

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filterOptions: Record<string, unknown> = {
        limit: itemsPerPage,
        page: currentPage,
        fields: ['id', 'name', 'description', 'start_date', 'end_date', 'location', 'status', 'sort', 'tenant_id', 'user_created', 'event_users', 'sites.domain', 'sites.slug', 'forms'],
        sort: ['-start_date'] // Sort by start_date instead of created_at
      };

      // Apply status filter
      if (activeFilter !== 'all') {
        if (activeFilter === 'past') {
          filterOptions.filter = {
            end_date: { _lt: new Date().toISOString().split('T')[0] }
          };
        } else {
          filterOptions.filter = {
            status: { _eq: activeFilter }
          };
        }
      }

      const response = await collectionsAPI.getCollectionItems('events', filterOptions);
      // Handle nested data structure: response.data.data contains the actual items
      const eventsData = (response.data as { data?: Event[] })?.data || response.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData as Event[] : []);
      setTotalCount(response.meta?.total_count || 0);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'text-green-600 bg-green-100';
      case 'published':
        return 'text-blue-600 bg-blue-100';
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'past':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return 'mdi:circle';
      case 'published':
        return 'mdi:circle';
      case 'draft':
        return 'mdi:circle';
      case 'cancelled':
        return 'mdi:circle';
      case 'past':
        return 'mdi:circle';
      default:
        return 'mdi:circle';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate) return '';
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start.toDateString() === end.toDateString()) {
      return formatDate(startDate);
    }
    
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getEventThumbnail = (event: Event) => {
    // Default gradient based on event type or category
    const gradients = [
      'from-blue-400 to-green-400',
      'from-pink-400 to-orange-400',
      'from-orange-400 to-yellow-400',
      'from-purple-400 to-pink-400'
    ];
    
    const gradientIndex = (event.id as number) % gradients.length;
    
    return (
      <div className={`w-full h-32 bg-gradient-to-r ${gradients[gradientIndex]} rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-lg">{event.name.charAt(0)}</span>
      </div>
    );
  };

  const getEventWebsite = (event: Event) => {
    if (event.sites && event.sites.length > 0) {
      const domain = event.sites[0].domain;
      return `https://${domain}`;
    }
    return null;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading events...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Event Management</h1>
            <p className="text-gray-600 mt-1">Manage event tickets, pricing, and sales for your event</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Icon icon="mdi:plus" className="w-4 h-4" />
              <span>Create Event</span>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <Icon icon="mdi:dots-horizontal" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-1">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as EventStatus)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-600">
            <Icon icon="mdi:alert-circle" className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="divide-y divide-gray-200">
        {events.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Icon icon="mdi:calendar-off" className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No event ever created</p>
            <p className="text-sm mt-2">Get started by creating your first event</p>
          </div>
        ) : (
          events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                {/* Event Thumbnail */}
                <div className="w-48 h-32 flex-shrink-0">
                  {getEventThumbnail(event)}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {event.name}
                      </h3>
                      
                      {/* Status */}
                      <div className="flex items-center space-x-2 mt-1">
                        <Icon
                          icon={getStatusIcon(event.status)}
                          className={`w-3 h-3 ${getStatusColor(event.status).split(' ')[0]}`}
                        />
                        <span className={`text-sm font-medium ${getStatusColor(event.status)} px-2 py-1 rounded-full`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>

                      {/* Event Details */}
                      <div className="mt-3 space-y-1">
                        {event.start_date && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Icon icon="mdi:calendar" className="w-4 h-4" />
                            <span>{formatDateRange(event.start_date, event.end_date)}</span>
                          </div>
                        )}
                        
                        {event.location && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Icon icon="mdi:map-marker" className="w-4 h-4" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {getEventWebsite(event) && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Icon icon="mdi:web" className="w-4 h-4" />
                            <span className="truncate">{getEventWebsite(event)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      <ProtectedButton
                        collection="events"
                        action="read"
                        onClick={() => router.push(`/events/${event.id}`)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="View Event"
                      >
                        <Icon icon="mdi:eye" className="w-5 h-5" />
                      </ProtectedButton>
                      
                      <ProtectedButton
                        collection="events"
                        action="update"
                        onClick={() => router.push(`/events/${event.id}/edit`)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit Event"
                      >
                        <Icon icon="mdi:pencil" className="w-5 h-5" />
                      </ProtectedButton>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {(currentPage - 1) * itemsPerPage + 1} đến {Math.min(currentPage * itemsPerPage, totalCount)} trong tổng số {totalCount} kết quả
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-left" className="w-5 h-5" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      currentPage === page
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
              >
                <Icon icon="mdi:chevron-right" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateForm && (
        <CreateEventFlow
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            fetchEvents();
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
}
