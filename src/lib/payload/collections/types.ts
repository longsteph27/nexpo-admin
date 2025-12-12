/**
 * Base types and interfaces for Collection Schema system
 * 
 * This provides type-safe definitions for Directus collections,
 * ensuring accurate field names and relationship structures.
 */

/**
 * Relationship types in Directus
 * - M2M: Many-to-Many (uses junction table)
 * - O2M: One-to-Many (nested creates)
 * - M2O: Many-to-One (foreign key reference)
 */
export type RelationType = 'M2M' | 'O2M' | 'M2O';

/**
 * Relationship definition for a collection field
 */
export interface RelationshipDef {
    /** Field name in the collection */
    field: string;

    /** Type of relationship */
    type: RelationType;

    /** Target collection name */
    targetCollection: string;

    /** Junction table name (for M2M only) */
    junctionTable?: string;

    /** Field in junction table pointing to target entity (for M2M) */
    junctionField?: string;

    /** Field in junction/target pointing back to this collection */
    inverseField?: string;

    /** Nested schema for the target entity (recursive) */
    nestedSchema?: CollectionSchema<any>;
}

/**
 * Foreign key definition
 */
export interface ForeignKeyDef {
    /** Field name in the collection */
    field: string;

    /** Target collection being referenced */
    references: string;

    /** Whether to cascade delete */
    cascadeDelete?: boolean;
}

/**
 * Complete schema definition for a Directus collection
 * 
 * @template T - TypeScript type for the collection (from directus-collections.ts)
 */
export interface CollectionSchema<T = any> {
    /** Collection name in Directus */
    collection: string;

    /** 
     * Simple fields that should be copied directly to payload
     * These are primitive values (string, number, boolean, etc.)
     */
    simpleFields: Array<keyof T>;

    /** 
     * Auto-generated fields that should be stripped from payload
     * e.g., id, date_created, user_created, etc.
     */
    autoGenFields: Array<keyof T>;

    /** 
     * Foreign key fields (M2O relationships)
     * These reference other collections by UUID
     */
    foreignKeys?: ForeignKeyDef[];

    /** 
     * Relationship fields requiring create/update/delete structure
     * These are complex nested objects/arrays
     */
    relationships?: RelationshipDef[];
}
