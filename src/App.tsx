import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { CourtView } from './components/CourtView';
import { QueueView } from './components/QueueView';
import { PresenceView } from './components/PresenceView';
import { ReportsView } from './components/ReportsView';
import { RulesView } from './components/RulesView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 pb-24 md:pb-8">
      <Navigation />
      {activeTab === 'court' && <CourtView />}
      {activeTab === 'queue' && <QueueView />}
      {activeTab === 'presence' && <PresenceView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'rules' && <RulesView />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
        <Header />
        <div className="flex-1">
          <MainContent />
        </div>
      </div>
    </AppProvider>
  );
};

export default App;
