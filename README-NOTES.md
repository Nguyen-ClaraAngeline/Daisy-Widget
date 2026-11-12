# Daisy Widget — Sujet B

Widget de réservation embarquable : l'artisan colle deux lignes sur son site, le tunnel apparaît (cours → créneau → coordonnées → confirmation).

```html
<div id="daisy-booking" data-studio="std_pk_7f2a9c"></div>
<script src="https://widget.daisy.example/v1.js" async></script>
```

Le rapport (journal, tri de tickets, deux premières semaines, question technique) est dans [`REPORT.md`](./REPORT.md).

---

## Lancer le projet

```bash
npm install
npm run dev        # build du widget (build.mjs) puis Next.js sur http://localhost:3000
```

La page `http://localhost:3000` simule un site hôte **volontairement hostile** (`globals.css` : boutons roses, `h2` géants, texte rouge en `!important`). Si le widget reste propre, l'isolation fonctionne.

L'API est mockée dans `src/app/api/mock/v1/[[...path]]` (latence de 1,5 à 4 s sur le POST, comme dans l'énoncé). Scénarios de test :

| Action | Résultat attendu |
|---|---|
| 2ᵉ date de la liste | « Complet », désactivée |
| 3ᵉ date | « Dernière place », pas de sélecteur de places |
| E-mail contenant `race` | La place part pendant la saisie → message de conflit, coordonnées conservées |
| E-mail contenant `500` | Erreur serveur avec bouton « Réessayer » |
| DevTools → Offline, puis confirmer | Message « issue incertaine » (voir Q. 3) |

Les événements de suivi s'observent dans la console :
`addEventListener("daisy:event", e => console.log(e.detail))`

> Ne pas lancer `esbuild` à la main sous PowerShell : les guillemets de `--define` sont supprimés et le bundle plante (`production is not defined`). Passer par `npm run build:widget`.

## Architecture

```
worker/embed.tsx        Loader : trouve #daisy-booking, crée le Shadow DOM, monte React
src/components/         Écrans du tunnel (widget, courseList, slotList, contactForm, confirmation, statusViews)
src/hooks/              bookingReducer (états du tunnel) + useBookingFlow (orchestration API)
src/services/           api.ts (client + mapping snake_case → camelCase), tracker.ts (événements)
src/utils/              formats, messages (tous les textes), validate, theme
src/styles/widget.css   CSS du widget, injecté dans le Shadow DOM
src/app/                Page hôte de test + mock API (Next.js)
```

Choix structurants :
- **Reducer + hook** : le tunnel est une machine à états explicite. Les cas pénibles (conflit, erreur) sont des actions nommées, donc testables sans UI.
- **Une seule frontière avec l'API** (`api.ts`) : le snake_case et les codes d'erreur sont traduits là, et nulle part ailleurs.
- **Tous les textes dans `messages.ts`** : relecture et traduction en un seul endroit.
- **Fuseau de l'atelier, jamais celui du navigateur** : « 14h » doit vouloir dire 14h à l'atelier.
- **`<div role="group">` plutôt que `<form>`** : évite une soumission native ou un rechargement sur un site hôte que je ne contrôle pas.

---

## Questions écrites

### 1. Le CSS du site hôte est agressif. Comment garantir l'affichage, et à quel prix ?

**Garantie : Shadow DOM** (`mode: open`) + `:host { all: initial }`. Les styles du site hôte ne traversent pas la frontière du shadow root, et seules les propriétés héritées (couleur, police) peuvent entrer, ce que `all: initial` neutralise. Le CSS du widget est injecté dans le shadow root, donc il ne fuit pas non plus vers l'hôte. React est embarqué dans le bundle : le widget fonctionne que l'hôte charge React, jQuery ou rien.
Les composants interactifs (`.dw-card`, `.dw-btn`) utilisent `all: unset` puis redéfinissent leur style, pour ne rien hériter des styles de boutons du navigateur.
Preuve : la page de test hostile (capture dans `docs/`) `[À COMPLÉTER : ajouter la capture]`.

**Prix payé :**
- **Poids** : React est embarqué. Bundle `[À COMPLÉTER : taille de public/widget.js après build]`. Preact ramènerait ça à une fraction, je ne l'ai pas fait par manque de temps.
- **Contenu invisible au SEO** : tout est rendu côté client dans un shadow root. Acceptable pour un tunnel de réservation, pas pour du contenu à référencer.
- **Pas d'héritage de la police de l'hôte** par défaut : le widget peut sembler « à côté » du site. J'ai prévu un preset `font: inherit` pour ceux qui le veulent.
- **Gestionnaires de mots de passe, autofill et lecteurs d'écran** se comportent parfois moins bien dans un shadow root. Non testé sur tous les navigateurs `[À COMPLÉTER]`.
- **Pas de rattrapage possible par l'hôte** : si un artisan veut changer un détail, il ne peut pas le faire en CSS. C'est voulu (voir Q. 2).

Alternative écartée : l'iframe. Isolation totale et plus simple, mais hauteur à synchroniser par `postMessage`, mauvais rendu mobile (scroll imbriqué) et impossible de réagir à la largeur du conteneur de l'hôte.

**Responsive** : container queries (`@container`) plutôt que media queries. Le widget réagit à sa propre largeur, ce qui couvre la colonne latérale de 320 px comme la pleine largeur.

### 2. « Moche sur mobile », et elle veut ses couleurs. Jusqu'où personnaliser ?

**Ce qui est personnalisable :**
- **Couleur principale** : elle vient de `GET /studio` (`branding.primary_color`), donc du back-office. L'artisan la change à un seul endroit, et elle s'applique au widget, aux e-mails, etc. Le texte du bouton passe automatiquement en noir ou blanc selon la luminance, pour garantir le contraste.
- **Rayon des bordures** : 3 valeurs (`none`, `soft`, `round`), via `data-radius`.
- **Police** : 3 valeurs (`inherit`, `sans`, `serif`), via `data-font`.

**Ce qui ne l'est pas :** espacements, tailles, structure, textes, CSS libre.

**Pourquoi, en pensant aux 70 ateliers :** chaque réglage libre est un cas à tester et à supporter, et une mise à jour du widget ne doit jamais casser 70 feuilles de style personnalisées. Un widget qui n'offre que des choix bornés ne peut pas devenir illisible (contraste garanti) ni inaccessible.

**« Moche sur mobile » n'est pas un réglage, c'est un bug de notre côté.** Je ne lui propose pas de personnalisation : je lui demande une capture, je reproduis, je corrige pour les 70. Les cibles tactiles font 44 px minimum et les champs 16 px (pas de zoom automatique sur iOS).

**Ce que je dirais à la potière :** « Votre couleur est reprise du back-office, et je regarde le rendu mobile cette semaine. »
**Limite à surveiller :** si plusieurs ateliers demandent la même chose (une 4ᵉ police, un mode sombre), on l'ajoute pour tous. On n'ouvre pas un champ libre.

### 3. La dernière place part pendant la saisie. Que voit l'utilisateur ?

Le serveur répond `409 slot_full`. Le widget recharge les créneaux, **conserve les coordonnées saisies**, renvoie l'utilisateur sur la liste des créneaux et affiche, en bandeau orange :

> **« Cette place vient d'être réservée par quelqu'un d'autre. Vos coordonnées sont conservées : choisissez un autre créneau ci-dessous, il suffira de confirmer. »**

Variantes gérées :
- `slot_full` avec `available > 0` (il reste moins de places que demandé) : on reste sur le formulaire, avec « Il ne reste plus que N place(s) sur ce créneau. Ajustez le nombre de places ou choisissez un autre créneau. »
- `slot_cancelled` : « Ce créneau a été annulé par l'atelier. Vos coordonnées sont conservées : choisissez une autre date. »

**Cas voisin que je trouve plus dangereux : le POST qui expire.** L'API met 1,5 à 4 s à répondre et n'offre pas de clé d'idempotence. Si la connexion tombe après l'envoi, je ne sais pas si la réservation existe. Un « Réessayer » aveugle risquerait un doublon. Le widget dit donc :

> « Nous n'avons pas reçu de réponse. Votre réservation a peut-être été enregistrée : vérifiez votre boîte mail (et vos spams) avant de réessayer, pour éviter un doublon. »

C'est moins élégant, mais honnête. **La vraie correction est côté API** (une `Idempotency-Key`), c'est la première chose que je demanderais.

### 4. Quel indicateur pour savoir si le widget marche ?

**Indicateur principal : le taux de conversion du tunnel**, soit les sessions ayant atteint `booking_confirmed` sur celles ayant vu l'étape `courses`, **par atelier** (une moyenne globale cacherait les ateliers cassés). Il se décompose en étapes (`step_viewed`) pour voir où l'on perd les gens.

**Indicateurs de santé associés :**
- `api_error` par `kind` : en particulier `origin`, qui mesure les ateliers n'ayant pas déclaré leur domaine (environ 1 installation sur 3 d'après l'énoncé, et motif de contact n°2 du support). Un pic de `origin` après une installation = ticket support évitable.
- `booking_conflict` : taux de « place prise pendant la saisie ». S'il monte, il faut un système de réservation temporaire de la place.
- Latence réelle du POST (p50 / p95).
- `abandon` avec l'étape, pour distinguer « parti en lisant » de « parti au formulaire ».

**Limite à dire clairement :** l'API n'expose pas de point d'entrée pour les événements. Le widget émet donc des `CustomEvent` DOM (`daisy:event`) et **rien ne les collecte aujourd'hui**. Ce que j'ai livré est l'instrumentation, pas le tableau de bord. Mon prochain pas serait un `POST /events` (ou un branchement Plausible/PostHog), et de comparer ensuite le taux avant/après chaque changement de formulaire.

---

## Hypothèses (à valider avec l'équipe)

Ce que l'énoncé ne dit pas, et ce que j'ai supposé pour avancer :

1. **Transmission de la clé publique** : non précisée. J'envoie un header `X-Studio-Key`. Un paramètre de requête est l'alternative.
2. **Format de `from` / `to`** : supposé `YYYY-MM-DD`. Fenêtre de 89 jours (l'API refuse au-delà de 90).
3. **Pas d'`Idempotency-Key`** sur `POST /bookings` : d'où le traitement de l'issue incertaine (Q. 3).
4. **Pas de point d'entrée pour les événements** : d'où les `CustomEvent` (Q. 4).
5. **Aucune réservation temporaire de la place** pendant le remplissage : le conflit est donc inévitable et géré, mais pas évité.
6. **`data-api`** surcharge l'URL de l'API, uniquement pour le développement avec le mock.
7. Le tunnel réserve **un créneau à la fois**, avec un nombre de places choisi par l'utilisateur dans la limite de `max_seats_per_booking`.

## Ce que je n'ai pas fait

- **Tests automatisés.** Le reducer et `validateContact` s'y prêtent bien (fonctions pures). Je les aurais écrits avec Vitest en premier. Aujourd'hui, la vérification est manuelle, via les scénarios du mock ci-dessus.
- **Test réel sur Wix / Squarespace / WordPress**, et sur de vrais téléphones. J'ai testé un CSS hostile simulé et les largeurs 320 et 375 px dans les DevTools.
- **Audit d'accessibilité complet** (lecteur d'écran, navigation clavier de bout en bout). Les bases sont posées (labels, `aria-live`, `role="alert"`, focus visible, contrastes) mais pas vérifiées.
- **Preact** pour alléger le bundle.
- **Chargement paresseux** des écrans, et pagination des cours pour les ateliers de plus de 40 cours (aujourd'hui, tout est affiché).
- **Internationalisation** : textes en français uniquement, mais centralisés dans `messages.ts`.
- **Collecte des événements**, voir Q. 4.
- **Prix en cas de variation entre deux créneaux** : affiché par créneau, mais pas de message si le prix change entre l'affichage et la confirmation.