# Rapport — Sujet B (widget) + socle commun

Écrit à plat. J'ai mis ce que j'ai compris, décidé, et ce dont je ne suis pas sûre, plus que la liste de ce qui est fait (le README et le code la donnent).

## 1. Journal de bord

Temps passé : environ 17h dessus mais on et off. 

J'ai choisi le sujet B – Le widget de réservation, car il présente un bon équilibre entre des problématiques Front-End et Back-End. Il m'a notamment permis de travailler sur la conception d'une interface utilisateur, la gestion des réservations et des différents états du système, ainsi que sur l'intégration du widget dans un site tiers.
En raison du temps limité et de mon emploi du temps chargé, je n'ai malheureusement pas pu approfondir et mettre en oeuvre autant de fonctionnalités que je l'aurais souhaité. J'ai donc dû faire des choix concernant les fonctionnalités à prioriser, en privilégiant la réalisation du parcours principal et le respect des attentes essentielles du sujet.

Ordre : lecture de l'énoncé et de l'annexe API, puis **décision d'isolation CSS avant d'écrire du code** (Shadow DOM ou iframe), parce qu'elle conditionne le reste. Ensuite la couche basse (types, client API, textes), le reducer du tunnel, les composants, le loader, un faux site hôte hostile, un mock de l'API. Enfin une relecture complète, puis README et rapport.

Ce qui m'a ralentie :
- **Noms de fichiers sous Windows** : `Widget.tsx` et `widget.tsx` sont le même fichier pour Windows, pas pour TypeScript. Règle fixée : camelCase partout sauf ce que Next impose, plus `forceConsistentCasingInFileNames`.
- **PowerShell et les guillemets** de `--define:process.env.NODE_ENV='"production"'` : bundle de 651 ko et erreur `production is not defined`. Déplacé dans `build.mjs`.
- **Dossier `vi` au lieu de `v1`** : le mock répondait 404 et le widget affichait « vérifiez le formulaire ». Mauvais message pour une panne qui n'a rien à voir avec l'utilisateur, donc un 404 est maintenant traité comme une erreur de notre côté.
- **CSS tronqué** : widget sans style, et le rouge de la page hôte fuitait dedans. Ça m'a servi de contre-test de l'isolation.

Le manque de temps m'a fait m'appuyer sur l'IA pour avancer vite, et c'est aussi ce qui explique ce que j'ai abandonné, en connaissance de cause : Preact, test sur de vrais Wix/Squarespace, audit lecteur d'écran, collecte des événements. J'ai préféré un tunnel complet avec tous ses états d'erreur, relu et testé.

## 2. Les arbitrages (le plus important)

**Shadow DOM plutôt qu'iframe.** L'iframe isole mieux (y compris les données), mais la hauteur se synchronise par postMessage, le scroll imbriqué est mauvais sur mobile (60 % du trafic, souvent depuis Instagram), et on ne réagit pas à la largeur du conteneur. Coût accepté : bundle plus lourd, et **pas d'isolation des données** (un script de l'hôte peut lire les champs). Acceptable parce que l'hôte est l'artisan lui-même ; à rouvrir si un paiement entre un jour dans le widget.

**Personnalisation très limitée** (couleur du back-office, rayon et police en 3 valeurs). Avec 70 ateliers et 3 développeurs, chaque réglage libre est un cas à supporter. « Moche sur mobile » est un bug à corriger pour tous, pas une option. Ce que je ne sais pas : si les artisans l'accepteront. Je le verrais au volume de demandes de personnalisation au support.

**Pas de réessai sur la réservation après un timeout.** L'API est lente et sans clé d'idempotence : si la réponse se perd, je ne sais pas si la réservation existe. Un doublon est pire qu'un clic en plus. Le widget dit « vérifiez votre boîte mail » et ne propose pas de bouton de réessai. UX dégradée assumée, la vraie solution est côté API.

**Conflit « dernière place » : on garde les coordonnées**, on renvoie sur les dates rafraîchies. Je ne peux pas l'éviter (pas de réservation temporaire de la place), seulement le rendre peu coûteux.

**Fuseau de l'atelier, pas du navigateur.** « 14h » doit rester 14h pour quelqu'un en déplacement.

**Peu de dépendances, aucun stockage local.** Moins de surface d'attaque, et pas de donnée personnelle qui traîne dans le navigateur d'un visiteur.

**Suivi : instrumentation sans collecte.** Le widget émet des événements DOM sans donnée personnelle, rien ne les récupère, faute de point d'entrée API. Je préfère le dire que cacher le trou.

## 3. Relecture : ce que j'ai vérifié, ce que j'ai corrigé

**Usage de l'IA : je préfère être transparente.** J'ai utilisé Claude (assistant conversationnel), en grande partie à cause du manque de temps :
- pour **comprendre** l'énoncé, l'annexe API et les pièges d'intégration (Shadow DOM, CSS hostile, mobile) ;
- pour **corriger des erreurs** (TypeScript, noms de fichiers sous Windows, build, mock) ;
- pour **améliorer l'architecture** et relire le code ;
- pour rédiger des **brouillons** de README et de rapport, que j'ai relus et adaptés.

Je ne l'ai pas pris tel quel : j'ai relu l'ensemble contre l'énoncé et l'annexe API, et voici ce que cette relecture a trouvé.


## 4. Ce que je ferais ensuite (dans cet ordre, et pourquoi)

1. **Idempotency-Key sur `POST /bookings`** (demande à l'équipe API) : supprime le seul cas où je dois dégrader l'expérience pour éviter un doublon.
2. **Collecte des événements** : sans mesure, impossible de savoir si une modification du formulaire améliore ou aggrave la conversion.
3. **Test sur de vrais hôtes et de vrais téléphones** (Wix, Squarespace, WordPress, Safari iOS) : c'est là que les surprises d'isolation et d'autofill se trouveront.
4. **Réservation temporaire de la place** : réduit les conflits, à décider selon le taux de `booking_conflict` mesuré.
5. **Preact** : réduire le poids si la mesure de chargement le justifie.
6. **Mention RGPD** et protection anti-bot côté API.


## 5. Ce dont je ne suis pas sûre

- Envoi de la clé publique (header choisi, non précisé) et format des dates `from`/`to`.
- Comportement de l'API en cas de doublon de réservation.
- Shadow DOM avec certains lecteurs d'écran, gestionnaires de mots de passe, CSP strictes. Non testé.
- Performances avec plus de 40 cours (recherche ajoutée, mais tout est rendu en une fois).
- Si le correctif de contraste (assombrir la couleur de l'atelier) est acceptable pour les artisans, ou s'il faut le refuser et les prévenir.

## 6. Tri des tickets (du plus d'envie au moins d'envie)

1. **5**, abandon de 60 % aux coordonnées : une enquête. Hypothèse, mesure, correction.
2. **1**, format de dates changé par un partenaire : urgent, concret, résultat immédiat.
3. **7**, export comptable ≠ relevés bancaires : comprendre l'écart, la confiance des artisans en dépend.
4. **2**, calendrier lent à 200 cours : problème mesurable.
5. **6**, API publique : gros sujet de conception, je veux voir des besoins réels avant.
6. **3**, paiement TPE : dépend de contraintes externes.
7. **4**, filtre par type de cours : simple, sans surprise.
8. **8**, design system : utile, mais à faire par petites touches.

Ce classement reflète ma façon d'aborder le travail en équipe : j'aime comprendre l'origine d'un problème avant de chercher à le résoudre, et je suis particulièrement motivée par les sujets qui ont un impact concret sur les utilisateurs. J'apprécie de pouvoir analyser une situation, proposer des solutions et contribuer à améliorer l'expérience au quotidien. Je suis également consciente qu'il faut savoir trouver un équilibre entre les problèmes complexes et les tâches plus simples, mais tout aussi importantes pour le bon fonctionnement du produit. Je souhaite donc rester polyvalente et être capable de m'adapter aux besoins et aux priorités de l'équipe.

## 7. Mes deux premières semaines

**Semaine 1, je ne change rien d'important.** Je lis le code des parcours critiques (réservation, synchro partenaires, facturation). 30 minutes avec chaque développeur : qu'est-ce qui fait peur à déployer, quelle dette tout le monde connaît. Je lis les tickets support récents et les derniers incidents, et j'écoute un ou deux appels clients ou je regarde un artisan utiliser l'outil. Je prends un petit ticket sans risque et je le mène jusqu'en production, pour apprendre la revue et le déploiement.

**Semaine 2, je regarde ce qu'on mesure.** Erreurs, temps de réponse, échecs de synchro. S'il n'y a rien, j'installe un seul indicateur sur le parcours le plus critique. Je vérifie qu'une sauvegarde de la base a été **restaurée au moins une fois** et que les secrets ne sont pas dans le dépôt. J'écris une page (ce que j'ai compris, ce que je ne comprends pas, ce que je propose en premier) et je la relis avec Charlotte et les développeurs. On choisit ensemble le premier gros sujet.

Ce que je ne fais pas : refactorer en grand, introduire un outil, critiquer un choix sans en connaître l'histoire. Quatre ans de code et 70 clients, ça a sûrement des raisons.

## 8. Ce que j'aurais voulu demander

**Question technique :** comment la création de réservation gère-t-elle une réponse perdue ? Y a-t-il une clé d'idempotence, ou un moyen de retrouver une réservation avec un identifiant généré par le widget ?

**Pourquoi :** le POST est lent et synchrone (base, partenaires, e-mail), et sur mobile la connexion tombe souvent. Sans réponse, le widget ne sait pas si la réservation existe.

**Ce que j'ai supposé :** pas d'idempotence, donc aucun réessai automatique sur cette requête et le message « vérifiez votre boîte mail ». Avec une clé, je l'enverrais à chaque tentative et le réessai deviendrait sûr.
