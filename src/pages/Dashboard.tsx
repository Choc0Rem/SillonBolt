import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Users, Activity, CreditCard, CheckSquare, TrendingUp, AlertCircle, Clock, Flag, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { EvenementAgenda } from '../types';

interface DashboardProps {
  adherents: any[];
  activites: any[];
  paiements: any[];
  taches: any[];
  evenements: EvenementAgenda[];
}

export default function Dashboard({ adherents, activites, paiements, taches, evenements }: DashboardProps) {
  const paiementsEnAttente = paiements.filter(p => p.statut === 'En attente').length;
  const totalRevenu = paiements.filter(p => p.statut === 'Payé').reduce((acc, p) => acc + p.montant, 0);

  const stats = [
    {
      title: 'Total Adhérents',
      value: adherents.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Activités Proposées',
      value: activites.length,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Revenus (€)',
      value: totalRevenu,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Paiements en attente',
      value: paiementsEnAttente,
      icon: CreditCard,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Urgent': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'Important': return <Flag className="w-4 h-4 text-orange-600" />;
      case 'Normal': return <CheckSquare className="w-4 h-4 text-blue-600" />;
      default: return <CheckSquare className="w-4 h-4 text-gray-600" />;
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

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'Activité': return '#3B82F6';
      case 'Réunion': return '#10B981';
      case 'Événement': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const isOverdue = (dateEcheance: string) => {
    return new Date(dateEcheance) < new Date() && dateEcheance !== '';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Événements à venir (7 prochains jours)
  const upcomingEvents = evenements
    .filter(event => {
      const eventDate = new Date(event.dateDebut);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Toutes les Tâches */}
        <Card title="Toutes les Tâches" className="h-fit">
          {taches.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {taches.map((tache) => {
                const overdue = isOverdue(tache.dateEcheance);
                return (
                  <div 
                    key={tache.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${
                      overdue && tache.statut !== 'Terminé' ? 'bg-red-50 border-red-500' :
                      tache.type === 'Urgent' ? 'bg-red-50 border-red-500' :
                      tache.type === 'Important' ? 'bg-orange-50 border-orange-500' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {getTypeIcon(tache.type)}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{tache.nom}</p>
                        <p className="text-sm text-gray-600 line-clamp-1">{tache.description}</p>
                        {tache.dateEcheance && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className={`text-xs ${
                              overdue && tache.statut !== 'Terminé' ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}>
                              {overdue && tache.statut !== 'Terminé' ? 'En retard' : 'Échéance'}: {new Date(tache.dateEcheance).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(tache.statut)}`}>
                      {tache.statut}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucune tâche créée</p>
          )}
        </Card>

        {/* Événements à Venir */}
        <Card title="Événements à Venir (7 jours)" className="h-fit">
          {upcomingEvents.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-3 rounded-lg border-l-4"
                  style={{ 
                    backgroundColor: `${getEventTypeColor(event.type)}15`,
                    borderLeftColor: getEventTypeColor(event.type)
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <CalendarIcon 
                      className="w-4 h-4" 
                      style={{ color: getEventTypeColor(event.type) }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{event.titre}</p>
                      <p className="text-sm text-gray-600 line-clamp-1">{event.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(event.dateDebut)} à {formatTime(event.dateDebut)}</span>
                        </div>
                        {event.lieu && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.lieu}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span 
                    className="px-2 py-1 text-xs rounded-full font-medium text-white"
                    style={{ backgroundColor: getEventTypeColor(event.type) }}
                  >
                    {event.type}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Aucun événement à venir</p>
          )}
        </Card>
      </div>

      {/* Activités Populaires */}
      {activites.length > 0 && (
        <Card title="Activités les Plus Populaires">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activites
              .sort((a, b) => b.adherents.length - a.adherents.length)
              .slice(0, 3)
              .map((activite) => (
                <div key={activite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{activite.nom}</p>
                    <p className="text-sm text-gray-600">{activite.adherents.length} adhérents</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">{activite.prix}€</p>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}

      {/* Résumé des Paiements */}
      {paiements.length > 0 && (
        <Card title="Résumé des Paiements">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{paiements.filter(p => p.statut === 'Payé').length}</p>
              <p className="text-sm text-gray-600">Paiements effectués</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{paiementsEnAttente}</p>
              <p className="text-sm text-gray-600">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{totalRevenu}€</p>
              <p className="text-sm text-gray-600">Revenus totaux</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}