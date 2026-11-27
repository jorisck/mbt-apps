# Checklist CA-02 → CA-21

| ID | Critère (résumé) | OK |
|----|------------------|----|
| CA-02 | Recherche accents / téléphone / référence / adresse | [ ] |
| CA-03 | Transitions machine à états + chronologie | [ ] |
| CA-04 | Verrouillage concurrent 412 | [ ] |
| CA-05 | 401 sans session sur toutes les routes admin | [ ] |
| CA-06 | 403 step_up_required sur routes sensibles | [ ] |
| CA-07 | Purge / anonymisation rétention | [ ] |
| CA-08 | Connexion webhook : créer, tester, activer, désactiver | [ ] |
| CA-09 | Activation impossible sans test réussi < 24 h | [ ] |
| CA-10 | Journal des tentatives (heure, durée, IP, code) | [ ] |
| CA-11 | Calendrier de retries puis failed + e-mail | [ ] |
| CA-12 | Relance manuelle même webhook-id | [ ] |
| CA-13 | Guide d'intégration utilisable en demi-journée | [ ] |
| CA-14 | Clôture automatique §5.5 | [ ] |
| CA-15 | Tests sécurité webhooks §9.13 + checklist §9.12 | [ ] |
| CA-16 | Secret affiché une seule fois, absent des logs | [ ] |
| CA-17 | Rotation progressive 24 h (deux signatures) | [ ] |
| CA-18 | Redémarrage worker : pas de perte d'envoi | [ ] |
| CA-19 | E-mail admins sur action sensible connexion | [ ] |
| CA-20 | Pas de données de santé si option off | [ ] |
| CA-21 | Clavier + axe sur Demandes et Connexions | [ ] |

Détails des scénarios : spécification §15.2. Recette : 3 cycles (§15.3).
