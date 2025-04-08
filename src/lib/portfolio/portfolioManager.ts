import { MarketAnalyzer, MarketState } from '../analysis/marketAnalyzer';
import { logInfo, logError } from '../utils/logger';
import { Position, PortfolioMetrics } from '../types/market';

export class PortfolioManager {
  private positions: Map<string, Position>;
  private initialCapital: number;
  private realizedPnL: number;
  private marketAnalyzer: MarketAnalyzer;
  private trades: Array<{
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    size: number;
    pnl: number;
    timestamp: number;
  }> = [];

  constructor(initialCapital: number, marketAnalyzer: MarketAnalyzer) {
    this.positions = new Map();
    this.initialCapital = initialCapital;
    this.realizedPnL = 0;
    this.marketAnalyzer = marketAnalyzer;
  }

  getOpenPositions(): Position[] {
    return Array.from(this.positions.values());
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.get(symbol);
  }

  openPosition(position: Position): void {
    this.positions.set(position.symbol, position);
  }

  closePosition(symbol: string): void {
    const position = this.positions.get(symbol);
    if (position) {
      this.realizedPnL += position.unrealizedPnL;
      this.positions.delete(symbol);
    }
  }

  updatePosition(symbol: string, currentPrice: number): void {
    const position = this.positions.get(symbol);
    if (position) {
      position.currentPrice = currentPrice;
      position.unrealizedPnL = position.side === 'LONG'
        ? (currentPrice - position.entryPrice) * position.size
        : (position.entryPrice - currentPrice) * position.size;
    }
  }

  getPortfolioMetrics(): PortfolioMetrics {
    const openPositions = this.getOpenPositions();
    const unrealizedPnL = openPositions.reduce((sum, pos) => sum + pos.unrealizedPnL, 0);
    const totalPnL = this.realizedPnL + unrealizedPnL;
    const totalValue = this.initialCapital + totalPnL;
    const longPositions = openPositions.filter(pos => pos.side === 'LONG').length;
    const shortPositions = openPositions.filter(pos => pos.side === 'SHORT').length;
    const totalPositions = this.trades.length;
    const averageTradeDuration = this.calculateAverageTradeDuration();
    const decisionAccuracy = this.calculateDecisionAccuracy();

    return {
      totalValue,
      unrealizedPnL,
      realizedPnL: this.realizedPnL,
      dailyPnL: 0, // TODO: Implement daily PnL tracking
      sharpeRatio: 0, // TODO: Implement Sharpe ratio calculation
      sortinoRatio: 0, // TODO: Implement Sortino ratio calculation
      maxDrawdown: 0, // TODO: Implement max drawdown calculation
      winRate: 0, // TODO: Implement win rate calculation
      profitFactor: 0, // TODO: Implement profit factor calculation
      riskAdjustedReturn: 0, // TODO: Implement risk-adjusted return calculation
      correlationMatrix: {}, // TODO: Implement correlation matrix calculation
      openPositions,
      totalPositions,
      longPositions,
      shortPositions,
      averageTradeDuration,
      decisionAccuracy
    };
  }

  private calculateAverageTradeDuration(): number {
    if (this.trades.length === 0) return 0;
    
    const durations = this.trades.map(trade => {
      const entryTime = new Date(trade.timestamp);
      const exitTime = new Date(trade.timestamp + 1000 * 60 * 5); // Assuming 5 minutes for now
      return (exitTime.getTime() - entryTime.getTime()) / (1000 * 60); // Duration in minutes
    });
    
    return durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  }

  private calculateDecisionAccuracy(): number {
    if (this.trades.length === 0) return 0;
    
    const profitableTrades = this.trades.filter(trade => trade.pnl > 0).length;
    return (profitableTrades / this.trades.length) * 100;
  }

  private calculatePnL(position: Position): number {
    const priceChange = position.currentPrice - position.entryPrice;
    const multiplier = position.side === 'LONG' ? 1 : -1;
    return priceChange * position.size * position.leverage * multiplier;
  }

  private calculateDailyReturns(): number[] {
    const dailyPnLs: { [date: string]: number } = {};
    
    for (const trade of this.trades) {
      const date = new Date(trade.timestamp).toISOString().split('T')[0];
      dailyPnLs[date] = (dailyPnLs[date] || 0) + trade.pnl;
    }

    return Object.values(dailyPnLs).map(pnl => pnl / this.initialCapital);
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1);
    const stdDev = Math.sqrt(variance);
    const riskFreeRate = 0.02 / 365; // Assuming 2% annual risk-free rate

    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  private calculateMaxDrawdown(): number {
    let peak = this.initialCapital;
    let maxDrawdown = 0;

    for (const trade of this.trades) {
      const currentValue = this.initialCapital + trade.pnl;
      peak = Math.max(peak, currentValue);
      const drawdown = (peak - currentValue) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }
} 