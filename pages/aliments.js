/**
 * aliments.js - Page de consultation et recherche des aliments
 * Affiche la liste des ingrédients avec recherche et filtres
 * Version: 1.3.0
 */

class AlimentsPage {
  constructor(app) {
    this.app = app;
    this.ingredients = [];
    this.filteredIngredients = [];
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.categories = new Set();
  }

  async init() {
    console.log('🥗 Initialisation de la page Aliments');
    
    try {
      // Charge les ingrédients depuis Sheets
      await this.loadIngredients();
      
      // Applique le filtre initial
      this.filterIngredients();
      
    } catch (error) {
      console.error('Erreur lors du chargement des aliments:', error);
      this.app.showToast('Erreur lors du chargement des aliments', 'error');
    }
  }

  async loadIngredients() {
    try {
      this.ingredients = await this.app.modules.sheets.readIngredients();
      console.log(`✅ ${this.ingredients.length} ingrédients chargés`);
      
      // Extrait les catégories uniques
      this.categories = new Set(['all']);
      this.ingredients.forEach(ing => {
        if (ing.categorie) {
          this.categories.add(ing.categorie);
        }
      });
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Données de démonstration en cas d'erreur
      this.ingredients = this.getDemoIngredients();
    }
  }

  filterIngredients() {
    const query = this.searchQuery.toLowerCase();
    
    this.filteredIngredients = this.ingredients.filter(ing => {
      // Filtre par catégorie
      if (this.selectedCategory !== 'all' && ing.categorie !== this.selectedCategory) {
        return false;
      }
      
      // Filtre par recherche
      if (query) {
        return ing.intitule.toLowerCase().includes(query) ||
               ing.categorie.toLowerCase().includes(query) ||
               ing.reference.toLowerCase().includes(query);
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
          <h1 class="page-title">Aliments</h1>
          
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
          
          <!-- Filtres par catégorie -->
          <div class="category-filters">
            ${this.renderCategoryFilters()}
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

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin: 0 0 12px 0;
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

        .category-filters {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0;
          -webkit-overflow-scrolling: touch;
        }

        .category-filters::-webkit-scrollbar {
          display: none;
        }

        .category-filter {
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 14px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #f5f5f5;
          color: #666;
          border: 2px solid transparent;
        }

        .category-filter.active {
          background: var(--color-mint);
          color: white;
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
          margin-bottom: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ingredient-card:active {
          transform: scale(0.98);
        }

        .ingredient-info {
          flex: 1;
        }

        .ingredient-name {
          font-weight: 500;
          color: #333;
          margin-bottom: 4px;
          font-size: 16px;
        }

        .ingredient-details {
          font-size: 13px;
          color: #666;
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .ingredient-category {
          background: #f0f0f0;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }

        .ingredient-ref {
          font-size: 11px;
          color: #999;
        }

        .ingredient-kcal {
          background: var(--color-peach);
          color: var(--color-coral);
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          min-width: 80px;
        }

        .ingredient-kcal small {
          display: block;
          font-weight: 400;
          font-size: 11px;
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

        .category-header {
          font-size: 14px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 20px 0 10px 5px;
          padding-top: 10px;
        }

        .category-header:first-child {
          margin-top: 0;
          padding-top: 0;
        }
      </style>
    `;
  }

  renderCategoryFilters() {
    const filters = [];
    
    for (const category of this.categories) {
      const isActive = this.selectedCategory === category;
      const label = category === 'all' ? 'Tous' : category;
      
      filters.push(`
        <button 
          class="category-filter ${isActive ? 'active' : ''}"
          data-category="${category}"
        >
          ${label}
        </button>
      `);
    }
    
    return filters.join('');
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

    let html = '';
    let currentCategory = '';
    
    this.filteredIngredients.forEach(ing => {
      // Affiche un header pour chaque nouvelle catégorie
      if (ing.categorie !== currentCategory && this.selectedCategory === 'all') {
        currentCategory = ing.categorie;
        html += `<div class="category-header">${currentCategory || 'Sans catégorie'}</div>`;
      }
      
      html += `
        <div class="ingredient-card" data-ref="${ing.reference}">
          <div class="ingredient-info">
            <div class="ingredient-name">${ing.intitule}</div>
            <div class="ingredient-details">
              ${this.selectedCategory === 'all' ? `<span class="ingredient-category">${ing.categorie}</span>` : ''}
              <span class="ingredient-ref">${ing.reference}</span>
            </div>
          </div>
          <div class="ingredient-kcal">
            ${Math.round(ing.kcal100g)}
            <small>kcal/100g</small>
          </div>
        </div>
      `;
    });
    
    return html;
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

    // Filtres de catégorie
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.selectedCategory = e.target.dataset.category;
        this.filterIngredients();
        this.updateUI();
      });
    });

    // Click sur un ingrédient (pour une future fonctionnalité)
    document.querySelectorAll('.ingredient-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const ref = card.dataset.ref;
        console.log('Ingrédient sélectionné:', ref);
        // TODO: Ouvrir un modal ou naviguer vers le journal avec cet ingrédient
      });
    });
  }

  updateIngredientsList() {
    const listContainer = document.querySelector('.aliments-list');
    if (listContainer) {
      listContainer.innerHTML = this.renderIngredientsList();
      
      // Réattache les événements sur les nouvelles cartes
      document.querySelectorAll('.ingredient-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const ref = card.dataset.ref;
          console.log('Ingrédient sélectionné:', ref);
        });
      });
    }

    // Met à jour le compteur
    const countElement = document.querySelector('.results-count');
    if (countElement) {
      countElement.textContent = `${this.filteredIngredients.length} aliment${this.filteredIngredients.length > 1 ? 's' : ''} trouvé${this.filteredIngredients.length > 1 ? 's' : ''}`;
    }
  }

  updateUI() {
    // Met à jour les filtres actifs
    document.querySelectorAll('.category-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === this.selectedCategory);
    });
    
    // Met à jour la liste
    this.updateIngredientsList();
  }

  getDemoIngredients() {
    return [
      { categorie: 'Fruits', reference: 'FRU01', intitule: 'Pomme', kcal100g: 52 },
      { categorie: 'Fruits', reference: 'FRU02', intitule: 'Banane', kcal100g: 89 },
      { categorie: 'Légumes', reference: 'LEG01', intitule: 'Carotte', kcal100g: 41 },
      { categorie: 'Légumes', reference: 'LEG02', intitule: 'Tomate', kcal100g: 18 },
      { categorie: 'Viandes', reference: 'VIA01', intitule: 'Poulet', kcal100g: 165 },
      { categorie: 'Produits laitiers', reference: 'LAI01', intitule: 'Yaourt nature', kcal100g: 61 }
    ];
  }
}

// Export global
window.AlimentsPage = AlimentsPage;
