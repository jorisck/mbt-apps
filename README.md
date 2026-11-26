# MBT monorepo

Monorepo pour les produits MBT Taxis / HandyCab : sites marketing, API de demandes, espace de gestion (back-office) et, plus tard, application mobile.

## Structure

```text
mbt/
├── apps/
│   ├── mbttaxis/     # Site marketing MBT Taxis (Next.js) — formulaire invité
│   ├── handycab/     # Site marketing HandyCab (Next.js) — formulaire invité + charte
│   ├── api/          # FastAPI : API publique /v1 + espace de gestion (Jinja2 + HTMX) + worker
│   └── mobile/       # App passager (à venir) — client de la même API
├── packages/
│   └── brand/        # Charte HandyCab partagée (tokens Tailwind) : sites + espace de gestion
├── infos/            # Design / textes / spécification de référence (local, non versionné)
└── .cursor/skills/   # Skills agent Cursor ancrées sur infos/
```

| App | Rôle | Stack |
|-----|------|-------|
| `mbttaxis` | Marketing + demande sans compte | Next.js |
| `handycab` | Marketing HandyCab + demande sans compte | Next.js |
| `api` | API publique `/v1`, **espace de gestion**, e-mails (worker), audit | **FastAPI**, PostgreSQL → **Heroku** |
| `mobile` | Compte client / demandes récurrentes | Client de `api` (Expo prévu) |

L'espace de gestion n'est **pas** une application Next.js : il est rendu côté serveur par `apps/api` (Jinja2 + HTMX, Tailwind v4 avec la charte HandyCab de `packages/brand`). Même origine que ses données, cookie de session `httpOnly`, pas de CORS.

---

## État d'avancement (spécification `docs/admin/spec-espace-admin.md` v1.1)

| Lot | Contenu | État |
|-----|---------|------|
| L1 | Socle : config, base, migrations, chiffrement, audit chaîné, routage par hôte, `/healthz`, Procfile | fait |
| L2 | Authentification des admins : Argon2id, sessions, CSRF, réauthentification, verrouillage, invitations, mot de passe oublié, CLI | fait — **sans 2FA** (voir ci-dessous) |
| L3 | Demandes : `POST /v1/demandes`, machine à états, liste / recherche / fiche / notes, e-mails Resend (file + worker) | fait |
| L4 | Webhooks sortants (Taxiger) | à faire |
| L5 | Tâches planifiées (clôture auto, purge RGPD), paramètres avancés | à faire |
| L6 | Écrans passagers dans l'admin | à faire |
| L8 | Compte client + client API partagé (`packages/api-client`) | à faire |

**Écart assumé avec la spécification : pas de double authentification (2FA) dans cette version.** Connexion e-mail + mot de passe ; les actions sensibles (inviter / désactiver un admin, paramètres, export CSV) exigent de **ressaisir le mot de passe** (valable 10 minutes). Le 2FA TOTP pourra être ajouté ensuite sans changer le reste.

---

## Principes produit (contrat)

1. **Demande sans compte possible** — le compte client est un plus, hors offre à formaliser.
2. On parle toujours de **« demande »** — seule l'entreprise confirme (pas de réservation automatique).
3. **Hors scope contrat** : paiement, push, suivi véhicule, attribution chauffeurs.

### Espace de gestion (équipe MBT)

Un seul rôle. Tableau de bord (nouvelles demandes, courses du jour / lendemain, demandes à régulariser, état du worker), liste avec recherche insensible aux accents et filtres, fiche avec actions selon le statut (confirmer, refuser avec motif, annuler, terminée / non effectuée, corrections), notes internes, historique, e-mails envoyés, gestion des administrateurs, paramètres, journal d'audit vérifiable, export CSV.

---

## Architecture technique

```text
  [mbttaxis]  [handycab]  [mobile]          navigateur (équipe MBT)
        \          |          /                    |
         \         |         /                     |
   api.<domaine>  /v1  (BFF + clé X-Client-Key)   gestion.<domaine>  (HTML, cookie de session)
              \                                   /
               ----------  apps/api (FastAPI) ----
                               |
            Heroku Postgres · worker (e-mails) · Resend · Google Places
```

Un seul processus ASGI sert **deux applications selon l'en-tête `Host`** : `PUBLIC_API_HOST` (API publique) et `ADMIN_HOST` (espace de gestion). Tout autre hôte reçoit 404. Aucun CORS : les sites appellent l'API depuis leur serveur (BFF) avec une clé `X-Client-Key`.

Qualité de base : machine à états explicite, clé d'idempotence à la création, verrouillage optimiste (`If-Match` / `revision`), file d'e-mails transactionnelle (outbox), heures stockées en UTC et saisies en heure de Bruxelles, journal d'audit à chaînage SHA-256, CSP stricte (aucun script ni style inline), consentement explicite pour les données de santé.

---

## Variables d'environnement

Copier chaque `.env.example` en `.env` / `.env.local` (ne jamais committer les secrets).

| Emplacement | Usage |
|-------------|-------|
| `apps/api/.env.example` | base, hôtes, liens `HANDYCAB_URL` et `MBTTAXIS_URL` (bouton « En savoir plus » et pied de page de l'admin), clés de chiffrement, `BFF_KEYS`, Resend, Google, Sentry |
| `apps/mobile/.env.example` | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` |
| `apps/mbttaxis/.env.example`, `apps/handycab/.env.example` | `API_URL`, `API_BFF_KEY`, clé Maps publique, lien croisé |

Générer les secrets : `python -m app.cli gen-key` (chiffrement) et `python -m app.cli gen-key --kind secret` (`SECRET_KEY`).

**Heroku (API)** : `DATABASE_URL` (addon Postgres), `APP_ENV=production`, `SECRET_KEY`, `APP_ENCRYPTION_KEYS`, `BFF_KEYS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS`, `GOOGLE_MAPS_API_KEY`, `ADMIN_HOST`, `PUBLIC_API_HOST`, `HANDYCAB_URL`, `MBTTAXIS_URL`. La phase `release` vérifie cette configuration puis applique les migrations.

---

## Démarrer en local

Prérequis : Node ≥ 20, pnpm 10, conda, PostgreSQL local.

### Sites (Next.js)

```bash
pnpm install
pnpm dev:mbttaxis   # http://localhost:3000
pnpm dev:handycab   # http://localhost:3001
pnpm build
```

### API et espace de gestion

```bash
# 1. Environnement Python 3.14
conda env create -f apps/api/environment.yml      # une seule fois
conda activate mbt-api
cd apps/api

# 2. Bases PostgreSQL
createdb mbt_dev && createdb mbt_test

# 3. Configuration (puis renseigner les clés générées par `python -m app.cli gen-key`)
cp .env.example .env

# 4. Migrations et premier administrateur
python -m app.cli release
python -m app.cli admin create --email vous@exemple.com --name "Votre Nom"   # affiche le lien d'activation

# 5. Dépendances Node (CSS de l'admin + lanceur), depuis la racine du dépôt
cd ../.. && pnpm install
```

**Lancer l'API, l'espace de gestion et le worker, en une commande** (depuis la racine) :

```bash
pnpm dev:api
```

Elle démarre en parallèle (Ctrl+C arrête tout) : la compilation du CSS en continu, le serveur (`uvicorn --reload`, port 8000) et le worker d'e-mails. Les scripts passent par l'environnement conda `mbt-api` : il n'y a pas besoin de l'activer.

| Commande (racine) | Rôle |
|-------------------|------|
| `pnpm dev:api` | CSS + serveur + worker ensemble |
| `pnpm api:server` | serveur seul (API publique + espace de gestion) |
| `pnpm api:worker` | worker d'e-mails seul |
| `pnpm api:migrate` | vérifie la configuration et applique les migrations |
| `pnpm api:test` | tests (base `mbt_test`) |
| `pnpm --filter api build` | compile le CSS de l'admin une fois (à committer) |
| `pnpm --filter api admin:create -- --email … --name …` | crée un administrateur, affiche son lien d'activation |

`pnpm dev` (turbo) lance aussi tous les sites en même temps que l'API.

- Espace de gestion : <http://gestion.localhost:8000> (les sous-domaines `*.localhost` pointent vers 127.0.0.1 sans configuration).
- API publique : <http://api.localhost:8000/docs> (documentation désactivée en production).
- Sans `RESEND_API_KEY`, les e-mails ne partent pas : le worker les écrit dans ses logs (développement seulement).
- Sans `GOOGLE_MAPS_API_KEY`, l'adresse saisie est conservée telle quelle (« adresse non vérifiée » sur la fiche).

### Tests

```bash
pnpm api:test                          # base mbt_test, recréée à chaque session
pnpm --filter api lint                 # ruff check
```

### Commandes utiles (`python -m app.cli …`)

| Commande | Rôle |
|----------|------|
| `release` | vérifie la configuration et applique les migrations (phase `release` Heroku) |
| `admin create --email … --name …` | crée un administrateur et affiche son lien d'activation |
| `admin unlock --email …` | lève un verrouillage de compte |
| `gen-key [--kind secret]` | génère une clé |
| `export-openapi [--out fichier]` | écrit le contrat OpenAPI de l'API publique |

---

## Déploiement Heroku (API)

`apps/api/Procfile` définit les processus `release`, `web` et `worker`. Les dépendances sont figées dans `apps/api/requirements.txt` (avec empreintes), régénéré par :

```bash
pip-compile pyproject.toml --generate-hashes --strip-extras -o requirements.txt
```

Le CSS de l'espace de gestion (`app/admin/static/admin.css`) est **versionné** : relancer `pnpm --filter api build` après toute modification de gabarit ou de style, et committer le résultat.

---

## Ajouter une app

1. Créer sous `apps/<nom>`.
2. Node : prise en charge automatique via `pnpm-workspace.yaml` dès qu'un `package.json` existe.
3. Python (`api`) : environnement conda ; `package.json` uniquement pour compiler le CSS.

## Sites marketing (état actuel)

- Contenu en dur : `apps/*/content/`.
- Les formulaires envoient encore des données fictives tant que `API_URL` / `API_BFF_KEY` ne sont pas branchés (voir `POST /v1/demandes`).
- Design / copy : `infos/` (local).
