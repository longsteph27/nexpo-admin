'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import ContainerHeader from '@/components/layout/Container-header';
import Container from '@/components/layout/Container';
import { useEventStats } from '../hooks/useDashboard';

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge?: { label: string; cls: string };
  onClick?: () => void;
}

function StatCard({ label, value, icon, iconBg, iconColor, badge, onClick }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon icon={icon} className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-content-secondary uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-bold text-content-primary">{value.toLocaleString()}</p>
        {badge && (
          <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = parseInt(params.id as string);

  const { data: stats, isLoading } = useEventStats(eventId);

  const checkinRate = stats && stats.registrations > 0
    ? Math.round((stats.checkedIn / stats.registrations) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <ContainerHeader className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">Dashboard</h1>
          <p className="text-content-tertiary mt-1 text-sm">Event overview — updates every 30 seconds.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-content-tertiary hover:text-content-primary"
          title="Refresh"
        >
          <Icon icon="lucide:refresh-cw" className="w-4 h-4" />
        </button>
      </ContainerHeader>

      <Container>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Attendance section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">Attendance</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Registrations"
                  value={stats?.registrations ?? 0}
                  icon="lucide:users"
                  iconBg="bg-blue-50"
                  iconColor="text-blue-600"
                  onClick={() => router.push(`/events/${params.id}/registrations`)}
                />
                <StatCard
                  label="Checked In"
                  value={stats?.checkedIn ?? 0}
                  icon="lucide:badge-check"
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  badge={{ label: `${checkinRate}% rate`, cls: 'bg-green-100 text-green-700' }}
                  onClick={() => router.push(`/events/${params.id}/checkin`)}
                />
                <StatCard
                  label="Exhibitors"
                  value={stats?.exhibitors ?? 0}
                  icon="lucide:store"
                  iconBg="bg-purple-50"
                  iconColor="text-purple-600"
                  onClick={() => router.push(`/events/${params.id}/exhibitors`)}
                />
                <StatCard
                  label="Profile Views"
                  value={stats?.profileViews ?? 0}
                  icon="lucide:eye"
                  iconBg="bg-slate-50"
                  iconColor="text-slate-500"
                />
              </div>
            </div>

            {/* Activity section */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wider mb-3">Activity</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Leads Captured"
                  value={stats?.leads ?? 0}
                  icon="lucide:scan-line"
                  iconBg="bg-indigo-50"
                  iconColor="text-indigo-600"
                  onClick={() => router.push(`/events/${params.id}/leads`)}
                />
                <StatCard
                  label="Match Requests"
                  value={stats?.matchRequests ?? 0}
                  icon="lucide:handshake"
                  iconBg="bg-yellow-50"
                  iconColor="text-yellow-600"
                  badge={stats?.matchRequests ? { label: 'Pending review', cls: 'bg-yellow-100 text-yellow-700' } : undefined}
                  onClick={() => router.push(`/events/${params.id}/matching`)}
                />
                <StatCard
                  label="Open Tickets"
                  value={stats?.openTickets ?? 0}
                  icon="lucide:ticket"
                  iconBg="bg-red-50"
                  iconColor="text-red-500"
                  badge={stats?.openTickets ? { label: 'Needs attention', cls: 'bg-red-100 text-red-600' } : undefined}
                  onClick={() => router.push(`/events/${params.id}/tickets`)}
                />
                <StatCard
                  label="Pending Orders"
                  value={stats?.pendingOrders ?? 0}
                  icon="lucide:shopping-cart"
                  iconBg="bg-orange-50"
                  iconColor="text-orange-500"
                  badge={stats?.pendingOrders ? { label: 'Awaiting confirm', cls: 'bg-orange-100 text-orange-700' } : undefined}
                  onClick={() => router.push(`/events/${params.id}/orders`)}
                />
              </div>
            </div>

            {/* Quick links */}
            <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2">
              {[
                { label: 'Registrations', href: 'registrations', icon: 'lucide:users' },
                { label: 'Exhibitors', href: 'exhibitors', icon: 'lucide:store' },
                { label: 'Leads', href: 'leads', icon: 'lucide:scan-line' },
                { label: 'Matching', href: 'matching', icon: 'lucide:handshake' },
                { label: 'Tickets', href: 'tickets', icon: 'lucide:ticket' },
                { label: 'Orders', href: 'orders', icon: 'lucide:shopping-cart' },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => router.push(`/events/${params.id}/${item.href}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-content-secondary text-xs font-medium transition-colors border border-slate-200 hover:border-blue-200"
                >
                  <Icon icon={item.icon} className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
