/**
 * dashboard.js - Page d'accueil / tableau de bord de Khrysalide
 * Affiche le résumé du jour, les actions rapides et les stats
 */

class DashboardPage {
  constructor(app) {
    this.app = app;
    this.data = {
      todayCalories: 0,
      targetCalories: 2000,
      weekAverage: 0,
      weekDays: 0,
      recentMeals: []
    };
  }

  /**
   * Initialise la page (chargement des données)
   */
  async init() {
    try {
      // Charge les données du jour
      await this.loadTodayData();
      
      // Charge les stats de la semaine
      await this.loadWeekStats();
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  }

  /**
   * Charge les données du jour
   */
  async loadTodayData() {
    // TODO: Charger depuis Google Sheets
    // Pour l'instant, données de démo
    this.data.todayCalories = Math.floor(Math.random() * 1500);
    
    // Charge depuis localStorage si disponible
    const saved = localStorage.getItem('khrysalide_today');
    if (saved) {
      const savedData = JSON.parse(saved);
      if (savedData.date === this.getTodayDate()) {
        this.data.todayCalories = savedData.calories || 0;
      }
    }
  }

  /**
   * Charge les statistiques de la semaine
   */
  async loadWeekStats() {
    // TODO: Charger depuis Google Sheets
    this.data.weekAverage = Math.floor(Math.random() * 2000);
    this.data.weekDays = Math.floor(Math.random() * 7) + 1;
  }

  /**
   * Rendu de la page
   */
  render() {
    const user = this.app.state.user;
    const progress = Math.min((this.data.todayCalories / this.data.targetCalories) * 100, 100);
    const progressColor = progress > 100 ? 'var(--color-coral)' : 'white';
    
    return `
      <div class="page dashboard-page">
        <!-- Header avec profil -->
        <div class="dashboard-header">
          <div>
            <h1 class="text-mint">Bonjour ${this.getUserFirstName()} ! 👋</h1>
            <p class="text-small">${this.getFormattedDate()}</p>
          </div>
          <button class="btn-icon" onclick="dashboardPage.showProfileMenu()">
            ${user?.picture 
              ? `<img src="${user.picture}" alt="Profil" class="profile-picture">` 
              : '👤'}
          </button>
        </div>
        
        <!-- Carte principale - Résumé du jour -->
        <div class="card card-mint mb-lg">
          <div class="card-content text-center">
            <h2 class="text-white mb-md">Aujourd'hui</h2>
            <div class="calories-display">
              <span class="calories-number">${this.data.todayCalories}</span>
              <span class="calories-unit">kcal</span>
            </div>
            <div class="calories-goal">
              sur ${this.data.targetCalories} kcal
            </div>
            <div class="progress-bar-wrapper mt-md">
              <div class="progress-bar" style="width: ${progress}%; background-color: ${progressColor}"></div>
            </div>
            ${this.getProgressMessage(progress)}
          </div>
        </div>
        
        <!-- Actions rapides -->
        <div class="quick-actions mb-lg">
          <h3 class="mb-md">Actions rapides</h3>
          <div class="flex gap-md">
            <button class="btn btn-primary flex-1" onclick="dashboardPage.quickAdd()">
              ➕ Ajouter un repas
            </button>
            <button class="btn btn-secondary flex-1" onclick="app.router.navigateTo('journal')">
              📅 Voir le journal
            </button>
          </div>
        </div>
        
        <!-- Résumé de la semaine -->
        <div class="card mb-lg">
          <div class="card-header">
            <h3 class="card-title">Cette semaine</h3>
            <span class="badge badge-mint">En cours</span>
          </div>
          <div class="card-content">
            <div class="stat-row">
              <span class="stat-label">Moyenne :</span>
              <span class="stat-value text-mint">${this.data.weekAverage} kcal/jour</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Jours enregistrés :</span>
              <span class="stat-value">${this.data.weekDays}/7</span>
            </div>
            <div class="week-dots mt-md">
              ${this.renderWeekDots()}
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-outline btn-small" onclick="app.router.navigateTo('stats')">
              Voir les statistiques complètes →
            </button>
          </div>
        </div>
        
        <!-- Raccourcis favoris -->
        ${this.renderFavorites()}
        
        <!-- Message motivant -->
        <div class="motivation-message mt-lg text-center">
          <p class="text-large">✨ ${this.getMotivationalMessage()}</p>
        </div>
      </div>
    `;
  }

  /**
   * Attache les événements après le rendu
   */
  attachEvents() {
    // Les événements sont gérés via onclick pour l'instant
    // Plus tard on pourra migrer vers addEventListener
  }

  /**
   * Actions
   */
  quickAdd() {
    // TODO: Ouvrir modal d'ajout rapide
    this.app.showToast('Ajout rapide bientôt disponible !', 'info');
  }

  showProfileMenu() {
    // TODO: Naviguer vers la page profil
    app.router.navigateTo('profil');
  }

  /**
   * Helpers
   */
  getUserFirstName() {
    const user = this.app.state.user;
    if (!user || !user.name) return 'toi';
    return user.name.split(' ')[0];
  }

  getFormattedDate() {
    return new Date().toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getTodayDate() {
    return new Date().toISOString().split('T')[0];
  }

  getProgressMessage(progress) {
    if (progress < 50) {
      return '<p class="progress-message">Bon début de journée ! 🌟</p>';
    } else if (progress < 80) {
      return '<p class="progress-message">Tu progresses bien ! 💪</p>';
    } else if (progress < 100) {
      return '<p class="progress-message">Presque à l\'objectif ! 🎯</p>';
    } else {
      return '<p class="progress-message">Objectif atteint ! 🎉</p>';
    }
  }

  renderWeekDots() {
    const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1; // Dimanche = 6
    
    return days.map((day, index) => {
      const isCompleted = index < this.data.weekDays;
      const isToday = index === adjustedToday;
      const classes = `week-dot ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}`;
      
      return `
        <div class="week-dot-container">
          <div class="${classes}"></div>
          <span class="week-dot-label">${day}</span>
        </div>
      `;
    }).join('');
  }

  renderFavorites() {
    // TODO: Charger les vrais favoris
    const hasFavorites = false;
    
    if (!hasFavorites) {
      return '';
    }
    
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Mes favoris</h3>
          <button class="btn-icon btn-small" onclick="dashboardPage.editFavorites()">
            ✏️
          </button>
        </div>
        <div class="card-content">
          <div class="favorites-grid">
            <!-- Favoris ici -->
          </div>
        </div>
      </div>
    `;
  }

  getMotivationalMessage() {
    const messages = [
      "Chaque jour est une nouvelle opportunité !",
      "Tu es sur la bonne voie, continue !",
      "Petit à petit, l'oiseau fait son nid.",
      "La constance est la clé du succès !",
      "Prends soin de toi, tu le mérites !",
      "Un jour à la fois, un pas à la fois.",
      "Tu peux être fier·e de tes efforts !",
      "Le voyage de mille lieues commence par un pas.",
      "Crois en toi et en tes capacités !",
      "Chaque choix compte, bravo pour tes efforts !",
      "La transformation commence de l'intérieur.",
      "Tu es plus fort·e que tu ne le penses !",
      "Célèbre chaque petite victoire !",
      "L'équilibre est la clé du bien-être.",
      "Ton corps te remerciera demain."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

// Styles spécifiques au dashboard
const dashboardStyles = `
<style>
  .dashboard-page {
    padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top));
  }
  
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: var(--spacing-lg);
  }
  
  .profile-picture {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
  }
  
  .calories-display {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    margin: 16px 0;
  }
  
  .calories-number {
    font-size: 3rem;
    font-weight: 700;
    color: white;
  }
  
  .calories-unit {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.8);
  }
  
  .calories-goal {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 16px;
  }
  
  .progress-bar-wrapper {
    height: 12px;
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 100px;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 100%;
    background-color: white;
    border-radius: 100px;
    transition: width 0.3s ease-out;
  }
  
  .progress-message {
    margin-top: 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
  }
  
  .quick-actions {
    margin-top: var(--spacing-xl);
  }
  
  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
  }
  
  .stat-label {
    color: var(--color-text);
  }
  
  .stat-value {
    font-weight: 700;
  }
  
  .week-dots {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-sm);
  }
  
  .week-dot-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .week-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: rgba(82, 209, 179, 0.2);
    position: relative;
    transition: all 0.3s ease;
  }
  
  .week-dot.completed {
    background-color: var(--color-mint);
  }
  
  .week-dot.today {
    box-shadow: 0 0 0 3px rgba(82, 209, 179, 0.3);
  }
  
  .week-dot-label {
    font-size: 0.75rem;
    color: var(--color-text);
    font-weight: 700;
  }
  
  .motivation-message {
    padding: var(--spacing-lg);
    background: linear-gradient(135deg, rgba(82, 209, 179, 0.1) 0%, rgba(255, 139, 148, 0.1) 100%);
    border-radius: var(--radius-lg);
  }
  
  .flex-1 {
    flex: 1;
  }
  
  .btn-small {
    padding: var(--spacing-xs) var(--spacing-md);
    font-size: 0.875rem;
  }
</style>
`;

// Ajoute les styles
if (!document.getElementById('dashboard-styles')) {
  const styleEl = document.createElement('div');
  styleEl.id = 'dashboard-styles';
  styleEl.innerHTML = dashboardStyles;
  document.head.appendChild(styleEl);
}

// Export pour l'utilisation globale
window.DashboardPage = DashboardPage;

// Instance globale pour les événements onclick
window.dashboardPage = null;

// Créer l'instance quand la page est affichée
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.dashboardPage = new DashboardPage(window.app);
  }
});
