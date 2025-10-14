"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { eventsApi } from "@/lib/api";
import { toast } from "sonner";

interface BasicInformationProps {
  event: {
    id: string;
    name: string;
    description?: string;
    status: 'draft' | 'published' | 'archived';
    location?: string;
  };
  onUpdate: () => void;
}

export default function BasicInformation({ event, onUpdate }: BasicInformationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as 'draft' | 'published' | 'archived',
    location: ""
  });

  // Initialize form data when event loads
  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        description: event.description || "",
        status: event.status || "draft",
        location: event.location || ""
      });
    }
  }, [event]);

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
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        location: formData.location || undefined
      };

      // Update event in Directus
      const result = await eventsApi.updateEvent(event.id, updateData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update event');
      }
      
      // Show success message
      toast.success("Basic information updated successfully!");
      
      // Exit edit mode
      setIsEditing(false);
      
      // Trigger parent update
      onUpdate();
      
    } catch (error) {
      console.error("Error updating basic information:", error);
      toast.error("Failed to update basic information. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancel = () => {
    // Reset form data to original event data
    if (event) {
      setFormData({
        name: event.name || "",
        description: event.description || "",
        status: event.status || "draft",
        location: event.location || ""
      });
    }
    setIsEditing(false);
  };

  return (
    <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-content-primary">
            Basic Information
          </h2>
        </div>
        {!isEditing && (
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
            onClick={() => setIsEditing(true)}
          >
            <Icon icon="lucide:pencil" className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
      </div>
      <div className="p-4 space-y-6">
        {/* Event Name Field */}
        <div>
          <label className="text-sm font-semibold text-content-primary mb-2 block">
            Event Name<span className="text-red-500 ml-1">*</span>
          </label>
          {isEditing ? (
            <input 
              type="text" 
              placeholder="Enter event name" 
              className="w-full border-0 border-b border-gray-300 focus:border-gray-900 outline-none py-2 text-content-primary bg-transparent placeholder-gray-400"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          ) : (
            <div className="py-2 text-content-primary text-sm">
              {event?.name || "No event name provided"}
            </div>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="text-sm font-semibold text-content-primary mb-2 block">
            Description
          </label>
          {isEditing ? (
            <textarea 
              placeholder="Describe your event..."
              className="w-full border-0 border-b border-gray-300 focus:border-gray-900 outline-none py-2 text-content-primary bg-transparent placeholder-gray-400 resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
            />
          ) : (
            <div className="py-2 text-content-primary text-sm whitespace-pre-line">
              {event?.description || "No description provided"}
            </div>
          )}
        </div>

        {/* Status Field */}
        <div>
          <label className="text-sm font-semibold text-content-primary mb-2 block">
            Status<span className="text-red-500 ml-1">*</span>
          </label>
          {isEditing ? (
            <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="w-full border-0 border-b border-gray-300 rounded-none focus:ring-0 focus:border-gray-900 px-0">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="py-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event?.status === "published"
                    ? "bg-green-100 text-green-800"
                    : event?.status === "archived"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-content-primary"
                }`}
              >
                {event?.status || "draft"}
              </span>
            </div>
          )}
        </div>

        {/* Location Field */}
        <div>
          <label className="text-sm font-semibold text-content-primary mb-2 block">
            Location
          </label>
          {isEditing ? (
            <input 
              type="text" 
              placeholder="Enter event location" 
              className="w-full border-0 border-b border-gray-300 focus:border-gray-900 outline-none py-2 text-content-primary bg-transparent placeholder-gray-400"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          ) : (
            <div className="py-2 text-content-primary text-sm">
              {event?.location || "No location provided"}
            </div>
          )}
        </div>

        {/* Edit Mode Action Buttons */}
        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
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
    </section>
  );
}
