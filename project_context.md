# PROJECT_CONTEXT - Khrysalide

## 🏗️ Architecture globale

### Structure des fichiers
```
khrysalide/
├── index.html          # Point d'entrée, conteneur SPA
├── styles.css          # Styles globaux et variables CSS
├── manifest.json       # PWA manifest
├── js/
│   ├── app.js         # Initialisation, routeur principal
│   ├── auth.js        # Authentification OAuth Google
│   ├── sheets-api.js  # Interface avec Google Sheets API
│   ├── storage.js     # Cache local et gestion offline
│   └── utils.js       # Fonctions utilitaires communes
├── pages/
│   ├── dashboard.js   # Page d'accueil / tableau de bord
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

### 🚦 app.js (Router)
```javascript
// Routeur SPA et initialisation
export function init()                              // Initialise l'application
export function navigateTo(page)                    // Navigation vers une page
export function getCurrentPage()                    // Page actuelle
export function registerPage(name, component)       // Enregistre une page
export function showLoader()                        // Affiche le loader
export function hideLoader()                        // Cache le loader
export function showToast(message, type)            // Notification (success, error, info)
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
export default class ExemplePage {
  constructor() {
    this.data = null
    this.elements = {}
  }

  async init() {
    // Chargement des données
    await this.loadData()
    // Rendu initial
    this.render()
    // Event listeners
    this.attachEvents()
  }

  async loadData() {
    // Récupération depuis Sheets API
  }

  render() {
    // Génération du HTML
    return `<div class="page">...</div>`
  }

  attachEvents() {
    // Gestion des événements
  }

  destroy() {
    // Nettoyage si nécessaire
  }
}
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

### 🚧 En cours
- [ ] index.html et structure de base
- [ ] Système d'authentification
- [ ] Router SPA

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

# Deploy sur GitHub Pages
git add .
git commit -m "feat: description"
git push origin main
```

## 📌 Notes importantes

1. **Mobile-first** : Toujours penser mobile en priorité
2. **Performance** : Limiter les appels API (cache agressif)
3. **UX** : Messages encourageants, animations douces
4. **Sécurité** : Token en mémoire uniquement, pas de localStorage
5. **Offline** : L'app doit rester utilisable sans connexion

---
*Dernière mise à jour : 24/07/2025*
