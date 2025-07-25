# PROJECT_CONTEXT - Khrysalide

## 🎯 Version actuelle : 1.1.1

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

### 📝 Checklist de versioning (à chaque modification)
- [ ] Déterminer le type de changement (patch/minor/major)
- [ ] Incrémenter la version en conséquence
- [ ] Mettre à jour index.html
- [ ] Mettre à jour app.js
- [ ] Ajouter version dans les fichiers modifiés
- [ ] Mettre à jour PROJECT_CONTEXT (version + historique)
- [ ] Commit avec message : "v1.0.X: description"

## 🏗️ Architecture globale

### Structure des fichiers
```
khrysalide/
├── index.html          # Point d'entrée, conteneur SPA
├── styles.css          # Styles globaux et variables CSS
├── manifest.json       # PWA manifest
├── js/
│   ├── app.js         # Initialisation, coordination des modules
│   ├── router.js      # Gestion de la navigation SPA
│   ├── auth.js        # Authentification OAuth Google
│   ├── sheets-api.js  # Interface avec Google Sheets API
│   ├── storage.js     # Cache local et gestion offline
│   └── utils.js       # Fonctions utilitaires communes
├── pages/
│   ├── dashboard.js   # Page d'accueil / tableau de bord
│   ├── login.js       # Page de connexion
│   ├── journal.js     # Gestion du journal alimentaire
│   ├── aliments.js    # Liste et gestion des ingrédients
│   ├── recettes.js    # Consultation des recettes
│   ├── stats.js       # Statistiques et graphiques
│   ├── courses.js     # Liste de courses
│   └── profil.js      # Paramètres utilisateur
└── components/
    ├── navigation.js  # Bottom navigation bar
    ├── food-item.js   # Composant aliment réutilisable
    └── meal-card.js   # Carte de repas
```

## 📋 Interfaces des modules

### 🔐 auth.js
```javascript
// Gestion de l'authentification Google OAuth 2.0
export async function initAuth()                    // Initialise Google Identity Services
export async function signIn()                      // Lance le processus de connexion
export async function signOut()                     // Déconnexion
export function isAuthenticated()                   // Retourne true/false
export function getAccessToken()                    // Retourne le token actuel
export function getCurrentUser()                    // Retourne {email, name, picture}
export function onAuthChange(callback)              // Écoute les changements d'auth
```

### 📊 sheets-api.js
```javascript
// Interface avec Google Sheets API
const SPREADSHEET_ID = '1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY'

// Lecture
export async function readIngredients()             // Retourne [{categorie, reference, intitule, kcal100g, ...}]
export async function readRecipes()                 // Retourne [{numero, intitule, portion, kcalTotal, ingredients: [...]}]
export async function readJournal(startDate, endDate) // Retourne les entrées du journal
export async function readProfile()                 // Retourne {objectifKcal, dateDebut, ...}

// Écriture
export async function addIngredient(ingredient)     // Ajoute un ingrédient
export async function addJournalEntry(entry)       // {date, repas, type, reference, quantite, kcal}
export async function updateProfile(profile)        // Met à jour le profil utilisateur
export async function deleteJournalEntry(row)      // Supprime une entrée du journal

// Utilitaires
export async function batchUpdate(updates)         // Écriture par batch pour optimiser
```

### 💾 storage.js
```javascript
// Gestion du cache local et mode offline
export function getCachedIngredients()              // Retourne les ingrédients en cache
export function setCachedIngredients(data)          // Met en cache les ingrédients
export function getCachedRecipes()                  
export function setCachedRecipes(data)              
export function getOfflineQueue()                   // Retourne les modifications en attente
export function addToOfflineQueue(action)           // Ajoute une action à synchroniser
export function clearOfflineQueue()                 // Vide la queue après sync
export function isOffline()                         // Détecte le mode offline
```

### 🔧 app.js
```javascript
// Coordinateur principal de l'application
const app = {
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
class Router {
  constructor(app)                         // Prend l'app en paramètre
  init()                                   // Initialise le routeur
  registerPage(name, config)               // Enregistre une page
  navigateTo(page)                         // Navigation programmatique
  onPageChange(callback)                   // Écoute les changements
}
```

### 🛠️ utils.js
```javascript
// Fonctions utilitaires
export function formatDate(date)                    // Format JJ/MM/AAAA
export function formatCalories(kcal)                // Arrondi et format
export function debounce(func, wait)                // Debounce pour recherche
export function groupBy(array, key)                 // Groupe un tableau par clé
export function sortByCategory(items)               // Tri par catégorie
export function calculateDailyTotal(entries)       // Calcul total journalier
export function generateId()                        // Génère un ID unique
```

## 🎨 Conventions de code

### Structure d'une page
```javascript
// pages/exemple.js
class ExemplePage {
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
    // Attache les événements après le rendu
  }
  
  // Méthodes spécifiques à la page
}

// Export global
window.ExemplePage = ExemplePage
```

### Structure d'un composant
```javascript
// components/exemple.js
export class ExempleComponent {
  constructor(data) {
    this.data = data
  }

  render() {
    return `<div class="component">...</div>`
  }

  update(newData) {
    this.data = newData
    // Re-render si nécessaire
  }
}
```

## 🎨 Conventions CSS

### Variables globales (styles.css)
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

### Classes utilitaires
```css
.page { } /* Container de page */
.card { } /* Carte flottante */
.btn { } /* Bouton de base */
.btn-primary { } /* Bouton principal */
.btn-secondary { } /* Bouton secondaire */
.input { } /* Champ de saisie */
.badge { } /* Badge (catégorie, etc.) */
```

## 📱 Patterns d'interaction

### Navigation
- Bottom navigation fixe avec 6 icônes
- Icône profil en haut à droite sur le dashboard
- Transitions douces entre pages (fade ou slide)
- Indicateur visuel de page active

### Feedback utilisateur
- Toast notifications pour actions (succès/erreur)
- Skeleton loaders pendant le chargement
- Pull-to-refresh sur listes
- Animations micro-interactions (bounce, scale)

### Gestion des erreurs
- Mode offline avec badge visuel
- Queue de synchronisation automatique
- Messages d'erreur encourageants
- Retry automatique avec backoff

## 📝 État d'avancement

### ✅ Complété
- Structure du projet définie
- Configuration Google Cloud
- Authentification OAuth testée
- Structure Google Sheets créée
- index.html avec splash screen
- styles.css avec tous les composants UI
- app.js (coordinateur principal)
- router.js (navigation SPA)
- auth.js (authentification Google OAuth 2.0)
- pages/dashboard.js (page d'accueil)
- pages/login.js (page de connexion)

### 🚧 En cours
- [ ] API Google Sheets (sheets-api.js)

### 📋 À faire
- [ ] Page Dashboard
- [ ] Page Journal
- [ ] Page Aliments
- [ ] Page Recettes
- [ ] Page Statistiques
- [ ] Page Courses
- [ ] Page Profil
- [ ] Mode offline
- [ ] PWA (installable)

## 🔧 Commandes utiles

```bash
# Serveur local pour dev
python -m http.server 8080

# Deploy sur GitHub Pages (avec incrémentation de version)
# 1. Vérifier la checklist de versioning
# 2. Puis :
git add .
git commit -m "v1.0.X: description des changements"
git push origin main
```

### Exemples de messages de commit
- `v1.0.1: refactor: séparation app.js, router.js et dashboard.js`
- `v1.0.2: fix: correction navigation mobile`
- `v1.1.0: feat: ajout authentification Google`
- `v2.0.0: breaking: refonte complète de l'interface`

## 📌 Notes importantes

1. **Mobile-first** : Toujours penser mobile en priorité
2. **Performance** : Limiter les appels API (cache agressif)
3. **UX** : Messages encourageants, animations douces
4. **Sécurité** : Token en mémoire uniquement, pas de localStorage
5. **Offline** : L'app doit rester utilisable sans connexion
6. **Versioning** : TOUJOURS incrémenter la version à chaque modification

---
*Dernière mise à jour : 24/07/2025 - v1.1.1*

## 📋 Historique des versions

_Note : Système de versioning ajouté à partir de v1.0.1_

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
