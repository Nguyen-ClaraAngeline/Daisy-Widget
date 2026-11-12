# Daisy Widget — comment ça fonctionne

Un widget de réservation que l'artisan ajoute sur son site avec deux lignes de code. Le visiteur choisit un cours, une date, laisse ses coordonnées, et reçoit une confirmation.

## 1. L'installation côté artisan

```html
<div id="daisy-booking" data-studio="std_pk_7f2a9c"></div>
<script src="https://widget.daisy.example/v1.js" async></script>
```

- `data-studio` est la clé publique de l'atelier. Elle ne donne accès qu'à la lecture des cours et à la création de réservations.
- Le script cherche le `<div>`, crée une zone isolée (Shadow DOM) et y affiche le widget.
- Grâce à cette zone isolée, le CSS du site de l'artisan ne peut pas casser le widget.

## 2. Le parcours du visiteur

```
Cours  →  Créneau  →  Coordonnées  →  Confirmation
```

| Étape | Ce que voit le visiteur | Appel à l'API |
|---|---|---|
| Au chargement | Les cours de l'atelier (prix, durée, description) | `GET /studio` et `GET /courses` |
| Choix d'un cours | Les dates des 90 prochains jours, avec places restantes et prix | `GET /courses/{id}/slots` |
| Choix d'une date | Formulaire : prénom, nom, e-mail, téléphone, nombre de places, notes | aucun |
| Clic sur « Confirmer » | « Réservation en cours… » pendant 1,5 à 4 s | `POST /bookings` |
| Réponse | Code de confirmation et récapitulatif | |

## 3. Ce qui se passe quand ça ne va pas

| Situation | Ce que fait le widget |
|---|---|
| Chargement en cours | Des blocs gris en attente |
| Date complète | Grisée, « Complet » |
| Tous les créneaux complets | Message « Ce cours est complet pour le moment » |
| Coupure réseau ou lenteur | Message clair et bouton « Réessayer » |
| Dernière place prise pendant la saisie | Retour aux dates mises à jour, coordonnées conservées, message orange |
| Moins de places que demandé | Reste sur le formulaire et propose d'ajuster |
| Créneau annulé par l'atelier | Retour aux dates, coordonnées conservées |
| Pas de réponse au moment de réserver | « Vérifiez votre boîte mail avant de réessayer » (on évite un doublon) |
| Domaine du site non déclaré chez Daisy | Message qui explique comment le déclarer |

## 4. Personnalisation

- La **couleur** vient du back-office Daisy (l'artisan la change à un seul endroit).
- Deux réglages optionnels sur le `<div>` : `data-radius` (`none`, `soft`, `round`) et `data-font` (`inherit`, `sans`, `serif`).
- Rien d'autre n'est modifiable, pour que le widget fonctionne de la même façon chez tous les ateliers.

## 5. Organisation du code

```
worker/embed.tsx       Point d'entrée : trouve le <div>, crée le Shadow DOM, affiche le widget
src/components/        Les écrans (liste des cours, des dates, formulaire, confirmation)
src/hooks/             La logique du parcours (où en est le visiteur, que faire à chaque action)
src/services/          api.ts : appels à l'API, tracker.ts : événements de suivi
src/utils/             Formats de dates et prix, textes, validation, thème
src/styles/            Le CSS du widget
src/app/               Un faux site hôte (CSS hostile) pour tester + une fausse API
```

## 6. Lancer et tester

```bash
npm install
npm run dev
```

Ouvrir `http://localhost:3000`. La page de test a un CSS volontairement agressif : si le widget reste propre, l'isolation fonctionne.

Pour tester les cas particuliers avec la fausse API :
- e-mail contenant `race` → la dernière place est prise pendant la saisie ;
- e-mail contenant `500` → erreur serveur ;
- 2ᵉ date de la liste → complète ; 3ᵉ date → « Dernière place ».

Le widget envoie aussi des événements dans le navigateur (`daisy:event`) pour mesurer le parcours. Pour les voir :

```js
addEventListener("daisy:event", e => console.log(e.detail))
```