import { CandleData } from '../technical/indicators';
import { MarketState } from '../types/market';
import { Indicators } from '../technical/technicalIndicators';
import { logInfo } from '../utils/logger';

export type TradingAction = 'BUY' | 'SELL' | 'HOLD';

export interface TradingState {
  balance: number;
  equity: number;
  openPositions: number;
  drawdown: number;
  winRate: number;
  tradeCount: number;
  lastAction: string;
  lastReward: number;
  marketState: {
    trend: string;
    volatility: string;
    volume: string;
  };
  indicators: {
    ema: number;
    macd: { macd: number; signal: number; histogram: number };
    rsi: number;
  };
}

export class TradingEnvironment {
  private state: TradingState;
  private initialBalance: number;
  private maxDrawdown: number = 0;
  private totalPnL: number = 0;
  private winCount: number = 0;
  private tradeCount: number = 0;

  constructor(initialBalance: number) {
    this.initialBalance = initialBalance;
    this.state = this.getInitialState();
  }

  reset(): TradingState {
    this.state = this.getInitialState();
    return this.state;
  }

  async step(
    action: { type: string; confidence: number; size: number },
    candle: CandleData,
    marketState: { trend: string; volatility: string; volume: string },
    indicators: {
      ema: number;
      macd: { macd: number; signal: number; histogram: number };
      rsi: number;
    }
  ): Promise<{
    nextState: TradingState;
    reward: number;
    done: boolean;
    info: { tradeExecuted: boolean; pnl: number };
  }> {
    // Execute action and calculate reward
    const { reward, pnl, tradeExecuted } = this.executeAction(action, candle);

    // Update state
    this.updateState(action, reward, marketState, indicators);

    // Check if episode should end
    const done = this.shouldEndEpisode();

    return {
      nextState: this.state,
      reward,
      done,
      info: { tradeExecuted, pnl }
    };
  }

  getCurrentState(): TradingState {
    return this.state;
  }

  private getInitialState(): TradingState {
    return {
      balance: this.initialBalance,
      equity: this.initialBalance,
      openPositions: 0,
      drawdown: 0,
      winRate: 1,
      tradeCount: 0,
      lastAction: 'HOLD',
      lastReward: 0,
      marketState: {
        trend: 'SIDEWAYS',
        volatility: 'MEDIUM',
        volume: 'MEDIUM'
      },
      indicators: {
        ema: 0,
        macd: { macd: 0, signal: 0, histogram: 0 },
        rsi: 50
      }
    };
  }

  private executeAction(
    action: { type: string; confidence: number; size: number },
    candle: CandleData
  ): {
    reward: number;
    pnl: number;
    tradeExecuted: boolean;
  } {
    // Simple reward calculation for now
    let reward = 0;
    let pnl = 0;
    let tradeExecuted = false;

    if (action.type !== 'HOLD') {
      tradeExecuted = true;
      this.tradeCount++;

      // Simulate trade result
      const success = Math.random() > 0.5;
      if (success) {
        this.winCount++;
        pnl = action.size * 0.01; // 1% profit
        reward = 1;
      } else {
        pnl = -action.size * 0.01; // 1% loss
        reward = -1;
      }

      // Update balance
      this.state.balance += pnl;
      this.totalPnL += pnl;

      // Update drawdown
      const drawdown = (this.initialBalance - this.state.balance) / this.initialBalance;
      this.maxDrawdown = Math.max(this.maxDrawdown, drawdown);
      this.state.drawdown = this.maxDrawdown;
    }

    return { reward, pnl, tradeExecuted };
  }

  private updateState(
    action: { type: string; confidence: number; size: number },
    reward: number,
    marketState: { trend: string; volatility: string; volume: string },
    indicators: {
      ema: number;
      macd: { macd: number; signal: number; histogram: number };
      rsi: number;
    }
  ): void {
    this.state = {
      ...this.state,
      winRate: this.tradeCount > 0 ? this.winCount / this.tradeCount : 1,
      tradeCount: this.tradeCount,
      lastAction: action.type,
      lastReward: reward,
      marketState,
      indicators
    };
  }

  private shouldEndEpisode(): boolean {
    // End episode if:
    // 1. Lost too much money (>50% drawdown)
    // 2. Made enough trades (>100)
    // 3. Achieved target profit (doubled money)
    return (
      this.state.drawdown > 0.5 ||
      this.tradeCount > 100 ||
      this.state.balance > this.initialBalance * 2
    );
  }
} 