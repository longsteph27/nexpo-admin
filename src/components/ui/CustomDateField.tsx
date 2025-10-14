"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomDateFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  borderStyle?: string;
  underlineColor?: string;
}

export function CustomDateField({ 
  value, 
  onChange, 
  placeholder = "Select date",
  className,
  disabled = false,
  showClearButton = false,
  borderStyle = "border-0 border-b border-gray-300 focus:border-gray-900",
  underlineColor = ""
}: CustomDateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Parse current date
  useEffect(() => {
    if (value) {
      // Parse YYYY-MM-DD as local date to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      setSelectedDate(date);
      setCurrentDate(date);
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Calculate popup position and close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const calculatePopupPosition = () => {
      if (pickerRef.current && isOpen) {
        const rect = pickerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const popupHeight = 320; // Approximate height of calendar popup
        
        // If there's not enough space below, show above
        if (rect.bottom + popupHeight > viewportHeight - 20) {
          setPopupPosition('top');
        } else {
          setPopupPosition('bottom');
        }
      }
    };

    if (isOpen) {
      calculatePopupPosition();
      window.addEventListener('resize', calculatePopupPosition);
      window.addEventListener('scroll', calculatePopupPosition);
    }

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener('resize', calculatePopupPosition);
      window.removeEventListener('scroll', calculatePopupPosition);
    };
  }, [isOpen]);

  const formatDisplayDate = (date: Date) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selectedDate);
    
    // Format date as YYYY-MM-DD without timezone conversion
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(selectedDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${dayStr}`;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedDate(null);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const isSelected = selectedDate && 
      selectedDate.getDate() === day && 
      selectedDate.getMonth() === currentDate.getMonth() && 
      selectedDate.getFullYear() === currentDate.getFullYear();

    days.push(
      <button
        key={day}
        onClick={() => handleDateSelect(day)}
        className={cn(
          "h-8 w-8 text-sm font-medium hover:bg-gray-100 rounded transition-colors",
          isSelected ? "bg-blue-500 text-white hover:bg-blue-600" : "text-gray-700"
        )}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input Display */}
      <div className={cn("flex items-center gap-1")}>
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "flex-1 outline-none py-2 text-content-primary bg-transparent flex items-center justify-between",
            borderStyle,
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            underlineColor,
            className
          )}
        >
          <span className={cn(
            value ? "text-content-primary" : "text-gray-400"
          )}>
            {value ? (() => {
              // Parse value as local date to avoid timezone issues
              const [year, month, day] = value.split('-').map(Number);
              // Format as DD/MM/YYYY
              const dayStr = String(day).padStart(2, '0');
              const monthStr = String(month).padStart(2, '0');
              return `${dayStr}/${monthStr}/${year}`;
            })() : placeholder}
          </span>
        </div>
        
        {/* Clear Button */}
        {showClearButton && value && (
          <Button
            variant="ghost"
            size="icon"
            className="w-3 h-3 p-0 hover:bg-transparent"
            onClick={handleClear}
          >
            <Icon icon="lucide:x" className="w-3 h-3 text-content-secondary hover:text-content-primary" />
          </Button>
        )}
      </div>

      {/* Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={cn(
              "absolute left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80",
              popupPosition === 'bottom' ? "top-full mt-1" : "bottom-full mb-1"
            )}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              y: popupPosition === 'bottom' ? -10 : 10
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              y: popupPosition === 'bottom' ? -10 : 10
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icon icon="lucide:chevron-left" className="w-4 h-4 text-gray-600" />
              </button>
              
              <h3 className="text-lg font-semibold text-gray-800">
                {formatDisplayDate(currentDate)}
              </h3>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icon icon="lucide:chevron-right" className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-semibold text-gray-600">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
