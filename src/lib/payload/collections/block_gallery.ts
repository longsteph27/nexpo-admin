/**
 * Collection schema for block_gallery
 * 
 * Gallery block with M2M gallery_items relationship
 */

import type { CollectionSchema } from './types';

export const BlockGallerySchema: CollectionSchema<any> = {
    collection: 'block_gallery',

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
            field: 'gallery_items',
            type: 'M2M',
            targetCollection: 'directus_files',
            junctionTable: 'block_gallery_files',
            junctionField: 'directus_files_id',
            inverseField: 'block_gallery_id',
        },
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_gallery_translations',
            inverseField: 'block_gallery_id',
        },
    ],
};
