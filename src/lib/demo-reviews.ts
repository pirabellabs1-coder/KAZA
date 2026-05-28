// =============================================================================
// KAZA - Demo Reviews
// Avis utilisateurs crédibles pour démonstration des fiches propriétés
// =============================================================================

export type ReviewRating = 1 | 2 | 3 | 4 | 5;
export type ReviewerRole = "Locataire" | "Étudiant" | "Propriétaire";

export interface DemoReview {
  id: string;
  authorName: string;
  authorRole: ReviewerRole;
  avatarSeed: string;
  rating: ReviewRating;
  date: string; // ISO 8601
  title?: string;
  comment: string;
  propertyId?: string;
  city?: string;
}

// =============================================================================
// 30 avis crédibles - majorité 5★ et 4★, quelques 3★, 1-2 plus critiques
// =============================================================================

export const DEMO_REVIEWS: DemoReview[] = [
  // -------- 5 étoiles --------
  {
    id: "rv-001",
    authorName: "Aminata Dossou",
    authorRole: "Locataire",
    avatarSeed: "Aminata+Dossou",
    rating: 5,
    date: "2026-05-04T09:12:00.000Z",
    title: "Un emménagement sans accroc",
    comment:
      "Logement conforme aux photos, propriétaire ultra disponible et état des lieux digital nickel. Je recommande à 100 %, surtout pour une première location à Cotonou.",
    propertyId: "p1",
    city: "Cotonou",
  },
  {
    id: "rv-002",
    authorName: "Koffi Adjovi",
    authorRole: "Locataire",
    avatarSeed: "Koffi+Adjovi",
    rating: 5,
    date: "2026-04-22T14:30:00.000Z",
    title: "Quartier au top, voisinage calme",
    comment:
      "Très bien situé, à deux pas des supérettes et de la station essence. Le séjour est lumineux toute la journée, on s'y sent vraiment bien.",
    propertyId: "p1",
    city: "Cotonou",
  },
  {
    id: "rv-003",
    authorName: "Fatima Boukari",
    authorRole: "Étudiant",
    avatarSeed: "Fatima+Boukari",
    rating: 5,
    date: "2026-04-18T11:05:00.000Z",
    title: "Parfait pour étudier",
    comment:
      "À 10 min de l'UAC, internet stable, mes colocs sont géniales. Le bailleur a tout fait pour faciliter notre installation, du frigo à la connexion fibre.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  {
    id: "rv-004",
    authorName: "Sébastien Houngbédji",
    authorRole: "Locataire",
    avatarSeed: "Sebastien+Houngbedji",
    rating: 5,
    date: "2026-04-10T08:45:00.000Z",
    title: "Le paiement sécurisé change tout",
    comment:
      "L'escrow KAZA Pay m'a rassuré dès le départ. Argent libéré uniquement après mon emménagement, je ne savais même pas que ça existait au Bénin.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-005",
    authorName: "Mariam Issaka",
    authorRole: "Propriétaire",
    avatarSeed: "Mariam+Issaka",
    rating: 5,
    date: "2026-03-29T16:20:00.000Z",
    title: "Mon studio loué en 4 jours",
    comment:
      "Annonce publiée le lundi, premier locataire vérifié dès le vendredi. La fiche est claire, la messagerie fluide, je remets en location ma deuxième maison la semaine prochaine.",
    propertyId: "p2",
    city: "Porto-Novo",
  },
  {
    id: "rv-006",
    authorName: "Yves Akakpo",
    authorRole: "Étudiant",
    avatarSeed: "Yves+Akakpo",
    rating: 5,
    date: "2026-03-21T19:40:00.000Z",
    title: "Colocation au top",
    comment:
      "On partage les charges automatiquement chaque mois, plus de prises de tête. La chambre est meublée, l'eau ne manque jamais. Top.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  {
    id: "rv-007",
    authorName: "Joséphine Ahouangonou",
    authorRole: "Locataire",
    avatarSeed: "Josephine+Ahouangonou",
    rating: 5,
    date: "2026-03-12T10:00:00.000Z",
    title: "Charme et confort",
    comment:
      "Une vraie petite perle, le balcon donne sur un jardin, c'est le calme absolu en pleine ville. Propriétaire à l'écoute du moindre détail.",
    propertyId: "p3",
    city: "Porto-Novo",
  },
  {
    id: "rv-008",
    authorName: "Emmanuel Tchégnon",
    authorRole: "Locataire",
    avatarSeed: "Emmanuel+Tchegnon",
    rating: 5,
    date: "2026-03-05T13:25:00.000Z",
    title: "Tout est conforme",
    comment:
      "Photos = réalité. Les équipements promis étaient bien là, contrat signé en ligne en 5 minutes. Je n'ai eu aucune surprise mauvaise.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-009",
    authorName: "Ange Kouassi",
    authorRole: "Locataire",
    avatarSeed: "Ange+Kouassi",
    rating: 5,
    date: "2026-02-26T07:50:00.000Z",
    title: "Excellente expérience",
    comment:
      "Cuisine équipée, climatisation efficace, sécurité 24/7 dans la résidence. Le rapport qualité-prix est imbattable pour ce quartier.",
    propertyId: "p3",
    city: "Cotonou",
  },
  {
    id: "rv-010",
    authorName: "Rachelle Soglo",
    authorRole: "Locataire",
    avatarSeed: "Rachelle+Soglo",
    rating: 5,
    date: "2026-02-18T15:10:00.000Z",
    title: "Quartier vivant et sûr",
    comment:
      "Marché Dantokpa à 10 min, taxi-moto au coin de la rue, et les voisins sont adorables. Je m'y sens chez moi depuis le premier jour.",
    propertyId: "p1",
    city: "Cotonou",
  },
  {
    id: "rv-011",
    authorName: "Dieudonné Agbo",
    authorRole: "Locataire",
    avatarSeed: "Dieudonne+Agbo",
    rating: 5,
    date: "2026-02-09T11:30:00.000Z",
    title: "Service KAZA irréprochable",
    comment:
      "Support client réactif, j'ai eu une question sur le bail, réponse en moins de 2 heures un samedi. Bravo à toute l'équipe.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-012",
    authorName: "Nadia Houngbo",
    authorRole: "Étudiant",
    avatarSeed: "Nadia+Houngbo",
    rating: 5,
    date: "2026-01-30T09:15:00.000Z",
    title: "Idéal pour étudiantes",
    comment:
      "Sécurité au top, hôtesse à l'entrée, parfait quand on rentre tard du campus. Les charges sont vraiment partagées équitablement.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  {
    id: "rv-013",
    authorName: "Lucien Bocco",
    authorRole: "Propriétaire",
    avatarSeed: "Lucien+Bocco",
    rating: 5,
    date: "2026-01-22T17:00:00.000Z",
    title: "Une plateforme pro",
    comment:
      "Tableau de bord propriétaire très complet, je vois les revenus, les visites planifiées et les messages au même endroit. Gain de temps énorme.",
    propertyId: "p3",
    city: "Cotonou",
  },
  {
    id: "rv-014",
    authorName: "Sandrine Kpogan",
    authorRole: "Locataire",
    avatarSeed: "Sandrine+Kpogan",
    rating: 5,
    date: "2026-01-14T12:20:00.000Z",
    title: "Logement spacieux et lumineux",
    comment:
      "Beaucoup plus grand que sur les photos, deux balcons, vue dégagée. On a fait notre pendaison de crémaillère le mois dernier, tout le monde était sous le charme.",
    propertyId: "p2",
    city: "Porto-Novo",
  },
  {
    id: "rv-015",
    authorName: "Patrice Zinsou",
    authorRole: "Locataire",
    avatarSeed: "Patrice+Zinsou",
    rating: 5,
    date: "2026-01-06T08:00:00.000Z",
    title: "Visite virtuelle game-changer",
    comment:
      "Je vivais à Paris quand j'ai loué. La visite 360° m'a évité de me déplacer, et tout était fidèle à mon arrivée. Bluffant.",
    propertyId: "p1",
    city: "Cotonou",
  },
  {
    id: "rv-016",
    authorName: "Esther Mensah",
    authorRole: "Locataire",
    avatarSeed: "Esther+Mensah",
    rating: 5,
    date: "2025-12-28T14:45:00.000Z",
    title: "Bailleur en or",
    comment:
      "Disponible, honnête, il a même réparé la climatisation dans la semaine quand on a eu un souci. Une relation de confiance s'est créée.",
    propertyId: "p3",
    city: "Cotonou",
  },
  {
    id: "rv-017",
    authorName: "Christelle Aho",
    authorRole: "Locataire",
    avatarSeed: "Christelle+Aho",
    rating: 5,
    date: "2025-12-19T10:55:00.000Z",
    title: "Au calme près de tout",
    comment:
      "Quartier résidentiel paisible mais à 5 minutes des commerces et des écoles. Le must pour une jeune famille comme la nôtre.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-018",
    authorName: "Olivier Houssou",
    authorRole: "Étudiant",
    avatarSeed: "Olivier+Houssou",
    rating: 5,
    date: "2025-12-10T18:30:00.000Z",
    title: "Tout est digital",
    comment:
      "Bail signé sur mon téléphone, loyer payé via KAZA Pay chaque mois sans y penser, factures partagées avec mes colocs en un clic.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  // -------- 4 étoiles --------
  {
    id: "rv-019",
    authorName: "Bernadette Atohoun",
    authorRole: "Locataire",
    avatarSeed: "Bernadette+Atohoun",
    rating: 4,
    date: "2025-12-02T09:25:00.000Z",
    title: "Très bon dans l'ensemble",
    comment:
      "Logement vraiment agréable, juste un petit bémol sur la pression d'eau au 3e étage. Mais le bailleur a promis d'installer un surpresseur, j'attends de voir.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-020",
    authorName: "Thierry Ahouanvoedo",
    authorRole: "Locataire",
    avatarSeed: "Thierry+Ahouanvoedo",
    rating: 4,
    date: "2025-11-24T13:00:00.000Z",
    title: "Bonne surprise",
    comment:
      "Je n'attendais pas grand-chose à ce prix, et finalement le logement est très propre, bien meublé. La rue est un peu bruyante en soirée, sans plus.",
    propertyId: "p1",
    city: "Cotonou",
  },
  {
    id: "rv-021",
    authorName: "Carine Dossa",
    authorRole: "Locataire",
    avatarSeed: "Carine+Dossa",
    rating: 4,
    date: "2025-11-15T07:40:00.000Z",
    title: "Conforme aux attentes",
    comment:
      "Bon emplacement, équipements OK, salle de bains à rénover dans les prochains mois mais c'est convenu avec le propriétaire.",
    propertyId: "p3",
    city: "Porto-Novo",
  },
  {
    id: "rv-022",
    authorName: "Guillaume Sossou",
    authorRole: "Étudiant",
    avatarSeed: "Guillaume+Sossou",
    rating: 4,
    date: "2025-11-07T16:15:00.000Z",
    title: "Bon plan pour étudiants",
    comment:
      "Prix correct, colocataires sympas, internet parfois capricieux le soir. Le matching KAZA fonctionne bien, on s'entend tous.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  {
    id: "rv-023",
    authorName: "Pauline Anagonou",
    authorRole: "Locataire",
    avatarSeed: "Pauline+Anagonou",
    rating: 4,
    date: "2025-10-29T11:10:00.000Z",
    title: "Joli logement",
    comment:
      "Belle déco, bien équipé, juste un peu petit pour deux quand on télétravaille. Idéal pour célibataire ou couple sans enfant.",
    propertyId: "p2",
    city: "Cotonou",
  },
  {
    id: "rv-024",
    authorName: "Frédéric Adjanohoun",
    authorRole: "Locataire",
    avatarSeed: "Frederic+Adjanohoun",
    rating: 4,
    date: "2025-10-20T08:30:00.000Z",
    title: "Recommandé",
    comment:
      "Très bonne expérience globale, propriétaire un peu lent à répondre parfois mais toujours arrangeant. Je renouvelle l'année prochaine.",
    propertyId: "p3",
    city: "Cotonou",
  },
  {
    id: "rv-025",
    authorName: "Hervé Dansou",
    authorRole: "Locataire",
    avatarSeed: "Herve+Dansou",
    rating: 4,
    date: "2025-10-11T15:55:00.000Z",
    title: "Quartier qui monte",
    comment:
      "Cadjèhoun se développe vite, beaucoup de nouveaux commerces. Le logement est top, juste manque un parking sécurisé pour la voiture.",
    propertyId: "p1",
    city: "Cotonou",
  },
  // -------- 3 étoiles --------
  {
    id: "rv-026",
    authorName: "Marcelline Hougnandé",
    authorRole: "Locataire",
    avatarSeed: "Marcelline+Hougnande",
    rating: 3,
    date: "2025-10-03T12:00:00.000Z",
    title: "Correct sans plus",
    comment:
      "Le logement est conforme mais quelques petites finitions à revoir (peinture, poignée de porte). Pour le prix on peut pas en demander beaucoup plus.",
    propertyId: "p2",
    city: "Porto-Novo",
  },
  {
    id: "rv-027",
    authorName: "Sylvain Padonou",
    authorRole: "Locataire",
    avatarSeed: "Sylvain+Padonou",
    rating: 3,
    date: "2025-09-25T10:20:00.000Z",
    title: "Bon emplacement, équipements à améliorer",
    comment:
      "Vraiment bien situé, malheureusement les électroménagers fournis sont anciens. Le propriétaire a promis de remplacer le frigo cette année.",
    propertyId: "p3",
    city: "Cotonou",
  },
  {
    id: "rv-028",
    authorName: "Eunice Tognon",
    authorRole: "Étudiant",
    avatarSeed: "Eunice+Tognon",
    rating: 3,
    date: "2025-09-16T18:45:00.000Z",
    title: "Moyennement satisfaite",
    comment:
      "Loin du campus, on dépend du zem matin et soir. Sinon la coloc est sympa et bien organisée. À voir selon ses priorités.",
    propertyId: "p1",
    city: "Abomey-Calavi",
  },
  // -------- 2 étoiles (critique) --------
  {
    id: "rv-029",
    authorName: "Romaric Adjovi",
    authorRole: "Locataire",
    avatarSeed: "Romaric+Adjovi",
    rating: 2,
    date: "2025-09-08T07:30:00.000Z",
    title: "Mitigé",
    comment:
      "Bon point pour la sécurité du quartier, mais coupures d'électricité fréquentes sans groupe électrogène d'appoint. Compliqué pour le télétravail.",
    propertyId: "p2",
    city: "Cotonou",
  },
  // -------- 1 étoile (critique sévère) --------
  {
    id: "rv-030",
    authorName: "Jean-Baptiste Codjia",
    authorRole: "Locataire",
    avatarSeed: "JeanBaptiste+Codjia",
    rating: 1,
    date: "2025-08-30T14:00:00.000Z",
    title: "Plusieurs déceptions",
    comment:
      "Photos flatteuses mais réalité différente (taille des pièces, état général). Le support KAZA a bien géré la médiation et j'ai pu récupérer ma caution rapidement.",
    propertyId: "p3",
    city: "Porto-Novo",
  },
];

// =============================================================================
// Helpers
// =============================================================================

export function getReviewsForProperty(propertyId: string): DemoReview[] {
  const matching = DEMO_REVIEWS.filter((r) => r.propertyId === propertyId);
  // Si on n'a pas d'avis spécifiques (cas démos), on renvoie un échantillon
  // déterministe pour assurer une UI riche sur toutes les fiches.
  if (matching.length >= 6) {
    return matching;
  }
  const seed = propertyId
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const start = seed % DEMO_REVIEWS.length;
  const sample: DemoReview[] = [];
  for (let i = 0; i < 12; i += 1) {
    sample.push(DEMO_REVIEWS[(start + i) % DEMO_REVIEWS.length]);
  }
  return sample;
}

export function getAverageRating(reviews: DemoReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export function getRatingDistribution(
  reviews: DemoReview[]
): Record<ReviewRating, number> {
  const distribution: Record<ReviewRating, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    distribution[r.rating] += 1;
  }
  return distribution;
}
