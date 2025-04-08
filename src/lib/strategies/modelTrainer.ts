import * as tf from '@tensorflow/tfjs';
import { PPOStrategy } from './ppoStrategy';
import { Backtester, BacktestResult } from '../backtest/backtester';
import { logInfo, logError } from '../utils/logger';
import { CandleData } from '../technical/indicators';

export interface TrainingConfig {
  batchSize: number;
  epochs: number;
  validationSplit: number;
  minTradesForTraining: number;
  minWinRate: number;
  maxDrawdown: number;
  retrainInterval: number; // in milliseconds
}

export class ModelTrainer {
  private strategy: PPOStrategy;
  private backtester: Backtester;
  private config: TrainingConfig;
  private lastTrainingTime: number = 0;
  private bestModel: tf.LayersModel | null = null;
  private bestMetrics: BacktestResult | null = null;

  constructor(
    strategy: PPOStrategy,
    backtester: Backtester,
    config: TrainingConfig
  ) {
    this.strategy = strategy;
    this.backtester = backtester;
    this.config = config;
  }

  async shouldRetrain(): Promise<boolean> {
    const now = Date.now();
    if (now - this.lastTrainingTime < this.config.retrainInterval) {
      return false;
    }

    const results = await this.backtester.run();
    return this.evaluateResults(results);
  }

  private evaluateResults(results: BacktestResult): boolean {
    if (!this.bestMetrics) {
      return true;
    }

    // Check if current results are better than best results
    const isBetter = 
      results.winRate > this.bestMetrics.winRate &&
      results.totalPnL > this.bestMetrics.totalPnL &&
      results.maxDrawdown < this.bestMetrics.maxDrawdown;

    return isBetter;
  }

  async train(candles: Map<string, CandleData[]>): Promise<void> {
    try {
      logInfo('Starting model training...');

      // Prepare training data
      const { states, actions, rewards } = await this.prepareTrainingData(candles);

      // Convert to tensors
      const stateTensor = tf.tensor2d(states);
      const actionTensor = tf.tensor1d(actions, 'int32');
      const rewardTensor = tf.tensor1d(rewards);

      // Train the model
      await this.strategy.train({
        states: stateTensor,
        actions: actionTensor,
        rewards: rewardTensor,
        batchSize: this.config.batchSize,
        epochs: this.config.epochs,
        validationSplit: this.config.validationSplit
      });

      // Run backtest to evaluate new model
      const results = await this.backtester.run();

      // Update best model if results are better
      if (this.evaluateResults(results)) {
        this.bestModel = await this.strategy.saveModel();
        this.bestMetrics = results;
        logInfo('New best model saved', {
          winRate: results.winRate,
          totalPnL: results.totalPnL,
          maxDrawdown: results.maxDrawdown
        });
      }

      this.lastTrainingTime = Date.now();
      logInfo('Model training completed');
    } catch (error) {
      logError(error as Error, 'ModelTrainer.train');
      throw error;
    }
  }

  private async prepareTrainingData(
    candles: Map<string, CandleData[]>
  ): Promise<{ states: number[][]; actions: number[]; rewards: number[] }> {
    const states: number[][] = [];
    const actions: number[] = [];
    const rewards: number[] = [];

    for (const [symbol, symbolCandles] of candles) {
      for (let i = 100; i < symbolCandles.length; i++) {
        const currentCandles = symbolCandles.slice(0, i + 1);
        const state = await this.strategy.preprocessState(currentCandles);
        const action = await this.strategy.getAction(state);
        const reward = await this.calculateReward(symbolCandles, i, action);

        states.push(state);
        actions.push(action);
        rewards.push(reward);
      }
    }

    return { states, actions, rewards };
  }

  private async calculateReward(
    candles: CandleData[],
    index: number,
    action: number
  ): Promise<number> {
    const currentPrice = candles[index].close;
    const nextPrice = candles[index + 1]?.close || currentPrice;
    const priceChange = (nextPrice - currentPrice) / currentPrice;

    // Calculate reward based on action and price movement
    let reward = 0;
    if (action === 0) { // LONG
      reward = priceChange;
    } else if (action === 1) { // SHORT
      reward = -priceChange;
    } else { // NEUTRAL
      reward = -Math.abs(priceChange) * 0.1; // Small penalty for missing opportunities
    }

    // Add risk-adjusted reward
    const volatility = this.calculateVolatility(candles.slice(index - 20, index));
    reward = reward / (volatility + 0.0001); // Normalize by volatility

    return reward;
  }

  private calculateVolatility(candles: CandleData[]): number {
    const returns = candles.map((c, i) => {
      if (i === 0) return 0;
      return (c.close - candles[i - 1].close) / candles[i - 1].close;
    });
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  async loadBestModel(): Promise<void> {
    if (this.bestModel) {
      await this.strategy.loadModel(this.bestModel);
      logInfo('Best model loaded');
    }
  }

  getBestMetrics(): BacktestResult | null {
    return this.bestMetrics;
  }
} 