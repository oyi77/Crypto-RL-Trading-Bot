export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketState {
  trend: 'UP' | 'DOWN' | 'NEUTRAL';
  volatility: number;
  volume: number;
}

export interface TradingSignal {
  action: 'LONG' | 'SHORT' | 'HOLD';
  confidence: number;
  reason: string;
}

export interface Position {
  symbol: string;
  entryPrice: number;
  currentPrice: number;
  size: number;
  side: 'LONG' | 'SHORT';
  leverage: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnL: number;
  timestamp: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dailyPnL: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  riskAdjustedReturn: number;
  correlationMatrix: Record<string, Record<string, number>>;
  openPositions: Position[];
  totalPositions: number;
  longPositions: number;
  shortPositions: number;
  averageTradeDuration: number;
  decisionAccuracy: number;
}

export interface RiskMetrics {
  totalExposure: number;
  maxPositionSize: number;
  maxLeverage: number;
  maxDrawdown: number;
  dailyLossLimit: number;
  maxOpenPositions: number;
  correlationThreshold: number;
  volatilityThreshold: number;
  liquidityThreshold: number;
} 