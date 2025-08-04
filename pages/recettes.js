/**
 * recettes.js - Page de consultation et gestion des recettes
 * Affiche la liste des recettes avec leurs détails et gestion de la validation
 * Version: 1.4.2
 */

class RecettesPage {
  constructor(app) {
    this.app = app;
    this.recettes = [];
    this.filteredRecettes = [];
    this.searchQuery = '';
    this.selectedKcalRange = 'all';
    this.selectedPrixRange = 'all';
    this.menuOptions = { kcalRanges: [], prixRanges: [] };
    this.currentRecette = null;
    this.ingredients = []; // Pour la création de recettes
  }

  async init() {
    console.log('🍽️ Initialisation de la page Recettes');
    
    try {
      // Charge les options des menus déroulants
      await this.loadMenuOptions();
      
      // Charge les ingrédients (pour la création de recettes)
      await this.loadIngredients();
      
      // Charge les recettes depuis Sheets
      await this.loadRecettes();
      
      // Applique le filtre initial
      this.filterRecettes();
      
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
      this.app.showToast('Erreur lors du chargement des recettes', 'error');
    }
  }

  async loadMenuOptions() {
    try {
      if (this.app.modules.sheets && this.app.modules.sheets.readMenuOptions) {
        const options = await this.app.modules.sheets.readMenuOptions();
        this.menuOptions.kcalRanges = options.kcalRanges || [];
        this.menuOptions.prixRanges = options.prixRanges || [];
        console.log('✅ Options de filtres chargées:');
        console.log('  - Filtres kcal:', this.menuOptions.kcalRanges);
        console.log('  - Filtres prix:', this.menuOptions.prixRanges);
      } else {
        console.warn('⚠️ Impossible de charger les options depuis Sheets');
        // Valeurs par défaut
        this.menuOptions = {
          kcalRanges: ['moins de 500', '500 à 999', '1000 à 1499', 'plus de 1500'],
          prixRanges: ['moins de 1€', 'de 1 à 1,99 €', 'de 2 à 4,99 €', 'plus de 5 €']
        };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des menus:', error);
      // Valeurs par défaut
      this.menuOptions = {
        kcalRanges: ['moins de 500', '500 à 999', '1000 à 1499', 'plus de 1500'],
        prixRanges: ['moins de 1€', 'de 1 à 1,99 €', 'de 2 à 4,99 €', 'plus de 5 €']
      };
    }
  }

  async loadIngredients() {
    try {
      this.ingredients = await this.app.modules.sheets.readIngredients();
      // Trie les ingrédients par ordre alphabétique
      this.ingredients.sort((a, b) => a.intitule.localeCompare(b.intitule));
      console.log(`✅ ${this.ingredients.length} ingrédients disponibles`);
    } catch (error) {
      console.error('Erreur lors du chargement des ingrédients:', error);
      this.ingredients = [];
    }
  }

  async loadRecettes() {
    try {
      this.recettes = await this.app.modules.sheets.readRecipes();
      console.log(`✅ ${this.recettes.length} recettes chargées`);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Pas de données de démo, liste vide
      this.recettes = [];
      this.app.showToast('Impossible de charger les recettes', 'error');
    }
  }

  filterRecettes() {
    const query = this.searchQuery.toLowerCase();
    
    this.filteredRecettes = this.recettes.filter(recette => {
      // Filtre par recherche
      if (query) {
        const matchName = recette.intitule.toLowerCase().includes(query);
        const matchIngredients = recette.ingredients.some(ing => 
          ing.nom.toLowerCase().includes(query)
        );
        if (!matchName && !matchIngredients) return false;
      }
      
      // Filtre par calories
      if (this.selectedKcalRange !== 'all') {
        const kcal = recette.kcalTotal;
        if (!this.matchesKcalRange(kcal, this.selectedKcalRange)) return false;
      }
      
      // Filtre par prix
      if (this.selectedPrixRange !== 'all') {
        const prix = recette.prixTotal;
        if (!this.matchesPrixRange(prix, this.selectedPrixRange)) return false;
      }
      
      return true;
    });
    
    // Trie par nom alphabétique
    this.filteredRecettes.sort((a, b) => 
      a.intitule.localeCompare(b.intitule)
    );
  }

  matchesKcalRange(kcal, range) {
    // Formats spécifiques en français
    if (range.includes('moins de 500')) return kcal < 500;
    if (range.includes('500 à 999')) return kcal >= 500 && kcal <= 999;
    if (range.includes('1000 à 1499')) return kcal >= 1000 && kcal <= 1499;
    if (range.includes('plus de 1500')) return kcal >= 1500;
    
    // Formats génériques au cas où
    // "moins de X"
    const matchMoins = range.match(/moins de (\d+)/);
    if (matchMoins) {
      const max = parseInt(matchMoins[1]);
      return kcal < max;
    }
    
    // "plus de X"
    const matchPlus = range.match(/plus de (\d+)/);
    if (matchPlus) {
      const min = parseInt(matchPlus[1]);
      return kcal >= min;
    }
    
    // "X à Y"
    const matchRange = range.match(/(\d+) à (\d+)/);
    if (matchRange) {
      const min = parseInt(matchRange[1]);
      const max = parseInt(matchRange[2]);
      return kcal >= min && kcal <= max;
    }
    
    // Si on ne reconnaît pas le format, on ne filtre pas
    console.warn('Format de filtre kcal non reconnu:', range);
    return true;
  }

  matchesPrixRange(prix, range) {
    // Formats spécifiques en français avec virgules décimales
    if (range.includes('moins de 1€')) return prix < 1;
    if (range.includes('de 1 à 1,99 €')) return prix >= 1 && prix <= 1.99;
    if (range.includes('de 2 à 4,99 €')) return prix >= 2 && prix <= 4.99;
    if (range.includes('plus de 5 €')) return prix >= 5;
    
    // Formats génériques au cas où
    // "moins de X€"
    const matchMoins = range.match(/moins de ([\d,]+)/);
    if (matchMoins) {
      const max = parseFloat(matchMoins[1].replace(',', '.'));
      return prix < max;
    }
    
    // "plus de X €"
    const matchPlus = range.match(/plus de ([\d,]+)/);
    if (matchPlus) {
      const min = parseFloat(matchPlus[1].replace(',', '.'));
      return prix >= min;
    }
    
    // "de X à Y €" avec virgules décimales
    const matchRange = range.match(/de ([\d,]+) à ([\d,]+)/);
    if (matchRange) {
      const min = parseFloat(matchRange[1].replace(',', '.'));
      const max = parseFloat(matchRange[2].replace(',', '.'));
      return prix >= min && prix <= max;
    }
    
    // Si on ne reconnaît pas le format, on ne filtre pas
    console.warn('Format de filtre prix non reconnu:', range);
    return true;
  }

  render() {
    return `
      <div class="page recettes-page">
        <!-- Header avec recherche -->
        <div class="search-header">
          <div class="header-row">
            <h1 class="page-title">Recettes</h1>
            <button class="btn btn-primary btn-small" id="add-recette">
              Ajouter
            </button>
          </div>
          
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher une recette..."
              value="${this.searchQuery}"
              id="search-recettes"
            >
            <i class="search-icon">🔍</i>
          </div>
          
          <!-- Filtres -->
          <div class="filters-container">
            <select class="filter-select" id="kcal-filter">
              <option value="all">Toutes les calories</option>
              ${this.menuOptions.kcalRanges.map(range => `
                <option value="${range}" ${this.selectedKcalRange === range ? 'selected' : ''}>
                  ${range}
                </option>
              `).join('')}
            </select>
            
            <select class="filter-select" id="prix-filter">
              <option value="all">Tous les prix</option>
              ${this.menuOptions.prixRanges.map(range => `
                <option value="${range}" ${this.selectedPrixRange === range ? 'selected' : ''}>
                  ${range}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Nombre de résultats -->
        <div class="results-count">
          ${this.filteredRecettes.length} recette${this.filteredRecettes.length > 1 ? 's' : ''} trouvée${this.filteredRecettes.length > 1 ? 's' : ''}
        </div>

        <!-- Liste des recettes -->
        <div class="recettes-list">
          ${this.renderRecettesList()}
        </div>
      </div>

      <!-- Modal pour les détails/édition -->
      <div class="modal" id="recette-modal">
        <div class="modal-content modal-large">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">Détails de la recette</h2>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <div class="modal-body" id="modal-body">
            <!-- Le contenu sera injecté dynamiquement -->
          </div>
        </div>
      </div>

      <style>
        .recettes-page {
          padding-bottom: 80px;
        }

        .search-header {
          background: white;
          position: sticky;
          top: 0;
          z-index: 10;
          padding: 15px 15px 10px;
          border-bottom: 1px solid #f0f0f0;
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .search-container {
          position: relative;
          margin-bottom: 12px;
        }

        .search-input {
          width: 100%;
          padding: 12px 45px 12px 16px;
          border: 2px solid #eee;
          border-radius: 25px;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--color-mint);
          box-shadow: 0 0 0 3px rgba(82, 209, 179, 0.1);
        }

        .search-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
          pointer-events: none;
        }

        .filters-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 4px;
        }

        .filter-select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #eee;
          border-radius: 20px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: var(--color-mint);
        }

        .results-count {
          padding: 8px 20px;
          font-size: 14px;
          color: #666;
          background: #fafafa;
        }

        .recettes-list {
          padding: 10px;
        }

        .recette-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
        }

        .recette-card:active {
          transform: scale(0.98);
        }

        .recette-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .recette-name {
          font-weight: 600;
          color: #333;
          font-size: 18px;
          flex: 1;
          margin-right: 12px;
        }

        .recette-validation {
          position: absolute;
          top: 12px;
          right: 12px;
          color: var(--color-mint);
          font-size: 20px;
        }

        .recette-kcal {
          background: var(--color-peach);
          color: var(--color-coral);
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          margin-right: 32px;
        }

        .recette-details {
          font-size: 14px;
          color: #666;
          margin-top: 4px;
        }

        .recette-portions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          margin-right: 16px;
        }

        .recette-prix {
          color: var(--color-mint);
          font-weight: 500;
        }

        .recette-ingredients-preview {
          font-size: 13px;
          color: #999;
          margin-top: 8px;
          font-style: italic;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state-text {
          color: #666;
          font-size: 16px;
        }

        /* Modal spécifique pour recettes */
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }

        .modal.show {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: white;
          border-radius: 20px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
          animation: modalSlideIn 0.3s ease-out;
        }

        .modal-large {
          max-width: 500px;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
        }

        .modal-body {
          padding: 20px;
        }

        .validation-section {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f0f8f5;
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .validation-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .validation-label {
          font-weight: 500;
          color: #333;
          cursor: pointer;
        }

        .ingredients-list {
          background: #f8f8f8;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
        }

        .ingredients-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .ingredient-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e0e0e0;
        }

        .ingredient-item:last-child {
          border-bottom: none;
        }

        .ingredient-name {
          flex: 1;
          color: #555;
        }

        .ingredient-quantity {
          color: #888;
          margin-right: 12px;
        }

        .ingredient-kcal {
          color: var(--color-coral);
          font-weight: 500;
          min-width: 60px;
          text-align: right;
        }

        .instructions-section {
          background: #f0f8f5;
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
        }

        .instructions-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .instructions-text {
          color: #555;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 16px 0;
        }

        .info-box {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 12px;
          text-align: center;
        }

        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .info-value.kcal {
          color: var(--color-coral);
        }

        .info-value.price {
          color: var(--color-mint);
        }

        /* Formulaire de création */
        .form-section {
          margin-bottom: 20px;
        }

        .form-section-title {
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .ingredient-input-row {
          display: grid;
          grid-template-columns: 1fr 80px 60px 40px;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }

        .btn-remove-ingredient {
          background: #ff6b6b;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px;
          cursor: pointer;
          font-size: 16px;
        }

        .btn-add-ingredient {
          background: var(--color-mint);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 8px;
        }

        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #eee;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }

        .form-textarea:focus {
          outline: none;
          border-color: var(--color-mint);
        }

        .form-input {
          width: 100%;
          padding: 10px 14px;
          border: 2px solid #eee;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-mint);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 6px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions .btn {
          flex: 1;
        }
      </style>
    `;
  }

  renderRecettesList() {
    if (this.filteredRecettes.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <div class="empty-state-text">
            ${this.searchQuery ? 'Aucune recette trouvée' : 'Aucune recette disponible'}
          </div>
        </div>
      `;
    }

    return this.filteredRecettes.map(recette => {
      // Prépare un aperçu des ingrédients
      const ingredientsPreview = recette.ingredients
        .slice(0, 3)
        .map(ing => ing.nom)
        .join(', ');
      const moreIngredients = recette.ingredients.length > 3 ? '...' : '';
      
      return `
        <div class="recette-card" data-id="${recette.id}">
          ${recette.validation ? '<span class="recette-validation">✔</span>' : ''}
          <div class="recette-header">
            <div class="recette-name">${recette.intitule}</div>
            <div class="recette-kcal">${Math.round(recette.kcalTotal)} kcal</div>
          </div>
          <div class="recette-details">
            <span class="recette-portions">
              <span>👥</span>
              <span>${recette.portion} portion${recette.portion > 1 ? 's' : ''}</span>
            </span>
            <span class="recette-prix">${recette.prixTotal ? recette.prixTotal.toFixed(2) + '€' : '-'}</span>
            <span> • ${recette.ingredients.length} ingrédients</span>
          </div>
          <div class="recette-ingredients-preview">
            ${ingredientsPreview}${moreIngredients}
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents() {
    // Recherche
    const searchInput = document.getElementById('search-recettes');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterRecettes();
        this.updateRecettesList();
      });
    }

    // Filtre de calories
    const kcalFilter = document.getElementById('kcal-filter');
    if (kcalFilter) {
      kcalFilter.addEventListener('change', (e) => {
        console.log('Changement filtre kcal:', e.target.value);
        this.selectedKcalRange = e.target.value;
        this.filterRecettes();
        this.updateRecettesList();
      });
    }

    // Filtre de prix
    const prixFilter = document.getElementById('prix-filter');
    if (prixFilter) {
      prixFilter.addEventListener('change', (e) => {
        console.log('Changement filtre prix:', e.target.value);
        this.selectedPrixRange = e.target.value;
        this.filterRecettes();
        this.updateRecettesList();
      });
    }

    // Bouton ajouter
    const addBtn = document.getElementById('add-recette');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showRecetteModal(null);
      });
    }

    // Click sur une recette
    this.attachRecetteEvents();

    // Modal
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    const modal = document.getElementById('recette-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }
  }

  attachRecetteEvents() {
    document.querySelectorAll('.recette-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const recette = this.recettes.find(r => r.id === id);
        if (recette) {
          this.showRecetteModal(recette);
        }
      });
    });
  }

  updateRecettesList() {
    const listContainer = document.querySelector('.recettes-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderRecettesList();
      // Réattache les événements sur les nouvelles cartes
      this.attachRecetteEvents();
    }

    // Met à jour le compteur
    const countElement = document.querySelector('.results-count');
    if (countElement) {
      countElement.textContent = `${this.filteredRecettes.length} recette${this.filteredRecettes.length > 1 ? 's' : ''} trouvée${this.filteredRecettes.length > 1 ? 's' : ''}`;
    }
  }

  showRecetteModal(recette) {
    this.currentRecette = recette;
    const modal = document.getElementById('recette-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = recette ? 'Détails de la recette' : 'Nouvelle recette';

    if (recette) {
      // Mode visualisation
      const kcalPerPortion = recette.portion > 0 ? Math.round(recette.kcalTotal / recette.portion) : 0;
      const prixPerPortion = recette.portion > 0 ? (recette.prixTotal / recette.portion).toFixed(2) : '0.00';
      
      modalBody.innerHTML = `
        <div id="view-mode">
          <h3 style="margin: 0 0 16px 0; font-size: 22px;">${recette.intitule}</h3>
          
          <!-- Section validation -->
          <div class="validation-section">
            <input type="checkbox" id="validation-checkbox" class="validation-checkbox" 
                   ${recette.validation ? 'checked' : ''}>
            <label for="validation-checkbox" class="validation-label">
              Recette validée
            </label>
          </div>

          <!-- Informations générales -->
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Portions</div>
              <div class="info-value">${recette.portion}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Poids total</div>
              <div class="info-value">${recette.poids || 0}g</div>
            </div>
            <div class="info-box">
              <div class="info-label">Calories totales</div>
              <div class="info-value kcal">${Math.round(recette.kcalTotal)}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Prix total</div>
              <div class="info-value price">${recette.prixTotal ? recette.prixTotal.toFixed(2) + '€' : '-'}</div>
            </div>
          </div>

          <!-- Par portion -->
          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Calories / portion</div>
              <div class="info-value kcal">${kcalPerPortion}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Prix / portion</div>
              <div class="info-value price">${prixPerPortion}€</div>
            </div>
          </div>

          <!-- Liste des ingrédients -->
          <div class="ingredients-list">
            <div class="ingredients-title">Ingrédients (${recette.ingredients.length})</div>
            ${recette.ingredients.map(ing => `
              <div class="ingredient-item">
                <span class="ingredient-name">${ing.nom}</span>
                <span class="ingredient-quantity">${ing.quantite} ${ing.unite}</span>
                <span class="ingredient-kcal">${Math.round(ing.kcal)} kcal</span>
              </div>
            `).join('')}
          </div>

          <!-- Instructions -->
          ${recette.instructions ? `
            <div class="instructions-section">
              <div class="instructions-title">Instructions</div>
              <div class="instructions-text">${recette.instructions}</div>
            </div>
          ` : ''}

          <div class="modal-actions">
            <button class="btn btn-primary" id="btn-edit-recette">
              Modifier
            </button>
            <button class="btn btn-secondary" id="btn-close-view">
              Fermer
            </button>
          </div>
        </div>
      `;
      
      // Attache les événements aux boutons
      setTimeout(() => {
        const btnEdit = document.getElementById('btn-edit-recette');
        if (btnEdit) {
          btnEdit.addEventListener('click', () => this.editRecette());
        }
        
        const btnClose = document.getElementById('btn-close-view');
        if (btnClose) {
          btnClose.addEventListener('click', () => this.hideModal());
        }

        // Gestion de la checkbox de validation
        const validationCheckbox = document.getElementById('validation-checkbox');
        if (validationCheckbox) {
          validationCheckbox.addEventListener('change', async (e) => {
            await this.updateRecetteValidation(recette, e.target.checked);
          });
        }
      }, 0);
    } else {
      // Mode création
      this.showEditForm(null);
    }

    modal.classList.add('show');
  }

  async updateRecetteValidation(recette, isValidated) {
    try {
      // Met à jour la validation
      recette.validation = isValidated;
      
      // Sauvegarde dans Sheets
      await this.app.modules.sheets.updateRecipe(recette.id, recette);
      
      // Recharge les données pour rafraîchir l'affichage
      await this.loadRecettes();
      this.filterRecettes();
      this.updateRecettesList();
      
      this.app.showToast(
        isValidated ? 'Recette validée !' : 'Validation retirée', 
        'success'
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la validation:', error);
      this.app.showToast('Erreur lors de la mise à jour', 'error');
    }
  }

  editRecette() {
    if (this.currentRecette) {
      this.showEditForm(this.currentRecette);
    }
  }

  showEditForm(recette) {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    modalTitle.textContent = recette ? 'Modifier la recette' : 'Nouvelle recette';
    
    // Pour la création, initialise avec des valeurs par défaut
    const formData = recette || {
      intitule: '',
      portion: 1,
      instructions: '',
      validation: false,
      ingredients: []
    };
    
    modalBody.innerHTML = `
      <form id="recette-form">
        <!-- Informations de base -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Nom de la recette *</label>
            <input type="text" class="form-input" id="input-intitule" 
                   value="${formData.intitule}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre de portions *</label>
            <input type="number" class="form-input" id="input-portions" 
                   value="${formData.portion}" required min="1" step="1">
          </div>
          
          <div class="validation-section">
            <input type="checkbox" id="input-validation" class="validation-checkbox" 
                   ${formData.validation ? 'checked' : ''}>
            <label for="input-validation" class="validation-label">
              Recette validée
            </label>
          </div>
        </div>

        <!-- Ingrédients -->
        <div class="form-section">
          <div class="form-section-title">Ingrédients</div>
          <div id="ingredients-container">
            ${formData.ingredients.length > 0 ? 
              formData.ingredients.map((ing, index) => this.renderIngredientRow(ing, index)).join('') :
              this.renderIngredientRow(null, 0)
            }
          </div>
          <button type="button" class="btn-add-ingredient" id="btn-add-ingredient-row">
            + Ajouter un ingrédient
          </button>
        </div>

        <!-- Instructions -->
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Instructions</label>
            <textarea class="form-textarea" id="input-instructions" 
                      placeholder="Décrivez les étapes de préparation...">${formData.instructions || ''}</textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            ${recette ? 'Enregistrer' : 'Créer'}
          </button>
          <button type="button" class="btn btn-secondary" id="btn-cancel-form">
            Annuler
          </button>
        </div>
      </form>
    `;

    // Attache les événements
    this.attachFormEvents();
  }

  renderIngredientRow(ingredient, index) {
    // Trie les ingrédients par ordre alphabétique
    const ingredientOptions = this.ingredients.map(ing => 
      `<option value="${ing.reference}" ${ingredient && ingredient.ref === ing.reference ? 'selected' : ''}>
        ${ing.intitule}
      </option>`
    ).join('');

    return `
      <div class="ingredient-input-row" data-index="${index}">
        <select class="form-input ingredient-select" required>
          <option value="">Sélectionner...</option>
          ${ingredientOptions}
        </select>
        <input type="number" class="form-input ingredient-quantity" 
               value="${ingredient ? ingredient.quantite : ''}" 
               placeholder="Qté" required min="0" step="0.1">
        <input type="text" class="form-input ingredient-unit" 
               value="${ingredient ? ingredient.unite : ''}" 
               placeholder="Unité" required>
        <button type="button" class="btn-remove-ingredient" data-index="${index}">✕</button>
      </div>
    `;
  }

  attachFormEvents() {
    // Soumission du formulaire
    const form = document.getElementById('recette-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveRecette();
    });

    // Bouton annuler
    const btnCancel = document.getElementById('btn-cancel-form');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.hideModal());
    }

    // Ajouter un ingrédient
    const btnAddIngredient = document.getElementById('btn-add-ingredient-row');
    if (btnAddIngredient) {
      btnAddIngredient.addEventListener('click', () => {
        const container = document.getElementById('ingredients-container');
        const index = container.children.length;
        const newRow = document.createElement('div');
        newRow.innerHTML = this.renderIngredientRow(null, index);
        container.appendChild(newRow.firstElementChild);
        this.attachIngredientRowEvents();
      });
    }

    // Events sur les lignes d'ingrédients
    this.attachIngredientRowEvents();
  }

  attachIngredientRowEvents() {
    // Boutons supprimer
    document.querySelectorAll('.btn-remove-ingredient').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.ingredient-input-row');
        if (document.querySelectorAll('.ingredient-input-row').length > 1) {
          row.remove();
        } else {
          this.app.showToast('Une recette doit avoir au moins un ingrédient', 'warning');
        }
      });
    });
  }

  async saveRecette() {
    const formData = {
      intitule: document.getElementById('input-intitule').value,
      portion: parseInt(document.getElementById('input-portions').value) || 1,
      instructions: document.getElementById('input-instructions').value,
      validation: document.getElementById('input-validation').checked,
      ingredients: []
    };

    // Collecte les ingrédients
    const ingredientRows = document.querySelectorAll('.ingredient-input-row');
    ingredientRows.forEach(row => {
      const select = row.querySelector('.ingredient-select');
      const quantity = row.querySelector('.ingredient-quantity');
      const unit = row.querySelector('.ingredient-unit');
      
      if (select.value && quantity.value) {
        formData.ingredients.push({
          ref: select.value,
          quantite: parseFloat(quantity.value),
          unite: unit.value
        });
      }
    });

    // Validation
    if (!formData.intitule) {
      this.app.showToast('Le nom de la recette est obligatoire', 'error');
      return;
    }

    if (formData.ingredients.length === 0) {
      this.app.showToast('Ajoutez au moins un ingrédient', 'error');
      return;
    }

    try {
      if (this.currentRecette) {
        // Mode édition
        formData.numero = this.currentRecette.numero;
        await this.app.modules.sheets.updateRecipe(this.currentRecette.id, formData);
        this.app.showToast('Recette mise à jour avec succès', 'success');
      } else {
        // Mode création
        await this.app.modules.sheets.addRecipe(formData);
        this.app.showToast('Recette créée avec succès', 'success');
      }
      
      // Recharge les données
      await this.loadRecettes();
      this.filterRecettes();
      this.updateRecettesList();
      
      this.hideModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.app.showToast('Erreur lors de la sauvegarde', 'error');
    }
  }

  hideModal() {
    const modal = document.getElementById('recette-modal');
    modal.classList.remove('show');
    this.currentRecette = null;
  }
}

// Export global
window.RecettesPage = RecettesPage;
