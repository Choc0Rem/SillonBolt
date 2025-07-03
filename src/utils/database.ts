// Système de base de données ULTRA-OPTIMISÉ utilisant localStorage
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings, TypeEvenement, AppData } from '../types';

// Clés pour localStorage avec compression
const STORAGE_KEYS = {
  ADHERENTS: 'assoc_adh',
  ACTIVITES: 'assoc_act',
  PAIEMENTS: 'assoc_pay',
  TACHES: 'assoc_tsk',
  EVENEMENTS: 'assoc_evt',
  TYPES_ADHESION: 'assoc_typ',
  MODES_PAIEMENT: 'assoc_mod',
  TYPES_EVENEMENT: 'assoc_evtyp',
  SAISONS: 'assoc_ssn',
  SETTINGS: 'assoc_set'
};

// Cache multi-niveaux ultra-performant
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
  compressed?: boolean;
}

class UltraCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 500; // 500ms pour ultra-réactivité
  private readonly MAX_CACHE_SIZE = 50;
  private version = 0;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > this.CACHE_DURATION;
    const isOutdated = entry.version < this.version;
    
    if (isExpired || isOutdated) {
      this.cache.delete(key);
      return null;
    }
    
    return this.deepClone(entry.data);
  }

  set<T>(key: string, data: T): void {
    // Éviction LRU si cache plein
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: this.deepClone(data),
      timestamp: Date.now(),
      version: this.version
    });
  }

  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
      this.version++;
    }
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as any;
    
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  getStats() {
    return {
      size: this.cache.size,
      version: this.version,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance globale du cache
const ultraCache = new UltraCache();

// Compression simple pour réduire la taille de stockage
class DataCompressor {
  static compress(data: any): string {
    try {
      const json = JSON.stringify(data);
      // Compression basique par remplacement de patterns fréquents
      return json
        .replace(/"id":/g, '"i":')
        .replace(/"nom":/g, '"n":')
        .replace(/"prenom":/g, '"p":')
        .replace(/"email":/g, '"e":')
        .replace(/"telephone":/g, '"t":')
        .replace(/"saison":/g, '"s":')
        .replace(/"createdAt":/g, '"c":')
        .replace(/"adherents":/g, '"a":')
        .replace(/"activites":/g, '"ac":')
        .replace(/true/g, '1')
        .replace(/false/g, '0');
    } catch {
      return JSON.stringify(data);
    }
  }

  static decompress(compressed: string): any {
    try {
      const restored = compressed
        .replace(/"i":/g, '"id":')
        .replace(/"n":/g, '"nom":')
        .replace(/"p":/g, '"prenom":')
        .replace(/"e":/g, '"email":')
        .replace(/"t":/g, '"telephone":')
        .replace(/"s":/g, '"saison":')
        .replace(/"c":/g, '"createdAt":')
        .replace(/"a":/g, '"adherents":')
        .replace(/"ac":/g, '"activites":')
        .replace(/(?<!")1(?!")/g, 'true')
        .replace(/(?<!")0(?!")/g, 'false');
      
      return JSON.parse(restored);
    } catch {
      return JSON.parse(compressed);
    }
  }
}

// Gestionnaire d'erreurs centralisé
class ErrorHandler {
  private static errors: string[] = [];

  static handle(operation: string, error: any): void {
    const errorMsg = `❌ ${operation}: ${error.message || error}`;
    console.error(errorMsg, error);
    this.errors.push(errorMsg);
    
    // Garder seulement les 10 dernières erreurs
    if (this.errors.length > 10) {
      this.errors.shift();
    }
  }

  static getErrors(): string[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }
}

// Fonction de sauvegarde ultra-optimisée
const saveToStorage = (key: string, data: any): boolean => {
  try {
    const startTime = performance.now();
    
    // Compression des données
    const compressed = DataCompressor.compress(data);
    localStorage.setItem(key, compressed);
    
    // Mise à jour du cache
    ultraCache.set(key, data);
    
    const duration = performance.now() - startTime;
    console.log(`✅ Sauvegarde ${key}: ${duration.toFixed(2)}ms, ${compressed.length} chars`);
    
    return true;
  } catch (error) {
    ErrorHandler.handle(`Sauvegarde ${key}`, error);
    ultraCache.invalidate(key);
    return false;
  }
};

// Fonction de chargement ultra-optimisée
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    // Vérifier le cache d'abord
    const cached = ultraCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const startTime = performance.now();
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const decompressed = DataCompressor.decompress(stored);
      ultraCache.set(key, decompressed);
      
      const duration = performance.now() - startTime;
      console.log(`📖 Chargement ${key}: ${duration.toFixed(2)}ms`);
      
      return decompressed;
    }
    
    // Sauvegarder la valeur par défaut
    saveToStorage(key, defaultValue);
    return defaultValue;
  } catch (error) {
    ErrorHandler.handle(`Chargement ${key}`, error);
    ultraCache.invalidate(key);
    return defaultValue;
  }
};

// Générateur d'IDs optimisé
class IDGenerator {
  private static counter = 0;
  private static prefix = Date.now().toString(36);

  static generate(type: string): string {
    this.counter++;
    return `${type}_${this.prefix}_${this.counter.toString(36)}`;
  }

  static reset(): void {
    this.counter = 0;
    this.prefix = Date.now().toString(36);
  }
}

// Batch operations pour optimiser les écritures multiples
class BatchOperations {
  private static pendingOperations = new Map<string, any>();
  private static batchTimeout: NodeJS.Timeout | null = null;

  static schedule(key: string, data: any): void {
    this.pendingOperations.set(key, data);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flush();
    }, 100); // Batch après 100ms
  }

  static flush(): void {
    const operations = Array.from(this.pendingOperations.entries());
    this.pendingOperations.clear();
    
    if (operations.length === 0) return;
    
    console.log(`🔄 Exécution batch: ${operations.length} opérations`);
    
    operations.forEach(([key, data]) => {
      saveToStorage(key, data);
    });
  }

  static forceFlush(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.flush();
  }
}

// Générateur de saisons optimisé avec mise en cache
const generateSeasonOptions = (() => {
  let cachedOptions: string[] | null = null;
  
  return (): string[] => {
    if (cachedOptions) return cachedOptions;
    
    const startYear = 2025;
    const seasons = [];
    
    for (let year = startYear; year < startYear + 25; year++) {
      seasons.push(`${year}-${year + 1}`);
    }
    
    cachedOptions = seasons;
    return seasons;
  };
})();

// Fonctions de copie optimisées avec traitement par chunks
const copyDataToNewSeason = async (fromSeason: string, toSeason: string): Promise<boolean> => {
  try {
    console.log(`🔄 Copie des données: ${fromSeason} → ${toSeason}`);
    
    const [allAdherents, allActivites] = await Promise.all([
      Promise.resolve(loadFromStorage<Adherent[]>(STORAGE_KEYS.ADHERENTS, [])),
      Promise.resolve(loadFromStorage<Activite[]>(STORAGE_KEYS.ACTIVITES, []))
    ]);
    
    const adherentsFromPrevious = allAdherents.filter(a => a.saison === fromSeason);
    const activitesFromPrevious = allActivites.filter(a => a.saison === fromSeason);
    
    if (adherentsFromPrevious.length === 0 && activitesFromPrevious.length === 0) {
      console.log(`ℹ️ Aucune donnée à copier depuis ${fromSeason}`);
      return true;
    }
    
    // Traitement par chunks pour éviter les blocages
    const CHUNK_SIZE = 50;
    const newAdherents: Adherent[] = [];
    const newActivites: Activite[] = [];
    
    // Copie des adhérents par chunks
    for (let i = 0; i < adherentsFromPrevious.length; i += CHUNK_SIZE) {
      const chunk = adherentsFromPrevious.slice(i, i + CHUNK_SIZE);
      const processedChunk = chunk.map(adherent => ({
        ...adherent,
        id: IDGenerator.generate('adh'),
        saison: toSeason,
        activites: [],
        createdAt: new Date().toISOString()
      }));
      newAdherents.push(...processedChunk);
      
      // Yield pour éviter le blocage
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Copie des activités par chunks
    for (let i = 0; i < activitesFromPrevious.length; i += CHUNK_SIZE) {
      const chunk = activitesFromPrevious.slice(i, i + CHUNK_SIZE);
      const processedChunk = chunk.map(activite => ({
        ...activite,
        id: IDGenerator.generate('act'),
        saison: toSeason,
        adherents: [],
        createdAt: new Date().toISOString()
      }));
      newActivites.push(...processedChunk);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Sauvegarde en batch
    const updatedAdherents = [...allAdherents, ...newAdherents];
    const updatedActivites = [...allActivites, ...newActivites];
    
    const [adherentSuccess, activiteSuccess] = await Promise.all([
      Promise.resolve(saveToStorage(STORAGE_KEYS.ADHERENTS, updatedAdherents)),
      Promise.resolve(saveToStorage(STORAGE_KEYS.ACTIVITES, updatedActivites))
    ]);
    
    if (adherentSuccess && activiteSuccess) {
      console.log(`✅ Copie terminée: ${newAdherents.length} adhérents, ${newActivites.length} activités`);
      return true;
    }
    
    return false;
  } catch (error) {
    ErrorHandler.handle('Copie des données', error);
    return false;
  }
};

// Initialisation ultra-rapide
export const initDatabase = async (): Promise<boolean> => {
  try {
    console.log('🚀 Initialisation ultra-rapide...');
    const startTime = performance.now();
    
    // Vérification parallèle de l'existence des données
    const checks = await Promise.all([
      Promise.resolve(localStorage.getItem(STORAGE_KEYS.SETTINGS)),
      Promise.resolve(localStorage.getItem(STORAGE_KEYS.SAISONS)),
      Promise.resolve(localStorage.getItem(STORAGE_KEYS.TYPES_ADHESION))
    ]);
    
    const [existingSettings, existingSaisons, existingTypes] = checks;
    
    if (!existingSettings || !existingSaisons || !existingTypes) {
      console.log('🆕 Création des données par défaut...');
      await createDefaultData();
    } else {
      console.log('🔍 Vérification rapide de l\'intégrité...');
      await quickIntegrityCheck();
    }
    
    const duration = performance.now() - startTime;
    console.log(`✅ Initialisation terminée en ${duration.toFixed(2)}ms`);
    
    return true;
  } catch (error) {
    ErrorHandler.handle('Initialisation', error);
    return false;
  }
};

// Vérification d'intégrité rapide
const quickIntegrityCheck = async (): Promise<void> => {
  try {
    const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { 
      saisonActive: '2025-2026',
      theme: 'light',
      notifications: true,
      language: 'fr'
    });
    const saisons = loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
    
    if (saisons.length === 0 || !settings.saisonActive) {
      await createDefaultData();
    }
  } catch (error) {
    ErrorHandler.handle('Vérification intégrité', error);
    await createDefaultData();
  }
};

// Création de données par défaut optimisée
const createDefaultData = async (): Promise<void> => {
  const currentSeason = '2025-2026';
  
  const defaultData = {
    saisons: [{
      id: 'season_2025',
      nom: currentSeason,
      dateDebut: '2025-09-01',
      dateFin: '2026-08-31',
      active: true,
      terminee: false
    }],
    settings: { 
      saisonActive: currentSeason,
      theme: 'light' as const,
      notifications: true,
      language: 'fr'
    },
    typesAdhesion: [
      { id: 'type_1', nom: 'Individuelle', prix: 50 },
      { id: 'type_2', nom: 'Famille', prix: 80 }
    ],
    modesPaiement: [
      { id: 'mode_1', nom: 'Espèces' },
      { id: 'mode_2', nom: 'Chèque' },
      { id: 'mode_3', nom: 'Virement' }
    ],
    typesEvenement: [
      { id: 'evt_1', nom: 'Activité', couleur: '#3B82F6' },
      { id: 'evt_2', nom: 'Réunion', couleur: '#10B981' },
      { id: 'evt_3', nom: 'Événement', couleur: '#8B5CF6' }
    ]
  };
  
  // Sauvegarde en parallèle
  await Promise.all([
    Promise.resolve(saveToStorage(STORAGE_KEYS.SAISONS, defaultData.saisons)),
    Promise.resolve(saveToStorage(STORAGE_KEYS.SETTINGS, defaultData.settings)),
    Promise.resolve(saveToStorage(STORAGE_KEYS.TYPES_ADHESION, defaultData.typesAdhesion)),
    Promise.resolve(saveToStorage(STORAGE_KEYS.MODES_PAIEMENT, defaultData.modesPaiement)),
    Promise.resolve(saveToStorage(STORAGE_KEYS.TYPES_EVENEMENT, defaultData.typesEvenement)),
    Promise.resolve(saveToStorage(STORAGE_KEYS.ADHERENTS, [])),
    Promise.resolve(saveToStorage(STORAGE_KEYS.ACTIVITES, [])),
    Promise.resolve(saveToStorage(STORAGE_KEYS.PAIEMENTS, [])),
    Promise.resolve(saveToStorage(STORAGE_KEYS.TACHES, [])),
    Promise.resolve(saveToStorage(STORAGE_KEYS.EVENEMENTS, []))
  ]);
  
  console.log('✅ Données par défaut créées');
};

// Fonctions publiques optimisées
export const getSaisons = (): Saison[] => loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
export const getSeasonOptions = (): string[] => generateSeasonOptions();
export const getSaisonActive = (): string => {
  const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { 
    saisonActive: '2025-2026',
    theme: 'light',
    notifications: true,
    language: 'fr'
  });
  return settings.saisonActive || '2025-2026';
};

export const setSaisonActive = (saisonId: string): boolean => {
  try {
    const saisons = loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const saison = saisons.find(s => s.id === saisonId);
    
    if (!saison) return false;

    const updatedSaisons = saisons.map(s => ({ ...s, active: s.id === saisonId }));
    const currentSettings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { 
      saisonActive: '2025-2026',
      theme: 'light',
      notifications: true,
      language: 'fr'
    });
    const updatedSettings = { ...currentSettings, saisonActive: saison.nom };

    const success = saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons) && 
                   saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
    
    if (success) {
      ultraCache.invalidate();
    }
    
    return success;
  } catch (error) {
    ErrorHandler.handle('Changement saison', error);
    return false;
  }
};

export const addSaison = (seasonName: string, dateDebut: string, dateFin: string): boolean => {
  try {
    const saisons = loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
    
    if (saisons.find(s => s.nom === seasonName)) return false;

    const newSaison: Saison = {
      id: IDGenerator.generate('season'),
      nom: seasonName,
      dateDebut,
      dateFin,
      active: false,
      terminee: false
    };
    
    const success = saveToStorage(STORAGE_KEYS.SAISONS, [...saisons, newSaison]);
    
    if (success) {
      // Copie asynchrone des données
      const saisonActive = getSaisonActive();
      if (saisonActive && saisonActive !== seasonName) {
        copyDataToNewSeason(saisonActive, seasonName);
      }
      ultraCache.invalidate();
    }
    
    return success;
  } catch (error) {
    ErrorHandler.handle('Ajout saison', error);
    return false;
  }
};

export const updateSaison = (saison: Saison): boolean => {
  try {
    const saisons = loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const updatedSaisons = saisons.map(s => s.id === saison.id ? { ...saison } : s);
    
    const success = saveToStorage(STORAGE_KEYS.SAISONS, updatedSaisons);
    
    if (success && saison.active) {
      const currentSettings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { 
        saisonActive: '2025-2026',
        theme: 'light',
        notifications: true,
        language: 'fr'
      });
      saveToStorage(STORAGE_KEYS.SETTINGS, { ...currentSettings, saisonActive: saison.nom });
      ultraCache.invalidate();
    }
    
    return success;
  } catch (error) {
    ErrorHandler.handle('Mise à jour saison', error);
    return false;
  }
};

export const deleteSaison = (id: string): boolean => {
  try {
    const saisons = loadFromStorage<Saison[]>(STORAGE_KEYS.SAISONS, []);
    const saisonToDelete = saisons.find(s => s.id === id);
    
    if (!saisonToDelete || saisonToDelete.active || saisons.length <= 1) {
      return false;
    }
    
    // Suppression en batch
    const operations = [
      { key: STORAGE_KEYS.ADHERENTS, filter: (a: Adherent) => a.saison !== saisonToDelete.nom },
      { key: STORAGE_KEYS.ACTIVITES, filter: (a: Activite) => a.saison !== saisonToDelete.nom },
      { key: STORAGE_KEYS.PAIEMENTS, filter: (p: Paiement) => p.saison !== saisonToDelete.nom },
      { key: STORAGE_KEYS.SAISONS, filter: (s: Saison) => s.id !== id }
    ];
    
    const results = operations.map(({ key, filter }) => {
      const data = loadFromStorage(key, []);
      return saveToStorage(key, data.filter(filter));
    });
    
    if (results.every(r => r)) {
      ultraCache.invalidate();
      return true;
    }
    
    return false;
  } catch (error) {
    ErrorHandler.handle('Suppression saison', error);
    return false;
  }
};

// Fonctions CRUD optimisées avec templates
const createCRUDOperations = <T extends { id: string; saison?: string }>(
  storageKey: string,
  filterBySeason: boolean = false
) => ({
  getAll: (): T[] => {
    const data = loadFromStorage<T[]>(storageKey, []);
    if (!filterBySeason) return data;
    
    const saisonActive = getSaisonActive();
    return data.filter(item => item.saison === saisonActive);
  },
  
  setAll: (items: T[]): boolean => {
    try {
      return saveToStorage(storageKey, items);
    } catch (error) {
      ErrorHandler.handle(`Sauvegarde complète ${storageKey}`, error);
      return false;
    }
  },
  
  save: (item: T): boolean => {
    try {
      const allItems = loadFromStorage<T[]>(storageKey, []);
      const existingIndex = allItems.findIndex(i => i.id === item.id);
      
      let updatedItems;
      if (existingIndex >= 0) {
        updatedItems = [...allItems];
        updatedItems[existingIndex] = { ...item };
      } else {
        updatedItems = [...allItems, { ...item }];
      }
      
      return saveToStorage(storageKey, updatedItems);
    } catch (error) {
      ErrorHandler.handle(`Sauvegarde ${storageKey}`, error);
      return false;
    }
  },
  
  delete: (id: string): boolean => {
    try {
      const allItems = loadFromStorage<T[]>(storageKey, []);
      const updatedItems = allItems.filter(item => item.id !== id);
      return saveToStorage(storageKey, updatedItems);
    } catch (error) {
      ErrorHandler.handle(`Suppression ${storageKey}`, error);
      return false;
    }
  }
});

// Création des opérations CRUD pour chaque type
const adherentOps = createCRUDOperations<Adherent>(STORAGE_KEYS.ADHERENTS, true);
const activiteOps = createCRUDOperations<Activite>(STORAGE_KEYS.ACTIVITES, true);
const paiementOps = createCRUDOperations<Paiement>(STORAGE_KEYS.PAIEMENTS, true);
const tacheOps = createCRUDOperations<Tache>(STORAGE_KEYS.TACHES, false);
const evenementOps = createCRUDOperations<EvenementAgenda>(STORAGE_KEYS.EVENEMENTS, false);
const typeAdhesionOps = createCRUDOperations<TypeAdhesion>(STORAGE_KEYS.TYPES_ADHESION, false);
const modePaiementOps = createCRUDOperations<ModePaiement>(STORAGE_KEYS.MODES_PAIEMENT, false);
const typeEvenementOps = createCRUDOperations<TypeEvenement>(STORAGE_KEYS.TYPES_EVENEMENT, false);

// Export des fonctions optimisées
export const getAdherents = adherentOps.getAll;
export const setAdherents = adherentOps.setAll;
export const saveAdherent = adherentOps.save;
export const deleteAdherent = adherentOps.delete;

export const getActivites = activiteOps.getAll;
export const setActivites = activiteOps.setAll;
export const saveActivite = activiteOps.save;
export const deleteActivite = activiteOps.delete;

export const getPaiements = paiementOps.getAll;
export const setPaiements = paiementOps.setAll;
export const savePaiement = paiementOps.save;
export const deletePaiement = paiementOps.delete;

export const getTaches = tacheOps.getAll;
export const setTaches = tacheOps.setAll;
export const saveTache = tacheOps.save;
export const deleteTache = tacheOps.delete;

export const getEvenements = evenementOps.getAll;
export const setEvenements = evenementOps.setAll;
export const saveEvenement = evenementOps.save;
export const deleteEvenement = evenementOps.delete;

export const getTypesAdhesion = typeAdhesionOps.getAll;
export const setTypesAdhesion = typeAdhesionOps.setAll;
export const saveTypeAdhesion = typeAdhesionOps.save;
export const deleteTypeAdhesion = typeAdhesionOps.delete;

export const getModesPaiement = modePaiementOps.getAll;
export const setModesPaiement = modePaiementOps.setAll;
export const saveModePaiement = modePaiementOps.save;
export const deleteModePaiement = modePaiementOps.delete;

export const getTypesEvenement = typeEvenementOps.getAll;
export const setTypesEvenement = typeEvenementOps.setAll;
export const saveTypeEvenement = typeEvenementOps.save;
export const deleteTypeEvenement = typeEvenementOps.delete;

export const getSettings = (): AppSettings => 
  loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, { 
    saisonActive: '2025-2026',
    theme: 'light',
    notifications: true,
    language: 'fr'
  });

export const updateSettings = (settings: AppSettings): boolean => 
  saveToStorage(STORAGE_KEYS.SETTINGS, settings);

// Nouvelles fonctions loadData et saveData
export const loadData = (): AppData => {
  try {
    return {
      adherents: getAdherents(),
      activites: getActivites(),
      paiements: getPaiements(),
      taches: getTaches(),
      evenements: getEvenements(),
      saisons: getSaisons(),
      typesAdhesion: getTypesAdhesion(),
      modesPaiement: getModesPaiement(),
      typesEvenement: getTypesEvenement(),
      settings: getSettings()
    };
  } catch (error) {
    ErrorHandler.handle('Chargement des données', error);
    return {
      adherents: [],
      activites: [],
      paiements: [],
      taches: [],
      evenements: [],
      saisons: [],
      typesAdhesion: [],
      modesPaiement: [],
      typesEvenement: [],
      settings: { 
        saisonActive: '2025-2026',
        theme: 'light',
        notifications: true,
        language: 'fr'
      }
    };
  }
};

export const saveData = (data: AppData): boolean => {
  try {
    const results = [
      setAdherents(data.adherents),
      setActivites(data.activites),
      setPaiements(data.paiements),
      setTaches(data.taches),
      setEvenements(data.evenements),
      saveToStorage(STORAGE_KEYS.SAISONS, data.saisons),
      setTypesAdhesion(data.typesAdhesion),
      setModesPaiement(data.modesPaiement),
      setTypesEvenement(data.typesEvenement),
      updateSettings(data.settings)
    ];
    
    const success = results.every(result => result);
    
    if (success) {
      ultraCache.invalidate();
    }
    
    return success;
  } catch (error) {
    ErrorHandler.handle('Sauvegarde des données', error);
    return false;
  }
};

// Fonctions utilitaires avancées
export const getDatabaseInfo = () => ({
  version: 'Ultra-Optimisé v3.0',
  saisonActive: getSaisonActive(),
  stats: {
    adherents: getAdherents().length,
    activites: getActivites().length,
    paiements: getPaiements().length,
    taches: getTaches().length,
    evenements: getEvenements().length
  },
  cache: ultraCache.getStats(),
  errors: ErrorHandler.getErrors(),
  performance: {
    storageSize: Object.values(STORAGE_KEYS).reduce((total, key) => 
      total + (localStorage.getItem(key)?.length || 0), 0
    )
  }
});

export const clearDatabase = (): boolean => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    ultraCache.invalidate();
    ErrorHandler.clearErrors();
    IDGenerator.reset();
    BatchOperations.forceFlush();
    return true;
  } catch (error) {
    ErrorHandler.handle('Vidage base', error);
    return false;
  }
};

export const exportDatabase = (): string => {
  try {
    BatchOperations.forceFlush();
    
    const data = Object.fromEntries(
      Object.entries(STORAGE_KEYS).map(([key, storageKey]) => [
        key.toLowerCase(),
        loadFromStorage(storageKey, [])
      ])
    );
    
    return JSON.stringify({
      ...data,
      metadata: {
        version: '3.0',
        exportDate: new Date().toISOString(),
        stats: getDatabaseInfo().stats
      }
    }, null, 2);
  } catch (error) {
    ErrorHandler.handle('Export', error);
    return '';
  }
};

export const importDatabase = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data || typeof data !== 'object') {
      throw new Error('Format invalide');
    }
    
    // Import en parallèle
    const importPromises = Object.entries(STORAGE_KEYS).map(([key, storageKey]) => {
      const dataKey = key.toLowerCase();
      if (data[dataKey]) {
        return Promise.resolve(saveToStorage(storageKey, data[dataKey]));
      }
      return Promise.resolve(true);
    });
    
    const results = Promise.all(importPromises);
    ultraCache.invalidate();
    
    return true;
  } catch (error) {
    ErrorHandler.handle('Import', error);
    return false;
  }
};

// Nettoyage automatique en arrière-plan
setInterval(() => {
  BatchOperations.forceFlush();
}, 30000); // Toutes les 30 secondes

// Nettoyage à la fermeture
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    BatchOperations.forceFlush();
  });
}