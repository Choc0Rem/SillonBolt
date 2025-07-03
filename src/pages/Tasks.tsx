import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, Search, Edit, Trash2, Filter, CheckSquare, Clock, AlertTriangle, Flag } from 'lucide-react';
import { Tache } from '../types';

interface TasksProps {
  taches: Tache[];
  onUpdateTaches: (taches: Tache[]) => void;
}

export default function Tasks({ taches = [], onUpdateTaches }: TasksProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Urgent' | 'Important' | 'Normal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'À faire' | 'En cours' | 'Terminé'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Tache | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    dateEcheance: '',
    type: 'Normal' as 'Urgent' | 'Important' | 'Normal',
    statut: 'À faire' as 'À faire' | 'En cours' | 'Terminé'
  });

  const filteredTaches = taches.filter(tache => {
    const matchesSearch = 
      tache.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tache.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || tache.type === filterType;
    const matchesStatus = filterStatus === 'all' || tache.statut === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      const updatedTache = {
        ...editingTask,
        ...formData
      };
      const updatedTaches = taches.map(t =>
        t.id === editingTask.id ? updatedTache : t
      );
      onUpdateTaches(updatedTaches);
    } else {
      const newTache: Tache = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      onUpdateTaches([...taches, newTache]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      dateEcheance: '',
      type: 'Normal',
      statut: 'À faire'
    });
    setEditingTask(null);
    setShowModal(false);
  };

  const handleEdit = (tache: Tache) => {
    setEditingTask(tache);
    setFormData({
      nom: tache.nom,
      description: tache.description,
      dateEcheance: tache.dateEcheance,
      type: tache.type,
      statut: tache.statut
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      onUpdateTaches(taches.filter(t => t.id !== id));
    }
  };

  const handleStatusChange = (id: string, newStatus: 'À faire' | 'En cours' | 'Terminé') => {
    const updatedTaches = taches.map(t =>
      t.id === id ? { ...t, statut: newStatus } : t
    );
    onUpdateTaches(updatedTaches);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Important': return <Flag className="w-4 h-4 text-orange-600" />;
      case 'Normal': return <CheckSquare className="w-4 h-4 text-blue-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'Important': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'À faire': return 'bg-gray-100 text-gray-800';
      case 'En cours': return 'bg-yellow-100 text-yellow-800';
      case 'Terminé': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date() && dateEcheance !== '';
  };

  const getDaysUntilDue = (dateEcheance: string) => {
    if (!dateEcheance) return null;
    const today = new Date();
    const dueDate = new Date(dateEcheance);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Statistiques
  const totalTasks = taches.length;
  const completedTasks = taches.filter(t => t.statut === 'Terminé').length;
  const urgentTasks = taches.filter(t => t.type === 'Urgent' && t.statut !== 'Terminé').length;
  const overdueTasks = taches.filter(t => isOverdue(t.dateEcheance) && t.statut !== 'Terminé').length;

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tâches</p>
              <p className="text-2xl font-bold text-blue-600">{totalTasks}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Terminées</p>
              <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Urgentes</p>
              <p className="text-2xl font-bold text-red-600">{urgentTasks}</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">En Retard</p>
              <p className="text-2xl font-bold text-orange-600">{overdueTasks}</p>
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
              placeholder="Rechercher une tâche..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous types</option>
              <option value="Urgent">Urgent</option>
              <option value="Important">Important</option>
              <option value="Normal">Normal</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous statuts</option>
              <option value="À faire">À faire</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>
        
        <Button onClick={() => setShowModal(true)} icon={Plus}>
          Nouvelle Tâche
        </Button>
      </div>

      {/* Liste des tâches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTaches.map((tache) => {
          const daysUntilDue = getDaysUntilDue(tache.dateEcheance);
          const overdue = isOverdue(tache.dateEcheance);
          
          return (
            <Card key={tache.id} className={overdue && tache.statut !== 'Terminé' ? 'border-red-300 bg-red-50' : ''}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    {getTypeIcon(tache.type)}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{tache.nom}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{tache.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(tache)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(tache.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 text-xs rounded-full font-medium border ${getTypeColor(tache.type)}`}>
                    {tache.type}
                  </span>
                  
                  <select
                    value={tache.statut}
                    onChange={(e) => handleStatusChange(tache.id, e.target.value as any)}
                    className={`px-3 py-1 text-xs rounded-full font-medium border-0 ${getStatusColor(tache.statut)}`}
                  >
                    <option value="À faire">À faire</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>

                {tache.dateEcheance && (
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">
                        Échéance: {new Date(tache.dateEcheance).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {daysUntilDue !== null && tache.statut !== 'Terminé' && (
                      <div className={`mt-2 text-xs font-medium ${
                        overdue ? 'text-red-600' :
                        daysUntilDue <= 3 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {overdue ? 
                          `En retard de ${Math.abs(daysUntilDue)} jour(s)` :
                          daysUntilDue === 0 ? 'Échéance aujourd\'hui' :
                          `${daysUntilDue} jour(s) restant(s)`
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredTaches.length === 0 && (
        <Card>
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' ? 'Aucune tâche trouvée' : 'Aucune tâche créée'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Modifier la Tâche' : 'Nouvelle Tâche'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la tâche
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.dateEcheance}
                  onChange={(e) => setFormData({ ...formData, dateEcheance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Important">Important</option>
                    <option value="Urgent">Urgent</option>
                  </select>
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
                    <option value="À faire">À faire</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTask ? 'Modifier' : 'Créer'}
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