/**
 * Payload generation utilities
 * 
 * Generate create/update/delete payloads from data diffs
 */

import { isTempId } from './validators';
import type { DataDiff, CUDStructure } from './types';
import type { CollectionSchema } from './collections/types';

/**
 * Strip specified fields from an object
 * 
 * @param obj - Object to strip fields from
 * @param fields - Array of field names to remove
 * @returns New object without specified fields
 */
export function stripFields<T extends Record<string, any>>(
    obj: T,
    fields: string[]
): Partial<T> {
    const result = { ...obj };
    fields.forEach(field => delete result[field]);
    return result;
}

/**
 * Generate create/update/delete payload from diff
 * 
 * Converts a data diff into Directus-compatible payload structure.
 * - CREATE: Items with temp IDs, stripped of auto-generated fields
 * - UPDATE: Items with changed fields only
 * - DELETE: IDs of removed items
 * 
 * @param diff - Data difference from compareData
 * @param schema - Collection schema for field mapping
 * @returns CUD structure or undefined if no changes
 * 
 * @example
 * const payload = generatePayload(diff, TestimonialsSchema);
 * // { create: [...], update: [...], delete: [...] }
 */
export function generatePayload<T extends Record<string, any>>(
    diff: DataDiff<T>,
    schema: CollectionSchema<T>
): CUDStructure<T> | undefined {
    const result: CUDStructure<T> = {
        create: [],
        update: [],
        delete: [],
    };

    // Process added items (CREATE)
    diff.added.forEach(item => {
        // Strip auto-generated fields and temp ID
        const fieldsToStrip = [
            ...(schema.autoGenFields as string[]),
            'id', // Remove temp ID
        ];
        const clean = stripFields(item, fieldsToStrip) as T;
        result.create.push(clean);
    });

    // Process changed items (UPDATE)
    // Group changes by ID
    const updateMap = new Map<string, Partial<T>>();
    diff.changed.forEach(({ path, new: value }) => {
        const [id, field] = path.split('.');
        if (!id || !field) return;

        if (!updateMap.has(id)) {
            updateMap.set(id, { id } as any);
        }
        const update = updateMap.get(id)!;
        (update as any)[field] = value;
    });
    result.update = Array.from(updateMap.values());

    // Process removed items (DELETE)
    result.delete = diff.removed
        .map(item => item.id as string)
        .filter(id => id && !isTempId(id));

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
