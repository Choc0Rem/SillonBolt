import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Search, Edit, Trash2, Filter, CreditCard, User, Calendar, Euro, ChevronDown, ChevronRight } from 'lucide-react';
import { Paiement, Adherent, Activite } from '../types';
import { getSaisonActive, isSaisonTerminee } from '../utils/database';

interface PaymentsProps {
  paiements: Paiement[];
  adherents: Adherent[];
  activites: Activite[];
  modesPaiement: { id: string; nom: string }[];
  onUpdatePaiements: (paiements: Paiement[]) => void;
}

export default function Payments({ 
  paiements, 
  adherents, 
  activites, 
  modesPaiement, 
  onUpdatePaiements 
}: PaymentsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Payé' | 'En attente'>('all');
  const [filterActivity, setFilterActivity] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Paiement | null>(null);
  const [expandedAdherents, setExpandedAdherents] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    adherentId: '',
    activiteId: '',
    montant: 0,
    datePaiement: '',
    modePaiement: 'Espèces' as 'Espèces' | 'Chèque' | 'Virement',
    statut: 'En attente' as 'Payé' | 'En attente'
  });

  const saisonTerminee = isSaisonTerminee();

  const filteredPaiements = paiements.filter(paiement => {
    const adherent = adherents.find(a => a.id === paiement.adherentId);
    const activite = activites.find(a => a.id === paiement.activiteId);
    
    const matchesSearch = adherent && (
      adherent.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adherent.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activite && activite.nom.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    const matchesStatus = filterStatus === 'all' || paiement.statut === filterStatus;
    const matchesActivity = filterActivity === 'all' || paiement.activiteId === filterActivity;
    
    return matchesSearch && matchesStatus && matchesActivity;
  });

  // Grouper les paiements par adhérent
  const groupedPayments = adherents.reduce((acc, adherent) => {
    const adherentPayments = filteredPaiements.filter(p => p.adherentId === adherent.id);
    if (adherentPayments.length > 0) {
      acc[adherent.id] = {
        adherent,
        paiements: adherentPayments
      };
    }
    return acc;
  }, {} as Record<string, { adherent: Adherent; paiements: Paiement[] }>);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Soumission formulaire paiement:', formData);
    
    if (saisonTerminee) {
      alert('Impossible de modifier les paiements : la saison est terminée');
      return;
    }
    
    if (editingPayment) {
      console.log('Modification paiement existant:', editingPayment.id);
      const updatedPaiement = {
        ...editingPayment,
        ...formData,
        saison: editingPayment.saison
      };
      const updatedPaiements = paiements.map(p =>
        p.id === editingPayment.id ? updatedPaiement : p
      );
      onUpdatePaiements(updatedPaiements);
    } else {
      console.log('Création nouveau paiement');
      const newPaiement: Paiement = {
        id: Date.now().toString(),
        ...formData,
        saison: getSaisonActive(),
        createdAt: new Date().toISOString()
      };
      
      console.log('Nouveau paiement créé:', newPaiement);
      
      const updatedPaiements = [...paiements, newPaiement];
      onUpdatePaiements(updatedPaiements);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      adherentId: '',
      activiteId: '',
      montant: 0,
      datePaiement: '',
      modePaiement: 'Espèces',
      statut: 'En attente'
    });
    setEditingPayment(null);
    setShowModal(false);
  };

  const handleEdit = (paiement: Paiement) => {
    if (saisonTerminee) {
      alert('Impossible de modifier les paiements : la saison est terminée');
      return;
    }
    
    setEditingPayment(paiement);
    setFormData({
      adherentId: paiement.adherentId,
      activiteId: paiement.activiteId,
      montant: paiement.montant,
      datePaiement: paiement.datePaiement,
      modePaiement: paiement.modePaiement,
      statut: paiement.statut
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (saisonTerminee) {
      alert('Impossible de supprimer les paiements : la saison est terminée');
      return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      const updatedPaiements = paiements.filter(p => p.id !== id);
      onUpdatePaiements(updatedPaiements);
    }
  };

  const toggleAdherentExpansion = (adherentId: string) => {
    const newExpanded = new Set(expandedAdherents);
    if (newExpanded.has(adherentId)) {
      newExpanded.delete(adherentId);
    } else {
      newExpanded.add(adherentId);
    }
    setExpandedAdherents(newExpanded);
  };

  const getAdherentName = (adherentId: string) => {
    const adherent = adherents.find(a => a.id === adherentId);
    return adherent ? `${adherent.prenom} ${adherent.nom}` : 'Inconnu';
  };

  const getActiviteName = (activiteId: string) => {
    const activite = activites.find(a => a.id === activiteId);
    return activite ? activite.nom : 'Inconnue';
  };

  const totalPaid = paiements.filter(p => p.statut === 'Payé').reduce((acc, p) => acc + p.montant, 0);
  const totalPending = paiements.filter(p => p.statut === 'En attente').reduce((acc, p) => acc + p.montant, 0);

  return (
    <div className="space-y-6">
      {/* Alerte saison terminée */}
      {saisonTerminee && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3 text-orange-800">
            <Calendar className="w-5 h-5" />
            <p className="font-medium">
              Saison terminée - Les modifications sont désactivées
            </p>
          </div>
        </Card>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <Euro className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Encaissé</p>
              <p className="text-2xl font-bold text-green-600">{totalPaid}€</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-orange-600">{totalPending}€</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Paiements</p>
              <p className="text-2xl font-bold text-blue-600">{paiements.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header avec recherche et filtres */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un paiement..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              <option value="Payé">Payé</option>
              <option value="En attente">En attente</option>
            </select>
            
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes activités</option>
              {activites.map(activite => (
                <option key={activite.id} value={activite.id}>{activite.nom}</option>
              ))}
            </select>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowModal(true)} 
          icon={Plus}
          disabled={saisonTerminee}
        >
          Nouveau Paiement
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

      {/* Liste des paiements groupés par adhérent */}
      <Card>
        <div className="space-y-4">
          {Object.values(groupedPayments).map(({ adherent, paiements: adherentPaiements }) => {
            const isExpanded = expandedAdherents.has(adherent.id);
            const totalAdherent = adherentPaiements.reduce((acc, p) => acc + p.montant, 0);
            const paidAmount = adherentPaiements.filter(p => p.statut === 'Payé').reduce((acc, p) => acc + p.montant, 0);
            const pendingAmount = adherentPaiements.filter(p => p.statut === 'En attente').reduce((acc, p) => acc + p.montant, 0);
            
            return (
              <div key={adherent.id} className="border border-gray-200 rounded-lg">
                {/* En-tête de l'adhérent */}
                <div 
                  className="p-4 bg-gray-50 rounded-t-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleAdherentExpansion(adherent.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      )}
                      <User className="w-5 h-5 text-gray-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {adherent.prenom} {adherent.nom}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {adherentPaiements.length} paiement(s) • Total: {totalAdherent}€
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{paidAmount}€</p>
                        <p className="text-gray-500">Payé</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-orange-600">{pendingAmount}€</p>
                        <p className="text-gray-500">En attente</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Détails des paiements */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Activité</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Montant</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Mode</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adherentPaiements.map((paiement) => (
                            <tr key={paiement.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-600">{getActiviteName(paiement.activiteId)}</td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-green-600">{paiement.montant}€</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                  {paiement.modePaiement}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {paiement.datePaiement ? new Date(paiement.datePaiement).toLocaleDateString('fr-FR') : '-'}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                  paiement.statut === 'Payé' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {paiement.statut}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleEdit(paiement)}
                                    disabled={saisonTerminee}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDelete(paiement.id)}
                                    disabled={saisonTerminee}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {Object.keys(groupedPayments).length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun paiement trouvé</p>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingPayment ? 'Modifier le Paiement' : 'Nouveau Paiement'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adhérent
                </label>
                <select
                  required
                  value={formData.adherentId}
                  onChange={(e) => setFormData({ ...formData, adherentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un adhérent</option>
                  {adherents.map(adherent => (
                    <option key={adherent.id} value={adherent.id}>
                      {adherent.prenom} {adherent.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activité
                </label>
                <select
                  required
                  value={formData.activiteId}
                  onChange={(e) => setFormData({ ...formData, activiteId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une activité</option>
                  {activites.map(activite => (
                    <option key={activite.id} value={activite.id}>
                      {activite.nom} - {activite.prix}€
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant (€)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode de paiement
                  </label>
                  <select
                    value={formData.modePaiement}
                    onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {modesPaiement.map(mode => (
                      <option key={mode.id} value={mode.nom}>{mode.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de paiement
                  </label>
                  <input
                    type="date"
                    value={formData.datePaiement}
                    onChange={(e) => setFormData({ ...formData, datePaiement: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="En attente">En attente</option>
                    <option value="Payé">Payé</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingPayment ? 'Modifier' : 'Créer'}
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