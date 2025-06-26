import { Adherent, Activite, Paiement, Tache, EvenementAgenda, TypeAdhesion, ModePaiement } from '../types';

export const mockAdherents: Adherent[] = [
  {
    id: '1',
    nom: 'Dupont',
    prenom: 'Marie',
    dateNaissance: '1985-03-15',
    sexe: 'Femme',
    adresse: '123 rue de la Paix',
    codePostal: '75001',
    ville: 'Paris',
    telephone: '0123456789',
    email: 'marie.dupont@email.com',
    typeAdhesion: 'Famille',
    activites: ['1', '2'],
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nom: 'Martin',
    prenom: 'Pierre',
    dateNaissance: '1990-07-22',
    sexe: 'Homme',
    adresse: '456 avenue des Champs',
    codePostal: '69001',
    ville: 'Lyon',
    telephone: '0234567890',
    email: 'pierre.martin@email.com',
    typeAdhesion: 'Individuelle',
    activites: ['1', '3'],
    createdAt: '2024-01-20'
  }
];

export const mockActivites: Activite[] = [
  {
    id: '1',
    nom: 'Yoga',
    description: 'Cours de yoga pour tous niveaux',
    prix: 120,
    nombrePlaces: 20,
    adherents: ['1', '2'],
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    nom: 'Tennis',
    description: 'Cours de tennis en groupe',
    prix: 150,
    nombrePlaces: 8,
    adherents: ['1'],
    createdAt: '2024-01-12'
  },
  {
    id: '3',
    nom: 'Natation',
    description: 'Cours de natation adultes',
    prix: 100,
    nombrePlaces: 15,
    adherents: ['2'],
    createdAt: '2024-01-14'
  }
];

export const mockPaiements: Paiement[] = [
  {
    id: '1',
    adherentId: '1',
    activiteId: '1',
    montant: 120,
    datePaiement: '2024-01-25',
    modePaiement: 'Virement',
    statut: 'Payé',
    createdAt: '2024-01-25'
  },
  {
    id: '2',
    adherentId: '2',
    activiteId: '1',
    montant: 120,
    datePaiement: '',
    modePaiement: 'Chèque',
    statut: 'En attente',
    createdAt: '2024-01-26'
  }
];

export const mockTaches: Tache[] = [
  {
    id: '1',
    nom: 'Organiser AG',
    description: 'Préparer l\'assemblée générale annuelle',
    dateEcheance: '2024-03-15',
    type: 'Important',
    statut: 'À faire',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    nom: 'Renouvellement matériel',
    description: 'Commander nouveau matériel sportif',
    dateEcheance: '2024-02-10',
    type: 'Urgent',
    statut: 'En cours',
    createdAt: '2024-01-22'
  }
];

export const mockEvenementsAgenda: EvenementAgenda[] = [
  {
    id: '1',
    titre: 'Cours de Yoga',
    description: 'Cours hebdomadaire de yoga',
    dateDebut: '2024-02-05T18:00:00',
    dateFin: '2024-02-05T19:30:00',
    lieu: 'Salle A',
    type: 'Activité',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    titre: 'Réunion Bureau',
    description: 'Réunion mensuelle du bureau',
    dateDebut: '2024-02-08T20:00:00',
    dateFin: '2024-02-08T22:00:00',
    lieu: 'Salle de réunion',
    type: 'Réunion',
    createdAt: '2024-01-20'
  }
];

export const defaultTypesAdhesion: TypeAdhesion[] = [
  { id: '1', nom: 'Individuelle', prix: 50 },
  { id: '2', nom: 'Famille', prix: 80 }
];

export const defaultModesPaiement: ModePaiement[] = [
  { id: '1', nom: 'Espèces' },
  { id: '2', nom: 'Chèque' },
  { id: '3', nom: 'Virement' }
];