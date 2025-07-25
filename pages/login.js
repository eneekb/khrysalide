/**
 * login.js - Page de connexion à Khrysalide
 * Gère l'authentification avec Google
 * Version: 1.1.1
 */

class LoginPage {
  constructor(app) {
    this.app = app;
  }

  /**
   * Initialise la page
   */
  async init() {
    // Rien de spécial à charger
  }

  /**
   * Rendu de la page
   */
  render() {
    return `
      <div class="page login-page">
        <div class="login-container">
          <!-- Logo et titre -->
          <div class="login-header">
            <div class="login-logo">
              <img src="logo.png" alt="Khrysalide">
            </div>
            <h1 class="app-title text-mint">Khrysalide</h1>
            <p class="login-subtitle text-small">Votre compagnon de suivi nutritionnel</p>
          </div>
          
          <!-- Section de connexion -->
          <div class="login-content">
            <div class="login-card card">
              <h2 class="text-center mb-lg">Bienvenue !</h2>
              
              <p class="text-center mb-lg">
                Connectez-vous pour accéder à votre journal alimentaire 
                et suivre votre progression.
              </p>
              
              <!-- Bouton de connexion Google -->
              <button class="btn btn-primary btn-google" onclick="loginPage.handleGoogleSignIn()">
                <svg class="google-icon" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continuer avec Google</span>
              </button>
              
              <!-- Informations -->
              <div class="login-info mt-lg">
                <p class="text-small text-center">
                  <span class="info-icon">🔒</span>
                  Vos données sont stockées de manière sécurisée dans votre compte Google Drive
                </p>
              </div>
            </div>
            
            <!-- Section avantages -->
            <div class="features-section mt-lg">
              <h3 class="text-center mb-lg">Pourquoi Khrysalide ?</h3>
              
              <div class="features-grid">
                <div class="feature-item">
                  <div class="feature-icon">📊</div>
                  <h4>Suivi détaillé</h4>
                  <p class="text-small">Analysez vos apports caloriques jour après jour</p>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🥗</div>
                  <h4>Base d'aliments</h4>
                  <p class="text-small">Accédez à une large base d'ingrédients et recettes</p>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">📈</div>
                  <h4>Statistiques</h4>
                  <p class="text-small">Visualisez votre progression avec des graphiques clairs</p>
                </div>
                
                <div class="feature-item">
                  <div class="feature-icon">🛒</div>
                  <h4>Liste de courses</h4>
                  <p class="text-small">Générez automatiquement vos listes de courses</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="login-footer">
            <p class="text-small text-center">
              En vous connectant, vous acceptez que Khrysalide accède 
              à votre Google Drive pour stocker vos données
            </p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gère la connexion Google
   */
  async handleGoogleSignIn() {
    try {
      // Affiche un loader
      this.showLoginLoader();
      
      // Lance la connexion
      await window.Auth.signIn();
      
      // La redirection sera gérée par le callback d'auth dans app.js
      
    } catch (error) {
      console.error('Erreur de connexion:', error);
      this.hideLoginLoader();
      
      if (window.app?.showToast) {
        window.app.showToast('Erreur lors de la connexion', 'error');
      }
    }
  }

  /**
   * Affiche un loader pendant la connexion
   */
  showLoginLoader() {
    const button = document.querySelector('.btn-google');
    if (button) {
      button.disabled = true;
      button.innerHTML = `
        <div class="loader-spinner-small"></div>
        <span>Connexion en cours...</span>
      `;
    }
  }

  /**
   * Cache le loader
   */
  hideLoginLoader() {
    const button = document.querySelector('.btn-google');
    if (button) {
      button.disabled = false;
      button.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Continuer avec Google</span>
      `;
    }
  }
}

// Styles spécifiques à la page de login
const loginStyles = `
<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #FAFAFA 0%, #E6FAF5 100%);
    padding: var(--spacing-md);
  }
  
  .login-container {
    width: 100%;
    max-width: 400px;
  }
  
  .login-header {
    text-align: center;
    margin-bottom: var(--spacing-lg);
  }
  
  .login-logo {
    width: 100px;
    height: 100px;
    margin: 0 auto var(--spacing-md);
  }
  
  .login-logo img {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4px 12px rgba(82, 209, 179, 0.3));
  }
  
  .login-subtitle {
    color: var(--color-text);
    margin-top: var(--spacing-sm);
  }
  
  .login-card {
    padding: var(--spacing-lg);
  }
  
  /* Bouton Google avec style corail */
  .btn-google {
    position: relative;
    padding-left: var(--spacing-2xl);
  }
  
  .btn-google .google-icon {
    position: absolute;
    left: var(--spacing-lg);
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
  }
  
  .btn-google:hover .google-icon {
    filter: brightness(1.1);
  }
  
  /* Info section */
  .login-info {
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: rgba(82, 209, 179, 0.1);
    border-radius: var(--radius-md);
  }
  
  .info-icon {
    font-size: 1.25rem;
    margin-right: var(--spacing-sm);
  }
  
  /* Features grid */
  .features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    margin-top: var(--spacing-lg);
  }
  
  .feature-item {
    text-align: center;
  }
  
  .feature-icon {
    font-size: 2.5rem;
    margin-bottom: var(--spacing-sm);
  }
  
  .feature-item h4 {
    font-size: 1rem;
    margin-bottom: var(--spacing-xs);
  }
  
  .feature-item p {
    margin: 0;
    color: var(--color-text);
  }
  
  /* Footer */
  .login-footer {
    margin-top: var(--spacing-lg);
    padding: 0 var(--spacing-lg);
    color: var(--color-text);
  }
  
  /* Loader spinner small */
  .loader-spinner-small {
    width: 20px;
    height: 20px;
    border: 2px solid #dadce0;
    border-top-color: #4285f4;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  
  @media (max-width: 480px) {
    .features-grid {
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }
  }
</style>
`;

// Ajoute les styles
if (!document.getElementById('login-styles')) {
  const styleEl = document.createElement('div');
  styleEl.id = 'login-styles';
  styleEl.innerHTML = loginStyles;
  document.head.appendChild(styleEl);
}

// Export global
window.LoginPage = LoginPage;

// Instance globale pour les événements
window.loginPage = null;

// Créer l'instance quand la page est affichée
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.loginPage = new LoginPage(window.app);
  }
});
