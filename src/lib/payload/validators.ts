/**
 * Validator utilities for payload processing
 * 
 * Provides simple, unified functions for detecting temp IDs
 * and determining operation types (create vs update).
 */

/**
 * Check if an ID is a temporary ID (created on frontend)
 * 
 * @param id - ID to check
 * @returns true if ID starts with 'temp-'
 * 
 * @example
 * isTempId('temp-1702345678901') // true
 * isTempId('a1b2c3d4-...') // false
 * isTempId(null) // false
 */
export function isTempId(id: unknown): boolean {
    if (typeof id !== 'string') return false;
    return id.startsWith('temp-');
}

/**
 * Determine the operation type based on ID
 * 
 * @param id - ID to analyze
 * @returns 'create' for temp IDs, 'update' for real IDs, 'unknown' for invalid
 * 
 * @example
 * getIdType('temp-123') // 'create'
 * getIdType('uuid-...') // 'update'
 * getIdType(null) // 'unknown'
 */
export function getIdType(id: unknown): 'create' | 'update' | 'unknown' {
    if (!id) return 'unknown';
    if (isTempId(id)) return 'create';
    if (typeof id === 'string' && id.length > 0) return 'update';
    return 'unknown';
}

/**
 * Generate a temporary ID for new entities
 * 
 * Uses timestamp to ensure uniqueness within a session.
 * Format: 'temp-{timestamp}'
 * 
 * @returns Temporary ID string
 * 
 * @example
 * generateTempId() // 'temp-1702345678901'
 */
export function generateTempId(): string {
    return `temp-${Date.now()}`;
}

/**
 * Validate if a payload structure is valid
 * (Can be expanded later for more validation rules)
 * 
 * @param payload - Payload to validate
 * @returns true if valid
 */
export function validatePayload(payload: unknown): boolean {
    if (!payload || typeof payload !== 'object') return false;

    // Add more validation rules as needed
    return true;
}
