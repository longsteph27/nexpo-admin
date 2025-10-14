"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import BasicInformation from "@/components/events/BasicInformation";
import EventRecognition from "@/components/events/EventRecognition";
import EventLocation from "@/components/events/EventLocation";
import EventDetailSkeleton from "@/components/loading/EventDetailSkeleton";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params?.id || "");

  // Fetch event data (includes site IDs in the response)
  const { data: event, isLoading: loading, refetch } = useEvent(eventId);

  // Handle data refresh when any section is updated
  const handleDataUpdate = () => {
    refetch();
  };

  if (loading) {
    return <EventDetailSkeleton />;
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Icon
          icon="lucide:alert-circle"
          className="w-16 h-16 text-content-tertiary mb-4"
        />
        <h3 className="text-xl font-semibold text-content-primary mb-2">
          Event not found
        </h3>
        <Button className="mt-4" onClick={() => router.push("/events")}>
          <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary">
            Event Information
          </h1>
          <p className="text-content-secondary mt-1 text-sm">
            View and manage event details and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Icon icon="lucide:eye" className="w-3 h-3 mr-1" />
            Preview Event
          </Button>
          <Button variant="gradient" size="sm">
            <Icon icon="lucide:settings" className="w-3 h-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-4">
        {/* Basic Information Component - Only real schema fields */}
        <BasicInformation 
          event={{
            id: String(event.id),
            name: event.name,
            description: event.description,
            status: event.status,
            location: event.location
          }}
          onUpdate={handleDataUpdate}
        />

        {/* Event Recognization Component - Logo and Banner */}
        <EventRecognition 
          event={{
            id: String(event.id),
            name: event.name,
            logo: event.logo,
            banner: event.banner
          }}
          onUpdate={handleDataUpdate}
        />

        {/* Event Location Component - Start/End dates and Location */}
        <EventLocation 
          event={{
            id: String(event.id),
            start_date: event.start_date,
            end_date: event.end_date,
            location: event.location
          }}
          onUpdate={handleDataUpdate}
        />
        {/* Message Content Footer */}
        <div className="flex items-center space-x-1.5 text-xs text-content-tertiary">
          <Icon icon="lucide:info" className="w-3 h-3" />
          <span>Message content</span>
          </div>
      </div>
    </div >
  );
}
