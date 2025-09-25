'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import { directusHelpers, type Event } from '@/lib/directus';

// Mock data for events (you can replace this with real data from Directus)

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: 'lucide:file-text' },
  published: { label: 'Published', color: 'bg-green-100 text-green-800', icon: 'lucide:globe' },
  archived: { label: 'Archived', color: 'bg-red-100 text-red-800', icon: 'lucide:archive' },
};

// Fallback for unknown status values
const getStatusConfig = (status: string) => {
  return statusConfig[status as keyof typeof statusConfig] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    color: 'bg-gray-100 text-gray-800',
    icon: 'lucide:help-circle'
  };
};

const filterTabs = [
  { id: 'all', label: 'All Events', count: 0 },
  { id: 'published', label: 'Published', count: 0 },
  { id: 'draft', label: 'Draft', count: 0 },
  { id: 'archived', label: 'Archived', count: 0 },
];

export default function EventManagementPage() {
  const router = useRouter();
  const { selectedTenant } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  // Calculate filter counts
  const filterCounts = {
    all: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  };

  // Filter events based on active filter
  const filteredEvents = activeFilter === 'all' 
    ? events 
    : events.filter(event => event.status === activeFilter);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  const loadEvents = async () => {
    if (!selectedTenant) return;
    
    setLoading(true);
    try {
      const result = await directusHelpers.getEvents(selectedTenant.id);
      if (result.success) {
        setEvents(result.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load events when tenant changes
    if (selectedTenant) {
      loadEvents();
    }
  }, [selectedTenant]);

  const handleCreateEvent = () => {
    router.push('/dashboard/create');
  };

  const handleEventSettings = (eventId: string) => {
    console.log('Event settings clicked for:', eventId);
  };

  if (events.length === 0 && !loading) {
    return (
      <DashboardLayout
        title="Event Management"
        subtitle="Manage event tickets, pricing, and sales for your event"
        actions={
          <Button
            variant="primary"
            icon="lucide:plus"
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        }
      >
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-64 h-64 bg-gray-100 rounded-full flex items-center justify-center mb-8">
            <Icon icon="lucide:calendar" className="w-24 h-24 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No event ever created</h3>
          <Button
            variant="primary"
            icon="lucide:plus"
            onClick={handleCreateEvent}
          >
            Create Event
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Event Management"
      subtitle="Manage event tickets, pricing, and sales for your event"
      actions={
        <Button
          variant="primary"
          icon="lucide:plus"
          onClick={handleCreateEvent}
        >
          Create Event
        </Button>
      }
    >
      {/* Filter Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeFilter === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                  {filterCounts[tab.id as keyof typeof filterCounts]}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {paginatedEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Event Image */}
                <div className="w-48 h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
                  {/* You can replace this with actual image */}
                </div>

                {/* Event Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(event.status).color}`}>
                          <Icon icon={getStatusConfig(event.status).icon} className="w-3 h-3 mr-1" />
                          {getStatusConfig(event.status).label}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Icon icon="lucide:calendar" className="w-4 h-4 mr-2" />
                          <span>{event.start_date} - {event.end_date}</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="lucide:map-pin" className="w-4 h-4 mr-2" />
                          <span>{event.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Icon icon="lucide:link" className="w-4 h-4 mr-2" />
                          <span className="text-blue-600">https://vndesignconnect.vn</span>
                        </div>
                      </div>
                    </div>

                    {/* Settings Button */}
                    <button
                      onClick={() => handleEventSettings(event.id!)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Icon icon="lucide:more-horizontal" className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1} đến {Math.min(startIndex + eventsPerPage, filteredEvents.length)} trong tổng số {filteredEvents.length} kết quả
            </div>
            <div className="flex items-center space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${currentPage === index + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
