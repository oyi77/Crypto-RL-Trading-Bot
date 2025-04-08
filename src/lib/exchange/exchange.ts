import { CandleData } from '../technical/indicators';

export interface Exchange {
  fetchLatestCandle(symbol: string, interval: string): Promise<CandleData | null>;
  getHistoricalData(symbol: string, interval: string, limit: number): Promise<CandleData[]>;
  subscribeToKline(
    symbol: string,
    interval: string,
    callback: (candle: CandleData) => void
  ): Promise<() => void>;
  placeOrder(order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    size: number;
    price?: number;
  }): Promise<{
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    size: number;
    price: number;
    timestamp: number;
  }>;
  disconnect(): Promise<void>;
}

export abstract class BaseExchange implements Exchange {
  async fetchLatestCandle(symbol: string, interval: string): Promise<CandleData | null> {
    throw new Error('Method not implemented');
  }

  async getHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number
  ): Promise<CandleData[]> {
    throw new Error('Method not implemented');
  }

  async subscribeToKline(
    symbol: string,
    timeframe: string,
    callback: (symbol: string, candle: CandleData) => void
  ): Promise<() => void> {
    throw new Error('Method not implemented');
  }

  async placeOrder(order: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    leverage: number;
    price?: number;
  }): Promise<void> {
    throw new Error('Method not implemented');
  }

  async getPosition(symbol: string): Promise<{
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entryPrice: number;
    leverage: number;
  } | null> {
    throw new Error('Method not implemented');
  }

  async getBalance(): Promise<number> {
    throw new Error('Method not implemented');
  }

  async closePosition(symbol: string): Promise<void> {
    throw new Error('Method not implemented');
  }

  async disconnect(): Promise<void> {
    throw new Error('Method not implemented');
  }

  getRiskConfig(): {
    maxRiskPerTrade: number;
    maxLeverage: number;
    stopLossDistance: number;
    takeProfitDistance: number;
    trailingStopDistance: number;
    maxOpenPositions: number;
  } {
    return {
      maxRiskPerTrade: 0.02,
      maxLeverage: 10,
      stopLossDistance: 0.02,
      takeProfitDistance: 0.04,
      trailingStopDistance: 0.01,
      maxOpenPositions: 5
    };
  }
} 