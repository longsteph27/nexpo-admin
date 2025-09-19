'use client';

import { useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  placeholder?: string;
  guidelines?: string[];
}

export default function FileUpload({
  onFileSelect,
  accept = 'image/*',
  maxSize = 5,
  className = '',
  placeholder = 'Upload',
  guidelines = []
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      setError('Invalid file type');
      return;
    }

    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${error ? 'border-red-300 bg-red-50' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: dragActive ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Icon 
            icon={dragActive ? 'mdi:cloud-upload' : 'mdi:plus'} 
            className={`w-8 h-8 mx-auto mb-2 ${
              dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} 
          />
          <p className={`text-sm ${
            dragActive ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {dragActive ? 'Drop file here' : placeholder}
          </p>
        </motion.div>

        {guidelines.length > 0 && (
          <div className="mt-3 text-xs text-gray-400">
            {guidelines.map((guideline, index) => (
              <div key={index}>{guideline}</div>
            ))}
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-xs text-red-500"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}

