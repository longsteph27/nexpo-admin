'use client';

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import { getPageInfo, getDirectusAssetUrl } from '@/util/static';
import Image from 'next/image';
import { useEvents } from '@/hooks/useEvents';

const filterTabs = [
  { id: 'all', label: 'All Events', count: 0 },
  { id: 'published', label: 'Published', count: 0 },
  { id: 'draft', label: 'Draft', count: 0 },
  { id: 'archived', label: 'Archived', count: 0 },
];

export default function EventsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const pageInfo = getPageInfo('', '', pathname);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

  // Use React Query hook to fetch events
  const { data: events = [], isLoading: loading } = useEvents();

  const filterCounts = useMemo(() => ({
    all: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    archived: events.filter(e => e.status === 'archived').length,
  }), [events]);

  const filteredEvents = activeFilter === 'all' ? events : events.filter(e => e.status === activeFilter);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage) || 1;
  const startIndex = (currentPage - 1) * eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + eventsPerPage);

  const handleCreateEvent = () => {
    router.push('/events/create?step=1');
  };

  if (!loading && events.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
              <p className="text-gray-600 mt-1">{pageInfo.subtitle}</p>
            </div>
            <Button onClick={handleCreateEvent} className="gradient-primary">
              <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
              Create Event
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-12">
              <Icon icon="lucide:calendar" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Events Yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first event</p>
              {/* <Button onClick={handleCreateEvent} className="gradient-primary">
                <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
                Create Your First Event
              </Button> */}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="text-gray-600 mt-1">{pageInfo.subtitle}</p>
          </div>
          <Button onClick={handleCreateEvent} className="gradient-primary">
            <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-2">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveFilter(tab.id); setCurrentPage(1); }}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeFilter === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
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
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/events/${event.id}`)}
              >
                <div className="flex">
                  <div className="w-48 h-32 flex-shrink-0 overflow-hidden">
                    {event.logo ? (
                      <Image
                        src={getDirectusAssetUrl(event.logo)}
                        alt={event.name}
                        width={192}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${['from-indigo-200 to-purple-200','from-pink-200 to-rose-200','from-emerald-200 to-teal-200','from-sky-200 to-cyan-200','from-amber-200 to-orange-200'][Math.abs((event.id || 0) % 5)]}`} />
                    )}
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{event.name}</h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'published' ? 'bg-green-100 text-green-800' : event.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800'}`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Icon icon="lucide:calendar" className="w-4 h-4 mr-2" />
                            <span>{event.start_date} {event.end_date ? `- ${event.end_date}` : ''}</span>
                          </div>
                          <div className="flex items-center">
                            <Icon icon="lucide:map-pin" className="w-4 h-4 mr-2" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const el = (e.currentTarget as HTMLButtonElement).nextElementSibling as HTMLDivElement;
                            if (el) el.classList.toggle('hidden');
                          }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Icon icon="lucide:more-horizontal" className="w-5 h-5" />
                        </button>
                        <div className="hidden absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-10">
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`); }}
                          >
                            View Details
                          </button>
                          <button
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                              e.stopPropagation();
                              const formId = (event as unknown as { forms?: { id: string }[] }).forms?.[0]?.id || event.id;
                              router.push(`/events/${event.id}/forms/${formId}`);
                            }}
                          >
                            Open Form Builder
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
              </div>
              <div className="flex items-center space-x-2">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
