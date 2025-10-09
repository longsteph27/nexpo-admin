"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEvent } from "@/hooks/useEvents";
import { formsApi } from "@/lib/api";
import Button from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export default function EventFormsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = String(params?.id || "");

  // Fetch event data
  const { data: event } = useEvent(eventId);

  // Fetch forms
  const { data: forms = [], isLoading: formsLoading } = useQuery({
    queryKey: ["forms", { eventId }],
    queryFn: () => formsApi.getFormsByEvent(eventId),
    select: (r) => r.data || [],
    enabled: !!eventId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600 mt-1">
            Create and manage registration forms for your event
          </p>
        </div>
        <Button variant="gradient">
          <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
          Create Form
        </Button>
      </div>

      {/* Forms List */}
      {formsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12">
          <div className="text-center">
            <Icon
              icon="lucide:file-input"
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Forms Yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first form to collect registrations
            </p>
            <Button variant="gradient">
              <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
              Create First Form
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map((form: any, index: number) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(`/events/${eventId}/forms/${form.id}`)}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon
                      icon="lucide:file-input"
                      className="w-5 h-5 text-purple-600"
                    />
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(form.status || "draft")}`}
                  >
                    {form.status || "draft"}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {form.translations?.[0]?.title || `Form ${form.id}`}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {form.translations?.[0]?.success_message || "No description"}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{form.fields?.length || 0} fields</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/events/${eventId}/forms/${form.id}`);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
