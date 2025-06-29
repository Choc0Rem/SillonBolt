import initSqlJs from 'sql.js';
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings, TypeEvenement } from '../types';

// Variables globales
let SQL: any = null;
let db: any = null;
const DB_NAME = 'association_database.db';

// Initialisation de SQLite
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('Début initialisation SQLite...');
    
    // Charger SQL.js
    SQL = await initSqlJs({
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`
    });
    console.log('SQL.js chargé avec succès');

    // Charger la base existante ou créer une nouvelle
    const savedDb = localStorage.getItem(DB_NAME);
    if (savedDb) {
      console.log('Base de données existante trouvée, chargement...');
      const uint8Array = new Uint8Array(JSON.parse(savedDb));
      db = new SQL.Database(uint8Array);
      console.log('Base de données existante chargée');
    } else {
      console.log('Création d\'une nouvelle base de données...');
      db = new SQL.Database();
      await createTables();
      await insertDefaultData();
      console.log('Nouvelle base de données créée');
    }

    console.log('Base de données SQLite initialisée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};

// Création des tables
const createTables = async (): Promise<void> => {
  console.log('Création des tables...');
  
  const queries = [
    // Table des saisons
    `CREATE TABLE IF NOT EXISTS saisons (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      dateDebut TEXT NOT NULL,
      dateFin TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      terminee INTEGER DEFAULT 0
    )`,

    // Table des paramètres
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      saisonActive TEXT NOT NULL
    )`,

    // Table des adhérents
    `CREATE TABLE IF NOT EXISTS adherents (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      dateNaissance TEXT NOT NULL,
      sexe TEXT NOT NULL CHECK (sexe IN ('Homme', 'Femme')),
      adresse TEXT NOT NULL,
      codePostal TEXT NOT NULL,
      ville TEXT NOT NULL,
      telephone TEXT NOT NULL,
      telephone2 TEXT,
      email TEXT NOT NULL,
      email2 TEXT,
      typeAdhesion TEXT NOT NULL CHECK (typeAdhesion IN ('Individuelle', 'Famille')),
      saison TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,

    // Table des activités
    `CREATE TABLE IF NOT EXISTS activites (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      description TEXT NOT NULL,
      prix REAL NOT NULL,
      saison TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,

    // Table de liaison adhérents-activités
    `CREATE TABLE IF NOT EXISTS adherent_activites (
      adherentId TEXT,
      activiteId TEXT,
      PRIMARY KEY (adherentId, activiteId),
      FOREIGN KEY (adherentId) REFERENCES adherents(id) ON DELETE CASCADE,
      FOREIGN KEY (activiteId) REFERENCES activites(id) ON DELETE CASCADE
    )`,

    // Table des paiements
    `CREATE TABLE IF NOT EXISTS paiements (
      id TEXT PRIMARY KEY,
      adherentId TEXT NOT NULL,
      activiteId TEXT NOT NULL,
      montant REAL NOT NULL,
      datePaiement TEXT,
      modePaiement TEXT NOT NULL,
      statut TEXT NOT NULL CHECK (statut IN ('Payé', 'En attente')),
      saison TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (adherentId) REFERENCES adherents(id) ON DELETE CASCADE,
      FOREIGN KEY (activiteId) REFERENCES activites(id) ON DELETE CASCADE
    )`,

    // Table des tâches
    `CREATE TABLE IF NOT EXISTS taches (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      description TEXT NOT NULL,
      dateEcheance TEXT,
      type TEXT NOT NULL CHECK (type IN ('Urgent', 'Important', 'Normal')),
      statut TEXT NOT NULL CHECK (statut IN ('À faire', 'En cours', 'Terminé')),
      createdAt TEXT NOT NULL
    )`,

    // Table des événements
    `CREATE TABLE IF NOT EXISTS evenements (
      id TEXT PRIMARY KEY,
      titre TEXT NOT NULL,
      description TEXT NOT NULL,
      dateDebut TEXT NOT NULL,
      dateFin TEXT NOT NULL,
      lieu TEXT,
      type TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`,

    // Table des types d'adhésion
    `CREATE TABLE IF NOT EXISTS types_adhesion (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      prix REAL NOT NULL
    )`,

    // Table des modes de paiement
    `CREATE TABLE IF NOT EXISTS modes_paiement (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE
    )`,

    // Table des types d'événement
    `CREATE TABLE IF NOT EXISTS types_evenement (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL UNIQUE,
      couleur TEXT NOT NULL
    )`
  ];

  queries.forEach((query, index) => {
    try {
      db.run(query);
      console.log(`Table ${index + 1} créée avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la création de la table ${index + 1}:`, error, query);
    }
  });

  // Index pour optimiser les performances
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_adherents_saison ON adherents(saison)',
    'CREATE INDEX IF NOT EXISTS idx_activites_saison ON activites(saison)',
    'CREATE INDEX IF NOT EXISTS idx_paiements_saison ON paiements(saison)',
    'CREATE INDEX IF NOT EXISTS idx_paiements_adherent ON paiements(adherentId)',
    'CREATE INDEX IF NOT EXISTS idx_paiements_activite ON paiements(activiteId)',
    'CREATE INDEX IF NOT EXISTS idx_adherent_activites_adherent ON adherent_activites(adherentId)',
    'CREATE INDEX IF NOT EXISTS idx_adherent_activites_activite ON adherent_activites(activiteId)'
  ];

  indexes.forEach((index, i) => {
    try {
      db.run(index);
      console.log(`Index ${i + 1} créé avec succès`);
    } catch (error) {
      console.error(`Erreur lors de la création de l'index ${i + 1}:`, error, index);
    }
  });
  
  console.log('Tables et index créés avec succès');
};

// Insertion des données par défaut
const insertDefaultData = async (): Promise<void> => {
  console.log('Insertion des données par défaut...');
  
  const currentYear = new Date().getFullYear();
  const saisonActive = `${currentYear}-${currentYear + 1}`;

  try {
    // Vérifier et insérer la saison par défaut si elle n'existe pas
    const existingSaison = selectQuery('SELECT id FROM saisons WHERE nom = ?', [saisonActive]);
    if (existingSaison.length === 0) {
      db.run(
        'INSERT INTO saisons (id, nom, dateDebut, dateFin, active, terminee) VALUES (?, ?, ?, ?, ?, ?)',
        ['1', saisonActive, `${currentYear}-09-01`, `${currentYear + 1}-08-31`, 1, 0]
      );
      console.log('Saison par défaut créée:', saisonActive);
    }

    // Vérifier et insérer les paramètres par défaut si ils n'existent pas
    const existingSettings = selectQuery('SELECT id FROM settings LIMIT 1');
    if (existingSettings.length === 0) {
      db.run('INSERT INTO settings (saisonActive) VALUES (?)', [saisonActive]);
      console.log('Paramètres par défaut créés');
    }

    // Types d'adhésion par défaut
    const typesAdhesion = [
      ['1', 'Individuelle', 50],
      ['2', 'Famille', 80]
    ];
    typesAdhesion.forEach(([id, nom, prix]) => {
      const existing = selectQuery('SELECT id FROM types_adhesion WHERE id = ?', [id]);
      if (existing.length === 0) {
        db.run('INSERT INTO types_adhesion (id, nom, prix) VALUES (?, ?, ?)', [id, nom, prix]);
        console.log('Type d\'adhésion créé:', nom);
      }
    });

    // Modes de paiement par défaut
    const modesPaiement = [
      ['1', 'Espèces'],
      ['2', 'Chèque'],
      ['3', 'Virement']
    ];
    modesPaiement.forEach(([id, nom]) => {
      const existing = selectQuery('SELECT id FROM modes_paiement WHERE id = ?', [id]);
      if (existing.length === 0) {
        db.run('INSERT INTO modes_paiement (id, nom) VALUES (?, ?)', [id, nom]);
        console.log('Mode de paiement créé:', nom);
      }
    });

    // Types d'événement par défaut
    const typesEvenement = [
      ['1', 'Activité', '#3B82F6'],
      ['2', 'Réunion', '#10B981'],
      ['3', 'Événement', '#8B5CF6']
    ];
    typesEvenement.forEach(([id, nom, couleur]) => {
      const existing = selectQuery('SELECT id FROM types_evenement WHERE id = ?', [id]);
      if (existing.length === 0) {
        db.run('INSERT INTO types_evenement (id, nom, couleur) VALUES (?, ?, ?)', [id, nom, couleur]);
        console.log('Type d\'événement créé:', nom);
      }
    });

    saveDatabase();
    console.log('Données par défaut insérées avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'insertion des données par défaut:', error);
  }
};

// Sauvegarde de la base de données
export const saveDatabase = (): boolean => {
  try {
    if (!db) {
      console.error('Base de données non initialisée');
      return false;
    }
    
    const data = db.export();
    const buffer = Array.from(data);
    localStorage.setItem(DB_NAME, JSON.stringify(buffer));
    console.log('Base de données sauvegardée');
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
};

// Fonction utilitaire pour exécuter une requête avec gestion d'erreur
const executeQuery = (query: string, params: any[] = []): any => {
  try {
    if (!db) {
      throw new Error('Base de données non initialisée');
    }
    console.log('Exécution requête:', query, 'Params:', params);
    const result = db.run(query, params);
    console.log('Requête exécutée avec succès');
    return result;
  } catch (error) {
    console.error('Erreur SQL:', error, 'Query:', query, 'Params:', params);
    throw error;
  }
};

// Fonction utilitaire pour exécuter une requête de sélection
const selectQuery = (query: string, params: any[] = []): any[] => {
  try {
    if (!db) {
      console.error('Base de données non initialisée pour SELECT');
      return [];
    }
    
    console.log('Exécution SELECT:', query, 'Params:', params);
    const stmt = db.prepare(query);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    console.log('SELECT exécuté, résultats:', results.length);
    return results;
  } catch (error) {
    console.error('Erreur SQL SELECT:', error, 'Query:', query, 'Params:', params);
    return [];
  }
};

// Fonctions pour les saisons
export const getSaisons = (): Saison[] => {
  const results = selectQuery('SELECT * FROM saisons ORDER BY dateDebut DESC');
  return results.map(row => ({
    id: row.id,
    nom: row.nom,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    active: Boolean(row.active),
    terminee: Boolean(row.terminee)
  }));
};

export const getSaisonActive = (): string => {
  const result = selectQuery('SELECT saisonActive FROM settings LIMIT 1');
  return result.length > 0 ? result[0].saisonActive : '';
};

export const isSaisonTerminee = (): boolean => {
  const saisonActive = getSaisonActive();
  if (!saisonActive) return false;
  
  const result = selectQuery('SELECT terminee FROM saisons WHERE nom = ?', [saisonActive]);
  return result.length > 0 ? Boolean(result[0].terminee) : false;
};

export const setSaisonActive = (saisonId: string): boolean => {
  try {
    db.run('BEGIN TRANSACTION');
    
    // Désactiver toutes les saisons
    executeQuery('UPDATE saisons SET active = 0');
    
    // Activer la saison sélectionnée
    executeQuery('UPDATE saisons SET active = 1 WHERE id = ?', [saisonId]);
    
    // Mettre à jour les paramètres
    const saison = selectQuery('SELECT nom FROM saisons WHERE id = ?', [saisonId]);
    if (saison.length > 0) {
      executeQuery('UPDATE settings SET saisonActive = ?', [saison[0].nom]);
    }
    
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors du changement de saison:', error);
    return false;
  }
};

export const addSaison = (saison: Saison): boolean => {
  try {
    db.run('BEGIN TRANSACTION');
    
    // Ajouter la nouvelle saison
    executeQuery(
      'INSERT INTO saisons (id, nom, dateDebut, dateFin, active, terminee) VALUES (?, ?, ?, ?, ?, ?)',
      [saison.id, saison.nom, saison.dateDebut, saison.dateFin, saison.active ? 1 : 0, saison.terminee ? 1 : 0]
    );
    
    // Copier les données de la saison précédente si elle existe
    const saisonPrecedente = selectQuery('SELECT * FROM saisons WHERE active = 1 AND id != ?', [saison.id]);
    if (saisonPrecedente.length > 0) {
      const nomSaisonPrecedente = saisonPrecedente[0].nom;
      
      // Copier les adhérents
      const adherents = selectQuery('SELECT * FROM adherents WHERE saison = ?', [nomSaisonPrecedente]);
      adherents.forEach(adherent => {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        executeQuery(
          'INSERT INTO adherents (id, nom, prenom, dateNaissance, sexe, adresse, codePostal, ville, telephone, telephone2, email, email2, typeAdhesion, saison, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [newId, adherent.nom, adherent.prenom, adherent.dateNaissance, adherent.sexe, adherent.adresse, adherent.codePostal, adherent.ville, adherent.telephone, adherent.telephone2, adherent.email, adherent.email2, adherent.typeAdhesion, saison.nom, new Date().toISOString()]
        );
      });
      
      // Copier les activités
      const activites = selectQuery('SELECT * FROM activites WHERE saison = ?', [nomSaisonPrecedente]);
      activites.forEach(activite => {
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        executeQuery(
          'INSERT INTO activites (id, nom, description, prix, saison, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [newId, activite.nom, activite.description, activite.prix, saison.nom, new Date().toISOString()]
        );
      });
    }
    
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de l\'ajout de saison:', error);
    return false;
  }
};

export const updateSaison = (saison: Saison): boolean => {
  try {
    executeQuery(
      'UPDATE saisons SET nom = ?, dateDebut = ?, dateFin = ?, terminee = ? WHERE id = ?',
      [saison.nom, saison.dateDebut, saison.dateFin, saison.terminee ? 1 : 0, saison.id]
    );
    
    if (saison.active) {
      executeQuery('UPDATE settings SET saisonActive = ?', [saison.nom]);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de saison:', error);
    return false;
  }
};

export const deleteSaison = (id: string): boolean => {
  try {
    db.run('BEGIN TRANSACTION');
    
    const saison = selectQuery('SELECT nom, active FROM saisons WHERE id = ?', [id]);
    if (saison.length === 0 || saison[0].active) {
      db.run('ROLLBACK');
      return false;
    }
    
    const nomSaison = saison[0].nom;
    
    // Supprimer toutes les données liées
    executeQuery('DELETE FROM adherent_activites WHERE adherentId IN (SELECT id FROM adherents WHERE saison = ?)', [nomSaison]);
    executeQuery('DELETE FROM paiements WHERE saison = ?', [nomSaison]);
    executeQuery('DELETE FROM adherents WHERE saison = ?', [nomSaison]);
    executeQuery('DELETE FROM activites WHERE saison = ?', [nomSaison]);
    executeQuery('DELETE FROM saisons WHERE id = ?', [id]);
    
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de la suppression de saison:', error);
    return false;
  }
};

// Fonctions pour les adhérents
export const getAdherents = (): Adherent[] => {
  const saisonActive = getSaisonActive();
  if (!saisonActive) {
    console.warn('Aucune saison active définie');
    return [];
  }
  
  const results = selectQuery('SELECT * FROM adherents WHERE saison = ? ORDER BY nom, prenom', [saisonActive]);
  
  return results.map(row => {
    // Récupérer les activités de l'adhérent
    const activites = selectQuery(
      'SELECT activiteId FROM adherent_activites WHERE adherentId = ?',
      [row.id]
    ).map(a => a.activiteId);
    
    return {
      id: row.id,
      nom: row.nom,
      prenom: row.prenom,
      dateNaissance: row.dateNaissance,
      sexe: row.sexe,
      adresse: row.adresse,
      codePostal: row.codePostal,
      ville: row.ville,
      telephone: row.telephone,
      telephone2: row.telephone2 || '',
      email: row.email,
      email2: row.email2 || '',
      typeAdhesion: row.typeAdhesion,
      activites,
      saison: row.saison,
      createdAt: row.createdAt
    };
  });
};

export const saveAdherent = (adherent: Adherent): boolean => {
  if (isSaisonTerminee()) {
    console.error('Saison terminée - impossible de sauvegarder l\'adhérent');
    return false;
  }
  
  try {
    console.log('Sauvegarde adhérent:', adherent);
    
    // Vérifier que la saison est définie
    if (!adherent.saison) {
      adherent.saison = getSaisonActive();
    }
    
    if (!adherent.saison) {
      console.error('Aucune saison définie pour l\'adhérent');
      return false;
    }
    
    db.run('BEGIN TRANSACTION');
    
    const exists = selectQuery('SELECT id FROM adherents WHERE id = ?', [adherent.id]);
    
    if (exists.length > 0) {
      // Mise à jour
      console.log('Mise à jour adhérent existant');
      executeQuery(
        'UPDATE adherents SET nom = ?, prenom = ?, dateNaissance = ?, sexe = ?, adresse = ?, codePostal = ?, ville = ?, telephone = ?, telephone2 = ?, email = ?, email2 = ?, typeAdhesion = ? WHERE id = ?',
        [adherent.nom, adherent.prenom, adherent.dateNaissance, adherent.sexe, adherent.adresse, adherent.codePostal, adherent.ville, adherent.telephone, adherent.telephone2 || null, adherent.email, adherent.email2 || null, adherent.typeAdhesion, adherent.id]
      );
    } else {
      // Insertion
      console.log('Insertion nouvel adhérent');
      executeQuery(
        'INSERT INTO adherents (id, nom, prenom, dateNaissance, sexe, adresse, codePostal, ville, telephone, telephone2, email, email2, typeAdhesion, saison, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [adherent.id, adherent.nom, adherent.prenom, adherent.dateNaissance, adherent.sexe, adherent.adresse, adherent.codePostal, adherent.ville, adherent.telephone, adherent.telephone2 || null, adherent.email, adherent.email2 || null, adherent.typeAdhesion, adherent.saison, adherent.createdAt]
      );
    }
    
    // Mettre à jour les activités
    executeQuery('DELETE FROM adherent_activites WHERE adherentId = ?', [adherent.id]);
    adherent.activites.forEach(activiteId => {
      executeQuery('INSERT INTO adherent_activites (adherentId, activiteId) VALUES (?, ?)', [adherent.id, activiteId]);
    });
    
    db.run('COMMIT');
    saveDatabase();
    console.log('Adhérent sauvegardé avec succès:', adherent.nom, adherent.prenom);
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de la sauvegarde de l\'adhérent:', error);
    return false;
  }
};

export const deleteAdherent = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    db.run('BEGIN TRANSACTION');
    
    // Les suppressions en cascade sont gérées par les contraintes FK
    executeQuery('DELETE FROM adherents WHERE id = ?', [id]);
    
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de la suppression de l\'adhérent:', error);
    return false;
  }
};

// Fonctions pour les activités
export const getActivites = (): Activite[] => {
  const saisonActive = getSaisonActive();
  if (!saisonActive) {
    console.warn('Aucune saison active définie');
    return [];
  }
  
  const results = selectQuery('SELECT * FROM activites WHERE saison = ? ORDER BY nom', [saisonActive]);
  
  return results.map(row => {
    // Récupérer les adhérents de l'activité
    const adherents = selectQuery(
      'SELECT adherentId FROM adherent_activites WHERE activiteId = ?',
      [row.id]
    ).map(a => a.adherentId);
    
    return {
      id: row.id,
      nom: row.nom,
      description: row.description,
      prix: row.prix,
      adherents,
      saison: row.saison,
      createdAt: row.createdAt
    };
  });
};

export const saveActivite = (activite: Activite): boolean => {
  if (isSaisonTerminee()) {
    console.error('Saison terminée - impossible de sauvegarder l\'activité');
    return false;
  }
  
  try {
    console.log('Sauvegarde activité:', activite);
    
    // Vérifier que la saison est définie
    if (!activite.saison) {
      activite.saison = getSaisonActive();
    }
    
    if (!activite.saison) {
      console.error('Aucune saison définie pour l\'activité');
      return false;
    }
    
    db.run('BEGIN TRANSACTION');
    
    const exists = selectQuery('SELECT id FROM activites WHERE id = ?', [activite.id]);
    
    if (exists.length > 0) {
      // Mise à jour
      console.log('Mise à jour activité existante');
      executeQuery(
        'UPDATE activites SET nom = ?, description = ?, prix = ? WHERE id = ?',
        [activite.nom, activite.description, activite.prix, activite.id]
      );
    } else {
      // Insertion
      console.log('Insertion nouvelle activité');
      executeQuery(
        'INSERT INTO activites (id, nom, description, prix, saison, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [activite.id, activite.nom, activite.description, activite.prix, activite.saison, activite.createdAt]
      );
    }
    
    // Mettre à jour les adhérents
    executeQuery('DELETE FROM adherent_activites WHERE activiteId = ?', [activite.id]);
    activite.adherents.forEach(adherentId => {
      executeQuery('INSERT INTO adherent_activites (adherentId, activiteId) VALUES (?, ?)', [adherentId, activite.id]);
    });
    
    db.run('COMMIT');
    saveDatabase();
    console.log('Activité sauvegardée avec succès:', activite.nom);
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de la sauvegarde de l\'activité:', error);
    return false;
  }
};

export const deleteActivite = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    db.run('BEGIN TRANSACTION');
    
    executeQuery('DELETE FROM activites WHERE id = ?', [id]);
    
    db.run('COMMIT');
    saveDatabase();
    return true;
  } catch (error) {
    db.run('ROLLBACK');
    console.error('Erreur lors de la suppression de l\'activité:', error);
    return false;
  }
};

// Fonctions pour les paiements
export const getPaiements = (): Paiement[] => {
  const saisonActive = getSaisonActive();
  if (!saisonActive) {
    console.warn('Aucune saison active définie');
    return [];
  }
  
  const results = selectQuery('SELECT * FROM paiements WHERE saison = ? ORDER BY createdAt DESC', [saisonActive]);
  
  return results.map(row => ({
    id: row.id,
    adherentId: row.adherentId,
    activiteId: row.activiteId,
    montant: row.montant,
    datePaiement: row.datePaiement || '',
    modePaiement: row.modePaiement,
    statut: row.statut,
    saison: row.saison,
    createdAt: row.createdAt
  }));
};

export const savePaiement = (paiement: Paiement): boolean => {
  if (isSaisonTerminee()) {
    console.error('Saison terminée - impossible de sauvegarder le paiement');
    return false;
  }
  
  try {
    console.log('Sauvegarde paiement:', paiement);
    
    // Vérifier que la saison est définie
    if (!paiement.saison) {
      paiement.saison = getSaisonActive();
    }
    
    if (!paiement.saison) {
      console.error('Aucune saison définie pour le paiement');
      return false;
    }
    
    const exists = selectQuery('SELECT id FROM paiements WHERE id = ?', [paiement.id]);
    
    if (exists.length > 0) {
      console.log('Mise à jour paiement existant');
      executeQuery(
        'UPDATE paiements SET adherentId = ?, activiteId = ?, montant = ?, datePaiement = ?, modePaiement = ?, statut = ? WHERE id = ?',
        [paiement.adherentId, paiement.activiteId, paiement.montant, paiement.datePaiement || null, paiement.modePaiement, paiement.statut, paiement.id]
      );
    } else {
      console.log('Insertion nouveau paiement');
      executeQuery(
        'INSERT INTO paiements (id, adherentId, activiteId, montant, datePaiement, modePaiement, statut, saison, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [paiement.id, paiement.adherentId, paiement.activiteId, paiement.montant, paiement.datePaiement || null, paiement.modePaiement, paiement.statut, paiement.saison, paiement.createdAt]
      );
    }
    
    saveDatabase();
    console.log('Paiement sauvegardé avec succès:', paiement.id);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du paiement:', error);
    return false;
  }
};

export const deletePaiement = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    executeQuery('DELETE FROM paiements WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    return false;
  }
};

// Fonctions pour les tâches
export const getTaches = (): Tache[] => {
  const results = selectQuery('SELECT * FROM taches ORDER BY createdAt DESC');
  
  return results.map(row => ({
    id: row.id,
    nom: row.nom,
    description: row.description,
    dateEcheance: row.dateEcheance || '',
    type: row.type,
    statut: row.statut,
    createdAt: row.createdAt
  }));
};

export const saveTache = (tache: Tache): boolean => {
  try {
    console.log('Sauvegarde tâche:', tache);
    
    const exists = selectQuery('SELECT id FROM taches WHERE id = ?', [tache.id]);
    
    if (exists.length > 0) {
      console.log('Mise à jour tâche existante');
      executeQuery(
        'UPDATE taches SET nom = ?, description = ?, dateEcheance = ?, type = ?, statut = ? WHERE id = ?',
        [tache.nom, tache.description, tache.dateEcheance || null, tache.type, tache.statut, tache.id]
      );
    } else {
      console.log('Insertion nouvelle tâche');
      executeQuery(
        'INSERT INTO taches (id, nom, description, dateEcheance, type, statut, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [tache.id, tache.nom, tache.description, tache.dateEcheance || null, tache.type, tache.statut, tache.createdAt]
      );
    }
    
    saveDatabase();
    console.log('Tâche sauvegardée avec succès:', tache.nom);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la tâche:', error);
    return false;
  }
};

export const deleteTache = (id: string): boolean => {
  try {
    executeQuery('DELETE FROM taches WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return false;
  }
};

// Fonctions pour les événements
export const getEvenements = (): EvenementAgenda[] => {
  const results = selectQuery('SELECT * FROM evenements ORDER BY dateDebut');
  
  return results.map(row => ({
    id: row.id,
    titre: row.titre,
    description: row.description,
    dateDebut: row.dateDebut,
    dateFin: row.dateFin,
    lieu: row.lieu || '',
    type: row.type,
    createdAt: row.createdAt
  }));
};

export const saveEvenement = (evenement: EvenementAgenda): boolean => {
  try {
    console.log('Sauvegarde événement:', evenement);
    
    const exists = selectQuery('SELECT id FROM evenements WHERE id = ?', [evenement.id]);
    
    if (exists.length > 0) {
      console.log('Mise à jour événement existant');
      executeQuery(
        'UPDATE evenements SET titre = ?, description = ?, dateDebut = ?, dateFin = ?, lieu = ?, type = ? WHERE id = ?',
        [evenement.titre, evenement.description, evenement.dateDebut, evenement.dateFin, evenement.lieu || null, evenement.type, evenement.id]
      );
    } else {
      console.log('Insertion nouvel événement');
      executeQuery(
        'INSERT INTO evenements (id, titre, description, dateDebut, dateFin, lieu, type, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [evenement.id, evenement.titre, evenement.description, evenement.dateDebut, evenement.dateFin, evenement.lieu || null, evenement.type, evenement.createdAt]
      );
    }
    
    saveDatabase();
    console.log('Événement sauvegardé avec succès:', evenement.titre);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    return false;
  }
};

export const deleteEvenement = (id: string): boolean => {
  try {
    executeQuery('DELETE FROM evenements WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return false;
  }
};

// Fonctions pour les types d'adhésion
export const getTypesAdhesion = (): TypeAdhesion[] => {
  const results = selectQuery('SELECT * FROM types_adhesion ORDER BY nom');
  
  return results.map(row => ({
    id: row.id,
    nom: row.nom,
    prix: row.prix
  }));
};

export const saveTypeAdhesion = (type: TypeAdhesion): boolean => {
  try {
    const exists = selectQuery('SELECT id FROM types_adhesion WHERE id = ?', [type.id]);
    
    if (exists.length > 0) {
      executeQuery('UPDATE types_adhesion SET nom = ?, prix = ? WHERE id = ?', [type.nom, type.prix, type.id]);
    } else {
      executeQuery('INSERT INTO types_adhesion (id, nom, prix) VALUES (?, ?, ?)', [type.id, type.nom, type.prix]);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du type d\'adhésion:', error);
    return false;
  }
};

export const deleteTypeAdhesion = (id: string): boolean => {
  try {
    executeQuery('DELETE FROM types_adhesion WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'adhésion:', error);
    return false;
  }
};

// Fonctions pour les modes de paiement
export const getModesPaiement = (): ModePaiement[] => {
  const results = selectQuery('SELECT * FROM modes_paiement ORDER BY nom');
  
  return results.map(row => ({
    id: row.id,
    nom: row.nom
  }));
};

export const saveModePaiement = (mode: ModePaiement): boolean => {
  try {
    const exists = selectQuery('SELECT id FROM modes_paiement WHERE id = ?', [mode.id]);
    
    if (exists.length > 0) {
      executeQuery('UPDATE modes_paiement SET nom = ? WHERE id = ?', [mode.nom, mode.id]);
    } else {
      executeQuery('INSERT INTO modes_paiement (id, nom) VALUES (?, ?)', [mode.id, mode.nom]);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du mode de paiement:', error);
    return false;
  }
};

export const deleteModePaiement = (id: string): boolean => {
  try {
    executeQuery('DELETE FROM modes_paiement WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du mode de paiement:', error);
    return false;
  }
};

// Fonctions pour les types d'événement
export const getTypesEvenement = (): TypeEvenement[] => {
  const results = selectQuery('SELECT * FROM types_evenement ORDER BY nom');
  
  return results.map(row => ({
    id: row.id,
    nom: row.nom,
    couleur: row.couleur
  }));
};

export const saveTypeEvenement = (type: TypeEvenement): boolean => {
  try {
    const exists = selectQuery('SELECT id FROM types_evenement WHERE id = ?', [type.id]);
    
    if (exists.length > 0) {
      executeQuery('UPDATE types_evenement SET nom = ?, couleur = ? WHERE id = ?', [type.nom, type.couleur, type.id]);
    } else {
      executeQuery('INSERT INTO types_evenement (id, nom, couleur) VALUES (?, ?, ?)', [type.id, type.nom, type.couleur]);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du type d\'événement:', error);
    return false;
  }
};

export const deleteTypeEvenement = (id: string): boolean => {
  try {
    executeQuery('DELETE FROM types_evenement WHERE id = ?', [id]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'événement:', error);
    return false;
  }
};

// Fonctions utilitaires
export const getSettings = (): AppSettings => {
  return {
    saisonActive: getSaisonActive(),
    saisons: getSaisons()
  };
};

export const updateSettings = (settings: AppSettings): boolean => {
  try {
    executeQuery('UPDATE settings SET saisonActive = ?', [settings.saisonActive]);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return false;
  }
};

// Fonction de diagnostic
export const getDatabaseInfo = () => {
  try {
    const tables = selectQuery("SELECT name FROM sqlite_master WHERE type='table'");
    const saisonActive = getSaisonActive();
    const totalAdherents = selectQuery('SELECT COUNT(*) as count FROM adherents')[0]?.count || 0;
    const totalActivites = selectQuery('SELECT COUNT(*) as count FROM activites')[0]?.count || 0;
    const totalPaiements = selectQuery('SELECT COUNT(*) as count FROM paiements')[0]?.count || 0;
    
    return {
      version: 'SQLite',
      saisonActive,
      totalAdherents,
      totalActivites,
      totalPaiements,
      tables: tables.map(t => t.name),
      storageSize: localStorage.getItem(DB_NAME)?.length || 0
    };
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return null;
  }
};