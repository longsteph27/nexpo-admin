/**
 * Collection schema for block_columns
 * 
 * Columns block with O2M rows relationship
 */

import type { BlockColumns } from '@/types/directus-collections';
import type { CollectionSchema } from './types';
import { BlockColumnsRowsSchema } from './block_columns_rows';

export const BlockColumnsSchema: CollectionSchema<BlockColumns> = {
    collection: 'block_columns',

    // Simple fields
    simpleFields: [
        'status',
        'sort',
    ],

    // Auto-generated fields
    autoGenFields: [
        'id',
        'date_created',
        'date_updated',
        'user_created',
        'user_updated',
    ],

    // Relationships
    relationships: [
        {
            field: 'rows',
            type: 'O2M',
            targetCollection: 'block_columns_rows',
            inverseField: 'block_columns',
            nestedSchema: BlockColumnsRowsSchema,
        },
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_columns_translations',
            inverseField: 'block_columns_id',
        },
    ],
};
