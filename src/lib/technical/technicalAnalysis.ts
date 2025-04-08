import { CandleData } from './indicators';
import { Indicators } from './technicalIndicators';

export class TechnicalAnalysis {
  private history: CandleData[] = [];
  private maxHistoryLength = 200;

  async calculate(candle: CandleData): Promise<Indicators> {
    // Add candle to history
    this.history.push(candle);
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }

    // Calculate RSI (14 periods)
    const rsi = this.calculateRSI(14);

    // Calculate MACD (12, 26, 9)
    const macd = this.calculateMACD(12, 26, 9);

    // Calculate PPO
    const ppo = this.calculatePPO(12, 26);

    // Calculate EMAs
    const ema = {
      short: this.calculateEMA(9),
      medium: this.calculateEMA(21),
      long: this.calculateEMA(50)
    };

    // Calculate Bollinger Bands
    const bollingerBands = this.calculateBollingerBands(20, 2);

    // Calculate Stochastic Oscillator
    const stoch = this.calculateStochastic(14, 3);

    // Calculate ATR
    const atr = this.calculateATR(14);

    // Calculate Volume Profile
    const volumeProfile = this.calculateVolumeProfile();

    // Calculate Support/Resistance Levels
    const supportResistance = this.calculateSupportResistance();

    return {
      rsi,
      macd,
      ppo,
      ema,
      bollingerBands,
      stoch,
      atr,
      volumeProfile,
      supportResistance
    };
  }

  private calculateRSI(periods: number): number {
    if (this.history.length < periods + 1) {
      return 50; // Default value when not enough data
    }

    let gains = 0;
    let losses = 0;

    // Calculate initial gains and losses
    for (let i = 1; i <= periods; i++) {
      const change = this.history[this.history.length - i].close - 
                    this.history[this.history.length - i - 1].close;
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    // Calculate average gains and losses
    const avgGain = gains / periods;
    const avgLoss = losses / periods;

    // Calculate RSI
    const rs = avgGain / (avgLoss || 1); // Avoid division by zero
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  private calculateMACD(
    fastPeriods: number,
    slowPeriods: number,
    signalPeriods: number
  ): { macd: number; signal: number; histogram: number } {
    const fastEMA = this.calculateEMA(fastPeriods);
    const slowEMA = this.calculateEMA(slowPeriods);
    const macdLine = fastEMA - slowEMA;

    // Calculate signal line (EMA of MACD line)
    const signalLine = this.calculateEMAValue(
      this.history.slice(-signalPeriods).map(c => c.close),
      macdLine,
      signalPeriods
    );

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine - signalLine
    };
  }

  private calculatePPO(fastPeriods: number, slowPeriods: number): number {
    const fastEMA = this.calculateEMA(fastPeriods);
    const slowEMA = this.calculateEMA(slowPeriods);

    return ((fastEMA - slowEMA) / slowEMA) * 100;
  }

  private calculateEMA(periods: number): number {
    if (this.history.length < periods) {
      return this.history[this.history.length - 1]?.close || 0;
    }

    const prices = this.history.map(c => c.close);
    const multiplier = 2 / (periods + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateEMAValue(
    values: number[],
    currentValue: number,
    periods: number
  ): number {
    if (values.length < periods) {
      return currentValue;
    }

    const multiplier = 2 / (periods + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateBollingerBands(periods: number, stdDev: number): {
    upper: number;
    middle: number;
    lower: number;
  } {
    if (this.history.length < periods) {
      const price = this.history[this.history.length - 1]?.close || 0;
      return { upper: price, middle: price, lower: price };
    }

    const prices = this.history.slice(-periods).map(c => c.close);
    const sma = prices.reduce((sum, price) => sum + price, 0) / periods;
    
    const squaredDiffs = prices.map(price => Math.pow(price - sma, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / periods;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  private calculateStochastic(periods: number, smoothPeriods: number): {
    k: number;
    d: number;
  } {
    if (this.history.length < periods) {
      return { k: 50, d: 50 };
    }

    const recentCandles = this.history.slice(-periods);
    const highestHigh = Math.max(...recentCandles.map(c => c.high));
    const lowestLow = Math.min(...recentCandles.map(c => c.low));
    const currentClose = recentCandles[recentCandles.length - 1].close;

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = this.calculateEMAValue([k], k, smoothPeriods);

    return { k, d };
  }

  private calculateATR(periods: number): number {
    if (this.history.length < periods + 1) {
      return 0;
    }

    const trValues: number[] = [];
    for (let i = 1; i < this.history.length; i++) {
      const current = this.history[i];
      const previous = this.history[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      trValues.push(Math.max(tr1, tr2, tr3));
    }

    // Calculate ATR using EMA
    let atr = trValues.slice(0, periods).reduce((sum, tr) => sum + tr, 0) / periods;
    const multiplier = 2 / (periods + 1);

    for (let i = periods; i < trValues.length; i++) {
      atr = (trValues[i] - atr) * multiplier + atr;
    }

    return atr;
  }

  private calculateVolumeProfile(): {
    highVolumeZones: number[];
    lowVolumeZones: number[];
  } {
    if (this.history.length < 20) {
      return { highVolumeZones: [], lowVolumeZones: [] };
    }

    const recentCandles = this.history.slice(-20);
    const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / 20;
    const highVolumeZones: number[] = [];
    const lowVolumeZones: number[] = [];

    recentCandles.forEach(candle => {
      if (candle.volume > avgVolume * 1.5) {
        highVolumeZones.push(candle.close);
      } else if (candle.volume < avgVolume * 0.5) {
        lowVolumeZones.push(candle.close);
      }
    });

    return { highVolumeZones, lowVolumeZones };
  }

  private calculateSupportResistance(): {
    support: number[];
    resistance: number[];
  } {
    if (this.history.length < 20) {
      return { support: [], resistance: [] };
    }

    const recentCandles = this.history.slice(-20);
    const support: number[] = [];
    const resistance: number[] = [];

    // Find local minima and maxima
    for (let i = 1; i < recentCandles.length - 1; i++) {
      const prev = recentCandles[i - 1];
      const current = recentCandles[i];
      const next = recentCandles[i + 1];

      if (current.low < prev.low && current.low < next.low) {
        support.push(current.low);
      }

      if (current.high > prev.high && current.high > next.high) {
        resistance.push(current.high);
      }
    }

    return { support, resistance };
  }
} 