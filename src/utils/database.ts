// Système de base de données optimisé utilisant localStorage
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings, TypeEvenement } from '../types';

// Clés pour localStorage
const STORAGE_KEYS = {
  ADHERENTS: 'association_adherents',
  ACTIVITES: 'association_activites',
  PAIEMENTS: 'association_paiements',
  TACHES: 'association_taches',
  EVENEMENTS: 'association_evenements',
  TYPES_ADHESION: 'association_types_adhesion',
  MODES_PAIEMENT: 'association_modes_paiement',
  TYPES_EVENEMENT: 'association_types_evenement',
  SAISONS: 'association_saisons',
  SETTINGS: 'association_settings'
};

// Cache en mémoire pour optimiser les performances
let cache: { [key: string]: any } = {};
let cacheTimestamp: { [key: string]: number } = {};
const CACHE_DURATION = 5000; // 5 secondes

// Fonction utilitaire pour sauvegarder dans localStorage avec cache
const saveToStorage = (key: string, data: any): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Mettre à jour le cache
    cache[key] = data;
    cacheTimestamp[key] = Date.now();
    return true;
  } catch (error) {
    console.error(`Erreur lors de la sauvegarde ${key}:`, error);
    return false;
  }
};

// Fonction utilitaire pour charger depuis localStorage avec cache
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    // Vérifier le cache d'abord
    if (cache[key] && cacheTimestamp[key] && (Date.now() - cacheTimestamp[key] < CACHE_DURATION)) {
      return cache[key];
    }

    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Mettre à jour le cache
      cache[key] = parsed;
      cacheTimestamp[key] = Date.now();
      return parsed;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Erreur lors du chargement ${key}:`, error);
    return defaultValue;
  }
};

// Fonction pour invalider le cache
const invalidateCache = (key?: string) => {
  if (key) {
    delete cache[key];
    delete cacheTimestamp[key];
  } else {
    cache = {};
    cacheTimestamp = {};
  }
};

// Générer les options de saisons (années scolaires)
const generateSeasonOptions = (): string[] => {
  const currentYear = new Date().getFullYear();
  const seasons = [];
  
  // Générer 10 années scolaires (5 passées, actuelle, 4 futures)
  for (let i = -5; i <= 4; i++) {
    const year = currentYear + i;
    seasons.push(`${year}-${year + 1}`);
  }
  
  return seasons;
};

// Copier les adhérents d'une saison à l'autre
const copyAdherentsToNewSeason = (fromSeason: string, toSeason: string): boolean => {
  try {
    const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const adherentsFromPreviousSeason = allAdherents.filter(a => a.saison === fromSeason);
    
    if (adherentsFromPreviousSeason.length === 0) {
      return true;
    }
    
    // Créer de nouveaux adhérents pour la nouvelle saison
    const newAdherents = adherentsFromPreviousSeason.map(adherent => ({
      ...adherent,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Nouvel ID unique
      saison: toSeason,
      activites: [], // Réinitialiser les activités
      createdAt: new Date().toISOString()
    }));
    
    // Ajouter les nouveaux adhérents
    const updatedAdherents = [...allAdherents, ...newAdherents];
    saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    
    console.log(`${newAdherents.length} adhérents copiés vers la saison ${toSeason}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie des adhérents:', error);
    return false;
  }
};

// Copier les activités d'une saison à l'autre
const copyActivitesToNewSeason = (fromSeason: string, toSeason: string): boolean => {
  try {
    const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const activitesFromPreviousSeason = allActivites.filter(a => a.saison === fromSeason);
    
    if (activitesFromPreviousSeason.length === 0) {
      return true;
    }
    
    // Créer de nouvelles activités pour la nouvelle saison
    const newActivites = activitesFromPreviousSeason.map(activite => ({
      ...activite,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Nouvel ID unique
      saison: toSeason,
      adherents: [], // Réinitialiser les adhérents
      createdAt: new Date().toISOString()
    }));
    
    // Ajouter les nouvelles activités
    const updatedActivites = [...allActivites, ...newActivites];
    saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    
    console.log(`${newActivites.length} activités copiées vers la saison ${toSeason}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la copie des activités:', error);
    return false;
  }
};

// Initialisation de la base de données
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('Initialisation de la base de données...');
    
    // Vérifier si c'est la première fois
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!existingSettings) {
      console.log('Première initialisation - création des données par défaut');
      await createDefaultData();
    }
    
    console.log('Base de données initialisée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};

// Création des données par défaut
const createDefaultData = async (): Promise<void> => {
  const currentYear = new Date().getFullYear();
  const currentSeason = `${currentYear}-${currentYear + 1}`;

  // Saison par défaut
  const defaultSaison: Saison = {
    id: `season_${currentYear}`,
    nom: currentSeason,
    dateDebut: `${currentYear}-09-01`,
    dateFin: `${currentYear + 1}-08-31`,
    active: true,
    terminee: false
  };

  // Paramètres par défaut
  const defaultSettings: AppSettings = {
    saisonActive: currentSeason
  };

  // Types d'adhésion par défaut
  const defaultTypesAdhesion: TypeAdhesion[] = [
    { id: '1', nom: 'Individuelle', prix: 50 },
    { id: '2', nom: 'Famille', prix: 80 }
  ];

  // Modes de paiement par défaut
  const defaultModesPaiement: ModePaiement[] = [
    { id: '1', nom: 'Espèces' },
    { id: '2', nom: 'Chèque' },
    { id: '3', nom: 'Virement' }
  ];

  // Types d'événement par défaut
  const defaultTypesEvenement: TypeEvenement[] = [
    { id: '1', nom: 'Activité', couleur: '#3B82F6' },
    { id: '2', nom: 'Réunion', couleur: '#10B981' },
    { id: '3', nom: 'Événement', couleur: '#8B5CF6' }
  ];

  // Sauvegarder toutes les données par défaut
  saveToStorage(STORAGE_KEYS.SAISONS, [defaultSaison]);
  saveToStorage(STORAGE_KEYS.SETTINGS, defaultSettings);
  saveToStorage(STORAGE_KEYS.TYPES_ADHESION, defaultTypesAdhesion);
  saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, defaultModesPaiement);
  saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, defaultTypesEvenement);
  saveToStorage(STORAGE_KEYS.ADHERENTS, []);
  saveToStorage(STORAGE_KEYS.ACTIVITES, []);
  saveToStorage(STORAGE_KEYS.PAIEMENTS, []);
  saveToStorage(STORAGE_KEYS.TACHES, []);
  saveToStorage(STORAGE_KEYS.EVENEMENTS, []);

  console.log('Données par défaut créées');
};

// Fonctions pour les saisons
export const getSaisons = (): Saison[] => {
  return loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
};

export const getSeasonOptions = (): string[] => {
  return generateSeasonOptions();
};

export const getSaisonActive = (): string => {
  const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
  return settings.saisonActive;
};

export const isSaisonTerminee = (): boolean => {
  const saisonActive = getSaisonActive();
  const saisons = getSaisons();
  const saison = saisons.find(s => s.nom === saisonActive);
  return saison ? saison.terminee : false;
};

export const setSaisonActive = (saisonId: string): boolean => {
  try {
    const saisons = getSaisons();
    const saison = saisons.find(s => s.id === saisonId);
    
    if (!saison) {
      console.error('Saison non trouvée:', saisonId);
      return false;
    }

    // Mettre à jour les saisons (désactiver toutes, activer la sélectionnée)
    const updatedSaisons = saisons.map(s => ({
      ...s,
      active: s.id === saisonId
    }));

    // Mettre à jour les paramètres
    const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
    const updatedSettings = {
      ...settings,
      saisonActive: saison.nom
    };

    saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
    
    // Invalider le cache
    invalidateCache();
    
    console.log('Saison active changée:', saison.nom);
    return true;
  } catch (error) {
    console.error('Erreur lors du changement de saison:', error);
    return false;
  }
};

export const addSaison = (seasonName: string, dateDebut: string, dateFin: string): boolean => {
  try {
    const saisons = getSaisons();
    
    // Vérifier si la saison existe déjà
    if (saisons.find(s => s.nom === seasonName)) {
      console.error('Cette saison existe déjà');
      return false;
    }

    const newSaison: Saison = {
      id: `season_${Date.now()}`,
      nom: seasonName,
      dateDebut,
      dateFin,
      active: false,
      terminee: false
    };
    
    const newSaisons = [...saisons, newSaison];
    saveToStorage(STORAGE_KEYS.SAISONS, newSaisons);
    
    // Copier les données de la saison active si elle existe
    const saisonActive = getSaisonActive();
    if (saisonActive && saisonActive !== seasonName) {
      copyAdherentsToNewSeason(saisonActive, seasonName);
      copyActivitesToNewSeason(saisonActive, seasonName);
    }
    
    // Invalider le cache
    invalidateCache();
    
    console.log('Nouvelle saison ajoutée:', seasonName);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de saison:', error);
    return false;
  }
};

export const updateSaison = (saison: Saison): boolean => {
  try {
    const saisons = getSaisons();
    const updatedSaisons = saisons.map(s => s.id === saison.id ? saison : s);
    
    saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    // Si la saison est active, mettre à jour les paramètres
    if (saison.active) {
      const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
      const updatedSettings = {
        ...settings,
        saisonActive: saison.nom
      };
      saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
    }
    
    // Invalider le cache
    invalidateCache();
    
    console.log('Saison mise à jour:', saison.nom);
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de saison:', error);
    return false;
  }
};

export const deleteSaison = (id: string): boolean => {
  try {
    const saisons = getSaisons();
    const saisonToDelete = saisons.find(s => s.id === id);
    
    if (!saisonToDelete) {
      console.error('Saison non trouvée:', id);
      return false;
    }
    
    if (saisonToDelete.active) {
      console.error('Impossible de supprimer la saison active');
      return false;
    }
    
    // Supprimer toutes les données liées à cette saison
    const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const allPaiements = loadFromStorage<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    
    const updatedAdherents = allAdherents.filter(a => a.saison !== saisonToDelete.nom);
    const updatedActivites = allActivites.filter(a => a.saison !== saisonToDelete.nom);
    const updatedPaiements = allPaiements.filter(p => p.saison !== saisonToDelete.nom);
    
    saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    
    // Supprimer la saison
    const updatedSaisons = saisons.filter(s => s.id !== id);
    saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    // Invalider le cache
    invalidateCache();
    
    console.log('Saison et toutes ses données supprimées:', saisonToDelete.nom);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de saison:', error);
    return false;
  }
};

// Fonction pour supprimer toutes les saisons (sauf l'active)
export const deleteAllSeasonsExceptActive = (): boolean => {
  try {
    const saisons = getSaisons();
    const saisonActive = getSaisonActive();
    
    // Garder seulement la saison active
    const activeSeason = saisons.find(s => s.nom === saisonActive);
    if (!activeSeason) {
      console.error('Saison active non trouvée');
      return false;
    }
    
    // Supprimer toutes les données des autres saisons
    const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const allPaiements = loadFromStorage<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    
    const updatedAdherents = allAdherents.filter(a => a.saison === saisonActive);
    const updatedActivites = allActivites.filter(a => a.saison === saisonActive);
    const updatedPaiements = allPaiements.filter(p => p.saison === saisonActive);
    
    saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    
    // Garder seulement la saison active
    const updatedSaisons = [activeSeason];
    saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    // Invalider le cache
    invalidateCache();
    
    console.log('Toutes les saisons supprimées sauf la saison active');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de toutes les saisons:', error);
    return false;
  }
};

// Fonctions pour les adhérents
export const getAdherents = (): Adherent[] => {
  const saisonActive = getSaisonActive();
  const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
  return allAdherents.filter(a => a.saison === saisonActive);
};

export const saveAdherent = (adherent: Adherent): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de sauvegarder : saison terminée');
    return false;
  }
  
  try {
    const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const existingIndex = allAdherents.findIndex(a => a.id === adherent.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allAdherents[existingIndex] = adherent;
    } else {
      // Ajout
      allAdherents.push(adherent);
    }
    
    const success = saveToStorage(STORAGE_KEYS.ADHERENTS, allAdherents);
    if (success) {
      invalidateCache(STORAGE_KEYS.ADHERENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'adhérent:', error);
    return false;
  }
};

export const deleteAdherent = (id: string): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de supprimer : saison terminée');
    return false;
  }
  
  try {
    const allAdherents = loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const updatedAdherents = allAdherents.filter(a => a.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    if (success) {
      invalidateCache(STORAGE_KEYS.ADHERENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adhérent:', error);
    return false;
  }
};

// Fonctions pour les activités
export const getActivites = (): Activite[] => {
  const saisonActive = getSaisonActive();
  const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
  return allActivites.filter(a => a.saison === saisonActive);
};

export const saveActivite = (activite: Activite): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de sauvegarder : saison terminée');
    return false;
  }
  
  try {
    const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const existingIndex = allActivites.findIndex(a => a.id === activite.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allActivites[existingIndex] = activite;
    } else {
      // Ajout
      allActivites.push(activite);
    }
    
    const success = saveToStorage(STORAGE_KEYS.ACTIVITES, allActivites);
    if (success) {
      invalidateCache(STORAGE_KEYS.ACTIVITES);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'activité:', error);
    return false;
  }
};

export const deleteActivite = (id: string): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de supprimer : saison terminée');
    return false;
  }
  
  try {
    const allActivites = loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const updatedActivites = allActivites.filter(a => a.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    if (success) {
      invalidateCache(STORAGE_KEYS.ACTIVITES);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité:', error);
    return false;
  }
};

// Fonctions pour les paiements
export const getPaiements = (): Paiement[] => {
  const saisonActive = getSaisonActive();
  const allPaiements = loadFromStorage<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
  return allPaiements.filter(p => p.saison === saisonActive);
};

export const savePaiement = (paiement: Paiement): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de sauvegarder : saison terminée');
    return false;
  }
  
  try {
    const allPaiements = loadFromStorage<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    const existingIndex = allPaiements.findIndex(p => p.id === paiement.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allPaiements[existingIndex] = paiement;
    } else {
      // Ajout
      allPaiements.push(paiement);
    }
    
    const success = saveToStorage(STORAGE_KEYS.PAIEMENTS, allPaiements);
    if (success) {
      invalidateCache(STORAGE_KEYS.PAIEMENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du paiement:', error);
    return false;
  }
};

export const deletePaiement = (id: string): boolean => {
  if (isSaisonTerminee()) {
    console.error('Impossible de supprimer : saison terminée');
    return false;
  }
  
  try {
    const allPaiements = loadFromStorage<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    const updatedPaiements = allPaiements.filter(p => p.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    if (success) {
      invalidateCache(STORAGE_KEYS.PAIEMENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    return false;
  }
};

// Fonctions pour les tâches
export const getTaches = (): Tache[] => {
  return loadFromStorage<Tache[]>(STORAGE_KEYS.TACHES, []);
};

export const saveTache = (tache: Tache): boolean => {
  try {
    const allTaches = loadFromStorage<Tache[]>(STORAGE_KEYS.TACHES, []);
    const existingIndex = allTaches.findIndex(t => t.id === tache.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allTaches[existingIndex] = tache;
    } else {
      // Ajout
      allTaches.push(tache);
    }
    
    const success = saveToStorage(STORAGE_KEYS.TACHES, allTaches);
    if (success) {
      invalidateCache(STORAGE_KEYS.TACHES);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la tâche:', error);
    return false;
  }
};

export const deleteTache = (id: string): boolean => {
  try {
    const allTaches = loadFromStorage<Tache[]>(STORAGE_KEYS.TACHES, []);
    const updatedTaches = allTaches.filter(t => t.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.TACHES, updatedTaches);
    if (success) {
      invalidateCache(STORAGE_KEYS.TACHES);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return false;
  }
};

// Fonctions pour les événements
export const getEvenements = (): EvenementAgenda[] => {
  return loadFromStorage<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
};

export const saveEvenement = (evenement: EvenementAgenda): boolean => {
  try {
    const allEvenements = loadFromStorage<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
    const existingIndex = allEvenements.findIndex(e => e.id === evenement.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allEvenements[existingIndex] = evenement;
    } else {
      // Ajout
      allEvenements.push(evenement);
    }
    
    const success = saveToStorage(STORAGE_KEYS.EVENEMENTS, allEvenements);
    if (success) {
      invalidateCache(STORAGE_KEYS.EVENEMENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    return false;
  }
};

export const deleteEvenement = (id: string): boolean => {
  try {
    const allEvenements = loadFromStorage<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
    const updatedEvenements = allEvenements.filter(e => e.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.EVENEMENTS, updatedEvenements);
    if (success) {
      invalidateCache(STORAGE_KEYS.EVENEMENTS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return false;
  }
};

// Fonctions pour les types d'adhésion
export const getTypesAdhesion = (): TypeAdhesion[] => {
  return loadFromStorage<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
};

export const saveTypeAdhesion = (type: TypeAdhesion): boolean => {
  try {
    const allTypes = loadFromStorage<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
    const existingIndex = allTypes.findIndex(t => t.id === type.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allTypes[existingIndex] = type;
    } else {
      // Ajout
      allTypes.push(type);
    }
    
    const success = saveToStorage(STORAGE_KEYS.TYPES_ADHESION, allTypes);
    if (success) {
      invalidateCache(STORAGE_KEYS.TYPES_ADHESION);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du type d\'adhésion:', error);
    return false;
  }
};

export const deleteTypeAdhesion = (id: string): boolean => {
  try {
    const allTypes = loadFromStorage<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
    const updatedTypes = allTypes.filter(t => t.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.TYPES_ADHESION, updatedTypes);
    if (success) {
      invalidateCache(STORAGE_KEYS.TYPES_ADHESION);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'adhésion:', error);
    return false;
  }
};

// Fonctions pour les modes de paiement
export const getModesPaiement = (): ModePaiement[] => {
  return loadFromStorage<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
};

export const saveModePaiement = (mode: ModePaiement): boolean => {
  try {
    const allModes = loadFromStorage<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
    const existingIndex = allModes.findIndex(m => m.id === mode.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allModes[existingIndex] = mode;
    } else {
      // Ajout
      allModes.push(mode);
    }
    
    const success = saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, allModes);
    if (success) {
      invalidateCache(STORAGE_KEYS.MODES_PAIEMENT);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du mode de paiement:', error);
    return false;
  }
};

export const deleteModePaiement = (id: string): boolean => {
  try {
    const allModes = loadFromStorage<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
    const updatedModes = allModes.filter(m => m.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, updatedModes);
    if (success) {
      invalidateCache(STORAGE_KEYS.MODES_PAIEMENT);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression du mode de paiement:', error);
    return false;
  }
};

// Fonctions pour les types d'événement
export const getTypesEvenement = (): TypeEvenement[] => {
  return loadFromStorage<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
};

export const saveTypeEvenement = (type: TypeEvenement): boolean => {
  try {
    const allTypes = loadFromStorage<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
    const existingIndex = allTypes.findIndex(t => t.id === type.id);
    
    if (existingIndex >= 0) {
      // Mise à jour
      allTypes[existingIndex] = type;
    } else {
      // Ajout
      allTypes.push(type);
    }
    
    const success = saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, allTypes);
    if (success) {
      invalidateCache(STORAGE_KEYS.TYPES_EVENEMENT);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du type d\'événement:', error);
    return false;
  }
};

export const deleteTypeEvenement = (id: string): boolean => {
  try {
    const allTypes = loadFromStorage<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
    const updatedTypes = allTypes.filter(t => t.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, updatedTypes);
    if (success) {
      invalidateCache(STORAGE_KEYS.TYPES_EVENEMENT);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'événement:', error);
    return false;
  }
};

// Fonctions utilitaires
export const getSettings = (): AppSettings => {
  return loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
};

export const updateSettings = (settings: AppSettings): boolean => {
  try {
    const success = saveToStorage(STORAGE_KEYS.SETTINGS, settings);
    if (success) {
      invalidateCache(STORAGE_KEYS.SETTINGS);
    }
    return success;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return false;
  }
};

// Fonction de diagnostic
export const getDatabaseInfo = () => {
  try {
    const saisonActive = getSaisonActive();
    const adherents = getAdherents();
    const activites = getActivites();
    const paiements = getPaiements();
    const taches = getTaches();
    const evenements = getEvenements();
    
    return {
      version: 'localStorage optimisé',
      saisonActive,
      totalAdherents: adherents.length,
      totalActivites: activites.length,
      totalPaiements: paiements.length,
      totalTaches: taches.length,
      totalEvenements: evenements.length,
      cacheSize: Object.keys(cache).length,
      storageUsed: Object.keys(STORAGE_KEYS).map(key => ({
        key,
        size: localStorage.getItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS])?.length || 0
      }))
    };
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return null;
  }
};

// Fonction pour vider complètement la base de données
export const clearDatabase = (): boolean => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    invalidateCache();
    console.log('Base de données vidée');
    return true;
  } catch (error) {
    console.error('Erreur lors du vidage de la base de données:', error);
    return false;
  }
};

// Fonction pour exporter toutes les données
export const exportDatabase = (): string => {
  try {
    const data = {
      adherents: loadFromStorage(STORAGE_KEYS.ADHERENTS, []),
      activites: loadFromStorage(STORAGE_KEYS.ACTIVITES, []),
      paiements: loadFromStorage(STORAGE_KEYS.PAIEMENTS, []),
      taches: loadFromStorage(STORAGE_KEYS.TACHES, []),
      evenements: loadFromStorage(STORAGE_KEYS.EVENEMENTS, []),
      typesAdhesion: loadFromStorage(STORAGE_KEYS.TYPES_ADHESION, []),
      modesPaiement: loadFromStorage(STORAGE_KEYS.MODES_PAIEMENT, []),
      typesEvenement: loadFromStorage(STORAGE_KEYS.TYPES_EVENEMENT, []),
      saisons: loadFromStorage(STORAGE_KEYS.SAISONS, []),
      settings: loadFromStorage(STORAGE_KEYS.SETTINGS, {})
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    return '';
  }
};

// Fonction pour importer des données
export const importDatabase = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    // Valider la structure des données
    if (!data || typeof data !== 'object') {
      throw new Error('Format de données invalide');
    }
    
    // Importer chaque type de données
    if (data.adherents) saveToStorage(STORAGE_KEYS.ADHERENTS, data.adherents);
    if (data.activites) saveToStorage(STORAGE_KEYS.ACTIVITES, data.activites);
    if (data.paiements) saveToStorage(STORAGE_KEYS.PAIEMENTS, data.paiements);
    if (data.taches) saveToStorage(STORAGE_KEYS.TACHES, data.taches);
    if (data.evenements) saveToStorage(STORAGE_KEYS.EVENEMENTS, data.evenements);
    if (data.typesAdhesion) saveToStorage(STORAGE_KEYS.TYPES_ADHESION, data.typesAdhesion);
    if (data.modesPaiement) saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, data.modesPaiement);
    if (data.typesEvenement) saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, data.typesEvenement);
    if (data.saisons) saveToStorage(STORAGE_KEYS.SAISONS, data.saisons);
    if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    
    // Invalider le cache après l'import
    invalidateCache();
    
    console.log('Données importées avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    return false;
  }
};