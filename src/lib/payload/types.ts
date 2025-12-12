/**
 * Type definitions for payload processing
 */

/**
 * Create/Update/Delete structure for Directus payload
 * 
 * This is the standard format Directus expects for nested relationship updates
 */
export interface CUDStructure<T = any> {
    /** Items to create (no ID or temp ID) */
    create: T[];

    /** Items to update (with real ID) */
    update: Partial<T>[];

    /** IDs of items to delete */
    delete: string[];
}

/**
 * Data difference result from comparison
 * 
 * Tracks what changed between original and current data
 */
export interface DataDiff<T> {
    /** Fields that changed with old/new values */
    changed: Array<{
        path: string;  // e.g., 'item-id.fieldName'
        old: any;
        new: any;
    }>;

    /** Newly added items (temp IDs) */
    added: T[];

    /** Removed items (real IDs) */
    removed: T[];
}

/**
 * Payload generation options
 */
export interface PayloadOptions {
    /** Include unchanged fields in update payloads */
    includeUnchanged?: boolean;

    /** Validate payload before returning */
    validate?: boolean;

    /** Strip specific fields from all payloads */
    stripFields?: string[];
}
