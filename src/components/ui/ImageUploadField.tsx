/**
 * ============================================================================
 * ImageUploadField - Reusable Image Upload Component with Custom Layout
 * ============================================================================
 * 
 * A flexible, reusable component for image uploads with Directus integration.
 * Uses render props pattern to allow complete customization of the UI layout.
 * 
 * FEATURES:
 * - Dialog with 2 tabs: Library (existing images) and Upload (new images)
 * - Directus file management integration
 * - Custom layout via children render function
 * - Loading states and error handling
 * - Image removal support
 * 
 * BASIC USAGE:
 * 
 * ```tsx
 * import { ImageUploadField } from '@/components/ui/ImageUploadField';
 * 
 * function MyComponent() {
 *   const [imageId, setImageId] = useState<string | null>(null);
 *   const { selectedTenant } = useAuthStore();
 * 
 *   return (
 *     <ImageUploadField
 *       value={imageId}
 *       onChange={setImageId}
 *       folderId={selectedTenant?.folder_files_id}
 *     >
 *       {({ imageUrl, openPicker, removeImage, hasImage, isUploading }) => (
 *         <div>
 *           {hasImage && imageUrl ? (
 *             <div>
 *               <img src={imageUrl} alt="Preview" />
 *               <button onClick={removeImage}>Remove</button>
 *             </div>
 *           ) : (
 *             <button onClick={openPicker} disabled={isUploading}>
 *               {isUploading ? 'Uploading...' : 'Upload Image'}
 *             </button>
 *           )}
 *         </div>
 *       )}
 *     </ImageUploadField>
 *   );
 * }
 * ```
 * 
 * RENDER PROPS:
 * - imageUrl: Full URL of the current image (null if no image)
 * - openPicker: Function to open the image picker dialog
 * - removeImage: Function to remove/clear the current image
 * - hasImage: Boolean indicating if there is a current image
 * - isUploading: Boolean indicating if upload is in progress
 * - assetId: The current asset ID
 * 
 * EXAMPLES OF DIFFERENT LAYOUTS:
 * 
 * 1. Logo Upload (Square):
 *    - Small square preview (64x64 or 80x80)
 *    - Upload/Change button
 *    - Remove button when image exists
 * 
 * 2. Banner Upload (Wide):
 *    - Wide preview (full width, 160-200px height)
 *    - Overlay actions on hover
 *    - Upload prompt when empty
 * 
 * 3. Avatar Upload (Circle):
 *    - Circular preview
 *    - Camera icon button overlay
 *    - Centered layout
 * 
 * 4. Compact Inline:
 *    - Small thumbnail + info text
 *    - Horizontal layout with actions
 * 
 * See EventRecognition.tsx for real-world usage examples.
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import ImagePickerDialog from './ImagePickerDialog';
import { eventsApi } from '@/lib/api';
import { toast } from 'sonner';

export interface ImageUploadFieldProps {
  /**
   * Current image asset ID or URL
   */
  value?: string | null;

  /**
   * Callback when image is selected/changed
   */
  onChange: (assetId: string | null) => void;

  /**
   * Folder ID for Directus file organization
   */
  folderId?: string;

  /**
   * Render function for custom layout
   * Receives image URL and handlers
   */
  children: (params: ImageUploadFieldRenderProps) => React.ReactNode;

  /**
   * Optional: Event ID for tagging uploaded files
   */
  eventId?: string;

  /**
   * Optional: Custom validation (file size, dimensions, etc.)
   */
  validate?: (file: File) => Promise<{ valid: boolean; error?: string }>;

  /**
   * Optional: Called before upload starts
   */
  onUploadStart?: () => void;

  /**
   * Optional: Called after upload completes
   */
  onUploadComplete?: (assetId: string) => void;

  /**
   * Optional: Called on upload error
   */
  onUploadError?: (error: Error) => void;
}

export interface ImageUploadFieldRenderProps {
  /**
   * Full URL of the current image (or null if no image)
   */
  imageUrl: string | null;

  /**
   * Whether upload/picker is in progress
   */
  isUploading: boolean;

  /**
   * Open the image picker dialog
   */
  openPicker: () => void;

  /**
   * Remove/clear the current image
   */
  removeImage: () => void;

  /**
   * Whether there is a current image
   */
  hasImage: boolean;

  /**
   * The current asset ID
   */
  assetId: string | null;
}

/**
 * ImageUploadField - Reusable image upload component with custom layout support
 * 
 * This component provides:
 * - Dialog with library selection and file upload
 * - Directus integration
 * - Custom layout via render props
 * - Validation support
 * - Loading states
 * 
 * @example
 * ```tsx
 * <ImageUploadField
 *   value={event.logo}
 *   onChange={(assetId) => handleLogoChange(assetId)}
 *   folderId={tenantFolderId}
 * >
 *   {({ imageUrl, openPicker, removeImage, hasImage }) => (
 *     <div>
 *       {hasImage ? (
 *         <img src={imageUrl} onClick={openPicker} />
 *       ) : (
 *         <button onClick={openPicker}>Upload Logo</button>
 *       )}
 *       {hasImage && <button onClick={removeImage}>Remove</button>}
 *     </div>
 *   )}
 * </ImageUploadField>
 * ```
 */
export function ImageUploadField({
  value,
  onChange,
  folderId,
  children,
  eventId,
  validate,
  onUploadStart,
  onUploadComplete,
  onUploadError,
}: ImageUploadFieldProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Generate image URL from asset ID
  const getImageUrl = (assetId: string | null): string | null => {
    if (!assetId) return null;
    
    // If it's already a full URL, return as is
    if (assetId.startsWith('http')) {
      return assetId;
    }
    
    // Generate Directus asset URL
    return `https://app.nexpo.vn/assets/${assetId}`;
  };

  const imageUrl = getImageUrl(value || null);
  const hasImage = !!value;
  const assetId = value || null;

  /**
   * Open the image picker dialog
   */
  const openPicker = () => {
    setShowPicker(true);
  };

  /**
   * Handle image selection from picker
   */
  const handleSelect = async (selectedAssetId: string) => {
    try {
      onChange(selectedAssetId);
      
      if (onUploadComplete) {
        onUploadComplete(selectedAssetId);
      }
      
      toast.success('Image selected successfully');
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error('Failed to select image');
      
      if (onUploadError && error instanceof Error) {
        onUploadError(error);
      }
    }
  };

  /**
   * Remove the current image
   */
  const removeImage = () => {
    onChange(null);
    toast.success('Image removed');
  };

  /**
   * Close the picker dialog
   */
  const closePicker = () => {
    setShowPicker(false);
  };

  // Render props for custom layout
  const renderProps: ImageUploadFieldRenderProps = {
    imageUrl,
    isUploading,
    openPicker,
    removeImage,
    hasImage,
    assetId,
  };

  return (
    <>
      {/* Custom layout via render props */}
      {children(renderProps)}

      {/* Image Picker Dialog */}
      <ImagePickerDialog
        isOpen={showPicker}
        onClose={closePicker}
        onSelect={handleSelect}
        folderId={folderId}
        currentValue={value || undefined}
      />
    </>
  );
}

export default ImageUploadField;

