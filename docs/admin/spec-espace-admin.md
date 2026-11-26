# Espace de gestion HandyCab / MBT Taxis

## Spécification fonctionnelle et technique : administration, demandes et connexions (webhooks)

| | |
|---|---|
| **Projet** | Refonte MBT Taxis et HandyCab, formule **Évolution** |
| **Objet** | Espace d'administration, cycle de vie des demandes, connexions sortantes (webhooks) |
| **Version** | 1.1 du 26/11/2026, brouillon à valider |
| **Référence contractuelle** | « Livrables MBT Taxis et HandyCab », version du 28/10/2026 |
| **Dépôt** | Monorepo `mbt` (pnpm + Turborepo). L'API, l'espace de gestion et le worker vivent dans `apps/api` |
| **Stack cible** | Python 3.14, FastAPI, PostgreSQL, Heroku (région `eu`) ; sites en Next.js 16 ; application mobile en Expo |
| **Document lié** | `infos/admin/guide-integration-webhooks.md`, à remettre aux destinataires des demandes |
| **Historique** | 1.0 : première version. 1.1 : alignement sur le monorepo (emplacement du code, interface d'administration, déploiement), API publique `/v1` pour les sites et l'application mobile (§18), écarts relevés dans le code existant (§19). |

> **Comment lire ce document.** Chaque fonction porte une étiquette de périmètre (section 0). Les sections 8 et 9, consacrées aux webhooks, sont les plus détaillées : c'est la partie du système la plus exposée. Le format exact des messages envoyés aux destinataires est défini dans le guide d'intégration, qui fait référence sur ce point.

### Sommaire

0. Conventions
1. Contexte et périmètre
2. Acteurs et rôles
3. Architecture et déploiement (Heroku)
4. Modèle de données
5. Cycle de vie d'une demande et clôture automatique
6. Espace de gestion : écrans et fonctions
7. API d'administration
8. Webhooks sortants : fonctionnement
9. Sécurité des webhooks
10. Sécurité de l'espace de gestion
11. Sécurité de la plateforme et RGPD
12. Worker et tâches planifiées
13. Notifications e-mail
14. Paramètres
15. Tests et critères d'acceptation
16. Plan de réalisation
17. Décisions à prendre avec le client
18. API publique `/v1` : sites et application mobile
19. Alignement avec le code existant
- Annexe A : variables d'environnement
- Annexe B : catalogue des actions d'audit
- Annexe C : matrice de traçabilité
- Annexe D : glossaire

---

## 0. Conventions

**Étiquettes de périmètre**

| Étiquette | Signification |
|---|---|
| **[Contrat]** | Exigé par la formule Évolution. Doit être livré. |
| **[Ajout]** | Ajouté volontairement par le prestataire, en dehors de l'offre (compte client). Offert, à formaliser par écrit. |
| **[Reco]** | Recommandé : coût faible, protège le projet ou les données. Inclus par défaut dans cette spécification. |
| **[Option]** | Évolution possible, non incluse, à chiffrer séparément. |

**Niveaux d'exigence.** DOIT / NE DOIT PAS : obligatoire. DEVRAIT : recommandé, tout écart doit être justifié. PEUT : facultatif.

**Langue et nommage.** Les codes techniques (base de données, API, événements) sont en anglais, les libellés d'interface en français.

**Dates.** Elles sont stockées en UTC (`timestamptz`) et affichées à l'heure de Bruxelles (`Europe/Brussels`), au format `jj/mm/aaaa HH:mm`.

---

## 1. Contexte et périmètre

### 1.1 Objectif

L'espace de gestion permet à l'équipe MBT de **recevoir, rechercher, suivre et transmettre** les demandes de course issues des deux sites et de l'application HandyCab.

Il permet aussi de configurer, sans toucher au code, l'envoi automatique de ces demandes vers d'autres logiciels (par exemple Taxiger).

### 1.2 Exigences contractuelles

| Réf. | Exigence (formule Évolution) | Source | Traité en |
|---|---|---|---|
| R1 | Un espace privé regroupe les demandes des deux sites et de l'application | p. 4 | §6.3 |
| R2 | Les demandes peuvent être recherchées | p. 4 | §4.3, §6.3 |
| R3 | L'origine de chaque demande est connue | p. 4 | §4.2, §6.3 |
| R4 | Le traitement de chaque demande est suivi | p. 4 | §5, §6.4 |
| R5 | Les accès sont protégés | p. 4 | §10 |
| R6 | Une durée de conservation est définie avec le client | p. 4 | §4.4, §12 |
| R7 | Une personne autorisée peut ajouter, tester ou désactiver une destination d'envoi | p. 4 | §6.6, §8 |
| R8 | Un historique indique si chaque transmission a réussi | p. 4 | §6.7, §8 |
| R9 | Les échecs font l'objet de nouvelles tentatives et peuvent être relancés manuellement | p. 4 | §8.6, §8.8 |
| R10 | Le format des envois est documenté | p. 4 | Guide d'intégration |
| R11 | Le paramétrage d'une destination ne demande aucune modification du code | p. 4 | §6.6 |
| R12 | 3 cycles de révision pour l'étape « espace de gestion et connexions » | p. 6 | §15.3 |
| R13 | Livraison du code source et des accès ; correction des défauts pendant 90 jours | p. 6 | §16 |

### 1.3 Ajout volontaire : le compte client

Le contrat exclut les comptes passagers (p. 4). Le prestataire ajoute malgré tout un compte client, qui permet de faire des demandes depuis le web et sert de base à l'application mobile. Il a trois conséquences sur l'espace de gestion :

- un écran **Passagers** (§6.5) ;
- l'**annulation par le passager**, d'où l'événement `demande.cancelled` (§8.3) ;
- des **e-mails de changement de statut** envoyés au passager (§13).

> **À formaliser par écrit avant le démarrage** (avenant ou e-mail validé). Proposition de formulation : « Le compte client est fourni à titre gracieux, en dehors de la formule Évolution. Il n'entre pas dans les cycles de révision et ses évolutions seront chiffrées séparément. Une demande faite depuis un compte reste une demande à confirmer par MBT. »

### 1.4 Hors périmètre

- paiement en ligne ;
- suivi du véhicule ;
- notifications sur le téléphone (push) ;
- attribution automatique des courses aux chauffeurs ;
- connecteur propre à un fournisseur (par exemple un appel à l'API de Taxiger) ;
- transformation particulière des données pour un destinataire ;
- retour automatique d'informations depuis un destinataire (par exemple un statut de course renvoyé par Taxiger) ;
- traduction de l'interface d'administration ;
- surveillance et maintenance, qui font l'objet d'une offre séparée.

### 1.5 Principes directeurs

1. **La confirmation reste humaine.** Une demande n'est jamais « réservée » automatiquement : seul MBT confirme.
2. **Rien ne se perd.** Chaque transmission est enregistrée dans la même transaction que la demande (pattern *outbox*).
3. **Sécurisé par défaut.**
   - La double authentification est obligatoire.
   - Une nouvelle connexion reste inactive tant qu'elle n'a pas été testée avec succès.
   - Les données de santé ne sont jamais transmises sans action explicite.
4. **Minimisation.** On collecte, transmet et conserve le strict nécessaire.
5. **Configurable sans code, mais pas sans contrôle.** Toute action sensible exige une réauthentification, est tracée et est notifiée à tous les admins.

---

## 2. Acteurs et rôles

| Acteur | Description | Accès |
|---|---|---|
| **Admin** | Membre de l'équipe MBT ou prestataire. Rôle unique. Tous les admins sont des « personnes autorisées » au sens du contrat (R7). | Espace de gestion, avec double authentification |
| **Client** [Ajout] | Passager disposant d'un compte. Fait des demandes, suit leur statut, peut les annuler. | Site web et application (hors du présent document) |
| **Invité** | Passager sans compte. Fait une demande via le formulaire. | Formulaire public |
| **Site (BFF)** | Partie serveur des sites Next.js (server actions). Appelle `/v1` au nom du visiteur, avec la clé propre au site (§18.4). | `/v1` |
| **Système** | Le worker : envois, clôture automatique, purge, alertes. | Interne |
| **Destinataire** | Logiciel tiers qui reçoit les demandes (par exemple Taxiger). Il ne se connecte jamais à l'espace de gestion. | Reçoit des webhooks |

Règles :

- Les comptes sont **nominatifs** uniquement : pas de compte partagé du type « accueil@ ».
- Le prestataire dispose d'un compte admin nominatif. Il est désactivé en fin de mission, ou conservé dans le cadre d'un contrat de maintenance.
- Le rôle admin unique est un choix assumé pour la v1. Un découpage « opérateur / responsable » est une [Option].
- Il DOIT toujours exister au moins un admin actif : le système refuse de désactiver le dernier.

---

## 3. Architecture et déploiement

### 3.1 Vue d'ensemble

```
  Navigateur ──► www.mbttaxis.be ─┐  Next.js (apps/mbttaxis, apps/handycab)
  Navigateur ──► www.handycab.be ─┤  server actions = BFF, clé propre à chaque site
                                  │  appel de serveur à serveur
                                  ▼                                        ┌───────────────────────────┐
  App iOS/Android ──── HTTPS ───►  dyno web (FastAPI, apps/api)  ────────► │ Heroku Postgres           │
  (Expo, apps/mobile)              ├─ api.handycab.be/v1                   │  demandes, comptes        │
                                   │   └─► Google Places (adresses)        │  outbox webhooks/e-mails  │
  Équipe MBT ───── HTTPS ────────► └─ gestion.mbttaxis.be                  │  journal d'audit          │
                                       (Jinja2 + HTMX)                     └─────────────▲─────────────┘
                                   dyno worker (même code) ──────────────────────────────┘
                                   ├─ webhooks ──► [proxy IP fixe, option] ──► Taxiger…
                                   ├─ e-mails  ──► Resend
                                   └─ clôture automatique, purge, alertes
```

### 3.2 Domaines

| Domaine (proposition) | Rôle |
|---|---|
| `www.mbttaxis.be`, `www.handycab.be` | Sites publics |
| `api.handycab.be` | API publique : formulaire, compte client, application |
| `gestion.mbttaxis.be` | Espace de gestion : non indexé, cookies dédiés |

L'API publique et l'espace de gestion tournent dans la même application Heroku. Le routage par hôte DOIT :

- refuser les routes d'administration sur tout autre hôte que `gestion.mbttaxis.be` ;
- refuser les routes publiques sur l'hôte d'administration.

Il s'implémente avec la route `Host` de Starlette, sans middleware maison (§18.1). Deux autres règles :

- **Pas de CORS sur `/v1`.** Aucun navigateur n'appelle l'API directement : les sites passent par leurs server actions (§18.4), et l'application mobile n'est pas soumise au CORS.
- **En local**, `api.localhost` et `gestion.localhost` résolvent vers `127.0.0.1` sans configuration. Le routage par hôte de la production se reproduit donc à l'identique.

### 3.3 Processus Heroku

Fichier `apps/api/Procfile` :

```procfile
release: python -m app.cli release
web:     uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 2 --proxy-headers --forwarded-allow-ips="*"
worker:  python -m app.worker
```

- **`release`**
  - applique les migrations Alembic (`upgrade head`) ;
  - vérifie la configuration (clés de chiffrement présentes et valides, région) ;
  - fait échouer le déploiement en cas de problème.
- **`web`**
  - sert l'API publique et l'espace de gestion ;
  - `--proxy-headers` sert uniquement à connaître le schéma (`https`) ;
  - **attention, l'adresse IP du client ne DOIT PAS être lue via `request.client.host`.** Avec `--forwarded-allow-ips="*"`, uvicorn retient la première valeur de `X-Forwarded-For`, qui peut être falsifiée. Utiliser un utilitaire qui lit la **dernière** valeur de l'en-tête, celle ajoutée par le routeur Heroku (§10.8).
- **`worker`**
  - envoie les webhooks et les e-mails ;
  - exécute les tâches planifiées (§12).
  - On peut lancer deux workers sans risque : verrous `SKIP LOCKED`, baux (leases) et verrous consultatifs.
- **Dimensionnement de départ.** 1 dyno `web` et 1 dyno `worker`, de type Standard-1X ou plus. Pas de dynos *Eco*, qui se mettent en veille.

### 3.4 Organisation du code (`apps/api/`)

```
app/
  main.py                 # routage par hôte (Host), sous-applications /v1 et admin (§18.1)
  config.py               # pydantic-settings, lecture des variables d'environnement
  db.py                   # moteur SQLAlchemy async, sessions, SSL
  cli.py                  # release, création du premier admin, bris de glace, rechiffrement
  security/
    passwords.py          # Argon2id
    totp.py               # TOTP, codes de secours
    sessions.py           # sessions admin, réauthentification (step-up)
    csrf.py
    crypto.py             # AES-256-GCM, trousseau de clés versionné
    ratelimit.py
    client_ip.py          # dernière valeur de X-Forwarded-For
  domain/
    demandes/             # modèles, machine à états, services, schémas
    passengers/
    webhooks/             # connexions, envois, signature, SSRF, expéditeur
    emails/
    audit/
    settings/
  api/v1/                 # sous-application publique, seule à exporter un schéma OpenAPI (§18)
    demandes.py           # POST /v1/demandes (invité ou client connecté)
    messages.py           # POST /v1/messages : contact, devis, adaptation, location-vente (§19)
    auth.py               # inscription, jetons, mot de passe
    me.py                 # profil, adresses, demandes du client
    config.py             # GET /v1/config
  admin/                  # sous-application d'administration, sans schéma OpenAPI
    routes/               # vues HTML et routes /api/v1 de l'espace de gestion (§7)
    templates/            # gabarits Jinja2 : pages complètes et fragments HTMX
    assets/admin.css      # source Tailwind, importe la charte de packages/brand (§3.9)
    static/               # admin.css compilé (versionné), htmx.min.js, polices woff2
  worker/
    __main__.py           # boucle principale, planificateur, arrêt propre
    jobs/                 # deliveries, emails, leases, auto_close, retention, alerts, heartbeat
migrations/               # Alembic
tests/
pyproject.toml, uv.lock   # dépendances Python (uv)
.python-version           # 3.14
Procfile
package.json              # uniquement pour compiler le CSS de l'admin (§3.9)
```

### 3.5 Choix techniques

| Besoin | Choix | Raison |
|---|---|---|
| Framework | FastAPI + Pydantic v2 | Validation stricte, OpenAPI généré (utile pour l'application mobile) |
| Accès aux données | SQLAlchemy 2 (async) + asyncpg | Maturité, `FOR UPDATE SKIP LOCKED` disponible |
| Migrations | Alembic | Exécutées pendant la phase `release` |
| Interface d'administration | Jinja2 + HTMX, rendu serveur, même origine ; Tailwind v4 avec la charte partagée (§3.9) | Pas de CORS, CSRF simple, aucun jeton manipulé en JavaScript, un seul déploiement, livraison rapide |
| Mots de passe | argon2-cffi (Argon2id) | Recommandation OWASP |
| Double authentification | pyotp (TOTP, RFC 6238) + segno (QR code généré localement) | Standard, compatible avec toutes les applications d'authentification |
| Chiffrement applicatif | cryptography (AES-256-GCM) | Secrets des webhooks, secrets TOTP, en-têtes personnalisés |
| Client HTTP sortant | httpx (async) | Délais fins, SNI explicite (épinglage d'IP, §9.4) |
| Signature des webhooks | Standard Webhooks (HMAC-SHA256) | Standard ouvert, bibliothèques prêtes pour les destinataires (§8.2) |
| Journalisation | structlog (JSON) | Logs exploitables, filtrage des données personnelles |
| Erreurs | sentry-sdk | Alertes, `send_default_pii=False` |
| Tests | pytest, pytest-asyncio, PostgreSQL réel | Tests d'intégration fidèles à la production |
| Dépendances | uv + `uv.lock` | Builds reproductibles |
| E-mails | Resend, appelé uniquement par l'API | Choix déjà fait dans le projet ; DKIM fourni, envoi par API (§13) |
| Adresses | Google Places : autocomplétion dans les sites et l'application, validation par l'API (clé serveur) | Adresses structurées et géolocalisées ; service complémentaire prévu au contrat (p. 5) |
| Client TypeScript | `openapi-typescript` + `openapi-fetch`, générés depuis l'OpenAPI de `/v1` (§18.5) | Types partagés par les sites et l'application, aucun client écrit à la main |
| Application mobile | Expo (React Native) | Même langage et mêmes types que les sites |

> **Décision prise : pas d'application Next.js pour l'administration**, même si les sites sont en Next.js. L'espace de gestion est rendu par FastAPI (Jinja2 + HTMX) :
> - un seul déploiement ;
> - une sécurité plus simple : cookie `HttpOnly`, ni CORS ni proxy ;
> - une charte commune grâce au thème Tailwind partagé (§3.9).
>
> Toute la logique étant dans l'API, un front React pourra être ajouté plus tard sans rien jeter.

### 3.6 Spécificités Heroku à traiter

- **Région.** Créer les applications avec `heroku create <nom> --region eu`. La région ne se change pas après coup.
- **`DATABASE_URL`.**
  - Heroku fournit une URL en `postgres://`, qu'il faut réécrire en `postgresql+asyncpg://`.
  - SSL est requis : `create_async_engine(url, connect_args={"ssl": "require"})`.
- **Connexions à la base.** Chaque plan Heroku Postgres limite le nombre de connexions. Dimensionner les pools en conséquence, par exemple 5 par processus : 2 processus web et 1 worker font 15 connexions.
- **Redémarrages.**
  - Les dynos redémarrent au moins une fois par jour.
  - Heroku envoie `SIGTERM`, puis `SIGKILL` 30 secondes plus tard.
  - Le worker DOIT s'arrêter proprement (§12.3).
- **Routeur.** Une requête doit commencer à répondre en moins de 30 s. Les exports sont donc diffusés en flux (*streaming*).
- **Système de fichiers éphémère.** Aucun fichier n'est stocké sur le dyno.
- **IP de sortie.** Elles ne sont pas fixes par défaut. L'add-on QuotaGuard Static est nécessaire si un destinataire filtre par IP (§9.11).
- **Version de Python.** Elle se déclare dans un fichier `.python-version`.
- **Monorepo.** Heroku construit une application à partir de la racine du dépôt, alors que seul `apps/api` doit être déployé (§3.10).

### 3.7 Environnements

| Environnement | Hébergement | Données | Webhooks |
|---|---|---|---|
| Local | docker compose (PostgreSQL) | Fictives | Récepteur de test local |
| Préproduction | `handycab-staging` (Heroku, `eu`) | **Fictives uniquement** | Points de réception de test des destinataires |
| Production | `handycab-prod` (Heroku, `eu`) | Réelles | Destinataires réels |

- Les déploiements passent par un **Heroku Pipeline** : la préproduction est promue en production, avec le même slug.
- Les données de production ne sont **jamais** copiées en préproduction.

### 3.8 Monorepo : emplacement du code

```
apps/
  api/          FastAPI : API publique /v1, espace de gestion (Jinja2/HTMX), worker
  mbttaxis/     Next.js : site MBT ; ses server actions appellent /v1 (BFF)
  handycab/     Next.js : site HandyCab ; ses server actions appellent /v1 (BFF)
  mobile/       Expo : application passager, client de /v1
packages/
  brand/        charte Tailwind v4 partagée (thème CSS) : sites et espace de gestion
  api-client/   client TypeScript généré depuis l'OpenAPI de /v1 : sites et application
```

- **`apps/admin` est supprimé.** Il ne contient aujourd'hui qu'un `.env.example`. L'espace de gestion est rendu par FastAPI ; un second déploiement Next.js n'apporterait que de la complexité (proxy, cookies, CORS, versions à synchroniser).
- **`apps/api` rejoint le workspace pnpm.** Son `package.json` sert uniquement à compiler le CSS de l'admin (§3.9). Le code Python reste géré par uv. Le README, qui indique « hors workspace pnpm », est à mettre à jour (§19).
- **Turborepo** orchestre :
  - `api#build` : compile le CSS de l'admin ;
  - `api#openapi` : exporte `packages/api-client/openapi.json` ;
  - `api-client#build` : génère les types, et dépend de `api#openapi` ;
  - les sites et l'application dépendent de `api-client`.
- **Contrôles de CI.** La CI régénère `openapi.json` et le CSS de l'admin, puis échoue si le résultat diffère de ce qui est versionné (`git diff --exit-code`). Un oubli de régénération ne passe jamais en production.

### 3.9 Interface d'administration : assets, charte et polices

- **Charte partagée.**
  - Les tokens HandyCab sortent de `apps/handycab/src/app/globals.css` vers `packages/brand/theme.css`, un bloc `@theme` Tailwind v4.
  - Ils comprennent le jaune `#f9cd1a`, le fond sombre `#0b0b0f`, l'accent `#1560bd`, les bordures et surfaces, et les polices Raleway et Poppins.
  - Les deux sites et l'admin importent ce fichier : la charte n'a qu'une seule source.
- **Compilation.**
  - Tailwind v4 (`@tailwindcss/cli`) compile `app/admin/assets/admin.css`, qui importe la charte et analyse les gabarits `app/admin/templates/**/*.html`.
  - Le résultat, minifié, va dans `app/admin/static/admin.css`.
- **Le CSS compilé est versionné.** Le build Heroku ne voit que `apps/api` (§3.10) et ne dispose pas de Node : le CSS doit donc être prêt dans le dépôt. La CI vérifie qu'il est à jour (§3.8).
- **Polices et icônes auto-hébergées.**
  - Fichiers `woff2` de Raleway et Poppins dans `static/`, sans appel à Google Fonts. La CSP reste stricte (`font-src 'self'`) et l'adresse IP des admins n'est pas transmise à Google.
  - Icônes en SVG inline plutôt que Font Awesome 4.
- **JavaScript.**
  - `htmx.min.js` est copié dans `static/`, en version fixée.
  - Pour d'éventuels menus ou modales, utiliser Alpine.js dans sa **build CSP** (`@alpinejs/csp`). La version standard exige `unsafe-eval`.
  - Aucun gestionnaire `onclick=` en ligne.
- **Gabarits.**
  - Une page complète sans en-tête `HX-Request`, un fragment avec.
  - Des macros Jinja pour les composants : badge de statut, tableau, modale de confirmation, saisie du code de réauthentification.
  - Un écouteur global `htmx:responseError` traite deux cas :
    - `403 step_up_required` : il ouvre la saisie du code, puis rejoue la requête ;
    - `412` : il affiche « modifiée par… ».

### 3.10 Déploiement Heroku depuis le monorepo

- **Buildpacks, dans cet ordre :**
  1. un buildpack « monorepo » avec `APP_BASE=apps/api`, qui ne garde que ce dossier ;
  2. `heroku/python`, qui détecte `uv.lock` et `.python-version`.
- **Le buildpack monorepo est un composant tiers** de la chaîne de build. Il DOIT être référencé par une **version fixée** (tag ou commit), jamais par sa branche principale.
- **Déploiement.** Intégration GitHub de Heroku : la préproduction se déploie automatiquement depuis `main`, la production est promue manuellement dans le Pipeline (§3.7).
- **Alternative sans buildpack tiers.** Une action GitHub envoie uniquement `apps/api`, sous forme d'archive, à l'API de build de Heroku.
- **Les sites Next.js** se déploient à part (Vercel). Leurs fonctions serveur traitent le contenu des formulaires : elles DOIVENT tourner dans une **région européenne** (§17, D25).

---

## 4. Modèle de données

### 4.1 Conventions

- **Identifiants.**
  - UUID v7 (`uuid.uuid7()`, Python ≥ 3.14) : ordonnés dans le temps, efficaces pour les index, impossibles à énumérer.
  - Les URL n'exposent que des UUID.
  - La **référence lisible** (`D-2026-000142`) sert à l'affichage et au téléphone.
  - Son préfixe dépend de l'environnement : `D-` en production, `T-` en préproduction. Une demande de test ne peut ainsi jamais être confondue avec une vraie, y compris chez les destinataires.
- **Énumérations.** Type `text` avec une contrainte `CHECK` : les migrations sont plus simples qu'avec les types `ENUM` de PostgreSQL.
- **Horodatage.** `timestamptz`, en UTC.
- **`revision`.** Incrémentée à chaque changement. Elle sert de verrou optimiste (`If-Match`) et elle est transmise aux destinataires.
- **Colonnes `_enc`.** Chiffrées par l'application en AES-256-GCM (§9.3).
- **Adresses** (`jsonb`).
  - `formatted` est toujours présent.
  - `place_id` (Google), les champs structurés (`street`, `number`, `box`, `postal_code`, `city`, `country`) et `lat`/`lng` sont remplis quand l'adresse a été validée par Google Places (§18.7).
- **Extensions PostgreSQL.** `citext`, `pg_trgm`, `unaccent`, toutes disponibles sur Heroku Postgres.

### 4.2 Schéma

**Extensions**

```sql
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
```

**Comptes admin**

```sql
CREATE TABLE admins (
  id                   uuid PRIMARY KEY,
  email                citext NOT NULL UNIQUE,
  full_name            text   NOT NULL,
  status               text   NOT NULL DEFAULT 'invited'
                       CHECK (status IN ('invited','active','disabled')),
  password_hash        text,                  -- Argon2id ; NULL tant que l'invitation n'est pas acceptée
  password_changed_at  timestamptz,
  totp_secret_enc      bytea,                 -- chiffré (§9.3)
  totp_enabled_at      timestamptz,
  totp_last_step       bigint,                -- anti-rejeu TOTP (§10.2)
  failed_logins        int    NOT NULL DEFAULT 0,
  locked_until         timestamptz,
  last_login_at        timestamptz,
  created_by           uuid REFERENCES admins(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE admin_recovery_codes (
  id         uuid PRIMARY KEY,
  admin_id   uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  code_hash  bytea NOT NULL,                  -- SHA-256 (codes à haute entropie)
  used_at    timestamptz
);

CREATE TABLE admin_sessions (
  id             uuid PRIMARY KEY,
  admin_id       uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token_hash     bytea NOT NULL UNIQUE,       -- SHA-256 du jeton ; le jeton lui-même n'est jamais stocké
  mfa_verified   boolean NOT NULL DEFAULT false,
  step_up_until  timestamptz,                 -- réauthentification récente (§10.4)
  csrf_token     text NOT NULL,
  ip             inet,
  user_agent     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,        -- expiration absolue
  revoked_at     timestamptz
);

CREATE TABLE admin_tokens (                   -- invitations et réinitialisations de mot de passe
  id          uuid PRIMARY KEY,
  admin_id    uuid NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  purpose     text NOT NULL CHECK (purpose IN ('invitation','password_reset')),
  token_hash  bytea NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_by  uuid REFERENCES admins(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Passagers** [Ajout]

```sql
CREATE TABLE passengers (
  id                 uuid PRIMARY KEY,
  email              citext NOT NULL UNIQUE,
  email_verified_at  timestamptz,
  password_hash      text NOT NULL,
  first_name         text NOT NULL,
  last_name          text NOT NULL,
  phone              text NOT NULL,            -- format E.164, ex. +32470000000
  language           text NOT NULL DEFAULT 'fr' CHECK (language IN ('fr','nl','en')),
  default_needs      jsonb,                    -- données de santé (art. 9 RGPD)
  health_consent_at  timestamptz,              -- consentement explicite
  status             text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','active','disabled','anonymized')),
  last_login_at      timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  anonymized_at      timestamptz,
  CHECK (default_needs IS NULL OR health_consent_at IS NOT NULL)
);

CREATE TABLE passenger_addresses (
  id            uuid PRIMARY KEY,
  passenger_id  uuid NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  label         text NOT NULL,                 -- « Domicile », « Hôpital »…
  address       jsonb NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

**Demandes** [Contrat]

```sql
CREATE SEQUENCE demande_number_seq;

CREATE TABLE demandes (
  id                     uuid PRIMARY KEY,
  reference              text NOT NULL UNIQUE,       -- ex. D-2026-000142
  revision               int  NOT NULL DEFAULT 1,
  status                 text NOT NULL DEFAULT 'received'
                         CHECK (status IN ('received','confirmed','refused',
                                           'cancelled','completed','not_completed')),
  origin                 text NOT NULL               -- R3 ; déduite de la clé du site ou de l'application (§18.4)
                         CHECK (origin IN ('site_mbt','site_handycab','app_ios','app_android')),
  service                text NOT NULL               -- type de transport ; toujours 'pmr' pour HandyCab
                         CHECK (service IN ('business','daily','vsl','pmr')),
  language               text NOT NULL CHECK (language IN ('fr','nl','en')),
  passenger_id           uuid REFERENCES passengers(id),  -- NULL = demande d'un invité
  -- copie des coordonnées au moment de la demande (le profil peut changer ensuite)
  passenger_first_name   text,
  passenger_last_name    text,
  passenger_phone        text,
  passenger_email        citext,
  pickup_at              timestamptz NOT NULL,
  pickup_address         jsonb NOT NULL,
  pickup_instructions    text,
  dropoff_address        jsonb NOT NULL,
  return_at              timestamptz,                -- aller-retour
  return_pickup_address  jsonb,                      -- NULL = adresse de destination
  passenger_count        smallint NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 8),
  needs                  jsonb,                      -- données de santé
  health_consent_at      timestamptz,
  comment                text,
  refusal_reason         text,
  cancellation_reason    text,
  cancelled_by           text CHECK (cancelled_by IN ('passenger','admin')),
  closed_at              timestamptz,                -- entrée dans un statut final
  closed_by              text CHECK (closed_by IN ('admin','passenger','system')),
  assigned_admin_id      uuid REFERENCES admins(id), -- [Reco] « Je m'en occupe »
  idempotency_key        text,
  request_fingerprint    bytea,                      -- SHA-256 du corps, contrôle d'idempotence
  search_text            text,                       -- maintenu par trigger (§4.3)
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  anonymized_at          timestamptz,
  CHECK (return_at IS NULL OR return_at > pickup_at),
  CHECK (needs IS NULL OR health_consent_at IS NOT NULL)
);

CREATE UNIQUE INDEX demandes_idempotency  ON demandes (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX demandes_status_pickup       ON demandes (status, pickup_at);
CREATE INDEX demandes_created             ON demandes (created_at DESC);
CREATE INDEX demandes_passenger           ON demandes (passenger_id, pickup_at DESC);
CREATE INDEX demandes_search              ON demandes USING gin (search_text gin_trgm_ops);

CREATE TABLE demande_events (                 -- chronologie affichée dans la fiche demande
  id           bigserial PRIMARY KEY,
  demande_id   uuid NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  revision     int  NOT NULL,
  type         text NOT NULL,                 -- created, status_changed, assigned, email_queued, anonymized
  from_status  text,
  to_status    text,
  actor_type   text NOT NULL CHECK (actor_type IN ('admin','passenger','guest','system')),
  actor_id     uuid,
  reason       text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX demande_events_demande ON demande_events (demande_id, id);

CREATE TABLE demande_notes (                  -- notes internes, jamais visibles du passager
  id          uuid PRIMARY KEY,
  demande_id  uuid NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  admin_id    uuid NOT NULL REFERENCES admins(id),
  body        text NOT NULL CHECK (length(body) <= 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
```

**Idempotence de la création.** Le formulaire et l'application envoient un en-tête `Idempotency-Key` (UUID généré côté client) :

- même clé et même empreinte de corps : on renvoie la demande déjà créée ;
- même clé avec un corps différent : `422`.

On évite ainsi les doublons quand le réseau mobile renvoie une requête.

**Connexions et envois** [Contrat]

```sql
CREATE TABLE webhook_endpoints (
  id                      uuid PRIMARY KEY,
  name                    text NOT NULL,
  description             text,
  url                     text NOT NULL,          -- https, normalisée (§9.4)
  host                    text NOT NULL,          -- nom d'hôte normalisé (IDNA, minuscules)
  events                  text[] NOT NULL CHECK (cardinality(events) > 0),
  include_health_data     boolean NOT NULL DEFAULT false,
  status                  text NOT NULL DEFAULT 'inactive'
                          CHECK (status IN ('inactive','active','archived')),
  secret_enc              bytea,                  -- secret courant (NULL une fois archivée)
  secret_prev_enc         bytea,                  -- ancien secret pendant une rotation
  secret_prev_expires_at  timestamptz,
  secret_rotated_at       timestamptz,
  headers_enc             bytea,                  -- en-têtes personnalisés {nom: valeur}, chiffrés
  header_names            text[] NOT NULL DEFAULT '{}',  -- noms seuls, pour l'affichage
  contact_email           citext,                 -- contact technique du destinataire
  last_test_at            timestamptz,
  last_test_ok            boolean,
  activated_at            timestamptz,
  activated_by            uuid REFERENCES admins(id),
  created_by              uuid NOT NULL REFERENCES admins(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  archived_at             timestamptz
);

CREATE TABLE webhook_deliveries (
  id                text PRIMARY KEY,             -- 'msg_' + UUIDv7 ; = en-tête webhook-id, identique à chaque tentative
  endpoint_id       uuid NOT NULL REFERENCES webhook_endpoints(id),
  demande_id        uuid REFERENCES demandes(id) ON DELETE SET NULL,
  event_type        text NOT NULL,
  payload           jsonb,                        -- figé à la création ; effacé par la purge (§4.4)
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','sending','succeeded','failed','abandoned')),
  attempt_count     int  NOT NULL DEFAULT 0,
  next_attempt_at   timestamptz NOT NULL DEFAULT now(),
  lease_until       timestamptz,                  -- bail du worker pendant l'envoi
  last_status_code  int,
  last_error        text,
  external_id       text,                         -- identifiant renvoyé par le destinataire (§8.10)
  created_at        timestamptz NOT NULL DEFAULT now(),
  succeeded_at      timestamptz,
  failed_at         timestamptz,
  abandoned_at      timestamptz,
  abandoned_by      uuid REFERENCES admins(id)
);
CREATE INDEX deliveries_due      ON webhook_deliveries (next_attempt_at) WHERE status = 'pending';
CREATE INDEX deliveries_leased   ON webhook_deliveries (lease_until)     WHERE status = 'sending';
CREATE INDEX deliveries_endpoint ON webhook_deliveries (endpoint_id, created_at DESC);
CREATE INDEX deliveries_demande  ON webhook_deliveries (demande_id);

CREATE TABLE webhook_attempts (
  id                bigserial PRIMARY KEY,
  delivery_id       text NOT NULL REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  attempt_no        int  NOT NULL,
  trigger           text NOT NULL CHECK (trigger IN ('auto','manual','test')),
  triggered_by      uuid REFERENCES admins(id),
  started_at        timestamptz NOT NULL,
  duration_ms       int,
  resolved_ip       inet,
  status_code       int,
  error_type        text,      -- timeout, dns, ssrf_blocked, tls, connect, redirect, http_status, too_large
  response_excerpt  text,      -- 1 Ko max, caractères de contrôle supprimés (§9.8)
  UNIQUE (delivery_id, attempt_no)
);
```

**E-mails, paramètres, audit et tables techniques**

```sql
CREATE TABLE email_outbox (
  id                   uuid PRIMARY KEY,
  to_address           citext NOT NULL,
  template             text NOT NULL,           -- ex. demande_confirmed
  language             text NOT NULL,
  context              jsonb,                   -- variables du gabarit ; effacé 30 j après l'envoi
  demande_id           uuid REFERENCES demandes(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','sending','sent','failed')),
  attempt_count        int NOT NULL DEFAULT 0,
  next_attempt_at      timestamptz NOT NULL DEFAULT now(),
  lease_until          timestamptz,
  provider_message_id  text,
  last_error           text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  sent_at              timestamptz
);
CREATE INDEX email_due ON email_outbox (next_attempt_at) WHERE status = 'pending';

CREATE TABLE settings (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_by  uuid REFERENCES admins(id),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id           bigserial PRIMARY KEY,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  actor_type   text NOT NULL CHECK (actor_type IN ('admin','passenger','system','anonymous')),
  actor_id     uuid,
  action       text NOT NULL,                   -- catalogue en annexe B
  entity_type  text,
  entity_id    text,
  ip           inet,
  user_agent   text,
  details      jsonb NOT NULL DEFAULT '{}',     -- jamais de secret ni de donnée de santé
  prev_hash    bytea,
  hash         bytea NOT NULL                   -- chaînage (§10.9)
);
CREATE INDEX audit_occurred ON audit_log (occurred_at DESC);
CREATE INDEX audit_entity   ON audit_log (entity_type, entity_id);

CREATE TABLE job_runs (
  job               text PRIMARY KEY,
  last_started_at   timestamptz,
  last_finished_at  timestamptz,
  last_status       text,
  last_error        text,
  items_processed   int
);

CREATE TABLE worker_heartbeats (
  worker_id  text PRIMARY KEY,                  -- ex. worker.1 (variable DYNO)
  seen_at    timestamptz NOT NULL
);

CREATE TABLE rate_limits (
  bucket        text NOT NULL,                  -- ex. login:ip:203.0.113.7
  window_start  timestamptz NOT NULL,
  hits          int NOT NULL,
  PRIMARY KEY (bucket, window_start)
);
```

### 4.3 Recherche [Contrat R2]

Une colonne `search_text` normalisée (minuscules, sans accents) est indexée en trigrammes. Elle permet la recherche partielle sur la référence, le nom, l'e-mail, le téléphone et les adresses.

```sql
CREATE FUNCTION demandes_search_text() RETURNS trigger AS $$
BEGIN
  NEW.search_text := lower(unaccent(concat_ws(' ',
    NEW.reference,
    NEW.passenger_first_name, NEW.passenger_last_name, NEW.passenger_email,
    regexp_replace(coalesce(NEW.passenger_phone, ''), '\D', '', 'g'),
    NEW.pickup_address->>'formatted', NEW.dropoff_address->>'formatted')));
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER demandes_search BEFORE INSERT OR UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION demandes_search_text();
```

Côté requête :

- La saisie est découpée en termes, combinés par ET. Chaque terme donne une condition `search_text LIKE '%' || lower(unaccent(:terme)) || '%'`.
- Les caractères `%` et `_` saisis par l'utilisateur DOIVENT être échappés.
- **Téléphone.** Si un terme contient au moins 6 chiffres une fois les espaces, points et tirets retirés, on cherche ces chiffres. S'il commence par `0`, on cherche aussi la forme `32…`. Ainsi « 0470 12 34 56 » retrouve `+32470123456`.

### 4.4 Conservation des données [Contrat R6]

Les durées ci-dessous sont **des valeurs par défaut, à valider avec le client**.

| Donnée | Durée par défaut | Action | Paramètre |
|---|---|---|---|
| Demande clôturée (refusée, annulée, terminée, non effectuée) | 12 mois après `closed_at` | Anonymisation | `retention.demandes_months` |
| Demande jamais clôturée | 12 mois après l'heure de prise en charge | Anonymisation | idem |
| Notes internes | Même durée que la demande | Suppression | — |
| Payload d'un envoi réussi | 30 jours | Effacement du payload (les métadonnées sont conservées) | fixe |
| Payload d'un envoi en échec ou abandonné | 90 jours | Effacement du payload | fixe |
| Contexte des e-mails envoyés | 30 jours | Effacement | fixe |
| Compte passager inactif [Ajout] | 24 mois sans connexion | E-mail d'avertissement, puis anonymisation 30 jours plus tard | `retention.inactive_passenger_months` |
| Sessions admin expirées ou révoquées | 30 jours | Suppression | fixe |
| Journal d'audit | 24 mois | Suppression des entrées anciennes | `retention.audit_months` |
| Logs applicatifs (log drain) | 30 jours maximum | Rotation chez le fournisseur | réglage de l'add-on |

**Anonymisation d'une demande.**

- **Mis à NULL ou remplacés par « [anonymisé] » :** coordonnées, adresses, instructions, besoins, commentaire, motifs, notes internes et payloads associés.
- **Conservés, pour les statistiques :** référence, statut, origine, dates.
- `anonymized_at` est renseigné.

---

## 5. Cycle de vie d'une demande et clôture automatique

### 5.1 Statuts [Contrat R4]

| Code | Libellé | Signification | Final |
|---|---|---|---|
| `received` | Reçue | Nouvelle demande, à traiter par MBT | Non |
| `confirmed` | Confirmée | MBT a accepté la course | Non |
| `refused` | Refusée | MBT ne peut pas assurer la course (motif communiqué au passager) | Oui |
| `cancelled` | Annulée | Annulée par le passager ou par MBT | Oui |
| `completed` | Terminée | Course effectuée, par clôture automatique ou manuelle | Oui, corrigeable 30 jours |
| `not_completed` | Non effectuée | Course confirmée mais non réalisée (passager absent, annulation tardive par téléphone…) | Oui, corrigeable 30 jours |

### 5.2 Diagramme d'états

```mermaid
stateDiagram-v2
    [*] --> received : demande (formulaire ou application)
    received --> confirmed : admin
    received --> refused : admin, motif obligatoire
    received --> cancelled : passager ou admin
    confirmed --> cancelled : passager (avant le délai) ou admin
    confirmed --> completed : système (clôture auto) ou admin
    confirmed --> not_completed : admin
    completed --> not_completed : admin, correction sous 30 jours
    not_completed --> completed : admin, correction sous 30 jours
    refused --> [*]
    cancelled --> [*]
```

### 5.3 Transitions autorisées

| # | Transition | Acteur | Conditions | Effets |
|---|---|---|---|---|
| T1 | création → `received` | Invité, client | Formulaire valide, anti-spam réussi (§18.7), clé d'idempotence | E-mail « nouvelle demande » à MBT et accusé de réception au passager [Contrat] ; événement `demande.created` |
| T2 | `received` → `confirmed` | Admin | Aucune ; avertissement si l'heure de prise en charge est passée | E-mail « confirmée » au passager ; `demande.confirmed` |
| T3 | `received` → `refused` | Admin | Motif obligatoire, visible par le passager | E-mail « refusée » avec le motif ; `demande.refused` |
| T4 | `received` → `cancelled` | Client propriétaire | Avant l'heure de prise en charge | E-mails au passager et à MBT ; `demande.cancelled` |
| T5 | `received` → `cancelled` | Admin | Motif obligatoire | E-mail au passager ; `demande.cancelled` |
| T6 | `confirmed` → `cancelled` | Client propriétaire | Au plus tard à `pickup_at` moins le délai d'annulation (24 h par défaut) | E-mails au passager et à MBT ; `demande.cancelled` |
| T7 | `confirmed` → `cancelled` | Admin | Motif obligatoire | E-mail au passager ; `demande.cancelled` |
| T8 | `confirmed` → `completed` | Système | Clôture automatique (§5.5) | Aucun e-mail, aucun événement sortant |
| T9 | `confirmed` → `completed` | Admin | Heure de prise en charge passée | Aucun |
| T10 | `confirmed` → `not_completed` | Admin | Heure de prise en charge passée ; motif choisi dans une liste | Aucun |
| T11 | `completed` ↔ `not_completed` | Admin | Dans les 30 jours suivant la clôture ; motif obligatoire | Aucun, mais journalisé |

- Toute autre transition DOIT être refusée (`409`, code `invalid_transition`).
- `refused` et `cancelled` sont définitifs. Pour « rouvrir » une demande, on en crée une nouvelle.
- **Invités.** Ils n'ont pas de compte, donc ne peuvent pas annuler en ligne. L'accusé de réception rappelle le numéro de téléphone de MBT. Un lien d'annulation signé dans l'e-mail est une [Option].
- **Contenu figé en v1.** Les adresses, horaires et besoins d'une demande ne sont pas modifiables après coup. Pour un changement : annulation, puis nouvelle demande. Ce choix garantit que les destinataires ne reçoivent jamais d'informations contradictoires.

### 5.4 Règles d'implémentation

Toutes les transitions passent par **une seule fonction**. Elle vérifie la transition, applique le changement, puis enregistre l'événement, l'audit, les e-mails et les webhooks **dans la même transaction**.

```python
# app/domain/demandes/state_machine.py
TRANSITIONS: dict[tuple[str, str], set[str]] = {
    ("received", "confirmed"):      {"admin"},
    ("received", "refused"):        {"admin"},
    ("received", "cancelled"):      {"admin", "passenger"},
    ("confirmed", "cancelled"):     {"admin", "passenger"},
    ("confirmed", "completed"):     {"admin", "system"},
    ("confirmed", "not_completed"): {"admin"},
    ("completed", "not_completed"): {"admin"},
    ("not_completed", "completed"): {"admin"},
}
FINAL = {"refused", "cancelled", "completed", "not_completed"}
OUTBOUND_EVENT = {
    "confirmed": "demande.confirmed",
    "refused":   "demande.refused",
    "cancelled": "demande.cancelled",
}

async def transition(db, demande_id, *, to: str, actor: Actor,
                     expected_revision: int, reason: str | None = None) -> Demande:
    async with db.begin():
        d = await db.get(Demande, demande_id, with_for_update=True)
        if d.revision != expected_revision:
            raise PreconditionFailed("revision_mismatch")     # 412 : modifiée entre-temps
        if actor.type not in TRANSITIONS.get((d.status, to), set()):
            raise Conflict("invalid_transition")              # 409
        check_business_rules(d, to, actor, reason)            # délais, motif, fenêtre de 30 jours
        previous, d.status = d.status, to
        d.revision += 1
        d.updated_at = utcnow()
        if to in FINAL and previous not in FINAL:
            d.closed_at, d.closed_by = utcnow(), actor.type
        if to == "refused":
            d.refusal_reason = reason
        if to == "cancelled":
            d.cancellation_reason, d.cancelled_by = reason, actor.type
        db.add(DemandeEvent(demande_id=d.id, revision=d.revision, type="status_changed",
                            from_status=previous, to_status=to,
                            actor_type=actor.type, actor_id=actor.id, reason=reason))
        await audit(db, actor, "demande.status_changed", d, {"from": previous, "to": to})
        await enqueue_status_emails(db, d, previous, actor)   # outbox e-mails (§13)
        if event := OUTBOUND_EVENT.get(to):
            await enqueue_webhook_event(db, d, event)         # outbox webhooks (§8.4)
        return d
```

**Accès concurrents.**

- La fiche demande renvoie un en-tête `ETag: "<revision>"`, et toute action envoie `If-Match`.
- Si un autre admin, ou la clôture automatique, a modifié la demande entre-temps, l'API répond `412`. L'interface affiche alors : « Cette demande vient d'être modifiée par Sophie. Rechargez pour voir la dernière version. »

### 5.5 Clôture automatique [Reco, dans le périmètre du contrat]

Il s'agit d'une **logique interne**, et non d'une connexion à un logiciel tiers. Elle reste donc dans le périmètre de la formule Évolution : elle sert à « suivre le traitement » (R4) sans dépendre d'un retour de Taxiger, que le contrat exclut.

**Règle.** Une demande **confirmée** passe automatiquement en **terminée** quand son heure de référence est dépassée d'un délai paramétrable.

| Élément | Valeur |
|---|---|
| Demandes concernées | Statut `confirmed` uniquement |
| Heure de référence | `return_at` pour un aller-retour, sinon `pickup_at` |
| Délai | `auto_close.delay_hours`, **12 h** par défaut, entre 1 et 72 h |
| Activation | `auto_close.enabled`, **activée** par défaut |
| Fréquence | Toutes les heures, et au démarrage du worker (rattrapage) |
| Exécutant | Worker, sous verrou consultatif : une seule exécution à la fois, même avec deux workers |
| Effets | Statut `completed`, `closed_by = 'system'`, révision +1, événement « Clôturée automatiquement » dans la chronologie, une ligne d'audit agrégée (`demande.auto_closed`, avec le nombre de demandes et leurs références) |
| Non-effets | **Aucun e-mail, aucun webhook** |
| Correction | Un admin peut passer la demande en « non effectuée » (T11) pendant 30 jours, avec un motif |

**Requête exécutée.** Le traitement se fait par lots de 500 et boucle tant qu'il reste des demandes à clôturer.

```sql
WITH due AS (
  SELECT id
  FROM demandes
  WHERE status = 'confirmed'
    AND COALESCE(return_at, pickup_at) + make_interval(hours => :delay_hours) <= now()
  ORDER BY pickup_at
  LIMIT 500
  FOR UPDATE SKIP LOCKED
)
UPDATE demandes AS d
SET status     = 'completed',
    revision   = d.revision + 1,
    closed_at  = now(),
    closed_by  = 'system',
    updated_at = now()
FROM due
WHERE d.id = due.id
RETURNING d.id, d.revision;
-- dans la même transaction : une ligne demande_events par demande retournée
-- (type 'status_changed', confirmed → completed, actor_type 'system', reason 'auto_close')
```

**Cas particuliers**

- **Demandes jamais traitées.** Une demande `received` dont l'heure est passée n'est **jamais** clôturée automatiquement. Elle apparaît dans le bloc « À régulariser » du tableau de bord (§6.2) et dans le récapitulatif quotidien envoyé aux admins (§13). Une demande oubliée ne doit pas disparaître en silence.
- **Concurrence avec un admin.** La mise à jour est conditionnelle (`WHERE status = 'confirmed'`) et utilise `SKIP LOCKED`. Si un admin agit au même moment, l'une des deux opérations réussit et l'autre reçoit un `412` (admin) ou ignore la ligne (worker).
- **Changement d'heure.** Tout est calculé en UTC, l'heure d'été ne pose donc pas de problème.
- **Worker arrêté plusieurs heures.** Le rattrapage au démarrage traite toutes les demandes en retard, par lots.
- **Modification du délai.** Le nouveau délai s'applique au passage suivant. Les demandes déjà clôturées ne changent pas.
- **Désactivation.** Plus aucune clôture automatique. Les demandes confirmées passées apparaissent alors dans « À régulariser ».
- **Conservation.** Le délai de conservation court à partir de `closed_at`.

**Interface**

- Un badge « Auto » à côté du statut, dans la liste et dans la fiche.
- Un filtre « Clôturées automatiquement ».
- Sur la fiche d'une demande clôturée automatiquement, un bouton « Marquer non effectuée », disponible pendant 30 jours.

**Tests à prévoir**

- Une demande confirmée dont la prise en charge date de 13 h, avec un délai de 12 h, passe en `completed`.
- La même demande avec une prise en charge à 11 h reste `confirmed`.
- Pour un aller-retour, c'est l'heure du retour qui compte.
- Les demandes `received`, `cancelled` et `refused` ne sont jamais touchées.
- Avec 1 200 demandes dues, 3 lots sont traités et chaque demande a un événement.
- Deux workers en parallèle ne produisent ni double clôture ni double événement.
- Un admin qui agit en même temps que la clôture reçoit un `412`.
- Avec `auto_close.enabled = false`, aucune clôture n'a lieu.

---

## 6. Espace de gestion : écrans et fonctions

### 6.0 Principes d'interface

- Pensé d'abord pour l'ordinateur, utilisable sur tablette, en français.
- Accessibilité WCAG 2.1 AA : contrastes, navigation au clavier, libellés explicites.
- Heure de Bruxelles partout. Les numéros de téléphone sont cliquables (`tel:`).
- Seules les actions **possibles** sont affichées : on ne montre jamais un bouton qui mènerait à une erreur.
- Les actions irréversibles demandent une confirmation qui rappelle l'objet concerné, par exemple « Refuser la demande D-2026-000142 de Marie Dupont, le 28/11 à 08:30 ? ».
- Messages d'erreur clairs, en français, qui disent quoi faire.
- Navigation : Tableau de bord, Demandes, Passagers, Connexions, Journal des envois, Administrateurs, Paramètres, Journal d'audit, Mon compte.

### 6.1 Connexion [Contrat R5]

| Écran | Fonctionnement |
|---|---|
| Connexion | E-mail et mot de passe, puis code de double authentification (ou code de secours), puis tableau de bord. Messages génériques (« Identifiants incorrects »). |
| Première connexion | Lien d'invitation valable 72 h, puis choix du mot de passe, puis enrôlement de la double authentification : QR code et saisie d'un code pour valider. Affichage des **10 codes de secours**, avec la case « J'ai conservé mes codes » obligatoire. |
| Mot de passe oublié | E-mail avec un lien valable 1 h, puis nouveau mot de passe. **Le code de double authentification reste exigé.** Toutes les sessions sont révoquées et un e-mail de confirmation est envoyé. |
| Verrouillage | Après 5 échecs, le compte est verrouillé 15 min (délai progressif). L'admin concerné reçoit un e-mail. |

### 6.2 Tableau de bord [Contrat R1, R4 + Reco]

| Bloc | Contenu |
|---|---|
| **Nouvelles demandes** | Demandes `received`, triées par heure de prise en charge, avec leur ancienneté (« reçue il y a 12 min »). Mise en évidence au-delà de `requests.stale_alert_minutes` (30 min par défaut). |
| **Aujourd'hui / Demain** | Demandes confirmées du jour et du lendemain. |
| **À régulariser** | Demandes `received` dont l'heure est passée. Si la clôture automatique est désactivée, s'y ajoutent les demandes `confirmed` passées. |
| **Transmissions** | Nombre d'envois en échec. Connexions actives sans aucun succès depuis 24 h. |
| **État du système** | Dernier signe de vie du worker (alerte au-delà de 2 min) et dernière clôture automatique. |

- Rafraîchissement automatique toutes les 30 s (requêtes HTMX).
- Compteur dans le titre de l'onglet : « (3) Gestion HandyCab ».
- [Option] Notification du navigateur et signal sonore à chaque nouvelle demande.

### 6.3 Liste des demandes [Contrat R1, R2, R3]

- **Colonnes**
  - Réf.
  - Prise en charge (date et heure)
  - Passager
  - Trajet (départ → destination, abrégé)
  - Besoins (icônes)
  - Origine
  - Statut, avec le badge « Auto » si clôture automatique
  - Reçue (ancienneté)
  - Transmission : réussie, en cours ou en échec
  - Pris en charge par [Reco]
- **Recherche.** Un champ unique, qui couvre nom, téléphone sous toute forme, e-mail, référence et adresse. Insensible à la casse et aux accents (§4.3).
- **Filtres**
  - statut (choix multiple) ;
  - origine : site MBT, site HandyCab, iOS, Android ;
  - période de prise en charge ou de réception ;
  - avec ou sans compte ;
  - besoin de fauteuil ;
  - transmission en échec ;
  - clôturée automatiquement.
- **Raccourcis.** « À traiter », « Aujourd'hui », « Demain », « À régulariser », « Transmissions en échec ».
- **Tri.** Par prise en charge (par défaut, les plus proches d'abord) ou par réception.
- **Pagination et URL.** 50 lignes par page. Les filtres sont repris dans l'URL : un collègue peut ouvrir la même vue.
- **Export CSV** [Reco]
  - Réauthentification obligatoire, action journalisée, 10 000 lignes maximum.
  - Colonnes minimales.
  - Les besoins de santé ne sont exportés que si on coche explicitement l'option.
  - Protection contre l'injection de formules (§10.10).

### 6.4 Fiche demande [Contrat R4]

- **En-tête**
  - Référence, statut, origine, date de réception.
  - Boutons d'action : uniquement les transitions autorisées pour ce statut.
- **Passager**
  - Nom, téléphone cliquable, e-mail, langue.
  - Lien vers le compte, s'il en existe un.
- **Trajet**
  - Date et heure de prise en charge, adresse de départ, instructions, destination.
  - Retour si aller-retour, nombre de passagers.
  - Bouton « Copier l'adresse ».
  - [Option] Carte du trajet, prévue dans le README du projet. Choix recommandé : l'API **Maps Static** (une simple image) plutôt que l'API JavaScript.
    - L'image est construite côté serveur à partir des coordonnées, avec une URL signée par le secret de signature Google.
    - Seul `img-src https://maps.googleapis.com` est ajouté à la CSP (§10.7). L'API JavaScript imposerait d'ouvrir la CSP à de nombreux domaines Google et aux styles en ligne.
    - Les coordonnées sont transmises à Google : décision du client (§17, D24).
- **Besoins.** Icônes et texte : type d'aide à la mobilité, reste dans son fauteuil, accompagnants, aide de porte à porte, remarques.
- **Commentaire du passager.**
- **Actions**
  - **Confirmer** : une boîte de dialogue rappelle la date et l'heure.
  - **Refuser** : motif choisi dans une liste (pas de véhicule disponible, hors zone desservie, délai trop court, demande incomplète, autre) et complété par un texte libre de 500 caractères au plus. Le motif est **visible par le passager**.
  - **Annuler** : motif de 500 caractères au plus, visible par le passager.
  - **Marquer terminée** / **Marquer non effectuée** : selon les règles du §5.3.
  - **Je m'en occupe** [Reco] : indique à toute l'équipe que la demande est prise en charge (« Prise en charge par Sophie »). Évite que deux personnes rappellent le même passager.
- **Notes internes** [Reco]
  - Ajout seul, 2 000 caractères au plus, avec l'auteur et l'heure.
  - L'auteur peut supprimer sa note (suppression logique).
  - Jamais visibles du passager ni transmises aux destinataires.
- **Chronologie.** Création, changements de statut (qui, quand, motif), e-mails envoyés, transmissions.
- **Transmissions**
  - Une ligne par connexion : statut, nombre de tentatives, dernier code HTTP, identifiant externe s'il existe.
  - Bouton « Relancer » en cas d'échec, lien vers le détail.

### 6.5 Passagers [Ajout]

- **Liste**
  - Colonnes : nom, e-mail, téléphone, statut (vérification en attente, actif, désactivé), date d'inscription, dernière demande, nombre de demandes.
  - Recherche.
- **Fiche**
  - Profil, adresses favorites et besoins par défaut, **en lecture seule**. Les besoins ne sont affichés que si le consentement existe.
  - Demandes du passager.
- **Actions**
  - **Désactiver / réactiver.** La désactivation révoque toutes ses sessions et tous ses jetons mobiles.
  - **Renvoyer l'e-mail de vérification.**
  - **Exporter ses données** [Reco], au format JSON, pour répondre à une demande d'accès RGPD. Réauthentification obligatoire.
  - **Anonymiser.**
    - Réauthentification obligatoire et saisie du mot « ANONYMISER » pour confirmer. L'action est irréversible.
    - Elle est **refusée** tant qu'une demande `received` ou `confirmed` à venir existe : il faut d'abord l'annuler ou la clôturer.
    - Le compte et toutes ses demandes sont anonymisés.
- **Volontairement absents.** L'admin ne peut ni modifier le profil d'un passager ni « se connecter en tant que » lui. Le passager garde la maîtrise de ses données, ce qui évite les litiges.

### 6.6 Connexions (webhooks) [Contrat R7, R11]

**Liste.** Colonnes :

- nom ;
- destination (nom d'hôte) ;
- statut : Inactive, Active, Archivée ;
- événements ;
- badge « Données de santé » ;
- dernier succès ;
- échecs sur 7 jours ;
- dernier test.

**Création, en 3 étapes**

1. **Destination**
   - Nom, URL en `https`, contact technique, description.
   - Validation immédiate (§9.4), avec un message clair en cas de refus. Exemple : « Cette adresse pointe vers un réseau interne : refusée ».
2. **Contenu**
   - Événements à transmettre (cases à cocher).
   - « Inclure les besoins de mobilité (données de santé) » : **désactivé par défaut**. Pour l'activer, il faut cocher la case puis confirmer un avertissement : « Ces informations sont des données de santé. Ne les transmettez qu'à un destinataire lié à MBT par un contrat de traitement des données. »
   - En-têtes personnalisés, 10 au maximum. Leurs valeurs sont masquées après l'enregistrement (§9.7).
3. **Sécurité**
   - Réauthentification, puis création.
   - **Affichage unique du secret de signature** : bouton « Copier » et avertissement « Ce secret ne sera plus jamais affiché ».
   - Case obligatoire « J'ai transmis ce secret au destinataire par un canal sûr ».

À l'issue de ces étapes, la connexion est créée **inactive**.

**Fiche d'une connexion**

- **Tester**
  - Envoie un événement `webhook.test`.
  - Affiche le résultat : code HTTP, durée, extrait de réponse, IP contactée.
  - Les erreurs sont expliquées en français : « Certificat invalide », « Adresse interne refusée », « Délai dépassé (10 s) », « Redirection refusée », « Réponse 401 : vérifiez l'en-tête d'authentification »…
- **Activer** (réauthentification) : possible uniquement si un test a **réussi dans les 24 dernières heures**.
- **Désactiver**
  - Effet immédiat, **sans** réauthentification : en cas d'incident, couper doit rester rapide.
  - Action journalisée et notifiée.
- **Modifier** (réauthentification)
  - Le nom, la description et le contact se modifient librement.
  - Un **changement d'URL** remet la connexion **inactive** et impose un nouveau test réussi.
  - Toute modification des événements, des en-têtes ou de l'option « données de santé » est notifiée à tous les admins.
- **Renouveler le secret** (réauthentification). Deux modes au choix :
  - **progressif** : l'ancien secret reste valable 24 h et les deux signatures sont envoyées ;
  - **urgence** : l'ancien secret est révoqué immédiatement.

  Le nouveau secret est affiché une seule fois.
- **Archiver** (réauthentification)
  - Arrêt définitif.
  - Le secret et les en-têtes sont détruits ; l'historique est conservé.
- **Réactiver**
  - Si des envois sont en attente, une boîte de dialogue s'ouvre : « 12 envois sont en attente depuis le 03/12 à 14:05 ».
  - Deux choix : « Les envoyer » ou « Les abandonner ».
- **Onglet « Envois ».** Le journal des envois, filtré sur cette connexion.
- **Lien « Télécharger le guide d'intégration »**, à transmettre au destinataire.

### 6.7 Journal des envois [Contrat R8, R9]

- **Liste**
  - Colonnes : date, connexion, événement, demande (référence), statut, tentatives, dernier code HTTP, prochaine tentative.
  - Filtres : connexion, statut, événement, période, demande.
- **Détail d'un envoi**
  - Le payload envoyé, en JSON formaté. Les besoins de santé sont masqués par défaut, avec un bouton « Afficher ».
  - Les en-têtes envoyés. La signature et les valeurs des en-têtes personnalisés sont toujours masquées.
  - Chaque tentative : heure, durée, IP contactée, code HTTP, type d'erreur, extrait de réponse (affiché échappé, §9.8).
- **Actions**
  - **Relancer** :
    - pour un envoi ;
    - ou en masse, avec « Relancer les échecs affichés » : confirmation du nombre d'envois, 500 au maximum.
  - **Abandonner** : un envoi `pending` ou `failed` passe en `abandoned`, avec un motif.

### 6.8 Administrateurs [Contrat R5]

- **Liste.** Colonnes : nom, e-mail, statut, double authentification activée, dernière connexion, sessions actives.
- **Inviter** (réauthentification) : nom et e-mail, puis envoi d'une invitation valable 72 h.
- **Désactiver / réactiver** (réauthentification)
  - Toutes les sessions sont révoquées immédiatement.
  - Impossible sur son propre compte, et sur le dernier admin actif.
- **Réinitialiser la double authentification** d'un autre admin (réauthentification). L'intéressé devra se réenrôler ; il est prévenu par e-mail.
- **Révoquer les sessions** d'un admin (réauthentification).

### 6.9 Paramètres

- Les paramètres sont décrits au §14.
- Toute modification exige une réauthentification.
- Elle est journalisée, avec la valeur avant et après.

### 6.10 Journal d'audit [Reco]

- **Liste**
  - Colonnes : date, acteur, action, objet, IP.
  - Filtres : acteur, action, objet, période.
  - Détail de chaque entrée en JSON.
- **« Vérifier l'intégrité ».** Recalcule le chaînage des empreintes (§10.9) et répond « Intègre » ou « Rupture à l'entrée n° … ».
- **Export** (réauthentification).

### 6.11 Mon compte

- **Nom et e-mail.** Un changement d'e-mail exige une réauthentification et une confirmation envoyée à la nouvelle adresse.
- **Mot de passe.** Le mot de passe actuel est demandé.
- **Double authentification.** Régénérer les codes de secours (réauthentification, les anciens sont invalidés) ou réenrôler l'application.
- **Sessions actives.** Appareil, IP et dernière activité de chacune, avec un bouton pour la révoquer.

---

## 7. API d'administration

### 7.1 Conventions

- **Base.** `https://gestion.mbttaxis.be/api/v1`, en JSON.
  Si l'interface est rendue côté serveur (HTMX), ces routes constituent la couche métier ; les vues HTML appellent les mêmes services.
- **Authentification.**
  - Par cookie de session (§10.3).
  - Chaque requête qui modifie quelque chose DOIT porter l'en-tête `X-CSRF-Token` (§10.7).
- **Concurrence.**
  - `GET` sur une demande renvoie `ETag: "<revision>"`, et les actions exigent `If-Match`.
  - Sans `If-Match` : `428`. Révision différente : `412`.
- **Erreurs.** Format RFC 9457 (`application/problem+json`), avec un champ `code` stable, par exemple `invalid_transition`, `step_up_required` ou `ssrf_blocked`.
- **Réauthentification requise.** L'API répond `403` avec `code: "step_up_required"`. L'interface ouvre alors la saisie du code et rejoue la requête.
- **Pagination.** `?page=1&page_size=50` (100 au maximum). La réponse a la forme `{"items": [...], "page": 1, "page_size": 50, "total": 1234}`.

### 7.2 Routes

Légende : **S** = réauthentification requise, **A** = journalisé dans l'audit.

**Authentification et compte**

| Méthode | Route | Description | S | A |
|---|---|---|---|---|
| POST | `/auth/login` | E-mail et mot de passe ; ouvre une session partielle (`mfa_verified = false`) | | ✓ |
| POST | `/auth/mfa` | Code TOTP ou code de secours ; complète la session (nouveau jeton) | | ✓ |
| POST | `/auth/logout` | Révoque la session courante | | ✓ |
| POST | `/auth/step-up` | Code TOTP ; ouvre une fenêtre de 10 min | | ✓ |
| GET | `/auth/me` | Profil, état de la réauthentification | | |
| POST | `/auth/password/forgot` | Envoi d'un lien (réponse identique que l'e-mail existe ou non) | | ✓ |
| POST | `/auth/password/reset` | Nouveau mot de passe, avec jeton et code TOTP | | ✓ |
| POST | `/auth/invitations/accept` | Choix du mot de passe à partir d'une invitation | | ✓ |
| POST | `/auth/mfa/enroll`, `/auth/mfa/confirm` | Enrôlement de la double authentification | | ✓ |
| POST | `/auth/recovery-codes` | Régénère les codes de secours | ✓ | ✓ |
| PATCH | `/auth/me` | Nom, e-mail (avec confirmation), mot de passe | ✓* | ✓ |
| GET | `/auth/sessions` | Liste des sessions actives | | |
| DELETE | `/auth/sessions/{id}` | Révoque une session | | ✓ |

\* Réauthentification requise pour le changement d'e-mail uniquement.

**Demandes**

| Méthode | Route | Description | S | A |
|---|---|---|---|---|
| GET | `/dashboard` | Blocs du tableau de bord | | |
| GET | `/demandes` | Liste. Filtres : `q`, `status`, `origin`, `pickup_from`, `pickup_to`, `has_account`, `needs`, `delivery=failed`, `auto_closed`, `sort` | | |
| GET | `/demandes/{id}` | Fiche, avec `ETag` | | |
| POST | `/demandes/{id}/transitions` | `{"to": "confirmed", "reason": null}`, avec `If-Match` | | ✓ |
| POST | `/demandes/{id}/assign` | `{"admin_id": "…"}` ou `null`, avec `If-Match` | | ✓ |
| GET | `/demandes/{id}/events` | Chronologie | | |
| POST | `/demandes/{id}/notes` | Ajoute une note interne | | ✓ |
| DELETE | `/demandes/{id}/notes/{note_id}` | Suppression logique, par l'auteur uniquement | | ✓ |
| GET | `/demandes/export.csv` | Export en flux ; mêmes filtres que la liste | ✓ | ✓ |

**Passagers** [Ajout]

| Méthode | Route | Description | S | A |
|---|---|---|---|---|
| GET | `/passengers`, `/passengers/{id}` | Liste et fiche | | |
| POST | `/passengers/{id}/disable`, `/enable` | Désactive ou réactive le compte (révocation des jetons) | | ✓ |
| POST | `/passengers/{id}/resend-verification` | Renvoie l'e-mail de vérification | | ✓ |
| GET | `/passengers/{id}/export` | Export RGPD au format JSON | ✓ | ✓ |
| POST | `/passengers/{id}/anonymize` | `{"confirm": "ANONYMISER"}` | ✓ | ✓ |

**Connexions et envois** [Contrat]

| Méthode | Route | Description | S | A |
|---|---|---|---|---|
| GET | `/webhooks` | Liste des connexions | | |
| POST | `/webhooks` | Création. Réponse `201` avec `secret`, **seule occasion où il est renvoyé** | ✓ | ✓ |
| GET | `/webhooks/{id}` | Fiche (jamais de secret ni de valeur d'en-tête) | | |
| PATCH | `/webhooks/{id}` | Modification. Un changement d'URL remet la connexion `inactive` | ✓ | ✓ |
| POST | `/webhooks/{id}/test` | Envoi synchrone de `webhook.test` ; renvoie le résultat | | ✓ |
| POST | `/webhooks/{id}/activate` | `{"pending": "send"}` ou `{"pending": "abandon"}`. Exige un test réussi depuis moins de 24 h | ✓ | ✓ |
| POST | `/webhooks/{id}/deactivate` | Désactivation immédiate | | ✓ |
| POST | `/webhooks/{id}/rotate-secret` | `{"mode": "graceful"}` ou `{"mode": "immediate"}`. Renvoie le nouveau `secret`, une seule fois | ✓ | ✓ |
| POST | `/webhooks/{id}/archive` | Archivage (secret et en-têtes détruits) | ✓ | ✓ |
| GET | `/webhook-deliveries` | Journal. Filtres : `endpoint`, `status`, `event`, `from`, `to`, `demande` | | |
| GET | `/webhook-deliveries/{id}` | Détail et tentatives | | |
| POST | `/webhook-deliveries/{id}/retry` | Relance immédiate | | ✓ |
| POST | `/webhook-deliveries/{id}/abandon` | `{"reason": "…"}` | | ✓ |
| POST | `/webhook-deliveries/retry-bulk` | Mêmes filtres que la liste, 500 au maximum ; renvoie le nombre relancé | | ✓ |

**Administration**

| Méthode | Route | Description | S | A |
|---|---|---|---|---|
| GET | `/admins` | Liste | | |
| POST | `/admins/invitations` | `{"email": "…", "full_name": "…"}` | ✓ | ✓ |
| POST | `/admins/{id}/disable`, `/enable` | Refusé sur soi-même et sur le dernier admin actif | ✓ | ✓ |
| POST | `/admins/{id}/reset-mfa` | L'intéressé devra se réenrôler | ✓ | ✓ |
| DELETE | `/admins/{id}/sessions` | Révoque toutes les sessions | ✓ | ✓ |
| GET | `/settings` | Paramètres | | |
| PATCH | `/settings` | Modification (valeurs bornées, §14) | ✓ | ✓ |
| GET | `/audit-log` | Journal d'audit | | |
| POST | `/audit-log/verify` | Vérifie le chaînage | | ✓ |
| GET | `/audit-log/export.csv` | Export | ✓ | ✓ |
| GET | `/system/status` | Signe de vie du worker, files d'attente, version déployée | | |

**Supervision** : `GET /healthz`, publique. Elle répond `200 OK` sans aucun détail ; la base est vérifiée avec un `SELECT 1`.

---

## 8. Webhooks sortants : fonctionnement

### 8.1 Garanties offertes

| Garantie | Explication |
|---|---|
| **Aucune perte** | L'envoi est enregistré dans la même transaction que la demande (outbox). Pas de demande sans envoi, pas d'envoi sans demande. |
| **Au moins une fois** | Un message peut arriver **deux fois** (nouvelle tentative, redémarrage). Le destinataire déduplique grâce à `webhook-id`. |
| **Ordre non garanti** | Une nouvelle tentative peut arriver après un événement plus récent. Chaque message contient l'état complet de la demande et sa `revision` ; le destinataire ignore toute révision plus ancienne que celle qu'il connaît. |
| **Contenu figé** | Le payload est construit au moment de l'événement et ne change plus. L'historique montre exactement ce qui a été envoyé. |
| **Pas d'historique rétroactif** | Une connexion ne reçoit que les événements survenus **après** son activation. Aucune fonction ne renvoie les demandes passées (§9.6). |

### 8.2 Choix du standard : Standard Webhooks

Le format de signature suit la spécification ouverte **Standard Webhooks** ([standardwebhooks.com](https://www.standardwebhooks.com/)) :

- en-têtes `webhook-id`, `webhook-timestamp` et `webhook-signature` ;
- HMAC-SHA256 sur `id.timestamp.corps`.

Pourquoi ce standard :

- Les destinataires disposent de **bibliothèques officielles prêtes à l'emploi** dans la plupart des langages. Ils n'ont rien de spécifique à HandyCab à coder.
- La **rotation de secret** est prévue nativement : plusieurs signatures dans un même en-tête.
- Le schéma est connu et relu par la communauté ; on évite d'inventer de la cryptographie maison.
- **Interopérabilité vérifiée.** La signature produite par notre implémentation a été validée par la bibliothèque officielle Python `standardwebhooks`, et inversement. La bibliothèque JavaScript `standardwebhooks` 1.3.0 produit exactement la même signature pour le vecteur de test. Celui-ci figure dans le guide d'intégration.

### 8.3 Événements

| Événement | Déclencheur | Périmètre |
|---|---|---|
| `demande.created` | Nouvelle demande (T1) | [Contrat] |
| `demande.confirmed` | Confirmation par MBT (T2) | [Reco] |
| `demande.refused` | Refus par MBT (T3) | [Reco] |
| `demande.cancelled` | Annulation par le passager ou par MBT (T4 à T7) | [Reco], indispensable avec le compte client |
| `webhook.test` | Bouton « Tester » | [Contrat] (R7 : « tester ») |

- Chaque connexion choisit ses événements.
- **Abonnements conseillés :**
  - pour un logiciel de dispatch qui ne doit voir que des courses acceptées : `demande.confirmed` et `demande.cancelled` ;
  - pour tout voir : les 4 événements de demande.
- **Non transmis : terminée et non effectuée.** C'est le destinataire qui sait si la course a eu lieu, et le contrat exclut le retour d'informations. Il n'y a donc rien d'utile à lui envoyer.

### 8.4 Mise en file (outbox)

```python
# app/domain/webhooks/outbox.py
async def enqueue_webhook_event(db: AsyncSession, demande: Demande, event_type: str) -> None:
    """Appelée DANS la transaction qui modifie la demande : aucun commit ici."""
    endpoints = await db.scalars(
        select(WebhookEndpoint).where(
            WebhookEndpoint.status == "active",
            WebhookEndpoint.events.any(event_type),
        )
    )
    for endpoint in endpoints:
        db.add(WebhookDelivery(
            id=f"msg_{uuid.uuid7().hex}",
            endpoint_id=endpoint.id,
            demande_id=demande.id,
            event_type=event_type,
            payload=build_payload(event_type, demande,
                                  include_health=endpoint.include_health_data),
        ))
```

`build_payload` produit l'enveloppe décrite dans le guide :

- `type` ;
- `timestamp`, l'heure de l'événement ;
- `api_version` ;
- `data`, l'état complet de la demande.

Les besoins de mobilité n'y figurent que si la connexion l'autorise (`needs: null` sinon). Le payload est stocké **par envoi**, puisqu'il dépend de la connexion.

### 8.5 Le worker : bail, envoi, enregistrement

L'appel HTTP ne DOIT **jamais** se faire à l'intérieur d'une transaction : une connexion lente bloquerait des verrous en base. Le worker procède donc en 3 temps.

1. **Réserver.** Une transaction courte passe les envois dus en `sending`, avec un bail de 60 s.
2. **Envoyer**, hors transaction.
3. **Enregistrer.** Une transaction courte enregistre la tentative, le nouveau statut et la prochaine échéance.

```python
# app/worker/jobs/deliveries.py
CLAIM_SQL = text("""
    UPDATE webhook_deliveries d
    SET status = 'sending', lease_until = now() + interval '60 seconds'
    WHERE d.id IN (
        SELECT wd.id
        FROM webhook_deliveries wd
        JOIN webhook_endpoints e ON e.id = wd.endpoint_id AND e.status = 'active'
        WHERE wd.status = 'pending' AND wd.next_attempt_at <= now()
        ORDER BY wd.next_attempt_at
        LIMIT :limit
        FOR UPDATE OF wd SKIP LOCKED)
    RETURNING d.id, d.endpoint_id
""")

async def deliver_due(limit: int = 20) -> int:
    async with session() as db, db.begin():
        claimed = (await db.execute(CLAIM_SQL, {"limit": limit})).all()
    async with anyio.create_task_group() as tg:
        for delivery_id, endpoint_id in claimed:
            tg.start_soon(process_one, delivery_id, endpoint_id)   # semaphore par connexion (4)
    return len(claimed)

async def process_one(delivery_id: str, endpoint_id: UUID) -> None:
    async with endpoint_semaphore(endpoint_id):
        delivery, endpoint = await load(delivery_id)                   # lecture seule
        body = json.dumps(delivery.payload, separators=(",", ":"),
                          ensure_ascii=False).encode()                 # sérialisé UNE fois
        ts = int(time.time())
        headers = {
            **decrypt_custom_headers(endpoint),                        # validés à l'enregistrement (§9.7)
            "webhook-id": delivery.id,                                 # identique à chaque tentative
            "webhook-timestamp": str(ts),                              # heure de CETTE tentative
            "webhook-signature": signature_header(signing_keys(endpoint), delivery.id, ts, body),
            "Content-Type": "application/json",
            "User-Agent": "HandyCab-Webhooks/1.0",
            "Accept-Encoding": "identity",
        }
        result = await deliver(endpoint.url, body, headers)           # §9.4
        await record_attempt(delivery_id, result, trigger="auto")     # transaction courte
```

- **Reprise après plantage.** La tâche `reclaim_expired_leases` s'exécute chaque minute. Elle remet en `pending` les envois en `sending` dont le bail a expiré. C'est ce qui peut provoquer un doublon, d'où la garantie « au moins une fois ».
- **Limites de concurrence.** 20 envois simultanés par worker, dont 4 au maximum vers une même connexion. Une connexion lente ne bloque pas les autres.

### 8.6 Calendrier des tentatives [Contrat R9]

| Tentative | Délai après la précédente | Délai cumulé |
|---|---|---|
| 1 | Immédiate | 0 |
| 2 | 1 min | 1 min |
| 3 | 5 min | 6 min |
| 4 | 30 min | 36 min |
| 5 | 2 h | 2 h 36 |
| 6 | 6 h | 8 h 36 |
| 7 | 12 h | 20 h 36 |

- **Gigue.** Chaque délai varie aléatoirement de ±10 % pour éviter les rafales.
- **Succès.** Une réponse **2xx** reçue dans les délais.
- **Échec.** Tout le reste : 3xx (aucune redirection n'est suivie), 4xx, 5xx, délai dépassé, erreur DNS, TLS ou réseau, adresse refusée.
- **Après la 7e tentative.** L'envoi passe en `failed`. Un e-mail est envoyé aux admins et le compteur du tableau de bord augmente.
- **Pas de désactivation automatique** d'une connexion qui échoue. On ne perd jamais une transmission en silence : on alerte (§8.12) et un humain décide.

### 8.7 Test d'une connexion [Contrat R7]

- Le test est **synchrone** : l'admin voit le résultat en moins de 15 s, bien sous la limite de 30 s du routeur Heroku.
- Le payload est `{"type": "webhook.test", ..., "data": {"test": true}}`. Il est signé avec le ou les secrets en vigueur et soumis aux mêmes règles de sécurité qu'un envoi réel (§9.4).
- Le test est enregistré comme un envoi (`trigger = test`, sans demande liée) et apparaît dans le journal.
- Il met à jour `last_test_at` et `last_test_ok`. Un test réussi depuis moins de 24 h est **obligatoire pour activer** la connexion.
- Limite : 10 tests par période de 10 min et par connexion.

### 8.8 Relance manuelle [Contrat R9]

- **Envoi `failed` ou `pending`.** Une tentative immédiate est faite (`trigger = manual`, avec l'admin qui l'a déclenchée).
  - En cas d'échec, l'envoi repasse en `failed`, **sans** relancer un nouveau cycle automatique.
  - En cas de succès, il passe en `succeeded`.
- **Même `webhook-id`.** Si le destinataire avait en fait déjà reçu le message, il le reconnaît et l'ignore.
- **Relance en masse.** 500 envois au maximum, avec une confirmation qui indique le nombre exact.
- **Abandon.** Un envoi `pending` ou `failed` passe en `abandoned`, avec un motif. Exemple : une demande dont la date est passée et qui a été traitée par téléphone.

### 8.9 Désactivation, réactivation, archivage

| Action | Effet sur les nouveaux événements | Effet sur les envois en attente |
|---|---|---|
| Désactiver | Aucun envoi n'est créé pour cette connexion | Gelés : le worker ignore les connexions inactives |
| Réactiver | Les envois reprennent | Choix explicite : « Envoyer » (ordre d'origine) ou « Abandonner » |
| Archiver | Plus aucun envoi | Abandonnés ; secret et en-têtes détruits ; historique conservé |

### 8.10 Identifiant externe [Reco]

Si la réponse 2xx est du JSON de 64 Ko au plus, avec un champ `external_id` (texte de 100 caractères au plus, caractères `A-Z a-z 0-9 . _ : -`), cet identifiant est enregistré sur l'envoi et affiché dans la fiche demande.

- Il n'est **utilisé par aucun automatisme** : le contrat exclut le retour d'informations.
- Il prépare un éventuel rapprochement futur (§17), sans modifier le modèle de données.

### 8.11 Format des messages

Le format complet est défini dans le **guide d'intégration** : enveloppe, objet `data`, champs, exemples, vecteur de test. En résumé :

```json
{
  "type": "demande.confirmed",
  "timestamp": "2026-11-26T10:15:02Z",
  "api_version": "2026-12-01",
  "data": {
    "id": "0193b5f2-7c1e-7a3b-9f2d-4c8e1a2b3c4d",
    "reference": "D-2026-000142",
    "revision": 2,
    "status": "confirmed",
    "origin": "app_ios",
    "service": "pmr",
    "...": "état complet de la demande (voir le guide)"
  }
}
```

**Versionnement**

- `api_version` est daté.
- On PEUT ajouter des champs à tout moment : le destinataire DOIT ignorer les champs inconnus.
- Un changement incompatible implique une nouvelle version, annoncée avec **3 mois de préavis** et activée connexion par connexion.

### 8.12 Indicateurs et alertes

| Indicateur | Seuil d'alerte | Action |
|---|---|---|
| Ancienneté du plus vieil envoi `pending` dû | > 10 min | E-mail aux admins : le worker est peut-être arrêté |
| Envois passés en `failed` | Chaque occurrence | E-mail aux admins, avec un lien vers l'envoi |
| Connexion active sans succès | 24 h | Bloc « Transmissions » du tableau de bord et récapitulatif quotidien |
| Tentative bloquée par la protection SSRF | Chaque occurrence | E-mail immédiat aux admins et au contact de sécurité (§9.4) |
| Signe de vie du worker | > 2 min | Bandeau rouge dans l'espace de gestion |

---

## 9. Sécurité des webhooks

Les webhooks forment la seule partie du système qui **fait sortir des données personnelles**, parfois de santé, vers une adresse **saisie par un humain**. C'est la surface d'attaque principale. Cette section est normative : chaque mesure DOIT être implémentée et testée (§9.13).

### 9.1 Modèle de menaces

| # | Menace | Scénario | Mesures |
|---|---|---|---|
| M1 | Usurpation | Un tiers envoie de fausses demandes au destinataire en se faisant passer pour HandyCab | Signature HMAC avec un secret propre à chaque connexion (§9.2) |
| M2 | Rejeu | Un message intercepté ou journalisé est renvoyé plus tard | Horodatage signé avec une tolérance de 5 min ; déduplication par `webhook-id` chez le destinataire |
| M3 | Interception | Lecture ou modification du message en transit | HTTPS obligatoire, certificat vérifié, TLS 1.2 minimum, aucune redirection suivie |
| M4 | SSRF (requête vers le réseau interne) | URL interne saisie ; DNS qui renvoie une IP interne au moment de l'envoi (*DNS rebinding*) ; redirection vers une adresse interne | Validation de l'URL, résolution et filtrage à chaque envoi, épinglage de l'IP, aucune redirection, aucun proxy implicite (§9.4) |
| M5 | Exfiltration par un compte admin compromis | Un attaquant crée une connexion vers son serveur pour recevoir toutes les demandes futures | Double authentification, réauthentification, connexion inactive par défaut, test obligatoire, notification de tous les admins, pas d'historique, liste blanche facultative (§9.6) |
| M6 | Fuite d'un secret | Copie de la base, logs, e-mail | AES-256-GCM avec une clé stockée hors de la base, affichage unique, jamais journalisé, rotation (§9.3) |
| M7 | Fuite de données personnelles | Payloads dans les logs, Sentry, exports | Minimisation, données de santé sur option, purge des payloads, logs sans données personnelles (§9.5, §9.10) |
| M8 | Contenu hostile renvoyé par le destinataire | XSS dans l'espace de gestion via la réponse affichée ; injection dans les logs ; réponse géante | Lecture plafonnée, extrait nettoyé, affichage échappé (§9.8) |
| M9 | Injection d'en-têtes | Retour à la ligne (CRLF) dans un en-tête personnalisé pour en forger d'autres | Validation stricte des noms et des valeurs, noms réservés (§9.7) |
| M10 | Épuisement du worker | Destinataire lent, réponse qui n'en finit pas | Délais, plafond global, limites de concurrence, baux (§9.9) |
| M11 | Effacement des traces | Un attaquant modifie l'historique pour masquer une exfiltration | Audit en ajout seul, chaînage d'empreintes, copie dans le log drain (§10.9) |
| M12 | Compromission de la clé maîtresse | Fuite des variables d'environnement Heroku | Accès Heroku restreint avec MFA, clés versionnées, procédure de rotation (§9.3, §11.7) |

### 9.2 Signature des messages

| Élément | Règle |
|---|---|
| Algorithme | HMAC-SHA256, schéma `v1` de Standard Webhooks |
| Contenu signé | `{webhook-id}.{webhook-timestamp}.{corps brut}` |
| `webhook-id` | `msg_` suivi d'un UUIDv7. **Identique à chaque tentative** : c'est la clé de déduplication |
| `webhook-timestamp` | Secondes depuis l'epoch, au moment de **cette** tentative. La signature est recalculée à chaque tentative |
| `webhook-signature` | `v1,<signature en base64>`. Pendant une rotation, deux signatures séparées par une espace |
| Corps | Sérialisé **une seule fois**, juste avant l'envoi. On signe et on envoie **exactement ces octets** (`content=body`, jamais `json=`) |

```python
# app/domain/webhooks/signing.py
def sign(key: bytes, msg_id: str, timestamp: int, body: bytes) -> str:
    mac = hmac.new(key, f"{msg_id}.{timestamp}.".encode() + body, hashlib.sha256)
    return "v1," + base64.b64encode(mac.digest()).decode()

def signature_header(keys: list[bytes], msg_id: str, timestamp: int, body: bytes) -> str:
    return " ".join(sign(k, msg_id, timestamp, body) for k in keys)

def signing_keys(endpoint: WebhookEndpoint) -> list[bytes]:
    keys = [decode_secret(decrypt(endpoint.secret_enc, aad=secret_aad(endpoint)))]
    if endpoint.secret_prev_enc and endpoint.secret_prev_expires_at > utcnow():
        keys.append(decode_secret(decrypt(endpoint.secret_prev_enc, aad=secret_aad(endpoint, prev=True))))
    return keys
```

**Vecteur de test**, partagé avec le guide d'intégration et vérifié avec la bibliothèque officielle `standardwebhooks`. Il DOIT figurer dans les tests unitaires :

```python
def test_signature_vector():
    key = base64.b64decode("jmOigo2WR8R6RSIgn4MwSHnuC1l0YPN5H5KuR7s1Yqo=")   # secret de test fictif
    body = (b'{"type":"webhook.test","timestamp":"2026-11-26T10:00:00Z",'
            b'"api_version":"2026-12-01","data":{"test":true}}')
    assert sign(key, "msg_01JDQ8Z5V9K3M7XW2TYB4N6HRE", 1795687200, body) == \
        "v1,O2Fe75t42uZPc6RVjX/ThsMlObtaCCHZ2v5m+gSmoJo="
```

**Pourquoi pas une signature asymétrique ?** Standard Webhooks prévoit aussi Ed25519 (`v1a`). Avec quelques destinataires seulement, le secret partagé est plus simple pour eux et suffisamment sûr. Le passage à l'asymétrique est une [Option] si le nombre de destinataires grandit.

### 9.3 Gestion des secrets

**Génération et affichage**

- Le secret est généré par `secrets.token_bytes(32)`, puis mis au format `whsec_` + base64 (format Standard Webhooks).
- Il n'est **jamais choisi par un humain**.
- Il est **affiché une seule fois**, à la création ou à la rotation. L'API ne le renvoie plus jamais et aucun bouton « Révéler » n'existe.
- Un secret perdu se **renouvelle**, il ne se consulte pas.

**Stockage chiffré**

- Chiffrement AES-256-GCM, avec des **données associées** (AAD) qui lient le chiffré à sa ligne et à son usage, par exemple `webhook_endpoint:<id>:secret`. On ne peut pas recopier un chiffré d'une ligne vers une autre.
- La **clé maîtresse est hors de la base**, dans la variable Heroku `APP_ENCRYPTION_KEYS`. Une copie de la base seule ne révèle donc aucun secret.
- Les clés sont **versionnées** : on peut en changer sans interruption.

```python
# app/security/crypto.py
# APP_ENCRYPTION_KEYS="k2:<32 octets en base64>,k1:<32 octets en base64>"
# La première clé chiffre ; toutes peuvent déchiffrer.
class Keyring:
    def __init__(self, spec: str) -> None:
        pairs = [item.strip().split(":", 1) for item in spec.split(",")]
        self.keys = {kid: base64.b64decode(material) for kid, material in pairs}
        self.active_id = pairs[0][0]
        if any(len(k) != 32 for k in self.keys.values()) or any(":" in kid for kid in self.keys):
            raise ValueError("APP_ENCRYPTION_KEYS invalide")

    def encrypt(self, plaintext: bytes, aad: bytes) -> bytes:
        nonce = os.urandom(12)
        ciphertext = AESGCM(self.keys[self.active_id]).encrypt(nonce, plaintext, aad)
        return self.active_id.encode() + b":" + nonce + ciphertext

    def decrypt(self, blob: bytes, aad: bytes) -> bytes:
        kid, rest = blob.split(b":", 1)
        return AESGCM(self.keys[kid.decode()]).decrypt(rest[:12], rest[12:], aad)
```

Le même mécanisme protège les secrets TOTP des admins (AAD `admin:<id>:totp`) et les en-têtes personnalisés (AAD `webhook_endpoint:<id>:headers`).

**Rotation de la clé maîtresse**

1. Ajouter la nouvelle clé **en tête** de `APP_ENCRYPTION_KEYS`.
2. Lancer `heroku run python -m app.cli reencrypt`, qui rechiffre toutes les colonnes `_enc`.
3. Retirer l'ancienne clé.

Chaque étape est journalisée.

**Transmission du secret au destinataire**

- Le secret ne voyage **jamais avec l'URL** dans le même message.
- Canaux acceptés :
  - lien à usage unique avec expiration courte ;
  - dictée téléphonique d'une moitié du secret, envoi de l'autre moitié par e-mail ;
  - e-mail chiffré.
- **Interdits :** ticket, messagerie instantanée, e-mail en clair contenant le secret complet.

**Rotation du secret d'une connexion**

| Mode | Fonctionnement | Usage |
|---|---|---|
| **Progressif** | Le nouveau secret devient le secret courant. L'ancien reste valable 24 h (`secret_prev_*`). Les messages portent **les deux signatures**. Le destinataire bascule quand il le souhaite, sans interruption. La tâche horaire `expire_previous_secrets` détruit ensuite l'ancien. | Rotation planifiée, changement de prestataire |
| **Urgence** | L'ancien secret est détruit immédiatement. Les envois échouent tant que le destinataire n'a pas installé le nouveau ; ils sont réessayés selon le calendrier (§8.6). | Fuite avérée ou suspectée |

**Secret compromis.** Rotation en mode urgence, revue du journal des envois des derniers jours, information du destinataire. Voir aussi §11.7.

### 9.4 Protection contre la SSRF

**Le risque.** Une URL de destination est saisie par un humain, puis appelée par nos serveurs. Sans protection, on pourrait faire appeler par le worker :

- des adresses internes (base de données, services de la plateforme) ;
- des adresses de métadonnées, comme `169.254.169.254` ;
- un nom de domaine qui change d'IP entre la validation et l'envoi.

**a) À l'enregistrement de l'URL**

```python
# app/domain/webhooks/url_policy.py
FORBIDDEN_SUFFIXES = (".localhost", ".local", ".internal", ".lan", ".home.arpa", ".corp")

def _is_ip_literal(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False

def validate_endpoint_url(raw: str) -> tuple[httpx.URL, str]:
    if len(raw) > 2048:
        raise InvalidURL("too_long")
    url = httpx.URL(raw.strip())
    if url.scheme != "https":
        raise InvalidURL("https_required")
    if url.userinfo:
        raise InvalidURL("credentials_in_url")         # pas de https://user:pass@…
    if url.fragment:
        raise InvalidURL("fragment_forbidden")
    host = url.raw_host.decode("ascii").rstrip(".")    # IDNA (punycode), minuscules, sans point final
    if not host or "." not in host or _is_ip_literal(host):
        raise InvalidURL("hostname_required")          # un nom de domaine, pas une IP
    if host.rsplit(".", 1)[-1].isdigit() or host.startswith("0x"):
        raise InvalidURL("numeric_host")               # ex. 0x7f.1, 10.1 : IP déguisées
    if host == "localhost" or host.endswith(FORBIDDEN_SUFFIXES):
        raise InvalidURL("internal_hostname")
    if (url.port or 443) not in settings.webhook_allowed_ports:   # défaut : {443}
        raise InvalidURL("port_forbidden")
    if settings.webhook_allowed_hosts and not host_matches(host, settings.webhook_allowed_hosts):
        raise InvalidURL("host_not_allowlisted")       # liste blanche facultative (§9.6)
    return url.copy_with(host=host), host
```

- `host_matches` accepte un nom exact (`hooks.taxiger.com`) ou un motif `*.taxiger.com`, qui correspond à un sous-domaine, **jamais** à `eviltaxiger.com`.
- Après ces contrôles, l'URL est **résolue immédiatement** (fonction ci-dessous). L'enregistrement est refusé si une seule des IP obtenues n'est pas publique.
- Message affiché : « Cette adresse pointe vers un réseau interne ».

**b) À chaque envoi : nouvelle résolution, filtrage, épinglage**

Valider l'URL une fois ne suffit pas : le DNS peut changer après coup (*DNS rebinding*). À **chaque** tentative :

1. on résout le nom ;
2. on refuse si **une seule** IP n'est pas publique ;
3. on se connecte **à l'IP validée**, en envoyant le vrai nom dans l'en-tête `Host` et dans le SNI TLS. Le certificat est ainsi vérifié **pour le vrai nom de domaine**.

Ce qui est vérifié et ce qui est contacté sont donc la même chose.

```python
# app/domain/webhooks/ssrf.py
BLOCKED_V6 = [ipaddress.ip_network(n) for n in
              ("64:ff9b::/96", "64:ff9b:1::/48", "2002::/16", "2001::/32")]  # NAT64, 6to4, Teredo

def is_public_ip(raw: str) -> bool:
    ip = ipaddress.ip_address(raw.split("%", 1)[0])       # retire un identifiant de zone IPv6
    if isinstance(ip, ipaddress.IPv6Address):
        if ip.ipv4_mapped:                                 # ::ffff:127.0.0.1
            return is_public_ip(str(ip.ipv4_mapped))
        if any(ip in net for net in BLOCKED_V6):           # IPv4 encapsulée dans de l'IPv6
            return False
    return ip.is_global and not ip.is_multicast

async def resolve_public_ips(host: str, port: int) -> list[str]:
    try:
        infos = await anyio.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except OSError as exc:
        raise DeliveryError("dns") from exc
    ips = sorted({info[4][0] for info in infos}, key=lambda ip: ":" in ip)   # IPv4 d'abord
    if not ips or not all(is_public_ip(ip) for ip in ips):
        raise DeliveryError("ssrf_blocked")
    return ips
```

`is_public_ip` refuse notamment : `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16` (métadonnées cloud), `100.64/10`, `0.0.0.0`, multicast et broadcast, plages de documentation et de test, `::1`, `fe80::/10`, `fc00::/7`, les adresses IPv4 encapsulées (`::ffff:…`, NAT64, 6to4, Teredo). La fonction a été testée sur 25 cas, sans aucune erreur.

```python
# app/domain/webhooks/sender.py
SSL_CTX = ssl.create_default_context(cafile=certifi.where())
SSL_CTX.minimum_version = ssl.TLSVersion.TLSv1_2

client = httpx.AsyncClient(
    verify=SSL_CTX,
    trust_env=False,                       # ignore HTTP(S)_PROXY : pas de proxy implicite
    follow_redirects=False,                # une redirection est un échec
    timeout=httpx.Timeout(10.0, connect=5.0),
    limits=httpx.Limits(max_connections=20, max_keepalive_connections=0),
)
MAX_RESPONSE_BYTES = 64 * 1024

async def deliver(url: str, body: bytes, headers: dict[str, str]) -> AttemptResult:
    target = httpx.URL(url)
    host, port = target.host, target.port or 443
    started = time.monotonic()
    resolved_ip = None
    try:
        with anyio.fail_after(15):                                    # plafond global, lecture comprise
            ips = await resolve_public_ips(host, port)
            resolved_ip = ips[0]
            request = client.build_request(
                "POST", target.copy_with(host=resolved_ip),           # https://<IP validée>/chemin
                content=body,
                headers={**headers, "Host": host},
                extensions={"sni_hostname": host},                    # SNI et certificat vérifiés sur le vrai nom
            )
            response = await client.send(request, stream=True)
            try:
                raw = await read_capped(response, MAX_RESPONSE_BYTES)
            finally:
                await response.aclose()
    except DeliveryError as exc:                                      # dns, ssrf_blocked
        return AttemptResult.failure(exc.code, resolved_ip, started)
    except (TimeoutError, httpx.TimeoutException):                   # plafond global ou délai httpx
        return AttemptResult.failure("timeout", resolved_ip, started)
    except httpx.ConnectError as exc:
        kind = "tls" if isinstance(exc.__cause__, ssl.SSLError) or "SSL" in str(exc) else "connect"
        return AttemptResult.failure(kind, resolved_ip, started)
    except httpx.HTTPError:
        return AttemptResult.failure("connect", resolved_ip, started)
    return AttemptResult.from_response(response, raw, resolved_ip, started)   # 2xx = succès ; 3xx = "redirect"

async def read_capped(response: httpx.Response, limit: int) -> bytes:
    chunks, size = [], 0
    async for chunk in response.aiter_raw():      # brut : aucune décompression (Accept-Encoding: identity)
        size += len(chunk)
        if size > limit:
            break                                  # on coupe : réponse marquée « too_large », code HTTP conservé
        chunks.append(chunk)
    return b"".join(chunks)
```

Points d'implémentation à ne pas manquer :

- **`trust_env=False`.** Sans ce réglage, httpx utilise les variables `HTTP_PROXY` et `HTTPS_PROXY` de l'environnement : un proxy inattendu contournerait l'épinglage.
- **Pas de keep-alive (`max_keepalive_connections=0`).** Le pool de connexions est indexé par IP. Une connexion TLS ouverte pour l'hôte A pourrait être réutilisée pour l'hôte B s'ils partagent la même IP (hébergement mutualisé, CDN).
- **IPv4 d'abord.** La sortie IPv6 n'est pas garantie sur Heroku. L'IPv6 n'est utilisée que si aucune IPv4 n'existe.
- **Technique validée.** Connexion à l'IP avec le bon SNI : TLS vérifié, réponse reçue. Avec un SNI erroné : poignée de main refusée.

**c) Avec un proxy à IP fixe (QuotaGuard, §9.11)**

- C'est le proxy qui résout le DNS : l'épinglage ne s'applique pas. Le client proxy est configuré **explicitement** (`proxy=...`) et l'URL d'origine est utilisée.
- La requête part alors **de l'infrastructure du proxy**, pas de la nôtre : le risque SSRF contre notre réseau est neutralisé par construction.
- Les contrôles du point a) et la résolution préalable du point b) sont **maintenus**, en défense en profondeur.

**d) Blocage détecté**

- Une tentative bloquée est enregistrée avec `error_type = ssrf_blocked`.
- Elle déclenche un **e-mail immédiat** aux admins et au contact de sécurité. C'est un indicateur possible d'attaque, ou d'un changement DNS anormal chez le destinataire.
- L'envoi suit malgré tout le calendrier normal de nouvelles tentatives.

### 9.5 Données transmises et minimisation

- **Seuls les champs utiles au transport** sont transmis (liste exacte dans le guide). Ne sont **jamais** transmis :
  - l'identifiant du compte passager ;
  - les notes internes ;
  - l'admin qui s'occupe de la demande ;
  - la clé d'idempotence ;
  - les adresses favorites ;
  - l'historique.
- **Besoins de mobilité (données de santé)**
  - Transmis uniquement si `include_health_data` est activé, ce qui n'est **pas** le cas par défaut.
  - Activer l'option exige une réauthentification et la confirmation de l'avertissement (§6.6).
  - L'activation est notifiée à tous les admins et journalisée.
  - Sinon, le message contient `"needs": null`.
- **Aucun rattrapage historique** (§8.1, §9.6).
- **Purge.** Les payloads sont effacés 30 jours après un succès, 90 jours après un échec (§4.4).
- **Logs.** Jamais de payload (§9.10).

### 9.6 Contre l'exfiltration par un compte admin compromis

**Scénario de référence.** Un attaquant obtient le mot de passe **et** un code de double authentification d'un admin, par exemple par hameçonnage en temps réel. Il crée une connexion vers son propre serveur pour recevoir toutes les demandes futures.

Les mesures s'empilent :

| # | Mesure | Effet |
|---|---|---|
| 1 | Réauthentification par code TOTP pour créer, modifier, activer, renouveler un secret ou activer les données de santé | Une session volée ne suffit pas |
| 2 | Toute nouvelle connexion est **inactive** et son activation exige un **test réussi** | Rien ne part sans action volontaire et vérifiée |
| 3 | **E-mail immédiat à tous les admins**, et au contact de sécurité du prestataire, à chaque création, changement d'URL, activation, activation des données de santé, rotation ou archivage. L'e-mail contient un lien direct « Désactiver cette connexion ». | Détection en quelques minutes par une autre personne |
| 4 | **Aucun historique** : seuls les événements postérieurs à l'activation sont envoyés | Les données passées ne peuvent pas être aspirées |
| 5 | **Rapport hebdomadaire** à tous les admins : connexions actives, destinations, volumes envoyés | Une connexion oubliée ou illégitime se voit |
| 6 | Audit en ajout seul, chaîné, recopié dans le log drain (§10.9) | Les traces ne peuvent pas être effacées discrètement |
| 7 | [Reco, décision du client] **Liste blanche** `WEBHOOK_ALLOWED_HOSTS` (par exemple `*.taxiger.com,hook.eu1.make.com`) | Mesure la plus forte : même un admin compromis ne peut pas viser un domaine hors liste. La liste se modifie par variable Heroku, sans toucher au code (R11 respecté), mais pas depuis l'interface. |
| 8 | [Option] **Validation à 4 yeux** : l'activation exige un second admin | Utile si l'équipe compte plusieurs admins |

### 9.7 En-têtes personnalisés

Ils servent par exemple à transmettre `Authorization: Bearer …` à un destinataire qui l'exige.

```python
HEADER_NAME = re.compile(r"^[A-Za-z0-9!#$%&'*+.^_`|~-]{1,64}$")   # « token » RFC 9110
HEADER_VALUE = re.compile(r"^[\x20-\x7e]{1,1024}$")                # ASCII imprimable, sans CR ni LF
RESERVED = {"host", "content-type", "content-length", "transfer-encoding", "connection",
            "accept-encoding", "user-agent", "te", "upgrade", "expect", "cookie"}
RESERVED_PREFIXES = ("webhook-", "x-forwarded-", "proxy-")
MAX_HEADERS = 10
```

- Les noms réservés sont refusés, quelle que soit la casse.
- Les valeurs sont **chiffrées** (§9.3).
- Après l'enregistrement, l'interface affiche `•••••••• (définie)` : une valeur peut être **remplacée**, jamais relue.
- Les valeurs ne sont jamais journalisées ; seuls les noms apparaissent dans l'audit.

### 9.8 Réponses des destinataires : données non fiables

- La lecture s'arrête à 64 Ko. L'extrait stocké fait **1 Ko** au plus.
- Les caractères de contrôle sont supprimés (sauf `\n` et `\t`) et l'UTF-8 invalide est remplacé.
- L'extrait est **toujours affiché échappé**.
  - Jinja2 échappe automatiquement ; le filtre `|safe` est interdit sur ces données.
  - La visionneuse JSON affiche du texte, jamais du HTML.
  - On évite ainsi qu'un destinataire malveillant injecte du JavaScript dans l'espace de gestion.
- La réponse n'est **jamais interprétée** : aucune redirection suivie, aucun appel induit. Seul `external_id` est lu, selon des règles strictes (§8.10).
- Les en-têtes de réponse ne sont pas stockés.

### 9.9 Robustesse

| Mesure | Valeur |
|---|---|
| Délai de connexion | 5 s |
| Délai de lecture | 10 s |
| Plafond global par tentative (résolution, envoi, lecture) | 15 s |
| Taille de réponse lue | 64 Ko |
| Envois simultanés par worker | 20 |
| Envois simultanés vers une même connexion | 4 |
| Bail d'un envoi en cours | 60 s, donc plus que le plafond de 15 s |
| Reprise des baux expirés | Chaque minute |
| Arrêt sur `SIGTERM` | Plus aucune réservation ; fin des envois en cours, 20 s au maximum (§12.3) |

### 9.10 Ce qui est journalisé, et où

| Élément | Journal des envois (base) | Logs applicatifs | Audit |
|---|---|---|---|
| Payload | Oui, purgé après 30 ou 90 jours | **Jamais** | **Jamais** |
| Secret | Chiffré | **Jamais** | **Jamais** (seulement « secret renouvelé ») |
| Valeurs des en-têtes personnalisés | Chiffrées | **Jamais** | Noms seulement |
| Code HTTP, durée, IP contactée, type d'erreur | Oui | Oui | Non |
| Extrait de réponse | Oui (1 Ko) | Non | Non |
| Création ou modification d'une connexion | — | Identifiant seulement | Oui, avant/après, secrets masqués |

### 9.11 IP de sortie fixes (QuotaGuard Static)

- **Quand.** Seulement si un destinataire exige une liste blanche d'IP (§17).
- **Mise en place.**
  - L'add-on fournit `QUOTAGUARDSTATIC_URL`, une URL de proxy qui contient des identifiants : elle ne doit **jamais** être journalisée.
  - Elle est utilisée **uniquement** par le client HTTP des webhooks, pas par celui des e-mails.
- **Chiffrement.** Il reste de bout en bout : HTTPS passe dans un tunnel `CONNECT` et le proxy ne voit pas le contenu.
- **Communication.** Les deux IP fixes sont transmises au destinataire via le guide d'intégration.
- **Budget.** Ce coût récurrent s'ajoute aux frais de fonctionnement.

### 9.12 Liste de contrôle avant mise en production

- [ ] HTTPS seul accepté ; certificats vérifiés ; TLS 1.2 minimum ; `trust_env=False` ; aucune redirection suivie.
- [ ] Validation d'URL active (schéma, identifiants, IP littérale, hôte numérique, suffixes internes, port, liste blanche si définie).
- [ ] Résolution, filtrage et épinglage à **chaque** tentative ; keep-alive désactivé.
- [ ] Délais et plafonds actifs (5 s, 10 s, 15 s, 64 Ko).
- [ ] Secrets générés par le système, affichés une seule fois, chiffrés avec AAD, clé maîtresse hors base.
- [ ] Rotation progressive testée, avec double signature et expiration après 24 h.
- [ ] Vecteur de test de signature présent dans la CI.
- [ ] Réauthentification sur toutes les actions sensibles des connexions.
- [ ] Nouvelle connexion inactive ; activation impossible sans test réussi depuis moins de 24 h.
- [ ] Notifications à tous les admins vérifiées sur chaque action sensible.
- [ ] Données de santé absentes du payload quand l'option est désactivée.
- [ ] Aucun payload, secret ni valeur d'en-tête dans les logs ou dans Sentry, vérifié par un test qui capture les logs.
- [ ] Extraits de réponse échappés à l'affichage, vérifié avec une réponse contenant `<script>`.
- [ ] Contrats de traitement des données signés avec chaque destinataire qui reçoit des données réelles (§11.6).
- [ ] Décision prise sur la liste blanche `WEBHOOK_ALLOWED_HOSTS` (§17).

### 9.13 Tests de sécurité automatisés

**URL refusées à l'enregistrement ou à l'envoi**

| URL | Motif attendu |
|---|---|
| `http://exemple.be/hook` | `https_required` |
| `https://localhost/`, `https://api.localhost/` | `hostname_required` / `internal_hostname` |
| `https://127.0.0.1/`, `https://[::1]/`, `https://[::ffff:127.0.0.1]/` | `hostname_required` (IP littérale) |
| `https://2130706433/` (127.0.0.1 en décimal) | `hostname_required` (pas de point) |
| `https://0x7f.1/` (127.0.0.1 en hexadécimal) | `numeric_host` |
| `https://user:pass@exemple.be/` | `credentials_in_url` |
| `https://exemple.be:22/` | `port_forbidden` |
| `https://localtest.me/` (domaine public qui résout vers 127.0.0.1) | `ssrf_blocked` |
| Domaine qui résout vers une IP publique à l'enregistrement, puis vers `10.0.0.5` à l'envoi (résolveur simulé) | `ssrf_blocked` à l'envoi |
| Réponse `302 Location: http://169.254.169.254/` | `redirect`, aucune requête de suivi |

**Autres tests**

- **Signature.** Le vecteur de test passe. Un corps modifié d'un seul octet invalide la signature. Pendant une rotation, l'en-tête contient deux signatures, chacune vérifiable avec son secret.
- **Secret.** Absent de toute réponse d'API après la création. Absent des logs (test qui capture les logs pendant création, test et envoi).
- **En-têtes.** `X-Test: a\r\nInjected: b` est refusé, ainsi que `Host`, `webhook-id` et `Content-Length`.
- **Réponses hostiles.** Une réponse de 10 Mo est coupée sans consommer de mémoire au-delà du plafond. Une réponse `<script>alert(1)</script>` est affichée échappée.
- **Délai.** Un destinataire qui ne répond jamais : échec `timeout` en 15 s au plus.
- **Données de santé.** `needs` vaut `null` quand l'option est désactivée.
- **Réauthentification.** Chaque route marquée **S** (§7.2) renvoie `403 step_up_required` sans réauthentification récente.
- **Notifications.** Chaque action sensible sur une connexion produit un e-mail à **tous** les admins actifs.

---

## 10. Sécurité de l'espace de gestion

### 10.1 Mots de passe

- **Hachage Argon2id** (argon2-cffi), avec les paramètres par défaut de la bibliothèque : profil RFC 9106 « faible mémoire », t = 3, m = 64 Mio, p = 4.
- Le hachage est recalculé à la connexion si les paramètres évoluent (`check_needs_rehash`).
- **Longueur** de 12 à 128 caractères.
- Les mots de passe courants sont refusés, grâce à une liste locale ; aucun appel à un service externe.
- **Pas de règles de composition** ni d'expiration périodique, conformément à NIST SP 800-63B : ces règles poussent aux mots de passe prévisibles.

### 10.2 Double authentification (obligatoire)

- **TOTP** (RFC 6238) avec pyotp : 6 chiffres, pas de 30 s, tolérance d'un pas avant ou après.
- **Anti-rejeu.** On mémorise le dernier pas utilisé (`totp_last_step`). Un même code ne sert qu'une fois.
- **Secret TOTP** chiffré (§9.3).
- **QR code généré sur le serveur** (segno). Ne **jamais** passer par un service de QR code en ligne : il recevrait le secret.
- **10 codes de secours**, générés aléatoirement, hachés en SHA-256, à usage unique. Régénérer les codes invalide les anciens.
- Les codes de secours permettent de **se connecter**, mais pas de faire une réauthentification : celle-ci exige l'application TOTP.
- [Option] Clés d'accès (*passkeys*, WebAuthn).

### 10.3 Sessions

- **Jeton.** Opaque, aléatoire, 256 bits (`secrets.token_urlsafe(32)`). Seul son haché SHA-256 est stocké.
- **Cookie.** `__Host-session`, avec `Secure; HttpOnly; SameSite=Strict; Path=/`. Le préfixe `__Host-` interdit l'attribut `Domain`, donc le cookie n'est jamais partagé avec un sous-domaine.
- **Nouveau jeton** émis après la validation du code TOTP : protection contre la fixation de session.
- **Expiration.** Après **2 h d'inactivité**, et au plus **12 h** après l'ouverture. `last_seen_at` est mis à jour au plus une fois par minute.
- **Révocation**
  - à la déconnexion ;
  - au changement de mot de passe (toutes les sessions sauf la courante) ;
  - à la désactivation du compte ou à la réinitialisation de la double authentification (toutes les sessions).

### 10.4 Réauthentification (step-up)

- Code TOTP exigé. Il ouvre une fenêtre de **10 minutes** (`step_up_until`).
- **Actions concernées**

| Domaine | Actions |
|---|---|
| Connexions | Créer, modifier, activer, renouveler le secret, archiver, activer les données de santé |
| Administrateurs | Inviter, désactiver, réactiver, réinitialiser la double authentification, révoquer des sessions |
| Paramètres | Toute modification |
| Exports | Demandes, journal d'audit, données d'un passager |
| Passagers | Anonymiser |
| Mon compte | Changer d'e-mail, régénérer les codes de secours |

**Désactiver une connexion** n'exige **pas** de réauthentification : couper doit rester rapide en cas d'incident.

### 10.5 Protection contre les attaques par force brute

- **Par compte.** Après 5 échecs, verrouillage de 15 min. Le délai double ensuite à chaque série d'échecs, jusqu'à 24 h. L'admin est prévenu par e-mail.
- **Par IP.** 20 tentatives par période de 10 min, sur la connexion, la double authentification et la réinitialisation.
- **Messages génériques.** Le **temps de réponse est constant** : un hachage factice est calculé quand l'e-mail est inconnu, pour ne pas révéler les comptes existants.
- **Double authentification.** Après 5 codes faux, la session partielle est détruite : il faut recommencer depuis le mot de passe.

### 10.6 Invitations, réinitialisation, bris de glace

- **Jetons d'invitation et de réinitialisation.** 256 bits, hachés, à usage unique. Validité : 72 h pour une invitation, 1 h pour une réinitialisation.
- **Réinitialiser le mot de passe ne contourne pas la double authentification.** Le code TOTP est demandé, puis toutes les sessions sont révoquées et un e-mail « Votre mot de passe a été modifié » est envoyé.
- **Téléphone perdu.** Un autre admin réinitialise la double authentification (réauthentification), puis l'intéressé se réenrôle.
- **Bris de glace**, quand il ne reste aucun autre admin disponible :
  - commande `heroku run python -m app.cli admin reset-mfa <email>`, exécutable uniquement avec un accès Heroku ;
  - journalisée (`actor_type = system`, `details.via = "cli"`) ;
  - e-mail envoyé à tous les admins.
- **Premier admin.** `heroku run python -m app.cli admin create --email … --name …` envoie une invitation. **Aucun compte par défaut, aucune page d'inscription.**

### 10.7 Protections web

**CSRF**

- Cookie `SameSite=Strict`, plus un jeton synchronisé, stocké en session :
  - envoyé dans `X-CSRF-Token` (HTMX : `hx-headers`) ;
  - ou dans un champ caché des formulaires.
- Les requêtes qui modifient quelque chose vérifient aussi `Origin` et `Sec-Fetch-Site`.

**CORS.** Aucun sur le domaine de gestion.

**En-têtes de réponse**

```
Strict-Transport-Security: max-age=63072000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;
                         connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: no-store                    (pages authentifiées)
X-Robots-Tag: noindex, nofollow
```

- **HTMX et CSP.** Régler `htmx.config.includeIndicatorStyles = false`. Sinon, HTMX injecte un style en ligne que `style-src 'self'` bloque.
- **HSTS `preload`.** À n'ajouter qu'après stabilisation des domaines.
- **Polices.** Elles sont auto-hébergées (§3.9), d'où `font-src 'self'` (valeur par défaut via `default-src`).
- **Carte** [Option]. Seul `img-src https://maps.googleapis.com` est ajouté, pour l'image Maps Static (§6.4). Rien d'autre n'est ouvert.

**Hôte.** Les routes d'administration ne répondent que sur le domaine de gestion (§3.2).

**Erreurs.** Jamais de trace technique affichée ; `debug=False` en production.

### 10.8 Limitation de débit et IP du client

- **IP du client.** C'est la **dernière** valeur de `X-Forwarded-For`, celle ajoutée par le routeur Heroku. Les valeurs précédentes sont fournies par le client et peuvent être falsifiées.
- **Stockage des compteurs.** Table `rate_limits` en PostgreSQL, par fenêtres fixes. C'est suffisant pour ce volume ; si le trafic grandit, passer à Heroku Key-Value Store.

```sql
INSERT INTO rate_limits (bucket, window_start, hits)
VALUES (:bucket, to_timestamp(floor(extract(epoch FROM now()) / :window_s) * :window_s), 1)
ON CONFLICT (bucket, window_start) DO UPDATE SET hits = rate_limits.hits + 1
RETURNING hits;
```

### 10.9 Journal d'audit

- **Contenu.** Toutes les actions des admins, toutes les actions du système et les événements de sécurité (catalogue en annexe B).
- **Pas de données personnelles dans `details`.** On y met des identifiants et des références, jamais de nom, de téléphone, d'adresse ni de besoin.
- **Ajout seul**, garanti par un trigger en base :

```sql
CREATE FUNCTION audit_log_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_log : modification interdite';
  END IF;
  IF coalesce(current_setting('app.audit_purge', true), '') <> 'on' THEN
    RAISE EXCEPTION 'audit_log : suppression réservée à la purge planifiée';
  END IF;
  RETURN OLD;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_guard BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_guard();
-- La purge fait : SET LOCAL app.audit_purge = 'on'; DELETE … WHERE occurred_at < … ;
```

**Chaînage des empreintes**

- Chaque entrée stocke `hash = SHA-256(prev_hash ‖ occurred_at ‖ actor ‖ action ‖ entity ‖ details canonique)`.
- L'insertion se fait sous `pg_advisory_xact_lock`, pour garder une chaîne strictement linéaire.
- Après une purge, la plus ancienne entrée conservée sert de point d'ancrage.
- La route `/audit-log/verify` recalcule la chaîne.

**Copie indépendante.** Chaque entrée est aussi écrite dans les logs applicatifs (log drain). Pour effacer une trace, il faudrait compromettre deux systèmes.

**Limite assumée.** Le trigger protège contre les erreurs et les manipulations ordinaires. Il ne résiste pas à un attaquant qui contrôlerait totalement l'application, d'où la copie externe.

### 10.10 Exports

- Réauthentification obligatoire.
- Action journalisée, avec les filtres utilisés et le nombre de lignes.
- 10 000 lignes au maximum, diffusées en flux.
- **Injection de formules.** Une cellule qui commence par `=`, `+`, `-`, `@`, une tabulation ou un retour chariot est préfixée par `'`. Sinon, Excel l'exécuterait comme une formule.
- Encodage UTF-8 avec BOM, pour Excel.
- Les besoins de santé sont exclus, sauf si l'option est cochée explicitement.

### 10.11 Validation et encodage

- **Entrées.** Modèles Pydantic stricts (`extra="forbid"`), avec une longueur maximale sur chaque champ texte.
- **Sorties.** Échappement automatique de Jinja2. `|safe` est interdit sur toute donnée venant d'un utilisateur ou d'un destinataire.
- **SQL.** Uniquement via l'ORM ou des requêtes paramétrées. Les motifs `LIKE` sont échappés (§4.3).
- **Taille des requêtes.** 64 Ko maximum par corps de requête, imposé par un middleware.

---

## 11. Sécurité de la plateforme et RGPD

### 11.1 Accès à Heroku

- MFA obligatoire, qu'Heroku impose de toute façon.
- Équipe Heroku **au nom de MBT**, conformément au contrat : abonnements au nom de l'entreprise.
- Comptes nominatifs, avec le minimum de droits.
- Revue des accès chaque trimestre.
- **Accès direct à la base de production** (`heroku pg:psql`) : action exceptionnelle, notée dans un registre (qui, quand, pourquoi).

### 11.2 Base de données

- **Plans.** Un plan **Standard** est recommandé en production, pour la restauration à un instant donné selon l'offre Heroku en vigueur. Un plan **Essential** suffit en préproduction.
- **Sauvegardes planifiées.** `heroku pg:backups:schedule DATABASE_URL --at "02:00 Europe/Brussels"`.
- **Test de restauration chaque trimestre**, sur une base temporaire. Une sauvegarde jamais restaurée n'est pas une sauvegarde.
- **Préproduction.** Jamais de copie de la production. Données fictives générées par un script de peuplement.

### 11.3 Chaîne de livraison

- **Dépôt Git.**
  - Branche principale protégée.
  - Les modifications passent par des pull requests.
  - Le code source est livré au client (R13).
- **Intégration continue :**
  - `ruff` (style et erreurs) ;
  - `mypy` (typage) ;
  - `pytest` sur un vrai PostgreSQL ;
  - audit des dépendances (`pip-audit`) ;
  - vecteur de test de signature.
- **Mises à jour de dépendances.** Automatisées (Dependabot ou Renovate), revues avant fusion.
- **Déploiement.**
  - La préproduction est déployée automatiquement.
  - La production est **promue manuellement** (Heroku Pipeline).
- **Migrations.** Rétrocompatibles, selon le schéma *expand / contract* : on ajoute, on déploie, puis on retire. Le code en cours d'exécution n'est jamais cassé.

### 11.4 Supervision

- **`/healthz`** pour une surveillance externe. Celle-ci relève de l'offre de maintenance séparée.
- **Sentry**
  - `send_default_pii=False` ;
  - un filtre `before_send` retire corps de requête, en-têtes et variables locales ;
  - échantillonnage des performances bas.
- **Logs JSON**
  - Contiennent `request_id`, `admin_id`, `demande_id`, `delivery_id`.
  - **Jamais** de nom, téléphone, e-mail, adresse, besoin, payload, secret ni jeton.
  - Envoyés à un log drain, avec une rétention de 30 jours au plus.
- **Alertes internes par e-mail.** Elles sont décrites au §8.12 et au §13.

### 11.5 Variables de configuration

Elles sont listées en annexe A.

- **Secrets.** Uniquement dans les variables Heroku, jamais dans le dépôt.
- **En local.** Fichier `.env`, exclu par `.gitignore`.
- **Vérification.** La phase `release` contrôle la présence et le format des variables obligatoires.

### 11.6 RGPD

Ces éléments sont à valider par le client et son conseil : la rédaction juridique est hors contrat.

- **Rôles**
  - MBT est **responsable du traitement**.
  - Le prestataire est **sous-traitant** pendant le développement et la maintenance, ce qui suppose un contrat de sous-traitance (article 28).
  - Les **sous-traitants ultérieurs** sont à lister dans ce contrat :
    - Heroku (Salesforce) ;
    - Resend (e-mails) ;
    - Google (Places, et Maps si la carte est retenue) ;
    - Vercel (hébergement des sites, dont les server actions traitent le contenu des formulaires) ;
    - Sentry ;
    - QuotaGuard, si les IP fixes sont retenues.
  - Chaque destinataire de webhooks (Taxiger…) est un **sous-traitant de MBT**. Il faut un contrat MBT ↔ destinataire **avant** d'envoyer des données réelles, et a fortiori des données de santé.
- **Données de santé**
  - Les besoins de mobilité relèvent de l'**article 9**.
  - Base légale à valider : consentement explicite, avec une case dédiée dans le formulaire et dans le compte.
  - Minimisation, accès restreint aux admins, non transmises par défaut.
- **Analyse d'impact (AIPD).** **Recommandée** : personnes vulnérables et données de santé.
- **Transferts hors UE**
  - La région `eu` héberge les données dans l'UE.
  - Mais Heroku appartient à une société américaine. Il faut vérifier le contrat de traitement de Salesforce et le mécanisme de transfert (Data Privacy Framework ou clauses contractuelles types).
  - C'est une **décision du client** (§17).
- **Registre des traitements.** [Reco] Fournir au client une fiche « Demandes de transport » : finalités, données, durées, destinataires, mesures de sécurité.
- **Droits des personnes**
  - Accès : export JSON (§6.5).
  - Rectification : par le passager, ou par MBT sur demande.
  - Effacement : anonymisation.
  - Délai de réponse : 1 mois.
- **Violation de données.** Procédure au §11.7. Notification à l'Autorité de protection des données sous 72 h, par MBT.
- **Information des personnes.** Mentions sur le formulaire et politique de confidentialité, fournies par le client.

### 11.7 Réponse à incident

| Incident | Actions immédiates |
|---|---|
| Secret d'une connexion divulgué | Rotation en mode **urgence** ; revue du journal des envois ; information du destinataire |
| Compte admin compromis | Désactiver le compte (sessions révoquées) ; examiner l'audit (connexions créées ou modifiées ? exports ?) ; désactiver toute connexion suspecte ; réinitialiser mot de passe et double authentification ; informer MBT (violation potentielle) |
| Connexion inconnue détectée | Désactiver, puis archiver ; examiner l'audit pour identifier l'auteur ; traiter comme un compte admin compromis |
| Clé maîtresse exposée | Nouvelle clé et rechiffrement ; **rotation de tous les secrets de connexion** ; réenrôlement de la double authentification de tous les admins |
| Fuite de la base | Par précaution, rotation des secrets (la clé maîtresse n'est pas en base) ; évaluation du risque ; notification à l'Autorité de protection des données sous 72 h ; information des personnes si le risque est élevé |

---

## 12. Worker et tâches planifiées

### 12.1 Tâches

| Tâche | Fréquence | Rôle |
|---|---|---|
| `deliver_webhooks` | En continu (toutes les 2 s) | Réserve et envoie les webhooks dus (§8.5) |
| `send_emails` | En continu (toutes les 2 s) | Même mécanisme pour les e-mails |
| `reclaim_expired_leases` | Chaque minute | Remet en `pending` les envois dont le bail a expiré |
| `heartbeat` | Toutes les 30 s | Met à jour `worker_heartbeats` |
| `alert_stale_requests` | Toutes les 5 min | Alerte quand une demande `received` attend depuis trop longtemps (une seule alerte par demande) |
| `auto_close_demandes` | Toutes les heures, et au démarrage | Clôture automatique (§5.5) |
| `expire_previous_secrets` | Toutes les heures | Détruit les anciens secrets après 24 h de rotation |
| `retention_purge` | Chaque jour à 03:00, heure de Bruxelles | Anonymisation et purge (§4.4) |
| `daily_digest` | Chaque jour à 08:00 | Récapitulatif : demandes à régulariser, envois en échec |
| `weekly_endpoints_report` | Chaque lundi à 08:00 | Connexions actives et volumes envoyés (§9.6) |

### 12.2 Exécution unique

Chaque tâche planifiée est protégée par un **verrou consultatif de session**. Même avec deux workers, une seule exécution a lieu. Si la connexion tombe, le verrou est libéré automatiquement.

```python
async def run_job(name: str, fn: Callable[[], Awaitable[int]]) -> None:
    async with engine.connect() as conn:                     # connexion dédiée pendant toute la tâche
        got_lock = await conn.scalar(text("SELECT pg_try_advisory_lock(hashtext(:n))"), {"n": name})
        if not got_lock:
            return                                           # un autre worker s'en occupe
        try:
            if await is_due(conn, name):                     # lit job_runs
                await mark_started(conn, name)
                processed = await fn()
                await mark_finished(conn, name, "ok", processed)
        except Exception as exc:
            await mark_finished(conn, name, "error", 0, error=type(exc).__name__)
            raise
        finally:
            await conn.execute(text("SELECT pg_advisory_unlock(hashtext(:n))"), {"n": name})
```

### 12.3 Arrêt propre

Sur `SIGTERM`, Heroku laisse 30 s avant `SIGKILL`.

1. On cesse de réserver de nouveaux envois.
2. On attend la fin des envois en cours, 20 s au maximum.
3. On quitte.

Ce qui n'a pas pu se terminer sera repris grâce aux baux (§8.5).

---

## 13. Notifications e-mail

| Déclencheur | Destinataire | Périmètre |
|---|---|---|
| Nouvelle demande | Adresses de MBT (`company.notification_emails`) | [Contrat] |
| Accusé de réception, qui précise que la demande reste à confirmer | Passager | [Contrat] |
| Demande confirmée, refusée (avec motif) ou annulée par MBT | Passager | [Ajout] / [Reco] |
| Annulation par le passager | MBT et passager | [Ajout] |
| Demande non traitée depuis plus de N min | Admins | [Reco] |
| Envoi passé en `failed`, tentative bloquée par la protection SSRF | Admins (et contact de sécurité pour la SSRF) | [Reco] |
| Création, modification, activation, rotation ou archivage d'une connexion ; activation des données de santé | **Tous** les admins et le contact de sécurité | [Reco], sécurité |
| Invitation, réinitialisation, mot de passe modifié, verrouillage, double authentification réinitialisée | Admin concerné | [Reco] |
| Récapitulatif quotidien, rapport hebdomadaire des connexions | Admins | [Reco] |

- **Langue.** Les e-mails aux passagers sont envoyés dans la langue de la demande (FR, NL ou EN). Les traductions sont fournies ou validées par le client, comme le prévoit le contrat.
- **Fournisseur : Resend**, choix déjà fait dans le projet.
  - Il est appelé **uniquement par l'API**, via l'outbox (`email_outbox`), avec nouvelles tentatives. Les sites n'envoient jamais d'e-mail eux-mêmes.
  - Choisir une **région d'envoi européenne** si Resend la propose pour le domaine, et signer son contrat de traitement des données (§17, D26).
- **Délivrabilité.**
  - Domaine d'envoi dédié, par exemple `notifications.mbttaxis.be`, vérifié dans Resend, avec **SPF, DKIM et DMARC** configurés. Sans eux, les e-mails finissent en spam.
  - `RESEND_FROM_EMAIL` utilise ce sous-domaine plutôt que `mbttaxis.be`, pour protéger la réputation du domaine principal.
- **Contenu de l'e-mail « nouvelle demande ».** Le contrat prévoit qu'il contient la demande. Les besoins de santé y transitent donc par le fournisseur d'e-mails. [Option] Variante plus sobre : un e-mail avec la référence, l'heure et un lien vers l'espace de gestion.
- **E-mails de sécurité.** Ils ne contiennent jamais de secret, de jeton ni de donnée de santé.

---

## 14. Paramètres

**Modifiables dans l'espace de gestion.** Toute modification exige une réauthentification et est journalisée avec la valeur avant et après.

| Clé | Défaut | Bornes | Description |
|---|---|---|---|
| `company.notification_emails` | Reprise de `ADMIN_NOTIFY_EMAILS` au premier démarrage | 1 à 5 adresses | Destinataires des nouvelles demandes ; ensuite modifiables ici uniquement |
| `company.public_phone` | (à fournir) | E.164 | Numéro affiché aux passagers et dans les e-mails |
| `passenger.cancellation_deadline_hours` | 24 | 0 à 72 | Délai minimal pour qu'un client annule une demande confirmée |
| `auto_close.enabled` | `true` | — | Clôture automatique (§5.5) |
| `auto_close.delay_hours` | 12 | 1 à 72 | Délai après l'heure de référence |
| `requests.stale_alert_minutes` | 30 | 5 à 240 | Seuil d'alerte pour une demande non traitée |
| `requests.correction_window_days` | 30 | 1 à 90 | Fenêtre de correction terminée ↔ non effectuée |
| `retention.demandes_months` | 12 | 1 à 60 | Durée de conservation des demandes (R6) |
| `retention.audit_months` | 24 | 12 à 60 | Durée de conservation du journal d'audit |
| `retention.inactive_passenger_months` | 24 | 6 à 60 | Inactivité avant anonymisation d'un compte passager |
| `security.contact_email` | (prestataire) | 1 adresse | Copie des alertes de sécurité |
| `requests.min_lead_minutes` | 60 | 0 à 2 880 | Délai minimal entre l'envoi d'une demande et la prise en charge (§18.7, D27) |
| `mobile.min_supported_version` | `1.0.0` | Version sémantique | En dessous, l'API répond `426` et l'application demande une mise à jour (§18.6) |

Les paramètres sont lus en base, avec un cache de 30 s par processus.

**Réservés à la configuration Heroku** (non modifiables dans l'interface, annexe A) :

- `WEBHOOK_ALLOWED_HOSTS` ;
- `WEBHOOK_ALLOWED_PORTS` ;
- clés de chiffrement ;
- proxy à IP fixe.

---

## 15. Tests et critères d'acceptation

### 15.1 Stratégie de test

- **Tests unitaires**
  - Machine à états : toutes les paires (statut de départ, statut d'arrivée) pour chaque acteur, plus les règles métier (délais, motifs, fenêtre de correction).
  - Signature, avec le vecteur de test.
  - Validation des URL.
  - Filtre IP.
- **Tests d'intégration sur un vrai PostgreSQL**
  - Atomicité de l'outbox : une transaction annulée ne laisse **aucun** envoi.
  - `SKIP LOCKED` avec deux workers simultanés.
  - Reprise des baux.
  - Clôture automatique.
- **Webhooks de bout en bout**
  - Un récepteur HTTPS local (certificat d'une autorité de test) vérifie la signature.
  - **Politique IP injectée.** En test, une politique qui autorise `127.0.0.1` est **injectée par le code de test**, jamais activée par une variable d'environnement. Aucune configuration de production ne peut ainsi désactiver la protection SSRF.
- **Autorisations, test exhaustif.** Un test paramétré parcourt **toutes** les routes du routeur d'administration et vérifie :
  - `401` sans session ;
  - `403 step_up_required` sur les routes marquées S.

  Une route ajoutée plus tard sans protection fait échouer la CI.
- **Accessibilité.** Contrôle automatique axe sur les écrans principaux, et navigation au clavier.
- **Charge légère.** Création de 1 000 demandes : la file d'envois revient à zéro en moins de 2 min, avec un destinataire qui répond en 200 ms.

### 15.2 Critères d'acceptation

| ID | Réf. | Critère |
|---|---|---|
| CA-01 | R1, R3 | Une demande créée depuis chacune des 4 origines apparaît dans la liste en moins de 5 s, avec la bonne origine. |
| CA-02 | R2 | La recherche retrouve une demande : par nom partiel sans accent (« lefevre » trouve « Lefèvre ») ; par téléphone sous 3 formes (« 0470 12 34 56 », « +32470123456 », « 470123456 ») ; par référence ; par fragment d'adresse. |
| CA-03 | R4 | Chaque transition du §5.3 est possible pour l'acteur prévu et impossible pour les autres (`409`). Elle apparaît dans la chronologie avec l'acteur, l'heure et le motif. |
| CA-04 | R4 | Deux admins confirment la même demande en même temps : un seul réussit, l'autre reçoit le message de rechargement (`412`). |
| CA-05 | R5 | Toute route d'administration renvoie `401` sans session. Une session dont la double authentification n'est pas validée n'accède qu'à `/auth/mfa`. |
| CA-06 | R5 | Les routes marquées S renvoient `403 step_up_required` sans réauthentification récente. |
| CA-07 | R6 | Une demande clôturée depuis plus longtemps que la durée de conservation est anonymisée par la purge du jour ; ses payloads d'envoi sont effacés. |
| CA-08 | R7, R11 | Un admin ajoute une connexion, la teste, l'active puis la désactive, sans aucun déploiement. |
| CA-09 | R7 | Une connexion ne peut pas être activée sans un test réussi dans les 24 dernières heures. |
| CA-10 | R8 | Chaque tentative apparaît dans le journal avec l'heure, la durée, l'IP contactée et le code HTTP ou le type d'erreur. |
| CA-11 | R9 | Un destinataire répond `500` : les tentatives suivent le calendrier du §8.6. Quand il répond de nouveau `200`, l'envoi passe en succès. Après 7 échecs, l'envoi passe en `failed` et un e-mail part aux admins. |
| CA-12 | R9 | La relance manuelle d'un envoi `failed` produit une tentative immédiate, avec le même `webhook-id`. |
| CA-13 | R10 | Un développeur tiers, muni du seul guide d'intégration, valide le vecteur de test puis un envoi réel en moins d'une demi-journée. |
| CA-14 | R4 | Clôture automatique : tous les tests du §5.5 passent. |
| CA-15 | — | Sécurité des webhooks : tous les tests du §9.13 passent et la liste de contrôle du §9.12 est entièrement cochée. |
| CA-16 | — | Le secret n'est renvoyé qu'à la création et à la rotation. Il n'apparaît dans aucun log ni dans Sentry. |
| CA-17 | — | Rotation progressive : pendant 24 h, un récepteur configuré avec l'ancien secret **et** un récepteur configuré avec le nouveau valident tous deux les messages. |
| CA-18 | — | Le worker redémarre pendant un envoi : aucun envoi n'est perdu, au pire un doublon portant le même `webhook-id`. |
| CA-19 | — | Toute action sensible sur une connexion envoie un e-mail à tous les admins actifs. |
| CA-20 | — | Aucune donnée de santé dans le payload quand l'option est désactivée. |
| CA-21 | — | Les écrans Demandes et Connexions se parcourent entièrement au clavier ; axe ne signale aucun défaut bloquant. |

### 15.3 Recette et cycles de révision [Contrat R12]

1. **Démonstration** en préproduction, avec des données fictives.
2. **Retours.** Le client transmet **une seule liste consolidée** de remarques par cycle. **3 cycles** sont prévus pour l'étape « espace de gestion et connexions ».
3. **Corrections**, puis nouvelle démonstration.
4. **Validation écrite** : procès-verbal de recette, qui fait démarrer la garantie de 90 jours (R13).

Les corrections de défauts ne consomment pas de cycle. Une demande nouvelle, hors de cette spécification, est chiffrée à part.

---

## 16. Plan de réalisation

| Lot | Contenu | Durée indicative | Démarrage |
|---|---|---|---|
| L1 Socle | Projet `apps/api`, CI (dont les contrôles OpenAPI et CSS), applications Heroku (préproduction et production, `eu`, buildpacks monorepo), base, migrations, configuration, chiffrement, audit, `packages/brand` | 3,5 j | Dès la semaine 4 : les sites en ont besoin |
| L2 Authentification | Connexion, double authentification, sessions, réauthentification, invitations, anti-force brute, commandes CLI | 3 j | Après L1 |
| L3 Demandes | Modèle, machine à états, API de création partagée avec les sites et l'application, liste, recherche, fiche, notes, e-mails | 5 j | Après L1 ; la création de demande est livrée en premier |
| L4 Webhooks | Connexions, outbox, worker, signature, SSRF, test, relance, journal, rotation, notifications | 5 j | Après L3 |
| L5 Tâches et paramètres | Clôture automatique, purge, alertes, récapitulatifs, paramètres | 2 j | Après L3 |
| L6 Passagers (côté gestion) | Liste, fiche, désactivation, export, anonymisation | 1,5 j | Après L3 et le compte client |
| L7 Durcissement et recette | Tests de sécurité, liste de contrôle, guide d'intégration finalisé, documentation d'exploitation, 3 cycles de recette | 3,5 j | Fin |
| L8 Compte client et application [Ajout] | Routes `/v1/auth` et `/v1/me`, jetons de l'application, `packages/api-client`, branchement des server actions des sites (§18) | À estimer séparément | Après L3 |

- **Total indicatif.** Environ **23,5 jours de développement** pour L1 à L7, compatibles avec la fenêtre « espace de gestion et connexions » du plan général (semaines 9 à 13). L8 relève du compte client offert et s'estime à part.
- **Condition.** L1 et la création de demande (L3) doivent démarrer plus tôt, car le formulaire des sites et l'application en dépendent.

**Livrables (R13)**

- Code source dans un dépôt Git.
- Accès au nom de MBT : Heroku, fournisseur d'e-mails, Sentry.
- Guide d'intégration des destinataires.
- **Documentation d'exploitation** : déploiement, restauration, rotation des clés, bris de glace, réponse à incident.
- Procès-verbal de recette.

---

## 17. Décisions à prendre avec le client

| # | Sujet | Recommandation | Décision |
|---|---|---|---|
| D1 | Liste des admins (noms, e-mails) | Comptes nominatifs, au moins 2 personnes chez MBT | |
| D2 | Durée de conservation des demandes | 12 mois après la clôture | |
| D3 | Durée de conservation du journal d'audit | 24 mois | |
| D4 | Délai d'annulation par le passager | 24 h | |
| D5 | Délai de clôture automatique | 12 h | |
| D6 | Motifs de refus prédéfinis | Liste du §6.4 | |
| D7 | Taxiger : accepte-t-il des webhooks ? Quel format, quelle authentification, faut-il une liste blanche d'IP ? | Demander dès cette semaine | |
| D8 | Événements par destinataire | `demande.confirmed` et `demande.cancelled` pour un logiciel de dispatch | |
| D9 | Transmission des besoins de mobilité à chaque destinataire | Non par défaut ; oui seulement avec un contrat de traitement signé | |
| D10 | Liste blanche de domaines (`WEBHOOK_ALLOWED_HOSTS`) | Oui, dès que les destinataires sont connus | |
| D11 | Validation à 4 yeux | Non en v1 (équipe réduite) | |
| D12 | IP de sortie fixes (QuotaGuard) | Seulement si un destinataire l'exige | |
| D13 | Fournisseur d'e-mails et domaine d'envoi | Fournisseur hébergé dans l'UE, `notifications.mbttaxis.be` | |
| D14 | Domaine de l'espace de gestion | `gestion.mbttaxis.be` | |
| D15 | Heroku (société américaine) et transferts de données | Validation par le client ou son DPO | |
| D16 | Formalisation du compte client offert | E-mail validé ou avenant (§1.3) | |
| D17 | Rapprochement futur avec Taxiger (statut de course) | Évolution à chiffrer, si Taxiger sait envoyer des webhooks | |
| D18 | Contenu de l'e-mail « nouvelle demande » | Contrat : avec la demande. Variante sobre en option (§13) | |
| D19 | Nom en deux champs (prénom, nom) dans les formulaires | Oui : un nom unique se découpe mal, et les destinataires attendent deux champs | |
| D20 | Date et heure du retour dans le formulaire, pour un aller-retour | Oui : sinon l'option « aller-retour » est inexploitable | |
| D21 | Consentement santé distinct dès qu'un besoin de mobilité est indiqué | Oui (RGPD, art. 9) | |
| D22 | Formulaires adaptation, location-vente, devis et contact | E-mail uniquement en v1, via `POST /v1/messages`, hors du cycle de vie des demandes | |
| D23 | Simulateur de prix de handycab.be (aléatoire aujourd'hui) | Le retirer et le remplacer par le parcours de demande ; un vrai simulateur serait une option | |
| D24 | Google Places et carte dans l'admin | Places : oui, pour la qualité des adresses. Carte : image statique signée, en option | |
| D25 | Région des fonctions serveur des sites (Vercel) | Région européenne. À vérifier : la région par défaut de Vercel est aux États-Unis | |
| D26 | Resend : région d'envoi et contrat de traitement des données | Région européenne si disponible ; contrat signé | |
| D27 | Délai minimal entre l'envoi d'une demande et la prise en charge | À fixer par MBT ; 60 min par défaut (`requests.min_lead_minutes`) | |

---

## 18. API publique `/v1` : sites et application mobile

L'espace de gestion n'est qu'un des clients du cœur métier. Les sites et l'application mobile utilisent la même logique, exposée sous `/v1`.

Il n'y a donc rien à « extraire » pour le mobile : `/v1` est conçue pour lui dès le départ.

Périmètre :
- la création de demande par un invité est [Contrat] ;
- le compte client et ses routes sont [Ajout] (§1.3).

### 18.1 Deux sous-applications, une seule logique métier

```python
# apps/api/app/main.py
from fastapi import FastAPI
from starlette.applications import Starlette
from starlette.routing import Host

from app.admin import routes as admin_routes
from app.api.v1 import auth, config, demandes, me, messages
from app.config import settings
from app.health import healthz

public = FastAPI(
    title="HandyCab API",
    version="1",
    docs_url=None if settings.is_production else "/docs",   # documentation interactive hors production
    redoc_url=None,
)
for router in (demandes.router, messages.router, auth.router, me.router, config.router):
    public.include_router(router)

api_host = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
api_host.mount("/v1", public)
api_host.add_api_route("/healthz", healthz)

admin = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)   # aucun schéma exposé
admin.include_router(admin_routes.router)
admin.add_api_route("/healthz", healthz)

app = Starlette(routes=[
    Host(settings.public_api_host, app=api_host),   # api.handycab.be (en local : api.localhost)
    Host(settings.admin_host, app=admin),           # gestion.mbttaxis.be (en local : gestion.localhost)
])                                                  # tout autre hôte, dont *.herokuapp.com : 404
```

- **Routeurs minces.**
  - Ils valident l'entrée, appellent `app/domain/` et mettent en forme la réponse.
  - Une règle métier, comme « un client peut annuler jusqu'à 24 h avant », n'existe qu'**une fois**. Elle vaut pour le web, l'application et l'admin.
- **OpenAPI.**
  - Seule la sous-application `public` en produit un.
  - `python -m app.cli export-openapi` l'écrit dans `packages/api-client/openapi.json`, avec des clés triées : deux exports successifs donnent exactement le même fichier.
- **Middlewares propres à chaque sous-application.**
  - `admin` : en-têtes de sécurité, CSRF, cookies de session.
  - `public` : limitation de débit, contrôle de la version de l'application, clés des sites.

### 18.2 Routes `/v1`

| Domaine | Route | Rôle | Accès |
|---|---|---|---|
| Demandes | `POST /v1/demandes` | Création par un invité (via un site) ou par un client connecté. En-tête `Idempotency-Key` obligatoire (§18.7) | Clé de site ou application ; jeton client facultatif |
| Messages | `POST /v1/messages` | Formulaires qui ne sont pas des demandes de course : contact, devis, adaptation, location-vente. Envoie un e-mail, hors du cycle de vie (§19) | Clé de site |
| Authentification | `POST /v1/auth/register` | Inscription : e-mail, mot de passe, prénom, nom, téléphone, langue. Envoie l'e-mail de vérification | Clé de site ou application |
| | `POST /v1/auth/verify-email` | Valide le jeton reçu par e-mail | Public |
| | `POST /v1/auth/token` | E-mail et mot de passe ; renvoie un jeton d'accès et un jeton de rafraîchissement | Clé de site ou application |
| | `POST /v1/auth/refresh` | Rotation du jeton de rafraîchissement (§18.3) | Jeton de rafraîchissement |
| | `POST /v1/auth/logout` | Révoque la famille de jetons de l'appareil | Jeton client |
| | `POST /v1/auth/password/forgot`, `POST /v1/auth/password/reset` | Réinitialisation du mot de passe | Public |
| Profil | `GET /v1/me`, `PATCH /v1/me` | Profil, besoins par défaut (avec consentement explicite) | Jeton client |
| | `GET /v1/me/addresses`, `POST /v1/me/addresses`, `DELETE /v1/me/addresses/{id}` | Adresses favorites | Jeton client |
| | `GET /v1/me/export` | Export de ses données (RGPD) | Jeton client |
| | `DELETE /v1/me` | Suppression du compte (anonymisation, mêmes règles qu'au §6.5) ; mot de passe demandé | Jeton client |
| Demandes du client | `GET /v1/me/demandes?scope=upcoming&cursor=…` | Liste paginée par curseur ; `scope=past` pour l'historique | Jeton client |
| | `GET /v1/me/demandes/{id}` | Détail, avec le statut et l'éventuel motif de refus | Jeton client |
| | `POST /v1/me/demandes/{id}/cancel` | Annulation (T4, T6) dans le délai autorisé, avec `If-Match` | Jeton client |
| | `POST /v1/me/demandes/{id}/repeat` | Renvoie un **brouillon** pré-rempli, sans date ; ne crée rien | Jeton client |
| Configuration | `GET /v1/config` | Téléphone public, délai d'annulation, délai minimal, listes (services, aides à la mobilité), version minimale de l'application | Public |

- **Propriété vérifiée à chaque requête.** Les routes `/v1/me/...` ne renvoient que les données du client authentifié. Connaître l'identifiant d'une demande ne suffit jamais pour y accéder.
- **Réponse à un invité.** Elle ne contient **aucune donnée personnelle** : uniquement `id`, `reference` et `status`.

### 18.3 Authentification des clients [Ajout]

| Client | Mécanisme |
|---|---|
| **Application mobile** | Jeton d'accès JWT de 15 min, signé en HS256 avec `SECRET_KEY` (`aud = handycab-v1`). Jeton de rafraîchissement opaque de 30 jours, à rotation. Stockage dans `expo-secure-store` (Keychain / Keystore), jamais dans AsyncStorage. |
| **Sites** (compte client) | Le navigateur ne voit **aucun jeton**. Les server actions et route handlers Next.js conservent les jetons dans un cookie `__Host-` du site (`HttpOnly; Secure; SameSite=Lax`) et appellent l'API de serveur à serveur. |
| **Espace de gestion** | Session par cookie `__Host-session` (§10.3), totalement indépendante des comptes clients. |

**Pourquoi ce choix pour les sites**

- `mbttaxis.be`, `handycab.be` et `api.handycab.be` sont des sites différents pour le navigateur. Un cookie posé par l'API serait un cookie tiers, que les navigateurs bloquent.
- Avec les server actions, il n'y a ni CORS ni cookie tiers. L'API ne connaît qu'un seul mécanisme, le jeton Bearer, pour le web comme pour le mobile.
- `SameSite=Lax` plutôt que `Strict` : un lien ouvert depuis un e-mail arrive ainsi sur une session déjà active.

**Rotation du jeton de rafraîchissement, avec détection de réutilisation**

```sql
CREATE TABLE passenger_refresh_tokens (
  id            uuid PRIMARY KEY,
  passenger_id  uuid NOT NULL REFERENCES passengers(id) ON DELETE CASCADE,
  family_id     uuid NOT NULL,                 -- une famille par connexion (appareil ou navigateur)
  token_hash    bytea NOT NULL UNIQUE,         -- SHA-256 ; le jeton n'est jamais stocké
  client        text NOT NULL CHECK (client IN ('site_mbt','site_handycab','app_ios','app_android')),
  device_label  text,                          -- ex. « iPhone de Marie », affiché au client
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL,
  used_at       timestamptz,                   -- renseigné lors de la rotation
  revoked_at    timestamptz
);
CREATE INDEX refresh_tokens_family ON passenger_refresh_tokens (family_id);
```

1. **Une famille par connexion.** Chaque connexion d'un appareil ou d'un navigateur ouvre une famille de jetons.
2. **Rotation normale.** Un jeton valide et non utilisé, présenté à `/v1/auth/refresh`, est marqué utilisé. L'API émet un nouveau jeton de la même famille et un nouveau jeton d'accès.
3. **Réutilisation d'un jeton déjà utilisé.**
   - Toute la famille est révoquée, l'API répond `401` et l'audit enregistre `passenger.token_reuse_detected`.
   - C'est le signe d'un jeton volé : le voleur et la victime ne peuvent plus continuer tous les deux.
4. **Tolérance réseau.** Une réutilisation dans les **30 s** qui suivent la rotation n'est pas traitée comme un vol (réponse perdue sur un réseau mobile). Une nouvelle paire est émise et le successeur précédent est révoqué.
5. **Contrôle à chaque requête.** À chaque requête, l'API vérifie que la famille n'est pas révoquée et que le compte est actif (requête indexée). Une désactivation depuis l'admin prend donc effet immédiatement, et non 15 min plus tard.
6. **Révocation globale.** Un changement de mot de passe, une désactivation ou une anonymisation révoquent toutes les familles.
7. **Force brute.** Mêmes règles que pour les admins (§10.5) sur `/v1/auth/token`, par compte et par IP du visiteur.
8. **E-mail vérifié.** Il est obligatoire pour faire une demande depuis un compte : sinon, n'importe qui pourrait faire envoyer les e-mails de statut à l'adresse d'un autre. Le parcours invité reste ouvert à tous.
9. **Rotation de `SECRET_KEY`.** `SECRET_KEY_PREVIOUS` reste accepté en vérification pendant 15 min, la durée de vie d'un jeton d'accès.

### 18.4 Appels des sites : server actions (BFF)

- **Point de branchement existant.** `apps/mbttaxis/src/app/actions/forms.ts` valide déjà les formulaires avec Zod dans des server actions, puis simule l'envoi. Brancher l'API revient à remplacer la simulation par un appel : l'interface ne change pas.
- **Clé de site.**
  - Chaque site a sa clé, `API_BFF_KEY`. C'est une variable **serveur** du site, jamais `NEXT_PUBLIC_`.
  - Le site l'envoie dans l'en-tête `X-Client-Key`. L'API connaît les clés via `BFF_KEYS` et en déduit l'origine.
- **Origine authentifiée (R3).**
  - `origin` vient de la clé, pas d'un champ du formulaire : une requête ne peut pas se faire passer pour l'autre site.
  - Pour l'application, `app_ios` ou `app_android` vient de l'en-tête `X-App-Platform`. C'est déclaratif, mais suffisant pour des statistiques.
- **IP du visiteur.**
  - Le site la transmet dans `X-End-User-IP` (sur Vercel, elle est fournie par l'en-tête `x-real-ip`).
  - L'API ne fait confiance à cet en-tête **que si la clé de site est valide**. Sinon, elle applique la règle du §10.8.
  - La limitation de débit vise ainsi le visiteur, et non le serveur du site.
- **Erreurs.** L'API répond en `problem+json`, avec les erreurs par champ. Le site les convertit dans la forme `FormState.errors` déjà utilisée.
- **Rotation des clés.** `BFF_KEYS` accepte temporairement deux clés pour un même site.
- **Logs.** Les `console.info("[mock] …", parsed.data)` actuels sont à supprimer au branchement : les logs de l'hébergeur conserveraient des données personnelles.

```ts
// apps/mbttaxis/src/app/actions/forms.ts : forme cible (extrait)
"use server";
import { headers } from "next/headers";
import { api } from "@mbt/api-client/server";   // openapi-fetch ; baseUrl = API_URL + "/v1" ; clé du site

export async function submitReservation(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = reservationSchema.safeParse(/* … validation inchangée … */);
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const { error } = await api.POST("/demandes", {
    params: { header: { "Idempotency-Key": String(formData.get("idempotencyKey")) } }, // UUID créé à l'affichage
    headers: { "X-End-User-IP": (await headers()).get("x-real-ip") ?? "" },
    body: toDemandeCreate(parsed.data),         // conversion formulaire → contrat de l'API (§18.7)
  });
  if (error) return problemToFormState(error);   // erreurs de champ → FormState.errors
  return { ok: true };
}
```

### 18.5 Client TypeScript généré

```
apps/api ──(python -m app.cli export-openapi)──► packages/api-client/openapi.json (versionné)
                                                        │ openapi-typescript
                                                        ▼
                                          packages/api-client/src/schema.d.ts
                                          + client openapi-fetch
                                                        │
                                  ┌─────────────────────┼─────────────────────┐
                                  ▼                     ▼                     ▼
                           apps/mbttaxis          apps/handycab          apps/mobile
```

- **Génération.** `openapi.json` est versionné et régénéré par `turbo run openapi`, avec un contrôle en CI (§3.8). Les types sont générés par `openapi-typescript` ; le client `openapi-fetch` est léger et fonctionne en Next.js comme en React Native.
- **Deux points d'entrée :**
  - `@mbt/api-client` : types et fabrique de client, utilisables partout ;
  - `@mbt/api-client/server` : client préconfiguré avec `API_URL` et `API_BFF_KEY`. Il importe le paquet `server-only`, ce qui l'empêche d'être inclus dans le code envoyé au navigateur : la clé du site ne peut pas fuiter.
- **Détection des ruptures** [Reco]. En CI, `oasdiff` compare l'OpenAPI de la branche à celui de `main` et échoue sur tout changement incompatible de `/v1` (§18.6).
- **Validation.** Les sites gardent leurs schémas Zod pour l'expérience utilisateur (messages immédiats en français). L'API reste la seule référence : ce qu'elle refuse est refusé, quoi qu'en dise le formulaire.

### 18.6 Contraintes propres à l'application mobile

- **Compatibilité.**
  - D'anciennes versions de l'application restent installées pendant des mois.
  - `/v1` n'évolue que par ajouts. Un changement incompatible passe par `/v2`, servie en parallèle.
  - `/v1` est maintenue jusqu'à ce que la version minimale exclue les applications qui l'utilisent.
- **Mise à jour forcée.**
  - L'application envoie `X-App-Version` et `X-App-Platform`.
  - Sous `mobile.min_supported_version` (§14), l'API répond `426` avec le code `app_update_required`.
  - L'application affiche alors un écran de mise à jour, avec le lien vers le store.
- **Idempotence.** `Idempotency-Key` est obligatoire sur `POST /v1/demandes` : les réseaux mobiles renvoient des requêtes.
- **Erreurs.** Format `problem+json`, avec un `code` stable (`cancellation_too_late`, `health_consent_required`…). L'application traduit elle-même en FR, NL ou EN.
- **Pagination par curseur** pour « Mes demandes » : la liste reste stable même si de nouvelles demandes arrivent.
- **Pas de notifications push** (exclues du contrat). Le statut arrive par e-mail ; l'application se rafraîchit à l'ouverture et quand on tire l'écran vers le bas.
- **Heure de Bruxelles.** L'application envoie l'heure telle que saisie (§18.7), jamais convertie selon le fuseau du téléphone. Un téléphone réglé sur un autre fuseau ne décale pas la course.
- **Clés Google.** Celles embarquées dans l'application sont extractibles. Les restreindre à l'identifiant de l'application (bundle iOS, paquet Android et empreinte du certificat) et fixer des quotas.
- [Option] App Attest (iOS) et Play Integrity (Android), pour limiter les appels à l'API par des scripts.

### 18.7 Contrat d'entrée : création d'une demande

```json
{
  "service": "pmr",
  "pickup_at": "2026-11-28T08:30",
  "pickup": {
    "formatted": "Avenue Louise 100, 1050 Ixelles",
    "place_id": "ChIJ…",
    "instructions": "Sonner au 3e, ascenseur disponible"
  },
  "dropoff": { "formatted": "Route de Lennik 808, 1070 Anderlecht", "place_id": "ChIJ…" },
  "return_at": "2026-11-28T12:00",
  "return_pickup": null,
  "passenger_count": 2,
  "passenger": {
    "first_name": "Marie",
    "last_name": "Exemple",
    "phone": "+32470000000",
    "email": "marie.exemple@example.com",
    "language": "fr"
  },
  "needs": {
    "mobility_aid": "manual_wheelchair",
    "stays_in_wheelchair": true,
    "companions": 1,
    "door_to_door": true,
    "notes": null
  },
  "health_consent": true,
  "privacy_consent": true,
  "comment": "Rendez-vous à 9 h",
  "places_session_token": "…",
  "antispam": { "hp": "", "elapsed_ms": 18450 }
}
```

- **Heures.**
  - `pickup_at` et `return_at` sont des heures **locales de Bruxelles, sans décalage** (`AAAA-MM-JJTHH:MM`). L'API les convertit avec `zoneinfo("Europe/Brussels")`, en un seul endroit pour le web et le mobile.
  - Une heure qui n'existe pas (passage à l'heure d'été, par exemple le 29/03 à 02:30) donne `422`, code `nonexistent_local_time`.
  - Une heure ambiguë (passage à l'heure d'hiver) est interprétée comme la première occurrence.
  - Bornes : au moins `requests.min_lead_minutes` dans le futur (§14), au plus 12 mois.
- **Service.** `business`, `daily`, `vsl` ou `pmr`. Pour HandyCab, le site impose `pmr`.
- **Adresses.**
  - `formatted` est obligatoire, `place_id` facultatif.
  - Si `place_id` est fourni, l'API appelle Google Place Details : clé serveur, délai de 2 s, champs limités aux composants d'adresse et à la position. Elle transmet `places_session_token`, ce qui clôt la session d'autocomplétion pour la facturation Google.
  - Si Google ne répond pas, la demande est enregistrée avec la seule adresse `formatted`. **Un service externe ne bloque jamais une demande.**
- **Aller-retour.** `return_at` doit être postérieur à `pickup_at`. Le retour part de la destination, sauf si `return_pickup` est fourni.
- **Besoins.**
  - `needs` n'est accepté qu'avec `health_consent: true`. Sinon : `422`, code `health_consent_required`.
  - `mobility_aid` : `none`, `walking_aid`, `manual_wheelchair`, `electric_wheelchair` ou `other`. Avec `other`, `needs.notes` est obligatoire.
- **Passagers.** `passenger_count` de 1 à 8, accompagnants compris. `needs.companions` est inférieur à `passenger_count`.
- **Coordonnées.**
  - Prénom, nom et téléphone (normalisé en E.164).
  - **E-mail obligatoire** : l'accusé de réception est contractuel.
  - Pour un client connecté, ces coordonnées viennent du profil.
- **Consentement.** `privacy_consent: true` est obligatoire ; il correspond à la case `consent` actuelle.
- **Anti-spam** [Contrat]
  - Champ piège `antispam.hp`, qui doit rester vide.
  - `antispam.elapsed_ms` d'au moins 3 000 : un robot remplit un formulaire en quelques millisecondes. C'est un simple frein, falsifiable.
  - Limites : 5 demandes par 10 min et 20 par jour pour une même IP de visiteur ; 10 par jour pour une même adresse e-mail.
  - En cas de refus, la réponse reste générique (`422` ou `429`) et ne dit pas quelle règle a joué.
  - [Option] Cloudflare Turnstile, si le spam persiste.
- **En-tête `Idempotency-Key`** obligatoire (UUID).
- **Réponse `201`** : `{"id": "…", "reference": "D-2026-000142", "status": "received"}`, sans aucune donnée personnelle.

---

## 19. Alignement avec le code existant

Écarts relevés dans le dépôt `mbt` le 26/11/2026. **Rien n'a été modifié dans le code** : ces points sont à traiter au moment de brancher l'API.

| # | Fichier | Constat | Action |
|---|---|---|---|
| 1 | `README.md` | Prévoit un admin Next.js dans `apps/admin` | Admin rendu par FastAPI (§3.8) ; supprimer `apps/admin` |
| 2 | `README.md` | « Python (`api`) : hors workspace pnpm » | `apps/api` rejoint le workspace pour compiler le CSS de l'admin (§3.8) |
| 3 | `README.md`, `apps/api/.env.example` | `WEBHOOK_HMAC_SECRET` : un secret global, « surchargé par destination » | Le supprimer. Chaque connexion a son propre secret, généré par le système et chiffré (§9.3). Ajouter `APP_ENCRYPTION_KEYS` (annexe A) |
| 4 | `README.md`, `apps/api/.env.example` | `CORS_ORIGINS` | Le supprimer : aucun navigateur n'appelle `/v1` (§18.4). Ajouter `BFF_KEYS`, `ADMIN_HOST` et `PUBLIC_API_HOST` |
| 5 | `apps/admin/.env.example` | Variables `NEXT_PUBLIC_*` pour l'admin | Disparaît avec `apps/admin`. La carte éventuelle de l'admin utilise une URL signée par l'API (§6.4) |
| 6 | `apps/mbttaxis/src/lib/form-schemas.ts` | `name` : nom et prénom dans un seul champ | Deux champs, prénom et nom (D19) |
| 7 | idem | `tripType: "aller-retour"` sans date ni heure de retour | Ajouter la date et l'heure du retour (D20) |
| 8 | idem | Un seul consentement, `consent` | Ajouter un consentement santé distinct dès qu'un besoin est indiqué (D21) |
| 9 | idem | `passengers` en texte, `companion` en oui/non, `wheelchair: "preciser"` | `passenger_count` entier (1 à 8), `companions` entier, `preciser` converti en `other` avec précision obligatoire |
| 10 | idem | `service: "quotidien"` | Correspondance avec les codes de l'API : `quotidien` devient `daily` ; `business`, `vsl` et `pmr` sont inchangés |
| 11 | idem, et `src/app/actions/forms.ts` | Services `adaptation` et `location-vente`, formulaires de devis et de contact | Ce ne sont pas des demandes de course : `POST /v1/messages`, qui envoie un e-mail sans entrer dans le cycle de vie (D22) |
| 12 | `apps/mbttaxis/src/app/actions/forms.ts` | `console.info("[mock] …", parsed.data)` journalise des données personnelles | À supprimer au branchement (§18.4) |
| 13 | `apps/handycab/src/components/EstimateForm.tsx` | Prix calculé au hasard (`Math.random()`) | **Ne pas publier en l'état** : un prix affiché engage MBT. Remplacer par le parcours de demande (D23). Un vrai simulateur, fondé sur la grille tarifaire, serait une [Option] |
| 14 | `apps/handycab` | Aucun formulaire de demande : le site renvoie vers l'application | Le contrat prévoit le même parcours sur les deux sites. Ajouter le formulaire (`origin = site_handycab`, `service = pmr`) |
| 15 | `apps/mobile/.env.example` | `EXPO_PUBLIC_SUPPORT_PHONE` en dur | Lire le numéro dans `GET /v1/config` : une seule source, modifiable dans les paramètres (§14) |
| 16 | `infos/admin/` | Spécification et guide non versionnés : `infos/` est ignoré par Git | Les déplacer dans un dossier versionné, par exemple `docs/`. Le guide est un engagement envers les destinataires : il doit avoir un historique |

**Répercuté dans le guide d'intégration** (`infos/admin/guide-integration-webhooks.md`, version 1.1 du document), sans préavis puisque rien n'est encore en production :

- champ `data.service` (`business`, `daily`, `vsl`, `pmr`) ;
- valeur `other` pour `needs.mobility_aid`, avec `needs.notes` alors renseigné.

---

## Annexe A : variables d'environnement

Les noms reprennent ceux déjà utilisés dans `apps/api/.env.example` quand ils existent.

**API (`apps/api`, variables Heroku)**

| Variable | Rôle | Sensible |
|---|---|---|
| `APP_ENV` | `development`, `staging` ou `production` | Non |
| `DATABASE_URL` | Fournie par Heroku Postgres ; réécrite en `postgresql+asyncpg://` | Oui |
| `APP_ENCRYPTION_KEYS` | Clés AES-256-GCM versionnées : `k2:<base64>,k1:<base64>` | **Oui, critique** |
| `SECRET_KEY` | Signature des jetons d'accès des clients (JWT HS256) ; 32 octets aléatoires au minimum | **Oui, critique** |
| `SECRET_KEY_PREVIOUS` | Ancienne clé, acceptée en vérification pendant une rotation (§18.3) | Oui |
| `ACCESS_TOKEN_TTL_MINUTES` | `15` | Non |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Non |
| `ADMIN_HOST` | `gestion.mbttaxis.be` (en local : `gestion.localhost`) | Non |
| `PUBLIC_API_HOST` | `api.handycab.be` (en local : `api.localhost`) | Non |
| `BFF_KEYS` | Clés des sites : `site_mbt:<clé>,site_handycab:<clé>` (§18.4) | Oui |
| `RESEND_API_KEY` | Envoi des e-mails | Oui |
| `RESEND_FROM_EMAIL` | Expéditeur, par exemple `MBT Taxis <noreply@notifications.mbttaxis.be>` (§13) | Non |
| `ADMIN_NOTIFY_EMAILS` | Valeur initiale de `company.notification_emails` (§14) | Non |
| `GOOGLE_MAPS_API_KEY` | Clé serveur pour la validation des adresses (Places) | Oui |
| `GOOGLE_MAPS_STATIC_SIGNING_SECRET` | [Option] Signature des URL de la carte statique de l'admin (§6.4) | Oui |
| `SENTRY_DSN` | Remontée des erreurs | Oui |
| `WEBHOOK_ALLOWED_HOSTS` | Liste blanche facultative, par exemple `*.taxiger.com,hook.eu1.make.com` | Non |
| `WEBHOOK_ALLOWED_PORTS` | Ports autorisés ; `443` par défaut | Non |
| `QUOTAGUARDSTATIC_URL` | Proxy à IP fixe, si l'add-on est installé ; contient des identifiants | Oui |
| `LOG_LEVEL` | `INFO` par défaut | Non |

**À retirer de l'actuel `apps/api/.env.example`** (§19) :

- `WEBHOOK_HMAC_SECRET` : un secret global commun à toutes les destinations contredit le modèle de sécurité (§9.3).
- `CORS_ORIGINS` : aucun navigateur n'appelle `/v1` (§18.4).

**Sites (`apps/mbttaxis`, `apps/handycab`)**

| Variable | Rôle | Sensible |
|---|---|---|
| `API_URL` | URL de l'API, par exemple `https://api.handycab.be` ; variable serveur | Non |
| `API_BFF_KEY` | Clé du site (§18.4) ; variable serveur, **jamais** `NEXT_PUBLIC_` | Oui |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Clé navigateur pour l'autocomplétion Places, restreinte aux domaines du site | Publique, mais restreinte |

**Application (`apps/mobile`)**

| Variable | Rôle | Sensible |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | URL de l'API | Non |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Clé Places, restreinte à l'identifiant de l'application (§18.6) | Publique, mais restreinte |

`EXPO_PUBLIC_SUPPORT_PHONE` est remplacé par `GET /v1/config` (§19).

## Annexe B : catalogue des actions d'audit

| Domaine | Actions |
|---|---|
| Authentification | `auth.login.succeeded`, `auth.login.failed`, `auth.mfa.succeeded`, `auth.mfa.failed`, `auth.locked`, `auth.logout`, `auth.step_up`, `auth.password.reset_requested`, `auth.password.changed`, `auth.recovery_codes.regenerated`, `auth.session.revoked` |
| Administrateurs | `admin.invited`, `admin.activated`, `admin.disabled`, `admin.enabled`, `admin.mfa_reset`, `admin.email_changed` |
| Demandes | `demande.created`, `demande.status_changed`, `demande.auto_closed`, `demande.assigned`, `demande.note_added`, `demande.note_deleted`, `demande.exported`, `demande.anonymized` |
| Passagers | `passenger.registered`, `passenger.email_verified`, `passenger.login.failed`, `passenger.token_reuse_detected`, `passenger.disabled`, `passenger.enabled`, `passenger.verification_resent`, `passenger.exported`, `passenger.anonymized` |
| Connexions | `webhook.endpoint.created`, `webhook.endpoint.updated`, `webhook.endpoint.url_changed`, `webhook.endpoint.health_data_enabled`, `webhook.endpoint.health_data_disabled`, `webhook.endpoint.tested`, `webhook.endpoint.activated`, `webhook.endpoint.deactivated`, `webhook.endpoint.secret_rotated`, `webhook.endpoint.archived`, `webhook.delivery.retried`, `webhook.delivery.retried_bulk`, `webhook.delivery.abandoned`, `webhook.delivery.ssrf_blocked` |
| Système | `settings.updated`, `retention.purged`, `audit.verified`, `audit.exported`, `system.cli` |

## Annexe C : matrice de traçabilité

| Exigence | Sections | Critères d'acceptation |
|---|---|---|
| R1 Espace regroupant toutes les demandes | §6.2, §6.3 | CA-01 |
| R2 Recherche | §4.3, §6.3 | CA-02 |
| R3 Origine | §4.2, §6.3 | CA-01 |
| R4 Suivi du traitement | §5, §6.4 | CA-03, CA-04, CA-14 |
| R5 Accès protégés | §10 | CA-05, CA-06 |
| R6 Durée de conservation | §4.4, §12 | CA-07 |
| R7 Ajouter, tester, désactiver une destination | §6.6, §8.7, §8.9 | CA-08, CA-09 |
| R8 Historique des transmissions | §6.7, §8 | CA-10 |
| R9 Nouvelles tentatives et relance manuelle | §8.6, §8.8 | CA-11, CA-12 |
| R10 Format documenté | Guide d'intégration | CA-13 |
| R11 Paramétrage sans code | §6.6, §14 | CA-08 |
| R12 3 cycles de révision | §15.3 | Procès-verbal de recette |
| R13 Code source, accès, garantie de 90 jours | §16 | Livraison |

## Annexe D : glossaire

| Terme | Définition |
|---|---|
| **Webhook** | Requête HTTP envoyée automatiquement à un autre logiciel quand un événement se produit |
| **Outbox** | Technique qui consiste à enregistrer l'envoi à faire dans la même transaction que la donnée, puis à le traiter à part : rien ne se perd |
| **Au moins une fois** | Garantie de livraison : un message peut arriver deux fois, mais n'est jamais perdu sans trace |
| **HMAC** | Signature calculée avec un secret partagé ; prouve l'origine et l'intégrité d'un message |
| **Standard Webhooks** | Spécification ouverte qui définit les en-têtes et la signature des webhooks |
| **SSRF** | *Server-Side Request Forgery* : amener un serveur à appeler une adresse qu'il ne devrait pas appeler, typiquement interne |
| **DNS rebinding** | Un nom de domaine qui résout vers une IP publique au moment du contrôle, puis vers une IP interne au moment de l'appel |
| **Épinglage d'IP** | Se connecter exactement à l'IP qui a été contrôlée, plutôt que de laisser résoudre le nom une seconde fois |
| **SNI** | Nom de domaine annoncé au début de la connexion TLS ; il permet de vérifier le bon certificat |
| **Réauthentification (step-up)** | Nouvelle saisie du code de double authentification avant une action sensible |
| **Idempotence** | Rejouer la même requête ne produit qu'un seul effet |
| **Bail (lease)** | Réservation temporaire d'une tâche par un worker ; elle expire si celui-ci plante |
| **AAD** | Données associées au chiffrement AES-GCM ; elles lient un chiffré à son contexte |
| **TOTP** | Code à 6 chiffres qui change toutes les 30 s, généré par une application d'authentification |
| **AIPD** | Analyse d'impact relative à la protection des données (RGPD, art. 35) |
| **BFF** | *Backend for frontend* : la partie serveur d'un site (ici, les server actions Next.js), qui appelle l'API à la place du navigateur |
| **Server action** | Fonction Next.js exécutée sur le serveur et appelée directement par un formulaire |
| **OpenAPI** | Description standard d'une API, générée par FastAPI ; elle sert à produire le client TypeScript |
| **Famille de jetons** | Suite des jetons de rafraîchissement issus d'une même connexion ; révoquée en bloc si un jeton est réutilisé |
