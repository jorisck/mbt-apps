# CA-01 — Origines des demandes

**Réf.** R1, R3

## Objectif

Une demande créée depuis chacune des 4 origines apparaît dans la liste en moins de 5 s, avec la bonne origine.

## Préparation

- API + worker + admin démarrés (`pnpm dev:api`)
- Clés BFF configurées pour `site_mbt` et `site_handycab`

## Étapes

1. Créer une demande depuis mbttaxis (formulaire réservation).
2. Créer une demande depuis handycab (`/demande`).
3. Créer une demande via `POST /v1/demandes` avec `X-App-Platform: ios` et `X-App-Version: 1.0.0`.
4. Idem avec `android`.
5. Ouvrir `/demandes` dans l'admin.

## Attendu

- Quatre demandes visibles sous 5 s.
- Origines : site MBT Taxis, site HandyCab, application iOS, application Android.

## Résultat

- [ ] OK
- [ ] KO — notes :
