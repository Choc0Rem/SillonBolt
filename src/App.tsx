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
  const [dataVersion, setDataVersion] = useState(0); // Pour forcer le rechargement
  
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
      console.log('🚀 Initialisation de l\'application...');
      setIsLoading(true);
      
      try {
        const success = await initDatabase();
        if (success) {
          console.log('✅ Base de données initialisée, chargement des données...');
          await loadAllData();
        } else {
          console.error('❌ Échec de l\'initialisation de la base de données');
          alert('Erreur lors de l\'initialisation de la base de données. Veuillez recharger la page.');
        }
      } catch (error) {
        console.error('❌ Erreur critique lors de l\'initialisation:', error);
        alert('Erreur critique. Veuillez recharger la page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  // Recharger les données quand la version change
  useEffect(() => {
    if (dataVersion > 0) {
      loadAllData();
    }
  }, [dataVersion]);

  // Charger toutes les données depuis la base
  const loadAllData = async () => {
    try {
      console.log('📊 Chargement des données...');
      
      // Charger toutes les données en parallèle
      const [
        adherentsData,
        activitesData,
        paiementsData,
        tachesData,
        evenementsData,
        typesAdhesionData,
        modesPaiementData,
        saisonsData,
        settingsData
      ] = await Promise.all([
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

      // Mettre à jour tous les états
      setAdherents(adherentsData);
      setActivites(activitesData);
      setPaiements(paiementsData);
      setTaches(tachesData);
      setEvenements(evenementsData);
      setTypesAdhesion(typesAdhesionData);
      setModesPaiement(modesPaiementData);
      setSaisons(saisonsData);
      setSettings(settingsData);
      
      console.log('✅ Toutes les données chargées avec succès');
      console.log(`📈 Statistiques: ${adherentsData.length} adhérents, ${activitesData.length} activités, ${paiementsData.length} paiements`);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      alert('Erreur lors du chargement des données. Veuillez recharger la page.');
    }
  };

  // Fonction pour forcer le rechargement des données
  const forceDataReload = () => {
    console.log('🔄 Rechargement forcé des données...');
    setDataVersion(prev => prev + 1);
  };

  // Gestionnaires pour les adhérents
  const handleUpdateAdherents = async (newAdherents: Adherent[]) => {
    console.log('👥 Mise à jour des adhérents:', newAdherents.length);
    
    try {
      // Traiter chaque adhérent
      const results = await Promise.all(
        newAdherents.map(async (adherent) => {
          // S'assurer que la saison est définie
          if (!adherent.saison) {
            adherent.saison = getSaisonActive();
          }
          
          const success = saveAdherent(adherent);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde de l\'adhérent:', adherent);
            throw new Error(`Erreur lors de la sauvegarde de ${adherent.prenom} ${adherent.nom}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        console.log('✅ Tous les adhérents sauvegardés');
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des adhérents:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des adhérents');
    }
  };

  const handleDeleteAdherent = async (id: string) => {
    try {
      const success = deleteAdherent(id);
      if (success) {
        console.log('✅ Adhérent supprimé');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'adhérent:', error);
      alert('Erreur lors de la suppression de l\'adhérent');
    }
  };

  // Gestionnaires pour les activités
  const handleUpdateActivites = async (newActivites: Activite[]) => {
    console.log('🎯 Mise à jour des activités:', newActivites.length);
    
    try {
      const results = await Promise.all(
        newActivites.map(async (activite) => {
          if (!activite.saison) {
            activite.saison = getSaisonActive();
          }
          
          const success = saveActivite(activite);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde de l\'activité:', activite);
            throw new Error(`Erreur lors de la sauvegarde de l'activité ${activite.nom}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        console.log('✅ Toutes les activités sauvegardées');
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des activités:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des activités');
    }
  };

  const handleDeleteActivite = async (id: string) => {
    try {
      const success = deleteActivite(id);
      if (success) {
        console.log('✅ Activité supprimée');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'activité:', error);
      alert('Erreur lors de la suppression de l\'activité');
    }
  };

  // Gestionnaires pour les paiements
  const handleUpdatePaiements = async (newPaiements: Paiement[]) => {
    console.log('💰 Mise à jour des paiements:', newPaiements.length);
    
    try {
      const results = await Promise.all(
        newPaiements.map(async (paiement) => {
          if (!paiement.saison) {
            paiement.saison = getSaisonActive();
          }
          
          const success = savePaiement(paiement);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde du paiement:', paiement);
            throw new Error('Erreur lors de la sauvegarde du paiement');
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        console.log('✅ Tous les paiements sauvegardés');
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paiements:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des paiements');
    }
  };

  const handleDeletePaiement = async (id: string) => {
    try {
      const success = deletePaiement(id);
      if (success) {
        console.log('✅ Paiement supprimé');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du paiement:', error);
      alert('Erreur lors de la suppression du paiement');
    }
  };

  // Gestionnaires pour les tâches
  const handleUpdateTaches = async (newTaches: Tache[]) => {
    console.log('✅ Mise à jour des tâches:', newTaches.length);
    
    try {
      const results = await Promise.all(
        newTaches.map(async (tache) => {
          const success = saveTache(tache);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde de la tâche:', tache);
            throw new Error(`Erreur lors de la sauvegarde de la tâche ${tache.nom}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        console.log('✅ Toutes les tâches sauvegardées');
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des tâches:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des tâches');
    }
  };

  const handleDeleteTache = async (id: string) => {
    try {
      const success = deleteTache(id);
      if (success) {
        console.log('✅ Tâche supprimée');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la tâche:', error);
      alert('Erreur lors de la suppression de la tâche');
    }
  };

  // Gestionnaires pour les événements
  const handleUpdateEvenements = async (newEvenements: EvenementAgenda[]) => {
    console.log('📅 Mise à jour des événements:', newEvenements.length);
    
    try {
      const results = await Promise.all(
        newEvenements.map(async (evenement) => {
          const success = saveEvenement(evenement);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde de l\'événement:', evenement);
            throw new Error(`Erreur lors de la sauvegarde de l'événement ${evenement.titre}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        console.log('✅ Tous les événements sauvegardés');
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des événements:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des événements');
    }
  };

  const handleDeleteEvenement = async (id: string) => {
    try {
      const success = deleteEvenement(id);
      if (success) {
        console.log('✅ Événement supprimé');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de l\'événement:', error);
      alert('Erreur lors de la suppression de l\'événement');
    }
  };

  // Gestionnaires pour les types d'adhésion
  const handleUpdateTypesAdhesion = async (newTypes: TypeAdhesion[]) => {
    try {
      const results = await Promise.all(
        newTypes.map(async (type) => {
          const success = saveTypeAdhesion(type);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde du type d\'adhésion:', type);
            throw new Error(`Erreur lors de la sauvegarde du type ${type.nom}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des types d\'adhésion:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des types d\'adhésion');
    }
  };

  const handleDeleteTypeAdhesion = async (id: string) => {
    try {
      const success = deleteTypeAdhesion(id);
      if (success) {
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du type d\'adhésion:', error);
      alert('Erreur lors de la suppression du type d\'adhésion');
    }
  };

  // Gestionnaires pour les modes de paiement
  const handleUpdateModesPaiement = async (newModes: ModePaiement[]) => {
    try {
      const results = await Promise.all(
        newModes.map(async (mode) => {
          const success = saveModePaiement(mode);
          if (!success) {
            console.error('❌ Erreur lors de la sauvegarde du mode de paiement:', mode);
            throw new Error(`Erreur lors de la sauvegarde du mode ${mode.nom}`);
          }
          return success;
        })
      );

      if (results.every(r => r)) {
        forceDataReload();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des modes de paiement:', error);
      alert(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des modes de paiement');
    }
  };

  const handleDeleteModePaiement = async (id: string) => {
    try {
      const success = deleteModePaiement(id);
      if (success) {
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du mode de paiement:', error);
      alert('Erreur lors de la suppression du mode de paiement');
    }
  };

  // Gestionnaires pour les saisons
  const handleChangeSaison = async (saisonId: string) => {
    try {
      console.log('🔄 Changement de saison:', saisonId);
      const success = setSaisonActive(saisonId);
      if (success) {
        console.log('✅ Saison changée avec succès');
        forceDataReload(); // Recharger toutes les données pour la nouvelle saison
      } else {
        throw new Error('Erreur lors du changement de saison');
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de saison:', error);
      alert('Erreur lors du changement de saison');
    }
  };

  const handleAddSaison = async (seasonName: string, dateDebut: string, dateFin: string) => {
    try {
      console.log('➕ Ajout nouvelle saison:', seasonName);
      const success = addSaison(seasonName, dateDebut, dateFin);
      if (success) {
        console.log('✅ Saison ajoutée avec succès');
        forceDataReload();
        alert(`Saison ${seasonName} créée avec succès ! Les adhérents et activités de la saison précédente ont été copiés.`);
      } else {
        throw new Error('Erreur lors de l\'ajout de la saison');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de la saison:', error);
      alert('Erreur lors de l\'ajout de la saison');
    }
  };

  const handleUpdateSaison = async (saison: Saison) => {
    try {
      console.log('🔄 Mise à jour saison:', saison.nom);
      const success = updateSaison(saison);
      if (success) {
        console.log('✅ Saison mise à jour avec succès');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la mise à jour de la saison');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la saison:', error);
      alert('Erreur lors de la mise à jour de la saison');
    }
  };

  const handleDeleteSaison = async (id: string) => {
    try {
      console.log('🗑️ Suppression saison:', id);
      const success = deleteSaison(id);
      if (success) {
        console.log('✅ Saison supprimée avec succès');
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la suppression de la saison');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la saison:', error);
      alert('Erreur lors de la suppression de la saison');
    }
  };

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      const success = updateSettings(newSettings);
      if (success) {
        setSettings(newSettings);
        forceDataReload();
      } else {
        throw new Error('Erreur lors de la mise à jour des paramètres');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des paramètres:', error);
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
          <p className="text-gray-500 text-sm mt-2">Initialisation de la base de données</p>
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