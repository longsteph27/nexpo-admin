'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button-base';
import { useQuery } from '@tanstack/react-query';
import { registrationsApi } from '../api';
import type { Registration } from '../types';
import QRCode from 'qrcode';

export function RegistrationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const registrationId = params.registrationId as string;

    // Fetch single registration detail
    const { data: apiResponse, isLoading, error } = useQuery({
        queryKey: ['registration', registrationId],
        queryFn: async () => {
            const result = await registrationsApi.getRegistration(registrationId);
            if (!result.success || !result.data) {
                throw new Error(result.error || 'Failed to load registration');
            }
            return result.data;
        },
        enabled: !!registrationId,
    });

    const registration = apiResponse as Registration | undefined;
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    // Generate QR code when registration is loaded
    useEffect(() => {
        if (registration?.id) {
            QRCode.toDataURL(registration.id, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            })
                .then(url => setQrCodeUrl(url))
                .catch(err => console.error('QR Code generation error:', err));
        }
    }, [registration?.id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2">
                    <Icon icon="lucide:loader-2" className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-content-secondary">Loading registration details...</span>
                </div>
            </div>
        );
    }

    if (error || !registration) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Icon icon="lucide:alert-circle" className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-content-primary mb-2">
                    Registration Not Found
                </h3>
                <p className="text-content-secondary mb-4">
                    The registration you're looking for doesn't exist or has been deleted.
                </p>
                <Button onClick={() => router.push(`/events/${eventId}/registrations`)}>
                    <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
                    Back to Registrations
                </Button>
            </div>
        );
    }

    // Get all form answers
    const formAnswers = registration.submissions?.answers || [];
    const submission = registration.submissions;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/events/${eventId}/registrations`)}
                    >
                        <Icon icon="lucide:arrow-left" className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-content-primary">
                            Registration Details
                        </h1>
                        <p className="text-sm text-content-secondary mt-1">
                            View complete registration information
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {registration.checkin_status ? (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <Icon icon="lucide:check-circle" className="w-4 h-4 mr-1.5" />
                            Checked In
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                            <Icon icon="lucide:clock" className="w-4 h-4 mr-1.5" />
                            Pending
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                            <Icon icon="lucide:user" className="w-5 h-5 mr-2 text-blue-600" />
                            Basic Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Full Name
                                </label>
                                <p className="text-content-primary mt-1 font-medium">
                                    {registration.full_name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Email
                                </label>
                                <p className="text-content-primary mt-1">
                                    {registration.email || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Phone Number
                                </label>
                                <p className="text-content-primary mt-1">
                                    {registration.phone_number || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Badge ID
                                </label>
                                <p className="text-content-primary mt-1 font-mono">
                                    {registration.badge_id || 'N/A'}
                                </p>
                            </div>
                            {registration.redeem_id && (
                                <div>
                                    <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                        Redeem ID
                                    </label>
                                    <p className="text-content-primary mt-1 font-mono">
                                        {registration.redeem_id}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Form Submission Details */}
                    {submission && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-lg border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                                <Icon icon="lucide:file-text" className="w-5 h-5 mr-2 text-blue-600" />
                                Form Submission
                            </h2>

                            {/* Form Title */}
                            <div className="mb-4 pb-4 border-b border-gray-200">
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Form Name
                                </label>
                                <p className="text-content-primary mt-1 font-medium">
                                    {submission.form?.translations?.find((t: any) => t.languages_code === 'en-US')?.title || 'Registration Form'}
                                </p>
                            </div>

                            {/* Form Answers */}
                            {formAnswers.length > 0 ? (
                                <div className="space-y-4">
                                    {formAnswers.map((answer: any, index: number) => {
                                        const label = answer.field?.translations?.find((t: any) => t.languages_code === 'en-US')?.label
                                            || answer.field?.name
                                            || 'Unknown Field';

                                        return (
                                            <div key={answer.id || index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                                <label className="text-sm font-medium text-content-secondary block mb-1">
                                                    {label}
                                                </label>
                                                <p className="text-content-primary">
                                                    {answer.value || 'No answer provided'}
                                                </p>
                                                <p className="text-xs text-content-tertiary mt-1">
                                                    Type: {answer.field?.type || 'text'}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Icon icon="lucide:file-question" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-content-secondary">No form answers available</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                            <Icon icon="lucide:info" className="w-5 h-5 mr-2 text-blue-600" />
                            Status Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Check-in Status
                                </label>
                                <div className="mt-2">
                                    {registration.checkin_status ? (
                                        <div className="flex items-center text-green-600">
                                            <Icon icon="lucide:check-circle-2" className="w-5 h-5 mr-2" />
                                            <span className="font-medium">Checked In</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-gray-600">
                                            <Icon icon="lucide:clock" className="w-5 h-5 mr-2" />
                                            <span className="font-medium">Not Checked In</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Registration Date
                                </label>
                                <p className="text-content-primary mt-1">
                                    {formatDate(registration.date_created)}
                                </p>
                            </div>

                            {submission?.date_sumitted && (
                                <div>
                                    <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                        Submission Date
                                    </label>
                                    <p className="text-content-primary mt-1">
                                        {formatDate(submission.date_sumitted)}
                                    </p>
                                </div>
                            )}

                            {submission?.status && (
                                <div>
                                    <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                        Submission Status
                                    </label>
                                    <p className="text-content-primary mt-1 capitalize">
                                        {submission.status}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Actions Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                            <Icon icon="lucide:zap" className="w-5 h-5 mr-2 text-blue-600" />
                            Quick Actions
                        </h2>
                        <div className="space-y-2">
                            {registration.email && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = `mailto:${registration.email}`}
                                >
                                    <Icon icon="lucide:mail" className="w-4 h-4 mr-2" />
                                    Send Email
                                </Button>
                            )}
                            {registration.phone_number && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => window.location.href = `tel:${registration.phone_number}`}
                                >
                                    <Icon icon="lucide:phone" className="w-4 h-4 mr-2" />
                                    Call
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.push(`/events/${eventId}/checkin`)}
                            >
                                <Icon icon="lucide:qr-code" className="w-4 h-4 mr-2" />
                                Go to Check-in
                            </Button>
                        </div>
                    </motion.div>

                    {/* QR Code Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                            <Icon icon="lucide:qr-code" className="w-5 h-5 mr-2 text-blue-600" />
                            QR Code
                        </h2>
                        {qrCodeUrl ? (
                            <div className="space-y-3">
                                <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-200">
                                    <img
                                        src={qrCodeUrl}
                                        alt="Registration QR Code"
                                        className="w-48 h-48"
                                    />
                                </div>
                                <p className="text-xs text-content-tertiary text-center">
                                    Scan this QR code to check-in
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full justify-center"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.download = `registration-${registration.id}-qr.png`;
                                        link.href = qrCodeUrl;
                                        link.click();
                                    }}
                                >
                                    <Icon icon="lucide:download" className="w-4 h-4 mr-2" />
                                    Download QR Code
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-8">
                                <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        )}
                    </motion.div>

                    {/* ID Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-lg border border-gray-200 p-6"
                    >
                        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center">
                            <Icon icon="lucide:fingerprint" className="w-5 h-5 mr-2 text-blue-600" />
                            System Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                    Registration ID
                                </label>
                                <p className="text-content-primary mt-1 font-mono text-sm break-all">
                                    {registration.id}
                                </p>
                            </div>
                            {submission?.id && (
                                <div>
                                    <label className="text-xs font-medium text-content-secondary uppercase tracking-wide">
                                        Submission ID
                                    </label>
                                    <p className="text-content-primary mt-1 font-mono text-sm break-all">
                                        {submission.id}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
