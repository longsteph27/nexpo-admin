'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from './button-base';
import Input from './input';
import { toast } from 'sonner';
import { directusHelpers } from '@/lib/directus';

interface VideoUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onVideoSelected: (videoUrl: string) => void;
  folderId?: string;
}

export function VideoUploadDialog({ open, onClose, onVideoSelected, folderId }: VideoUploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'local' | 'library'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [libraryVideos, setLibraryVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Auto-load library videos when dialog opens
  useEffect(() => {
    if (open && activeTab === 'library' && folderId && libraryVideos.length === 0) {
      loadLibraryVideos();
    }
  }, [open, activeTab, folderId]);

  const handleUrlSubmit = () => {
    if (!videoUrl.trim()) {
      toast.error('Please enter a video URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(videoUrl);
      onVideoSelected(videoUrl);
      onClose();
      setVideoUrl('');
      toast.success('Video added successfully!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }

      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file size must be less than 100MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleFileSubmit = async () => {
    if (!selectedFile) {
      toast.error('Please select a video file');
      return;
    }

    setLoading(true);
    try {
      // Upload to Directus
      const result = await directusHelpers.uploadFile(selectedFile, folderId);
      
      if (result.success && result.data) {
        // Get Directus file URL
        const videoUrl = `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${result.data.id}`;
        onVideoSelected(videoUrl);
        onClose();
        setSelectedFile(null);
        toast.success('Video uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload video');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  const loadLibraryVideos = async () => {
    if (!folderId) {
      toast.error('No media folder available');
      return;
    }

    setLoading(true);
    try {
      const result = await directusHelpers.getFilesByFolder(folderId, 100);
      
      if (result.success && result.data) {
        // Filter for video files only
        const videoFiles = result.data.filter((file: any) => 
          file.type && file.type.startsWith('video/')
        );
        
        setLibraryVideos(videoFiles);
        toast.success(`Loaded ${videoFiles.length} video(s) from library`);
      } else {
        toast.error(result.error || 'Failed to load video library');
      }
    } catch (error) {
      console.error('Load library error:', error);
      toast.error('Failed to load video library');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon icon="lucide:video" className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-content-primary">Add Video</h2>
              <p className="text-xs text-content-tertiary">Upload or link a video to your content</p>
            </div>
          </div>
          <button
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={onClose}
          >
            <Icon icon="lucide:x" className="w-5 h-5 text-content-secondary" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
          <Icon icon="lucide:upload" className="w-4 h-4 text-content-tertiary" />
          <span className="text-xs text-content-secondary font-medium">Upload Method:</span>
          <div className="flex items-center space-x-1">
            {[
              { key: 'url', label: 'URL', icon: 'lucide:link' },
              { key: 'local', label: 'Local', icon: 'lucide:upload' },
              { key: 'library', label: 'Library', icon: 'lucide:folder' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-content-secondary hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab(tab.key as any)}
              >
                <Icon icon={tab.icon} className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                  Video URL
                </label>
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="w-full"
                />
                <p className="text-xs text-content-tertiary mt-1">
                  Enter a direct link to a video file (MP4, WebM, etc.)
                </p>
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-content-primary mb-2">
                  Select Video File
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-content-tertiary mt-1">
                  Supported formats: MP4, WebM, AVI, MOV (Max 100MB)
                </p>
              </div>
              
              {selectedFile && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Icon icon="lucide:check-circle" className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-content-primary">Video Library</h3>
                <Button
                  onClick={loadLibraryVideos}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
              
              {libraryVideos.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="lucide:folder-open" className="w-12 h-12 text-content-tertiary mx-auto mb-4" />
                  <p className="text-content-tertiary mb-4">
                    No videos found in your media library
                  </p>
                  <Button
                    onClick={loadLibraryVideos}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? 'Loading...' : 'Load Library'}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {libraryVideos.map((video: any) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        const videoUrl = `${process.env.NEXT_PUBLIC_DIRECTUS_URL}/assets/${video.id}`;
                        onVideoSelected(videoUrl);
                        onClose();
                        toast.success('Video selected from library!');
                      }}
                      className="group border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon icon="lucide:video" className="w-6 h-6 text-content-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-content-primary truncate">
                            {video.filename_download || video.id}
                          </p>
                          <p className="text-xs text-content-tertiary">
                            {(video.filesize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={activeTab === 'url' ? handleUrlSubmit : handleFileSubmit}
            disabled={
              (activeTab === 'url' && !videoUrl.trim()) ||
              (activeTab === 'local' && !selectedFile) ||
              (activeTab === 'library')
            }
            variant="default"
          >
            {activeTab === 'url' ? 'Add Video' : 'Upload Video'}
          </Button>
        </div>
      </div>
    </div>
  );
}
