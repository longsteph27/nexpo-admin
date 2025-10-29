'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { directusHelpers } from '@/lib/directus';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface Site {
    id: number;
    slug?: string;
    domain?: string;
    status: string;
    translations?: {
        title?: string;
    }[];
}

interface Page {
    id: string;
    status: string;
    translations?: {
        title?: string;
        permalink?: string;
    }[];
    site_id?: number;
}

interface EventSidebarProps {
    eventId: string;
}

export default function EventSidebar({ eventId }: EventSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated } = useAuth();
    const [expandedSites, setExpandedSites] = useState<Set<number>>(new Set());
    const [expandedPages, setExpandedPages] = useState<Set<number>>(new Set());
    const [expandedForms, setExpandedForms] = useState(false);

    // Fetch sites for this event - only when authenticated
    const { data: sites = [], isLoading: sitesLoading } = useQuery({
        queryKey: ['sites', eventId],
        queryFn: async () => {
            const result = await directusHelpers.getSitesByEvent(parseInt(eventId));
            return result.success ? result.data : [];
        },
        enabled: !!eventId && isAuthenticated,  // Wait for auth
    });

    // Fetch pages for expanded sites - only when authenticated
    const { data: pagesData = {}, isLoading: pagesLoading } = useQuery({
        queryKey: ['pages', Array.from(expandedSites)],
        queryFn: async () => {
            const pages: { [siteId: number]: Page[] } = {};

            for (const siteId of expandedSites) {
                const result = await directusHelpers.getPagesBySite(siteId);
                if (result.success && result.data) {
                    pages[siteId] = result.data as Page[];
                }
            }

            return pages;
        },
        enabled: expandedSites.size > 0 && isAuthenticated,  // Wait for auth
    });

    const toggleSite = (siteId: number) => {
        setExpandedSites(prev => {
            const newSet = new Set(prev);
            if (newSet.has(siteId)) {
                newSet.delete(siteId);
                // Also close pages for this site
                setExpandedPages(prevPages => {
                    const newPagesSet = new Set(prevPages);
                    newPagesSet.delete(siteId);
                    return newPagesSet;
                });
            } else {
                newSet.add(siteId);
            }
            return newSet;
        });
    };

    const togglePages = (siteId: number) => {
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(siteId)) {
                newSet.delete(siteId);
            } else {
                newSet.add(siteId);
            }
            return newSet;
        });
    };

    const navigateToSite = (site: Site) => {
        router.push(`/events/${eventId}/sites/${site.id}`);
    };

    const navigateToPage = (page: Page, siteId: number) => {
        router.push(`/events/${eventId}/sites/${siteId}/pages/${page.id}`);
    };

    // Check if Event Information is active (on main event page)
    const isEventInformationActive = pathname === `/events/${eventId}` || pathname?.includes(`/events/${eventId}`) && !pathname?.includes('/sites/') && !pathname?.includes('/forms');
    
    // Check if Sites section is active (any site or page is selected)
    const isSitesActive = pathname?.includes('/sites/');
    
    // Check if Forms section is active
    const isFormsActive = pathname?.includes('/forms');

    // Animation variants for sidebar items - chỉ hover effects
    const sidebarItemVariants = {
        hover: {
            scale: 1.0, // Không có scale animation
        },
        tap: {
            scale: 1.0, // Không có scale animation
        },
    };

    const expandVariants = {
        hidden: {
            opacity: 0,
            height: 0,
        },
        visible: {
            opacity: 1,
            height: 'auto',
        },
    };

    const childItemVariants = {
        hidden: {
            opacity: 0,
            x: -10,
        },
        visible: {
            opacity: 1,
            x: 0,
        },
    };

    return (
        <div className="w-72 h-full bg-white border-r border-slate-200 flex flex-col shadow-lg">
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                <nav className="py-4 px-0 space-y-4">
                    {/* ORGANIZER Section */}
                    <div className="space-y-3">
                        {/* ORGANIZER Header */}
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Icon icon="lucide:settings" className="w-5 h-5 text-blue-400" />
                                    <Icon icon="lucide:sparkles" className="w-2.5 h-2.5 text-blue-500 absolute -top-1 -right-1" />
                                </div>
                                   <span className="font-sf text-lg font-bold text-content-primary uppercase tracking-wider">ORGANIZER</span>
                            </div>
                            <button className="p-1 hover:bg-slate-100 rounded transition-colors">
                                <Icon icon="lucide:more-horizontal" className="w-4 h-4 text-content-tertiary" />
                            </button>
                        </div>

                        {/* Event Set-up Description */}
                        {/* <div className="px-3 py-1">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <Icon icon="lucide:settings" className="w-4 h-4 text-blue-400" />
                                    <Icon icon="lucide:sparkles" className="w-2 h-2 text-yellow-400 absolute -top-0.5 -right-0.5" />
                                </div>
                                <span className="font-sf text-sm text-content-secondary">Event Set-up</span>
                            </div>
                        </div> */}

                        {/* Event Information Item */}
                        <motion.div 
                            className="ml-6 cursor-pointer" 
                            onClick={() => router.push(`/events/${eventId}`)}
                            variants={sidebarItemVariants}
                            whileHover="hover"
                            whileTap="tap"
                            transition={{
                                duration: 0.2,
                                ease: "easeOut",
                            }}
                        >
                            <div className={cn(
                                "flex items-center space-x-3 px-3 py-2 transition-all duration-200",
                                isEventInformationActive 
                                    ? "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                    : "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700"
                            )}>
                                <motion.div
                                    animate={isEventInformationActive ? { scale: 1.1 } : { scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon 
                                        icon="lucide:info" 
                                        className={cn(
                                            "w-4 h-4",
                                            isEventInformationActive ? "text-blue-600" : "text-content-tertiary"
                                        )} 
                                    />
                                </motion.div>
                                <span className="font-sf text-sm font-medium text-content-primary">Event Information</span>
                            </div>
                        </motion.div>

                        {/* Registrations Item */}
                        <motion.div 
                            className="ml-6 cursor-pointer" 
                            onClick={() => router.push(`/events/${eventId}/registrations`)}
                            variants={sidebarItemVariants}
                            whileHover="hover"
                            whileTap="tap"
                            transition={{
                                duration: 0.2,
                                ease: "easeOut",
                            }}
                        >
                            <div className={cn(
                                "flex items-center space-x-3 px-3 py-2 transition-all duration-200",
                                pathname?.includes('/registrations')
                                    ? "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                    : "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700"
                            )}>
                                <motion.div
                                    animate={pathname?.includes('/registrations') ? { scale: 1.1 } : { scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon 
                                        icon="lucide:users" 
                                        className={cn(
                                            "w-4 h-4",
                                            pathname?.includes('/registrations') ? "text-blue-600" : "text-content-tertiary"
                                        )} 
                                    />
                                </motion.div>
                                <span className="font-sf text-sm font-medium text-content-primary">Registrations</span>
                            </div>
                        </motion.div>

                        {/* Checkin Item */}
                        <motion.div 
                            className="ml-6 cursor-pointer" 
                            onClick={() => router.push(`/events/${eventId}/checkin`)}
                            variants={sidebarItemVariants}
                            whileHover="hover"
                            whileTap="tap"
                            transition={{
                                duration: 0.2,
                                ease: "easeOut",
                            }}
                        >
                            <div className={cn(
                                "flex items-center space-x-3 px-3 py-2 transition-all duration-200",
                                pathname?.includes('/checkin')
                                    ? "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                    : "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700"
                            )}>
                                <motion.div
                                    animate={pathname?.includes('/checkin') ? { scale: 1.1 } : { scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon 
                                        icon="lucide:qr-code" 
                                        className={cn(
                                            "w-4 h-4",
                                            pathname?.includes('/checkin') ? "text-blue-600" : "text-content-tertiary"
                                        )} 
                                    />
                                </motion.div>
                                <span className="font-sf text-sm font-medium text-content-primary">Checkin</span>
                            </div>
                        </motion.div>

                        {/* Forms Item with Sub-items */}
                        <div className="ml-6">
                            <motion.div 
                                className="cursor-pointer"
                                onClick={() => setExpandedForms(!expandedForms)}
                                variants={sidebarItemVariants}
                                whileHover="hover"
                                whileTap="tap"
                                transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                }}
                            >
                                <div className={cn(
                                    "flex items-center justify-between px-3 py-2 transition-all duration-200",
                                    isFormsActive 
                                        ? "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                        : "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700"
                                )}>
                                    <div className="flex items-center space-x-3">
                                        <motion.div
                                            animate={isFormsActive ? { scale: 1.1 } : { scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Icon 
                                                icon="lucide:form-input" 
                                                className={cn(
                                                    "w-4 h-4",
                                                    isFormsActive ? "text-blue-600" : "text-content-tertiary"
                                                )} 
                                            />
                                        </motion.div>
                                        <span className="font-sf text-sm font-medium text-content-primary">Forms</span>
                                    </div>
                                    <motion.button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedForms(!expandedForms);
                                        }}
                                        className="p-1 hover:bg-blue-200 rounded transition-colors"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <motion.div
                                            animate={{ 
                                                rotate: expandedForms ? 90 : 0,
                                                scale: expandedForms ? 1.1 : 1 
                                            }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Icon
                                                icon="lucide:chevron-right"
                                                className="w-4 h-4 text-content-tertiary"
                                            />
                                        </motion.div>
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Forms Sub-items */}
                            <AnimatePresence>
                                {expandedForms && (
                                    <motion.div 
                                        className="relative ml-8 space-y-1 mt-2"
                                        variants={expandVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                        transition={{
                                            duration: 0.3,
                                            ease: "easeOut",
                                        }}
                                    >
                                        {/* Connecting line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-nexpo-light-gray" />

                                        {/* Forms Registration */}
                                        <motion.div
                                            className={cn(
                                                "relative flex items-center px-3 py-2 cursor-pointer transition-all duration-200",
                                                "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700",
                                                pathname === `/events/${eventId}/forms/registration` && "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                            )}
                                            onClick={() => router.push(`/events/${eventId}/forms/registration`)}
                                            variants={sidebarItemVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            {/* Horizontal connecting line */}
                                            <div className="absolute left-0 top-1/2 w-4 h-px bg-nexpo-light-gray transform -translate-y-1/2" />

                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                pathname === `/events/${eventId}/forms/registration` ? "bg-blue-600" : "bg-nexpo-light-gray"
                                            )} />
                                            <span className="text-sm font-medium ml-3 font-sf text-content-primary">Forms Registration</span>
                                        </motion.div>

                                        {/* Other Forms */}
                                        <motion.div
                                            className={cn(
                                                "relative flex items-center px-3 py-2 cursor-pointer transition-all duration-200",
                                                "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700",
                                                pathname === `/events/${eventId}/forms` && "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                            )}
                                            onClick={() => router.push(`/events/${eventId}/forms`)}
                                            variants={sidebarItemVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                        >
                                            {/* Horizontal connecting line */}
                                            <div className="absolute left-0 top-1/2 w-4 h-px bg-nexpo-light-gray transform -translate-y-1/2" />

                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                pathname === `/events/${eventId}/forms` ? "bg-blue-600" : "bg-nexpo-light-gray"
                                            )} />
                                            <span className="text-sm font-medium ml-3 font-sf text-content-primary">Other Forms</span>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sites Item with Sub-items */}
                        <div className="ml-6">
                            <motion.div 
                                className={cn(
                                    "flex items-center space-x-3 px-3 py-2 transition-all duration-200",
                                    isSitesActive 
                                        ? "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                        : "hover:bg-slate-50"
                                )}
                                variants={sidebarItemVariants}
                                whileHover="hover"
                                whileTap="tap"
                                transition={{
                                    duration: 0.2,
                                    ease: "easeOut",
                                }}
                            >
                                <motion.div
                                    animate={isSitesActive ? { scale: 1.1 } : { scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Icon 
                                        icon="lucide:globe" 
                                        className={cn(
                                            "w-4 h-4",
                                            isSitesActive ? "text-blue-600" : "text-content-tertiary"
                                        )} 
                                    />
                                </motion.div>
                                <span className="font-sf text-sm font-medium text-content-primary">Sites</span>
                            </motion.div>
                            
                            {/* Sites List */}
                            <div className="ml-4 mt-2 space-y-1">
                                {sitesLoading ? (
                                    <div className="flex items-center space-x-2 px-3 py-2 text-sm text-content-tertiary">
                                        <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                                        <span>Loading sites...</span>
                                    </div>
                                ) : (
                                    sites.map((site) => {
                                const isSiteExpanded = expandedSites.has(site.id);
                                const isPagesExpanded = expandedPages.has(site.id);
                                const siteTitle = site.translations?.[0]?.title || site.domain || `Site ${site.id}`;
                                const sitePages = pagesData[site.id] || [];

                                return (
                                    <motion.div 
                                        key={site.id} 
                                        className="space-y-1"
                                        variants={childItemVariants}
                                    >
                                        {/* Site Item */}
                                        <motion.div
                                            className={cn(
                                                "group relative flex items-center justify-between px-3 py-2 cursor-pointer transition-all duration-200",
                                                "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700",
                                                pathname?.includes(`/sites/${site.id}`) && !pathname?.includes('/pages/') && "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                            )}
                                            onClick={() => navigateToSite(site)}
                                            variants={sidebarItemVariants}
                                            whileHover="hover"
                                            whileTap="tap"
                                            transition={{
                                                duration: 0.2,
                                                ease: "easeOut",
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <Icon
                                                    icon="lucide:web"
                                                    className={cn(
                                                        "w-4 h-4 flex-shrink-0",
                                                        pathname?.includes(`/sites/${site.id}`) && !pathname?.includes('/pages/') ? "text-blue-600" : "text-content-tertiary"
                                                    )}
                                                />
                                                <span className="text-sm font-medium font-sf text-content-primary">{siteTitle}</span>
                                            </div>
                                            <motion.button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSite(site.id);
                                                }}
                                                className="p-1 hover:bg-blue-200 rounded transition-colors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <motion.div
                                                    animate={{ 
                                                        rotate: isSiteExpanded ? 90 : 0,
                                                        scale: isSiteExpanded ? 1.1 : 1 
                                                    }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Icon
                                                        icon="lucide:chevron-right"
                                                        className="w-4 h-4 text-content-tertiary"
                                                    />
                                                </motion.div>
                                            </motion.button>
                                        </motion.div>

                                        {/* Pages Section */}
                                        <AnimatePresence>
                                            {isSiteExpanded && (
                                                <motion.div 
                                                    className="relative ml-8 space-y-1"
                                                    variants={expandVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                    exit="hidden"
                                                    transition={{
                                                        duration: 0.3,
                                                        ease: "easeOut",
                                                        staggerChildren: 0.1,
                                                    }}
                                                >
                                                    {/* Connecting line */}
                                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-nexpo-light-gray" />

                                                    <motion.div
                                                        className="relative flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gradient-to-r hover:from-slate-100/10 hover:to-slate-100 transition-all duration-200"
                                                        onClick={() => togglePages(site.id)}
                                                        variants={sidebarItemVariants}
                                                        whileHover="hover"
                                                        whileTap="tap"
                                                        transition={{
                                                            duration: 0.2,
                                                            ease: "easeOut",
                                                        }}
                                                    >
                                                    {/* Horizontal connecting line */}
                                                    <div className="absolute left-0 top-1/2 w-4 h-px bg-nexpo-light-gray transform -translate-y-1/2" />

                                                    <div className="flex items-center space-x-3">
                                                        <Icon icon="lucide:file-text" className="w-4 h-4 text-content-tertiary flex-shrink-0" />
                                                           <span className="text-sm font-medium text-content-secondary font-sf">Pages</span>
                                                    </div>
                                                    <motion.button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            togglePages(site.id);
                                                        }}
                                                        className="p-1 hover:bg-nexpo-light-gray rounded transition-colors"
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                    >
                                                        <motion.div
                                                            animate={{ 
                                                                rotate: isPagesExpanded ? 90 : 0,
                                                                scale: isPagesExpanded ? 1.1 : 1 
                                                            }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            <Icon
                                                                icon="lucide:chevron-right"
                                                                className="w-4 h-4 text-content-tertiary"
                                                            />
                                                        </motion.div>
                                                    </motion.button>
                                                </motion.div>

                                                {/* Individual Pages */}
                                                <AnimatePresence>
                                                    {isPagesExpanded && (
                                                        <motion.div 
                                                            className="relative ml-8 space-y-1"
                                                            variants={expandVariants}
                                                            initial="hidden"
                                                            animate="visible"
                                                            exit="hidden"
                                                            transition={{
                                                                duration: 0.3,
                                                                ease: "easeOut",
                                                                staggerChildren: 0.1,
                                                            }}
                                                        >
                                                            {/* Vertical line for pages */}
                                                            <div className="absolute left-0 top-0 bottom-0 w-px bg-nexpo-light-gray" />

                                                        {pagesLoading ? (
                                                            <div className="flex items-center space-x-2 px-4 py-2 text-xs text-content-tertiary">
                                                                <Icon icon="lucide:loader-2" className="w-3 h-3 animate-spin" />
                                                                <span>Loading pages...</span>
                                                            </div>
                                                        ) : (
                                                            sitePages.map((page, index) => {
                                                                const pageTitle = page.translations?.[0]?.title || `Page ${page.id}`;
                                                                const isPageActive = pathname?.includes(`/pages/${page.id}`);
                                                                const isLastPage = index === sitePages.length - 1;

                                                                return (
                                                                    <motion.div
                                                                        key={page.id}
                                                                        className={cn(
                                                                            "relative flex items-center px-3 py-2 cursor-pointer transition-all duration-200",
                                                                            "hover:bg-gradient-to-r hover:from-[#E6F6FF]/0 hover:to-[#E6F6FF]/100 hover:text-blue-700",
                                                                            isPageActive && "bg-gradient-to-r from-[#E6F6FF]/0 to-[#E6F6FF]/100 text-blue-700"
                                                                        )}
                                                                        onClick={() => navigateToPage(page, site.id)}
                                                                        variants={sidebarItemVariants}
                                                                        whileHover="hover"
                                                                        whileTap="tap"
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{
                                                                            duration: 0.2,
                                                                            ease: "easeOut",
                                                                        }}
                                                                    >
                                                                        {/* Horizontal connecting line */}
                                                                        <div className="absolute left-0 top-1/2 w-4 h-px bg-nexpo-light-gray transform -translate-y-1/2" />

                                                                        {/* Vertical line continuation (only if not last page) */}
                                                                        {/* {!isLastPage && (
                                                                            <div className="absolute left-0 top-full w-px h-4 bg-slate-500" />
                                                                        )} */}

                                                                        <div className={cn(
                                                                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                                                                            isPageActive ? "bg-blue-600" : "bg-nexpo-light-gray"
                                                                        )} />
                                                                        <span className="text-sm font-medium ml-3 font-sf text-content-primary">{pageTitle}</span>
                                                                    </motion.div>
                                                                );
                                                            })
                                                        )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    </motion.div>
                                );
                            })
                                )}
                            </div>
                        </div>
                    </div>
                </nav>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100">
                       <div className="text-center">
                       <Image src="/logo_nexpo.png" alt="NEXPO" width={100} height={100} className="w-20 h-auto mx-auto mb-3" />
                       <div className="text-xs text-content-tertiary mb-2 font-sans">You&apos;re in a team-managed project</div>
                       <div className="flex justify-center space-x-4 text-xs text-content-tertiary">
                        <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                            <Icon icon="lucide:message-circle" className="w-3 h-3" />
                            <span className="font-sans">Give feedback</span>
                        </button>
                        <span className="text-nexpo-light-gray">•</span>
                        <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors">
                            <Icon icon="lucide:book-open" className="w-3 h-3" />
                            <span className="font-sans">Learn more</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
