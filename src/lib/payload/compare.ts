/**
 * Data comparison utilities
 * 
 * Compare original vs current data to detect changes
 */

import { isEqual } from 'lodash';
import { isTempId } from './validators';
import type { DataDiff } from './types';

/**
 * Compare two arrays of data to detect changes
 * 
 * Identifies added, removed, and changed items by comparing IDs and field values.
 * Temp IDs are considered as "added" items.
 * 
 * @param original - Original data from backend
 * @param current - Current data from form
 * @returns Diff object with added, removed, and changed items
 * 
 * @example
 * const diff = compareData(
 *   [{ id: '1', name: 'Old' }],
 *   [{ id: '1', name: 'New' }, { id: 'temp-123', name: 'Added' }]
 * );
 * // diff.changed: [{ path: '1.name', old: 'Old', new: 'New' }]
 * // diff.added: [{ id: 'temp-123', name: 'Added' }]
 */
export function compareData<T extends { id?: unknown }>(
    original: T[],
    current: T[]
): DataDiff<T> {
    const result: DataDiff<T> = {
        changed: [],
        added: [],
        removed: [],
    };

    // Map original items by ID (skip temp IDs)
    const originalMap = new Map<string, T>(
        original
            .filter(item => item.id && !isTempId(item.id))
            .map(item => [item.id as string, item])
    );

    // Process current items
    current.forEach(item => {
        if (!item.id || isTempId(item.id)) {
            // New item with temp ID
            result.added.push(item);
        } else {
            // Potentially updated item
            const orig = originalMap.get(item.id as string);
            if (orig) {
                // Item exists - check for changes
                if (!isEqual(orig, item)) {
                    // Find changed fields
                    Object.keys(item).forEach(key => {
                        const origValue = (orig as any)[key];
                        const currValue = (item as any)[key];

                        if (!isEqual(origValue, currValue)) {
                            result.changed.push({
                                path: `${item.id}.${key}`,
                                old: origValue,
                                new: currValue,
                            });
                        }
                    });
                }
                // Mark as processed
                originalMap.delete(item.id as string);
            } else {
                // Item has real ID but doesn't exist in original
                // Treat as added (shouldn't normally happen)
                result.added.push(item);
            }
        }
    });

    // Remaining items in originalMap were removed
    result.removed = Array.from(originalMap.values());

    return result;
}

/**
 * Check if a diff has any changes
 * 
 * @param diff - Diff to check
 * @returns true if there are any changes
 */
export function hasChanges<T>(diff: DataDiff<T>): boolean {
    return (
        diff.added.length > 0 ||
        diff.removed.length > 0 ||
        diff.changed.length > 0
    );
}
