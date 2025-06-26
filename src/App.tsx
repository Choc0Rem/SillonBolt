import React, { useState, useEffect } from 'react';
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
  saveTypeAdhesion, saveModePaiement, setSaisonActive, addSaison, updateSaison, deleteSaison, updateSettings,
  deleteAdherent, deleteActivite, deletePaiement, deleteTache, deleteEvenement,
  deleteTypeAdhesion, deleteModePaiement, isSaisonTerminee
} from './utils/database';
import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, AppSettings } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les données
  const [adherents, setAdherents] = useState<Adherent[]>([]);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [evenements, setEvenements] = useState<EvenementAgenda[]>([]);
  const [typesAdhesion, setTypesAdhesion] = useState<TypeAdhesion[]>([]);
  const [modesPaiement, setModesPaiement] = useState<ModePaiement[]>([]);
  const [saisons, setSaisons] = useState<Saison[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // Initialiser la base de données au démarrage
  useEffect(() => {
    const init = async () => {
      const success = await initDatabase();
      if (success) {
        loadAllData();
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Charger toutes les données depuis la base
  const loadAllData = () => {
    setAdherents(getAdherents());
    setActivites(getActivites());
    setPaiements(getPaiements());
    setTaches(getTaches());
    setEvenements(getEvenements());
    setTypesAdhesion(getTypesAdhesion());
    setModesPaiement(getModesPaiement());
    setSaisons(getSaisons());
    setSettings(getSettings());
  };

  // Gestionnaires pour les adhérents
  const handleUpdateAdherents = (newAdherents: Adherent[]) => {
    if (isSaisonTerminee()) {
      alert('Impossible de modifier les adhérents : la saison est terminée');
      return;
    }
    newAdherents.forEach(adherent => saveAdherent(adherent));
    setAdherents(getAdherents());
  };

  const handleDeleteAdherent = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les adhérents : la saison est terminée');
      return;
    }
    deleteAdherent(id);
    setAdherents(getAdherents());
    setActivites(getActivites());
  };

  // Gestionnaires pour les activités
  const handleUpdateActivites = (newActivites: Activite[]) => {
    if (isSaisonTerminee()) {
      alert('Impossible de modifier les activités : la saison est terminée');
      return;
    }
    newActivites.forEach(activite => saveActivite(activite));
    setActivites(getActivites());
  };

  const handleDeleteActivite = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les activités : la saison est terminée');
      return;
    }
    deleteActivite(id);
    setActivites(getActivites());
  };

  // Gestionnaires pour les paiements
  const handleUpdatePaiements = (newPaiements: Paiement[]) => {
    if (isSaisonTerminee()) {
      alert('Impossible de modifier les paiements : la saison est terminée');
      return;
    }
    newPaiements.forEach(paiement => savePaiement(paiement));
    setPaiements(getPaiements());
  };

  const handleDeletePaiement = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les paiements : la saison est terminée');
      return;
    }
    deletePaiement(id);
    setPaiements(getPaiements());
  };

  // Gestionnaires pour les tâches (pas de restriction de saison)
  const handleUpdateTaches = (newTaches: Tache[]) => {
    newTaches.forEach(tache => saveTache(tache));
    setTaches(getTaches());
  };

  const handleDeleteTache = (id: string) => {
    deleteTache(id);
    setTaches(getTaches());
  };

  // Gestionnaires pour les événements (pas de restriction de saison)
  const handleUpdateEvenements = (newEvenements: EvenementAgenda[]) => {
    newEvenements.forEach(evenement => saveEvenement(evenement));
    setEvenements(getEvenements());
  };

  const handleDeleteEvenement = (id: string) => {
    deleteEvenement(id);
    setEvenements(getEvenements());
  };

  // Gestionnaires pour les types d'adhésion
  const handleUpdateTypesAdhesion = (newTypes: TypeAdhesion[]) => {
    newTypes.forEach(type => saveTypeAdhesion(type));
    setTypesAdhesion(getTypesAdhesion());
  };

  const handleDeleteTypeAdhesion = (id: string) => {
    deleteTypeAdhesion(id);
    setTypesAdhesion(getTypesAdhesion());
  };

  // Gestionnaires pour les modes de paiement
  const handleUpdateModesPaiement = (newModes: ModePaiement[]) => {
    newModes.forEach(mode => saveModePaiement(mode));
    setModesPaiement(getModesPaiement());
  };

  const handleDeleteModePaiement = (id: string) => {
    deleteModePaiement(id);
    setModesPaiement(getModesPaiement());
  };

  // Gestionnaires pour les saisons
  const handleChangeSaison = (saisonId: string) => {
    setSaisonActive(saisonId);
    loadAllData(); // Recharger toutes les données pour la nouvelle saison
  };

  const handleAddSaison = (saison: Saison) => {
    addSaison(saison);
    setSaisons(getSaisons());
    loadAllData(); // Recharger pour voir les nouvelles données copiées
  };

  const handleUpdateSaison = (saison: Saison) => {
    updateSaison(saison);
    setSaisons(getSaisons());
    loadAllData(); // Recharger si la saison active a changé
  };

  const handleDeleteSaison = (id: string) => {
    deleteSaison(id);
    setSaisons(getSaisons());
    loadAllData();
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    updateSettings(newSettings);
    setSettings(newSettings);
    loadAllData(); // Recharger les données si la saison a changé
  };

  const renderCurrentPage = () => {
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
      case 'calendar':
        return (
          <Calendar 
            evenements={evenements}
            onUpdateEvenements={handleUpdateEvenements}
          />
        );
      case 'tasks':
        return (
          <Tasks 
            taches={taches}
            onUpdateTaches={handleUpdateTaches}
          />
        );
      case 'members':
        return (
          <Members 
            adherents={adherents}
            activites={activites}
            onUpdateAdherents={handleUpdateAdherents}
            onUpdateActivites={handleUpdateActivites}
          />
        );
      case 'activities':
        return (
          <Activities 
            activites={activites}
            adherents={adherents}
            onUpdateActivites={handleUpdateActivites}
          />
        );
      case 'payments':
        return (
          <Payments 
            paiements={paiements}
            adherents={adherents}
            activites={activites}
            modesPaiement={modesPaiement}
            onUpdatePaiements={handleUpdatePaiements}
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
            onUpdateTypesAdhesion={handleUpdateTypesAdhesion}
            onUpdateModesPaiement={handleUpdateModesPaiement}
            onChangeSaison={handleChangeSaison}
            onAddSaison={handleAddSaison}
            onUpdateSaison={handleUpdateSaison}
            onDeleteSaison={handleDeleteSaison}
            onUpdateSettings={handleUpdateSettings}
          />
        );
      default:
        return <Dashboard adherents={adherents} activites={activites} paiements={paiements} taches={taches} evenements={evenements} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentPage={currentPage} 
      onPageChange={setCurrentPage}
    >
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;