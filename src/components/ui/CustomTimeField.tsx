"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface CustomTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  borderStyle?: string;
  underlineColor?: string;
}

export function CustomTimeField({ 
  value, 
  onChange, 
  placeholder = "Select time",
  className,
  disabled = false,
  showClearButton = false,
  borderStyle = "border-0 border-b border-gray-300 focus:border-gray-900",
  underlineColor = ""
}: CustomTimeFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>(value);
  const [popupPosition, setPopupPosition] = useState<'bottom' | 'top'>('bottom');
  const pickerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate time slots (9:00 AM to 9:00 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    
    // 9:00 AM to 11:30 AM
    for (let hour = 9; hour <= 11; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00 AM`);
      if (hour < 11) {
        slots.push(`${hour.toString().padStart(2, '0')}:30 AM`);
      }
    }
    
    // 12:00 PM to 9:00 PM
    for (let hour = 12; hour <= 21; hour++) {
      const displayHour = hour > 12 ? hour - 12 : hour;
      const period = hour < 12 ? 'AM' : 'PM';
      slots.push(`${displayHour}:00 ${period}`);
      if (hour < 21) {
        slots.push(`${displayHour}:30 ${period}`);
      }
    }
    
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Convert 24h format to 12h format for display
  const formatDisplayTime = (time24: string) => {
    if (!time24) return placeholder;
    
    const [hours, minutes] = time24.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 < 12 ? 'AM' : 'PM';
    
    return `${hour12}:${minutes} ${period}`;
  };

  // Convert 12h format to 24h format for storage
  const convertTo24Hour = (time12: string) => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

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
        const popupHeight = 256; // Approximate height of time list popup
        
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

  // Scroll to selected time when opening
  useEffect(() => {
    if (isOpen && scrollRef.current && value) {
      const displayTime = formatDisplayTime(value);
      const selectedIndex = timeSlots.indexOf(displayTime);
      if (selectedIndex !== -1) {
        const itemHeight = 32; // Approximate height of each time slot
        scrollRef.current.scrollTop = selectedIndex * itemHeight;
      }
    }
  }, [isOpen, value, timeSlots]);

  const handleTimeSelect = (time12: string) => {
    const time24 = convertTo24Hour(time12);
    setSelectedTime(time24);
    onChange(time24);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSelectedTime('');
  };

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
            {formatDisplayTime(value)}
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

      {/* Time List Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={cn(
              "absolute left-0 z-99 bg-white border border-gray-200 rounded-lg shadow-lg w-48",
              popupPosition === 'bottom' ? "top-full mt-1" : "bottom-full mb-1"
            )}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              y: popupPosition === 'bottom' ? -10 : 10,
              originY: popupPosition === 'bottom' ? 0 : 1
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              y: popupPosition === 'bottom' ? -10 : 10,
              originY: popupPosition === 'bottom' ? 0 : 1
            }}
            transition={{ 
              duration: 0.2,
              ease: "easeOut"
            }}
          >
            {/* Time List */}
            <div 
              ref={scrollRef}
              className="max-h-64 overflow-y-auto p-2"
              style={{ scrollbarWidth: 'thin' }}
            >
              {timeSlots.map((time, index) => {
                const displayTime = formatDisplayTime(value);
                const isSelected = displayTime === time;
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleTimeSelect(time)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors",
                      isSelected ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.01 }}
                  >
                    {time}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
