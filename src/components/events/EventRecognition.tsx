"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button-base";
import Image from "next/image";
// import { getOpaquePastelStyle, getRandomPastelStyle } from "@/util/static"; // Not used anymore with new upload layout
import { eventsApi } from "@/lib/api";
import { toast } from "sonner";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { useAuthStore } from "@/store/auth";

interface EventRecognitionProps {
    event: {
        id: string;
        name: string;
        logo?: string;
        banner?: string;
    };
    onUpdate: () => void;
}

export default function EventRecognition({ event, onUpdate }: EventRecognitionProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { selectedTenant } = useAuthStore();

    // Get folder ID from selected tenant
    const folderId = selectedTenant?.folder_files_id;

    // Handle logo change
    const handleLogoChange = async (assetId: string | null) => {
        if (!event.id) return;

        setIsSaving(true);
        try {
            const result = await eventsApi.updateEvent(event.id, { logo: assetId || undefined });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update logo');
            }

            toast.success(assetId ? "Logo updated successfully!" : "Logo removed successfully!");
            onUpdate();

        } catch (error) {
            console.error("Error updating logo:", error);
            toast.error("Failed to update logo. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Handle banner change
    const handleBannerChange = async (assetId: string | null) => {
        if (!event.id) return;

        setIsSaving(true);
        try {
            const result = await eventsApi.updateEvent(event.id, { banner: assetId || undefined });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update banner');
            }

            toast.success(assetId ? "Banner updated successfully!" : "Banner removed successfully!");
            onUpdate();

        } catch (error) {
            console.error("Error updating banner:", error);
            toast.error("Failed to update banner. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-content-primary">
                        Event Recognization
                    </h2>
                    <p className="text-xs text-content-tertiary">
                        Required fields are marked with an asterisk *
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
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                <Icon icon="lucide:x" className="w-3 h-3 mr-1" />
                                Cancel
                            </Button>
                            <Button
                                variant="gradient"
                                size="sm"
                                onClick={() => setIsEditing(false)}
                                disabled={isSaving}
                            >
                                <Icon
                                    icon={isSaving ? "lucide:loader-2" : "lucide:save"}
                                    className={`w-3 h-3 mr-1 ${isSaving ? 'animate-spin' : ''}`}
                                />
                                {isSaving ? 'Processing...' : 'Done'}
                            </Button>
                        </div>
                    )}
            </div>
            <div className="p-4">
                <div className="space-y-6">
                    {/* Event Logo Section */}
                    <div>
                        <label className="text-xs font-medium text-content-secondary mb-2 block">
                            Event Logo
                        </label>
                        <ImageUploadField
                            value={event.logo}
                            onChange={handleLogoChange}
                            folderId={folderId}
                            eventId={event.id}
                        >
                            {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                                <div className="flex items-start space-x-3">
                                    <Button
                                        variant="ghost"
                                        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-sm overflow-hidden p-1.5 bg-white flex items-center justify-center border border-gray-300 hover:border-gray-400 transition-colors ${!isEditing ? 'pointer-events-none' : ''
                                            }`}
                                        onClick={isEditing ? openPicker : undefined}
                                        // disabled={!isEditing}
                                    >
                                        {hasImage && imageUrl ? (
                                            <Image
                                                src={imageUrl}
                                                alt={event.name}
                                                width={64}
                                                height={64}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-nexpo-bg-gray flex flex-col items-center justify-center">
                                                <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-1">
                                                    <Icon
                                                        icon="lucide:plus"
                                                        className="w-2 h-2 text-gray-500"
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 font-medium">Upload</span>
                                            </div>
                                        )}
                                    </Button>
                                    <div className="flex-1">
                                        <div className="space-y-1.5 text-xs text-content-tertiary">
                                            <div className="flex items-center space-x-2">
                                                <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                                                <span>File Size: Up to 5mb</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                                                <span>Optimal Dimension: 600px x 600px</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                                                <span>Supported file type: PNG, JPG, WEBP, SVG.</span>
                                            </div>
                                        </div>
                                        {isEditing && hasImage && (
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={removeImage}
                                                    disabled={isSaving || isUploading}
                                                    className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </ImageUploadField>
                    </div>

                    {/* Event Banner Section */}
                    <div>
                        <label className="text-xs font-medium text-content-secondary mb-2 block">
                            Event Banner
                        </label>
                        <ImageUploadField
                            value={event.banner}
                            onChange={handleBannerChange}
                            folderId={folderId}
                            eventId={event.id}
                        >
                            {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
                                <>
                                    <Button
                                        variant="ghost"
                                        className={`relative overflow-hidden w-full h-40 sm:h-80 border border-gray-300 rounded-sm p-1.5 bg-white hover:border-gray-400 transition-colors ${!isEditing ? 'pointer-events-none' : ''
                                            }`}
                                        onClick={isEditing ? openPicker : undefined}
                                        // disabled={!isEditing}
                                    >
                                        <div className="w-full h-full rounded-md overflow-hidden">
                                            {hasImage && imageUrl ? (
                                                <Image
                                                    src={imageUrl}
                                                    alt={`${event.name} banner`}
                                                    width={300}
                                                    height={160}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex bg-nexpo-bg-gray flex-col items-center justify-center">
                                                    <div className="w-4 h-4 rounded-sm border border-gray-400 flex items-center justify-center mb-2">
                                                        <Icon
                                                            icon="lucide:plus"
                                                            className="w-2 h-2 text-gray-500"
                                                        />
                                                    </div>
                                                    <span className="text-sm text-gray-500 font-medium">Upload</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Remove button overlay - only show when editing */}
                                        {hasImage && isEditing && (
                                            <div className="absolute top-2 right-2 flex space-x-1">
                                                <button
                                                    onClick={removeImage}
                                                    disabled={isSaving || isUploading}
                                                    className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Icon icon="lucide:trash-2" className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        )}
                                    </Button>
                                    <div className="mt-1.5 text-xs text-content-tertiary">
                                        <div className="flex items-center space-x-2">
                                            <Icon icon="lucide:info" className="w-2.5 h-2.5" />
                                            <span>Recommended: 1920x600px, max 5MB</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </ImageUploadField>
                    </div>
                </div>
            </div>
        </section>
    );
}
