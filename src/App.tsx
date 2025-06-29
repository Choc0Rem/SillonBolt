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
    
    // Sauvegarder chaque adhérent et recharger les données
    newAdherents.forEach(adherent => {
      const success = saveAdherent(adherent);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'adhérent:', adherent);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteAdherent = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les adhérents : la saison est terminée');
      return;
    }
    
    const success = deleteAdherent(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les activités
  const handleUpdateActivites = (newActivites: Activite[]) => {
    if (isSaisonTerminee()) {
      alert('Impossible de modifier les activités : la saison est terminée');
      return;
    }
    
    // Sauvegarder chaque activité et recharger les données
    newActivites.forEach(activite => {
      const success = saveActivite(activite);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'activité:', activite);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteActivite = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les activités : la saison est terminée');
      return;
    }
    
    const success = deleteActivite(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les paiements
  const handleUpdatePaiements = (newPaiements: Paiement[]) => {
    if (isSaisonTerminee()) {
      alert('Impossible de modifier les paiements : la saison est terminée');
      return;
    }
    
    // Sauvegarder chaque paiement et recharger les données
    newPaiements.forEach(paiement => {
      const success = savePaiement(paiement);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du paiement:', paiement);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeletePaiement = (id: string) => {
    if (isSaisonTerminee()) {
      alert('Impossible de supprimer les paiements : la saison est terminée');
      return;
    }
    
    const success = deletePaiement(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les tâches (pas de restriction de saison)
  const handleUpdateTaches = (newTaches: Tache[]) => {
    // Sauvegarder chaque tâche et recharger les données
    newTaches.forEach(tache => {
      const success = saveTache(tache);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de la tâche:', tache);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteTache = (id: string) => {
    const success = deleteTache(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les événements (pas de restriction de saison)
  const handleUpdateEvenements = (newEvenements: EvenementAgenda[]) => {
    // Sauvegarder chaque événement et recharger les données
    newEvenements.forEach(evenement => {
      const success = saveEvenement(evenement);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'événement:', evenement);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteEvenement = (id: string) => {
    const success = deleteEvenement(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les types d'adhésion
  const handleUpdateTypesAdhesion = (newTypes: TypeAdhesion[]) => {
    newTypes.forEach(type => {
      const success = saveTypeAdhesion(type);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du type d\'adhésion:', type);
      }
    });
    loadAllData();
  };

  const handleDeleteTypeAdhesion = (id: string) => {
    const success = deleteTypeAdhesion(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les modes de paiement
  const handleUpdateModesPaiement = (newModes: ModePaiement[]) => {
    newModes.forEach(mode => {
      const success = saveModePaiement(mode);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du mode de paiement:', mode);
      }
    });
    loadAllData();
  };

  const handleDeleteModePaiement = (id: string) => {
    const success = deleteModePaiement(id);
    if (success) {
      loadAllData();
    }
  };

  // Gestionnaires pour les saisons
  const handleChangeSaison = (saisonId: string) => {
    const success = setSaisonActive(saisonId);
    if (success) {
      loadAllData(); // Recharger toutes les données pour la nouvelle saison
    }
  };

  const handleAddSaison = (saison: Saison) => {
    const success = addSaison(saison);
    if (success) {
      loadAllData(); // Recharger pour voir les nouvelles données copiées
    }
  };

  const handleUpdateSaison = (saison: Saison) => {
    const success = updateSaison(saison);
    if (success) {
      loadAllData(); // Recharger si la saison active a changé
    }
  };

  const handleDeleteSaison = (id: string) => {
    const success = deleteSaison(id);
    if (success) {
      loadAllData();
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    const success = updateSettings(newSettings);
    if (success) {
      setSettings(newSettings);
      loadAllData(); // Recharger les données si la saison a changé
    }
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