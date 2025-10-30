'use client';

/**
 * Task Attachments Component
 * Display and manage file attachments for a task
 */

import { useState } from 'react';
import {
  File,
  Image as ImageIcon,
  FileText,
  Code,
  Archive,
  Trash2,
  Eye,
  Download,
  PackageOpen,
} from 'lucide-react';
import {
  formatFileSize,
  getFileCategory,
  getFileCategoryColor,
} from '@/lib/file-utils';
import {
  FilePreview,
  type FilePreviewFile,
} from '@/components/ui/file-preview';
import { FileUploader } from './file-uploader';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface TaskAttachmentsProps {
  taskId: string;
  className?: string;
}

export function TaskAttachments({ taskId, className }: TaskAttachmentsProps) {
  const utils = trpc.useUtils();
  const [previewFile, setPreviewFile] = useState<FilePreviewFile | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Fetch attachments
  const { data: attachments = [], isLoading } = trpc.attachments.list.useQuery({
    taskId,
  });

  // Create attachment mutation
  const createMutation = trpc.attachments.create.useMutation({
    onSuccess: () => {
      utils.attachments.list.invalidate({ taskId });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save attachment');
    },
  });

  // Delete attachment mutation
  const deleteMutation = trpc.attachments.delete.useMutation({
    onSuccess: () => {
      utils.attachments.list.invalidate({ taskId });
      toast.success('File deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete file');
    },
  });

  // Handle upload success
  const handleUploadSuccess = (file: {
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    thumbnailUrl?: string;
  }) => {
    createMutation.mutate({
      taskId,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl,
    });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate({ id });
    }
  };

  // Handle preview
  const handlePreview = (attachment: (typeof attachments)[number]) => {
    setPreviewFile({
      id: attachment.id,
      fileName: attachment.fileName,
      fileSize: Number(attachment.fileSize),
      mimeType: attachment.mimeType,
      url: attachment.url,
      thumbnailUrl: attachment.thumbnailUrl,
    });
    setPreviewOpen(true);
  };

  // Handle navigation in preview
  const handleNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = attachments.findIndex((a) => a.id === previewFile?.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < attachments.length) {
      const attachment = attachments[newIndex];
      setPreviewFile({
        id: attachment.id,
        fileName: attachment.fileName,
        fileSize: Number(attachment.fileSize),
        mimeType: attachment.mimeType,
        url: attachment.url,
        thumbnailUrl: attachment.thumbnailUrl,
      });
    }
  };

  // Download all attachments as ZIP
  const handleDownloadAll = async () => {
    if (attachments.length === 0) return;

    setDownloadingZip(true);
    toast.info('Preparing ZIP file...');

    try {
      const zip = new JSZip();

      // Download and add each file to ZIP
      for (const attachment of attachments) {
        try {
          const response = await fetch(attachment.url);
          const blob = await response.blob();
          zip.file(attachment.fileName, blob);
        } catch (error) {
          console.error(`Failed to download ${attachment.fileName}:`, error);
        }
      }

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Download ZIP
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `task-${taskId}-attachments.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('ZIP file downloaded successfully');
    } catch (error) {
      console.error('Failed to create ZIP:', error);
      toast.error('Failed to create ZIP file');
    } finally {
      setDownloadingZip(false);
    }
  };

  // Get icon for file type
  const getIcon = (mimeType: string) => {
    const category = getFileCategory(mimeType);
    switch (category) {
      case 'image':
        return ImageIcon;
      case 'pdf':
      case 'document':
        return FileText;
      case 'code':
        return Code;
      case 'archive':
        return Archive;
      default:
        return File;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Section */}
      <FileUploader
        taskId={taskId}
        existingFileCount={attachments.length}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={(error) => toast.error(error)}
      />

      {/* Download All Button */}
      {attachments.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={handleDownloadAll}
            disabled={downloadingZip}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            {downloadingZip ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating ZIP...
              </>
            ) : (
              <>
                <PackageOpen className="w-4 h-4 mr-2" />
                Download All ({attachments.length})
              </>
            )}
          </button>
        </div>
      )}

      {/* Attachments Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : attachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {attachments.map((attachment) => {
            const category = getFileCategory(attachment.mimeType);
            const Icon = getIcon(attachment.mimeType);
            const isImage = category === 'image';

            return (
              <div
                key={attachment.id}
                className="group relative aspect-square rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/50 hover:shadow-lg transition-all"
              >
                {/* Preview */}
                <div className="w-full h-full flex items-center justify-center p-4">
                  {isImage ? (
                    <img
                      src={attachment.thumbnailUrl || attachment.url}
                      alt={attachment.fileName}
                      className="max-w-full max-h-full object-cover rounded"
                    />
                  ) : (
                    <Icon className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-5 h-5 text-gray-900" />
                  </button>
                  <a
                    href={attachment.url}
                    download={attachment.fileName}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5 text-gray-900" />
                  </a>
                  <button
                    onClick={() => handleDelete(attachment.id)}
                    className="p-2 bg-red-500/90 hover:bg-red-600 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* File info */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs font-medium text-white truncate">
                    {attachment.fileName}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-300">
                      {formatFileSize(Number(attachment.fileSize))}
                    </p>
                    <span
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        getFileCategoryColor(category)
                      )}
                    >
                      {category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <File className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No attachments yet</p>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreview
        file={previewFile}
        files={attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: Number(a.fileSize),
          mimeType: a.mimeType,
          url: a.url,
          thumbnailUrl: a.thumbnailUrl,
        }))}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
