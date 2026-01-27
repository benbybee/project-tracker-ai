'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OpportunityBulkUploadProps {
  sprintId?: string;
  onSuccess?: (count: number) => void;
  onCancel?: () => void;
  className?: string;
}

export function OpportunityBulkUpload({
  sprintId,
  onSuccess,
  onCancel,
  className,
}: OpportunityBulkUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.md')) {
      setFile(droppedFile);
      setError(null);
      setSuccess(null);
    } else {
      setError('Please upload a .md (Markdown) file');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.md')) {
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    } else {
      setError('Please upload a .md (Markdown) file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sprintId) {
        formData.append('sprintId', sprintId);
      }

      const response = await fetch('/api/opportunities/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(
        `Successfully created ${data.count} opportunit${data.count === 1 ? 'y' : 'ies'}!`
      );
      setFile(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call success callback after a delay to show success message
      setTimeout(() => {
        onSuccess?.(data.count);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to upload opportunities');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Info Box */}
      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm">
            <p className="text-foreground font-medium">
              Upload a Markdown file with opportunities
            </p>
            <div className="text-muted-foreground space-y-1">
              <p>Expected format for each opportunity:</p>
              <pre className="text-xs bg-black/20 p-2 rounded mt-2 overflow-x-auto">
{`# Opportunity Name

**Type:** MAJOR or MICRO
**Lane:** Marketing (optional)
**Complexity:** Low, Medium, or High (optional)
**Estimated Cost:** 5000 (optional)
**Priority:** 1-4 (optional)
**Status:** IDEA, PLANNING, ACTIVE, or ON_HOLD (optional)

## Summary
Brief description

## Details
Detailed description

## Go-to-Market
Strategy description

## Notes
Additional notes

---
(Repeat for next opportunity)`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          dragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 bg-white/5 hover:border-white/20',
          uploading && 'opacity-50 pointer-events-none'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md"
          onChange={handleFileSelect}
          className="hidden"
          id="opportunity-file-upload"
        />

        <div className="space-y-4">
          <Upload
            className={cn(
              'h-12 w-12 mx-auto',
              dragActive ? 'text-indigo-400' : 'text-muted-foreground'
            )}
          />

          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-foreground">
                <FileText className="h-5 w-5" />
                <span className="font-medium">{file.name}</span>
                <button
                  onClick={handleClear}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-foreground font-medium">
                Drop your .md file here, or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Only .md (Markdown) files are supported
              </p>
            </div>
          )}

          <label
            htmlFor="opportunity-file-upload"
            className="inline-block px-6 py-2 rounded-lg bg-white/10 border border-white/10 text-foreground font-medium hover:bg-white/20 transition-colors cursor-pointer"
          >
            Select File
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={cn(
            'flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-opacity',
            'bg-gradient-to-r from-indigo-500 to-violet-500 text-white',
            'hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {uploading ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload & Create Opportunities
            </>
          )}
        </button>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground hover:bg-white/10 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

