import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { TradingChart } from './TradingChart';
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Award, Search, Activity } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    stocks,
    mainPortfolio,
    activeTournamentId,
    activeTournamentPortfolio,
    tournaments,
    leaderboard,
    selectedStockSymbol,
    buyStock,
    sellStock,
    setSelectedStockSymbol,
    leaveTournament,
    searchAndAddStock,
    activityLogs
  } = useTrading();

  const [tradeQuantity, setTradeQuantity] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const portfolio = activeTournamentId ? activeTournamentPortfolio! : mainPortfolio;
  const selectedStock = stocks.find(s => s.symbol === selectedStockSymbol) || stocks[0];
  const tournament = tournaments.find(t => t.id === activeTournamentId);

  const handleBuy = () => {
    if (tradeQuantity <= 0) return;
    buyStock(selectedStock.symbol, tradeQuantity);
  };

  const handleSell = () => {
    if (tradeQuantity <= 0) return;
    sellStock(selectedStock.symbol, tradeQuantity);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    setSearchLoading(true);
    const success = await searchAndAddStock(trimmed);
    setSearchLoading(false);

    if (success) {
      setSearchQuery('');
    } else {
      alert(`לא נמצאו נתוני מסחר עבור הסימול "${trimmed.toUpperCase()}". אנא ודא שהסימול נכון ותואם ל-Yahoo Finance (למשל: GOOG, META, BTC-USD, SPY).`);
    }
  };

  // Calculate current user holdings of selected stock
  const currentHolding = portfolio.holdings[selectedStock.symbol];
  const userRank = leaderboard.find(entry => entry.isUser)?.rank || 1;

  const totalValueChange = portfolio.totalValue - portfolio.initialValue;
  const totalValueChangePercent = (totalValueChange / portfolio.initialValue) * 100;
  const isProfit = totalValueChange >= 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Active Tournament Bar */}
      {activeTournamentId && tournament && (
        <div className="glass-panel" style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }} id="tournament-alert-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="avatar-circle" style={{ background: 'var(--accent-purple)' }}>
              <Award size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>טורניר פעיל: {tournament.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>הבוטים מתחרים נגדך בזמן אמת! הדירוג הנוכחי שלך: <strong>מקום #{userRank}</strong></p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>זמן נותר לתחרות</span>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: '700',
                color: tournament.timeRemaining < 30 ? 'var(--trend-down)' : 'var(--accent-cyan)'
              }}>
                {formatTime(tournament.timeRemaining)}
              </span>
            </div>
            <button className="btn btn-secondary" onClick={leaveTournament} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              צא מהטורניר
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Search Bar */}
      <form onSubmit={handleSearchSubmit} style={{ 
        display: 'flex', 
        gap: '12px', 
        width: '100%', 
        maxWidth: '750px', 
        margin: '0 auto 8px auto', 
        position: 'relative' 
      }}>
        <div style={{ position: 'relative', flexGrow: 1 }}>
          <input
            type="text"
            className="form-input"
            placeholder="חפש והוסף מניות למעקב בזמן אמת (למשל: GOOG, META, NFLX, BTC-USD, SPY, QQQ)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={searchLoading}
            style={{ 
              height: '48px', 
              borderRadius: '24px', 
              paddingRight: '44px', 
              paddingLeft: '20px', 
              textAlign: 'right',
              fontSize: '0.95rem'
            }}
          />
          <Search size={18} style={{ 
            position: 'absolute', 
            top: '15px', 
            right: '18px', 
            color: 'var(--text-muted)' 
          }} />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={searchLoading}
          style={{ 
            height: '48px', 
            borderRadius: '24px', 
            padding: '0 28px', 
            fontSize: '0.9rem',
            minWidth: '130px'
          }}
        >
          {searchLoading ? 'מחפש שער...' : 'חפש והוסף'}
        </button>
      </form>

      {/* Stock Ticker Bar */}
      <div className="ticker-bar">
        {stocks.map(stock => {
          const isStockUp = stock.price >= stock.previousPrice;
          const isSelected = stock.symbol === selectedStockSymbol;
          return (
            <div
              key={stock.symbol}
              className={`glass-panel ticker-card ${isSelected ? 'active-ticker' : ''}`}
              onClick={() => setSelectedStockSymbol(stock.symbol)}
              style={{
                borderColor: isSelected ? 'var(--accent-purple)' : 'var(--glass-border)',
                background: isSelected ? 'rgba(139, 92, 246, 0.05)' : 'var(--glass-bg)'
              }}
              id={`ticker-card-${stock.symbol}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="ticker-symbol">{stock.symbol}</span>
                <span className={`pulse-indicator ${isStockUp ? 'up' : 'down'}`}></span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {stock.name}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontWeight: '600' }}>${stock.price.toFixed(2)}</span>
                <span className={`ticker-change ${stock.change24h >= 0 ? 'trend-up-text' : 'trend-down-text'}`}>
                  {stock.change24h >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {stock.change24h >= 0 ? '+' : ''}{stock.change24h}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }} id="stats-total-val">
          <div className="avatar-circle" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
            <Briefcase size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>שווי תיק השקעות</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              ${portfolio.totalValue.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }} id="stats-cash-bal">
          <div className="avatar-circle" style={{ background: 'var(--accent-cyan-glow)', color: 'var(--accent-cyan)' }}>
            <DollarSign size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>יתרת מזומן וירטואלי</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'var(--font-display)' }}>
              ${portfolio.cashBalance.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }} id="stats-pl-perf">
          <div className="avatar-circle" style={{
            background: isProfit ? 'var(--trend-up-glow)' : 'var(--trend-down-glow)',
            color: isProfit ? 'var(--trend-up)' : 'var(--trend-down)'
          }}>
            {isProfit ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>תשואה מצטברת</span>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: '700',
              fontFamily: 'var(--font-display)',
              color: isProfit ? 'var(--trend-up)' : 'var(--trend-down)'
            }}>
              {isProfit ? '+' : ''}{totalValueChangePercent.toFixed(2)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Main Trading Area */}
      <div className="dashboard-grid">
        {/* Left Side - Chart */}
        <TradingChart stock={selectedStock} />

        {/* Right Side - Trading Form */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }} id="order-placement-panel">
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>ביצוע עסקאות וירטואליות</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>מסחר בזמן אמת בנכס {selectedStock.symbol}</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px 16px', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-secondary)' }}>
              <span>מחיר ביצוע מוערך:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>${selectedStock.price.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>בבעלותך כעת:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                {currentHolding ? `${currentHolding.quantity} מניות` : '0 מניות'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>כמות מניות לקנייה/מכירה</label>
            <input
              type="number"
              min="0.01"
              step="any"
              className="form-input"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(Math.max(0.01, parseFloat(e.target.value) || 0))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setTradeQuantity(1)} style={{ flex: 1, padding: '8px' }}>1</button>
            <button className="btn btn-secondary" onClick={() => setTradeQuantity(5)} style={{ flex: 1, padding: '8px' }}>5</button>
            <button className="btn btn-secondary" onClick={() => setTradeQuantity(10)} style={{ flex: 1, padding: '8px' }}>10</button>
            <button className="btn btn-secondary" onClick={() => {
              // Set to max buy quantity based on cash balance
              const maxBuy = Math.floor((portfolio.cashBalance / selectedStock.price) * 100) / 100;
              setTradeQuantity(Math.max(0.01, maxBuy));
            }} style={{ flex: 2, padding: '8px' }}>מקסימום קנייה</button>
          </div>

          <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>עלות עסקה כוללת</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: '700' }}>
                ${(selectedStock.price * tradeQuantity).toLocaleString('he-IL', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-success" onClick={handleBuy} style={{ flex: 1, height: '48px' }}>
              קניית דמו
            </button>
            <button className="btn btn-danger" onClick={handleSell} style={{ flex: 1, height: '48px' }}>
              מכירת דמו
            </button>
          </div>
        </div>
      </div>

      {/* Real-time AI Activity Feed */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} id="live-activity-feed-panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={20} className="trend-up-text" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>פיד פעילות ועסקאות AI בזמן אמת (הוכחת ביצועים)</h3>
        </div>
        
        <div style={{
          maxHeight: '180px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'rgba(0,0,0,0.15)',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid var(--glass-border)',
          fontFamily: 'monospace',
          fontSize: '0.85rem'
        }}>
          {activityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              ממתין לפעולות מסחר ראשונות של הסוכנים...
            </div>
          ) : (
            activityLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.01)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>[{log.timestamp}]</span>
                <span style={{
                  color: log.badgeColor === 'var(--trend-up)' ? 'var(--trend-up)' : log.badgeColor === 'var(--trend-down)' ? 'var(--trend-down)' : 'var(--text-primary)'
                }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
