import { expect, test, describe, beforeEach } from 'bun:test';
import { PaperExchange } from '../lib/exchange/paperExchange';
import { CandleData } from '../lib/technical/indicators';

describe('PaperExchange', () => {
  let exchange: PaperExchange;
  const testSymbol = 'BTC/USDT';
  const testInterval = '1m';

  beforeEach(() => {
    exchange = new PaperExchange();
  });

  test('should fetch latest candle', async () => {
    const candle = await exchange.fetchLatestCandle(testSymbol, testInterval);
    expect(candle).toBeDefined();
    if (candle) {
      expect(candle.timestamp).toBeDefined();
      expect(candle.symbol).toBe(testSymbol);
      expect(candle.open).toBeDefined();
      expect(candle.high).toBeDefined();
      expect(candle.low).toBeDefined();
      expect(candle.close).toBeDefined();
      expect(candle.volume).toBeDefined();
    }
  });

  test('should get historical data', async () => {
    const data = await exchange.getHistoricalData(testSymbol, testInterval, 10);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    if (data.length > 0) {
      expect(data[0].timestamp).toBeDefined();
      expect(data[0].symbol).toBe(testSymbol);
    }
  });

  test('should place and manage orders', async () => {
    // Place a buy order
    const order = await exchange.placeOrder({
      symbol: testSymbol,
      side: 'BUY',
      type: 'MARKET',
      size: 0.1
    });

    expect(order).toBeDefined();
    expect(order.side).toBe('BUY');
    expect(order.size).toBe(0.1);

    // Check position
    const position = await exchange.getPosition(testSymbol);
    expect(position).toBeDefined();
    if (position) {
      expect(position.side).toBe('LONG');
      expect(position.size).toBe(0.1);
    }

    // Close position
    await exchange.closePosition(testSymbol);
    const closedPosition = await exchange.getPosition(testSymbol);
    expect(closedPosition).toBeNull();
  });

  test('should subscribe to kline updates', async () => {
    const updates: CandleData[] = [];
    const unsubscribe = await exchange.subscribeToKline(
      testSymbol,
      testInterval,
      (candle) => updates.push(candle)
    );

    // Wait for a few updates
    await new Promise(resolve => setTimeout(resolve, 5000));

    unsubscribe();
    expect(updates.length).toBeGreaterThan(0);
    if (updates.length > 0) {
      expect(updates[0].timestamp).toBeDefined();
      expect(updates[0].symbol).toBe(testSymbol);
    }
  });

  test('should maintain balance', async () => {
    const initialBalance = await exchange.getBalance();
    expect(initialBalance).toBe(10000);

    // Place an order to test balance updates
    await exchange.placeOrder({
      symbol: testSymbol,
      side: 'BUY',
      type: 'MARKET',
      size: 0.1
    });

    const balance = await exchange.getBalance();
    expect(balance).toBeLessThanOrEqual(initialBalance);
  });
}); 