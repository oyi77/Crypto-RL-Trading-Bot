export type TradingPair = string;

export interface MarketData {
  symbol: string;
  price: number;
  timestamp: number;
  volume: number;
  high: number;
  low: number;
}

export interface TradingSignal {
  timestamp: number;
  pair: string;
  type: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  exchange: string;
  leverage: number;
  capital: number;
  technicalAnalysis: {
    emaStatus: string;
    candlestickPattern: string;
    macd: string;
    volumeInsight: string;
    rsi: string;
    supportResistance: string;
  };
}

export interface Trade {
  id: string;
  timestamp: number;
  pair: string;
  type: 'LONG' | 'SHORT';
  price: number;
  size: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface BacktestResult {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  averagePnl: number;
  trades: Trade[];
  equityCurve: { timestamp: number; equity: number }[];
} 