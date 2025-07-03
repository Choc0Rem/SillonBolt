import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Members from './pages/Members';
import Calendar from './pages/Calendar';
import Activities from './pages/Activities';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import { 
  initDatabase,
  getAdherents, setAdherents,
  getActivites, setActivites,
  getPaiements, setPaiements,
  getTaches, setTaches,
  getEvenements, setEvenements,
  getSaisons, setSaisonActive, addSaison, updateSaison, deleteSaison,
  getTypesAdhesion, setTypesAdhesion,
  getModesPaiement, setModesPaiement,
  getTypesEvenement, setTypesEvenement,
  getSettings, updateSettings,
  getSeasonOptions
} from './utils/database';
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, Saison, TypeAdhesion, ModePaiement, TypeEvenement, AppSettings } from './types';

type PageType = 'dashboard' | 'calendar' | 'tasks' | 'members' | 'activities' | 'payments' | 'statistics' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // États pour toutes les données
  const [adherents, setAdherentsState] = useState<Adherent[]>([]);
  const [activites, setActivitesState] = useState<Activite[]>([]);
  const [paiements, setPaiementsState] = useState<Paiement[]>([]);
  const [taches, setTachesState] = useState<Tache[]>([]);
  const [evenements, setEvenementsState] = useState<EvenementAgenda[]>([]);
  const [saisons, setSaisonsState] = useState<Saison[]>([]);
  const [typesAdhesion, setTypesAdhesionState] = useState<TypeAdhesion[]>([]);
  const [modesPaiement, setModesPaiementState] = useState<ModePaiement[]>([]);
  const [typesEvenement, setTypesEvenementState] = useState<TypeEvenement[]>([]);
  const [settings, setSettingsState] = useState<AppSettings | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initialisation de l\'application...');
        
        // Initialiser la base de données
        await initDatabase();
        
        // Charger toutes les données
        const loadedAdherents = getAdherents();
        const loadedActivites = getActivites();
        const loadedPaiements = getPaiements();
        const loadedTaches = getTaches();
        const loadedEvenements = getEvenements();
        const loadedSaisons = getSaisons();
        const loadedTypesAdhesion = getTypesAdhesion();
        const loadedModesPaiement = getModesPaiement();
        const loadedTypesEvenement = getTypesEvenement();
        const loadedSettings = getSettings();
        
        // Mettre à jour les états
        setAdherentsState(loadedAdherents);
        setActivitesState(loadedActivites);
        setPaiementsState(loadedPaiements);
        setTachesState(loadedTaches);
        setEvenementsState(loadedEvenements);
        setSaisonsState(loadedSaisons);
        setTypesAdhesionState(loadedTypesAdhesion);
        setModesPaiementState(loadedModesPaiement);
        setTypesEvenementState(loadedTypesEvenement);
        setSettingsState(loadedSettings);
        
        console.log('✅ Application initialisée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Fonctions de mise à jour avec sauvegarde
  const updateAdherents = (newAdherents: Adherent[]) => {
    setAdherentsState(newAdherents);
    setAdherents(newAdherents);
  };

  const updateActivites = (newActivites: Activite[]) => {
    setActivitesState(newActivites);
    setActivites(newActivites);
  };

  const updatePaiements = (newPaiements: Paiement[]) => {
    setPaiementsState(newPaiements);
    setPaiements(newPaiements);
  };

  const updateTaches = (newTaches: Tache[]) => {
    setTachesState(newTaches);
    setTaches(newTaches);
  };

  const updateEvenements = (newEvenements: EvenementAgenda[]) => {
    setEvenementsState(newEvenements);
    setEvenements(newEvenements);
  };

  const updateTypesAdhesion = (newTypes: TypeAdhesion[]) => {
    setTypesAdhesionState(newTypes);
    setTypesAdhesion(newTypes);
  };

  const updateModesPaiement = (newModes: ModePaiement[]) => {
    setModesPaiementState(newModes);
    setModesPaiement(newModes);
  };

  const updateTypesEvenement = (newTypes: TypeEvenement[]) => {
    setTypesEvenementState(newTypes);
    setTypesEvenement(newTypes);
  };

  const updateAppSettings = (newSettings: AppSettings) => {
    setSettingsState(newSettings);
    updateSettings(newSettings);
  };

  const handleChangeSaison = (saisonId: string) => {
    if (setSaisonActive(saisonId)) {
      const updatedSaisons = getSaisons();
      const updatedSettings = getSettings();
      setSaisonsState(updatedSaisons);
      setSettingsState(updatedSettings);
      
      // Recharger les données pour la nouvelle saison
      setAdherentsState(getAdherents());
      setActivitesState(getActivites());
      setPaiementsState(getPaiements());
    }
  };

  const handleAddSaison = (seasonName: string, dateDebut: string, dateFin: string) => {
    if (addSaison(seasonName, dateDebut, dateFin)) {
      setSaisonsState(getSaisons());
    }
  };

  const handleUpdateSaison = (saison: Saison) => {
    if (updateSaison(saison)) {
      setSaisonsState(getSaisons());
      if (saison.active) {
        setSettingsState(getSettings());
      }
    }
  };

  const handleDeleteSaison = (id: string) => {
    if (deleteSaison(id)) {
      setSaisonsState(getSaisons());
      // Recharger les données après suppression
      setAdherentsState(getAdherents());
      setActivitesState(getActivites());
      setPaiementsState(getPaiements());
    }
  };

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Chargement...</span>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            adherents={adherents}
            activites={activites}
            paiements={paiements}
            taches={taches}
            evenements={evenements}
          />
        );
      
      case 'tasks':
        return (
          <Tasks 
            taches={taches}
            onUpdateTaches={updateTaches}
          />
        );
      
      case 'members':
        return (
          <Members 
            adherents={adherents}
            activites={activites}
            onUpdateAdherents={updateAdherents}
            onUpdateActivites={updateActivites}
          />
        );
      
      case 'calendar':
        return (
          <Calendar 
            evenements={evenements}
            onUpdateEvenements={updateEvenements}
          />
        );
      
      case 'activities':
        return (
          <Activities 
            activites={activites}
            adherents={adherents}
            onUpdateActivites={updateActivites}
          />
        );
      
      case 'payments':
        return (
          <Payments 
            paiements={paiements}
            adherents={adherents}
            activites={activites}
            modesPaiement={modesPaiement}
            onUpdatePaiements={updatePaiements}
          />
        );
      
      case 'statistics':
        return (
          <Statistics 
            adherents={adherents}
            activites={activites}
            paiements={paiements}
          />
        );
      
      case 'settings':
        return (
          <Settings 
            typesAdhesion={typesAdhesion}
            modesPaiement={modesPaiement}
            saisons={saisons}
            settings={settings}
            seasonOptions={getSeasonOptions()}
            onUpdateTypesAdhesion={updateTypesAdhesion}
            onUpdateModesPaiement={updateModesPaiement}
            onChangeSaison={handleChangeSaison}
            onAddSaison={handleAddSaison}
            onUpdateSaison={handleUpdateSaison}
            onDeleteSaison={handleDeleteSaison}
            onUpdateSettings={updateAppSettings}
          />
        );
      
      default:
        return (
          <Dashboard 
            adherents={adherents}
            activites={activites}
            paiements={paiements}
            taches={taches}
            evenements={evenements}
          />
        );
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;