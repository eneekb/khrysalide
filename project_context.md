# PROJECT_CONTEXT - Khrysalide

## 🎯 Vue d'ensemble du projet

**Nom de l'application** : Khrysalide (jeu de mots avec Kcal)

**Version actuelle** : 1.4.1

**Logo** : K stylisé avec formes organiques (vert menthe et pêche) - fichier logo.png

**Objectif** : Application web de suivi calorique et de rééquilibrage alimentaire pour usage personnel.

**Stack technique** :
- Frontend : HTML/CSS/JavaScript pur (hébergé sur GitHub Pages)
- Backend : Google Sheets (base de données)
- Authentification : OAuth 2.0 Google avec Google Identity Services
- Hébergement : GitHub Pages (gratuit)
- API : Google Sheets API v4

## 📌 Informations techniques critiques

### Identifiants Google Cloud

**Client ID OAuth** :
```
448205179983-4dsjnf2st3n87rpuemvdgl5ufledov42.apps.googleusercontent.com
```

**API Key** :
```
AIzaSyAOjvMmmLPoFtWhyWuxDh2Ca3QzO_y_MAo
```

**Spreadsheet ID** :
```
1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY
```

### URLs du projet

- **Application en production** : https://eneekb.github.io/khrysalide/
- **Repository GitHub** : https://github.com/eneekb/khrysalide
- **Google Sheets** : https://docs.google.com/spreadsheets/d/1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY/
- **Google Cloud Console** : https://console.cloud.google.com/ (Projet : "Khrysalide")

### Configuration Google Cloud

1. **Projet Google Cloud** : "Khrysalide"
2. **APIs activées** : 
   - Google Sheets API
   - Google Identity Services
3. **OAuth 2.0** :
   - Type : Web application
   - Nom : "Khrysalide"
   - Origines JavaScript autorisées :
     - `https://eneekb.github.io`
     - `http://localhost:8080`
4. **Écran de consentement OAuth** :
   - Type : External
   - Utilisateur test : Email de eneekb (ajouté)
5. **Clé API** :
   - Nom : "Khrysalide API Key"
   - Restrictions :
     - Sites web autorisés : `https://eneekb.github.io/*` et `http://localhost:8080/*`
     - API restreinte : Google Sheets API uniquement

## 📊 Structure du Google Sheets

### Feuille 1 : "ingredients et preparations de base"
- **Colonnes principales** :
  - A: `Catégorie` : pour les filtres
  - B: `Référence` : identifiant unique (ex: 0001, 0002)
  - C: `Intitulé` : nom affiché
  - D: `Précisions` : détails supplémentaires
  - E: `Fournisseur` : source d'achat
  - F: `Conditionnement` : format de vente
  - G: `Unité` : unité de mesure (g, kg, L, etc.)
  - H: `Poids (g)/Unité` : conversion en grammes
  - I: `Prix` : prix d'achat
  - J: `Kcal/100g` : valeur calorique principale
  - K: `Prix/Unité` : prix calculé par unité
  - L: `Kcal/Unité` : calories calculées par unité
  - M: `Prix/Kcal` : ratio prix/calories

### Feuille 2 : "recettes"
- Structure horizontale avec jusqu'à 15 ingrédients
- **Colonnes de base** :
  - A: `Numéro` : référence unique (R001, R002, etc.)
  - B: `Intitulé` : nom de la recette
  - C: `Portion` : nombre de portions
  - D: `Instructions` : étapes de préparation
  - E: `Poids` : poids total calculé
  - F: `Kcal total` : calories totales calculées
  - G: `Prix total` : prix total calculé
- **Pour chaque ingrédient** (colonnes H et suivantes, par groupes de 6) :
  - Référence (lien vers ingrédient)
  - Nom
  - Quantité
  - Unité
  - Kcal (calculé)
  - Prix (calculé)

### Feuille 3 : "Journal"
- A: `Date` : **Format DD/MM/YYYY** (ex: 25/07/2025)
- B: `Repas` : petit-déjeuner, déjeuner, dîner, collation
- C: `Type` : recette ou ingrédient
- D: `Référence` : ref de la recette ou ingrédient
- E: `Quantité` : nombre ou poids
- F: `Kcal` : calories calculées

### Feuille 4 : "Profil"
- A: `Utilisateur` : email Google
- B: `Objectif_kcal_jour` : objectif calorique (défaut: 2000)
- C: `Date_debut` : date de début du suivi
- D: `Poids_initial` : optionnel
- E: `Poids_objectif` : optionnel

### Feuille 5 : "menus déroulants"
- A: `Catégorie` : liste des catégories d'aliments
- B: `Fournisseur` : liste des fournisseurs
- C: `Unité` : liste des unités de mesure
- D: `Kcal` : plages de calories pour filtres (ex: "< 100 kcal", "100-300 kcal")
- E: `Prix` : plages de prix pour filtres (ex: "< 5€", "5-10€")
- **Important** : L'ordre dans le sheet est conservé (pas de tri alphabétique)

## 🏗️ Architecture et structure des fichiers

```
khrysalide/
├── index.html          # Point d'entrée, conteneur SPA
├── styles.css          # Styles globaux et composants UI
├── logo.png           # Logo de l'application
├── PROJECT_CONTEXT.md  # Documentation technique (ce fichier)
├── js/
│   ├── app.js         # Coordinateur principal (v1.4.1)
│   ├── router.js      # Gestion de la navigation SPA
│   ├── auth.js        # Authentification Google OAuth
│   └── sheets-api.js  # Interface avec Google Sheets
├── pages/
│   ├── dashboard.js   # Page d'accueil avec vraies données
│   ├── login.js       # Page de connexion Google
│   ├── aliments.js    # Liste et gestion des ingrédients
│   ├── recettes.js    # Consultation et gestion des recettes
│   ├── journal.js     # Enregistrement des repas (à faire)
│   ├── stats.js       # Statistiques et graphiques (à faire)
│   ├── courses.js     # Liste de courses (à faire)
│   └── profil.js      # Paramètres utilisateur (à faire)
└── components/        # Dossier prévu pour composants réutilisables
```

### Règles de versioning
- **TOUJOURS** incrémenter la version à chaque modification
- Format : MAJEUR.MINEUR.PATCH (ex: 1.0.1)
  - PATCH (+0.0.1) : corrections, petits ajustements
  - MINEUR (+0.1.0) : nouvelles fonctionnalités
  - MAJEUR (+1.0.0) : changements majeurs
- Mettre à jour dans : 
  - index.html (div.version)
  - app.js (APP_CONFIG.version)
  - Tous les fichiers modifiés (commentaire d'en-tête)
  - PROJECT_CONTEXT.md (version actuelle + historique)

## 📋 Interfaces des modules

### 🔧 app.js
```javascript
// Coordinateur principal de l'application
window.app = {
  config: {name, version, api: {...}},     // Configuration globale
  state: {user, isAuthenticated, ...},     // État partagé
  modules: {auth, router, sheets, ...},    // Références aux modules
  
  init()                                   // Initialise l'application
  showToast(message, type)                 // Affiche une notification
  log(...args)                             // Log en mode debug
}
```

### 🚦 router.js
```javascript
// Gestion de la navigation et des pages
window.Router = class {
  constructor(app)                         // Prend l'app en paramètre
  currentPageInstance                      // Instance de la page actuelle
  init()                                   // Initialise le routeur
  registerPage(name, config)               // Enregistre une page
  navigateTo(page)                         // Navigation programmatique
  onPageChange(callback)                   // Écoute les changements
}
```

### 🔐 auth.js
```javascript
// Gestion de l'authentification Google OAuth 2.0
window.Auth = {
  async init(apiConfig)                    // Initialise Google Identity Services
  async signIn()                           // Lance le processus de connexion
  async signOut()                          // Déconnexion
  isAuthenticated()                        // Retourne true/false
  getAccessToken()                         // Retourne le token actuel
  getCurrentUser()                         // Retourne {email, name, picture}
  onAuthChange(callback)                   // Écoute les changements d'auth
  attemptSilentSignIn()                    // Reconnexion silencieuse
  scheduleTokenRefresh()                   // Rafraîchit le token automatiquement
}
```

### 📊 sheets-api.js
```javascript
// Interface avec Google Sheets API
window.SheetsAPI = {
  spreadsheetId: '1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY',
  
  // Méthodes génériques
  async init()                             // Initialise l'API
  async readRange(sheet, range)            // Lit une plage
  async writeRange(sheet, range, values)   // Écrit dans une plage
  async appendRows(sheet, values)          // Ajoute des lignes
  
  // Conversion de dates
  frenchToISODate(date)                    // "25/07/2025" → "2025-07-25"
  isoToFrenchDate(date)                    // "2025-07-25" → "25/07/2025"
  
  // Méthodes spécifiques - Ingrédients
  async readIngredients()                  // Retourne [{categorie, reference, intitule, kcal100g, ...}]
  async addIngredient(ingredient)          // Ajoute un ingrédient
  async updateIngredient(rowId, ingredient) // Met à jour un ingrédient
  async searchIngredients(query)           // Recherche par nom
  async getNextReference()                 // Génère la prochaine référence (0001, 0002...)
  
  // Méthodes spécifiques - Recettes
  async readRecipes()                      // Retourne [{numero, intitule, portion, kcalTotal, ingredients: [...]}]
  async addRecipe(recette)                 // Ajoute une recette avec calculs auto
  async updateRecipe(rowId, recette)       // Met à jour une recette
  async getNextRecipeNumber()              // Génère le prochain numéro (R001, R002...)
  
  // Méthodes spécifiques - Journal
  async readJournal(startDate, endDate)    // Retourne les entrées du journal
  async addJournalEntry(entry)             // {date, repas, type, reference, quantite, kcal}
  async deleteJournalEntry(rowId)          // Supprime une entrée
  async getDayTotals(date)                 // Calcule les totaux du jour
  
  // Méthodes spécifiques - Profil
  async readProfile()                      // Retourne {objectifKcal, dateDebut, ...}
  async updateProfile(profile)             // Met à jour le profil utilisateur
  
  // Méthodes spécifiques - Menus déroulants
  async readMenuOptions()                  // Retourne {categories, fournisseurs, unites, kcalRanges, prixRanges}
  
  // Utilitaires
  async batchRead(requests)                // Lecture par batch pour optimiser
}
```

### 📄 Structure d'une page
```javascript
// pages/[nom].js
class [Nom]Page {
  constructor(app) {
    this.app = app    // Référence à l'app principale
    this.data = {}    // Données de la page
  }

  async init() {
    // Chargement des données
    await this.loadData()
  }

  render() {
    // Retourne le HTML de la page
    return `<div class="page">...</div>`
  }

  attachEvents() {
    // Attache les événements après le rendu (optionnel)
  }
  
  // Méthodes spécifiques à la page
}

// Export global
window.[Nom]Page = [Nom]Page
```

## 🎨 Conventions CSS et UI

### Variables CSS (styles.css)
```css
:root {
  /* Couleurs */
  --color-mint: #52D1B3;
  --color-coral: #FF8B94;
  --color-peach: #FFD3B6;
  --color-bg: #FAFAFA;
  --color-text: #6B7280;
  
  /* Espacements */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Arrondis */
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-full: 9999px;
  
  /* Ombres */
  --shadow-sm: 0 2px 8px rgba(82, 209, 179, 0.1);
  --shadow-md: 0 4px 16px rgba(82, 209, 179, 0.15);
  --shadow-lg: 0 8px 32px rgba(82, 209, 179, 0.2);
}
```

### Classes CSS principales
```css
/* Boutons */
.btn                    // Bouton de base
.btn-primary            // Bouton principal (corail)
.btn-secondary          // Bouton secondaire (vert menthe)
.btn-outline            // Bouton avec bordure
.btn-small              // Petit bouton
.btn-icon               // Bouton icône rond

/* Cards */
.card                   // Carte de base
.card-mint              // Carte vert menthe
.card-coral             // Carte corail
.card-header            // En-tête de carte
.card-content           // Contenu de carte
.card-footer            // Pied de carte

/* Inputs */
.input                  // Champ de saisie
.input-group            // Groupe input + label
.search-input           // Input avec icône recherche

/* Navigation */
.bottom-nav             // Navigation bottom
.nav-link               // Lien de navigation
.nav-link.active        // Lien actif

/* Utilitaires */
.text-mint              // Texte vert menthe
.text-coral             // Texte corail
.text-small             // Petit texte
.text-center            // Texte centré
.mb-md                  // Marge bottom moyenne
.mt-lg                  // Marge top large
.flex                   // Display flex
.hidden                 // Caché
```

## 🚀 État d'avancement

### ✅ Complété
- Structure du projet définie
- Configuration Google Cloud
- Authentification OAuth testée
- Structure Google Sheets créée
- index.html avec splash screen (7 secondes, 40 phrases)
- styles.css avec tous les composants UI
- app.js (coordinateur principal)
- router.js (navigation SPA avec currentPageInstance)
- auth.js (authentification Google OAuth 2.0)
- sheets-api.js (API Google Sheets complète avec toutes les méthodes CRUD)
- pages/dashboard.js (page d'accueil avec vraies données)
- pages/login.js (page de connexion)
- pages/aliments.js (CRUD complet, filtres, recherche, modal)
- pages/recettes.js (CRUD complet, filtres kcal/prix, recherche)

### 🚧 En cours
- [ ] pages/journal.js (enregistrement des repas)

### 📋 À faire
- [ ] Page Journal (ajout de repas, sélection aliment/recette)
- [ ] Page Statistiques (graphiques et tendances)
- [ ] Page Courses (liste générée depuis recettes)
- [ ] Page Profil (paramètres et objectifs)
- [ ] Mode offline avec synchronisation
- [ ] PWA (Progressive Web App)
- [ ] Export des données
- [ ] Notifications de rappel

## 💡 Décisions techniques importantes

### Architecture
- **SPA pure** : Pas de framework, vanilla JS uniquement
- **Modules globaux** : window.app, window.Auth, window.SheetsAPI
- **Routeur maison** : Gestion des pages avec hash (#)
- **Styles inline** : Dans chaque module JS pour l'isolation

### Authentification
- **Google Identity Services** : Nouvelle méthode recommandée par Google
- **Session 1h** : Token en mémoire, session info en sessionStorage
- **Pas de localStorage** : Pour la sécurité
- **Reconnexion silencieuse** : Si session valide

### Gestion des dates
- **Format français dans Sheets** : DD/MM/YYYY
- **Format ISO dans l'app** : YYYY-MM-DD
- **Conversion automatique** : Dans sheets-api.js

### Génération automatique
- **Références aliments** : Format 0001, 0002, etc.
- **Numéros recettes** : Format R001, R002, etc.
- **Gérés par l'API** : getNextReference(), getNextRecipeNumber()

### UI/UX
- **Mobile-first** : Optimisé pour smartphone
- **Couleurs principales** :
  - Corail (#FF8B94) : Actions principales
  - Vert menthe (#52D1B3) : Actions secondaires
  - Pêche (#FFD3B6) : Accents doux
- **Marges réduites** : Pour minimiser le scroll
- **Messages encourageants** : Ton positif et motivant
- **Filtres** : Conservent l'ordre du Google Sheets (pas de tri)

## 📝 Notes de développement

### Points d'attention
1. **Formats de date** : Toujours vérifier FR ↔ ISO
2. **Limites API** : 300 requêtes/min, 60 écritures/min
3. **Cache** : Prévoir système de cache pour les ingrédients
4. **Erreurs** : Toujours avoir un fallback (mode démo)
5. **Ordre des menus** : Les filtres gardent l'ordre du sheet

### Conventions
- **Commit messages** : "vX.X.X: type: description"
- **Branches** : Travailler directement sur main
- **Tests** : Via le bouton "Tester l'API" sur le dashboard
- **Debug** : Console logs avec emojis pour clarté

### Astuces GitHub Pages
- Délai de propagation : 5-20 minutes parfois
- Vider le cache navigateur si problème
- Vérifier Actions pour le statut du déploiement

## 🔧 Commandes utiles

```bash
# Serveur local pour dev
python -m http.server 8080

# Deploy sur GitHub Pages (avec incrémentation de version)
# 1. Vérifier la checklist de versioning
# 2. Puis :
git add .
git commit -m "v1.4.1: description des changements"
git push origin main
```

### Exemples de messages de commit
- `v1.0.1: refactor: séparation app.js, router.js et dashboard.js`
- `v1.0.2: fix: correction navigation mobile`
- `v1.1.0: feat: ajout authentification Google`
- `v2.0.0: breaking: refonte complète de l'interface`

### Checklist de versioning (à chaque modification)
- [ ] Déterminer le type de changement (patch/minor/major)
- [ ] Incrémenter la version en conséquence
- [ ] Mettre à jour index.html
- [ ] Mettre à jour app.js
- [ ] Ajouter version dans les fichiers modifiés
- [ ] Mettre à jour PROJECT_CONTEXT (version + historique)
- [ ] Commit avec message : "vX.X.X: description"

## 📚 Ressources

- **Documentation Google Sheets API** : https://developers.google.com/sheets/api
- **Google Identity Services** : https://developers.google.com/identity
- **GitHub Pages** : https://pages.github.com/
- **Support Anthropic** : https://support.anthropic.com

## 📞 Contact et support

- **GitHub username** : eneekb
- **Développement assisté par** : Claude (Anthropic)

---
*Dernière mise à jour : 25/07/2025 - v1.4.1*

## 📋 Historique des versions

_Note : Système de versioning ajouté à partir de v1.0.1_

### v1.4.1 (25/07/2025)
- Fix: Modal recettes ne s'ouvre plus automatiquement
- Feat: Filtres par calories et prix pour les recettes
- Feat: Lecture des colonnes D et E dans menus déroulants
- Fix: Les menus conservent l'ordre du sheet (pas de tri alphabétique)
- UI: Harmonisation avec le style de la page aliments
- UI: Affichage du prix dans la liste des recettes

### v1.4.0 (25/07/2025)
- Feat: Page Recettes complète avec visualisation détaillée
- Feat: Affichage des calories par portion et prix
- Feat: Recherche dans les recettes et leurs ingrédients
- Feat: Modal de création/édition de recettes fonctionnel
- Feat: Méthodes API complètes (updateIngredient, addRecipe, updateRecipe)
- Feat: Génération automatique des numéros de recette
- Fix: Modification des aliments maintenant fonctionnelle
- UI: Design cohérent avec cartes et informations nutritionnelles

### v1.3.6 (25/07/2025)
- Fix: Menus déroulants utilisant les données du sheet
- Fix: Boutons fonctionnels dans les modals
- UI: Titre adaptatif selon le mode (détails/modifier/nouveau)

### v1.3.5 (25/07/2025)
- Feat: Menu déroulant pour le champ Unité (colonne C)
- Fix: Activation des boutons dans les popups
- Refactor: Gestion propre des événements

### v1.3.4 (25/07/2025)
- UI: Bouton Ajouter stylé en corail
- Feat: Menus déroulants depuis feuille "menus déroulants"
- Feat: Nouveaux champs Précisions, Unité, Poids/Unité
- Feat: Logique intelligente pour unité "g"

### v1.3.3 (25/07/2025)
- Feat: Génération automatique des références (format 0001)
- Feat: Menu déroulant pour les fournisseurs
- Feat: Double filtrage (catégorie + fournisseur)
- UI: Unité clarifiée "Kcal/100g"

### v1.3.2 (25/07/2025)
- Fix: Correction des bugs de filtrage et recherche dans la page aliments
- UI: Refonte complète de la page aliments avec cartes simplifiées
- Feat: Ajout d'un modal pour visualiser/éditer les détails d'un aliment
- Feat: Bouton d'ajout d'aliment avec formulaire dans modal
- UI: Remplacement des filtres boutons par un menu déroulant
- Fix: Ajout de currentPageInstance dans router.js pour les interactions modal

### v1.3.1 (25/07/2025)
- Refactor: Ajout de toutes les références de pages futures dans index.html
- Chore: Organisation des scripts par catégories (modules, pages, app)

### v1.3.0 (25/07/2025)
- Feat: Page Aliments complète avec recherche et filtres
- Feat: Affichage des ingrédients par catégorie
- Feat: Recherche en temps réel sur nom/catégorie/référence
- UI: Design cohérent avec cartes arrondies et animations fluides

### v1.2.1 (24/07/2025)
- Fix: Support du format de date français DD/MM/YYYY
- Fix: Conversion automatique entre formats français et ISO
- Feat: Test API amélioré avec affichage des totaux

### v1.2.0 (24/07/2025)
- Feat: API Google Sheets complète (sheets-api.js)
- Feat: Lecture/écriture dans toutes les feuilles
- Feat: Dashboard avec vraies données depuis Sheets
- Feat: Calcul automatique des totaux et moyennes
- Feat: Recherche d'ingrédients et gestion du profil

### v1.1.3 (24/07/2025)
- Feat: Session persistante pendant 1 heure
- Feat: Reconnexion silencieuse automatique
- Feat: Rafraîchissement automatique du token avant expiration
- Fix: Meilleure gestion des erreurs de reconnexion

### v1.1.2 (24/07/2025)
- UI: Réorganisation page login - infos sécurité en bas
- UI: Bouton Google centré et plus de padding
- UI: Meilleure hiérarchie visuelle de la page login

### v1.1.1 (24/07/2025)
- UI: Boutons principaux en corail (cohérence visuelle)
- UI: Réduction des marges (cards et pages) pour moins de scroll
- UI: Slogan de login plus petit (tient sur une ligne)
- UI: Inversion primary/secondary buttons colors

### v1.1.0 (24/07/2025)
- Feat: Authentification Google OAuth 2.0 complète
- Feat: Page de connexion avec design moderne
- Feat: Gestion des sessions et redirections
- Update: Mode démo uniquement si Auth non disponible

### v1.0.3 (24/07/2025)
- Fix: Conflit entre les deux logiques de splash screen
- L'écran de démarrage est maintenant géré uniquement par index.html

### v1.0.2 (24/07/2025)
- Fix: Suppression de l'export ES6 dans app.js
- Fix: Ajout de la meta tag mobile-web-app-capable
- Fix: Correction de l'erreur de syntaxe bloquant l'app

### v1.0.1 (24/07/2025)
- Refactorisation : séparation app.js, router.js et dashboard.js
- Ajout du système de versioning automatique
- Mise à jour PROJECT_CONTEXT avec règles de versioning

### v1.0.0 (24/07/2025)
- Version initiale
- Écran de démarrage avec animations
- Structure de base
### v1.0.0 (24/07/2025)
- Version initiale
- Écran de démarrage avec animations
- Structure de base
