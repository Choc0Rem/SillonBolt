import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement, Saison, TypeEvenement } from './index';

export interface AppData {
  adherents: Adherent[];
  activites: Activite[];
  paiements: Paiement[];
  taches: Tache[];
  evenements: EvenementAgenda[];
  typesAdhesion: TypeAdhesion[];
  modesPaiement: ModePaiement[];
  saisons: Saison[];
  typesEvenement: TypeEvenement[];
  settings: {
    saisonActive: string;
  };
  version: string;
  lastModified: string;
}

export const createEmptyAppData = (): AppData => {
  const currentYear = new Date().getFullYear();
  const saisonActive = `${currentYear}-${currentYear + 1}`;
  
  return {
    adherents: [],
    activites: [],
    paiements: [],
    taches: [],
    evenements: [],
    typesAdhesion: [
      { id: '1', nom: 'Individuelle', prix: 50 },
      { id: '2', nom: 'Famille', prix: 80 }
    ],
    modesPaiement: [
      { id: '1', nom: 'Espèces' },
      { id: '2', nom: 'Chèque' },
      { id: '3', nom: 'Virement' }
    ],
    saisons: [
      {
        id: '1',
        nom: saisonActive,
        dateDebut: `${currentYear}-09-01`,
        dateFin: `${currentYear + 1}-08-31`,
        active: true,
        terminee: false
      }
    ],
    typesEvenement: [
      { id: '1', nom: 'Activité', couleur: '#3B82F6' },
      { id: '2', nom: 'Réunion', couleur: '#10B981' },
      { id: '3', nom: 'Événement', couleur: '#8B5CF6' }
    ],
    settings: {
      saisonActive
    },
    version: '1.0.0',
    lastModified: new Date().toISOString()
  };
};