/**
 * aliments.js - Page de consultation et recherche des aliments
 * Affiche la liste des ingrédients avec recherche et filtres
 * Version: 1.4.2
 */

class AlimentsPage {
  constructor(app) {
    this.app = app;
    this.ingredients = [];
    this.filteredIngredients = [];
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedFournisseur = 'all';
    this.categories = new Set();
    this.fournisseurs = new Set();
    this.menuOptions = { categories: [], fournisseurs: [], unites: [], kcalRanges: [], prixRanges: [] };
    this.currentIngredient = null;
  }

  async init() {
    console.log('🥗 Initialisation de la page Aliments');
    
    try {
      // Charge les options des menus déroulants EN PREMIER
      await this.loadMenuOptions();
      
      // Charge les ingrédients depuis Sheets
      await this.loadIngredients();
      
      // Applique le filtre initial
      this.filterIngredients();
      
    } catch (error) {
      console.error('Erreur lors du chargement des aliments:', error);
      this.app.showToast('Erreur lors du chargement des aliments', 'error');
    }
  }

  async loadMenuOptions() {
    try {
      if (this.app.modules.sheets.readMenuOptions) {
        this.menuOptions = await this.app.modules.sheets.readMenuOptions();
        console.log('✅ Options de menus chargées:', this.menuOptions);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des menus:', error);
      // Valeurs par défaut
      this.menuOptions = {
        categories: ['Fruits', 'Légumes', 'Viandes', 'Produits laitiers'],
        fournisseurs: ['Bio Market', 'Primeur Local', 'Jardin Direct'],
        unites: ['g', 'kg', 'L', 'mL', 'pièce', 'pot', 'sachet'],
        kcalRanges: [],
        prixRanges: []
      };
    }
  }

  async loadIngredients() {
    try {
      this.ingredients = await this.app.modules.sheets.readIngredients();
      console.log(`✅ ${this.ingredients.length} ingrédients chargés`);
      
      // Construit les listes pour les filtres
      this.categories = new Set(['all']);
      this.fournisseurs = new Set(['all']);
      
      this.ingredients.forEach(ing => {
        if (ing.categorie) {
          this.categories.add(ing.categorie);
        }
        if (ing.fournisseur) {
          this.fournisseurs.add(ing.fournisseur);
        }
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Pas de données de démo, liste vide
      this.ingredients = [];
      this.categories = new Set(['all']);
      this.fournisseurs = new Set(['all']);
      this.app.showToast('Impossible de charger les aliments', 'error');
    }
  }

  filterIngredients() {
    const query = this.searchQuery.toLowerCase();
    
    this.filteredIngredients = this.ingredients.filter(ing => {
      // Filtre par catégorie
      if (this.selectedCategory !== 'all' && ing.categorie !== this.selectedCategory) {
        return false;
      }
      
      // Filtre par fournisseur
      if (this.selectedFournisseur !== 'all' && ing.fournisseur !== this.selectedFournisseur) {
        return false;
      }
      
      // Filtre par recherche
      if (query) {
        return ing.intitule.toLowerCase().includes(query) ||
               ing.categorie.toLowerCase().includes(query) ||
               ing.fournisseur.toLowerCase().includes(query);
      }
      
      return true;
    });
    
    // Trie par catégorie puis par nom
    this.filteredIngredients.sort((a, b) => {
      if (a.categorie !== b.categorie) {
        return a.categorie.localeCompare(b.categorie);
      }
      return a.intitule.localeCompare(b.intitule);
    });
  }

  render() {
    return `
      <div class="page aliments-page">
        <!-- Header avec recherche -->
        <div class="search-header">
          <div class="header-row">
            <h1 class="page-title">Aliments</h1>
            <button class="btn btn-primary btn-small" id="add-ingredient">
              Ajouter
            </button>
          </div>
          
          <div class="search-container">
            <input 
              type="text" 
              class="search-input" 
              placeholder="Rechercher un aliment..."
              value="${this.searchQuery}"
              id="search-aliments"
            >
            <i class="search-icon">🔍</i>
          </div>
          
          <!-- Filtres -->
          <div class="filters-container">
            <select class="filter-select" id="category-filter">
              <option value="all">Toutes les catégories</option>
              ${Array.from(this.categories).filter(cat => cat !== 'all').map(cat => `
                <option value="${cat}" ${this.selectedCategory === cat ? 'selected' : ''}>
                  ${cat}
                </option>
              `).join('')}
            </select>
            
            <select class="filter-select" id="fournisseur-filter">
              <option value="all">Tous les fournisseurs</option>
              ${Array.from(this.fournisseurs).filter(f => f !== 'all').map(f => `
                <option value="${f}" ${this.selectedFournisseur === f ? 'selected' : ''}>
                  ${f}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- Nombre de résultats -->
        <div class="results-count">
          ${this.filteredIngredients.length} aliment${this.filteredIngredients.length > 1 ? 's' : ''} trouvé${this.filteredIngredients.length > 1 ? 's' : ''}
        </div>

        <!-- Liste des aliments -->
        <div class="aliments-list">
          ${this.renderIngredientsList()}
        </div>
      </div>

      <!-- Modal pour les détails/édition -->
      <div class="modal" id="ingredient-modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-title">Détails de l'aliment</h2>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <div class="modal-body" id="modal-body">
            <!-- Le contenu sera injecté dynamiquement -->
          </div>
        </div>
      </div>

      <style>
        .aliments-page {
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

        .aliments-list {
          padding: 10px;
        }

        .ingredient-card {
          background: white;
          border-radius: 16px;
          padding: 12px 16px;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }

        .ingredient-card:active {
          transform: scale(0.98);
        }

        .ingredient-info {
          flex: 1;
          min-width: 0;
        }

        .ingredient-name {
          font-weight: 500;
          color: #333;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ingredient-details {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
          display: flex;
          gap: 8px;
        }

        .ingredient-price {
          color: var(--color-coral);
        }

        .ingredient-kcal {
          background: var(--color-peach);
          color: var(--color-coral);
          padding: 8px 10px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          white-space: nowrap;
          text-align: center;
          line-height: 1.2;
        }

        .ingredient-kcal small {
          display: block;
          font-size: 10px;
          font-weight: 400;
          opacity: 0.8;
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

        /* Modal */
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

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          color: #666;
          margin-bottom: 6px;
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

        .form-input:disabled {
          background: #f5f5f5;
          color: #999;
          cursor: not-allowed;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-row-3 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 12px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .modal-actions .btn {
          flex: 1;
        }

        .info-group {
          background: #f8f8f8;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 12px;
        }

        .info-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 2px;
        }

        .info-value {
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }

        .info-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
      </style>
    `;
  }

  renderIngredientsList() {
    if (this.filteredIngredients.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">
            ${this.searchQuery ? 'Aucun aliment trouvé' : 'Aucun aliment disponible'}
          </div>
        </div>
      `;
    }

    return this.filteredIngredients.map(ing => `
      <div class="ingredient-card" data-id="${ing.id}">
        <div class="ingredient-info">
          <div class="ingredient-name">${ing.intitule}</div>
          <div class="ingredient-details">
            ${ing.fournisseur ? `<span>${ing.fournisseur}</span>` : ''}
            ${ing.prix ? `<span class="ingredient-price">${ing.prix.toFixed(2)}€</span>` : ''}
          </div>
        </div>
        <div class="ingredient-kcal">
          ${Math.round(ing.kcal100g)}
          <small>Kcal/100g</small>
        </div>
      </div>
    `).join('');
  }

  attachEvents() {
    // Recherche
    const searchInput = document.getElementById('search-aliments');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.filterIngredients();
        this.updateIngredientsList();
      });
    }

    // Filtre de catégorie
    const categorySelect = document.getElementById('category-filter');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.filterIngredients();
        this.updateIngredientsList();
      });
    }

    // Filtre de fournisseur
    const fournisseurSelect = document.getElementById('fournisseur-filter');
    if (fournisseurSelect) {
      fournisseurSelect.addEventListener('change', (e) => {
        this.selectedFournisseur = e.target.value;
        this.filterIngredients();
        this.updateIngredientsList();
      });
    }

    // Bouton ajouter
    const addBtn = document.getElementById('add-ingredient');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.showIngredientModal(null);
      });
    }

    // Click sur un ingrédient
    this.attachIngredientEvents();

    // Modal
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', () => this.hideModal());
    }

    const modal = document.getElementById('ingredient-modal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }
  }

  attachIngredientEvents() {
    document.querySelectorAll('.ingredient-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id);
        const ingredient = this.ingredients.find(ing => ing.id === id);
        if (ingredient) {
          this.showIngredientModal(ingredient);
        }
      });
    });
  }

  updateIngredientsList() {
    const listContainer = document.querySelector('.aliments-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderIngredientsList();
      // Réattache les événements sur les nouvelles cartes
      this.attachIngredientEvents();
    }

    // Met à jour le compteur
    const countElement = document.querySelector('.results-count');
    if (countElement) {
      countElement.textContent = `${this.filteredIngredients.length} aliment${this.filteredIngredients.length > 1 ? 's' : ''} trouvé${this.filteredIngredients.length > 1 ? 's' : ''}`;
    }
  }

  async showIngredientModal(ingredient) {
    this.currentIngredient = ingredient;
    const modal = document.getElementById('ingredient-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');

    modalTitle.textContent = ingredient ? 'Détails de l\'aliment' : 'Nouvel aliment';

    if (ingredient) {
      // Mode visualisation/édition
      modalBody.innerHTML = `
        <div id="view-mode">
          <div class="info-row">
            <div class="info-group">
              <div class="info-label">Référence</div>
              <div class="info-value">${ingredient.reference || '-'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Catégorie</div>
              <div class="info-value">${ingredient.categorie || '-'}</div>
            </div>
          </div>

          <div class="info-group">
            <div class="info-label">Nom</div>
            <div class="info-value">${ingredient.intitule}</div>
          </div>

          <div class="info-group">
            <div class="info-label">Précisions</div>
            <div class="info-value">${ingredient.precisions || '-'}</div>
          </div>

          <div class="info-row">
            <div class="info-group">
              <div class="info-label">Calories/100g</div>
              <div class="info-value">${Math.round(ingredient.kcal100g)} kcal</div>
            </div>
            <div class="info-group">
              <div class="info-label">Prix</div>
              <div class="info-value">${ingredient.prix ? ingredient.prix.toFixed(2) + '€' : '-'}</div>
            </div>
          </div>

          <div class="info-group">
            <div class="info-label">Fournisseur</div>
            <div class="info-value">${ingredient.fournisseur || '-'}</div>
          </div>

          <div class="info-row">
            <div class="info-group">
              <div class="info-label">Conditionnement</div>
              <div class="info-value">${ingredient.conditionnement || '-'}</div>
            </div>
            <div class="info-group">
              <div class="info-label">Unité</div>
              <div class="info-value">${ingredient.unite || '-'}</div>
            </div>
          </div>

          <div class="info-group">
            <div class="info-label">Poids (g) / Unité</div>
            <div class="info-value">${ingredient.poidsParUnite || '-'}</div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-primary" id="btn-edit-ingredient">
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
        const btnEdit = document.getElementById('btn-edit-ingredient');
        if (btnEdit) {
          btnEdit.addEventListener('click', () => this.editIngredient());
        }
        
        const btnClose = document.getElementById('btn-close-view');
        if (btnClose) {
          btnClose.addEventListener('click', () => this.hideModal());
        }
      }, 0);
    } else {
      // Mode création - génère une nouvelle référence
      await this.showEditForm(null);
    }

    modal.classList.add('show');
  }

  editIngredient() {
    if (this.currentIngredient) {
      this.showEditForm(this.currentIngredient);
    }
  }

  async showEditForm(ingredient) {
    const modalBody = document.getElementById('modal-body');
    const modalTitle = document.getElementById('modal-title');
    
    // Change le titre selon le mode
    modalTitle.textContent = ingredient ? 'Modifier l\'aliment' : 'Nouvel aliment';
    
    // Génère une nouvelle référence si création
    let reference = ingredient ? ingredient.reference : '';
    if (!ingredient && this.app.modules.sheets.getNextReference) {
      try {
        reference = await this.app.modules.sheets.getNextReference();
      } catch (error) {
        console.error('Erreur lors de la génération de référence:', error);
        reference = Date.now().toString().slice(-4);
      }
    }
    
    modalBody.innerHTML = `
      <form id="ingredient-form">
        <div class="form-group">
          <label class="form-label">Référence</label>
          <input type="text" class="form-input" id="input-reference" 
                 value="${reference}" disabled>
        </div>

        <div class="form-group">
          <label class="form-label">Nom *</label>
          <input type="text" class="form-input" id="input-intitule" 
                 value="${ingredient ? ingredient.intitule : ''}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Précisions</label>
          <input type="text" class="form-input" id="input-precisions" 
                 value="${ingredient ? ingredient.precisions || '' : ''}">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Catégorie</label>
            <select class="form-input" id="input-categorie">
              <option value="">Sélectionner...</option>
              ${this.menuOptions.categories.map(cat => `
                <option value="${cat}" ${ingredient && ingredient.categorie === cat ? 'selected' : ''}>
                  ${cat}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fournisseur</label>
            <select class="form-input" id="input-fournisseur">
              <option value="">Sélectionner...</option>
              ${this.menuOptions.fournisseurs.map(f => `
                <option value="${f}" ${ingredient && ingredient.fournisseur === f ? 'selected' : ''}>
                  ${f}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Calories/100g *</label>
            <input type="number" class="form-input" id="input-kcal100g" 
                   value="${ingredient ? ingredient.kcal100g : ''}" required min="0" step="0.1">
          </div>
          <div class="form-group">
            <label class="form-label">Prix (€)</label>
            <input type="number" class="form-input" id="input-prix" 
                   value="${ingredient ? ingredient.prix : ''}" min="0" step="0.01">
          </div>
        </div>

        <div class="form-row-3">
          <div class="form-group">
            <label class="form-label">Conditionnement</label>
            <input type="text" class="form-input" id="input-conditionnement" 
                   value="${ingredient ? ingredient.conditionnement || '' : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Unité</label>
            <select class="form-input" id="input-unite">
              <option value="">Sélectionner...</option>
              ${this.menuOptions.unites ? this.menuOptions.unites.map(u => `
                <option value="${u}" ${ingredient && ingredient.unite === u ? 'selected' : ''}>
                  ${u}
                </option>
              `).join('') : ''}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Poids (g) / Unité</label>
          <input type="number" class="form-input" id="input-poids-unite" 
                 value="${ingredient ? ingredient.poidsParUnite || '' : ''}"
                 min="0" step="0.1">
        </div>

        <div class="modal-actions">
          <button type="submit" class="btn btn-primary">
            ${ingredient ? 'Enregistrer' : 'Ajouter'}
          </button>
          <button type="button" class="btn btn-secondary" id="btn-cancel-form">
            Annuler
          </button>
        </div>
      </form>
    `;

    // Gestion de l'unité et du poids
    const uniteSelect = document.getElementById('input-unite');
    const poidsInput = document.getElementById('input-poids-unite');
    
    uniteSelect.addEventListener('change', (e) => {
      if (e.target.value.toLowerCase() === 'g') {
        poidsInput.value = '1';
      }
    });

    // Attache l'événement de soumission
    const form = document.getElementById('ingredient-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveIngredient(ingredient);
    });
    
    // Bouton annuler
    const btnCancel = document.getElementById('btn-cancel-form');
    if (btnCancel) {
      btnCancel.addEventListener('click', () => this.hideModal());
    }
  }

  async saveIngredient(existingIngredient) {
    const formData = {
      reference: document.getElementById('input-reference').value,
      intitule: document.getElementById('input-intitule').value,
      precisions: document.getElementById('input-precisions').value,
      categorie: document.getElementById('input-categorie').value,
      kcal100g: parseFloat(document.getElementById('input-kcal100g').value) || 0,
      prix: parseFloat(document.getElementById('input-prix').value) || 0,
      fournisseur: document.getElementById('input-fournisseur').value,
      conditionnement: document.getElementById('input-conditionnement').value,
      unite: document.getElementById('input-unite').value,
      poidsParUnite: parseFloat(document.getElementById('input-poids-unite').value) || 0
    };

    try {
      if (existingIngredient) {
        // Mise à jour de l'ingrédient existant
        await this.app.modules.sheets.updateIngredient(existingIngredient.id, formData);
        this.app.showToast('Aliment modifié avec succès', 'success');
      } else {
        // Ajouter nouvel ingrédient
        await this.app.modules.sheets.addIngredient(formData);
        this.app.showToast('Aliment ajouté avec succès', 'success');
      }
      
      // Recharge les données
      await this.loadIngredients();
      this.filterIngredients();
      this.updateIngredientsList();
      
      this.hideModal();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      this.app.showToast('Erreur lors de la sauvegarde', 'error');
    }
  }

  hideModal() {
    const modal = document.getElementById('ingredient-modal');
    modal.classList.remove('show');
    this.currentIngredient = null;
  }
}

// Export global
window.AlimentsPage = AlimentsPage;
