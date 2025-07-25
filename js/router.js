/**
 * router.js - Gestionnaire de navigation SPA pour Khrysalide
 * Gère les routes, l'historique et le chargement des pages
 * Version: 1.1.0
 */

class Router {
  constructor(app) {
    this.app = app;
    this.pages = new Map();
    this.currentPage = null;
    this.defaultPage = 'dashboard';
    this.container = null;
    this.navigation = null;
    this.pageChangeCallbacks = [];
  }

  /**
   * Initialise le routeur
   */
  async init() {
    this.app.log('🧭 Initialisation du routeur');
    
    // Récupère le container principal
    this.container = document.getElementById('app');
    
    // Configure les écouteurs d'événements
    this.setupEventListeners();
    
    // Enregistre les pages de base
    this.registerDefaultPages();
    
    // Crée la navigation
    this.createNavigation();
    
    // Charge les pages si disponibles
    await this.loadPages();
    
    // Navigue vers la route actuelle
    this.navigateToCurrentRoute();
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Écoute les changements d'URL (bouton retour)
    window.addEventListener('popstate', () => this.navigateToCurrentRoute());
    
    // Intercepte les clics sur les liens de navigation
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('[data-nav]');
      if (navLink) {
        e.preventDefault();
        const page = navLink.getAttribute('data-nav');
        this.navigateTo(page);
      }
    });
  }

  /**
   * Enregistre les pages par défaut
   */
  registerDefaultPages() {
    // Pages placeholder en attendant les vrais modules
    const defaultPages = [
      {
        name: 'dashboard',
        title: 'Tableau de bord',
        icon: '🏠',
        inNav: true
      },
      {
        name: 'journal',
        title: 'Mon journal',
        icon: '📅',
        inNav: true
      },
      {
        name: 'aliments',
        title: 'Aliments',
        icon: '🥗',
        inNav: true
      },
      {
        name: 'recettes',
        title: 'Recettes',
        icon: '🍽️',
        inNav: true
      },
      {
        name: 'stats',
        title: 'Statistiques',
        icon: '📊',
        inNav: true
      },
      {
        name: 'courses',
        title: 'Courses',
        icon: '🛒',
        inNav: true
      },
      {
        name: 'profil',
        title: 'Profil',
        icon: '⚙️',
        inNav: false // Pas dans la nav bottom
      },
      {
        name: 'login',
        title: 'Connexion',
        icon: '🔐',
        inNav: false,
        requiresAuth: false  // Page accessible sans auth
      }
    ];

    defaultPages.forEach(page => {
      this.registerPage(page.name, {
        ...page,
        component: null // Sera chargé dynamiquement
      });
    });
  }

  /**
   * Charge les pages depuis les modules
   */
  async loadPages() {
    // Charge les vrais composants de page s'ils existent
    for (const [name, config] of this.pages) {
      const PageClass = window[`${name.charAt(0).toUpperCase() + name.slice(1)}Page`];
      if (PageClass) {
        config.component = PageClass;
        this.app.log(`✅ Page "${name}" chargée`);
      }
    }
  }

  /**
   * Enregistre une page
   */
  registerPage(name, config) {
    this.pages.set(name, {
      name,
      title: config.title || name,
      icon: config.icon || '📄',
      inNav: config.inNav !== false,
      component: config.component || null,
      requiresAuth: config.requiresAuth !== false
    });
  }

  /**
   * Crée la barre de navigation
   */
  createNavigation() {
    // Filtre les pages qui doivent apparaître dans la nav
    const navPages = Array.from(this.pages.values()).filter(p => p.inNav);
    
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = `
      <ul class="nav-list">
        ${navPages.map(page => `
          <li class="nav-item">
            <a href="#${page.name}" class="nav-link" data-nav="${page.name}">
              <span class="nav-icon">${page.icon}</span>
              <span class="nav-text">${page.title}</span>
            </a>
          </li>
        `).join('')}
      </ul>
    `;
    
    this.container.appendChild(nav);
    this.navigation = nav;
  }

  /**
   * Navigation vers une page
   */
  navigateTo(pageName) {
    // Vérifie que la page existe
    if (!this.pages.has(pageName)) {
      this.app.log(`⚠️ Page "${pageName}" non trouvée`);
      pageName = this.defaultPage;
    }
    
    // Met à jour l'URL
    const newUrl = pageName === this.defaultPage ? '#' : `#${pageName}`;
    window.history.pushState({ page: pageName }, '', newUrl);
    
    // Affiche la page
    this.showPage(pageName);
  }

  /**
   * Navigue vers la route actuelle (depuis l'URL)
   */
  navigateToCurrentRoute() {
    const hash = window.location.hash.slice(1);
    const pageName = hash || this.defaultPage;
    this.showPage(pageName);
  }

  /**
   * Affiche une page
   */
  async showPage(pageName) {
    const page = this.pages.get(pageName);
    if (!page) {
      this.showError('Page non trouvée');
      return;
    }
    
    // Vérifie l'authentification si nécessaire
    if (page.requiresAuth && !this.app.state.isAuthenticated) {
      this.app.log('🔒 Authentification requise');
      this.navigateTo('login');
      return;
    }
    
    // Met à jour l'état
    this.currentPage = pageName;
    this.app.state.currentPage = pageName;
    
    // Notifie les callbacks
    this.pageChangeCallbacks.forEach(cb => cb(pageName));
    
    // Met à jour la navigation active
    this.updateActiveNavigation(pageName);
    
    // Met à jour le titre de la page
    document.title = `${page.title} - ${this.app.config.name}`;
    
    // Prépare le container
    const pageContainer = this.getPageContainer();
    
    // Affiche le loader
    this.showLoader(pageContainer);
    
    try {
      // Petite pause pour l'animation
      await this.sleep(300);
      
      // Rend la page
      let content;
      if (page.component) {
        // Utilise le composant de page s'il existe
        const instance = new page.component(this.app);
        if (instance.init) await instance.init();
        content = instance.render();
      } else {
        // Sinon affiche un placeholder
        content = this.renderPlaceholder(page);
      }
      
      // Affiche le contenu
      pageContainer.innerHTML = content;
      
      // Attache les événements si nécessaire
      if (page.component && page.component.prototype.attachEvents) {
        const instance = new page.component(this.app);
        instance.attachEvents();
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement de la page:', error);
      this.showError('Erreur lors du chargement de la page');
    }
  }

  /**
   * Met à jour l'élément actif dans la navigation
   */
  updateActiveNavigation(pageName) {
    // Retire la classe active
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    
    // Ajoute la classe active
    const activeLink = document.querySelector(`[data-nav="${pageName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  /**
   * Récupère ou crée le container des pages
   */
  getPageContainer() {
    let container = document.getElementById('page-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'page-container';
      container.className = 'page-container';
      this.container.insertBefore(container, this.navigation);
    }
    return container;
  }

  /**
   * Affiche le loader
   */
  showLoader(container) {
    container.innerHTML = `
      <div class="page-loader">
        <div class="loader-content">
          <div class="loader-spinner"></div>
          <p class="loader-text">Chargement...</p>
        </div>
      </div>
    `;
  }

  /**
   * Affiche une erreur
   */
  showError(message) {
    const pageContainer = this.getPageContainer();
    pageContainer.innerHTML = `
      <div class="page">
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <h2 class="empty-title">Oops !</h2>
          <p class="empty-text">${message}</p>
          <button class="btn btn-primary" onclick="app.router.navigateTo('dashboard')">
            Retour à l'accueil
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render d'une page placeholder
   */
  renderPlaceholder(page) {
    return `
      <div class="page">
        <div class="empty-state">
          <div class="empty-icon">${page.icon}</div>
          <h2 class="empty-title">${page.title}</h2>
          <p class="empty-text">Cette page sera bientôt disponible !</p>
          <button class="btn btn-primary" onclick="app.router.navigateTo('dashboard')">
            Retour à l'accueil
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Enregistre un callback pour les changements de page
   */
  onPageChange(callback) {
    this.pageChangeCallbacks.push(callback);
  }

  /**
   * Helper pour les délais
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Styles additionnels pour le routeur
const routerStyles = `
<style>
  .page-container {
    min-height: calc(100vh - 80px);
    padding-bottom: env(safe-area-inset-bottom);
    animation: fadeIn 0.3s ease-out;
  }
  
  .page-loader {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg);
  }
  
  .loader-content {
    text-align: center;
  }
  
  .loader-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 16px;
    border: 4px solid rgba(82, 209, 179, 0.2);
    border-top-color: var(--color-mint);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .loader-text {
    color: var(--color-text);
    font-size: 14px;
  }
</style>
`;

// Ajoute les styles
if (!document.getElementById('router-styles')) {
  const styleEl = document.createElement('div');
  styleEl.id = 'router-styles';
  styleEl.innerHTML = routerStyles;
  document.head.appendChild(styleEl);
}

// Export pour l'utilisation globale
window.Router = Router;
