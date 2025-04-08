import { CandleData } from '../technical/indicators';

export interface Strategy {
  calculateIndicators(candle: CandleData): Promise<{
    ema: number;
    macd: { macd: number; signal: number; histogram: number };
    rsi: number;
  }>;

  analyze(
    candle: CandleData,
    indicators: {
      ema: number;
      macd: { macd: number; signal: number; histogram: number };
      rsi: number;
    }
  ): Promise<{
    signal: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reason: string;
  }>;
} 