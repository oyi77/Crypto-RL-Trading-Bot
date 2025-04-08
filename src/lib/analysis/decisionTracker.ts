import { logInfo } from '../utils/logger';

export interface TradingDecision {
  timestamp: number;
  symbol: string;
  action: 'LONG' | 'SHORT' | 'CLOSE';
  price: number;
  size: number;
  reason: string;
  confidence: number;
  marketState: {
    trend: string;
    volatility: number;
    volume: number;
  };
}

export interface DecisionOutcome {
  decision: TradingDecision;
  actualPrice: number;
  pnl: number;
  duration: number;
  wasCorrect: boolean;
}

export interface DecisionSummary {
  totalDecisions: number;
  correctDecisions: number;
  totalTrades: number;
  longTrades: number;
  shortTrades: number;
  totalPnL: number;
  averageDecisionConfidence: number;
  averageTradeDuration: number;
  accuracyBySymbol: Record<string, number>;
  accuracyByMarketState: Record<string, number>;
}

export class DecisionTracker {
  private decisions: TradingDecision[] = [];
  private outcomes: DecisionOutcome[] = [];
  private currentPositions: Map<string, TradingDecision> = new Map();

  addDecision(decision: TradingDecision) {
    this.decisions.push(decision);
    
    if (decision.action === 'LONG' || decision.action === 'SHORT') {
      this.currentPositions.set(decision.symbol, decision);
    } else if (decision.action === 'CLOSE') {
      this.currentPositions.delete(decision.symbol);
    }
  }

  addOutcome(outcome: DecisionOutcome) {
    this.outcomes.push(outcome);
  }

  getSummary(): DecisionSummary {
    const summary: DecisionSummary = {
      totalDecisions: this.decisions.length,
      correctDecisions: this.outcomes.filter(o => o.wasCorrect).length,
      totalTrades: this.outcomes.length,
      longTrades: this.outcomes.filter(o => o.decision.action === 'LONG').length,
      shortTrades: this.outcomes.filter(o => o.decision.action === 'SHORT').length,
      totalPnL: this.outcomes.reduce((sum, o) => sum + o.pnl, 0),
      averageDecisionConfidence: this.decisions.reduce((sum, d) => sum + d.confidence, 0) / this.decisions.length,
      averageTradeDuration: this.outcomes.reduce((sum, o) => sum + o.duration, 0) / this.outcomes.length,
      accuracyBySymbol: {},
      accuracyByMarketState: {}
    };

    // Calculate accuracy by symbol
    const symbolGroups = this.outcomes.reduce((acc, o) => {
      if (!acc[o.decision.symbol]) {
        acc[o.decision.symbol] = { total: 0, correct: 0 };
      }
      acc[o.decision.symbol].total++;
      if (o.wasCorrect) acc[o.decision.symbol].correct++;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    for (const [symbol, stats] of Object.entries(symbolGroups)) {
      summary.accuracyBySymbol[symbol] = stats.correct / stats.total;
    }

    // Calculate accuracy by market state
    const marketStateGroups = this.outcomes.reduce((acc, o) => {
      const state = `${o.decision.marketState.trend}-${o.decision.marketState.volatility > 0.5 ? 'high' : 'low'}-vol`;
      if (!acc[state]) {
        acc[state] = { total: 0, correct: 0 };
      }
      acc[state].total++;
      if (o.wasCorrect) acc[state].correct++;
      return acc;
    }, {} as Record<string, { total: number; correct: number }>);

    for (const [state, stats] of Object.entries(marketStateGroups)) {
      summary.accuracyByMarketState[state] = stats.correct / stats.total;
    }

    return summary;
  }

  logSummary() {
    const summary = this.getSummary();
    
    logInfo('Trading Decision Summary', {
      'Total Decisions': summary.totalDecisions,
      'Correct Decisions': summary.correctDecisions,
      'Decision Accuracy': `${(summary.correctDecisions / summary.totalDecisions * 100).toFixed(2)}%`,
      'Total Trades': summary.totalTrades,
      'Long Trades': summary.longTrades,
      'Short Trades': summary.shortTrades,
      'Total PnL': `$${summary.totalPnL.toFixed(2)}`,
      'Average Decision Confidence': `${(summary.averageDecisionConfidence * 100).toFixed(2)}%`,
      'Average Trade Duration': `${(summary.averageTradeDuration / 1000 / 60).toFixed(2)} minutes`,
      'Accuracy by Symbol': summary.accuracyBySymbol,
      'Accuracy by Market State': summary.accuracyByMarketState
    });
  }
} 