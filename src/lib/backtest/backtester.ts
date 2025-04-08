import { PPOStrategy } from '../strategies/ppoStrategy';
import { RiskManager } from '../risk/riskManager';
import { TechnicalIndicators, CandleData } from '../technical/indicators';
import { logInfo, logError } from '../utils/logger';
import { MarketAnalyzer } from '../market/marketAnalyzer';

export interface BacktestResult {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Array<{
    entryTime: number;
    exitTime: number;
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
}

export class Backtester {
  private strategy: PPOStrategy;
  private riskManager: RiskManager;
  private candles: Map<string, CandleData[]>;
  private results: BacktestResult;
  private marketAnalyzer: MarketAnalyzer;
  private indicators: TechnicalIndicators;

  constructor(
    strategy: PPOStrategy,
    riskManager: RiskManager,
    candles: Map<string, CandleData[]>,
    marketAnalyzer: MarketAnalyzer,
    indicators: TechnicalIndicators
  ) {
    this.strategy = strategy;
    this.riskManager = riskManager;
    this.candles = candles;
    this.marketAnalyzer = marketAnalyzer;
    this.indicators = indicators;
    this.results = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: []
    };
  }

  async run(): Promise<BacktestResult> {
    try {
      logInfo('Starting backtest...');

      for (const [symbol, symbolCandles] of this.candles) {
        await this.backtestSymbol(symbol, symbolCandles);
      }

      this.calculateMetrics();
      logInfo('Backtest completed', this.results);
      return this.results;
    } catch (error) {
      logError(error as Error, 'Backtester.run');
      throw error;
    }
  }

  private async backtestSymbol(symbol: string, candles: CandleData[]): Promise<void> {
    let currentPosition: {
      side: 'LONG' | 'SHORT';
      entryPrice: number;
      entryTime: number;
      size: number;
    } | null = null;

    for (let i = 100; i < candles.length; i++) { // Start from 100 to have enough data for indicators
      const currentCandles = candles.slice(0, i + 1);
      const currentPrice = candles[i].close;

      if (currentPosition) {
        // Check if we should close the position
        const { shouldClose } = this.riskManager.updateTrailingStop(
          symbol,
          currentPrice
        );

        if (shouldClose) {
          const pnl = currentPosition.side === 'LONG'
            ? (currentPrice - currentPosition.entryPrice) * currentPosition.size
            : (currentPosition.entryPrice - currentPrice) * currentPosition.size;
          const pnlPercent = (pnl / (currentPosition.entryPrice * currentPosition.size)) * 100;

          this.results.trades.push({
            entryTime: currentPosition.entryTime,
            exitTime: candles[i].timestamp,
            symbol,
            side: currentPosition.side,
            entryPrice: currentPosition.entryPrice,
            exitPrice: currentPrice,
            pnl,
            pnlPercent
          });

          if (pnl > 0) {
            this.results.winningTrades++;
          } else {
            this.results.losingTrades++;
          }

          this.results.totalPnL += pnl;
          currentPosition = null;
        }
      }

      // Generate trading signal
      const marketState = await this.marketAnalyzer.updateMarketData(symbol, currentCandles);
      const indicators = this.indicators.calculate(symbol, currentCandles);
      
      const signal = await this.strategy.generateSignal({
        candle: currentCandles,
        marketState,
        indicators
      });

      if (signal && signal.action !== 'NEUTRAL' && signal.confidence >= 0.7) {
        const positionSize = this.riskManager.calculatePositionSize(
          signal.price,
          signal.price * 0.02, // 2% stop loss
          1 // No leverage in backtest
        );

        currentPosition = {
          side: signal.action === 'BUY' ? 'LONG' : 'SHORT',
          entryPrice: signal.price,
          entryTime: candles[i].timestamp,
          size: positionSize
        };
      }
    }

    this.results.totalTrades = this.results.trades.length;
  }

  private calculateMetrics(): void {
    // Calculate win rate
    this.results.winRate = this.results.totalTrades > 0
      ? (this.results.winningTrades / this.results.totalTrades) * 100
      : 0;

    // Calculate max drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let currentBalance = this.riskManager.calculateRiskMetrics().availableMargin;

    for (const trade of this.results.trades) {
      currentBalance += trade.pnl;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const drawdown = ((peak - currentBalance) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    this.results.maxDrawdown = maxDrawdown;

    // Calculate Sharpe ratio
    const returns = this.results.trades.map(t => t.pnlPercent);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length
    );
    this.results.sharpeRatio = stdDev !== 0 ? avgReturn / stdDev : 0;
  }

  getResults(): BacktestResult {
    return { ...this.results };
  }
} 