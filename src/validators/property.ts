// =============================================================================
// KAZA - Property Validation Schemas (Zod v4)
// Used by React Hook Form on the client and Server Actions on the server
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Wizard de création (8 étapes) — schéma complet utilisé par le client.
// Le schéma legacy `createPropertySchema` reste en dessous pour la
// compatibilité avec l'action serveur existante.
// ---------------------------------------------------------------------------

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "STUDIO",
  "OFFICE",
  "LAND",
  "COMMERCIAL",
] as const;

export const TARGET_AUDIENCES = [
  "STUDENT",
  "FAMILY",
  "PROFESSIONAL",
  "EXPAT",
  "SHORT_TERM",
  "LONG_TERM",
] as const;

export const PUBLISH_STATUSES = ["DRAFT", "PUBLISHED", "SCHEDULED"] as const;

export const LISTING_PURPOSES = ["RENT", "SALE"] as const;

export const propertyFormSchema = z.object({
  // Étape 1 : Type
  type: z.enum(PROPERTY_TYPES, {
    message: "Sélectionnez un type de bien",
  }),
  listingPurpose: z.enum(LISTING_PURPOSES).default("RENT"),

  // Étape 2 : Localisation (obligatoire)
  countryCode: z.string().length(2, "Sélectionnez un pays"),
  citySlug: z.string().min(1, "Sélectionnez une ville"),
  neighborhoodSlug: z.string().min(1, "Sélectionnez un quartier"),
  addressLine: z.string().min(5, "Adresse précise requise"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  landmark: z.string().optional(),

  // Étape 3 : Caractéristiques
  title: z
    .string()
    .min(10, "Titre trop court (min 10 caractères)")
    .max(120, "Titre trop long (max 120 caractères)"),
  description: z
    .string()
    .min(50, "Description trop courte (min 50 caractères)")
    .max(3000, "Description trop longue (max 3000 caractères)"),
  surface: z
    .number({ message: "Surface requise" })
    .min(5, "Min 5 m²")
    .max(10000, "Max 10 000 m²"),
  rooms: z
    .number({ message: "Nombre de pièces requis" })
    .int()
    .min(0)
    .max(20),
  bedrooms: z
    .number({ message: "Nombre de chambres requis" })
    .int()
    .min(0)
    .max(20),
  bathrooms: z
    .number({ message: "Nombre de salles de bain requis" })
    .int()
    .min(0)
    .max(20),
  floor: z.number().int().min(-3).max(50).optional(),
  totalFloors: z.number().int().min(1).max(50).optional(),
  yearBuilt: z.number().int().min(1900).max(2030).optional(),

  // Étape 4 : Équipements (boolean flags)
  furnished: z.boolean().default(false),
  airConditioning: z.boolean().default(false),
  heating: z.boolean().default(false),
  parking: z.boolean().default(false),
  garage: z.boolean().default(false),
  pool: z.boolean().default(false),
  garden: z.boolean().default(false),
  terrace: z.boolean().default(false),
  balcony: z.boolean().default(false),
  elevator: z.boolean().default(false),
  internet: z.boolean().default(false),
  security: z.boolean().default(false),
  generator: z.boolean().default(false),
  waterTank: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  smokingAllowed: z.boolean().default(false),

  // Étape 5 : Médias
  photos: z
    .array(z.string().url("URL invalide"))
    .min(3, "Min 3 photos")
    .max(30, "Max 30 photos"),
  videoUrl: z
    .string()
    .url("URL vidéo invalide")
    .optional()
    .or(z.literal("")),
  panorama360Url: z
    .string()
    .url("URL panorama invalide")
    .optional()
    .or(z.literal("")),
  floorPlanUrl: z
    .string()
    .url("URL du plan invalide")
    .optional()
    .or(z.literal("")),

  // Étape 6 : Prix
  // Loyer mensuel (RENT) OU prix de vente (SALE) selon listingPurpose.
  // Plafond large pour couvrir les prix de vente (souvent > 50M FCFA).
  priceMonthly: z
    .number({ message: "Prix requis" })
    .min(10_000, "Min 10 000 FCFA")
    .max(100_000_000_000, "Montant trop élevé"),
  charges: z
    .number()
    .min(0)
    .max(10_000_000)
    .default(0),
  depositMonths: z.number().min(0).max(12).default(2),
  agencyFees: z.number().min(0).default(0),
  negotiable: z.boolean().default(false),

  // Étape 7 : Disponibilité + cibles
  availableFrom: z.string().min(1, "Date de disponibilité requise"),
  minStayMonths: z.number().int().min(1).max(120).default(12),
  targetAudiences: z
    .array(z.enum(TARGET_AUDIENCES))
    .min(1, "Sélectionnez au moins une cible"),

  // Étape 8 : Publication
  publishStatus: z.enum(PUBLISH_STATUSES).default("DRAFT"),
  scheduledAt: z.string().optional(),
  premium: z.boolean().default(false),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;

// ---------------------------------------------------------------------------
// Schémas par étape — utilisés par le wizard pour valider une étape avant
// de passer à la suivante.
// ---------------------------------------------------------------------------

export const propertyStepSchemas = {
  1: propertyFormSchema.pick({ type: true, listingPurpose: true }),
  2: propertyFormSchema.pick({
    countryCode: true,
    citySlug: true,
    neighborhoodSlug: true,
    addressLine: true,
    landmark: true,
    lat: true,
    lng: true,
  }),
  3: propertyFormSchema.pick({
    title: true,
    description: true,
    surface: true,
    rooms: true,
    bedrooms: true,
    bathrooms: true,
    floor: true,
    totalFloors: true,
    yearBuilt: true,
  }),
  4: propertyFormSchema.pick({
    furnished: true,
    airConditioning: true,
    heating: true,
    parking: true,
    garage: true,
    pool: true,
    garden: true,
    terrace: true,
    balcony: true,
    elevator: true,
    internet: true,
    security: true,
    generator: true,
    waterTank: true,
    petsAllowed: true,
    smokingAllowed: true,
  }),
  5: propertyFormSchema.pick({
    photos: true,
    videoUrl: true,
    panorama360Url: true,
    floorPlanUrl: true,
  }),
  6: propertyFormSchema.pick({
    priceMonthly: true,
    charges: true,
    depositMonths: true,
    agencyFees: true,
    negotiable: true,
  }),
  7: propertyFormSchema.pick({
    availableFrom: true,
    minStayMonths: true,
    targetAudiences: true,
  }),
  8: propertyFormSchema.pick({
    publishStatus: true,
    scheduledAt: true,
    premium: true,
  }),
} as const;

export const propertyStepFieldKeys = {
  1: ["type", "listingPurpose"],
  2: [
    "countryCode",
    "citySlug",
    "neighborhoodSlug",
    "addressLine",
    "landmark",
    "lat",
    "lng",
  ],
  3: [
    "title",
    "description",
    "surface",
    "rooms",
    "bedrooms",
    "bathrooms",
    "floor",
    "totalFloors",
    "yearBuilt",
  ],
  4: [
    "furnished",
    "airConditioning",
    "heating",
    "parking",
    "garage",
    "pool",
    "garden",
    "terrace",
    "balcony",
    "elevator",
    "internet",
    "security",
    "generator",
    "waterTank",
    "petsAllowed",
    "smokingAllowed",
  ],
  5: ["photos", "videoUrl", "panorama360Url", "floorPlanUrl"],
  6: [
    "priceMonthly",
    "charges",
    "depositMonths",
    "agencyFees",
    "negotiable",
  ],
  7: ["availableFrom", "minStayMonths", "targetAudiences"],
  8: ["publishStatus", "scheduledAt", "premium"],
} as const satisfies Record<number, (keyof PropertyFormData)[]>;

// ---------------------------------------------------------------------------
// Legacy : Create / Update Property (conservé pour l'action serveur existante)
// ---------------------------------------------------------------------------

export const createPropertySchema = z.object({
  title: z
    .string()
    .min(5, "Le titre doit contenir au moins 5 caracteres")
    .max(255, "Le titre ne peut pas depasser 255 caracteres"),
  description: z
    .string()
    .min(20, "La description doit contenir au moins 20 caracteres")
    .max(5000, "La description ne peut pas depasser 5000 caracteres"),
  // Type de transaction : location (loyer mensuel) ou vente (prix de vente).
  listingType: z.enum(["RENT", "SALE"], {
    message: "Veuillez choisir Location ou Vente",
  }),
  price: z
    .number({ message: "Le prix est requis" })
    .positive("Le prix doit etre superieur a 0")
    // Plafond large pour couvrir les prix de VENTE (la location reste guidée
    // côté UI). 100 milliards XOF = garde-fou anti-saisie aberrante.
    .max(100_000_000_000, "Le prix saisi est trop élevé"),
  bedrooms: z
    .number({ message: "Le nombre de chambres est requis" })
    .int("Le nombre de chambres doit etre un entier")
    .min(0, "Le nombre de chambres ne peut pas etre negatif")
    .max(20, "Le nombre de chambres ne peut pas depasser 20"),
  bathrooms: z
    .number({ message: "Le nombre de salles de bain est requis" })
    .int("Le nombre de salles de bain doit etre un entier")
    .min(0, "Le nombre de salles de bain ne peut pas etre negatif")
    .max(10, "Le nombre de salles de bain ne peut pas depasser 10"),
  squareMeters: z
    .number({ message: "La superficie est requise" })
    .positive("La superficie doit etre superieure a 0")
    .max(10_000, "La superficie ne peut pas depasser 10 000 m2"),
  propertyType: z.enum(
    [
      "APARTMENT",
      "HOUSE",
      "STUDIO",
      "VILLA",
      "ROOM",
      "SHARED_ROOM",
      "COMMERCIAL",
      "LAND",
    ],
    {
      message: "Veuillez selectionner un type de bien valide",
    },
  ),
  address: z
    .string()
    .min(5, "L'adresse doit contenir au moins 5 caracteres")
    .max(255, "L'adresse ne peut pas depasser 255 caracteres"),
  amenities: z
    .array(z.string().min(1, "L'amenite ne peut pas etre vide"))
    .default([]),
  locationLatitude: z
    .number()
    .min(-90, "Latitude invalide")
    .max(90, "Latitude invalide")
    .optional(),
  locationLongitude: z
    .number()
    .min(-180, "Longitude invalide")
    .max(180, "Longitude invalide")
    .optional(),
});

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>;

// ---------------------------------------------------------------------------
// Update Property (all fields optional except id)
// ---------------------------------------------------------------------------

export const updatePropertySchema = createPropertySchema.partial().extend({
  id: z.string().uuid("ID de propriete invalide"),
});

export type UpdatePropertyFormData = z.infer<typeof updatePropertySchema>;

// ---------------------------------------------------------------------------
// Property Search / Filter
// ---------------------------------------------------------------------------

export const propertySearchSchema = z.object({
  query: z.string().optional(),
  propertyType: z
    .enum(["APARTMENT", "HOUSE", "ROOM", "STUDIO"])
    .optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minBedrooms: z.number().int().min(0).optional(),
  maxBedrooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusKm: z.number().positive().max(100).optional(),
  amenities: z.array(z.string()).optional(),
  sortBy: z
    .enum(["price_asc", "price_desc", "date_desc", "distance"])
    .optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(50).optional(),
});

export type PropertySearchParams = z.infer<typeof propertySearchSchema>;

// ---------------------------------------------------------------------------
// Visit Request
// ---------------------------------------------------------------------------

export const visitRequestSchema = z.object({
  propertyId: z.string().uuid("ID de propriete invalide"),
  requestedDate: z
    .string()
    .min(1, "La date de visite est requise"),
  requestedTime: z
    .string()
    .optional(),
  message: z
    .string()
    .max(500, "Le message ne peut pas depasser 500 caracteres")
    .optional(),
});

export type VisitRequestFormData = z.infer<typeof visitRequestSchema>;
