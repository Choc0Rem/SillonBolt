export interface Adherent {
  id: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: 'Homme' | 'Femme';
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  telephone2?: string;
  email: string;
  email2?: string;
  typeAdhesion: 'Individuelle' | 'Famille';
  activites: string[]; // IDs des activités
  saison: string;
  createdAt: string;
}

export interface Activite {
  id: string;
  nom: string;
  description: string;
  prix: number;
  adherents: string[]; // IDs des adhérents
  saison: string;
  createdAt: string;
}

export interface Paiement {
  id: string;
  adherentId: string;
  activiteId: string;
  montant: number;
  datePaiement: string;
  modePaiement: 'Espèces' | 'Chèque' | 'Virement';
  statut: 'Payé' | 'En attente';
  saison: string;
  createdAt: string;
}

export interface Tache {
  id: string;
  nom: string;
  description: string;
  dateEcheance: string;
  type: 'Urgent' | 'Important' | 'Normal';
  statut: 'À faire' | 'En cours' | 'Terminé';
  createdAt: string;
}

export interface EvenementAgenda {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  type: 'Activité' | 'Réunion' | 'Événement';
  createdAt: string;
}

export interface TypeAdhesion {
  id: string;
  nom: string;
  prix: number;
}

export interface ModePaiement {
  id: string;
  nom: string;
}

export interface Saison {
  id: string;
  nom: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
  terminee: boolean;
  ordre: number; // Nouveau champ pour l'ordre chronologique
  planifiee: boolean; // Nouveau champ pour indiquer si c'est une saison planifiée
}

export interface AppSettings {
  saisonActive: string;
  saisons: Saison[];
  planificationAutomatique: boolean; // Nouveau paramètre
  nombreSaisonsPlanifiees: number; // Nouveau paramètre
}

export interface TypeEvenement {
  id: string;
  nom: string;
  couleur: string;
}