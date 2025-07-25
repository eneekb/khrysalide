/**
 * auth.js - Gestion de l'authentification Google OAuth 2.0
 * Utilise Google Identity Services pour la connexion
 * Version: 1.1.0
 */

class Auth {
  constructor() {
    this.client = null;
    this.accessToken = null;
    this.user = null;
    this.tokenClient = null;
    this.isInitialized = false;
    this.authChangeCallbacks = [];
    
    // Configuration OAuth
    this.config = {
      clientId: '',
      scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4']
    };
  }

  /**
   * Initialise l'authentification Google
   */
  async init(apiConfig) {
    try {
      console.log('🔐 Initialisation de l\'authentification Google...');
      
      // Récupère la configuration
      this.config.clientId = apiConfig.clientId;
      
      // Charge les scripts Google
      await this.loadGoogleScripts();
      
      // Initialise Google Identity Services
      await this.initializeGoogleIdentity();
      
      // Vérifie si l'utilisateur était déjà connecté
      this.checkStoredAuth();
      
      this.isInitialized = true;
      console.log('✅ Authentification initialisée');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'auth:', error);
      throw error;
    }
  }

  /**
   * Charge les scripts Google nécessaires
   */
  async loadGoogleScripts() {
    // Google Identity Services
    if (!window.google?.accounts) {
      await this.loadScript('https://accounts.google.com/gsi/client');
    }
    
    // Google API Client (pour les infos utilisateur)
    if (!window.gapi) {
      await this.loadScript('https://apis.google.com/js/api.js');
      await new Promise(resolve => window.gapi.load('client', resolve));
    }
  }

  /**
   * Helper pour charger un script
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialise Google Identity Services
   */
  async initializeGoogleIdentity() {
    // Initialise le token client pour OAuth 2.0
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.config.clientId,
      scope: this.config.scope,
      callback: (response) => this.handleAuthResponse(response),
    });

    // Initialise le client API
    await gapi.client.init({
      apiKey: window.app?.config?.api?.apiKey,
      discoveryDocs: this.config.discoveryDocs
    });
  }

  /**
   * Vérifie si l'utilisateur était déjà connecté
   */
  checkStoredAuth() {
    // Pour la sécurité, on ne stocke pas le token
    // L'utilisateur devra se reconnecter à chaque session
    // On pourrait utiliser sessionStorage pour une persistance temporaire
    const storedUser = sessionStorage.getItem('khrysalide_user');
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        console.log('👤 Utilisateur récupéré:', this.user.email);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      }
    }
  }

  /**
   * Lance le processus de connexion
   */
  async signIn() {
    if (!this.isInitialized) {
      throw new Error('Auth non initialisé');
    }

    try {
      // Demande le consentement et récupère le token
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Gère la réponse d'authentification
   */
  async handleAuthResponse(response) {
    if (response.error) {
      console.error('Erreur d\'authentification:', response);
      this.notifyAuthChange(false, null);
      return;
    }

    // Stocke le token d'accès
    this.accessToken = response.access_token;
    
    // Définit le token pour les appels API
    gapi.client.setToken({ access_token: this.accessToken });
    
    try {
      // Récupère les informations de l'utilisateur
      await this.getUserInfo();
      
      // Notifie les listeners
      this.notifyAuthChange(true, this.user);
      
      // Message de succès
      if (window.app?.showToast) {
        window.app.showToast(`Bienvenue ${this.user.name} !`, 'success');
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des infos utilisateur:', error);
      this.notifyAuthChange(false, null);
    }
  }

  /**
   * Récupère les informations de l'utilisateur
   */
  async getUserInfo() {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Impossible de récupérer les infos utilisateur');
    }

    const userInfo = await response.json();
    
    this.user = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      givenName: userInfo.given_name,
      familyName: userInfo.family_name
    };

    // Sauvegarde temporaire (session uniquement)
    sessionStorage.setItem('khrysalide_user', JSON.stringify(this.user));
    
    console.log('✅ Utilisateur connecté:', this.user.email);
  }

  /**
   * Déconnexion
   */
  signOut() {
    // Révoque le token
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token révoqué');
      });
    }

    // Nettoie les données
    this.accessToken = null;
    this.user = null;
    gapi.client.setToken(null);
    sessionStorage.removeItem('khrysalide_user');
    
    // Notifie les listeners
    this.notifyAuthChange(false, null);
    
    // Message
    if (window.app?.showToast) {
      window.app.showToast('Déconnexion réussie', 'info');
    }
    
    console.log('👋 Utilisateur déconnecté');
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated() {
    return !!this.accessToken && !!this.user;
  }

  /**
   * Retourne le token d'accès actuel
   */
  getAccessToken() {
    return this.accessToken;
  }

  /**
   * Retourne les informations de l'utilisateur
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Enregistre un callback pour les changements d'auth
   */
  onAuthChange(callback) {
    this.authChangeCallbacks.push(callback);
  }

  /**
   * Notifie tous les listeners d'un changement d'auth
   */
  notifyAuthChange(isAuthenticated, user) {
    this.authChangeCallbacks.forEach(callback => {
      try {
        callback(isAuthenticated, user);
      } catch (error) {
        console.error('Erreur dans le callback d\'auth:', error);
      }
    });
  }

  /**
   * Rafraîchit le token si nécessaire
   */
  async refreshTokenIfNeeded() {
    // Google Identity Services gère automatiquement le refresh
    // Cette méthode pourrait être utilisée pour forcer un refresh
    if (!this.accessToken) {
      throw new Error('Aucun token à rafraîchir');
    }
    
    // Pour l'instant, on ne fait rien
    // Le token est valide pendant 1 heure
    return this.accessToken;
  }

  /**
   * Helper pour les appels API authentifiés
   */
  async makeAuthenticatedRequest(url, options = {}) {
    if (!this.isAuthenticated()) {
      throw new Error('Non authentifié');
    }

    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`
      }
    };

    const response = await fetch(url, authOptions);
    
    if (response.status === 401) {
      // Token expiré, on déconnecte
      this.signOut();
      throw new Error('Session expirée');
    }

    return response;
  }
}

// Export global
window.Auth = new Auth();

// Si l'app est déjà chargée, on peut initialiser
if (window.app) {
  console.log('App détectée, Auth prêt à être initialisé');
}
