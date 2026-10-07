import React, { useState, useRef } from 'react';
import { fileApi } from '@/core/api/fileApi';
import { toast } from 'sonner';
import { 
  UploadCloud, 
  FileText, 
  X, 
  Loader2,
  CheckCircle2
} from 'lucide-react';

/**
 * Reusable Optional File Upload Component with 5MB Size Restriction
 * Supports visits, organizations, and individual guests.
 */
export const FileUploadInput = ({
  label = 'Supporting Document / Attachment',
  description = 'Optional: Upload PDF, Word, Excel, or ID scan (Max 5MB)',
  value = { url: '', name: '' },
  onChange,
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';

    // Enforce 5MB limit on client
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File "${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum allowed size is 5MB.`);
      return;
    }

    try {
      setIsUploading(true);
      const res = await fileApi.uploadFile(file);
      toast.success(`File "${res.fileName}" attached successfully!`);
      if (onChange) {
        onChange({ url: res.fileUrl, name: res.fileName, size: res.fileSize });
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to upload document.';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onChange) {
      onChange({ url: '', name: '' });
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 tracking-wide">
          {label} <span className="text-slate-400 font-normal">(Optional • Max 5MB)</span>
        </label>
      )}

      {value?.url ? (
        <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{value.name || 'Attached Document'}</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
            onChange={handleFileSelected}
            disabled={isUploading}
          />
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-slate-200 hover:border-[#00adef] rounded-xl p-3.5 text-center cursor-pointer transition-all bg-slate-50/60 hover:bg-sky-50/40 ${
              isUploading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-[#00adef] font-semibold py-1">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading document...
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1">
                <UploadCloud className="w-6 h-6 text-[#00adef]" />
                <p className="text-xs font-semibold text-slate-700">
                  Click or drag file to attach <span className="text-[#00adef] font-bold">browse</span>
                </p>
                <p className="text-[10px] text-slate-400">{description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadInput;
