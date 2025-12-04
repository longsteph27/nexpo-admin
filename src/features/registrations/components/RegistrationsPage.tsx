'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import Pagination from '@/components/ui/Pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button-base';
import { useRegistrations, useRegistrationCounts } from '../hooks/useRegistrations';
import { useRegistrationsRealtime } from '../hooks/useRegistrationsRealtime';
import type { Registration } from '../types';

export function RegistrationsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('-date_created');
  const limit = 10;

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page when searching
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch registrations for this event with pagination
  const { data: registrationsData, isLoading, error } = useRegistrations({
    eventId: parseInt(eventId),
    page: currentPage,
    limit,
    sort: sortBy,
    search: debouncedSearchTerm || undefined,
  });

  const registrations = registrationsData?.registrations || [];
  const pagination = registrationsData?.pagination;

  // Fetch checked-in and pending counts from API (server-side count with filters)
  const { checkedInCount: checkedInCountData, pendingCount: pendingCountData } = useRegistrationCounts({
    eventId: parseInt(eventId),
    search: debouncedSearchTerm || undefined,
  });

  // Subscribe to realtime updates for registrations
  useRegistrationsRealtime({
    eventId: parseInt(eventId),
    enabled: true,
  });

  // Debug pagination data
  console.log('[RegistrationsPage] Pagination data:', pagination);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get up to 3 form answers for display in list
  const getFormAnswers = (registration: Registration) => {
    console.log('[getFormAnswers] Registration data:', registration);
    console.log('[getFormAnswers] Submissions:', registration.submissions);
    
    const submission = registration.submissions; // m2o relationship, not array
    console.log('[getFormAnswers] Submission:', submission);
    
    if (!submission?.answers) {
      console.log('[getFormAnswers] No answers found');
      return [];
    }
    
    console.log('[getFormAnswers] Answers:', submission.answers);
    
    // Filter answers and get English labels, limit to 3
    const filteredAnswers = submission.answers
      .filter(answer => {
        console.log('[getFormAnswers] Processing answer:', answer);
        return answer.value && answer.field;
      })
      .slice(0, 3)
      .map(answer => {
        const label = answer.field?.translations?.find(t => t.languages_code === 'en-US')?.label || answer.field?.name || 'Unknown Field';
        console.log('[getFormAnswers] Answer label:', label, 'value:', answer.value);
        return {
          label,
          value: answer.value || '',
          type: answer.field?.type || 'text'
        };
      });
    
    console.log('[getFormAnswers] Filtered answers:', filteredAnswers);
    return filteredAnswers;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-content-secondary">Loading registrations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-content-secondary">Failed to load registrations</p>
        </div>
      </div>
    );
  }

  // Use server-side counts (fallback to 0 while loading)
  const checkedInCount = checkedInCountData ?? 0;
  const pendingCount = pendingCountData ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Icon icon="lucide:users" className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-secondary">Total Registrations</p>
              <p className="text-2xl font-bold text-content-primary">{pagination?.totalCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Icon icon="lucide:check-circle" className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-secondary">Checked In</p>
              <p className="text-2xl font-bold text-content-primary">{checkedInCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Icon icon="lucide:clock" className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-content-secondary">Pending Check-in</p>
              <p className="text-2xl font-bold text-content-primary">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by name, email, phone, badge ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="-date_created">Newest First</option>
              <option value="date_created">Oldest First</option>
              <option value="full_name">Name A-Z</option>
              <option value="-full_name">Name Z-A</option>
              <option value="email">Email A-Z</option>
              <option value="-email">Email Z-A</option>
            </select>
          </div>

          {/* Clear Search Button */}
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="px-4"
            >
              <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Registrations List */}
      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <Icon icon="lucide:users" className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-content-primary mb-2">
            {searchTerm ? 'No registrations found' : 'No registrations yet'}
          </h3>
          <p className="text-content-secondary">
            {searchTerm 
              ? 'Try adjusting your search terms or filters.' 
              : 'Visitors will appear here once they register for your event.'
            }
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="mt-4"
            >
              <Icon icon="lucide:x" className="w-4 h-4 mr-2" />
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Form Answers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map((registration: Registration, index: number) => (
                  <motion.tr
                    key={registration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Icon icon="lucide:user" className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-content-primary">
                            {registration.full_name || 'Unnamed'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-content-primary">
                        {registration.email && (
                          <div className="flex items-center space-x-1">
                            <Icon icon="lucide:mail" className="w-3 h-3 text-gray-400" />
                            <span>{registration.email}</span>
                          </div>
                        )}
                        {registration.phone_number && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Icon icon="lucide:phone" className="w-3 h-3 text-gray-400" />
                            <span>{registration.phone_number}</span>
                          </div>
                        )}
                        {!registration.email && !registration.phone_number && (
                          <span className="text-content-tertiary">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-content-primary space-y-1">
                        {(() => {
                          const formAnswers = getFormAnswers(registration);
                          if (formAnswers.length === 0) {
                            return <span className="text-content-tertiary">No form data</span>;
                          }
                          return formAnswers.map((answer, idx) => (
                            <div key={idx} className="flex items-start space-x-2">
                              <span className="font-medium text-content-secondary text-xs min-w-0 flex-shrink-0">
                                {answer.label}:
                              </span>
                              <span className="text-content-primary text-xs min-w-0 flex-1 truncate">
                                {answer.value}
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {registration.checkin_status ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Icon icon="lucide:check-circle" className="w-3 h-3 mr-1" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Icon icon="lucide:clock" className="w-3 h-3 mr-1" />
                            Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">
                      {formatDate(registration.date_created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => router.push(`/events/${eventId}/registrations/${registration.id}`)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
            />
          )}
        </div>
      )}
    </div>
  );
}
