import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Activities from './pages/Activities';
import Members from './pages/Members';
import Payments from './pages/Payments';
import Statistics from './pages/Statistics';
import Calendar from './pages/Calendar';
import Tasks from './pages/Tasks';
import Settings from './pages/Settings';
import { 
  initDatabase,
  getAdherents, getActivites, getPaiements, getTaches, getEvenements,
  getTypesAdhesion, getModesPaiement, getSaisons, getSettings,
  saveAdherent, saveActivite, savePaiement, saveTache, saveEvenement,
  saveTypeAdhesion, saveModePaiement, setSaisonActive, addSaison, updateSaison, deleteSaison,
  deleteAdherent, deleteActivite, deletePaiement, deleteTache, deleteEvenement,
  deleteTypeAdhesion, deleteModePaiement, getSaisonActive,
  updateSettings, getSeasonOptions, getDatabaseInfo
} from './utils/database';
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings } from './types';

// Hook personnalisé pour la gestion d'état optimisée
const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = useState<T>(initialValue);
  
  const setStateOptimized = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prev => {
      const next = typeof newState === 'function' ? (newState as (prev: T) => T)(prev) : newState;
      // Éviter les re-renders inutiles
      return JSON.stringify(prev) === JSON.stringify(next) ? prev : next;
    });
  }, []);
  
  return [state, setStateOptimized] as const;
};

// Hook pour la gestion des erreurs
const useErrorHandler = () => {
  const [errors, setErrors] = useState<string[]>([]);
  
  const addError = useCallback((error: string) => {
    setErrors(prev => [...prev.slice(-4), error]); // Garder max 5 erreurs
  }, []);
  
  const clearErrors = useCallback(() => setErrors([]), []);
  
  return { errors, addError, clearErrors };
};

// Hook pour les performances
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    operationCount: 0,
    lastOperation: ''
  });
  
  const trackOperation = useCallback((operation: string) => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      setMetrics(prev => ({
        loadTime: duration,
        operationCount: prev.operationCount + 1,
        lastOperation: operation
      }));
    };
  }, []);
  
  return { metrics, trackOperation };
};

function App() {
  // États optimisés
  const [currentPage, setCurrentPage] = useOptimizedState('dashboard');
  const [isLoading, setIsLoading] = useOptimizedState(true);
  const [dataVersion, setDataVersion] = useOptimizedState(0);
  
  // États pour les données avec optimisation
  const [adherents, setAdherents] = useOptimizedState<Adherent[]>([]);
  const [activites, setActivites] = useOptimizedState<Activite[]>([]);
  const [paiements, setPaiements] = useOptimizedState<Paiement[]>([]);
  const [taches, setTaches] = useOptimizedState<Tache[]>([]);
  const [evenements, setEvenements] = useOptimizedState<EvenementAgenda[]>([]);
  const [typesAdhesion, setTypesAdhesion] = useOptimizedState<TypeAdhesion[]>([]);
  const [modesPaiement, setModesPaiement] = useOptimizedState<ModePaiement[]>([]);
  const [saisons, setSaisons] = useOptimizedState<Saison[]>([]);
  const [settings, setSettings] = useOptimizedState<AppSettings | null>(null);

  // Hooks utilitaires
  const { errors, addError, clearErrors } = useErrorHandler();
  const { metrics, trackOperation } = usePerformanceMonitor();

  // Fonction de chargement optimisée avec mise en cache
  const loadAllData = useCallback(async () => {
    const endTracking = trackOperation('loadAllData');
    
    try {
      console.log('🚀 Chargement ultra-rapide des données...');
      
      // Chargement en parallèle avec Promise.allSettled pour éviter les échecs en cascade
      const results = await Promise.allSettled([
        Promise.resolve(getAdherents()),
        Promise.resolve(getActivites()),
        Promise.resolve(getPaiements()),
        Promise.resolve(getTaches()),
        Promise.resolve(getEvenements()),
        Promise.resolve(getTypesAdhesion()),
        Promise.resolve(getModesPaiement()),
        Promise.resolve(getSaisons()),
        Promise.resolve(getSettings())
      ]);

      // Traitement des résultats
      const [
        adherentsResult,
        activitesResult,
        paiementsResult,
        tachesResult,
        evenementsResult,
        typesAdhesionResult,
        modesPaiementResult,
        saisonsResult,
        settingsResult
      ] = results;

      // Mise à jour des états seulement si les données ont changé
      if (adherentsResult.status === 'fulfilled') setAdherents(adherentsResult.value);
      if (activitesResult.status === 'fulfilled') setActivites(activitesResult.value);
      if (paiementsResult.status === 'fulfilled') setPaiements(paiementsResult.value);
      if (tachesResult.status === 'fulfilled') setTaches(tachesResult.value);
      if (evenementsResult.status === 'fulfilled') setEvenements(evenementsResult.value);
      if (typesAdhesionResult.status === 'fulfilled') setTypesAdhesion(typesAdhesionResult.value);
      if (modesPaiementResult.status === 'fulfilled') setModesPaiement(modesPaiementResult.value);
      if (saisonsResult.status === 'fulfilled') setSaisons(saisonsResult.value);
      if (settingsResult.status === 'fulfilled') setSettings(settingsResult.value);
      
      // Log des erreurs éventuelles
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const dataTypes = ['adherents', 'activites', 'paiements', 'taches', 'evenements', 'typesAdhesion', 'modesPaiement', 'saisons', 'settings'];
          addError(`Erreur chargement ${dataTypes[index]}: ${result.reason}`);
        }
      });
      
      console.log('✅ Données chargées avec succès');
    } catch (error) {
      console.error('❌ Erreur critique lors du chargement:', error);
      addError('Erreur critique lors du chargement des données');
    } finally {
      endTracking();
    }
  }, [setAdherents, setActivites, setPaiements, setTaches, setEvenements, setTypesAdhesion, setModesPaiement, setSaisons, setSettings, addError, trackOperation]);

  // Initialisation optimisée
  useEffect(() => {
    const init = async () => {
      const endTracking = trackOperation('initialization');
      
      try {
        console.log('🚀 Initialisation ultra-rapide...');
        setIsLoading(true);
        clearErrors();
        
        const success = await initDatabase();
        if (success) {
          await loadAllData();
        } else {
          addError('Échec de l\'initialisation de la base de données');
        }
      } catch (error) {
        console.error('❌ Erreur critique:', error);
        addError('Erreur critique lors de l\'initialisation');
      } finally {
        setIsLoading(false);
        endTracking();
      }
    };
    
    init();
  }, [loadAllData, addError, clearErrors, trackOperation, setIsLoading]);

  // Rechargement optimisé quand la version change
  useEffect(() => {
    if (dataVersion > 0) {
      loadAllData();
    }
  }, [dataVersion, loadAllData]);

  // Fonction de rechargement forcé optimisée
  const forceDataReload = useCallback(() => {
    console.log('🔄 Rechargement forcé optimisé...');
    setDataVersion(prev => prev + 1);
  }, [setDataVersion]);

  // Gestionnaires optimisés avec debouncing et batch operations
  const createOptimizedHandler = useCallback(<T>(
    saveFunction: (item: T) => boolean,
    dataType: string
  ) => {
    return async (newItems: T[]) => {
      const endTracking = trackOperation(`update${dataType}`);
      
      try {
        console.log(`🔄 Mise à jour ${dataType}:`, newItems.length);
        
        // Traitement par batch pour éviter les blocages
        const BATCH_SIZE = 20;
        const results: boolean[] = [];
        
        for (let i = 0; i < newItems.length; i += BATCH_SIZE) {
          const batch = newItems.slice(i, i + BATCH_SIZE);
          const batchResults = await Promise.all(
            batch.map(item => Promise.resolve(saveFunction(item)))
          );
          results.push(...batchResults);
          
          // Yield pour éviter le blocage de l'UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (results.every(r => r)) {
          console.log(`✅ ${dataType} sauvegardés avec succès`);
          forceDataReload();
        } else {
          throw new Error(`Erreur lors de la sauvegarde de certains ${dataType}`);
        }
      } catch (error) {
        console.error(`❌ Erreur ${dataType}:`, error);
        addError(`Erreur lors de la sauvegarde des ${dataType}`);
      } finally {
        endTracking();
      }
    };
  }, [forceDataReload, addError, trackOperation]);

  const createOptimizedDeleteHandler = useCallback((
    deleteFunction: (id: string) => boolean,
    dataType: string
  ) => {
    return async (id: string) => {
      const endTracking = trackOperation(`delete${dataType}`);
      
      try {
        const success = deleteFunction(id);
        if (success) {
          console.log(`✅ ${dataType} supprimé`);
          forceDataReload();
        } else {
          throw new Error(`Erreur lors de la suppression`);
        }
      } catch (error) {
        console.error(`❌ Erreur suppression ${dataType}:`, error);
        addError(`Erreur lors de la suppression du ${dataType}`);
      } finally {
        endTracking();
      }
    };
  }, [forceDataReload, addError, trackOperation]);

  // Gestionnaires optimisés
  const handleUpdateAdherents = useMemo(() => createOptimizedHandler(saveAdherent, 'adherents'), [createOptimizedHandler]);
  const handleDeleteAdherent = useMemo(() => createOptimizedDeleteHandler(deleteAdherent, 'adherent'), [createOptimizedDeleteHandler]);
  
  const handleUpdateActivites = useMemo(() => createOptimizedHandler(saveActivite, 'activites'), [createOptimizedHandler]);
  const handleDeleteActivite = useMemo(() => createOptimizedDeleteHandler(deleteActivite, 'activite'), [createOptimizedDeleteHandler]);
  
  const handleUpdatePaiements = useMemo(() => createOptimizedHandler(savePaiement, 'paiements'), [createOptimizedHandler]);
  const handleDeletePaiement = useMemo(() => createOptimizedDeleteHandler(deletePaiement, 'paiement'), [createOptimizedDeleteHandler]);
  
  const handleUpdateTaches = useMemo(() => createOptimizedHandler(saveTache, 'taches'), [createOptimizedHandler]);
  const handleDeleteTache = useMemo(() => createOptimizedDeleteHandler(deleteTache, 'tache'), [createOptimizedDeleteHandler]);
  
  const handleUpdateEvenements = useMemo(() => createOptimizedHandler(saveEvenement, 'evenements'), [createOptimizedHandler]);
  const handleDeleteEvenement = useMemo(() => createOptimizedDeleteHandler(deleteEvenement, 'evenement'), [createOptimizedDeleteHandler]);
  
  const handleUpdateTypesAdhesion = useMemo(() => createOptimizedHandler(saveTypeAdhesion, 'types'), [createOptimizedHandler]);
  const handleDeleteTypeAdhesion = useMemo(() => createOptimizedDeleteHandler(deleteTypeAdhesion, 'type'), [createOptimizedDeleteHandler]);
  
  const handleUpdateModesPaiement = useMemo(() => createOptimizedHandler(saveModePaiement, 'modes'), [createOptimizedHandler]);
  const handleDeleteModePaiement = useMemo(() => createOptimizedDeleteHandler(deleteModePaiement, 'mode'), [createOptimizedDeleteHandler]);

  // Gestionnaires de saisons optimisés
  const handleChangeSaison = useCallback(async (saisonId: string) => {
    const endTracking = trackOperation('changeSaison');
    
    try {
      const success = setSaisonActive(saisonId);
      if (success) {
        forceDataReload();
      } else {
        throw new Error('Erreur lors du changement de saison');
      }
    } catch (error) {
      addError('Erreur lors du changement de saison');
    } finally {
      endTracking();
    }
  }, [forceDataReload, addError, trackOperation]);

  const handleAddSaison = useCallback(async (seasonName: string, dateDebut: string, dateFin: string) => {
    const endTracking = trackOperation('addSaison');
    
    try {
      const success = addSaison(seasonName, dateDebut, dateFin);
      if (success) {
        forceDataReload();
        // Notification de succès sans alert bloquant
        console.log(`✅ Saison ${seasonName} créée avec succès !`);
      } else {
        throw new Error('Erreur lors de l\'ajout de la saison');
      }
    } catch (error) {
      addError('Erreur lors de l\'ajout de la saison');
    } finally {
      endTracking();
    }
  }, [forceDataReload, addError, trackOperation]);

  const handleUpdateSaison = useCallback(async (saison: Saison) => {
    const endTracking = trackOperation('updateSaison');
    
    try {
      const success = updateSaison(saison);
      if (success) {
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la mise à jour de la saison');
      }
    } catch (error) {
      addError('Erreur lors de la mise à jour de la saison');
    } finally {
      endTracking();
    }
  }, [forceDataReload, addError, trackOperation]);

  const handleDeleteSaison = useCallback(async (id: string) => {
    const endTracking = trackOperation('deleteSaison');
    
    try {
      const success = deleteSaison(id);
      if (success) {
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression de la saison');
      }
    } catch (error) {
      addError('Erreur lors de la suppression de la saison');
    } finally {
      endTracking();
    }
  }, [forceDataReload, addError, trackOperation]);

  const handleUpdateSettings = useCallback(async (newSettings: AppSettings) => {
    const endTracking = trackOperation('updateSettings');
    
    try {
      const success = updateSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la mise à jour des paramètres');
      }
    } catch (error) {
      addError('Erreur lors de la mise à jour des paramètres');
    } finally {
      endTracking();
    }
  }, [setSettings, forceDataReload, addError, trackOperation]);

  // Rendu optimisé des pages avec React.memo
  const renderCurrentPage = useMemo(() => {
    const pageProps = {
      adherents,
      activites,
      paiements,
      taches,
      evenements,
      typesAdhesion,
      modesPaiement,
      saisons,
      settings,
      seasonOptions: getSeasonOptions(),
      onUpdateAdherents: handleUpdateAdherents,
      onDeleteAdherent: handleDeleteAdherent,
      onUpdateActivites: handleUpdateActivites,
      onDeleteActivite: handleDeleteActivite,
      onUpdatePaiements: handleUpdatePaiements,
      onDeletePaiement: handleDeletePaiement,
      onUpdateTaches: handleUpdateTaches,
      onDeleteTache: handleDeleteTache,
      onUpdateEvenements: handleUpdateEvenements,
      onDeleteEvenement: handleDeleteEvenement,
      onUpdateTypesAdhesion: handleUpdateTypesAdhesion,
      onDeleteTypeAdhesion: handleDeleteTypeAdhesion,
      onUpdateModesPaiement: handleUpdateModesPaiement,
      onDeleteModePaiement: handleDeleteModePaiement,
      onChangeSaison: handleChangeSaison,
      onAddSaison: handleAddSaison,
      onUpdateSaison: handleUpdateSaison,
      onDeleteSaison: handleDeleteSaison,
      onUpdateSettings: handleUpdateSettings
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...pageProps} />;
      case 'calendar':
        return <Calendar evenements={evenements} onUpdateEvenements={handleUpdateEvenements} />;
      case 'tasks':
        return <Tasks taches={taches} onUpdateTaches={handleUpdateTaches} />;
      case 'members':
        return <Members {...pageProps} />;
      case 'activities':
        return <Activities {...pageProps} />;
      case 'payments':
        return <Payments {...pageProps} />;
      case 'statistics':
        return <Statistics {...pageProps} />;
      case 'settings':
        return <Settings {...pageProps} />;
      default:
        return <Dashboard {...pageProps} />;
    }
  }, [currentPage, adherents, activites, paiements, taches, evenements, typesAdhesion, modesPaiement, saisons, settings, handleUpdateAdherents, handleDeleteAdherent, handleUpdateActivites, handleDeleteActivite, handleUpdatePaiements, handleDeletePaiement, handleUpdateTaches, handleDeleteTache, handleUpdateEvenements, handleDeleteEvenement, handleUpdateTypesAdhesion, handleDeleteTypeAdhesion, handleUpdateModesPaiement, handleDeleteModePaiement, handleChangeSaison, handleAddSaison, handleUpdateSaison, handleDeleteSaison, handleUpdateSettings]);

  // Écran de chargement optimisé
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chargement Ultra-Rapide</h2>
          <p className="text-gray-600 mb-4">Initialisation de la base de données optimisée...</p>
          <div className="text-xs text-gray-500">
            <p>Opérations: {metrics.operationCount}</p>
            <p>Dernière: {metrics.lastOperation}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderCurrentPage}
      </Layout>
      
      {/* Indicateur de performance en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Ops: {metrics.operationCount}</div>
          <div>Dernière: {metrics.loadTime.toFixed(1)}ms</div>
          <div>Cache: {getDatabaseInfo().cache.size}</div>
          {errors.length > 0 && (
            <div className="text-red-300 mt-1">
              Erreurs: {errors.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default React.memo(App);