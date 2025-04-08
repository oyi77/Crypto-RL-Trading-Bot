import { MarketAnalyzer, MarketState } from '../analysis/marketAnalyzer';
import { Position } from '../portfolio/portfolioManager';
import { logInfo, logError, logWarning } from '../utils/logger';
import { TradingAction, TradingState } from '../rl/tradingEnvironment';

export interface RiskConfig {
  maxRiskPerTrade: number; // Maximum risk per trade as a percentage of capital
  maxLeverage: number;
  stopLossDistance: number; // Distance from entry to stop loss
  takeProfitDistance: number; // Distance from entry to take profit
  trailingStopDistance: number; // Distance for trailing stop
  maxOpenPositions: number;
}

export interface Position {
  symbol: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  leverage: number;
  side: 'LONG' | 'SHORT';
  timestamp: number;
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

export class RiskManager {
  private config: RiskConfig;
  private positions: Position[] = [];
  private capital: number;
  private marketAnalyzer: MarketAnalyzer;
  private riskMetrics: RiskMetrics;
  private dailyPnL: number = 0;
  private dailyLossLimit: number;
  private maxDrawdown: number;
  private maxOpenPositions: number;
  private correlationThreshold: number;
  private volatilityThreshold: number;
  private liquidityThreshold: number;
  private maxPositionSize: number;
  private minWinRate: number;
  private trailingStopPercent: number;

  constructor(
    config: RiskConfig,
    initialCapital: number,
    marketAnalyzer: MarketAnalyzer,
    riskMetrics: Partial<RiskMetrics> = {},
    maxPositionSize: number = 0.1, // 10% of balance
    maxDrawdown: number = 0.2, // 20% max drawdown
    minWinRate: number = 0.4, // 40% minimum win rate
    trailingStopPercent: number = 0.01 // 1% trailing stop
  ) {
    this.config = config;
    this.capital = initialCapital;
    this.marketAnalyzer = marketAnalyzer;
    this.dailyLossLimit = riskMetrics.dailyLossLimit || initialCapital * 0.05;
    this.maxDrawdown = maxDrawdown;
    this.maxOpenPositions = riskMetrics.maxOpenPositions || 5;
    this.correlationThreshold = riskMetrics.correlationThreshold || 0.7;
    this.volatilityThreshold = riskMetrics.volatilityThreshold || 0.1;
    this.liquidityThreshold = riskMetrics.liquidityThreshold || 1000000;
    this.maxPositionSize = maxPositionSize;
    this.minWinRate = minWinRate;
    this.trailingStopPercent = trailingStopPercent;

    this.riskMetrics = {
      totalExposure: initialCapital,
      maxPositionSize: initialCapital * 0.2,
      maxLeverage: 10,
      maxDrawdown: this.maxDrawdown,
      dailyLossLimit: this.dailyLossLimit,
      maxOpenPositions: this.maxOpenPositions,
      correlationThreshold: this.correlationThreshold,
      volatilityThreshold: this.volatilityThreshold,
      liquidityThreshold: this.liquidityThreshold
    };
  }

  calculatePositionSize(
    entryPrice: number,
    stopLoss: number,
    leverage: number
  ): number {
    const riskAmount = this.capital * (this.config.maxRiskPerTrade / 100);
    const priceDistance = Math.abs(entryPrice - stopLoss);
    const positionSize = (riskAmount / priceDistance) * leverage;
    return positionSize;
  }

  validatePosition(position: Position): boolean {
    // Check if max open positions limit is reached
    if (this.positions.length >= this.config.maxOpenPositions) {
      return false;
    }

    // Check if leverage is within limits
    if (position.leverage > this.config.maxLeverage) {
      return false;
    }

    // Check if position size is valid
    const calculatedSize = this.calculatePositionSize(
      position.entryPrice,
      position.stopLoss,
      position.leverage
    );

    if (position.size > calculatedSize) {
      return false;
    }

    // Check if stop loss and take profit distances are valid
    const stopLossDistance = Math.abs(position.entryPrice - position.stopLoss);
    const takeProfitDistance = Math.abs(position.entryPrice - position.takeProfit);

    if (
      stopLossDistance > this.config.stopLossDistance ||
      takeProfitDistance > this.config.takeProfitDistance
    ) {
      return false;
    }

    return true;
  }

  addPosition(position: Position): boolean {
    if (this.validatePosition(position)) {
      this.positions.push(position);
      return true;
    }
    return false;
  }

  removePosition(symbol: string): void {
    this.positions = this.positions.filter(p => p.symbol !== symbol);
  }

  updateTrailingStop(
    currentPrice: number,
    side: 'LONG' | 'SHORT',
    entryPrice: number,
    stopLoss: number
  ): number {
    if (side === 'LONG') {
      return Math.max(stopLoss, currentPrice * (1 - this.trailingStopPercent));
    } else {
      return Math.min(stopLoss, currentPrice * (1 + this.trailingStopPercent));
    }
  }

  calculateRiskMetrics(): {
    totalRisk: number;
    openPositions: number;
    usedMargin: number;
    availableMargin: number;
  } {
    const totalRisk = this.positions.reduce((sum, pos) => {
      const riskAmount = Math.abs(pos.entryPrice - pos.stopLoss) * pos.size;
      return sum + riskAmount;
    }, 0);

    const usedMargin = this.positions.reduce((sum, pos) => {
      return sum + (pos.size * pos.entryPrice) / pos.leverage;
    }, 0);

    const availableMargin = this.capital - usedMargin;

    return {
      totalRisk,
      openPositions: this.positions.length,
      usedMargin,
      availableMargin
    };
  }

  updateCapital(newCapital: number): void {
    this.capital = newCapital;
  }

  getPositions(): Position[] {
    return [...this.positions];
  }

  getPosition(symbol: string): Position | undefined {
    return this.positions.find(p => p.symbol === symbol);
  }

  async assessRisk(
    symbol: string,
    side: 'LONG' | 'SHORT',
    price: number,
    size: number,
    leverage: number,
    positions: Position[]
  ): Promise<{ isSafe: boolean; reason?: string }> {
    try {
      // Check max positions
      if (positions.length >= this.maxOpenPositions) {
        return {
          isSafe: false,
          reason: 'Maximum number of positions reached'
        };
      }

      // Check position size
      const positionValue = price * size * leverage;
      const maxPositionValue = this.capital * this.config.maxRiskPerTrade;
      if (positionValue > maxPositionValue) {
        return {
          isSafe: false,
          reason: 'Position size exceeds maximum risk per trade'
        };
      }

      // Check leverage
      if (leverage > this.config.maxLeverage) {
        return {
          isSafe: false,
          reason: 'Leverage exceeds maximum allowed'
        };
      }

      // Check market state
      const marketState = await this.marketAnalyzer.getMarketState(symbol);
      if (!this.isMarketConditionSafe(marketState, side)) {
        return {
          isSafe: false,
          reason: 'Market conditions not favorable'
        };
      }

      // Check daily loss limit
      if (this.dailyPnL < -this.dailyLossLimit) {
        return {
          isSafe: false,
          reason: 'Daily loss limit exceeded'
        };
      }

      return { isSafe: true };
    } catch (error) {
      logError(error as Error, 'RiskManager.assessRisk');
      return { isSafe: false, reason: 'Error assessing risk' };
    }
  }

  private checkCorrelationRisk(
    symbol: string,
    positions: Position[]
  ): { isSafe: boolean; reason?: string } {
    for (const position of positions) {
      const correlation = this.marketAnalyzer.getCorrelation(symbol, position.symbol);
      if (correlation && Math.abs(correlation) > this.correlationThreshold) {
        return {
          isSafe: false,
          reason: `High correlation (${correlation.toFixed(2)}) with existing position ${position.symbol}`
        };
      }
    }
    return { isSafe: true };
  }

  private checkVolatilityRisk(
    marketState: MarketState
  ): { isSafe: boolean; reason?: string } {
    if (marketState.volatility > this.volatilityThreshold) {
      return {
        isSafe: false,
        reason: `High volatility (${marketState.volatility.toFixed(2)})`
      };
    }
    return { isSafe: true };
  }

  private checkLiquidityRisk(
    marketState: MarketState
  ): { isSafe: boolean; reason?: string } {
    if (marketState.liquidity < this.liquidityThreshold) {
      return {
        isSafe: false,
        reason: `Low liquidity (${marketState.liquidity.toFixed(2)})`
      };
    }
    return { isSafe: true };
  }

  updateDailyPnL(pnl: number): void {
    this.dailyPnL += pnl;
  }

  resetDailyPnL(): void {
    this.dailyPnL = 0;
  }

  async checkStopLoss(
    position: Position,
    currentPrice: number
  ): Promise<{ shouldClose: boolean; reason?: string }> {
    try {
      const stopLossPrice = this.calculateStopLossPrice(position);
      
      if (position.side === 'LONG' && currentPrice <= stopLossPrice) {
        return {
          shouldClose: true,
          reason: 'Stop loss triggered for long position'
        };
      }
      
      if (position.side === 'SHORT' && currentPrice >= stopLossPrice) {
        return {
          shouldClose: true,
          reason: 'Stop loss triggered for short position'
        };
      }

      return { shouldClose: false };
    } catch (error) {
      logError(error as Error, 'RiskManager.checkStopLoss');
      return { shouldClose: false };
    }
  }

  async checkTakeProfit(
    position: Position,
    currentPrice: number
  ): Promise<{ shouldClose: boolean; reason?: string }> {
    try {
      const takeProfitPrice = this.calculateTakeProfitPrice(position);
      
      if (position.side === 'LONG' && currentPrice >= takeProfitPrice) {
        return {
          shouldClose: true,
          reason: 'Take profit triggered for long position'
        };
      }
      
      if (position.side === 'SHORT' && currentPrice <= takeProfitPrice) {
        return {
          shouldClose: true,
          reason: 'Take profit triggered for short position'
        };
      }

      return { shouldClose: false };
    } catch (error) {
      logError(error as Error, 'RiskManager.checkTakeProfit');
      return { shouldClose: false };
    }
  }

  private calculateATR(marketState: MarketState): number {
    return marketState.volatility * marketState.volumeProfile.average;
  }

  getRiskMetrics(): RiskMetrics {
    return { ...this.riskMetrics };
  }

  updateRiskMetrics(metrics: Partial<RiskMetrics>): void {
    this.riskMetrics = {
      ...this.riskMetrics,
      ...metrics
    };
  }

  private calculateStopLossPrice(position: Position): number {
    const distance = position.entryPrice * this.config.stopLossDistance;
    return position.side === 'LONG'
      ? position.entryPrice - distance
      : position.entryPrice + distance;
  }

  private calculateTakeProfitPrice(position: Position): number {
    const distance = position.entryPrice * this.config.takeProfitDistance;
    return position.side === 'LONG'
      ? position.entryPrice + distance
      : position.entryPrice - distance;
  }

  private isMarketConditionSafe(marketState: MarketState, side: 'LONG' | 'SHORT'): boolean {
    // Check trend alignment
    if (side === 'LONG' && marketState.trend === 'DOWNTREND') {
      return false;
    }
    if (side === 'SHORT' && marketState.trend === 'UPTREND') {
      return false;
    }

    // Check volatility
    if (marketState.volatility > 0.1) { // 10% volatility threshold
      return false;
    }

    // Check momentum
    const momentumThreshold = 0.02; // 2% momentum threshold
    if (side === 'LONG' && marketState.momentum < -momentumThreshold) {
      return false;
    }
    if (side === 'SHORT' && marketState.momentum > momentumThreshold) {
      return false;
    }

    return true;
  }

  private isDailyLossLimitExceeded(): boolean {
    const maxDailyLoss = this.capital * 0.05; // 5% daily loss limit
    return this.dailyPnL < -maxDailyLoss;
  }

  adjustAction(
    action: { type: string; confidence: number; size: number },
    state: {
      balance: number;
      equity: number;
      openPositions: number;
      drawdown: number;
    }
  ): { type: string; confidence: number; size: number } {
    // Don't trade if max positions reached
    if (state.openPositions >= this.config.maxOpenPositions) {
      return { type: 'HOLD', confidence: 0, size: 0 };
    }

    // Don't trade if drawdown is too high
    if (state.drawdown > 0.2) { // 20% max drawdown
      return { type: 'HOLD', confidence: 0, size: 0 };
    }

    // Calculate position size based on risk
    const riskAmount = state.balance * this.config.maxRiskPerTrade;
    const adjustedSize = riskAmount / this.config.stopLossDistance;

    // Adjust size based on confidence
    const finalSize = adjustedSize * action.confidence;

    return {
      type: action.type,
      confidence: action.confidence,
      size: Math.min(finalSize, state.balance * this.config.maxLeverage)
    };
  }

  getStopLoss(entryPrice: number, side: 'LONG' | 'SHORT'): number {
    return side === 'LONG'
      ? entryPrice * (1 - this.config.stopLossDistance)
      : entryPrice * (1 + this.config.stopLossDistance);
  }

  getTakeProfit(entryPrice: number, side: 'LONG' | 'SHORT'): number {
    return side === 'LONG'
      ? entryPrice * (1 + this.config.takeProfitDistance)
      : entryPrice * (1 - this.config.takeProfitDistance);
  }
} 