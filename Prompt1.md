# 🔥 HACKATHON – FRONTEND SPECIFICATION

## IMPORTANT CONTEXT

Je suis en hackathon.  
Je suis responsable **uniquement du frontend**.  
Un coéquipier s’occupe entièrement du backend.

👉 Tu dois produire **tout le frontend nécessaire**.  
👉 Tu ne dois **en aucun cas modifier ou toucher au dossier `move/`**, car il est strictement réservé au backend.

---

# 🎯 PROJECT OVERVIEW

Nous développons une **NFT marketplace** avec :

- Un feed type Instagram/Twitter
- Abonnement payant type Patreon
- Pages profil
- Page détail d’annonce
- Système de favoris
- Publication d’annonces NFT
- Authentification wallet + OAuth

Le frontend doit être :

- Moderne  
- Responsive  
- Esthétique  
- Fluide  
- Clair visuellement  
- Proprement structuré  

---

# 🔐 AUTHENTICATION FLOW

## Landing Page (page d’arrivée sur le lien)

### ⚠️ Contraintes IMPORTANTES :

- Il ne doit y avoir **qu’un seul bouton visible**
- Tu ne dois PAS créer un nouveau bouton
- Tu dois uniquement **déplacer et modifier le bouton existant**
- Ce bouton doit être :
  - Très gros  
  - Centré parfaitement au milieu de la page  
  - Visuellement dominant  

### Texte du bouton :

**"Se connecter"**

### Lorsque l’on clique dessus :

Afficher plusieurs options de connexion :

1. Connexion wallet :
   - Slush  
   - Phantom  
   (comme possible dans le squelette existant)

2. Connexion OAuth :
   - Google  
   - Apple  
   - Facebook  

⚠️ Aucun autre bouton visible sur cette page.

---

# 🏠 HOMEPAGE (après connexion)

## Layout global

### En haut au centre :

- Une grande barre de recherche
- Permet de rechercher :
  - Par username  
  - Par adresse publique de wallet  

### En haut à droite :

- Icône profil  
- Cliquable  
- Amène vers son profil personnel  

### En haut à gauche :

- Icône pour poster  
- Doit être un **"+" en gras**  
- Inspiré du bouton Instagram  
- Même taille exacte que l’icône profil  

---

# 📰 FEED

Le feed doit :

- Être scrollable verticalement (type Instagram/Twitter)  
- Afficher uniquement les posts des utilisateurs suivis  
- Avoir **3 annonces par ligne**  
- Responsive mais conserver l’esthétique 3-colonnes sur desktop  

## Chaque post doit afficher :

1. Image du NFT  
2. Juste en dessous de l’image :
   - Prix en **gras**  
   - Relativement gros  
3. À droite du nom :
   - Prix du NFT  
4. À droite du prix :
   - Icône cœur  
   - Permet d’ajouter aux "favourites"  
5. En dessous :
   - Description du NFT  

Le design doit être compact mais clair.

---

# 📄 PAGE DÉTAIL D’UNE ANNONCE

Lorsque l’on clique sur un post :

## Structure :

### Centre :

- Image du NFT en grand  

### En haut à gauche :

- Avatar vendeur  
- À droite : username  
- Avatar + username cliquables  
- Redirigent vers profil vendeur  

### En bas de l’image :

De gauche à droite :

- Nom du NFT (gras)  
- Prix NFT (gras + plus gros que le nom)  
- Icône cœur (ajout aux favoris)  

---

# 👤 PAGE PROFIL UTILISATEUR

## Partie haute :

À gauche :

- Avatar relativement grand  

À droite :

- Bouton Follow  

Si déjà abonné :

- Bouton devient "Following"  

Plus à droite :

- Nombre d’annonces actuelles (Current listing)  
- Nombre d’abonnés  

En dessous :

- Description du vendeur  

---

## Partie basse :

On voit uniquement :

- Current listing  

Les sections :

- Former listing  
- Favourites  

Sont privées sur les profils des autres.

Les annonces sont affichées :

- Même layout que homepage (3 par ligne)

---

# 👤 PROFIL PERSONNEL

## Header :

- Username en gros  
- Adresse wallet plus petite en dessous  
- À droite du username : bouton "changer username"  

### Contraintes :

- Le username par défaut = adresse wallet  
- Le nouveau username ne doit PAS être déjà pris  
- Vérification côté frontend (et appel backend prévu)  

---

## Description :

- Description affichée  
- À droite : bouton "Edit description"  
- Permet modification inline  

---

## Sections du profil personnel :

Disposition horizontale :

- Gauche : "Favourites"  
- Centre : "Former listing"  
- Droite : "Current listing"  

Affichage type grille identique homepage.

---

# ➕ POSTER UNE ANNONCE

Lorsque l’on clique sur "+":

Page ou modal permettant :

1. Sélection d’un NFT depuis le wallet  
2. Champ pour entrer le prix  
3. Bouton "Post" centré en bas  

Interface claire, simple, rapide.

---

# 💰 SYSTÈME D’ABONNEMENT PAYANT

Inspiré directement de Patreon :

https://www.patreon.com

## Fonctionnement :

- Chaque utilisateur définit le prix d’abonnement sur son profil  
- Sur son profil, le bouton doit afficher :

```
Follow  
[prix abonnement]
```

Le prix doit être affiché sous le mot Follow.

⚠️ Le bouton ne doit pas devenir trop gros visuellement.  
Il doit rester esthétique et équilibré.

---

# 🎨 DESIGN REQUIREMENTS

- Style moderne  
- Inspiré Instagram / Twitter / Patreon  
- UI propre  
- Bonne hiérarchie visuelle  
- Boutons cohérents  
- Icônes harmonisées  
- Grille régulière  
- Espacement propre  
- Responsive  

---

# 🚫 CONTRAINTE CRITIQUE

Tu ne dois en aucun cas :

- Modifier  
- Supprimer  
- Altérer  
- Refactoriser  

Le dossier :

```
move/
```

Il est strictement réservé au backend.

---

# 🎯 OBJECTIF FINAL

Produire :

- Tous les composants frontend nécessaires  
- Routing complet  
- Architecture claire  
- Code propre  
- Prêt à connecter au backend  
- Logique UI complète  
- Gestion des états  
- Gestion des favoris  
- Gestion du follow  
- Vérification username unique  
- Structure claire et modulaire  

Sans jamais toucher au dossier `move/`.
