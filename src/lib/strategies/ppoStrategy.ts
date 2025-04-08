import { Strategy } from './strategy';
import { CandleData } from '../technical/indicators';
import { Indicators } from '../technical/technicalIndicators';
import { TechnicalAnalysis } from '../technical/technicalAnalysis';
import { TradingSignal } from '../types/trading';
import { MarketState } from '../analysis/marketAnalyzer';
import { logInfo, logError } from '../utils/logger';
import { BacktestResult } from '../analysis/backtestAnalyzer';

export class PPOStrategy implements Strategy {
  private technicalAnalysis: TechnicalAnalysis;
  private lastIndicators: Indicators | null = null;
  private rsiOverbought = 70;
  private rsiOversold = 30;
  private ppoThreshold = 0.05;
  private confidenceThreshold = 0.2;

  constructor() {
    this.technicalAnalysis = new TechnicalAnalysis();
  }

  async calculateIndicators(candle: CandleData): Promise<Indicators> {
    const indicators = await this.technicalAnalysis.calculate(candle);
    this.lastIndicators = indicators;
    return indicators;
  }

  async generateSignal(data: {
    candle: CandleData;
    marketState: any;
    indicators: Indicators;
  }): Promise<{
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    size: number;
    reason?: string;
  }> {
    const { indicators, marketState } = data;
    let signalStrength = 0;
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reason = '';

    // PPO Crossover signals
    if (indicators.ppo > 0 && this.lastIndicators?.ppo <= 0) {
      signalStrength += 0.3;
      action = 'BUY';
      reason += 'PPO crossed above zero; ';
    } else if (indicators.ppo < 0 && this.lastIndicators?.ppo >= 0) {
      signalStrength += 0.3;
      action = 'SELL';
      reason += 'PPO crossed below zero; ';
    }

    // RSI signals
    if (indicators.rsi < this.rsiOversold) {
      signalStrength += 0.2;
      action = 'BUY';
      reason += 'RSI oversold; ';
    } else if (indicators.rsi > this.rsiOverbought) {
      signalStrength += 0.2;
      action = 'SELL';
      reason += 'RSI overbought; ';
    }

    // MACD signals
    if (indicators.macd.histogram > 0 && this.lastIndicators?.macd.histogram <= 0) {
      signalStrength += 0.2;
      action = 'BUY';
      reason += 'MACD histogram turned positive; ';
    } else if (indicators.macd.histogram < 0 && this.lastIndicators?.macd.histogram >= 0) {
      signalStrength += 0.2;
      action = 'SELL';
      reason += 'MACD histogram turned negative; ';
    }

    // Bollinger Bands signals
    if (data.candle.close < indicators.bollingerBands.lower) {
      signalStrength += 0.2;
      action = 'BUY';
      reason += 'Price below lower Bollinger Band; ';
    } else if (data.candle.close > indicators.bollingerBands.upper) {
      signalStrength += 0.2;
      action = 'SELL';
      reason += 'Price above upper Bollinger Band; ';
    }

    // Stochastic signals
    if (indicators.stoch.k < 20 && indicators.stoch.d < 20) {
      signalStrength += 0.15;
      action = 'BUY';
      reason += 'Stochastic oversold; ';
    } else if (indicators.stoch.k > 80 && indicators.stoch.d > 80) {
      signalStrength += 0.15;
      action = 'SELL';
      reason += 'Stochastic overbought; ';
    }

    // Support/Resistance signals
    const currentPrice = data.candle.close;
    const supportLevels = indicators.supportResistance.support;
    const resistanceLevels = indicators.supportResistance.resistance;

    if (supportLevels.some(level => Math.abs(currentPrice - level) / level < 0.01)) {
      signalStrength += 0.15;
      action = 'BUY';
      reason += 'Price near support level; ';
    } else if (resistanceLevels.some(level => Math.abs(currentPrice - level) / level < 0.01)) {
      signalStrength += 0.15;
      action = 'SELL';
      reason += 'Price near resistance level; ';
    }

    // Volume Profile signals
    const highVolumeZones = indicators.volumeProfile.highVolumeZones;
    if (highVolumeZones.some(zone => Math.abs(currentPrice - zone) / zone < 0.01)) {
      signalStrength += 0.1;
      reason += 'Price near high volume zone; ';
    }

    // ATR-based position sizing
    const atr = indicators.atr;
    const baseSize = 0.1; // 10% of available balance
    const size = baseSize * (1 - atr / currentPrice); // Reduce size in high volatility

    // Trend confirmation
    if (marketState.trend === 'UP' && action === 'BUY') {
      signalStrength += 0.2;
      reason += 'Uptrend confirmed; ';
    } else if (marketState.trend === 'DOWN' && action === 'SELL') {
      signalStrength += 0.2;
      reason += 'Downtrend confirmed; ';
    }

    // Volatility adjustment
    if (marketState.volatility > 0.02) {
      signalStrength *= 0.8; // Reduce confidence in volatile markets
      reason += 'High volatility adjustment; ';
    }

    // If signal strength is too low, hold
    if (signalStrength < this.confidenceThreshold) {
      action = 'HOLD';
      reason = 'Signal strength too low; ';
    }

    return {
      action,
      confidence: signalStrength,
      size,
      reason: reason.trim()
    };
  }

  private isBuySignal(marketState: MarketState, indicators: Indicators): boolean {
    // Check for strong buy conditions
    const strongBuy = (
      marketState.trend === 'UP' &&
      marketState.regime === 'BULL' &&
      indicators.ppo > -this.ppoThreshold &&
      indicators.rsi < 45 &&
      indicators.macd.histogram > 0 &&
      marketState.volume === 'HIGH' &&
      marketState.momentum === 'STRONG'
    );

    // Check for moderate buy conditions
    const moderateBuy = (
      (marketState.trend === 'UP' || marketState.regime === 'BULL') &&
      indicators.ppo > -this.ppoThreshold &&
      indicators.rsi < 55 &&
      indicators.macd.histogram > -0.0001 &&
      marketState.volume !== 'LOW' &&
      (marketState.momentum === 'STRONG' || marketState.momentum === 'NEUTRAL')
    );

    return strongBuy || moderateBuy;
  }

  private isSellSignal(marketState: MarketState, indicators: Indicators): boolean {
    // Check for strong sell conditions
    const strongSell = (
      marketState.trend === 'DOWN' &&
      marketState.regime === 'BEAR' &&
      indicators.ppo < this.ppoThreshold &&
      indicators.rsi > 55 &&
      indicators.macd.histogram < 0 &&
      marketState.volume === 'HIGH' &&
      marketState.momentum === 'WEAK'
    );

    // Check for moderate sell conditions
    const moderateSell = (
      (marketState.trend === 'DOWN' || marketState.regime === 'BEAR') &&
      indicators.ppo < this.ppoThreshold &&
      indicators.rsi > 45 &&
      indicators.macd.histogram < 0.0001 &&
      marketState.volume !== 'LOW' &&
      (marketState.momentum === 'WEAK' || marketState.momentum === 'NEUTRAL')
    );

    return strongSell || moderateSell;
  }

  private calculateConfidence(marketState: MarketState, indicators: Indicators): number {
    let confidence = 0;

    // Trend and Regime confidence
    if (marketState.trend === 'UP' && marketState.regime === 'BULL') {
      confidence += 0.2;
    } else if (marketState.trend === 'DOWN' && marketState.regime === 'BEAR') {
      confidence += 0.2;
    } else if (marketState.trend === 'UP' || marketState.regime === 'BULL') {
      confidence += 0.15;
    } else if (marketState.trend === 'DOWN' || marketState.regime === 'BEAR') {
      confidence += 0.15;
    }

    // RSI confidence
    if (indicators.rsi < 30 || indicators.rsi > 70) {
      confidence += 0.2;
    } else if (indicators.rsi < 40 || indicators.rsi > 60) {
      confidence += 0.15;
    } else if (indicators.rsi < 45 || indicators.rsi > 55) {
      confidence += 0.1;
    }

    // MACD confidence
    if (Math.abs(indicators.macd.histogram) > 0.0001) {
      confidence += 0.15;
    } else if (Math.abs(indicators.macd.histogram) > 0.00005) {
      confidence += 0.1;
    }

    // PPO confidence
    if (Math.abs(indicators.ppo) > this.ppoThreshold) {
      confidence += 0.15;
    } else if (Math.abs(indicators.ppo) > this.ppoThreshold / 2) {
      confidence += 0.1;
    }

    // Volume confidence
    if (marketState.volume === 'HIGH') {
      confidence += 0.15;
    } else if (marketState.volume === 'MEDIUM') {
      confidence += 0.1;
    }

    // Momentum confidence
    if (marketState.momentum === 'STRONG' || marketState.momentum === 'WEAK') {
      confidence += 0.15;
    } else if (marketState.momentum === 'NEUTRAL') {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private calculatePositionSize(price: number, confidence: number): number {
    // Base position size is 0.01 BTC
    const baseSize = 0.01;
    
    // Adjust size based on confidence
    return baseSize * confidence;
  }

  async train(): Promise<void> {
    // Implement training logic here
    logInfo('Training PPO strategy');
  }

  async optimize(metrics: {
    backtest: BacktestResult;
    forwardTest: {
      totalTrades: number;
      winningTrades: number;
      losingTrades: number;
      winRate: number;
      totalPnL: number;
      maxDrawdown: number;
    };
  }): Promise<void> {
    logInfo('Optimizing PPO strategy parameters...');

    // Adjust RSI thresholds based on performance
    if (metrics.forwardTest.winRate < metrics.backtest.winRate) {
      // If forward test win rate is lower, make RSI thresholds more conservative
      this.rsiOverbought = Math.min(75, this.rsiOverbought + 2);
      this.rsiOversold = Math.max(25, this.rsiOversold - 2);
    } else {
      // If forward test win rate is higher, make RSI thresholds more aggressive
      this.rsiOverbought = Math.max(65, this.rsiOverbought - 2);
      this.rsiOversold = Math.min(35, this.rsiOversold + 2);
    }

    // Adjust PPO threshold based on drawdown
    if (metrics.forwardTest.maxDrawdown > metrics.backtest.maxDrawdown) {
      // If forward test drawdown is higher, make PPO threshold more conservative
      this.ppoThreshold = Math.min(0.1, this.ppoThreshold + 0.01);
    } else {
      // If forward test drawdown is lower, make PPO threshold more aggressive
      this.ppoThreshold = Math.max(0.02, this.ppoThreshold - 0.01);
    }

    // Adjust confidence threshold based on trade frequency
    const backtestTradeFrequency = metrics.backtest.totalTrades / 3; // 3 years of data
    const forwardTestTradeFrequency = metrics.forwardTest.totalTrades / 0.25; // 1 week of data

    if (forwardTestTradeFrequency > backtestTradeFrequency * 1.5) {
      // If forward test has too many trades, increase confidence threshold
      this.confidenceThreshold = Math.min(0.5, this.confidenceThreshold + 0.05);
    } else if (forwardTestTradeFrequency < backtestTradeFrequency * 0.5) {
      // If forward test has too few trades, decrease confidence threshold
      this.confidenceThreshold = Math.max(0.1, this.confidenceThreshold - 0.05);
    }

    logInfo('Updated strategy parameters', {
      rsiOverbought: this.rsiOverbought,
      rsiOversold: this.rsiOversold,
      ppoThreshold: this.ppoThreshold,
      confidenceThreshold: this.confidenceThreshold
    });
  }

  getStatus(): {
    rsiOverbought: number;
    rsiOversold: number;
    ppoThreshold: number;
    confidenceThreshold: number;
  } {
    return {
      rsiOverbought: this.rsiOverbought,
      rsiOversold: this.rsiOversold,
      ppoThreshold: this.ppoThreshold,
      confidenceThreshold: this.confidenceThreshold
    };
  }
} 