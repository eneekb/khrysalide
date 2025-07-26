/**
 * recettes.js - Page de consultation et gestion des recettes
 * Affiche la liste des recettes avec leurs détails
 * Version: 1.4.0
 */

class RecettesPage {
  constructor(app) {
    this.app = app;
    this.recettes = [];
    this.filteredRecettes = [];
    this.searchQuery = '';
    this.currentRecette = null;
    this.ingredients = []; // Pour la création de recettes
  }

  async init() {
    console.log('🍽️ Initialisation de la page Recettes');
    
    try {
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

  async loadIngredients() {
    try {
      this.ingredients = await this.app.modules.sheets.readIngredients();
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
      // Données de démonstration en cas d'erreur
      this.recettes = this.getDemoRecettes();
    }
  }

  filterRecettes() {
    const query = this.searchQuery.toLowerCase();
    
    if (!query) {
      this.filteredRecettes = [...this.recettes];
    } else {
      this.filteredRecettes = this.recettes.filter(recette => {
        // Recherche dans le nom
        if (recette.intitule.toLowerCase().includes(query)) return true;
        
        // Recherche dans les ingrédients
        return recette.ingredients.some(ing => 
          ing.nom.toLowerCase().includes(query)
        );
      });
    }
    
    // Trie par nom
    this.filteredRecettes.sort((a, b) => 
      a.intitule.localeCompare(b.intitule)
    );
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

        .recette-kcal {
          background: var(--color-peach);
          color: var(--color-coral);
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
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
        .modal-large {
          max-width: 500px;
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
          <div class="recette-header">
            <div class="recette-name">${recette.intitule}</div>
            <div class="recette-kcal">${Math.round(recette.kcalTotal)} kcal</div>
          </div>
          <div class="recette-details">
            <span class="recette-portions">
              <span>👥</span>
              <span>${recette.portion} portion${recette.portion > 1 ? 's' : ''}</span>
            </span>
            <span>${recette.ingredients.length} ingrédients</span>
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

    modalTitle.textContent = recette ? recette.intitule : 'Nouvelle recette';

    if (recette) {
      // Mode visualisation
      const kcalPerPortion = recette.portion > 0 ? Math.round(recette.kcalTotal / recette.portion) : 0;
      const prixPerPortion = recette.portion > 0 ? (recette.prixTotal / recette.portion).toFixed(2) : '0.00';
      
      modalBody.innerHTML = `
        <div id="view-mode">
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
      }, 0);
    } else {
      // Mode création
      this.showEditForm(null);
    }

    modal.classList.add('show');
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
    // TODO: Implémenter la sauvegarde dans sheets-api.js
    this.app.showToast('Sauvegarde des recettes non encore implémentée', 'warning');
    this.hideModal();
  }

  hideModal() {
    const modal = document.getElementById('recette-modal');
    modal.classList.remove('show');
    this.currentRecette = null;
  }

  updateRecettesList() {
    const listContainer = document.querySelector('.recettes-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderRecettesList();
      this.attachRecetteEvents();
    }

    const countElement = document.querySelector('.results-count');
    if (countElement) {
      countElement.textContent = `${this.filteredRecettes.length} recette${this.filteredRecettes.length > 1 ? 's' : ''} trouvée${this.filteredRecettes.length > 1 ? 's' : ''}`;
    }
  }

  getDemoRecettes() {
    return [
      {
        id: 1,
        numero: 'R001',
        intitule: 'Salade de tomates mozza',
        portion: 2,
        instructions: 'Couper les tomates et la mozzarella en tranches. Alterner sur une assiette. Arroser d\'huile d\'olive et de vinaigre balsamique.',
        poids: 400,
        kcalTotal: 320,
        prixTotal: 4.50,
        ingredients: [
          { ref: 'LEG04', nom: 'Tomate', quantite: 300, unite: 'g', kcal: 54, prix: 1.50 },
          { ref: 'LAI02', nom: 'Mozzarella', quantite: 125, unite: 'g', kcal: 266, prix: 3.00 }
        ]
      },
      {
        id: 2,
        numero: 'R002',
        intitule: 'Poulet grillé aux légumes',
        portion: 4,
        instructions: 'Faire griller le poulet. Faire revenir les légumes. Servir ensemble.',
        poids: 800,
        kcalTotal: 660,
        prixTotal: 12.00,
        ingredients: [
          { ref: 'VIA01', nom: 'Poulet', quantite: 400, unite: 'g', kcal: 660, prix: 8.00 },
          { ref: 'LEG01', nom: 'Carotte', quantite: 200, unite: 'g', kcal: 82, prix: 1.00 },
          { ref: 'LEG03', nom: 'Courgette', quantite: 200, unite: 'g', kcal: 34, prix: 2.00 }
        ]
      }
    ];
  }
}

// Export global
window.RecettesPage = RecettesPage;
