import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUploadFile } from '@/hooks/useFiles';
import { isExcludedFileType } from '@/utils/fileCategory';
import { cn } from '@/utils/cn';

interface UploadDropzoneProps {
  projectId: string;
  parentId: string | null;
  disabled?: boolean;
}

export function UploadDropzone({ projectId, parentId, disabled }: UploadDropzoneProps) {
  const uploadFile = useUploadFile(projectId);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((file) => {
        if (isExcludedFileType(file.name)) {
          toast.error(`${file.name}: video and audio files are not supported`);
          return;
        }
        setProgressMap((p) => ({ ...p, [file.name]: 0 }));
        uploadFile.mutate(
          {
            parentId,
            file,
            onProgress: (percent) => setProgressMap((p) => ({ ...p, [file.name]: percent })),
          },
          {
            onSuccess: () => setProgressMap((p) => { const next = { ...p }; delete next[file.name]; return next; }),
            onError: () => setProgressMap((p) => { const next = { ...p }; delete next[file.name]; return next; }),
          }
        );
      });
    },
    [uploadFile, parentId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, disabled });

  const activeUploads = Object.entries(progressMap);

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-7 w-7 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Drag & drop files here, or click to browse</p>
        <p className="text-xs text-gray-400">Files are auto-organized by type. Video and audio files aren't supported.</p>
      </div>

      {activeUploads.length > 0 && (
        <div className="mt-3 space-y-2">
          {activeUploads.map(([name, percent]) => (
            <div key={name} className="rounded-lg border border-gray-200 bg-white p-2.5">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="truncate text-gray-700">{name}</span>
                <span className="text-gray-400">{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
