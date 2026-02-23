-- Storage Buckets Setup for Custom Showers Website
-- Version: 1.0.0

-- ============================================
-- CREATE STORAGE BUCKETS
-- ============================================

-- DXF files bucket (private - contains CAD files for glass suppliers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dxf-files',
  'dxf-files',
  false,
  5242880, -- 5MB limit
  ARRAY['application/dxf', 'application/octet-stream', 'image/vnd.dxf']
)
ON CONFLICT (id) DO NOTHING;

-- Hardware specifications bucket (private - PDF specs for suppliers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hardware-specs',
  'hardware-specs',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'text/csv', 'application/vnd.ms-excel']
)
ON CONFLICT (id) DO NOTHING;

-- Instruction sheets bucket (private - PDF instructions for customers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'instruction-sheets',
  'instruction-sheets',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Design snapshots bucket (private - images of customer designs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-snapshots',
  'design-snapshots',
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Customer uploads bucket (private - photos of bathrooms, measurements, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-uploads',
  'customer-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- DXF Files: Only admins can access
CREATE POLICY "Admins can upload DXF files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dxf-files' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

CREATE POLICY "Admins can read DXF files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dxf-files' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

CREATE POLICY "Admins can delete DXF files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'dxf-files' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

-- Hardware Specs: Only admins can access
CREATE POLICY "Admins can upload hardware specs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'hardware-specs' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

CREATE POLICY "Admins can read hardware specs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'hardware-specs' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

-- Instruction Sheets: Admins can upload, customers can read their own
CREATE POLICY "Admins can upload instruction sheets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'instruction-sheets' AND
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE email = auth.jwt() ->> 'email'
    AND is_active = TRUE
  )
);

CREATE POLICY "Customers can read their instruction sheets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'instruction-sheets' AND
  (
    -- Customers can access files that match their order
    (storage.foldername(name))[1] IN (
      SELECT order_number FROM orders o
      INNER JOIN customers c ON o.customer_id = c.id
      WHERE c.email = auth.jwt() ->> 'email'
    )
    OR
    -- Admins can access all
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  )
);

-- Design Snapshots: Users can manage their own, admins can access all
CREATE POLICY "Users can upload design snapshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'design-snapshots'
);

CREATE POLICY "Users can read design snapshots"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'design-snapshots' AND
  (
    -- Users can access files in folders matching their email
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR
    -- Admins can access all
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  )
);

CREATE POLICY "Users can delete their design snapshots"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'design-snapshots' AND
  (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- Customer Uploads: Users can manage their own, admins can access all
CREATE POLICY "Customers can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-uploads'
);

CREATE POLICY "Customers can read their uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-uploads' AND
  (
    -- Users can access files in folders matching their email
    (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
    OR
    -- Admins can access all
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = TRUE
    )
  )
);

CREATE POLICY "Customers can delete their uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-uploads' AND
  (storage.foldername(name))[1] = (auth.jwt() ->> 'email')
);

-- ============================================
-- STORAGE HELPER FUNCTIONS
-- ============================================

-- Function to get signed URL for private files
CREATE OR REPLACE FUNCTION get_signed_url(bucket TEXT, path TEXT, expires_in INTEGER DEFAULT 3600)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This is a placeholder - actual implementation will use Supabase storage API
  -- In practice, this will be called from the application layer
  RETURN storage.sign_url(bucket, path, expires_in);
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION get_signed_url IS 'Generate temporary signed URLs for private storage objects';
