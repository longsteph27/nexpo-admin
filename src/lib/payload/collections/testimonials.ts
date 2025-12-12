/**
 * Collection schema for testimonials entity
 * 
 * This is a nested entity referenced by block_testimonials through M2M junction
 */

import type { CollectionSchema } from './types';

// TODO: Add Testimonial type to directus-collections.ts
export const TestimonialsSchema: CollectionSchema<any> = {
    collection: 'testimonials',

    // Simple fields - primitive values copied directly
    simpleFields: [
        'status',
        'company',
        'company_logo',
        'link',
        'sort',
        'image',
    ],

    // Auto-generated fields - stripped from payload
    autoGenFields: [
        'id',
        'date_created',
        'date_updated',
        'user_created',
        'user_updated',
    ],

    // Foreign key references
    foreignKeys: [
        {
            field: 'company_logo',
            references: 'directus_files',
        },
        {
            field: 'image',
            references: 'directus_files',
        },
    ],

    // Nested relationships
    relationships: [
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'testimonials_translations',
            inverseField: 'testimonials_id',
        },
    ],
};
