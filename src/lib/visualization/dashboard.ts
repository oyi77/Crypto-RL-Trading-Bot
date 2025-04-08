import { Indicators } from '../technical/technicalIndicators';
import { TradingState } from '../rl/tradingEnvironment';
import { logInfo } from '../utils/logger';
import * as express from 'express';
import * as WebSocket from 'ws';
import * as path from 'path';

export class Dashboard {
  private app: express.Application;
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();
  private metrics: {
    indicators: Indicators | null;
    state: TradingState | null;
    performance: {
      balance: number;
      equity: number;
      drawdown: number;
      winRate: number;
      tradeCount: number;
    };
    rlMetrics: {
      epsilon: number;
      bufferSize: number;
      agentCount: number;
    };
  } = {
    indicators: null,
    state: null,
    performance: {
      balance: 0,
      equity: 0,
      drawdown: 0,
      winRate: 0,
      tradeCount: 0
    },
    rlMetrics: {
      epsilon: 0,
      bufferSize: 0,
      agentCount: 0
    }
  };

  constructor(port: number = 3000) {
    this.app = express();
    this.wss = new WebSocket.Server({ port: port + 1 });

    this.setupExpress();
    this.setupWebSocket();
  }

  private setupExpress(): void {
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // API endpoints
    this.app.get('/api/metrics', (req, res) => {
      res.json(this.metrics);
    });

    this.app.get('/api/indicators', (req, res) => {
      res.json(this.metrics.indicators);
    });

    this.app.get('/api/performance', (req, res) => {
      res.json(this.metrics.performance);
    });

    this.app.get('/api/rl-metrics', (req, res) => {
      res.json(this.metrics.rlMetrics);
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);
      ws.send(JSON.stringify({ type: 'init', data: this.metrics }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });
  }

  updateMetrics(data: {
    indicators?: Indicators;
    state?: TradingState;
    performance?: {
      balance: number;
      equity: number;
      drawdown: number;
      winRate: number;
      tradeCount: number;
    };
    rlMetrics?: {
      epsilon: number;
      bufferSize: number;
      agentCount: number;
    };
  }): void {
    if (data.indicators) this.metrics.indicators = data.indicators;
    if (data.state) this.metrics.state = data.state;
    if (data.performance) this.metrics.performance = data.performance;
    if (data.rlMetrics) this.metrics.rlMetrics = data.rlMetrics;

    // Broadcast updates to all connected clients
    this.broadcastUpdate();
  }

  private broadcastUpdate(): void {
    const message = JSON.stringify({ type: 'update', data: this.metrics });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  start(): void {
    this.app.listen(3000, () => {
      logInfo('Dashboard server started', { port: 3000 });
    });
  }
} 