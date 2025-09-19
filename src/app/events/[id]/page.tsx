'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProtectedButton } from '@/components/ProtectedComponent';
import { Icon } from '@iconify/react';

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
  sites?: Array<{
    id: string | number;
    domain: string;
    slug: string;
  }>;
  forms?: unknown[];
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = params.id as string;

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event');
        }

        const data = await response.json();
        setEvent(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const handleBack = () => {
    router.push('/events');
  };

  const handleEdit = () => {
    router.push(`/events/${eventId}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      router.push('/events');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete event');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'published': return 'bg-green-100 text-green-800';
      case 'live': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'past': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventWebsite = (event: Event) => {
    if (event.sites && event.sites.length > 0) {
      const domain = event.sites[0].domain;
      return `https://${domain}`;
    }
    return null;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nexpo-blue"></div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !event) {
    return (
      <ProtectedRoute>
        <main className="container mx-auto p-6">
          <div className="text-center">
            <Icon icon="mdi:alert-circle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
            <p className="text-gray-600 mb-4">{error || 'The requested event could not be found.'}</p>
            <button
              onClick={handleBack}
              className="bg-nexpo-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Events
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="container mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <Icon icon="mdi:arrow-left" className="w-5 h-5" />
              <span>Back to Events</span>
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{event.name}</h1>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created: {formatDate(event.start_date)}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <ProtectedButton
                  collection="events"
                  action="update"
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Icon icon="mdi:pencil" className="w-4 h-4" />
                  <span>Edit</span>
                </ProtectedButton>
                
                <ProtectedButton
                  collection="events"
                  action="delete"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Icon icon="mdi:delete" className="w-4 h-4" />
                  <span>Delete</span>
                </ProtectedButton>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700">
                  {event.description || 'No description provided.'}
                </p>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:calendar" className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(event.start_date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Icon icon="mdi:calendar-end" className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">End Date</p>
                      <p className="font-medium">{formatDate(event.end_date)}</p>
                    </div>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-3">
                      <Icon icon="mdi:map-marker" className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}
                  
                  {getEventWebsite(event) && (
                    <div className="flex items-center space-x-3">
                      <Icon icon="mdi:web" className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Website</p>
                        <a 
                          href={getEventWebsite(event)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {getEventWebsite(event)}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Event ID</p>
                    <p className="font-mono text-sm">{event.id}</p>
                  </div>
                  
                  {event.tenant_id && (
                    <div>
                      <p className="text-sm text-gray-500">Tenant ID</p>
                      <p className="font-mono text-sm">{event.tenant_id}</p>
                    </div>
                  )}
                  
                  {event.user_created && (
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-mono text-sm">{event.user_created}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Related Data */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Data</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sites</span>
                    <span className="text-sm font-medium">{event.sites?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Forms</span>
                    <span className="text-sm font-medium">{event.forms?.length || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Users</span>
                    <span className="text-sm font-medium">{event.event_users?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
    </ProtectedRoute>
  );
}