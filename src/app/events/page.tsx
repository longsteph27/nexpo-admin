'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionPermissions } from '@/contexts/PermissionContext';
import CreateEventForm from '@/components/events/CreateEventForm';
import CreateEventFlow from '@/components/events/CreateEventFlow';
import { collectionsAPI } from '@/lib/collections-api';
import { CollectionItem } from '@/types/collections';
import Header from '@/components/layout/Header';

// Event interface is now imported from events-api

function EventsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const eventPermissions = useCollectionPermissions('events');
  const [events, setEvents] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  // Debug logging
  console.log('EventsContent - eventPermissions:', eventPermissions);
  console.log('EventsContent - user:', user);

  const filters = [
    { key: 'all', label: 'All event' },
    { key: 'published', label: 'Live' },
    { key: 'archived', label: 'Past' },
    { key: 'draft', label: 'Draft' },
    { key: 'cancelled', label: 'Cancelled' }
  ];

  // const handleLogout = async () => {
  //   await logout();
  //   router.push('/');
  // };

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the standard collections API service
      const response = await collectionsAPI.getCollectionItems('events', {
        limit: 15,
        page: currentPage,
        fields: ['id', 'name', 'description', 'start_date', 'end_date', 'location', 'status', 'sort', 'tenant_id', 'user_created', 'event_users', 'sites.domain', 'sites.slug', 'forms'],
        sort: ['-start_date'], // Sort by start_date instead of created_at
        filter: activeFilter === 'all' ? undefined : {
          status: activeFilter === 'past' ? { _lt: new Date().toISOString().split('T')[0] } : { _eq: activeFilter }
        }
      });
      
      // Handle nested data structure: response.data.data contains the actual items
      const eventsData = (response.data as { data?: CollectionItem[] })?.data || response.data || [];
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setTotalResults(response.meta?.total_count || 0);
      setTotalPages(Math.ceil((response.meta?.total_count || 0) / 15));
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to empty array on error
      setEvents([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return { color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500' };
      case 'draft':
        return { color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
      case 'archived':
        return { color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getEventThumbnail = (index: number) => {
    const gradients = [
      'from-blue-400 to-green-400',
      'from-pink-400 via-purple-400 to-blue-400',
      'from-orange-400 to-yellow-400',
      'from-gray-400 to-gray-200'
    ];
    return gradients[index % gradients.length];
  };

  // Pagination helper functions
  const getPaginationRange = () => {
    const limit = 15;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalResults);
    return { startItem, endItem };
  };

  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header title="Events" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Event Management</h2>
              <p className="text-gray-600">Manage event tickets, pricing, and sales for your event.</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Create Event button */}
              <button
                onClick={() => {
                  router.push('/events/create?step=1');
                }}
                className="bg-nexpo-blue text-white px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <Icon icon="mdi:plus" className="w-5 h-5" />
                <span className="font-medium">Create Event</span>
              </button>
              <button className="bg-gray-100 text-gray-600 p-3 rounded-lg hover:bg-gray-200 transition-colors duration-200">
                <Icon icon="mdi:dots-horizontal" className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex space-x-8 mb-6 border-b border-gray-200">
            {filters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`pb-3 px-1 text-sm font-medium transition-colors duration-200 ${
                  activeFilter === filter.key
                    ? 'text-nexpo-blue border-b-2 border-nexpo-blue'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Events List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexpo-blue"></div>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No event ever created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((event, index) => {
                const statusStyle = getStatusColor(event.status);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      {/* Event Thumbnail */}
                      <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${getEventThumbnail(index)} flex items-center justify-center flex-shrink-0`}>
                        <Icon icon="mdi:calendar-event" className="w-8 h-8 text-white" />
                      </div>

                      {/* Event Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
                            
                            {/* Status */}
                            <div className="flex items-center space-x-2 mb-3">
                              <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></div>
                              <span className={`text-sm font-medium ${statusStyle.color}`}>
                                {event.status === 'published' ? 'Live' : 
                                 event.status === 'draft' ? 'Draft' : 
                                 event.status === 'archived' ? 'Past' : 'Cancelled'}
                              </span>
                            </div>

                            {/* Event Info */}
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Icon icon="mdi:calendar" className="w-4 h-4" />
                                <span>{formatDate(event.start_date)}</span>
                                {event.end_date && (
                                  <span>- {formatDate(event.end_date)}</span>
                                )}
                              </div>
                              {event.location && (
                                <div className="flex items-center space-x-2">
                                  <Icon icon="mdi:map-marker" className="w-4 h-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <Icon icon="mdi:link" className="w-4 h-4" />
                                <span>https://example.com/event/{event.id}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {(eventPermissions.canUpdate || eventPermissions.canDelete) && (
                            <button className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-200 transition-colors duration-200">
                              <span className="text-sm">Setting</span>
                              <Icon icon="mdi:dots-horizontal" className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {(() => {
                  const { startItem, endItem } = getPaginationRange();
                  return `Showing ${startItem} to ${endItem} of ${totalResults.toLocaleString()} results`;
                })()}
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:chevron-left" className="w-5 h-5" />
                </button>
                {getVisiblePages().map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === page
                        ? 'bg-nexpo-blue text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon icon="mdi:chevron-right" className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Event Form Modal */}
      <CreateEventForm 
        isOpen={showCreateForm} 
        onClose={() => setShowCreateForm(false)} 
      />

      {/* Create Event Flow Modal */}
      {showCreateFlow && (
        <CreateEventFlow
          onClose={() => setShowCreateFlow(false)}
          onSuccess={() => {
            fetchEvents();
            setShowCreateFlow(false);
          }}
        />
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <ProtectedRoute>
      <EventsContent />
    </ProtectedRoute>
  );
}
