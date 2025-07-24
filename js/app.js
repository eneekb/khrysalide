/**
 * app.js - Point d'entrée et coordinateur principal de Khrysalide
 * Initialise et coordonne tous les modules
 * Version: 1.0.1
 */

// Configuration globale de l'application
const APP_CONFIG = {
  name: 'Khrysalide',
  version: '1.0.1',
  debug: true, // Mode debug pour le développement
  api: {
    spreadsheetId: '1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY',
    clientId: '448205179983-4dsjnf2st3n87rpuemvdgl5ufledov42.apps.googleusercontent.com',
    apiKey: 'AIzaSyAOjvMmmLPoFtWhyWuxDh2Ca3QzO_y_MAo'
  }
};

// État global partagé entre les modules
const APP_STATE = {
  user: null,
  isAuthenticated: false,
  currentPage: null,
  isLoading: false,
  isOffline: false
};

/**
 * Classe principale - Coordinateur de l'application
 */
class KhrysalideApp {
  constructor() {
    this.config = APP_CONFIG;
    this.state = APP_STATE;
    this.modules = {};
  }

  /**
   * Initialise l'application
   */
  async init() {
    try {
      this.log('🌱 Initialisation de Khrysalide v' + this.config.version);
      
      // Vérifie la connexion
      this.checkOnlineStatus();
      
      // Charge les modules essentiels
      await this.loadModules();
      
      // Initialise l'authentification
      await this.initAuth();
      
      // Initialise le routeur
      await this.initRouter();
      
      // Cache le splash screen
      this.hideSplashScreen();
      
      this.log('✅ Application prête');
      
    } catch (error) {
      console.error('❌ Erreur fatale:', error);
      this.showFatalError(error.message);
    }
  }

  /**
   * Charge les modules
   */
  async loadModules() {
    // Vérifie la présence des modules
    const requiredModules = ['Router', 'Auth'];
    const missingModules = requiredModules.filter(m => !window[m]);
    
    if (missingModules.length > 0) {
      this.log('⚠️ Modules manquants:', missingModules);
      this.log('📦 Chargement en mode démo');
      
      // Mode démo si modules manquants
      this.state.isAuthenticated = true;
      this.state.user = {
        email: 'demo@khrysalide.app',
        name: 'Utilisateur Démo',
        picture: null
      };
    }
  }

  /**
   * Initialise l'authentification
   */
  async initAuth() {
    if (window.Auth) {
      try {
        this.modules.auth = window.Auth;
        await this.modules.auth.init(this.config.api);
        
        this.state.isAuthenticated = this.modules.auth.isAuthenticated();
        if (this.state.isAuthenticated) {
          this.state.user = this.modules.auth.getCurrentUser();
        }
        
        // Écoute les changements d'auth
        this.modules.auth.onAuthChange((isAuth, user) => {
          this.state.isAuthenticated = isAuth;
          this.state.user = user;
          
          if (!isAuth) {
            this.modules.router?.navigateTo('login');
          }
        });
        
      } catch (error) {
        this.log('⚠️ Erreur auth:', error);
      }
    }
  }

  /**
   * Initialise le routeur
   */
  async initRouter() {
    if (window.Router) {
      this.modules.router = new window.Router(this);
      await this.modules.router.init();
      
      // Écoute les changements de page
      this.modules.router.onPageChange((page) => {
        this.state.currentPage = page;
      });
    } else {
      // Fallback basique sans routeur
      document.getElementById('app').innerHTML = `
        <div class="page">
          <div class="empty-state">
            <div class="empty-icon">⚠️</div>
            <h2>Mode démo</h2>
            <p>Les modules de l'application ne sont pas chargés.</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Cache l'écran de démarrage
   */
  hideSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      setTimeout(() => {
        splash.classList.add('hide');
        setTimeout(() => {
          splash.style.display = 'none';
        }, 500);
      }, 100);
    }
  }

  /**
   * Vérifie le statut de connexion
   */
  checkOnlineStatus() {
    this.state.isOffline = !navigator.onLine;
    
    window.addEventListener('online', () => {
      this.state.isOffline = false;
      this.showToast('Connexion rétablie', 'success');
      this.syncOfflineData();
    });
    
    window.addEventListener('offline', () => {
      this.state.isOffline = true;
      this.showToast('Mode hors ligne', 'warning');
    });
  }

  /**
   * Synchronise les données hors ligne
   */
  async syncOfflineData() {
    if (window.Storage) {
      // Synchronise avec Google Sheets
      const queue = window.Storage.getOfflineQueue();
      if (queue.length > 0) {
        this.log('📤 Synchronisation de', queue.length, 'actions...');
        // TODO: Implémenter la sync
      }
    }
  }

  /**
   * Affiche un toast de notification
   */
  showToast(message, type = 'info') {
    // Délègue au module Toast s'il existe
    if (window.Toast) {
      window.Toast.show(message, type);
    } else {
      // Fallback simple
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Affiche une erreur fatale
   */
  showFatalError(message) {
    document.getElementById('app').innerHTML = `
      <div class="page">
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <h2>Erreur de chargement</h2>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">
            Recharger l'application
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Log avec préfixe si mode debug
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[Khrysalide]', ...args);
    }
  }

  /**
   * Getters pour les modules
   */
  get auth() { return this.modules.auth; }
  get router() { return this.modules.router; }
  get sheets() { return this.modules.sheets; }
  get storage() { return this.modules.storage; }
}

// Instance globale de l'application
window.app = new KhrysalideApp();

// Initialise après le chargement du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.app.init());
} else {
  // DOM déjà chargé
  window.app.init();
}

// Export pour les modules ES6 (futur)
export default window.app;
