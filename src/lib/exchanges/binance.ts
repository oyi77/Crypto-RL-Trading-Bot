import WebSocket from 'ws';
import axios from 'axios';
import { EventEmitter } from 'events';

export interface BinanceConfig {
  apiKey?: string;
  apiSecret?: string;
  testnet?: boolean;
}

export interface BinanceMarketData {
  symbol: string;
  price: string;
  timestamp: number;
}

export class BinanceExchange extends EventEmitter {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private wsUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private isConnected: boolean = false;

  constructor(config: BinanceConfig = {}) {
    super();
    this.baseUrl = config.testnet 
      ? 'https://testnet.binance.vision/api/v3'
      : 'https://api.binance.com/api/v3';
    this.wsUrl = config.testnet
      ? 'wss://testnet.binance.vision/ws'
      : 'wss://stream.binance.com:9443/ws';
    this.apiKey = config.apiKey || '';
    this.apiSecret = config.apiSecret || '';
  }

  async connect() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.on('open', () => {
        this.isConnected = true;
        this.emit('connected');
      });

      this.ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.emit('message', message);
        } catch (error) {
          this.emit('error', error);
        }
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        this.emit('disconnected');
      });

    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async subscribeToTicker(symbol: string) {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }

    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: [`${symbol.toLowerCase()}@ticker`],
      id: Date.now()
    };

    this.ws.send(JSON.stringify(subscribeMessage));
  }

  async getMarketData(symbol: string): Promise<BinanceMarketData> {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch market data: ${error.message}`);
    }
  }

  async getKlines(symbol: string, interval: string, limit: number = 500) {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol,
          interval,
          limit
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch klines: ${error.message}`);
    }
  }

  isConnected(): boolean {
    return this.isConnected;
  }
} 