'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomTimeField } from "@/components/ui/CustomTimeField";
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth';
import { directusHelpers } from '@/lib/directus';
import { CustomDateField } from '@/components/ui/CustomDateField';

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
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="lg:w-52 w-32 ">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {/* Start Date */}
                  <div>
                    <label className="text-xs font-medium text-content-primary mb-1 block">
                      Start day<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-nexpo-light-gray focus:border-b-nexpo-blue space-x-5">
                        <div className="flex-1">
                          <CustomDateField
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="Select start date"
                            className="text-sm"
                            showClearButton={true}
                            borderStyle="border-0 outline-none"
                            underlineColor=""
                          />
                        </div>
                        <div className="flex-1">
                          <CustomTimeField
                            value={startTime}
                            onChange={setStartTime}
                            placeholder="Select start time"
                            className="text-sm"
                            showClearButton={true}
                            borderStyle="border-0 outline-none"
                            underlineColor=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="text-xs font-medium text-content-primary mb-1 block">
                      End date<span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-nexpo-light-gray focus:border-b-nexpo-blue space-x-5">
                        <div className="flex-1">
                          <CustomDateField
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="Select end date"
                            className="text-sm"
                            showClearButton={true}
                            borderStyle="border-0 outline-none"
                            underlineColor=""
                          />
                        </div>
                        <div className="flex-1">
                          <CustomTimeField
                            value={endTime}
                            onChange={setEndTime}
                            placeholder="Select end time"
                            className="text-sm"
                            showClearButton={true}
                            borderStyle="border-0 outline-none"
                            underlineColor=""
                          />
                        </div>
                      </div>
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
                  <label className="text-xs font-medium text-content-secondary mb-2 block">
                    Event Logo
                  </label>
                  <ImageUploadField
                    value={logoFileId}
                    onChange={setLogoFileId}
                    folderId={(selectedTenant as any)?.folder_files_id}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <div className="flex items-start space-x-3">
                        <Button
                          variant="ghost"
                          className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden p-1.5 bg-white flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors"
                          onClick={openPicker}
                          disabled={isUploading}
                        >
                          {hasImage && imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt="Event logo"
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-nexpo-bg-gray flex flex-col items-center justify-center">
                              <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-1">
                                <Icon
                                  icon="lucide:plus"
                                  className="w-2 h-2 text-gray-500"
                                />
                              </div>
                              <span className="text-xs text-gray-500 font-medium">Upload</span>
                            </div>
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="space-y-1.5 text-xs text-content-tertiary">
                            <div className="flex items-center space-x-2">
                              <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                              <span>File Size: Up to 5mb</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                              <span>Optimal Dimension: 600px x 600px</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                              <span>Supported file type: PNG, JPG, WEBP, SVG.</span>
                            </div>
                          </div>
                          {hasImage && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={removeImage}
                                disabled={isUploading}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </ImageUploadField>
                </div>

                {/* Banner */}
                <div>
                  <label className="text-xs font-medium text-content-secondary mb-2 block">
                    Event Banner
                  </label>
                  <ImageUploadField
                    value={bannerFileId}
                    onChange={setBannerFileId}
                    folderId={(selectedTenant as any)?.folder_files_id}
                  >
                    {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                      <>
                        <Button
                          variant="ghost"
                          className="relative overflow-hidden w-full h-40 sm:h-80 border border-gray-300 rounded-sm p-1.5 bg-white hover:border-gray-400 transition-colors"
                          onClick={openPicker}
                          disabled={isUploading}
                        >
                          <div className="w-full h-full rounded-md overflow-hidden">
                            {hasImage && imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt="Event banner"
                                width={300}
                                height={160}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex bg-nexpo-bg-gray flex-col items-center justify-center">
                                <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-2">
                                  <Icon
                                    icon="lucide:plus"
                                    className="w-2 h-2 text-gray-500"
                                  />
                                </div>
                                <span className="text-sm text-gray-500 font-medium">Upload</span>
                              </div>
                            )}
                          </div>

                          {/* Remove button overlay */}
                          {hasImage && (
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage();
                                }}
                                disabled={isUploading}
                                className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Icon icon="lucide:trash-2" className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          )}
                        </Button>
                        <div className="mt-1.5 text-xs text-content-tertiary">
                          <div className="flex items-center space-x-2">
                            <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                            <span>Recommended: 1920x600px, max 5MB</span>
                          </div>
                        </div>
                      </>
                    )}
                  </ImageUploadField>
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
              <Button
                className='bg-slate-100'
                variant="default"
                onClick={() => goToStep(step + 1)}
              >
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
