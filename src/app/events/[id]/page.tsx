'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { directusHelpers, type Event } from '@/lib/directus';
import { getDirectusAssetUrl } from '@/util/static';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params?.id || '');
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        const data = await directusHelpers.getEvent(eventId);
        if (data.success) setEvent(data.data as Event);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-gray-600">Loading event...</div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Icon icon="lucide:alert-circle" className="w-10 h-10 text-gray-400 mb-4" />
          <div className="text-gray-700">Event not found</div>
          <Button className="mt-4" onClick={() => router.push('/events')}>Back to Events</Button>
        </div>
      </DashboardLayout>
    );
  }

  const gradient = ['from-indigo-200 to-purple-200','from-pink-200 to-rose-200','from-emerald-200 to-teal-200','from-sky-200 to-cyan-200','from-amber-200 to-orange-200'][Math.abs((event.id || 0) % 5)];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
            <p className="text-gray-600 mt-1">Manage event tickets, pricing, and sales for your event</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" icon="lucide:arrow-left" onClick={() => router.push('/events')}>Back</Button>
            <Button variant="primary" icon="lucide:share-2">Publish Event</Button>
          </div>
        </div>

        {/* Basic Information Card */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
              <p className="text-xs text-gray-500">* Indicates a required field</p>
            </div>
            <Button size="sm" variant="outline" icon="lucide:pencil">Edit</Button>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="text-sm text-gray-600">Theme</label>
              <div className="mt-1 text-gray-900">{event.name}</div>
            </div>
            <div>
              <label className="text-sm text-gray-600">Description</label>
              <p className="mt-1 text-gray-900 whitespace-pre-line">{event.description || '—'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Category</label>
              <div className="mt-1 text-gray-900">{(event as unknown as { category?: string }).category || 'Design'}</div>
            </div>
          </div>
        </section>

        {/* Event Recognition */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Event Recognition</h2>
              <p className="text-xs text-gray-500">Required fields are marked with an asterisk *</p>
            </div>
            <Button size="sm" variant="outline" icon="lucide:pencil">Edit</Button>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 bg-gray-50 flex items-center justify-center">
                  {event.logo ? (
                    <Image src={getDirectusAssetUrl(String(event.logo))} alt="Logo" width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="lucide:image" className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  <div><span className="font-semibold">File Size:</span> Up to 5mb</div>
                  <div className="mt-1"><span className="font-semibold">Optimal Dimension:</span> 600px x 600px</div>
                  <div className="mt-1"><span className="font-semibold">Supported file type:</span> PNG, JPG, WEBP, SVG.</div>
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-gray-700 mb-2">Event banner</div>
                <div className="border border-gray-200 rounded-lg bg-gray-50 h-48 overflow-hidden relative">
                  {event.banner ? (
                    <Image src={getDirectusAssetUrl(String(event.banner))} alt="Banner" fill className="object-cover" />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Location */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Event location</h2>
              <p className="text-xs text-gray-500">* Indicates a required field</p>
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* Event type */}
            <div>
              <div className="text-sm text-gray-700 mb-2">Event Type*</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: 'Offline Event', desc: 'Conduct an event in a physical venue for face-to-face networking' },
                  { title: 'Online Event', desc: 'Host a digital event that engages participants who join remotely' },
                  { title: 'Hybrid Event', desc: 'Expand your in-person event to reach a wider audience' },
                ].map((c, i) => (
                  <div key={c.title} className={`rounded-xl border p-4 bg-white ${i === 0 ? 'ring-2 ring-blue-600 shadow' : ''}`}>
                    <div className="font-semibold text-gray-900 mb-1">{c.title}</div>
                    <div className="text-xs text-gray-600 leading-relaxed">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-700 mb-1">Start day</div>
                <div className="flex items-center gap-3 text-gray-900">
                  <span>{event.start_date || '—'}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700 mb-1">End date</div>
                <div className="flex items-center gap-3 text-gray-900">
                  <span>{event.end_date || '—'}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="text-sm text-gray-700 mb-1">Location</div>
              <div className="text-gray-900">{event.location || '—'}</div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}


