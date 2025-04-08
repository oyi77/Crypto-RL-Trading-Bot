import express from 'express';
import { Server } from 'socket.io';
import { createServer as createHttpServer } from 'http';
import { logInfo } from '../utils/logger';
import { TradingBot } from '../bot/tradingBot';
import { AutoTester } from '../../scripts/autoTest';
import { PaperExchange } from '../exchange/paperExchange';
import { PPOStrategy } from '../strategies/ppoStrategy';
import { RLAgent } from '../rl/rlAgent';

interface DashboardServer {
  tradingBot: TradingBot;
  autoTester: AutoTester;
  exchange: PaperExchange;
  strategy: PPOStrategy;
  rlAgent: RLAgent;
}

export async function createServer({
  tradingBot,
  autoTester,
  exchange,
  strategy,
  rlAgent
}: DashboardServer) {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer);

  // Serve static files
  app.use(express.static('public'));

  // API endpoints
  app.get('/api/status', (req, res) => {
    res.json({
      botStatus: tradingBot.getStatus(),
      exchangeStatus: exchange.getStatus(),
      strategyStatus: strategy.getStatus(),
      rlStatus: rlAgent.getMetrics()
    });
  });

  app.get('/api/trades', (req, res) => {
    res.json(tradingBot.getTrades());
  });

  app.get('/api/signals', (req, res) => {
    res.json(tradingBot.getSignals());
  });

  app.get('/api/performance', (req, res) => {
    res.json({
      backtest: autoTester.getBacktestResults(),
      forwardTest: autoTester.getForwardTestResults(),
      accuracy: autoTester.getAccuracy()
    });
  });

  // WebSocket events
  io.on('connection', (socket) => {
    logInfo('Dashboard client connected');

    // Send initial data
    socket.emit('status', {
      botStatus: tradingBot.getStatus(),
      exchangeStatus: exchange.getStatus(),
      strategyStatus: strategy.getStatus(),
      rlStatus: rlAgent.getMetrics()
    });

    socket.emit('trades', tradingBot.getTrades());
    socket.emit('signals', tradingBot.getSignals());
    socket.emit('performance', {
      backtest: autoTester.getBacktestResults(),
      forwardTest: autoTester.getForwardTestResults(),
      accuracy: autoTester.getAccuracy()
    });

    // Listen for trading bot events
    tradingBot.on('signal', (signal) => {
      socket.emit('signal', signal);
    });

    tradingBot.on('trade', (trade) => {
      socket.emit('trade', trade);
    });

    tradingBot.on('error', (error) => {
      socket.emit('error', error);
    });

    // Listen for auto tester events
    autoTester.on('backtestComplete', (results) => {
      socket.emit('backtestComplete', results);
    });

    autoTester.on('forwardTestComplete', (results) => {
      socket.emit('forwardTestComplete', results);
    });

    autoTester.on('optimizationComplete', (results) => {
      socket.emit('optimizationComplete', results);
    });

    socket.on('disconnect', () => {
      logInfo('Dashboard client disconnected');
    });
  });

  return {
    listen: async (port: number) => {
      return new Promise<void>((resolve) => {
        httpServer.listen(port, () => {
          logInfo(`Dashboard server listening on port ${port}`);
          resolve();
        });
      });
    }
  };
} 