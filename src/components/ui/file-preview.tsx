'use client';

/**
 * File Preview Modal
 * Lightbox for images, PDF preview, and code preview
 */

import { useState, useEffect } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getFileCategory, formatFileSize } from '@/lib/file-utils';
import { cn } from '@/lib/utils';

export interface FilePreviewFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface FilePreviewProps {
  file: FilePreviewFile | null;
  files?: FilePreviewFile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function FilePreview({
  file,
  files = [],
  open,
  onOpenChange,
  onNavigate,
}: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Reset zoom when file changes
    setZoom(100);
    setImageError(false);
  }, [file?.id]);

  if (!file) return null;

  const category = getFileCategory(file.mimeType);
  const currentIndex = files.findIndex((f) => f.id === file.id);
  const hasMultiple = files.length > 1;
  const canGoNext = currentIndex < files.length - 1;
  const canGoPrev = currentIndex > 0;

  const handleDownload = async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold text-white truncate">
              {file.fileName}
            </h3>
            <p className="text-sm text-gray-400">
              {formatFileSize(file.fileSize)}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Navigation for multiple files */}
            {hasMultiple && onNavigate && (
              <>
                <button
                  onClick={() => onNavigate('prev')}
                  disabled={!canGoPrev}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    canGoPrev
                      ? 'hover:bg-gray-700 text-white'
                      : 'text-gray-600 cursor-not-allowed'
                  )}
                  title="Previous file"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 px-2">
                  {currentIndex + 1} / {files.length}
                </span>
                <button
                  onClick={() => onNavigate('next')}
                  disabled={!canGoNext}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    canGoNext
                      ? 'hover:bg-gray-700 text-white'
                      : 'text-gray-600 cursor-not-allowed'
                  )}
                  title="Next file"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Zoom controls for images */}
            {category === 'image' && !imageError && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                  title="Zoom out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-400 px-2 min-w-[3rem] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 200}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white disabled:text-gray-600 disabled:cursor-not-allowed"
                  title="Zoom in"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-900">
          {/* Image Preview */}
          {category === 'image' && (
            <div className="flex items-center justify-center w-full h-full">
              {imageError ? (
                <div className="text-center text-gray-400">
                  <p>Failed to load image</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white"
                  >
                    Download File
                  </button>
                </div>
              ) : (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="max-w-full max-h-full object-contain transition-transform"
                  style={{ transform: `scale(${zoom / 100})` }}
                  onError={() => setImageError(true)}
                />
              )}
            </div>
          )}

          {/* PDF Preview */}
          {category === 'pdf' && (
            <iframe
              src={file.url}
              className="w-full h-full rounded-lg border border-gray-700"
              title={file.fileName}
            />
          )}

          {/* Code/Text Preview */}
          {category === 'code' && (
            <div className="w-full h-full bg-gray-800 rounded-lg border border-gray-700 overflow-auto">
              <iframe
                src={file.url}
                className="w-full h-full"
                title={file.fileName}
                sandbox="allow-same-origin"
              />
            </div>
          )}

          {/* Other files - download only */}
          {category !== 'image' &&
            category !== 'pdf' &&
            category !== 'code' && (
              <div className="text-center text-gray-400">
                <p className="mb-4">Preview not available for this file type</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-white font-medium"
                >
                  <Download className="w-5 h-5 inline mr-2" />
                  Download File
                </button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
