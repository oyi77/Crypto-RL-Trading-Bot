import { WebSocket } from 'ws';
import { logInfo } from '../utils/logger';
import { MarketData } from '../../types/trading';

type WebSocketCallback = (data: MarketData) => void;

export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, WebSocketCallback[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket('wss://fstream.binance.com/ws');

      this.ws.onopen = () => {
        logInfo('WebSocket connected');
        this.reconnectAttempts = 0;
        this.subscribeToAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.e === '24hrMiniTicker') {
            const marketData: MarketData = {
              symbol: message.s,
              price: parseFloat(message.c),
              timestamp: message.E,
              volume: parseFloat(message.v),
              high: parseFloat(message.h),
              low: parseFloat(message.l)
            };

            const callbacks = this.subscribers.get(message.s);
            if (callbacks) {
              callbacks.forEach(callback => callback(marketData));
            }
          }
        } catch (error) {
          logInfo('Error parsing WebSocket message', { error });
        }
      };

      this.ws.onclose = () => {
        logInfo('WebSocket disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        logInfo('WebSocket error', { error });
        this.reconnect();
      };
    } catch (error) {
      logInfo('Error creating WebSocket connection', { error });
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        logInfo(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private subscribeToAll() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const symbols = Array.from(this.subscribers.keys());
      if (symbols.length > 0) {
        const subscribeMsg = {
          method: 'SUBSCRIBE',
          params: symbols.map(s => `${s.toLowerCase()}@miniTicker@arr`),
          id: Date.now()
        };
        this.ws.send(JSON.stringify(subscribeMsg));
      }
    }
  }

  subscribe(symbol: string, callback: WebSocketCallback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, []);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const subscribeMsg = {
          method: 'SUBSCRIBE',
          params: [`${symbol.toLowerCase()}@miniTicker@arr`],
          id: Date.now()
        };
        this.ws.send(JSON.stringify(subscribeMsg));
      }
    }
    this.subscribers.get(symbol)?.push(callback);
  }

  unsubscribe(symbol: string, callback: WebSocketCallback) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      if (callbacks.length === 0) {
        this.subscribers.delete(symbol);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          const unsubscribeMsg = {
            method: 'UNSUBSCRIBE',
            params: [`${symbol.toLowerCase()}@miniTicker@arr`],
            id: Date.now()
          };
          this.ws.send(JSON.stringify(unsubscribeMsg));
        }
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
} 