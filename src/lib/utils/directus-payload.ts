/**
 * Directus Deep Payload Builder
 * 
 * Converts frontend state into Directus deep payload format with
 * recursive support for nested relational data operations (create, update, delete).
 * 
 * @module directus-payload
 */

/**
 * Status flags that indicate the operation type for an item
 */
type ItemStatus = 'create' | 'update' | 'delete';

/**
 * Internal metadata fields that should be removed from final payload
 */
const INTERNAL_META_FIELDS = new Set([
  '_status',
  '_payload',
  '_tempId',
  '_isNew',
  '_isDirty',
  '_original',
]);

/**
 * Checks if a value is a plain object (not array, Date, etc.)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Checks if a value is an array
 */
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Checks if a string is a valid UUID (or represents an existing database ID)
 */
function isExistingId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  // UUID pattern or numeric ID
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || /^\d+$/.test(id);
}

/**
 * Removes internal metadata fields from an object
 */
function stripMeta<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Skip internal metadata fields
    if (INTERNAL_META_FIELDS.has(key)) {
      continue;
    }
    
    // Recursively strip meta from nested objects
    if (isPlainObject(value)) {
      result[key] = stripMeta(value);
    } else if (isArray(value)) {
      result[key] = value.map(item => isPlainObject(item) ? stripMeta(item) : item);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Determines the operation status for an item based on its properties
 */
function getItemStatus(item: Record<string, unknown>): ItemStatus | null {
  // Explicit status flag
  if (typeof item._status === 'string' && ['create', 'update', 'delete'].includes(item._status)) {
    return item._status as ItemStatus;
  }
  
  // Has _payload or _isNew flag - indicates create
  if (item._payload !== undefined || item._isNew === true) {
    return 'create';
  }
  
  // Has id and doesn't start with 'temp-' - existing item
  if (item.id && typeof item.id === 'string') {
    if (item.id.startsWith('temp-')) {
      return 'create'; // Temp ID indicates new item
    }
    if (isExistingId(item.id)) {
      return 'update'; // Real ID indicates existing item
    }
  }
  
  // If has numeric or UUID id, it's an update
  if (item.id && isExistingId(item.id)) {
    return 'update';
  }
  
  // No clear indicator - return null (will be skipped)
  return null;
}

/**
 * Recursively processes a relation array into create/update/delete groups
 */
function processRelationArray(
  items: unknown[],
  trackExistingIds?: (ids: string[]) => void
): {
  create: Record<string, unknown>[];
  update: Record<string, unknown>[];
  delete: string[];
} {
  const result = {
    create: [] as Record<string, unknown>[],
    update: [] as Record<string, unknown>[],
    delete: [] as string[],
  };
  
  if (!isArray(items)) {
    return result;
  }
  
  for (const item of items) {
    if (!isPlainObject(item)) {
      continue; // Skip non-object items
    }
    
    const status = getItemStatus(item);
    
    if (status === 'delete') {
      // For delete, we typically just need the ID
      const id = item.id;
      if (id && typeof id === 'string' && isExistingId(id)) {
        result.delete.push(id);
        trackExistingIds?.([id]);
      }
      continue;
    }
    
    if (status === 'create') {
      // Recursively process nested relations before adding to create
      const processedItem = buildDirectusPayloadRecursive(item, trackExistingIds);
      result.create.push(processedItem);
      continue;
    }
    
    if (status === 'update') {
      // Recursively process nested relations before adding to update
      const processedItem = buildDirectusPayloadRecursive(item, trackExistingIds);
      
      // Ensure ID is included for update operations
      if (item.id && typeof item.id === 'string' && isExistingId(item.id)) {
        processedItem.id = item.id;
        result.update.push(processedItem);
        trackExistingIds?.([item.id]);
      }
      continue;
    }
    
    // Status is null - item exists but unchanged, skip it
    // (This allows partial updates - only changed items are included)
  }
  
  return result;
}

/**
 * Recursively builds Directus deep payload from frontend state
 * 
 * @param data - The frontend state object to transform
 * @param trackExistingIds - Optional callback to track existing IDs for delete detection
 * @returns Transformed object ready for Directus API
 */
function buildDirectusPayloadRecursive(
  data: unknown,
  trackExistingIds?: (ids: string[]) => void
): Record<string, unknown> {
  // Handle null/undefined
  if (data === null || data === undefined) {
    return {};
  }
  
  // Handle non-object types (strings, numbers, booleans, etc.)
  if (!isPlainObject(data)) {
    return data as Record<string, unknown>;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Skip internal metadata fields
    if (INTERNAL_META_FIELDS.has(key)) {
      continue;
    }
    
    // Handle array values (potential relations)
    if (isArray(value)) {
      const relationResult = processRelationArray(value, trackExistingIds);
      
      // Only include relation if there are operations to perform
      if (
        relationResult.create.length > 0 ||
        relationResult.update.length > 0 ||
        relationResult.delete.length > 0
      ) {
        const relationPayload: Record<string, unknown> = {};
        
        if (relationResult.create.length > 0) {
          relationPayload.create = relationResult.create;
        }
        
        if (relationResult.update.length > 0) {
          relationPayload.update = relationResult.update;
        }
        
        if (relationResult.delete.length > 0) {
          relationPayload.delete = relationResult.delete;
        }
        
        result[key] = relationPayload;
      }
      // If no operations, skip the relation entirely
      continue;
    }
    
    // Handle nested objects (recursive processing)
    if (isPlainObject(value)) {
      // Check if this nested object has status flags (treat as single-item relation)
      const nestedStatus = getItemStatus(value);
      
      if (nestedStatus === 'create' || nestedStatus === 'update') {
        // Process as nested relation item
        const processed = buildDirectusPayloadRecursive(value, trackExistingIds);
        
        if (nestedStatus === 'update' && value.id && typeof value.id === 'string' && isExistingId(value.id)) {
          processed.id = value.id;
        }
        
        // For single nested items, wrap in create/update array
        if (nestedStatus === 'create') {
          result[key] = { create: [processed] };
        } else {
          result[key] = { update: [processed] };
        }
      } else {
        // Regular nested object - recurse normally
        const processed = buildDirectusPayloadRecursive(value, trackExistingIds);
        if (Object.keys(processed).length > 0) {
          result[key] = processed;
        }
      }
      continue;
    }
    
    // Primitive values - copy as-is
    result[key] = value;
  }
  
  // Remove internal metadata from final result
  return stripMeta(result);
}

/**
 * Main service object for Directus payload operations
 */
export const DirectusService = {
  /**
   * Builds a Directus deep payload from frontend state
   * 
   * @param data - The frontend state to transform
   * @param options - Optional configuration
   * @param options.trackDeletes - Function to track existing IDs for delete detection
   * @returns Processed payload ready for Directus API
   * 
   * @example
   * ```typescript
   * const payload = DirectusService.buildPayload({
   *   title: 'My Title',
   *   items: [
   *     { _status: 'create', name: 'New Item' },
   *     { id: '123', name: 'Updated Item' },
   *   ],
   *   translations: {
   *     create: [{ languages_code: 'en-US', title: 'Hello' }],
   *     update: [{ id: '456', title: 'Updated' }],
   *     delete: ['789']
   *   }
   * });
   * ```
   */
  buildPayload(
    data: unknown,
    options?: {
      trackDeletes?: (existingIds: string[]) => void;
    }
  ): Record<string, unknown> {
    return buildDirectusPayloadRecursive(data, options?.trackDeletes);
  },
};

/**
 * Export helper function for external use if needed
 */
export { stripMeta };

