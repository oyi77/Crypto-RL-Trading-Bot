import { Strategy } from './strategy';
import { CandleData } from '../technical/indicators';
import { calculateEMA, calculateMACD, calculateRSI } from '../technical/indicators';

export class DefaultStrategy implements Strategy {
  private emaLength = 20;
  private macdConfig = {
    fastLength: 12,
    slowLength: 26,
    signalLength: 9
  };
  private rsiLength = 14;

  async calculateIndicators(candle: CandleData): Promise<{
    ema: number;
    macd: { macd: number; signal: number; histogram: number };
    rsi: number;
  }> {
    // Calculate technical indicators
    const ema = await calculateEMA(candle.close, this.emaLength);
    const macd = await calculateMACD(
      candle.close,
      this.macdConfig.fastLength,
      this.macdConfig.slowLength,
      this.macdConfig.signalLength
    );
    const rsi = await calculateRSI(candle.close, this.rsiLength);

    return {
      ema,
      macd,
      rsi
    };
  }

  async analyze(
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
  }> {
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 0;
    let reasons: string[] = [];

    // EMA trend
    if (candle.close > indicators.ema) {
      confidence += 0.2;
      reasons.push('Price above EMA');
    } else {
      confidence -= 0.2;
      reasons.push('Price below EMA');
    }

    // MACD signals
    if (indicators.macd.histogram > 0 && indicators.macd.macd > indicators.macd.signal) {
      confidence += 0.3;
      reasons.push('MACD bullish crossover');
    } else if (indicators.macd.histogram < 0 && indicators.macd.macd < indicators.macd.signal) {
      confidence -= 0.3;
      reasons.push('MACD bearish crossover');
    }

    // RSI signals
    if (indicators.rsi < 30) {
      confidence += 0.5;
      reasons.push('RSI oversold');
    } else if (indicators.rsi > 70) {
      confidence -= 0.5;
      reasons.push('RSI overbought');
    }

    // Determine signal based on confidence
    if (confidence > 0.3) {
      signal = 'BUY';
    } else if (confidence < -0.3) {
      signal = 'SELL';
    }

    return {
      signal,
      confidence: Math.abs(confidence),
      reason: reasons.join(', ')
    };
  }
} 