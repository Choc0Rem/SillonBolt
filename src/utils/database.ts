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
const CACHE_DURATION = 1000; // Réduit à 1 seconde pour plus de réactivité

// Fonction utilitaire pour sauvegarder dans localStorage avec cache
const saveToStorage = (key: string, data: any): boolean => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
    
    // Mettre à jour le cache immédiatement
    cache[key] = JSON.parse(serialized); // Deep copy pour éviter les références
    cacheTimestamp[key] = Date.now();
    
    console.log(`✅ Sauvegarde réussie: ${key}`, data);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la sauvegarde ${key}:`, error);
    // Invalider le cache en cas d'erreur
    delete cache[key];
    delete cacheTimestamp[key];
    return false;
  }
};

// Fonction utilitaire pour charger depuis localStorage avec cache
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    // Vérifier le cache d'abord
    if (cache[key] && cacheTimestamp[key] && (Date.now() - cacheTimestamp[key] < CACHE_DURATION)) {
      return JSON.parse(JSON.stringify(cache[key])); // Deep copy
    }

    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Mettre à jour le cache
      cache[key] = JSON.parse(JSON.stringify(parsed)); // Deep copy
      cacheTimestamp[key] = Date.now();
      return parsed;
    }
    
    // Sauvegarder la valeur par défaut si rien n'existe
    saveToStorage(key, defaultValue);
    return defaultValue;
  } catch (error) {
    console.error(`❌ Erreur lors du chargement ${key}:`, error);
    // En cas d'erreur, invalider le cache et retourner la valeur par défaut
    delete cache[key];
    delete cacheTimestamp[key];
    return defaultValue;
  }
};

// Fonction pour invalider le cache de manière sélective
const invalidateCache = (key?: string) => {
  if (key) {
    delete cache[key];
    delete cacheTimestamp[key];
    console.log(`🔄 Cache invalidé: ${key}`);
  } else {
    cache = {};
    cacheTimestamp = {};
    console.log('🔄 Cache entièrement invalidé');
  }
};

// Fonction pour forcer le rechargement depuis localStorage
const forceReload = <T>(key: string, defaultValue: T): T => {
  invalidateCache(key);
  return loadFromStorage(key, defaultValue);
};

// Générer les options de saisons (années scolaires) à partir de 2025-2026
const generateSeasonOptions = (): string[] => {
  const startYear = 2025;
  const seasons = [];
  
  // Générer 25 années scolaires à partir de 2025-2026
  for (let year = startYear; year < startYear + 25; year++) {
    seasons.push(`${year}-${year + 1}`);
  }
  
  return seasons;
};

// Copier les adhérents d'une saison à l'autre
const copyAdherentsToNewSeason = (fromSeason: string, toSeason: string): boolean => {
  try {
    const allAdherents = forceReload<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const adherentsFromPreviousSeason = allAdherents.filter(a => a.saison === fromSeason);
    
    if (adherentsFromPreviousSeason.length === 0) {
      console.log(`ℹ️ Aucun adhérent à copier depuis ${fromSeason}`);
      return true;
    }
    
    // Créer de nouveaux adhérents pour la nouvelle saison
    const newAdherents = adherentsFromPreviousSeason.map(adherent => ({
      ...adherent,
      id: `adh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      saison: toSeason,
      activites: [], // Réinitialiser les activités
      createdAt: new Date().toISOString()
    }));
    
    // Ajouter les nouveaux adhérents
    const updatedAdherents = [...allAdherents, ...newAdherents];
    const success = saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    
    if (success) {
      console.log(`✅ ${newAdherents.length} adhérents copiés vers ${toSeason}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la copie des adhérents:', error);
    return false;
  }
};

// Copier les activités d'une saison à l'autre
const copyActivitesToNewSeason = (fromSeason: string, toSeason: string): boolean => {
  try {
    const allActivites = forceReload<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const activitesFromPreviousSeason = allActivites.filter(a => a.saison === fromSeason);
    
    if (activitesFromPreviousSeason.length === 0) {
      console.log(`ℹ️ Aucune activité à copier depuis ${fromSeason}`);
      return true;
    }
    
    // Créer de nouvelles activités pour la nouvelle saison
    const newActivites = activitesFromPreviousSeason.map(activite => ({
      ...activite,
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      saison: toSeason,
      adherents: [], // Réinitialiser les adhérents
      createdAt: new Date().toISOString()
    }));
    
    // Ajouter les nouvelles activités
    const updatedActivites = [...allActivites, ...newActivites];
    const success = saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    
    if (success) {
      console.log(`✅ ${newActivites.length} activités copiées vers ${toSeason}`);
    }
    
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la copie des activités:', error);
    return false;
  }
};

// Initialisation de la base de données
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initialisation de la base de données...');
    
    // Vérifier si c'est la première fois
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!existingSettings) {
      console.log('🆕 Première initialisation - création des données par défaut');
      await createDefaultData();
    } else {
      // Vérifier l'intégrité des données existantes
      console.log('🔍 Vérification de l\'intégrité des données...');
      await verifyDataIntegrity();
    }
    
    console.log('✅ Base de données initialisée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    return false;
  }
};

// Vérification de l'intégrité des données
const verifyDataIntegrity = async (): Promise<void> => {
  try {
    // Vérifier que les saisons existent
    const saisons = forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
    if (saisons.length === 0) {
      console.log('⚠️ Aucune saison trouvée, création de la saison par défaut');
      await createDefaultData();
      return;
    }

    // Vérifier qu'il y a une saison active
    const settings = forceReload<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
    const saisonActive = saisons.find(s => s.nom === settings.saisonActive);
    
    if (!saisonActive) {
      console.log('⚠️ Saison active invalide, correction...');
      const firstSeason = saisons[0];
      const updatedSaisons = saisons.map(s => ({ ...s, active: s.id === firstSeason.id }));
      const updatedSettings = { ...settings, saisonActive: firstSeason.nom };
      
      saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
      saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
    }

    // Vérifier les types par défaut
    const typesAdhesion = forceReload<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
    if (typesAdhesion.length === 0) {
      console.log('⚠️ Types d\'adhésion manquants, création...');
      const defaultTypes = [
        { id: 'type_1', nom: 'Individuelle', prix: 50 },
        { id: 'type_2', nom: 'Famille', prix: 80 }
      ];
      saveToStorage(STORAGE_KEYS.TYPES_ADHESION, defaultTypes);
    }

    const modesPaiement = forceReload<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
    if (modesPaiement.length === 0) {
      console.log('⚠️ Modes de paiement manquants, création...');
      const defaultModes = [
        { id: 'mode_1', nom: 'Espèces' },
        { id: 'mode_2', nom: 'Chèque' },
        { id: 'mode_3', nom: 'Virement' }
      ];
      saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, defaultModes);
    }

    const typesEvenement = forceReload<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
    if (typesEvenement.length === 0) {
      console.log('⚠️ Types d\'événement manquants, création...');
      const defaultTypesEvenement = [
        { id: 'evt_1', nom: 'Activité', couleur: '#3B82F6' },
        { id: 'evt_2', nom: 'Réunion', couleur: '#10B981' },
        { id: 'evt_3', nom: 'Événement', couleur: '#8B5CF6' }
      ];
      saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, defaultTypesEvenement);
    }

    console.log('✅ Intégrité des données vérifiée');
  } catch (error) {
    console.error('❌ Erreur lors de la vérification d\'intégrité:', error);
    throw error;
  }
};

// Création des données par défaut
const createDefaultData = async (): Promise<void> => {
  const currentSeason = '2025-2026';

  // Saison par défaut
  const defaultSaison: Saison = {
    id: 'season_2025',
    nom: currentSeason,
    dateDebut: '2025-09-01',
    dateFin: '2026-08-31',
    active: true,
    terminee: false
  };

  // Paramètres par défaut
  const defaultSettings: AppSettings = {
    saisonActive: currentSeason
  };

  // Types d'adhésion par défaut
  const defaultTypesAdhesion: TypeAdhesion[] = [
    { id: 'type_1', nom: 'Individuelle', prix: 50 },
    { id: 'type_2', nom: 'Famille', prix: 80 }
  ];

  // Modes de paiement par défaut
  const defaultModesPaiement: ModePaiement[] = [
    { id: 'mode_1', nom: 'Espèces' },
    { id: 'mode_2', nom: 'Chèque' },
    { id: 'mode_3', nom: 'Virement' }
  ];

  // Types d'événement par défaut
  const defaultTypesEvenement: TypeEvenement[] = [
    { id: 'evt_1', nom: 'Activité', couleur: '#3B82F6' },
    { id: 'evt_2', nom: 'Réunion', couleur: '#10B981' },
    { id: 'evt_3', nom: 'Événement', couleur: '#8B5CF6' }
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

  console.log('✅ Données par défaut créées');
};

// Fonctions pour les saisons
export const getSaisons = (): Saison[] => {
  return forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
};

export const getSeasonOptions = (): string[] => {
  return generateSeasonOptions();
};

export const getSaisonActive = (): string => {
  const settings = forceReload<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '2025-2026' });
  return settings.saisonActive || '2025-2026';
};

export const setSaisonActive = (saisonId: string): boolean => {
  try {
    console.log(`🔄 Changement de saison active: ${saisonId}`);
    
    const saisons = forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const saison = saisons.find(s => s.id === saisonId);
    
    if (!saison) {
      console.error('❌ Saison non trouvée:', saisonId);
      return false;
    }

    // Mettre à jour les saisons (désactiver toutes, activer la sélectionnée)
    const updatedSaisons = saisons.map(s => ({
      ...s,
      active: s.id === saisonId
    }));

    // Mettre à jour les paramètres
    const settings = forceReload<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
    const updatedSettings = {
      ...settings,
      saisonActive: saison.nom
    };

    const saisonSuccess = saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    const settingsSuccess = saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
    
    if (saisonSuccess && settingsSuccess) {
      // Invalider tout le cache pour forcer le rechargement
      invalidateCache();
      console.log(`✅ Saison active changée: ${saison.nom}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur lors du changement de saison:', error);
    return false;
  }
};

export const addSaison = (seasonName: string, dateDebut: string, dateFin: string): boolean => {
  try {
    console.log(`➕ Ajout nouvelle saison: ${seasonName}`);
    
    const saisons = forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
    
    // Vérifier si la saison existe déjà
    if (saisons.find(s => s.nom === seasonName)) {
      console.error('❌ Cette saison existe déjà');
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
    const success = saveToStorage(STORAGE_KEYS.SAISONS, newSaisons);
    
    if (success) {
      // Copier les données de la saison active si elle existe
      const saisonActive = getSaisonActive();
      if (saisonActive && saisonActive !== seasonName) {
        copyAdherentsToNewSeason(saisonActive, seasonName);
        copyActivitesToNewSeason(saisonActive, seasonName);
      }
      
      // Invalider le cache
      invalidateCache();
      console.log(`✅ Nouvelle saison ajoutée: ${seasonName}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de saison:', error);
    return false;
  }
};

export const updateSaison = (saison: Saison): boolean => {
  try {
    console.log(`🔄 Mise à jour saison: ${saison.nom}`);
    
    const saisons = forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const updatedSaisons = saisons.map(s => s.id === saison.id ? { ...saison } : s);
    
    const success = saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    if (success) {
      // Si la saison est active, mettre à jour les paramètres
      if (saison.active) {
        const settings = forceReload<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '' });
        const updatedSettings = {
          ...settings,
          saisonActive: saison.nom
        };
        saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
      }
      
      // Invalider le cache
      invalidateCache();
      console.log(`✅ Saison mise à jour: ${saison.nom}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de saison:', error);
    return false;
  }
};

export const deleteSaison = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression saison: ${id}`);
    
    const saisons = forceReload<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const saisonToDelete = saisons.find(s => s.id === id);
    
    if (!saisonToDelete) {
      console.error('❌ Saison non trouvée:', id);
      return false;
    }
    
    if (saisonToDelete.active) {
      console.error('❌ Impossible de supprimer la saison active');
      return false;
    }
    
    // Vérifier qu'il reste au moins une saison
    if (saisons.length <= 1) {
      console.error('❌ Impossible de supprimer la dernière saison');
      return false;
    }
    
    // Supprimer toutes les données liées à cette saison
    const allAdherents = forceReload<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const allActivites = forceReload<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const allPaiements = forceReload<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    
    const updatedAdherents = allAdherents.filter(a => a.saison !== saisonToDelete.nom);
    const updatedActivites = allActivites.filter(a => a.saison !== saisonToDelete.nom);
    const updatedPaiements = allPaiements.filter(p => p.saison !== saisonToDelete.nom);
    
    const adherentSuccess = saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    const activiteSuccess = saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    const paiementSuccess = saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    
    // Supprimer la saison
    const updatedSaisons = saisons.filter(s => s.id !== id);
    const saisonSuccess = saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    if (adherentSuccess && activiteSuccess && paiementSuccess && saisonSuccess) {
      // Invalider le cache
      invalidateCache();
      console.log(`✅ Saison et toutes ses données supprimées: ${saisonToDelete.nom}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de saison:', error);
    return false;
  }
};

// Fonctions pour les adhérents
export const getAdherents = (): Adherent[] => {
  const saisonActive = getSaisonActive();
  const allAdherents = forceReload<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
  return allAdherents.filter(a => a.saison === saisonActive);
};

export const saveAdherent = (adherent: Adherent): boolean => {
  try {
    console.log(`💾 Sauvegarde adhérent: ${adherent.prenom} ${adherent.nom}`);
    
    const allAdherents = forceReload<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const existingIndex = allAdherents.findIndex(a => a.id === adherent.id);
    
    let updatedAdherents;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedAdherents = [...allAdherents];
      updatedAdherents[existingIndex] = { ...adherent };
    } else {
      // Ajout
      updatedAdherents = [...allAdherents, { ...adherent }];
    }
    
    const success = saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    if (success) {
      console.log(`✅ Adhérent sauvegardé: ${adherent.prenom} ${adherent.nom}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'adhérent:', error);
    return false;
  }
};

export const deleteAdherent = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression adhérent: ${id}`);
    
    const allAdherents = forceReload<Adherent[]>(STORAGE_KEYS.ADHERENTS, []);
    const updatedAdherents = allAdherents.filter(a => a.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents);
    if (success) {
      console.log(`✅ Adhérent supprimé: ${id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'adhérent:', error);
    return false;
  }
};

// Fonctions pour les activités
export const getActivites = (): Activite[] => {
  const saisonActive = getSaisonActive();
  const allActivites = forceReload<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
  return allActivites.filter(a => a.saison === saisonActive);
};

export const saveActivite = (activite: Activite): boolean => {
  try {
    console.log(`💾 Sauvegarde activité: ${activite.nom}`);
    
    const allActivites = forceReload<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const existingIndex = allActivites.findIndex(a => a.id === activite.id);
    
    let updatedActivites;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedActivites = [...allActivites];
      updatedActivites[existingIndex] = { ...activite };
    } else {
      // Ajout
      updatedActivites = [...allActivites, { ...activite }];
    }
    
    const success = saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    if (success) {
      console.log(`✅ Activité sauvegardée: ${activite.nom}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'activité:', error);
    return false;
  }
};

export const deleteActivite = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression activité: ${id}`);
    
    const allActivites = forceReload<Activite[]>(STORAGE_KEYS.ACTIVITES, []);
    const updatedActivites = allActivites.filter(a => a.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites);
    if (success) {
      console.log(`✅ Activité supprimée: ${id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'activité:', error);
    return false;
  }
};

// Fonctions pour les paiements
export const getPaiements = (): Paiement[] => {
  const saisonActive = getSaisonActive();
  const allPaiements = forceReload<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
  return allPaiements.filter(p => p.saison === saisonActive);
};

export const savePaiement = (paiement: Paiement): boolean => {
  try {
    console.log(`💾 Sauvegarde paiement: ${paiement.id}`);
    
    const allPaiements = forceReload<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    const existingIndex = allPaiements.findIndex(p => p.id === paiement.id);
    
    let updatedPaiements;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedPaiements = [...allPaiements];
      updatedPaiements[existingIndex] = { ...paiement };
    } else {
      // Ajout
      updatedPaiements = [...allPaiements, { ...paiement }];
    }
    
    const success = saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    if (success) {
      console.log(`✅ Paiement sauvegardé: ${paiement.id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du paiement:', error);
    return false;
  }
};

export const deletePaiement = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression paiement: ${id}`);
    
    const allPaiements = forceReload<Paiement[]>(STORAGE_KEYS.PAIEMENTS, []);
    const updatedPaiements = allPaiements.filter(p => p.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.PAIEMENTS, updatedPaiements);
    if (success) {
      console.log(`✅ Paiement supprimé: ${id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du paiement:', error);
    return false;
  }
};

// Fonctions pour les tâches
export const getTaches = (): Tache[] => {
  return forceReload<Tache[]>(STORAGE_KEYS.TACHES, []);
};

export const saveTache = (tache: Tache): boolean => {
  try {
    console.log(`💾 Sauvegarde tâche: ${tache.nom}`);
    
    const allTaches = forceReload<Tache[]>(STORAGE_KEYS.TACHES, []);
    const existingIndex = allTaches.findIndex(t => t.id === tache.id);
    
    let updatedTaches;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedTaches = [...allTaches];
      updatedTaches[existingIndex] = { ...tache };
    } else {
      // Ajout
      updatedTaches = [...allTaches, { ...tache }];
    }
    
    const success = saveToStorage(STORAGE_KEYS.TACHES, updatedTaches);
    if (success) {
      console.log(`✅ Tâche sauvegardée: ${tache.nom}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la tâche:', error);
    return false;
  }
};

export const deleteTache = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression tâche: ${id}`);
    
    const allTaches = forceReload<Tache[]>(STORAGE_KEYS.TACHES, []);
    const updatedTaches = allTaches.filter(t => t.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.TACHES, updatedTaches);
    if (success) {
      console.log(`✅ Tâche supprimée: ${id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la tâche:', error);
    return false;
  }
};

// Fonctions pour les événements
export const getEvenements = (): EvenementAgenda[] => {
  return forceReload<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
};

export const saveEvenement = (evenement: EvenementAgenda): boolean => {
  try {
    console.log(`💾 Sauvegarde événement: ${evenement.titre}`);
    
    const allEvenements = forceReload<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
    const existingIndex = allEvenements.findIndex(e => e.id === evenement.id);
    
    let updatedEvenements;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedEvenements = [...allEvenements];
      updatedEvenements[existingIndex] = { ...evenement };
    } else {
      // Ajout
      updatedEvenements = [...allEvenements, { ...evenement }];
    }
    
    const success = saveToStorage(STORAGE_KEYS.EVENEMENTS, updatedEvenements);
    if (success) {
      console.log(`✅ Événement sauvegardé: ${evenement.titre}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de l\'événement:', error);
    return false;
  }
};

export const deleteEvenement = (id: string): boolean => {
  try {
    console.log(`🗑️ Suppression événement: ${id}`);
    
    const allEvenements = forceReload<EvenementAgenda[]>(STORAGE_KEYS.EVENEMENTS, []);
    const updatedEvenements = allEvenements.filter(e => e.id !== id);
    
    const success = saveToStorage(STORAGE_KEYS.EVENEMENTS, updatedEvenements);
    if (success) {
      console.log(`✅ Événement supprimé: ${id}`);
    }
    return success;
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de l\'événement:', error);
    return false;
  }
};

// Fonctions pour les types d'adhésion
export const getTypesAdhesion = (): TypeAdhesion[] => {
  return forceReload<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
};

export const saveTypeAdhesion = (type: TypeAdhesion): boolean => {
  try {
    const allTypes = forceReload<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
    const existingIndex = allTypes.findIndex(t => t.id === type.id);
    
    let updatedTypes;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedTypes = [...allTypes];
      updatedTypes[existingIndex] = { ...type };
    } else {
      // Ajout
      updatedTypes = [...allTypes, { ...type }];
    }
    
    return saveToStorage(STORAGE_KEYS.TYPES_ADHESION, updatedTypes);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du type d\'adhésion:', error);
    return false;
  }
};

export const deleteTypeAdhesion = (id: string): boolean => {
  try {
    const allTypes = forceReload<TypeAdhesion[]>(STORAGE_KEYS.TYPES_ADHESION, []);
    const updatedTypes = allTypes.filter(t => t.id !== id);
    
    return saveToStorage(STORAGE_KEYS.TYPES_ADHESION, updatedTypes);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du type d\'adhésion:', error);
    return false;
  }
};

// Fonctions pour les modes de paiement
export const getModesPaiement = (): ModePaiement[] => {
  return forceReload<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
};

export const saveModePaiement = (mode: ModePaiement): boolean => {
  try {
    const allModes = forceReload<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
    const existingIndex = allModes.findIndex(m => m.id === mode.id);
    
    let updatedModes;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedModes = [...allModes];
      updatedModes[existingIndex] = { ...mode };
    } else {
      // Ajout
      updatedModes = [...allModes, { ...mode }];
    }
    
    return saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, updatedModes);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du mode de paiement:', error);
    return false;
  }
};

export const deleteModePaiement = (id: string): boolean => {
  try {
    const allModes = forceReload<ModePaiement[]>(STORAGE_KEYS.MODES_PAIEMENT, []);
    const updatedModes = allModes.filter(m => m.id !== id);
    
    return saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, updatedModes);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du mode de paiement:', error);
    return false;
  }
};

// Fonctions pour les types d'événement
export const getTypesEvenement = (): TypeEvenement[] => {
  return forceReload<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
};

export const saveTypeEvenement = (type: TypeEvenement): boolean => {
  try {
    const allTypes = forceReload<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
    const existingIndex = allTypes.findIndex(t => t.id === type.id);
    
    let updatedTypes;
    if (existingIndex >= 0) {
      // Mise à jour
      updatedTypes = [...allTypes];
      updatedTypes[existingIndex] = { ...type };
    } else {
      // Ajout
      updatedTypes = [...allTypes, { ...type }];
    }
    
    return saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, updatedTypes);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du type d\'événement:', error);
    return false;
  }
};

export const deleteTypeEvenement = (id: string): boolean => {
  try {
    const allTypes = forceReload<TypeEvenement[]>(STORAGE_KEYS.TYPES_EVENEMENT, []);
    const updatedTypes = allTypes.filter(t => t.id !== id);
    
    return saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, updatedTypes);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du type d\'événement:', error);
    return false;
  }
};

// Fonctions utilitaires
export const getSettings = (): AppSettings => {
  return forceReload<AppSettings>(STORAGE_KEYS.SETTINGS, { saisonActive: '2025-2026' });
};

export const updateSettings = (settings: AppSettings): boolean => {
  try {
    return saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des paramètres:', error);
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
      version: 'localStorage optimisé v2',
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
    console.error('❌ Erreur diagnostic:', error);
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
    console.log('🧹 Base de données vidée');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors du vidage de la base de données:', error);
    return false;
  }
};

// Fonction pour exporter toutes les données
export const exportDatabase = (): string => {
  try {
    const data = {
      adherents: forceReload(STORAGE_KEYS.ADHERENTS, []),
      activites: forceReload(STORAGE_KEYS.ACTIVITES, []),
      paiements: forceReload(STORAGE_KEYS.PAIEMENTS, []),
      taches: forceReload(STORAGE_KEYS.TACHES, []),
      evenements: forceReload(STORAGE_KEYS.EVENEMENTS, []),
      typesAdhesion: forceReload(STORAGE_KEYS.TYPES_ADHESION, []),
      modesPaiement: forceReload(STORAGE_KEYS.MODES_PAIEMENT, []),
      typesEvenement: forceReload(STORAGE_KEYS.TYPES_EVENEMENT, []),
      saisons: forceReload(STORAGE_KEYS.SAISONS, []),
      settings: forceReload(STORAGE_KEYS.SETTINGS, {})
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
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
    
    console.log('✅ Données importées avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error);
    return false;
  }
};