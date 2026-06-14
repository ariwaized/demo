import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { History, TrendingUp, TrendingDown, Cpu } from 'lucide-react';
import type { AIStrategy } from '../types';

interface PortfolioProps {
  setView: (view: 'dashboard' | 'portfolio' | 'tournaments') => void;
}

export const PortfolioView: React.FC<PortfolioProps> = ({ setView }) => {
  const {
    mainPortfolio,
    activeTournamentId,
    activeTournamentPortfolio,
    stocks,
    setSelectedStockSymbol,
    aiDelegation,
    delegateToAI,
    stopAIDelegation
  } = useTrading();

  const [delegateAmount, setDelegateAmount] = useState<number>(5000);
  const [selectedStrategy, setSelectedStrategy] = useState<AIStrategy>('MOMENTUM');

  const portfolio = activeTournamentId ? activeTournamentPortfolio! : mainPortfolio;
  const holdingsList = Object.values(portfolio.holdings);

  // Helper to get stock details
  const getStock = (symbol: string) => stocks.find(s => s.symbol === symbol);

  const totalHoldingsValue = holdingsList.reduce((acc, holding) => {
    const stock = getStock(holding.symbol);
    return acc + (stock ? stock.price * holding.quantity : 0);
  }, 0);

  const cashPercent = portfolio.totalValue > 0 ? (portfolio.cashBalance / portfolio.totalValue) * 100 : 100;
  const assetsPercent = portfolio.totalValue > 0 ? (totalHoldingsValue / portfolio.totalValue) * 100 : 0;
  
  // Calculate delegation values
  const isDelegationActive = aiDelegation && aiDelegation.active && !activeTournamentId;
  const delegationProfit = isDelegationActive ? aiDelegation.totalValue - aiDelegation.initialValue : 0;
  const delegationProfitPercent = isDelegationActive ? (delegationProfit / aiDelegation.initialValue) * 100 : 0;

  const handleStartDelegation = (e: React.FormEvent) => {
    e.preventDefault();
    if (delegateAmount <= 100) {
      alert('הסכום המינימלי להקצאת AI הוא $100');
      return;
    }
    if (portfolio.cashBalance < delegateAmount) {
      alert('אין מספיק מזומן פנוי בחשבון לביצוע ההקצאה!');
      return;
    }
    delegateToAI(selectedStrategy, delegateAmount);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Allocation breakdown */}
      <div className="glass-panel" style={{ padding: '24px' }} id="portfolio-allocation-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>חלוקת נכסים (Asset Allocation)</h3>
        
        <div style={{ height: '20px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden', display: 'flex', marginBottom: '16px' }}>
          {assetsPercent > 0 && (
            <div style={{
              width: `${assetsPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-purple) 0%, #7c3aed 100%)',
              transition: 'width 0.5s ease'
            }} title={`מניות: ${assetsPercent.toFixed(1)}%`}></div>
          )}
          {cashPercent > 0 && (
            <div style={{
              width: `${cashPercent}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan) 0%, #06b6d4 100%)',
              transition: 'width 0.5s ease'
            }} title={`מזומן: ${cashPercent.toFixed(1)}%`}></div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '24px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-purple)', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>מניות ואחזקות:</span>
            <span style={{ fontWeight: '600' }}>${totalHoldingsValue.toLocaleString('he-IL', { minimumFractionDigits: 2 })} ({assetsPercent.toFixed(1)}%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>מזומן פנוי:</span>
            <span style={{ fontWeight: '600' }}>${portfolio.cashBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })} ({cashPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* AI Asset Management Delegation Section (Standard Mode Only) */}
      {!activeTournamentId && (
        <div className="glass-panel" style={{
          padding: '24px',
          background: isDelegationActive 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.02) 100%)'
            : 'var(--glass-bg)',
          borderColor: isDelegationActive ? 'rgba(139, 92, 246, 0.3)' : 'var(--glass-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Cpu size={22} style={{ color: 'var(--accent-purple)' }} />
            <h3 style={{ fontSize: '1.2rem' }}>ניהול תיק אקטיבי ע"י סוכן AI (Copy-Trading)</h3>
          </div>

          {isDelegationActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>סוכן AI מנהל</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--accent-purple)', marginTop: '2px' }}>
                    אסטרטגיית {aiDelegation.strategy}
                  </h4>
                </div>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>סכום שהוקצה במקור</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                    ${aiDelegation.initialValue.toLocaleString()}
                  </h4>
                </div>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>שווי נוכחי מנוהל</span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', fontFamily: 'var(--font-display)', marginTop: '2px' }}>
                    ${aiDelegation.totalValue.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>רווח/הפסד מצטבר (P&L)</span>
                  <h4 style={{
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    fontFamily: 'var(--font-display)',
                    marginTop: '2px',
                    color: delegationProfit >= 0 ? 'var(--trend-up)' : 'var(--trend-down)'
                  }}>
                    {delegationProfit >= 0 ? '+' : ''}${delegationProfit.toFixed(2)} ({delegationProfit >= 0 ? '+' : ''}{delegationProfitPercent.toFixed(2)}%)
                  </h4>
                </div>
              </div>

              {/* Delegated stock holdings list */}
              {Object.keys(aiDelegation.holdings).length > 0 && (
                <div style={{
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.1)'
                }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>אחזקות שהבוט רכש עבורך:</h5>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {Object.values(aiDelegation.holdings).map(hold => (
                      <div key={hold.symbol} style={{
                        background: 'var(--bg-tertiary)',
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.8rem',
                        display: 'flex',
                        gap: '6px'
                      }}>
                        <strong style={{ color: 'var(--accent-cyan)' }}>{hold.symbol}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{hold.quantity} יח'</span>
                        <span style={{ color: 'var(--text-muted)' }}>(${hold.averageBuyPrice.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  * הסוכן קונה ומוכר מניות באופן עצמאי בהתבסס על ניתוח השוק בזמן אמת.
                </p>
                <button className="btn btn-danger" onClick={stopAIDelegation} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                  בטל ניהול AI ומשוך כספים
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleStartDelegation} style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              alignItems: 'flex-end',
              background: 'rgba(255,255,255,0.01)',
              padding: '16px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--glass-border)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '180px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>בחר אסטרטגיית AI</label>
                <select
                  className="form-input"
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value as AIStrategy)}
                  style={{ height: '40px', padding: '0 12px', background: 'var(--bg-tertiary)' }}
                >
                  <option value="MOMENTUM">בוט מומנטום (רוכב על עליות)</option>
                  <option value="VALUE">בוט ערך (קונה מניות בשפל היסטורי)</option>
                  <option value="REVERSION">בוט מסחר יומי (תיקונים מהירים)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '180px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>סכום להקצאה ($)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  className="form-input"
                  value={delegateAmount}
                  onChange={(e) => setDelegateAmount(Math.max(100, parseInt(e.target.value) || 0))}
                  style={{ height: '40px', padding: '0 12px', textAlign: 'right' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '40px', padding: '0 24px', fontSize: '0.9rem' }}>
                הפעל ניהול תיק AI
              </button>
            </form>
          )}
        </div>
      )}

      {/* Holdings list */}
      <div className="glass-panel" style={{ padding: '24px' }} id="portfolio-holdings-card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>נכסים בבעלות ידנית (Current Holdings)</h3>
        
        {holdingsList.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            אין ברשותך מניות כרגע. גש ללוח הבקרה כדי לבצע עסקה ראשונה!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>נכס</th>
                  <th style={{ padding: '12px 8px' }}>כמות</th>
                  <th style={{ padding: '12px 8px' }}>שער קנייה ממוצע</th>
                  <th style={{ padding: '12px 8px' }}>שער נוכחי</th>
                  <th style={{ padding: '12px 8px' }}>שווי שוק כולל</th>
                  <th style={{ padding: '12px 8px' }}>רווח / הפסד (P&L)</th>
                  <th style={{ padding: '12px 8px', textAlign: 'left' }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {holdingsList.map(holding => {
                  const stock = getStock(holding.symbol);
                  if (!stock) return null;

                  const currentVal = stock.price * holding.quantity;
                  const totalCost = holding.averageBuyPrice * holding.quantity;
                  const profitLoss = currentVal - totalCost;
                  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
                  const isUp = profitLoss >= 0;

                  return (
                    <tr key={holding.symbol} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '700', fontFamily: 'var(--font-display)' }}>{holding.symbol}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{stock.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-display)' }}>{holding.quantity}</td>
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-display)' }}>${holding.averageBuyPrice.toFixed(2)}</td>
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-display)' }}>${stock.price.toFixed(2)}</td>
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-display)' }}>${currentVal.toFixed(2)}</td>
                      <td style={{ padding: '16px 8px', fontFamily: 'var(--font-display)' }} className={isUp ? 'trend-up-text' : 'trend-down-text'}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span>${profitLoss.toFixed(2)} ({isUp ? '+' : ''}{profitLossPercent.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'left' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => {
                          setSelectedStockSymbol(holding.symbol);
                          setView('dashboard');
                        }}>
                          סחר בנכס
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="glass-panel" style={{ padding: '24px' }} id="portfolio-history-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <History size={20} className="trend-up-text" />
          <h3 style={{ fontSize: '1.2rem' }}>היסטוריית עסקאות (Transaction Logs)</h3>
        </div>

        {portfolio.transactions.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            אין עסקאות רשומות בהיסטוריה.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>סוג עסקה</th>
                  <th style={{ padding: '12px 8px' }}>נכס</th>
                  <th style={{ padding: '12px 8px' }}>כמות</th>
                  <th style={{ padding: '12px 8px' }}>מחיר ביצוע</th>
                  <th style={{ padding: '12px 8px' }}>סכום עסקה כולל</th>
                  <th style={{ padding: '12px 8px' }}>זמן</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ padding: '12px 8px' }}>
                      <span className={`badge ${tx.type === 'BUY' ? 'badge-purple' : 'badge-cyan'}`}>
                        {tx.type === 'BUY' ? 'קנייה' : 'מכירה'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: '700', fontFamily: 'var(--font-display)' }}>{tx.symbol}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'var(--font-display)' }}>{tx.quantity}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'var(--font-display)' }}>${tx.price.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', fontFamily: 'var(--font-display)' }}>${tx.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{tx.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
