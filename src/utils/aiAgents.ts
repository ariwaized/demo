import type { AIAgent, Stock, Transaction, AIDelegation } from '../types';

export const INITIAL_AGENTS: AIAgent[] = [
  {
    id: 'agent_momentum',
    name: 'Momentum Bot (Alpha)',
    strategy: 'MOMENTUM',
    description: 'רוכב על מגמות עליה חזקות ומוכר במצבי מומנטום שלילי.',
    cashBalance: 100000,
    holdings: {},
    totalValue: 100000,
    avatarColor: '#10B981', // Emerald green
    tradesCount: 0,
    transactions: []
  },
  {
    id: 'agent_value',
    name: 'Value Investor (Beta)',
    strategy: 'VALUE',
    description: 'קונה מניות שנמצאות בשפל יחסי בהשוואה להיסטוריית המחירים שלהן.',
    cashBalance: 100000,
    holdings: {},
    totalValue: 100000,
    avatarColor: '#3B82F6', // Blue
    tradesCount: 0,
    transactions: []
  },
  {
    id: 'agent_reversion',
    name: 'Day Trader (Gamma)',
    strategy: 'REVERSION',
    description: 'מבצע עסקאות מהירות לניצול תיקונים ותנודות חריגות קצרות טווח במחיר.',
    cashBalance: 100000,
    holdings: {},
    totalValue: 100000,
    avatarColor: '#F59E0B', // Amber
    tradesCount: 0,
    transactions: []
  }
];

export function runAIAgentTrades(agents: AIAgent[], stocks: Stock[]): { updatedAgents: AIAgent[], tradeLogs: string[] } {
  const logs: string[] = [];

  const updatedAgents = agents.map(agent => {
    let cash = agent.cashBalance;
    const holdings = { ...agent.holdings };
    let tradesCount = agent.tradesCount;
    const agentTxList = [...agent.transactions];

    stocks.forEach(stock => {
      const history = stock.history;
      if (history.length < 5) return;

      const currentPrice = stock.price;
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

      if (agent.strategy === 'MOMENTUM') {
        const lookback = Math.min(10, history.length);
        const avg = history.slice(-lookback).reduce((sum, val) => sum + val, 0) / lookback;
        
        if (currentPrice > avg * 1.005) {
          action = 'BUY';
        } else if (currentPrice < avg * 0.995) {
          action = 'SELL';
        }
      } else if (agent.strategy === 'VALUE') {
        const min = Math.min(...history);
        const max = Math.max(...history);
        const range = max - min;
        
        if (range > 0) {
          const pos = (currentPrice - min) / range;
          if (pos < 0.35) {
            action = 'BUY';
          } else if (pos > 0.65) {
            action = 'SELL';
          }
        }
      } else if (agent.strategy === 'REVERSION') {
        const price3TicksAgo = history[history.length - 4] || history[0];
        const changeRatio = (currentPrice - price3TicksAgo) / price3TicksAgo;

        if (changeRatio < -0.012) {
          action = 'BUY';
        } else if (changeRatio > 0.012) {
          action = 'SELL';
        }
      }

      if (action === 'BUY' && cash > 500) {
        const allocation = cash * (0.04 + Math.random() * 0.04);
        const quantity = Math.floor((allocation / currentPrice) * 100) / 100;
        
        if (quantity > 0) {
          const cost = quantity * currentPrice;
          cash -= cost;
          
          const existing = holdings[stock.symbol];
          if (existing) {
            const newQty = existing.quantity + quantity;
            const newCost = (existing.quantity * existing.averageBuyPrice) + cost;
            holdings[stock.symbol] = {
              symbol: stock.symbol,
              quantity: Number(newQty.toFixed(4)),
              averageBuyPrice: Number((newCost / newQty).toFixed(2))
            };
          } else {
            holdings[stock.symbol] = {
              symbol: stock.symbol,
              quantity,
              averageBuyPrice: currentPrice
            };
          }
          
          const newTx: Transaction = {
            id: `tx_agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'BUY',
            symbol: stock.symbol,
            quantity,
            price: currentPrice,
            totalAmount: cost,
            timestamp: new Date().toLocaleTimeString('he-IL')
          };
          agentTxList.unshift(newTx);
          tradesCount++;
          logs.push(`הבוט ${agent.name} ביצע קנייה של ${quantity} מניות ${stock.symbol} בשער של $${currentPrice}`);
        }
      } else if (action === 'SELL') {
        const existing = holdings[stock.symbol];
        if (existing && existing.quantity > 0) {
          const sellRatio = 0.2 + Math.random() * 0.4;
          const qtyToSell = Math.floor(existing.quantity * sellRatio * 100) / 100;
          
          if (qtyToSell > 0) {
            const revenue = qtyToSell * currentPrice;
            cash += revenue;
            
            const remaining = Number((existing.quantity - qtyToSell).toFixed(4));
            if (remaining <= 0.01) {
              delete holdings[stock.symbol];
            } else {
              holdings[stock.symbol] = {
                ...existing,
                quantity: remaining
              };
            }

            const newTx: Transaction = {
              id: `tx_agent_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              type: 'SELL',
              symbol: stock.symbol,
              quantity: qtyToSell,
              price: currentPrice,
              totalAmount: revenue,
              timestamp: new Date().toLocaleTimeString('he-IL')
            };
            agentTxList.unshift(newTx);
            tradesCount++;
            logs.push(`הבוט ${agent.name} ביצע מכירה של ${qtyToSell} מניות ${stock.symbol} בשער של $${currentPrice}`);
          }
        }
      }
    });

    let totalValue = cash;
    Object.keys(holdings).forEach(symbol => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        totalValue += holdings[symbol].quantity * stock.price;
      }
    });

    return {
      ...agent,
      cashBalance: Number(cash.toFixed(2)),
      holdings,
      totalValue: Number(totalValue.toFixed(2)),
      tradesCount,
      transactions: agentTxList.slice(0, 50)
    };
  });

  return { updatedAgents, tradeLogs: logs };
}

export function runDelegatedAITrades(
  delegation: AIDelegation, 
  stocks: Stock[]
): { delegation: AIDelegation; transactions: Transaction[]; tradeLogs: string[] } {
  if (!delegation.active) return { delegation, transactions: [], tradeLogs: [] };

  let cash = delegation.allocatedCash;
  const holdings = { ...delegation.holdings };
  const txList: Transaction[] = [];
  const logs: string[] = [];

  stocks.forEach(stock => {
    const history = stock.history;
    if (history.length < 5) return;

    const currentPrice = stock.price;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (delegation.strategy === 'MOMENTUM') {
      const lookback = Math.min(10, history.length);
      const avg = history.slice(-lookback).reduce((sum, val) => sum + val, 0) / lookback;
      if (currentPrice > avg * 1.005) action = 'BUY';
      else if (currentPrice < avg * 0.995) action = 'SELL';
    } else if (delegation.strategy === 'VALUE') {
      const min = Math.min(...history);
      const max = Math.max(...history);
      const range = max - min;
      if (range > 0) {
        const pos = (currentPrice - min) / range;
        if (pos < 0.35) action = 'BUY';
        else if (pos > 0.65) action = 'SELL';
      }
    } else if (delegation.strategy === 'REVERSION') {
      const price3TicksAgo = history[history.length - 4] || history[0];
      const changeRatio = (currentPrice - price3TicksAgo) / price3TicksAgo;
      if (changeRatio < -0.012) action = 'BUY';
      else if (changeRatio > 0.012) action = 'SELL';
    }

    if (action === 'BUY' && cash > 100) {
      const allocation = cash * (0.05 + Math.random() * 0.05);
      const quantity = Math.floor((allocation / currentPrice) * 100) / 100;
      
      if (quantity > 0) {
        const cost = quantity * currentPrice;
        cash -= cost;
        const existing = holdings[stock.symbol];
        if (existing) {
          const newQty = existing.quantity + quantity;
          const newCost = (existing.quantity * existing.averageBuyPrice) + cost;
          holdings[stock.symbol] = {
            symbol: stock.symbol,
            quantity: Number(newQty.toFixed(4)),
            averageBuyPrice: Number((newCost / newQty).toFixed(2))
          };
        } else {
          holdings[stock.symbol] = {
            symbol: stock.symbol,
            quantity,
            averageBuyPrice: currentPrice
          };
        }

        const newTx: Transaction = {
          id: `tx_del_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'BUY',
          symbol: stock.symbol,
          quantity,
          price: currentPrice,
          totalAmount: cost,
          timestamp: new Date().toLocaleTimeString('he-IL')
        };
        txList.push(newTx);
        logs.push(`סוכן ה-AI שלך (${delegation.strategy}) קנה ${quantity} מניות ${stock.symbol} בשער $${currentPrice}`);
      }
    } else if (action === 'SELL') {
      const existing = holdings[stock.symbol];
      if (existing && existing.quantity > 0) {
        const sellRatio = 0.3 + Math.random() * 0.3;
        const qtyToSell = Math.floor(existing.quantity * sellRatio * 100) / 100;
        
        if (qtyToSell > 0) {
          const revenue = qtyToSell * currentPrice;
          cash += revenue;
          const remaining = Number((existing.quantity - qtyToSell).toFixed(4));
          if (remaining <= 0.01) {
            delete holdings[stock.symbol];
          } else {
            holdings[stock.symbol] = {
              ...existing,
              quantity: remaining
            };
          }

          const newTx: Transaction = {
            id: `tx_del_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            type: 'SELL',
            symbol: stock.symbol,
            quantity: qtyToSell,
            price: currentPrice,
            totalAmount: revenue,
            timestamp: new Date().toLocaleTimeString('he-IL')
          };
          txList.push(newTx);
          logs.push(`סוכן ה-AI שלך (${delegation.strategy}) מכר ${qtyToSell} מניות ${stock.symbol} בשער $${currentPrice}`);
        }
      }
    }
  });

  let totalValue = cash;
  Object.keys(holdings).forEach(symbol => {
    const stock = stocks.find(s => s.symbol === symbol);
    if (stock) {
      totalValue += holdings[symbol].quantity * stock.price;
    }
  });

  return {
    delegation: {
      ...delegation,
      allocatedCash: Number(cash.toFixed(2)),
      holdings,
      totalValue: Number(totalValue.toFixed(2))
    },
    transactions: txList,
    tradeLogs: logs
  };
}
