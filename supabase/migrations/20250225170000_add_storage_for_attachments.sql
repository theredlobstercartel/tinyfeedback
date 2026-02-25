-- Migration: Create storage buckets for feedback attachments
-- Story: ST-06 - Widget Screenshot e Anexos

-- Create the feedback-attachments bucket
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'feedback-attachments',
  'feedback-attachments',
  true,
  false,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create policy to allow public read access to attachments
CREATE POLICY "Public read access for feedback attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'feedback-attachments');

-- Create policy to allow widget uploads (authenticated via API key)
-- The actual API key validation happens in the Next.js API route
CREATE POLICY "Allow widget uploads to feedback-attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'feedback-attachments' AND
  (storage.extension(name) = 'jpg' OR
   storage.extension(name) = 'jpeg' OR
   storage.extension(name) = 'png' OR
   storage.extension(name) = 'gif' OR
   storage.extension(name) = 'webp')
);

-- Add storage tracking columns to bmad_projects table
ALTER TABLE bmad_projects 
ADD COLUMN IF NOT EXISTS storage_used_mb DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 100;

-- Add comments for documentation
COMMENT ON COLUMN bmad_projects.storage_used_mb IS 'Current storage usage in MB for feedback attachments';
COMMENT ON COLUMN bmad_projects.storage_limit_mb IS 'Storage limit in MB (100 for free, configurable for Pro)';

-- Create index for storage usage queries
CREATE INDEX IF NOT EXISTS idx_bmad_projects_storage ON bmad_projects(storage_used_mb) WHERE storage_used_mb > 0;

-- Add attachment_urls column to feedbacks table to store multiple attachments
ALTER TABLE feedbacks 
ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN feedbacks.attachment_urls IS 'Array of URLs for feedback attachments stored in Supabase Storage';

-- Create index for attachment queries
CREATE INDEX IF NOT EXISTS idx_feedbacks_attachment_urls ON feedbacks USING GIN(attachment_urls) WHERE attachment_urls IS NOT NULL;
