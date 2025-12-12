/**
 * Page Payload Manager
 *
 * Service để quản lý payload tạm thời cho Pages với cơ chế create/update/delete
 * Tự động track changes và build payload khi submit
 *
 * Fields có cơ chế create/update/delete:
 * - translations (PageTranslationPayload)
 * - blocks (PageBlocksPayload)
 *
 * Fields bình thường (direct update):
 * - sort, status, site_id
 */

import type {
  Page,
  PageUpdatePayload,
  PageBlock,
  BlockItem,
  BlockCollectionType,
  LanguageCode,
} from '@/types/directus-collections';
import { extractLanguageCode } from '@/types/directus-collections';
import { processM2M, processO2M, BlockTestimonialsSchema, BlockColumnsSchema, BlockLogocloudSchema, BlockGallerySchema, BlockStepsSchema } from '@/lib/payload';
import type { Block } from '../types';

interface PageTranslationOriginal {
  id?: number;
  languages_code: LanguageCode | string | { code: LanguageCode | string };
  title?: string | null;
  permalink?: string | null;
  [key: string]: unknown;
}

interface OriginalData {
  page?: Partial<Page>;
  blocks?: PageBlock[];
  translations?: PageTranslationOriginal[];
}

interface PagePayloadState {
  // Direct fields (simple updates)
  sort?: number | null;
  status?: 'draft' | 'published' | 'archived';
  site_id?: number | null;

  // Relational fields (create/update/delete structure)
  translations: {
    create: Array<{
      pages_id: string; // UUID reference to pages.id
      languages_code: { code: LanguageCode | string };
      title?: string | null;
      permalink?: string | null;
    }>;
    update: Array<{
      id: number;
      title?: string | null;
      permalink?: string | null;
    }>;
    delete: number[];
  };

  blocks: {
    create: Array<{
      collection: BlockCollectionType | string;
      sort: number;
      item: BlockItem | Record<string, unknown> | string;
    }>;
    update: Array<{
      id: string; // PageBlock junction ID
      collection?: BlockCollectionType | string;
      sort?: number;
      item?: BlockItem | Record<string, unknown> | string;
    }>;
    delete: string[]; // PageBlock junction IDs
  };

  // Track original data for comparison
  originalData: OriginalData;

  // Track block translations payload (nested in block items)
  blockTranslationsCache: Map<string, {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: number[];
  }>;
}

export class PagePayloadManager {
  private state: PagePayloadState;
  private pageId: string | undefined;

  constructor(originalPage?: Partial<Page>) {
    this.pageId = originalPage?.id;
    this.state = {
      translations: {
        create: [],
        update: [],
        delete: [],
      },
      blocks: {
        create: [],
        update: [],
        delete: [],
      },
      originalData: {
        page: originalPage,
        blocks: (originalPage as Partial<Page & { blocks?: PageBlock[] }>)?.blocks || [],
        translations: (originalPage as Partial<Page & { translations?: PageTranslationOriginal[] }>)?.translations || [],
      },
      blockTranslationsCache: new Map(),
    };
  }

  /**
   * Normalize value for comparison (null and undefined are treated as equal)
   */
  private normalizeValue(value: unknown): unknown {
    // Treat null and undefined as the same
    if (value === null || value === undefined) {
      return null;
    }
    return value;
  }

  /**
   * Check if two values are equal (with normalization)
   */
  private isEqual(a: unknown, b: unknown): boolean {
    const normalizedA = this.normalizeValue(a);
    const normalizedB = this.normalizeValue(b);
    return normalizedA === normalizedB;
  }

  /**
   * Update direct fields (sort, status, site_id)
   */
  updateField<K extends keyof Pick<PagePayloadState, 'sort' | 'status' | 'site_id'>>(
    field: K,
    value: PagePayloadState[K]
  ): void {
    // Only update if value has changed
    const originalValue = this.state.originalData.page?.[field];
    if (value !== originalValue) {
      this.state[field] = value;
    }
  }

  /**
   * Update page translation permalink
   */
  updateTranslationPermalink(
    languageCode: LanguageCode | string,
    permalink: string,
    title?: string | null
  ): void {
    const langCodeStr = extractLanguageCode(languageCode);
    const originalTranslations = this.state.originalData.translations || [];

    // Find existing translation
    const existingTrans = originalTranslations.find(t => {
      const transLangCode = extractLanguageCode(
        typeof t.languages_code === 'object' && t.languages_code !== null && 'code' in t.languages_code
          ? t.languages_code.code
          : t.languages_code
      );
      return transLangCode === langCodeStr;
    });

    if (existingTrans && existingTrans.id) {
      // Update existing translation
      const existingUpdateIndex = this.state.translations.update.findIndex(
        u => u.id === existingTrans.id
      );

      const updateData: {
        id: number;
        permalink: string;
        title?: string | null;
      } = {
        id: existingTrans.id,
        permalink,
      };

      if (title !== undefined) {
        updateData.title = title;
      }

      if (existingUpdateIndex >= 0) {
        // Merge with existing update, but don't include languages_code (not needed in update)
        const existingUpdate = this.state.translations.update[existingUpdateIndex];
        // Remove languages_code if it exists (shouldn't, but safety check)
        const existingUpdateTyped = existingUpdate as Record<string, unknown>;
        if ('languages_code' in existingUpdateTyped) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { languages_code: _, ...existingUpdateWithoutLangCode } = existingUpdateTyped;
          this.state.translations.update[existingUpdateIndex] = {
            ...(existingUpdateWithoutLangCode as { id: number; title?: string | null; permalink?: string | null }),
            ...updateData,
          };
        } else {
          this.state.translations.update[existingUpdateIndex] = {
            ...existingUpdate,
            ...updateData,
          };
        }
      } else {
        this.state.translations.update.push(updateData);
      }
    } else {
      // Create new translation
      // Check if already in create array
      const existingCreateIndex = this.state.translations.create.findIndex(
        c => extractLanguageCode(c.languages_code.code) === langCodeStr
      );

      if (!this.pageId) {
        console.warn('[PagePayloadManager] Cannot create translation: pageId is not set');
        return;
      }

      const createData: {
        pages_id: string;
        languages_code: { code: string };
        permalink: string;
        title?: string | null;
      } = {
        pages_id: this.pageId,
        languages_code: { code: langCodeStr },
        permalink,
      };

      if (title !== undefined) {
        createData.title = title;
      }

      if (existingCreateIndex >= 0) {
        // Update existing create entry
        this.state.translations.create[existingCreateIndex] = {
          ...this.state.translations.create[existingCreateIndex],
          ...createData,
        };
      } else {
        this.state.translations.create.push(createData);
      }
    }
  }
  /**
   * Stage page translation changes (title/permalink) for a specific language
   * Handles both session-only (id=0) new translations and updates to existing ones
   */
  stagePageTranslation(
    languageCode: LanguageCode | string,
    changes: {
      title?: string | null;
      permalink?: string | null;
      id?: number;
      isSessionOnly?: boolean;
    }
  ): void {
    const langCodeStr = extractLanguageCode(languageCode);
    const originalTranslations = this.state.originalData.translations || [];
    const isSessionOnly = changes.isSessionOnly || changes.id === 0;

    const existingTrans = originalTranslations.find(t => {
      const transLangCode = extractLanguageCode(
        typeof t.languages_code === 'object' && t.languages_code !== null && 'code' in t.languages_code
          ? (t.languages_code as { code: string }).code
          : (t.languages_code as string)
      );
      return transLangCode === langCodeStr;
    });

    // Normalize helper
    const normalize = (v: unknown) => (v === undefined || v === null ? null : v);

    console.log(`[PagePayloadManager] stagePageTranslation ${langCodeStr}: isSessionOnly=${isSessionOnly}, hasExisting=${!!existingTrans && !!existingTrans.id}`);

    if (existingTrans && existingTrans.id && !isSessionOnly) {
      // Update existing translation
      console.log(`[PagePayloadManager] ${langCodeStr} -> UPDATE (id: ${existingTrans.id})`);

      const updateObj: { id: number; title?: string | null; permalink?: string | null } = { id: existingTrans.id };
      let hasAnyChange = false;

      if ('title' in changes) {
        const prev = normalize(existingTrans.title);
        const next = normalize(changes.title ?? null) as string | null;
        if (prev !== next) {
          updateObj.title = next;
          hasAnyChange = true;
        }
      }
      if ('permalink' in changes) {
        const prev = normalize(existingTrans.permalink);
        const next = normalize(changes.permalink ?? null) as string | null;
        if (prev !== next) {
          updateObj.permalink = next;
          hasAnyChange = true;
        }
      }

      if (!hasAnyChange) return;

      const idx = this.state.translations.update.findIndex(u => u.id === existingTrans.id);
      if (idx >= 0) {
        this.state.translations.update[idx] = { ...this.state.translations.update[idx], ...updateObj };
      } else {
        this.state.translations.update.push(updateObj);
      }
    } else {
      // Create new translation (session-only from dialog)
      if (!this.pageId) {
        console.warn('[PagePayloadManager] Cannot stage translation create: pageId is not set');
        return;
      }

      console.log(`[PagePayloadManager] ${langCodeStr} -> CREATE (session-only)`);

      // Build create object with provided fields only
      const createObj: { pages_id: string; languages_code: { code: string }; title?: string | null; permalink?: string | null } = {
        pages_id: this.pageId,
        languages_code: { code: langCodeStr },
      };

      let hasAnyField = false;
      if ('title' in changes) {
        createObj.title = changes.title ?? null;
        hasAnyField = true;
      }
      if ('permalink' in changes) {
        createObj.permalink = changes.permalink ?? null;
        hasAnyField = true;
      }

      if (!hasAnyField) return; // nothing to create

      const idx = this.state.translations.create.findIndex(c => extractLanguageCode(c.languages_code.code) === langCodeStr);
      if (idx >= 0) {
        this.state.translations.create[idx] = { ...this.state.translations.create[idx], ...createObj };
      } else {
        this.state.translations.create.push(createObj);
      }
    }
  }


  /**
   * Add or update a block
   */
  upsertBlock(
    block: Block,
    blockIndex: number,
    eventId: number,
    tenantId?: number
  ): void {
    const isTemp = String(block.id).startsWith('temp-');
    const originalBlocks = this.state.originalData.blocks || [];
    const originalBlock = !isTemp
      ? originalBlocks.find(b => b.id === block.id)
      : null;

    console.log(`[PagePayloadManager] upsertBlock - ${block.collection} (${block.id})`, {
      isTemp,
      hasOriginal: !!originalBlock,
      blockIndex,
      originalSort: originalBlock?.sort,
    });

    // Process block item data
    // Only copy fields, don't automatically add event_id/tenant_id (will be added only if creating or changed)
    const itemData: Record<string, unknown> = {
      ...block.item,
    };

    // For new blocks, always include event_id and tenant_id
    if (isTemp) {
      itemData.tenant_id = tenantId;
      itemData.event_id = eventId;
    }

    // Process block translations if exists
    if (block.item?.translations) {
      const originalTranslations = originalBlock?.item
        ? ((originalBlock.item as unknown as Record<string, unknown>)?.translations as Array<Record<string, unknown>> | undefined) || []
        : [];

      const translationsPayload = this.processBlockTranslations(
        block.id,
        block.item.translations as Array<Record<string, unknown>>,
        originalTranslations
      );

      if (translationsPayload) {
        itemData.translations = translationsPayload;
      } else {
        // Remove translations if no changes and it's an update
        if (!isTemp) {
          delete itemData.translations;
        }
      }
    }

    // Process block_columns rows if exists
    if (block.collection === 'block_columns' && block.item?.rows) {
      const originalRows = originalBlock?.item
        ? ((originalBlock.item as unknown as Record<string, unknown>)?.rows as Array<Record<string, unknown>> | undefined) || []
        : [];

      // Use new payload utility for O2M processing
      const rowsPayload = this.processBlockColumnsRowsWithUtility(
        block.item.rows as Array<Record<string, unknown>>,
        originalRows
      );

      if (rowsPayload) {
        itemData.rows = rowsPayload;
      } else {
        // Remove rows if no changes and it's an update
        if (!isTemp) {
          delete itemData.rows;
        }
      }
    }

    // Process block_steps: steps O2M relationship
    if (block.collection === 'block_steps' && block.item?.steps) {
      const originalSteps = originalBlock?.item
        ? ((originalBlock.item as unknown as Record<string, unknown>)?.steps as Array<Record<string, unknown>> | undefined) || []
        : [];

      const stepsPayload = this.processBlockStepsWithUtility(
        block.item.steps as Array<Record<string, unknown>>,
        originalSteps
      );

      if (stepsPayload) {
        itemData.steps = stepsPayload;
      } else {
        if (!isTemp) {
          delete itemData.steps;
        }
      }
    }

    // Process block_video: Remove id if it's a temp ID when creating
    // Also ensure video fields (type, video_url, video_file) are properly formatted
    if (block.collection === 'block_video') {
      if (isTemp && 'id' in itemData) {
        // Remove temp ID for new block_video (Directus will generate UUID)
        delete itemData.id;
      }

      // Ensure video fields are properly formatted
      // type should be 'url' or 'file'
      // video_url should be a string (for type='url')
      // video_file should be a UUID string (for type='file')
      // These fields are already in block.item, so they'll be included in itemData automatically

      // Remove null/undefined fields for cleaner payload
      if (itemData.video_url === null || itemData.video_url === undefined) {
        delete itemData.video_url;
      }
      if (itemData.video_file === null || itemData.video_file === undefined) {
        delete itemData.video_file;
      }
    }

    // Process block_gallery: Handle gallery_items junction table with create/update/delete structure
    if (block.collection === 'block_gallery') {
      if (isTemp && 'id' in itemData) {
        // Remove temp ID for new block_gallery (Directus will generate UUID)
        delete itemData.id;
      }

      // gallery_items is a many-to-many relationship through block_gallery_files junction table
      if ('gallery_items' in itemData) {
        const originalGalleryItems = originalBlock?.item
          ? ((originalBlock.item as unknown as Record<string, unknown>)?.gallery_items as Array<Record<string, unknown>> | undefined) || []
          : [];

        // Use new payload utility for M2M processing
        const galleryPayload = this.processBlockGalleryWithUtility(
          block.item?.gallery_items as Array<Record<string, unknown>> || [],
          originalGalleryItems
        );

        if (galleryPayload) {
          itemData.gallery_items = galleryPayload;
        } else {
          // Remove gallery_items if no changes
          if (!isTemp) {
            delete itemData.gallery_items;
          }
        }
      }
    }

    // Process block_logocloud: Handle logos junction table with create/update/delete structure
    if (block.collection === 'block_logocloud') {
      if (isTemp && 'id' in itemData) {
        // Remove temp ID for new block_logocloud (Directus will generate UUID)
        delete itemData.id;
      }

      // logos is a many-to-many relationship through block_logocloud_logos junction table
      if ('logos' in itemData) {
        const originalLogos = originalBlock?.item
          ? ((originalBlock.item as unknown as Record<string, unknown>)?.logos as Array<Record<string, unknown>> | undefined) || []
          : [];

        // Use new payload utility for M2M processing
        const logosPayload = this.processBlockLogoCloudWithUtility(
          block.item?.logos as Array<Record<string, unknown>> || [],
          originalLogos
        );

        if (logosPayload) {
          itemData.logos = logosPayload;
        } else {
          // Remove logos if no changes
          if (!isTemp) {
            delete itemData.logos;
          }
        }
      }
    }

    // Process block_testimonials: Handle testimonials junction table with create/update/delete structure
    if (block.collection === 'block_testimonials') {
      if (isTemp && 'id' in itemData) {
        // Remove temp ID for new block_testimonials (Directus will generate UUID)
        delete itemData.id;
      }

      // testimonials is a many-to-many relationship through block_testimonial_slider_items junction table
      if ('testimonials' in itemData) {
        // The testimonials field contains junction objects with nested testimonials_id
        const currentTestimonials = ((itemData as Record<string, unknown>).testimonials as Array<Record<string, unknown>> | undefined) || [];
        const originalTestimonials = originalBlock?.item
          ? ((originalBlock.item as unknown as Record<string, unknown>)?.testimonials as Array<Record<string, unknown>> | undefined) || []
          : [];

        // Use new payload utility for M2M processing
        const testimonialsPayload = this.processBlockTestimonialsWithUtility(
          currentTestimonials,
          originalTestimonials
        );

        if (testimonialsPayload) {
          itemData.testimonials = testimonialsPayload;
        } else {
          // Remove testimonials if no changes
          if (!isTemp) {
            delete itemData.testimonials;
          }
        }
      }
    }

    if (isTemp) {
      // New block - add to create
      // Remove from update if accidentally added
      this.state.blocks.update = this.state.blocks.update.filter(u => u.id !== block.id);


      // Normalize item-level button_group for create (e.g., CTA)
      if ('button_group' in itemData) {
        const currentBG = (itemData as Record<string, unknown>).button_group as unknown;
        if (typeof currentBG === 'string') {
          // Existing reference
          // keep as is
        } else if (typeof currentBG === 'object' && currentBG !== null) {
          const bgObj = currentBG as Record<string, unknown>;
          const buttonsPayload = this.processBlockButtons(
            ((bgObj.buttons as Array<Record<string, unknown>>) || []),
            []
          );
          // Remove id/event_id/tenant_id for inline create
          const { id: _bgId, event_id: _e, tenant_id: _t, ...rest } = bgObj;
          (itemData as Record<string, unknown>).button_group = buttonsPayload
            ? { ...rest, buttons: buttonsPayload }
            : { ...rest };
        }
      }

      const createEntry = {
        collection: block.collection,
        sort: blockIndex,
        item: itemData as BlockItem | Record<string, unknown>,
      };

      // Check if already in create (by collection and sort)
      const existingIndex = this.state.blocks.create.findIndex(
        c => c.collection === block.collection && c.sort === blockIndex
      );

      if (existingIndex >= 0) {
        // Update existing create entry
        this.state.blocks.create[existingIndex] = createEntry;
      } else {
        // Add new create entry
        this.state.blocks.create.push(createEntry);
      }
    } else {
      // Existing block - check for changes
      // Remove from create if accidentally added
      this.state.blocks.create = this.state.blocks.create.filter(
        c => {
          const itemData = c.item as Record<string, unknown> | BlockItem | string;
          if (typeof itemData === 'object' && itemData !== null && 'id' in itemData) {
            return (itemData as { id?: string }).id !== block.id;
          }
          return true;
        }
      );

      const originalItem = originalBlock?.item as Record<string, unknown> | undefined;
      const updateEntry: {
        id: string;
        collection: string;
        sort?: number;
        item?: Record<string, unknown>;
      } = {
        id: block.id,
        collection: block.collection,
      };

      let hasChanges = false;

      // 1. Check sort order
      if (originalBlock && originalBlock.sort !== blockIndex) {
        updateEntry.sort = blockIndex;
        hasChanges = true;
      }

      // 2. Check item fields
      const changedItem: Record<string, unknown> = {};
      let hasItemChanges = false;

      // Fields that are always handled separately or ignored in direct comparison
      const ignoredFields = [
        'id',
        'translations',
        'rows',
        // 'button_group' must NOT be ignored so we can diff it properly
        'date_created',
        'date_updated',
        'user_created',
        'user_updated',
        'sort', // Sort is handled separately at block level
      ];

      // Only check if we have original item (existing block)
      if (originalItem) {
        // Check for changed scalar fields
        Object.keys(itemData).forEach(key => {
          if (ignoredFields.includes(key)) return;

          // Compare with original - only add if different (using normalized comparison)
          if (!this.isEqual(itemData[key], originalItem[key])) {
            console.log(`[PagePayloadManager] Field "${key}" changed in block ${block.id}:`, {
              original: originalItem[key],
              current: itemData[key],
              type: typeof itemData[key],
            });
            changedItem[key] = itemData[key];
            hasItemChanges = true;
          }
        });
      } else {
        // No original item found - this shouldn't happen for existing blocks
        console.warn(`[PagePayloadManager] No original item found for existing block ${block.id}`);
      }

      // Include complex fields if they have payloads (already processed above)
      if ('translations' in itemData) {
        changedItem.translations = itemData.translations;
        hasItemChanges = true;
      }
      if ('rows' in itemData) {
        changedItem.rows = itemData.rows;
        hasItemChanges = true;
      }

      // Process item-level button_group (e.g., CTA) with nested buttons CUD
      if ('button_group' in itemData) {
        const currentBG = (itemData as Record<string, unknown>).button_group as unknown;
        const originalBG = (originalItem as Record<string, unknown> | undefined)?.button_group as unknown;

        if (typeof currentBG === 'string' || currentBG === null || currentBG === undefined) {
          // Simple reference or cleared
          if (!this.isEqual(currentBG, originalBG)) {
            changedItem.button_group = currentBG as string | null | undefined;
            hasItemChanges = true;
          }
        } else if (typeof currentBG === 'object' && currentBG !== null) {
          const bgObj = currentBG as Record<string, unknown>;
          const bgId = (bgObj.id as string | undefined) || undefined;
          const isTempBG = !bgId || String(bgId).startsWith('temp-');

          const originalButtons =
            typeof originalBG === 'object' && originalBG !== null && 'buttons' in (originalBG as Record<string, unknown>)
              ? (((originalBG as Record<string, unknown>).buttons as Array<Record<string, unknown>>) || [])
              : [];

          const buttonsPayload = this.processBlockButtons(
            ((bgObj.buttons as Array<Record<string, unknown>>) || []),
            originalButtons
          );

          if (buttonsPayload) {
            if (isTempBG) {
              // New button_group - inline create without id/event_id/tenant_id
              const { id: _bgId, event_id: _e, tenant_id: _t, ...rest } = bgObj;
              changedItem.button_group = {
                ...rest,
                buttons: buttonsPayload,
              } as Record<string, unknown>;
            } else {
              // Existing - update by id with buttons payload
              changedItem.button_group = {
                id: bgId,
                buttons: buttonsPayload,
              } as Record<string, unknown>;
            }
            hasItemChanges = true;
          }
        }
      }


      // Always include block item id and context in item payload when there are item changes
      // This helps Directus link nested relations and avoids missing context on update
      const originalItemObj = (originalItem as Record<string, unknown> | undefined) || {};
      const currentItemObj = (itemData as Record<string, unknown>) || {};
      const blockItemId = (currentItemObj.id as string) || (originalItemObj.id as string);
      if (blockItemId) {
        changedItem.id = blockItemId;
      }
      const ctxEventId = (currentItemObj.event_id as number) ?? (originalItemObj.event_id as number);
      if (typeof ctxEventId === 'number') {
        changedItem.event_id = ctxEventId;
      }
      const ctxTenantId = (currentItemObj.tenant_id as number) ?? (originalItemObj.tenant_id as number);
      if (typeof ctxTenantId === 'number') {
        changedItem.tenant_id = ctxTenantId;
      }

      if (hasItemChanges) {
        updateEntry.item = changedItem;
        hasChanges = true;
        console.log(`[PagePayloadManager] Block ${block.id} item has changes:`, {
          changedFields: Object.keys(changedItem),
          changedItem,
        });
      }

      // Only add to update payload if there are actual changes
      if (hasChanges) {
        console.log(`[PagePayloadManager] Block ${block.id} has changes:`, {
          sortChanged: updateEntry.sort !== undefined,
          itemChanges: Object.keys(changedItem),
          itemValue: updateEntry.item ? 'present' : 'undefined',
        });

        const existingIndex = this.state.blocks.update.findIndex(u => u.id === block.id);
        if (existingIndex >= 0) {
          // Merge with existing update
          this.state.blocks.update[existingIndex] = {
            ...this.state.blocks.update[existingIndex],
            ...updateEntry,
          };
        } else {
          this.state.blocks.update.push(updateEntry);
        }
      } else {
        console.log(`[PagePayloadManager] Block ${block.id} has NO changes - removing from update`);
        // If no changes, ensure it's removed from update array (in case it was there before)
        this.state.blocks.update = this.state.blocks.update.filter(u => u.id !== block.id);
      }
    }
  }

  /**
   * Remove a block (mark for deletion)
   * Note: This is mainly used for tracking. Use rebuildBlocks() for accurate state.
   */
  removeBlock(blockId: string): void {
    const isTemp = String(blockId).startsWith('temp-');

    if (!isTemp) {
      // Remove from update array if there
      this.state.blocks.update = this.state.blocks.update.filter(u => u.id !== blockId);

      // Add to delete array if it's an original block
      const originalBlock = this.state.originalData.blocks?.find(b => b.id === blockId);
      if (originalBlock && !this.state.blocks.delete.includes(blockId)) {
        this.state.blocks.delete.push(blockId);
      }
    }
    // For temp blocks, they will be filtered out during rebuildBlocks()

    // Clean up block translations cache
    this.state.blockTranslationsCache.delete(blockId);
  }

  /**
   * Rebuild blocks payload from current blocks array
   * Useful when blocks are reordered or when you want to sync state
   */
  rebuildBlocks(
    currentBlocks: Block[],
    eventId: number,
    tenantId?: number
  ): void {
    const originalBlocks = this.state.originalData.blocks || [];
    const currentBlockIds = new Set(
      currentBlocks.map(b => b.id).filter(id => !String(id).startsWith('temp-'))
    );

    // Reset blocks payload
    this.state.blocks = {
      create: [],
      update: [],
      delete: [],
    };

    // Find blocks to delete (original blocks not in current)
    originalBlocks.forEach(originalBlock => {
      if (!currentBlockIds.has(originalBlock.id)) {
        this.state.blocks.delete.push(originalBlock.id);
      }
    });

    // Process current blocks
    currentBlocks.forEach((block, index) => {
      this.upsertBlock(block, index, eventId, tenantId);
    });
  }

  /**
   * Process block translations with create/update/delete structure
   */
  private processBlockTranslations(
    blockId: string,
    currentTranslations: Array<Record<string, unknown>>,
    originalTranslations: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: number[];
  } | undefined {
    if (!currentTranslations || currentTranslations.length === 0) {
      // If no current translations, check if we should delete all original
      if (originalTranslations.length > 0) {
        return {
          create: [],
          update: [],
          delete: originalTranslations.map(t => (t.id as number)).filter((id): id is number => typeof id === 'number'),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as number[],
    };

    // Map original translations by language code
    const originalTransMap = new Map<string, Record<string, unknown>>();
    originalTranslations.forEach(t => {
      const langCode = extractLanguageCode(
        typeof t.languages_code === 'object' && t.languages_code !== null && 'code' in t.languages_code
          ? (t.languages_code as { code: string }).code
          : t.languages_code as string
      );
      originalTransMap.set(langCode, t);
    });

    // Process current translations
    currentTranslations.forEach(trans => {
      const langCode = extractLanguageCode(
        typeof trans.languages_code === 'object' && trans.languages_code !== null && 'code' in trans.languages_code
          ? (trans.languages_code as { code: string }).code
          : trans.languages_code as string
      );

      const original = originalTransMap.get(langCode);

      // Session-only translations have id = 0 or no id (from temporary editor records)
      const isSessionOnly = !trans.id || trans.id === 0;
      const isOriginalSessionOnly = original && (!original.id || original.id === 0);

      console.log(`[processBlockTranslations] Processing ${langCode}: isSessionOnly=${isSessionOnly}, hasOriginal=${!!original}, isOriginalSessionOnly=${isOriginalSessionOnly}`);

      if (original && original.id && !isSessionOnly) {
        // Existing translation (with real id) - check if changed
        const { languages_code: _, id: __, ...transFields } = trans;
        const { languages_code: ___, id: ____, ...originalFields } = original;

        // Only compare fields that exist in current translation
        // Build update object with only changed fields
        const updateFields: Record<string, unknown> = {};
        let hasChanges = false;

        Object.keys(transFields).forEach(key => {
          // Skip system fields
          if (key === 'date_created' || key === 'date_updated' || key === 'user_created' || key === 'user_updated') {
            return;
          }

          // Use normalized comparison
          if (!this.isEqual(transFields[key], originalFields[key])) {
            updateFields[key] = transFields[key];
            hasChanges = true;
          }
        });

        // Only add to update if there are actual changes
        if (hasChanges) {
          console.log(`[processBlockTranslations] ${langCode} -> UPDATE (id: ${original.id})`);
          payload.update.push({
            id: original.id as number,
            ...updateFields,
          });
        }
        originalTransMap.delete(langCode);
      } else if (isSessionOnly && isOriginalSessionOnly) {
        // Both current and original are session-only (id=0)
        // Only create if there are actual changes in content
        const { languages_code: _, id: __, ...transFields } = trans;
        const { languages_code: ___, id: ____, ...originalFields } = original || {};

        let hasChanges = false;
        const createFields: Record<string, unknown> = {};

        Object.keys(transFields).forEach(key => {
          // Skip system fields
          if (key === 'date_created' || key === 'date_updated' || key === 'user_created' || key === 'user_updated') {
            return;
          }

          // Only include if changed or if original doesn't have it
          const originalValue = originalFields[key];
          if (!this.isEqual(transFields[key], originalValue)) {
            createFields[key] = transFields[key];
            hasChanges = true;
          }
        });

        // Only add to create if there are actual field changes
        if (hasChanges) {
          console.log(`[processBlockTranslations] ${langCode} -> CREATE (session-only, but has changes)`);
          payload.create.push({
            ...createFields,
            languages_code: typeof trans.languages_code === 'object' && trans.languages_code !== null && 'code' in trans.languages_code
              ? trans.languages_code as { code: string }
              : { code: trans.languages_code as string },
          });
        } else {
          console.log(`[processBlockTranslations] ${langCode} -> SKIP (session-only, no changes)`);
        }
        originalTransMap.delete(langCode);
      } else {
        // New translation - create (original doesn't exist or is different type)
        console.log(`[processBlockTranslations] ${langCode} -> CREATE (new translation)`);
        payload.create.push({
          ...trans,
          // Remove session-only id=0 before sending to API
          ...(isSessionOnly && { id: undefined }),
          languages_code: typeof trans.languages_code === 'object' && trans.languages_code !== null && 'code' in trans.languages_code
            ? trans.languages_code as { code: string }
            : { code: trans.languages_code as string },
        });
      }
    });

    // Remaining original translations should be deleted
    originalTransMap.forEach(trans => {
      if (trans.id && typeof trans.id === 'number') {
        payload.delete.push(trans.id);
      }
    });

    // Only return if there are changes
    console.log(`[processBlockTranslations] Final payload for block ${blockId}:`, {
      create: payload.create.length,
      update: payload.update.length,
      delete: payload.delete.length,
    });

    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      console.log(`[processBlockTranslations] No translation changes, returning undefined`);
      return undefined;
    }

    // Cache for potential reuse
    this.state.blockTranslationsCache.set(blockId, payload);

    return payload;
  }

  /**
   * Process block_columns rows with create/update/delete structure
   */
  private processBlockColumnsRows(
    blockId: string,
    currentRows: Array<Record<string, unknown>>,
    originalRows: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    if (!currentRows || currentRows.length === 0) {
      // If no current rows, check if we should delete all original
      if (originalRows.length > 0) {
        return {
          create: [],
          update: [],
          delete: originalRows
            .map(r => r.id as string)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-')),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as string[],
    };

    // Map original rows by ID
    const originalRowsMap = new Map<string, Record<string, unknown>>();
    originalRows.forEach(row => {
      if (row.id && typeof row.id === 'string' && !row.id.startsWith('temp-')) {
        originalRowsMap.set(row.id, row);
      }
    });

    // Process current rows
    currentRows.forEach(row => {
      const rowId = row.id as string | undefined;
      const isTemp = !rowId || rowId.startsWith('temp-');

      if (isTemp) {
        // New row - create
        // Remove temporary ID and foreign key (block_columns will be set automatically)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, block_columns: __, ...rowData } = row;

        // Process nested translations if exists
        const processedRow: Record<string, unknown> = { ...rowData };
        if (rowData.translations && Array.isArray(rowData.translations)) {
          processedRow.translations = {
            create: rowData.translations.map((t: Record<string, unknown>) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id: ___, block_columns_rows_id: ____, ...transData } = t;
              return {
                ...transData,
                languages_code: typeof transData.languages_code === 'object' && transData.languages_code !== null && 'code' in transData.languages_code
                  ? transData.languages_code as { code: string }
                  : { code: transData.languages_code as string },
              };
            }),
            update: [],
            delete: [],
          };
        }

        // Process nested button_group if exists
        if (rowData.button_group && typeof rowData.button_group === 'object' && rowData.button_group !== null) {
          const buttonGroup = rowData.button_group as Record<string, unknown>;
          const buttonGroupId = buttonGroup.id as string | undefined;
          const isTempButtonGroup = !buttonGroupId || String(buttonGroupId).startsWith('temp-');

          if (buttonGroup.buttons && Array.isArray(buttonGroup.buttons)) {
            // Format buttons payload
            const buttonsPayload = this.processBlockButtons(
              buttonGroup.buttons as Array<Record<string, unknown>>,
              [] // No original buttons for new rows
            );

            if (buttonsPayload) {
              if (isTempButtonGroup) {
                // New button_group - create inline, don't send ID, event_id, tenant_id
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _, event_id: __, tenant_id: ___, ...buttonGroupData } = buttonGroup;
                processedRow.button_group = {
                  ...buttonGroupData,
                  buttons: buttonsPayload,
                };
              } else {
                // Existing button_group - reference by ID and update buttons
                processedRow.button_group = buttonGroupId;
                // If button_group already exists, we might need to update it separately
                // For now, we'll create it inline if it's referenced but doesn't exist
                if (buttonsPayload.create.length > 0 || buttonsPayload.update.length > 0 || buttonsPayload.delete.length > 0) {
                  processedRow.button_group = {
                    id: buttonGroupId,
                    buttons: buttonsPayload,
                  };
                }
              }
            }
          } else if (!isTempButtonGroup) {
            // Existing button_group reference (just UUID string)
            processedRow.button_group = buttonGroupId;
          }
        }

        payload.create.push(processedRow);
      } else if (rowId && originalRowsMap.has(rowId)) {
        // Existing row - update
        const original = originalRowsMap.get(rowId)!;

        // Build update payload
        const updateData: Record<string, unknown> = {
          id: rowId,
        };

        // Update fields that changed
        Object.keys(row).forEach(key => {
          // Ignore special fields that are handled separately or system fields
          // IMPORTANT: 'sort' is NOT excluded - it must be included to track row order changes
          if (key === 'id' ||
            key === 'block_columns' ||
            key === 'translations' ||
            key === 'button_group' ||
            key === 'date_created' ||
            key === 'date_updated' ||
            key === 'user_created' ||
            key === 'user_updated') {
            return;
          }

          // Only add if value actually changed (using normalized comparison)
          // This includes: sort, image, image_position, and any other row fields
          if (!this.isEqual(row[key], original[key])) {
            updateData[key] = row[key];
          }
        });

        // Process translations if they exist
        if (row.translations && Array.isArray(row.translations)) {
          const originalTranslations = (original.translations as Array<Record<string, unknown>> | undefined) || [];
          const translationsPayload = this.processBlockTranslations(
            rowId,
            row.translations as Array<Record<string, unknown>>,
            originalTranslations
          );
          if (translationsPayload) {
            updateData.translations = translationsPayload;
          }
        }

        // Process button_group if it exists
        if (row.button_group) {
          if (typeof row.button_group === 'string') {
            // Existing button_group reference (UUID)
            updateData.button_group = row.button_group;
          } else if (typeof row.button_group === 'object' && row.button_group !== null) {
            const buttonGroup = row.button_group as Record<string, unknown>;
            const buttonGroupId = buttonGroup.id as string | undefined;
            const isTempButtonGroup = !buttonGroupId || String(buttonGroupId).startsWith('temp-');
            const originalButtonGroup = (original.button_group as Record<string, unknown> | string | undefined);

            if (buttonGroup.buttons && Array.isArray(buttonGroup.buttons)) {
              const originalButtons = typeof originalButtonGroup === 'object' && originalButtonGroup !== null
                ? (originalButtonGroup.buttons as Array<Record<string, unknown>> | undefined) || []
                : [];

              const buttonsPayload = this.processBlockButtons(
                buttonGroup.buttons as Array<Record<string, unknown>>,
                originalButtons
              );

              if (buttonsPayload) {
                if (isTempButtonGroup) {
                  // New button_group - create inline, don't send ID, event_id, tenant_id
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { id: _, event_id: __, tenant_id: ___, ...buttonGroupData } = buttonGroup;
                  updateData.button_group = {
                    ...buttonGroupData,
                    buttons: buttonsPayload,
                  };
                } else {
                  // Existing button_group - update with buttons
                  updateData.button_group = {
                    id: buttonGroupId,
                    buttons: buttonsPayload,
                  };
                }
              }
            } else if (!isTempButtonGroup && buttonGroupId) {
              // Just a reference
              updateData.button_group = buttonGroupId;
            }
          }
        }

        if (Object.keys(updateData).length > 1) { // More than just 'id'
          payload.update.push(updateData);
        }
        originalRowsMap.delete(rowId);
      }
    });

    // Remaining original rows should be deleted
    originalRowsMap.forEach(row => {
      if (row.id && typeof row.id === 'string' && !row.id.startsWith('temp-')) {
        payload.delete.push(row.id);
      }
    });

    // Only return if there are changes
    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      return undefined;
    }

    return payload;
  }

  /**
   * Process button_group buttons with create/update/delete structure
   */
  private processBlockButtons(
    currentButtons: Array<Record<string, unknown>>,
    originalButtons: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    if (!currentButtons || currentButtons.length === 0) {
      if (originalButtons.length > 0) {
        return {
          create: [],
          update: [],
          delete: originalButtons
            .map(b => b.id as string)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-')),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as string[],
    };

    // Map original buttons by ID
    const originalButtonsMap = new Map<string, Record<string, unknown>>();
    originalButtons.forEach(button => {
      if (button.id && typeof button.id === 'string' && !button.id.startsWith('temp-')) {
        originalButtonsMap.set(button.id, button);
      }
    });

    // Process current buttons
    currentButtons.forEach(button => {
      const buttonId = button.id as string | undefined;
      const isTemp = !buttonId || buttonId.startsWith('temp-');

      if (isTemp) {
        // New button - create
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, button_group: __, ...buttonData } = button;

        // Process button translations
        if (buttonData.translations && Array.isArray(buttonData.translations)) {
          buttonData.translations = {
            create: buttonData.translations.map((t: Record<string, unknown>) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id: ___, block_button_id: ____, ...transData } = t;
              return {
                ...transData,
                languages_code: typeof transData.languages_code === 'object' && transData.languages_code !== null && 'code' in transData.languages_code
                  ? transData.languages_code as { code: string }
                  : { code: transData.languages_code as string },
              };
            }),
            update: [],
            delete: [],
          };
        }

        payload.create.push(buttonData);
      } else if (buttonId && originalButtonsMap.has(buttonId)) {
        // Existing button - update
        const original = originalButtonsMap.get(buttonId)!;

        const updateData: Record<string, unknown> = {
          id: buttonId,
        };

        // Update fields that changed
        Object.keys(button).forEach(key => {
          // Ignore special fields that are handled separately
          if (key === 'id' ||
            key === 'button_group' ||
            key === 'translations' ||
            key === 'date_created' ||
            key === 'date_updated' ||
            key === 'user_created' ||
            key === 'user_updated' ||
            key === 'sort') {
            return;
          }

          // Only add if value actually changed (using normalized comparison)
          if (!this.isEqual(button[key], original[key])) {
            updateData[key] = button[key];
          }
        });

        // Process translations
        if (button.translations && Array.isArray(button.translations)) {
          const originalTranslations = (original.translations as Array<Record<string, unknown>> | undefined) || [];
          const translationsPayload = this.processBlockTranslations(
            buttonId,
            button.translations as Array<Record<string, unknown>>,
            originalTranslations
          );
          if (translationsPayload) {
            updateData.translations = translationsPayload;
          }
        }

        if (Object.keys(updateData).length > 1) {
          payload.update.push(updateData);
        }
        originalButtonsMap.delete(buttonId);
      }
    });

    // Remaining original buttons should be deleted
    originalButtonsMap.forEach(button => {
      if (button.id && typeof button.id === 'string' && !button.id.startsWith('temp-')) {
        payload.delete.push(button.id);
      }
    });

    // Only return if there are changes
    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      return undefined;
    }

    return payload;
  }

  /**
   * Process gallery_items with create/update/delete structure
   * Handles adding/removing images from gallery blocks
   */
  private processGalleryItems(
    currentItems: Array<Record<string, unknown>>,
    originalItems: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    if (!currentItems || currentItems.length === 0) {
      // If no current items, check if we should delete all original
      if (originalItems.length > 0) {
        // Delete all original gallery items (by their junction table IDs)
        return {
          create: [],
          update: [],
          delete: originalItems
            .map(item => item.id as string)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-')),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as string[],
    };

    // Create a map of original items by ID for quick lookup
    const originalItemsMap = new Map<string, Record<string, unknown>>();
    originalItems.forEach(item => {
      const id = item.id as string | undefined;
      if (id) {
        originalItemsMap.set(id, item);
      }
    });

    // Process current items
    currentItems.forEach((item) => {
      const itemId = item.id as string | undefined;
      const fileId = item.directus_files_id as string | undefined;

      if (!fileId) return; // Skip if no file ID

      if (!itemId || itemId.startsWith('temp-')) {
        // New item - add to create
        payload.create.push({
          block_gallery_id: '+', // Reference to current block
          directus_files_id: {
            id: fileId,
          },
        });
      } else {
        // Existing item - check if changed
        const original = originalItemsMap.get(itemId);
        if (!original || original.directus_files_id !== fileId) {
          // Item changed - add to update
          payload.update.push({
            id: itemId,
            directus_files_id: {
              id: fileId,
            },
          });
        }
        // Mark as processed
        originalItemsMap.delete(itemId);
      }
    });

    // Remaining original items should be deleted
    originalItemsMap.forEach((item) => {
      const id = item.id as string | undefined;
      if (id && !id.startsWith('temp-')) {
        payload.delete.push(id);
      }
    });

    // Only return if there are changes
    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      return undefined;
    }

    return payload;
  }

  /**
   * Process logo cloud logos (junction table) with create/update/delete structure
   * Similar to gallery items but for block_logocloud_logos junction table
   */
  private processLogoCloudLogos(
    currentLogos: Array<Record<string, unknown>>,
    originalLogos: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    if (!currentLogos || currentLogos.length === 0) {
      // If no current logos, check if we should delete all original
      if (originalLogos.length > 0) {
        // Delete all original logos (by their junction table IDs)
        return {
          create: [],
          update: [],
          delete: originalLogos
            .map(logo => logo.id as string)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-')),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as string[],
    };

    // Create a map of original logos by ID for quick lookup
    const originalLogosMap = new Map<string, Record<string, unknown>>();
    originalLogos.forEach(logo => {
      const id = logo.id as string | undefined;
      if (id) {
        originalLogosMap.set(id, logo);
      }
    });

    // Process current logos
    currentLogos.forEach((logo, index) => {
      const logoId = logo.id as string | undefined;
      const fileId = logo.directus_files_id as string | undefined;

      if (!fileId) return; // Skip if no file ID

      if (!logoId || logoId.startsWith('temp-')) {
        // New logo - add to create
        payload.create.push({
          block_logocloud_id: '+', // Reference to current block
          directus_files_id: {
            id: fileId,
          },
          sort: index,
        });
      } else {
        // Existing logo - check if changed
        const original = originalLogosMap.get(logoId);
        const originalFileId = original?.directus_files_id as string | undefined;
        const originalSort = original?.sort as number | undefined;

        if (!original || originalFileId !== fileId || originalSort !== index) {
          // Logo changed - add to update
          payload.update.push({
            id: logoId,
            directus_files_id: {
              id: fileId,
            },
            sort: index,
          });
        }
        // Mark as processed
        originalLogosMap.delete(logoId);
      }
    });

    // Remaining original logos should be deleted
    originalLogosMap.forEach((logo) => {
      const id = logo.id as string | undefined;
      if (id && !id.startsWith('temp-')) {
        payload.delete.push(id);
      }
    });

    // Only return if there are changes
    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      return undefined;
    }

    return payload;
  }

  /**
   * Process block testimonials items (M2M junction table) with create/update/delete structure
   * Handles nested testimonials_id objects and strips temp IDs
   */
  private processBlockTestimonialsItems(
    currentItems: Array<Record<string, unknown>>,
    originalItems: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    if (!currentItems || currentItems.length === 0) {
      // If no current items, check if we should delete all original
      if (originalItems.length > 0) {
        // Delete all original junction items (by their junction table IDs)
        return {
          create: [],
          update: [],
          delete: originalItems
            .map(item => item.id as string)
            .filter((id): id is string => typeof id === 'string' && !id.startsWith('temp-')),
        };
      }
      return undefined;
    }

    const payload = {
      create: [] as Array<Record<string, unknown>>,
      update: [] as Array<Record<string, unknown>>,
      delete: [] as string[],
    };

    // Create a map of original items by junction ID for quick lookup
    const originalItemsMap = new Map<string, Record<string, unknown>>();
    originalItems.forEach(item => {
      const id = item.id as string | undefined;
      if (id && !id.startsWith('temp-')) {
        originalItemsMap.set(id, item);
      }
    });

    // Process current items
    currentItems.forEach((junctionItem, index) => {
      const junctionId = junctionItem.id as string | undefined;
      const isNewJunction = !junctionId || junctionId.startsWith('temp-');

      // Get the nested testimonials_id object
      const testimonialData = junctionItem.testimonials_id as Record<string, unknown> | undefined;
      if (!testimonialData) return; // Skip if no nested data

      const testimonialId = testimonialData.id as string | undefined;
      const isNewTestimonial = !testimonialId || testimonialId.toString().startsWith('temp-');

      if (isNewJunction) {
        // New junction - create with nested testimonial
        const cleanTestimonial: Record<string, unknown> = {
          status: testimonialData.status,
          company: testimonialData.company,
          company_logo: testimonialData.company_logo,
          link: testimonialData.link,
          sort: testimonialData.sort,
          image: testimonialData.image,
        };

        // Only include testimonial ID if it's not temp
        if (!isNewTestimonial) {
          cleanTestimonial.id = testimonialId;
        }

        // Process translations - strip temp IDs
        if (Array.isArray(testimonialData.translations)) {
          cleanTestimonial.translations = {
            create: testimonialData.translations.map((trans: Record<string, unknown>) => {
              const transId = trans.id;
              const isNewTrans = !transId || transId.toString().startsWith('temp-');

              const cleanTrans: Record<string, unknown> = {
                languages_code: trans.languages_code,
                title: trans.title || '',
                subtitle: trans.subtitle || '',
                content: trans.content || '',
              };

              // Only include translation ID if it's not temp
              if (!isNewTrans) {
                cleanTrans.id = transId;
              }

              return cleanTrans;
            }),
            update: [],
            delete: [],
          };
        }

        payload.create.push({
          sort: index,
          testimonials_id: cleanTestimonial,
        });
      } else {
        // Existing junction - check for changes
        const original = originalItemsMap.get(junctionId);
        const originalSort = original?.sort as number | undefined;

        // Build update only if something changed
        const hasChanges = originalSort !== index; // Check if sort changed

        if (hasChanges) {
          payload.update.push({
            id: junctionId,
            sort: index,
          });
        }

        // Mark as processed
        originalItemsMap.delete(junctionId);
      }
    });

    // Remaining original items should be deleted
    originalItemsMap.forEach((item) => {
      const id = item.id as string | undefined;
      if (id && !id.startsWith('temp-')) {
        payload.delete.push(id);
      }
    });

    // Only return if there are changes
    if (payload.create.length === 0 && payload.update.length === 0 && payload.delete.length === 0) {
      return undefined;
    }

    return payload;
  }

  /**
   * Process block testimonials items using new payload utility (processM2M)
   * This refactored version uses the centralized payload processing library
   */
  private processBlockTestimonialsWithUtility(
    block: Array<Record<string, unknown>>,
    originalBlock: Array<Record<string, unknown>>
  ) {
    return processM2M(
      block,
      originalBlock,
      BlockTestimonialsSchema,
      'testimonials'
    );
  }

  private processBlockLogoCloudWithUtility(
    block: Array<Record<string, unknown>>,
    originalBlock: Array<Record<string, unknown>>
  ) {
    return processM2M(
      block,
      originalBlock,
      BlockLogocloudSchema,
      'logos'
    );
  }

  private processBlockGalleryWithUtility(
    block: Array<Record<string, unknown>>,
    originalBlock: Array<Record<string, unknown>>
  ) {
    return processM2M(
      block,
      originalBlock,
      BlockGallerySchema,
      'gallery_items'
    );
  }

  /**
   * Process block columns rows using new payload utility (processO2M)
   * This refactored version uses the centralized payload processing library
   */
  private processBlockColumnsRowsWithUtility(
    currentRows: Array<Record<string, unknown>>,
    originalRows: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    // Get the rows relationship definition from the schema
    const rowsRel = BlockColumnsSchema.relationships?.find(
      r => r.field === 'rows'
    );

    if (!rowsRel) {
      console.error('[PagePayloadManager] Rows relationship not found in BlockColumnsSchema');
      return undefined;
    }

    // Use the centralized processO2M utility
    const payload = processO2M(currentRows, originalRows, rowsRel);

    // processO2M returns undefined if no changes
    return payload;
  }

  private processBlockStepsWithUtility(
    currentSteps: Array<Record<string, unknown>>,
    originalSteps: Array<Record<string, unknown>>
  ): {
    create: Array<Record<string, unknown>>;
    update: Array<Record<string, unknown>>;
    delete: string[];
  } | undefined {
    // Get the steps relationship definition from the schema
    const stepsRel = BlockStepsSchema.relationships?.find(
      r => r.field === 'steps'
    );

    if (!stepsRel) {
      console.error('[PagePayloadManager] Steps relationship not found in BlockStepsSchema');
      return undefined;
    }

    return processO2M(currentSteps, originalSteps, stepsRel);
  }



  /**
   * Get final payload ready for API submission
   */
  getPayload(): PageUpdatePayload {
    console.log('[PagePayloadManager] getPayload - current state:', {
      translations: this.state.translations,
      blocks: {
        create: this.state.blocks.create.length,
        update: this.state.blocks.update.length,
        delete: this.state.blocks.delete.length,
      },
    });

    const payload: PageUpdatePayload = {};

    // Add direct fields if changed
    if (this.state.sort !== undefined) {
      payload.sort = this.state.sort;
    }
    if (this.state.status !== undefined) {
      payload.status = this.state.status;
    }
    if (this.state.site_id !== undefined) {
      payload.site_id = this.state.site_id;
    }

    // Add translations if there are changes
    if (
      this.state.translations.create.length > 0 ||
      this.state.translations.update.length > 0 ||
      this.state.translations.delete.length > 0
    ) {
      const translationsPayload: PageUpdatePayload['translations'] = {};

      if (this.state.translations.create.length > 0) {
        // Ensure all create entries have pages_id
        translationsPayload.create = this.state.translations.create.map(entry => ({
          ...entry,
          pages_id: entry.pages_id || this.pageId!,
        }));
      }

      if (this.state.translations.update.length > 0) {
        // Remove languages_code from update entries (Directus doesn't need it for updates)
        translationsPayload.update = this.state.translations.update.map(update => {
          const updateTyped = update as Record<string, unknown>;
          if ('languages_code' in updateTyped) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { languages_code: _, ...updateWithoutLangCode } = updateTyped;
            return updateWithoutLangCode as { id: number; title?: string | null; permalink?: string | null };
          }
          return update;
        });
      }

      if (this.state.translations.delete.length > 0) {
        translationsPayload.delete = this.state.translations.delete;
      }

      payload.translations = translationsPayload;
    }

    // Add blocks if there are changes
    if (
      this.state.blocks.create.length > 0 ||
      this.state.blocks.update.length > 0 ||
      this.state.blocks.delete.length > 0
    ) {
      const blocksPayload: PageUpdatePayload['blocks'] = {};

      if (this.state.blocks.create.length > 0) {
        blocksPayload.create = this.state.blocks.create as Array<{
          collection: BlockCollectionType | string;
          sort: number;
          item: BlockItem | string;
        }>;
      }

      if (this.state.blocks.update.length > 0) {
        blocksPayload.update = this.state.blocks.update as Array<{
          id: string;
          collection?: BlockCollectionType | string;
          sort?: number;
          item?: BlockItem | string;
        }>;
      }

      if (this.state.blocks.delete.length > 0) {
        blocksPayload.delete = this.state.blocks.delete;
      }

      payload.blocks = blocksPayload;
    }

    return payload;
  }

  /**
   * Check if there are any pending changes
   */
  hasChanges(): boolean {
    return (
      this.state.sort !== undefined ||
      this.state.status !== undefined ||
      this.state.site_id !== undefined ||
      this.state.translations.create.length > 0 ||
      this.state.translations.update.length > 0 ||
      this.state.translations.delete.length > 0 ||
      this.state.blocks.create.length > 0 ||
      this.state.blocks.update.length > 0 ||
      this.state.blocks.delete.length > 0
    );
  }

  /**
   * Reset all changes (clear payload)
   */
  reset(): void {
    this.state.translations = { create: [], update: [], delete: [] };
    this.state.blocks = { create: [], update: [], delete: [] };
    this.state.sort = undefined;
    this.state.status = undefined;
    this.state.site_id = undefined;
    this.state.blockTranslationsCache.clear();
  }

  /**
   * Get current state (for debugging)
   */
  getState(): Readonly<PagePayloadState> {
    return { ...this.state };
  }
}

