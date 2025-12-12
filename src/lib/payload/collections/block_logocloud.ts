/**
 * Collection schema for block_logocloud
 * 
 * Logo cloud block with M2M logos relationship
 */

import type { CollectionSchema } from './types';

// TODO: Add BlockLogocloud type to directus-collections.ts
export const BlockLogocloudSchema: CollectionSchema<any> = {
    collection: 'block_logocloud',

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
            field: 'logos',
            type: 'M2M',
            targetCollection: 'directus_files',
            junctionTable: 'block_logocloud_logos',
            junctionField: 'directus_files_id',
            inverseField: 'block_logocloud_id',
        },
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_logocloud_translations',
            inverseField: 'block_logocloud_id',
        },
    ],
};
