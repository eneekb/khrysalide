/**
 * sheets-api.js - Interface avec Google Sheets API
 * Gère la lecture et l'écriture des données dans le spreadsheet
 * Version: 1.2.1
 */

class SheetsAPI {
  constructor() {
    this.spreadsheetId = '1wxppbV1WY6rG3uU-WeNMSoi1UvvAiBfKGXrswJNWCoY';
    this.isInitialized = false;
    
    // Noms des feuilles (exactement comme dans Google Sheets)
    this.sheets = {
      ingredients: 'ingredients et preparations de base',
      recettes: 'recettes',
      journal: 'Journal',
      profil: 'Profil'
    };
  }

  /**
   * Initialise l'API Sheets
   */
  async init() {
    try {
      console.log('📊 Initialisation de Sheets API...');
      
      // Vérifie que gapi est chargé
      if (!window.gapi || !window.gapi.client || !window.gapi.client.sheets) {
        throw new Error('Google Sheets API non chargée');
      }
      
      this.isInitialized = true;
      console.log('✅ Sheets API initialisée');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de Sheets API:', error);
      throw error;
    }
  }

  /**
   * Convertit une date du format français DD/MM/YYYY vers ISO YYYY-MM-DD
   * Exemple: "25/07/2025" → "2025-07-25"
   */
  frenchToISODate(frenchDate) {
    if (!frenchDate) return '';
    const parts = frenchDate.split('/');
    if (parts.length !== 3) return frenchDate;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }

  /**
   * Convertit une date ISO YYYY-MM-DD vers format français DD/MM/YYYY
   * Exemple: "2025-07-25" → "25/07/2025"
   */
  isoToFrenchDate(isoDate) {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length !== 3) return isoDate;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  /**
   * Vérifie l'authentification avant chaque appel
   */
  checkAuth() {
    if (!window.Auth || !window.Auth.isAuthenticated()) {
      throw new Error('Non authentifié');
    }
    
    if (!this.isInitialized) {
      throw new Error('Sheets API non initialisée');
    }
  }

  /**
   * Lit les données d'une plage
   */
  async readRange(sheetName, range) {
    this.checkAuth();
    
    try {
      const fullRange = `'${sheetName}'!${range}`;
      const response = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: fullRange
      });
      
      return response.result.values || [];
      
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Écrit des données dans une plage
   */
  async writeRange(sheetName, range, values) {
    this.checkAuth();
    
    try {
      const fullRange = `'${sheetName}'!${range}`;
      const response = await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });
      
      return response.result;
      
    } catch (error) {
      console.error(`Erreur lors de l'écriture dans ${sheetName}:`, error);
      throw error;
    }
  }

  /**
   * Ajoute des lignes à la fin d'une feuille
   */
  async appendRows(sheetName, values) {
    this.checkAuth();
    
    try {
      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });
      
      return response.result;
      
    } catch (error) {
      console.error(`Erreur lors de l'ajout dans ${sheetName}:`, error);
      throw error;
    }
  }

  // ========================================
  // MÉTHODES SPÉCIFIQUES PAR FEUILLE
  // ========================================

  /**
   * Lit tous les ingrédients
   */
  async readIngredients() {
    console.log('📖 Lecture des ingrédients...');
    
    const rows = await this.readRange(this.sheets.ingredients, 'A2:M1000');
    
    return rows.map((row, index) => ({
      id: index + 2, // Numéro de ligne (commence à 2)
      categorie: row[0] || '',
      reference: row[1] || '',
      intitule: row[2] || '',
      precisions: row[3] || '',
      fournisseur: row[4] || '',
      conditionnement: row[5] || '',
      unite: row[6] || '',
      poidsParUnite: parseFloat(row[7]) || 0,
      prix: parseFloat(row[8]) || 0,
      kcal100g: parseFloat(row[9]) || 0,
      prixParUnite: parseFloat(row[10]) || 0,
      kcalParUnite: parseFloat(row[11]) || 0,
      prixParKcal: parseFloat(row[12]) || 0
    })).filter(item => item.intitule); // Filtre les lignes vides
  }

  /**
   * Ajoute un nouvel ingrédient
   */
  async addIngredient(ingredient) {
    console.log('➕ Ajout d\'un ingrédient:', ingredient.intitule);
    
    const values = [[
      ingredient.categorie || '',
      ingredient.reference || '',
      ingredient.intitule || '',
      ingredient.precisions || '',
      ingredient.fournisseur || '',
      ingredient.conditionnement || '',
      ingredient.unite || '',
      ingredient.poidsParUnite || '',
      ingredient.prix || '',
      ingredient.kcal100g || '',
      ingredient.prixParUnite || '',
      ingredient.kcalParUnite || '',
      ingredient.prixParKcal || ''
    ]];
    
    return await this.appendRows(this.sheets.ingredients, values);
  }

  /**
   * Lit toutes les recettes
   */
  async readRecipes() {
    console.log('📖 Lecture des recettes...');
    
    const rows = await this.readRange(this.sheets.recettes, 'A2:BZ100');
    
    return rows.map((row, index) => {
      const recette = {
        id: index + 2,
        numero: row[0] || '',
        intitule: row[1] || '',
        portion: parseFloat(row[2]) || 1,
        instructions: row[3] || '',
        poids: parseFloat(row[4]) || 0,
        kcalTotal: parseFloat(row[5]) || 0,
        prixTotal: parseFloat(row[6]) || 0,
        ingredients: []
      };
      
      // Parse les ingrédients (colonnes H et suivantes, par groupes de 6)
      for (let i = 7; i < row.length; i += 6) {
        if (row[i] && row[i + 1]) { // Si ref et nom existent
          recette.ingredients.push({
            ref: row[i],
            nom: row[i + 1],
            quantite: parseFloat(row[i + 2]) || 0,
            unite: row[i + 3] || '',
            kcal: parseFloat(row[i + 4]) || 0,
            prix: parseFloat(row[i + 5]) || 0
          });
        }
      }
      
      return recette;
    }).filter(r => r.intitule); // Filtre les lignes vides
  }

  /**
   * Lit le journal pour une période donnée
   * @param {string} startDate - Date de début (YYYY-MM-DD) ou null pour tout
   * @param {string} endDate - Date de fin (YYYY-MM-DD) ou null pour tout
   * @returns {Array} Liste des entrées du journal
   */
  async readJournal(startDate = null, endDate = null) {
    console.log(`📖 Lecture du journal${startDate ? ` du ${startDate}` : ''}${endDate ? ` au ${endDate}` : ''}`);
    
    const rows = await this.readRange(this.sheets.journal, 'A2:F1000');
    console.log(`📋 ${rows.length} lignes trouvées dans le journal`);
    
    return rows.map((row, index) => {
      const entry = {
        id: index + 2,
        date: this.frenchToISODate(row[0] || ''), // Convertit DD/MM/YYYY en YYYY-MM-DD
        dateFrench: row[0] || '', // Garde le format original
        repas: row[1] || '',
        type: row[2] || '',
        reference: row[3] || '',
        quantite: parseFloat(row[4]) || 0,
        kcal: parseFloat(row[5]) || 0
      };
      
      // Log pour debug (première entrée seulement)
      if (index === 0 && row[0]) {
        console.log(`📅 Exemple de conversion: ${row[0]} → ${entry.date}`);
      }
      
      return entry;
    }).filter(entry => {
      if (!entry.date) return false;
      if (!startDate && !endDate) return true;
      
      const entryDate = new Date(entry.date);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-01-01');
      
      return entryDate >= start && entryDate <= end;
    });
  }

  /**
   * Ajoute une entrée au journal
   */
  async addJournalEntry(entry) {
    console.log('➕ Ajout au journal:', entry);
    
    // Convertit la date au format français pour l'écriture
    const dateFrench = entry.date ? this.isoToFrenchDate(entry.date) : this.isoToFrenchDate(new Date().toISOString().split('T')[0]);
    
    const values = [[
      dateFrench,
      entry.repas || '',
      entry.type || '',
      entry.reference || '',
      entry.quantite || '',
      entry.kcal || ''
    ]];
    
    const result = await this.appendRows(this.sheets.journal, values);
    
    // Notifie l'utilisateur
    if (window.app?.showToast) {
      window.app.showToast('Repas enregistré !', 'success');
    }
    
    return result;
  }

  /**
   * Supprime une entrée du journal
   */
  async deleteJournalEntry(rowId) {
    console.log('🗑️ Suppression de l\'entrée:', rowId);
    
    // Pour supprimer, on efface le contenu de la ligne
    const range = `A${rowId}:F${rowId}`;
    const values = [['', '', '', '', '', '']];
    
    return await this.writeRange(this.sheets.journal, range, values);
  }

  /**
   * Lit le profil de l'utilisateur
   */
  async readProfile() {
    console.log('📖 Lecture du profil...');
    
    const userEmail = window.Auth?.getCurrentUser()?.email;
    if (!userEmail) {
      throw new Error('Email utilisateur non disponible');
    }
    
    const rows = await this.readRange(this.sheets.profil, 'A2:E10');
    
    // Cherche le profil de l'utilisateur actuel
    const userProfile = rows.find(row => row[0] === userEmail);
    
    if (userProfile) {
      return {
        email: userProfile[0],
        objectifKcal: parseFloat(userProfile[1]) || 2000,
        dateDebut: userProfile[2] || new Date().toISOString().split('T')[0],
        poidsInitial: parseFloat(userProfile[3]) || null,
        poidsObjectif: parseFloat(userProfile[4]) || null
      };
    }
    
    // Profil par défaut si non trouvé
    return {
      email: userEmail,
      objectifKcal: 2000,
      dateDebut: new Date().toISOString().split('T')[0],
      poidsInitial: null,
      poidsObjectif: null
    };
  }

  /**
   * Met à jour le profil de l'utilisateur
   */
  async updateProfile(profile) {
    console.log('💾 Mise à jour du profil:', profile);
    
    const userEmail = window.Auth?.getCurrentUser()?.email;
    if (!userEmail) {
      throw new Error('Email utilisateur non disponible');
    }
    
    // Cherche si le profil existe déjà
    const rows = await this.readRange(this.sheets.profil, 'A2:A10');
    const existingRow = rows.findIndex(row => row[0] === userEmail);
    
    const values = [[
      userEmail,
      profile.objectifKcal || 2000,
      profile.dateDebut || new Date().toISOString().split('T')[0],
      profile.poidsInitial || '',
      profile.poidsObjectif || ''
    ]];
    
    if (existingRow >= 0) {
      // Mise à jour
      const range = `A${existingRow + 2}:E${existingRow + 2}`;
      return await this.writeRange(this.sheets.profil, range, values);
    } else {
      // Ajout
      return await this.appendRows(this.sheets.profil, values);
    }
  }

  /**
   * Méthode batch pour optimiser les lectures multiples
   */
  async batchRead(requests) {
    this.checkAuth();
    
    try {
      const response = await gapi.client.sheets.spreadsheets.values.batchGet({
        spreadsheetId: this.spreadsheetId,
        ranges: requests.map(r => `'${r.sheet}'!${r.range}`)
      });
      
      return response.result.valueRanges;
      
    } catch (error) {
      console.error('Erreur lors de la lecture batch:', error);
      throw error;
    }
  }

  /**
   * Recherche des ingrédients par nom
   */
  async searchIngredients(query) {
    const allIngredients = await this.readIngredients();
    const lowerQuery = query.toLowerCase();
    
    return allIngredients.filter(ing => 
      ing.intitule.toLowerCase().includes(lowerQuery) ||
      ing.categorie.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Calcule les totaux du jour
   * @param {string} date - Date au format ISO (YYYY-MM-DD)
   * @returns {object} Totaux par repas et total général
   */
  async getDayTotals(date) {
    const totals = {
      total: 0,
      petitDejeuner: 0,
      dejeuner: 0,
      diner: 0,
      collation: 0
    };
    
    try {
      const dayEntries = await this.readJournal(date, date);
      console.log(`📊 ${dayEntries.length} entrées trouvées pour le ${date}`);
      
      dayEntries.forEach(entry => {
        totals.total += entry.kcal;
        
        switch(entry.repas.toLowerCase()) {
          case 'petit-déjeuner':
          case 'petit déjeuner':
            totals.petitDejeuner += entry.kcal;
            break;
          case 'déjeuner':
            totals.dejeuner += entry.kcal;
            break;
          case 'dîner':
          case 'diner':
            totals.diner += entry.kcal;
            break;
          case 'collation':
          case 'encas':
            totals.collation += entry.kcal;
            break;
        }
      });
    } catch (error) {
      console.error('Erreur lors du calcul des totaux:', error);
    }
    
    return totals;
  }
}

// Export global
window.SheetsAPI = new SheetsAPI();

// Si l'app est déjà chargée, on peut initialiser
if (window.app) {
  console.log('App détectée, SheetsAPI prêt à être initialisé');
}
