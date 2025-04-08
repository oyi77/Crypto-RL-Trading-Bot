import axios from 'axios';
import { logError, logInfo } from './logger';

export interface NotificationConfig {
  telegram?: {
    botToken: string;
    chatId: string;
  };
  discord?: {
    webhookUrl: string;
  };
}

export class Notifier {
  private config: any;

  constructor(config: any = {}) {
    this.config = config;
  }

  async sendTelegramMessage(message: string): Promise<void> {
    if (!this.config.telegram) return;

    try {
      const url = `https://api.telegram.org/bot${this.config.telegram.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.config.telegram.chatId,
        text: message,
        parse_mode: 'HTML'
      });
      logInfo('Telegram message sent', { message });
    } catch (error) {
      logError(error as Error, 'Notifier.sendTelegramMessage');
    }
  }

  async sendDiscordMessage(message: string): Promise<void> {
    if (!this.config.discord) return;

    try {
      await axios.post(this.config.discord.webhookUrl, {
        content: message
      });
      logInfo('Discord message sent', { message });
    } catch (error) {
      logError(error as Error, 'Notifier.sendDiscordMessage');
    }
  }

  async notifyPositionOpened(position: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    size: number;
    leverage: number;
  }): Promise<void> {
    const message = `
🚀 <b>Position Opened</b>
Symbol: ${position.symbol}
Side: ${position.side}
Entry: ${position.entryPrice}
Stop Loss: ${position.stopLoss}
Take Profit: ${position.takeProfit}
Size: ${position.size}
Leverage: ${position.leverage}x
    `.trim();

    await Promise.all([
      this.sendTelegramMessage(message),
      this.sendDiscordMessage(message.replace(/<b>|<\/b>/g, '**'))
    ]);
  }

  async notifyPositionClosed(position: {
    symbol: string;
    side: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number;
    size: number;
    leverage: number;
  }): Promise<void> {
    const pnl = position.side === 'LONG'
      ? (position.exitPrice - position.entryPrice) * position.size
      : (position.entryPrice - position.exitPrice) * position.size;
    const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;

    const message = `
📊 <b>Position Closed</b>
Symbol: ${position.symbol}
Side: ${position.side}
Entry: ${position.entryPrice}
Exit: ${position.exitPrice}
Size: ${position.size}
Leverage: ${position.leverage}x
P&L: ${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)
    `.trim();

    await Promise.all([
      this.sendTelegramMessage(message),
      this.sendDiscordMessage(message.replace(/<b>|<\/b>/g, '**'))
    ]);
  }

  async notifyError(error: Error): Promise<void> {
    logError(error, 'TradingBot');
  }

  async notifySignal(signal: {
    symbol: string;
    action: 'LONG' | 'SHORT' | 'NEUTRAL';
    confidence: number;
    entry: number;
    stopLoss: number;
    takeProfit: number;
  }): Promise<void> {
    const message = `
📈 <b>New Trading Signal</b>
Symbol: ${signal.symbol}
Action: ${signal.action}
Confidence: ${(signal.confidence * 100).toFixed(2)}%
Entry: ${signal.entry}
Stop Loss: ${signal.stopLoss}
Take Profit: ${signal.takeProfit}
    `.trim();

    await Promise.all([
      this.sendTelegramMessage(message),
      this.sendDiscordMessage(message.replace(/<b>|<\/b>/g, '**'))
    ]);
  }

  async notifyBotStarted(): Promise<void> {
    console.log('Bot started');
  }

  async notifyBotStopped(): Promise<void> {
    console.log('Bot stopped');
  }

  async sendNotification(title: string, data: any): Promise<void> {
    console.log(title, data);
  }
} 