'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import type { FeatureSite, SiteTestimonial } from '../../types';

interface TestimonialsCardProps {
  site?: FeatureSite | null;
}

export default function TestimonialsCard({ site }: TestimonialsCardProps) {
  const testimonials: SiteTestimonial[] = site?.testimonials ?? [];

  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Testimonials</h2>
        <p className="text-xs text-content-tertiary">Customer testimonials and reviews</p>
      </div>
      <div className="p-6">
        {testimonials.length > 0 ? (
          <div className="space-y-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {testimonial.title || 'Untitled Testimonial'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      {testimonial.subtitle || 'No subtitle'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    testimonial.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {testimonial.status || 'draft'}
                  </span>
                </div>
                {testimonial.content && (
                  <p className="text-sm text-content-secondary line-clamp-2">
                    {testimonial.content}
                  </p>
                )}
                {testimonial.company && (
                  <p className="text-xs text-content-tertiary mt-1">
                    — {testimonial.company}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:quote" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No testimonials</p>
            <p className="text-xs text-content-tertiary">Add testimonials to showcase customer feedback</p>
          </div>
        )}
      </div>
    </section>
  );
}
