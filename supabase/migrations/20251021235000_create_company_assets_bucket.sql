-- Create storage bucket for company assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-assets',
  'company-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Allow public access to company assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-assets');

-- Allow authenticated users to upload company assets
CREATE POLICY "Authenticated users can upload company assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-assets');

-- Allow authenticated users to update their company assets
CREATE POLICY "Authenticated users can update company assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-assets');

-- Allow authenticated users to delete their company assets
CREATE POLICY "Authenticated users can delete company assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-assets');