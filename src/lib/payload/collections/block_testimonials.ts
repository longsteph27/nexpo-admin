/**
 * Collection schema for block_testimonials
 * 
 * Testimonials block with M2M relationship to testimonials entities
 */

import type { CollectionSchema } from './types';
import { TestimonialsSchema } from './testimonials';

// TODO: Add BlockTestimonials type to directus-collections.ts
export const BlockTestimonialsSchema: CollectionSchema<any> = {
    collection: 'block_testimonials',

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
            field: 'testimonials',
            type: 'M2M',
            targetCollection: 'testimonials',
            junctionTable: 'block_testimonial_slider_items',
            junctionField: 'testimonials_id',
            inverseField: 'block_testimonials',
            nestedSchema: TestimonialsSchema,
        },
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_testimonials_translations',
            inverseField: 'block_testimonials_id',
        },
    ],
};
