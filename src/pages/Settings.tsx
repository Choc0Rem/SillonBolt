import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Edit, Trash2, Settings as SettingsIcon, CreditCard, Users, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { TypeAdhesion, ModePaiement, Saison, AppSettings } from '../types';
import { getSaisonActive } from '../utils/database';

interface SettingsProps {
  typesAdhesion: TypeAdhesion[];
  modesPaiement: ModePaiement[];
  saisons: Saison[];
  settings: AppSettings | null;
  seasonOptions: string[];
  onUpdateTypesAdhesion: (types: TypeAdhesion[]) => void;
  onUpdateModesPaiement: (modes: ModePaiement[]) => void;
  onChangeSaison: (saisonId: string) => void;
  onAddSaison: (seasonName: string, dateDebut: string, dateFin: string) => void;
  onUpdateSaison: (saison: Saison) => void;
  onDeleteSaison: (id: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
}

export default function Settings({ 
  typesAdhesion, 
  modesPaiement, 
  saisons,
  settings,
  seasonOptions,
  onUpdateTypesAdhesion, 
  onUpdateModesPaiement,
  onChangeSaison,
  onAddSaison,
  onUpdateSaison,
  onDeleteSaison,
  onUpdateSettings
}: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'seasons' | 'membership' | 'payment'>('seasons');
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingMembership, setEditingMembership] = useState<TypeAdhesion | null>(null);
  const [editingPayment, setEditingPayment] = useState<ModePaiement | null>(null);
  const [editingSaison, setEditingSaison] = useState<Saison | null>(null);
  
  const [membershipForm, setMembershipForm] = useState({
    nom: '',
    prix: 0
  });
  
  const [paymentForm, setPaymentForm] = useState({
    nom: ''
  });

  const [seasonForm, setSeasonForm] = useState({
    selectedSeason: '',
    dateDebut: '',
    dateFin: '',
    terminee: false
  });

  // Gestion des types d'adhésion
  const handleMembershipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingMembership) {
      const updatedTypes = typesAdhesion.map(type =>
        type.id === editingMembership.id
          ? { ...type, ...membershipForm }
          : type
      );
      onUpdateTypesAdhesion(updatedTypes);
    } else {
      const newType: TypeAdhesion = {
        id: Date.now().toString(),
        ...membershipForm
      };
      onUpdateTypesAdhesion([...typesAdhesion, newType]);
    }
    
    resetMembershipForm();
  };

  const resetMembershipForm = () => {
    setMembershipForm({ nom: '', prix: 0 });
    setEditingMembership(null);
    setShowMembershipModal(false);
  };

  const handleEditMembership = (type: TypeAdhesion) => {
    setEditingMembership(type);
    setMembershipForm({
      nom: type.nom,
      prix: type.prix
    });
    setShowMembershipModal(true);
  };

  const handleDeleteMembership = (id: string) => {
    const typeToDelete = typesAdhesion.find(t => t.id === id);
    if (typeToDelete && (typeToDelete.nom === 'Individuelle' || typeToDelete.nom === 'Famille')) {
      alert('Impossible de supprimer les types d\'adhésion par défaut');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type d\'adhésion ?')) {
      onUpdateTypesAdhesion(typesAdhesion.filter(t => t.id !== id));
    }
  };

  // Gestion des modes de paiement
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPayment) {
      const updatedModes = modesPaiement.map(mode =>
        mode.id === editingPayment.id
          ? { ...mode, ...paymentForm }
          : mode
      );
      onUpdateModesPaiement(updatedModes);
    } else {
      const newMode: ModePaiement = {
        id: Date.now().toString(),
        ...paymentForm
      };
      onUpdateModesPaiement([...modesPaiement, newMode]);
    }
    
    resetPaymentForm();
  };

  const resetPaymentForm = () => {
    setPaymentForm({ nom: '' });
    setEditingPayment(null);
    setShowPaymentModal(false);
  };

  const handleEditPayment = (mode: ModePaiement) => {
    setEditingPayment(mode);
    setPaymentForm({
      nom: mode.nom
    });
    setShowPaymentModal(true);
  };

  const handleDeletePayment = (id: string) => {
    const modeToDelete = modesPaiement.find(m => m.id === id);
    if (modeToDelete && ['Espèces', 'Chèque', 'Virement'].includes(modeToDelete.nom)) {
      alert('Impossible de supprimer les modes de paiement par défaut');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce mode de paiement ?')) {
      onUpdateModesPaiement(modesPaiement.filter(m => m.id !== id));
    }
  };

  // Gestion des saisons
  const handleSeasonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingSaison) {
      // Modification d'une saison existante
      const updatedSaison = {
        ...editingSaison,
        dateDebut: seasonForm.dateDebut,
        dateFin: seasonForm.dateFin,
        terminee: seasonForm.terminee
      };
      onUpdateSaison(updatedSaison);
    } else {
      // Création d'une nouvelle saison
      if (!seasonForm.selectedSeason) {
        alert('Veuillez sélectionner une saison');
        return;
      }
      
      // Générer les dates par défaut si non spécifiées
      let dateDebut = seasonForm.dateDebut;
      let dateFin = seasonForm.dateFin;
      
      if (!dateDebut || !dateFin) {
        const year = parseInt(seasonForm.selectedSeason.split('-')[0]);
        dateDebut = `${year}-09-01`;
        dateFin = `${year + 1}-08-31`;
      }
      
      onAddSaison(seasonForm.selectedSeason, dateDebut, dateFin);
    }
    
    resetSeasonForm();
  };

  const resetSeasonForm = () => {
    setSeasonForm({
      selectedSeason: '',
      dateDebut: '',
      dateFin: '',
      terminee: false
    });
    setEditingSaison(null);
    setShowSeasonModal(false);
  };

  const handleEditSaison = (saison: Saison) => {
    setEditingSaison(saison);
    setSeasonForm({
      selectedSeason: saison.nom,
      dateDebut: saison.dateDebut,
      dateFin: saison.dateFin,
      terminee: saison.terminee
    });
    setShowSeasonModal(true);
  };

  const handleChangeSaison = (saisonId: string) => {
    onChangeSaison(saisonId);
  };

  const handleToggleTerminee = (saison: Saison) => {
    const updatedSaison = { ...saison, terminee: !saison.terminee };
    onUpdateSaison(updatedSaison);
  };

  const renderSeasonsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Gestion des Saisons</h3>
        <Button onClick={() => setShowSeasonModal(true)} icon={Plus}>
          Nouvelle Saison
        </Button>
      </div>

      <Card title="Saison Active">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner la saison active
            </label>
            <select
              value={getSaisonActive()}
              onChange={(e) => {
                const saison = saisons.find(s => s.nom === e.target.value);
                if (saison) handleChangeSaison(saison.id);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {saisons.map(saison => (
                <option key={saison.id} value={saison.nom}>
                  {saison.nom} {saison.terminee ? '(Terminée)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            <p><strong>Saison actuelle :</strong> {getSaisonActive()}</p>
          </div>
        </div>
      </Card>

      <Card title="Toutes les Saisons">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Saison</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Période</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">État</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {saisons.map((saison) => (
                <tr key={saison.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{saison.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(saison.dateDebut).toLocaleDateString('fr-FR')} - {new Date(saison.dateFin).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      saison.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {saison.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleTerminee(saison)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        saison.terminee
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {saison.terminee ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          Terminée
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          En cours
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditSaison(saison)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!saison.active && (
                        <Button variant="ghost" size="sm" onClick={() => onDeleteSaison(saison.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderMembershipTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Types d'Adhésion</h3>
        <Button onClick={() => setShowMembershipModal(true)} icon={Plus}>
          Nouveau Type
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Prix</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {typesAdhesion.map((type) => (
                <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{type.nom}</span>
                      {(type.nom === 'Individuelle' || type.nom === 'Famille') && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-green-600">{type.prix}€</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditMembership(type)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!(type.nom === 'Individuelle' || type.nom === 'Famille') && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteMembership(type.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {typesAdhesion.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun type d'adhésion configuré</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  const renderPaymentTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Modes de Paiement</h3>
        <Button onClick={() => setShowPaymentModal(true)} icon={Plus}>
          Nouveau Mode
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {modesPaiement.map((mode) => (
                <tr key={mode.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{mode.nom}</span>
                      {['Espèces', 'Chèque', 'Virement'].includes(mode.nom) && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPayment(mode)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!['Espèces', 'Chèque', 'Virement'].includes(mode.nom) && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePayment(mode.id)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {modesPaiement.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun mode de paiement configuré</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header avec onglets */}
      <div className="flex items-center gap-4">
        <SettingsIcon className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-800">Paramètres</h2>
      </div>

      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('seasons')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'seasons'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          Saisons
        </button>
        <button
          onClick={() => setActiveTab('membership')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'membership'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Adhésions
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'payment'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Paiements
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'seasons' && renderSeasonsTab()}
      {activeTab === 'membership' && renderMembershipTab()}
      {activeTab === 'payment' && renderPaymentTab()}

      {/* Modal Nouvelle/Modifier Saison */}
      {showSeasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingSaison ? 'Modifier la Saison' : 'Nouvelle Saison'}
            </h2>
            
            <form onSubmit={handleSeasonSubmit} className="space-y-4">
              {!editingSaison && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sélectionner une saison
                  </label>
                  <select
                    required
                    value={seasonForm.selectedSeason}
                    onChange={(e) => setSeasonForm({ ...seasonForm, selectedSeason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choisir une saison...</option>
                    {seasonOptions
                      .filter(option => !saisons.find(s => s.nom === option))
                      .map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                  </select>
                </div>
              )}

              {editingSaison && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saison
                  </label>
                  <input
                    type="text"
                    value={seasonForm.selectedSeason}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={seasonForm.dateDebut}
                    onChange={(e) => setSeasonForm({ ...seasonForm, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={seasonForm.dateFin}
                    onChange={(e) => setSeasonForm({ ...seasonForm, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={seasonForm.terminee}
                    onChange={(e) => setSeasonForm({ ...seasonForm, terminee: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Saison terminée</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingSaison ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetSeasonForm} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Type d'Adhésion */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingMembership ? 'Modifier le Type d\'Adhésion' : 'Nouveau Type d\'Adhésion'}
            </h2>
            
            <form onSubmit={handleMembershipSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du type
                </label>
                <input
                  type="text"
                  required
                  value={membershipForm.nom}
                  onChange={(e) => setMembershipForm({ ...membershipForm, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Étudiant, Senior..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prix (€)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={membershipForm.prix}
                  onChange={(e) => setMembershipForm({ ...membershipForm, prix: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingMembership ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetMembershipForm} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Mode de Paiement */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingPayment ? 'Modifier le Mode de Paiement' : 'Nouveau Mode de Paiement'}
            </h2>
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du mode
                </label>
                <input
                  type="text"
                  required
                  value={paymentForm.nom}
                  onChange={(e) => setPaymentForm({ ...paymentForm, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Carte bancaire, PayPal..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPayment ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetPaymentForm} className="flex-1">
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