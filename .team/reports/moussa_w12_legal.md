# Moussa — W12 — Refonte pages légales (droit béninois + PIRABEL LABS)

## Mission
Refonte des 4 pages légales de KAZA pour intégrer PIRABEL LABS SARL comme éditeur officiel, et conformer le contenu au droit béninois (Code du numérique, OHADA, OAPI, APDP) ainsi qu'aux standards RGPD UE.

## Livrables

### `src/app/(main)/legal/mentions-legales/page.tsx` — REFONTE
9 sections : Éditeur PIRABEL LABS SARL (RCCM, IFU, capital 1M FCFA, Cadjèhoun), Marque KAZA® déposée OAPI (Annexe III Bangui 2015), Directeur de publication (Le Gérant), Hébergement (Vercel + Supabase UE/USA), PI (Annexe VII Bangui), Crédits, Contact (4 emails dédiés), Loi applicable (droit béninois + OHADA), Médiation (DGCI Bénin). TOC sticky + footer marque.

### `src/app/(main)/legal/cgu/page.tsx` — REFONTE 15 articles
Objet, Définitions (KAZA Pay, Escrow, Contrat numérique), Inscription/KYC LBC-FT, Services, Engagements users (Loi 2018-12), Engagements KAZA, Modération, Paiements/escrow (art. 1984+ Code civil ; commissions 3-5%), Bail (durée min 12 mois, caution max 2 mois), Litiges (conciliation préalable obligatoire), PI (Bangui), Limitation responsabilité (Loi 2017-20 intermédiaire technique), Suspension/résiliation (préavis 30j), Droit applicable (Tribunal Commerce Cotonou + Cour Appel), Modifications (préavis 15j).

### `src/app/(main)/legal/confidentialite/page.tsx` — REFONTE
14 sections référencées au Code du numérique béninois (art. 379-423) : Préambule, Responsable (PIRABEL LABS), Données (KYC immobilier obligatoire), Finalités (art. 391), Bases légales, Destinataires (sous-traitants), Transferts hors CEDEAO (art. 416-423, clauses types), Conservation (KYC 5 ans, fiscal 10 ans, logs 12 mois), Droits (art. 401-411), APDP (Tour Admin B, Steinmetz, apdp.bj), Sécurité (TLS 1.3, AES-256, HMAC, notif 72h), Cookies, Modifications, DPO.

### `src/app/(main)/legal/cookies/page.tsx` — REFONTE
7 sections + 3 tableaux enrichis (Nom / Fournisseur / Finalité / Durée / **Base légale**). Cadre légal Loi 2017-20 explicite, préférences révocables, double recours DPO + APDP.

## Conventions appliquées
- TypeScript strict + Next.js 15 metadata SEO (title + OG sur chaque page)
- shadcn/ui : Badge (variant outline/secondary), Separator, icônes lucide-react
- Layout existant `(main)/legal/layout.tsx` conservé (TOC sticky `LegalToc`)
- Encart bleu en haut + footer marque uniforme sur les 4 pages
- Style prose-legal cohérent avec h2 numérotés, scroll-mt-28

## Vérification
`npx tsc --noEmit` : aucune erreur sur les 4 fichiers modifiés.

## Notes
- Placeholders PIRABEL LABS (adresse exacte, RCCM, IFU) marqués tels quels selon brief — à confirmer.
- Mention équipe Trust & Safety et FedaPay/Kkiapay alignée sur la stack du PRD.
- Marque KAZA® déposée OAPI mentionnée systématiquement (Annexes III + VII Bangui 2015).
