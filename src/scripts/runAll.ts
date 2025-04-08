import { PaperExchange } from '../../lib/exchange/paperExchange';
import { TradingBot } from '../../lib/bot/tradingBot';
import { MarketAnalyzer } from '../../lib/analysis/marketAnalyzer';
import { RiskManager } from '../../lib/risk/riskManager';
import { logInfo, logError } from '../../lib/utils/logger';

class TradingSystem {
  private exchange: PaperExchange;
  private marketAnalyzer: MarketAnalyzer;
  private riskManager: RiskManager;
  private bot: TradingBot;
  private isRunning: boolean = false;
  private mode: 'backtest' | 'paper' | 'real' = 'paper';

  constructor(mode: 'backtest' | 'paper' | 'real' = 'paper') {
    this.mode = mode;
    this.exchange = new PaperExchange();
    this.marketAnalyzer = new MarketAnalyzer();
    this.riskManager = new RiskManager();
    this.bot = new TradingBot(this.exchange, this.marketAnalyzer, this.riskManager);
  }

  async start() {
    try {
      this.isRunning = true;
      logInfo(`Starting trading system in ${this.mode} mode`);

      // Connect to exchange
      await this.exchange.connect();
      logInfo('Exchange connected successfully');

      // Start the bot
      await this.bot.start();

      if (this.mode === 'backtest') {
        await this.runBacktest();
      } else {
        await this.runLiveTrading();
      }
    } catch (error) {
      logError(error as Error, 'TradingSystem.start');
    }
  }

  private async runBacktest() {
    try {
      logInfo('Starting backtest...');

      // Load historical data
      const historicalData = await this.exchange.getHistoricalData('BTC/USDT', '1m', 1000);
      logInfo(`Loaded ${historicalData.length} historical data points`);

      // Run backtest
      let totalPnL = 0;
      let winCount = 0;
      let lossCount = 0;

      for (const data of historicalData) {
        const signal = await this.bot.analyzeMarket(data);
        if (signal.type !== 'HOLD') {
          const result = await this.bot.executeTrade(signal);
          totalPnL += result.pnl;
          if (result.pnl > 0) winCount++;
          else if (result.pnl < 0) lossCount++;
        }
      }

      // Log results
      logInfo('Backtest Results:', {
        totalPnL,
        winRate: winCount / (winCount + lossCount),
        totalTrades: winCount + lossCount,
        averagePnL: totalPnL / (winCount + lossCount)
      });

    } catch (error) {
      logError(error as Error, 'TradingSystem.runBacktest');
    }
  }

  private async runLiveTrading() {
    try {
      logInfo('Starting live trading...');

      while (this.isRunning) {
        try {
          // Get latest market data
          const marketData = await this.exchange.getMarketData('BTC/USDT');
          
          // Analyze market and execute trades
          const signal = await this.bot.analyzeMarket(marketData);
          if (signal.type !== 'HOLD') {
            await this.bot.executeTrade(signal);
          }

          // Wait for next iteration
          await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute
        } catch (error) {
          logError(error as Error, 'TradingSystem.runLiveTrading');
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 60000));
        }
      }
    } catch (error) {
      logError(error as Error, 'TradingSystem.runLiveTrading');
    }
  }

  stop() {
    this.isRunning = false;
    logInfo('Trading system stopped');
  }
}

// Parse command line arguments
const mode = process.argv[2] as 'backtest' | 'paper' | 'real' || 'paper';

// Create and start the trading system
const system = new TradingSystem(mode);
system.start();

// Handle process termination
process.on('SIGINT', () => {
  system.stop();
  process.exit(0);
}); 