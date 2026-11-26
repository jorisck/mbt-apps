# MBT monorepo

Monorepo pour les produits MBT Taxis / Handycab : sites marketing, API de demandes, back-office admin, et (plus tard) app mobile.

## Structure

```text
mbt/
├── apps/
│   ├── mbttaxis/     # Site marketing MBT Taxis (Next.js) — formulaire invité
│   ├── handycab/     # Site marketing Handycab (Next.js) — formulaire invité + brand
│   ├── api/          # API FastAPI — cœur métier (Heroku + Postgres)
│   ├── admin/        # Back-office web (Next.js) — charte Handycab
│   └── mobile/       # App passager (à venir) — client de la même API
├── packages/         # Code partagé (types, schémas, constantes) — futur
├── infos/            # Design / textes de référence (local, non versionné)
└── .cursor/skills/   # Skills agent Cursor ancrées sur infos/
```

| App | Rôle | Stack prévue |
|-----|------|----------------|
| `mbttaxis` | Marketing + demande sans compte | Next.js |
| `handycab` | Marketing Handycab + demande sans compte | Next.js |
| `api` | Auth, demandes, e-mails, webhooks, RGPD | **FastAPI** → **Heroku** (Postgres) |
| `admin` | Ops MBT : demandes, passagers, webhooks, paramètres | Next.js, **design Handycab** |
| `mobile` | Compte client / demandes récurrentes | Client de `api` (Expo prévu) |

Les dossiers `api`, `admin` et `mobile` sont **vides pour l’instant** (placeholders + `.env.example`).

---

## Principes produit (contrat)

1. **Demande sans compte possible** — le compte client est un plus, hors offre à formaliser.
2. On parle toujours de **« demande »** — seule l’entreprise confirme (pas de réservation auto).
3. **Hors scope contrat** : paiement, push, suivi véhicule, attribution chauffeurs.

### Compte client (passager)

- Inscription e-mail + mot de passe, vérification e-mail, mot de passe oublié.
- Profil : nom, téléphone, adresses favorites, besoins PMR par défaut (consentement explicite, facultatif).
- Même formulaire que les invités, pré-rempli ; aller-retour ; « refaire cette demande ».
- Historique à venir / passées + annulation selon délai admin.
- E-mails à chaque changement de statut (Resend).

### Compte admin (équipe MBT)

- Un seul rôle, **2FA obligatoire**.
- Dashboard (nouvelles demandes, jour / lendemain, SLA visuel).
- Demandes : recherche, filtres (statut, date, origine : MBT / Handycab / app / avec·sans compte).
- Statuts, motif de refus, notes internes, historique, état webhook Taxiger.
- Passagers, webhooks (CRUD, test, journal, relances), paramètres, journal d’audit.

---

## Architecture technique

```text
  [mbttaxis]  [handycab]  [mobile]  [admin]
       \          |          /         |
        \         |         /          |
         ----->  apps/api (FastAPI) <---
                      |
              Heroku Postgres
                      |
         Resend (e-mails) · Google Places/Maps
                      |
              Webhooks HMAC → Taxiger / destinations
```

### Une seule API

Tous les canaux (sites, mobile, admin) consomment **`apps/api`**. Rien à réécrire pour l’app mobile.

### Auth

- Web (admin / compte) : sessions cookie **httpOnly**.
- Mobile : access token court + refresh token avec rotation.

### Qualité (prévu dès le départ)

- Statuts en **machine à états** (transitions explicites).
- **Clé d’idempotence** à la création de demande.
- Webhooks : outbox transactionnelle, signature HMAC, retries backoff, payload `v1`.
- Dates en **UTC**, affichage **Europe/Brussels**.
- RGPD by design (consentement PMR, purge, logs sans PII).
- Rate limiting login + formulaire ; accessibilité WCAG 2.1 AA côté client.

### Admin UI

- Charte graphique **Handycab** (jaune `#f9cd1a`, dark, accent bleu — voir `apps/handycab` / `infos/handycab/DESIGN.md`).
- **Google Maps + Places Autocomplete** : carte, localisation, propositions d’adresse.
- Clé publique `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` côté admin ; clé serveur `GOOGLE_MAPS_API_KEY` côté API (géocodage / validation).

### E-mails

- **Resend** uniquement via l’API (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).
- Accusé de réception + e-mail à chaque changement de statut.

---

## Variables d’environnement

Copier chaque `.env.example` → `.env` / `.env.local` (ne jamais committer les secrets).

| Emplacement | Usage |
|-------------|--------|
| `apps/api/.env.example` | `DATABASE_URL`, Resend, Google Maps serveur, auth, CORS, webhooks |
| `apps/admin/.env.example` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| `apps/mobile/.env.example` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| `apps/mbttaxis/.env.example` | Lien vers Handycab |
| `apps/handycab/.env.example` | Lien vers MBT Taxis |

**Heroku (API)** : configurer au minimum `DATABASE_URL` (addon Postgres), `SECRET_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `GOOGLE_MAPS_API_KEY`, `CORS_ORIGINS`, `WEBHOOK_HMAC_SECRET`.

---

## Prérequis & commandes (sites existants)

- Node.js ≥ 20  
- pnpm 10 (`corepack enable` ou install global)

```bash
pnpm install
pnpm dev:mbttaxis   # http://localhost:3000
pnpm dev:handycab   # http://localhost:3001
pnpm build
```

L’API FastAPI et l’admin / mobile seront branchés quand les dossiers ne seront plus vides.

## Ajouter une app

1. Créer sous `apps/<nom>` (déjà le cas pour `api`, `admin`, `mobile`).
2. Node : prise en charge auto via `pnpm-workspace.yaml` (`apps/*`) dès qu’un `package.json` existe.
3. Python (`api`) : hors workspace pnpm — déployée séparément sur Heroku.

---

## Sites marketing (état actuel)

- Contenu en dur : `apps/*/content/`
- Formulaires encore mock tant que l’API n’est pas branchée
- Design / copy : `infos/` (local)

## Suite logique

1. Modèle de données + machine à états (tables, transitions, payload webhook `v1`)
2. Scaffold FastAPI + Postgres sur Heroku
3. Scaffold admin Next.js (charte Handycab + Maps/Places)
4. Brancher les formulaires mbttaxis / handycab sur l’API
5. Espace compte client + mobile
