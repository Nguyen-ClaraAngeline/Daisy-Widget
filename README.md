# Daisy Widget — Sujet B

Widget de réservation embarquable : l'artisan colle deux lignes sur son site, le tunnel apparaît (cours → créneau → coordonnées → confirmation).

```html
<div id="daisy-booking" data-studio="std_pk_7f2a9c"></div>
<script src="https://widget.daisy.example/v1.js" async></script>
```

Le rapport (journal, décisions, tri de tickets, deux premières semaines, question technique) est dans [`REPORT.md`](./REPORT.md). L'annexe API est dans [`docs/daisy-api.md`](./docs/daisy-api.md).

---

## 1. Lancer et tester

```bash
npm install
npm run dev        # build du widget (build.mjs) puis Next.js sur http://localhost:3000
npm test           # tests unitaires (Vitest)
npm run typecheck
```

`http://localhost:3000` simule un site hôte **volontairement hostile** (`globals.css` : boutons roses, `h2` géants, texte rouge en `!important`). Si le widget reste propre, l'isolation fonctionne. Capture : `docs/isolation.png`.

L'API est mockée dans `src/app/api/mock/v1/[[...path]]` (latence de 1,5 à 4 s sur le POST, comme dans l'énoncé).

| Action | Résultat attendu |
|---|---|
| 2ᵉ date de la liste | « Complet », désactivée |
| 3ᵉ date | « Dernière place », pas de sélecteur de places |
| E-mail contenant `race` | La place part pendant la saisie → message de conflit, coordonnées conservées |
| E-mail contenant `500` | Erreur serveur avec bouton « Réessayer » |
| DevTools → Offline, puis confirmer | Message « issue incertaine », **sans** bouton de réessai (voir Q. 3) |

Événements de suivi : `addEventListener("daisy:event", e => console.log(e.detail))`

> Ne pas lancer `esbuild` à la main sous PowerShell : les guillemets de `--define` sont supprimés et le bundle plante (`production is not defined`). Passer par `npm run build:widget`.

## 2. Comment ça marche

Parcours du visiteur :

| Étape | Ce que voit le visiteur | Appel API |
|---|---|---|
| Chargement | Les cours de l'atelier | `GET /studio` + `GET /courses` |
| Choix d'un cours | Dates des 90 prochains jours, places, prix | `GET /courses/{id}/slots` |
| Choix d'une date | Formulaire (prénom, nom, e-mail, téléphone, places, notes) | aucun |
| « Confirmer » | « Réservation en cours… » (1,5 à 4 s) | `POST /bookings` |
| Réponse | Code de confirmation et récapitulatif | |

Quand ça ne va pas :

| Situation | Réaction du widget |
|---|---|
| Chargement | Blocs gris |
| Date complète / tous les créneaux complets | « Complet » / « Ce cours est complet pour le moment » |
| Réseau coupé ou lent (lectures) | Un rejeu automatique, puis message et bouton « Réessayer » |
| Dernière place prise pendant la saisie | Retour aux dates mises à jour, coordonnées conservées |
| Moins de places que demandé | On reste sur le formulaire, on propose d'ajuster |
| Créneau annulé | Retour aux dates, coordonnées conservées |
| Pas de réponse au POST | « Vérifiez votre boîte mail avant de réessayer », pas de réessai automatique |
| Domaine non déclaré (403) | Message qui explique comment le déclarer |
| Erreur de rendu inattendue | Message de repli, la page de l'hôte n'est pas touchée |

Personnalisation : la **couleur** vient du back-office (`GET /studio`). Deux réglages optionnels sur le `<div>` : `data-radius` (`none`, `soft`, `round`) et `data-font` (`inherit`, `sans`, `serif`). Rien d'autre.

## 3. Architecture

```
worker/embed.tsx        Loader : trouve #daisy-booking (même s'il apparaît tard), Shadow DOM, monte React
src/components/         Écrans du tunnel + ErrorBoundary
src/hooks/              bookingReducer (états du tunnel) + useBookingFlow (orchestration API)
src/services/           api.ts (client + mapping snake_case → camelCase), tracker.ts (événements)
src/utils/              formats, messages (tous les textes), validate, theme
src/styles/widget.css   CSS du widget, injecté dans le Shadow DOM
src/app/                Page hôte de test + mock API (Next.js)
test/                   Tests du reducer et de la validation
```

Choix structurants :
- **Reducer + hook** : le tunnel est une machine à états. Conflit et erreur sont des actions nommées, testables sans UI.
- **Une seule frontière avec l'API** (`api.ts`) : snake_case, codes d'erreur et validation des réponses sont traités là, nulle part ailleurs.
- **Tous les textes dans `messages.ts`**.
- **Fuseau de l'atelier, jamais celui du navigateur** : « 14h » veut dire 14h à l'atelier.
- **`<div role="group">` plutôt que `<form>`** : pas de soumission native sur un site hôte que je ne contrôle pas.
- **Aucun stockage local** : les coordonnées restent en mémoire, jamais dans localStorage ou un cookie.

---

## 4. Questions écrites

### Q1. Le CSS du site hôte est agressif. Comment garantir l'affichage, et à quel prix ?

**Garantie : Shadow DOM** (`mode: open`) + `:host { all: initial }`. Les styles de l'hôte ne traversent pas le shadow root, et `all: initial` neutralise l'héritage (couleur, police). Le CSS du widget reste dans le shadow root et ne fuit pas vers l'hôte. React est embarqué : le widget marche que l'hôte charge React, jQuery ou rien. Les composants interactifs utilisent `all: unset` puis redéfinissent leur style.
Preuve : `docs/isolation.png` (titre de l'hôte en Comic Sans, widget intact).

**Prix payé :**
- **Poids** : React est embarqué. Bundle : [À COMPLÉTER : taille de `public/widget.js`]. Preact le réduirait fortement, non fait.
- **Pas d'isolation des données.** Le Shadow DOM isole le *style*, pas la *sécurité* : un script de l'hôte peut lire les champs (même en mode `closed`, d'ailleurs). Une iframe d'un autre domaine isolerait vraiment les données personnelles. J'ai pris le Shadow DOM pour la hauteur, le mobile et les container queries, en sachant que l'artisan est de confiance sur son propre site. À rediscuter si le widget devait un jour traiter un paiement.
- **Invisible au SEO** : rendu côté client. Acceptable pour un tunnel de réservation.
- **Pas d'héritage de la police de l'hôte** par défaut (preset `font: inherit` disponible).
- **Autofill, gestionnaires de mots de passe, lecteurs d'écran** peuvent se comporter moins bien dans un shadow root. Non testé sur tous les navigateurs.
- **CSP stricte chez l'hôte** : une balise `<style>` inline peut être bloquée. Le loader utilise une feuille de style construite (`adoptedStyleSheets`) avec repli sur `<style>`. À valider sur un hôte réel.
- **Pas de rattrapage par l'hôte** : l'artisan ne peut rien changer en CSS. C'est voulu (Q2).

Alternative écartée : l'iframe. Meilleure isolation, mais hauteur à synchroniser par `postMessage`, mauvais scroll mobile, impossible de réagir à la largeur du conteneur.

**Responsive :** container queries : le widget réagit à sa propre largeur (colonne de 320 px comme pleine largeur).

### Q2. « Moche sur mobile », et elle veut ses couleurs. Jusqu'où personnaliser ?

**Personnalisable :**
- **Couleur principale**, depuis `GET /studio` : l'artisan la change à un seul endroit pour tout Daisy. Le texte du bouton est choisi (noir ou blanc) selon le meilleur contraste. Si la couleur ne permet pas 4,5:1, elle est légèrement assombrie pour le bouton. Exemple : la couleur de l'annexe API (`#C4643A`) donne environ 4,0:1 avec du blanc et 4,3:1 avec du noir, donc elle serait assombrie.
- **Rayon** : 3 valeurs. **Police** : 3 valeurs.

**Pas personnalisable :** espacements, tailles, structure, textes, CSS libre.

**Pourquoi, avec 70 ateliers :** chaque réglage libre est un cas à tester et à supporter, et une mise à jour du widget ne doit pas casser 70 feuilles de style. Des choix bornés ne peuvent pas produire un widget illisible.

**« Moche sur mobile » est un bug de notre côté, pas un réglage.** Je lui demande une capture, je reproduis, je corrige pour les 70. Cibles tactiles de 44 px minimum, champs à 16 px (pas de zoom iOS).

**À la potière :** « Votre couleur est reprise de votre back-office, et je regarde le rendu mobile cette semaine. »
**Limite à surveiller :** si plusieurs ateliers demandent la même chose (4ᵉ police, mode sombre), on l'ajoute pour tous, sans jamais ouvrir un champ libre.

### Q3. La dernière place part pendant la saisie. Que voit l'utilisateur ?

`409 slot_full` : le widget recharge les créneaux, **conserve les coordonnées**, renvoie sur la liste des dates et affiche un bandeau orange :

> **« Cette place vient d'être réservée par quelqu'un d'autre. Vos coordonnées sont conservées : choisissez un autre créneau ci-dessous, il suffira de confirmer. »**

Variantes :
- `slot_full` avec `available > 0` : on reste sur le formulaire, « Il ne reste plus que N place(s) sur ce créneau. Ajustez le nombre de places ou choisissez un autre créneau. »
- `slot_cancelled` : « Ce créneau a été annulé par l'atelier. Vos coordonnées sont conservées : choisissez une autre date. »

**Cas voisin, plus dangereux : le POST qui expire.** L'API met 1,5 à 4 s et n'a pas de clé d'idempotence. Si la connexion tombe après l'envoi, je ne sais pas si la réservation existe. Le widget dit :

> « Nous n'avons pas reçu de réponse. Votre réservation a peut-être été enregistrée : vérifiez votre boîte mail (et vos spams) avant de réessayer, pour éviter un doublon. »

Il n'y a **pas de bouton de réessai** sur ce message, mais le formulaire reste affiché : l'utilisateur confirme à nouveau lui-même, en connaissance de cause. La vraie correction est côté API (`Idempotency-Key`), ma première demande.

### Q4. Quel indicateur pour savoir si le widget marche ?

**Principal : taux de conversion du tunnel**, sessions avec `booking_confirmed` sur sessions ayant vu `courses`, **par atelier** (une moyenne cache les ateliers cassés), décomposé par `step_viewed`.

**Santé :**
- `api_error` par `kind`, surtout `origin` : ateliers sans domaine déclaré (environ 1 installation sur 3, motif de contact n°2). Un pic après une installation est un ticket support évitable.
- `booking_conflict` : si ça monte, il faut une réservation temporaire de la place.
- Latence du POST (p50 / p95).
- `abandon` avec l'étape.

**Limite :** l'API n'a pas de point d'entrée pour les événements. Le widget émet des `CustomEvent` (`daisy:event`, sans donnée personnelle) et **rien ne les collecte aujourd'hui** : c'est l'instrumentation, pas le tableau de bord. Prochain pas : `POST /events` ou Plausible/PostHog.

---

## 5. Sécurité et données personnelles

| Sujet | Ce qui est fait | Ce qui reste |
|---|---|---|
| Secret | Aucun dans le widget : clé publique seulement (`X-Studio-Key`) | La clé n'identifie qu'un atelier : les droits sont à limiter côté API |
| XSS | Aucun `dangerouslySetInnerHTML`, tout est du texte échappé par React. Les URL d'image sont filtrées (https uniquement) | |
| Redirection de l'API | `data-api` n'est pris en compte **qu'en local** (`localhost`). Sinon, quelqu'un qui injecterait du HTML dans la page d'un hôte pourrait rediriger les coordonnées vers son serveur | |
| Données personnelles | Rien dans localStorage, cookie ou événements de suivi. Longueurs de champs limitées | Mention RGPD / lien vers la politique de confidentialité de l'atelier non affichés |
| Validation | Côté client = confort uniquement. Les réponses de l'API sont vérifiées (nombres, listes) | La validation serveur reste l'autorité |
| Abus | 429 géré, bouton désactivé pendant l'envoi | Anti-bot (honeypot, captcha) côté API |
| Chaîne d'approvisionnement | Dépendances fixées par `package-lock.json` | `npm audit` en CI. En production : fichier versionné immuable (`v1.2.3.js`) et attribut `integrity` (SRI) en option, car ce script s'exécute sur 70 sites |
| CORS | 403 `origin_not_allowed` traduit en message clair | Le header personnalisé `X-Studio-Key` déclenche une requête préalable (preflight) : l'API doit l'autoriser |
| Mock | Le mock est dans `src/app/api/mock` | Ne pas le déployer en production |

## 6. Hypothèses (à valider avec l'équipe)

1. Clé publique envoyée par header `X-Studio-Key` (l'énoncé ne le dit pas).
2. `from` / `to` au format `YYYY-MM-DD`, fenêtre de 89 jours.
3. Pas d'`Idempotency-Key` sur `POST /bookings`.
4. Pas de point d'entrée pour les événements.
5. Pas de réservation temporaire de la place pendant la saisie.
6. Un seul créneau par réservation, nombre de places limité par `max_seats_per_booking`.

## 7. Ce que je n'ai pas fait

- **Test sur de vrais Wix / Squarespace / WordPress** et de vrais téléphones (DevTools 320 et 375 px seulement).
- **Audit d'accessibilité complet.** Bases posées : labels, `role="alert"`, focus visible, focus déplacé sur le titre à chaque étape, contrastes. Pas de test lecteur d'écran.
- **Preact**, chargement paresseux, internationalisation (textes centralisés dans `messages.ts`).
- **Collecte des événements** (Q4).
- **Changement de prix** entre l'affichage et la confirmation : pas de message.
- **Pagination** : au-delà de 8 cours une recherche (sans accents) apparaît, mais tout est chargé et rendu en une fois.
- **Tests d'intégration du tunnel** (seuls le reducer et la validation sont testés).

## 8. Usage de l'IA

J'ai utilisé Claude (assistant conversationnel), par manque de temps : pour comprendre l'énoncé et l'API, corriger des erreurs, améliorer l'architecture, relire le code et rédiger des brouillons de documentation que j'ai relus. Le détail (ce que j'ai vérifié, ce que l'IA a mal fait et que j'ai corrigé) est dans [`REPORT.md`](./REPORT.md), section 3.