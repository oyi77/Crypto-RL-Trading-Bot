import { BaseExchange } from './exchange';
import { CandleData } from '../technical/indicators';
import { logInfo } from '../utils/logger';
import ccxt from 'ccxt';
import { TradingPair, MarketData } from '../../types/trading';
import { BinanceWebSocket } from '../services/binanceWebSocket';

export class PaperExchange extends BaseExchange {
  private exchange: ccxt.Exchange;
  private webSocket: BinanceWebSocket;
  private historicalData: Map<string, CandleData[]> = new Map();
  private currentIndex: Map<string, number> = new Map();
  private positions: Map<string, {
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entryPrice: number;
    leverage: number;
  }> = new Map();
  private balance: number;
  private marketData: Record<string, MarketData>;
  private marketDataCallbacks: Map<string, ((data: MarketData) => void)[]> = new Map();

  constructor(initialBalance: number = 10000) {
    super();
    this.balance = initialBalance;
    this.exchange = new ccxt.binance({
      enableRateLimit: true,
    });
    this.webSocket = new BinanceWebSocket();
    this.marketData = {};
  }

  async connect(): Promise<void> {
    await this.exchange.loadMarkets();
    logInfo('Paper exchange connected successfully');
  }

  async getTradingPairs(): Promise<TradingPair[]> {
    try {
      const markets = await this.exchange.loadMarkets();
      return Object.values(markets)
        .filter(market => market.quote === 'USDT')
        .map(market => ({
          symbol: market.symbol,
          baseAsset: market.base,
          quoteAsset: market.quote,
          price: 0,
          priceChange24h: 0,
          volume24h: 0
        }));
    } catch (error) {
      logInfo('Error fetching trading pairs', { error });
      return [];
    }
  }

  async getMarketData(symbol: string): Promise<MarketData> {
    return new Promise((resolve) => {
      const callback = (data: MarketData) => {
        this.marketData[symbol] = data;
        resolve(data);
        this.webSocket.unsubscribe(symbol, callback);
      };

      if (!this.marketDataCallbacks.has(symbol)) {
        this.marketDataCallbacks.set(symbol, []);
      }
      this.marketDataCallbacks.get(symbol)?.push(callback);
      this.webSocket.subscribe(symbol, callback);

      // Return cached data if available
      if (this.marketData[symbol]) {
        resolve(this.marketData[symbol]);
      }
    });
  }

  async getBalance(): Promise<number> {
    return this.balance;
  }

  async setBalance(amount: number): Promise<void> {
    this.balance = amount;
  }

  async getPosition(symbol: string): Promise<{
    symbol: string;
    side: 'LONG' | 'SHORT';
    size: number;
    entryPrice: number;
    leverage: number;
  } | null> {
    return this.positions.get(symbol) || null;
  }

  async setPosition(symbol: string, amount: number): Promise<void> {
    const position = this.positions.get(symbol);
    if (position) {
      position.size = amount;
    } else {
      this.positions.set(symbol, {
        symbol,
        side: 'LONG',
        size: amount,
        entryPrice: 0,
        leverage: 1
      });
    }
  }

  async executeTrade(symbol: string, type: 'buy' | 'sell', amount: number, price: number): Promise<void> {
    const position = this.positions.get(symbol);
    if (!position) {
      throw new Error('Position not found');
    }

    const cost = amount * price;
    if (type === 'buy') {
      this.balance -= cost;
      position.size += amount;
    } else {
      this.balance += cost;
      position.size -= amount;
    }
  }

  async disconnect(): Promise<void> {
    this.webSocket.disconnect();
    // Clean up market data callbacks
    this.marketDataCallbacks.clear();
  }
} 