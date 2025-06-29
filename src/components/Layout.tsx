import React from 'react';
import { 
  Home, 
  Activity, 
  Users, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: Home, color: 'text-blue-600' },
  { id: 'calendar', label: 'Agenda', icon: Calendar, color: 'text-indigo-600' },
  { id: 'tasks', label: 'Tâches', icon: CheckSquare, color: 'text-pink-600' },
  { id: 'members', label: 'Adhérents', icon: Users, color: 'text-purple-600' },
  { id: 'activities', label: 'Activités', icon: Activity, color: 'text-green-600' },
  { id: 'payments', label: 'Paiements', icon: CreditCard, color: 'text-orange-600' },
  { id: 'statistics', label: 'Statistiques', icon: BarChart3, color: 'text-red-600' },
  { id: 'settings', label: 'Paramètres', icon: Settings, color: 'text-gray-600' }
];

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img 
                src="/images.jpg" 
                alt="Le Sillon Boulange" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Le Sillon
              </h1>
              <p className="text-xs text-gray-500">Boulange</p>
            </div>
          </div>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                  isActive 
                    ? 'bg-blue-50 border-r-4 border-blue-600 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? item.color : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {menuItems.find(item => item.id === currentPage)?.label}
            </h2>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}