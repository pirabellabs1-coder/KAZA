-- =============================================================================
-- KAZA - Storage Buckets + policies
-- Wave 3 - Kossi (intégration finale)
--
-- Création de 3 buckets Supabase Storage avec policies RLS adaptées :
--   - identity-documents (privé) : pièces d'identité, selfies
--   - contracts          (privé) : PDFs de contrats signés
--   - property-photos    (public read) : photos d'annonces
--
-- Les fichiers sont scopés par `{userId}/...` pour les buckets privés et
-- par `{propertyId}/...` pour les photos d'annonces.
-- =============================================================================

-- 1. Création des buckets (idempotent via ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'identity-documents',
    'identity-documents',
    FALSE,
    5242880,                                    -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'contracts',
    'contracts',
    FALSE,
    10485760,                                   -- 10 MB
    ARRAY['application/pdf']
  ),
  (
    'property-photos',
    'property-photos',
    TRUE,                                        -- lecture publique pour les annonces
    10485760,                                   -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
ON CONFLICT (id) DO UPDATE
  SET file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types,
      public = EXCLUDED.public;

-- =============================================================================
-- 2. Policies — identity-documents (privé, scopé par userId en préfixe)
-- =============================================================================

DROP POLICY IF EXISTS "identity_documents_user_select" ON storage.objects;
CREATE POLICY "identity_documents_user_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'identity-documents'
    AND (
      auth.uid()::text = (string_to_array(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    )
  );

DROP POLICY IF EXISTS "identity_documents_user_insert" ON storage.objects;
CREATE POLICY "identity_documents_user_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

DROP POLICY IF EXISTS "identity_documents_user_delete" ON storage.objects;
CREATE POLICY "identity_documents_user_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'identity-documents'
    AND auth.uid()::text = (string_to_array(name, '/'))[1]
  );

-- =============================================================================
-- 3. Policies — contracts (privé, lecture pour parties du contrat)
-- =============================================================================
-- Convention path : {contractId}.pdf
-- L'accès est validé en croisant contracts.id avec storage.objects.name (sans extension)

DROP POLICY IF EXISTS "contracts_parties_select" ON storage.objects;
CREATE POLICY "contracts_parties_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.rentals r ON r.id = c.rental_id
      JOIN public.properties p ON p.id = r.property_id
      WHERE c.id::text = regexp_replace(storage.objects.name, '\.pdf$', '')
        AND (
          auth.uid() = p.owner_id
          OR auth.uid() = r.tenant_id
          OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN')
        )
    )
  );

-- Insertion réservée au service role (Edge Function). Pas de policy INSERT côté user.

-- =============================================================================
-- 4. Policies — property-photos (public read, write pour propriétaire)
-- =============================================================================
-- Convention path : {propertyId}/{filename}
-- Lecture publique car les annonces sont visibles sans authentification.

DROP POLICY IF EXISTS "property_photos_public_read" ON storage.objects;
CREATE POLICY "property_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

DROP POLICY IF EXISTS "property_photos_owner_insert" ON storage.objects;
CREATE POLICY "property_photos_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "property_photos_owner_delete" ON storage.objects;
CREATE POLICY "property_photos_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (string_to_array(storage.objects.name, '/'))[1]
        AND p.owner_id = auth.uid()
    )
  );
