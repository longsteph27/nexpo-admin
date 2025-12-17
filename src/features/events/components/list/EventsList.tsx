'use client';

import React, { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import EventCardSkeleton from '@/components/loading/EventCardSkeleton';
import { getPageInfo, getDirectusAssetUrl, getRandomPastelStyle } from '@/util/static';
import Image from 'next/image';
import { useEvents } from '@/features/events/hooks/useEvents';
import { Button } from '@/components/ui/button-base';

export default function EventsList() {
  const router = useRouter();
  const pathname = usePathname();
  const pageInfo = getPageInfo('', '', pathname);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 10;

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

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-content-primary">{pageInfo.title}</h1>
            <p className="text-content-secondary mt-1">{pageInfo.subtitle}</p>
          </div>
          <Button onClick={handleCreateEvent} variant="gradient">
            <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        </div>
        <div className="mb-2">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[{ id: 'all', label: 'All Events' }, { id: 'published', label: 'Published' }, { id: 'draft', label: 'Draft' }, { id: 'archived', label: 'Archived' }].map((tab) => (
                <div key={tab.id} className="py-4 px-1 border-b-2 border-transparent flex items-center space-x-2">
                  <span className="text-sm font-medium text-content-tertiary">{tab.label}</span>
                  <div className="h-5 w-8 bg-gray-200 rounded-full animate-pulse" />
                </div>
              ))}
            </nav>
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(5)].map((_, index) => (
            <EventCardSkeleton key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  // if (!loading && events.length === 0) {
  //   return (
  //     <div className="space-y-6">
  //       <div className="flex items-start justify-between">
  //         <div>
  //           <h1 className="text-2xl font-bold text-content-primary">{pageInfo.title}</h1>
  //           <p className="text-content-secondary mt-1">{pageInfo.subtitle}</p>
  //         </div>
  //         <Button onClick={handleCreateEvent} variant="gradient">
  //           <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
  //           Create Event
  //         </Button>
  //       </div>
  //       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  //         <div className="text-center py-12">
  //           <Icon icon="lucide:calendar" className="w-16 h-16 text-content-tertiary mx-auto mb-4" />
  //           <h3 className="text-lg font-semibold text-content-primary mb-2">No Events Yet</h3>
  //           <p className="text-content-tertiary mb-6">Get started by creating your first event</p>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">{pageInfo.title}</h1>
          <p className="text-content-secondary mt-1">{pageInfo.subtitle}</p>
        </div>
        <Button onClick={handleCreateEvent} variant="gradient">
          <Icon icon="lucide:plus" className="w-5 h-5 mr-2" />
          Create Event
        </Button>
      </div>

      <div className="mb-2">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[{ id: 'all', label: 'All Events' }, { id: 'published', label: 'Published' }, { id: 'draft', label: 'Draft' }, { id: 'archived', label: 'Archived' }].map((tab) => (
              <div
                key={tab.id}
                onClick={() => { setActiveFilter(tab.id); setCurrentPage(1); }}
                className={`
                  py-4 px-1 border-b-2 hover:border-slate-300 cursor-pointer rounded-[3px] font-medium text-sm transition-colors
                  ${activeFilter === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-content-tertiary hover:text-content-secondary hover:border-gray-300'}
                `}
              >
                {tab.label}
                <span className="ml-2 bg-gray-100 text-content-primary py-0.5 px-2 rounded-full text-xs">
                  {filterCounts[tab.id as keyof typeof filterCounts]}
                </span>
              </div>
            ))}
          </nav>
        </div>
      </div>

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
                <div className="w-56 h-40 flex-shrink-0 pl-2 pt-3 pb-3">
                  <div className="w-full h-full overflow-hidden rounded-lg">
                    {event.logo ? (
                      <Image
                        src={getDirectusAssetUrl(event.logo)}
                        alt={event.name}
                        width={224}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className='w-full h-full' style={getRandomPastelStyle()} />
                    )}
                  </div>
                </div>
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-content-primary">{event.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === 'published' ? 'bg-green-100 text-green-800' : event.status === 'draft' ? 'bg-gray-100 text-content-primary' : 'bg-red-100 text-red-800'}`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm text-content-secondary">
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
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-gray-200">
            <div className="text-sm text-content-primary">
              Showing {startIndex + 1} to {Math.min(startIndex + eventsPerPage, filteredEvents.length)} of {filteredEvents.length}
            </div>
            <div className="flex items-center space-x-2">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === index + 1 ? 'bg-blue-600 text-white' : 'text-content-primary hover:bg-gray-100'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


