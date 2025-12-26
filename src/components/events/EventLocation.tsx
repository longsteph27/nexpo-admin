"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import { CustomDateField } from "@/components/ui/CustomDateField";
import { CustomTimeField } from "@/components/ui/CustomTimeField";
import { eventsApi } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";

interface EventLocationProps {
  event: {
    id: string;
    start_date?: string;
    end_date?: string;
    location?: string;
  };
  onUpdate: () => void;
}

export default function EventLocation({ event, onUpdate }: EventLocationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    location: ""
  });

  // Initialize form data when event loads
  useEffect(() => {
    if (event) {
      setFormData({
        start_date: event.start_date || "",
        end_date: event.end_date || "",
        location: event.location || ""
      });
    }
  }, [event]);

  // Helper functions for date conversion
  const getLocalDate = (isoString: string) => {
    if (!isoString) return "";
    try {
      return format(new Date(isoString), "yyyy-MM-dd");
    } catch (e) {
      return "";
    }
  };

  const getLocalTime = (isoString: string) => {
    if (!isoString) return "";
    try {
      return format(new Date(isoString), "HH:mm");
    } catch (e) {
      return "";
    }
  };

  const createUTCString = (datePart: string, timePart: string) => {
    if (!datePart || !timePart) return "";
    try {
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      // This constructor creates a Date object in the user's local timezone
      const localDate = new Date(year, month - 1, day, hour, minute);
      return localDate.toISOString();
    } catch (e) {
      return "";
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle save functionality
  const handleSave = async () => {
    if (!event.id) return;

    setIsSaving(true);
    try {
      // Prepare update data
      const updateData = {
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        location: formData.location || undefined
      };

      // Update event in Directus
      const result = await eventsApi.updateEvent(event.id, updateData as any);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update event location');
      }

      // Show success message
      toast.success("Event location updated successfully!");

      // Exit edit mode
      setIsEditing(false);

      // Trigger parent update
      onUpdate();

    } catch (error) {
      console.error("Error updating event location:", error);
      toast.error("Failed to update event location. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    // Reset form data to original event data
    if (event) {
      setFormData({
        start_date: event.start_date || "",
        end_date: event.end_date || "",
        location: event.location || ""
      });
    }
    setIsEditing(false);
  };


  return (
    <section className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary">
            Event Location
          </h2>
          <p className="text-xs text-content-tertiary">
            * indicates a required field
          </p>
        </div>
        {!isEditing ? (
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
            onClick={() => setIsEditing(true)}
          >
            <Icon icon="lucide:pencil" className="w-3 h-3 mr-1" />
            Edit
          </Button>
        ) :
          (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <Icon icon="lucide:x" className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Icon
                  icon={isSaving ? "lucide:loader-2" : "lucide:save"}
                  className={`w-3 h-3 mr-1 ${isSaving ? 'animate-spin' : ''}`}
                />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
      </div>
      <div className="p-4 space-y-4">
        {/* Start and End Date/Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div>
            <label className="text-xs font-medium text-content-primary mb-1 block">
              Start day<span className="text-red-500 ml-1">*</span>
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-b-[#23DD4E] space-x-5">
                <div className="flex-1">
                  <CustomDateField
                    value={getLocalDate(formData.start_date)}
                    onChange={(date) => {
                      const currentTime = getLocalTime(formData.start_date) || "00:00";
                      handleInputChange('start_date', date ? createUTCString(date, currentTime) : '');
                    }}
                    placeholder="Select start date"
                    className="text-sm"
                    disabled={!isEditing}
                    showClearButton={isEditing}
                    borderStyle="border-0 outline-none"
                    underlineColor=""
                  />
                </div>
                <div className="flex-1">
                  <CustomTimeField
                    value={getLocalTime(formData.start_date)}
                    onChange={(time) => {
                      const currentDate = getLocalDate(formData.start_date) || format(new Date(), "yyyy-MM-dd");
                      handleInputChange('start_date', time ? createUTCString(currentDate, time) : '');
                    }}
                    placeholder="Select start time"
                    className="text-sm"
                    disabled={!isEditing}
                    showClearButton={isEditing}
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
              End date
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-sm pb-1.5 border-b-2 border-b-[#FF6321] space-x-5">
                <div className="flex-1">
                  <CustomDateField
                    value={getLocalDate(formData.end_date)}
                    onChange={(date) => {
                      const currentTime = getLocalTime(formData.end_date) || "00:00";
                      handleInputChange('end_date', date ? createUTCString(date, currentTime) : '');
                    }}
                    placeholder="Select end date"
                    className="text-sm"
                    disabled={!isEditing}
                    showClearButton={isEditing}
                    borderStyle="border-0 outline-none"
                    underlineColor=""
                  />
                </div>
                <div className="flex-1">
                  <CustomTimeField
                    value={getLocalTime(formData.end_date)}
                    onChange={(time) => {
                      const currentDate = getLocalDate(formData.end_date) || format(new Date(), "yyyy-MM-dd");
                      handleInputChange('end_date', time ? createUTCString(currentDate, time) : '');
                    }}
                    placeholder="Select end time"
                    className="text-sm"
                    disabled={!isEditing}
                    showClearButton={isEditing}
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
          <label className="text-xs font-medium text-content-primary mb-1 block">
            Location
          </label>
          {isEditing ? (
            <div className="relative">
              <input
                type="text"
                className="w-full border-b border-gray-300 focus:border-gray-900 outline-none py-1.5 text-content-primary bg-transparent pr-6 text-sm"
                placeholder="Enter event location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
              <Icon icon="lucide:map-pin" className="w-3 h-3 text-gray-500 absolute right-0 top-1/2 transform -translate-y-1/2" />
            </div>
          ) : (
            <div className="relative">
              <div className="py-1.5 text-content-primary text-sm pr-6">
                {event?.location || "No location provided"}
              </div>
              <Icon icon="lucide:map-pin" className="w-3 h-3 text-gray-500 absolute right-0 top-1/2 transform -translate-y-1/2" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
