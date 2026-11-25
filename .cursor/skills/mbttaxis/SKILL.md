---
name: mbttaxis
description: >-
  Build and edit the MBT Taxis Next.js site (apps/mbttaxis) — PMR, VSL, TPMR,
  design tokens, pages, forms, and reproduction of mbttaxis.be. Use when working
  on mbttaxis, the MBT marketing site, reservation/tarifs/adaptation pages, or
  brand UI matching infos/.
---

# MBT Taxis site

Ta référence produit est le dossier `infos/` à la racine du monorepo.

## Avant toute modification

1. Lire `infos/mbttaxis-spec-reproduction.md` (couleurs, typo, layout, stack, routes).
2. Lire `infos/mbttaxis-textes-complets.md` (copy page par page).
3. S’appuyer sur `infos/captures/` (desktop + mobile) pour le rendu.
4. Consulter `reference.md` dans cette skill pour les tokens rapides.

## Règles figées

- Contenu **en dur** sous `apps/mbttaxis/content/` — pas de CMS.
- Formulaires **mock** (validation + succès) tant que le client n’a pas demandé d’e-mail réel.
- Textes **corrigés** (ne pas recopier les fautes Odoo : « un taxis », accords, etc.).
- Ne pas inventer de couleurs, polices ou URLs hors spec.
- Conserver les routes : `/`, `/reservation-tpmr`, `/tarifs-vsl`, `/adaptation-tpmr`, `/location-vente`, `/about-us`, `/contactus`, `/cookie-policy`.
- App uniquement dans `apps/mbttaxis/` ; le monorepo peut accueillir d’autres apps dans `apps/`.

## Stack

Next.js App Router + TypeScript + Tailwind v4 + Poppins/Raleway (`next/font`) + Embla + RHF/Zod + Font Awesome 4.7.
