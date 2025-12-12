/**
 * Simple verification test for payload library
 * 
 * This file tests basic imports and usage of the payload library.
 * Delete this file after verification.
 */

import {
    // Validators
    isTempId,
    getIdType,
    generateTempId,

    // Types
    type CUDStructure,
    type DataDiff,

    // Utilities
    compareData,
    processM2M,

    // Schemas
    BlockTestimonialsSchema,
    TestimonialsSchema,
} from './index';

// Test 1: Validators
const tempId = generateTempId();
console.log('Generated temp ID:', tempId);
console.log('Is temp ID?', isTempId(tempId)); // Should be true
console.log('ID type:', getIdType(tempId)); // Should be 'create'

// Test 2: Schema access
console.log('Testimonials schema:', BlockTestimonialsSchema.collection);
console.log('Simple fields:', TestimonialsSchema.simpleFields);

// Test 3: Compare function
const original = [{ id: '1', name: 'Old' }];
const current = [
    { id: '1', name: 'Updated' },
    { id: generateTempId(), name: 'New' },
];
const diff = compareData(original, current);
console.log('Diff:', {
    added: diff.added.length,
    changed: diff.changed.length,
    removed: diff.removed.length,
});

// Test 4: Process M2M
const testimonialsRel = BlockTestimonialsSchema.relationships?.find(
    r => r.field === 'testimonials'
);

if (testimonialsRel) {
    const payload = processM2M([], [], testimonialsRel);
    console.log('Empty M2M payload:', payload); // Should be undefined
}

console.log('✅ All imports and basic functions working!');

export { };
