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
  saveTypeAdhesion, saveModePaiement, setSaisonActive, addSaison, updateSaison, deleteSaison,
  deleteAdherent, deleteActivite, deletePaiement, deleteTache, deleteEvenement,
  deleteTypeAdhesion, deleteModePaiement, getSaisonActive,
  updateSettings, getSeasonOptions
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
      console.log('Initialisation de la base de données...');
      const success = await initDatabase();
      if (success) {
        console.log('Base de données initialisée, chargement des données...');
        loadAllData();
      } else {
        console.error('Échec de l\'initialisation de la base de données');
      }
      setIsLoading(false);
    };
    init();
  }, []);

  // Charger toutes les données depuis la base
  const loadAllData = () => {
    try {
      console.log('Chargement des données...');
      setAdherents(getAdherents());
      setActivites(getActivites());
      setPaiements(getPaiements());
      setTaches(getTaches());
      setEvenements(getEvenements());
      setTypesAdhesion(getTypesAdhesion());
      setModesPaiement(getModesPaiement());
      setSaisons(getSaisons());
      setSettings(getSettings());
      console.log('Données chargées avec succès');
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Gestionnaires pour les adhérents
  const handleUpdateAdherents = (newAdherents: Adherent[]) => {
    console.log('Mise à jour des adhérents:', newAdherents);
    
    // Traiter chaque adhérent
    newAdherents.forEach(adherent => {
      // S'assurer que la saison est définie
      if (!adherent.saison) {
        adherent.saison = getSaisonActive();
      }
      
      const success = saveAdherent(adherent);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'adhérent:', adherent);
        alert(`Erreur lors de la sauvegarde de ${adherent.prenom} ${adherent.nom}`);
      } else {
        console.log('Adhérent sauvegardé:', adherent.prenom, adherent.nom);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteAdherent = (id: string) => {
    const success = deleteAdherent(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression de l\'adhérent');
    }
  };

  // Gestionnaires pour les activités
  const handleUpdateActivites = (newActivites: Activite[]) => {
    console.log('Mise à jour des activités:', newActivites);
    
    // Traiter chaque activité
    newActivites.forEach(activite => {
      // S'assurer que la saison est définie
      if (!activite.saison) {
        activite.saison = getSaisonActive();
      }
      
      const success = saveActivite(activite);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'activité:', activite);
        alert(`Erreur lors de la sauvegarde de l'activité ${activite.nom}`);
      } else {
        console.log('Activité sauvegardée:', activite.nom);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteActivite = (id: string) => {
    const success = deleteActivite(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression de l\'activité');
    }
  };

  // Gestionnaires pour les paiements
  const handleUpdatePaiements = (newPaiements: Paiement[]) => {
    console.log('Mise à jour des paiements:', newPaiements);
    
    // Traiter chaque paiement
    newPaiements.forEach(paiement => {
      // S'assurer que la saison est définie
      if (!paiement.saison) {
        paiement.saison = getSaisonActive();
      }
      
      const success = savePaiement(paiement);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du paiement:', paiement);
        alert(`Erreur lors de la sauvegarde du paiement`);
      } else {
        console.log('Paiement sauvegardé:', paiement.id);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeletePaiement = (id: string) => {
    const success = deletePaiement(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression du paiement');
    }
  };

  // Gestionnaires pour les tâches (pas de restriction de saison)
  const handleUpdateTaches = (newTaches: Tache[]) => {
    console.log('Mise à jour des tâches:', newTaches);
    
    // Traiter chaque tâche
    newTaches.forEach(tache => {
      const success = saveTache(tache);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de la tâche:', tache);
        alert(`Erreur lors de la sauvegarde de la tâche ${tache.nom}`);
      } else {
        console.log('Tâche sauvegardée:', tache.nom);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteTache = (id: string) => {
    const success = deleteTache(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  // Gestionnaires pour les événements (pas de restriction de saison)
  const handleUpdateEvenements = (newEvenements: EvenementAgenda[]) => {
    console.log('Mise à jour des événements:', newEvenements);
    
    // Traiter chaque événement
    newEvenements.forEach(evenement => {
      const success = saveEvenement(evenement);
      if (!success) {
        console.error('Erreur lors de la sauvegarde de l\'événement:', evenement);
        alert(`Erreur lors de la sauvegarde de l'événement ${evenement.titre}`);
      } else {
        console.log('Événement sauvegardé:', evenement.titre);
      }
    });
    
    // Recharger les données depuis la base
    loadAllData();
  };

  const handleDeleteEvenement = (id: string) => {
    const success = deleteEvenement(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  // Gestionnaires pour les types d'adhésion
  const handleUpdateTypesAdhesion = (newTypes: TypeAdhesion[]) => {
    newTypes.forEach(type => {
      const success = saveTypeAdhesion(type);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du type d\'adhésion:', type);
        alert(`Erreur lors de la sauvegarde du type ${type.nom}`);
      }
    });
    loadAllData();
  };

  const handleDeleteTypeAdhesion = (id: string) => {
    const success = deleteTypeAdhesion(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression du type d\'adhésion');
    }
  };

  // Gestionnaires pour les modes de paiement
  const handleUpdateModesPaiement = (newModes: ModePaiement[]) => {
    newModes.forEach(mode => {
      const success = saveModePaiement(mode);
      if (!success) {
        console.error('Erreur lors de la sauvegarde du mode de paiement:', mode);
        alert(`Erreur lors de la sauvegarde du mode ${mode.nom}`);
      }
    });
    loadAllData();
  };

  const handleDeleteModePaiement = (id: string) => {
    const success = deleteModePaiement(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression du mode de paiement');
    }
  };

  // Gestionnaires pour les saisons
  const handleChangeSaison = (saisonId: string) => {
    const success = setSaisonActive(saisonId);
    if (success) {
      loadAllData(); // Recharger toutes les données pour la nouvelle saison
    } else {
      alert('Erreur lors du changement de saison');
    }
  };

  const handleAddSaison = (seasonName: string, dateDebut: string, dateFin: string) => {
    const success = addSaison(seasonName, dateDebut, dateFin);
    if (success) {
      loadAllData(); // Recharger pour voir les nouvelles données copiées
      alert(`Saison ${seasonName} créée avec succès ! Les adhérents et activités de la saison précédente ont été copiés.`);
    } else {
      alert('Erreur lors de l\'ajout de la saison');
    }
  };

  const handleUpdateSaison = (saison: Saison) => {
    const success = updateSaison(saison);
    if (success) {
      loadAllData(); // Recharger si la saison active a changé
    } else {
      alert('Erreur lors de la mise à jour de la saison');
    }
  };

  const handleDeleteSaison = (id: string) => {
    const success = deleteSaison(id);
    if (success) {
      loadAllData();
    } else {
      alert('Erreur lors de la suppression de la saison');
    }
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    const success = updateSettings(newSettings);
    if (success) {
      setSettings(newSettings);
      loadAllData(); // Recharger les données si la saison a changé
    } else {
      alert('Erreur lors de la mise à jour des paramètres');
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
            seasonOptions={getSeasonOptions()}
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