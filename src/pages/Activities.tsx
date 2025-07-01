import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react';
import { Activite, Adherent } from '../types';
import { getSaisonActive } from '../utils/database';

interface ActivitiesProps {
  activites: Activite[];
  adherents: Adherent[];
  onUpdateActivites: (activites: Activite[]) => void;
}

export default function Activities({ activites, adherents, onUpdateActivites }: ActivitiesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activite | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: 0
  });

  const filteredActivites = activites.filter(activite =>
    activite.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activite.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Soumission formulaire activité:', formData);
    
    if (editingActivity) {
      console.log('Modification activité existante:', editingActivity.id);
      const updatedActivite = {
        ...editingActivity,
        ...formData,
        saison: editingActivity.saison
      };
      const updatedActivites = activites.map(a =>
        a.id === editingActivity.id ? updatedActivite : a
      );
      onUpdateActivites(updatedActivites);
    } else {
      console.log('Création nouvelle activité');
      const newActivite: Activite = {
        id: Date.now().toString(),
        ...formData,
        adherents: [],
        saison: getSaisonActive(),
        createdAt: new Date().toISOString()
      };
      
      console.log('Nouvelle activité créée:', newActivite);
      
      const updatedActivites = [...activites, newActivite];
      onUpdateActivites(updatedActivites);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({ nom: '', description: '', prix: 0 });
    setEditingActivity(null);
    setShowModal(false);
  };

  const handleEdit = (activite: Activite) => {
    setEditingActivity(activite);
    setFormData({
      nom: activite.nom,
      description: activite.description,
      prix: activite.prix
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      const updatedActivites = activites.filter(a => a.id !== id);
      onUpdateActivites(updatedActivites);
    }
  };

  const getAdherentsNames = (adherentIds: string[]) => {
    return adherentIds
      .map(id => {
        const adherent = adherents.find(a => a.id === id);
        return adherent ? `${adherent.prenom} ${adherent.nom}` : '';
      })
      .filter(name => name)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header avec recherche et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Nouvelle Activité
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

      {/* Liste des activités */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivites.map((activite) => (
          <Card key={activite.id}>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{activite.nom}</h3>
                  <p className="text-gray-600 text-sm mt-1">{activite.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(activite)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(activite.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium text-lg">
                  {activite.prix}€
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {activite.adherents.length} adhérent(s)
                  </span>
                </div>
                {activite.adherents.length > 0 && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {getAdherentsNames(activite.adherents)}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredActivites.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm ? 'Aucune activité trouvée' : 'Aucune activité créée'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingActivity ? 'Modifier l\'Activité' : 'Nouvelle Activité'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'activité *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de l'activité..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Description de l'activité..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (€) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.prix}
                  onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingActivity ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}