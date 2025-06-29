import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Search, Edit, Trash2, Filter, User, Phone, Mail, MapPin, ChevronDown, ChevronRight } from 'lucide-react';
import { Adherent, Activite } from '../types';
import { getSaisonActive } from '../utils/jsonDatabase';

interface MembersProps {
  adherents: Adherent[];
  activites: Activite[];
  onUpdateAdherents: (adherents: Adherent[]) => void;
  onUpdateActivites: (activites: Activite[]) => void;
}

export default function Members({ adherents, activites, onUpdateAdherents, onUpdateActivites }: MembersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Individuelle' | 'Famille'>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Adherent | null>(null);
  const [selectedMember, setSelectedMember] = useState<Adherent | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    dateNaissance: '',
    sexe: 'Homme' as 'Homme' | 'Femme',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    telephone2: '',
    email: '',
    email2: '',
    typeAdhesion: 'Individuelle' as 'Individuelle' | 'Famille',
    activites: [] as string[]
  });

  const filteredAdherents = adherents.filter(adherent => {
    const matchesSearch = 
      adherent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherent.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || adherent.typeAdhesion === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation des champs requis
    if (!formData.nom.trim() || !formData.prenom.trim() || !formData.email.trim()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation de l'email principal
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Veuillez saisir une adresse email valide');
      return;
    }

    // Validation de l'email secondaire s'il est renseigné
    if (formData.email2 && !emailRegex.test(formData.email2)) {
      alert('Veuillez saisir une adresse email secondaire valide');
      return;
    }

    if (editingMember) {
      const updatedAdherent = {
        ...editingMember,
        ...formData,
        saison: editingMember.saison
      };
      const updatedAdherents = adherents.map(a =>
        a.id === editingMember.id ? updatedAdherent : a
      );
      onUpdateAdherents(updatedAdherents);
      
      // Mettre à jour les activités
      const updatedActivites = activites.map(activite => ({
        ...activite,
        adherents: formData.activites.includes(activite.id)
          ? [...activite.adherents.filter(id => id !== editingMember.id), editingMember.id]
          : activite.adherents.filter(id => id !== editingMember.id)
      }));
      onUpdateActivites(updatedActivites);
    } else {
      const newAdherent: Adherent = {
        id: Date.now().toString(),
        ...formData,
        saison: getSaisonActive(),
        createdAt: new Date().toISOString()
      };
      onUpdateAdherents([...adherents, newAdherent]);
      
      // Mettre à jour les activités
      const updatedActivites = activites.map(activite => ({
        ...activite,
        adherents: formData.activites.includes(activite.id)
          ? [...activite.adherents, newAdherent.id]
          : activite.adherents
      }));
      onUpdateActivites(updatedActivites);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      dateNaissance: '',
      sexe: 'Homme',
      adresse: '',
      codePostal: '',
      ville: '',
      telephone: '',
      telephone2: '',
      email: '',
      email2: '',
      typeAdhesion: 'Individuelle',
      activites: []
    });
    setEditingMember(null);
    setShowModal(false);
    setShowAdvancedFields(false);
  };

  const handleEdit = (adherent: Adherent) => {
    setEditingMember(adherent);
    setFormData({
      nom: adherent.nom,
      prenom: adherent.prenom,
      dateNaissance: adherent.dateNaissance,
      sexe: adherent.sexe,
      adresse: adherent.adresse,
      codePostal: adherent.codePostal,
      ville: adherent.ville,
      telephone: adherent.telephone,
      telephone2: adherent.telephone2 || '',
      email: adherent.email,
      email2: adherent.email2 || '',
      typeAdhesion: adherent.typeAdhesion,
      activites: adherent.activites
    });
    setShowAdvancedFields(!!(adherent.telephone2 || adherent.email2));
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet adhérent ?')) {
      onUpdateAdherents(adherents.filter(a => a.id !== id));
      
      // Supprimer l'adhérent des activités
      const updatedActivites = activites.map(activite => ({
        ...activite,
        adherents: activite.adherents.filter(adherentId => adherentId !== id)
      }));
      onUpdateActivites(updatedActivites);
    }
  };

  const handleViewDetails = (adherent: Adherent) => {
    setSelectedMember(adherent);
    setShowDetailModal(true);
  };

  const getActivitesNames = (activiteIds: string[]) => {
    return activiteIds
      .map(id => activites.find(a => a.id === id)?.nom)
      .filter(name => name)
      .join(', ');
  };

  const calculateAge = (dateNaissance: string) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header avec recherche, filtre et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un adhérent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous types</option>
              <option value="Individuelle">Individuelle</option>
              <option value="Famille">Famille</option>
            </select>
          </div>
        </div>
        
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Nouvel Adhérent
        </Button>
      </div>

      {/* Indicateur de saison */}
      <Card>
        <div className="text-center py-2">
          <p className="text-sm text-gray-600">
            <strong>Saison active :</strong> {getSaisonActive()}
          </p>
        </div>
      </Card>

      {/* Liste des adhérents */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdherents.map((adherent) => (
          <Card key={adherent.id}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {adherent.prenom} {adherent.nom}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {calculateAge(adherent.dateNaissance)} ans
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleViewDetails(adherent)}>
                    <User className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(adherent)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(adherent.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{adherent.telephone}</span>
                  {adherent.telephone2 && (
                    <span className="text-gray-500">• {adherent.telephone2}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600 truncate">{adherent.email}</span>
                </div>
                {adherent.email2 && (
                  <div className="flex items-center gap-2 ml-6">
                    <span className="text-gray-500 truncate text-xs">{adherent.email2}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{adherent.ville}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  adherent.typeAdhesion === 'Famille' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {adherent.typeAdhesion}
                </span>
                <span className="text-sm text-gray-600">
                  {adherent.activites.length} activité(s)
                </span>
              </div>

              {adherent.activites.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    <strong>Activités:</strong> {getActivitesNames(adherent.activites)}
                  </p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredAdherents.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' ? 'Aucun adhérent trouvé' : 'Aucun adhérent enregistré'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingMember ? 'Modifier l\'Adhérent' : 'Nouvel Adhérent'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom de famille"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Prénom"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de naissance *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dateNaissance}
                      onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sexe *
                    </label>
                    <select
                      required
                      value={formData.sexe}
                      onChange={(e) => setFormData({ ...formData, sexe: e.target.value as 'Homme' | 'Femme' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Homme">Homme</option>
                      <option value="Femme">Femme</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Adresse complète"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      required
                      pattern="[0-9]{5}"
                      value={formData.codePostal}
                      onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="75000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ville"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@exemple.com"
                  />
                </div>

                {/* Bouton pour afficher les champs avancés */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFields(!showAdvancedFields)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {showAdvancedFields ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    Contacts supplémentaires (optionnel)
                  </button>
                </div>

                {/* Champs avancés */}
                {showAdvancedFields && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone 2
                      </label>
                      <input
                        type="tel"
                        pattern="[0-9]{10}"
                        value={formData.telephone2}
                        onChange={(e) => setFormData({ ...formData, telephone2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0123456789"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email 2
                      </label>
                      <input
                        type="email"
                        value={formData.email2}
                        onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="email2@exemple.com"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type d'adhésion *
                  </label>
                  <select
                    required
                    value={formData.typeAdhesion}
                    onChange={(e) => setFormData({ ...formData, typeAdhesion: e.target.value as 'Individuelle' | 'Famille' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Individuelle">Individuelle</option>
                    <option value="Famille">Famille</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activités
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                    {activites.map((activite) => (
                      <label key={activite.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.activites.includes(activite.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                activites: [...formData.activites, activite.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                activites: formData.activites.filter(id => id !== activite.id)
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{activite.nom}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingMember ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {showDetailModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              Détails de l'adhérent
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedMember.prenom} {selectedMember.nom}
                  </h3>
                  <p className="text-gray-600">
                    {calculateAge(selectedMember.dateNaissance)} ans • {selectedMember.sexe}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-600">{selectedMember.email}</span>
                  {selectedMember.email2 && (
                    <div className="ml-6 text-gray-500 text-xs">
                      Email 2: {selectedMember.email2}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Téléphone:</span>
                  <span className="ml-2 text-gray-600">{selectedMember.telephone}</span>
                  {selectedMember.telephone2 && (
                    <div className="ml-6 text-gray-500 text-xs">
                      Tél. 2: {selectedMember.telephone2}
                    </div>
                  )}
                </div>
                <div>
                  <span className="font-medium text-gray-700">Adresse:</span>
                  <span className="ml-2 text-gray-600">
                    {selectedMember.adresse}, {selectedMember.codePostal} {selectedMember.ville}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type d'adhésion:</span>
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    selectedMember.typeAdhesion === 'Famille'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedMember.typeAdhesion}
                  </span>
                </div>
                {selectedMember.activites.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Activités:</span>
                    <span className="ml-2 text-gray-600">
                      {getActivitesNames(selectedMember.activites)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setShowDetailModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}