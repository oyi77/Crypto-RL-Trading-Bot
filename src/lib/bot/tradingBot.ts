import { EventEmitter } from 'events';
import { Exchange } from '../exchange/exchange';
import { Strategy } from '../strategies/strategy';
import { CandleData } from '../technical/indicators';
import { MarketAnalyzer } from '../analysis/marketAnalyzer';
import { RiskManager } from '../risk/riskManager';
import { logInfo, logError } from '../utils/logger';
import { RLAgent } from '../rl/rlAgent';
import { TradingEnvironment } from '../rl/tradingEnvironment';
import { TradingState } from '../rl/tradingEnvironment';

export class TradingBot extends EventEmitter {
  private isRunning = false;
  private currentCandle: CandleData | null = null;
  private rlAgent: RLAgent;
  private tradingEnv: TradingEnvironment;
  private episodeCount = 0;
  private maxEpisodes = 1000;
  private modelSavePath = './models';
  private bestReward = -Infinity;

  constructor(
    private exchange: Exchange,
    private strategy: Strategy,
    private marketAnalyzer: MarketAnalyzer,
    private riskManager: RiskManager,
    private initialBalance: number = 10000,
    private symbol: string = 'BTC/USDT',
    private interval: string = '1m'
  ) {
    super();
    this.tradingEnv = new TradingEnvironment(this.initialBalance);
    this.rlAgent = new RLAgent();
  }

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // Try to load existing model
      await this.rlAgent.loadModel(this.modelSavePath);
    } catch (error) {
      logInfo('No existing model found, starting with a new one');
    }

    while (this.isRunning && this.episodeCount < this.maxEpisodes) {
      try {
        await this.runEpisode();
        this.episodeCount++;
      } catch (error) {
        logError(error as Error, 'TradingBot.runEpisode');
        break;
      }
    }
  }

  private async runEpisode(): Promise<void> {
    // Reset environment for new episode
    let state = this.tradingEnv.reset();
    let totalReward = 0;
    let stepCount = 0;

    while (true) {
      try {
        // Get latest market data
        const candle = await this.exchange.fetchLatestCandle(this.symbol, this.interval);
        if (!candle) continue;
        this.currentCandle = candle;

        // Analyze market state
        const marketState = await this.marketAnalyzer.analyzeMarket(candle);
        const indicators = await this.strategy.calculateIndicators(candle);

        // Get action from RL agent
        const action = await this.rlAgent.getAction(state);

        // Apply risk management
        const adjustedAction = this.riskManager.adjustAction(action, state);

        // Execute action in environment
        const { nextState, reward, done, info } = await this.tradingEnv.step(
          adjustedAction,
          candle,
          marketState,
          indicators
        );

        // Learn from experience
        await this.rlAgent.learn({
          state,
          action: adjustedAction,
          reward,
          nextState,
          done
        });

        // Update state
        state = nextState;
        totalReward += reward;
        stepCount++;

        // Emit trading signals and metrics
        this.emitSignals(adjustedAction, state, info);

        // Save model if performance improves
        if (totalReward > this.bestReward) {
          this.bestReward = totalReward;
          await this.rlAgent.saveModel(this.modelSavePath);
          logInfo('New best model saved', {
            episode: this.episodeCount,
            reward: totalReward
          });
        }

        if (done) break;

        // Add delay to match trading interval
        await this.sleep(this.getIntervalMs(this.interval));
      } catch (error) {
        logError(error as Error, 'TradingBot.runEpisode.step');
        break;
      }
    }

    // Log episode results
    logInfo('Episode completed', {
      episode: this.episodeCount,
      steps: stepCount,
      totalReward,
      finalBalance: state.balance,
      winRate: state.winRate
    });
  }

  private emitSignals(
    action: { type: string; confidence: number; size: number },
    state: TradingState,
    info: { tradeExecuted: boolean; pnl: number }
  ): void {
    // Emit trading signal
    if (info.tradeExecuted) {
      this.emit('signal', {
        type: action.type,
        confidence: action.confidence,
        price: this.currentCandle?.close,
        timestamp: this.currentCandle?.timestamp,
        size: action.size
      });
    }

    // Emit performance metrics
    this.emit('metrics', {
      balance: state.balance,
      equity: state.equity,
      drawdown: state.drawdown,
      winRate: state.winRate,
      tradeCount: state.tradeCount,
      lastPnL: info.pnl,
      rlMetrics: this.rlAgent.getMetrics()
    });
  }

  stop(): void {
    this.isRunning = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getIntervalMs(interval: string): number {
    const unit = interval.slice(-1);
    const value = parseInt(interval.slice(0, -1));
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60 * 1000; // default to 1m
    }
  }

  getStatus(): {
    isRunning: boolean;
    episode: number;
    bestReward: number;
    currentState: TradingState | null;
  } {
    return {
      isRunning: this.isRunning,
      episode: this.episodeCount,
      bestReward: this.bestReward,
      currentState: this.tradingEnv.getCurrentState()
    };
  }
} 