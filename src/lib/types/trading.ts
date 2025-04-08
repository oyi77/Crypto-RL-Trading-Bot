export interface TradingSignal {
  pair: string;
  time: string;
  exchange: string;
  leverage: number;
  capital: number;
  bias: {
    status: "LONG" | "SHORT" | "NEUTRAL";
    entry: number;
    stopLoss: number;
    takeProfit: number;
  };
  technicalAnalysis: {
    emaStatus: string;
    macd: string;
    rsi: string;
    candlestickPattern: string;
    volumeInsight: string;
    supportResistance: string;
  };
  explanation: string;
  chartLink: string;
}

export type TradingPair = "BTCUSDT" | "ETHUSDT" | "BNBUSDT" | "SOLUSDT" | "ADAUSDT" | string;
