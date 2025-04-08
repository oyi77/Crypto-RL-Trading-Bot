import { TradingSignal } from '../../types/trading';

export const availablePairs = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'ADA/USDT',
  'SOL/USDT',
  'DOT/USDT',
  'DOGE/USDT',
  'AVAX/USDT',
  'MATIC/USDT',
  'LINK/USDT'
];

export const mockTradingSignal: TradingSignal = {
  timestamp: Date.now(),
  pair: 'BTC/USDT',
  type: 'LONG',
  entry: 83468.29,
  stopLoss: 81154.29,
  takeProfit: 88096.29,
  exchange: 'binance',
  leverage: 10,
  capital: 100,
  technicalAnalysis: {
    emaStatus: 'EMA 12 > EMA 26 = bullish',
    candlestickPattern: 'Bullish Engulfing',
    macd: 'MACD above signal = bullish',
    volumeInsight: 'Rising volume = trend confirmation',
    rsi: 'RSI 65 = bullish',
    supportResistance: 'S: $81,154.29, R: $88,096.29'
  }
};
