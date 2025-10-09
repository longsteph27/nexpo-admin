"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import { Icon } from "@iconify/react";
import Button from "@/components/ui/button";

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = String(params?.id || "");

  // Fetch event data (includes site IDs in the response)
  const { data: event, isLoading: loading } = useEvent(eventId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg font-medium text-gray-700">
            Loading event...
          </span>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Icon
          icon="lucide:alert-circle"
          className="w-16 h-16 text-gray-400 mb-4"
        />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
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
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Event Information
          </h1>
          <p className="text-gray-600 mt-1">
            View and manage event details and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Icon icon="lucide:eye" className="w-4 h-4 mr-2" />
            Preview Event
          </Button>
          <Button variant="gradient">
            <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Basic Information */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Basic Information
              </h2>
              <p className="text-xs text-gray-500">
                * Indicates a required field
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Event Name *
              </label>
              <div className="mt-1 text-gray-900">{event.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <p className="mt-1 text-gray-900 whitespace-pre-line">
                {event.description || "—"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === "published"
                        ? "bg-green-100 text-green-800"
                        : event.status === "archived"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Location
                </label>
                <div className="mt-1 text-gray-900">
                  {event.location || "—"}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Schedule */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Event Schedule
              </h2>
              <p className="text-xs text-gray-500">
                * Indicates a required field
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Start Date *
                </label>
                <div className="mt-1 flex items-center space-x-2 text-gray-900">
                  <Icon
                    icon="lucide:calendar"
                    className="w-4 h-4 text-gray-500"
                  />
                  <span>{event.start_date || "—"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="mt-1 flex items-center space-x-2 text-gray-900">
                  <Icon
                    icon="lucide:calendar"
                    className="w-4 h-4 text-gray-500"
                  />
                  <span>{event.end_date || "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Event Media */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Event Media
              </h2>
              <p className="text-xs text-gray-500">
                Upload event logo and banner
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Event Logo
                </label>
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  {event.logo ? (
                    <div className="relative w-full h-full">
                      <Icon
                        icon="lucide:image"
                        className="w-8 h-8 text-gray-400"
                      />
                    </div>
                  ) : (
                    <Icon
                      icon="lucide:image"
                      className="w-8 h-8 text-gray-400"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 600x600px, max 5MB
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Event Banner
                </label>
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  {event.banner ? (
                    <Icon
                      icon="lucide:image"
                      className="w-8 h-8 text-gray-400"
                    />
                  ) : (
                    <Icon
                      icon="lucide:image"
                      className="w-8 h-8 text-gray-400"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Recommended: 1920x600px, max 5MB
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
