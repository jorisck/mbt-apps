# Exploitation HandyCab / MBT Taxis

## Déploiement Heroku

Deux applications (préproduction et production), région `eu`.

```bash
# Depuis la racine du monorepo
heroku create mbt-api-staging --region eu
heroku buildpacks:add heroku/nodejs -a mbt-api-staging
heroku buildpacks:add heroku/python -a mbt-api-staging
# Pointer le build Python sur apps/api :
heroku config:set PROJECT_PATH=apps/api -a mbt-api-staging
# Ou utiliser un monorepo buildpack qui sélectionne apps/api
```

Processus (`apps/api/Procfile`) : `release`, `web`, `worker`.

Variables minimales : `APP_ENV`, `DATABASE_URL`, `SECRET_KEY`, `APP_ENCRYPTION_KEYS`, `BFF_KEYS`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFY_EMAILS`, `ADMIN_HOST`, `PUBLIC_API_HOST`, `GOOGLE_MAPS_API_KEY`, `SENTRY_DSN`.

## Migrations

Appliquées automatiquement en phase `release` : `python -m app.cli release` (vérifie aussi la configuration).

## Premier administrateur

```bash
heroku run -a mbt-api-prod "python -m app.cli admin create --email vous@mbttaxis.be --name 'Prénom Nom'"
```

## Bris de glace (compte verrouillé)

```bash
python -m app.cli admin unlock --email vous@mbttaxis.be
```

## Rotation des clés

- **Chiffrement** : générer une nouvelle clé (`python -m app.cli gen-key --id k2`), la placer **en tête** de `APP_ENCRYPTION_KEYS` ; les anciennes restent pour le déchiffrement.
- **SECRET_KEY** : nouvelle valeur dans `SECRET_KEY`, ancienne dans `SECRET_KEY_PREVIOUS` pendant 15 min.
- **BFF_KEYS** : deux clés pour le même site pendant la bascule.
- **Secret webhook** : rotation progressive ou urgence depuis l'écran Connexions.

## Restauration Postgres

Via les backups Heroku (`heroku pg:backups`). Après restauration, vérifier la chaîne d'audit (`POST /audit-log/verify` dans l'admin).

## Réponse à incident

1. Désactiver immédiatement une connexion webhook compromise (sans réauthentification).
2. Rotation urgence du secret.
3. Révoquer les sessions admin concernées.
4. Consulter le journal d'audit et Sentry (sans PII).

## Liste de contrôle pré-production (webhooks §9.12)

- [ ] SSRF : aucune URL interne acceptée
- [ ] Secrets chiffrés, jamais dans les logs
- [ ] Test obligatoire avant activation
- [ ] Signature Standard Webhooks validée avec le vecteur du guide
- [ ] QuotaGuard seulement si un destinataire l'exige
- [ ] Guide d'intégration remis au destinataire
