'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { Button } from './button-base';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalCount: number;
  limit: number;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
  totalCount,
  limit,
  className
}: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200", className)}>
      {/* Info */}
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalCount}</span> results
        </span>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className="px-2 py-1 h-8"
        >
          <Icon icon="lucide:chevron-left" className="w-4 h-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-2 py-1 text-sm text-gray-500">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "gradient" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className={cn(
                    "px-3 py-1 h-8 min-w-[32px]",
                    currentPage === page && "text-white"
                  )}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className="px-2 py-1 h-8"
        >
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
