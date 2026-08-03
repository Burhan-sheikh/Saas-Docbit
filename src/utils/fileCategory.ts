import type { FileCategory } from '@/types/database';

const EXTENSION_MAP: Record<string, FileCategory> = {
  png: 'images', jpg: 'images', jpeg: 'images', gif: 'images', webp: 'images', svg: 'images', bmp: 'images', heic: 'images', tiff: 'images',
  pdf: 'pdfs',
  doc: 'documents', docx: 'documents', txt: 'documents', rtf: 'documents', odt: 'documents', md: 'documents',
  xls: 'spreadsheets', xlsx: 'spreadsheets', csv: 'spreadsheets', ods: 'spreadsheets',
  ppt: 'presentations', pptx: 'presentations', odp: 'presentations', key: 'presentations',
  zip: 'archives', rar: 'archives', '7z': 'archives', tar: 'archives', gz: 'archives',
  psd: 'design_files', ai: 'design_files', fig: 'design_files', sketch: 'design_files', xd: 'design_files', indd: 'design_files',
};

/** Video and audio uploads are intentionally excluded from this platform. */
export const EXCLUDED_EXTENSIONS = new Set([
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv', 'flv', 'm4v',
  'mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma',
]);

export function categoryFromFileName(fileName: string): FileCategory {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MAP[ext] ?? 'other';
}

export function isExcludedFileType(fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return EXCLUDED_EXTENSIONS.has(ext);
}

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  images: 'Images',
  pdfs: 'PDFs',
  documents: 'Documents',
  spreadsheets: 'Spreadsheets',
  presentations: 'Presentations',
  archives: 'Archives',
  design_files: 'Design Files',
  other: 'Other',
};

export function isPreviewable(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('text/');
}
