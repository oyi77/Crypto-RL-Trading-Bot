import * as tf from '@tensorflow/tfjs';

export interface CandleData {
  timestamp: number;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EMA {
  short: number;
  medium: number;
  long: number;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
}

export class TechnicalIndicators {
  static calculateEMA(data: number[], period: number): number[] {
    const k = 2 / (period + 1);
    const ema: number[] = [];
    let sum = 0;

    // Calculate SMA for the first value
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    ema.push(sum / period);

    // Calculate EMA for the rest
    for (let i = period; i < data.length; i++) {
      ema.push(data[i] * k + ema[ema.length - 1] * (1 - k));
    }

    return ema;
  }

  static calculateMACD(data: number[]): { macd: number[]; signal: number[]; histogram: number[] } {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    
    const macd: number[] = [];
    for (let i = 0; i < ema26.length; i++) {
      macd.push(ema12[i + 14] - ema26[i]);
    }

    const signal = this.calculateEMA(macd, 9);
    const histogram: number[] = [];
    
    for (let i = 0; i < signal.length; i++) {
      histogram.push(macd[i + 8] - signal[i]);
    }

    return { macd, signal, histogram };
  }

  static calculateRSI(data: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate price changes
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    // Calculate initial average gain and loss
    let avgGain = 0;
    let avgLoss = 0;
    for (let i = 0; i < period; i++) {
      avgGain += gains[i];
      avgLoss += losses[i];
    }
    avgGain /= period;
    avgLoss /= period;

    // Calculate RSI
    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
      
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  static detectCandlestickPattern(candles: CandleData[]): string {
    if (candles.length < 2) return 'No pattern';

    const current = candles[candles.length - 1];
    const previous = candles[candles.length - 2];

    // Bullish Engulfing
    if (current.close > current.open && 
        previous.close < previous.open &&
        current.open < previous.close &&
        current.close > previous.open) {
      return 'Bullish Engulfing';
    }

    // Bearish Engulfing
    if (current.close < current.open && 
        previous.close > previous.open &&
        current.open > previous.close &&
        current.close < previous.open) {
      return 'Bearish Engulfing';
    }

    // Doji
    if (Math.abs(current.close - current.open) <= (current.high - current.low) * 0.1) {
      return 'Doji';
    }

    return 'No pattern';
  }

  static calculateSupportResistance(candles: CandleData[], lookback: number = 20): { support: number; resistance: number } {
    const recentCandles = candles.slice(-lookback);
    const lows = recentCandles.map(c => c.low);
    const highs = recentCandles.map(c => c.high);

    const support = Math.min(...lows);
    const resistance = Math.max(...highs);

    return { support, resistance };
  }

  static async predictNextPrice(candles: CandleData[]): Promise<number> {
    // Convert candle data to tensor
    const features = candles.map(c => [
      c.open,
      c.high,
      c.low,
      c.close,
      c.volume
    ]);

    const xs = tf.tensor2d(features);
    
    // Simple moving average prediction
    const prediction = tf.mean(xs, 0).dataSync()[3]; // Using close price
    
    return prediction;
  }
}

export async function calculateEMA(price: number, length: number): Promise<number> {
  // Simple implementation for now
  // In a real implementation, we would maintain a price history
  return price;
}

export async function calculateMACD(
  price: number,
  fastLength: number,
  slowLength: number,
  signalLength: number
): Promise<{
  macd: number;
  signal: number;
  histogram: number;
}> {
  // Simple implementation for now
  return {
    macd: 0,
    signal: 0,
    histogram: 0
  };
}

export async function calculateRSI(price: number, length: number): Promise<number> {
  // Simple implementation for now
  return 50;
}

export async function calculateBollingerBands(
  price: number,
  length: number,
  stdDev: number
): Promise<{
  upper: number;
  middle: number;
  lower: number;
}> {
  // Simple implementation for now
  return {
    upper: price * 1.02,
    middle: price,
    lower: price * 0.98
  };
}

export async function calculateATR(
  high: number,
  low: number,
  close: number,
  length: number
): Promise<number> {
  // Simple implementation for now
  return (high - low) / close;
}

export async function calculateVolatility(prices: number[], length: number): Promise<number> {
  if (prices.length < 2) return 0;

  const returns = prices.slice(1).map((price, i) => {
    return Math.log(price / prices[i]);
  });

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

  return Math.sqrt(variance * 252); // Annualized volatility
} 