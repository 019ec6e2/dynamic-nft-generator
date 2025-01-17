import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validate that required environment variables are present
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_KEY: z.string().min(1),
});

const env = envSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_KEY,
});

// Create Supabase client
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

// Helper function to check if bucket exists and create if it doesn't
async function ensureBucketExists(bucketName: string): Promise<void> {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(bucketName, {
      public: true
    });
    if (error) throw error;
  }
}

// Helper function to upload image to Supabase storage
export async function uploadImageToStorage(
  imageUrl: string,
  assetId: string
): Promise<string> {
  const BUCKET_NAME = 'nft-images';

  try {
    // Ensure bucket exists
    await ensureBucketExists(BUCKET_NAME);

    // Download the image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error('Invalid file type: File must be an image');
    }

    const buffer = await response.arrayBuffer();

    // Upload to Supabase storage
    const fileName = `${assetId}_${Date.now()}.${contentType.split('/')[1] || 'png'}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}