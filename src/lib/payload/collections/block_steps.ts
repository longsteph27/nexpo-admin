/**
 * Collection schema for block_steps
 * 
 * Steps block with O2M steps relationship
 */

import type { BlockSteps } from '@/types/directus-collections';
import type { CollectionSchema } from './types';
import { BlockStepItemsSchema } from './block_step_items';

export const BlockStepsSchema: CollectionSchema<BlockSteps> = {
    collection: 'block_steps',

    // Simple fields
    simpleFields: [
        'alternate_image_position',
        'show_step_numbers',
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

    // Relationships
    relationships: [
        {
            field: 'steps',
            type: 'O2M',
            targetCollection: 'block_step_items',
            inverseField: 'block_steps',
            nestedSchema: BlockStepItemsSchema,
        },
        {
            field: 'translations',
            type: 'O2M',
            targetCollection: 'block_steps_translations',
            inverseField: 'block_steps_id',
        },
    ],
};
