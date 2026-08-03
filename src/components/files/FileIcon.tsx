import { Folder, FileImage, FileText, FileSpreadsheet, Presentation, Archive, FileCode2, File } from 'lucide-react';
import type { FileCategory, NodeType } from '@/types/database';

const CATEGORY_ICON: Record<FileCategory, typeof File> = {
  images: FileImage,
  pdfs: FileText,
  documents: FileText,
  spreadsheets: FileSpreadsheet,
  presentations: Presentation,
  archives: Archive,
  design_files: FileCode2,
  other: File,
};

const CATEGORY_COLOR: Record<FileCategory, string> = {
  images: 'text-purple-500 bg-purple-50',
  pdfs: 'text-red-500 bg-red-50',
  documents: 'text-blue-500 bg-blue-50',
  spreadsheets: 'text-emerald-500 bg-emerald-50',
  presentations: 'text-orange-500 bg-orange-50',
  archives: 'text-amber-500 bg-amber-50',
  design_files: 'text-pink-500 bg-pink-50',
  other: 'text-gray-500 bg-gray-100',
};

export function FileIcon({ type, category, className }: { type: NodeType; category: FileCategory | null; className?: string }) {
  if (type === 'folder') {
    return (
      <div className={`flex items-center justify-center rounded-lg bg-brand-50 text-brand-500 ${className}`}>
        <Folder className="h-1/2 w-1/2" />
      </div>
    );
  }
  const Icon = CATEGORY_ICON[category ?? 'other'];
  const color = CATEGORY_COLOR[category ?? 'other'];
  return (
    <div className={`flex items-center justify-center rounded-lg ${color} ${className}`}>
      <Icon className="h-1/2 w-1/2" />
    </div>
  );
}
