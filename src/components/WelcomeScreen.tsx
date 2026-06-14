import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { Orbit, ArrowLeft } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const { login } = useTrading();
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'radial-gradient(circle at center, #13131e 0%, #060609 100%)',
      direction: 'rtl'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '450px',
        width: '100%',
        padding: '36px',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        textAlign: 'center'
      }}>
        {/* Floating animated logo */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)',
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: 'var(--shadow-md)'
        }} className="float-element">
          <Orbit size={36} />
        </div>

        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '8px' }}>
            סימולטור השקעות בזמן אמת
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            התחרה בטורנירים מול סוכני AI מתקדמים, בצע עסקאות וירטואליות בזמן אמת ועקוב אחר מדדי שוק ההון (מחובר לנתוני Yahoo Finance).
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'right' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>שם משתמש למסחר</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="הכנס שם משתמש (למשל: סוחר_על)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ textAlign: 'right' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', gap: '8px' }}>
            <span>הכנס למערכת המסחר</span>
            <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </form>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', width: '100%' }}>
          המערכת עושה שימוש במנוע סימולציה מבוסס הליכת אקראי (Brownian) המסתנכרן בזמן אמת עם השערים הרשמיים של Yahoo Finance EOD.
        </div>
      </div>
    </div>
  );
};
