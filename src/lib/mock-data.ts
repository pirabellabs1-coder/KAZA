// =============================================================================
// KAZA - Mock Data
// Realistic test data for the KAZA platform set in Benin / West Africa.
// Used by Server Components during development before Supabase is connected.
// The types mirror the database schema so swapping to real queries is seamless.
// =============================================================================

import type { User } from "@/types/users";
import type {
  Property,
  PropertyPhoto,
  PropertyWithPhotos,
  RoommateListing,
  Rating,
  Rental,
  VisitRequest,
  SavedProperty,
  Message,
  Contract,
  RoommateGroup,
  RoommateMember,
} from "@/types/properties";
import type { Payment, EscrowPayment } from "@/types/payments";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const mockUsers: User[] = [
  {
    id: "u-001-admin-kaza",
    email: "admin@kaza.bj",
    phone: "+22990000001",
    password_hash: "$2b$12$placeholder_hash_admin",
    first_name: "Kofi",
    last_name: "Mensah",
    profile_photo_url: null,
    role: "ADMIN",
    is_verified: true,
    verification_document_url: null,
    verification_selfie_url: null,
    verification_status: "APPROVED",
    address: "Quartier Ganhi, Cotonou, Benin",
    bio: "Administrateur de la plateforme KAZA.",
    rating_average: 0,
    created_at: "2025-01-15T08:00:00.000Z",
    updated_at: "2025-01-15T08:00:00.000Z",
  },
  {
    id: "u-002-owner-jean",
    email: "jean.dupont@gmail.com",
    phone: "+22997000001",
    password_hash: "$2b$12$placeholder_hash_jean",
    first_name: "Jean",
    last_name: "Dupont",
    profile_photo_url: null,
    role: "OWNER",
    is_verified: true,
    verification_document_url: "/kyc/jean-cni.jpg",
    verification_selfie_url: "/kyc/jean-selfie.jpg",
    verification_status: "APPROVED",
    address: "Fidjrosse, Cotonou, Benin",
    bio: "Proprietaire immobilier a Cotonou depuis 10 ans. Je propose des appartements modernes et bien entretenus dans les meilleurs quartiers de la ville.",
    rating_average: 4.6,
    created_at: "2025-02-01T10:30:00.000Z",
    updated_at: "2025-06-10T14:00:00.000Z",
  },
  {
    id: "u-003-owner-amina",
    email: "amina.kone@yahoo.fr",
    phone: "+22996000002",
    password_hash: "$2b$12$placeholder_hash_amina",
    first_name: "Amina",
    last_name: "Kone",
    profile_photo_url: null,
    role: "OWNER",
    is_verified: true,
    verification_document_url: "/kyc/amina-cni.jpg",
    verification_selfie_url: "/kyc/amina-selfie.jpg",
    verification_status: "APPROVED",
    address: "Akpakpa, Cotonou, Benin",
    bio: "Investisseuse immobiliere. Mes biens sont situes a Cotonou et Porto-Novo. Service de qualite et reactivite garantis.",
    rating_average: 4.8,
    created_at: "2025-02-15T09:00:00.000Z",
    updated_at: "2025-07-20T11:00:00.000Z",
  },
  {
    id: "u-004-tenant-thomas",
    email: "thomas.leroy@outlook.com",
    phone: "+22995000003",
    password_hash: "$2b$12$placeholder_hash_thomas",
    first_name: "Thomas",
    last_name: "Leroy",
    profile_photo_url: null,
    role: "TENANT",
    is_verified: true,
    verification_document_url: "/kyc/thomas-passport.jpg",
    verification_selfie_url: "/kyc/thomas-selfie.jpg",
    verification_status: "APPROVED",
    address: "Cadjehoun, Cotonou, Benin",
    bio: "Expatrie francais travaillant a Cotonou. Je cherche des logements confortables et bien situes.",
    rating_average: 4.5,
    created_at: "2025-03-10T16:00:00.000Z",
    updated_at: "2025-08-01T09:30:00.000Z",
  },
  {
    id: "u-005-student-fatou",
    email: "fatou.diallo@uac.bj",
    phone: "+22994000004",
    password_hash: "$2b$12$placeholder_hash_fatou",
    first_name: "Fatou",
    last_name: "Diallo",
    profile_photo_url: null,
    role: "STUDENT",
    is_verified: true,
    verification_document_url: "/kyc/fatou-carte-etudiant.jpg",
    verification_selfie_url: "/kyc/fatou-selfie.jpg",
    verification_status: "APPROVED",
    address: "Abomey-Calavi, Benin",
    bio: "Etudiante en 3eme annee de Droit a l'Universite d'Abomey-Calavi. Je recherche une colocation calme pres du campus.",
    rating_average: 4.9,
    created_at: "2025-04-01T12:00:00.000Z",
    updated_at: "2025-09-15T08:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Property Photos (helper arrays)
// ---------------------------------------------------------------------------

const propertyPhotos: Record<string, PropertyPhoto[]> = {
  "p-001": [
    { id: "ph-001-1", property_id: "p-001", photo_url: "https://picsum.photos/seed/p1-salon/800/600", display_order: 1, uploaded_at: "2025-03-01T10:00:00.000Z" },
    { id: "ph-001-2", property_id: "p-001", photo_url: "https://picsum.photos/seed/p1-chambre/800/600", display_order: 2, uploaded_at: "2025-03-01T10:01:00.000Z" },
    { id: "ph-001-3", property_id: "p-001", photo_url: "https://picsum.photos/seed/p1-cuisine/800/600", display_order: 3, uploaded_at: "2025-03-01T10:02:00.000Z" },
    { id: "ph-001-4", property_id: "p-001", photo_url: "https://picsum.photos/seed/p1-sdb/800/600", display_order: 4, uploaded_at: "2025-03-01T10:03:00.000Z" },
  ],
  "p-002": [
    { id: "ph-002-1", property_id: "p-002", photo_url: "https://picsum.photos/seed/p2-facade/800/600", display_order: 1, uploaded_at: "2025-03-05T11:00:00.000Z" },
    { id: "ph-002-2", property_id: "p-002", photo_url: "https://picsum.photos/seed/p2-salon/800/600", display_order: 2, uploaded_at: "2025-03-05T11:01:00.000Z" },
    { id: "ph-002-3", property_id: "p-002", photo_url: "https://picsum.photos/seed/p2-chambre1/800/600", display_order: 3, uploaded_at: "2025-03-05T11:02:00.000Z" },
    { id: "ph-002-4", property_id: "p-002", photo_url: "https://picsum.photos/seed/p2-chambre2/800/600", display_order: 4, uploaded_at: "2025-03-05T11:03:00.000Z" },
    { id: "ph-002-5", property_id: "p-002", photo_url: "https://picsum.photos/seed/p2-jardin/800/600", display_order: 5, uploaded_at: "2025-03-05T11:04:00.000Z" },
  ],
  "p-003": [
    { id: "ph-003-1", property_id: "p-003", photo_url: "https://picsum.photos/seed/p3-salon/800/600", display_order: 1, uploaded_at: "2025-03-10T09:00:00.000Z" },
    { id: "ph-003-2", property_id: "p-003", photo_url: "https://picsum.photos/seed/p3-chambre/800/600", display_order: 2, uploaded_at: "2025-03-10T09:01:00.000Z" },
    { id: "ph-003-3", property_id: "p-003", photo_url: "https://picsum.photos/seed/p3-terrasse/800/600", display_order: 3, uploaded_at: "2025-03-10T09:02:00.000Z" },
  ],
  "p-004": [
    { id: "ph-004-1", property_id: "p-004", photo_url: "https://picsum.photos/seed/p4-exterieur/800/600", display_order: 1, uploaded_at: "2025-04-01T14:00:00.000Z" },
    { id: "ph-004-2", property_id: "p-004", photo_url: "https://picsum.photos/seed/p4-salon/800/600", display_order: 2, uploaded_at: "2025-04-01T14:01:00.000Z" },
    { id: "ph-004-3", property_id: "p-004", photo_url: "https://picsum.photos/seed/p4-chambre/800/600", display_order: 3, uploaded_at: "2025-04-01T14:02:00.000Z" },
    { id: "ph-004-4", property_id: "p-004", photo_url: "https://picsum.photos/seed/p4-cuisine/800/600", display_order: 4, uploaded_at: "2025-04-01T14:03:00.000Z" },
  ],
  "p-005": [
    { id: "ph-005-1", property_id: "p-005", photo_url: "https://picsum.photos/seed/p5-facade/800/600", display_order: 1, uploaded_at: "2025-04-10T10:00:00.000Z" },
    { id: "ph-005-2", property_id: "p-005", photo_url: "https://picsum.photos/seed/p5-salon/800/600", display_order: 2, uploaded_at: "2025-04-10T10:01:00.000Z" },
    { id: "ph-005-3", property_id: "p-005", photo_url: "https://picsum.photos/seed/p5-chambre/800/600", display_order: 3, uploaded_at: "2025-04-10T10:02:00.000Z" },
    { id: "ph-005-4", property_id: "p-005", photo_url: "https://picsum.photos/seed/p5-sdb/800/600", display_order: 4, uploaded_at: "2025-04-10T10:03:00.000Z" },
    { id: "ph-005-5", property_id: "p-005", photo_url: "https://picsum.photos/seed/p5-balcon/800/600", display_order: 5, uploaded_at: "2025-04-10T10:04:00.000Z" },
  ],
  "p-006": [
    { id: "ph-006-1", property_id: "p-006", photo_url: "https://picsum.photos/seed/p6-salon/800/600", display_order: 1, uploaded_at: "2025-05-01T08:00:00.000Z" },
    { id: "ph-006-2", property_id: "p-006", photo_url: "https://picsum.photos/seed/p6-chambre/800/600", display_order: 2, uploaded_at: "2025-05-01T08:01:00.000Z" },
    { id: "ph-006-3", property_id: "p-006", photo_url: "https://picsum.photos/seed/p6-cuisine/800/600", display_order: 3, uploaded_at: "2025-05-01T08:02:00.000Z" },
  ],
  "p-007": [
    { id: "ph-007-1", property_id: "p-007", photo_url: "https://picsum.photos/seed/p7-facade/800/600", display_order: 1, uploaded_at: "2025-05-15T12:00:00.000Z" },
    { id: "ph-007-2", property_id: "p-007", photo_url: "https://picsum.photos/seed/p7-salon/800/600", display_order: 2, uploaded_at: "2025-05-15T12:01:00.000Z" },
    { id: "ph-007-3", property_id: "p-007", photo_url: "https://picsum.photos/seed/p7-chambre1/800/600", display_order: 3, uploaded_at: "2025-05-15T12:02:00.000Z" },
    { id: "ph-007-4", property_id: "p-007", photo_url: "https://picsum.photos/seed/p7-chambre2/800/600", display_order: 4, uploaded_at: "2025-05-15T12:03:00.000Z" },
  ],
  "p-008": [
    { id: "ph-008-1", property_id: "p-008", photo_url: "https://picsum.photos/seed/p8-exterieur/800/600", display_order: 1, uploaded_at: "2025-06-01T15:00:00.000Z" },
    { id: "ph-008-2", property_id: "p-008", photo_url: "https://picsum.photos/seed/p8-salon/800/600", display_order: 2, uploaded_at: "2025-06-01T15:01:00.000Z" },
    { id: "ph-008-3", property_id: "p-008", photo_url: "https://picsum.photos/seed/p8-chambre/800/600", display_order: 3, uploaded_at: "2025-06-01T15:02:00.000Z" },
    { id: "ph-008-4", property_id: "p-008", photo_url: "https://picsum.photos/seed/p8-piscine/800/600", display_order: 4, uploaded_at: "2025-06-01T15:03:00.000Z" },
    { id: "ph-008-5", property_id: "p-008", photo_url: "https://picsum.photos/seed/p8-jardin/800/600", display_order: 5, uploaded_at: "2025-06-01T15:04:00.000Z" },
  ],
};

// ---------------------------------------------------------------------------
// Properties
// ---------------------------------------------------------------------------

export const mockProperties: PropertyWithPhotos[] = [
  {
    id: "p-001",
    owner_id: "u-002-owner-jean",
    title: "Bel appartement meuble a Fidjrosse",
    description:
      "Superbe appartement de 2 chambres entierement meuble situe dans le quartier residentiel de Fidjrosse. Proche de la plage et des commerces. Salon spacieux avec climatisation, cuisine equipee moderne, salle de bain carrelee. Ideal pour couple ou expatrie. Gardiennage 24h/24, eau et electricite fiables.",
    price: 150000,
    bedrooms: 2,
    bathrooms: 1,
    square_meters: 75,
    amenities: ["WiFi", "Climatisation", "Cuisine equipee", "Meuble", "Gardiennage", "Eau courante"],
    location_latitude: 6.3456,
    location_longitude: 2.3789,
    address: "Fidjrosse, Cotonou, Benin",
    status: "AVAILABLE",
    property_type: "APARTMENT",
    views_count: 234,
    created_at: "2025-03-01T10:00:00.000Z",
    updated_at: "2025-09-01T08:00:00.000Z",
    photos: propertyPhotos["p-001"],
  },
  {
    id: "p-002",
    owner_id: "u-002-owner-jean",
    title: "Villa 4 chambres avec jardin a Calavi",
    description:
      "Magnifique villa de 4 chambres avec grand jardin a Abomey-Calavi. Parfaite pour une famille. Chaque chambre dispose de sa propre salle de bain. Grand salon, salle a manger, cuisine americaine equipee. Garage pour 2 voitures. Quartier calme et securise pres de l'universite. Groupe electrogene et forage d'eau inclus.",
    price: 300000,
    bedrooms: 4,
    bathrooms: 4,
    square_meters: 200,
    amenities: ["WiFi", "Climatisation", "Cuisine equipee", "Parking", "Jardin", "Groupe electrogene", "Forage", "Gardiennage"],
    location_latitude: 6.4485,
    location_longitude: 2.3456,
    address: "Abomey-Calavi, Benin",
    status: "AVAILABLE",
    property_type: "HOUSE",
    views_count: 567,
    created_at: "2025-03-05T11:00:00.000Z",
    updated_at: "2025-09-05T10:00:00.000Z",
    photos: propertyPhotos["p-002"],
  },
  {
    id: "p-003",
    owner_id: "u-003-owner-amina",
    title: "Studio moderne a Akpakpa",
    description:
      "Studio moderne et lumineux a Akpakpa, ideal pour etudiant ou jeune professionnel. Kitchenette equipee, salle de bain privative, terrasse avec vue. Proximite des transports (zemidjan et bus) et du marche Dantokpa. Quartier anime et vivant. Loyer tres competitif.",
    price: 55000,
    bedrooms: 0,
    bathrooms: 1,
    square_meters: 30,
    amenities: ["WiFi", "Ventilateur", "Kitchenette", "Terrasse"],
    location_latitude: 6.3621,
    location_longitude: 2.4234,
    address: "Akpakpa, Cotonou, Benin",
    status: "AVAILABLE",
    property_type: "STUDIO",
    views_count: 189,
    created_at: "2025-03-10T09:00:00.000Z",
    updated_at: "2025-08-20T14:00:00.000Z",
    photos: propertyPhotos["p-003"],
  },
  {
    id: "p-004",
    owner_id: "u-003-owner-amina",
    title: "Appartement 3 chambres a Cadjehoun",
    description:
      "Grand appartement de 3 chambres au coeur de Cadjehoun, le quartier des ambassades. Finitions haut de gamme, carrelage italien, menuiserie aluminium. Salon double, cuisine fermee entierement equipee, 2 salles de bain. Balcon avec vue sur la ville. Residence securisee avec interphone et parking souterrain.",
    price: 200000,
    bedrooms: 3,
    bathrooms: 2,
    square_meters: 120,
    amenities: ["WiFi", "Climatisation", "Cuisine equipee", "Parking", "Ascenseur", "Interphone", "Balcon", "Gardiennage"],
    location_latitude: 6.3703,
    location_longitude: 2.3912,
    address: "Cadjehoun, Cotonou, Benin",
    status: "AVAILABLE",
    property_type: "APARTMENT",
    views_count: 412,
    created_at: "2025-04-01T14:00:00.000Z",
    updated_at: "2025-09-10T16:00:00.000Z",
    photos: propertyPhotos["p-004"],
  },
  {
    id: "p-005",
    owner_id: "u-002-owner-jean",
    title: "Chambre meublee a Ganhi",
    description:
      "Chambre spacieuse meublee dans une maison partagee au centre-ville de Cotonou, quartier Ganhi. Acces a la cuisine commune, salon partage, et terrasse. Salle de bain privative. Ideal pour une personne seule. Proche de tous les services : banques, restaurants, pharmacies. Internet fibre optique inclus.",
    price: 65000,
    bedrooms: 1,
    bathrooms: 1,
    square_meters: 20,
    amenities: ["WiFi Fibre", "Meuble", "Cuisine commune", "Terrasse", "Eau chaude"],
    location_latitude: 6.3650,
    location_longitude: 2.4310,
    address: "Ganhi, Cotonou, Benin",
    status: "AVAILABLE",
    property_type: "ROOM",
    views_count: 98,
    created_at: "2025-04-10T10:00:00.000Z",
    updated_at: "2025-08-15T12:00:00.000Z",
    photos: propertyPhotos["p-005"],
  },
  {
    id: "p-006",
    owner_id: "u-003-owner-amina",
    title: "Appartement standing a Porto-Novo",
    description:
      "Bel appartement de standing a Porto-Novo, capitale administrative du Benin. 2 chambres avec placards integres, salon-salle a manger, cuisine americaine, salle de bain moderne. Residence calme dans le quartier Ouando. Parking securise. A 5 minutes du centre administratif et du Jardin des Plantes et de la Nature.",
    price: 120000,
    bedrooms: 2,
    bathrooms: 1,
    square_meters: 85,
    amenities: ["WiFi", "Climatisation", "Cuisine equipee", "Parking", "Placards integres", "Gardiennage"],
    location_latitude: 6.4969,
    location_longitude: 2.6288,
    address: "Ouando, Porto-Novo, Benin",
    status: "AVAILABLE",
    property_type: "APARTMENT",
    views_count: 156,
    created_at: "2025-05-01T08:00:00.000Z",
    updated_at: "2025-09-12T09:00:00.000Z",
    photos: propertyPhotos["p-006"],
  },
  {
    id: "p-007",
    owner_id: "u-002-owner-jean",
    title: "Maison 3 pieces a Godomey",
    description:
      "Maison individuelle de 3 pieces a Godomey, entre Cotonou et Abomey-Calavi. 2 chambres, salon, cuisine separee, salle de bain, petite cour. Quartier en plein developpement avec nouveaux commerces. Acces facile a la voie express Cotonou-Calavi. Ideal pour petit budget familial. Compteur SBEE et forage inclus.",
    price: 80000,
    bedrooms: 2,
    bathrooms: 1,
    square_meters: 65,
    amenities: ["Ventilateur", "Cuisine separee", "Cour", "Forage", "Compteur SBEE"],
    location_latitude: 6.3958,
    location_longitude: 2.3512,
    address: "Godomey, Abomey-Calavi, Benin",
    status: "RENTED",
    property_type: "HOUSE",
    views_count: 321,
    created_at: "2025-05-15T12:00:00.000Z",
    updated_at: "2025-07-01T10:00:00.000Z",
    photos: propertyPhotos["p-007"],
  },
  {
    id: "p-008",
    owner_id: "u-003-owner-amina",
    title: "Villa de luxe avec piscine a Cocotiers",
    description:
      "Exceptionnelle villa de luxe dans le quartier residentiel des Cocotiers a Cotonou. 3 grandes chambres climatisees avec salles de bain en suite. Vaste salon avec baies vitrees donnant sur la piscine et le jardin tropical. Cuisine americaine entierement equipee (four, lave-vaisselle, ilot central). Suite parentale avec dressing. Personnel de maison (gardien, jardinier) inclus dans le loyer.",
    price: 500000,
    bedrooms: 3,
    bathrooms: 3,
    square_meters: 250,
    amenities: ["WiFi Fibre", "Climatisation", "Cuisine equipee", "Parking", "Piscine", "Jardin", "Groupe electrogene", "Gardiennage", "Personnel de maison", "Lave-vaisselle"],
    location_latitude: 6.3380,
    location_longitude: 2.3950,
    address: "Les Cocotiers, Cotonou, Benin",
    status: "AVAILABLE",
    property_type: "HOUSE",
    views_count: 892,
    created_at: "2025-06-01T15:00:00.000Z",
    updated_at: "2025-09-18T11:00:00.000Z",
    photos: propertyPhotos["p-008"],
  },
];

// ---------------------------------------------------------------------------
// Roommate Listings (Student Colocation)
// ---------------------------------------------------------------------------

export const mockRoommateListings: RoommateListing[] = [
  {
    id: "rl-001",
    user_id: "u-005-student-fatou",
    title: "Colocation etudiante pres de l'UAC - 2 places disponibles",
    description:
      "Recherche 2 colocataires pour partager un appartement de 3 chambres a Abomey-Calavi, a 10 minutes a pied de l'Universite d'Abomey-Calavi (UAC). Ambiance studieuse et conviviale. Charges (eau, electricite, internet) partagees equitablement. Reglement interieur mis en place. Pas de fete en semaine.",
    room_size: "12m2",
    price: 35000,
    bedrooms_available: 2,
    people_looking_for: 2,
    preferred_profile: {
      age_min: 18,
      age_max: 28,
      gender: "ANY",
      discipline: "Toutes disciplines",
      is_smoker: false,
      is_quiet: true,
    },
    location_latitude: 6.4167,
    location_longitude: 2.3425,
    address: "Zogbadje, Abomey-Calavi, Benin",
    status: "OPEN",
    created_at: "2025-08-01T10:00:00.000Z",
    updated_at: "2025-09-01T08:00:00.000Z",
  },
  {
    id: "rl-002",
    user_id: "u-005-student-fatou",
    title: "Chambre disponible en colocation - Campus IRGIB Africa",
    description:
      "Une chambre se libere dans notre colocation de 4 etudiants pres de l'IRGIB Africa University a Cotonou. Appartement spacieux avec salon commun, cuisine equipee et buanderie. Ambiance internationale (etudiants beninois, togolais, ivoiriens). Fibre optique pour les cours en ligne. Bus campus a 2 minutes.",
    room_size: "14m2",
    price: 45000,
    bedrooms_available: 1,
    people_looking_for: 1,
    preferred_profile: {
      age_min: 18,
      age_max: 30,
      gender: "ANY",
      is_smoker: false,
    },
    location_latitude: 6.3890,
    location_longitude: 2.3678,
    address: "Sainte Rita, Cotonou, Benin",
    status: "OPEN",
    created_at: "2025-08-15T14:00:00.000Z",
    updated_at: "2025-09-10T12:00:00.000Z",
  },
  {
    id: "rl-003",
    user_id: "u-004-tenant-thomas",
    title: "Colocation mixte centre-ville - Etudiants et jeunes pros",
    description:
      "Belle colocation dans un grand appartement au centre de Cotonou, quartier Ganhi. 3 chambres (1 disponible), salon commun, grande terrasse, cuisine equipee. Ideal pour etudiant en stage ou jeune professionnel. Quartier central avec acces facile a tout Cotonou. Menage des parties communes inclus. Ambiance detendue mais respectueuse.",
    room_size: "16m2",
    price: 50000,
    bedrooms_available: 1,
    people_looking_for: 1,
    preferred_profile: {
      age_min: 20,
      age_max: 35,
      gender: "ANY",
      is_quiet: false,
    },
    location_latitude: 6.3655,
    location_longitude: 2.4295,
    address: "Ganhi, Cotonou, Benin",
    status: "OPEN",
    created_at: "2025-09-01T09:00:00.000Z",
    updated_at: "2025-09-15T16:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export const mockRatings: Rating[] = [
  {
    id: "rat-001",
    rater_id: "u-004-tenant-thomas",
    rated_user_id: "u-002-owner-jean",
    rental_id: "r-001",
    rating: 5,
    comment: "Excellent proprietaire. Appartement conforme aux photos, tres reactif en cas de probleme. Je recommande vivement.",
    created_at: "2025-07-15T10:00:00.000Z",
  },
  {
    id: "rat-002",
    rater_id: "u-002-owner-jean",
    rated_user_id: "u-004-tenant-thomas",
    rental_id: "r-001",
    rating: 4,
    comment: "Bon locataire, respectueux des lieux. Paiements toujours a temps. Petit retard une fois mais prevenu a l'avance.",
    created_at: "2025-07-16T09:00:00.000Z",
  },
  {
    id: "rat-003",
    rater_id: "u-005-student-fatou",
    rated_user_id: "u-003-owner-amina",
    rental_id: "r-002",
    rating: 5,
    comment: "Mme Kone est une proprietaire exceptionnelle. Le studio etait propre, bien equipe et le prix est tres raisonnable pour le quartier.",
    created_at: "2025-08-01T14:00:00.000Z",
  },
  {
    id: "rat-004",
    rater_id: "u-003-owner-amina",
    rated_user_id: "u-005-student-fatou",
    rental_id: "r-002",
    rating: 5,
    comment: "Fatou est une locataire ideale. Tres serieuse, propre et agreable. Son loyer est toujours paye avant la date limite.",
    created_at: "2025-08-02T08:00:00.000Z",
  },
  {
    id: "rat-005",
    rater_id: "u-004-tenant-thomas",
    rated_user_id: "u-003-owner-amina",
    rental_id: "r-003",
    rating: 4,
    comment: "Tres bon appartement a Porto-Novo. La climatisation a eu un souci mais Mme Kone a envoye un technicien le jour meme. Bien situe.",
    created_at: "2025-09-10T11:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Rentals
// ---------------------------------------------------------------------------

export const mockRentals: Rental[] = [
  {
    id: "r-001",
    property_id: "p-001",
    tenant_id: "u-004-tenant-thomas",
    start_date: "2025-04-01",
    end_date: "2026-03-31",
    monthly_rent: 150000,
    security_deposit: 300000,
    status: "ACTIVE",
    contract_url: "/contracts/r-001-contrat.pdf",
    created_at: "2025-03-20T10:00:00.000Z",
  },
  {
    id: "r-002",
    property_id: "p-003",
    tenant_id: "u-005-student-fatou",
    start_date: "2025-05-01",
    end_date: "2026-04-30",
    monthly_rent: 55000,
    security_deposit: 55000,
    status: "ACTIVE",
    contract_url: "/contracts/r-002-contrat.pdf",
    created_at: "2025-04-25T14:00:00.000Z",
  },
  {
    id: "r-003",
    property_id: "p-007",
    tenant_id: "u-004-tenant-thomas",
    start_date: "2025-07-01",
    end_date: null,
    monthly_rent: 80000,
    security_deposit: 160000,
    status: "ACTIVE",
    contract_url: "/contracts/r-003-contrat.pdf",
    created_at: "2025-06-25T09:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Visit Requests
// ---------------------------------------------------------------------------

export const mockVisitRequests: VisitRequest[] = [
  {
    id: "vr-001",
    property_id: "p-004",
    tenant_id: "u-004-tenant-thomas",
    requested_date: "2025-09-25",
    requested_time: "10:00:00",
    status: "PENDING",
    created_at: "2025-09-18T15:00:00.000Z",
  },
  {
    id: "vr-002",
    property_id: "p-008",
    tenant_id: "u-004-tenant-thomas",
    requested_date: "2025-09-27",
    requested_time: "14:30:00",
    status: "CONFIRMED",
    created_at: "2025-09-17T11:00:00.000Z",
  },
  {
    id: "vr-003",
    property_id: "p-002",
    tenant_id: "u-005-student-fatou",
    requested_date: "2025-09-22",
    requested_time: "09:00:00",
    status: "COMPLETED",
    created_at: "2025-09-15T08:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Saved Properties (Favorites)
// ---------------------------------------------------------------------------

export const mockSavedProperties: SavedProperty[] = [
  {
    id: "sp-001",
    user_id: "u-004-tenant-thomas",
    property_id: "p-004",
    created_at: "2025-09-10T16:00:00.000Z",
  },
  {
    id: "sp-002",
    user_id: "u-004-tenant-thomas",
    property_id: "p-008",
    created_at: "2025-09-12T14:00:00.000Z",
  },
  {
    id: "sp-003",
    user_id: "u-005-student-fatou",
    property_id: "p-002",
    created_at: "2025-09-14T10:00:00.000Z",
  },
  {
    id: "sp-004",
    user_id: "u-005-student-fatou",
    property_id: "p-005",
    created_at: "2025-09-15T09:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export const mockMessages: Message[] = [
  {
    id: "msg-001",
    sender_id: "u-004-tenant-thomas",
    recipient_id: "u-003-owner-amina",
    property_id: "p-004",
    roommate_listing_id: null,
    content: "Bonjour Mme Kone, je suis interesse par votre appartement a Cadjehoun. Est-il encore disponible ? Serait-il possible de planifier une visite ?",
    is_read: true,
    created_at: "2025-09-18T14:00:00.000Z",
  },
  {
    id: "msg-002",
    sender_id: "u-003-owner-amina",
    recipient_id: "u-004-tenant-thomas",
    property_id: "p-004",
    roommate_listing_id: null,
    content: "Bonjour M. Leroy, oui l'appartement est toujours disponible. Vous pouvez venir le visiter demain matin a 10h si cela vous convient. L'adresse exacte est au croisement Cadjehoun, en face de la pharmacie Sainte Rita.",
    is_read: true,
    created_at: "2025-09-18T14:30:00.000Z",
  },
  {
    id: "msg-003",
    sender_id: "u-004-tenant-thomas",
    recipient_id: "u-003-owner-amina",
    property_id: "p-004",
    roommate_listing_id: null,
    content: "Parfait, je serai la demain a 10h. Merci beaucoup !",
    is_read: false,
    created_at: "2025-09-18T14:45:00.000Z",
  },
  {
    id: "msg-004",
    sender_id: "u-005-student-fatou",
    recipient_id: "u-002-owner-jean",
    property_id: null,
    roommate_listing_id: null,
    content: "Bonjour M. Dupont, j'ai vu que vous avez plusieurs biens a Calavi. Avez-vous quelque chose de disponible pres de l'UAC pour une etudiante ?",
    is_read: true,
    created_at: "2025-09-15T10:00:00.000Z",
  },
  {
    id: "msg-005",
    sender_id: "u-002-owner-jean",
    recipient_id: "u-005-student-fatou",
    property_id: "p-002",
    roommate_listing_id: null,
    content: "Bonjour Fatou, j'ai ma villa a Calavi mais elle est peut-etre au-dessus de votre budget. Sinon je peux vous proposer la chambre meublee a Ganhi (65 000 XOF/mois). Qu'en pensez-vous ?",
    is_read: true,
    created_at: "2025-09-15T11:30:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export const mockPayments: Payment[] = [
  {
    id: "pay-001",
    rental_id: "r-001",
    user_id: "u-004-tenant-thomas",
    amount: 150000,
    payment_method: "MOBILE_MONEY",
    transaction_id: "FDP-2025-001-MTN",
    status: "COMPLETED",
    payment_date: "2025-09-01T08:15:00.000Z",
    created_at: "2025-09-01T08:10:00.000Z",
  },
  {
    id: "pay-002",
    rental_id: "r-002",
    user_id: "u-005-student-fatou",
    amount: 55000,
    payment_method: "MOBILE_MONEY",
    transaction_id: "FDP-2025-002-MOOV",
    status: "COMPLETED",
    payment_date: "2025-09-02T10:30:00.000Z",
    created_at: "2025-09-02T10:25:00.000Z",
  },
  {
    id: "pay-003",
    rental_id: "r-003",
    user_id: "u-004-tenant-thomas",
    amount: 80000,
    payment_method: "BANK_TRANSFER",
    transaction_id: "BT-2025-003-BOA",
    status: "COMPLETED",
    payment_date: "2025-09-03T14:00:00.000Z",
    created_at: "2025-09-03T09:00:00.000Z",
  },
  {
    id: "pay-004",
    rental_id: "r-001",
    user_id: "u-004-tenant-thomas",
    amount: 150000,
    payment_method: "MOBILE_MONEY",
    transaction_id: "FDP-2025-004-MTN",
    status: "PENDING",
    payment_date: null,
    created_at: "2025-10-01T08:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Contracts
// ---------------------------------------------------------------------------

export const mockContracts: Contract[] = [
  {
    id: "ctr-001",
    rental_id: "r-001",
    roommate_group_id: null,
    contract_type: "RENTAL",
    contract_pdf_url: "/contracts/r-001-contrat.pdf",
    signed_by_owner: true,
    signed_by_tenant: true,
    created_at: "2025-03-20T10:00:00.000Z",
    signed_at: "2025-03-22T15:00:00.000Z",
  },
  {
    id: "ctr-002",
    rental_id: "r-002",
    roommate_group_id: null,
    contract_type: "RENTAL",
    contract_pdf_url: "/contracts/r-002-contrat.pdf",
    signed_by_owner: true,
    signed_by_tenant: true,
    created_at: "2025-04-25T14:00:00.000Z",
    signed_at: "2025-04-27T09:00:00.000Z",
  },
  {
    id: "ctr-003",
    rental_id: "r-003",
    roommate_group_id: null,
    contract_type: "RENTAL",
    contract_pdf_url: "/contracts/r-003-contrat.pdf",
    signed_by_owner: true,
    signed_by_tenant: true,
    created_at: "2025-06-25T09:00:00.000Z",
    signed_at: "2025-06-28T11:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Roommate Groups & Members
// ---------------------------------------------------------------------------

export const mockRoommateGroups: RoommateGroup[] = [
  {
    id: "rg-001",
    listing_id: "rl-001",
    group_name: "Coloc UAC Droit",
    created_at: "2025-08-05T10:00:00.000Z",
  },
];

export const mockRoommateMembers: RoommateMember[] = [
  {
    id: "rm-001",
    group_id: "rg-001",
    user_id: "u-005-student-fatou",
    status: "ACTIVE",
    joined_at: "2025-08-05T10:00:00.000Z",
    left_at: null,
  },
];

// ---------------------------------------------------------------------------
// Escrow Payments (V2 feature - for reference)
// ---------------------------------------------------------------------------

export const mockEscrowPayments: EscrowPayment[] = [
  {
    id: "esc-001",
    rental_id: "r-001",
    tenant_id: "u-004-tenant-thomas",
    owner_id: "u-002-owner-jean",
    total_amount: 300000,
    amount_paid: 300000,
    duration_days: 30,
    status: "COMPLETED",
    release_date: "2025-05-01T00:00:00.000Z",
    created_at: "2025-03-25T10:00:00.000Z",
  },
];

// ---------------------------------------------------------------------------
// Helper functions for querying mock data
// ---------------------------------------------------------------------------

/** Get all available properties (simulates a public listing query) */
export function getAvailableProperties(): PropertyWithPhotos[] {
  return mockProperties.filter((p) => p.status === "AVAILABLE");
}

/** Get a single property by ID */
export function getPropertyById(id: string): PropertyWithPhotos | undefined {
  return mockProperties.find((p) => p.id === id);
}

/** Get properties owned by a specific user */
export function getPropertiesByOwner(ownerId: string): PropertyWithPhotos[] {
  return mockProperties.filter((p) => p.owner_id === ownerId);
}

/** Get a user by ID */
export function getUserById(id: string): User | undefined {
  return mockUsers.find((u) => u.id === id);
}

/** Get featured properties (highest view count, available only) */
export function getFeaturedProperties(limit = 4): PropertyWithPhotos[] {
  return getAvailableProperties()
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, limit);
}

/** Get roommate listings that are still open */
export function getOpenRoommateListings(): RoommateListing[] {
  return mockRoommateListings.filter((rl) => rl.status === "OPEN");
}

/** Get ratings for a specific user */
export function getRatingsByUserId(userId: string): Rating[] {
  return mockRatings.filter((r) => r.rated_user_id === userId);
}

/** Get rentals for a specific tenant */
export function getRentalsByTenantId(tenantId: string): Rental[] {
  return mockRentals.filter((r) => r.tenant_id === tenantId);
}

/** Get payments for a specific user */
export function getPaymentsByUserId(userId: string): Payment[] {
  return mockPayments.filter((p) => p.user_id === userId);
}

/** Search properties by text query (title + address + description) */
export function searchProperties(query: string): PropertyWithPhotos[] {
  const lower = query.toLowerCase();
  return getAvailableProperties().filter(
    (p) =>
      p.title.toLowerCase().includes(lower) ||
      p.address.toLowerCase().includes(lower) ||
      (p.description && p.description.toLowerCase().includes(lower))
  );
}

/** Get saved/favorited property IDs for a user */
export function getSavedPropertyIds(userId: string): string[] {
  return mockSavedProperties
    .filter((sp) => sp.user_id === userId)
    .map((sp) => sp.property_id);
}

/** Get messages between two users */
export function getConversation(userId1: string, userId2: string): Message[] {
  return mockMessages
    .filter(
      (m) =>
        (m.sender_id === userId1 && m.recipient_id === userId2) ||
        (m.sender_id === userId2 && m.recipient_id === userId1)
    )
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
}
