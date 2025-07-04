import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Edit, Trash2, Settings } from 'lucide-react';
import { EvenementAgenda, TypeEvenement } from '../types';
import { getTypesEvenement, saveTypeEvenement, deleteTypeEvenement } from '../utils/database';

interface CalendarProps {
  evenements: EvenementAgenda[];
  onUpdateEvenements: (evenements: EvenementAgenda[]) => void;
}

export default function Calendar({ evenements = [], onUpdateEvenements }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showModal, setShowModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EvenementAgenda | null>(null);
  const [editingType, setEditingType] = useState<TypeEvenement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [typesEvenement, setTypesEvenement] = useState<TypeEvenement[]>([]);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    lieu: '',
    type: 'Événement' as string
  });

  const [typeForm, setTypeForm] = useState({
    nom: '',
    couleur: '#3B82F6'
  });

  React.useEffect(() => {
    setTypesEvenement(getTypesEvenement());
  }, []);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false });
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!evenements || !Array.isArray(evenements)) return [];
    return evenements.filter(event => {
      const eventDate = new Date(event.dateDebut);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForDateAndHour = (date: Date, hour: number) => {
    if (!evenements || !Array.isArray(evenements)) return [];
    
    return evenements.filter(event => {
      const eventStart = new Date(event.dateDebut);
      const eventEnd = new Date(event.dateFin);
      
      // Vérifier si l'événement est le même jour
      if (eventStart.toDateString() !== date.toDateString()) return false;
      
      const eventStartHour = eventStart.getHours() + (eventStart.getMinutes() / 60);
      const eventEndHour = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
      
      // Vérifier si l'heure actuelle est dans la plage de l'événement
      return hour >= eventStartHour && hour < eventEndHour;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEvent) {
      const updatedEvenement = {
        ...editingEvent,
        ...formData
      };
      const updatedEvenements = evenements.map(event =>
        event.id === editingEvent.id ? updatedEvenement : event
      );
      onUpdateEvenements(updatedEvenements);
    } else {
      const newEvent: EvenementAgenda = {
        id: Date.now().toString(),
        ...formData,
        type: formData.type as any,
        createdAt: new Date().toISOString()
      };
      onUpdateEvenements([...evenements, newEvent]);
    }
    
    resetForm();
  };

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingType) {
      const updatedType = { ...editingType, ...typeForm };
      saveTypeEvenement(updatedType);
    } else {
      const newType: TypeEvenement = {
        id: Date.now().toString(),
        ...typeForm
      };
      saveTypeEvenement(newType);
    }
    
    setTypesEvenement(getTypesEvenement());
    resetTypeForm();
  };

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      dateDebut: '',
      dateFin: '',
      lieu: '',
      type: 'Événement'
    });
    setEditingEvent(null);
    setShowModal(false);
    setSelectedDate(null);
  };

  const resetTypeForm = () => {
    setTypeForm({ nom: '', couleur: '#3B82F6' });
    setEditingType(null);
    setShowTypeModal(false);
  };

  const handleEdit = (event: EvenementAgenda) => {
    setEditingEvent(event);
    setFormData({
      titre: event.titre,
      description: event.description,
      dateDebut: event.dateDebut,
      dateFin: event.dateFin,
      lieu: event.lieu || '',
      type: event.type
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      onUpdateEvenements(evenements.filter(e => e.id !== id));
    }
  };

  const handleEditType = (type: TypeEvenement) => {
    setEditingType(type);
    setTypeForm({ nom: type.nom, couleur: type.couleur });
    setShowTypeModal(true);
  };

  const handleDeleteType = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce type d\'événement ?')) {
      deleteTypeEvenement(id);
      setTypesEvenement(getTypesEvenement());
    }
  };

  const handleDateClick = (date: Date, hour?: number) => {
    // Synchronisation : mettre à jour currentDate et changer de vue si nécessaire
    setCurrentDate(new Date(date));
    setSelectedDate(date);
    
    // Créer les dates par défaut
    const startDate = new Date(date);
    if (hour !== undefined) {
      startDate.setHours(hour, 0, 0, 0);
    } else {
      startDate.setHours(9, 0, 0, 0); // 9h par défaut
    }
    
    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + 1); // +1 heure par défaut
    
    setFormData({
      ...formData,
      dateDebut: startDate.toISOString().slice(0, 16),
      dateFin: endDate.toISOString().slice(0, 16)
    });
    setShowModal(true);
  };

  const handleDayClick = (date: Date) => {
    // Synchronisation : aller à la vue jour pour cette date
    setCurrentDate(new Date(date));
    setView('day');
  };

  const getEventTypeColor = (type: string) => {
    const eventType = typesEvenement.find(t => t.nom === type);
    return eventType ? eventType.couleur : '#6B7280';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    
    return (
      <Card>
        <div className="grid grid-cols-7 gap-1">
          {days.map(day => (
            <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
              {day}
            </div>
          ))}
          
          {daysInMonth.map((dayInfo, index) => {
            const dayEvents = getEventsForDate(dayInfo.date);
            const isToday = dayInfo.date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                onClick={() => dayInfo.isCurrentMonth && handleDateClick(dayInfo.date)}
                onDoubleClick={() => dayInfo.isCurrentMonth && handleDayClick(dayInfo.date)}
                className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  !dayInfo.isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {dayInfo.date.getDate()}
                </div>
                
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded text-white truncate cursor-pointer"
                      style={{ backgroundColor: getEventTypeColor(event.type) }}
                      title={`${event.titre} - ${formatTime(event.dateDebut)} à ${formatTime(event.dateFin)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(event);
                      }}
                    >
                      {event.titre}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3} autres
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <Card>
        <div className="grid grid-cols-8 gap-1">
          <div className="p-2 text-center font-semibold text-gray-600 bg-gray-50">Heure</div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center font-semibold text-gray-600 bg-gray-50">
              <div>{days[day.getDay()]}</div>
              <div 
                className="text-lg cursor-pointer hover:text-blue-600"
                onClick={() => handleDayClick(day)}
              >
                {day.getDate()}
              </div>
            </div>
          ))}
          
          {hours.map(hour => (
            <React.Fragment key={hour}>
              <div className="p-2 text-sm text-gray-500 bg-gray-50 border-r">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((day, dayIndex) => {
                const hourEvents = getEventsForDateAndHour(day, hour);
                
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[60px] p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 relative"
                    onClick={() => handleDateClick(day, hour)}
                  >
                    {hourEvents.map(event => {
                      const eventStart = new Date(event.dateDebut);
                      const eventEnd = new Date(event.dateFin);
                      const startHour = eventStart.getHours() + (eventStart.getMinutes() / 60);
                      const endHour = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
                      const duration = endHour - startHour;
                      
                      // Calculer la position et la hauteur de l'événement
                      const isFirstHour = hour === Math.floor(startHour);
                      const height = Math.min(duration * 60, (24 - hour) * 60); // hauteur en pixels
                      
                      return isFirstHour ? (
                        <div
                          key={event.id}
                          className="absolute left-1 right-1 text-xs p-1 rounded text-white z-10 overflow-hidden cursor-pointer"
                          style={{ 
                            backgroundColor: getEventTypeColor(event.type),
                            height: `${Math.max(height, 20)}px`,
                            top: `${(startHour - hour) * 60}px`
                          }}
                          title={`${event.titre} - ${formatTime(event.dateDebut)} à ${formatTime(event.dateFin)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(event);
                          }}
                        >
                          <div className="font-medium truncate">{event.titre}</div>
                          <div className="text-xs opacity-90 truncate">
                            {formatTime(event.dateDebut)} - {formatTime(event.dateFin)}
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </Card>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <Card>
        <div className="space-y-1">
          <div className="text-center font-semibold text-gray-800 p-4 bg-gray-50">
            {formatDate(currentDate.toISOString())}
          </div>
          
          {hours.map(hour => {
            const hourEvents = getEventsForDateAndHour(currentDate, hour);
            
            return (
              <div key={hour} className="flex border-b border-gray-200 relative">
                <div className="w-20 p-2 text-sm text-gray-500 bg-gray-50 border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div 
                  className="flex-1 min-h-[60px] p-2 cursor-pointer hover:bg-gray-50 relative"
                  onClick={() => handleDateClick(currentDate, hour)}
                >
                  {hourEvents.map(event => {
                    const eventStart = new Date(event.dateDebut);
                    const eventEnd = new Date(event.dateFin);
                    const startHour = eventStart.getHours() + (eventStart.getMinutes() / 60);
                    const endHour = eventEnd.getHours() + (eventEnd.getMinutes() / 60);
                    const duration = endHour - startHour;
                    
                    const isFirstHour = hour === Math.floor(startHour);
                    const height = Math.min(duration * 60, (24 - hour) * 60);
                    
                    return isFirstHour ? (
                      <div
                        key={event.id}
                        className="absolute left-2 right-2 p-2 rounded text-white z-10 cursor-pointer"
                        style={{ 
                          backgroundColor: getEventTypeColor(event.type),
                          height: `${Math.max(height, 40)}px`,
                          top: `${(startHour - hour) * 60 + 8}px`
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(event);
                        }}
                      >
                        <div className="font-medium">{event.titre}</div>
                        <div className="text-xs opacity-90">
                          {formatTime(event.dateDebut)} - {formatTime(event.dateFin)}
                        </div>
                        {event.lieu && (
                          <div className="text-xs opacity-90">{event.lieu}</div>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const renderEventsList = () => {
    const upcomingEvents = evenements
      .filter(event => new Date(event.dateDebut) >= new Date())
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
      .slice(0, 10);

    return (
      <Card title="Événements à Venir">
        <div className="space-y-3">
          {upcomingEvents.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getEventTypeColor(event.type) }}
                ></div>
                <div>
                  <h4 className="font-medium text-gray-900">{event.titre}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(event.dateDebut)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(event.dateDebut)} - {formatTime(event.dateFin)}</span>
                    </div>
                    {event.lieu && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.lieu}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>
          ))}
          
          {upcomingEvents.length === 0 && (
            <p className="text-center text-gray-500 py-4">Aucun événement à venir</p>
          )}
        </div>
      </Card>
    );
  };

  const navigate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        navigateMonth(direction);
        break;
      case 'week':
        navigateWeek(direction);
        break;
      case 'day':
        navigateDay(direction);
        break;
    }
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        const weekStart = getWeekDays(currentDate)[0];
        const weekEnd = getWeekDays(currentDate)[6];
        return `${weekStart.getDate()} - ${weekEnd.getDate()} ${months[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header avec navigation et contrôles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-800 min-w-[200px] text-center">
              {getViewTitle()}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Semaine
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Jour
            </button>
          </div>
          
          <Button variant="secondary" onClick={() => setShowTypeModal(true)} icon={Settings}>
            Types
          </Button>
          
          <Button onClick={() => setShowModal(true)} icon={Plus}>
            Nouvel Événement
          </Button>
        </div>
      </div>

      {/* Légende des types d'événements */}
      <Card>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Types d'événements:</span>
          {typesEvenement.map(type => (
            <div key={type.id} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: type.couleur }}
              ></div>
              <span className="text-sm text-gray-600">{type.nom}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Vue principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
        
        <div>
          {renderEventsList()}
        </div>
      </div>

      {/* Modal de création/édition d'événement */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingEvent ? 'Modifier l\'Événement' : 'Nouvel Événement'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre
                </label>
                <input
                  type="text"
                  required
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Heure début
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateDebut}
                    onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date/Heure fin
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dateFin}
                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.lieu}
                  onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type d'événement
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {typesEvenement.map(type => (
                    <option key={type.id} value={type.nom}>{type.nom}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingEvent ? 'Modifier' : 'Créer'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm} className="flex-1">
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de gestion des types d'événements */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des Types d'Événements</h2>
            
            <form onSubmit={handleTypeSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du type
                  </label>
                  <input
                    type="text"
                    required
                    value={typeForm.nom}
                    onChange={(e) => setTypeForm({ ...typeForm, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={typeForm.couleur}
                    onChange={(e) => setTypeForm({ ...typeForm, couleur: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                {editingType ? 'Modifier' : 'Ajouter'} le Type
              </Button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {typesEvenement.map(type => (
                <div key={type.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: type.couleur }}
                    ></div>
                    <span className="font-medium">{type.nom}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditType(type)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteType(type.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="secondary" onClick={resetTypeForm}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}