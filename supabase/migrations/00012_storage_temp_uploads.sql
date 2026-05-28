-- =============================================================================
-- KAZA - Storage temp uploads (Wave 4 - Aminata)
--
-- Permet l'upload de photos AVANT la création de la propriété en base.
-- Convention de path : `temp/{userId}/{uuid}.{ext}`
--
-- Les fichiers temp restent dans le bucket public `property-photos` et leurs
-- URLs publiques sont persistées dans la table `property_photos` une fois
-- que la propriété est créée via `saveUploadedPhotoUrls()`.
--
-- Pour ne pas casser les policies existantes (qui exigent que le path
-- commence par `{propertyId}/...`), on AJOUTE deux policies dédiées au
-- préfixe `temp/` qui valident le propriétaire via `auth.uid()`.
-- =============================================================================

-- INSERT : utilisateur authentifié peut uploader dans temp/{son_id}/...
DROP POLICY IF EXISTS "property_photos_temp_insert" ON storage.objects;
CREATE POLICY "property_photos_temp_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos'
    AND (string_to_array(name, '/'))[1] = 'temp'
    AND (string_to_array(name, '/'))[2] = auth.uid()::text
  );

-- DELETE : utilisateur peut supprimer ses uploads temporaires
DROP POLICY IF EXISTS "property_photos_temp_delete" ON storage.objects;
CREATE POLICY "property_photos_temp_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-photos'
    AND (string_to_array(name, '/'))[1] = 'temp'
    AND (string_to_array(name, '/'))[2] = auth.uid()::text
  );
