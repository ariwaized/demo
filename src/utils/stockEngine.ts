import type { Stock } from '../types';

export const INITIAL_STOCKS: Stock[] = [
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 125.40,
    previousPrice: 125.40,
    history: Array(50).fill(125.40),
    change24h: 3.42,
    high: 128.50,
    low: 122.10,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 180.20,
    previousPrice: 180.20,
    history: Array(50).fill(180.20),
    change24h: -1.25,
    high: 185.40,
    low: 175.20,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 215.10,
    previousPrice: 215.10,
    history: Array(50).fill(215.10),
    change24h: 0.85,
    high: 217.30,
    low: 212.90,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    price: 420.50,
    previousPrice: 420.50,
    history: Array(50).fill(420.50),
    change24h: 1.12,
    high: 422.80,
    low: 418.10,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    price: 190.80,
    previousPrice: 190.80,
    history: Array(50).fill(190.80),
    change24h: -0.45,
    high: 193.20,
    low: 189.10,
  }
];

/**
 * Fetches real stock data from Yahoo Finance via a free CORS proxy
 */
export async function fetchRealStockData(symbol: string): Promise<{ price: number, history: number[], high: number, low: number, change24h: number } | null> {
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=2m&range=1d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;
    
    const wrapper = await res.json();
    if (!wrapper.contents) return null;
    
    const parsed = JSON.parse(wrapper.contents);
    if (!parsed.chart || !parsed.chart.result || parsed.chart.result.length === 0) return null;
    
    const result = parsed.chart.result[0];
    const price = result.meta.regularMarketPrice;
    const previousClose = result.meta.previousClose || price;
    const high = result.meta.regularMarketDayHigh || price;
    const low = result.meta.regularMarketDayLow || price;
    
    // Parse historical quotes (filter nulls)
    let quotes: number[] = [];
    if (result.indicators && result.indicators.quote && result.indicators.quote[0] && result.indicators.quote[0].close) {
      quotes = result.indicators.quote[0].close.filter((x: any) => typeof x === 'number');
    }
    
    if (quotes.length === 0) {
      quotes = Array(50).fill(price);
    } else if (quotes.length < 50) {
      const padding = Array(50 - quotes.length).fill(quotes[0]);
      quotes = [...padding, ...quotes];
    } else {
      quotes = quotes.slice(-50);
    }
    
    const change24h = Number((((price - previousClose) / previousClose) * 100).toFixed(2));

    return {
      price,
      history: quotes,
      high,
      low,
      change24h
    };
  } catch (error) {
    console.warn(`Error fetching real Yahoo Finance data for ${symbol}:`, error);
    return null;
  }
}

export function updateStockPrices(stocks: Stock[]): Stock[] {
  return stocks.map(stock => {
    let volatility = 0.005; // lower volatility to simulate micro-ticks on top of real prices
    let drift = 0.0001;

    switch (stock.symbol) {
      case 'TSLA':
        volatility = 0.012;
        drift = 0.0001;
        break;
      case 'NVDA':
        volatility = 0.015;
        drift = 0.0005;
        break;
      case 'MSFT':
        volatility = 0.004;
        drift = 0.0002;
        break;
      case 'AAPL':
        volatility = 0.005;
        drift = 0.0001;
        break;
      case 'AMZN':
        volatility = 0.006;
        drift = 0.0003;
        break;
    }

    const changePercent = drift + volatility * (Math.random() - 0.5);
    const newPrice = Number((stock.price * (1 + changePercent)).toFixed(2));
    const clampedPrice = Math.max(1.00, newPrice);

    const newHistory = [...stock.history.slice(1), clampedPrice];
    const newHigh = Math.max(stock.high, clampedPrice);
    const newLow = Math.min(stock.low, clampedPrice);

    const firstPrice = newHistory[0] || clampedPrice;
    const change24h = Number((((clampedPrice - firstPrice) / firstPrice) * 100).toFixed(2));

    return {
      ...stock,
      previousPrice: stock.price,
      price: clampedPrice,
      history: newHistory,
      change24h,
      high: newHigh,
      low: newLow
    };
  });
}
