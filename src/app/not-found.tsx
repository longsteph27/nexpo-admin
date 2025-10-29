'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button-base';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon icon="lucide:alert-triangle" className="w-12 h-12 text-red-600" />
        </div>

        {/* Error Message */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Sorry, we couldn't find the page you're looking for. The page might have been moved, deleted, or you might have entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            variant="gradient"
            size="lg"
          >
            <Link href="/events">
              <Icon icon="lucide:home" className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          
          <Button
            asChild
            variant="outline"
            size="lg"
            onClick={() => window.history.back()}
          >
            <button>
              <Icon icon="lucide:arrow-left" className="w-5 h-5 mr-2" />
              Go Back
            </button>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Need Help?</h3>
              <p className="text-sm text-blue-700">
                If you believe this is an error, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
