'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/button';
import Input from '@/components/ui/input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useAuthStore } from '@/store/auth';
import { directusHelpers } from '@/lib/directus';

export default function CreateEventPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = Number(searchParams.get('step') || '1');
  const { selectedTenant } = useAuthStore();

  // Form state across steps
  const [category, setCategory] = useState('Design');
  const [name, setName] = useState('Vietnam Design Connnect 2025');
  const [description] = useState('');
  const [eventType, setEventType] = useState<'offline' | 'online' | 'hybrid' | null>('offline');
  const [startDate, setStartDate] = useState('2025-12-18');
  const [startTime, setStartTime] = useState('13:00');
  const [endDate, setEndDate] = useState('2025-12-18');
  const [endTime, setEndTime] = useState('13:00');
  const [location, setLocation] = useState('SECC – Saigon Exhibition & Convention Center, District 7, HCMC');
  const [logoFileId, setLogoFileId] = useState<string>('');
  const [bannerFileId, setBannerFileId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const goToStep = (nextStep: number) => {
    const clamped = Math.min(3, Math.max(1, nextStep));
    const url = `/events/create?step=${clamped}`;
    router.replace(url);
  };

  const stepTitle = useMemo(() => {
    if (step === 1) return { title: 'Basic Information', hint: '* indicates a required field' };
    if (step === 2) return { title: 'Event Location', hint: '* indicates a required field' };
    return { title: 'Event recognization', hint: '* indicates a required field' };
  }, [step]);

  return (
    <DashboardLayout>
      <div className="grid grid-cols-12 gap-0 min-h-[calc(100vh-4rem)]">
        {/* Left visual panel */}
        <div className="hidden md:block col-span-4">
          <div className={`w-full h-full bg-cover bg-center`} style={{ backgroundImage: step === 1 ? "url('/events_step1.png')" : step === 2 ? "url('/events_step2.png')" : "url('/events_step3.png')" }} />
        </div>

        {/* Right content */}
        <div className="col-span-12 md:col-span-8 bg-white p-8 relative">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-content-primary">{stepTitle.title}</h2>
              <p className="text-xs text-content-tertiary mt-2">{stepTitle.hint}</p>
            </div>

            {step === 1 && (
              <div className="space-y-8">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-2">Event Category<span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      className="w-full border-b border-gray-300 focus:border-gray-900 outline-none py-2 pr-8"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Design">Design</option>
                      <option value="Technology">Technology</option>
                      <option value="Business">Business</option>
                    </select>
                    <Icon icon="lucide:chevron-down" className="w-4 h-4 absolute right-1 top-1/2 -translate-y-1/2 text-content-tertiary" />
                  </div>
                </div>

                {/* Name */}
                <Input
                  label="Event Name*"
                  placeholder="Vietnam Design Connnect 2025"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                />

                <div className="text-xs text-content-tertiary flex items-center gap-2">
                  <Icon icon="lucide:info" className="w-4 h-4" />
                  1/3 - Your fancy event name
                </div>

                {/* bottom-right action */}
                <div className="hidden" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* Event type cards */}
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-2">Event Type<span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: 'offline', title: 'Offline Event', desc: 'Conduct an event in a physical venue for face-to-face networking' },
                      { id: 'online', title: 'Online Event', desc: 'Host a digital event that engages participants who join remotely' },
                      { id: 'hybrid', title: 'Hybrid Event', desc: "Expand your in-person event to reach a wider audience" },
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setEventType(c.id as 'offline' | 'online' | 'hybrid')}
                        className={`text-left rounded-xl border p-4 hover:shadow transition bg-white ${eventType === c.id ? 'ring-2 ring-blue-600 shadow' : ''}`}
                      >
                        <div className="font-semibold text-content-primary mb-1">{c.title}</div>
                        <div className="text-xs text-content-secondary leading-relaxed">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-content-primary mb-2">Start day</label>
                    <div className="flex gap-3">
                      <input type="date" className="flex-1 border-b border-gray-300 focus:border-gray-900 outline-none py-2" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                      <input type="time" className="w-32 border-b border-gray-300 focus:border-gray-900 outline-none py-2" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-content-primary mb-2">End date</label>
                    <div className="flex gap-3">
                      <input type="date" className="flex-1 border-b border-gray-300 focus:border-gray-900 outline-none py-2" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      <input type="time" className="w-32 border-b border-gray-300 focus:border-gray-900 outline-none py-2" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-content-primary mb-2">Location</label>
                  <input className="w-full border-b border-gray-300 focus:border-gray-900 outline-none py-2" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div className="text-xs text-content-tertiary flex items-center gap-2">
                  <Icon icon="lucide:info" className="w-4 h-4" />
                  2/3 – Where to know about your Event
                </div>

                <div className="hidden" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10">
                {/* Logo */}
                <div>
                  <div className="font-medium text-content-primary mb-4">Event logo</div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <ImageUpload
                        value={logoFileId}
                        onChange={setLogoFileId}
                        folderId={(selectedTenant as any)?.folder_files_id}
                      />
                    </div>
                    <div className="col-span-2 text-sm text-content-primary">
                      <div><span className="font-semibold">File Size:</span> Up to 5mb</div>
                      <div className="mt-2"><span className="font-semibold">Optimal Dimension:</span> 600px x 600px</div>
                      <div className="mt-2"><span className="font-semibold">Supported file type:</span> PNG, JPG, WEBP, SVG.</div>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div>
                  <div className="font-medium text-content-primary mb-4">Event banner</div>
                  <ImageUpload
                    value={bannerFileId}
                    onChange={setBannerFileId}
                    folderId={(selectedTenant as any)?.folder_files_id}
                  />
                </div>

                <div className="text-xs text-content-tertiary flex items-center gap-2">
                  <Icon icon="lucide:info" className="w-4 h-4" />
                  3/3 – How to recognize your Event
                </div>

                <div className="hidden" />
              </div>
            )}
          </div>

          {/* Floating bottom-right actions */}
          <div className="fixed md:absolute right-6 bottom-6 flex items-center gap-3">
            {step > 1 && (
              <Button variant="secondary" onClick={() => goToStep(step - 1)}>
                <Icon icon="lucide:chevron-left" className="w-5 h-5 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button variant="default" onClick={() => goToStep(step + 1)}>
                Next
                <Icon icon="lucide:chevron-right" className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                variant="gradient"
                loading={submitting}
                onClick={async () => {
                  if (!selectedTenant) return;
                  setSubmitting(true);
                  try {
                    // build ISO datetime strings
                    const start = `${startDate}T${startTime}:00`;
                    const end = `${endDate}T${endTime}:00`;
                    const payload: {
                      tenant_id: number;
                      name: string;
                      description?: string;
                      start_date: string;
                      end_date: string;
                      location?: string;
                      status: 'draft' | 'published' | 'archived';
                      logo?: string;
                      banner?: string;
                      type?: 'offline' | 'online' | 'hybrid' | null;
                      category?: string;
                    } = {
                      tenant_id: selectedTenant.id,
                      name,
                      description,
                      start_date: start,
                      end_date: end,
                      location,
                      status: 'draft',
                      logo: logoFileId || undefined,
                      banner: bannerFileId || undefined,
                      type: eventType || undefined,
                      category,
                    };
                    const result = await directusHelpers.createEvent(payload);
                    if (result.success) {
                      router.push('/events');
                    }
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                Finish
                <Icon icon="lucide:check" className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
