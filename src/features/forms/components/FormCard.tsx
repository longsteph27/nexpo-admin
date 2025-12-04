'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { FormSummary } from '../types';

export interface FormCardProps {
  form: FormSummary;
  eventId: string;
  lang?: 'en-US' | 'vi-VN';
}

export default function FormCard({ form, eventId, lang = 'en-US' }: FormCardProps) {
  const router = useRouter();
  
  // Get translation for current language
  const translation = form.translations?.find((t) => t.languages_code === lang) || form.translations?.[0];
  const title = translation?.title || 'Untitled Form';
  
  // Get counts
  const fieldCount = form.fields?.length || 0;
  const submissionCount = form.submissions?.length || 0;
  
  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleClick = () => {
    router.push(`/events/${eventId}/forms/${form.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-all"
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-md flex items-center justify-center flex-shrink-0">
            <Icon 
              icon={form.is_registration ? "lucide:user-plus" : "lucide:form-input"} 
              className="w-4 h-4 text-blue-600" 
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
              {title}
            </h3>
            <div className="flex items-center space-x-1.5 mt-1">
              <span className={cn(
                "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium capitalize",
                getStatusColor(form.status)
              )}>
                {form.status}
              </span>
              {form.is_registration && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                  <Icon icon="lucide:star" className="w-2.5 h-2.5 mr-0.5" />
                  Reg
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded px-2.5 py-2">
          <div className="flex items-center space-x-1.5">
            <Icon icon="lucide:list" className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Fields</span>
          </div>
          <div className="text-base font-semibold text-gray-900 mt-0.5">
            {fieldCount}
          </div>
        </div>
        <div className="bg-gray-50 rounded px-2.5 py-2">
          <div className="flex items-center space-x-1.5">
            <Icon icon="lucide:inbox" className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Submissions</span>
          </div>
          <div className="text-base font-semibold text-gray-900 mt-0.5">
            {submissionCount}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2.5 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Icon icon="lucide:clock" className="w-3 h-3" />
          <span>{formatDate(form.date_updated || form.date_created)}</span>
        </div>
        <div className="flex items-center space-x-1 text-blue-600 font-medium">
          <span>Edit</span>
          <Icon icon="lucide:arrow-right" className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}

