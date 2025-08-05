/**
 * sheets-api.js - Interface avec Google Sheets API
 * Gère la lecture et l'écriture des données dans le spreadsheet
 * Version: 1.4.5
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
   * Convertit une valeur numérique du format français (virgule) vers le format JavaScript (point)
   * Exemple: "4,50" → 4.50
   */
  parseFloatFrench(value) {
    if (!value) return 0;
    // Si c'est déjà un nombre, on le retourne
    if (typeof value === 'number') return value;
    
    // Convertit la virgule en point et parse
    const stringValue = value.toString();
    const normalized = stringValue.replace(',', '.');
    const result = parseFloat(normalized) || 0;
    
    // Log de debug pour les valeurs avec virgules
    if (stringValue.includes(',')) {
      console.log(`💰 Conversion prix: "${stringValue}" → ${result}`);
    }
    
    return result;
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
      // S'assure que le token est à jour
      const token = window.Auth?.getAccessToken();
      if (token) {
        gapi.client.setToken({
          access_token: token
        });
      }
      
      const fullRange = `'${sheetName}'!${range}`;
      console.log(`📝 Écriture dans ${fullRange}`);
      console.log(`📊 Nombre de lignes: ${values.length}, colonnes: ${values[0]?.length}`);
      
      const response = await gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: fullRange,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: values
        }
      });
      
      console.log('✅ Écriture réussie');
      return response.result;
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'écriture dans ${sheetName}:`, error);
      console.error('Détails de l\'erreur:', error.result?.error);
      throw error;
    }
  }

  /**
   * Ajoute des lignes à la fin d'une feuille
   */
  async appendRows(sheetName, values) {
    this.checkAuth();
    
    try {
      // S'assure que le token est à jour
      const token = window.Auth?.getAccessToken();
      if (token) {
        gapi.client.setToken({
          access_token: token
        });
      }
      
      console.log(`📝 Ajout de ${values.length} ligne(s) dans ${sheetName}`);
      
      const response = await gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A:CZ`,  // Étendu pour couvrir toutes les colonnes possibles
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: {
          values: values
        }
      });
      
      console.log('✅ Ajout réussi');
      return response.result;
      
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout dans ${sheetName}:`, error);
      console.error('Détails de l\'erreur:', error.result?.error);
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
      poidsParUnite: this.parseFloatFrench(row[7]),
      prix: this.parseFloatFrench(row[8]),
      kcal100g: this.parseFloatFrench(row[9]),
      prixParUnite: this.parseFloatFrench(row[10]),
      kcalParUnite: this.parseFloatFrench(row[11]),
      prixParKcal: this.parseFloatFrench(row[12])
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
   * Met à jour un ingrédient existant
   */
  async updateIngredient(rowId, ingredient) {
    console.log('✏️ Mise à jour de l\'ingrédient ligne', rowId);
    
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
    
    const range = `A${rowId}:M${rowId}`;
    return await this.writeRange(this.sheets.ingredients, range, values);
  }

  /**
   * Lit toutes les recettes
   * MISE À JOUR : Ajout de la colonne Validation (colonne C)
   */
  async readRecipes() {
    console.log('📖 Lecture des recettes...');
    
    const rows = await this.readRange(this.sheets.recettes, 'A2:CT100');
    
    return rows.map((row, index) => {
      const recette = {
        id: index + 2,
        numero: row[0] || '',
        intitule: row[1] || '',
        validation: row[2] === 'X' || row[2] === 'x', // Nouvelle colonne C
        portion: this.parseFloatFrench(row[3]),      // Décalé de C à D
        instructions: row[4] || '',                   // Décalé de D à E
        poids: this.parseFloatFrench(row[5]),        // Décalé de E à F
        kcalTotal: this.parseFloatFrench(row[6]),    // Décalé de F à G
        prixTotal: this.parseFloatFrench(row[7]),    // Utilise parseFloatFrench pour gérer les virgules
        ingredients: []
      };
      
      // Parse les ingrédients (colonnes I et suivantes, par groupes de 6)
      for (let i = 8; i < row.length; i += 6) {  // Décalé de 7 à 8
        if (row[i] && row[i + 1]) { // Si ref et nom existent
          recette.ingredients.push({
            ref: row[i],
            nom: row[i + 1],
            quantite: this.parseFloatFrench(row[i + 2]),
            unite: row[i + 3] || '',
            kcal: this.parseFloatFrench(row[i + 4]),
            prix: this.parseFloatFrench(row[i + 5])  // Utilise parseFloatFrench pour les prix
          });
        }
      }
      
      return recette;
    }).filter(r => r.intitule); // Filtre les lignes vides
  }

  /**
   * Génère le prochain numéro de recette
   * Format: R001, R002, etc.
   */
  async getNextRecipeNumber() {
    console.log('🔢 Génération du prochain numéro de recette...');
    
    try {
      const recettes = await this.readRecipes();
      
      // Extrait tous les numéros
      const numbers = recettes
        .map(r => {
          const match = r.numero?.match(/R(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => !isNaN(n));
      
      // Trouve le plus grand numéro
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      
      // Génère le prochain numéro
      const nextNumber = maxNumber + 1;
      const nextRef = `R${nextNumber.toString().padStart(3, '0')}`;
      
      console.log(`✅ Prochain numéro: ${nextRef}`);
      return nextRef;
      
    } catch (error) {
      console.error('Erreur lors de la génération du numéro:', error);
      // Fallback
      return `R${Date.now().toString().slice(-3)}`;
    }
  }

  /**
   * Ajoute une nouvelle recette
   * MISE À JOUR : Préserve les formules en n'écrivant que les données nécessaires
   */
  async addRecipe(recette) {
    console.log('➕ Ajout d\'une recette:', recette.intitule);
    
    // Génère le numéro si pas fourni
    if (!recette.numero) {
      recette.numero = await this.getNextRecipeNumber();
    }
    
    // Pour l'ajout, on doit quand même créer la ligne complète
    // mais on va laisser les colonnes de formules vides
    const ingredientsRow = [];
    
    for (const ing of recette.ingredients) {
      // Pour chaque ingrédient, on ajoute 6 colonnes
      ingredientsRow.push(
        ing.ref,           // Ref
        '',                // Nom (sera calculé par formule)
        ing.quantite,      // Qté
        '',                // U (sera calculé par formule)
        '',                // Kcal (sera calculé par formule)
        ''                 // Prix (sera calculé par formule)
      );
    }
    
    // Remplit jusqu'à 15 ingrédients (90 colonnes)
    while (ingredientsRow.length < 90) {
      ingredientsRow.push('');
    }
    
    // Construit la ligne complète
    const values = [[
      recette.numero,
      recette.intitule,
      recette.validation ? 'X' : '',
      recette.portion || 1,
      recette.instructions || '',
      '',  // Poids (sera calculé par formule)
      '',  // Kcal total (sera calculé par formule)
      '',  // Prix total (sera calculé par formule)
      ...ingredientsRow
    ]];
    
    console.log('📤 Ajout d\'une nouvelle ligne avec', recette.ingredients.length, 'ingrédients');
    
    const result = await this.appendRows(this.sheets.recettes, values);
    
    // Notifie l'utilisateur
    if (window.app?.showToast) {
      window.app.showToast('Recette ajoutée avec succès !', 'success');
    }
    
    return result;
  }

  /**
   * Met à jour une recette existante
   * MISE À JOUR : Écriture sélective pour préserver les formules
   */
  async updateRecipe(rowId, recette) {
    console.log('✏️ Mise à jour de la recette ligne', rowId);
    console.log('📋 Données reçues:', recette);
    
    // Prépare les mises à jour individuelles pour chaque cellule
    const updates = [];
    
    // Colonnes A à E (données de base)
    updates.push({
      range: `'${this.sheets.recettes}'!A${rowId}`,
      values: [[recette.numero]]
    });
    updates.push({
      range: `'${this.sheets.recettes}'!B${rowId}`,
      values: [[recette.intitule]]
    });
    updates.push({
      range: `'${this.sheets.recettes}'!C${rowId}`,
      values: [[recette.validation ? 'X' : '']]
    });
    updates.push({
      range: `'${this.sheets.recettes}'!D${rowId}`,
      values: [[recette.portion || 1]]
    });
    updates.push({
      range: `'${this.sheets.recettes}'!E${rowId}`,
      values: [[recette.instructions || '']]
    });
    
    // Pour chaque ingrédient, on n'écrit que Ref (colonne I+n*6) et Qté (colonne K+n*6)
    for (let i = 0; i < recette.ingredients.length && i < 15; i++) {
      const ing = recette.ingredients[i];
      const baseCol = 9 + (i * 6); // Colonne I = 9
      
      // Ref
      updates.push({
        range: `'${this.sheets.recettes}'!${this.columnToLetter(baseCol)}${rowId}`,
        values: [[ing.ref]]
      });
      
      // Qté (colonne +2)
      updates.push({
        range: `'${this.sheets.recettes}'!${this.columnToLetter(baseCol + 2)}${rowId}`,
        values: [[ing.quantite]]
      });
    }
    
    // Efface les ingrédients supplémentaires si la recette en a moins qu'avant
    for (let i = recette.ingredients.length; i < 15; i++) {
      const baseCol = 9 + (i * 6); // Colonne I = 9
      
      // Efface Ref
      updates.push({
        range: `'${this.sheets.recettes}'!${this.columnToLetter(baseCol)}${rowId}`,
        values: [['']]
      });
      
      // Efface Qté
      updates.push({
        range: `'${this.sheets.recettes}'!${this.columnToLetter(baseCol + 2)}${rowId}`,
        values: [['']]
      });
    }
    
    console.log(`📤 ${updates.length} mises à jour à effectuer`);
    
    try {
      // S'assure que le token est à jour
      const token = window.Auth?.getAccessToken();
      if (token) {
        gapi.client.setToken({
          access_token: token
        });
      }
      
      // Effectue toutes les mises à jour en batch
      const response = await gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: updates
        }
      });
      
      console.log('✅ Recette mise à jour, ligne', rowId);
      
      // Notifie l'utilisateur
      if (window.app?.showToast) {
        window.app.showToast('Recette mise à jour !', 'success');
      }
      
      return response.result;
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      throw error;
    }
  }
  
  /**
   * Convertit un numéro de colonne en lettre(s)
   * 1 -> A, 2 -> B, ..., 27 -> AA, etc.
   */
  columnToLetter(column) {
    let letter = '';
    while (column > 0) {
      const remainder = (column - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      column = Math.floor((column - 1) / 26);
    }
    return letter;
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
        quantite: this.parseFloatFrench(row[4]),
        kcal: this.parseFloatFrench(row[5])
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
        objectifKcal: this.parseFloatFrench(userProfile[1]) || 2000,
        dateDebut: userProfile[2] || new Date().toISOString().split('T')[0],
        poidsInitial: userProfile[3] ? this.parseFloatFrench(userProfile[3]) : null,
        poidsObjectif: userProfile[4] ? this.parseFloatFrench(userProfile[4]) : null
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

  /**
   * Génère la prochaine référence disponible
   * Format: 0001, 0002, etc.
   */
  async getNextReference() {
    console.log('🔢 Génération de la prochaine référence...');
    
    try {
      const ingredients = await this.readIngredients();
      
      // Extrait tous les numéros des références existantes
      const numbers = ingredients
        .map(ing => {
          // Extrait le nombre de la référence (ex: "FRU01" → 1, "0042" → 42)
          const match = ing.reference?.match(/(\d+)$/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter(n => !isNaN(n));
      
      // Trouve le plus grand numéro
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      
      // Génère la prochaine référence (format 0000)
      const nextNumber = maxNumber + 1;
      const nextRef = nextNumber.toString().padStart(4, '0');
      
      console.log(`✅ Prochaine référence: ${nextRef}`);
      return nextRef;
      
    } catch (error) {
      console.error('Erreur lors de la génération de référence:', error);
      // Fallback avec timestamp
      return Date.now().toString().slice(-4);
    }
  }

  /**
   * Lit les options des menus déroulants
   * @returns {Object} {categories: [], fournisseurs: [], unites: [], kcalRanges: [], prixRanges: []}
   */
  async readMenuOptions() {
    console.log('📋 Lecture des menus déroulants...');
    
    try {
      const rows = await this.readRange('menus déroulants', 'A2:E100');
      
      const options = {
        categories: new Set(),
        fournisseurs: new Set(),
        unites: new Set(),
        kcalRanges: new Set(),
        prixRanges: new Set()
      };
      
      rows.forEach(row => {
        if (row[0]) options.categories.add(row[0]);
        if (row[1]) options.fournisseurs.add(row[1]);
        if (row[2]) options.unites.add(row[2]);
        if (row[3]) options.kcalRanges.add(row[3]);
        if (row[4]) options.prixRanges.add(row[4]);
      });
      
      // Convertit en array SANS trier pour garder l'ordre du sheet
      return {
        categories: Array.from(options.categories),
        fournisseurs: Array.from(options.fournisseurs),
        unites: Array.from(options.unites),
        kcalRanges: Array.from(options.kcalRanges),
        prixRanges: Array.from(options.prixRanges)
      };
      
    } catch (error) {
      console.error('Erreur lors de la lecture des menus:', error);
      // Valeurs par défaut
      return {
        categories: ['Fruits', 'Légumes', 'Viandes', 'Produits laitiers'],
        fournisseurs: ['Bio Market', 'Primeur Local', 'Jardin Direct'],
        unites: ['g', 'kg', 'L', 'mL', 'pièce', 'pot', 'sachet'],
        kcalRanges: ['< 100 kcal', '100-300 kcal', '300-500 kcal', '> 500 kcal'],
        prixRanges: ['< 5€', '5-10€', '10-20€', '> 20€']
      };
    }
  }
}

// Export global
window.SheetsAPI = new SheetsAPI();

// Si l'app est déjà chargée, on peut initialiser
if (window.app) {
  console.log('App détectée, SheetsAPI prêt à être initialisé');
}
