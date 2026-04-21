import { supabase } from './supabase';

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options: { maxSizeMB?: number; allowedTypes?: string[] } = {}
) {
  const { maxSizeMB = 2, allowedTypes } = options;

  // 1. Validation
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`);
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }

  // 2. Upload
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  // 3. Get Public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
}
