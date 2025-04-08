import { CandleData } from '../types/market';
import { EMA, MACD } from './indicators';

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

export interface Stochastic {
  k: number;
  d: number;
}

export interface VolumeProfile {
  highVolumeZones: number[];
  lowVolumeZones: number[];
}

export interface SupportResistance {
  support: number[];
  resistance: number[];
}

export interface Indicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ppo: number;
  ema: {
    short: number;
    long: number;
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  stoch: Stochastic;
  atr: number;
  volumeProfile: VolumeProfile;
  supportResistance: SupportResistance;
}

export class TechnicalIndicators {
  private emaCache: Map<string, number> = new Map();
  private rsiPeriod: number = 14;
  private macdFast: number = 12;
  private macdSlow: number = 26;
  private macdSignal: number = 9;
  private ppoPeriod: number = 14;

  calculateSMA(prices: number[], period: number): number {
    if (!prices || prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];
    
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  calculateEMA(prices: number[], period: number): number {
    if (!prices || prices.length === 0) return 0;
    if (prices.length < period) return prices[prices.length - 1];
    
    const key = `${prices.join(',')}-${period}`;
    if (this.emaCache.has(key)) {
      return this.emaCache.get(key)!;
    }

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    this.emaCache.set(key, ema);
    return ema;
  }

  calculatePPO(prices: number[]): number {
    if (prices.length < this.ppoPeriod) {
      return 0;
    }

    const shortEMA = this.calculateEMA(prices, this.ppoPeriod);
    const longEMA = this.calculateEMA(prices, this.ppoPeriod * 2);

    return ((shortEMA - longEMA) / longEMA) * 100;
  }

  calculatePPOSignal(price: number, fastPeriod: number, slowPeriod: number, signalPeriod: number): number {
    if (!price) return 0;
    const ppo = this.calculatePPO([price]);
    return this.calculateEMA([ppo], signalPeriod);
  }

  calculateRSI(prices: number[]): number {
    if (!prices || prices.length === 0) return 50;
    if (prices.length < this.rsiPeriod + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain and loss
    for (let i = 1; i <= this.rsiPeriod; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    let avgGain = gains / this.rsiPeriod;
    let avgLoss = losses / this.rsiPeriod;

    // Calculate subsequent values using smoothing
    for (let i = this.rsiPeriod + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change >= 0) {
        avgGain = (avgGain * (this.rsiPeriod - 1) + change) / this.rsiPeriod;
        avgLoss = (avgLoss * (this.rsiPeriod - 1)) / this.rsiPeriod;
      } else {
        avgGain = (avgGain * (this.rsiPeriod - 1)) / this.rsiPeriod;
        avgLoss = (avgLoss * (this.rsiPeriod - 1) - change) / this.rsiPeriod;
      }
    }

    if (avgLoss === 0) {
      return 100;
    }
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(prices: number[]): MACD {
    if (!prices || prices.length === 0) {
      return { histogram: 0, signal: 0, macd: 0 };
    }

    if (prices.length < this.macdSlow) {
      return { histogram: 0, signal: 0, macd: 0 };
    }

    // Calculate fast and slow EMAs
    const fastEMA = this.calculateEMA(prices, this.macdFast);
    const slowEMA = this.calculateEMA(prices, this.macdSlow);

    // Calculate MACD line
    const macdLine = fastEMA - slowEMA;

    // Calculate signal line using the MACD line
    const signalLine = this.calculateEMA([macdLine], this.macdSignal);

    // Calculate histogram
    const histogram = macdLine - signalLine;

    return {
      histogram,
      signal: signalLine,
      macd: macdLine
    };
  }

  calculateMACDSignal(price: number, fastPeriod: number, slowPeriod: number, signalPeriod: number): number {
    if (!price) return 0;
    const macd = this.calculateMACD([price]);
    return this.calculateEMA([macd.macd], signalPeriod);
  }

  calculateBollingerBands(prices: number[], period: number, stdDev: number): {
    upper: number;
    middle: number;
    lower: number;
  } {
    if (!prices || prices.length === 0) {
      return { upper: 0, middle: 0, lower: 0 };
    }
    if (prices.length < period) {
      const price = prices[prices.length - 1];
      return { upper: price, middle: price, lower: price };
    }

    const sma = this.calculateSMA(prices, period);
    const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  calculateVolumeProfile(candles: CandleData[], period: number = 20): {
    highVolumeZones: number[];
    lowVolumeZones: number[];
  } {
    const volumes: number[] = candles.map(c => c.volume);
    const prices: number[] = candles.map(c => c.close);
    
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    
    const highVolumeZones: number[] = [];
    const lowVolumeZones: number[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      if (volumes[i] > avgVolume * 1.5) {
        highVolumeZones.push(prices[i]);
      } else if (volumes[i] < avgVolume * 0.5) {
        lowVolumeZones.push(prices[i]);
      }
    }
    
    return { highVolumeZones, lowVolumeZones };
  }

  calculateATR(candles: CandleData[], period: number = 14): number[] {
    const tr: number[] = [];
    
    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      tr.push(Math.max(tr1, tr2, tr3));
    }
    
    const atr: number[] = [];
    let sum = 0;
    
    for (let i = 0; i < period; i++) {
      sum += tr[i];
    }
    atr.push(sum / period);
    
    for (let i = period; i < tr.length; i++) {
      atr.push((atr[atr.length - 1] * (period - 1) + tr[i]) / period);
    }
    
    return atr;
  }

  calculate(symbol: string, candles: CandleData[]): Indicators {
    if (!candles || candles.length === 0) {
      return {
        rsi: 50,
        macd: { histogram: 0, signal: 0, macd: 0 },
        ppo: 0,
        ema: { short: 0, long: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 },
        stoch: { k: 0, d: 0 },
        atr: 0,
        volumeProfile: { highVolumeZones: [], lowVolumeZones: [] },
        supportResistance: { support: [], resistance: [] }
      };
    }

    const prices = candles.map(c => c.close);
    
    // Calculate RSI with proper handling of single candle
    let rsi = 50;
    if (prices.length >= this.rsiPeriod + 1) {
      rsi = this.calculateRSI(prices);
    }

    // Calculate MACD with proper handling of single candle
    let macd = { histogram: 0, signal: 0, macd: 0 };
    if (prices.length >= this.macdSlow) {
      macd = this.calculateMACD(prices);
    }

    // Calculate PPO with proper handling of single candle
    let ppo = 0;
    if (prices.length >= this.ppoPeriod * 2) {
      ppo = this.calculatePPO(prices);
    }
    
    return {
      rsi,
      macd,
      ppo,
      ema: { short: this.calculateEMA(prices, 14), long: this.calculateEMA(prices, 26) },
      bollingerBands: this.calculateBollingerBands(prices, 20, 2),
      stoch: { k: 0, d: 0 },
      atr: this.calculateATR(candles)[0],
      volumeProfile: this.calculateVolumeProfile(candles),
      supportResistance: { support: [], resistance: [] }
    };
  }
} 