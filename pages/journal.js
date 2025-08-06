/**
 * journal.js - Page journal alimentaire avec vue semaine
 * Affiche et gère l'historique des repas
 * Version: 1.4.5
 */

class JournalPage {
  constructor(app) {
    this.app = app;
    this.currentWeekStart = null;
    this.weekData = [];
    this.selectedDay = null;
    this.selectedMeal = null;
    this.objectifKcal = 2000;
    this.searchQuery = '';
    this.searchFilter = 'all'; // all, aliments, recettes, manuel
    this.allIngredients = [];
    this.allRecipes = [];
    
    // Initialise la semaine courante
    this.setCurrentWeek(new Date());
    
    // Crée des données vides pour la semaine
    this.weekData = this.organizeWeekData([]);
  }

  /**
   * Initialise la page
   */
  async init() {
    try {
      // Crée l'instance globale pour les événements onclick
      window.journalPage = this;
      
      // Définit la semaine courante
      this.setCurrentWeek(new Date());
      
      // Charge le profil pour l'objectif
      await this.loadProfile();
      
      // Charge les données de la semaine
      await this.loadWeekData();
      
      // Charge les aliments et recettes pour la recherche
      await this.loadSearchData();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      this.app.showToast('Erreur lors du chargement', 'error');
    }
  }

  /**
   * Charge le profil utilisateur
   */
  async loadProfile() {
    try {
      const profile = await window.SheetsAPI.readProfile();
      this.objectifKcal = profile.objectifKcal || 2000;
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  }

  /**
   * Charge les données pour la recherche
   */
  async loadSearchData() {
    try {
      // Charge tous les ingrédients
      this.allIngredients = await window.SheetsAPI.readIngredients();
      
      // Charge toutes les recettes
      this.allRecipes = await window.SheetsAPI.readRecipes();
      
    } catch (error) {
      console.error('Erreur lors du chargement des données de recherche:', error);
    }
  }

  /**
   * Définit la semaine courante (lundi au dimanche)
   */
  setCurrentWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste pour commencer le lundi
    this.currentWeekStart = new Date(d.setDate(diff));
    this.currentWeekStart.setHours(0, 0, 0, 0);
    console.log('📅 Semaine définie:', this.currentWeekStart.toISOString());
  }

  /**
   * Charge les données de la semaine
   */
  async loadWeekData() {
    try {
      // Calcule les dates de début et fin de semaine
      const weekEnd = new Date(this.currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const startISO = this.currentWeekStart.toISOString().split('T')[0];
      const endISO = weekEnd.toISOString().split('T')[0];
      
      console.log(`📅 Chargement semaine: ${startISO} → ${endISO}`);
      
      // Charge les entrées de la semaine
      const entries = await window.SheetsAPI.readJournal(startISO, endISO);
      console.log(`📊 ${entries.length} entrées trouvées pour la semaine`);
      
      // Organise les données par jour
      this.weekData = this.organizeWeekData(entries);
      console.log('📅 Données de la semaine organisées:', this.weekData);
      
    } catch (error) {
      console.error('Erreur lors du chargement de la semaine:', error);
      this.weekData = [];
    }
  }

  /**
   * Organise les entrées par jour et par repas
   */
  organizeWeekData(entries) {
    const weekData = [];
    
    // Crée un objet pour chaque jour de la semaine
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateISO = date.toISOString().split('T')[0];
      
      weekData.push({
        date: dateISO,
        dayName: this.getDayName(date),
        dayNumber: date.getDate(),
        entries: entries.filter(e => e.date === dateISO),
        totals: {
          total: 0,
          petitDejeuner: 0,
          dejeuner: 0,
          diner: 0,
          collation: 0
        }
      });
    }
    
    // Calcule les totaux par repas
    weekData.forEach(day => {
      day.entries.forEach(entry => {
        day.totals.total += entry.kcal || 0;
        
        const repasLower = entry.repas?.toLowerCase() || '';
        switch(repasLower) {
          case 'petit-déjeuner':
          case 'petit déjeuner':
            day.totals.petitDejeuner += entry.kcal || 0;
            break;
          case 'déjeuner':
            day.totals.dejeuner += entry.kcal || 0;
            break;
          case 'dîner':
          case 'diner':
            day.totals.diner += entry.kcal || 0;
            break;
          case 'collation':
            day.totals.collation += entry.kcal || 0;
            break;
        }
      });
    });
    
    return weekData;
  }

  /**
   * Rendu de la page
   */
  render() {
    // Crée l'instance globale pour les événements onclick
    window.journalPage = this;
    
    return `
      <div class="page journal-page">
        ${this.renderWeekHeader()}
        ${this.renderWeekView()}
        ${this.renderDayModal()}
        ${this.renderAddModal()}
        ${this.renderManualModal()}
        ${this.renderNoteModal()}
      </div>
    `;
  }

  /**
   * Rendu de l'en-tête de semaine
   */
  renderWeekHeader() {
    const monthYear = this.currentWeekStart.toLocaleDateString('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    });
    const weekNumber = this.getWeekNumber(this.currentWeekStart);
    
    return `
      <div class="week-header">
        <button class="btn-icon" onclick="journalPage.previousWeek()">←</button>
        <div class="week-info">
          <h2>Semaine ${weekNumber}</h2>
          <p class="text-small">${monthYear}</p>
        </div>
        <button class="btn-icon" onclick="journalPage.nextWeek()">→</button>
      </div>
    `;
  }

  /**
   * Rendu de la vue semaine
   */
  renderWeekView() {
    if (!this.weekData || this.weekData.length === 0) {
      return '<div class="week-grid"><p class="no-data">Chargement...</p></div>';
    }
    
    return `
      <div class="week-grid">
        ${this.weekData.map(day => this.renderDayCard(day)).join('')}
      </div>
    `;
  }

  /**
   * Rendu d'une carte jour
   */
  renderDayCard(day) {
    const hasData = day.totals.total > 0;
    const isToday = day.date === new Date().toISOString().split('T')[0];
    
    return `
      <div class="day-card ${isToday ? 'today' : ''} ${hasData ? 'has-data' : ''}" 
           onclick="journalPage.openDayModal('${day.date}')">
        <div class="day-header">
          <span class="day-name">${day.dayName}</span>
          <span class="day-number">${day.dayNumber}</span>
        </div>
        <div class="day-content">
          ${hasData ? `
            <div class="day-total">${Math.round(day.totals.total)}</div>
            <div class="day-unit">kcal</div>
            <div class="day-details">
              <span>P:${Math.round(day.totals.petitDejeuner || 0)}</span>
              <span>D:${Math.round(day.totals.dejeuner || 0)}</span>
              <span>d:${Math.round(day.totals.diner || 0)}</span>
              <span>C:${Math.round(day.totals.collation || 0)}</span>
            </div>
          ` : `
            <div class="day-empty">----</div>
          `}
        </div>
        ${day.entries && day.entries.some(e => e.note) ? '<div class="day-note-indicator">📝</div>' : ''}
      </div>
    `;
  }

  /**
   * Rendu de la modal détail du jour
   */
  renderDayModal() {
    return `
      <div id="dayModal" class="modal" style="display: none;">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <button class="btn-icon" onclick="journalPage.previousDay()">←</button>
            <h2 id="dayModalTitle">Jour</h2>
            <button class="btn-icon" onclick="journalPage.nextDay()">→</button>
          </div>
          
          <div class="modal-body">
            <div id="dayModalContent">
              <!-- Contenu dynamique -->
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn-outline" onclick="journalPage.closeDayModal()">
              Fermer
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu de la modal d'ajout
   */
  renderAddModal() {
    return `
      <div id="addModal" class="modal" style="display: none;">
        <div class="modal-content">
          <div class="modal-header">
            <h2 id="addModalTitle">Ajouter au repas</h2>
            <button class="btn-icon" onclick="journalPage.closeAddModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <!-- Recherche -->
            <div class="search-container">
              <input 
                type="text" 
                id="searchInput" 
                class="input search-input" 
                placeholder="Rechercher un aliment ou une recette..."
                oninput="journalPage.handleSearch()"
              >
            </div>
            
            <!-- Filtres -->
            <div class="filter-tabs">
              <button class="filter-tab active" data-filter="all" onclick="journalPage.setSearchFilter('all')">
                Tous
              </button>
              <button class="filter-tab" data-filter="aliments" onclick="journalPage.setSearchFilter('aliments')">
                Aliments
              </button>
              <button class="filter-tab" data-filter="recettes" onclick="journalPage.setSearchFilter('recettes')">
                Recettes
              </button>
              <button class="filter-tab" data-filter="manuel" onclick="journalPage.setSearchFilter('manuel')">
                ➕ Manuel
              </button>
            </div>
            
            <!-- Résultats -->
            <div id="searchResults" class="search-results">
              <!-- Résultats dynamiques -->
            </div>
            
            <!-- Sélection quantité -->
            <div id="quantitySelection" style="display: none;">
              <div class="selection-header">
                <h3 id="selectedItemName">Item</h3>
                <button class="btn-text" onclick="journalPage.cancelSelection()">
                  Changer
                </button>
              </div>
              
              <div class="quantity-controls">
                <label>Quantité :</label>
                <div class="quantity-input-group">
                  <input 
                    type="number" 
                    id="quantityInput" 
                    class="input quantity-input" 
                    value="1" 
                    min="0.1" 
                    step="0.1"
                    oninput="journalPage.updateCalories()"
                  >
                  <select id="unitSelect" class="input unit-select" onchange="journalPage.updateCalories()">
                    <!-- Options dynamiques -->
                  </select>
                </div>
                
                <div class="quantity-presets">
                  <button class="preset-btn" onclick="journalPage.setQuantity(0.5)">0.5</button>
                  <button class="preset-btn" onclick="journalPage.setQuantity(1)">1</button>
                  <button class="preset-btn" onclick="journalPage.setQuantity(1.5)">1.5</button>
                  <button class="preset-btn" onclick="journalPage.setQuantity(2)">2</button>
                </div>
                
                <div class="calories-preview">
                  <span>Calories :</span>
                  <span id="caloriesPreview" class="calories-value">0 kcal</span>
                </div>
              </div>
              
              <div class="modal-actions">
                <button class="btn btn-outline" onclick="journalPage.cancelSelection()">
                  Annuler
                </button>
                <button class="btn btn-primary" onclick="journalPage.confirmAdd()">
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu de la modal d'ajout manuel
   */
  renderManualModal() {
    return `
      <div id="manualModal" class="modal" style="display: none;">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h2>Entrée manuelle</h2>
            <button class="btn-icon" onclick="journalPage.closeManualModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="input-group">
              <label for="manualName">Nom</label>
              <input 
                type="text" 
                id="manualName" 
                class="input" 
                placeholder="Ex: Restaurant chinois"
              >
            </div>
            
            <div class="input-group">
              <label for="manualCalories">Calories</label>
              <input 
                type="number" 
                id="manualCalories" 
                class="input" 
                placeholder="Ex: 650"
                min="0"
              >
            </div>
            
            <div class="modal-actions">
              <button class="btn btn-outline" onclick="journalPage.closeManualModal()">
                Annuler
              </button>
              <button class="btn btn-primary" onclick="journalPage.confirmManualAdd()">
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu de la modal de note
   */
  renderNoteModal() {
    return `
      <div id="noteModal" class="modal" style="display: none;">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h2 id="noteModalTitle">Note pour le repas</h2>
            <button class="btn-icon" onclick="journalPage.closeNoteModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <textarea 
              id="noteTextarea" 
              class="input note-textarea" 
              rows="4"
              placeholder="Ajouter une note..."
            ></textarea>
            
            <div class="modal-actions">
              <button class="btn btn-outline" onclick="journalPage.closeNoteModal()">
                Annuler
              </button>
              <button class="btn btn-primary" onclick="journalPage.saveNote()">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attache les événements après le rendu
   */
  attachEvents() {
    // Ferme les modals si on clique en dehors
    const modals = ['dayModal', 'addModal', 'manualModal', 'noteModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            if (modalId === 'dayModal') this.closeDayModal();
            else if (modalId === 'addModal') this.closeAddModal();
            else if (modalId === 'manualModal') this.closeManualModal();
            else if (modalId === 'noteModal') this.closeNoteModal();
          }
        });
      }
    });
  }

  /**
   * Navigation semaine précédente
   */
  previousWeek() {
    console.log('📅 Navigation semaine précédente');
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    this.setCurrentWeek(newDate);
    
    this.loadWeekData().then(() => {
      this.updateWeekView();
    });
  }

  /**
   * Navigation semaine suivante
   */
  nextWeek() {
    console.log('📅 Navigation semaine suivante');
    const newDate = new Date(this.currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    this.setCurrentWeek(newDate);
    
    this.loadWeekData().then(() => {
      this.updateWeekView();
    });
  }

  /**
   * Met à jour la vue semaine
   */
  updateWeekView() {
    // Re-render toute la page
    const container = document.getElementById('content');
    if (container && window.app?.router?.currentPageInstance === this) {
      container.innerHTML = this.render();
      this.attachEvents();
    }
  }

  /**
   * Ouvre la modal détail du jour
   */
  async openDayModal(date) {
    console.log('📅 Ouverture modal pour:', date);
    this.selectedDay = date;
    const modal = document.getElementById('dayModal');
    const title = document.getElementById('dayModalTitle');
    const content = document.getElementById('dayModalContent');
    
    if (!modal || !title || !content) {
      console.error('❌ Éléments modal non trouvés');
      return;
    }
    
    // Trouve les données du jour
    const dayData = this.weekData.find(d => d.date === date);
    if (!dayData) return;
    
    // Formatage de la date
    const dateObj = new Date(date + 'T12:00:00');
    const dateFormatted = dateObj.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    
    title.textContent = dateFormatted;
    
    // Groupe les entrées par repas
    const mealGroups = {
      'petit-déjeuner': { entries: [], total: 0, icon: '🌅', name: 'Petit-déjeuner' },
      'déjeuner': { entries: [], total: 0, icon: '🍽️', name: 'Déjeuner' },
      'dîner': { entries: [], total: 0, icon: '🌙', name: 'Dîner' },
      'collation': { entries: [], total: 0, icon: '🍿', name: 'Collations' }
    };
    
    // Organise les entrées
    dayData.entries.forEach(entry => {
      const mealKey = entry.repas.toLowerCase().replace(' ', '-');
      if (mealGroups[mealKey]) {
        mealGroups[mealKey].entries.push(entry);
        mealGroups[mealKey].total += entry.kcal;
      } else if (mealKey === 'diner') {
        mealGroups['dîner'].entries.push(entry);
        mealGroups['dîner'].total += entry.kcal;
      }
    });
    
    // Génère le contenu
    content.innerHTML = `
      ${this.renderDayProgress(dayData.totals.total)}
      ${Object.entries(mealGroups).map(([key, meal]) => 
        this.renderMealSection(key, meal, date)
      ).join('')}
    `;
    
    // Affiche la modal
    modal.style.display = 'flex';
  }

  /**
   * Rendu de la barre de progression du jour
   */
  renderDayProgress(total) {
    const percentage = (total / 4000) * 100;
    const objectifPercentage = (this.objectifKcal / 4000) * 100;
    
    // Calcule la couleur selon la proximité avec l'objectif
    let color;
    const ratio = total / this.objectifKcal;
    
    if (ratio < 0.75) {
      // Orange clair (trop peu)
      color = '#FFB366';
    } else if (ratio < 0.9) {
      // Jaune
      color = '#FFD93D';
    } else if (ratio <= 1.1) {
      // Vert (zone idéale)
      color = '#52D1B3';
    } else if (ratio <= 1.25) {
      // Jaune
      color = '#FFD93D';
    } else {
      // Rouge progressif
      const redIntensity = Math.min(255, 180 + (ratio - 1.25) * 150);
      color = `rgb(${redIntensity}, 100, 100)`;
    }
    
    return `
      <div class="day-progress">
        <div class="progress-info">
          <span class="progress-label">Total : ${Math.round(total)} / ${this.objectifKcal} kcal</span>
          <span class="progress-max">4000 kcal</span>
        </div>
        <div class="progress-container">
          <div class="progress-track">
            <div class="progress-fill" style="width: ${percentage}%; background-color: ${color}"></div>
            <div class="progress-marker" style="left: ${objectifPercentage}%">
              <div class="marker-line"></div>
              <div class="marker-label">Objectif</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Rendu d'une section repas
   */
  renderMealSection(mealKey, meal, date) {
    const hasNote = meal.entries.some(e => e.note);
    const noteText = meal.entries.find(e => e.note)?.note || '';
    
    return `
      <div class="meal-section">
        <div class="meal-header">
          <h3>${meal.icon} ${meal.name}</h3>
          <span class="meal-total">${Math.round(meal.total)} kcal</span>
        </div>
        <div class="meal-content">
          ${meal.entries.length > 0 ? meal.entries.map(entry => `
            <div class="meal-item">
              <div class="item-info">
                <span class="item-name">
                  ${entry.type === 'recette' ? `${this.getItemName(entry)} (${entry.reference})` : this.getItemName(entry)}
                </span>
                <span class="item-quantity">${entry.quantite} ${this.getItemUnit(entry)}</span>
              </div>
              <div class="item-actions">
                <span class="item-calories">${Math.round(entry.kcal)} kcal</span>
                <button class="btn-icon btn-small" onclick="journalPage.deleteEntry(${entry.id})">
                  🗑️
                </button>
              </div>
            </div>
          `).join('') : '<p class="meal-empty">Aucun aliment</p>'}
          
          ${hasNote ? `<div class="meal-note">📝 "${noteText}"</div>` : ''}
          
          <div class="meal-actions">
            <button class="btn btn-outline btn-small" onclick="journalPage.openAddModal('${date}', '${mealKey}')">
              + Ajouter
            </button>
            <button class="btn btn-outline btn-small" onclick="journalPage.openNoteModal('${date}', '${mealKey}', '${noteText}')">
              📝 ${hasNote ? 'Modifier' : ''} Note
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Navigation jour précédent
   */
  previousDay() {
    const currentDate = new Date(this.selectedDay + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = currentDate.toISOString().split('T')[0];
    
    // Vérifie si on doit changer de semaine
    if (currentDate < this.currentWeekStart) {
      this.previousWeek();
    }
    
    this.openDayModal(newDate);
  }

  /**
   * Navigation jour suivant
   */
  nextDay() {
    const currentDate = new Date(this.selectedDay + 'T12:00:00');
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = currentDate.toISOString().split('T')[0];
    
    // Vérifie si on doit changer de semaine
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    if (currentDate > weekEnd) {
      this.nextWeek();
    }
    
    this.openDayModal(newDate);
  }

  /**
   * Ferme la modal du jour
   */
  closeDayModal() {
    const modal = document.getElementById('dayModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Ouvre la modal d'ajout
   */
  openAddModal(date, mealType) {
    this.selectedDay = date;
    this.selectedMeal = mealType;
    
    const modal = document.getElementById('addModal');
    const title = document.getElementById('addModalTitle');
    
    if (!modal || !title) return;
    
    // Met à jour le titre
    const mealNames = {
      'petit-déjeuner': 'petit-déjeuner',
      'déjeuner': 'déjeuner',
      'dîner': 'dîner',
      'collation': 'collations'
    };
    
    const dateObj = new Date(date + 'T12:00:00');
    const dateFormatted = dateObj.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long' 
    });
    
    title.textContent = `Ajouter au ${mealNames[mealType]} - ${dateFormatted}`;
    
    // Réinitialise la recherche
    this.searchQuery = '';
    this.searchFilter = 'all';
    document.getElementById('searchInput').value = '';
    this.updateSearchResults();
    
    // Cache la sélection de quantité
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('quantitySelection').style.display = 'none';
    
    // Réinitialise les filtres
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === 'all');
    });
    
    // Affiche la modal
    modal.style.display = 'flex';
    
    // Focus sur la recherche
    setTimeout(() => {
      document.getElementById('searchInput')?.focus();
    }, 100);
  }

  /**
   * Ferme la modal d'ajout
   */
  closeAddModal() {
    const modal = document.getElementById('addModal');
    if (modal) {
      modal.style.display = 'none';
    }
    this.selectedItem = null;
  }

  /**
   * Gère la recherche
   */
  handleSearch() {
    const input = document.getElementById('searchInput');
    this.searchQuery = input.value.toLowerCase();
    this.updateSearchResults();
  }

  /**
   * Change le filtre de recherche
   */
  setSearchFilter(filter) {
    this.searchFilter = filter;
    
    // Met à jour les onglets
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.filter === filter);
    });
    
    // Si on clique sur manuel, ouvre directement la modal
    if (filter === 'manuel') {
      this.openManualModal();
    } else {
      this.updateSearchResults();
    }
  }

  /**
   * Met à jour les résultats de recherche
   */
  updateSearchResults() {
    const resultsEl = document.getElementById('searchResults');
    if (!resultsEl) return;
    
    let results = [];
    
    // Filtre les aliments
    if (this.searchFilter === 'all' || this.searchFilter === 'aliments') {
      const filteredIngredients = this.allIngredients.filter(ing => 
        ing.intitule.toLowerCase().includes(this.searchQuery) ||
        ing.categorie.toLowerCase().includes(this.searchQuery) ||
        ing.reference.toLowerCase().includes(this.searchQuery)
      );
      results = results.concat(filteredIngredients.map(ing => ({
        ...ing,
        type: 'ingredient',
        displayName: ing.intitule,
        displayInfo: `${ing.categorie} - ${ing.kcal100g} kcal/100g`,
        defaultUnit: ing.unite || 'g'
      })));
    }
    
    // Filtre les recettes
    if (this.searchFilter === 'all' || this.searchFilter === 'recettes') {
      const filteredRecipes = this.allRecipes.filter(rec => 
        rec.intitule.toLowerCase().includes(this.searchQuery) ||
        rec.numero.toLowerCase().includes(this.searchQuery)
      );
      results = results.concat(filteredRecipes.map(rec => ({
        ...rec,
        type: 'recette',
        displayName: `${rec.intitule} (${rec.numero})`,
        displayInfo: `Recette - ${Math.round(rec.kcalTotal / rec.portion)} kcal/portion`,
        defaultUnit: 'portion'
      })));
    }
    
    // Tri alphabétique
    results.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    // Limite à 20 résultats
    results = results.slice(0, 20);
    
    // Affiche les résultats
    if (results.length === 0 && this.searchQuery) {
      resultsEl.innerHTML = '<p class="no-results">Aucun résultat trouvé</p>';
    } else if (results.length === 0) {
      resultsEl.innerHTML = '<p class="no-results">Commencez à taper pour rechercher</p>';
    } else {
      resultsEl.innerHTML = results.map(item => `
        <div class="search-result" onclick="journalPage.selectItem(${JSON.stringify(item).replace(/"/g, '&quot;')})">
          <div class="result-name">${item.displayName}</div>
          <div class="result-info">${item.displayInfo}</div>
        </div>
      `).join('');
    }
  }

  /**
   * Sélectionne un item
   */
  selectItem(item) {
    this.selectedItem = item;
    
    // Cache les résultats et affiche la sélection de quantité
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('quantitySelection').style.display = 'block';
    
    // Met à jour les infos
    document.getElementById('selectedItemName').textContent = item.displayName;
    document.getElementById('quantityInput').value = 1;
    
    // Configure l'unité
    const unitSelect = document.getElementById('unitSelect');
    unitSelect.innerHTML = this.getUnitOptions(item);
    
    // Met à jour les calories
    this.updateCalories();
  }

  /**
   * Annule la sélection
   */
  cancelSelection() {
    this.selectedItem = null;
    document.getElementById('searchResults').style.display = 'block';
    document.getElementById('quantitySelection').style.display = 'none';
  }

  /**
   * Obtient les options d'unité pour un item
   */
  getUnitOptions(item) {
    if (item.type === 'recette') {
      return '<option value="portion">portion</option>';
    }
    
    // Pour les ingrédients
    const unit = item.unite || 'g';
    let options = [];
    
    switch(unit) {
      case 'g':
        options = [
          '<option value="g">g</option>',
          '<option value="kg">kg</option>'
        ];
        break;
      case 'kg':
        options = [
          '<option value="kg">kg</option>',
          '<option value="g">g</option>'
        ];
        break;
      case 'L':
        options = [
          '<option value="L">L</option>',
          '<option value="mL">mL</option>'
        ];
        break;
      case 'mL':
        options = [
          '<option value="mL">mL</option>',
          '<option value="L">L</option>'
        ];
        break;
      default:
        options = [`<option value="${unit}">${unit}</option>`];
    }
    
    return options.join('');
  }

  /**
   * Définit la quantité
   */
  setQuantity(value) {
    document.getElementById('quantityInput').value = value;
    this.updateCalories();
  }

  /**
   * Met à jour le calcul des calories
   */
  updateCalories() {
    if (!this.selectedItem) return;
    
    const quantity = parseFloat(document.getElementById('quantityInput').value) || 0;
    const unit = document.getElementById('unitSelect').value;
    
    let calories = 0;
    
    if (this.selectedItem.type === 'recette') {
      calories = (this.selectedItem.kcalTotal / this.selectedItem.portion) * quantity;
    } else {
      // Pour les ingrédients
      let quantityInGrams = quantity;
      
      // Conversion en grammes si nécessaire
      switch(unit) {
        case 'kg':
          quantityInGrams = quantity * 1000;
          break;
        case 'L':
          quantityInGrams = quantity * 1000;
          break;
        case 'mL':
          quantityInGrams = quantity;
          break;
        default:
          if (this.selectedItem.poidsParUnite && unit === this.selectedItem.unite) {
            quantityInGrams = quantity * this.selectedItem.poidsParUnite;
          }
      }
      
      calories = (this.selectedItem.kcal100g / 100) * quantityInGrams;
    }
    
    document.getElementById('caloriesPreview').textContent = `${Math.round(calories)} kcal`;
  }

  /**
   * Confirme l'ajout
   */
  async confirmAdd() {
    if (!this.selectedItem) return;
    
    const quantity = parseFloat(document.getElementById('quantityInput').value) || 0;
    const unit = document.getElementById('unitSelect').value;
    
    if (quantity <= 0) {
      this.app.showToast('Veuillez entrer une quantité valide', 'error');
      return;
    }
    
    // Calcule les calories
    let calories = 0;
    if (this.selectedItem.type === 'recette') {
      calories = (this.selectedItem.kcalTotal / this.selectedItem.portion) * quantity;
    } else {
      let quantityInGrams = quantity;
      
      switch(unit) {
        case 'kg':
          quantityInGrams = quantity * 1000;
          break;
        case 'L':
          quantityInGrams = quantity * 1000;
          break;
        case 'mL':
          quantityInGrams = quantity;
          break;
        default:
          if (this.selectedItem.poidsParUnite && unit === this.selectedItem.unite) {
            quantityInGrams = quantity * this.selectedItem.poidsParUnite;
          }
      }
      
      calories = (this.selectedItem.kcal100g / 100) * quantityInGrams;
    }
    
    // Prépare l'entrée
    const entry = {
      date: this.selectedDay,
      repas: this.getMealName(this.selectedMeal),
      type: this.selectedItem.type,
      reference: this.selectedItem.type === 'recette' ? this.selectedItem.numero : this.selectedItem.reference,
      quantite: quantity,
      kcal: Math.round(calories)
    };
    
    try {
      // Ajoute au journal
      await window.SheetsAPI.addJournalEntry(entry);
      
      // Recharge les données
      await this.loadWeekData();
      this.updateWeekView();
      
      // Ferme la modal
      this.closeAddModal();
      
      // Rouvre la modal du jour pour voir l'ajout
      this.openDayModal(this.selectedDay);
      
      this.app.showToast('Aliment ajouté !', 'success');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      this.app.showToast('Erreur lors de l\'ajout', 'error');
    }
  }

  /**
   * Ouvre la modal d'ajout manuel
   */
  openManualModal() {
    const modal = document.getElementById('manualModal');
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => {
        document.getElementById('manualName')?.focus();
      }, 100);
    }
  }

  /**
   * Ferme la modal d'ajout manuel
   */
  closeManualModal() {
    const modal = document.getElementById('manualModal');
    if (modal) {
      modal.style.display = 'none';
      document.getElementById('manualName').value = '';
      document.getElementById('manualCalories').value = '';
    }
  }

  /**
   * Confirme l'ajout manuel
   */
  async confirmManualAdd() {
    const name = document.getElementById('manualName').value.trim();
    const calories = parseInt(document.getElementById('manualCalories').value) || 0;
    
    if (!name) {
      this.app.showToast('Veuillez entrer un nom', 'error');
      return;
    }
    
    if (calories <= 0) {
      this.app.showToast('Veuillez entrer des calories valides', 'error');
      return;
    }
    
    // Prépare l'entrée
    const entry = {
      date: this.selectedDay,
      repas: this.getMealName(this.selectedMeal),
      type: 'manuel',
      reference: name,
      quantite: 1,
      kcal: calories
    };
    
    try {
      // Ajoute au journal
      await window.SheetsAPI.addJournalEntry(entry);
      
      // Recharge les données
      await this.loadWeekData();
      this.updateWeekView();
      
      // Ferme les modals
      this.closeManualModal();
      this.closeAddModal();
      
      // Rouvre la modal du jour
      this.openDayModal(this.selectedDay);
      
      this.app.showToast('Entrée manuelle ajoutée !', 'success');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout manuel:', error);
      this.app.showToast('Erreur lors de l\'ajout', 'error');
    }
  }

  /**
   * Ouvre la modal de note
   */
  openNoteModal(date, mealType, existingNote = '') {
    this.selectedDay = date;
    this.selectedMeal = mealType;
    
    const modal = document.getElementById('noteModal');
    const title = document.getElementById('noteModalTitle');
    const textarea = document.getElementById('noteTextarea');
    
    if (!modal || !title || !textarea) return;
    
    // Met à jour le titre
    const mealNames = {
      'petit-déjeuner': 'petit-déjeuner',
      'déjeuner': 'déjeuner',
      'dîner': 'dîner',
      'collation': 'collations'
    };
    
    title.textContent = `Note pour le ${mealNames[mealType]}`;
    textarea.value = existingNote;
    
    // Affiche la modal
    modal.style.display = 'flex';
    
    // Focus sur le textarea
    setTimeout(() => {
      textarea.focus();
    }, 100);
  }

  /**
   * Ferme la modal de note
   */
  closeNoteModal() {
    const modal = document.getElementById('noteModal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Sauvegarde la note
   */
  async saveNote() {
    const noteText = document.getElementById('noteTextarea').value.trim();
    
    try {
      // Trouve les entrées du repas
      const dayData = this.weekData.find(d => d.date === this.selectedDay);
      if (!dayData) return;
      
      const mealName = this.getMealName(this.selectedMeal);
      const mealEntries = dayData.entries.filter(e => 
        e.repas.toLowerCase() === mealName.toLowerCase()
      );
      
      // Si pas d'entrées et pas de note, on ne fait rien
      if (mealEntries.length === 0 && !noteText) {
        this.closeNoteModal();
        return;
      }
      
      // Si pas d'entrées mais une note, on crée une entrée spéciale
      if (mealEntries.length === 0 && noteText) {
        const entry = {
          date: this.selectedDay,
          repas: mealName,
          type: 'note',
          reference: 'Note seule',
          quantite: 0,
          kcal: 0,
          note: noteText
        };
        
        await window.SheetsAPI.addJournalEntry(entry);
      } else {
        // Met à jour la première entrée du repas avec la note
        // Dans un vrai cas, il faudrait une méthode updateJournalEntry
        this.app.showToast('Mise à jour des notes en cours de développement', 'info');
      }
      
      // Recharge les données
      await this.loadWeekData();
      this.updateWeekView();
      
      // Ferme la modal
      this.closeNoteModal();
      
      // Rouvre la modal du jour
      this.openDayModal(this.selectedDay);
      
      this.app.showToast('Note enregistrée !', 'success');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note:', error);
      this.app.showToast('Erreur lors de la sauvegarde', 'error');
    }
  }

  /**
   * Supprime une entrée
   */
  async deleteEntry(entryId) {
    if (!confirm('Supprimer cet aliment ?')) return;
    
    try {
      await window.SheetsAPI.deleteJournalEntry(entryId);
      
      // Recharge les données
      await this.loadWeekData();
      this.updateWeekView();
      
      // Rafraîchit la modal du jour
      this.openDayModal(this.selectedDay);
      
      this.app.showToast('Aliment supprimé', 'success');
      
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.app.showToast('Erreur lors de la suppression', 'error');
    }
  }

  /**
   * Helpers
   */
  
  getDayName(date) {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  }
  
  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  
  getMealName(mealKey) {
    const mealNames = {
      'petit-déjeuner': 'Petit-déjeuner',
      'déjeuner': 'Déjeuner',
      'dîner': 'Dîner',
      'collation': 'Collation'
    };
    return mealNames[mealKey] || mealKey;
  }
  
  getItemName(entry) {
    if (!entry) return 'Inconnu';
    
    if (entry.type === 'manuel') {
      return entry.reference;
    }
    
    if (entry.type === 'recette') {
      const recette = this.allRecipes.find(r => r.numero === entry.reference);
      return recette?.intitule || entry.reference;
    }
    
    const ingredient = this.allIngredients.find(i => i.reference === entry.reference);
    return ingredient?.intitule || entry.reference;
  }
  
  getItemUnit(entry) {
    if (!entry) return '';
    if (entry.type === 'manuel') return '';
    if (entry.type === 'recette') return 'portion';
    
    const ingredient = this.allIngredients.find(i => i.reference === entry.reference);
    return ingredient?.unite || 'g';
  }
}

// Styles spécifiques au journal
const journalStyles = `
<style>
  .journal-page {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
  
  /* En-tête de semaine */
  .week-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-lg);
    background: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .week-info {
    text-align: center;
  }
  
  .week-info h2 {
    margin: 0;
    color: var(--color-text-dark);
    font-size: 1.25rem;
  }
  
  .week-info p {
    margin: 4px 0 0 0;
  }
  
  /* Grille de semaine */
  .week-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }
  
  @media (min-width: 768px) {
    .week-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  /* Carte jour */
  .day-card {
    background: white;
    border-radius: var(--radius-md);
    padding: var(--spacing-md);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    position: relative;
  }
  
  .day-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  
  .day-card.today {
    border: 2px solid var(--color-mint);
  }
  
  .day-card.has-data {
    background: linear-gradient(135deg, rgba(82, 209, 179, 0.05) 0%, rgba(255, 139, 148, 0.05) 100%);
  }
  
  .day-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--spacing-sm);
  }
  
  .day-name {
    font-weight: 700;
    color: var(--color-text);
    font-size: 0.875rem;
  }
  
  .day-number {
    font-size: 1.125rem;
    color: var(--color-text-dark);
  }
  
  .day-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  
  .day-total {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--color-mint);
  }
  
  .day-unit {
    font-size: 0.875rem;
    color: var(--color-text);
    margin-bottom: var(--spacing-xs);
  }
  
  .day-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-xs);
    width: 100%;
    font-size: 0.75rem;
    color: var(--color-text);
  }
  
  .day-empty {
    font-size: 1.25rem;
    color: var(--color-text-light);
  }
  
  .day-note-indicator {
    position: absolute;
    top: var(--spacing-sm);
    right: var(--spacing-sm);
    font-size: 0.875rem;
  }
  
  /* Modal large */
  .modal-large {
    max-width: 600px;
    max-height: 90vh;
  }
  
  .modal-small {
    max-width: 400px;
  }
  
  /* Barre de progression du jour */
  .day-progress {
    margin-bottom: var(--spacing-xl);
  }
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: var(--spacing-sm);
  }
  
  .progress-label {
    font-weight: 700;
    color: var(--color-text-dark);
  }
  
  .progress-max {
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .progress-container {
    position: relative;
    height: 24px;
  }
  
  .progress-track {
    height: 100%;
    background: rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-full);
    overflow: hidden;
    position: relative;
  }
  
  .progress-fill {
    height: 100%;
    transition: all 0.3s ease;
    border-radius: var(--radius-full);
  }
  
  .progress-marker {
    position: absolute;
    top: -8px;
    bottom: -8px;
    width: 2px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .marker-line {
    flex: 1;
    width: 2px;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .marker-label {
    font-size: 0.75rem;
    color: var(--color-text);
    margin-top: 4px;
  }
  
  /* Section repas */
  .meal-section {
    background: white;
    border-radius: var(--radius-md);
    border: 1px solid rgba(0, 0, 0, 0.1);
    margin-bottom: var(--spacing-md);
    overflow: hidden;
  }
  
  .meal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .meal-header h3 {
    margin: 0;
    font-size: 1rem;
    color: var(--color-text-dark);
  }
  
  .meal-total {
    font-weight: 700;
    color: var(--color-mint);
  }
  
  .meal-content {
    padding: var(--spacing-md);
  }
  
  .meal-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  .meal-item:last-of-type {
    border-bottom: none;
  }
  
  .item-info {
    flex: 1;
  }
  
  .item-name {
    display: block;
    color: var(--color-text-dark);
    font-weight: 500;
  }
  
  .item-quantity {
    display: block;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .item-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }
  
  .item-calories {
    font-weight: 700;
    color: var(--color-mint);
    font-size: 0.875rem;
  }
  
  .meal-empty {
    text-align: center;
    color: var(--color-text-light);
    font-style: italic;
    margin: var(--spacing-md) 0;
  }
  
  .meal-note {
    background: rgba(82, 209, 179, 0.1);
    padding: var(--spacing-sm);
    border-radius: var(--radius-sm);
    margin: var(--spacing-md) 0;
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .meal-actions {
    display: flex;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
  }
  
  /* Recherche */
  .search-container {
    margin-bottom: var(--spacing-md);
  }
  
  .filter-tabs {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .filter-tab {
    padding: var(--spacing-sm) var(--spacing-md);
    background: rgba(0, 0, 0, 0.05);
    border: none;
    border-radius: var(--radius-full);
    color: var(--color-text);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }
  
  .filter-tab.active {
    background: var(--color-mint);
    color: white;
  }
  
  .search-results {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: var(--spacing-md);
  }
  
  .search-result {
    padding: var(--spacing-md);
    background: rgba(0, 0, 0, 0.02);
    border-radius: var(--radius-sm);
    margin-bottom: var(--spacing-sm);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .search-result:hover {
    background: rgba(82, 209, 179, 0.1);
  }
  
  .result-name {
    font-weight: 500;
    color: var(--color-text-dark);
    margin-bottom: 4px;
  }
  
  .result-info {
    font-size: 0.875rem;
    color: var(--color-text);
  }
  
  .no-results {
    text-align: center;
    color: var(--color-text-light);
    padding: var(--spacing-xl);
  }
  
  /* Sélection quantité */
  .selection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  }
  
  .selection-header h3 {
    margin: 0;
    color: var(--color-text-dark);
  }
  
  .quantity-controls {
    background: rgba(0, 0, 0, 0.02);
    padding: var(--spacing-md);
    border-radius: var(--radius-sm);
  }
  
  .quantity-input-group {
    display: flex;
    gap: var(--spacing-sm);
    margin: var(--spacing-sm) 0;
  }
  
  .quantity-input {
    flex: 1;
  }
  
  .unit-select {
    width: 100px;
  }
  
  .quantity-presets {
    display: flex;
    gap: var(--spacing-sm);
    margin: var(--spacing-md) 0;
  }
  
  .preset-btn {
    flex: 1;
    padding: var(--spacing-sm);
    background: white;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .preset-btn:hover {
    background: rgba(82, 209, 179, 0.1);
    border-color: var(--color-mint);
  }
  
  .calories-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }
  
  .calories-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-mint);
  }
  
  /* Note */
  .note-textarea {
    width: 100%;
    resize: vertical;
    min-height: 100px;
  }
  
  /* Utils */
  .btn-text {
    background: none;
    border: none;
    color: var(--color-mint);
    cursor: pointer;
    text-decoration: underline;
  }
  
  .no-data {
    grid-column: 1 / -1;
    text-align: center;
    padding: var(--spacing-xl);
    color: var(--color-text-light);
  }
</style>
`;

// Ajoute les styles
if (!document.getElementById('journal-styles')) {
  const styleEl = document.createElement('div');
  styleEl.id = 'journal-styles';
  styleEl.innerHTML = journalStyles;
  document.head.appendChild(styleEl);
}

// Export pour l'utilisation globale
window.JournalPage = JournalPage;

// Instance globale pour les événements onclick
window.journalPage = null;
