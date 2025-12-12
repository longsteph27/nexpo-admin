/**
 * Relationship processing utilities
 * 
 * Handle M2M, O2M, and M2O relationships using collection schemas
 */

import { isEqual } from 'lodash';
import { isTempId } from './validators';
import { stripFields } from './generate';
import type { CUDStructure } from './types';
import type { CollectionSchema, RelationshipDef } from './collections/types';

/**
 * Process Many-to-Many relationship
 * 
 * Handles junction table with nested entities using collection schema.
 * Schema provides accurate field names (junctionField, nestedSchema).
 * 
 * @param current - Current junction items from form
 * @param original - Original junction items from backend
 * @param relationshipDef - Relationship definition from schema
 * @returns CUD structure or undefined if no changes
 * 
 * @example
 * const testimonialsRel = BlockTestimonialsSchema.relationships.find(r => r.field === 'testimonials');
 * const payload = processM2M(currentItems, originalItems, testimonialsRel);
 */
export function processM2M(
    current: Array<Record<string, any>>,
    original: Array<Record<string, any>>,
    schemaOrDef: CollectionSchema<any> | RelationshipDef,
    fieldName?: string
): CUDStructure | undefined {
    let relationshipDef: RelationshipDef;

    if (fieldName && 'relationships' in schemaOrDef) {
        const found = schemaOrDef.relationships?.find(r => r.field === fieldName);
        if (!found) {
            console.error(`[processM2M] Relationship ${fieldName} not found in schema`);
            return undefined;
        }
        relationshipDef = found;
    } else {
        relationshipDef = schemaOrDef as RelationshipDef;
    }

    if (!relationshipDef || relationshipDef.type !== 'M2M') {
        throw new Error('Relationship must be M2M type');
    }

    const result: CUDStructure = {
        create: [],
        update: [],
        delete: [],
    };

    const { junctionField, nestedSchema } = relationshipDef;

    if (!junctionField) {
        throw new Error('M2M relationship must have junctionField');
    }

    // Map original junction items by ID
    const originalJunctionMap = new Map(
        original
            .filter(item => item.id && !isTempId(item.id))
            .map(item => [item.id, item])
    );

    // Process current junction items
    current.forEach((junctionItem, index) => {
        const junctionId = junctionItem.id;
        const isNewJunction = !junctionId || isTempId(junctionId);

        // Get nested data using accurate field name from schema
        const nestedData = junctionItem[junctionField];

        if (isNewJunction) {
            // CREATE: New junction with nested item or simple value
            // If nestedSchema exists, process nested entity (e.g., testimonials)
            // Otherwise, use value directly (e.g., file IDs)
            const fieldValue = nestedSchema
                ? processNestedItem(nestedData, nestedSchema)
                : nestedData;

            result.create.push({
                sort: index,
                [junctionField]: fieldValue,
            });
        } else {
            // UPDATE: Check if sort changed
            const original = originalJunctionMap.get(junctionId);
            if (original && original.sort !== index) {
                result.update.push({
                    id: junctionId,
                    sort: index,
                });
            }
            originalJunctionMap.delete(junctionId);
        }
    });

    // DELETE: Remaining junction items
    result.delete = Array.from(originalJunctionMap.keys());

    // Return undefined if no changes
    if (
        result.create.length === 0 &&
        result.update.length === 0 &&
        result.delete.length === 0
    ) {
        return undefined;
    }

    return result;
}

/**
 * Process One-to-Many relationship
 * 
 * Handles nested items (e.g., translations) using schema.
 * 
 * @param current - Current items from form
 * @param original - Original items from backend
 * @param relationshipDef - Relationship definition from schema
 * @returns CUD structure or undefined if no changes
 */
export function processO2M(
    current: Array<Record<string, any>>,
    original: Array<Record<string, any>>,
    relationshipDef: RelationshipDef
): CUDStructure | undefined {
    if (!relationshipDef || relationshipDef.type !== 'O2M') {
        throw new Error('Relationship must be O2M type');
    }

    const result: CUDStructure = {
        create: [],
        update: [],
        delete: [],
    };

    // Map original items by ID
    const originalMap = new Map(
        original
            .filter(item => item.id && !isTempId(item.id))
            .map(item => [item.id, item])
    );

    // Process current items
    current.forEach(item => {
        const itemId = item.id;
        const isNewItem = !itemId || isTempId(itemId);

        if (isNewItem) {
            // CREATE: Strip auto-generated fields and temp ID
            const clean = { ...item };
            delete clean.id;
            delete clean.date_created;
            delete clean.date_updated;
            delete clean.user_created;
            delete clean.user_updated;

            // Remove inverse field (will be set by Directus)
            if (relationshipDef.inverseField) {
                delete clean[relationshipDef.inverseField];
            }

            result.create.push(clean);
        } else {
            // UPDATE or unchanged
            const original = originalMap.get(itemId);
            if (original) {
                // Check for actual changes using strict deep equality
                // This prevents sending updates when data hasn't changed
                if (!isEqual(item, original)) {
                    result.update.push(item);
                }
                originalMap.delete(itemId);
            }
        }
    });

    // DELETE: Remaining items
    result.delete = Array.from(originalMap.keys());

    if (
        result.create.length === 0 &&
        result.update.length === 0 &&
        result.delete.length === 0
    ) {
        return undefined;
    }

    return result;
}

/**
 * Process nested item using its schema
 * 
 * Ensures only correct fields are included in payload.
 * Handles nested relationships recursively.
 * 
 * @param data - Nested item data
 * @param schema - Collection schema for the nested entity
 * @returns Clean nested object ready for payload
 */
export function processNestedItem(
    data: Record<string, any>,
    schema: CollectionSchema
): Record<string, any> {
    if (!data) return {};

    const result: Record<string, any> = {};

    // Copy simple fields from schema
    schema.simpleFields.forEach(field => {
        const fieldName = field as string;
        if (fieldName in data) {
            result[fieldName] = data[fieldName];
        }
    });

    // Include ID only if it's not a temp ID
    const dataId = data.id;
    if (dataId && !isTempId(dataId)) {
        result.id = dataId;
    }

    // Process nested relationships
    schema.relationships?.forEach(rel => {
        const relFieldName = rel.field as string;
        const relData = data[relFieldName];

        if (!relData) return;

        if (rel.type === 'O2M' && Array.isArray(relData)) {
            // Handle O2M (e.g., translations)
            result[relFieldName] = {
                create: relData
                    .filter(item => !item.id || isTempId(item.id))
                    .map(item => {
                        const clean = { ...item };
                        // Strip auto-generated fields
                        delete clean.id;
                        delete clean.date_created;
                        delete clean.date_updated;
                        delete clean.user_created;
                        delete clean.user_updated;
                        // Remove inverse field
                        if (rel.inverseField) {
                            delete clean[rel.inverseField];
                        }
                        return clean;
                    }),
                update: [],
                delete: [],
            };
        } else if (rel.type === 'M2M' && Array.isArray(relData) && rel.nestedSchema) {
            // Recursive M2M handling
            const nestedPayload = processM2M(relData, [], rel);
            if (nestedPayload) {
                result[relFieldName] = nestedPayload;
            }
        } else if (rel.type === 'M2O') {
            // Just include the reference ID
            if (typeof relData === 'string') {
                result[relFieldName] = relData;
            } else if (relData.id && !isTempId(relData.id)) {
                result[relFieldName] = relData.id;
            }
        }
    });

    return result;
}
