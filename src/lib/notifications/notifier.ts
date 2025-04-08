import { Position } from '../portfolio/portfolioManager';
import { logInfo, logError } from '../utils/logger';

export class Notifier {
  async notifyBotStarted(): Promise<void> {
    try {
      logInfo('Trading bot started');
    } catch (error) {
      logError(error as Error, 'Notifier.notifyBotStarted');
    }
  }

  async notifyBotStopped(): Promise<void> {
    try {
      logInfo('Trading bot stopped');
    } catch (error) {
      logError(error as Error, 'Notifier.notifyBotStopped');
    }
  }

  async notifyPositionOpened(position: Position): Promise<void> {
    try {
      logInfo('Position opened', {
        symbol: position.symbol,
        side: position.side,
        size: position.size,
        entryPrice: position.entryPrice,
        leverage: position.leverage
      });
    } catch (error) {
      logError(error as Error, 'Notifier.notifyPositionOpened');
    }
  }

  async notifyPositionClosed(
    symbol: string,
    pnl: number,
    reason?: string
  ): Promise<void> {
    try {
      logInfo('Position closed', {
        symbol,
        pnl,
        reason
      });
    } catch (error) {
      logError(error as Error, 'Notifier.notifyPositionClosed');
    }
  }

  async notifyError(error: Error): Promise<void> {
    try {
      logError(error, 'TradingBot');
    } catch (err) {
      logError(err as Error, 'Notifier.notifyError');
    }
  }
} 