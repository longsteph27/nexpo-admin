/**
 * Collection schema for block_columns_rows entity
 * 
 * Nested entity for block_columns (O2M relationship)
 */

import type { BlockColumnsRows } from '@/types/directus-collections';
import type { CollectionSchema } from './types';

export const BlockColumnsRowsSchema: CollectionSchema<BlockColumnsRows> = {
    collection: 'block_columns_rows',

    // Simple fields
    simpleFields: [
        'sort',
        'image',
        'image_position',
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
            field: 'block_columns',
            references: 'block_columns',
        },
    ],

    // Relationships
    relationships: [
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_columns_rows_translations',
            inverseField: 'block_columns_rows_id',
        },
        {
            field: 'button_group',
            type: 'M2O',
            targetCollection: 'button_group',
            inverseField: 'id',
        },
    ],
};
