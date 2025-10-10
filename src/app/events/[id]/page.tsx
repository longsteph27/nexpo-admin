"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useEvent } from "@/hooks/useEvents";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getDirectusAssetUrl } from "@/util/static";

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
          <span className="text-lg font-medium text-content-primary">
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
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            Event Information
          </h1>
          <p className="text-content-secondary mt-1">
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
              <h2 className="text-base font-semibold text-content-primary">
                Basic Information
              </h2>
              <p className="text-xs text-content-tertiary">
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
              <label className="text-sm font-medium text-content-secondary">
                Event Name *
              </label>
              <div className="mt-1 text-content-primary">{event.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-content-secondary">
                Description
              </label>
              <p className="mt-1 text-content-primary whitespace-pre-line">
                {event.description || "—"}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-content-secondary">
                  Status
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.status === "published"
                      ? "bg-green-100 text-green-800"
                      : event.status === "archived"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-content-primary"
                      }`}
                  >
                    {event.status}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-content-secondary">
                  Location
                </label>
                <div className="mt-1 text-content-primary">
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
              <h2 className="text-base font-semibold text-content-primary">
                Event Schedule
              </h2>
              <p className="text-xs text-content-tertiary">
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
                <label className="text-sm font-medium text-content-secondary">
                  Start Date *
                </label>
                <div className="mt-1 flex items-center space-x-2 text-content-primary">
                  <Icon
                    icon="lucide:calendar"
                    className="w-4 h-4 text-content-tertiary"
                  />
                  <span>{event.start_date || "—"}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-content-secondary">
                  End Date
                </label>
                <div className="mt-1 flex items-center space-x-2 text-content-primary">
                  <Icon
                    icon="lucide:calendar"
                    className="w-4 h-4 text-content-tertiary"
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
              <h2 className="text-base font-semibold text-content-primary">
                Event Recognization
              </h2>
              <p className="text-xs text-content-tertiary">
                Required fields are marked with an asterisk *
              </p>
            </div>
            <Button size="sm" variant="outline">
              <Icon icon="lucide:pencil" className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="p-6">
            <div className="space-y-8">
              {/* Event Logo Section */}
              <div>
                <label className="text-sm font-medium text-content-secondary mb-3 block">
                  Event Logo
                </label>
                <div className="flex items-start space-x-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center p-2 justify-center border border-gray-200">
                    {event.logo ? (
                      <Image
                        src={getDirectusAssetUrl(event.logo)}
                        alt={event.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                        <Icon
                          icon="lucide:image"
                          className="w-8 h-8 text-white"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2 text-xs text-content-tertiary">
                      <div className="flex items-center space-x-2">
                        <Icon icon="lucide:info" className="w-3 h-3" />
                        <span>File Size: Up to 5mb</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon icon="lucide:info" className="w-3 h-3" />
                        <span>Optimal Dimension: 600px x 600px</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Icon icon="lucide:info" className="w-3 h-3" />
                        <span>Supported file type: PNG, JPG, WEBP, SVG.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Banner Section */}
              <div>
                <label className="text-sm font-medium text-content-secondary mb-3 block">
                  Event Banner
                </label>
                <div className="relative overflow-hidden w-full h-60 border border-gray-200 rounded-lg p-2">
                  <div className=" w-full h-full rounded-lg overflow-hidden ">
                    {event.banner ? (
                      <Image
                        src={getDirectusAssetUrl(event.banner)}
                        alt={`${event.name} banner`}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Icon
                            icon="lucide:image"
                            className="w-12 h-12 text-white/70 mx-auto mb-2"
                          />
                          <p className="text-white/70 text-sm">Upload banner image</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action buttons overlay */}
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Icon icon="lucide:eye" className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <Icon icon="lucide:trash-2" className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-content-tertiary">
                  <div className="flex items-center space-x-2">
                    <Icon icon="lucide:info" className="w-3 h-3" />
                    <span>Recommended: 1920x600px, max 5MB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div >
    </div >
  );
}
