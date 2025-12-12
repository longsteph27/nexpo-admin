/**
 * Payload processing library
 * 
 * Centralized utilities for generating clean Directus payloads
 * using collection schemas and intelligent comparison.
 * 
 * @example
 * import { processM2M, BlockTestimonialsSchema } from '@/lib/payload';
 * 
 * const testimonialsRel = BlockTestimonialsSchema.relationships.find(
 *   r => r.field === 'testimonials'
 * );
 * 
 * const payload = processM2M(currentData, originalData, testimonialsRel);
 * updateField('testimonials', payload);
 */

// Core utilities
export * from './validators';
export * from './types';
export * from './compare';
export * from './generate';
export * from './relationships';

// Collection schemas
export * from './collections';
