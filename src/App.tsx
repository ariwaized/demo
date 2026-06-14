import React, { useState } from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Dashboard } from './components/Dashboard';
import { PortfolioView } from './components/Portfolio';
import { Tournaments } from './components/Tournaments';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LayoutDashboard, Briefcase, Trophy, Orbit, RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'portfolio' | 'tournaments'>('dashboard');
  const { resetMainPortfolio, userProfile, logout } = useTrading();

  const handleReset = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את התיק הווירטואלי לסכום התחלתי של $100,000?')) {
      resetMainPortfolio();
    }
  };

  if (!userProfile) {
    return <WelcomeScreen />;
  }

  return (
    <div className="app-container" style={{ direction: 'rtl' }}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: 'var(--shadow-md)'
          }} className="float-element">
            <Orbit size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: '800', lineHeight: '1.2' }}>
              סימולטור מסחר
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>שוק ההון דמו</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          <div
            className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <LayoutDashboard size={20} />
            <span>לוח בקרה</span>
          </div>

          <div
            className={`nav-link ${view === 'portfolio' ? 'active' : ''}`}
            onClick={() => setView('portfolio')}
          >
            <Briefcase size={20} />
            <span>תיק השקעות</span>
          </div>

          <div
            className={`nav-link ${view === 'tournaments' ? 'active' : ''}`}
            onClick={() => setView('tournaments')}
          >
            <Trophy size={20} />
            <span>תחרויות וטורנירים</span>
          </div>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px', marginBottom: '4px' }}>
            <div className="avatar-circle" style={{ background: userProfile.avatarColor, width: '32px', height: '32px', fontSize: '0.8rem' }}>
              {userProfile.username.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
              {userProfile.username}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={handleReset} style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem' }}>
            <RefreshCw size={14} />
            <span>איפוס תיק</span>
          </button>
          <button className="btn btn-secondary" onClick={logout} style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '0.85rem', color: '#f87171' }}>
            <span>התנתק</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-display)', fontWeight: '700' }}>
              {view === 'dashboard' && 'לוח בקרה פיננסי'}
              {view === 'portfolio' && 'תיק ההשקעות שלך'}
              {view === 'tournaments' && 'טורנירים ותחרויות'}
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {view === 'dashboard' && 'עקוב אחר המניות המובילות ובצע עסקאות בזמן אמת'}
              {view === 'portfolio' && 'ניתוח אחזקות, היסטוריית פעולות ושווי כולל'}
              {view === 'tournaments' && 'התחרה נגד בוטים מבוססי AI בזמן אמת'}
            </p>
          </div>
        </header>
        {/* Content Wrapper */}
        <div style={{ width: '100%', minHeight: '100%' }}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'portfolio' && <PortfolioView setView={setView} />}
          {view === 'tournaments' && <Tournaments setView={setView} />}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <TradingProvider>
      <MainLayout />
    </TradingProvider>
  );
}

export default App;
