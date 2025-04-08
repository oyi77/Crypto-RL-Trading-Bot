import { TradingBot } from '../lib/bot/tradingBot';
import { PaperExchange } from '../lib/exchange/paperExchange';
import { DefaultStrategy } from '../lib/strategies/defaultStrategy';
import { MarketAnalyzer } from '../lib/analysis/marketAnalyzer';
import { RiskManager } from '../lib/risk/riskManager';
import { logInfo, logError } from '../lib/utils/logger';
import { getConfig } from '../lib/config';

async function runPaperTrading() {
  try {
    // Get config
    const config = getConfig();
    const symbol = config.tradingPairs[0] || 'BTCUSDT';
    const timeframe = config.timeframe || '1m';
    const initialBalance = config.initialBalance || 10000;

    // Initialize components
    const exchange = new PaperExchange(initialBalance);
    const strategy = new DefaultStrategy();
    const marketAnalyzer = new MarketAnalyzer();
    const riskManager = new RiskManager({
      maxRiskPerTrade: config.maxRiskPerTrade,
      maxLeverage: config.maxLeverage,
      maxOpenPositions: config.maxOpenPositions,
      stopLossDistance: config.stopLossDistance,
      takeProfitDistance: config.takeProfitDistance,
      trailingStopDistance: config.trailingStopDistance
    });

    // Connect to exchange
    await exchange.connect();

    // Create and start trading bot
    const bot = new TradingBot(
      exchange,
      strategy,
      marketAnalyzer,
      riskManager,
      initialBalance,
      symbol,
      timeframe
    );

    // Subscribe to bot events
    bot.on('signal', (signal) => {
      logInfo('Trading Signal', signal);
    });

    bot.on('metrics', (metrics) => {
      logInfo('Trading Metrics', metrics);
    });

    // Start the bot
    await bot.start();

    // Handle shutdown
    process.on('SIGINT', async () => {
      logInfo('Stopping trading bot...');
      bot.stop();
      process.exit(0);
    });

    // Log portfolio metrics every 5 minutes
    setInterval(() => {
      const metrics = bot.getPortfolioMetrics();
      logInfo('Portfolio Metrics', {
        totalValue: metrics.totalValue,
        unrealizedPnL: metrics.unrealizedPnL,
        realizedPnL: metrics.realizedPnL,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown
      });
    }, 5 * 60 * 1000);
  } catch (error) {
    logError(error as Error, 'runPaperTrading');
  }
}

runPaperTrading(); 