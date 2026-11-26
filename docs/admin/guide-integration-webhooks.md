# Guide d'intégration : recevoir les demandes de course MBT Taxis / HandyCab

## Webhooks : spécification à l'intention des logiciels destinataires

| | |
|---|---|
| **Émetteur** | MBT Taxis / HandyCab |
| **Destinataires du guide** | Équipes techniques des logiciels qui reçoivent nos demandes de course (dispatch, gestion de flotte, CRM…) |
| **Version du format** | `api_version` = `2026-12-01` |
| **Version du document** | 1.1 du 26/11/2026. Version de travail : la liste définitive des champs sera confirmée avant la mise en production |
| **Historique** | 1.0 : première version. 1.1 : ajout du champ `service` et de la valeur `other` pour `needs.mobility_aid` |
| **Contact technique** | [à compléter] |

### Sommaire

1. En bref
2. Mise en service, étape par étape
3. Exigences pour votre point de réception
4. Format des requêtes
5. Événements
6. Référence des champs
7. Exemples complets
8. Vérifier la signature
9. Vecteur de test
10. Répondre, nouvelles tentatives, doublons et ordre d'arrivée
11. Rotation du secret
12. Sécurité : liste de contrôle
13. Données personnelles
14. Environnements de test
15. Versions et évolutions
16. Questions fréquentes
17. Contacts

---

## 1. En bref

- À chaque fois qu'une demande de course est **créée, confirmée, refusée ou annulée** chez MBT / HandyCab, nous envoyons une requête **HTTPS `POST`**, au format JSON, à l'adresse que vous nous avez communiquée.
- Chaque requête est **signée** (HMAC-SHA256, selon la spécification ouverte [Standard Webhooks](https://www.standardwebhooks.com/)). Vous vérifiez la signature avec un **secret** que nous vous transmettons.
- Vous répondez par un code **2xx en moins de 10 secondes**. Sinon, nous réessayons pendant environ **21 heures**.
- Un même message peut arriver **plusieurs fois**. Vous le reconnaissez grâce à l'en-tête `webhook-id`.
- Chaque message contient **l'état complet** de la demande et un **numéro de révision**. Vous n'avez jamais besoin de nous rappeler pour obtenir des informations.

> **Important.** Une demande au statut `received` **n'est pas une course acceptée**. Seul l'événement `demande.confirmed` signifie que MBT a accepté la course.

---

## 2. Mise en service, étape par étape

| Étape | Qui | Action |
|---|---|---|
| 1 | Vous | Vous nous communiquez (formulaire en fin de document) : l'**URL HTTPS** de réception ; l'éventuel **en-tête d'authentification** que vous exigez (par exemple `Authorization: Bearer …`) ; votre **contact technique** ; les **événements** souhaités ; votre besoin éventuel d'une **liste blanche d'adresses IP**. |
| 2 | MBT | Crée la connexion dans son espace de gestion. Un **secret de signature** est généré automatiquement. |
| 3 | MBT | Vous transmet le secret **par un canal sûr, séparé** de l'URL : lien à usage unique, ou une moitié par téléphone et l'autre par e-mail. |
| 4 | Vous | Implémentez la vérification de la signature (§8) et validez-la avec le **vecteur de test** (§9). |
| 5 | MBT | Envoie un événement `webhook.test` depuis son espace de gestion. Vous devez répondre 2xx. |
| 6 | Ensemble | Recette en préproduction, avec des demandes **fictives** (§14). |
| 7 | MBT | Active la connexion en production. Seules les demandes créées ou modifiées **après l'activation** vous sont envoyées. |

> **Avant toute réception de données réelles**, un **contrat de traitement des données** doit être signé entre MBT et votre société (§13).

---

## 3. Exigences pour votre point de réception

| Exigence | Détail |
|---|---|
| HTTPS | Certificat valide émis par une autorité publique (pas de certificat auto-signé), TLS 1.2 ou plus récent |
| Adresse | Un **nom de domaine**, pas une adresse IP. Port 443 (pour un autre port, nous consulter) |
| Méthode | `POST`, corps en `application/json`, encodé en UTF-8, de quelques kilo-octets |
| Délai | Connexion acceptée en moins de 5 s, réponse complète en moins de **10 s** |
| Réponse | Un code **2xx** signifie « bien reçu ». Tout autre code est traité comme un échec |
| Redirections | **Non suivies** : une réponse 3xx est un échec |
| Tolérance | Votre code doit **ignorer les champs inconnus** (§15) |

---

## 4. Format des requêtes

### 4.1 Exemple

```http
POST /hooks/handycab HTTP/1.1
Host: dispatch.votre-domaine.example
Content-Type: application/json
User-Agent: HandyCab-Webhooks/1.0
Accept-Encoding: identity
webhook-id: msg_0193b5f27c1e7a3b9f2d4c8e1a2b3c4d
webhook-timestamp: 1795688102
webhook-signature: v1,<signature en base64>
Authorization: Bearer <votre jeton, si vous en avez demandé un>

{"type":"demande.confirmed","timestamp":"2026-11-26T10:15:02Z","api_version":"2026-12-01","data":{...}}
```

### 4.2 En-têtes

| En-tête | Contenu |
|---|---|
| `webhook-id` | Identifiant unique du message. **Il est identique à chaque nouvelle tentative du même message** : c'est votre clé de déduplication. Valeur opaque : n'en déduisez aucune structure. |
| `webhook-timestamp` | Moment de **cette tentative d'envoi**, en secondes depuis le 01/01/1970 (UTC). |
| `webhook-signature` | `v1,` suivi de la signature en base64. Pendant une rotation de secret, **deux signatures** séparées par une espace (§11). |
| `Content-Type` | `application/json` |
| `User-Agent` | `HandyCab-Webhooks/1.0` |
| En-têtes personnalisés | Ceux que vous nous avez demandés, par exemple `Authorization`. |

### 4.3 Corps (enveloppe)

| Champ | Type | Description |
|---|---|---|
| `type` | texte | Type d'événement (§5) |
| `timestamp` | texte (ISO 8601, UTC) | Moment **où l'événement s'est produit** |
| `api_version` | texte | Version du format : `2026-12-01` |
| `data` | objet | État complet de la demande (§6). Pour `webhook.test` : `{"test": true}` |

> `timestamp` (dans le corps) et `webhook-timestamp` (en en-tête) ne désignent pas la même chose. Le premier est le moment de l'événement, le second celui de la tentative d'envoi. Lors d'une nouvelle tentative, ils diffèrent : c'est normal.

---

## 5. Événements

| Type | Quand | Ce que vous devriez faire |
|---|---|---|
| `demande.created` | Nouvelle demande, statut `received`. **Pas encore acceptée par MBT.** | Enregistrer une demande « à confirmer », ou ignorer si vous ne voulez que des courses confirmées |
| `demande.confirmed` | MBT a accepté la course | Créer la course, ou la mettre à jour |
| `demande.refused` | MBT a refusé la demande | Supprimer ou annuler l'éventuelle demande « à confirmer » |
| `demande.cancelled` | Annulée par le passager ou par MBT | Annuler la course |
| `webhook.test` | Test lancé depuis l'espace de gestion de MBT | Répondre 2xx et **ne rien créer** |

- **Abonnement.** MBT configure les événements que vous recevez, selon vos souhaits.
  - Pour un logiciel de dispatch, nous conseillons `demande.confirmed` et `demande.cancelled`.
  - Si vous recevez `demande.created`, recevez aussi `demande.refused` et `demande.cancelled`, sinon des demandes refusées resteraient chez vous.
- **Pas d'événement « course terminée ».** C'est votre logiciel qui sait si la course a eu lieu.

---

## 6. Référence des champs

### 6.1 Objet `data` (événements `demande.*`)

| Champ | Type | Peut être `null` | Description |
|---|---|---|---|
| `id` | texte (UUID) | non | Identifiant unique et stable de la demande. **Utilisez-le comme clé de rapprochement.** |
| `reference` | texte | non | Référence lisible, par exemple `D-2026-000142`. Utilisée au téléphone avec MBT. |
| `revision` | entier | non | Augmente à chaque changement de la demande. Ignorez un message dont la révision est inférieure ou égale à celle déjà traitée (§10.4). |
| `status` | texte | non | `received`, `confirmed`, `refused` ou `cancelled` |
| `origin` | texte | non | Canal de la demande : `site_mbt`, `site_handycab`, `app_ios` ou `app_android` |
| `service` | texte | non | Type de transport : `business` (déplacements professionnels), `daily` (déplacements du quotidien), `vsl` (transport médico-sanitaire assis) ou `pmr` (transport de personnes à mobilité réduite). Les demandes HandyCab sont toujours `pmr`. |
| `language` | texte | non | Langue du passager : `fr`, `nl` ou `en` |
| `created_at` | texte (ISO 8601, UTC) | non | Réception de la demande |
| `updated_at` | texte (ISO 8601, UTC) | non | Dernière modification |
| `pickup.at` | texte (ISO 8601 avec décalage) | non | Date et heure de prise en charge, **heure de Bruxelles avec son décalage**, par exemple `2026-11-28T08:30:00+01:00` |
| `pickup.address` | Adresse (§6.2) | non | Adresse de départ |
| `pickup.instructions` | texte | oui | Indications d'accès : sonnette, étage, ascenseur… |
| `dropoff.address` | Adresse | non | Destination |
| `return` | objet | oui | Aller-retour : `{"at": "…", "pickup_address": Adresse}`. `null` pour un aller simple. |
| `passenger_count` | entier | non | Nombre total de personnes transportées, accompagnants compris (1 à 8) |
| `passenger.first_name` | texte | non | Prénom |
| `passenger.last_name` | texte | non | Nom |
| `passenger.phone` | texte (E.164) | non | Par exemple `+32470000000` |
| `passenger.email` | texte | oui | Adresse e-mail |
| `needs` | objet | oui | Besoins de mobilité (**données de santé**). **`null` si votre connexion n'est pas autorisée à les recevoir** (§13). |
| `needs.mobility_aid` | texte | non | `none`, `walking_aid`, `manual_wheelchair`, `electric_wheelchair` ou `other`. Avec `other`, la précision se trouve dans `needs.notes`. |
| `needs.stays_in_wheelchair` | booléen | non | Le passager voyage assis dans son fauteuil : véhicule avec rampe ou élévateur nécessaire |
| `needs.companions` | entier | non | Nombre d'accompagnants (déjà inclus dans `passenger_count`) |
| `needs.door_to_door` | booléen | non | Aide de porte à porte demandée |
| `needs.notes` | texte | oui | Précisions. Toujours renseigné quand `needs.mobility_aid` vaut `other`. |
| `comment` | texte | oui | Commentaire libre du passager |
| `refusal_reason` | texte | oui | Motif, si `status` vaut `refused` |
| `cancellation` | objet | oui | Si `status` vaut `cancelled` : `by` (`passenger` ou `operator`), `reason` (texte ou `null`), `at` (ISO 8601, UTC) |

### 6.2 Objet Adresse

| Champ | Type | Peut être `null` | Description |
|---|---|---|---|
| `formatted` | texte | non | Adresse complète sur une ligne. **Toujours présente** : utilisez-la si les autres champs sont vides. |
| `street` | texte | oui | Rue |
| `number` | texte | oui | Numéro |
| `box` | texte | oui | Boîte |
| `postal_code` | texte | oui | Code postal |
| `city` | texte | oui | Commune |
| `country` | texte | non | Code pays ISO 3166-1 alpha-2, par exemple `BE` |
| `lat`, `lng` | nombre | oui | Coordonnées géographiques, si disponibles |

### 6.3 Ce qui n'est jamais transmis

Notes internes de MBT, informations de compte du passager, historique des demandes. Seul le nécessaire à la course vous est envoyé.

---

## 7. Exemples complets

Les données ci-dessous sont **fictives**.

### 7.1 `demande.created` (connexion autorisée à recevoir les besoins de mobilité)

```json
{
  "type": "demande.created",
  "timestamp": "2026-11-26T09:58:41Z",
  "api_version": "2026-12-01",
  "data": {
    "id": "0193b5f2-7c1e-7a3b-9f2d-4c8e1a2b3c4d",
    "reference": "D-2026-000142",
    "revision": 1,
    "status": "received",
    "origin": "app_ios",
    "service": "pmr",
    "language": "fr",
    "created_at": "2026-11-26T09:58:41Z",
    "updated_at": "2026-11-26T09:58:41Z",
    "pickup": {
      "at": "2026-11-28T08:30:00+01:00",
      "address": {
        "formatted": "Avenue Louise 100, 1050 Ixelles, Belgique",
        "street": "Avenue Louise",
        "number": "100",
        "box": null,
        "postal_code": "1050",
        "city": "Ixelles",
        "country": "BE",
        "lat": null,
        "lng": null
      },
      "instructions": "Sonner au 3e, ascenseur disponible"
    },
    "dropoff": {
      "address": {
        "formatted": "Route de Lennik 808, 1070 Anderlecht, Belgique",
        "street": "Route de Lennik",
        "number": "808",
        "box": null,
        "postal_code": "1070",
        "city": "Anderlecht",
        "country": "BE",
        "lat": null,
        "lng": null
      }
    },
    "return": {
      "at": "2026-11-28T12:00:00+01:00",
      "pickup_address": null
    },
    "passenger_count": 2,
    "passenger": {
      "first_name": "Marie",
      "last_name": "Exemple",
      "phone": "+32470000000",
      "email": "marie.exemple@example.com"
    },
    "needs": {
      "mobility_aid": "manual_wheelchair",
      "stays_in_wheelchair": true,
      "companions": 1,
      "door_to_door": true,
      "notes": "Fauteuil pliable"
    },
    "comment": "Rendez-vous à 9 h, merci d'être à l'heure",
    "refusal_reason": null,
    "cancellation": null
  }
}
```

Pour le retour, `pickup_address: null` signifie que la prise en charge se fait à l'adresse de destination de l'aller.

### 7.2 `demande.cancelled` (connexion **sans** les besoins de mobilité)

```json
{
  "type": "demande.cancelled",
  "timestamp": "2026-11-27T16:20:05Z",
  "api_version": "2026-12-01",
  "data": {
    "id": "0193b5f2-7c1e-7a3b-9f2d-4c8e1a2b3c4d",
    "reference": "D-2026-000142",
    "revision": 3,
    "status": "cancelled",
    "origin": "app_ios",
    "service": "pmr",
    "language": "fr",
    "created_at": "2026-11-26T09:58:41Z",
    "updated_at": "2026-11-27T16:20:05Z",
    "pickup": {
      "at": "2026-11-28T08:30:00+01:00",
      "address": { "formatted": "Avenue Louise 100, 1050 Ixelles, Belgique", "street": "Avenue Louise", "number": "100", "box": null, "postal_code": "1050", "city": "Ixelles", "country": "BE", "lat": null, "lng": null },
      "instructions": "Sonner au 3e, ascenseur disponible"
    },
    "dropoff": {
      "address": { "formatted": "Route de Lennik 808, 1070 Anderlecht, Belgique", "street": "Route de Lennik", "number": "808", "box": null, "postal_code": "1070", "city": "Anderlecht", "country": "BE", "lat": null, "lng": null }
    },
    "return": { "at": "2026-11-28T12:00:00+01:00", "pickup_address": null },
    "passenger_count": 2,
    "passenger": { "first_name": "Marie", "last_name": "Exemple", "phone": "+32470000000", "email": "marie.exemple@example.com" },
    "needs": null,
    "comment": "Rendez-vous à 9 h, merci d'être à l'heure",
    "refusal_reason": null,
    "cancellation": {
      "by": "passenger",
      "reason": "Rendez-vous médical reporté",
      "at": "2026-11-27T16:20:05Z"
    }
  }
}
```

### 7.3 `webhook.test`

```json
{"type":"webhook.test","timestamp":"2026-11-26T10:00:00Z","api_version":"2026-12-01","data":{"test":true}}
```

---

## 8. Vérifier la signature

### 8.1 Principe

1. Lisez le **corps brut**, c'est-à-dire les octets reçus, **avant** tout décodage JSON. Re-sérialiser le JSON change les octets et casse la signature.
2. Vérifiez la présence des en-têtes `webhook-id`, `webhook-timestamp` et `webhook-signature`.
3. Rejetez le message si `webhook-timestamp` s'écarte de plus de **5 minutes** de votre heure actuelle (protection contre le rejeu ; votre horloge doit être synchronisée par NTP).
4. Calculez : `HMAC-SHA256(clé, "{webhook-id}.{webhook-timestamp}.{corps brut}")`. La **clé** est le secret **sans** le préfixe `whsec_`, **décodé de base64**.
5. Encodez le résultat en base64.
6. Comparez **en temps constant** avec chaque signature `v1,` de l'en-tête (il peut y en avoir deux, séparées par une espace).
7. Si aucune ne correspond, répondez `401` et ne traitez pas le message.

### 8.2 Option recommandée : bibliothèques officielles Standard Webhooks

Des bibliothèques officielles existent pour la plupart des langages (voir [standardwebhooks.com](https://www.standardwebhooks.com/)). Elles vérifient la signature, l'horodatage et les signatures multiples.

```python
# pip install standardwebhooks
from standardwebhooks.webhooks import Webhook

wh = Webhook(SECRET)                    # le secret complet, "whsec_..."
payload = wh.verify(raw_body, headers)  # lève une exception si invalide ; en-têtes en minuscules
```

```javascript
// npm install standardwebhooks
import { Webhook } from "standardwebhooks";

const wh = new Webhook(process.env.HANDYCAB_WEBHOOK_SECRET);   // "whsec_..."
const payload = wh.verify(rawBody, headers);                    // lève une exception si invalide
```

Ces deux bibliothèques ont été testées avec le vecteur du §9 : Python `standardwebhooks`, et JavaScript `standardwebhooks` 1.3.0.

### 8.3 Sans bibliothèque : Python (FastAPI)

```python
import base64, hashlib, hmac, os, time
from fastapi import FastAPI, Request, Response

SECRET = os.environ["HANDYCAB_WEBHOOK_SECRET"]      # "whsec_..."
TOLERANCE_SECONDS = 5 * 60

def verify_webhook(secret: str, headers, body: bytes) -> bool:
    try:
        msg_id = headers["webhook-id"]
        ts = int(headers["webhook-timestamp"])
        signatures = headers["webhook-signature"]
    except (KeyError, ValueError):
        return False
    if abs(time.time() - ts) > TOLERANCE_SECONDS:
        return False
    key = base64.b64decode(secret.removeprefix("whsec_"))
    expected = base64.b64encode(
        hmac.new(key, f"{msg_id}.{ts}.".encode() + body, hashlib.sha256).digest()
    ).decode()
    for part in signatures.split(" "):
        version, _, value = part.partition(",")
        if version == "v1" and hmac.compare_digest(value, expected):
            return True
    return False

app = FastAPI()

@app.post("/hooks/handycab")
async def handycab_webhook(request: Request) -> Response:
    body = await request.body()                       # octets bruts
    if not verify_webhook(SECRET, request.headers, body):
        return Response(status_code=401)
    enqueue_for_processing(body)                      # traitement asynchrone (§10.2)
    return Response(status_code=204)
```

### 8.4 Sans bibliothèque : Node.js (Express)

```javascript
import crypto from "node:crypto";
import express from "express";

const SECRET = process.env.HANDYCAB_WEBHOOK_SECRET;   // "whsec_..."
const TOLERANCE_SECONDS = 5 * 60;

export function verifyWebhook(secret, headers, rawBody) {
  const id = headers["webhook-id"];
  const ts = headers["webhook-timestamp"];
  const sigHeader = headers["webhook-signature"];
  if (!id || !ts || !sigHeader || !/^\d+$/.test(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(ts)) > TOLERANCE_SECONDS) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${ts}.`).update(rawBody).digest();

  return sigHeader.split(" ").some((part) => {
    const [version, value] = part.split(",", 2);
    if (version !== "v1" || !value) return false;
    const given = Buffer.from(value, "base64");
    return given.length === expected.length && crypto.timingSafeEqual(given, expected);
  });
}

const app = express();

// express.raw : on garde le corps brut (Buffer) pour la vérification
app.post("/hooks/handycab", express.raw({ type: "application/json" }), (req, res) => {
  if (!verifyWebhook(SECRET, req.headers, req.body)) return res.sendStatus(401);
  enqueueForProcessing(req.body);                    // traitement asynchrone (§10.2)
  res.sendStatus(204);
});
```

### 8.5 Sans bibliothèque : PHP

```php
<?php
const TOLERANCE_SECONDS = 300;

function verify_webhook(string $secret, array $headers, string $body): bool
{
    $headers = array_change_key_case($headers, CASE_LOWER);
    $id  = $headers['webhook-id'] ?? '';
    $ts  = $headers['webhook-timestamp'] ?? '';
    $sig = $headers['webhook-signature'] ?? '';
    if ($id === '' || $sig === '' || !ctype_digit($ts)) {
        return false;
    }
    if (abs(time() - (int) $ts) > TOLERANCE_SECONDS) {
        return false;
    }
    $key = base64_decode(preg_replace('/^whsec_/', '', $secret), true);
    if ($key === false) {
        return false;
    }
    $expected = base64_encode(hash_hmac('sha256', $id . '.' . $ts . '.' . $body, $key, true));
    foreach (explode(' ', $sig) as $part) {
        $pieces = explode(',', $part, 2);
        if (count($pieces) === 2 && $pieces[0] === 'v1' && hash_equals($expected, $pieces[1])) {
            return true;
        }
    }
    return false;
}

$body = file_get_contents('php://input');            // corps brut
if (!verify_webhook((string) getenv('HANDYCAB_WEBHOOK_SECRET'), getallheaders(), $body)) {
    http_response_code(401);
    exit;
}
enqueue_for_processing($body);                        // traitement asynchrone (§10.2)
http_response_code(204);
```

---

## 9. Vecteur de test

Utilisez ces valeurs **fictives** pour valider votre implémentation avant le premier envoi réel. **Désactivez le contrôle d'horodatage pour ce test uniquement** : la date est dans le passé.

| Élément | Valeur |
|---|---|
| Secret | `whsec_jmOigo2WR8R6RSIgn4MwSHnuC1l0YPN5H5KuR7s1Yqo=` |
| `webhook-id` | `msg_01JDQ8Z5V9K3M7XW2TYB4N6HRE` |
| `webhook-timestamp` | `1795687200` (26/11/2026 à 10:00:00 UTC) |
| Corps (exactement ces octets, sans espace ni retour à la ligne) | `{"type":"webhook.test","timestamp":"2026-11-26T10:00:00Z","api_version":"2026-12-01","data":{"test":true}}` |
| **Signature attendue** | `v1,O2Fe75t42uZPc6RVjX/ThsMlObtaCCHZ2v5m+gSmoJo=` |

Contrôles complémentaires :

- Le même corps avec **un seul caractère modifié** doit être **rejeté**.
- L'en-tête `v1,AAAA v1,O2Fe75t42uZPc6RVjX/ThsMlObtaCCHZ2v5m+gSmoJo=` (deux signatures, dont une fausse) doit être **accepté**. C'est le cas d'une rotation de secret.

---

## 10. Répondre, nouvelles tentatives, doublons et ordre d'arrivée

### 10.1 Votre réponse

- **2xx en moins de 10 s** : le message est considéré comme livré. Le corps de la réponse est facultatif.
- **Facultatif, mais recommandé.** Répondez `{"external_id": "VOTRE-ID"}`, avec votre propre identifiant de course (100 caractères au plus ; lettres, chiffres, `.`, `_`, `:`, `-`). Il est conservé chez MBT et facilitera tout rapprochement futur.
- **Signature invalide.** Répondez `401`. Nous réessayerons et MBT sera alerté : une erreur de configuration se voit vite.

### 10.2 Répondre vite, traiter ensuite

Enregistrez le message, répondez 2xx immédiatement, puis traitez-le de manière asynchrone, par exemple dans une file d'attente. Un traitement long dans la requête provoque des dépassements de délai, donc des nouvelles tentatives et des doublons.

### 10.3 Nouvelles tentatives

| Tentative | Délai après la précédente | Délai cumulé |
|---|---|---|
| 1 | Immédiate | 0 |
| 2 | 1 min | 1 min |
| 3 | 5 min | 6 min |
| 4 | 30 min | 36 min |
| 5 | 2 h | 2 h 36 |
| 6 | 6 h | 8 h 36 |
| 7 | 12 h | 20 h 36 |

Les délais varient de ±10 %. Après la 7e tentative, MBT est alerté et peut **relancer le message manuellement** plus tard, avec le **même** `webhook-id`.

### 10.4 Doublons et ordre d'arrivée

- **Doublons.** Un même message peut arriver plusieurs fois, par exemple quand votre réponse ne nous est pas parvenue. Conservez les `webhook-id` déjà traités pendant **au moins 30 jours**, ou appuyez-vous sur la règle de révision ci-dessous.
- **Ordre.** Il n'est **pas garanti** : un message réessayé peut arriver après un message plus récent. Chaque message contient l'état complet de la demande et sa `revision`. Traitez donc chaque message comme une **mise à jour conditionnelle** :

```python
def handle(event: dict) -> None:
    if event["type"] == "webhook.test":
        return                                    # ne rien créer
    d = event["data"]
    known = repository.get(d["id"])
    if known and known.revision >= d["revision"]:
        return                                    # doublon ou message plus ancien : ignorer
    repository.upsert(d["id"], revision=d["revision"], status=d["status"], data=d)
```

Avec cette règle, un `demande.cancelled` qui arrive avant le `demande.created` correspondant ne pose aucun problème. La demande est enregistrée directement comme annulée, et le `demande.created` arrivé ensuite (révision inférieure) est ignoré.

---

## 11. Rotation du secret

| Mode | Ce qui se passe | Ce que vous faites |
|---|---|---|
| **Progressif** (planifié) | Pendant **24 h**, chaque message porte **deux signatures** : celle de l'ancien secret et celle du nouveau. | Installez le nouveau secret quand vous le souhaitez dans ces 24 h. Aucune interruption, à condition que votre code teste **toutes** les signatures de l'en-tête (c'est le cas des exemples du §8). |
| **Urgence** (secret compromis) | L'ancien secret est révoqué immédiatement. MBT vous contacte. | Installez le nouveau secret au plus vite. Les messages refusés entre-temps sont réessayés automatiquement (§10.3). |

Si vous pensez que **votre** copie du secret a fuité, prévenez immédiatement le contact sécurité (§17).

---

## 12. Sécurité : liste de contrôle

- [ ] La signature est vérifiée sur le **corps brut**, **avant** tout traitement.
- [ ] La comparaison se fait **en temps constant** (`hmac.compare_digest`, `crypto.timingSafeEqual`, `hash_equals`).
- [ ] Les messages dont l'horodatage s'écarte de plus de 5 min sont rejetés ; l'horloge du serveur est synchronisée (NTP).
- [ ] Les doublons sont éliminés (`webhook-id`) et la règle de révision est appliquée (§10.4).
- [ ] Le secret est stocké dans un coffre ou une variable d'environnement : **jamais** dans le code source, **jamais** dans les logs.
- [ ] Le point de réception est en HTTPS, avec un certificat valide.
- [ ] Le **corps des messages n'est pas journalisé** : il contient des données personnelles, parfois de santé.
- [ ] Les messages `webhook.test` ne créent aucune course.
- [ ] Facultatif : un jeton d'authentification supplémentaire est exigé en en-tête (communiquez-le à MBT).
- [ ] Facultatif : seules les adresses IP de sortie de MBT sont autorisées, si elles vous ont été communiquées (§17).

---

## 13. Données personnelles

- **Ce que vous recevez.** Identité, coordonnées, adresses et horaires de passagers. Si votre connexion y est autorisée, vous recevez aussi leurs **besoins de mobilité, qui sont des données de santé** au sens du RGPD (article 9).
- **Votre rôle.** Vous traitez ces données **pour le compte de MBT**, en tant que sous-traitant (article 28 du RGPD). Un **contrat de traitement des données** doit être signé avant toute réception de données réelles.
- **Vos engagements principaux**, à préciser dans ce contrat :
  - utiliser les données **uniquement** pour l'exécution des courses ;
  - en assurer la sécurité et la confidentialité ;
  - respecter une durée de conservation définie ;
  - **prévenir MBT sans délai**, et au plus tard dans les 24 h, en cas de violation de données, pour permettre à MBT de notifier l'autorité de contrôle dans les 72 h ;
  - aider MBT à répondre aux demandes des personnes (accès, effacement…) ;
  - supprimer ou restituer les données en fin de contrat ;
  - déclarer vos propres sous-traitants.
- **Besoins de mobilité.** Ils ne vous sont transmis que si MBT l'a explicitement activé pour votre connexion. Sinon, `needs` vaut `null`.
- **Outils d'inspection publics.** N'utilisez **jamais** d'outil public d'inspection de requêtes (sites de type « request bin ») avec des données réelles.

---

## 14. Environnements de test

- **Préproduction.** L'environnement de préproduction de MBT envoie des **demandes fictives**. Leurs références commencent par `T-` au lieu de `D-`. Elles passent par une connexion et un **secret distincts** de la production.
- **Pendant votre développement**
  - Validez d'abord votre code avec le vecteur de test (§9).
  - Pour recevoir nos événements de test, votre point de réception doit être joignable publiquement en HTTPS. Un tunnel temporaire convient pour les **données fictives uniquement**.
- **Recette.** Scénarios à jouer ensemble avant la mise en production :
  - création, confirmation, refus, annulation ;
  - aller-retour ;
  - message en double ;
  - message arrivé dans le désordre ;
  - signature invalide (vous devez répondre `401`) ;
  - indisponibilité temporaire de votre serveur (nouvelles tentatives).

---

## 15. Versions et évolutions

- La version actuelle du format est **`2026-12-01`**, indiquée dans `api_version`.
- **Sans préavis.** Ajout de nouveaux champs. Votre code doit **ignorer les champs inconnus**.
- **Avec 1 mois de préavis.** Ajout d'une **nouvelle valeur** dans une liste fermée, par exemple un nouveau type d'aide à la mobilité. Traitez toute valeur inconnue avec prudence : affichez `needs.notes` et faites vérifier par un opérateur.
- **Avec au moins 3 mois de préavis.** Changement incompatible, comme un champ renommé ou supprimé. Il prend la forme d'une **nouvelle `api_version`**, activée pour votre connexion uniquement après votre accord.

---

## 16. Questions fréquentes

**Pouvez-vous nous envoyer l'historique des demandes passées ?**
Non. Par sécurité, une connexion ne reçoit que les événements postérieurs à son activation.

**Pouvez-vous appeler notre API plutôt que d'envoyer un webhook ? Ou nous envoyer un autre format (XML…) ?**
Pas dans la version actuelle : le format est unique. Un outil intermédiaire (Make, n8n, Zapier…) peut recevoir nos webhooks, transformer les données et appeler votre API. Un connecteur dédié serait une évolution à étudier avec MBT.

**Comment renvoyer à MBT le statut de la course (chauffeur assigné, course terminée) ?**
Ce n'est pas prévu dans cette version. Renvoyez votre `external_id` dans la réponse (§10.1) : il facilitera une synchronisation future.

**Que se passe-t-il si notre serveur est indisponible ?**
Nous réessayons pendant environ 21 h (§10.3). Au-delà, MBT est alerté et peut relancer les messages manuellement.

**Pourquoi `needs` vaut-il `null` ?**
Votre connexion n'est pas autorisée à recevoir les données de santé. Voyez-le avec MBT, dans le cadre du contrat de traitement des données.

**Pourquoi y a-t-il deux signatures dans l'en-tête ?**
Une rotation de secret est en cours (§11). Il suffit qu'**une** signature soit valide.

**Comment distinguer un test d'une vraie demande ?**
Le type `webhook.test`. En préproduction, les références commencent par `T-`.

---

## 17. Contacts

| Sujet | Contact |
|---|---|
| Opérationnel (courses, annulations) | MBT Taxis : [téléphone], [e-mail] |
| Technique (intégration, incidents) | [nom du prestataire] : [e-mail] |
| Sécurité (secret compromis, incident) | [e-mail sécurité] |
| Adresses IP de sortie de MBT (si une liste blanche est nécessaire) | [IP 1], [IP 2] |

### Informations à nous communiquer pour la mise en service

| Information | Votre réponse |
|---|---|
| Nom du logiciel et de la société | |
| URL HTTPS de réception (production) | |
| URL HTTPS de réception (préproduction / test) | |
| En-tête d'authentification exigé (nom seulement ; la valeur sera échangée par un canal sûr) | |
| Événements souhaités | ☐ `demande.created` ☐ `demande.confirmed` ☐ `demande.refused` ☐ `demande.cancelled` |
| Besoin des besoins de mobilité (données de santé) ? Si oui, pour quel usage ? | |
| Liste blanche d'adresses IP nécessaire ? | ☐ Oui ☐ Non |
| Contact technique (nom, e-mail, téléphone) | |
| Contact sécurité (e-mail) | |
