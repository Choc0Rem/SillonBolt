import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings, TypeEvenement } from '../types';
import { AppData, createEmptyAppData } from '../types/appData';

// Variables globales
let appData: AppData;
const STORAGE_KEY = 'association_data';

// Initialisation de la base de données JSON
export const initDatabase = async (): Promise<boolean> => {
  try {
    // Charger les données depuis localStorage
    const savedData = localStorage.getItem(STORAGE_KEY);
    
    if (savedData) {
      try {
        appData = JSON.parse(savedData);
        
        // Vérifier la structure des données et migrer si nécessaire
        if (!appData.version || !appData.settings) {
          console.log('Migration des données détectée...');
          appData = migrateData(appData);
        }
      } catch (parseError) {
        console.warn('Erreur lors du parsing des données sauvegardées, création de nouvelles données:', parseError);
        appData = createEmptyAppData();
      }
    } else {
      // Créer de nouvelles données par défaut
      appData = createEmptyAppData();
    }
    
    // Sauvegarder immédiatement pour s'assurer que la structure est correcte
    saveDatabase();
    
    console.log('Base de données JSON initialisée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données JSON:', error);
    return false;
  }
};

// Migration des données pour assurer la compatibilité
const migrateData = (data: any): AppData => {
  const newData = createEmptyAppData();
  
  // Copier les données existantes si elles existent
  if (data.adherents) newData.adherents = data.adherents;
  if (data.activites) newData.activites = data.activites;
  if (data.paiements) newData.paiements = data.paiements;
  if (data.taches) newData.taches = data.taches;
  if (data.evenements) newData.evenements = data.evenements;
  if (data.typesAdhesion) newData.typesAdhesion = data.typesAdhesion;
  if (data.modesPaiement) newData.modesPaiement = data.modesPaiement;
  if (data.saisons) newData.saisons = data.saisons;
  if (data.typesEvenement) newData.typesEvenement = data.typesEvenement;
  if (data.settings) newData.settings = data.settings;
  
  return newData;
};

// Sauvegarde de la base de données
export const saveDatabase = (): boolean => {
  try {
    if (!appData) return false;
    
    appData.lastModified = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
};

// Export des données vers un fichier JSON
export const exportToFile = (): void => {
  try {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `association-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
  }
};

// Import des données depuis un fichier JSON
export const importFromFile = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Valider la structure des données
        if (importedData && typeof importedData === 'object') {
          appData = migrateData(importedData);
          saveDatabase();
          resolve(true);
        } else {
          console.error('Format de données invalide');
          resolve(false);
        }
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Erreur lors de la lecture du fichier');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
};

// Fonctions pour les saisons
export const getSaisons = (): Saison[] => {
  return [...appData.saisons].sort((a, b) => new Date(b.dateDebut).getTime() - new Date(a.dateDebut).getTime());
};

export const getSaisonActive = (): string => {
  return appData.settings.saisonActive;
};

export const isSaisonTerminee = (): boolean => {
  const saisonActive = getSaisonActive();
  const saison = appData.saisons.find(s => s.nom === saisonActive);
  return saison ? saison.terminee : false;
};

export const setSaisonActive = (saisonId: string): boolean => {
  try {
    // Désactiver toutes les saisons
    appData.saisons.forEach(saison => {
      saison.active = false;
    });
    
    // Activer la saison sélectionnée
    const saison = appData.saisons.find(s => s.id === saisonId);
    if (saison) {
      saison.active = true;
      appData.settings.saisonActive = saison.nom;
      saveDatabase();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du changement de saison:', error);
    return false;
  }
};

export const addSaison = (saison: Saison): boolean => {
  try {
    // Ajouter la nouvelle saison
    appData.saisons.push(saison);
    
    // Copier les données de la saison précédente si elle existe
    const saisonPrecedente = appData.saisons.find(s => s.active && s.id !== saison.id);
    if (saisonPrecedente) {
      const nomSaisonPrecedente = saisonPrecedente.nom;
      
      // Copier les adhérents
      const adherentsPrecedents = appData.adherents.filter(a => a.saison === nomSaisonPrecedente);
      adherentsPrecedents.forEach(adherent => {
        const newAdherent: Adherent = {
          ...adherent,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          saison: saison.nom,
          activites: [], // Reset des activités pour la nouvelle saison
          createdAt: new Date().toISOString()
        };
        appData.adherents.push(newAdherent);
      });
      
      // Copier les activités
      const activitesPrecedentes = appData.activites.filter(a => a.saison === nomSaisonPrecedente);
      activitesPrecedentes.forEach(activite => {
        const newActivite: Activite = {
          ...activite,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          saison: saison.nom,
          adherents: [], // Reset des adhérents pour la nouvelle saison
          createdAt: new Date().toISOString()
        };
        appData.activites.push(newActivite);
      });
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de saison:', error);
    return false;
  }
};

export const updateSaison = (saison: Saison): boolean => {
  try {
    const index = appData.saisons.findIndex(s => s.id === saison.id);
    if (index !== -1) {
      appData.saisons[index] = saison;
      
      if (saison.active) {
        appData.settings.saisonActive = saison.nom;
      }
      
      saveDatabase();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de saison:', error);
    return false;
  }
};

export const deleteSaison = (id: string): boolean => {
  try {
    const saison = appData.saisons.find(s => s.id === id);
    if (!saison || saison.active) {
      return false;
    }
    
    const nomSaison = saison.nom;
    
    // Supprimer toutes les données liées
    appData.adherents = appData.adherents.filter(a => a.saison !== nomSaison);
    appData.activites = appData.activites.filter(a => a.saison !== nomSaison);
    appData.paiements = appData.paiements.filter(p => p.saison !== nomSaison);
    appData.saisons = appData.saisons.filter(s => s.id !== id);
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de saison:', error);
    return false;
  }
};

// Fonctions pour les adhérents
export const getAdherents = (): Adherent[] => {
  const saisonActive = getSaisonActive();
  return appData.adherents
    .filter(a => a.saison === saisonActive)
    .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`));
};

export const saveAdherent = (adherent: Adherent): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    const index = appData.adherents.findIndex(a => a.id === adherent.id);
    
    if (index !== -1) {
      // Mise à jour
      appData.adherents[index] = adherent;
    } else {
      // Insertion
      appData.adherents.push(adherent);
    }
    
    // Mettre à jour les relations avec les activités
    updateAdherentActivitiesRelations(adherent);
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'adhérent:', error);
    return false;
  }
};

export const deleteAdherent = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    // Supprimer l'adhérent
    appData.adherents = appData.adherents.filter(a => a.id !== id);
    
    // Supprimer l'adhérent des activités
    appData.activites.forEach(activite => {
      activite.adherents = activite.adherents.filter(adherentId => adherentId !== id);
    });
    
    // Supprimer les paiements de l'adhérent
    appData.paiements = appData.paiements.filter(p => p.adherentId !== id);
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'adhérent:', error);
    return false;
  }
};

// Fonction utilitaire pour mettre à jour les relations adhérent-activités
const updateAdherentActivitiesRelations = (adherent: Adherent): void => {
  // Supprimer l'adhérent de toutes les activités
  appData.activites.forEach(activite => {
    activite.adherents = activite.adherents.filter(id => id !== adherent.id);
  });
  
  // Ajouter l'adhérent aux activités sélectionnées
  adherent.activites.forEach(activiteId => {
    const activite = appData.activites.find(a => a.id === activiteId);
    if (activite && !activite.adherents.includes(adherent.id)) {
      activite.adherents.push(adherent.id);
    }
  });
};

// Fonctions pour les activités
export const getActivites = (): Activite[] => {
  const saisonActive = getSaisonActive();
  return appData.activites
    .filter(a => a.saison === saisonActive)
    .sort((a, b) => a.nom.localeCompare(b.nom));
};

export const saveActivite = (activite: Activite): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    const index = appData.activites.findIndex(a => a.id === activite.id);
    
    if (index !== -1) {
      // Mise à jour
      appData.activites[index] = activite;
    } else {
      // Insertion
      appData.activites.push(activite);
    }
    
    // Mettre à jour les relations avec les adhérents
    updateActiviteAdherentsRelations(activite);
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'activité:', error);
    return false;
  }
};

export const deleteActivite = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    // Supprimer l'activité
    appData.activites = appData.activites.filter(a => a.id !== id);
    
    // Supprimer l'activité des adhérents
    appData.adherents.forEach(adherent => {
      adherent.activites = adherent.activites.filter(activiteId => activiteId !== id);
    });
    
    // Supprimer les paiements de l'activité
    appData.paiements = appData.paiements.filter(p => p.activiteId !== id);
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'activité:', error);
    return false;
  }
};

// Fonction utilitaire pour mettre à jour les relations activité-adhérents
const updateActiviteAdherentsRelations = (activite: Activite): void => {
  // Supprimer l'activité de tous les adhérents
  appData.adherents.forEach(adherent => {
    adherent.activites = adherent.activites.filter(id => id !== activite.id);
  });
  
  // Ajouter l'activité aux adhérents sélectionnés
  activite.adherents.forEach(adherentId => {
    const adherent = appData.adherents.find(a => a.id === adherentId);
    if (adherent && !adherent.activites.includes(activite.id)) {
      adherent.activites.push(activite.id);
    }
  });
};

// Fonctions pour les paiements
export const getPaiements = (): Paiement[] => {
  const saisonActive = getSaisonActive();
  return appData.paiements
    .filter(p => p.saison === saisonActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const savePaiement = (paiement: Paiement): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    const index = appData.paiements.findIndex(p => p.id === paiement.id);
    
    if (index !== -1) {
      appData.paiements[index] = paiement;
    } else {
      appData.paiements.push(paiement);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du paiement:', error);
    return false;
  }
};

export const deletePaiement = (id: string): boolean => {
  if (isSaisonTerminee()) return false;
  
  try {
    appData.paiements = appData.paiements.filter(p => p.id !== id);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    return false;
  }
};

// Fonctions pour les tâches
export const getTaches = (): Tache[] => {
  return appData.taches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const saveTache = (tache: Tache): boolean => {
  try {
    const index = appData.taches.findIndex(t => t.id === tache.id);
    
    if (index !== -1) {
      appData.taches[index] = tache;
    } else {
      appData.taches.push(tache);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la tâche:', error);
    return false;
  }
};

export const deleteTache = (id: string): boolean => {
  try {
    appData.taches = appData.taches.filter(t => t.id !== id);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la tâche:', error);
    return false;
  }
};

// Fonctions pour les événements
export const getEvenements = (): EvenementAgenda[] => {
  return appData.evenements.sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
};

export const saveEvenement = (evenement: EvenementAgenda): boolean => {
  try {
    const index = appData.evenements.findIndex(e => e.id === evenement.id);
    
    if (index !== -1) {
      appData.evenements[index] = evenement;
    } else {
      appData.evenements.push(evenement);
    }
    
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'événement:', error);
    return false;
  }
};

export const deleteEvenement = (id: string): boolean => {
  try {
    appData.evenements = appData.evenements.filter(e => e.id !== id);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'événement:', error);
    return false;
  }
};

// Fonctions pour les types d'adhésion
export const getTypesAdhesion = (): TypeAdhesion[] => {
  return appData.typesAdhesion.sort((a, b) => a.nom.localeCompare(b.nom));
};

export const saveTypeAdhesion = (type: TypeAdhesion): boolean => {
  try {
    const index = appData.typesAdhesion.findIndex(t => t.id === type.id);
    
    if (index !== -1) {
      appData.typesAdhesion[index] = type;
    } else {
      appData.typesAdhesion.push(type);
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
    appData.typesAdhesion = appData.typesAdhesion.filter(t => t.id !== id);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du type d\'adhésion:', error);
    return false;
  }
};

// Fonctions pour les modes de paiement
export const getModesPaiement = (): ModePaiement[] => {
  return appData.modesPaiement.sort((a, b) => a.nom.localeCompare(b.nom));
};

export const saveModePaiement = (mode: ModePaiement): boolean => {
  try {
    const index = appData.modesPaiement.findIndex(m => m.id === mode.id);
    
    if (index !== -1) {
      appData.modesPaiement[index] = mode;
    } else {
      appData.modesPaiement.push(mode);
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
    appData.modesPaiement = appData.modesPaiement.filter(m => m.id !== id);
    saveDatabase();
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du mode de paiement:', error);
    return false;
  }
};

// Fonctions pour les types d'événement
export const getTypesEvenement = (): TypeEvenement[] => {
  return appData.typesEvenement.sort((a, b) => a.nom.localeCompare(b.nom));
};

export const saveTypeEvenement = (type: TypeEvenement): boolean => {
  try {
    const index = appData.typesEvenement.findIndex(t => t.id === type.id);
    
    if (index !== -1) {
      appData.typesEvenement[index] = type;
    } else {
      appData.typesEvenement.push(type);
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
    appData.typesEvenement = appData.typesEvenement.filter(t => t.id !== id);
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
    saisonActive: appData.settings.saisonActive,
    saisons: getSaisons()
  };
};

export const updateSettings = (settings: AppSettings): boolean => {
  try {
    appData.settings.saisonActive = settings.saisonActive;
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
    return {
      version: 'JSON',
      saisonActive: getSaisonActive(),
      totalAdherents: appData.adherents.length,
      totalActivites: appData.activites.length,
      totalPaiements: appData.paiements.length,
      totalTaches: appData.taches.length,
      totalEvenements: appData.evenements.length,
      storageSize: JSON.stringify(appData).length,
      lastModified: appData.lastModified
    };
  } catch (error) {
    console.error('Erreur diagnostic:', error);
    return null;
  }
};