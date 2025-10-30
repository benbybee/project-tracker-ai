/**
 * File Utilities
 * Helper functions for file type detection, formatting, and validation
 */

// Supported file types and their configurations
export const FILE_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  CODE: [
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'application/typescript',
    'text/x-python',
    'application/json',
    'text/markdown',
    'text/plain',
    'text/html',
    'text/css',
  ],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
} as const;

export const FILE_SIZE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB per task
  MAX_FILES_PER_TASK: 10,
} as const;

// File type categories for UI
export type FileCategory =
  | 'image'
  | 'pdf'
  | 'document'
  | 'code'
  | 'archive'
  | 'other';

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): FileCategory {
  if (FILE_TYPES.IMAGES.includes(mimeType as any)) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (FILE_TYPES.DOCUMENTS.includes(mimeType as any)) return 'document';
  if (FILE_TYPES.CODE.includes(mimeType as any)) return 'code';
  if (FILE_TYPES.ARCHIVES.includes(mimeType as any)) return 'archive';
  return 'other';
}

/**
 * Check if file type is supported for preview
 */
export function canPreview(mimeType: string): boolean {
  const category = getFileCategory(mimeType);
  return category === 'image' || category === 'pdf' || category === 'code';
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get icon name for file type (Lucide React icon names)
 */
export function getFileIcon(mimeType: string): string {
  const category = getFileCategory(mimeType);

  switch (category) {
    case 'image':
      return 'Image';
    case 'pdf':
      return 'FileText';
    case 'document':
      return 'FileSpreadsheet';
    case 'code':
      return 'Code';
    case 'archive':
      return 'Archive';
    default:
      return 'File';
  }
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_SIZE_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}`,
    };
  }

  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  existingCount: number = 0
): { valid: boolean; error?: string } {
  // Check file count
  if (files.length + existingCount > FILE_SIZE_LIMITS.MAX_FILES_PER_TASK) {
    return {
      valid: false,
      error: `Maximum ${FILE_SIZE_LIMITS.MAX_FILES_PER_TASK} files per task`,
    };
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > FILE_SIZE_LIMITS.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total file size must be less than ${formatFileSize(FILE_SIZE_LIMITS.MAX_TOTAL_SIZE)}`,
    };
  }

  // Validate each file
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

/**
 * Generate thumbnail URL path for Vercel Blob
 */
export function getThumbnailPath(originalPath: string): string {
  const parts = originalPath.split('/');
  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
  const ext = filename.substring(filename.lastIndexOf('.'));

  parts[parts.length - 1] = `${nameWithoutExt}_thumb${ext}`;
  return parts.join('/');
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return FILE_TYPES.IMAGES.includes(mimeType as any);
}

/**
 * Get color for file category (for UI badges)
 */
export function getFileCategoryColor(category: FileCategory): string {
  switch (category) {
    case 'image':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'pdf':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'document':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'code':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'archive':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
  }
}

/**
 * Sanitize filename for storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove special characters but keep extension
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}
