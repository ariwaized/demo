import React from 'react';
import { useTrading } from '../context/TradingContext';
import { Award, ShieldAlert, Cpu, Trophy, Clock } from 'lucide-react';

interface TournamentsProps {
  setView: (view: 'dashboard' | 'portfolio' | 'tournaments') => void;
}

export const Tournaments: React.FC<TournamentsProps> = ({ setView }) => {
  const {
    tournaments,
    activeTournamentId,
    leaderboard,
    stocks,
    selectedAgentIdForModal,
    setSelectedAgentIdForModal,
    joinTournament,
    leaveTournament
  } = useTrading();

  const activeTournament = tournaments.find(t => t.id === activeTournamentId);
  const selectedAgent = activeTournament?.agents.find(a => a.id === selectedAgentIdForModal);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* If a tournament is currently active, show leaderboard and stats */}
      {activeTournamentId && activeTournament ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          
          {/* Leaderboard panel */}
          <div className="glass-panel" style={{ padding: '24px' }} id="tournament-leaderboard-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Trophy size={24} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ fontSize: '1.3rem' }}>לוח מובילים בזמן אמת (לחץ על בוט לצפייה בתיק שלו)</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Clock size={16} />
                <span>זמן לסיום: <strong>{formatTime(activeTournament.timeRemaining)}</strong></span>
              </div>
            </div>

            {leaderboard.map((entry) => {
              const profitLoss = entry.changePercent;
              const isUp = profitLoss >= 0;
              const rankColor = entry.rank === 1 ? '#F59E0B' : entry.rank === 2 ? '#94A3B8' : entry.rank === 3 ? '#B45309' : 'var(--text-muted)';
              
              return (
                <div 
                  key={entry.id} 
                  className={`leaderboard-row ${entry.isUser ? 'user-row' : ''}`}
                  style={{ cursor: entry.isUser ? 'default' : 'pointer' }}
                  onClick={() => {
                    if (!entry.isUser) {
                      setSelectedAgentIdForModal(entry.id);
                    }
                  }}
                >
                  <div className="leaderboard-name-box">
                    <span className="leaderboard-rank" style={{ color: rankColor }}>
                      {entry.rank}
                    </span>
                    <div className="avatar-circle" style={{ background: entry.avatarColor, fontSize: '0.9rem' }}>
                      {entry.isUser ? entry.name.slice(0, 2).toUpperCase() : entry.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span style={{ fontWeight: entry.isUser ? '700' : '500', display: 'block' }}>
                        {entry.name}
                        {entry.isUser && <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', marginRight: '6px' }}>(אתה)</span>}
                      </span>
                      {!entry.isUser && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          בוט AI • לחץ לצפייה בתיק ועסקאות
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: '700', fontFamily: 'var(--font-display)', display: 'block' }}>
                      ${entry.totalValue.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={isUp ? 'trend-up-text' : 'trend-down-text'} style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                      {isUp ? '+' : ''}{profitLoss.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}

            {activeTournament.timeRemaining === 0 && (
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--border-radius-sm)',
                textAlign: 'center'
              }}>
                <ShieldAlert size={20} style={{ color: 'var(--trend-down)', margin: '0 auto 8px auto' }} />
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>הטורניר הסתיים!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {leaderboard[0]?.isUser ? 'ברכות! הגעת למקום הראשון והבסת את הבוטים הפיננסיים!' : `הבוט ${leaderboard[0]?.name} ניצח את הטורניר בתשואה של ${leaderboard[0]?.changePercent}%`}
                </p>
                <button className="btn btn-secondary" onClick={leaveTournament}>
                  סגור טורניר
                </button>
              </div>
            )}
            
            {activeTournament.timeRemaining > 0 && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={() => setView('dashboard')} style={{ flex: 1 }}>
                  עבור למסך מסחר בטורניר
                </button>
                <button className="btn btn-secondary" onClick={leaveTournament}>
                  פרוש מהטורניר
                </button>
              </div>
            )}
          </div>

          {/* AI competitors guide */}
          <div className="glass-panel" style={{ padding: '24px' }} id="tournament-competitors-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={20} className="trend-up-text" />
              מתחרים מבוססי AI בחדר
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeTournament.agents.map(agent => (
                <div key={agent.id} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: agent.avatarColor }}></span>
                    <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>{agent.name}</h4>
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{agent.strategy}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {agent.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>שווי תיק: ${agent.totalValue.toLocaleString()}</span>
                    <span>פעולות מסחר: {agent.tradesCount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* List of available tournaments */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>טורנירים ותחרויות מסחר</h2>
            <p style={{ color: 'var(--text-secondary)' }}>הירשם לתחרות מסחר מהירה בזמן אמת נגד סוכנים ממוחשבים. מי שמשיג את התשואה הגבוהה ביותר מנצח!</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {tournaments.map(t => (
              <div 
                key={t.id} 
                className="glass-panel" 
                style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                id={`tournament-card-${t.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="avatar-circle" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
                    <Award size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{t.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>טורניר סימולציה</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', flexGrow: 1 }}>
                  {t.description}
                </p>

                <div style={{
                  borderTop: '1px solid var(--glass-border)',
                  borderBottom: '1px solid var(--glass-border)',
                  padding: '12px 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>יתרת התחלה: <strong style={{ color: 'var(--text-primary)' }}>${t.startingCash.toLocaleString()}</strong></div>
                  <div>אורך הסימולציה: <strong style={{ color: 'var(--text-primary)' }}>{t.durationSeconds} שניות</strong></div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '44px' }}
                  onClick={() => {
                    joinTournament(t.id);
                    setView('dashboard');
                  }}
                >
                  הצטרף לתחרות
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor Details Modal Overlay */}
      {selectedAgentIdForModal && selectedAgent && (
        <div className="modal-overlay" onClick={() => setSelectedAgentIdForModal(null)} style={{ direction: 'rtl' }}>
          <div className="modal-content glass-panel" style={{
            maxWidth: '550px',
            background: 'var(--bg-secondary)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '24px',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="avatar-circle" style={{ background: selectedAgent.avatarColor }}>
                  {selectedAgent.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedAgent.name}</h3>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem', marginTop: '2px' }}>אסטרטגיה: {selectedAgent.strategy}</span>
                </div>
              </div>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setSelectedAgentIdForModal(null)}>סגור</button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
              {selectedAgent.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>שווי תיק כולל</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  ${selectedAgent.totalValue.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </h4>
              </div>
              <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>יתרת מזומן</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                  ${selectedAgent.cashBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                </h4>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>אחזקות נוכחיות של הבוט</h4>
            {Object.values(selectedAgent.holdings).length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', textAlign: 'center', padding: '12px', border: '1px dashed var(--glass-border)', borderRadius: 'var(--border-radius-sm)' }}>
                הבוט מחזיק ב-100% מזומן ואין לו אחזקות מניות כרגע.
              </p>
            ) : (
              <div style={{ maxHeight: '130px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '6px 8px' }}>נכס</th>
                      <th style={{ padding: '6px 8px' }}>כמות</th>
                      <th style={{ padding: '6px 8px' }}>מחיר קנייה ממוצע</th>
                      <th style={{ padding: '6px 8px' }}>שווי נוכחי</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(selectedAgent.holdings).map(holding => {
                      const stock = stocks.find(s => s.symbol === holding.symbol);
                      const currentVal = stock ? stock.price * holding.quantity : 0;
                      return (
                        <tr key={holding.symbol} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                          <td style={{ padding: '6px 8px', fontWeight: '700' }}>{holding.symbol}</td>
                          <td style={{ padding: '6px 8px' }}>{holding.quantity}</td>
                          <td style={{ padding: '6px 8px' }}>${holding.averageBuyPrice.toFixed(2)}</td>
                          <td style={{ padding: '6px 8px' }}>${currentVal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px' }}>היסטוריית עסקאות בטורניר</h4>
            {selectedAgent.transactions.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', border: '1px dashed var(--glass-border)', borderRadius: 'var(--border-radius-sm)' }}>
                הבוט לא ביצע עסקאות מסחר עדיין בטורניר זה.
              </p>
            ) : (
              <div style={{ maxHeight: '130px', overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '6px 8px' }}>סוג</th>
                      <th style={{ padding: '6px 8px' }}>נכס</th>
                      <th style={{ padding: '6px 8px' }}>כמות</th>
                      <th style={{ padding: '6px 8px' }}>מחיר ביצוע</th>
                      <th style={{ padding: '6px 8px' }}>זמן</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAgent.transactions.map((tx, idx) => (
                      <tr key={`${tx.id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <span className={`badge ${tx.type === 'BUY' ? 'badge-purple' : 'badge-cyan'}`} style={{ padding: '1px 5px', fontSize: '0.65rem' }}>
                            {tx.type === 'BUY' ? 'קנייה' : 'מכירה'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: '700' }}>{tx.symbol}</td>
                        <td style={{ padding: '6px 8px' }}>{tx.quantity}</td>
                        <td style={{ padding: '6px 8px' }}>${tx.price.toFixed(2)}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--text-muted)' }}>{tx.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
