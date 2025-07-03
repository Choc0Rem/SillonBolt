import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Members from './pages/Members';
import Calendar from './pages/Calendar';
import Activities from './pages/Activities';
import Statistics from './pages/Statistics';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import { loadData, saveData } from './utils/database';
import type { AppData, PageType } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [data, setData] = useState<AppData>({
    tasks: [],
    members: [],
    activities: [],
    payments: [],
    settings: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const loadedData = await loadData();
        setData(loadedData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const updateData = async (newData: Partial<AppData>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    try {
      await saveData(updatedData);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const renderCurrentPage = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={data} updateData={updateData} />;
      case 'tasks':
        return <Tasks tasks={data.tasks} updateTasks={(tasks) => updateData({ tasks })} />;
      case 'members':
        return <Members members={data.members} updateMembers={(members) => updateData({ members })} />;
      case 'calendar':
        return <Calendar tasks={data.tasks} activities={data.activities} />;
      case 'activities':
        return <Activities activities={data.activities} updateActivities={(activities) => updateData({ activities })} />;
      case 'statistics':
        return <Statistics data={data} />;
      case 'payments':
        return <Payments payments={data.payments} updatePayments={(payments) => updateData({ payments })} />;
      case 'settings':
        return <Settings settings={data.settings} updateSettings={(settings) => updateData({ settings })} />;
      default:
        return <Dashboard data={data} updateData={updateData} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderCurrentPage()}
    </Layout>
  );
}

export default App;