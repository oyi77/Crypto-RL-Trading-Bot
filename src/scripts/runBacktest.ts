import { PaperExchange } from '../../lib/exchange/paperExchange';
import { TradingBot } from '../../lib/bot/tradingBot';
import { MarketAnalyzer } from '../../lib/analysis/marketAnalyzer';
import { RiskManager } from '../../lib/risk/riskManager';
import { logInfo } from '../../lib/utils/logger';

async function runBacktest() {
    try {
        logInfo('Starting backtest...');

        // Initialize components
        const exchange = new PaperExchange();
        const marketAnalyzer = new MarketAnalyzer();
        const riskManager = new RiskManager();
        const bot = new TradingBot(exchange, marketAnalyzer, riskManager);

        // Load historical data
        const historicalData = await exchange.getHistoricalData('BTC/USDT', '1m', 1000);
        logInfo(`Loaded ${historicalData.length} historical data points`);

        // Run backtest
        let totalPnL = 0;
        let winCount = 0;
        let lossCount = 0;

        for (const data of historicalData) {
            const signal = await bot.analyzeMarket(data);
            if (signal.type !== 'HOLD') {
                const result = await bot.executeTrade(signal);
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
        console.error('Backtest failed:', error);
    }
}

runBacktest(); 