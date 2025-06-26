import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, Users, Activity, CreditCard, Filter } from 'lucide-react';
import { Adherent, Activite, Paiement } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface StatisticsProps {
  adherents: Adherent[];
  activites: Activite[];
  paiements: Paiement[];
}

export default function Statistics({ adherents, activites, paiements }: StatisticsProps) {
  const [activeTab, setActiveTab] = useState<'activities' | 'members' | 'payments'>('activities');
  const [isExporting, setIsExporting] = useState(false);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

  // Données pour les activités
  const activitiesData = activites.map(activite => ({
    name: activite.nom,
    adherents: activite.adherents.length,
    prix: activite.prix,
    taux: activite.adherents.length > 0 ? 100 : 0
  }));

  // Données pour les adhérents
  const genderData = [
    { name: 'Hommes', value: adherents.filter(a => a.sexe === 'Homme').length },
    { name: 'Femmes', value: adherents.filter(a => a.sexe === 'Femme').length }
  ];

  const membershipData = [
    { name: 'Individuelle', value: adherents.filter(a => a.typeAdhesion === 'Individuelle').length },
    { name: 'Famille', value: adherents.filter(a => a.typeAdhesion === 'Famille').length }
  ];

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

  const ageRanges = [
    { name: '0-17 ans', min: 0, max: 17 },
    { name: '18-30 ans', min: 18, max: 30 },
    { name: '31-50 ans', min: 31, max: 50 },
    { name: '51-65 ans', min: 51, max: 65 },
    { name: '65+ ans', min: 65, max: 150 }
  ];

  const ageData = ageRanges.map(range => ({
    name: range.name,
    value: adherents.filter(a => {
      const age = calculateAge(a.dateNaissance);
      return age >= range.min && age <= range.max;
    }).length
  }));

  const cityData = adherents.reduce((acc, adherent) => {
    const city = adherent.ville;
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityChartData = Object.entries(cityData)
    .map(([city, count]) => ({ name: city, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const activitiesPerMemberData = adherents.map(adherent => ({
    name: `${adherent.prenom} ${adherent.nom}`,
    activites: adherent.activites.length
  })).sort((a, b) => b.activites - a.activites);

  // Données pour les paiements
  const paymentStatusData = [
    { name: 'Payé', value: paiements.filter(p => p.statut === 'Payé').length },
    { name: 'En attente', value: paiements.filter(p => p.statut === 'En attente').length }
  ];

  const paymentMethodData = ['Espèces', 'Chèque', 'Virement'].map(method => ({
    name: method,
    value: paiements.filter(p => p.modePaiement === method).length
  }));

  const monthlyRevenue = paiements
    .filter(p => p.statut === 'Payé' && p.datePaiement)
    .reduce((acc, payment) => {
      const month = new Date(payment.datePaiement).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + payment.montant;
      return acc;
    }, {} as Record<string, number>);

  const revenueData = Object.entries(monthlyRevenue).map(([month, amount]) => ({
    name: month,
    montant: amount
  }));

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Titre principal
      pdf.setFontSize(20);
      pdf.setTextColor(59, 130, 246); // Bleu
      pdf.text('Rapport Statistiques - Association', pageWidth / 2, 20, { align: 'center' });
      
      // Date du rapport
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 30, { align: 'center' });
      
      let yPosition = 50;
      
      // Statistiques générales
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Statistiques Générales', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.text(`• Total adhérents: ${adherents.length}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`• Total activités: ${activites.length}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`• Total paiements: ${paiements.length}`, 25, yPosition);
      yPosition += 8;
      pdf.text(`• Revenus totaux: ${paiements.filter(p => p.statut === 'Payé').reduce((acc, p) => acc + p.montant, 0)}€`, 25, yPosition);
      yPosition += 20;
      
      // Répartition par sexe
      pdf.setFontSize(14);
      pdf.text('Répartition par Sexe', 20, yPosition);
      yPosition += 10;
      genderData.forEach(item => {
        pdf.setFontSize(12);
        pdf.text(`• ${item.name}: ${item.value} (${((item.value / adherents.length) * 100).toFixed(1)}%)`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
      
      // Types d'adhésion
      pdf.setFontSize(14);
      pdf.text('Types d\'Adhésion', 20, yPosition);
      yPosition += 10;
      membershipData.forEach(item => {
        pdf.setFontSize(12);
        pdf.text(`• ${item.name}: ${item.value} (${((item.value / adherents.length) * 100).toFixed(1)}%)`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
      
      // Nouvelle page si nécessaire
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Tranches d'âge
      pdf.setFontSize(14);
      pdf.text('Répartition par Âge', 20, yPosition);
      yPosition += 10;
      ageData.forEach(item => {
        if (item.value > 0) {
          pdf.setFontSize(12);
          pdf.text(`• ${item.name}: ${item.value} (${((item.value / adherents.length) * 100).toFixed(1)}%)`, 25, yPosition);
          yPosition += 8;
        }
      });
      yPosition += 10;
      
      // Activités populaires
      pdf.setFontSize(14);
      pdf.text('Activités les Plus Populaires', 20, yPosition);
      yPosition += 10;
      activitiesData
        .sort((a, b) => b.adherents - a.adherents)
        .slice(0, 5)
        .forEach(item => {
          pdf.setFontSize(12);
          pdf.text(`• ${item.name}: ${item.adherents} adhérents (${item.prix}€)`, 25, yPosition);
          yPosition += 8;
        });
      yPosition += 10;
      
      // Nouvelle page pour les paiements
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Statut des paiements
      pdf.setFontSize(14);
      pdf.text('Statut des Paiements', 20, yPosition);
      yPosition += 10;
      paymentStatusData.forEach(item => {
        pdf.setFontSize(12);
        pdf.text(`• ${item.name}: ${item.value} (${((item.value / paiements.length) * 100).toFixed(1)}%)`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
      
      // Modes de paiement
      pdf.setFontSize(14);
      pdf.text('Modes de Paiement', 20, yPosition);
      yPosition += 10;
      paymentMethodData.forEach(item => {
        if (item.value > 0) {
          pdf.setFontSize(12);
          pdf.text(`• ${item.name}: ${item.value} (${((item.value / paiements.length) * 100).toFixed(1)}%)`, 25, yPosition);
          yPosition += 8;
        }
      });
      
      // Pied de page
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text('Généré par le Logiciel de Gestion d\'Association', pageWidth / 2, pageHeight - 10, { align: 'center' });
      
      // Télécharger le PDF
      pdf.save(`statistiques-association-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderActivitiesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Adhérents par Activité">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activitiesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="adherents" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenus par Activité">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activitiesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}€`, 'Revenus potentiels']} />
              <Bar dataKey="prix" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Détails des Activités">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Activité</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Adhérents</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Prix</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Revenus Potentiels</th>
              </tr>
            </thead>
            <tbody>
              {activitiesData.map((activite, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{activite.name}</td>
                  <td className="py-3 px-4">{activite.adherents}</td>
                  <td className="py-3 px-4">{activite.prix}€</td>
                  <td className="py-3 px-4 font-semibold text-green-600">
                    {activite.adherents * activite.prix}€
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Répartition par Sexe">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Type d'Adhésion">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={membershipData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {membershipData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index + 2]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Tranches d'Âge">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ageData.filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {ageData.filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index + 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Répartition par Ville">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Activités par Adhérent">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activitiesPerMemberData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="activites" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Statut des Paiements">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#F59E0B'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Modes de Paiement">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={paymentMethodData.filter(item => item.value > 0)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentMethodData.filter(item => item.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Revenus Mensuels">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}€`, 'Revenus']} />
              <Line type="monotone" dataKey="montant" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Détails des Paiements par Activité">
        <div className="space-y-4">
          {activites.map(activite => {
            const activitePaiements = paiements.filter(p => p.activiteId === activite.id);
            const totalPaid = activitePaiements.filter(p => p.statut === 'Payé').reduce((acc, p) => acc + p.montant, 0);
            const totalPending = activitePaiements.filter(p => p.statut === 'En attente').reduce((acc, p) => acc + p.montant, 0);
            
            return (
              <div key={activite.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">{activite.nom}</h4>
                  <span className="text-sm text-gray-600">{activitePaiements.length} paiement(s)</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Encaissé:</span>
                    <span className="ml-2 font-semibold text-green-600">{totalPaid}€</span>
                  </div>
                  <div>
                    <span className="text-gray-600">En attente:</span>
                    <span className="ml-2 font-semibold text-orange-600">{totalPending}€</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-semibold text-blue-600">{totalPaid + totalPending}€</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header avec onglets et export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'activities'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Activités
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'members'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Adhérents
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'payments'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Paiements
          </button>
        </div>
        
        <Button 
          onClick={exportToPDF} 
          icon={Download} 
          variant="secondary"
          disabled={isExporting}
        >
          {isExporting ? 'Export en cours...' : 'Exporter PDF'}
        </Button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'activities' && renderActivitiesTab()}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'payments' && renderPaymentsTab()}
    </div>
  );
}