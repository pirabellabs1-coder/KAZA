// =============================================================================
// KAZA — Bibliothèque de modèles de contrats de bail
// =============================================================================
// Cette bibliothèque fournit 4 modèles complets de contrats conformes au droit
// béninois (Loi n° 2018-12 du 02 juillet 2018 portant régime juridique des
// baux à usage d'habitation), au droit OHADA (Acte uniforme portant droit
// commercial général — AUDCG — pour les baux commerciaux) et au Code civil
// béninois.
//
// Placeholders supportés dans les bodies :
//   {{property.title}}, {{property.address}}, {{property.surface}},
//   {{property.bedrooms}}, {{property.type}},
//   {{owner.name}}, {{owner.cni}}, {{owner.address}}, {{owner.phone}},
//   {{tenant.name}}, {{tenant.cni}}, {{tenant.profession}}, {{tenant.employer}},
//   {{rent}}, {{charges}}, {{depositAmount}}, {{depositMonths}},
//   {{startDate}}, {{endDate}}, {{durationMonths}},
//   {{place}}, {{signDate}}, {{contractNumber}}
// =============================================================================

export type ContractCategory =
  | "RESIDENTIAL_FURNISHED"
  | "RESIDENTIAL_UNFURNISHED"
  | "COLOCATION"
  | "COMMERCIAL";

export type ContractSection = {
  id: string;
  title: string;
  body: string; // markdown avec placeholders {{...}}
  required: boolean;
  editable: boolean;
};

export type ContractTemplate = {
  id: string;
  name: string;
  description: string;
  icon: string; // nom d'icône lucide-react (ex: "Home", "Building2", "Users", "Store")
  category: ContractCategory;
  defaultDurationMonths: number;
  defaultDepositMonths: number;
  legalBasis: string;
  sections: ContractSection[];
};

export type StandardClause = {
  id: string;
  category: string;
  title: string;
  body: string;
  recommended: boolean;
};

// -----------------------------------------------------------------------------
// SECTIONS COMMUNES — réutilisables entre templates
// -----------------------------------------------------------------------------

const COMMON_PARTIES_SECTION: ContractSection = {
  id: "parties",
  title: "Identification des parties",
  required: true,
  editable: false,
  body: `**ENTRE LES SOUSSIGNÉS :**

**Le BAILLEUR :** {{owner.name}}, titulaire de la pièce d'identité n° {{owner.cni}}, demeurant à {{owner.address}}, joignable au {{owner.phone}},

Ci-après dénommé(e) « **le Bailleur** », d'une part,

**ET**

**Le LOCATAIRE :** {{tenant.name}}, titulaire de la pièce d'identité n° {{tenant.cni}}, exerçant la profession de {{tenant.profession}} auprès de {{tenant.employer}},

Ci-après dénommé(e) « **le Locataire** », d'autre part,

**Il a été convenu et arrêté ce qui suit, conformément à la Loi n° 2018-12 du 02 juillet 2018 portant régime juridique des baux à usage d'habitation en République du Bénin.**`,
};

const COMMON_PROPERTY_SECTION: ContractSection = {
  id: "property",
  title: "Désignation du bien loué",
  required: true,
  editable: true,
  body: `Le Bailleur donne à bail au Locataire qui accepte, le bien immobilier ci-après désigné :

- **Type :** {{property.type}}
- **Désignation :** {{property.title}}
- **Adresse complète :** {{property.address}}
- **Surface habitable :** {{property.surface}} m²
- **Nombre de pièces principales :** {{property.bedrooms}}

Le Locataire reconnaît avoir visité le bien préalablement à la signature des présentes et déclare le bien conforme à sa destination contractuelle d'habitation.

Le bien est loué à usage exclusif d'habitation principale du Locataire et de sa famille proche. Toute affectation à un usage commercial, artisanal, professionnel ou industriel est strictement interdite, conformément à l'article 3 de la Loi 2018-12.`,
};

const COMMON_OBLIGATIONS_TENANT: ContractSection = {
  id: "obligations-tenant",
  title: "Obligations du Locataire",
  required: true,
  editable: true,
  body: `Conformément aux articles 15 et suivants de la Loi 2018-12, le Locataire s'oblige notamment à :

1. **Payer le loyer et les charges** aux termes convenus, à savoir le 1er à 5 de chaque mois, par virement bancaire, Mobile Money (FeexPay) ou tout autre moyen via la plateforme KAZA (escrow sécurisé).
2. **User paisiblement** des lieux loués suivant leur destination d'habitation, sans troubler la jouissance des voisins.
3. **Répondre des dégradations** survenues pendant la durée du bail dans les lieux dont il a la jouissance exclusive, à moins qu'il ne prouve qu'elles ont eu lieu par cas de force majeure ou par la faute du Bailleur.
4. **Assurer l'entretien courant** du logement, les menues réparations et l'ensemble des réparations locatives définies par les usages, sauf si elles sont occasionnées par vétusté, malfaçon, vice de construction ou cas de force majeure.
5. **Souscrire une assurance habitation** couvrant les risques locatifs (incendie, dégât des eaux, explosion) et en justifier annuellement au Bailleur.
6. **Ne pas transformer** les locaux et équipements loués sans l'accord écrit préalable du Bailleur.
7. **Permettre l'accès** au logement pour la préparation et l'exécution de travaux d'amélioration des parties communes ou des parties privatives du même immeuble, ainsi que les travaux nécessaires au maintien en état et à l'entretien normal des locaux loués.
8. **Restituer le bien** en bon état d'entretien et de réparations locatives à la fin du bail.`,
};

const COMMON_OBLIGATIONS_OWNER: ContractSection = {
  id: "obligations-owner",
  title: "Obligations du Bailleur",
  required: true,
  editable: true,
  body: `Conformément aux articles 11 à 14 de la Loi 2018-12, le Bailleur s'oblige à :

1. **Délivrer au Locataire** le logement en bon état d'usage et de réparation, ainsi que les équipements mentionnés au contrat en bon état de fonctionnement.
2. **Assurer la jouissance paisible** du logement et garantir le Locataire des vices ou défauts de nature à y faire obstacle, à l'exception de ceux qui, consignés dans l'état des lieux, auraient fait l'objet de la clause expresse contraire.
3. **Entretenir les locaux** en état de servir à l'usage prévu par le contrat et y faire toutes les réparations, autres que locatives, nécessaires au maintien en état et à l'entretien normal des locaux loués.
4. **Ne pas s'opposer aux aménagements** réalisés par le Locataire dès lors que ceux-ci ne constituent pas une transformation du bien.
5. **Remettre gratuitement** une quittance au Locataire qui en fait la demande, dans les conditions prévues par la loi.
6. **Respecter le délai de préavis** légal en cas de congé pour vendre, reprendre ou motif légitime et sérieux (6 mois pour les baux non meublés, 3 mois pour les baux meublés, art. 32 de la Loi 2018-12).`,
};

const COMMON_INVENTORY_SECTION: ContractSection = {
  id: "inventory",
  title: "État des lieux",
  required: true,
  editable: true,
  body: `Un état des lieux contradictoire et détaillé sera établi entre les parties (ou leurs mandataires) :

- **À l'entrée :** lors de la remise des clés, au plus tard le {{startDate}}.
- **À la sortie :** au moment de la restitution des clés, à l'issue du bail.

L'état des lieux d'entrée fait partie intégrante du présent contrat et y sera annexé. Il décrit avec précision l'état du bien, pièce par pièce, ainsi que le fonctionnement des équipements (plomberie, électricité, climatisation, mobilier le cas échéant).

À défaut d'état des lieux d'entrée, le Locataire est présumé avoir reçu les locaux en bon état de réparations locatives.

La comparaison des deux états des lieux servira à apprécier les éventuelles dégradations imputables au Locataire et à justifier toute retenue sur le dépôt de garantie.`,
};

const COMMON_TERMINATION_SECTION: ContractSection = {
  id: "termination",
  title: "Résiliation et préavis",
  required: true,
  editable: true,
  body: `**Résiliation par le Locataire :**
Le Locataire peut résilier le bail à tout moment, sous réserve de respecter un préavis notifié au Bailleur par lettre recommandée avec accusé de réception, par acte d'huissier ou par tout moyen permettant d'attester de la réception (incluant l'envoi via la plateforme KAZA avec accusé électronique).

Durée du préavis : **3 mois** pour les locations non meublées, **1 mois** pour les locations meublées (art. 32 de la Loi 2018-12).

**Résiliation par le Bailleur :**
Le Bailleur ne peut donner congé au Locataire qu'à l'échéance du bail et pour l'un des motifs suivants :
- Reprise du bien pour y habiter ou y loger un proche (conjoint, ascendant, descendant) ;
- Vente du bien (avec droit de préemption du Locataire) ;
- Motif légitime et sérieux (notamment manquements graves du Locataire).

Le congé doit être notifié au moins **6 mois** avant l'échéance pour un bail non meublé et **3 mois** avant l'échéance pour un bail meublé.

**Renouvellement :**
À défaut de congé donné dans les délais légaux, le bail est reconduit tacitement pour la même durée et aux mêmes conditions, sous réserve d'une éventuelle révision du loyer dans les limites légales.`,
};

const COMMON_RESOLUTORY_SECTION: ContractSection = {
  id: "resolutory",
  title: "Clause résolutoire",
  required: true,
  editable: true,
  body: `À défaut de paiement du loyer, des charges récupérables ou du dépôt de garantie aux termes convenus, et **deux mois** après un commandement de payer demeuré infructueux signifié au Locataire par acte extra-judiciaire (huissier) ou par mise en demeure recommandée, le présent bail sera résilié de plein droit, sans qu'il soit besoin de remplir aucune autre formalité judiciaire.

Cette clause s'applique également :
- À défaut d'assurance habitation justifiée annuellement ;
- En cas d'usage des locaux contraire à leur destination ;
- En cas de troubles graves et répétés de jouissance causés aux voisins ;
- En cas de sous-location non autorisée par écrit par le Bailleur.

Dans tous les cas, le Locataire devra restituer les lieux à première demande et le Bailleur pourra obtenir son expulsion ainsi que celle de tous occupants de son chef, par simple ordonnance de référé.`,
};

const COMMON_JURISDICTION_SECTION: ContractSection = {
  id: "jurisdiction",
  title: "Droit applicable et juridiction compétente",
  required: true,
  editable: false,
  body: `Le présent contrat est régi par le droit béninois, notamment :
- La **Loi n° 2018-12 du 02 juillet 2018** portant régime juridique des baux à usage d'habitation en République du Bénin ;
- Le **Code civil béninois** pour ce qui n'est pas spécifiquement réglé par la loi spéciale ;
- Les **Actes uniformes OHADA** dans la mesure où ils sont applicables.

Tout différend né de l'interprétation, de l'exécution ou de la résiliation du présent contrat sera, à défaut d'accord amiable et préalablement à toute action judiciaire, soumis à la **médiation gratuite proposée par la plateforme KAZA** dans un délai maximum de 30 jours.

À défaut de conciliation, les parties attribuent compétence exclusive au **Tribunal de Première Instance de première classe de Cotonou** (chambre civile) pour les litiges relatifs aux baux d'habitation, et au **Tribunal de Commerce de Cotonou** pour les baux à usage professionnel ou commercial.`,
};

const COMMON_SIGNATURES_SECTION: ContractSection = {
  id: "signatures",
  title: "Signatures",
  required: true,
  editable: false,
  body: `Fait à **{{place}}**, le **{{signDate}}**, en deux (2) exemplaires originaux, dont un (1) pour chacune des parties, ainsi qu'un (1) exemplaire électronique conservé sur la plateforme KAZA avec valeur probante équivalente conformément à la **Loi n° 2017-20 du 20 avril 2018** portant Code du numérique en République du Bénin.

Chaque page doit être paraphée et la dernière page signée par les deux parties, précédée de la mention manuscrite « **Lu et approuvé, bon pour bail** ».

| LE BAILLEUR | LE LOCATAIRE |
|-------------|--------------|
| {{owner.name}} | {{tenant.name}} |
| Signature : | Signature : |
| Date : {{signDate}} | Date : {{signDate}} |`,
};

// -----------------------------------------------------------------------------
// TEMPLATE 1 — BAIL RÉSIDENTIEL MEUBLÉ
// -----------------------------------------------------------------------------

const TEMPLATE_RESIDENTIAL_FURNISHED: ContractTemplate = {
  id: "tpl-residential-furnished",
  name: "Bail résidentiel meublé",
  description:
    "Logement loué meublé avec inventaire détaillé du mobilier. Adapté aux studios, T1, T2 et appartements équipés. Durée 12 mois renouvelable.",
  icon: "Sofa",
  category: "RESIDENTIAL_FURNISHED",
  defaultDurationMonths: 12,
  defaultDepositMonths: 2,
  legalBasis:
    "Loi 2018-12 du 02 juillet 2018 (art. 7 — bail meublé) et Code civil béninois",
  sections: [
    {
      ...COMMON_PARTIES_SECTION,
      id: "parties",
    },
    COMMON_PROPERTY_SECTION,
    {
      id: "furniture-inventory",
      title: "Inventaire du mobilier (annexe)",
      required: true,
      editable: true,
      body: `Le bien est loué meublé. Un **inventaire détaillé du mobilier et des équipements** est annexé au présent contrat et signé par les deux parties. L'inventaire fait foi entre les parties.

Mobilier minimum légal fourni (à compléter par les parties) :
- Literie comprenant couette ou couverture ;
- Dispositif d'occultation des fenêtres dans la chambre ;
- Plaques de cuisson ;
- Four ou four à micro-ondes ;
- Réfrigérateur et congélateur ou compartiment à congélation ;
- Vaisselle nécessaire à la prise des repas ;
- Ustensiles de cuisine ;
- Table et sièges ;
- Étagères de rangement ;
- Luminaires ;
- Matériel d'entretien ménager adapté aux caractéristiques du logement.

Tout élément manquant, défectueux ou abîmé devra être signalé par écrit au Bailleur dans les **8 jours** suivant l'entrée dans les lieux.`,
    },
    {
      id: "duration",
      title: "Durée du bail",
      required: true,
      editable: true,
      body: `Le présent bail est consenti et accepté pour une durée de **{{durationMonths}} mois** (douze mois) à compter du **{{startDate}}** pour se terminer de plein droit le **{{endDate}}**.

Conformément à l'article 7 de la Loi 2018-12, la durée minimale du bail meublé est de **un (1) an**.

À l'expiration de ce terme, le bail sera reconduit tacitement pour des périodes successives d'une (1) année, à défaut de congé délivré par l'une des parties dans les conditions et délais prévus par la loi (préavis de 3 mois pour le Bailleur, 1 mois pour le Locataire).`,
    },
    {
      id: "rent",
      title: "Loyer et indexation",
      required: true,
      editable: true,
      body: `Le loyer mensuel est fixé à **{{rent}}** payable d'avance, au plus tard le **5 de chaque mois**, via la plateforme KAZA (escrow sécurisé FeexPay / Mobile Money / virement bancaire).

**Indexation :** Le loyer pourra être révisé annuellement à la date anniversaire du contrat, dans la limite de la **variation de l'Indice des Prix à la Consommation (IPC)** publié par l'**Institut National de la Statistique et de l'Analyse Économique (INSAE) du Bénin**, et conformément à l'article 25 de la Loi 2018-12.

Toute révision devra être notifiée par écrit au Locataire au moins **2 mois** avant sa prise d'effet, accompagnée du justificatif de l'indice de référence.

**Pénalités de retard :** Tout retard de paiement excédant 10 jours entraînera l'application d'intérêts moratoires au taux légal en vigueur, sans préjudice de la mise en œuvre de la clause résolutoire prévue ci-après.`,
    },
    {
      id: "charges",
      title: "Charges et taxes",
      required: true,
      editable: true,
      body: `Outre le loyer principal, le Locataire s'acquittera d'une provision mensuelle pour charges récupérables d'un montant de **{{charges}}**, couvrant notamment :
- Consommation d'eau et d'électricité (sauf compteur individuel à la charge directe du Locataire) ;
- Frais d'entretien des parties communes ;
- Taxe d'enlèvement des ordures ménagères (TEOM) ;
- Entretien des équipements communs (ascenseur, espaces verts, gardiennage le cas échéant).

Une **régularisation annuelle** sera effectuée sur présentation des justificatifs.

**Impôts à la charge du Bailleur :** Impôt foncier (TFU), Taxe sur la Valeur Locative (TVL).

**Impôts à la charge du Locataire :** Taxe d'habitation le cas échéant, redevance audiovisuelle.`,
    },
    {
      id: "deposit",
      title: "Dépôt de garantie",
      required: true,
      editable: true,
      body: `Un dépôt de garantie d'un montant de **{{depositAmount}}** (équivalent à **{{depositMonths}} mois de loyer hors charges**) est versé par le Locataire à la signature des présentes.

Conformément à l'article 19 de la Loi 2018-12, le dépôt de garantie pour un logement meublé ne peut excéder **deux (2) mois de loyer hors charges**.

Le dépôt de garantie est conservé sur un **compte escrow sécurisé KAZA** (établissement de paiement agréé BCEAO) et ne pourra être assimilé à un paiement de loyer.

Il sera restitué au Locataire dans un délai maximum de **deux (2) mois** à compter de la remise des clés, déduction faite, le cas échéant :
- Des loyers et charges restant dus ;
- Des sommes nécessaires à la remise en état du logement, sur présentation de devis ou factures ;
- De toute dégradation imputable au Locataire constatée dans l'état des lieux de sortie.

À défaut de restitution dans le délai imparti, le dépôt produira intérêts au taux légal au profit du Locataire.`,
    },
    COMMON_INVENTORY_SECTION,
    COMMON_OBLIGATIONS_TENANT,
    COMMON_OBLIGATIONS_OWNER,
    {
      id: "insurance",
      title: "Assurance habitation",
      required: true,
      editable: true,
      body: `Le Locataire est tenu de souscrire, dès la prise de possession des lieux et pendant toute la durée du bail, une **assurance multirisques habitation** couvrant au minimum :
- Sa **responsabilité civile locative** (dégâts causés au bien loué : incendie, explosion, dégât des eaux) ;
- Sa **responsabilité civile vie privée** envers les voisins et les tiers ;
- Le **mobilier et les effets personnels** contre le vol, l'incendie et les dégâts des eaux.

Une **attestation d'assurance** devra être remise au Bailleur à la signature du contrat puis chaque année à la date d'échéance, sous peine de mise en œuvre de la clause résolutoire.`,
    },
    COMMON_TERMINATION_SECTION,
    COMMON_RESOLUTORY_SECTION,
    COMMON_JURISDICTION_SECTION,
    COMMON_SIGNATURES_SECTION,
  ],
};

// -----------------------------------------------------------------------------
// TEMPLATE 2 — BAIL RÉSIDENTIEL NON-MEUBLÉ
// -----------------------------------------------------------------------------

const TEMPLATE_RESIDENTIAL_UNFURNISHED: ContractTemplate = {
  id: "tpl-residential-unfurnished",
  name: "Bail résidentiel non meublé",
  description:
    "Logement loué vide (sans mobilier). Adapté aux villas, maisons et grands appartements. Durée 36 mois (3 ans) renouvelable.",
  icon: "Home",
  category: "RESIDENTIAL_UNFURNISHED",
  defaultDurationMonths: 36,
  defaultDepositMonths: 1,
  legalBasis:
    "Loi 2018-12 du 02 juillet 2018 (art. 6 — bail non meublé) et Code civil béninois",
  sections: [
    COMMON_PARTIES_SECTION,
    COMMON_PROPERTY_SECTION,
    {
      id: "duration",
      title: "Durée du bail",
      required: true,
      editable: true,
      body: `Le présent bail est consenti et accepté pour une durée de **{{durationMonths}} mois** (trente-six mois, soit 3 années pleines) à compter du **{{startDate}}** pour se terminer de plein droit le **{{endDate}}**.

Conformément à l'article 6 de la Loi 2018-12, la durée minimale du bail non meublé consenti par un bailleur personne physique est de **trois (3) ans**, et de **six (6) ans** lorsque le bailleur est une personne morale.

À l'expiration de ce terme, le bail sera reconduit tacitement pour des périodes successives de trois (3) années, à défaut de congé délivré par l'une des parties dans les conditions et délais prévus par la loi (préavis de 6 mois pour le Bailleur, 3 mois pour le Locataire).`,
    },
    {
      id: "rent",
      title: "Loyer et indexation",
      required: true,
      editable: true,
      body: `Le loyer mensuel est fixé à **{{rent}}** payable d'avance, au plus tard le **5 de chaque mois**, via la plateforme KAZA (escrow sécurisé FeexPay / Mobile Money / virement bancaire).

**Indexation :** Le loyer pourra être révisé annuellement à la date anniversaire du contrat, dans la limite de la **variation de l'Indice des Prix à la Consommation (IPC)** publié par l'**Institut National de la Statistique et de l'Analyse Économique (INSAE) du Bénin**, conformément à l'article 25 de la Loi 2018-12.

La révision ne peut intervenir qu'une fois par an et doit être notifiée par écrit au Locataire au moins **2 mois** avant sa prise d'effet, avec justificatif de l'indice de référence.

**Pénalités de retard :** Tout retard de paiement excédant 10 jours entraînera l'application d'intérêts moratoires au taux légal en vigueur.`,
    },
    {
      id: "charges",
      title: "Charges et taxes",
      required: true,
      editable: true,
      body: `Outre le loyer principal, le Locataire s'acquittera d'une provision mensuelle pour charges récupérables d'un montant de **{{charges}}**, couvrant notamment :
- Consommation d'eau et d'électricité des parties communes ;
- Frais d'entretien des parties communes ;
- Taxe d'enlèvement des ordures ménagères (TEOM) ;
- Entretien des équipements communs (ascenseur, espaces verts, gardiennage) ;
- Eau et électricité du logement (compteurs individuels à la charge directe du Locataire).

Une **régularisation annuelle** sera effectuée sur présentation des justificatifs (factures de prestataires, décomptes).

**Impôts à la charge du Bailleur :** Impôt foncier (TFU), Taxe sur la Valeur Locative (TVL).`,
    },
    {
      id: "deposit",
      title: "Dépôt de garantie",
      required: true,
      editable: true,
      body: `Un dépôt de garantie d'un montant de **{{depositAmount}}** (équivalent à **{{depositMonths}} mois de loyer hors charges**) est versé par le Locataire à la signature des présentes.

Conformément à l'article 19 de la Loi 2018-12, le dépôt de garantie pour un logement non meublé ne peut excéder **un (1) mois de loyer hors charges**.

Le dépôt de garantie est conservé sur un **compte escrow sécurisé KAZA** (établissement de paiement agréé BCEAO) et ne pourra en aucun cas être assimilé à un paiement de loyer.

Il sera restitué au Locataire dans un délai maximum de **deux (2) mois** à compter de la remise des clés, déduction faite, le cas échéant :
- Des loyers et charges restant dus ;
- Des sommes nécessaires à la remise en état du logement, sur présentation de devis ou factures justifiant les retenues ;
- De toute dégradation imputable au Locataire constatée à l'état des lieux de sortie.

À défaut de restitution dans le délai imparti, le solde produira intérêts au taux légal au profit du Locataire.`,
    },
    COMMON_INVENTORY_SECTION,
    COMMON_OBLIGATIONS_TENANT,
    COMMON_OBLIGATIONS_OWNER,
    {
      id: "insurance",
      title: "Assurance habitation",
      required: true,
      editable: true,
      body: `Le Locataire est tenu de souscrire, dès la prise de possession des lieux et pendant toute la durée du bail, une **assurance multirisques habitation** couvrant au minimum :
- Sa **responsabilité civile locative** (dégâts causés au bien loué : incendie, explosion, dégât des eaux) ;
- Sa **responsabilité civile vie privée** envers les voisins et les tiers ;
- Le **mobilier et les effets personnels** contre le vol, l'incendie et les dégâts des eaux.

Une **attestation d'assurance** devra être remise au Bailleur à la signature du contrat puis chaque année à la date d'échéance, sous peine de mise en œuvre de la clause résolutoire.`,
    },
    {
      id: "improvements",
      title: "Travaux et améliorations",
      required: false,
      editable: true,
      body: `Le Locataire ne peut effectuer aucune transformation des locaux et équipements loués sans l'accord écrit préalable du Bailleur.

**À la charge du Locataire :** entretien courant, menues réparations, remplacement des éléments d'usure normale (joints, ampoules, robinetterie, peinture intérieure courante, remplacement des fusibles, ramonage des conduits...).

**À la charge du Bailleur :** grosses réparations (toiture, gros œuvre, canalisations principales), mise en conformité, réparations rendues nécessaires par la vétusté ou un vice de construction, ravalement des façades.

À défaut d'accord, les améliorations réalisées par le Locataire restent acquises au Bailleur en fin de bail, sans indemnité.`,
    },
    COMMON_TERMINATION_SECTION,
    COMMON_RESOLUTORY_SECTION,
    COMMON_JURISDICTION_SECTION,
    COMMON_SIGNATURES_SECTION,
  ],
};

// -----------------------------------------------------------------------------
// TEMPLATE 3 — CONTRAT DE COLOCATION
// -----------------------------------------------------------------------------

const TEMPLATE_COLOCATION: ContractTemplate = {
  id: "tpl-colocation",
  name: "Contrat de colocation",
  description:
    "Bail unique signé conjointement par plusieurs colocataires (étudiants, jeunes actifs). Clause de solidarité, parts égales, dépôt unique mutualisé.",
  icon: "Users",
  category: "COLOCATION",
  defaultDurationMonths: 12,
  defaultDepositMonths: 2,
  legalBasis:
    "Loi 2018-12 du 02 juillet 2018, Code civil béninois (art. 1200 et suivants — solidarité conventionnelle)",
  sections: [
    {
      id: "parties",
      title: "Identification des parties",
      required: true,
      editable: true,
      body: `**ENTRE LES SOUSSIGNÉS :**

**Le BAILLEUR :** {{owner.name}}, titulaire de la pièce d'identité n° {{owner.cni}}, demeurant à {{owner.address}}, joignable au {{owner.phone}},

Ci-après dénommé(e) « **le Bailleur** », d'une part,

**ET**

**Les COLOCATAIRES**, ci-après dénommés conjointement « **les Colocataires** » ou individuellement « **un Colocataire** » :

- {{tenant.name}}, titulaire de la pièce d'identité n° {{tenant.cni}}, étudiant(e) / exerçant la profession de {{tenant.profession}} ;
- [Colocataire n° 2] — à compléter ;
- [Colocataire n° 3] — à compléter.

D'autre part,

**Il a été convenu et arrêté ce qui suit, conformément à la Loi n° 2018-12 du 02 juillet 2018 portant régime juridique des baux à usage d'habitation en République du Bénin.**`,
    },
    COMMON_PROPERTY_SECTION,
    {
      id: "shares",
      title: "Répartition des parts et chambres privatives",
      required: true,
      editable: true,
      body: `Le bien est mis à disposition des Colocataires selon la répartition suivante :

| Colocataire | Chambre privative | Quote-part loyer | Quote-part charges |
|-------------|-------------------|------------------|--------------------|
| Colocataire 1 | Chambre A | À répartir | À répartir |
| Colocataire 2 | Chambre B | À répartir | À répartir |
| Colocataire 3 | Chambre C | À répartir | À répartir |

Les **parties communes** (séjour, cuisine, salle de bains, terrasse, jardin) sont à l'usage indivis de tous les Colocataires.

**Principe de répartition par défaut :** les loyers et charges sont divisés en **parts égales** entre tous les Colocataires, sauf accord interne écrit annexé au présent contrat (« pacte de colocation »).`,
    },
    {
      id: "solidarity",
      title: "Clause de solidarité",
      required: true,
      editable: true,
      body: `**CLAUSE ESSENTIELLE :**

Les Colocataires sont tenus **solidairement et indivisiblement** envers le Bailleur du paiement du loyer, des charges, du dépôt de garantie, des éventuelles indemnités d'occupation, ainsi que de toutes sommes dues au titre du présent contrat ou de la remise en état du logement.

En conséquence, le Bailleur pourra réclamer à **n'importe lequel des Colocataires** la totalité des sommes dues, à charge pour ce dernier de se retourner contre ses co-colocataires pour leur part contributive.

La solidarité s'étend également aux dégradations constatées dans les parties communes lorsqu'il n'est pas possible d'en identifier l'auteur.

**Sortie d'un colocataire :** En cas de départ d'un Colocataire en cours de bail, celui-ci reste solidairement tenu des dettes du bail jusqu'à son remplacement par un nouveau Colocataire **agréé par écrit par le Bailleur** OU pendant une durée maximale de **6 mois** à compter de la date de notification de son congé, conformément à la pratique adaptée du droit béninois en matière de colocation.`,
    },
    {
      id: "duration",
      title: "Durée du bail",
      required: true,
      editable: true,
      body: `Le présent bail est consenti pour une durée de **{{durationMonths}} mois** à compter du **{{startDate}}** pour se terminer de plein droit le **{{endDate}}**.

Le bail est **renouvelable par tacite reconduction** pour des périodes successives de douze (12) mois, sauf congé donné par l'une des parties dans les conditions légales.

**Préavis de sortie individuel :** Chaque Colocataire peut quitter individuellement le logement moyennant un préavis de **1 mois** notifié au Bailleur et à ses co-colocataires par lettre recommandée, par acte d'huissier ou via la plateforme KAZA.`,
    },
    {
      id: "rent",
      title: "Loyer global et indexation",
      required: true,
      editable: true,
      body: `Le loyer mensuel **global** (pour l'ensemble des Colocataires) est fixé à **{{rent}}** payable d'avance, au plus tard le **5 de chaque mois**.

**Mode de paiement :** Le loyer est encaissé via la plateforme KAZA (escrow sécurisé). Chaque Colocataire reçoit un appel à cotisation pour sa quote-part. Le versement est consolidé puis transmis au Bailleur.

**En cas de défaillance d'un Colocataire**, les autres restent tenus solidairement de la totalité du loyer envers le Bailleur (voir clause de solidarité).

**Indexation :** Le loyer peut être révisé annuellement selon l'IPC INSAE Bénin (art. 25 Loi 2018-12), avec préavis de 2 mois.`,
    },
    {
      id: "charges",
      title: "Charges récupérables",
      required: true,
      editable: true,
      body: `Une provision pour charges d'un montant global de **{{charges}}** est versée mensuellement, en sus du loyer.

Sont incluses dans les charges : eau, électricité des parties communes, internet/WiFi collectif, gardiennage, entretien des espaces verts, enlèvement des ordures.

**Compteurs individuels :** lorsque les chambres disposent de compteurs individuels d'eau ou d'électricité, les consommations sont à la charge exclusive du Colocataire occupant.

**Régularisation annuelle** sur présentation des justificatifs au plus tard 60 jours après la clôture de l'exercice.`,
    },
    {
      id: "deposit",
      title: "Dépôt de garantie unique",
      required: true,
      editable: true,
      body: `Un dépôt de garantie **unique et global** d'un montant de **{{depositAmount}}** (équivalent à **{{depositMonths}} mois de loyer hors charges**, plafond légal article 19 Loi 2018-12) est versé conjointement par les Colocataires à la signature des présentes.

Ce dépôt est conservé sur un **compte escrow sécurisé KAZA**.

**Restitution :** Le dépôt sera restitué dans son intégralité aux Colocataires, **après le départ du dernier Colocataire** et à la libération complète du logement, dans un délai maximum de **deux (2) mois**, déduction faite des sommes éventuellement dues (loyers impayés, dégradations).

La répartition interne du dépôt entre les Colocataires (en cas de relais) est à régler entre eux via le pacte de colocation, sans intervention du Bailleur.`,
    },
    {
      id: "pact",
      title: "Pacte de colocation (annexe recommandée)",
      required: false,
      editable: true,
      body: `Les Colocataires sont vivement encouragés à signer un **pacte de colocation** annexé au présent contrat, fixant entre eux :

- La répartition des chambres ;
- Les règles de vie commune (ménage, courses, invités, bruit, animaux) ;
- Les modalités d'arrivée et de départ d'un colocataire ;
- La gestion d'un compte commun pour les charges partagées ;
- Les modalités de résolution amiable des conflits internes ;
- Le partage du dépôt de garantie en cas de relais.

Le pacte de colocation n'est pas opposable au Bailleur mais sécurise les rapports internes entre Colocataires.`,
    },
    COMMON_INVENTORY_SECTION,
    COMMON_OBLIGATIONS_TENANT,
    COMMON_OBLIGATIONS_OWNER,
    {
      id: "insurance",
      title: "Assurance habitation collective",
      required: true,
      editable: true,
      body: `Les Colocataires souscrivent **collectivement** une **assurance multirisques habitation colocation** couvrant l'ensemble du logement et tous les occupants, OU chaque Colocataire souscrit **individuellement** une assurance habitation pour sa propre quote-part et sa chambre privative.

Dans tous les cas, **les parties communes doivent être couvertes** par au moins une assurance.

Une **attestation collective** ou les **attestations individuelles** sont remises au Bailleur à la signature et chaque année.`,
    },
    COMMON_TERMINATION_SECTION,
    COMMON_RESOLUTORY_SECTION,
    COMMON_JURISDICTION_SECTION,
    COMMON_SIGNATURES_SECTION,
  ],
};

// -----------------------------------------------------------------------------
// TEMPLATE 4 — BAIL COMMERCIAL OHADA
// -----------------------------------------------------------------------------

const TEMPLATE_COMMERCIAL: ContractTemplate = {
  id: "tpl-commercial",
  name: "Bail commercial OHADA",
  description:
    "Bail à usage professionnel régi par l'Acte uniforme OHADA portant droit commercial général (AUDCG). Local commercial, boutique, bureau, atelier. Durée 24 mois min.",
  icon: "Store",
  category: "COMMERCIAL",
  defaultDurationMonths: 24,
  defaultDepositMonths: 3,
  legalBasis:
    "Acte uniforme OHADA portant droit commercial général (AUDCG révisé du 15 décembre 2010), Livre VI — Bail à usage professionnel (art. 101 à 134)",
  sections: [
    {
      id: "parties",
      title: "Identification des parties",
      required: true,
      editable: true,
      body: `**ENTRE LES SOUSSIGNÉS :**

**Le BAILLEUR :** {{owner.name}}, titulaire de la pièce d'identité n° {{owner.cni}}, [le cas échéant : société immatriculée au RCCM sous le n° RCCM/COT/XX-XX-XXX], demeurant ou ayant son siège à {{owner.address}}, joignable au {{owner.phone}},

Ci-après dénommé(e) « **le Bailleur** », d'une part,

**ET**

**Le PRENEUR :** {{tenant.name}}, [société immatriculée au RCCM sous le n° RCCM/COT/XX-XX-XXX, représentée par son gérant en exercice], exerçant l'activité de {{tenant.profession}},

Ci-après dénommé(e) « **le Preneur** », d'autre part,

**Il a été convenu et arrêté ce qui suit, conformément à l'Acte uniforme OHADA portant droit commercial général (AUDCG) — Livre VI — articles 101 à 134.**`,
    },
    {
      id: "property",
      title: "Désignation des locaux et destination",
      required: true,
      editable: true,
      body: `Le Bailleur donne à bail au Preneur, qui accepte, les locaux à usage professionnel ci-après désignés :

- **Type de local :** {{property.type}}
- **Désignation :** {{property.title}}
- **Adresse :** {{property.address}}
- **Surface :** {{property.surface}} m²

**Destination contractuelle :** Les locaux sont destinés exclusivement à l'exercice de l'activité commerciale, industrielle, artisanale ou professionnelle suivante : **[À PRÉCISER — ex. commerce de détail d'articles électroniques]**.

Le Preneur ne pourra exercer aucune autre activité dans les locaux sans l'accord écrit préalable du Bailleur, sous peine de résiliation du bail.

Conformément à l'article 103 de l'AUDCG, toute clause restrictive de l'activité doit être stipulée de manière expresse et explicite.`,
    },
    {
      id: "duration",
      title: "Durée du bail",
      required: true,
      editable: true,
      body: `Le présent bail est consenti et accepté pour une durée de **{{durationMonths}} mois** ({{durationMonths}} mois, soit deux années pleines minimum conformément à la pratique OHADA), à compter du **{{startDate}}** pour se terminer le **{{endDate}}**.

Conformément à l'article 104 de l'AUDCG, le bail à usage professionnel peut être à durée déterminée ou à durée indéterminée. À l'expiration de la durée déterminée et à défaut de congé délivré dans les 3 mois précédant l'échéance, le bail se prolonge **pour une durée indéterminée**.

**Droit au renouvellement (art. 123 AUDCG) :** Le Preneur a droit au renouvellement du bail s'il justifie de l'exploitation, conformément aux stipulations du bail, d'une activité commerciale, industrielle, artisanale ou professionnelle, pendant une durée minimale de **deux (2) ans**. Le Preneur doit en faire la demande par écrit au Bailleur au plus tard **3 mois avant l'expiration** du bail.

**Refus de renouvellement (art. 126 AUDCG) :** Le Bailleur peut refuser le renouvellement moyennant le paiement au Preneur d'une **indemnité d'éviction** correspondant au préjudice causé par le défaut de renouvellement.`,
    },
    {
      id: "rent",
      title: "Loyer, indexation et révision triennale",
      required: true,
      editable: true,
      body: `Le loyer mensuel est fixé à **{{rent}}** hors taxes, payable d'avance, au plus tard le **5 de chaque mois**, par virement bancaire ou via la plateforme KAZA.

**Révision du loyer (art. 117 AUDCG) :** À défaut d'accord écrit entre les parties sur le nouveau montant du loyer, la juridiction compétente est saisie. Le loyer peut être révisé tous les **3 ans** ou à chaque renouvellement.

**Indexation conventionnelle :** Le loyer pourra être indexé annuellement sur l'**Indice des Prix à la Consommation (IPC)** publié par l'INSAE Bénin, avec préavis écrit de 2 mois.

**TVA :** Si le Bailleur est assujetti à la TVA (régime du réel), la TVA en vigueur (18 % au Bénin) s'applique en sus du loyer principal.

**Pénalités de retard :** Tout retard de paiement supérieur à 15 jours entraîne l'application d'intérêts moratoires au taux légal commercial en vigueur au Bénin.`,
    },
    {
      id: "charges",
      title: "Charges, impôts et taxes",
      required: true,
      editable: true,
      body: `**À la charge du Preneur :**
- Provision mensuelle de **{{charges}}** pour charges récupérables (eau, électricité, climatisation des parties communes, gardiennage, entretien, enlèvement des ordures) ;
- Toutes les **taxes liées à l'activité commerciale** : patente, taxe professionnelle, contributions foncières des propriétés bâties éventuellement refacturées, redevance audiovisuelle professionnelle ;
- Les abonnements et consommations propres aux locaux (eau, électricité, internet).

**À la charge du Bailleur :**
- Impôt foncier (TFU) et taxe sur la valeur locative (TVL) ;
- Grosses réparations au sens de l'article 605 du Code civil (toiture, gros œuvre, murs porteurs) ;
- Mise en conformité des locaux avec la réglementation applicable à la destination contractuelle.

**Régularisation annuelle** des charges sur présentation des justificatifs.`,
    },
    {
      id: "deposit",
      title: "Dépôt de garantie",
      required: true,
      editable: true,
      body: `Le Preneur verse à la signature un dépôt de garantie d'un montant de **{{depositAmount}}**, équivalent à **{{depositMonths}} mois de loyer hors charges et hors taxes**.

Ce dépôt est destiné à garantir l'exécution des obligations du Preneur, notamment le paiement des loyers, charges, indemnités d'occupation et la remise en état des locaux.

Le dépôt est conservé sur un **compte escrow sécurisé KAZA**.

Il sera restitué dans un délai maximum de **2 mois** à compter de la restitution effective des locaux et de la remise des clés, déduction faite des éventuelles sommes dues.`,
    },
    COMMON_INVENTORY_SECTION,
    {
      id: "obligations-tenant",
      title: "Obligations du Preneur",
      required: true,
      editable: true,
      body: `Conformément aux articles 105 et suivants de l'AUDCG, le Preneur s'oblige notamment à :

1. **Payer le loyer et les charges** aux échéances convenues ;
2. **Exploiter effectivement et personnellement** le fonds commercial / l'activité professionnelle dans les locaux loués, conformément à la destination contractuelle ;
3. **Maintenir une exploitation continue** : toute interruption d'exploitation de plus de 3 mois sans motif légitime peut entraîner la déchéance du droit au renouvellement (art. 123 AUDCG) ;
4. **Effectuer les réparations locatives** et l'entretien courant ;
5. **Souscrire les assurances obligatoires** : responsabilité civile professionnelle, multirisques entreprise (incendie, dégât des eaux, bris de glace, vol) ;
6. **Respecter les normes** d'hygiène, de sécurité, d'urbanisme et celles propres à l'activité exercée (autorisations, licences, agréments) ;
7. **Demander l'autorisation écrite** du Bailleur pour tout aménagement ou travaux affectant la structure des locaux ;
8. **Permettre les visites** du Bailleur (préavis 48h) et des candidats à la location pendant les 6 derniers mois du bail.`,
    },
    {
      id: "obligations-owner",
      title: "Obligations du Bailleur",
      required: true,
      editable: true,
      body: `Conformément aux articles 105 et suivants de l'AUDCG, le Bailleur s'oblige à :

1. **Délivrer les locaux** en état de servir à la destination contractuelle ;
2. **Faire jouir paisiblement** le Preneur pendant toute la durée du bail ;
3. **Garantir le Preneur** des vices ou défauts qui empêchent l'usage des locaux ;
4. **Effectuer les grosses réparations** et la mise en conformité ;
5. **Délivrer au Preneur** un reçu mentionnant le détail des sommes versées (loyer, charges, TVA le cas échéant) ;
6. **Notifier par écrit** tout congé ou refus de renouvellement dans les formes et délais légaux (par acte extrajudiciaire ou tout moyen écrit conférant date certaine) ;
7. **Payer l'indemnité d'éviction** en cas de refus de renouvellement non motivé par un motif grave et légitime (art. 126 AUDCG).`,
    },
    {
      id: "sublease",
      title: "Sous-location et cession du bail",
      required: true,
      editable: true,
      body: `**Sous-location (art. 121 AUDCG) :** Toute sous-location totale ou partielle est **interdite** sans le **consentement exprès et écrit** du Bailleur. À défaut, le Bailleur pourra demander la résiliation du bail.

**Cession du bail (art. 121 AUDCG) :** La **cession du bail** est de droit **lorsqu'elle accompagne la cession du fonds de commerce** ou de l'activité professionnelle exercée dans les locaux. Toutefois, le Preneur doit notifier la cession au Bailleur par tout moyen permettant d'en établir la réception effective.

Le Bailleur peut s'opposer à la cession dans le délai d'**un (1) mois** suivant la notification, en saisissant la juridiction compétente, s'il justifie d'un motif grave et légitime.`,
    },
    {
      id: "guarantee",
      title: "Garanties complémentaires",
      required: false,
      editable: true,
      body: `Le Preneur fournit, en sus du dépôt de garantie, les garanties suivantes (à compléter selon accord des parties) :

- **Caution solidaire** d'un tiers personne physique ou morale (acte de cautionnement annexé) ;
- **Garantie bancaire à première demande** émise par une banque agréée BCEAO ;
- **Assurance loyer impayé** souscrite auprès d'une compagnie d'assurance ;
- **Nantissement** sur le fonds de commerce du Preneur.`,
    },
    COMMON_TERMINATION_SECTION,
    {
      id: "resolutory",
      title: "Clause résolutoire (commerciale)",
      required: true,
      editable: true,
      body: `À défaut de paiement à l'échéance d'un seul terme de loyer, des charges ou de toute autre somme due, et **un (1) mois** après commandement de payer signifié par acte extra-judiciaire et resté infructueux, le présent bail sera **résilié de plein droit** sans qu'il soit besoin de remplir aucune formalité judiciaire, conformément à l'article 133 de l'AUDCG.

La clause résolutoire joue également :
- En cas de cessation d'exploitation pendant plus de 3 mois sans motif légitime ;
- En cas de sous-location ou cession non autorisée ;
- En cas de manquement grave et répété aux obligations contractuelles.

Le Bailleur pourra obtenir l'expulsion du Preneur et de tous occupants de son chef par simple ordonnance de référé, ainsi que la mainlevée des sommes consignées sur le compte escrow.`,
    },
    {
      id: "jurisdiction-commercial",
      title: "Droit applicable et juridiction compétente",
      required: true,
      editable: false,
      body: `Le présent contrat est régi par :
- L'**Acte uniforme OHADA portant droit commercial général** (AUDCG) du 15 décembre 2010 ;
- Le **droit commercial béninois** complémentaire ;
- Les **Actes uniformes OHADA** dans leur ensemble.

Tout différend né de l'interprétation, de l'exécution ou de la résiliation du présent contrat sera, à défaut d'accord amiable et préalablement à toute action judiciaire, soumis à la **médiation proposée par la plateforme KAZA** ou à l'**arbitrage CCJA** dans un délai de 30 jours.

À défaut de conciliation, les parties attribuent compétence exclusive au **Tribunal de Commerce de Cotonou** statuant en premier ressort, avec voie d'appel possible devant la **Cour Commune de Justice et d'Arbitrage (CCJA) de l'OHADA** à Abidjan pour les questions d'interprétation des Actes uniformes OHADA.`,
    },
    COMMON_SIGNATURES_SECTION,
  ],
};

// -----------------------------------------------------------------------------
// EXPORT TEMPLATES
// -----------------------------------------------------------------------------

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  TEMPLATE_RESIDENTIAL_FURNISHED,
  TEMPLATE_RESIDENTIAL_UNFURNISHED,
  TEMPLATE_COLOCATION,
  TEMPLATE_COMMERCIAL,
];

export function getTemplateById(id: string): ContractTemplate | undefined {
  return CONTRACT_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: ContractCategory
): ContractTemplate[] {
  return CONTRACT_TEMPLATES.filter((t) => t.category === category);
}

// -----------------------------------------------------------------------------
// CLAUSES STANDARD — bibliothèque réutilisable
// -----------------------------------------------------------------------------

export const STANDARD_CLAUSES: StandardClause[] = [
  {
    id: "clause-pets-forbidden",
    category: "Animaux",
    title: "Animaux interdits",
    recommended: false,
    body: `La présence de tout animal de compagnie (chien, chat, oiseau, NAC, etc.) est **strictement interdite** dans le logement, y compris à titre temporaire ou de gardiennage. Toute infraction constatée constituera un manquement grave de nature à entraîner la mise en œuvre de la clause résolutoire.`,
  },
  {
    id: "clause-pets-allowed",
    category: "Animaux",
    title: "Animaux autorisés sous conditions",
    recommended: true,
    body: `La détention d'animaux domestiques (chiens, chats) est **autorisée** sous réserve qu'ils ne causent aucun trouble de voisinage (bruit, odeur, dégradations) et qu'ils soient vaccinés et identifiés conformément à la réglementation béninoise. Les chiens de catégories dangereuses (1 et 2) sont interdits. Tout dégât causé par l'animal sera entièrement à la charge du Locataire.`,
  },
  {
    id: "clause-sublet-forbidden",
    category: "Sous-location",
    title: "Sous-location strictement interdite",
    recommended: true,
    body: `Toute sous-location, totale ou partielle, à titre gratuit ou onéreux, ainsi que toute mise à disposition à titre temporaire via des plateformes de location courte durée (Airbnb, Booking, etc.) est **strictement interdite** sans le consentement exprès, écrit et préalable du Bailleur. Toute infraction constituera une cause de résiliation immédiate du bail.`,
  },
  {
    id: "clause-sublet-conditional",
    category: "Sous-location",
    title: "Sous-location autorisée sous conditions",
    recommended: false,
    body: `Le Locataire peut sous-louer le logement, en tout ou partie, sous réserve de l'**accord écrit préalable du Bailleur** et à condition que le loyer de la sous-location ne dépasse pas le loyer principal au prorata de la surface louée. Le Locataire principal demeure seul responsable envers le Bailleur de l'exécution du bail.`,
  },
  {
    id: "clause-works-tenant",
    category: "Travaux",
    title: "Travaux d'aménagement à la charge du Locataire",
    recommended: false,
    body: `Les travaux d'aménagement, de décoration ou d'embellissement réalisés par le Locataire (peinture, papier-peint, parquet flottant, installation d'équipements amovibles) sont à sa charge exclusive. Ils devront avoir reçu l'accord écrit préalable du Bailleur s'ils affectent la structure ou les équipements fixes du logement. En fin de bail, le Bailleur pourra exiger la remise en état initial ou conserver les améliorations sans indemnité.`,
  },
  {
    id: "clause-insurance-mandatory",
    category: "Assurance",
    title: "Assurance multirisques habitation obligatoire",
    recommended: true,
    body: `Le Locataire s'oblige à souscrire dès la prise de possession des lieux une **assurance multirisques habitation** couvrant sa **responsabilité civile locative** (incendie, dégât des eaux, explosion) ainsi que sa **responsabilité civile vie privée** envers les tiers. Une attestation d'assurance devra être remise au Bailleur à la signature du contrat, puis renouvelée chaque année. À défaut, le Bailleur pourra souscrire pour le compte du Locataire et lui en refacturer le coût majoré de 10 %.`,
  },
  {
    id: "clause-courtesy-visits",
    category: "Visites",
    title: "Visites de courtoisie du Bailleur",
    recommended: false,
    body: `Le Bailleur (ou son mandataire) pourra effectuer une **visite de courtoisie** annuelle du logement, sur **rendez-vous fixé au moins 7 jours à l'avance**, afin de vérifier l'état général du bien et l'exécution des obligations locatives. Le Locataire ne pourra s'y opposer sans motif légitime.`,
  },
  {
    id: "clause-late-penalty",
    category: "Paiement",
    title: "Pénalités de retard de loyer",
    recommended: true,
    body: `Tout retard de paiement du loyer ou des charges excédant **10 jours** entraînera de plein droit, sans mise en demeure préalable, l'application d'une **pénalité forfaitaire de 5 % du montant impayé**, ainsi que des **intérêts moratoires au taux légal** en vigueur, calculés jour par jour à compter de la date d'échéance jusqu'au paiement effectif.`,
  },
  {
    id: "clause-insee-indexation",
    category: "Indexation",
    title: "Indexation annuelle sur l'IPC INSAE Bénin",
    recommended: true,
    body: `Le loyer sera révisé automatiquement chaque année à la date anniversaire du contrat, en fonction de la **variation annuelle de l'Indice des Prix à la Consommation (IPC) publié par l'Institut National de la Statistique et de l'Analyse Économique (INSAE) du Bénin**. Le nouveau loyer prendra effet le mois suivant la notification écrite adressée par le Bailleur au Locataire, accompagnée du justificatif officiel de l'indice de référence.`,
  },
  {
    id: "clause-tacit-renewal",
    category: "Renouvellement",
    title: "Renouvellement par tacite reconduction",
    recommended: true,
    body: `À l'expiration de la durée initiale, le présent bail sera **reconduit tacitement** pour des périodes successives de même durée, aux **mêmes clauses et conditions**, sauf congé délivré par l'une des parties dans les conditions et délais légaux. La reconduction tacite ne fait pas naître un nouveau bail.`,
  },
  {
    id: "clause-notice-period",
    category: "Préavis",
    title: "Préavis de départ (1 mois meublé / 3 mois non meublé)",
    recommended: true,
    body: `Le Locataire peut résilier le bail à tout moment moyennant un préavis de :
- **1 mois** pour un logement loué meublé ;
- **3 mois** pour un logement loué non meublé.

Le préavis doit être notifié par lettre recommandée avec accusé de réception, par acte d'huissier ou par message via la plateforme KAZA avec accusé de réception électronique.`,
  },
  {
    id: "clause-solidary-guarantor",
    category: "Garantie",
    title: "Garant solidaire",
    recommended: true,
    body: `Le Locataire fournit la garantie solidaire d'un tiers (le « Garant ») qui se porte **caution personnelle et solidaire** du Locataire envers le Bailleur, pour le paiement des loyers, charges et toutes sommes dues au titre du présent contrat, ainsi que pour la remise en état du logement. La caution est valable pour toute la durée du bail et ses éventuelles reconductions, avec faculté de résiliation moyennant préavis de 3 mois à compter de la troisième année.`,
  },
  {
    id: "clause-damages",
    category: "Dégradations",
    title: "Imputation des dégradations",
    recommended: true,
    body: `Le Locataire est tenu de répondre, à l'égard du Bailleur, de toute **dégradation ou perte** survenue dans le logement pendant la durée du bail, à moins qu'il ne prouve qu'elles ont eu lieu sans sa faute, par cas de force majeure ou par la faute du Bailleur. Les **dégradations imputables au Locataire** seront chiffrées sur la base de devis d'entreprises et déduites du dépôt de garantie, le solde éventuel restant dû par le Locataire.`,
  },
  {
    id: "clause-noise",
    category: "Voisinage",
    title: "Respect du voisinage et tranquillité",
    recommended: true,
    body: `Le Locataire s'engage à respecter la tranquillité du voisinage et à ne pas troubler la jouissance des autres occupants de l'immeuble ou des immeubles voisins. **Les bruits excessifs sont interdits entre 22h00 et 7h00.** Toute fête, réception ou évènement bruyant nécessite une information préalable du voisinage. La répétition de troubles avérés constitue un motif de résiliation pour faute.`,
  },
  {
    id: "clause-no-smoking",
    category: "Tabac",
    title: "Interdiction de fumer à l'intérieur",
    recommended: false,
    body: `Il est **strictement interdit** de fumer (cigarettes, cigares, pipe, chicha, vapotage) à l'intérieur du logement et de ses dépendances closes. Les fumeurs pourront utiliser les balcons, terrasses ou jardins, à condition de ne pas troubler le voisinage et de jeter leurs mégots dans des cendriers prévus à cet effet.`,
  },
  {
    id: "clause-plants",
    category: "Aménagement",
    title: "Entretien des plantes et jardin",
    recommended: false,
    body: `Le Locataire s'engage à entretenir les plantes, jardinières, jardin et espaces verts privatifs attenants au logement, à les arroser régulièrement et à les restituer en bon état à la fin du bail. Le remplacement des plantes mortes par négligence sera à la charge du Locataire.`,
  },
  {
    id: "clause-tv-antenna",
    category: "Équipements",
    title: "Installation d'antenne TV / parabole",
    recommended: false,
    body: `L'installation d'une antenne TV individuelle ou d'une **parabole satellite** sur la façade, le balcon ou le toit nécessite l'**accord écrit préalable du Bailleur** et le respect des règles d'urbanisme et de copropriété. À défaut d'accord, le Locataire utilisera l'antenne collective existante ou un service de TV par internet.`,
  },
];

export function getClausesByCategory(): Record<string, StandardClause[]> {
  const grouped: Record<string, StandardClause[]> = {};
  for (const clause of STANDARD_CLAUSES) {
    if (!grouped[clause.category]) grouped[clause.category] = [];
    grouped[clause.category].push(clause);
  }
  return grouped;
}
