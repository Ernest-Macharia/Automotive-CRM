'use client';

import { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Eye, 
  Download, 
  Trash2,
  Loader2,
  X
} from 'lucide-react';

interface FileUploadSectionProps {
  checklistId?: string;
  checklistType: 'pre' | 'post';
  files?: Array<{
    _id: string;
    filename: string;
    originalName: string;
    fileType: string;
    mimeType: string;
    size: number;
    path: string;
    uploadedAt: string;
  }>;
  onFileUpload?: (file: File) => Promise<void>;
  onFileDelete?: (fileId: string) => Promise<void>;
  onFileView?: (fileId: string) => void;
  onFileDownload?: (fileId: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
}

export default function FileUploadSection({
  checklistId,
  checklistType,
  files = [],
  onFileUpload,
  onFileDelete,
  onFileView,
  onFileDownload,
  disabled = false,
  maxFiles = 10,
  maxSizeMB = 50
}: FileUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const filesArray = Array.from(selectedFiles);

    // Validate file count
    if (files.length + filesArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate file sizes
    const oversizedFiles = filesArray.filter(file => file.size > maxSizeMB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed ${maxSizeMB}MB limit`);
      return;
    }

    // Upload files
    for (const file of filesArray) {
      if (onFileUpload) {
        await onFileUpload(file);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const handleDelete = async (fileId: string) => {
    if (onFileDelete) {
      await onFileDelete(fileId);
    }
  };

  const handleView = (fileId: string) => {
    if (onFileView) {
      onFileView(fileId);
    }
  };

  const handleDownload = (fileId: string) => {
    if (onFileDownload) {
      onFileDownload(fileId);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('video')) return '🎬';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">File Uploads</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload supporting documents, photos, or other files (max {maxFiles} files, {maxSizeMB}MB each)
        </p>
      </div>

      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
        <input
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload-input"
          disabled={disabled || uploading}
        />
        
        <label 
          htmlFor="file-upload-input"
          className={`cursor-pointer ${(disabled || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-gray-600">Uploading files...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">Click or drag files to upload</p>
              <p className="text-xs text-gray-500">Supports all file types</p>
            </div>
          )}
        </label>
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Uploaded Files ({files.length})
          </h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file._id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-lg">{getFileIcon(file.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span className="truncate">{file.mimeType}</span>
                      {file.uploadedAt && (
                        <>
                          <span>•</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleView(file._id)}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(file._id)}
                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(file._id)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Limits Info */}
      <div className="text-xs text-gray-500">
        <p>• Maximum {maxFiles} files allowed</p>
        <p>• Maximum {maxSizeMB}MB per file</p>
        <p>• Supported formats: All file types</p>
      </div>
    </div>
  );
}