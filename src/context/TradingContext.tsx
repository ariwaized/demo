import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Stock, Portfolio, Holding, Transaction, Tournament, LeaderboardEntry, UserProfile } from '../types';
import { INITIAL_STOCKS, updateStockPrices, fetchRealStockData } from '../utils/stockEngine';
import { INITIAL_AGENTS, runAIAgentTrades } from '../utils/aiAgents';

interface TradingContextType {
  stocks: Stock[];
  mainPortfolio: Portfolio;
  tournaments: Tournament[];
  activeTournamentId: string | null;
  activeTournamentPortfolio: Portfolio | null;
  leaderboard: LeaderboardEntry[];
  selectedStockSymbol: string;
  userProfile: UserProfile | null;
  selectedAgentIdForModal: string | null;
  setSelectedAgentIdForModal: (id: string | null) => void;
  login: (username: string) => void;
  logout: () => void;
  buyStock: (symbol: string, quantity: number) => void;
  sellStock: (symbol: string, quantity: number) => void;
  joinTournament: (id: string) => void;
  leaveTournament: () => void;
  setSelectedStockSymbol: (symbol: string) => void;
  resetMainPortfolio: () => void;
  searchAndAddStock: (symbol: string) => Promise<boolean>;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const INITIAL_PORTFOLIO: Portfolio = {
  cashBalance: 100000,
  holdings: {},
  transactions: [],
  totalValue: 100000,
  initialValue: 100000,
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS);
  const [mainPortfolio, setMainPortfolio] = useState<Portfolio>(() => {
    const saved = localStorage.getItem('main_portfolio');
    return saved ? JSON.parse(saved) : INITIAL_PORTFOLIO;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [selectedAgentIdForModal, setSelectedAgentIdForModal] = useState<string | null>(null);

  const [tournaments, setTournaments] = useState<Tournament[]>([
    {
      id: 'tour_wallstreet',
      name: 'גביע וול סטריט (Wall Street Cup)',
      description: 'תחרות מהירה נגד בוטים פיננסיים על מניות הטכנולוגיה המובילות. זמן קצר ותנודתיות גבוהה.',
      durationSeconds: 180,
      timeRemaining: 180,
      active: false,
      startingCash: 100000,
      userRegistered: false,
      agents: INITIAL_AGENTS.map(agent => ({ ...agent, cashBalance: 100000, totalValue: 100000, holdings: {}, tradesCount: 0, transactions: [] })),
    },
    {
      id: 'tour_hypergrowth',
      name: 'קרב מניות הצמיחה (Growth Stock Battle)',
      description: 'ליגת מומנטום מהירה מבוססת מניות תנודתיות כמו TSLA ו-NVDA. מתאים לסוחרים אגרסיביים.',
      durationSeconds: 120,
      timeRemaining: 120,
      active: false,
      startingCash: 50000,
      userRegistered: false,
      agents: INITIAL_AGENTS.map(agent => ({ ...agent, cashBalance: 50000, totalValue: 50000, holdings: {}, tradesCount: 0, transactions: [] })),
    }
  ]);

  const [activeTournamentId, setActiveTournamentId] = useState<string | null>(null);
  const [tournamentPortfolios, setTournamentPortfolios] = useState<{ [id: string]: Portfolio }>({});
  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string>('NVDA');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  // Using refs to prevent stale closures in interval
  const stocksRef = useRef(stocks);
  const activeTournamentIdRef = useRef(activeTournamentId);
  const tournamentsRef = useRef(tournaments);
  const tournamentPortfoliosRef = useRef(tournamentPortfolios);

  useEffect(() => {
    stocksRef.current = stocks;
  }, [stocks]);

  useEffect(() => {
    activeTournamentIdRef.current = activeTournamentId;
  }, [activeTournamentId]);

  useEffect(() => {
    tournamentsRef.current = tournaments;
  }, [tournaments]);

  useEffect(() => {
    tournamentPortfoliosRef.current = tournamentPortfolios;
  }, [tournamentPortfolios]);

  // Save main portfolio to localStorage
  useEffect(() => {
    localStorage.setItem('main_portfolio', JSON.stringify(mainPortfolio));
  }, [mainPortfolio]);

  // Sync with Yahoo Finance Real-time API on mount and every 30 seconds
  useEffect(() => {
    const syncRealMarketPrices = async () => {
      console.log('Syncing baseline prices with Yahoo Finance...');
      const symbols = stocksRef.current.map(s => s.symbol);
      const updatedList = [...stocksRef.current];
      
      let changed = false;
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const realData = await fetchRealStockData(symbol);
        
        if (realData) {
          const idx = updatedList.findIndex(s => s.symbol === symbol);
          if (idx !== -1) {
            updatedList[idx] = {
              ...updatedList[idx],
              previousPrice: updatedList[idx].price,
              price: realData.price,
              history: realData.history,
              high: realData.high,
              low: realData.low,
              change24h: realData.change24h
            };
            changed = true;
          }
        }
      }
      
      if (changed) {
        setStocks(updatedList);
      }
    };

    // Initial sync
    syncRealMarketPrices();

    // 30 seconds background polling
    const syncInterval = setInterval(syncRealMarketPrices, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  // Core Price Micro-ticks & Agent Simulator Loop (Runs every 2.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Update stock prices with micro-movements
      const updatedStocks = updateStockPrices(stocksRef.current);
      setStocks(updatedStocks);

      // 2. Handle active tournament updates
      const activeTourId = activeTournamentIdRef.current;
      if (activeTourId) {
        // A. Decrement time
        setTournaments(prevTournaments => {
          return prevTournaments.map(t => {
            if (t.id === activeTourId) {
              const newTime = Math.max(0, t.timeRemaining - 2);
              if (newTime === 0 && t.active) {
                return { ...t, timeRemaining: newTime, active: false };
              }
              return { ...t, timeRemaining: newTime };
            }
            return t;
          });
        });

        const currentTour = tournamentsRef.current.find(t => t.id === activeTourId);
        if (currentTour && currentTour.timeRemaining > 0 && currentTour.active) {
          // B. Run AI agents trading
          const updatedAgents = runAIAgentTrades(currentTour.agents, updatedStocks);
          
          setTournaments(prevTournaments => {
            return prevTournaments.map(t => {
              if (t.id === activeTourId) {
                return { ...t, agents: updatedAgents };
              }
              return t;
            });
          });

          // C. Re-evaluate User Portfolio total value
          const userPort = tournamentPortfoliosRef.current[activeTourId];
          if (userPort) {
            let userAssetsValue = userPort.cashBalance;
            Object.keys(userPort.holdings).forEach(sym => {
              const st = updatedStocks.find(s => s.symbol === sym);
              if (st) {
                userAssetsValue += userPort.holdings[sym].quantity * st.price;
              }
            });

            setTournamentPortfolios(prev => ({
              ...prev,
              [activeTourId]: {
                ...userPort,
                totalValue: Number(userAssetsValue.toFixed(2))
              }
            }));
          }
        }
      }
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  // Update Leaderboard whenever portfolio values or agent values change
  useEffect(() => {
    const activeTourId = activeTournamentId;
    if (!activeTourId) {
      setLeaderboard([]);
      return;
    }

    const currentTour = tournaments.find(t => t.id === activeTourId);
    const userPort = tournamentPortfolios[activeTourId];

    if (!currentTour || !userPort) return;

    const entries: LeaderboardEntry[] = [
      {
        id: 'user_player',
        name: userProfile ? userProfile.username : 'אתה (המשתמש)',
        isUser: true,
        totalValue: userPort.totalValue,
        changePercent: Number((((userPort.totalValue - userPort.initialValue) / userPort.initialValue) * 100).toFixed(2)),
        rank: 1,
        avatarColor: userProfile ? userProfile.avatarColor : '#8B5CF6'
      },
      ...currentTour.agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        isUser: false,
        totalValue: agent.totalValue,
        changePercent: Number((((agent.totalValue - currentTour.startingCash) / currentTour.startingCash) * 100).toFixed(2)),
        rank: 1,
        avatarColor: agent.avatarColor
      }))
    ];

    entries.sort((a, b) => b.totalValue - a.totalValue);

    const rankedEntries = entries.map((entry, idx) => ({
      ...entry,
      rank: idx + 1
    }));

    setLeaderboard(rankedEntries);
  }, [tournaments, tournamentPortfolios, activeTournamentId, userProfile]);

  // Helper to get active portfolio
  const getActivePortfolio = (): Portfolio => {
    if (activeTournamentId) {
      return tournamentPortfolios[activeTournamentId] || {
        cashBalance: 100000,
        holdings: {},
        transactions: [],
        totalValue: 100000,
        initialValue: 100000
      };
    }
    return mainPortfolio;
  };

  const updateActivePortfolio = (newPortfolio: Portfolio) => {
    if (activeTournamentId) {
      setTournamentPortfolios(prev => ({
        ...prev,
        [activeTournamentId]: newPortfolio
      }));
    } else {
      setMainPortfolio(newPortfolio);
    }
  };

  const login = (username: string) => {
    if (!username.trim()) return;
    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const profile = { username, avatarColor: randomColor };
    setUserProfile(profile);
    localStorage.setItem('user_profile', JSON.stringify(profile));
  };

  const logout = () => {
    setUserProfile(null);
    localStorage.removeItem('user_profile');
  };

  // Buy Stock Action
  const buyStock = (symbol: string, quantity: number) => {
    if (quantity <= 0) return;
    
    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const portfolio = getActivePortfolio();
    const cost = stock.price * quantity;

    if (portfolio.cashBalance < cost) {
      alert('אין מספיק מזומן בקופה לביצוע העסקה!');
      return;
    }

    const currentHolding = portfolio.holdings[symbol];
    let updatedHolding: Holding;

    if (currentHolding) {
      const newQuantity = currentHolding.quantity + quantity;
      const newAvgPrice = ((currentHolding.quantity * currentHolding.averageBuyPrice) + cost) / newQuantity;
      updatedHolding = {
        symbol,
        quantity: Number(newQuantity.toFixed(4)),
        averageBuyPrice: Number(newAvgPrice.toFixed(2))
      };
    } else {
      updatedHolding = {
        symbol,
        quantity,
        averageBuyPrice: stock.price
      };
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'BUY',
      symbol,
      quantity,
      price: stock.price,
      totalAmount: cost,
      timestamp: new Date().toLocaleTimeString('he-IL')
    };

    const newPortfolio: Portfolio = {
      ...portfolio,
      cashBalance: Number((portfolio.cashBalance - cost).toFixed(2)),
      holdings: {
        ...portfolio.holdings,
        [symbol]: updatedHolding
      },
      transactions: [transaction, ...portfolio.transactions]
    };

    let totalVal = newPortfolio.cashBalance;
    Object.keys(newPortfolio.holdings).forEach(sym => {
      const st = stocks.find(s => s.symbol === sym);
      if (st) {
        totalVal += newPortfolio.holdings[sym].quantity * st.price;
      }
    });
    newPortfolio.totalValue = Number(totalVal.toFixed(2));

    updateActivePortfolio(newPortfolio);
  };

  // Sell Stock Action
  const sellStock = (symbol: string, quantity: number) => {
    if (quantity <= 0) return;

    const stock = stocks.find(s => s.symbol === symbol);
    if (!stock) return;

    const portfolio = getActivePortfolio();
    const currentHolding = portfolio.holdings[symbol];

    if (!currentHolding || currentHolding.quantity < quantity) {
      alert('אין ברשותך מספיק מניות לביצוע המכירה!');
      return;
    }

    const revenue = stock.price * quantity;
    const updatedHoldings = { ...portfolio.holdings };
    const newQuantity = Number((currentHolding.quantity - quantity).toFixed(4));

    if (newQuantity <= 0.001) {
      delete updatedHoldings[symbol];
    } else {
      updatedHoldings[symbol] = {
        ...currentHolding,
        quantity: newQuantity
      };
    }

    const transaction: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'SELL',
      symbol,
      quantity,
      price: stock.price,
      totalAmount: revenue,
      timestamp: new Date().toLocaleTimeString('he-IL')
    };

    const newPortfolio: Portfolio = {
      ...portfolio,
      cashBalance: Number((portfolio.cashBalance + revenue).toFixed(2)),
      holdings: updatedHoldings,
      transactions: [transaction, ...portfolio.transactions]
    };

    let totalVal = newPortfolio.cashBalance;
    Object.keys(newPortfolio.holdings).forEach(sym => {
      const st = stocks.find(s => s.symbol === sym);
      if (st) {
        totalVal += newPortfolio.holdings[sym].quantity * st.price;
      }
    });
    newPortfolio.totalValue = Number(totalVal.toFixed(2));

    updateActivePortfolio(newPortfolio);
  };

  // Join Tournament Action
  const joinTournament = (id: string) => {
    setTournaments(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          active: true,
          userRegistered: true,
          timeRemaining: t.durationSeconds,
          agents: INITIAL_AGENTS.map(agent => ({
            ...agent,
            cashBalance: t.startingCash,
            totalValue: t.startingCash,
            holdings: {},
            tradesCount: 0,
            transactions: []
          }))
        };
      }
      return t;
    }));

    const targetTour = tournaments.find(t => t.id === id);
    if (targetTour) {
      setTournamentPortfolios(prev => ({
        ...prev,
        [id]: {
          cashBalance: targetTour.startingCash,
          holdings: {},
          transactions: [],
          totalValue: targetTour.startingCash,
          initialValue: targetTour.startingCash
        }
      }));
      setActiveTournamentId(id);
    }
  };

  const leaveTournament = () => {
    setActiveTournamentId(null);
  };

  const resetMainPortfolio = () => {
    setMainPortfolio(INITIAL_PORTFOLIO);
    localStorage.removeItem('main_portfolio');
  };

  const searchAndAddStock = async (symbol: string): Promise<boolean> => {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return false;

    // Check if already in list
    const existing = stocks.find(s => s.symbol === cleanSymbol);
    if (existing) {
      setSelectedStockSymbol(cleanSymbol);
      return true;
    }

    try {
      const realData = await fetchRealStockData(cleanSymbol);
      if (realData) {
        const newStock: Stock = {
          symbol: realData.symbol,
          name: realData.name,
          price: realData.price,
          previousPrice: realData.price,
          history: realData.history,
          change24h: realData.change24h,
          high: realData.high,
          low: realData.low
        };

        setStocks(prev => [...prev, newStock]);
        setSelectedStockSymbol(cleanSymbol);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Live value update for main portfolio whenever stock prices tick
  useEffect(() => {
    if (activeTournamentId) return;

    let totalVal = mainPortfolio.cashBalance;
    Object.keys(mainPortfolio.holdings).forEach(sym => {
      const st = stocks.find(s => s.symbol === sym);
      if (st) {
        totalVal += mainPortfolio.holdings[sym].quantity * st.price;
      }
    });

    const updatedVal = Number(totalVal.toFixed(2));
    if (updatedVal !== mainPortfolio.totalValue) {
      setMainPortfolio(prev => ({
        ...prev,
        totalValue: updatedVal
      }));
    }
  }, [stocks, mainPortfolio.cashBalance, mainPortfolio.holdings, activeTournamentId]);

  return (
    <TradingContext.Provider
      value={{
        stocks,
        mainPortfolio,
        tournaments,
        activeTournamentId,
        activeTournamentPortfolio: activeTournamentId ? (tournamentPortfolios[activeTournamentId] || null) : null,
        leaderboard,
        selectedStockSymbol,
        userProfile,
        selectedAgentIdForModal,
        setSelectedAgentIdForModal,
        login,
        logout,
        buyStock,
        sellStock,
        joinTournament,
        leaveTournament,
        setSelectedStockSymbol,
        resetMainPortfolio,
        searchAndAddStock,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
