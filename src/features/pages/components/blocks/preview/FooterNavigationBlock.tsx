'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Icon } from '@iconify/react';
import type {
  Navigation,
  NavigationItem as DirectusNavigationItem,
  NavigationItemTranslation,
  LanguageCode,
} from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';

interface FooterNavigationBlockProps {
  navigation?: (Navigation & { items?: DirectusNavigationItem[] }) | null;
  lang: LanguageCode | string;
  isEditMode?: boolean;
  hovered?: boolean;
  onHoverChange?: (hovered: boolean) => void;
  onEdit?: () => void;
}

export default function FooterNavigationBlock({
  navigation,
  lang,
  isEditMode = false,
  hovered = false,
  onHoverChange,
  onEdit,
}: FooterNavigationBlockProps) {
  const currentLang = typeof lang === 'string' ? lang : extractLanguageCode(lang);
  const items = navigation?.items || [];

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
        onEdit?.();
      }
    },
    [isEditMode, onEdit]
  );

  return (
    <motion.div
      className={clsx('relative group border-t border-neutral-200', isEditMode && 'cursor-pointer')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        if (isEditMode) {
          onEdit?.();
        }
      }}
    >
      <div className="min-h-[120px] flex items-center justify-center px-6 relative z-10">
        {items.length > 0 ? (
          <nav className="flex flex-wrap items-center justify-center gap-6">
            {items.map((item: DirectusNavigationItem, idx: number) => {
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
                  className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
                  {...(item.open_in_new_tab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {translation?.title || 'Menu Item'}
                </a>
              );
            })}
          </nav>
        ) : (
          <div className="text-sm text-neutral-400">Footer Navigation</div>
        )}
      </div>

      {isEditMode && (
        <motion.div
          className="absolute inset-0 bg-neutral-400/20 z-20 flex items-center justify-center"
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
              <span>EDIT SITE FOOTER</span>
            </motion.button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}




