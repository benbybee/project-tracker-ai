'use client';

/**
 * File Uploader Component
 * Drag & drop file upload with validation and progress tracking
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, Loader2 } from 'lucide-react';
import {
  formatFileSize,
  validateFiles,
  FILE_SIZE_LIMITS,
} from '@/lib/file-utils';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  taskId: string;
  existingFileCount?: number;
  onUploadSuccess: (file: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
  }) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function FileUploader({
  taskId,
  existingFileCount = 0,
  onUploadSuccess,
  onUploadError,
  maxFiles = FILE_SIZE_LIMITS.MAX_FILES_PER_TASK,
  disabled = false,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return;

      // Validate files
      const validation = validateFiles(
        Array.from(files),
        existingFileCount + uploadingFiles.length
      );
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid files');
        return;
      }

      // Add files to uploading state
      const newUploads: UploadingFile[] = Array.from(files).map((file) => ({
        file,
        progress: 0,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploads]);

      // Upload each file
      for (let i = 0; i < newUploads.length; i++) {
        const upload = newUploads[i];
        try {
          const formData = new FormData();
          formData.append('file', upload.file);
          formData.append('taskId', taskId);

          const response = await fetch('/api/attachments/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const data = await response.json();

          // Mark as complete
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === upload.file ? { ...f, progress: 100 } : f
            )
          );

          // Notify success
          onUploadSuccess(data);

          // Remove from uploading after delay
          setTimeout(() => {
            setUploadingFiles((prev) =>
              prev.filter((f) => f.file !== upload.file)
            );
          }, 1000);
        } catch (error: any) {
          // Mark as error
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === upload.file
                ? { ...f, error: error.message || 'Upload failed' }
                : f
            )
          );

          onUploadError?.(error.message || 'Upload failed');
        }
      }
    },
    [
      taskId,
      existingFileCount,
      uploadingFiles.length,
      onUploadSuccess,
      onUploadError,
      disabled,
    ]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [disabled, handleFiles]
  );

  // Click to upload
  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(Array.from(files));
      }
      // Reset input
      e.target.value = '';
    },
    [handleFiles]
  );

  // Remove failed upload
  const handleRemove = useCallback((file: File) => {
    setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
  }, []);

  const remainingSlots = maxFiles - existingFileCount - uploadingFiles.length;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.json,.js,.ts,.py"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <Upload className="w-10 h-10 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Max {formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)} per file •{' '}
              {remainingSlots} {remainingSlots === 1 ? 'slot' : 'slots'}{' '}
              available
            </p>
          </div>
        </div>
      </div>

      {/* Uploading files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((upload, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {upload.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : upload.progress === 100 ? (
                  <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : (
                  <Loader2 className="w-5 h-5 text-indigo-500 animate-spin flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(upload.file.size)}
                  </p>
                  {upload.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {upload.error}
                    </p>
                  )}
                </div>
              </div>

              {upload.error && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(upload.file);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
