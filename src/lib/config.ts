import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  // Trading configuration
  tradingPairs: string[];
  timeframe: string;
  initialBalance: number;

  // Risk management
  maxRiskPerTrade: number;
  maxLeverage: number;
  maxOpenPositions: number;
  stopLossDistance: number;
  takeProfitDistance: number;
  trailingStopDistance: number;

  // Training configuration
  batchSize: number;
  epochs: number;
  validationSplit: number;
  minTrades: number;
  minWinRate: number;
  maxDrawdown: number;
  retrainInterval: number;

  // Strategy configuration
  learningRate: number;
  gamma: number;
  epsilon: number;
  epsilonMin: number;
  epsilonDecay: number;
}

export function getConfig(): Config {
  return {
    // Trading configuration
    tradingPairs: (process.env.TRADING_PAIRS || 'BTCUSDT').split(','),
    timeframe: process.env.TIMEFRAME || '1m',
    initialBalance: Number(process.env.INITIAL_CAPITAL) || 10000,

    // Risk management
    maxRiskPerTrade: Number(process.env.MAX_RISK_PER_TRADE) || 0.02,
    maxLeverage: Number(process.env.MAX_LEVERAGE) || 1,
    maxOpenPositions: Number(process.env.MAX_OPEN_POSITIONS) || 1,
    stopLossDistance: Number(process.env.STOP_LOSS_DISTANCE) || 0.02,
    takeProfitDistance: Number(process.env.TAKE_PROFIT_DISTANCE) || 0.04,
    trailingStopDistance: Number(process.env.TRAILING_STOP_DISTANCE) || 0.01,

    // Training configuration
    batchSize: Number(process.env.BATCH_SIZE) || 32,
    epochs: Number(process.env.EPOCHS) || 10,
    validationSplit: Number(process.env.VALIDATION_SPLIT) || 0.2,
    minTrades: Number(process.env.MIN_TRADES) || 50,
    minWinRate: Number(process.env.MIN_WIN_RATE) || 0.55,
    maxDrawdown: Number(process.env.MAX_DRAWDOWN) || 0.2,
    retrainInterval: Number(process.env.RETRAIN_INTERVAL) || 3600000,

    // Strategy configuration
    learningRate: Number(process.env.LEARNING_RATE) || 0.001,
    gamma: Number(process.env.GAMMA) || 0.99,
    epsilon: Number(process.env.EPSILON) || 1.0,
    epsilonMin: Number(process.env.EPSILON_MIN) || 0.01,
    epsilonDecay: Number(process.env.EPSILON_DECAY) || 0.995
  };
} 