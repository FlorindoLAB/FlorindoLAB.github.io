(function () {
'use strict';
const $ = id => document.getElementById(id);
/*I18N_DICT*/
const I18N_EN = {
  // En-tête, modes
  'Express': 'Express', 'Avancé': 'Advanced', 'Langue': 'Language', 'Exporter': 'Export', 'Nouveau': 'New',
  'Ouvrir un projet…': 'Open project…', 'Enregistrer le projet': 'Save project', 'Annuler (Ctrl+Z)': 'Undo (Ctrl+Z)', 'Annuler': 'Undo',
  'Rétablir (Ctrl+Y)': 'Redo (Ctrl+Y)', 'Rétablir': 'Redo', 'Prototype 0.2': 'Prototype 0.2', 'Prototype 0.3': 'Prototype 0.3',
  // Express
  'Type de relief': 'Terrain type', 'Tout': 'All', 'Bruits': 'Noises', 'Montagnes': 'Mountains', 'Collines': 'Hills', 'Volcans': 'Volcanoes',
  'Désert': 'Desert', 'Îles et côtes': 'Islands & coasts', 'Vallées': 'Valleys', 'Plateaux': 'Plateaus', 'Surfaces': 'Surfaces',
  'Extraterrestre': 'Alien', 'Organique': 'Organic', 'Motion design': 'Motion design', 'Jeu vidéo': 'Video game', 'Perso': 'Custom',
  'Nouvelle variation': 'New variation', 'La variation tire de nouvelles graines en gardant les réglages.': 'A variation draws new seeds and keeps your settings.',
  'Érosion': 'Erosion', 'Aucune': 'None', 'Légère': 'Light', 'Moyenne': 'Medium', 'Forte': 'Strong', 'Ravinée': 'Gullied', 'Éboulis (thermique)': 'Scree (thermal)',
  // Presets
  'Perlin fBm': 'Perlin fBm', 'Nuages (billow)': 'Clouds (billow)', 'Turbulence': 'Turbulence', 'Ridged multifractal': 'Ridged multifractal',
  'Bruit de valeur': 'Value noise', 'Cellules de Voronoi': 'Voronoi cells', 'Réseau de Voronoi': 'Voronoi network', 'Bulles': 'Bubbles', 'Cellules carrées': 'Square cells',
  'Montagnes alpines': 'Alpine mountains', 'Hautes chaînes': 'High ranges', 'Massif érodé': 'Eroded massif', 'Pics isolés': 'Lone peaks', 'Chaîne centrale': 'Central range',
  'Collines vallonnées': 'Rolling hills', 'Collines douces': 'Gentle hills', 'Vallons boisés': 'Wooded dales', 'Plaine ondulée': 'Undulating plain',
  'Paysage volcanique': 'Volcanic landscape', 'Caldeira': 'Caldera', 'Stratovolcan': 'Stratovolcano', 'Champ de cônes': 'Cone field',
  'Dunes désertiques': 'Desert dunes', 'Barkhanes': 'Barchans', 'Mer de sable': 'Sand sea', 'Mesas': 'Mesas',
  'Archipel': 'Archipelago', 'Île unique': 'Single island', 'Atoll': 'Atoll', 'Côte découpée': 'Jagged coast',
  'Canyon': 'Canyon', 'Gorges profondes': 'Deep gorges', 'Badlands': 'Badlands', 'Vallée glaciaire': 'Glacial valley',
  'Plateaux en terrasses': 'Terraced plateaus', 'Rizières': 'Rice terraces', 'Tépuys': 'Tepuis',
  'Surface rocheuse': 'Rocky surface', 'Pavés': 'Cobblestones', 'Strates rocheuses': 'Rock strata', 'Écorce': 'Bark', 'Béton grêlé': 'Pitted concrete', 'Sol craquelé': 'Cracked ground',
  'Planète cratérisée': 'Cratered planet', 'Plaines martiennes': 'Martian plains', 'Banquise fracturée': 'Fractured ice sheet', 'Spires extraterrestres': 'Alien spires',
  'Relief organique': 'Organic relief', 'Peau de reptile': 'Reptile skin', 'Corail cérébral': 'Brain coral', 'Tissu froissé': 'Crumpled cloth',
  'Ondes': 'Ripples', 'Interférences': 'Interference', 'Spirale': 'Spiral', 'Grille de bosses': 'Bump grid', 'Vagues': 'Waves',
  'Île stylisée': 'Stylized island', 'Arène': 'Arena', 'Collines low-poly': 'Low-poly hills', 'Plateaux de jeu': 'Game plateaus',
  // Noms de couches des presets
  'Détails': 'Details', 'Bombé central': 'Central dome', 'Masque central': 'Central mask', 'Petits cratères': 'Small craters', 'Second cône': 'Second cone', 'Sol': 'Ground',
  'Grandes ondulations': 'Large undulations', 'Grain': 'Grain', 'Relief': 'Relief', 'Pente vers la mer': 'Slope to the sea', 'Vallée en U': 'U-shaped valley',
  'Blocs': 'Blocks', 'Nœuds': 'Knots', 'Trous': 'Holes', 'Failles': 'Faults', 'Ondulation': 'Undulation', 'Paliers': 'Steps', 'Sculpture': 'Sculpt',
  // Couches
  'Couches': 'Layers', 'Charger un preset': 'Load a preset', 'Charger un preset…': 'Load a preset…', 'Glisser pour déplacer': 'Drag to move',
  'Activer ou désactiver la couche': 'Enable or disable the layer', 'Monter': 'Move up', 'Descendre': 'Move down', 'Supprimer': 'Delete',
  'Couche à ajouter': 'Layer to add', 'Générateurs': 'Generators', 'Terrains': 'Terrains', 'Surfaces et motifs': 'Surfaces & patterns', 'Formes': 'Shapes', 'Filtres': 'Filters',
  'Image': 'Image', 'Image importée…': 'Imported image…', '+ Ajouter': '+ Add', 'Variation': 'Variation', 'Vider la pile': 'Clear stack', 'Confirmer': 'Confirm',
  'La couche du haut s\'applique en dernier. Glissez une couche par sa poignée pour changer l\'ordre. Suppr efface la couche sélectionnée. Une image glissée sur la vue devient une couche.':
    'The top layer is applied last. Drag a layer by its handle to reorder. Delete removes the selected layer. An image dropped on the view becomes a layer.',
  'Pile vide. Choisissez une couche ci-dessous puis « Ajouter ».': 'Empty stack. Pick a layer below, then “Add”.',
  'Bruit fractal': 'Fractal noise', 'Voronoi (cellulaire)': 'Voronoi (cellular)', 'Dunes': 'Dunes', 'Cratères': 'Craters', 'Canyons': 'Canyons',
  'Plateaux et terrasses': 'Plateaus & terraces', 'Îles et archipels': 'Islands & archipelagos', 'Volcan': 'Volcano', 'Motifs abstraits': 'Abstract patterns', 'Forme primitive': 'Primitive shape',
  'Érosion hydraulique': 'Hydraulic erosion', 'Érosion thermique': 'Thermal erosion', 'Couche de sculpture': 'Sculpt layer', 'Filtre': 'Filter',
  // Mes presets
  'Mes presets': 'My presets', 'Nom du nouveau preset': 'New preset name', 'Nom du preset': 'Preset name', 'Enregistrer la pile': 'Save the stack',
  'Aucun preset perso pour l\'instant.': 'No custom presets yet.', 'Tout exporter': 'Export all', 'Importer…': 'Import…', 'Charger': 'Load', 'Suppr.': 'Delete',
  'Les presets perso sont gardés dans ce navigateur uniquement. Ils disparaissent si les données du site sont effacées, en navigation privée, ou sur un autre navigateur ou ordinateur. Le fichier exporté (.json) est votre sauvegarde, et sert aussi à les partager.':
    'Custom presets are kept in this browser only. They disappear if site data is cleared, in private browsing, or on another browser or computer. The exported file (.json) is your backup, and also lets you share them.',
  'Ce navigateur ne garde pas les données (navigation privée ou stockage bloqué) : vos presets perso disparaîtront à la fermeture. Exportez-les.':
    'This browser does not keep data (private browsing or blocked storage): your custom presets will be lost when you close it. Export them.',
  // Globaux
  'Réglages globaux': 'Global settings', 'Échelle globale': 'Global scale', 'Double-clic : valeur par défaut': 'Double-click: default value', 'Courbe de hauteur': 'Height curve',
  'Normaliser (0 à 1)': 'Normalize (0 to 1)', 'Inverser le relief': 'Invert the relief', 'Raccord sans couture (seamless)': 'Seamless tiling', 'Largeur de la zone de raccord': 'Blend band width',
  // Vue
  'Map': 'Map', 'Height map': 'Height map', 'Normal map': 'Normal map', 'Pente': 'Slope', 'Courbure': 'Curvature', 'Occlusion ambiante': 'Ambient occlusion',
  'Masque d\'altitude': 'Height mask', 'Masque de pente': 'Slope mask', 'Masque de cavités': 'Cavity mask',
  'height map': 'height map', 'normal map': 'normal map', 'pente': 'slope', 'courbure': 'curvature', 'occlusion ambiante': 'ambient occlusion', 'masque d\'altitude': 'height mask', 'masque de pente': 'slope mask', 'masque de cavités': 'cavity mask',
  'Hauteur': 'Height', 'Lumière': 'Light', 'Maillage': 'Wireframe', 'Grille': 'Grid', 'Répéter 3×3': 'Tile 3×3', 'Couche seule': 'Solo layer', 'Couleur': 'Color',
  'Altitude': 'Elevation', 'Niveaux de gris': 'Grayscale', 'Relief ombré': 'Hillshade', 'Argile': 'Clay', 'Maintenir pour voir l\'état précédent': 'Hold to see the previous state',
  'Avant / après': 'Before / after', 'Aperçu': 'Preview', 'La vue 3D n\'a pas pu charger Three.js. La vue 2D reste disponible.': 'The 3D view could not load Three.js. The 2D view is still available.',
  'WebGL n\'est pas disponible sur cet appareil. Utilisez la vue 2D.': 'WebGL is not available on this device. Use the 2D view.',
  'Déposez l\'image pour l\'ajouter comme couche': 'Drop the image to add it as a layer', 'Initialisation…': 'Starting…',
  'Toutes les couches sont désactivées.': 'All layers are disabled.', 'Pile vide : ajoutez un générateur, une image ou un filtre.': 'Empty stack: add a generator, an image or a filter.',
  'Choisissez un type de relief à gauche, ou passez en mode Avancé pour partir de zéro.': 'Pick a terrain type on the left, or switch to Advanced mode to start from scratch.',
  // Barre d'état
  'Aperçu ': 'Preview ', 'calcul': 'computed in', 'valeurs brutes': 'raw values', 'à': 'to', 'couches actives': 'active layers', 'couche active': 'active layer',
  'recalculées': 'recomputed', 'raccord : bord': 'seam: edge', '/ intérieur': '/ interior', 'continu': 'continuous', 'visible': 'visible', 'couche seule': 'solo layer',
  '(sans worker)': '(no worker)', 'pixel': 'pixel', '16 bits': '16-bit',
  // Propriétés
  'Paramètres': 'Settings', 'Couche sélectionnée': 'Selected layer', 'Nom de la couche': 'Layer name', 'Dupliquer': 'Duplicate', 'Générateur': 'Generator', 'Mélange': 'Blending',
  'Mode de fusion': 'Blend mode', 'Fondu': 'Normal', 'Ajouter': 'Add', 'Soustraire': 'Subtract', 'Multiplier': 'Multiply', 'Maximum': 'Maximum', 'Minimum': 'Minimum', 'Masque': 'Mask',
  'Intensité': 'Intensity', 'Intensité de l\'effet': 'Effect intensity', 'Inverser cette couche': 'Invert this layer', 'Limiter selon l\'altitude': 'Limit by elevation',
  'Altitude minimale': 'Minimum elevation', 'Altitude maximale': 'Maximum elevation', 'Transition': 'Transition',
  'Couche de base : tout en bas de la pile, elle pose le relief. Son mode de fusion agira dès qu\'une autre couche passera dessous.':
    'Base layer: at the bottom of the stack, it lays down the relief. Its blend mode will apply as soon as another layer goes below it.',
  'Sélectionnez une couche dans la pile, ou ajoutez-en une.': 'Select a layer in the stack, or add one.', 'Choisissez un type de relief à gauche.': 'Pick a terrain type on the left.',
  'Paramètres du générateur': 'Generator settings', 'Réglages de l\'image': 'Image settings', 'Paramètres du filtre': 'Filter settings', 'Paramètres de l\'érosion': 'Erosion settings',
  'Source': 'Source',
  // Paramètres des générateurs
  'Graine': 'Seed', 'Tirer une graine au hasard': 'Draw a random seed', 'Graine au hasard': 'Random seed', 'Échelle (fréquence)': 'Scale (frequency)', 'Détails (octaves)': 'Detail (octaves)',
  'Rugosité': 'Roughness', 'Lacunarité': 'Lacunarity', 'Distorsion': 'Warp', 'Décalage X': 'Offset X', 'Décalage Y': 'Offset Y', 'Netteté des crêtes': 'Ridge sharpness',
  'Profondeur des vallées': 'Valley depth', 'Nombre de dunes': 'Number of dunes', 'Direction du vent (°)': 'Wind direction (°)', 'Asymétrie': 'Asymmetry', 'Ondulation ': 'Undulation ',
  'Variation de hauteur': 'Height variation', 'Rides de sable': 'Sand ripples', 'Densité de cratères': 'Crater density', 'Taille': 'Size', 'Profondeur': 'Depth',
  'Hauteur des bords': 'Rim height', 'Proportion de cellules': 'Cell coverage', 'Relief de fond': 'Base relief', 'Échelle du fond': 'Base scale', 'Largeur des gorges': 'Gorge width',
  'Strates': 'Strata', 'Méandres': 'Meanders', 'Nombre de paliers': 'Number of steps', 'Douceur des marches': 'Step softness', 'Niveau de la mer': 'Sea level',
  'Regroupement au centre': 'Gather toward center', 'Pente des côtes': 'Coast steepness', 'Taille des blocs (fréquence)': 'Block size (frequency)', 'Largeur des fissures': 'Crack width',
  'Variation des blocs': 'Block variation', 'Bombé des blocs': 'Block bulge', 'Irrégularité': 'Irregularity', 'Rayon de la base': 'Base radius', 'Profil des pentes': 'Slope profile',
  'Taille du cratère': 'Crater size', 'Profondeur du cratère': 'Crater depth', 'Ravines': 'Ravines', 'Nombre de ravines': 'Number of ravines', 'Relief du sol': 'Ground relief',
  'Position X': 'Position X', 'Position Y': 'Position Y', 'Torsion': 'Twist', 'Motif': 'Pattern', 'Ondes concentriques': 'Concentric ripples', 'Rayures': 'Stripes',
  'Fréquence': 'Frequency', 'Perturbation': 'Perturbation', 'Profil': 'Profile', 'Centre X': 'Center X', 'Centre Y': 'Center Y', 'Forme': 'Shape', 'Dôme': 'Dome', 'Cône': 'Cone',
  'Pyramide': 'Pyramid', 'Anneau': 'Ring', 'Plateau': 'Plateau', 'Pente linéaire': 'Linear slope', 'Douceur': 'Softness', 'Angle (pente)': 'Angle (slope)',
  'Type de bruit': 'Noise type', 'Perlin': 'Perlin', 'Simplex': 'Simplex', 'Valeur (value noise)': 'Value noise', 'Variante': 'Variant', 'Standard (fBm)': 'Standard (fBm)',
  'Billow (bosses arrondies)': 'Billow (rounded bumps)', 'Ridged (crêtes)': 'Ridged (ridges)', 'Rendu': 'Output', 'Distance au point (F1)': 'Distance to point (F1)',
  'Seconde distance (F2)': 'Second distance (F2)', 'Bords des cellules (F2 − F1)': 'Cell edges (F2 − F1)', 'Cellules plates': 'Flat cells', 'Cellules bombées': 'Domed cells',
  'Distance': 'Distance metric', 'Euclidienne (ronde)': 'Euclidean (round)', 'Manhattan (losanges)': 'Manhattan (diamonds)', 'Chebyshev (carrés)': 'Chebyshev (squares)',
  'Nombre de cellules (fréquence)': 'Number of cells (frequency)', 'Octaves': 'Octaves', 'Poids des octaves': 'Octave weight',
  // Image
  'Cadrage': 'Framing', 'Remplir (recadre)': 'Fill (crops)', 'Étirer': 'Stretch', 'Point noir': 'Black point', 'Point blanc': 'White point', 'Contraste': 'Contrast',
  'Luminosité': 'Brightness', 'Gamma': 'Gamma', 'Lissage': 'Smoothing', 'Netteté': 'Sharpness',
  // Filtres
  'Opération': 'Operation', 'Lisser': 'Smooth', 'Terrasses': 'Terraces', 'Courbe (gamma)': 'Curve (gamma)', 'Courbe': 'Curve', 'Niveaux': 'Levels', 'Inverser': 'Invert',
  'Rayon (part de la largeur)': 'Radius (fraction of width)', 'Bas': 'Low', 'Haut': 'High',
  // Érosion
  'Préréglage': 'Preset', 'Appliquer un préréglage…': 'Apply a preset…', 'Modèle': 'Model', 'Hydraulique (pluie, rigoles)': 'Hydraulic (rain, gullies)', 'Thermique (éboulis, talus)': 'Thermal (scree, talus)',
  'Résolution de simulation': 'Simulation resolution', '256 (rapide)': '256 (fast)', '1024 (fin, plus lent)': '1024 (fine, slower)', 'Hauteur du relief simulé': 'Simulated relief height',
  'Quantité de pluie': 'Rain amount', 'Force d\'érosion': 'Erosion strength', 'Dépôt de sédiments': 'Sediment deposition', 'Capacité de transport': 'Carrying capacity',
  'Inertie des gouttes': 'Droplet inertia', 'Évaporation': 'Evaporation', 'Durée de vie des gouttes': 'Droplet lifetime', 'Largeur des rigoles': 'Gully width', 'Angle de talus (°)': 'Talus angle (°)',
  'L\'érosion est simulée sur une grille fixe puis appliquée à la map : l\'aperçu et l\'export donnent le même résultat. Une résolution de 1024 donne des rigoles plus fines mais prend quelques secondes.':
    'Erosion is simulated on a fixed grid, then applied to the map: preview and export give the same result. A 1024 resolution gives finer gullies but takes a few seconds.',
  // Sculpture
  'Brosse': 'Brush', 'Creuser': 'Lower', 'Aplatir': 'Flatten', 'Pincer': 'Pinch', 'Bruit': 'Noise', 'Flou': 'Blur', 'Cloner': 'Clone', 'Rayon': 'Radius', 'Force': 'Strength',
  'Dureté du bord': 'Edge hardness', 'Retirer le dernier trait': 'Remove last stroke', 'Tout effacer': 'Clear all',
  'monte le relief': 'raises the relief', 'creuse le relief': 'digs into the relief', 'adoucit les petits détails': 'softens small details',
  'aplatit à la hauteur du début du trait': 'flattens to the height where the stroke starts', 'accentue les arêtes': 'sharpens ridges', 'ajoute des irrégularités': 'adds irregularities',
  'adoucit fortement': 'softens strongly', 'copie une zone (Alt+clic pour choisir la source)': 'copies an area (Alt+click to pick the source)',
  'clic gauche pour peindre': 'left-click to paint', '[ ] pour la taille': '[ ] for size', 'clic droit pour tourner': 'right-click to orbit', 'clic droit pour déplacer': 'right-click to pan',
  'Les traits sont enregistrés dans la couche et rejoués à chaque calcul : la sculpture reste modifiable, désactivable, et identique à toutes les résolutions d\'export.':
    'Strokes are stored in the layer and replayed on every computation: sculpting stays editable, can be turned off, and is identical at every export resolution.',
  // Maps dérivées
  'Maps dérivées': 'Derived maps', 'Hauteur du relief (× largeur de la map)': 'Relief height (× map width)',
  'Choisissez une map dans la barre de la vue pour la voir et la régler. La hauteur du relief sert au calcul des pentes et des normales.':
    'Pick a map in the view bar to see and adjust it. The relief height is used to compute slopes and normals.',
  'La map est calculée à partir de la height map finale, avec les mêmes réglages en aperçu et à l\'export.': 'The map is computed from the final height map, with the same settings in preview and export.',
  'Convention': 'Convention', 'OpenGL (Blender, Unity, Godot)': 'OpenGL (Blender, Unity, Godot)', 'DirectX (Unreal)': 'DirectX (Unreal)', 'Rayon d\'analyse': 'Sampling radius',
  'Pente minimale (°)': 'Minimum slope (°)', 'Pente maximale (°)': 'Maximum slope (°)', 'Transition (°)': 'Transition (°)',
  // Export
  'Export': 'Export', 'Personnalisé': 'Custom', 'Blender (Displace)': 'Blender (Displace)', 'Unreal Engine (Landscape)': 'Unreal Engine (Landscape)', 'Unity (Terrain)': 'Unity (Terrain)',
  'Godot (Terrain3D / HTerrain)': 'Godot (Terrain3D / HTerrain)', 'Maya (Arnold, displacement)': 'Maya (Arnold, displacement)',
  '3ds Max (Displace, V-Ray, Corona, Arnold)': '3ds Max (Displace, V-Ray, Corona, Arnold)', 'Cinema 4D (Displacer, Redshift)': 'Cinema 4D (Displacer, Redshift)',
  'Houdini (Heightfield, displacement)': 'Houdini (Heightfield, displacement)', 'PNG 16 bits': '16-bit PNG', 'PNG 8 bits': '8-bit PNG', 'RAW 16 bits': '16-bit RAW',
  '65 536 niveaux, recommandé pour le displacement.': '65,536 levels, recommended for displacement.',
  '256 niveaux. Léger, mais crée des marches sur les pentes douces.': '256 levels. Lightweight, but creates steps on gentle slopes.',
  'Entiers non signés, little-endian, sans en-tête (.raw / .r16).': 'Unsigned integers, little-endian, no header (.raw / .r16).',
  'Résolution': 'Resolution', 'Dimensions personnalisées…': 'Custom size…', 'Largeur': 'Width', 'Exporter la height map': 'Export the height map',
  'Pack de maps (.zip)': 'Map pack (.zip)', 'Exporter le pack': 'Export the pack', 'Calcul en cours…': 'Computing…', 'Encodage…': 'Encoding…',
  'Mêmes dimensions que ci-dessus. Le fichier de projet est ajouté au pack pour pouvoir refaire le résultat.': 'Same size as above. The project file is added to the pack so the result can be rebuilt.',
  'Notes du prototype': 'Prototype notes', 'Tous les calculs se font dans votre navigateur, dans un thread séparé.': 'All computation runs in your browser, on a separate thread.',
  'L\'aperçu et l\'export utilisent les mêmes coordonnées : seule la finesse change.': 'Preview and export use the same coordinates: only the level of detail changes.',
  'Les images importées sont lues en 8 bits par le navigateur, même un PNG 16 bits.': 'Imported images are read as 8-bit by the browser, even 16-bit PNGs.',
  'Seules les couches modifiées (et celles au-dessus) sont recalculées pendant les réglages.': 'Only changed layers (and those above) are recomputed while you adjust settings.',
  'Pas encore inclus : masques peints, tuiles multiples, EXR.': 'Not included yet: painted masks, multi-tile output, EXR.',
  // Messages
  'Érosion ajoutée en haut de la pile. Le calcul prend une à deux secondes.': 'Erosion added at the top of the stack. It takes one or two seconds to compute.',
  'Couche de sculpture prête : peignez directement sur la vue 3D ou 2D.': 'Sculpt layer ready: paint directly on the 3D or 2D view.',
  'Cette couche agit sur les couches placées dessous : ajoutez d\'abord un générateur ou une image.': 'This layer acts on the layers below it: add a generator or an image first.',
  'Un filtre agit sur les couches placées dessous : ajoutez d\'abord un générateur ou une image.': 'A filter acts on the layers below it: add a generator or an image first.',
  'Cloner : faites d\'abord Alt+clic sur la zone à copier.': 'Clone: first Alt+click the area to copy.',
  'Source du clone placée. Peignez ailleurs pour copier cette zone.': 'Clone source set. Paint elsewhere to copy this area.',
  'Pile vidée. Ctrl+Z pour annuler.': 'Stack cleared. Ctrl+Z to undo.', 'Nouveau projet vide. Ctrl+Z pour revenir au précédent.': 'New empty project. Ctrl+Z to go back to the previous one.',
  'Aucun preset perso à exporter.': 'No custom presets to export.', 'Aucune couche de ce relief n\'utilise de graine.': 'No layer in this terrain uses a seed.',
  'Ce fichier n\'est pas une image. Formats acceptés : PNG, JPEG, WebP, BMP…': 'This file is not an image. Accepted formats: PNG, JPEG, WebP, BMP…',
  'Cochez au moins une map à mettre dans le pack.': 'Tick at least one map to include in the pack.', 'Impossible de lire cette image.': 'This image could not be read.',
  'La pile est vide : ajoutez au moins une couche.': 'The stack is empty: add at least one layer.',
  'Projet créé avec une version plus récente : certains réglages peuvent être ignorés.': 'Project made with a newer version: some settings may be ignored.',
  'Rien à comparer pour l\'instant : faites une modification d\'abord.': 'Nothing to compare yet: make a change first.',
  'Enregistrement annulé.': 'Save cancelled.', 'Fichier illisible : le JSON est invalide.': 'Unreadable file: the JSON is invalid.',
  'Ce fichier n\'est pas un projet Relief Generator.': 'This file is not a Relief Generator project.',
  'Ce fichier n\'est pas un preset Relief Generator.': 'This file is not a Relief Generator preset.',
  'Image ajoutée en haut de la pile.': 'Image added at the top of the stack.', 'Image ajoutée en haut de la pile, en mode Ajouter à 50 %.': 'Image added at the top of the stack, in Add mode at 50%.',
  'Preset créé pour cette session seulement : ce navigateur ne garde pas les données. Exportez-le.': 'Preset created for this session only: this browser does not keep data. Export it.',
  'Preset créé, mais trop lourd pour ce navigateur (images). Exportez-le pour le garder.': 'Preset created, but too heavy for this browser (images). Export it to keep it.',
  'Sans titre': 'Untitled', 'À propos': 'About', 'Fermer': 'Close', 'version': 'version', 'by FlorindoLAB ·': 'by FlorindoLAB ·',
  'Générateur gratuit de height maps et de displacement maps. Tous les calculs se font dans votre navigateur : aucune image ni aucun projet n\'est envoyé sur un serveur.':
    'Free height map and displacement map generator. All computation runs in your browser: no image or project is ever sent to a server.',
  'Version bêta': 'Beta version',
  'Cette version est en test. Si quelque chose ne fonctionne pas, copiez les informations techniques et collez-les dans votre message : elles aident à reproduire le problème.':
    'This version is being tested. If something does not work, copy the technical information and paste it into your message: it helps reproduce the problem.',
  'Copier les informations techniques': 'Copy technical information', 'Signaler un problème': 'Report a problem', 'Licence': 'License',
  'Logiciel gratuit (freeware) © 2026 FlorindoLAB.': 'Free software (freeware) © 2026 FlorindoLAB.', 'Conditions d\'utilisation': 'Terms of use', 'Composants tiers': 'Third-party components',
  'Three.js r147 : licence MIT, © 2010-2022 three.js authors.': 'Three.js r147: MIT license, © 2010-2022 three.js authors.',
  'Polices IBM Plex Sans et IBM Plex Mono : SIL Open Font License 1.1, © IBM Corp.': 'IBM Plex Sans and IBM Plex Mono fonts: SIL Open Font License 1.1, © IBM Corp.',
  'Police Bricolage Grotesque : SIL Open Font License 1.1, © The Bricolage Grotesque Project Authors.': 'Bricolage Grotesque font: SIL Open Font License 1.1, © The Bricolage Grotesque Project Authors.',
  'Bruit simplex d\'après Stefan Gustavson (domaine public), bruit de Perlin d\'après Ken Perlin, format OpenEXR d\'après la spécification publique d\'ILM.':
    'Simplex noise after Stefan Gustavson (public domain), Perlin noise after Ken Perlin, OpenEXR format after ILM\'s public specification.',
  'Informations copiées. Collez-les dans votre message.': 'Information copied. Paste it into your message.',
  'Copie automatique impossible : sélectionnez le texte affiché.': 'Automatic copy failed: select the text shown.', 'Prototype 0.4': 'Prototype 0.4', 'Bêta 1.0': 'Beta 1.0', 'Relief Generator': 'Relief Generator', 'Relief Generator by FlorindoLAB': 'Relief Generator by FlorindoLAB',
  'Masque peint': 'Painted mask', 'Utiliser un masque peint': 'Use a painted mask', 'Peindre le masque': 'Paint the mask', 'Terminer la peinture du masque': 'Finish painting the mask',
  'Peindre': 'Paint', 'Effacer': 'Erase', 'Effacer le masque': 'Erase the mask', 'Au départ': 'Start with', 'Effet partout (peindre pour retirer)': 'Effect everywhere (paint to remove)',
  'Effet nulle part (peindre pour ajouter)': 'Effect nowhere (paint to add)', 'Adoucissement du bord': 'Edge feathering', 'Inverser le masque': 'Invert the mask',
  'retire l\'effet de la couche': 'removes the layer\'s effect', 'fait apparaître l\'effet de la couche': 'reveals the layer\'s effect',
  'Pendant la peinture, les zones où la couche n\'agit pas sont teintées en rouge. Le masque est rejoué à chaque calcul, comme la sculpture.':
    'While painting, areas where the layer has no effect are tinted red. The mask is replayed on every computation, like sculpting.',
  'EXR 32 bits': '32-bit EXR', 'Flottants 32 bits sans perte (compression ZIP), pour les workflows VFX.': 'Lossless 32-bit floats (ZIP compression), for VFX workflows.',
  'Pas encore inclus : sortie en plusieurs tuiles.': 'Not included yet: multi-tile output.', 'Pile vide': 'Empty stack', 'Relief actuel': 'Current terrain', 'Bibliothèque': 'Library', 'Afficher ou masquer la bibliothèque': 'Show or hide the library'
};
const I18N_SENT = [
  ["Maya : nœud File en espace « Raw », « Alpha is Luminance » coché, branché dans un displacementShader. Avec Arnold, activez la subdivision du maillage et réglez la hauteur dans ses attributs Displacement ; avec Zero Value à 0, le noir ne déplace pas la surface.", 'Maya: File node in “Raw” color space with “Alpha is Luminance” enabled, plugged into a displacementShader. With Arnold, enable mesh subdivision and set the height in its Displacement attributes; with Zero Value at 0, black does not move the surface.'],
  ["3ds Max : modificateur Displace (Bitmap) ou displacement du moteur de rendu. Au chargement de l'image, choisissez « Override » avec un gamma de 1,0, sinon le relief est déformé.", "3ds Max: Displace modifier (Bitmap) or the renderer's displacement. When loading the image, choose “Override” with a gamma of 1.0, otherwise the relief is distorted."],
  ['Cinema 4D : déformateur Displacer (Shader › Bitmap), ou canal Displacement du matériau avec Sub-Polygon Displacement. Réglez le profil couleur du Bitmap sur « Linéaire ». Avec Redshift : nœud Texture en Raw dans un nœud Displacement.', "Cinema 4D: Displacer deformer (Shader › Bitmap), or the material's Displacement channel with Sub-Polygon Displacement. Set the Bitmap color profile to “Linear”. With Redshift: Texture node in Raw into a Displacement node."],
  ["Houdini : nœud SOP « HeightField File » pour un terrain (ajustez ensuite la hauteur), ou texture de displacement dans Karma / Mantra sans correction gamma (espace linéaire / Raw). L'EXR 32 bits garde toute la précision.", 'Houdini: “HeightField File” SOP for a terrain (then adjust the height), or a displacement texture in Karma / Mantra without gamma correction (linear / Raw). 32-bit EXR keeps full precision.'],
  ['Très grande résolution : comptez de quelques secondes à plus d\'une minute.', 'Very large resolution: expect a few seconds to over a minute.'],
  ['Blender : modificateur Displace ou nœud Displacement, image en espace « Non-Color ».', 'Blender: Displace modifier or Displacement node, image in “Non-Color” space.'],
  ['Unreal : Landscape › Import from File. Tailles recommandées 1009, 2017, 4033 ou 8129 px.', 'Unreal: Landscape › Import from File. Recommended sizes 1009, 2017, 4033 or 8129 px.'],
  ['Unity : Terrain › Import Raw, Depth 16 bit, Byte Order Windows. Taille 2ⁿ + 1.', 'Unity: Terrain › Import Raw, Depth 16 bit, Byte Order Windows. Size 2ⁿ + 1.'],
  ['Godot : Terrain3D ou HTerrain importent un PNG 16 bits ; l\'échelle de hauteur se règle dans le plugin.', 'Godot: Terrain3D or HTerrain import a 16-bit PNG; height scale is set in the plugin.']
];
const T = s => (I18N_EN[s] !== undefined ? I18N_EN[s] : s);
const I18N_RX = [
  [/^\d+ presets?$/, m => m],
  [/^(\d+) au total$/, (m, n) => n + ' in total'],
  [/^· (.+)$/, (m, a) => '· ' + T(a)],
  [/^(.+)…$/, (m, a) => I18N_EN[a] !== undefined ? I18N_EN[a] + '…' : undefined],
  [/^Activer (.+)$/, (m, a) => 'Enable ' + T(a)],
  [/^(Monter|Descendre|Supprimer) : (.+)$/, (m, a, b) => T(a) + ': ' + T(b)],
  [/^(\d+) traits? (\d+)%$/, (m, n, p) => n + (n > 1 ? ' strokes ' : ' stroke ') + p + '%'],
  [/^(\d+) traits?$/, (m, n) => n + (n > 1 ? ' strokes' : ' stroke')],
  [/^(base|filtre|érosion|fondu|masque) (\d+)%$/, (m, a, p) => ({ base: 'base', filtre: 'filter', 'érosion': 'erosion', fondu: 'normal', masque: 'mask' })[a] + ' ' + p + '%'],
  [/^Érosion · (.+)$/, (m, a) => 'Erosion · ' + T(a)],
  [/^Filtre : (.+)$/, (m, a) => 'Filter: ' + T(a)],
  [/^Ce relief combine (\d+) couches\. Le mode Avancé donne accès à chacune\.$/, (m, n) => 'This terrain combines ' + n + ' layers. Advanced mode gives access to each one.'],
  [/^(\d+) × (\d+) px( · raccordable \(seamless\))? · environ (\d+) Mo de mémoire pendant le calcul\.(.*)$/, (m, w, h, sm, mb, rest) => w + ' × ' + h + ' px' + (sm ? ' · tileable (seamless)' : '') + ' · about ' + mb + ' MB of memory while computing.' + I18N_SENT.reduce((r, [f, e]) => r.replace(f, e), rest)],
  [/^Preset « (.+) » enregistré dans ce navigateur\. Pensez à l'exporter pour le garder ailleurs\.$/, (m, a) => 'Preset “' + a + '” saved in this browser. Remember to export it to keep it elsewhere.'],
  [/^(\d+) enregistrés?$/, (m, n) => n + ' saved'],
  [/^1 preset n'a jamais été exporté\. Il n'est gardé que dans ce navigateur\.$/, () => '1 preset has never been exported. It is only kept in this browser.'],
  [/^(\d+) presets n'ont jamais été exportés\. Ils ne sont gardés que dans ce navigateur\.$/, (m, n) => n + ' presets have never been exported. They are only kept in this browser.'],
  [/^(\d+) couche\(s\)( · jamais exporté)?$/, (m, n, x) => n + ' layer(s)' + (x ? ' · never exported' : '')],
  [/^Couche « (.+) » supprimée\. Ctrl\+Z pour annuler\.$/, (m, a) => 'Layer “' + T(a) + '” deleted. Ctrl+Z to undo.'],
  [/^« (.+) » n'est plus la base : elle passe en mode Ajouter\.$/, (m, a) => '“' + T(a) + '” is no longer the base: it switches to Add mode.'],
  [/^Fichier (enregistré|exporté) : (.+)$/, (m, k, rest) => 'File ' + (k === 'enregistré' ? 'saved' : 'exported') + ': ' + rest.replace(/calculé en ([\d.]+) s/, 'computed in $1 s').replace(/(\d+) maps? en ([\d.]+) s/, (x, n, t) => n + (n > 1 ? ' maps' : ' map') + ' in ' + t + ' s')],
  [/^Projet ouvert : (.+)$/, (m, a) => 'Project opened: ' + a],
  [/^Preset importé : (.+)$/, (m, a) => 'Preset imported: ' + a],
  [/^(\d+) presets importés\.$/, (m, n) => n + ' presets imported.'],
  [/^Calcul de la map impossible : (.+)$/, (m, a) => 'Could not compute the map: ' + a],
  [/^Erreur de calcul : (.+)$/, (m, a) => 'Computation error: ' + a],
  [/^Export (du pack )?impossible : (.+)\. Essayez une résolution plus basse\.$/, (m, p, a) => (p ? 'Pack export' : 'Export') + ' failed: ' + a + '. Try a lower resolution.'],
  [/^Enregistrement impossible \((.+)\)\.$/, (m, a) => 'Could not save (' + a + ').'],
  [/^lue en (\d+) × (\d+)$/, (m, w, h) => 'read at ' + w + ' × ' + h],
  [/^(.+) \(copie\)$/, (m, a) => T(a) + ' (copy)'],
  [/^(.+) \(perso\)$/, (m, a) => T(a) + ' (custom)'],
  [/^(.+) •$/, (m, a) => T(a) + ' •'],
  [/^(.+) · masque$/, (m, a) => tr(a) + ' · mask']
];
/*END_I18N*/
const E = Engine;
const el = (tag, cls) => { const n = document.createElement(tag); if (cls) n.className = cls; return n; };
const c01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const BLENDS = [['normal', 'Fondu'], ['add', 'Ajouter'], ['sub', 'Soustraire'], ['mul', 'Multiplier'], ['max', 'Maximum'], ['min', 'Minimum'], ['mask', 'Masque']];
const BLEND_SHORT = { normal: 'fondu', add: '+', sub: '−', mul: '×', max: 'max', min: 'min', mask: 'masque' };
let uidN = 0;
const uid = () => 'L' + Date.now().toString(36) + (uidN++).toString(36);
const rndSeed = () => Math.floor(Math.random() * 99998) + 1;
const slug = s => (s || 'heightmap').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'heightmap';
const store = { get(k) { try { return localStorage.getItem('fhm_' + k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem('fhm_' + k, v); return true; } catch (e) { return false; } } };

// ---------- Couches & presets ----------
function defsFor(kind, type) { return kind === 'gen' ? (E.GENS[type] || E.GENS.collines).params : kind === 'image' ? E.IMAGE : kind === 'erosion' ? E.EROSION : kind === 'sculpt' ? [] : E.FILTER; }
const isFx = l => l.kind === 'filter' || l.kind === 'erosion' || l.kind === 'sculpt';
function layerDefs(ly) { return defsFor(ly.kind, ly.type); }
function makeLayer(kind, type, params, extra) {
  const name = kind === 'gen' ? E.GENS[type].name : kind === 'image' ? 'Image' : kind === 'erosion' ? ((params || {}).op === 'thermique' ? 'Érosion thermique' : 'Érosion hydraulique') : kind === 'sculpt' ? 'Sculpture' : 'Filtre';
  const ly = Object.assign({ id: uid(), name, kind, type, enabled: true, blend: 'normal', intensity: 1, invert: false,
    mask: { on: false, lo: 0.2, hi: 0.8, soft: 0.1 }, params: E.withDefaults(defsFor(kind, type), params || {}) }, extra || {});
  if (kind === 'sculpt' && !ly.strokes) ly.strokes = [];
  return ly;
}
// Raccourcis de définition : G(type, params, extra), F(op, params, extra)
const G = (t, p, x) => ['gen', t, p || {}, x];
const F = (op, p, x) => ['filter', 'filtre', Object.assign({ op }, p || {}), Object.assign({ name: { lisser: 'Lisser', terrasses: 'Terrasses', courbe: 'Courbe', niveaux: 'Niveaux', inverser: 'Inverser' }[op] }, x || {})];
const ADD = (i, name) => ({ blend: 'add', intensity: i, name });
const PRESETS = [
  // Bruits
  { id: 'perlin', name: 'Perlin fBm', cat: 'Bruits', layers: [G('bruit', { seed: 3, noise: 'perlin', mode: 'fbm', freq: 3, oct: 7 })] },
  { id: 'billow', name: 'Nuages (billow)', cat: 'Bruits', layers: [G('bruit', { seed: 8, noise: 'simplex', mode: 'billow', freq: 2.5, oct: 6 })] },
  { id: 'turbulence', name: 'Turbulence', cat: 'Bruits', layers: [G('bruit', { seed: 5, noise: 'perlin', mode: 'turb', freq: 3, oct: 6, warp: 0.5 })] },
  { id: 'ridged', name: 'Ridged multifractal', cat: 'Bruits', layers: [G('bruit', { seed: 11, noise: 'simplex', mode: 'ridged', freq: 2.5, oct: 7 })] },
  { id: 'valeur', name: 'Bruit de valeur', cat: 'Bruits', layers: [G('bruit', { seed: 2, noise: 'valeur', mode: 'fbm', freq: 4, oct: 5 })] },
  { id: 'vcells', name: 'Cellules de Voronoi', cat: 'Bruits', layers: [G('voronoi', { seed: 4, feature: 'cells', freq: 8 })] },
  { id: 'vedges', name: 'Réseau de Voronoi', cat: 'Bruits', layers: [G('voronoi', { seed: 6, feature: 'edges', freq: 6, oct: 2 })] },
  { id: 'vbulles', name: 'Bulles', cat: 'Bruits', layers: [G('voronoi', { seed: 9, feature: 'f1', freq: 7 }, { invert: true })] },
  { id: 'vcarres', name: 'Cellules carrées', cat: 'Bruits', layers: [G('voronoi', { seed: 12, feature: 'dome', metric: 'cheb', freq: 6, jitter: 0.6 })] },
  // Montagnes
  { id: 'alpes', name: 'Montagnes alpines', cat: 'Montagnes', layers: [G('montagnes', { seed: 12, freq: 1.8, oct: 8, sharp: 1.6, warp: 0.35, valley: 0.15 }), G('collines', { seed: 5, freq: 5, oct: 5 }, ADD(0.18, 'Détails'))] },
  { id: 'himalaya', name: 'Hautes chaînes', cat: 'Montagnes', global: { curve: 1.3 }, layers: [G('montagnes', { seed: 41, freq: 1.4, oct: 9, sharp: 2.6, warp: 0.2, valley: 0.4 })] },
  { id: 'massif', name: 'Massif érodé', cat: 'Montagnes', layers: [G('montagnes', { seed: 23, freq: 2, oct: 7, sharp: 1.2, valley: 0.1, warp: 0.5 }), F('lisser', { radius: 0.006 }, { intensity: 0.7 })] },
  { id: 'pics', name: 'Pics isolés', cat: 'Montagnes', layers: [G('montagnes', { seed: 7, freq: 3, oct: 8, sharp: 3, valley: 1 }), G('primitive', { shape: 'dome', size: 1.3, soft: 0.8 }, { blend: 'mul', intensity: 0.7, name: 'Bombé central' })] },
  { id: 'chaine', name: 'Chaîne centrale', cat: 'Montagnes', layers: [G('montagnes', { seed: 15, freq: 2.5, oct: 8, sharp: 2 }), G('primitive', { shape: 'plateau', size: 0.9, soft: 0.9 }, { blend: 'mask', intensity: 1, name: 'Masque central' })] },
  // Collines
  { id: 'collines', name: 'Collines vallonnées', cat: 'Collines', layers: [G('collines', { seed: 3, freq: 1.6, oct: 6, gain: 0.45, warp: 0.5 })] },
  { id: 'bocage', name: 'Collines douces', cat: 'Collines', layers: [G('collines', { seed: 18, freq: 1.1, oct: 4, gain: 0.4 }), F('lisser', { radius: 0.01 })] },
  { id: 'vallons', name: 'Vallons boisés', cat: 'Collines', layers: [G('collines', { seed: 27, freq: 3, oct: 7, gain: 0.55, warp: 0.8 })] },
  { id: 'steppe', name: 'Plaine ondulée', cat: 'Collines', layers: [G('collines', { seed: 9, freq: 1, oct: 5 }), F('courbe', { gamma: 2 })] },
  // Volcans
  { id: 'volcan', name: 'Paysage volcanique', cat: 'Volcans', layers: [G('volcan', { seed: 7 }), G('crateres', { seed: 4, density: 10, size: 0.35, depth: 0.5, base: 0.15, amount: 0.35 }, ADD(0.2, 'Petits cratères'))] },
  { id: 'caldeira', name: 'Caldeira', cat: 'Volcans', layers: [G('volcan', { seed: 31, radius: 1.1, slope: 1, crater: 0.45, cdepth: 0.8, ridges: 0.4 })] },
  { id: 'strato', name: 'Stratovolcan', cat: 'Volcans', layers: [G('volcan', { seed: 12, radius: 0.7, slope: 2.4, crater: 0.08, ridges: 0.8, rfreq: 22 })] },
  { id: 'cones', name: 'Champ de cônes', cat: 'Volcans', layers: [G('volcan', { seed: 3, radius: 0.55, px: -0.45, py: -0.3, crater: 0.2 }), G('volcan', { seed: 8, radius: 0.65, px: 0.45, py: 0.35, crater: 0.15 }, { blend: 'max', intensity: 1, name: 'Second cône' }), G('collines', { seed: 2, freq: 3 }, ADD(0.15, 'Sol'))] },
  // Désert
  { id: 'dunes', name: 'Dunes désertiques', cat: 'Désert', layers: [G('dunes', { seed: 9 })] },
  { id: 'barkhanes', name: 'Barkhanes', cat: 'Désert', layers: [G('dunes', { seed: 14, freq: 4, asym: 0.15, vari: 0.9, warp: 1.6 })] },
  { id: 'erg', name: 'Mer de sable', cat: 'Désert', layers: [G('dunes', { seed: 22, freq: 12, angle: 70, asym: 0.35, ripple: 0.5 }), G('collines', { seed: 6, freq: 1, oct: 4 }, ADD(0.35, 'Grandes ondulations'))] },
  { id: 'mesa', name: 'Mesas', cat: 'Désert', layers: [G('terrasses', { seed: 19, freq: 1.5, oct: 5, steps: 3, soft: 0.05 }), G('collines', { seed: 4, freq: 6, oct: 5 }, ADD(0.05, 'Grain'))] },
  // Îles & côtes
  { id: 'archipel', name: 'Archipel', cat: 'Îles et côtes', layers: [G('archipel', { seed: 21 })] },
  { id: 'ile', name: 'Île unique', cat: 'Îles et côtes', layers: [G('archipel', { seed: 33, freq: 2, sea: 0.5, falloff: 1 })] },
  { id: 'atoll', name: 'Atoll', cat: 'Îles et côtes', layers: [G('primitive', { shape: 'anneau', size: 0.7, soft: 0.2 }), G('collines', { seed: 5, freq: 4 }, ADD(0.15, 'Relief')), F('niveaux', { lo: 0.1, hi: 1 })] },
  { id: 'cote', name: 'Côte découpée', cat: 'Îles et côtes', layers: [G('archipel', { seed: 17, freq: 2.5, sea: 0.4, falloff: 0, warp: 0.8 }), G('primitive', { shape: 'pente', size: 1, angle: 0 }, { blend: 'mul', intensity: 1, name: 'Pente vers la mer' })] },
  // Vallées & canyons
  { id: 'canyon', name: 'Canyon', cat: 'Vallées', layers: [G('canyons', { seed: 8 })] },
  { id: 'gorges', name: 'Gorges profondes', cat: 'Vallées', layers: [G('canyons', { seed: 26, width: 0.08, depth: 0.95, steps: 0, meander: 2 })] },
  { id: 'badlands', name: 'Badlands', cat: 'Vallées', layers: [G('canyons', { seed: 11, freq: 3, width: 0.3, steps: 8 }), F('terrasses', { steps: 12, soft: 0.4 }, { intensity: 0.6 })] },
  { id: 'glaciaire', name: 'Vallée glaciaire', cat: 'Vallées', layers: [G('montagnes', { seed: 29, freq: 1.6, sharp: 1.5 }), G('canyons', { seed: 3, freq: 1, width: 0.4, depth: 0.6, steps: 0, meander: 0.5 }, { blend: 'mul', intensity: 0.8, name: 'Vallée en U' })] },
  // Plateaux
  { id: 'plateaux', name: 'Plateaux en terrasses', cat: 'Plateaux', layers: [G('collines', { seed: 14, freq: 1.8, oct: 6, warp: 0.4 }), F('terrasses', { steps: 7, soft: 0.3 })] },
  { id: 'rizieres', name: 'Rizières', cat: 'Plateaux', layers: [G('collines', { seed: 35, freq: 2.5, oct: 5 }), F('terrasses', { steps: 18, soft: 0.05 })] },
  { id: 'tepuy', name: 'Tépuys', cat: 'Plateaux', layers: [G('rocheux', { seed: 6, freq: 3, crack: 0.25, vari: 0.3, bevel: 0 }), F('lisser', { radius: 0.004 }), G('collines', { seed: 2, freq: 5 }, ADD(0.1, 'Grain'))] },
  // Roches & surfaces
  { id: 'roche', name: 'Surface rocheuse', cat: 'Surfaces', layers: [G('rocheux', { seed: 2 })] },
  { id: 'paves', name: 'Pavés', cat: 'Surfaces', layers: [G('rocheux', { seed: 13, freq: 14, crack: 0.06, vari: 0.2, bevel: 0.9, jitter: 0.3, warp: 0, detail: 0.15 })] },
  { id: 'strates', name: 'Strates rocheuses', cat: 'Surfaces', layers: [G('abstrait', { seed: 4, pattern: 'rayures', freq: 25, noise: 0.8, sharp: 0.6 }), G('rocheux', { seed: 9, freq: 6 }, ADD(0.3, 'Blocs'))] },
  { id: 'ecorce', name: 'Écorce', cat: 'Surfaces', layers: [G('abstrait', { seed: 7, pattern: 'rayures', freq: 30, noise: 1.5, sharp: 2 }), G('organique', { seed: 3, freq: 3 }, ADD(0.2, 'Nœuds'))] },
  { id: 'beton', name: 'Béton grêlé', cat: 'Surfaces', layers: [G('collines', { seed: 8, freq: 12, oct: 8, gain: 0.6 }), G('crateres', { seed: 5, density: 18, size: 0.3, depth: 0.6, base: 0, amount: 0.5 }, ADD(0.3, 'Trous'))] },
  { id: 'craquele', name: 'Sol craquelé', cat: 'Surfaces', layers: [G('rocheux', { seed: 21, freq: 6, crack: 0.02, vari: 0.05, bevel: 0.2, jitter: 1, detail: 0.1 })] },
  // Extraterrestre
  { id: 'lune', name: 'Planète cratérisée', cat: 'Extraterrestre', layers: [G('crateres', { seed: 6, density: 4, base: 0.45 })] },
  { id: 'mars', name: 'Plaines martiennes', cat: 'Extraterrestre', layers: [G('crateres', { seed: 16, density: 2.5, size: 0.8, base: 0.6, freq: 2 }), G('canyons', { seed: 4, freq: 1.2 }, ADD(0.3, 'Failles'))] },
  { id: 'banquise', name: 'Banquise fracturée', cat: 'Extraterrestre', layers: [G('rocheux', { seed: 10, freq: 4, crack: 0.03, vari: 0.9, bevel: 0 })] },
  { id: 'spires', name: 'Spires extraterrestres', cat: 'Extraterrestre', layers: [G('montagnes', { seed: 24, freq: 4, sharp: 4, valley: 1.5 }), G('abstrait', { seed: 1, pattern: 'spirale', freq: 6 }, ADD(0.2, 'Spirale'))] },
  // Organique
  { id: 'organique', name: 'Relief organique', cat: 'Organique', layers: [G('organique', { seed: 11 })] },
  { id: 'reptile', name: 'Peau de reptile', cat: 'Organique', layers: [G('rocheux', { seed: 30, freq: 18, crack: 0.1, bevel: 1, vari: 0.3, jitter: 0.8 }), G('organique', { seed: 2, freq: 2 }, ADD(0.15, 'Ondulation'))] },
  { id: 'corail', name: 'Corail cérébral', cat: 'Organique', layers: [G('organique', { seed: 8, freq: 4, strength: 5, oct: 3 }), F('niveaux', { lo: 0.45, hi: 0.55 }), F('lisser', { radius: 0.002 })] },
  { id: 'tissu', name: 'Tissu froissé', cat: 'Organique', layers: [G('montagnes', { seed: 5, freq: 2, sharp: 0.7, valley: 0, oct: 4, warp: 1.5 })] },
  // Motion design
  { id: 'ondes', name: 'Ondes', cat: 'Motion design', layers: [G('abstrait', { seed: 1, pattern: 'ondes', freq: 9, noise: 0.35 })] },
  { id: 'interf', name: 'Interférences', cat: 'Motion design', layers: [G('abstrait', { seed: 1, pattern: 'interf', freq: 12, noise: 0.2 })] },
  { id: 'spirale', name: 'Spirale', cat: 'Motion design', layers: [G('abstrait', { seed: 1, pattern: 'spirale', freq: 6, noise: 0.25 })] },
  { id: 'bosses', name: 'Grille de bosses', cat: 'Motion design', layers: [G('abstrait', { seed: 1, pattern: 'grille', freq: 8, noise: 0, sharp: 2 })] },
  { id: 'vagues', name: 'Vagues', cat: 'Motion design', layers: [G('abstrait', { seed: 3, pattern: 'rayures', freq: 6, noise: 0.8 }), G('collines', { seed: 2, freq: 3 }, ADD(0.1, 'Grain'))] },
  // Jeu vidéo
  { id: 'stylise', name: 'Île stylisée', cat: 'Jeu vidéo', layers: [G('archipel', { seed: 30, sea: 0.35, oct: 4, falloff: 0.9 }), F('terrasses', { steps: 6, soft: 0.08 }, { name: 'Paliers' })] },
  { id: 'arene', name: 'Arène', cat: 'Jeu vidéo', layers: [G('primitive', { shape: 'anneau', size: 1, soft: 0.5 }), G('collines', { seed: 7, freq: 3, oct: 4 }, ADD(0.2, 'Relief'))] },
  { id: 'lowpoly', name: 'Collines low-poly', cat: 'Jeu vidéo', layers: [G('collines', { seed: 12, freq: 1.5, oct: 3 }), F('terrasses', { steps: 5, soft: 0.5 })] },
  { id: 'plateformes', name: 'Plateaux de jeu', cat: 'Jeu vidéo', layers: [G('terrasses', { seed: 4, freq: 1.2, oct: 3, steps: 4, soft: 0 })] }
];
const CATS = [...new Set(PRESETS.map(p => p.cat))];
const presetLayers = pr => pr.layers.map(a => makeLayer(a[0], a[1], a[2], a[3] ? Object.fromEntries(Object.entries(a[3]).filter(([, v]) => v !== undefined)) : undefined));
const defaultExport = () => ({ res: '2048', w: 2048, h: 1024, format: 'png16', profile: 'custom' });
function defaultMaps() {
  const o = { zscale: 0.12, params: {}, pack: { height: true, normal: true, slope: false, curvature: false, ao: true, hmask: false, smask: false, cavity: false } };
  Object.keys(E.MAPS).forEach(k => { o.params[k] = E.defaults(E.MAPS[k].params); });
  return o;
}
function mergeMaps(m) {
  const d = defaultMaps(); m = m || {};
  d.zscale = typeof m.zscale === 'number' ? m.zscale : d.zscale;
  Object.keys(E.MAPS).forEach(k => { d.params[k] = E.withDefaults(E.MAPS[k].params, (m.params || {})[k] || {}); });
  Object.assign(d.pack, m.pack || {});
  return d;
}
function newProject(id) {
  const pr = PRESETS.find(p => p.id === id) || PRESETS[0];
  return { format: 'florindolab-heightmap', version: 1, name: pr.name, preset: pr.id, global: E.withDefaults(E.GLOBAL, pr.global || {}), layers: presetLayers(pr), export: defaultExport(), maps: defaultMaps() };
}
const PROFILES = {
  blender: { format: 'png16', res: '4096', note: 'Blender : modificateur Displace ou nœud Displacement, image en espace « Non-Color ».' },
  unreal: { format: 'png16', res: '2017', note: 'Unreal : Landscape › Import from File. Tailles recommandées 1009, 2017, 4033 ou 8129 px.' },
  unity: { format: 'raw16', res: '2049', note: 'Unity : Terrain › Import Raw, Depth 16 bit, Byte Order Windows. Taille 2ⁿ + 1.' },
  godot: { format: 'png16', res: '2048', note: 'Godot : Terrain3D ou HTerrain importent un PNG 16 bits ; l\'échelle de hauteur se règle dans le plugin.' },
  maya: { format: 'exr32', res: '4096', note: "Maya : nœud File en espace « Raw », « Alpha is Luminance » coché, branché dans un displacementShader. Avec Arnold, activez la subdivision du maillage et réglez la hauteur dans ses attributs Displacement ; avec Zero Value à 0, le noir ne déplace pas la surface." },
  max: { format: 'png16', res: '4096', note: "3ds Max : modificateur Displace (Bitmap) ou displacement du moteur de rendu. Au chargement de l'image, choisissez « Override » avec un gamma de 1,0, sinon le relief est déformé." },
  c4d: { format: 'png16', res: '4096', note: 'Cinema 4D : déformateur Displacer (Shader › Bitmap), ou canal Displacement du matériau avec Sub-Polygon Displacement. Réglez le profil couleur du Bitmap sur « Linéaire ». Avec Redshift : nœud Texture en Raw dans un nœud Displacement.' },
  houdini: { format: 'exr32', res: '2048', note: "Houdini : nœud SOP « HeightField File » pour un terrain (ajustez ensuite la hauteur), ou texture de displacement dans Karma / Mantra sans correction gamma (espace linéaire / Raw). L'EXR 32 bits garde toute la précision." }
};

// ---------- État ----------
const images = {};            // id → { name, url, w, h, data }
let project = newProject('alpes');
let selId = null;
let mode = store.get('mode') === 'advanced' ? 'advanced' : 'express';
const view = { tab: store.get('tab') === '2d' ? '2d' : '3d', res: 256, vscale: 0.25, az: 135, wire: false, grid: false, solo: false, color: 'alt', map: 'height', tile: false };
let current = null, mapData = null, comparing = false;

// ---------- Calcul en arrière-plan ----------
const Runner = (function () {
  let worker = null, busy = false, queue = [], cur = null;
  const mainCache = { entries: [] };
  const sent = new Set();
  try {
    worker = new Worker('js/worker.js');
    worker.onmessage = e => {
      const m = e.data;
      if (m.type === 'progress') { if (cur && cur.onProgress) cur.onProgress(m.p); return; }
      const c = cur; cur = null; busy = false;
      if (m.type === 'done') c.resolve({ w: c.job.w, h: c.job.h, data: m.data, min: m.min, max: m.max, ms: m.ms, recomputed: m.recomputed, total: m.total });
      else c.reject(new Error(m.message));
      pump();
    };
    worker.onerror = e => { e.preventDefault(); const c = cur; worker = null; cur = null; busy = false; if (c) { queue.unshift(c); } pump(); };
  } catch (e) { worker = null; }
  function pump() {
    if (busy || !queue.length) return;
    cur = queue.shift(); busy = true;
    if (worker) {
      (cur.job.layers || []).forEach(l => {
        if (l.kind === 'image' && images[l.imgId] && !sent.has(l.imgId)) {
          const im = images[l.imgId];
          worker.postMessage({ type: 'image', id: l.imgId, w: im.w, h: im.h, data: im.data });
          sent.add(l.imgId);
        }
      });
      const j = cur.job;
      if (j.op === 'derive') worker.postMessage({ type: 'derive', H: j.H, w: j.w, h: j.h, map: j.map, p: j.p, z: j.z, wrap: j.wrap });
      else worker.postMessage({ type: 'render', job: j, progress: !!cur.onProgress, cache: cur.kind === 'preview' });
    } else {
      const c = cur;
      setTimeout(() => {
        try {
          const j = c.job, t0 = performance.now(), r = j.op === 'derive' ? { data: E.derive(j.map, j.H, j.w, j.h, j.p, j.z, j.wrap), min: 0, max: 1 } : E.compute(j, images, c.onProgress, c.kind === 'preview' ? mainCache : null);
          cur = null; busy = false;
          c.resolve({ w: c.job.w, h: c.job.h, data: r.data, min: r.min, max: r.max, ms: performance.now() - t0, recomputed: r.recomputed, total: r.total });
        } catch (err) { cur = null; busy = false; c.reject(err); }
        pump();
      }, 0);
    }
  }
  function run(job, opt) {
    opt = opt || {};
    return new Promise((resolve, reject) => {
      if (opt.kind === 'preview' || opt.kind === 'mapview') queue = queue.filter(q => { if (q.kind === opt.kind) { q.resolve(null); return false; } return true; });
      const item = { job, kind: opt.kind || 'other', onProgress: opt.onProgress, resolve, reject };
      if (opt.front) queue.unshift(item); else queue.push(item);
      pump();
    });
  }
  return { run, get threaded() { return !!worker; } };
})();

function exportDims() {
  const e = project.export;
  if (e.res === 'custom') return { w: Math.max(16, Math.min(8192, e.w | 0)), h: Math.max(16, Math.min(8192, e.h | 0)) };
  const n = +e.res; return { w: n, h: n };
}
function previewDims() {
  const d = exportDims(), m = Math.max(d.w, d.h);
  return { w: Math.max(8, Math.round(view.res * d.w / m)), h: Math.max(8, Math.round(view.res * d.h / m)) };
}
function buildJob(w, h, forExport) {
  let layers = project.layers;
  if (!forExport && view.solo && mode === 'advanced') {
    const l = layers.find(x => x.id === selId);
    if (l) layers = [Object.assign({}, l, { enabled: true, blend: 'normal', intensity: 1, mask: { on: false } })];
  }
  return { w, h, layers: JSON.parse(JSON.stringify(layers)), global: Object.assign({}, project.global) };
}

let busyTimer = null, thumbsDone = false;
function requestRender() {
  const d = previewDims();
  if (!busyTimer) busyTimer = setTimeout(() => { $('busy').style.width = '70%'; }, 120);
  Runner.run(buildJob(d.w, d.h), { kind: 'preview', front: true }).then(r => {
    if (!r) return;
    clearTimeout(busyTimer); busyTimer = null; $('busy').style.width = '0';
    current = r; draw(); updateStatus(); updateEmpty();
    if (view.map !== 'height') requestDerive();
    if (!thumbsDone) { thumbsDone = true; makeThumbs(); }
  }).catch(err => { clearTimeout(busyTimer); busyTimer = null; $('busy').style.width = '0'; console.error(err); toast('Erreur de calcul : ' + err.message); });
}

function mapFor(r) {
  if (comparing || !mapData || view.map === 'height' || mapData.type !== view.map || mapData.w !== r.w || mapData.h !== r.h) return null;
  return mapData;
}
function requestDerive() {
  if (!current) return;
  if (view.map === 'height') { mapData = null; draw(); return; }
  const r = current, M = project.maps;
  Runner.run({ op: 'derive', w: r.w, h: r.h, H: r.data, map: view.map, p: M.params[view.map], z: M.zscale, wrap: !!project.global.seamless }, { kind: 'mapview', front: true })
    .then(d => { if (!d || r !== current) return; mapData = { type: view.map, w: d.w, h: d.h, data: d.data, ch: view.map === 'normal' ? 3 : 1 }; draw(); })
    .catch(e => { console.error(e); toast('Calcul de la map impossible : ' + e.message); });
}
function seamCheck(r) {
  const w = r.w, h = r.h, H = r.data;
  let e = 0, n = 0, inner = 0, ni = 0;
  for (let y = 0; y < h; y++) { e += Math.abs(H[y * w] - H[y * w + w - 1]); n++; }
  for (let x = 0; x < w; x++) { e += Math.abs(H[x] - H[(h - 1) * w + x]); n++; }
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w - 1; x += 2) { inner += Math.abs(H[y * w + x] - H[y * w + x + 1]); ni++; }
  e /= n; inner /= ni;
  return { edge: e, inner, ok: e <= inner * 2.5 + 1e-4 };
}

// ---------- Couleurs ----------
function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
function lut(stops) {
  const out = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const a = stops[k], b = stops[k + 1], f = c01((t - a[0]) / (b[0] - a[0])), ca = hex(a[1]), cb = hex(b[1]);
    for (let j = 0; j < 3; j++) out[i * 3 + j] = ca[j] + (cb[j] - ca[j]) * f;
  }
  return out;
}
const LUT = {
  alt: lut([[0, '#25402e'], [0.18, '#3f6136'], [0.36, '#7d8a4a'], [0.55, '#8a6f4c'], [0.72, '#7d736a'], [0.86, '#b3aea8'], [1, '#f4f4f0']]),
  gray: lut([[0, '#000000'], [1, '#ffffff']]),
  clay: lut([[0, '#3b2a21'], [1, '#e4c6a6']])
};
LUT.shade = LUT.alt;
function colorize(r, modeName, d, md) {
  const w = r.w, h = r.h, data = r.data, L = LUT[modeName] || LUT.gray, shade = modeName === 'shade';
  if (md) {
    const M = md.data;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      if (md.ch === 3) { d[o] = M[i * 3] * 255; d[o + 1] = M[i * 3 + 1] * 255; d[o + 2] = M[i * 3 + 2] * 255; }
      else { const g = M[i] * 255; d[o] = g; d[o + 1] = g; d[o + 2] = g; }
      d[o + 3] = 255;
    }
    return;
  }
  const az = view.az * Math.PI / 180, lx = Math.cos(az), ly = Math.sin(az), lz = 1.1, ln = 1 / Math.hypot(lx, ly, lz);
  const k = Math.max(view.vscale, 0.05) * w * 0.5;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, li = Math.max(0, Math.min(255, (data[i] * 255) | 0)), o = i * 4;
    let R = L[li * 3], G = L[li * 3 + 1], B = L[li * 3 + 2];
    if (shade) {
      const dx = (data[x < w - 1 ? i + 1 : i] - data[x > 0 ? i - 1 : i]) * k, dy = (data[y < h - 1 ? i + w : i] - data[y > 0 ? i - w : i]) * k;
      const f = 0.28 + 0.9 * Math.max(0, (-dx * lx - dy * ly + lz) * ln / Math.sqrt(dx * dx + dy * dy + 1));
      R *= f; G *= f; B *= f;
    }
    d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = 255;
  }
}

// ---------- Vue 2D ----------
const c2 = $('view2d'), off = document.createElement('canvas');
const v2 = { zoom: 1, px: 0, py: 0, drag: null };
function update2D(r) {
  off.width = r.w; off.height = r.h;
  const g = off.getContext('2d'), im = g.createImageData(r.w, r.h);
  colorize(r, view.color, im.data, mapFor(r));
  const PMk = paintedMaskFor(r);
  if (PMk) for (let i = 0; i < PMk.length; i++) { const a = (1 - PMk[i]) * 0.6, o = i * 4; im.data[o] += (226 - im.data[o]) * a; im.data[o + 1] += (90 - im.data[o + 1]) * a; im.data[o + 2] += (80 - im.data[o + 2]) * a; }
  g.putImageData(im, 0, 0); draw2D();
}
function baseScale(cw, ch) { const t = view.tile ? 3 : 1; return Math.min(cw / (off.width * t), ch / (off.height * t)) * 0.9; }
function fit2D() {
  const rect = c2.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
  if (c2.width !== W || c2.height !== H) { c2.width = W; c2.height = H; }
  const s = baseScale(rect.width, rect.height) * v2.zoom;
  return { s, dpr, cw: rect.width, ch: rect.height, x: (rect.width - off.width * s) / 2 + v2.px, y: (rect.height - off.height * s) / 2 + v2.py };
}
function draw2D() {
  if (c2.hidden || !off.width) return;
  const g = c2.getContext('2d'), f = fit2D();
  g.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
  g.fillStyle = '#0b1217'; g.fillRect(0, 0, f.cw, f.ch);
  g.imageSmoothingEnabled = f.s < 2;
  const W = off.width * f.s, H = off.height * f.s;
  if (view.tile) { const RW = Math.round(W), RH = Math.round(H), X0 = Math.round(f.x), Y0 = Math.round(f.y); for (let ty = -1; ty <= 1; ty++) for (let tx = -1; tx <= 1; tx++) g.drawImage(off, X0 + tx * RW, Y0 + ty * RH, RW, RH); }
  else g.drawImage(off, f.x, f.y, W, H);
  if (view.grid) {
    g.strokeStyle = 'rgba(229,235,238,.22)'; g.lineWidth = 1; g.beginPath();
    for (let i = 1; i < 8; i++) { const gx = Math.round(f.x + W * i / 8) + 0.5, gy = Math.round(f.y + H * i / 8) + 0.5; g.moveTo(gx, f.y); g.lineTo(gx, f.y + H); g.moveTo(f.x, gy); g.lineTo(f.x + W, gy); }
    g.stroke();
    g.strokeStyle = 'rgba(217,164,65,.55)'; g.beginPath(); g.moveTo(f.x + W / 2, f.y); g.lineTo(f.x + W / 2, f.y + H); g.moveTo(f.x, f.y + H / 2); g.lineTo(f.x + W, f.y + H / 2); g.stroke();
  }
  g.strokeStyle = 'rgba(217,164,65,.45)'; g.lineWidth = 1; g.strokeRect(Math.round(f.x) - 0.5, Math.round(f.y) - 0.5, Math.round(W) + 1, Math.round(H) + 1);
  if (typeof sculptActive === 'function' && sculptActive()) {
    const ly = curSculptLayer(), bt = brushTarget(), rad = bt.b.r * Math.max(W, H);
    if (v2.hover) {
      g.strokeStyle = '#d9a441'; g.lineWidth = 1.5; g.beginPath(); g.arc(f.x + v2.hover.u * W, f.y + v2.hover.v * H, rad, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = 'rgba(217,164,65,.45)'; g.beginPath(); g.arc(f.x + v2.hover.u * W, f.y + v2.hover.v * H, rad * Math.max(0.05, bt.b.h), 0, Math.PI * 2); g.stroke();
    }
    if (sculpt.tool === 'clone' && ly && ly.cloneSrc) {
      const sx = f.x + ly.cloneSrc.u * W, sy = f.y + ly.cloneSrc.v * H;
      g.strokeStyle = '#e5ebee'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx - 7, sy); g.lineTo(sx + 7, sy); g.moveTo(sx, sy - 7); g.lineTo(sx, sy + 7); g.stroke();
    }
  }
}
c2.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = c2.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top, f = fit2D();
  const ix = (mx - f.x) / f.s, iy = (my - f.y) / f.s;
  v2.zoom = Math.max(0.2, Math.min(40, v2.zoom * Math.exp(-e.deltaY * 0.0015)));
  const s2 = baseScale(f.cw, f.ch) * v2.zoom;
  v2.px = mx - ((f.cw - off.width * s2) / 2 + ix * s2);
  v2.py = my - ((f.ch - off.height * s2) / 2 + iy * s2);
  draw2D();
}, { passive: false });
c2.addEventListener('pointerdown', e => {
  if (e.button === 0 && sculptActive()) {
    const uv = uv2D(e); if (!uv) return;
    if (e.altKey) { setCloneSrc(uv); return; }
    if (strokeStart(uv)) c2.setPointerCapture(e.pointerId);
    return;
  }
  v2.drag = { x: e.clientX, y: e.clientY, px: v2.px, py: v2.py }; c2.setPointerCapture(e.pointerId); c2.classList.add('drag');
});
c2.addEventListener('pointerup', () => { strokeEnd(); v2.drag = null; c2.classList.remove('drag'); });
c2.addEventListener('pointercancel', () => { v2.drag = null; c2.classList.remove('drag'); });
c2.addEventListener('dblclick', () => { v2.zoom = 1; v2.px = v2.py = 0; draw2D(); });
c2.addEventListener('pointerleave', () => { v2.hover = null; draw2D(); const h = $('hoverInfo'); if (h) h.textContent = ''; });
c2.addEventListener('pointermove', e => {
  if (sculptActive()) { v2.hover = uv2D(e, !!painting); if (painting && v2.hover) strokeAdd(v2.hover); draw2D(); }
  if (v2.drag) { v2.px = v2.drag.px + e.clientX - v2.drag.x; v2.py = v2.drag.py + e.clientY - v2.drag.y; draw2D(); return; }
  const h = $('hoverInfo'); if (!h || !current) return;
  const rect = c2.getBoundingClientRect(), f = fit2D();
  let ix = Math.floor((e.clientX - rect.left - f.x) / f.s), iy = Math.floor((e.clientY - rect.top - f.y) / f.s);
  const W = current.w, Hh = current.h;
  if (view.tile && ix >= -W && iy >= -Hh && ix < 2 * W && iy < 2 * Hh) { ix = (ix + W) % W; iy = (iy + Hh) % Hh; }
  if (ix < 0 || iy < 0 || ix >= W || iy >= Hh) { h.textContent = ''; return; }
  const idx = iy * W + ix, v = current.data[idx], d = exportDims(), md = mapFor(current);
  const mv = md ? ' · ' + (md.ch === 3 ? 'RGB <b>' + [0, 1, 2].map(c => Math.round(md.data[idx * 3 + c] * 255)).join(' ') + '</b>' : E.MAPS[md.type].name.toLowerCase() + ' <b>' + md.data[idx].toFixed(3) + '</b>') : '';
  h.innerHTML = `pixel <b>${Math.floor(ix * d.w / W)}, ${Math.floor(iy * d.h / Hh)}</b> → <b>${v.toFixed(4)}</b> · 16 bits <b>${Math.round(v * 65535)}</b>${mv}`;
});

// ---------- Vue 3D ----------
const V3 = { ok: undefined };
function init3D() {
  if (V3.ok !== undefined) return V3.ok;
  const host = $('view3d');
  if (!window.THREE || !THREE.OrbitControls) { V3.ok = false; host.innerHTML = '<div class="msg">La vue 3D n\'a pas pu charger Three.js. La vue 2D reste disponible.</div>'; return false; }
  let r;
  try { r = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { V3.ok = false; host.innerHTML = '<div class="msg">WebGL n\'est pas disponible sur cet appareil. Utilisez la vue 2D.</div>'; return false; }
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  r.outputEncoding = THREE.sRGBEncoding;
  r.domElement.style.cssText = 'width:100%;height:100%;display:block';
  host.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b1217);
  const cam = new THREE.PerspectiveCamera(38, 1, 0.01, 50); cam.position.set(0.95, 0.75, 1.15);
  const ctl = new THREE.OrbitControls(cam, r.domElement);
  ctl.enableDamping = true; ctl.target.set(0, 0.06, 0); ctl.minDistance = 0.15; ctl.maxDistance = 6;
  scene.add(new THREE.HemisphereLight(0xdde6ee, 0x18222a, 0.55));
  const dl = new THREE.DirectionalLight(0xfff3df, 1.15); scene.add(dl);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.93, 1, 64), new THREE.MeshBasicMaterial({ color: 0xd9a441, transparent: true, opacity: 0.95, depthTest: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.visible = false; ring.renderOrder = 10; scene.add(ring);
  Object.assign(V3, { ok: true, r, scene, cam, ctl, dl, mat, ring, mesh: null, geo: null, gw: 0, gh: 0, cmode: '' });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const hit = e => {
    if (!V3.mesh) return null;
    const rc = r.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - rc.left) / rc.width) * 2 - 1, -((e.clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObject(V3.mesh)[0]; if (!h) return null;
    const m = Math.max(V3.gw, V3.gh);
    return { u: Math.min(1, Math.max(0, h.point.x / (V3.gw / m) + 0.5)), v: Math.min(1, Math.max(0, h.point.z / (V3.gh / m) + 0.5)), p: h.point };
  };
  r.domElement.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !sculptActive()) return;
    const hh = hit(e); if (!hh) return;
    if (e.altKey) { setCloneSrc(hh); return; }
    if (strokeStart(hh)) r.domElement.setPointerCapture(e.pointerId);
  });
  r.domElement.addEventListener('pointermove', e => {
    if (!sculptActive()) { ring.visible = false; return; }
    const hh = hit(e);
    if (hh) { ring.visible = true; ring.position.set(hh.p.x, hh.p.y + 0.003, hh.p.z); ring.scale.setScalar(brushTarget().b.r); if (painting) strokeAdd(hh); }
    else ring.visible = false;
  });
  r.domElement.addEventListener('pointerup', () => strokeEnd());
  r.domElement.addEventListener('pointerleave', () => { ring.visible = false; });
  r.domElement.addEventListener('contextmenu', e => e.preventDefault());
  new ResizeObserver(resize3D).observe(host); resize3D(); setLight();
  (function loop() { requestAnimationFrame(loop); if (view.tab !== '3d') return; ctl.update(); r.render(scene, cam); })();
  return true;
}
function resize3D() {
  if (!V3.ok) return;
  const host = $('view3d'), w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  V3.r.setSize(w, h, false); V3.cam.aspect = w / h; V3.cam.updateProjectionMatrix();
}
function setLight() { if (!V3.ok) return; const a = view.az * Math.PI / 180; V3.dl.position.set(Math.cos(a) * 2, 1.5, Math.sin(a) * 2); }
const LIN = {};
function linLut(name) {
  if (LIN[name]) return LIN[name];
  const s = LUT[name] || LUT.gray, o = new Float32Array(s.length);
  for (let i = 0; i < s.length; i++) o[i] = Math.pow(s[i] / 255, 2.2);
  return (LIN[name] = o);
}
function update3D(r) {
  if (!init3D()) return;
  const w = r.w, h = r.h, m = Math.max(w, h);
  if (V3.gw !== w || V3.gh !== h) {
    if (V3.mesh) { V3.scene.remove(V3.mesh); V3.geo.dispose(); }
    const geo = new THREE.PlaneGeometry(w / m, h / m, w - 1, h - 1);
    geo.rotateX(-Math.PI / 2);
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(w * h * 3), 3));
    V3.geo = geo; V3.mesh = new THREE.Mesh(geo, V3.mat); V3.scene.add(V3.mesh); V3.gw = w; V3.gh = h;
  }
  const pos = V3.geo.attributes.position.array, col = V3.geo.attributes.color.array, L = linLut(view.color === 'shade' ? 'alt' : view.color), vs = view.vscale, d = r.data;
  const md = mapFor(r), M = md && md.data;
  for (let i = 0; i < w * h; i++) {
    pos[i * 3 + 1] = d[i] * vs;
    if (md) {
      if (md.ch === 3) { col[i * 3] = Math.pow(M[i * 3], 2.2); col[i * 3 + 1] = Math.pow(M[i * 3 + 1], 2.2); col[i * 3 + 2] = Math.pow(M[i * 3 + 2], 2.2); }
      else { const g = Math.pow(M[i], 2.2); col[i * 3] = g; col[i * 3 + 1] = g; col[i * 3 + 2] = g; }
      continue;
    }
    const li = Math.max(0, Math.min(255, (d[i] * 255) | 0)) * 3;
    col[i * 3] = L[li]; col[i * 3 + 1] = L[li + 1]; col[i * 3 + 2] = L[li + 2];
  }
  const PMk = paintedMaskFor(r);
  if (PMk) for (let i = 0; i < PMk.length; i++) { const a = (1 - PMk[i]) * 0.6; col[i * 3] += (0.76 - col[i * 3]) * a; col[i * 3 + 1] += (0.1 - col[i * 3 + 1]) * a; col[i * 3 + 2] += (0.08 - col[i * 3 + 2]) * a; }
  V3.geo.attributes.position.needsUpdate = true; V3.geo.attributes.color.needsUpdate = true;
  V3.geo.computeVertexNormals(); V3.geo.computeBoundingSphere();
  V3.mat.wireframe = view.wire;
}
function draw() { if (!current) return; if (view.tab === '3d') update3D(current); else update2D(current); }

// ---------- Statut ----------
function updateStatus() {
  const r = current; if (!r) return;
  const n = project.layers.filter(l => l.enabled).length;
  $('status').innerHTML = `<span>Aperçu <b>${r.w}×${r.h}</b></span><span>calcul <b>${r.ms.toFixed(0)} ms</b>${Runner.threaded ? '' : ' (sans worker)'}</span>` +
    `<span>valeurs brutes <b>${r.min.toFixed(3)}</b> à <b>${r.max.toFixed(3)}</b></span><span><b>${n}</b> couche${n > 1 ? 's' : ''} active${n > 1 ? 's' : ''}</span>` +
    (r.total ? `<span>recalculées <b>${r.recomputed}/${r.total}</b></span>` : '') +
    (project.global.seamless ? (q => `<span>raccord : bord <b>${q.edge.toFixed(4)}</b> / intérieur <b>${q.inner.toFixed(4)}</b> <b style="color:var(${q.ok ? '--ok' : '--danger'})">${q.ok ? 'continu' : 'visible'}</b></span>`)(seamCheck(r)) : '') +
    (view.solo && mode === 'advanced' ? '<span style="color:var(--accent)">couche seule</span>' : '') + '<span id="hoverInfo"></span>';
}

// ---------- Contrôles de paramètres ----------
function fmtv(v, step) { if (typeof v !== 'number') return v; return step >= 1 ? String(Math.round(v)) : step >= 0.01 ? v.toFixed(2) : v.toFixed(4); }
function paramControls(box, defs, obj, opt) {
  opt = opt || {};
  const changed = opt.onChange || window.__fhmChanged;
  defs.forEach(d => {
    if (opt.keyOnly && !d.key) return;
    if (d.when && d.when[1].indexOf(obj[d.when[0]]) < 0) return;
    const id = (opt.idp || 'p') + '_' + d.k;
    let row;
    if (d.t === 'seed') {
      row = el('div', 'prm seed');
      row.innerHTML = `<label for="${id}">${d.l}</label><span></span><div class="seedbox"><input type="number" id="${id}" min="0" max="99999" step="1"><button class="btn icon" type="button" title="Tirer une graine au hasard" aria-label="Graine au hasard">⚄</button></div>`;
      const inp = row.querySelector('input');
      inp.value = obj[d.k];
      inp.oninput = () => { obj[d.k] = parseInt(inp.value, 10) || 0; changed(false); };
      inp.onchange = () => changed(true);
      row.querySelector('button').onclick = () => { obj[d.k] = rndSeed(); inp.value = obj[d.k]; changed(true); };
    } else if (d.t === 'select') {
      row = el('div', 'prm sel');
      row.innerHTML = `<label for="${id}">${d.l}</label><span></span><select id="${id}"></select>`;
      const s = row.querySelector('select');
      d.options.forEach(o => { const op = el('option'); op.value = o[0]; op.textContent = o[1]; s.appendChild(op); });
      s.value = obj[d.k];
      s.onchange = () => {
        obj[d.k] = s.value;
        if (opt.onSelect) opt.onSelect(d, s.value, d.options.find(o => o[0] === s.value)[1]);
        if (defs.some(x => x.when && x.when[0] === d.k) && opt.rerender) opt.rerender();
        changed(true);
      };
    } else if (d.t === 'bool') {
      row = el('label', 'prm chk');
      row.innerHTML = `<input type="checkbox" id="${id}"><span>${d.l}</span>`;
      const c = row.querySelector('input'); c.checked = !!obj[d.k];
      c.onchange = () => { obj[d.k] = c.checked; if (defs.some(x => x.when && x.when[0] === d.k) && opt.rerender) opt.rerender(); changed(true); };
    } else {
      row = el('div', 'prm');
      row.innerHTML = `<label for="${id}">${d.l}</label><output for="${id}"></output><input type="range" id="${id}" min="${d.min}" max="${d.max}" step="${d.step}" title="Double-clic : valeur par défaut">`;
      const inp = row.querySelector('input'), out = row.querySelector('output');
      inp.value = obj[d.k]; out.textContent = fmtv(obj[d.k], d.step);
      inp.oninput = () => { obj[d.k] = parseFloat(inp.value); out.textContent = fmtv(obj[d.k], d.step); changed(false); };
      inp.onchange = () => changed(true);
      inp.ondblclick = () => { obj[d.k] = d.d; inp.value = d.d; out.textContent = fmtv(d.d, d.step); changed(true); };
    }
    box.appendChild(row);
  });
}
window.__fhmChanged = changed;
function changed(commit) {
  requestRender();
  if (commit) { commitHistory(); renderLayers(); markPreset(); }
}

// ---------- Panneaux ----------
let lastSeam = false;
function syncSeamless(autoTile) {
  const on = !!project.global.seamless;
  $('expSeamless').checked = on;
  if (on && !lastSeam && autoTile) { view.tile = true; $('tile').checked = true; v2.zoom = 1; v2.px = v2.py = 0; draw2D(); }
  lastSeam = on; renderExport();
}
function renderGlobal() { const b = $('globalProps'); b.innerHTML = ''; paramControls(b, E.GLOBAL, project.global, { idp: 'g', rerender: renderGlobal, onChange: commit => { syncSeamless(true); changed(commit); } }); }

function buildPresetGrid() {
  const grid = $('presetGrid'); grid.innerHTML = '';
  const sel = $('presetSel'); sel.innerHTML = '<option value="">Charger un preset…</option>';
  PRESETS.forEach(pr => {
    const b = el('button', 'preset'); b.type = 'button'; b.dataset.preset = pr.id; b.dataset.cat = pr.cat;
    b.innerHTML = `<canvas width="96" height="60"></canvas><span>${pr.name}<i>${pr.cat}</i></span>`;
    b.onclick = () => loadPreset(pr.id);
    grid.appendChild(b);
  });
  CATS.forEach(c => {
    const g = el('optgroup'); g.label = c;
    PRESETS.filter(p => p.cat === c).forEach(pr => { const o = el('option'); o.value = pr.id; o.textContent = pr.name; g.appendChild(o); });
    sel.appendChild(g);
  });
  const chips = $('catChips'); chips.innerHTML = '';
  let cat = store.get('cat') || 'Tout';
  if (cat !== 'Tout' && !CATS.includes(cat)) cat = 'Tout';
  const applyCat = () => {
    chips.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cat === cat)));
    grid.querySelectorAll('.preset').forEach(b => { b.hidden = cat !== 'Tout' && b.dataset.cat !== cat; });
    const n = cat === 'Tout' ? PRESETS.length : PRESETS.filter(p => p.cat === cat).length;
    $('presetCount').textContent = n + ' preset' + (n > 1 ? 's' : '');
  };
  ['Tout'].concat(CATS).forEach(c => {
    const b = el('button'); b.type = 'button'; b.dataset.cat = c; b.textContent = c;
    b.onclick = () => { cat = c; store.set('cat', c); applyCat(); };
    chips.appendChild(b);
  });
  applyCat();
  sel.onchange = () => { if (sel.value) loadPreset(sel.value); sel.value = ''; };
  const as = $('addSel');
  const grp = (label, items) => { const g = el('optgroup'); g.label = label; items.forEach(([v, t]) => { const o = el('option'); o.value = v; o.textContent = t; g.appendChild(o); }); as.appendChild(g); };
  [['Bruits', ['Bruit']], ['Terrains', ['Terrain']], ['Surfaces et motifs', ['Surface', 'Abstrait']], ['Formes', ['Forme']]].forEach(([label, cats]) =>
    grp(label, Object.keys(E.GENS).filter(k => cats.includes(E.GENS[k].cat)).map(k => ['gen:' + k, E.GENS[k].name])));
  grp('Filtres', E.FILTER[0].options.map(o => ['filter:' + o[0], 'Filtre : ' + o[1]]));
  grp('Érosion', [['erosion:hydraulique', 'Érosion hydraulique'], ['erosion:thermique', 'Érosion thermique']]);
  grp('Sculpture', [['sculpt', 'Couche de sculpture']]);
  grp('Image', [['image', 'Image importée…']]);
}
function markPreset() {
  const cp = $('curPreset'); if (cp) cp.textContent = project.layers.length ? (project.name || 'Sans titre') : 'Pile vide'; document.querySelectorAll('.preset').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === project.preset))); }
function makeThumbs() {
  PRESETS.forEach(pr => {
    const job = { w: 96, h: 60, layers: presetLayers(pr), global: E.withDefaults(E.GLOBAL, pr.global || {}) };
    Runner.run(job).then(r => {
      const cv = document.querySelector(`.preset[data-preset="${pr.id}"] canvas`); if (!cv || !r) return;
      const g = cv.getContext('2d'), im = g.createImageData(r.w, r.h);
      const keep = view.vscale; view.vscale = 0.35; colorize(r, 'shade', im.data); view.vscale = keep;
      g.putImageData(im, 0, 0);
    }).catch(() => {});
  });
}

let dragId = null;
function baseId() { const b = project.layers.find(l => l.enabled && !isFx(l)); return b ? b.id : null; }
// Quand la couche de base remonte dans la pile, un mode « Fondu » masquerait tout ce qui est dessous :
// on la passe en « Ajouter » pour que l'échange de deux couches combine bien les reliefs.
function fixBlendAfterReorder(prevBase) {
  const nb = baseId();
  if (!prevBase || prevBase === nb) return;
  const ly = project.layers.find(l => l.id === prevBase);
  if (ly && ly.blend === 'normal') { ly.blend = 'add'; toast('« ' + ly.name + ' » n\'est plus la base : elle passe en mode Ajouter.'); }
}
function moveLayer(id, to) {
  const from = project.layers.findIndex(l => l.id === id); if (from < 0) return;
  const prevBase = baseId();
  const [ly] = project.layers.splice(from, 1);
  project.layers.splice(Math.max(0, Math.min(project.layers.length, to)), 0, ly);
  fixBlendAfterReorder(prevBase);
  refresh();
}
function deleteLayer(id) {
  const idx = project.layers.findIndex(l => l.id === id); if (idx < 0) return;
  const name = project.layers[idx].name;
  project.layers.splice(idx, 1);
  if (selId === id) { const nx = project.layers[Math.min(idx, project.layers.length - 1)]; selId = nx ? nx.id : null; }
  refresh();
  toast('Couche « ' + name + ' » supprimée. Ctrl+Z pour annuler.');
}
function renderLayers() {
  const list = $('layerList'); list.innerHTML = '';
  $('layerCount').textContent = project.layers.length + ' au total';
  if (!project.layers.length) { const p = el('p', 'hint'); p.textContent = 'Pile vide. Choisissez une couche ci-dessous puis « Ajouter ».'; list.appendChild(p); }
  const last = project.layers.length - 1, bid = baseId();
  for (let i = last; i >= 0; i--) {
    const ly = project.layers[i];
    const row = el('div', 'layer' + (ly.id === selId ? ' sel' : '') + (ly.enabled ? '' : ' off'));
    row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-pressed', String(ly.id === selId)); row.draggable = true; row.dataset.id = ly.id;
    const grip = el('span', 'grip'); grip.textContent = '⋮⋮'; grip.title = 'Glisser pour déplacer'; grip.setAttribute('aria-hidden', 'true');
    const cb = el('input'); cb.type = 'checkbox'; cb.checked = ly.enabled; cb.title = 'Activer ou désactiver la couche'; cb.setAttribute('aria-label', 'Activer ' + ly.name);
    cb.onclick = e => e.stopPropagation();
    cb.onchange = () => { ly.enabled = cb.checked; changed(true); };
    const k = el('span', 'kind ' + ly.kind); k.textContent = { gen: 'G', image: 'IM', erosion: 'ER', sculpt: 'SC' }[ly.kind] || 'FX';
    const main = el('span', 'lmain'), nm = el('span', 'lname'), bl = el('span', 'lblend');
    nm.textContent = ly.name;
    bl.textContent = (isFx(ly) ? { filter: 'filtre ', erosion: 'érosion ', sculpt: (ly.strokes || []).length + ' trait' + ((ly.strokes || []).length > 1 ? 's ' : ' ') }[ly.kind] : ly.id === bid ? 'base ' : BLEND_SHORT[ly.blend] + ' ') + Math.round(ly.intensity * 100) + '%';
    if (ly.pmask && ly.pmask.on) bl.textContent += ' · masque';
    main.append(nm, bl);
    const act = el('span', 'lact');
    const ab = (txt, label, fn, dis, cls) => { const b = el('button', cls || ''); b.type = 'button'; b.textContent = txt; b.title = label; b.setAttribute('aria-label', label + ' : ' + ly.name); b.disabled = !!dis; b.onclick = e => { e.stopPropagation(); fn(); }; act.appendChild(b); };
    ab('↑', 'Monter', () => moveLayer(ly.id, i + 1), i === last);
    ab('↓', 'Descendre', () => moveLayer(ly.id, i - 1), i === 0);
    ab('✕', 'Supprimer', () => deleteLayer(ly.id), false, 'del');
    row.append(grip, cb, k, main, act);
    row.onclick = () => { if (selId !== ly.id) maskPaintId = null; selId = ly.id; renderLayers(); renderProps(); draw(); if (view.solo) requestRender(); };
    row.onkeydown = e => { if (e.target === row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); row.click(); } };
    row.addEventListener('dragstart', e => { dragId = ly.id; row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', ly.id); } catch (x) {} });
    row.addEventListener('dragend', () => { dragId = null; list.querySelectorAll('.layer').forEach(r => r.classList.remove('dragging', 'drop-before', 'drop-after')); });
    row.addEventListener('dragover', e => {
      if (!dragId || dragId === ly.id) return;
      e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move';
      const r = row.getBoundingClientRect(), above = e.clientY < r.top + r.height / 2;
      list.querySelectorAll('.layer').forEach(x => x.classList.remove('drop-before', 'drop-after'));
      row.classList.add(above ? 'drop-before' : 'drop-after');
    });
    row.addEventListener('drop', e => {
      if (!dragId || dragId === ly.id) return;
      e.preventDefault(); e.stopPropagation();
      const r = row.getBoundingClientRect(), above = e.clientY < r.top + r.height / 2, id = dragId;
      dragId = null;
      // La liste est affichée du haut (dernière couche) vers le bas : « au-dessus » = juste après dans la pile.
      const rest = project.layers.filter(l => l.id !== id), t = rest.indexOf(ly);
      const moving = project.layers.find(l => l.id === id);
      rest.splice(above ? t + 1 : t, 0, moving);
      const prevBase = baseId(); project.layers = rest; fixBlendAfterReorder(prevBase); selId = id; refresh();
    });
    list.appendChild(row);
  }
}
function updateEmpty() {
  const m = $('emptyMsg'), none = !project.layers.some(l => l.enabled);
  m.hidden = !none;
  if (none) m.textContent = project.layers.length ? 'Toutes les couches sont désactivées.' : mode === 'advanced' ? 'Pile vide : ajoutez un générateur, une image ou un filtre.' : 'Choisissez un type de relief à gauche, ou passez en mode Avancé pour partir de zéro.';
}

function renderProps() {
  const box = $('layerProps'); box.innerHTML = '';
  if (mode === 'express') {
    $('propsTitle').textContent = 'Paramètres';
    const main = project.layers.find(l => l.kind === 'gen' && l.enabled) || project.layers[0];
    if (!main) { box.innerHTML = '<p class="hint">Choisissez un type de relief à gauche.</p>'; return; }
    const g = el('div', 'group'); g.innerHTML = `<div class="group-title">${main.name}</div>`;
    paramControls(g, layerDefs(main), main.params, { keyOnly: true, idp: 'x' + main.id, rerender: renderProps });
    box.appendChild(g);
    if (project.layers.length > 1) { const p = el('p', 'hint'); p.textContent = `Ce relief combine ${project.layers.length} couches. Le mode Avancé donne accès à chacune.`; box.appendChild(p); }
    return;
  }
  $('propsTitle').textContent = 'Couche sélectionnée';
  const ly = project.layers.find(l => l.id === selId);
  if (!ly) { box.innerHTML = '<p class="hint">Sélectionnez une couche dans la pile, ou ajoutez-en une.</p>'; return; }
  const idx = project.layers.indexOf(ly);

  const nameIn = el('input', 'namein'); nameIn.type = 'text'; nameIn.value = tr(ly.name); nameIn.id = 'lyName'; nameIn.setAttribute('aria-label', 'Nom de la couche');
  nameIn.oninput = () => { ly.name = nameIn.value; renderLayers(); };
  nameIn.onchange = () => commitHistory();
  const btns = el('div', 'rowbtns');
  const mk = (label, fn, cls, dis) => { const b = el('button', 'btn' + (cls ? ' ' + cls : '')); b.type = 'button'; b.textContent = label; b.onclick = fn; b.disabled = !!dis; btns.appendChild(b); };
  mk('Dupliquer', () => { const c = JSON.parse(JSON.stringify(ly)); c.id = uid(); c.name = ly.name + ' (copie)'; project.layers.splice(idx + 1, 0, c); selId = c.id; refresh(); });
  mk('Monter', () => { project.layers.splice(idx, 1); project.layers.splice(idx + 1, 0, ly); refresh(); }, '', idx === project.layers.length - 1);
  mk('Descendre', () => { project.layers.splice(idx, 1); project.layers.splice(idx - 1, 0, ly); refresh(); }, '', idx === 0);
  mk('Supprimer', () => { project.layers.splice(idx, 1); const nx = project.layers[Math.min(idx, project.layers.length - 1)]; selId = nx ? nx.id : null; refresh(); }, 'danger');
  box.append(nameIn, btns);

  if (ly.kind === 'gen') {
    const g = el('div', 'prm sel');
    g.innerHTML = '<label for="lyType">Générateur</label><span></span><select id="lyType"></select>';
    const s = g.querySelector('select');
    Object.keys(E.GENS).forEach(k => { const o = el('option'); o.value = k; o.textContent = E.GENS[k].name; s.appendChild(o); });
    s.value = ly.type;
    s.onchange = () => {
      if (ly.name === E.GENS[ly.type].name) ly.name = E.GENS[s.value].name;
      ly.type = s.value; ly.params = E.withDefaults(E.GENS[s.value].params, { seed: ly.params.seed || 1 });
      renderProps(); changed(true);
    };
    box.appendChild(g);
  }
  if (ly.kind === 'image' && images[ly.imgId]) {
    const im = images[ly.imgId], wrap = el('div', 'group');
    wrap.innerHTML = `<div class="group-title">Source</div><img alt="" style="width:100%;border-radius:4px;background:var(--stage)"><span class="hint">${im.name} · lue en ${im.w} × ${im.h}</span>`;
    wrap.querySelector('img').src = im.url;
    box.appendChild(wrap);
  }

  if (ly.kind === 'sculpt') box.appendChild(sculptPanel(ly));
  const mix = el('div', 'group'); mix.innerHTML = '<div class="group-title">Mélange</div>';
  const mixDefs = isFx(ly)
    ? [{ k: 'intensity', l: 'Intensité de l\'effet', min: 0, max: 1, step: 0.01, d: 1 }]
    : [{ k: 'blend', l: 'Mode de fusion', t: 'select', d: 'normal', options: BLENDS }, { k: 'intensity', l: 'Intensité', min: 0, max: 2, step: 0.01, d: 1 }, { k: 'invert', l: 'Inverser cette couche', t: 'bool', d: false }];
  paramControls(mix, mixDefs, ly, { idp: 'm' + ly.id });
  if (ly.id === baseId()) { const h = el('p', 'hint'); h.textContent = 'Couche de base : tout en bas de la pile, elle pose le relief. Son mode de fusion agira dès qu\'une autre couche passera dessous.'; mix.appendChild(h); }
  paramControls(mix, [{ k: 'on', l: 'Limiter selon l\'altitude', t: 'bool', d: false },
    { k: 'lo', l: 'Altitude minimale', min: 0, max: 1, step: 0.01, d: 0.2, when: ['on', [true]] },
    { k: 'hi', l: 'Altitude maximale', min: 0, max: 1, step: 0.01, d: 0.8, when: ['on', [true]] },
    { k: 'soft', l: 'Transition', min: 0, max: 0.5, step: 0.01, d: 0.1, when: ['on', [true]] }], ly.mask, { idp: 'k' + ly.id, rerender: renderProps });
  box.appendChild(mix);
  box.appendChild(maskPanel(ly));

  if (!layerDefs(ly).length) { updateSculptMode(); return; }
  const pg = el('div', 'group');
  pg.innerHTML = `<div class="group-title">${{ gen: 'Paramètres du générateur', image: 'Réglages de l\'image', erosion: 'Paramètres de l\'érosion' }[ly.kind] || 'Paramètres du filtre'}</div>`;
  if (ly.kind === 'erosion') {
    const q = el('div', 'prm sel');
    q.innerHTML = '<label for="eroPreset">Préréglage</label><span></span><select id="eroPreset"><option value="">Appliquer un préréglage…</option></select>';
    const sel = q.querySelector('select');
    Object.keys(ERO_PRESETS).forEach(k => { const o = el('option'); o.value = k; o.textContent = ERO_PRESETS[k].label; sel.appendChild(o); });
    sel.onchange = () => { const pr = ERO_PRESETS[sel.value]; if (!pr) return; ly.params = E.withDefaults(E.EROSION, Object.assign({ seed: ly.params.seed, quality: ly.params.quality }, pr.p)); renderProps(); changed(true); };
    pg.appendChild(q);
  }
  paramControls(pg, layerDefs(ly), ly.params, {
    idp: 'q' + ly.id, rerender: renderProps,
    onSelect: (d, v, label) => {
      if (ly.kind === 'filter' && d.k === 'op' && /^(Filtre|Lisser|Terrasses|Courbe|Niveaux|Inverser|Paliers)/.test(ly.name)) { ly.name = label; renderLayers(); }
      if (ly.kind === 'erosion' && d.k === 'op' && /^Érosion/.test(ly.name)) { ly.name = v === 'thermique' ? 'Érosion thermique' : 'Érosion hydraulique'; renderLayers(); }
    }
  });
  box.appendChild(pg);
  if (ly.kind === 'erosion') { const h = el('p', 'hint'); h.textContent = 'L\'érosion est simulée sur une grille fixe puis appliquée à la map : l\'aperçu et l\'export donnent le même résultat. Une résolution de 1024 donne des rigoles plus fines mais prend quelques secondes.'; box.appendChild(h); }
  updateSculptMode();
}
function refresh() { renderLayers(); renderProps(); changed(true); }

function renderExport() {
  const e = project.export;
  document.querySelectorAll('input[name=fmt]').forEach(r => { r.checked = r.value === e.format; });
  $('resSel').value = e.res; $('customDims').hidden = e.res !== 'custom';
  $('expW').value = e.w; $('expH').value = e.h; $('profileSel').value = e.profile || 'custom';
  const d = exportDims(), mb = Math.max(1, Math.round(d.w * d.h * 10 / 1048576)), big = d.w * d.h > 4096 * 4096;
  let txt = `${d.w} × ${d.h} px${project.global.seamless ? ' · raccordable (seamless)' : ''} · environ ${mb} Mo de mémoire pendant le calcul.`;
  if (PROFILES[e.profile]) txt += ' ' + PROFILES[e.profile].note;
  if (big) txt += ' Très grande résolution : comptez de quelques secondes à plus d\'une minute.';
  $('exportNote').textContent = txt; $('exportNote').classList.toggle('warn', big);
}
function renderAll() { project.maps = mergeMaps(project.maps); renderGlobal(); renderLayers(); renderProps(); renderExport(); renderMaps(); renderPack(); markPreset(); syncQuickEro(); syncSeamless(false); }

// ---------- Actions ----------
function loadPreset(id) {
  const pr = PRESETS.find(p => p.id === id); if (!pr) return;
  project.layers = presetLayers(pr); project.global = E.withDefaults(E.GLOBAL, pr.global || {});
  project.preset = id; project.name = pr.name;
  selId = project.layers[project.layers.length - 1].id;
  renderAll(); changed(true);
}
function variation() {
  let n = 0;
  project.layers.forEach(l => { if (l.params && 'seed' in l.params) { l.params.seed = rndSeed(); n++; } });
  if (!n) { toast('Aucune couche de ce relief n\'utilise de graine.'); return; }
  renderProps(); changed(true);
}
function setMode(m) {
  mode = m; store.set('mode', m);
  document.body.classList.toggle('express', m === 'express'); document.body.classList.toggle('advanced', m === 'advanced');
  $('modeExpress').setAttribute('aria-pressed', String(m === 'express')); $('modeAdvanced').setAttribute('aria-pressed', String(m === 'advanced'));
  if (!selId && project.layers.length) selId = project.layers[project.layers.length - 1].id;
  renderProps(); renderLayers(); updateEmpty(); updateSculptMode();
  if (view.solo) requestRender();
  setTimeout(() => { resize3D(); draw2D(); }, 0);
}
function setTab(t) {
  view.tab = t; store.set('tab', t);
  $('tab3d').setAttribute('aria-pressed', String(t === '3d')); $('tab2d').setAttribute('aria-pressed', String(t === '2d'));
  $('view3d').hidden = t !== '3d'; c2.hidden = t !== '2d';
  document.querySelectorAll('.v3').forEach(n => { n.hidden = t !== '3d'; });
  document.querySelectorAll('.v2').forEach(n => { n.hidden = t !== '2d'; });
  if (t === '3d') { init3D(); resize3D(); }
  draw(); if (typeof updateSculptMode === 'function' && project) updateSculptMode();
}

// ---------- Historique ----------
let undoStack = [], redoStack = [], lastSaved = '';
function updUndo() { $('btnUndo').disabled = !undoStack.length; $('btnRedo').disabled = !redoStack.length; }
let dirty = false;
function commitHistory() {
  const s = JSON.stringify(project); if (s === lastSaved) return;
  dirty = true;
  undoStack.push(lastSaved); if (undoStack.length > 150) undoStack.shift();
  redoStack = []; lastSaved = s; updUndo();
}
function resetHistory() { undoStack = []; redoStack = []; lastSaved = JSON.stringify(project); updUndo(); }
function restore(s) {
  project = JSON.parse(s);
  if (!project.layers.find(l => l.id === selId)) selId = project.layers.length ? project.layers[project.layers.length - 1].id : null;
  renderAll(); requestRender(); updUndo();
}
function undo() { if (!undoStack.length) return; redoStack.push(lastSaved); lastSaved = undoStack.pop(); restore(lastSaved); }
function redo() { if (!redoStack.length) return; undoStack.push(lastSaved); lastSaved = redoStack.pop(); restore(lastSaved); }

// ---------- Images ----------
function readAsDataURL(file) { return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }
async function decodeImage(src) {
  const img = new Image(); img.src = src; await img.decode();
  let w = img.naturalWidth, h = img.naturalHeight; const m = Math.max(w, h);
  if (m > 4096) { const s = 4096 / m; w = Math.round(w * s); h = Math.round(h * s); }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
  return { w, h, data: out };
}
async function addImageFile(file) {
  if (!file || !/^image\//.test(file.type)) { toast('Ce fichier n\'est pas une image. Formats acceptés : PNG, JPEG, WebP, BMP…'); return; }
  try {
    const url = await readAsDataURL(file), g = await decodeImage(url), id = 'I' + uid();
    images[id] = Object.assign({ name: file.name, url }, g);
    const first = !project.layers.some(l => l.enabled);
    const ly = makeLayer('image', 'image', {}, { name: file.name.replace(/\.[^.]+$/, ''), imgId: id, blend: first ? 'normal' : 'add', intensity: first ? 1 : 0.5 });
    project.layers.push(ly); selId = ly.id;
    if (mode !== 'advanced') setMode('advanced');
    refresh();
    toast('Image ajoutée en haut de la pile' + (first ? '.' : ', en mode Ajouter à 50 %.'));
  } catch (e) { toast('Impossible de lire cette image.'); }
}

// ---------- Encodage des fichiers ----------
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
async function deflate(u8) { return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); }
function pngChunk(type, data) {
  const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}
async function encodePNG(data, w, h, bits, ch) {
  ch = ch || 1;
  const stride = 1 + w * ch * bits / 8, raw = new Uint8Array(stride * h), mx = bits === 16 ? 65535 : 255, n = w * ch;
  for (let y = 0; y < h; y++) {
    let o = y * stride; raw[o++] = 0;
    for (let x = 0; x < n; x++) {
      const v = Math.round(c01(data[y * n + x]) * mx);
      if (bits === 16) { raw[o++] = v >> 8; raw[o++] = v & 255; } else raw[o++] = v;
    }
  }
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = bits; ihdr[9] = ch === 3 ? 2 : 0;
  const z = await deflate(raw);
  return new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', ihdr), pngChunk('IDAT', z), pngChunk('IEND', new Uint8Array(0))], { type: 'image/png' });
}
// OpenEXR scanline, flottants 32 bits, compression ZIP (blocs de 16 lignes). Écrit d'après la spécification publique du format.
async function encodeEXR(data, w, h, ch) {
  const names = ch === 3 ? ['B', 'G', 'R'] : ['Y'], src = ch === 3 ? { B: 2, G: 1, R: 0 } : { Y: 0 };
  const enc = new TextEncoder(), head = [];
  const bytes = n => new Uint8Array(n);
  const i32 = v => { const a = bytes(4); new DataView(a.buffer).setInt32(0, v, true); return a; };
  const f32 = v => { const a = bytes(4); new DataView(a.buffer).setFloat32(0, v, true); return a; };
  const cstr = t => { const b = enc.encode(t), a = bytes(b.length + 1); a.set(b); return a; };
  const cat = arr => { const n = arr.reduce((s, a) => s + a.length, 0), o = bytes(n); let k = 0; arr.forEach(a => { o.set(a, k); k += a.length; }); return o; };
  const attr = (name, type, val) => head.push(cstr(name), cstr(type), i32(val.length), val);
  const chl = [];
  names.forEach(c => chl.push(cstr(c), i32(2), new Uint8Array([0, 0, 0, 0]), i32(1), i32(1)));
  chl.push(new Uint8Array([0]));
  const box = cat([i32(0), i32(0), i32(w - 1), i32(h - 1)]);
  head.push(i32(20000630), i32(2));
  attr('channels', 'chlist', cat(chl));
  attr('compression', 'compression', new Uint8Array([3]));
  attr('dataWindow', 'box2i', box);
  attr('displayWindow', 'box2i', box);
  attr('lineOrder', 'lineOrder', new Uint8Array([0]));
  attr('pixelAspectRatio', 'float', f32(1));
  attr('screenWindowCenter', 'v2f', cat([f32(0), f32(0)]));
  attr('screenWindowWidth', 'float', f32(1));
  head.push(new Uint8Array([0]));
  const header = cat(head), nb = Math.ceil(h / 16), chunks = [], lineBytes = w * 4 * names.length;
  for (let b = 0; b < nb; b++) {
    const y0 = b * 16, n = Math.min(16, h - y0), raw = bytes(lineBytes * n), dv = new DataView(raw.buffer);
    let o = 0;
    for (let y = y0; y < y0 + n; y++) for (const c of names) { const si = src[c]; for (let x = 0; x < w; x++, o += 4) dv.setFloat32(o, data[(y * w + x) * ch + si], true); }
    const len = raw.length, tmp = bytes(len);
    let t1 = 0, t2 = (len + 1) >> 1, i = 0;
    while (i < len) { tmp[t1++] = raw[i++]; if (i < len) tmp[t2++] = raw[i++]; }
    let p = tmp[0];
    for (let k = 1; k < len; k++) { const v = tmp[k]; tmp[k] = (v - p + 384) & 255; p = v; }
    const z = await deflate(tmp), body = z.length < len ? z : raw, hd = cat([i32(y0), i32(body.length)]);
    chunks.push(hd, body);
  }
  const table = bytes(nb * 8), tv = new DataView(table.buffer);
  let off = header.length + table.length;
  for (let b = 0; b < nb; b++) { tv.setBigUint64(b * 8, BigInt(off), true); off += chunks[b * 2].length + chunks[b * 2 + 1].length; }
  return new Blob([header, table].concat(chunks), { type: 'image/x-exr' });
}
function encodeRAW16(data) {
  const out = new Uint8Array(data.length * 2), dv = new DataView(out.buffer);
  for (let i = 0; i < data.length; i++) dv.setUint16(i * 2, Math.round(c01(data[i]) * 65535), true);
  return out;
}
function zipFiles(files) {
  const enc = new TextEncoder(), parts = [], central = [];
  let offset = 0;
  files.forEach(f => {
    const nb = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new Uint8Array(30 + nb.length), lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0x0800, true); lv.setUint16(12, 0x21, true);
    lv.setUint32(14, crc, true); lv.setUint32(18, sz, true); lv.setUint32(22, sz, true); lv.setUint16(26, nb.length, true); lh.set(nb, 30);
    const chd = new Uint8Array(46 + nb.length), cv = new DataView(chd.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(14, 0x21, true);
    cv.setUint32(16, crc, true); cv.setUint32(20, sz, true); cv.setUint32(24, sz, true); cv.setUint16(28, nb.length, true); cv.setUint32(42, offset, true); chd.set(nb, 46);
    parts.push(lh, f.data); central.push(chd); offset += lh.length + sz;
  });
  const cd = central.reduce((a, c) => a + c.length, 0), end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true); ev.setUint32(12, cd, true); ev.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
}
async function getDownloads() {
  return null;
}
async function saveFile(name, blob, msg) {
  const dl = await getDownloads();
  if (dl) {
    let fname = name, data = blob;
    if (/\.(raw|exr)$/.test(name)) { data = zipFiles([{ name, data: new Uint8Array(await blob.arrayBuffer()) }]); fname = name.replace(/\.(raw|exr)$/, '.zip'); }
    try { await dl.save({ filename: fname, data }); toast('Fichier enregistré : ' + fname + (msg ? ' · ' + msg : '')); return true; }
    catch (e) { toast(e && e.code === 'declined' ? 'Enregistrement annulé.' : 'Enregistrement impossible (' + ((e && e.code) || e) + ').'); return false; }
  }
  const url = URL.createObjectURL(blob), a = el('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
  toast('Fichier exporté : ' + name + (msg ? ' · ' + msg : ''));
  return true;
}

let exporting = false;
async function doExport() {
  if (exporting) return;
  const d = exportDims(), btn = $('btnExport'), prog = $('expProg'), bar = prog.querySelector('i');
  exporting = true; btn.disabled = true; btn.textContent = 'Calcul en cours…'; prog.hidden = false; bar.style.width = '0';
  const t0 = performance.now();
  try {
    const r = await Runner.run(buildJob(d.w, d.h, true), { kind: 'export', onProgress: p => { bar.style.width = (p * 90).toFixed(1) + '%'; } });
    bar.style.width = '95%'; btn.textContent = 'Encodage…';
    const fmt = project.export.format, base = slug(project.name) + '_' + d.w + 'x' + d.h + (project.global.seamless ? '_seamless' : '');
    let blob, name;
    if (fmt === 'raw16') { blob = new Blob([encodeRAW16(r.data)]); name = base + '_16bit.raw'; }
    else if (fmt === 'exr32') { blob = await encodeEXR(r.data, d.w, d.h, 1); name = base + '_32bit.exr'; }
    else { const bits = fmt === 'png16' ? 16 : 8; blob = await encodePNG(r.data, d.w, d.h, bits); name = base + '_' + bits + 'bit.png'; }
    bar.style.width = '100%';
    await saveFile(name, blob, 'calculé en ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s');
  } catch (e) { console.error(e); toast('Export impossible : ' + (e.message || e) + '. Essayez une résolution plus basse.'); }
  finally { exporting = false; btn.disabled = false; btn.textContent = 'Exporter la height map'; setTimeout(() => { prog.hidden = true; }, 900); }
}

// ---------- Projet ----------
function usedImages(layers) {
  const used = {};
  layers.forEach(l => { if (l.kind === 'image' && images[l.imgId]) used[l.imgId] = { name: images[l.imgId].name, dataURL: images[l.imgId].url }; });
  return used;
}
function projectDoc() { return { format: 'florindolab-heightmap', version: 1, app: 'Relief Generator by FlorindoLAB ' + APP_VERSION, saved: new Date().toISOString(), project, images: usedImages(project.layers) }; }
async function saveProject() {
  if (await saveFile(slug(project.name) + '.fhmap.json', new Blob([JSON.stringify(projectDoc(), null, 1)], { type: 'application/json' }))) dirty = false;
}
function migrate(doc) {
  if ((doc.version || 1) > 1) toast('Projet créé avec une version plus récente : certains réglages peuvent être ignorés.');
  const p = doc.project || {};
  p.format = 'florindolab-heightmap'; p.version = 1;
  p.global = E.withDefaults(E.GLOBAL, p.global || {});
  p.export = Object.assign(defaultExport(), p.export || {});
  p.maps = mergeMaps(p.maps);
  p.layers = (p.layers || []).map(l => {
    if (l.kind === 'gen' && !E.GENS[l.type]) l.type = 'collines';
    if (l.kind === 'sculpt' && !Array.isArray(l.strokes)) l.strokes = [];
    if (l.pmask && !Array.isArray(l.pmask.strokes)) l.pmask.strokes = [];
    return Object.assign({ id: uid(), name: 'Couche', enabled: true, blend: 'normal', intensity: 1, invert: false, mask: { on: false, lo: 0.2, hi: 0.8, soft: 0.1 } }, l, { params: E.withDefaults(defsFor(l.kind, l.type), l.params || {}) });
  });
  return p;
}
async function openProject(file) {
  try {
    const doc = JSON.parse(await file.text());
    if (!doc || doc.format !== 'florindolab-heightmap') throw new Error('Ce fichier n\'est pas un projet Relief Generator.');
    const p = migrate(doc);
    for (const id of Object.keys(doc.images || {})) {
      const im = doc.images[id];
      if (!images[id]) images[id] = Object.assign({ name: im.name, url: im.dataURL }, await decodeImage(im.dataURL));
    }
    project = p; selId = null; resetHistory();
    restore(lastSaved);
    toast('Projet ouvert : ' + (project.name || file.name));
  } catch (e) { toast(e instanceof SyntaxError ? 'Fichier illisible : le JSON est invalide.' : e.message); }
}

// ---------- Divers ----------
let toastT;
function toast(msg) {
  let t = document.querySelector('.toast');
  if (!t) { t = el('div', 'toast'); t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4500);
}

// ---------- Maps dérivées : panneau ----------
function mapsChanged(commit) { requestDerive(); if (commit) commitHistory(); }
function renderMaps() {
  const box = $('mapProps'); box.innerHTML = '';
  $('mapName').textContent = E.MAPS[view.map].name;
  $('mapSel').value = view.map;
  paramControls(box, [{ k: 'zscale', l: 'Hauteur du relief (× largeur de la map)', min: 0.02, max: 1, step: 0.01, d: 0.12 }], project.maps, { idp: 'mz', onChange: mapsChanged });
  const defs = E.MAPS[view.map].params;
  if (defs.length) {
    const g = el('div', 'group'); g.innerHTML = `<div class="group-title">${E.MAPS[view.map].name}</div>`;
    paramControls(g, defs, project.maps.params[view.map], { idp: 'mp' + view.map, onChange: mapsChanged });
    box.appendChild(g);
  }
  const hint = el('p', 'hint');
  hint.textContent = view.map === 'height' ? 'Choisissez une map dans la barre de la vue pour la voir et la régler. La hauteur du relief sert au calcul des pentes et des normales.'
    : 'La map est calculée à partir de la height map finale, avec les mêmes réglages en aperçu et à l\'export.';
  box.appendChild(hint);
}
function renderPack() {
  const b = $('packList'); b.innerHTML = '';
  Object.keys(E.MAPS).forEach(k => {
    const l = el('label', 'prm chk');
    l.innerHTML = `<input type="checkbox" id="pk_${k}"><span>${E.MAPS[k].name}</span>`;
    const c = l.querySelector('input'); c.checked = !!project.maps.pack[k];
    c.onchange = () => { project.maps.pack[k] = c.checked; commitHistory(); };
    b.appendChild(l);
  });
}
async function doExportPack() {
  if (exporting) return;
  const keys = Object.keys(E.MAPS).filter(k => project.maps.pack[k]);
  if (!keys.length) { toast('Cochez au moins une map à mettre dans le pack.'); return; }
  const d = exportDims(), btn = $('btnPack'), prog = $('expProg'), bar = prog.querySelector('i');
  exporting = true; btn.disabled = true; $('btnExport').disabled = true; prog.hidden = false; bar.style.width = '0'; btn.textContent = 'Height map…';
  const t0 = performance.now();
  try {
    const r = await Runner.run(buildJob(d.w, d.h, true), { kind: 'export', onProgress: p => { bar.style.width = (p * 45).toFixed(1) + '%'; } });
    const M = project.maps, fmt = project.export.format, bits = fmt === 'png8' ? 8 : 16, wrap = !!project.global.seamless;
    const base = slug(project.name) + '_' + d.w + 'x' + d.h + (project.global.seamless ? '_seamless' : ''), files = [];
    for (let n = 0; n < keys.length; n++) {
      const k = keys[n]; btn.textContent = E.MAPS[k].name + '…';
      let data = r.data, ch = 1;
      if (k !== 'height') { data = (await Runner.run({ op: 'derive', w: d.w, h: d.h, H: r.data, map: k, p: M.params[k], z: M.zscale, wrap })).data; ch = k === 'normal' ? 3 : 1; }
      let name = base + '_' + E.MAPS[k].short + (k === 'normal' ? '_' + M.params.normal.conv : ''), bytes;
      if (k === 'height' && fmt === 'raw16') { bytes = encodeRAW16(data); name += '_16bit.raw'; }
      else if (fmt === 'exr32') { bytes = new Uint8Array(await (await encodeEXR(data, d.w, d.h, ch)).arrayBuffer()); name += '_32bit.exr'; }
      else { bytes = new Uint8Array(await (await encodePNG(data, d.w, d.h, bits, ch)).arrayBuffer()); name += '_' + bits + 'bit.png'; }
      files.push({ name, data: bytes });
      bar.style.width = (45 + 55 * (n + 1) / keys.length).toFixed(1) + '%';
    }
    files.push({ name: slug(project.name) + '.fhmap.json', data: new TextEncoder().encode(JSON.stringify(projectDoc(), null, 1)) });
    await saveFile(base + '_maps.zip', zipFiles(files), keys.length + ' map' + (keys.length > 1 ? 's' : '') + ' en ' + ((performance.now() - t0) / 1000).toFixed(1) + ' s');
  } catch (e) { console.error(e); toast('Export du pack impossible : ' + (e.message || e) + '. Essayez une résolution plus basse.'); }
  finally { exporting = false; btn.disabled = false; $('btnExport').disabled = false; btn.textContent = 'Exporter le pack'; setTimeout(() => { prog.hidden = true; }, 900); }
}

// ---------- Avant / après ----------
async function compareStart() {
  if (comparing) return;
  if (!undoStack.length) { toast('Rien à comparer pour l\'instant : faites une modification d\'abord.'); return; }
  comparing = true; $('btnCompare').setAttribute('aria-pressed', 'true');
  const prev = JSON.parse(undoStack[undoStack.length - 1]), d = previewDims();
  const r = await Runner.run({ w: d.w, h: d.h, layers: prev.layers, global: prev.global }, { front: true });
  if (!comparing || !r) return;
  if (view.tab === '3d') update3D(r); else update2D(r);
}
function compareEnd() { if (!comparing) return; comparing = false; $('btnCompare').setAttribute('aria-pressed', 'false'); draw(); }

// ---------- Presets personnels ----------
let userPresets = (() => { try { const a = JSON.parse(store.get('userpresets') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } })();
const saveUserPresets = () => store.set('userpresets', JSON.stringify(userPresets));
const storageOK = (() => { const ok = store.set('probe', '1'); try { localStorage.removeItem('fhm_probe'); } catch (e) {} return ok; })();
function presetFileEntry(pr) { return { name: pr.name, cat: pr.cat, layers: pr.layers, global: pr.global, images: pr.images || {} }; }
function exportAllPresets() {
  if (!userPresets.length) { toast('Aucun preset perso à exporter.'); return; }
  const doc = { format: 'florindolab-heightmap-presets', version: 1, saved: new Date().toISOString(), presets: userPresets.map(presetFileEntry) };
  saveFile('mes_presets_relief_generator.fhpresets.json', new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }))
    .then(ok => { if (!ok) return; userPresets.forEach(p => { p.exported = true; }); saveUserPresets(); renderUserPresets(); });
}
async function ensurePresetImages(pr) {
  for (const id of Object.keys(pr.images || {})) {
    if (!images[id]) { try { images[id] = Object.assign({ name: pr.images[id].name, url: pr.images[id].dataURL }, await decodeImage(pr.images[id].dataURL)); } catch (e) {} }
  }
}
async function thumbInto(pr, cv) {
  await ensurePresetImages(pr);
  const r = await Runner.run({ w: 96, h: 60, layers: JSON.parse(JSON.stringify(pr.layers)), global: E.withDefaults(E.GLOBAL, pr.global || {}) });
  if (!r) return;
  const g = cv.getContext('2d'), im = g.createImageData(r.w, r.h), keep = view.vscale;
  view.vscale = 0.35; colorize(r, 'shade', im.data); view.vscale = keep;
  g.putImageData(im, 0, 0);
}
async function loadUserPreset(pr) {
  await ensurePresetImages(pr);
  project.layers = JSON.parse(JSON.stringify(pr.layers)).map(l => Object.assign(l, { id: uid() }));
  project.global = E.withDefaults(E.GLOBAL, pr.global || {}); project.preset = pr.id; project.name = pr.name;
  selId = project.layers.length ? project.layers[project.layers.length - 1].id : null;
  renderAll(); changed(true);
}
function saveAsPreset() {
  if (!project.layers.length) { toast('La pile est vide : ajoutez au moins une couche.'); return; }
  const name = $('upName').value.trim() || project.name + ' (perso)';
  const pr = { id: 'U' + uid(), name, cat: 'Perso', layers: JSON.parse(JSON.stringify(project.layers)), global: Object.assign({}, project.global), images: usedImages(project.layers), created: new Date().toISOString() };
  userPresets.push(pr); project.preset = pr.id; $('upName').value = '';
  pr.exported = false;
  toast(!storageOK ? 'Preset créé pour cette session seulement : ce navigateur ne garde pas les données. Exportez-le.'
    : saveUserPresets() ? 'Preset « ' + name + ' » enregistré dans ce navigateur. Pensez à l\'exporter pour le garder ailleurs.'
    : 'Preset créé, mais trop lourd pour ce navigateur (images). Exportez-le pour le garder.');
  renderUserPresets(); markPreset();
}
function exportPreset(pr) {
  const doc = Object.assign({ format: 'florindolab-heightmap-preset', version: 1 }, presetFileEntry(pr));
  saveFile(slug(pr.name) + '.fhpreset.json', new Blob([JSON.stringify(doc, null, 1)], { type: 'application/json' }))
    .then(ok => { if (!ok) return; pr.exported = true; saveUserPresets(); renderUserPresets(); });
}
async function importPreset(file) {
  try {
    const doc = JSON.parse(await file.text());
    const list = doc && doc.format === 'florindolab-heightmap-preset' ? [doc] : doc && doc.format === 'florindolab-heightmap-presets' && Array.isArray(doc.presets) ? doc.presets : null;
    if (!list) throw new Error('Ce fichier n\'est pas un preset Relief Generator.');
    list.forEach(d => {
      const layers = migrate({ project: { layers: d.layers || [] } }).layers;
      userPresets.push({ id: 'U' + uid(), name: d.name || file.name, cat: 'Perso', layers, global: E.withDefaults(E.GLOBAL, d.global || {}), images: d.images || {}, created: new Date().toISOString(), exported: true });
    });
    saveUserPresets(); renderUserPresets();
    toast(list.length > 1 ? list.length + ' presets importés.' : 'Preset importé : ' + (list[0].name || file.name));
  } catch (e) { toast(e instanceof SyntaxError ? 'Fichier illisible : le JSON est invalide.' : e.message); }
}
function renderUserPresets() {
  const list = $('upList'), grid = $('userGrid'); list.innerHTML = ''; grid.innerHTML = '';
  $('upCount').textContent = userPresets.length ? userPresets.length + ' enregistré' + (userPresets.length > 1 ? 's' : '') : '';
  $('userGridTitle').hidden = !userPresets.length;
  const pending = userPresets.filter(p => !p.exported).length;
  let warn = '';
  if (!storageOK) warn = 'Ce navigateur ne garde pas les données (navigation privée ou stockage bloqué) : vos presets perso disparaîtront à la fermeture. Exportez-les.';
  else if (pending) warn = pending + (pending > 1 ? ' presets n\'ont' : ' preset n\'a') + ' jamais été exporté' + (pending > 1 ? 's. Ils ne sont gardés' : '. Il n\'est gardé') + ' que dans ce navigateur.';
  ['upWarn', 'upWarn2'].forEach(id => { $(id).hidden = !warn; $(id).textContent = warn; });
  if (!userPresets.length) { const p = el('p', 'hint'); p.textContent = 'Aucun preset perso pour l\'instant.'; list.appendChild(p); }
  userPresets.forEach(pr => {
    const row = el('div', 'uprow'), nm = el('span', 'lname'), btns = el('div', 'rowbtns');
    nm.textContent = pr.name + (pr.exported ? '' : ' •'); nm.title = pr.layers.length + ' couche(s)' + (pr.exported ? '' : ' · jamais exporté');
    const mk = (t, fn, cls) => { const b = el('button', 'btn' + (cls ? ' ' + cls : '')); b.type = 'button'; b.textContent = t; b.onclick = fn; btns.appendChild(b); return b; };
    mk('Charger', () => loadUserPreset(pr));
    mk('Exporter', () => exportPreset(pr));
    const del = mk('Suppr.', () => {
      if (del.dataset.armed) { userPresets = userPresets.filter(x => x !== pr); saveUserPresets(); renderUserPresets(); return; }
      del.dataset.armed = '1'; del.textContent = 'Confirmer'; setTimeout(() => { if (del.isConnected) { delete del.dataset.armed; del.textContent = 'Suppr.'; } }, 3000);
    }, 'danger');
    row.append(nm, btns); list.appendChild(row);
    const b = el('button', 'preset'); b.type = 'button'; b.dataset.preset = pr.id;
    b.innerHTML = '<canvas width="96" height="60"></canvas><span></span>';
    b.querySelector('span').innerHTML = '<i>Perso</i>'; b.querySelector('span').prepend(document.createTextNode(pr.name));
    b.onclick = () => loadUserPreset(pr);
    grid.appendChild(b);
    thumbInto(pr, b.querySelector('canvas')).catch(() => {});
  });
  markPreset();
}

// ---------- Érosion rapide ----------
const ERO_PRESETS = {
  legere: { label: 'Légère', p: { op: 'hydraulique', amount: 0.5, erode: 0.2 } },
  moyenne: { label: 'Moyenne', p: { op: 'hydraulique', amount: 1, erode: 0.3 } },
  forte: { label: 'Forte', p: { op: 'hydraulique', amount: 2.5, erode: 0.5, deposit: 0.4 } },
  ravinee: { label: 'Ravinée', p: { op: 'hydraulique', amount: 1.5, erode: 0.6, brush: 0.002, capacity: 6 } },
  eboulis: { label: 'Éboulis (thermique)', p: { op: 'thermique', angle: 25, strength: 1.5 } }
};
function syncQuickEro() { const q = project.layers.find(l => l.quick); $('quickEro').value = q && ERO_PRESETS[q.quick] ? q.quick : ''; }
$('quickEro').onchange = e => {
  const v = e.target.value;
  project.layers = project.layers.filter(l => !l.quick);
  if (v) {
    const pr = ERO_PRESETS[v], ly = makeLayer('erosion', 'erosion', Object.assign({ seed: rndSeed() }, pr.p), { quick: v });
    ly.name = 'Érosion · ' + pr.label;
    project.layers.push(ly);
    toast('Érosion ajoutée en haut de la pile. Le calcul prend une à deux secondes.');
  }
  renderLayers(); renderProps(); changed(true);
};

// ---------- Sculpture ----------
const TOOL_LABELS = { raise: 'Monter', lower: 'Creuser', smooth: 'Lisser', flatten: 'Aplatir', pinch: 'Pincer', noise: 'Bruit', blur: 'Flou', clone: 'Cloner' };
const TOOL_HELP = { raise: 'monte le relief', lower: 'creuse le relief', smooth: 'adoucit les petits détails', flatten: 'aplatit à la hauteur du début du trait', pinch: 'accentue les arêtes', noise: 'ajoute des irrégularités', blur: 'adoucit fortement', clone: 'copie une zone (Alt+clic pour choisir la source)' };
const sculpt = (() => { const d = { tool: 'raise', r: 0.05, s: 0.5, h: 0.3 }; try { return Object.assign(d, JSON.parse(store.get('sculpt') || '{}')); } catch (e) { return d; } })();
const saveSculpt = () => store.set('sculpt', JSON.stringify(sculpt));
const r4 = v => Math.round(v * 1e4) / 1e4;
let painting = null;
const maskBrush = (() => { const d = { tool: 'paint', r: 0.08, s: 0.6, h: 0.4 }; try { return Object.assign(d, JSON.parse(store.get('maskbrush') || '{}')); } catch (e) { return d; } })();
const saveMaskBrush = () => store.set('maskbrush', JSON.stringify(maskBrush));
let maskPaintId = null;
// Cible de la brosse : la couche de sculpture sélectionnée, ou le masque peint de la couche sélectionnée en mode « Peindre le masque ».
function brushTarget() {
  if (mode !== 'advanced') return null;
  const l = project.layers.find(x => x.id === selId);
  if (!l || !l.enabled) return null;
  if (maskPaintId === l.id && l.pmask && l.pmask.on) return { type: 'mask', ly: l, b: maskBrush, save: saveMaskBrush };
  if (l.kind === 'sculpt') return { type: 'sculpt', ly: l, b: sculpt, save: saveSculpt };
  return null;
}
function curSculptLayer() { const t = brushTarget(); return t && t.type === 'sculpt' ? t.ly : null; }
function sculptActive() { return !!brushTarget(); }
function updateSculptMode() {
  const t = brushTarget(), on = !!t, hud = $('sculptHud');
  hud.hidden = !on;
  if (on) {
    const lab = t.type === 'mask' ? (maskBrush.tool === 'erase' ? 'Effacer le masque' : 'Peindre le masque') : TOOL_LABELS[sculpt.tool];
    const help = t.type === 'mask' ? (maskBrush.tool === 'erase' ? 'retire l\'effet de la couche' : 'fait apparaître l\'effet de la couche') : TOOL_HELP[sculpt.tool];
    hud.innerHTML = `<b>${lab}</b><span> · ${help}</span><span> · clic gauche pour peindre</span><span> · [ ] pour la taille</span><span> · ${view.tab === '3d' ? 'clic droit pour tourner' : 'clic droit pour déplacer'}</span>`;
  }
  if (V3.ok) { V3.ctl.mouseButtons.LEFT = on ? null : THREE.MOUSE.ROTATE; V3.ctl.mouseButtons.RIGHT = on ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN; if (!on && V3.ring) V3.ring.visible = false; }
  draw2D();
}
function strokeList(ly, button) {
  // ligne « N traits · Retirer le dernier · Tout effacer » pour une liste de traits
  const get = () => button === 'mask' ? ly.pmask.strokes : ly.strokes, set = v => { if (button === 'mask') ly.pmask.strokes = v; else ly.strokes = v; };
  const n = get().length, info = el('div', 'rowbtns');
  const cnt = el('span', 'hint'); cnt.style.alignSelf = 'center'; cnt.textContent = n + ' trait' + (n > 1 ? 's' : '');
  const undoB = el('button', 'btn'); undoB.type = 'button'; undoB.textContent = 'Retirer le dernier trait'; undoB.disabled = !n;
  undoB.onclick = () => { get().pop(); refresh(); };
  const clr = el('button', 'btn danger'); clr.type = 'button'; clr.textContent = 'Tout effacer'; clr.disabled = !n;
  clr.onclick = () => { if (!clr.dataset.armed) { clr.dataset.armed = '1'; clr.textContent = 'Confirmer'; setTimeout(() => { if (clr.isConnected) { delete clr.dataset.armed; clr.textContent = 'Tout effacer'; } }, 3000); return; } set([]); refresh(); };
  info.append(cnt, undoB, clr);
  return info;
}
function sculptPanel(ly) {
  const g = el('div', 'group'); g.innerHTML = '<div class="group-title">Brosse</div>';
  const tools = el('div', 'tools');
  E.TOOLS.forEach(t => {
    const b = el('button', 'btn' + (sculpt.tool === t ? ' primary' : '')); b.type = 'button'; b.textContent = TOOL_LABELS[t]; b.title = TOOL_HELP[t];
    b.setAttribute('aria-pressed', String(sculpt.tool === t));
    b.onclick = () => { sculpt.tool = t; saveSculpt(); renderProps(); };
    tools.appendChild(b);
  });
  g.appendChild(tools);
  paramControls(g, [{ k: 'r', l: 'Rayon', min: 0.005, max: 0.25, step: 0.001, d: 0.05 }, { k: 's', l: 'Force', min: 0.02, max: 1, step: 0.01, d: 0.5 }, { k: 'h', l: 'Dureté du bord', min: 0, max: 0.95, step: 0.01, d: 0.3 }],
    sculpt, { idp: 'sc', onChange: () => { saveSculpt(); draw2D(); } });
  g.appendChild(strokeList(ly, 'sculpt'));
  const h = el('p', 'hint'); h.textContent = 'Les traits sont enregistrés dans la couche et rejoués à chaque calcul : la sculpture reste modifiable, désactivable, et identique à toutes les résolutions d\'export.';
  g.appendChild(h);
  return g;
}
function maskPanel(ly) {
  const g = el('div', 'group'); g.innerHTML = '<div class="group-title">Masque peint</div>';
  if (!ly.pmask) ly.pmask = { on: false, fill: 'white', feather: 0.005, invert: false, strokes: [] };
  const pm = ly.pmask;
  paramControls(g, [{ k: 'on', l: 'Utiliser un masque peint', t: 'bool', d: false }], pm, { idp: 'pmo' + ly.id, onChange: commit => { if (!pm.on && maskPaintId === ly.id) maskPaintId = null; renderProps(); renderLayers(); changed(commit); } });
  if (pm.on) {
    const active = maskPaintId === ly.id;
    const tb = el('button', 'btn' + (active ? ' primary' : '')); tb.type = 'button'; tb.textContent = active ? 'Terminer la peinture du masque' : 'Peindre le masque';
    tb.setAttribute('aria-pressed', String(active));
    tb.onclick = () => { maskPaintId = active ? null : ly.id; renderProps(); draw(); };
    g.appendChild(tb);
    if (active) {
      const tools = el('div', 'tools');
      [['paint', 'Peindre'], ['erase', 'Effacer']].forEach(([t, lab]) => {
        const b = el('button', 'btn' + (maskBrush.tool === t ? ' primary' : '')); b.type = 'button'; b.textContent = lab; b.setAttribute('aria-pressed', String(maskBrush.tool === t));
        b.onclick = () => { maskBrush.tool = t; saveMaskBrush(); renderProps(); };
        tools.appendChild(b);
      });
      g.appendChild(tools);
      paramControls(g, [{ k: 'r', l: 'Rayon', min: 0.005, max: 0.3, step: 0.001, d: 0.08 }, { k: 's', l: 'Force', min: 0.02, max: 1, step: 0.01, d: 0.6 }, { k: 'h', l: 'Dureté du bord', min: 0, max: 0.95, step: 0.01, d: 0.4 }],
        maskBrush, { idp: 'mb', onChange: () => { saveMaskBrush(); draw2D(); } });
    }
    paramControls(g, [{ k: 'fill', l: 'Au départ', t: 'select', d: 'white', options: [['white', 'Effet partout (peindre pour retirer)'], ['black', 'Effet nulle part (peindre pour ajouter)']] },
      { k: 'feather', l: 'Adoucissement du bord', min: 0, max: 0.05, step: 0.0005, d: 0.005 }, { k: 'invert', l: 'Inverser le masque', t: 'bool', d: false }], pm,
      { idp: 'pmp' + ly.id, onChange: commit => { changed(commit); if (maskPaintId === ly.id) draw(); } });
    g.appendChild(strokeList(ly, 'mask'));
    const h = el('p', 'hint'); h.textContent = 'Pendant la peinture, les zones où la couche n\'agit pas sont teintées en rouge. Le masque est rejoué à chaque calcul, comme la sculpture.';
    g.appendChild(h);
  }
  return g;
}
function strokeStart(uv) {
  const t = brushTarget(); if (!t) return false;
  const B = t.b, st = { t: B.tool, r: r4(B.r), s: B.s, h: B.h, p: [[r4(uv.u), r4(uv.v)]] };
  if (t.type === 'sculpt') {
    if (st.t === 'noise') st.seed = rndSeed();
    if (st.t === 'clone') {
      if (!t.ly.cloneSrc) { toast('Cloner : faites d\'abord Alt+clic sur la zone à copier.'); return false; }
      st.o = [r4(t.ly.cloneSrc.u - uv.u), r4(t.ly.cloneSrc.v - uv.v)];
    }
    t.ly.strokes.push(st);
  } else t.ly.pmask.strokes.push(st);
  painting = { ly: t.ly, st, last: uv };
  requestRender(); return true;
}
function strokeAdd(uv) {
  const P = painting; if (!P) return;
  const d = exportDims(), m = Math.max(d.w, d.h), ax = d.w / m, ay = d.h / m, step = Math.max(P.st.r * 0.3, 0.002);
  const dist = Math.hypot((uv.u - P.last.u) * ax, (uv.v - P.last.v) * ay);
  if (dist < step) return;
  const n = Math.min(200, Math.floor(dist / step));
  for (let i = 1; i <= n; i++) { const t = i * step / dist; P.st.p.push([r4(P.last.u + (uv.u - P.last.u) * t), r4(P.last.v + (uv.v - P.last.v) * t)]); }
  const lp = P.st.p[P.st.p.length - 1]; P.last = { u: lp[0], v: lp[1] };
  requestRender();
}
function strokeEnd() { if (!painting) return; painting = null; commitHistory(); renderLayers(); renderProps(); }
function setCloneSrc(uv) { const ly = curSculptLayer(); if (!ly) return; ly.cloneSrc = { u: r4(uv.u), v: r4(uv.v) }; toast('Source du clone placée. Peignez ailleurs pour copier cette zone.'); draw2D(); }
// Masque affiché en surimpression pendant la peinture (rouge = la couche n'agit pas)
function paintedMaskFor(r) {
  const t = brushTarget(); if (!t || t.type !== 'mask' || comparing) return null;
  return E.rasterMask(r.w, r.h, t.ly.pmask, !!project.global.seamless);
}
function uv2D(e, allowOut) {
  if (!off.width) return null;
  const rect = c2.getBoundingClientRect(), f = fit2D();
  let u = (e.clientX - rect.left - f.x) / (off.width * f.s), v = (e.clientY - rect.top - f.y) / (off.height * f.s);
  if (view.tile) { if (u < -1 || u > 2 || v < -1 || v > 2) return null; u = ((u % 1) + 1) % 1; v = ((v % 1) + 1) % 1; }
  else if (!allowOut && (u < 0 || v < 0 || u > 1 || v > 1)) return null;
  return { u: Math.min(1, Math.max(0, u)), v: Math.min(1, Math.max(0, v)) };
}
c2.addEventListener('contextmenu', e => e.preventDefault());

// ---------- Langue (FR / EN) ----------
// L'interface est écrite en français ; en anglais, chaque texte affiché est traduit à la volée
// (y compris ce qui est créé dynamiquement), à partir du dictionnaire I18N_EN et des règles I18N_RX.
let lang = (() => { const s = store.get('lang'); if (s === 'fr' || s === 'en') return s; return /^fr/i.test(navigator.language || 'fr') ? 'fr' : 'en'; })();
const I18N_MISSING = new Set();
function tr(src) {
  if (lang === 'fr' || !src) return src;
  const k = src.trim(); if (!k || !/[A-Za-zÀ-ÿ]/.test(k) || /^[\d\s.,×:%()\/+−-]*(ms|px|s)?$/.test(k) || /^[A-Z]{1,3}$/.test(k)) return src;
  let out = I18N_EN[k];
  if (out === undefined) for (const [rx, rp] of I18N_RX) { const m = k.match(rx); if (m) { out = typeof rp === 'function' ? rp(...m) : k.replace(rx, rp); if (out !== undefined) break; } }
  if (out === undefined) { I18N_MISSING.add(k); return src; }
  return src.match(/^\s*/)[0] + out + src.match(/\s*$/)[0];
}
const I18N_ATTRS = ['title', 'aria-label', 'placeholder', 'label'];
function trNode(n) {
  if (n.nodeType === 3) {
    const cur = n.nodeValue;
    if (n.__fr === undefined || cur !== n.__t) n.__fr = cur;
    const t = tr(n.__fr); n.__t = t;
    if (t !== cur) n.nodeValue = t;
    return;
  }
  if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
  for (const a of I18N_ATTRS) {
    if (!n.hasAttribute(a)) continue;
    const cur = n.getAttribute(a), ko = '__fr_' + a, kt = '__t_' + a;
    if (n[ko] === undefined || cur !== n[kt]) n[ko] = cur;
    const t = tr(n[ko]); n[kt] = t;
    if (t !== cur) n.setAttribute(a, t);
  }
  for (const c of n.childNodes) trNode(c);
}
new MutationObserver(ms => {
  for (const m of ms) {
    if (m.type === 'childList') m.addedNodes.forEach(trNode);
    else trNode(m.target);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });
function setLang(l) {
  lang = l; store.set('lang', l);
  document.documentElement.lang = l;
  $('langFr').setAttribute('aria-pressed', String(l === 'fr')); $('langEn').setAttribute('aria-pressed', String(l === 'en'));
  trNode(document.body);
}

// ---------- Câblage ----------
$('modeExpress').onclick = () => setMode('express');
$('modeAdvanced').onclick = () => setMode('advanced');
$('tab3d').onclick = () => setTab('3d');
$('tab2d').onclick = () => setTab('2d');
$('btnVariation').onclick = variation; $('btnVariation2').onclick = variation;
$('btnNew').onclick = () => {
  const ex = project.export;
  project = newProject('alpes'); project.layers = []; project.preset = null; project.name = 'Sans titre'; project.export = ex;
  selId = null; if (mode !== 'advanced') setMode('advanced');
  renderAll(); changed(true); updateEmpty();
  toast('Nouveau projet vide. Ctrl+Z pour revenir au précédent.');
};
$('btnOpen').onclick = () => $('fileProj').click();
$('fileProj').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) openProject(f); };
$('btnSave').onclick = saveProject;
$('btnUndo').onclick = undo; $('btnRedo').onclick = redo;
$('btnAdd').onclick = () => {
  const v = $('addSel').value, has = project.layers.some(l => l.enabled);
  if (v === 'image') { $('fileImg').click(); return; }
  const [kind, type] = v.split(':');
  let ly;
  if (kind === 'erosion' || kind === 'sculpt') {
    if (!has) toast('Cette couche agit sur les couches placées dessous : ajoutez d\'abord un générateur ou une image.');
    ly = kind === 'erosion' ? makeLayer('erosion', 'erosion', { op: type, seed: rndSeed() }) : makeLayer('sculpt', 'sculpt');
    project.layers.push(ly); selId = ly.id; refresh();
    if (kind === 'sculpt') toast('Couche de sculpture prête : peignez directement sur la vue 3D ou 2D.');
    return;
  }
  if (kind === 'gen') ly = makeLayer('gen', type, { seed: rndSeed() }, { blend: has ? 'add' : 'normal', intensity: has ? 0.5 : 1 });
  else {
    if (!has) toast('Un filtre agit sur les couches placées dessous : ajoutez d\'abord un générateur ou une image.');
    ly = makeLayer('filter', 'filtre', { op: type }, { name: E.FILTER[0].options.find(o => o[0] === type)[1] });
  }
  project.layers.push(ly); selId = ly.id; refresh();
};
$('btnClear').onclick = () => {
  if (!project.layers.length) return;
  const b = $('btnClear');
  if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Confirmer'; setTimeout(() => { delete b.dataset.armed; b.textContent = 'Vider la pile'; }, 3000); return; }
  delete b.dataset.armed; b.textContent = 'Vider la pile';
  project.layers = []; project.preset = null; selId = null; refresh(); toast('Pile vidée. Ctrl+Z pour annuler.');
};
$('fileImg').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) addImageFile(f); };

const stage = $('stage');
stage.addEventListener('dragover', e => { if (e.dataTransfer && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); $('dropHint').hidden = false; } });
stage.addEventListener('dragleave', e => { if (!stage.contains(e.relatedTarget)) $('dropHint').hidden = true; });
stage.addEventListener('drop', e => { e.preventDefault(); $('dropHint').hidden = true; const f = e.dataTransfer.files[0]; if (f) addImageFile(f); });
new ResizeObserver(() => draw2D()).observe(stage);

$('vscale').oninput = e => { view.vscale = +e.target.value; if (current) { if (view.tab === '3d') update3D(current); else if (view.color === 'shade') update2D(current); } };
$('lightAz').oninput = e => { view.az = +e.target.value; setLight(); if (current && view.tab === '2d' && view.color === 'shade') update2D(current); };
$('wire').onchange = e => { view.wire = e.target.checked; if (V3.ok) V3.mat.wireframe = view.wire; };
$('grid').onchange = e => { view.grid = e.target.checked; draw2D(); };
$('solo').onchange = e => { view.solo = e.target.checked; requestRender(); };
$('colorMode').onchange = e => { view.color = e.target.value; draw(); };
$('previewRes').onchange = e => { view.res = +e.target.value; requestRender(); };

document.querySelectorAll('input[name=fmt]').forEach(r => r.onchange = () => { project.export.format = r.value; project.export.profile = 'custom'; commitHistory(); renderExport(); });
$('profileSel').onchange = e => {
  const p = PROFILES[e.target.value]; project.export.profile = e.target.value;
  if (p) { project.export.format = p.format; project.export.res = p.res; }
  commitHistory(); renderExport(); requestRender();
};
$('resSel').onchange = e => { project.export.res = e.target.value; project.export.profile = 'custom'; commitHistory(); renderExport(); requestRender(); };
['expW', 'expH'].forEach(id => $(id).onchange = () => {
  project.export.w = Math.max(16, Math.min(8192, parseInt($('expW').value, 10) || 16));
  project.export.h = Math.max(16, Math.min(8192, parseInt($('expH').value, 10) || 16));
  commitHistory(); renderExport(); requestRender();
});
$('btnExport').onclick = doExport;
$('btnPack').onclick = doExportPack;
$('btnGoExport').onclick = () => {
  const sec = $('exportSec');
  sec.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  sec.style.transition = 'background .6s'; sec.style.background = 'var(--accent-soft)';
  setTimeout(() => { sec.style.background = ''; }, 900);
  $('btnExport').focus({ preventScroll: true });
};
Object.keys(E.MAPS).forEach(k => { const o = el('option'); o.value = k; o.textContent = E.MAPS[k].name; $('mapSel').appendChild(o); });
$('mapSel').onchange = e => { view.map = e.target.value; renderMaps(); requestDerive(); };
$('expSeamless').onchange = e => { project.global.seamless = e.target.checked; renderGlobal(); syncSeamless(true); changed(true); };
$('tile').onchange = e => { view.tile = e.target.checked; v2.zoom = 1; v2.px = v2.py = 0; draw2D(); };
const cmp = $('btnCompare');
cmp.addEventListener('pointerdown', e => { e.preventDefault(); compareStart(); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(t => cmp.addEventListener(t, compareEnd));
cmp.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); compareStart(); } });
cmp.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') compareEnd(); });
$('btnUpSave').onclick = saveAsPreset;
$('upName').addEventListener('keydown', e => { if (e.key === 'Enter') saveAsPreset(); });
$('btnUpImport').onclick = () => $('filePreset').click();
$('btnUpExportAll').onclick = exportAllPresets;
$('filePreset').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) importPreset(f); };

document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if ((tag === 'input' && e.target.type !== 'range' && e.target.type !== 'checkbox') || tag === 'textarea') return;
  if ((e.key === '[' || e.key === ']') && sculptActive() && tag !== 'input' && tag !== 'select') { const bt = brushTarget(); bt.b.r = Math.min(0.3, Math.max(0.005, bt.b.r * (e.key === ']' ? 1.15 : 1 / 1.15))); bt.save(); renderProps(); draw2D(); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && mode === 'advanced' && selId && tag !== 'input' && tag !== 'select') { e.preventDefault(); deleteLayer(selId); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
});

window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
const setLib = open => { $('libToggle').setAttribute('aria-expanded', String(open)); $('libBody').hidden = !open; store.set('libOpen', open ? '1' : '0'); };
$('libToggle').onclick = () => setLib($('libBody').hidden);
setLib(store.get('libOpen') !== '0');
$('langFr').onclick = () => setLang('fr');
$('langEn').onclick = () => setLang('en');
// ---------- À propos, retours bêta ----------
const APP_VERSION = '1.0 bêta';
const CONTACT_URL = 'https://florindolab.com/contact/';
const LICENCE_URL = 'https://florindolab.com/licence/';
$('appVersion').textContent = APP_VERSION;
$('lnkContact').href = CONTACT_URL; $('lnkLicence').href = LICENCE_URL;
function diagnostics() {
  let gpu = 'inconnu', webgl = 'non';
  try {
    const gl = (V3.ok && V3.r.getContext()) || document.createElement('canvas').getContext('webgl');
    if (gl) { webgl = 'oui'; const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }
  } catch (e) {}
  const d = exportDims();
  return ['Relief Generator ' + APP_VERSION,
    'Navigateur : ' + navigator.userAgent,
    'Langue : ' + lang + ' (' + (navigator.language || '?') + ')',
    'Écran : ' + screen.width + '×' + screen.height + ' @' + (window.devicePixelRatio || 1) + 'x',
    'WebGL : ' + webgl + ' · GPU : ' + gpu,
    'Calcul en arrière-plan : ' + (Runner.threaded ? 'oui' : 'non') + ' · Cœurs : ' + (navigator.hardwareConcurrency || '?'),
    'Mode : ' + mode + ' · Vue : ' + view.tab + ' · Aperçu : ' + view.res,
    'Couches : ' + project.layers.map(l => l.kind + (l.type && l.kind === 'gen' ? ':' + l.type : '')).join(', '),
    'Export : ' + d.w + '×' + d.h + ' ' + project.export.format + (project.global.seamless ? ' seamless' : '')].join('\n');
}
$('btnAbout').onclick = () => { $('diagText').hidden = true; $('aboutDlg').showModal(); };
$('aboutClose').onclick = () => $('aboutDlg').close();
$('aboutDlg').addEventListener('click', e => { if (e.target === $('aboutDlg')) $('aboutDlg').close(); });
$('btnCopyDiag').onclick = () => {
  const txt = diagnostics(), pre = $('diagText');
  pre.textContent = txt; pre.hidden = false;
  const done = () => toast('Informations copiées. Collez-les dans votre message.');
  try { navigator.clipboard.writeText(txt).then(done, () => toast('Copie automatique impossible : sélectionnez le texte affiché.')); }
  catch (e) { toast('Copie automatique impossible : sélectionnez le texte affiché.'); }
};
// ---------- Démarrage ----------
// Ajoute deux résolutions de terrain usuelles au sélecteur
[['4033', '4033 × 4033 (Unreal)'], ['4097', '4097 × 4097 (Unity)']].forEach(([v, t]) => { const o = el('option'); o.value = v; o.textContent = t; $('resSel').insertBefore(o, $('resSel').querySelector('option[value=custom]')); });
buildPresetGrid();
renderUserPresets();
selId = project.layers[project.layers.length - 1].id;
resetHistory();
renderAll();
setMode(mode);
setTab(view.tab);
setLang(lang);
requestRender();
})();
