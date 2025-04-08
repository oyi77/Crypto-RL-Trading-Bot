import { BacktestResult } from '../backtest/backtester';
import { logInfo, logError } from '../utils/logger';
import { CandleData } from '../technical/indicators';

export interface PerformanceMetrics {
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  averageTradeDuration: number;
  averageWin: number;
  averageLoss: number;
  riskAdjustedReturn: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface OptimizationResult {
  bestParameters: Record<string, any>;
  performanceMetrics: PerformanceMetrics;
  improvement: number;
}

export class PerformanceAnalyzer {
  private historicalResults: BacktestResult[] = [];
  private optimizationHistory: OptimizationResult[] = [];

  constructor() {}

  analyzeResults(results: BacktestResult): PerformanceMetrics {
    try {
      const metrics: PerformanceMetrics = {
        winRate: results.winRate,
        profitFactor: this.calculateProfitFactor(results),
        sharpeRatio: results.sharpeRatio,
        maxDrawdown: results.maxDrawdown,
        averageTradeDuration: this.calculateAverageTradeDuration(results),
        averageWin: this.calculateAverageWin(results),
        averageLoss: this.calculateAverageLoss(results),
        riskAdjustedReturn: this.calculateRiskAdjustedReturn(results),
        consecutiveWins: this.calculateConsecutiveWins(results),
        consecutiveLosses: this.calculateConsecutiveLosses(results)
      };

      this.historicalResults.push(results);
      return metrics;
    } catch (error) {
      logError(error as Error, 'PerformanceAnalyzer.analyzeResults');
      throw error;
    }
  }

  private calculateProfitFactor(results: BacktestResult): number {
    const winningTrades = results.trades.filter(t => t.pnl > 0);
    const losingTrades = results.trades.filter(t => t.pnl < 0);

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    return totalLosses === 0 ? Infinity : totalWins / totalLosses;
  }

  private calculateAverageTradeDuration(results: BacktestResult): number {
    const durations = results.trades.map(t => t.exitTime - t.entryTime);
    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  private calculateAverageWin(results: BacktestResult): number {
    const winningTrades = results.trades.filter(t => t.pnl > 0);
    return winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length;
  }

  private calculateAverageLoss(results: BacktestResult): number {
    const losingTrades = results.trades.filter(t => t.pnl < 0);
    return losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length;
  }

  private calculateRiskAdjustedReturn(results: BacktestResult): number {
    const totalReturn = results.totalPnL;
    const maxDrawdown = results.maxDrawdown;
    return maxDrawdown === 0 ? Infinity : totalReturn / maxDrawdown;
  }

  private calculateConsecutiveWins(results: BacktestResult): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of results.trades) {
      if (trade.pnl > 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  private calculateConsecutiveLosses(results: BacktestResult): number {
    let maxConsecutive = 0;
    let currentConsecutive = 0;

    for (const trade of results.trades) {
      if (trade.pnl < 0) {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0;
      }
    }

    return maxConsecutive;
  }

  async optimizeParameters(
    currentParameters: Record<string, any>,
    candles: Map<string, CandleData[]>
  ): Promise<OptimizationResult> {
    try {
      logInfo('Starting parameter optimization...');

      const parameterRanges = this.getParameterRanges(currentParameters);
      const bestResult = await this.gridSearch(parameterRanges, candles);

      const improvement = this.calculateImprovement(bestResult.performanceMetrics);
      this.optimizationHistory.push({
        bestParameters: bestResult.parameters,
        performanceMetrics: bestResult.performanceMetrics,
        improvement
      });

      logInfo('Parameter optimization completed', {
        improvement,
        bestParameters: bestResult.parameters
      });

      return {
        bestParameters: bestResult.parameters,
        performanceMetrics: bestResult.performanceMetrics,
        improvement
      };
    } catch (error) {
      logError(error as Error, 'PerformanceAnalyzer.optimizeParameters');
      throw error;
    }
  }

  private getParameterRanges(currentParameters: Record<string, any>): Record<string, number[]> {
    return {
      learningRate: [0.0001, 0.001, 0.01],
      gamma: [0.9, 0.95, 0.99],
      epsilon: [0.1, 0.2, 0.3],
      batchSize: [32, 64, 128],
      maxRiskPerTrade: [0.01, 0.02, 0.03],
      stopLossDistance: [0.01, 0.02, 0.03],
      takeProfitDistance: [0.02, 0.04, 0.06]
    };
  }

  private async gridSearch(
    parameterRanges: Record<string, number[]>,
    candles: Map<string, CandleData[]>
  ): Promise<{ parameters: Record<string, any>; performanceMetrics: PerformanceMetrics }> {
    let bestMetrics: PerformanceMetrics | null = null;
    let bestParameters: Record<string, any> = {};

    // Generate all parameter combinations
    const combinations = this.generateCombinations(parameterRanges);

    for (const params of combinations) {
      // Run backtest with current parameters
      const results = await this.runBacktestWithParameters(params, candles);
      const metrics = this.analyzeResults(results);

      if (!bestMetrics || this.isBetterPerformance(metrics, bestMetrics)) {
        bestMetrics = metrics;
        bestParameters = params;
      }
    }

    return {
      parameters: bestParameters,
      performanceMetrics: bestMetrics!
    };
  }

  private generateCombinations(parameterRanges: Record<string, number[]>): Record<string, any>[] {
    const keys = Object.keys(parameterRanges);
    const combinations: Record<string, any>[] = [];

    function generate(index: number, current: Record<string, any>) {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      for (const value of parameterRanges[key]) {
        current[key] = value;
        generate(index + 1, current);
      }
    }

    generate(0, {});
    return combinations;
  }

  private isBetterPerformance(a: PerformanceMetrics, b: PerformanceMetrics): boolean {
    const weights = {
      winRate: 0.3,
      profitFactor: 0.2,
      sharpeRatio: 0.2,
      maxDrawdown: -0.2,
      riskAdjustedReturn: 0.1
    };

    const scoreA = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + a[key as keyof PerformanceMetrics] * weight,
      0
    );

    const scoreB = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + b[key as keyof PerformanceMetrics] * weight,
      0
    );

    return scoreA > scoreB;
  }

  private calculateImprovement(metrics: PerformanceMetrics): number {
    if (this.historicalResults.length < 2) {
      return 0;
    }

    const previousMetrics = this.analyzeResults(this.historicalResults[this.historicalResults.length - 2]);
    const currentScore = this.calculatePerformanceScore(metrics);
    const previousScore = this.calculatePerformanceScore(previousMetrics);

    return ((currentScore - previousScore) / previousScore) * 100;
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    return (
      metrics.winRate * 0.3 +
      metrics.profitFactor * 0.2 +
      metrics.sharpeRatio * 0.2 +
      (1 - metrics.maxDrawdown) * 0.2 +
      metrics.riskAdjustedReturn * 0.1
    );
  }

  getHistoricalResults(): BacktestResult[] {
    return [...this.historicalResults];
  }

  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }
} 