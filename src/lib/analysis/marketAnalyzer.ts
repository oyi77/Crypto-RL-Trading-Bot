import { CandleData, MarketState } from '../types/market';
import { TechnicalIndicators } from '../technical/technicalIndicators';
import { logInfo } from '../utils/logger';

export class MarketAnalyzer {
  private indicators: TechnicalIndicators;
  private marketData: Map<string, CandleData[]> = new Map();
  private marketStates: Map<string, MarketState> = new Map();
  private volatilityWindow = 20;
  private trendWindow = 50;
  private volumeWindow = 20;

  constructor() {
    this.indicators = new TechnicalIndicators();
  }

  async updateMarketData(symbol: string, candleData: CandleData | CandleData[]): Promise<MarketState> {
    // Initialize market data
    if (!this.marketData.has(symbol)) {
      this.marketData.set(symbol, []);
    }
    const candles = this.marketData.get(symbol)!;

    // Add candle(s) to market data
    if (Array.isArray(candleData)) {
      candles.push(...candleData);
    } else {
      candles.push(candleData);
    }

    // Keep only the last 100 candles
    if (candles.length > 100) {
      candles.splice(0, candles.length - 100);
    }

    // Calculate indicators
    const prices = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);

    // Calculate trend
    const sma20 = this.indicators.calculateSMA(prices, 20);
    const sma50 = this.indicators.calculateSMA(prices, 50);
    const trend = sma20 > sma50 ? 'BULLISH' : 'BEARISH';

    // Calculate volatility
    let volatility = 0;
    if (prices.length >= 2) {
      const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const squaredDeviations = returns.map(r => Math.pow(r - meanReturn, 2));
      volatility = Math.sqrt(squaredDeviations.reduce((sum, sd) => sum + sd, 0) / returns.length);
    }

    // Calculate volume profile
    let volumeRatio = 1;
    if (volumes.length >= 20) {
      const avgVolume = volumes.slice(-20).reduce((sum, v) => sum + v, 0) / 20;
      const currentVolume = volumes[volumes.length - 1];
      volumeRatio = currentVolume / avgVolume;
    }

    // Calculate MACD
    const macd = this.indicators.calculateMACD(prices);

    // Create market state
    const marketState: MarketState = {
      trend: trend === 'BULLISH' ? 'UP' : 'DOWN',
      volatility: volatility > 0.02 ? 'HIGH' : volatility > 0.01 ? 'MEDIUM' : 'LOW',
      volume: volumeRatio > 1.5 ? 'HIGH' : volumeRatio > 0.8 ? 'MEDIUM' : 'LOW',
      momentum: macd.histogram > 0 ? 'STRONG' : macd.histogram < 0 ? 'WEAK' : 'NEUTRAL',
      regime: trend === 'BULLISH' ? 'BULL' : 'BEAR'
    };

    // Update market state
    this.marketStates.set(symbol, marketState);

    logInfo('Market state updated', {
      symbol,
      trend: marketState.trend,
      volatility: marketState.volatility,
      volume: marketState.volume,
      momentum: marketState.momentum,
      regime: marketState.regime
    });

    return marketState;
  }

  getMarketState(symbol: string): MarketState | undefined {
    return this.marketStates.get(symbol);
  }

  async analyzeMarket(candle: CandleData): Promise<MarketState> {
    // Calculate trend
    const trend = this.calculateTrend(candle);

    // Calculate volatility
    const volatility = this.calculateVolatility(candle);

    // Calculate volume profile
    const volume = this.calculateVolumeProfile(candle);

    return {
      trend,
      volatility,
      volume,
      price: candle.close
    };
  }

  private calculateTrend(candle: CandleData): 'UP' | 'DOWN' | 'NEUTRAL' {
    if (candle.close > candle.open) {
      return 'UP';
    } else if (candle.close < candle.open) {
      return 'DOWN';
    }
    return 'NEUTRAL';
  }

  private calculateVolatility(candle: CandleData): number {
    return (candle.high - candle.low) / candle.open;
  }

  private calculateVolumeProfile(candle: CandleData): number {
    return candle.volume;
  }
} 