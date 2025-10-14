'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button-base';
import Input from '@/components/ui/input';
import { Icon } from '@iconify/react';

interface LinkInputDialogProps {
  open: boolean;
  onClose: () => void;
  onLinkAdded: (url: string, text?: string) => void;
  initialUrl?: string;
  initialText?: string;
  mode?: 'add' | 'edit';
}

export function LinkInputDialog({
  open,
  onClose,
  onLinkAdded,
  initialUrl = '',
  initialText = '',
  mode = 'add',
}: LinkInputDialogProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!open) {
      // Small delay to allow exit animation
      setTimeout(() => {
        setUrl(initialUrl);
        setText(initialText);
        setError('');
        setIsLoading(false);
      }, 200);
    } else {
      // Set initial values when opening
      setUrl(initialUrl);
      setText(initialText);
    }
  }, [open, initialUrl, initialText]);

  const validateUrl = (urlString: string): boolean => {
    try {
      // Allow relative URLs starting with /
      if (urlString.startsWith('/')) {
        return urlString.length > 1;
      }
      // Allow mailto: and tel: links
      if (urlString.startsWith('mailto:') || urlString.startsWith('tel:')) {
        return urlString.length > 7;
      }
      // Allow anchor links
      if (urlString.startsWith('#')) {
        return urlString.length > 1;
      }
      // Validate full URLs
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL (e.g., https://example.com or /page)');
      return;
    }

    setIsLoading(true);
    
    try {
      onLinkAdded(url, text || undefined);
      onClose();
    } catch (err) {
      setError('Failed to add link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="lucide:link" className="w-5 h-5 text-blue-600" />
            {mode === 'edit' ? 'Edit Link' : 'Add Link'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the link URL and display text.' 
              : 'Enter the URL and optionally customize the link text.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-primary flex items-center gap-2">
              <Icon icon="lucide:globe" className="w-4 h-4" />
              Link URL <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="https://example.com or /page"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className={error ? 'border-red-500 focus:ring-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <Icon icon="lucide:alert-circle" className="w-4 h-4" />
                {error}
              </p>
            )}
            <div className="text-xs text-content-tertiary space-y-1">
              <p className="flex items-center gap-1">
                <Icon icon="lucide:info" className="w-3 h-3" />
                Supported formats:
              </p>
              <ul className="ml-5 space-y-0.5 list-disc">
                <li>Full URL: <code className="text-xs bg-gray-100 px-1 rounded">https://example.com</code></li>
                <li>Relative: <code className="text-xs bg-gray-100 px-1 rounded">/about</code></li>
                <li>Email: <code className="text-xs bg-gray-100 px-1 rounded">mailto:hello@example.com</code></li>
                <li>Phone: <code className="text-xs bg-gray-100 px-1 rounded">tel:+1234567890</code></li>
                <li>Anchor: <code className="text-xs bg-gray-100 px-1 rounded">#section</code></li>
              </ul>
            </div>
          </div>

          {/* Text Input (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-content-primary flex items-center gap-2">
              <Icon icon="lucide:type" className="w-4 h-4" />
              Link Text <span className="text-xs text-content-tertiary font-normal">(optional)</span>
            </label>
            <Input
              type="text"
              placeholder="Custom link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-content-tertiary">
              Leave empty to use the selected text or URL as the link text.
            </p>
          </div>

          {/* Preview */}
          {url && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-1">
                <Icon icon="lucide:eye" className="w-3 h-3" />
                Preview:
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800 break-all"
                onClick={(e) => e.preventDefault()}
              >
                {text || url}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!url.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Icon icon="lucide:loader-2" className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'edit' ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              <>
                <Icon icon="lucide:check" className="w-4 h-4 mr-2" />
                {mode === 'edit' ? 'Update Link' : 'Add Link'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

