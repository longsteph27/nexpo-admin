'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { useIsMobile } from '@/hooks/use-mobile';
import type {
  Navigation,
  NavigationItem as DirectusNavigationItem,
  NavigationItemTranslation,
  LanguageCode,
} from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';

interface HeaderNavigationBlockProps {
  navigation?: (Navigation & { items?: DirectusNavigationItem[] }) | null;
  lang: LanguageCode | string;
  siteLogo?: string;
  isEditMode?: boolean;
  hovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onEdit?: () => void;
}

export default function HeaderNavigationBlock({
  navigation,
  lang,
  siteLogo,
  isEditMode = false,
  hovered = false,
  onHoverChange,
  onEdit,
}: HeaderNavigationBlockProps) {
  const isMobile = useIsMobile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (isEditMode) {
      onHoverChange?.(true);
    }
  }, [isEditMode, onHoverChange]);

  const handleMouseLeave = useCallback(() => {
    if (isEditMode) {
      onHoverChange?.(false);
    }
  }, [isEditMode, onHoverChange]);

  const handleEditClick = useCallback(
    (event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isEditMode) {
        setIsMobileMenuOpen(false);
        onEdit?.();
      }
    },
    [isEditMode, onEdit]
  );

  const navigationItems = navigation?.items || [];
  const currentLang = typeof lang === 'string' ? lang : extractLanguageCode(lang);

  const renderNavigationLinks = (className: string, onItemClick?: () => void) =>
    navigationItems.length > 0 ? (
      navigationItems.map((item: DirectusNavigationItem, idx: number) => {
        const translation =
          item.translations?.find((t: NavigationItemTranslation) => {
            const langCode = extractLanguageCode(t.languages_code);
            return langCode === currentLang;
          }) || item.translations?.[0];
        const href = item.type === 'url' ? (item.url || '#') : item.page ? `/${item.page}` : '#';
        return (
          <a
            key={item.id || idx}
            href={href}
            className={className}
            onClick={onItemClick}
            {...(item.open_in_new_tab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {translation?.title || 'Menu Item'}
          </a>
        );
      })
    ) : (
      <span className="text-sm text-neutral-400 font-bold uppercase tracking-wide">Navigation</span>
    );

  return (
    <motion.div
      className={clsx(
        'relative group bg-white',
        isEditMode && 'cursor-pointer'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (isEditMode && !isMobileMenuOpen) {
          onEdit?.();
        }
      }}
    >
      {isEditMode && hovered && <div className="absolute inset-0 bg-black/40 z-30" />}

      <div className="min-h-[80px] flex items-center justify-between px-4 md:px-8 relative z-10">
        <div className="flex items-center flex-shrink-0">
          {siteLogo ? (
            <img
              src={`${process.env.NEXT_PUBLIC_DIRECTUS_URL || 'https://app.nexpo.vn'}/assets/${siteLogo}`}
              alt="Site Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
          ) : (
            <img src="/logo_nexpo.png" alt="Logo" className="h-8 md:h-10 w-auto object-contain" />
          )}
        </div>

        {!isMobile && (
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {renderNavigationLinks(
              'text-xs md:text-sm font-bold uppercase text-neutral-900 hover:text-neutral-700 tracking-wide whitespace-nowrap'
            )}
          </nav>
        )}

        <div className="flex items-center gap-2 md:gap-0">
          {isMobile && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setIsMobileMenuOpen((open) => !open);
              }}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <Icon
                icon={isMobileMenuOpen ? 'lucide:x' : 'lucide:menu'}
                className="w-6 h-6 text-neutral-900"
              />
            </button>
          )
          }
        </div>
      </div>

      <AnimatePresence>
        {isMobile && isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-neutral-200 bg-white relative z-20"
            onClick={(event) => event.stopPropagation()}
          >
            <nav className="flex flex-col py-4">
              {renderNavigationLinks(
                'px-4 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50 hover:text-neutral-700 transition-colors',
                () => setIsMobileMenuOpen(false)
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditMode && (
        <motion.div
          className="absolute inset-0 bg-neutral-400/20 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {hovered && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={handleEditClick}
              className="bg-white/95 hover:bg-white text-neutral-900 px-5 py-2.5 rounded-full flex items-center space-x-2 shadow-lg font-medium text-sm z-30"
            >
              <Icon icon="lucide:pencil" className="w-4 h-4" />
              <span>EDIT SITE HEADER</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}




