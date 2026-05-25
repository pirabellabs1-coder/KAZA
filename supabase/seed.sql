-- KAZA Seed Data - Données de test pour développement local
-- Exécuter avec: supabase db seed

-- Note: Les mots de passe hashés sont "password123" (bcrypt)
-- En développement local, Supabase Auth gère les utilisateurs séparément

-- Insérer des utilisateurs de test
INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role, is_verified, verification_status, address, bio, rating_average) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@kaza.com', '+22990000001', '$2a$10$dummy_hash_admin', 'Kofi', 'Mensah', 'ADMIN', true, 'APPROVED', 'Cotonou, Bénin', 'Administrateur de la plateforme KAZA', 5.00),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'jean.dupont@email.com', '+22997000001', '$2a$10$dummy_hash_jean', 'Jean', 'Dupont', 'OWNER', true, 'APPROVED', 'Fidjrossè, Cotonou', 'Propriétaire immobilier avec 5 ans d''expérience à Cotonou. Spécialisé dans les appartements modernes.', 4.80),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'amina.kone@email.com', '+22997000002', '$2a$10$dummy_hash_amina', 'Amina', 'Koné', 'OWNER', true, 'APPROVED', 'Akpakpa, Cotonou', 'Gérante de résidences étudiantes et familiales à Cotonou et Porto-Novo.', 4.60),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'thomas.leroy@email.com', '+22997000003', '$2a$10$dummy_hash_thomas', 'Thomas', 'Leroy', 'TENANT', true, 'APPROVED', 'Cadjèhoun, Cotonou', 'Expatrié français travaillant dans le développement international.', 4.90),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'fatou.diallo@email.com', '+22997000004', '$2a$10$dummy_hash_fatou', 'Fatou', 'Diallo', 'STUDENT', true, 'APPROVED', 'Calavi, Abomey-Calavi', 'Étudiante en informatique à l''UAC. Cherche colocation près du campus.', 4.50);

-- Insérer des propriétés avec coordonnées PostGIS
INSERT INTO properties (id, owner_id, title, description, price, bedrooms, bathrooms, square_meters, amenities, location, address, status, property_type, views_count) VALUES
  ('p1a2b3c4-d5e6-7890-abcd-ef1234567890', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Villa Moderne Fidjrossè', 'Magnifique villa moderne avec vue sur l''océan. 4 chambres spacieuses, cuisine équipée, jardin tropical et piscine. Quartier résidentiel calme et sécurisé.', 350000, 4, 3, 250, ARRAY['WiFi', 'Parking', 'Cuisine équipée', 'Climatisation', 'Piscine', 'Jardin', 'Sécurité', 'Groupe électrogène'], ST_MakePoint(2.3654, 6.3545)::geography, 'Fidjrossè, Cotonou', 'AVAILABLE', 'HOUSE', 245),
  ('p2b3c4d5-e6f7-8901-bcde-f12345678902', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Appartement Cocotiers', 'Bel appartement T3 au cœur du quartier des Cocotiers. Entièrement meublé et climatisé. Proche de tous les commerces et restaurants.', 180000, 2, 2, 95, ARRAY['WiFi', 'Climatisation', 'Cuisine équipée', 'Meublé', 'Eau chaude', 'Balcon'], ST_MakePoint(2.4312, 6.3703)::geography, 'Cocotiers, Cotonou', 'AVAILABLE', 'APARTMENT', 189),
  ('p3c4d5e6-f7a8-9012-cdef-123456789013', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Studio Cadjèhoun', 'Studio moderne idéal pour jeune professionnel. Cuisine américaine, salle de bain moderne. Quartier central et dynamique.', 85000, 1, 1, 35, ARRAY['WiFi', 'Climatisation', 'Cuisine équipée', 'Eau chaude'], ST_MakePoint(2.4100, 6.3650)::geography, 'Cadjèhoun, Cotonou', 'AVAILABLE', 'STUDIO', 156),
  ('p4d5e6f7-a8b9-0123-defa-234567890124', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Résidence Calavi Premium', 'Grand appartement familial dans résidence sécurisée. 3 chambres, salon spacieux, cuisine équipée. Proche des écoles et de l''université.', 150000, 3, 2, 120, ARRAY['WiFi', 'Parking', 'Cuisine équipée', 'Climatisation', 'Sécurité', 'Forage', 'Groupe électrogène'], ST_MakePoint(2.3500, 6.4500)::geography, 'Calavi, Abomey-Calavi', 'AVAILABLE', 'APARTMENT', 210),
  ('p5e6f7a8-b9c0-1234-efab-345678901235', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Maison Akpakpa', 'Maison traditionnelle rénovée avec 3 chambres. Grand salon, cour intérieure. Quartier populaire et vivant.', 120000, 3, 2, 140, ARRAY['Parking', 'Cuisine équipée', 'Forage', 'Groupe électrogène', 'Cour'], ST_MakePoint(2.4500, 6.3600)::geography, 'Akpakpa, Cotonou', 'AVAILABLE', 'HOUSE', 134),
  ('p6f7a8b9-c0d1-2345-fabc-456789012346', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Penthouse Ganhi', 'Luxueux penthouse au dernier étage. Vue panoramique sur Cotonou. Terrasse privée, finitions haut de gamme.', 500000, 3, 2, 180, ARRAY['WiFi', 'Parking', 'Cuisine équipée', 'Climatisation', 'Terrasse', 'Ascenseur', 'Sécurité', 'Groupe électrogène', 'Meublé'], ST_MakePoint(2.4250, 6.3700)::geography, 'Ganhi, Cotonou', 'AVAILABLE', 'APARTMENT', 312),
  ('p7a8b9c0-d1e2-3456-abcd-567890123457', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Appartement Porto-Novo Centre', 'Appartement lumineux au centre de Porto-Novo. 2 chambres, balcon avec vue sur la ville. Proche de tous les services.', 95000, 2, 1, 75, ARRAY['WiFi', 'Climatisation', 'Balcon', 'Eau chaude'], ST_MakePoint(2.6036, 6.4969)::geography, 'Centre-ville, Porto-Novo', 'AVAILABLE', 'APARTMENT', 98),
  ('p8b9c0d1-e2f3-4567-bcde-678901234568', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Villa Godomey', 'Belle villa dans le quartier résidentiel de Godomey. 4 chambres, jardin arboré. Environnement calme, idéal pour famille.', 250000, 4, 3, 200, ARRAY['WiFi', 'Parking', 'Cuisine équipée', 'Climatisation', 'Jardin', 'Sécurité', 'Forage', 'Groupe électrogène'], ST_MakePoint(2.3800, 6.3900)::geography, 'Godomey, Abomey-Calavi', 'RENTED', 'HOUSE', 278);

-- Photos des propriétés
INSERT INTO property_photos (property_id, photo_url, display_order) VALUES
  ('p1a2b3c4-d5e6-7890-abcd-ef1234567890', '/images/property-1.jpg', 1),
  ('p1a2b3c4-d5e6-7890-abcd-ef1234567890', '/images/property-2.jpg', 2),
  ('p1a2b3c4-d5e6-7890-abcd-ef1234567890', '/images/property-3.jpg', 3),
  ('p2b3c4d5-e6f7-8901-bcde-f12345678902', '/images/property-4.jpg', 1),
  ('p2b3c4d5-e6f7-8901-bcde-f12345678902', '/images/property-5.jpg', 2),
  ('p3c4d5e6-f7a8-9012-cdef-123456789013', '/images/property-6.jpg', 1),
  ('p4d5e6f7-a8b9-0123-defa-234567890124', '/images/property-7.jpg', 1),
  ('p4d5e6f7-a8b9-0123-defa-234567890124', '/images/property-8.jpg', 2),
  ('p5e6f7a8-b9c0-1234-efab-345678901235', '/images/property-1.jpg', 1),
  ('p6f7a8b9-c0d1-2345-fabc-456789012346', '/images/property-2.jpg', 1),
  ('p6f7a8b9-c0d1-2345-fabc-456789012346', '/images/property-3.jpg', 2),
  ('p6f7a8b9-c0d1-2345-fabc-456789012346', '/images/property-4.jpg', 3),
  ('p7a8b9c0-d1e2-3456-abcd-567890123457', '/images/property-5.jpg', 1),
  ('p8b9c0d1-e2f3-4567-bcde-678901234568', '/images/property-6.jpg', 1),
  ('p8b9c0d1-e2f3-4567-bcde-678901234568', '/images/property-7.jpg', 2);

-- Colocation étudiante
INSERT INTO roommate_listings (id, user_id, title, description, room_size, price, bedrooms_available, people_looking_for, preferred_profile, location, address, status) VALUES
  ('rl1a2b3c-d4e5-6789-abcd-ef1234567890', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'Chambre UAC Campus', 'Chambre dans colocation étudiante à 5 min de l''UAC. Cuisine et salon partagés. WiFi inclus.', 'Grande', 45000, 1, 1, '{"ageMin": 18, "ageMax": 25, "gender": "any", "discipline": "any"}', ST_MakePoint(2.3450, 6.4200)::geography, 'Abomey-Calavi, près UAC', 'OPEN'),
  ('rl2b3c4d-e5f6-7890-bcde-f12345678901', 'e5f6a7b8-c9d0-1234-efab-345678901234', 'Studio Partagé IRGIB', 'Studio partagé pour 2 personnes près de IRGIB Africa. Meublé, climatisé.', 'Moyenne', 35000, 1, 1, '{"ageMin": 18, "ageMax": 28, "gender": "male", "discipline": "informatique"}', ST_MakePoint(2.4150, 6.3750)::geography, 'Cotonou, près IRGIB', 'OPEN'),
  ('rl3c4d5e-f6a7-8901-cdef-123456789012', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Résidence Étudiante Calavi', 'Chambre privée dans résidence étudiante. Charges incluses, sécurité 24h.', 'Grande', 55000, 2, 2, '{"ageMin": 18, "ageMax": 25, "gender": "any", "discipline": "any"}', ST_MakePoint(2.3520, 6.4480)::geography, 'Calavi Centre, Abomey-Calavi', 'OPEN');

-- Avis
INSERT INTO ratings (rater_id, rated_user_id, rating, comment) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 5, 'Excellent propriétaire, très réactif et professionnel. L''appartement était exactement comme décrit.'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 4, 'Bonne expérience dans l''ensemble. La résidence est bien entretenue.'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 5, 'Parfait pour les étudiants. Proche du campus et tous les équipements nécessaires.'),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'd4e5f6a7-b8c9-0123-defa-234567890123', 5, 'Locataire exemplaire. Toujours à l''heure pour les paiements et respectueux du bien.'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'e5f6a7b8-c9d0-1234-efab-345678901234', 4, 'Bonne colocataire, respectueuse et ordonnée.');

-- Propriétés sauvegardées
INSERT INTO saved_properties (user_id, property_id) VALUES
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'p1a2b3c4-d5e6-7890-abcd-ef1234567890'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'p2b3c4d5-e6f7-8901-bcde-f12345678902'),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'p6f7a8b9-c0d1-2345-fabc-456789012346'),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'p4d5e6f7-a8b9-0123-defa-234567890124');
