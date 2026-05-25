// =============================================================================
// KAZA - Property Validation Schemas (Zod v4)
// Used by React Hook Form on the client and Server Actions on the server
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Create / Update Property
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
  price: z
    .number({ message: "Le prix est requis" })
    .positive("Le prix doit etre superieur a 0")
    .max(10_000_000, "Le prix ne peut pas depasser 10 000 000 XOF"),
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
  propertyType: z.enum(["APARTMENT", "HOUSE", "ROOM", "STUDIO"], {
    message: "Veuillez selectionner un type de bien valide",
  }),
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
