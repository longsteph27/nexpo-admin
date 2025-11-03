'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { CustomTimeField } from '@/components/ui/CustomTimeField';
import { CustomDateField } from '@/components/ui/CustomDateField';

interface EventLocationStepProps {
  eventType: 'offline' | 'online' | 'hybrid' | null;
  setEventType: (value: 'offline' | 'online' | 'hybrid' | null) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  startTime: string;
  setStartTime: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  endTime: string;
  setEndTime: (value: string) => void;
  location: string;
  setLocation: (value: string) => void;
}

export default function EventLocationStep({
  eventType,
  setEventType,
  startDate,
  setStartDate,
  startTime,
  setStartTime,
  endDate,
  setEndDate,
  endTime,
  setEndTime,
  location,
  setLocation,
}: EventLocationStepProps) {
  return (
    <div className="bg-white p-8 relative h-full">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-content-primary">Event Location</h2>
            <p className="text-xs text-content-tertiary mt-2">* indicates a required field</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">
                Event Type<span className="text-red-500">*</span>
              </label>
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
                    className={`text-left rounded-xl border p-4 hover:shadow transition bg-white ${
                      eventType === c.id ? 'ring-2 ring-blue-600 shadow' : ''
                    }`}
                  >
                    <div className="font-semibold text-content-primary mb-1">{c.title}</div>
                    <div className="text-xs text-content-secondary leading-relaxed">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
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
            
            <div>
              <label className="block text-sm font-medium text-content-primary mb-2">Location</label>
              <input
                className="w-full border-b border-gray-300 focus:border-gray-900 outline-none py-2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="text-xs text-content-tertiary flex items-center gap-2">
              <Icon icon="lucide:info" className="w-4 h-4" />
              2/3 – Where to know about your Event
            </div>
            <div className="hidden" />
          </div>
        </div>
    </div>
  );
}
