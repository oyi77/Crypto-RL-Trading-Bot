import { TradingBot } from './lib/bot/tradingBot';
import { PaperExchange } from './lib/exchange/paperExchange';
import { PPOStrategy } from './lib/strategies/ppoStrategy';
import { MarketAnalyzer } from './lib/analysis/marketAnalyzer';
import { RiskManager } from './lib/risk/riskManager';
import { DashboardServer } from './lib/visualization/dashboardServer';
import { logInfo, logError } from './lib/utils/logger';

async function main() {
  try {
    // Initialize components
    const exchange = new PaperExchange();
    const strategy = new PPOStrategy();
    const marketAnalyzer = new MarketAnalyzer();
    const riskManager = new RiskManager();
    const dashboardServer = new DashboardServer();

    // Create trading bot
    const bot = new TradingBot({
      exchange,
      strategy,
      marketAnalyzer,
      riskManager,
      initialBalance: 10000,
      tradingPair: 'BTC/USDT',
      timeframe: '1m'
    });

    // Set up event listeners
    bot.on('signal', (signal) => {
      logInfo(`Signal: ${signal.action} with confidence ${signal.confidence}`);
      dashboardServer.sendSignal(signal);
    });

    bot.on('metrics', (metrics) => {
      dashboardServer.sendUpdate({
        performance: {
          balance: metrics.balance,
          equity: metrics.equity,
          drawdown: metrics.drawdown,
          winRate: metrics.winRate,
          tradeCount: metrics.tradeCount
        },
        rlMetrics: {
          epsilon: metrics.epsilon,
          bufferSize: metrics.bufferSize,
          agentCount: metrics.agentCount
        },
        state: {
          price: metrics.currentPrice
        },
        indicators: metrics.indicators
      });
    });

    // Start the bot
    await bot.start();

    // Handle shutdown
    process.on('SIGINT', async () => {
      logInfo('Shutting down...');
      await bot.stop();
      process.exit(0);
    });

  } catch (error) {
    logError(error as Error, 'main');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error starting bot:', error);
  process.exit(1);
}); 