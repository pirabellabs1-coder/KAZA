# Chiamaka — Wave 8b — Rapport

**Auteur** : Chiamaka Okonkwo (Frontend Engineer)
**Mission** : Page `/settings/privacy` + branchement `<VisitRequestDialog>` via bouton client.
**Date** : 2026-05-27

## Fichiers créés / modifiés

- `src/app/(dashboard)/settings/privacy/page.tsx` — server page, métadonnées, `<SettingsHeader>` + `<PrivacyClient />`.
- `src/app/(dashboard)/settings/privacy/privacy-client.tsx` — client, 6 sections : données KAZA (lien `/legal/confidentialite`), export RGPD (collecte 9 clés localStorage → blob JSON → download `kaza-export-YYYY-MM-DD.json` + toast "Export généré"), suppression compte (Alert warning + Dialog 2 étapes : checkbox "Je comprends" → input "SUPPRIMER" → alert démo "Demande enregistrée. Votre compte sera supprimé sous 30 jours."), préférences pub (2 Switch, persistance `kaza-ad-prefs`, off / on défaut), cookies (reset `kaza-cookie-consent` + alert), lien `/settings/security`.
- `src/components/property/visit-request-button.tsx` — réécrit selon spec : props `propertyId/Title/Address, ownerName, className, variant?: 'default' | 'large'`. Vérifie `kaza-demo-session` cookie via `useEffect` ; si absent → `window.alert` + `router.push('/login')`. Variant `large` = h-12 w-full text-base font-semibold. Icône Lucide `Calendar`. Bouton kaza-blue.

## Notes

- `<SettingsHeader>` réutilisé depuis `../settings-form` (export existant, aligné avec security/notifications).
- Pas de composant Checkbox shadcn dans le projet → fallback `<input type="checkbox" accent-kaza-blue>` natif accessible.
- `VisitRequestDialog` (Yaw) consommé tel quel : signature `{ open, onOpenChange, propertyId, propertyTitle, propertyAddress, ownerName }` respectée à l'identique.
- Ancien `<VisitRequestButton>` (signature `variant: 'default'|'outline'|'ghost'`, sans check auth) remplacé : grep confirme zéro consommateur existant, donc aucune régression.
- `tsc --noEmit` propre sur les 3 fichiers.
