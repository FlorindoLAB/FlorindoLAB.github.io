# FlorindoLAB – site

Site statique (rien à installer) : HTML, CSS et JavaScript, hébergeable gratuitement sur GitHub Pages.

## Mettre en ligne
1. Crée un dépôt public nommé `FlorindoLAB.github.io` sur GitHub et envoie-y tout le contenu de ce dossier (Add file > Upload files).
2. Settings > Pages > « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Domaine : Settings > Pages > « Custom domain » : `florindolab.com`. Chez OVH (zone DNS du domaine), ajoute les enregistrements indiqués dans la documentation GitHub Pages. Active ensuite « Enforce HTTPS ».

## Publier une version d'un outil
1. Le dépôt public `FlorindoLAB/downloads` (déjà indiqué dans `data/site.json`) héberge les Releases.
2. Releases > « Draft a new release » : tag = nom de l'outil + `-v` + numéro (ex. `guides-composition-v1.2.0`). Joins les fichiers (.exe, .apk, .dctl, .zip), écris les nouveautés, publie.
3. Le site affiche tout seul la dernière version et l'historique.

## Ajouter un outil
- Copie un bloc dans `data/tools.json` : nom et résumé en français et anglais, catégories, plateformes (`web`, `dctl`, `android`, `windows`).
- `releasePrefix` = début des tags des Releases. `"status": "soon"` pour un outil à venir.
- Outil web : dépose son `index.html` dans `tools/<id>/` (les deux exemples sont des fichiers à remplacer).

## Ajouter une catégorie ou une langue
- Catégorie : une ligne dans `categories` de `data/tools.json`.
- Langue : ajoute son code dans `languages` (`data/site.json`) et copie `i18n/fr.json` en `i18n/es.json` pour le traduire. Un nom d'outil sans traduction retombe sur l'anglais.

## Licence
Le texte de la page « Licence » (français et anglais) est dans `data/license.json`. Place aussi `LICENSE-freeware-FR-EN.txt` (champs à remplir) dans le zip de chaque logiciel.

## Tester en local
Dans le dossier : `python -m http.server`, puis http://localhost:8000.

## À personnaliser
`data/site.json` : dépôt des Releases et lien de dons (Ko-fi).
