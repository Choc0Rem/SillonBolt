import React, { memo } from 'react';
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

// Composant MenuItem optimisé avec memo
const MenuItem = memo(({ item, isActive, onClick }: {
  item: typeof menuItems[0];
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = item.icon;
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-6 py-3 text-left transition-all duration-200 transform hover:scale-105 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-r-4 border-blue-600 text-blue-600 shadow-sm' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
      }`}
    >
      <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? item.color : ''}`} />
      <span className="font-medium">{item.label}</span>
    </button>
  );
});

MenuItem.displayName = 'MenuItem';

// Composant Header optimisé
const Header = memo(({ currentPage }: { currentPage: string }) => {
  const currentItem = menuItems.find(item => item.id === currentPage);
  
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentItem && (
            <>
              <currentItem.icon className={`w-6 h-6 ${currentItem.color}`} />
              <h2 className="text-xl font-semibold text-gray-800">
                {currentItem.label}
              </h2>
            </>
          )}
        </div>
        
        {/* Indicateur de statut */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">En ligne</span>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

// Composant Sidebar optimisé
const Sidebar = memo(({ currentPage, onPageChange }: {
  currentPage: string;
  onPageChange: (page: string) => void;
}) => (
  <div className="w-64 bg-white shadow-xl border-r border-gray-200">
    {/* Logo et titre */}
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
          <img 
            src="/images.jpg" 
            alt="Le Sillon Boulange" 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div 
            className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-inner"
            style={{ display: 'none' }}
          >
            LS
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-white truncate">
            Le Sillon
          </h1>
          <p className="text-xs text-blue-100 truncate">Boulange</p>
        </div>
      </div>
    </div>
    
    {/* Navigation */}
    <nav className="mt-6 space-y-1">
      {menuItems.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          isActive={currentPage === item.id}
          onClick={() => onPageChange(item.id)}
        />
      ))}
    </nav>
    
    {/* Footer de la sidebar */}
    <div className="absolute bottom-4 left-4 right-4">
      <div className="text-xs text-gray-400 text-center">
        <p>Version 3.0 Ultra-Optimisée</p>
        <p className="text-green-500">⚡ Performance Max</p>
      </div>
    </div>
  </div>
));

Sidebar.displayName = 'Sidebar';

// Composant Layout principal optimisé
const Layout = memo(({ children, currentPage, onPageChange }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        
        <main className="flex-1 overflow-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;