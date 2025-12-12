/**
 * Collection schema for block_step_items entity
 * 
 * Nested entity for block_steps (O2M relationship)
 */

import type { BlockStepItem } from '@/types/directus-collections';
import type { CollectionSchema } from './types';

export const BlockStepItemsSchema: CollectionSchema<BlockStepItem> = {
    collection: 'block_step_items',

    // Simple fields
    simpleFields: [
        'sort',
        'title',
        'content',
        'image',
        'event_id',
        'tenant_id',
    ],

    // Auto-generated fields
    autoGenFields: [
        'id',
        'date_created',
        'date_updated',
        'user_created',
        'user_updated',
    ],

    // Foreign keys
    foreignKeys: [
        {
            field: 'image',
            references: 'directus_files',
        },
        {
            field: 'button_group',
            references: 'block_button_group',
        },
        {
            field: 'block_steps',
            references: 'block_steps',
        },
    ],

    // Relationships
    relationships: [
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_step_items_translations',
            inverseField: 'block_step_items_id',
        },
    ],
};
