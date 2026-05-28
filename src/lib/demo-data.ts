// =============================================================================
// KAZA — Mock data for demo features (messages, contracts, conversations…)
//
// Données enrichies utilisées quand Supabase n'est pas branché. Permettent
// d'avoir des pages parfaitement fonctionnelles côté UI sans backend.
// =============================================================================

export interface DemoConversation {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: string;
  propertyTitle?: string;
  lastMessage: string;
  lastMessageAt: string; // ISO
  unread: number;
}

export interface DemoMessage {
  id: string;
  conversationId: string;
  senderId: string; // "me" ou otherUserId
  content: string;
  createdAt: string;
}

export interface DemoContract {
  id: string;
  status: "DRAFT" | "PENDING_TENANT" | "PENDING_OWNER" | "SIGNED" | "CANCELLED";
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  monthlyRent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  signedAt?: string;
  pdfUrl?: string;
}

// -----------------------------------------------------------------------------
// Conversations démo
// -----------------------------------------------------------------------------

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: "conv-001",
    otherUserId: "u-002-owner-jean",
    otherUserName: "Jean Dupont",
    otherUserRole: "Propriétaire",
    propertyTitle: "Appartement Cocotiers",
    lastMessage: "Bonjour, je suis disponible samedi à 15h pour la visite.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    unread: 2,
  },
  {
    id: "conv-002",
    otherUserId: "u-003-owner-amina",
    otherUserName: "Amina Koné",
    otherUserRole: "Propriétaire",
    propertyTitle: "Studio Cadjehoun",
    lastMessage: "Parfait, j'ai bien reçu votre dossier. Je reviens vers vous demain.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    unread: 0,
  },
  {
    id: "conv-003",
    otherUserId: "u-004-tenant-thomas",
    otherUserName: "Thomas Leroy",
    otherUserRole: "Locataire",
    propertyTitle: "Villa Fidjrossè",
    lastMessage: "Merci, à bientôt !",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    unread: 0,
  },
  {
    id: "conv-004",
    otherUserId: "u-005-student-fatou",
    otherUserName: "Fatou Diallo",
    otherUserRole: "Étudiante",
    propertyTitle: "Colocation près UAC",
    lastMessage: "Je peux passer voir la chambre ce week-end ?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    unread: 1,
  },
];

export const DEMO_MESSAGES: Record<string, DemoMessage[]> = {
  "conv-001": [
    {
      id: "m-1-1",
      conversationId: "conv-001",
      senderId: "me",
      content: "Bonjour, je suis intéressé par votre appartement aux Cocotiers. Est-il toujours disponible ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "m-1-2",
      conversationId: "conv-001",
      senderId: "u-002-owner-jean",
      content: "Bonjour ! Oui, l'appartement est toujours disponible. Voulez-vous organiser une visite ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    },
    {
      id: "m-1-3",
      conversationId: "conv-001",
      senderId: "me",
      content: "Avec plaisir. Êtes-vous disponible ce week-end ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "m-1-4",
      conversationId: "conv-001",
      senderId: "u-002-owner-jean",
      content: "Bonjour, je suis disponible samedi à 15h pour la visite.",
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
  ],
  "conv-002": [
    {
      id: "m-2-1",
      conversationId: "conv-002",
      senderId: "me",
      content: "Bonjour Mme Koné, je vous envoie mon dossier pour le studio de Cadjehoun.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: "m-2-2",
      conversationId: "conv-002",
      senderId: "u-003-owner-amina",
      content: "Parfait, j'ai bien reçu votre dossier. Je reviens vers vous demain.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
  ],
  "conv-003": [
    {
      id: "m-3-1",
      conversationId: "conv-003",
      senderId: "u-004-tenant-thomas",
      content: "Bonjour, j'aimerais visiter la villa de Fidjrossè le 28.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
    {
      id: "m-3-2",
      conversationId: "conv-003",
      senderId: "me",
      content: "Parfait, 10h ça vous convient ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    },
    {
      id: "m-3-3",
      conversationId: "conv-003",
      senderId: "u-004-tenant-thomas",
      content: "Merci, à bientôt !",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    },
  ],
  "conv-004": [
    {
      id: "m-4-1",
      conversationId: "conv-004",
      senderId: "u-005-student-fatou",
      content: "Bonjour, votre annonce de chambre en colocation m'intéresse beaucoup.",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    },
    {
      id: "m-4-2",
      conversationId: "conv-004",
      senderId: "u-005-student-fatou",
      content: "Je peux passer voir la chambre ce week-end ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ],
};

// -----------------------------------------------------------------------------
// Contrats démo
// -----------------------------------------------------------------------------

export const DEMO_CONTRACTS: DemoContract[] = [
  {
    id: "ctr-001abcd",
    status: "PENDING_TENANT",
    propertyTitle: "Appartement Cocotiers 3 pièces",
    propertyAddress: "Rue 12.345, Cocotiers, Cotonou",
    ownerName: "Jean Dupont",
    tenantName: "Vous",
    monthlyRent: 180000,
    deposit: 360000,
    startDate: "2026-06-01",
    endDate: "2027-05-31",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "ctr-002efgh",
    status: "SIGNED",
    propertyTitle: "Studio Cadjehoun",
    propertyAddress: "Boulevard du 30 août, Cadjehoun, Cotonou",
    ownerName: "Amina Koné",
    tenantName: "Vous",
    monthlyRent: 85000,
    deposit: 170000,
    startDate: "2026-01-15",
    endDate: "2027-01-14",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    signedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    pdfUrl: "#",
  },
  {
    id: "ctr-003ijkl",
    status: "DRAFT",
    propertyTitle: "Villa Fidjrossè avec piscine",
    propertyAddress: "Quartier Fidjrossè, Cotonou",
    ownerName: "Jean Dupont",
    tenantName: "Vous",
    monthlyRent: 350000,
    deposit: 700000,
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export function getDemoContractById(id: string): DemoContract | undefined {
  return DEMO_CONTRACTS.find((c) => c.id === id);
}

export function getDemoConversationById(id: string): DemoConversation | undefined {
  return DEMO_CONVERSATIONS.find((c) => c.id === id || c.otherUserId === id);
}

export function getDemoMessagesByConversation(conversationId: string): DemoMessage[] {
  // accepte id court ou otherUserId
  const conv = getDemoConversationById(conversationId);
  if (!conv) return [];
  return DEMO_MESSAGES[conv.id] ?? [];
}
