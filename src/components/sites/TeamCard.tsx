'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface TeamCardProps {
  site: any;
}

export default function TeamCard({ site }: TeamCardProps) {
  return (
    <section className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-content-primary">Team</h2>
        <p className="text-xs text-content-tertiary">Team members and contributors</p>
      </div>
      <div className="p-6">
        {site.team && site.team.length > 0 ? (
          <div className="space-y-3">
            {site.team.map((member: any, index: number) => (
              <div key={member.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {member.image ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${member.image}`} 
                      alt={member.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <Icon icon="lucide:user" className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-content-primary">
                      {member.name || 'Unnamed Member'}
                    </p>
                    <p className="text-xs text-content-tertiary">
                      {member.translations?.[0]?.job_title || 'No title'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'published' ? 'bg-green-100 text-green-800' : 
                    'bg-gray-100 text-content-primary'
                  }`}>
                    {member.status || 'draft'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon icon="lucide:users" className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-sm text-content-secondary mt-2">No team members</p>
            <p className="text-xs text-content-tertiary">Add team members to showcase your team</p>
          </div>
        )}
      </div>
    </section>
  );
}
