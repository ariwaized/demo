export interface Stock {
  symbol: string;
  name: string;
  price: number;
  previousPrice: number;
  history: number[]; // Historical prices for chart
  change24h: number; // Percentage change
  high: number;
  low: number;
}

export interface Holding {
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
}

export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  totalAmount: number;
  timestamp: string;
}

export interface Portfolio {
  cashBalance: number;
  holdings: { [symbol: string]: Holding };
  transactions: Transaction[];
  totalValue: number;
  initialValue: number;
}

export type AIStrategy = 'MOMENTUM' | 'VALUE' | 'REVERSION';

export interface AIAgent {
  id: string;
  name: string;
  strategy: AIStrategy;
  description: string;
  cashBalance: number;
  holdings: { [symbol: string]: Holding };
  totalValue: number;
  avatarColor: string;
  tradesCount: number;
  transactions: Transaction[]; // Adding agent transaction log for transparency
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  timeRemaining: number;
  active: boolean;
  startingCash: number;
  userRegistered: boolean;
  agents: AIAgent[];
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  isUser: boolean;
  totalValue: number;
  changePercent: number;
  rank: number;
  avatarColor: string;
}

export interface UserProfile {
  username: string;
  avatarColor: string;
}

export interface AIDelegation {
  strategy: AIStrategy;
  allocatedCash: number;
  holdings: { [symbol: string]: Holding };
  totalValue: number;
  initialValue: number;
  active: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  badgeColor: string;
}
