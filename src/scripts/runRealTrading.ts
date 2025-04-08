import { TradingBot } from '../lib/bot/tradingBot';
import { BinanceExchange } from '../lib/exchange/binanceExchange';
import { logInfo, logError } from '../lib/utils/logger';
import { getConfig } from '../lib/config';

async function runRealTrading() {
  try {
    // Initialize Binance exchange with API credentials
    const exchange = new BinanceExchange({
      apiKey: process.env.BINANCE_API_KEY!,
      apiSecret: process.env.BINANCE_API_SECRET!,
      testnet: false // Set to true for testnet trading
    });
    
    // Get configuration
    const config = getConfig();
    
    // Create and start trading bot
    const bot = new TradingBot(config, exchange);
    await bot.start();

    // Keep the script running
    process.on('SIGINT', async () => {
      logInfo('Stopping trading bot...');
      await bot.stop();
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
    logError(error as Error, 'runRealTrading');
    process.exit(1);
  }
}

// Run the real trading bot
runRealTrading(); 