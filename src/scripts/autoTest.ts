import { Backtester, BacktestResult } from '../lib/backtest/backtester';
import { PPOStrategy } from '../lib/strategies/ppoStrategy';
import { RiskManager } from '../lib/risk/riskManager';
import { MarketAnalyzer } from '../lib/analysis/marketAnalyzer';
import { PaperExchange } from '../lib/exchange/paperExchange';
import { logInfo, logError } from '../lib/utils/logger';
import { getConfig } from '../lib/config';
import { CandleData } from '../lib/technical/indicators';
import { TechnicalIndicators } from '../lib/technical/technicalIndicators';
import { TradingBot } from '../lib/bot/tradingBot';

interface TestResult {
  backtest: BacktestResult;
  forwardTest: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    maxDrawdown: number;
  };
  accuracy: number;
}

export class AutoTester {
  private config = getConfig();
  private backtester: Backtester;
  private tradingBot: TradingBot;
  private marketAnalyzer: MarketAnalyzer;
  private strategy: PPOStrategy;
  private riskManager: RiskManager;
  private indicators: TechnicalIndicators;
  private exchange: PaperExchange;
  private minAccuracy: number = 0.7; // Minimum required accuracy between backtest and forward test
  private maxIterations: number = 10; // Maximum number of optimization iterations
  private currentIteration: number = 0;

  constructor() {
    this.exchange = new PaperExchange(this.config.initialCapital);
    this.marketAnalyzer = new MarketAnalyzer();
    this.strategy = new PPOStrategy();
    this.riskManager = new RiskManager(
      this.exchange.getRiskConfig(),
      this.config.initialCapital,
      this.marketAnalyzer
    );
    this.indicators = new TechnicalIndicators();
    this.tradingBot = new TradingBot(
      this.exchange,
      this.strategy,
      this.riskManager,
      this.marketAnalyzer,
      this.indicators
    );
  }

  async run(): Promise<void> {
    try {
      logInfo('Starting automated testing process...');
      
      while (this.currentIteration < this.maxIterations) {
        this.currentIteration++;
        logInfo(`Starting iteration ${this.currentIteration}`);

        // Step 1: Run backtest
        const backtestResult = await this.runBacktest();
        
        // Step 2: Run forward test
        const forwardTestResult = await this.runForwardTest();
        
        // Step 3: Calculate accuracy
        const accuracy = this.calculateAccuracy(backtestResult, forwardTestResult);
        
        // Step 4: Log results
        this.logResults(backtestResult, forwardTestResult, accuracy);
        
        // Step 5: Check if accuracy meets requirements
        if (accuracy >= this.minAccuracy) {
          logInfo('Target accuracy achieved! Stopping optimization.');
          break;
        }
        
        // Step 6: Optimize strategy
        await this.optimizeStrategy(backtestResult, forwardTestResult);
      }
      
      logInfo('Automated testing process completed');
    } catch (error) {
      logError(error as Error, 'AutoTester.run');
      throw error;
    }
  }

  private async runBacktest(): Promise<BacktestResult> {
    logInfo('Running backtest...');
    
    // Get historical data
    const now = new Date();
    const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate());
    
    const candles = new Map<string, CandleData[]>();
    for (const symbol of this.config.symbols) {
      const historicalData = await this.exchange.getHistoricalData(
        symbol,
        '1h',
        26280 // Approximately 3 years of hourly data
      );
      candles.set(symbol, historicalData);
    }

    // Initialize and run backtester
    this.backtester = new Backtester(
      this.strategy,
      this.riskManager,
      candles,
      this.marketAnalyzer,
      this.indicators
    );

    return await this.backtester.run();
  }

  private async runForwardTest(): Promise<TestResult['forwardTest']> {
    logInfo('Running forward test...');
    
    // Initialize forward test metrics
    const forwardTestResult = {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalPnL: 0,
      maxDrawdown: 0
    };

    // Run trading bot for a week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    await this.tradingBot.start();
    
    // Simulate one week of trading
    for (const symbol of this.config.symbols) {
      const candles = await this.exchange.getHistoricalData(
        symbol,
        '1h',
        168 // One week of hourly data
      );
      
      for (const candle of candles) {
        await this.tradingBot.handleKlineUpdate(candle);
      }
    }
    
    await this.tradingBot.stop();

    // Calculate forward test metrics
    const trades = this.tradingBot.getTrades();
    forwardTestResult.totalTrades = trades.length;
    forwardTestResult.winningTrades = trades.filter(t => t.pnl > 0).length;
    forwardTestResult.losingTrades = trades.filter(t => t.pnl <= 0).length;
    forwardTestResult.winRate = forwardTestResult.totalTrades > 0
      ? (forwardTestResult.winningTrades / forwardTestResult.totalTrades) * 100
      : 0;
    forwardTestResult.totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    
    // Calculate max drawdown
    let peak = 0;
    let currentBalance = this.config.initialCapital;
    for (const trade of trades) {
      currentBalance += trade.pnl;
      if (currentBalance > peak) {
        peak = currentBalance;
      }
      const drawdown = ((peak - currentBalance) / peak) * 100;
      if (drawdown > forwardTestResult.maxDrawdown) {
        forwardTestResult.maxDrawdown = drawdown;
      }
    }

    return forwardTestResult;
  }

  private calculateAccuracy(backtest: BacktestResult, forwardTest: TestResult['forwardTest']): number {
    // Calculate accuracy based on multiple metrics
    const metrics = [
      {
        name: 'winRate',
        backtest: backtest.winRate,
        forward: forwardTest.winRate,
        weight: 0.4
      },
      {
        name: 'totalPnL',
        backtest: backtest.totalPnL,
        forward: forwardTest.totalPnL,
        weight: 0.3
      },
      {
        name: 'maxDrawdown',
        backtest: backtest.maxDrawdown,
        forward: forwardTest.maxDrawdown,
        weight: 0.3
      }
    ];

    let totalAccuracy = 0;
    let totalWeight = 0;

    for (const metric of metrics) {
      const accuracy = 1 - Math.abs(metric.backtest - metric.forward) / Math.max(metric.backtest, metric.forward);
      totalAccuracy += accuracy * metric.weight;
      totalWeight += metric.weight;
    }

    return totalAccuracy / totalWeight;
  }

  private async optimizeStrategy(backtestResult: BacktestResult, forwardTestResult: TestResult['forwardTest']): Promise<void> {
    logInfo('Optimizing strategy...');
    
    // Adjust strategy parameters based on performance
    await this.strategy.optimize({
      backtest: backtestResult,
      forwardTest: forwardTestResult
    });
  }

  private logResults(backtest: BacktestResult, forwardTest: TestResult['forwardTest'], accuracy: number): void {
    logInfo('Test Results', {
      iteration: this.currentIteration,
      accuracy: `${(accuracy * 100).toFixed(2)}%`,
      backtest: {
        totalTrades: backtest.totalTrades,
        winRate: `${backtest.winRate.toFixed(2)}%`,
        totalPnL: `$${backtest.totalPnL.toFixed(2)}`,
        maxDrawdown: `${backtest.maxDrawdown.toFixed(2)}%`
      },
      forwardTest: {
        totalTrades: forwardTest.totalTrades,
        winRate: `${forwardTest.winRate.toFixed(2)}%`,
        totalPnL: `$${forwardTest.totalPnL.toFixed(2)}`,
        maxDrawdown: `${forwardTest.maxDrawdown.toFixed(2)}%`
      }
    });
  }
}

// Run the automated testing process
const autoTester = new AutoTester();
autoTester.run().catch(error => {
  logError(error as Error, 'autoTest');
  process.exit(1);
}); 